# Quick Start Guide

Get up and running with the Deepfake Detection System in minutes!

## Prerequisites

- Python 3.8 or higher
- pip package manager
- (Optional) CUDA-capable GPU for faster training
- (Recommended) 8GB+ RAM

## Installation Steps

### 1. Clone the Repository

```bash
git clone <your-repository-url>
cd deepfake-detector
```

### 2. Create Virtual Environment

```bash
# Create virtual environment
python -m venv venv

# Activate it
# On Linux/Mac:
source venv/bin/activate

# On Windows:
venv\Scripts\activate
```

### 3. Install Dependencies

```bash
pip install --upgrade pip
pip install -r requirements.txt
```

This will install all necessary packages including PyTorch, Flask, and image processing libraries.

### 4. Verify Installation

```bash
python -c "import torch; print(f'PyTorch: {torch.__version__}'); print(f'CUDA Available: {torch.cuda.is_available()}')"
```

Expected output:
```
PyTorch: 2.0.1
CUDA Available: True  # Or False if no GPU
```

## Testing the API (Without Training)

You can test the API immediately with a pre-initialized model (using random weights):

### 1. Start the API Server

```bash
python src/api/app.py
```

You should see:
```
Loading model from: data/models/image_detector_best.pth
Model checkpoint not found. Using random weights.
Model loaded successfully
Starting API server on 0.0.0.0:5000
```

### 2. Open the Web Interface

Open your browser and navigate to:
```
http://localhost:5000
```

### 3. Test with an Image

- Click "Browse Files" or drag and drop an image
- Click "Analyze Image"
- View the results (note: results will be random since model isn't trained yet)

## Training Your Model

To train the model on actual data:

### 1. Prepare Dataset

Follow the [Dataset Preparation Guide](dataset_preparation.md) to download and organize datasets.

Quick option for testing:
```bash
# Create dummy dataset structure
mkdir -p data/processed/{train,val,test}/{real,fake}

# You would place your images here:
# data/processed/train/real/ - real images
# data/processed/train/fake/ - fake/AI-generated images
# Same for val/ and test/
```

### 2. Configure Training

Edit `configs/train_config.yaml` if needed:
```yaml
data:
  processed_path: "data/processed"
  batch_size: 32
  image_size: 224

model:
  architecture: "efficientnet_b0"
  
training:
  epochs: 50
  learning_rate: 0.001
```

### 3. Start Training

```bash
python src/models/train.py
```

Monitor training progress in the console and logs.

### 4. Use Trained Model

Once training is complete, the best model is saved to:
```
data/models/checkpoints/best_checkpoint.pth
```

Update `configs/api_config.yaml` to use this model:
```yaml
model:
  image_model_path: "data/models/checkpoints/best_checkpoint.pth"
```

Restart the API server to use the trained model.

## Quick API Testing

### Using cURL

```bash
# Test health endpoint
curl http://localhost:5000/api/health

# Test image detection
curl -X POST http://localhost:5000/api/detect/image \
  -F "image=@test_image.jpg"
```

### Using Python

```python
import requests

# Detect deepfake
url = "http://localhost:5000/api/detect/image"
files = {"image": open("test_image.jpg", "rb")}

response = requests.post(url, files=files)
result = response.json()

print(f"Prediction: {result['prediction']}")
print(f"Confidence: {result['confidence']:.2%}")
```

### Using JavaScript/Node.js

```javascript
const FormData = require('form-data');
const fs = require('fs');
const axios = require('axios');

const form = new FormData();
form.append('image', fs.createReadStream('test_image.jpg'));

axios.post('http://localhost:5000/api/detect/image', form, {
  headers: form.getHeaders()
})
.then(response => {
  console.log('Prediction:', response.data.prediction);
  console.log('Confidence:', response.data.confidence);
})
.catch(error => console.error('Error:', error));
```

## Project Structure Overview

```
deepfake-detector/
│
├── src/
│   ├── models/          # Model architecture and training
│   │   ├── model.py     # Model definitions
│   │   └── train.py     # Training script
│   │
│   ├── api/             # REST API
│   │   └── app.py       # Flask application
│   │
│   ├── preprocessing/   # Data preprocessing
│   │   └── data_loader.py
│   │
│   └── utils/           # Utilities
│       ├── config.py    # Configuration loader
│       └── logger.py    # Logging utilities
│
├── frontend/            # Web UI
│   ├── static/          # CSS, JS, images
│   └── templates/       # HTML templates
│
├── configs/             # Configuration files
│   ├── train_config.yaml
│   └── api_config.yaml
│
├── data/                # Data directory
│   ├── raw/             # Raw datasets
│   ├── processed/       # Processed datasets
│   └── models/          # Saved models
│
└── docs/                # Documentation
```

## Common Issues and Solutions

### Issue: "CUDA out of memory"
**Solution**: Reduce batch size in `configs/train_config.yaml`:
```yaml
data:
  batch_size: 16  # or 8
```

### Issue: "Model file not found"
**Solution**: Train the model first or update the path in `configs/api_config.yaml`

### Issue: "Module not found"
**Solution**: Make sure virtual environment is activated and dependencies are installed:
```bash
source venv/bin/activate
pip install -r requirements.txt
```

### Issue: Port 5000 already in use
**Solution**: Change port in `configs/api_config.yaml`:
```yaml
server:
  port: 8080  # or any available port
```

Then access at `http://localhost:8080`

## Next Steps

1. **Collect Data**: Follow [Dataset Preparation Guide](dataset_preparation.md)
2. **Train Model**: Run training with your dataset
3. **Integrate**: Use [API Integration Guide](integration_guide.md)
4. **Deploy**: Set up production deployment
5. **Monitor**: Track performance and improve model

## Resources

- **Dataset Preparation**: [docs/dataset_preparation.md](dataset_preparation.md)
- **API Integration**: [docs/integration_guide.md](integration_guide.md)
- **Configuration**: Check `configs/` directory
- **Notebooks**: Explore `notebooks/` for experiments

## Getting Help

- Check documentation in `docs/` folder
- Review configuration files in `configs/`
- Check logs in `logs/` directory
- Open GitHub issues for bugs

## Development Workflow

1. **Experiment**: Use Jupyter notebooks in `notebooks/`
2. **Develop**: Write code in `src/`
3. **Test**: Run tests in `tests/`
4. **Deploy**: Package and deploy API

## Tips for Best Results

- Use diverse datasets (multiple AI models)
- Train for sufficient epochs (monitor validation loss)
- Experiment with different architectures
- Use data augmentation
- Balance your dataset (equal real/fake images)
- Regularly evaluate on test set
- Keep model updated with new AI generation methods

Happy detecting! 🔍🛡️
