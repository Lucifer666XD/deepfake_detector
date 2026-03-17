# Deepfake Detection API Documentation

## Overview

The Deepfake Detection API provides AI-powered analysis to detect manipulated or AI-generated images. Built with Flask and PyTorch, it offers both a web interface and RESTful API endpoints.

## Quick Start

### 1. Install Dependencies

```bash
# Activate virtual environment
.\venv\Scripts\Activate.ps1  # Windows
# or
source venv/bin/activate  # Linux/Mac

# Install requirements
pip install -r requirements.txt
```

### 2. Start the API Server

```bash
# Simple method
python run_api.py

# Or directly
python -m src.api.app
```

The API will be available at `http://localhost:5000`

### 3. Access the Web Interface

Open your browser and navigate to:
```
http://localhost:5000
```

---

## API Endpoints

### 🏥 Health Check

Check if the API is running and the model is loaded.

**Endpoint:** `GET /api/health`

**Response:**
```json
{
  "status": "healthy",
  "model_loaded": true,
  "device": "cuda"
}
```

**Example:**
```bash
curl http://localhost:5000/api/health
```

---

### 📷 Single Image Detection

Analyze a single image for deepfake detection.

**Endpoint:** `POST /api/detect/image`

**Content-Type:** `multipart/form-data`

**Parameters:**
- `image` (file, required): Image file to analyze

**Supported Formats:** JPG, JPEG, PNG, WEBP

**Max Size:** 10MB

**Response:**
```json
{
  "success": true,
  "prediction": "Fake",
  "confidence": 0.9234,
  "probabilities": {
    "real": 0.0766,
    "fake": 0.9234
  },
  "processing_time": 0.345,
  "model_info": {
    "architecture": "efficientnet_b0",
    "version": "1.0"
  }
}
```

**Example (cURL):**
```bash
curl -X POST http://localhost:5000/api/detect/image \
  -F "image=@path/to/your/image.jpg"
```

**Example (Python):**
```python
import requests

url = "http://localhost:5000/api/detect/image"
files = {"image": open("image.jpg", "rb")}
response = requests.post(url, files=files)
result = response.json()

print(f"Prediction: {result['prediction']}")
print(f"Confidence: {result['confidence']:.2%}")
```

**Example (JavaScript):**
```javascript
const formData = new FormData();
formData.append('image', fileInput.files[0]);

fetch('http://localhost:5000/api/detect/image', {
  method: 'POST',
  body: formData
})
.then(response => response.json())
.then(data => {
  console.log('Prediction:', data.prediction);
  console.log('Confidence:', data.confidence);
})
.catch(error => console.error('Error:', error));
```

---

### 📚 Batch Image Detection

Analyze multiple images at once.

**Endpoint:** `POST /api/detect/batch`

**Content-Type:** `multipart/form-data`

**Parameters:**
- `images` (files, required): Multiple image files

**Response:**
```json
{
  "success": true,
  "total_images": 3,
  "results": [
    {
      "success": true,
      "filename": "image1.jpg",
      "index": 0,
      "prediction": "Real",
      "confidence": 0.8765,
      "probabilities": {
        "real": 0.8765,
        "fake": 0.1235
      },
      "processing_time": 0.234
    },
    {
      "success": true,
      "filename": "image2.jpg",
      "index": 1,
      "prediction": "Fake",
      "confidence": 0.9456,
      "probabilities": {
        "real": 0.0544,
        "fake": 0.9456
      },
      "processing_time": 0.245
    }
  ]
}
```

**Example (cURL):**
```bash
curl -X POST http://localhost:5000/api/detect/batch \
  -F "images=@image1.jpg" \
  -F "images=@image2.jpg" \
  -F "images=@image3.jpg"
```

**Example (Python):**
```python
import requests

url = "http://localhost:5000/api/detect/batch"
files = [
    ('images', open('image1.jpg', 'rb')),
    ('images', open('image2.jpg', 'rb')),
    ('images', open('image3.jpg', 'rb'))
]
response = requests.post(url, files=files)
results = response.json()

for result in results['results']:
    print(f"{result['filename']}: {result['prediction']} ({result['confidence']:.2%})")
```

---

### ℹ️ API Information

Get API metadata and available endpoints.

**Endpoint:** `GET /api/info`

