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
# Serve React build (if exists) from frontend-react/dist
react_build_path = Path(__file__).parent.parent.parent / 'frontend-react' / 'dist'

app = Flask(
    __name__,
    template_folder='../../frontend/templates',
    static_folder=str(react_build_path) if react_build_path.exists() else '../../frontend/static',
    static_url_path=''
)

# CORS: allow React dev server on port 3000
CORS(app, origins=['http://localhost:3000', 'http://127.0.0.1:3000', '*'])

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
            'confidence': float(confidence * 100),  # Convert to percentage
            'real_prob': float(probabilities[0][0].item() * 100),  # Convert to percentage
            'fake_prob': float(probabilities[0][1].item() * 100),  # Convert to percentage
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


# ──── API Routes ────

@app.route('/login', methods=['POST'])
def login():
    """
    Handle user login (API-only: POST).
    React frontend sends { username, password } as JSON.
    Returns { success: bool, message: str }.
    """
    data = request.get_json()
    username = data.get('username', '') if data else ''
    password = data.get('password', '') if data else ''

    # In production, validate credentials against database
    # For now, accept any non-empty credentials
    if username and password:
        logger.info(f"Login successful for user: {username}")
        return jsonify({
            'success': True,
            'message': 'Login successful',
            'user': username
        })
    else:
        return jsonify({
            'success': False,
            'message': 'Username and password are required'
        }), 400


@app.route('/old')
def old_index():
    """Render original HTML template pages (legacy)."""
    return render_template('index.html')


@app.route('/old/login')
def old_login():
    """Render old login template (legacy)."""
    return render_template('login.html')


@app.route('/old/app')
def old_app():
    """Render old app template (legacy)."""
    return render_template('app.html')


# ──── Catch-all: serve React SPA for client-side routes ────
@app.route('/', defaults={'path': ''})
@app.route('/<path:path>')
def serve_react(path):
    """
    Serve the React SPA.
    - If the path matches a static file in the build folder, serve it.
    - Otherwise serve index.html so React Router can handle the route.
    - Falls back to old templates if React build doesn't exist.
    
    In development, Vite dev server (port 3000) proxies /api/* and /login
    to this Flask server (port 5000), so this catch-all is only active
    when running the production build.
    """
    react_dist = Path(app.static_folder)
    file_path = react_dist / path

    if path and file_path.exists() and file_path.is_file():
        return send_from_directory(str(react_dist), path)

    index_file = react_dist / 'index.html'
    if index_file.exists():
        return send_from_directory(str(react_dist), 'index.html')

    # Fallback to old templates if React build doesn't exist
    return render_template('landing.html')


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
