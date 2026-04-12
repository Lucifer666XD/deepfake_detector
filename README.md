# Deepfake Detection System

A comprehensive AI-powered system to detect deepfakes and AI-generated/manipulated content across images, audio, and video.

## 🎯 Project Overview

This system provides:
- **Image Detection** (Primary): Detects AI-generated or manipulated images (full image analysis, not just faces)
- **Audio Detection** (Partial): Identifies synthetic or manipulated audio
- **Video Detection** (Conceptual): Framework for video deepfake detection
- **REST API**: Easy integration with social media platforms
- **Web Interface**: User-friendly demonstration UI

## 📁 Project Structure

```
deepfake-detector/
│
├── data/
│   ├── raw/              # Original datasets
│   ├── processed/        # Preprocessed data
│   └── models/           # Saved trained models
│
├── src/
│   ├── models/           # Model architectures and training
│   ├── api/              # REST API implementation
│   ├── preprocessing/    # Data preprocessing scripts
│   └── utils/            # Helper functions
│
├── frontend/
│   ├── static/           # CSS, JS, images
│   └── templates/        # HTML templates
│
├── notebooks/            # Jupyter notebooks for experiments
├── tests/                # Unit tests
├── configs/              # Configuration files
└── docs/                 # Documentation
```

## 🚀 Getting Started

### Prerequisites

- Python 3.8+
- pip
- Virtual environment (recommended)

### Installation

1. Clone the repository:
```bash
git clone https://github.com/Lucifer666XD/deepfake_detector.git
cd deepfake_detector
```

2. Create and activate virtual environment:
```bash
python -m venv venv
source venv/bin/activate  # On Windows: venv\Scripts\activate
```

3. Install dependencies:
```bash
pip install -r requirements.txt
```

### Dataset Setup

Download the recommended datasets:
- CIFAKE: (https://www.kaggle.com/datasets/birdy654/cifake-real-and-ai-generated-synthetic-images)
- DiffusionDB: (https://github.com/poloclub/diffusiondb)
- DIRE: (https://github.com/ZhendongWang6/DIRE)

Place them in `data/raw/` directory.

## 🎓 Model Architecture

The system uses a deep learning approach with:
- Convolutional Neural Networks (CNN) for feature extraction
- Vision Transformers for advanced pattern recognition
- Ensemble methods for improved accuracy

## 🔧 Usage

### Training the Model

```bash
python src/models/train.py --config configs/train_config.yaml
```

### Running the API

```bash
python src/api/app.py
```

The API will be available at `http://localhost:5000`

### Running API + React Frontend Together

From the project root, run:

```bash
npm install
npm run dev
```

This starts the Python API (`run_api.py`) and the React frontend (`frontend-react`) at the same time.

### Using the Web Interface

1. Start the API server
2. Open your browser and navigate to `http://localhost:5000`
3. Upload an image to check for deepfake content

## 📊 API Endpoints

- `POST /api/detect/image` - Detect deepfake in image
- `POST /api/detect/audio` - Detect deepfake in audio (partial)
- `GET /api/health` - Check API health
- `GET /api/stats` - Get detection statistics

## 🧪 Testing

Run tests with:
```bash
pytest tests/
```

## 📈 Performance Metrics

- Accuracy: TBD after training
- Precision: TBD
- Recall: TBD

## 🔐 Integration with Social Media

The API is designed to be easily integrated with social media platforms. See `docs/integration_guide.md` for detailed instructions.