**Response:**
```json
{
  "version": "v1",
  "title": "Deepfake Detection API",
  "description": "API for detecting AI-generated and manipulated media",
  "supported_formats": {
    "images": ["jpg", "jpeg", "png", "webp"],
    "audio": ["mp3", "wav", "ogg", "flac"]
  },
  "max_upload_size": 10485760,
  "endpoints": {
    "image_detection": "/api/detect/image",
    "batch_detection": "/api/detect/batch",
    "health": "/api/health",
    "stats": "/api/stats"
  }
}
```

---

### 📊 Statistics

Get API usage statistics (placeholder endpoint).

**Endpoint:** `GET /api/stats`

**Response:**
```json
{
  "total_predictions": 0,
  "fake_detected": 0,
  "real_detected": 0,
  "average_confidence": 0.0
}
```

---

## Configuration

Configuration is managed through `configs/api_config.yaml`:

```yaml
# Server Settings
server:
  host: "0.0.0.0"
  port: 5000
  debug: true

# Model Settings
model:
  image_model_path: "data/models/checkpoints/best_checkpoint.pth"
  device: "cuda"  # or "cpu"

# API Settings
api:
  max_upload_size: 10485760  # 10MB
  allowed_image_formats:
    - "jpg"
    - "jpeg"
    - "png"
    - "webp"
```

---

## Error Handling

All endpoints return consistent error responses:

```json
{
  "success": false,
  "error": "Error description"
}
```

**Common HTTP Status Codes:**
- `200` - Success
- `400` - Bad Request (invalid input)
- `500` - Internal Server Error

---

## Response Fields

### Detection Response

| Field | Type | Description |
|-------|------|-------------|
| `success` | boolean | Whether the request succeeded |
| `prediction` | string | "Real" or "Fake" |
| `confidence` | float | Confidence score (0-1) |
| `probabilities.real` | float | Probability of being real (0-1) |
| `probabilities.fake` | float | Probability of being fake (0-1) |
| `processing_time` | float | Processing time in seconds |
| `model_info.architecture` | string | Model architecture used |
| `model_info.version` | string | Model version |

---

## Testing the API

### 1. Using cURL

```bash
# Health check
curl http://localhost:5000/api/health

# Detect image
curl -X POST http://localhost:5000/api/detect/image \
  -F "image=@test_image.jpg"

# Get API info
curl http://localhost:5000/api/info
```

### 2. Using Postman

1. Create a new POST request to `http://localhost:5000/api/detect/image`
2. Go to Body > form-data
3. Add key `image` with type `File`
4. Select an image file
5. Send the request

### 3. Using Python

```python
import requests

# Test health
response = requests.get('http://localhost:5000/api/health')
print(response.json())

# Test detection
with open('image.jpg', 'rb') as f:
    files = {'image': f}
    response = requests.post('http://localhost:5000/api/detect/image', files=files)
    result = response.json()
    
    if result['success']:
        print(f"Prediction: {result['prediction']}")
        print(f"Confidence: {result['confidence']:.2%}")
    else:
        print(f"Error: {result['error']}")
```

---

## Production Deployment

### Using Gunicorn (Recommended)

```bash
# Install gunicorn
pip install gunicorn

# Run with multiple workers
gunicorn -w 4 -b 0.0.0.0:5000 "src.api.app:app"
```

### Using Docker

```dockerfile
FROM python:3.9-slim

WORKDIR /app
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

COPY . .

CMD ["python", "run_api.py"]
```

Build and run:
```bash
docker build -t deepfake-api .
docker run -p 5000:5000 deepfake-api
```

---

## Performance Tips

1. **Use GPU**: Set `model.device: "cuda"` in config for faster inference
2. **Batch Processing**: Use `/api/detect/batch` for multiple images
3. **Image Size**: Smaller images process faster (recommended: 224x224 to 512x512)
4. **Workers**: Use multiple workers in production with Gunicorn

---

## Troubleshooting

### Model Not Found

**Error:** `Model checkpoint not found`

**Solution:**
- Train a model first: `python -m src.models.train`
- Or use pretrained weights in `data/models/checkpoints/`

### CUDA Out of Memory

**Error:** `RuntimeError: CUDA out of memory`

**Solutions:**
- Set `device: "cpu"` in config
- Reduce batch size
- Use smaller images

### Import Errors

**Error:** `ModuleNotFoundError`

**Solutions:**
```bash
# Ensure you're in the project root
cd e:\AAH SHIT HERE WE GO AGAIN\Cyber\deepfake-detector

# Reinstall dependencies
pip install -r requirements.txt
```

---

## Support

For issues and questions:
- Check logs in `logs/api.log`
- Review configuration in `configs/api_config.yaml`
- Ensure all dependencies are installed

---

## License

MIT License - See LICENSE file for details
