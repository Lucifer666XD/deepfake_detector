# 🚀 API Quick Start Guide

## Complete Steps to Set Up and Run the Deepfake Detection API

### Step 1: Verify Installation

Make sure you're in the project directory and have your virtual environment activated:

```powershell
# Navigate to project
cd "e:\AAH SHIT HERE WE GO AGAIN\Cyber\deepfake-detector"

# Activate virtual environment
.\venv\Scripts\Activate.ps1
```

### Step 2: Install Dependencies

Install all required packages:

```powershell
pip install -r requirements.txt
```

**Key packages installed:**
- Flask (Web framework)
- Flask-CORS (Cross-origin requests)
- PyTorch & torchvision (Deep learning)
- Pillow (Image processing)
- PyYAML (Configuration)
- Werkzeug (File upload security)
- Gunicorn (Production server)

### Step 3: Verify Model File

Check if you have a trained model:

```powershell
# Check if model exists
Test-Path "data\models\checkpoints\best_checkpoint.pth"
```

**If model doesn't exist:**
- Option A: Train a model first (see training guide)
- Option B: The API will work with random weights (demo mode)

### Step 4: Configure the API (Optional)

Review and customize settings in `configs/api_config.yaml`:

```yaml
server:
  host: "0.0.0.0"  # Accept connections from anywhere
  port: 5000       # API port
  debug: true      # Enable debug mode

model:
  image_model_path: "data/models/checkpoints/best_checkpoint.pth"
  device: "cuda"   # Change to "cpu" if no GPU
```

### Step 5: Start the API Server

Run the API server:

```powershell
python run_api.py
```

**You should see:**
```
============================================================
🚀 Starting Deepfake Detection API
============================================================

ℹ️  API will be available at: http://localhost:5000
📚 API Documentation: http://localhost:5000/api/info
🏥 Health Check: http://localhost:5000/api/health

⏹️  Press CTRL+C to stop the server
============================================================

INFO - Loading model from: data/models/checkpoints/best_checkpoint.pth
INFO - Using device: cuda
INFO - Model loaded successfully
INFO - Starting API server on 0.0.0.0:5000
 * Running on http://0.0.0.0:5000
```

### Step 6: Access the Web Interface

Open your browser and go to:

```
http://localhost:5000
```

You'll see a nice web interface where you can:
- Upload images by dragging & dropping
- Click to browse and select images
- View analysis results with confidence scores
- See detailed probability breakdowns

### Step 7: Test the API

#### Option A: Using the Web Interface
1. Open `http://localhost:5000` in your browser
2. Click "Browse Files" or drag an image
3. Click "Analyze Image"
4. View results

#### Option B: Using Command Line (cURL)

Open a **new PowerShell window** and run:

```powershell
# Test health check
curl http://localhost:5000/api/health

# Test image detection (replace with your image path)
curl -X POST http://localhost:5000/api/detect/image `
  -F "image=@path\to\your\image.jpg"
```

#### Option C: Using Python Test Script

Open a **new PowerShell window** and run:

```powershell
# Make sure virtual environment is activated
.\venv\Scripts\Activate.ps1

# Run test script
python test_api.py
```

This will automatically test all API endpoints!

### Step 8: Test with Python Code

Create a test file `test_detection.py`:

```python
import requests

# Test single image
url = "http://localhost:5000/api/detect/image"
image_path = "path/to/your/image.jpg"

with open(image_path, 'rb') as f:
    files = {'image': f}
    response = requests.post(url, files=files)
    result = response.json()

if result['success']:
    print(f"Prediction: {result['prediction']}")
    print(f"Confidence: {result['confidence']:.2%}")
    print(f"Real probability: {result['probabilities']['real']:.2%}")
    print(f"Fake probability: {result['probabilities']['fake']:.2%}")
else:
    print(f"Error: {result['error']}")
```

Run it:
```powershell
python test_detection.py
```

---

## 🎯 Available Endpoints

| Endpoint | Method | Description |
|----------|--------|-------------|
| `/` | GET | Web interface |
| `/api/health` | GET | Health check |
| `/api/detect/image` | POST | Detect single image |
| `/api/detect/batch` | POST| Detect multiple images |
| `/api/info` | GET | API information |
| `/api/stats` | GET | Usage statistics |

---

## 📝 Example API Calls

### 1. Health Check
```bash
curl http://localhost:5000/api/health
```

**Response:**
```json
{
  "status": "healthy",
  "model_loaded": true,
  "device": "cuda"
}
```

### 2. Detect Single Image
```bash
curl -X POST http://localhost:5000/api/detect/image \
  -F "image=@test_image.jpg"
```

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

### 3. Batch Detection
```bash
curl -X POST http://localhost:5000/api/detect/batch \
  -F "images=@image1.jpg" \
  -F "images=@image2.jpg"
```

### 4. Get API Info
```bash
curl http://localhost:5000/api/info
```

---

## 🔧 Troubleshooting

### API won't start

**Problem:** Port 5000 already in use

**Solution:**
```yaml
# Edit configs/api_config.yaml
server:
  port: 8000  # Change to different port
```

### CUDA errors

**Problem:** `CUDA out of memory` or `CUDA not available`

**Solution:**
```yaml
# Edit configs/api_config.yaml
model:
  device: "cpu"  # Use CPU instead
```

### Import errors

**Problem:** `ModuleNotFoundError`

**Solution:**
```powershell
# Reinstall dependencies
pip install -r requirements.txt

# Make sure you're in project root
cd "e:\AAH SHIT HERE WE GO AGAIN\Cyber\deepfake-detector"
```

### Model not found

**Problem:** `Model checkpoint not found`

**This is OK for testing!** The API will work with random weights.

**To use a trained model:**
1. Train a model first: `python -m src.models.train`
2. The checkpoint will be saved to `data/models/checkpoints/`

---

## 🌐 Production Deployment

### Using Gunicorn (Linux/Mac)
```bash
gunicorn -w 4 -b 0.0.0.0:5000 "src.api.app:app"
```

### Using Waitress (Windows)
```powershell
pip install waitress
waitress-serve --host=0.0.0.0 --port=5000 src.api.app:app
```

---

## 📚 Next Steps

✅ **API is running!** Here's what you can do:

1. **Test the web interface:** http://localhost:5000
2. **Read full API docs:** `docs/api_documentation.md`
3. **Train a model:** See `docs/quickstart.md`
4. **Integrate with your app:** Use the REST API endpoints
5. **Deploy to production:** See production deployment guide

---

## 🛑 Stopping the API

Press `CTRL+C` in the terminal where the API is running.

---

## 📞 Need Help?

- Check logs: `logs/api.log`
- Review config: `configs/api_config.yaml`
- Full documentation: `docs/api_documentation.md`
- Test script: `python test_api.py`

---

**Happy Detecting! 🎉**
