# API Integration Guide

This guide explains how to integrate the Deepfake Detection API into your application or social media platform.

## Base URL

```
http://localhost:5000/api
```

For production, replace with your deployed API endpoint.

## Authentication

Currently, the API does not require authentication. For production deployment, you should:
1. Enable API key authentication in `configs/api_config.yaml`
2. Set `api_key_required: true`
3. Include API key in requests: `X-API-Key: your_api_key_here`

## Endpoints

### 1. Health Check

Check if the API is running and the model is loaded.

**Request:**
```bash
GET /api/health
```

**Response:**
```json
{
  "status": "healthy",
  "model_loaded": true,
  "device": "cuda"
}
```

---

### 2. Detect Deepfake in Image

Analyze a single image for deepfake detection.

**Request:**
```bash
POST /api/detect/image
Content-Type: multipart/form-data

image: [binary image file]
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
formData.append('image', imageFile);

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

**Response:**
```json
{
  "success": true,
  "prediction": "Fake",
  "confidence": 0.8734,
  "probabilities": {
    "real": 0.1266,
    "fake": 0.8734
  },
  "processing_time": 0.234,
  "model_info": {
    "architecture": "efficientnet_b0",
    "version": "1.0"
  }
}
```

**Error Response:**
```json
{
  "success": false,
  "error": "Invalid file format. Allowed: jpg, jpeg, png, webp"
}
```

---

### 3. Batch Detection

Analyze multiple images in a single request.

**Request:**
```bash
POST /api/detect/batch
Content-Type: multipart/form-data

images: [multiple binary image files]
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
    ("images", open("image1.jpg", "rb")),
    ("images", open("image2.jpg", "rb")),
    ("images", open("image3.jpg", "rb"))
]

response = requests.post(url, files=files)
results = response.json()

for result in results['results']:
    print(f"{result['filename']}: {result['prediction']} ({result['confidence']:.2%})")
```

**Response:**
```json
{
  "success": true,
  "results": [
    {
      "success": true,
      "filename": "image1.jpg",
      "index": 0,
      "prediction": "Real",
      "confidence": 0.9123,
      "probabilities": {
        "real": 0.9123,
        "fake": 0.0877
      }
    },
    {
      "success": true,
      "filename": "image2.jpg",
      "index": 1,
      "prediction": "Fake",
      "confidence": 0.7891,
      "probabilities": {
        "real": 0.2109,
        "fake": 0.7891
      }
    }
  ],
  "total_images": 2
}
```

---

### 4. API Information

Get information about the API capabilities.

**Request:**
```bash
GET /api/info
```

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

### 5. Statistics

Get API usage statistics (requires database integration in production).

**Request:**
```bash
GET /api/stats
```

**Response:**
```json
{
  "total_predictions": 1523,
  "fake_detected": 834,
  "real_detected": 689,
  "average_confidence": 0.8567
}
```

---

## Integration Examples

### Social Media Platform Integration

#### 1. Pre-Upload Validation

Check images before users post them:

```python
def validate_image_before_post(image_path):
    """Validate image before allowing post."""
    import requests
    
    api_url = "http://your-api-endpoint/api/detect/image"
    
    with open(image_path, 'rb') as img:
        files = {'image': img}
        response = requests.post(api_url, files=files)
    
    result = response.json()
    
    if result['success']:
        if result['prediction'] == 'Fake' and result['confidence'] > 0.7:
            return False, "This image appears to be AI-generated or manipulated."
        return True, "Image validated."
    
    return False, "Validation failed."

# Usage
is_valid, message = validate_image_before_post("user_upload.jpg")
if is_valid:
    # Allow post
    post_image()
else:
    # Show warning to user
    show_warning(message)
```

#### 2. Real-Time Monitoring

Monitor uploaded content in real-time:

```python
import asyncio
import aiohttp

async def monitor_uploads(image_queue):
    """Monitor and analyze uploaded images."""
    async with aiohttp.ClientSession() as session:
        while True:
            image_data = await image_queue.get()
            
            form = aiohttp.FormData()
            form.add_field('image', image_data, filename='upload.jpg')
            
            async with session.post(
                'http://your-api-endpoint/api/detect/image',
                data=form
            ) as response:
                result = await response.json()
                
                if result['prediction'] == 'Fake':
                    # Flag content for review
                    flag_for_review(result)
                
            image_queue.task_done()
```

#### 3. Batch Processing

Process multiple images efficiently:

```python
def batch_process_images(image_paths):
    """Process multiple images in batch."""
    import requests
    
    files = [
        ('images', open(path, 'rb'))
        for path in image_paths
    ]
    
    response = requests.post(
        'http://your-api-endpoint/api/detect/batch',
        files=files
    )
    
    results = response.json()
    
    # Close file handles
    for _, file_obj in files:
        file_obj.close()
    
    return results

# Usage
results = batch_process_images(['img1.jpg', 'img2.jpg', 'img3.jpg'])
for result in results['results']:
    if result['prediction'] == 'Fake':
        print(f"Flagged: {result['filename']}")
```

---

## Rate Limiting

The API implements rate limiting (configurable in `configs/api_config.yaml`):
- Default: 60 requests per minute
- 1000 requests per hour

If you exceed the limit, you'll receive a `429 Too Many Requests` response.

---

## Best Practices

1. **Confidence Thresholds**: 
   - Use confidence scores to determine actions
   - Higher confidence (>0.8) = more certain
   - Consider human review for medium confidence (0.5-0.8)

2. **Error Handling**:
   ```python
   try:
       response = requests.post(api_url, files=files, timeout=10)
       response.raise_for_status()
       result = response.json()
   except requests.exceptions.Timeout:
       # Handle timeout
       pass
   except requests.exceptions.RequestException as e:
       # Handle other errors
       pass
   ```

3. **Asynchronous Processing**:
   - For high-volume applications, use async/await
   - Queue images for processing
   - Don't block user interactions

4. **Caching**:
   - Cache results for identical images (hash-based)
   - Reduce redundant API calls

5. **Monitoring**:
   - Track API response times
   - Monitor error rates
   - Alert on anomalies

---

## Deployment

### Docker Deployment

```dockerfile
FROM python:3.9-slim

WORKDIR /app

COPY requirements.txt .
RUN pip install -r requirements.txt

COPY . .

EXPOSE 5000

CMD ["python", "src/api/app.py"]
```

Build and run:
```bash
docker build -t deepfake-detector .
docker run -p 5000:5000 deepfake-detector
```

### Production Considerations

1. Use a production WSGI server (Gunicorn, uWSGI)
2. Set up HTTPS/SSL
3. Enable API key authentication
4. Implement proper logging
5. Set up monitoring and alerts
6. Use a load balancer for high traffic
7. Consider GPU acceleration for faster inference

---

## Support

For issues or questions:
- GitHub Issues: [repository-url]
- Email: your-email@example.com
- Documentation: [docs-url]
