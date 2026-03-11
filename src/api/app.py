"""
REST API for deepfake detection.
"""

from flask import Flask, request, jsonify, render_template, send_from_directory
from flask_cors import CORS
from werkzeug.utils import secure_filename
import torch
from PIL import Image
import io
import os
import time
from pathlib import Path
import sys
import tempfile

# Add parent directory to path
sys.path.append(str(Path(__file__).parent.parent.parent))

from src.models.model import create_model
from src.preprocessing.data_loader import preprocess_image_for_inference
from src.utils.config import load_api_config
from src.utils.logger import get_logger

# Initialize Flask app
app = Flask(
    __name__,
    template_folder='../../frontend/templates',
    static_folder='../../frontend/static'
)
CORS(app)

# Load configuration
config = load_api_config()
logger = get_logger('api')

# Global variables for model
model = None
device = None


def load_model():
    """Load the trained model."""
    global model, device
    
    model_path = config.get('model.image_model_path')
    device_config = config.get('model.device')
    
    # Setup device
    device = torch.device(
        'cuda' if torch.cuda.is_available() and device_config == 'cuda'
        else 'cpu'
    )
    
    logger.info(f"Loading model from: {model_path}")
    logger.info(f"Using device: {device}")
    
    try:
        # Create model architecture
        model = create_model(
            architecture='efficientnet_b0',
            num_classes=2,
            pretrained=False
        )
        
        # Load weights if checkpoint exists
        if os.path.exists(model_path):
            checkpoint = torch.load(model_path, map_location=device)
            if 'model_state_dict' in checkpoint:
                model.load_state_dict(checkpoint['model_state_dict'])
            else:
                model.load_state_dict(checkpoint)
            logger.info("Model weights loaded successfully")
        else:
            logger.warning(f"Model checkpoint not found at {model_path}. Using random weights.")
        
        model = model.to(device)
        model.eval()
        
        logger.info("Model loaded successfully")
    except Exception as e:
        logger.error(f"Error loading model: {e}")
        # Create a dummy model for testing
        model = create_model(architecture='efficientnet_b0', num_classes=2)
        model = model.to(device)
        model.eval()


def predict_image(image_data):
    """
    Predict if an image is fake or real.
    
    Args:
        image_data: PIL Image or image bytes
        
    Returns:
        Dictionary with prediction results
    """
    start_time = time.time()
    
    try:
        # Convert bytes to PIL Image if needed
        if isinstance(image_data, bytes):
            image = Image.open(io.BytesIO(image_data)).convert('RGB')
        else:
            image = image_data.convert('RGB')
        
        with tempfile.NamedTemporaryFile(suffix='.jpg', delete=False) as tmp_file:
            temp_path = tmp_file.name
            image.save(temp_path)
        
        # Preprocess image
        image_tensor = preprocess_image_for_inference(temp_path)
        image_tensor = image_tensor.to(device)
        
        # Make prediction
        with torch.no_grad():
            outputs = model(image_tensor)
            probabilities = torch.softmax(outputs, dim=1)
            
            # Get prediction
            pred_class = torch.argmax(probabilities, dim=1).item()
            confidence = probabilities[0][pred_class].item()
            
            # Class mapping
            class_names = {0: 'Real', 1: 'Fake'}
            prediction = class_names[pred_class]
        
        processing_time = time.time() - start_time
        
        result = {
            'success': True,
            'prediction': prediction,
            'confidence': float(confidence),
            'probabilities': {
                'real': float(probabilities[0][0].item()),
                'fake': float(probabilities[0][1].item())
            },
            'processing_time': float(processing_time),
            'model_info': {
                'architecture': 'efficientnet_b0',
                'version': '1.0'
            }
        }
        
        # Clean up
        if os.path.exists(temp_path):
            os.remove(temp_path)
        
        return result
    
    except Exception as e:
        logger.error(f"Prediction error: {e}")
        return {
            'success': False,
            'error': str(e)
        }


# Routes
@app.route('/')
def index():
    """Render main page."""
    return render_template('index.html')


@app.route('/api/health', methods=['GET'])
def health_check():
    """Health check endpoint."""
    return jsonify({
        'status': 'healthy',
        'model_loaded': model is not None,
        'device': str(device) if device else 'unknown'
    })


@app.route('/api/detect/image', methods=['POST'])
def detect_image():
    """
    Detect deepfake in uploaded image.
    
    Expected: multipart/form-data with 'image' field
    """
    try:
        # Check if image file is present
        if 'image' not in request.files:
            return jsonify({
                'success': False,
                'error': 'No image file provided'
            }), 400
        
        file = request.files['image']
        
        # Check if file is empty
        if file.filename == '':
            return jsonify({
                'success': False,
                'error': 'Empty filename'
            }), 400
        
        # Validate file format
        allowed_formats = config.get('api.allowed_image_formats')
        file_ext = file.filename.rsplit('.', 1)[1].lower() if '.' in file.filename else ''
        
        if file_ext not in allowed_formats:
            return jsonify({
                'success': False,
                'error': f'Invalid file format. Allowed: {", ".join(allowed_formats)}'
            }), 400
        
        # Read image
        image_bytes = file.read()
        
        # Make prediction
        result = predict_image(image_bytes)
        
        if result['success']:
            logger.info(
                f"Prediction: {result['prediction']} "
                f"(confidence: {result['confidence']:.2%})"
            )
            return jsonify(result), 200
        else:
            return jsonify(result), 500
    
    except Exception as e:
        logger.error(f"Error in detect_image endpoint: {e}")
        return jsonify({
            'success': False,
            'error': str(e)
        }), 500


@app.route('/api/detect/batch', methods=['POST'])
def detect_batch():
    """
    Detect deepfakes in multiple images.
    
    Expected: multipart/form-data with multiple 'images' fields
    """
    try:
        files = request.files.getlist('images')
        
        if not files:
            return jsonify({
                'success': False,
                'error': 'No images provided'
            }), 400
        
        results = []
        for i, file in enumerate(files):
            if file.filename:
                image_bytes = file.read()
                result = predict_image(image_bytes)
                result['filename'] = file.filename
                result['index'] = i
                results.append(result)
        
        return jsonify({
            'success': True,
            'results': results,
            'total_images': len(results)
        }), 200
    
    except Exception as e:
        logger.error(f"Error in batch detection: {e}")
        return jsonify({
            'success': False,
            'error': str(e)
        }), 500


@app.route('/api/stats', methods=['GET'])
def get_stats():
    """Get API statistics."""
    # In production, this would query a database
    return jsonify({
        'total_predictions': 0,
        'fake_detected': 0,
        'real_detected': 0,
        'average_confidence': 0.0
    })


@app.route('/api/info', methods=['GET'])
def get_info():
    """Get API information."""
    return jsonify({
        'version': config.get('api.version'),
        'title': config.get('api.title'),
        'description': config.get('api.description'),
        'supported_formats': {
            'images': config.get('api.allowed_image_formats'),
            'audio': config.get('api.allowed_audio_formats')
        },
        'max_upload_size': config.get('api.max_upload_size'),
        'endpoints': {
            'image_detection': '/api/detect/image',
            'batch_detection': '/api/detect/batch',
            'health': '/api/health',
            'stats': '/api/stats'
        }
    })


def main():
    """Run the API server."""
    # Load model
    load_model()
    
    # Get server configuration
    host = config.get('server.host')
    port = config.get('server.port')
    debug = config.get('server.debug')
    
    logger.info(f"Starting API server on {host}:{port}")
    
    # Run app
    app.run(
        host=host,
        port=port,
        debug=debug
    )


if __name__ == '__main__':
    main()
