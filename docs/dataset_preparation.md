# Dataset Preparation Guide

This guide will help you download and prepare datasets for training the deepfake detection model.

## Recommended Datasets

### 1. CIFAKE Dataset
- **Description**: 120,000 images (60K real, 60K AI-generated)
- **Source**: Based on CIFAR-10 style images
- **Download**: Available on Kaggle
- **Link**: https://www.kaggle.com/datasets/birdy654/cifake-real-and-ai-generated-synthetic-images

**Steps to download:**
```bash
# Install Kaggle API
pip install kaggle

# Setup Kaggle credentials (get from https://www.kaggle.com/settings)
mkdir -p ~/.kaggle
# Place your kaggle.json in ~/.kaggle/

# Download dataset
kaggle datasets download -d birdy654/cifake-real-and-ai-generated-synthetic-images
unzip cifake-real-and-ai-generated-synthetic-images.zip -d data/raw/cifake
```

### 2. DiffusionDB
- **Description**: Large-scale dataset of AI-generated images
- **Source**: Stable Diffusion generated images
- **Download**: HuggingFace Datasets
- **Link**: https://huggingface.co/datasets/poloclub/diffusiondb

**Steps to download:**
```python
from datasets import load_dataset

# Download a subset (adjust num_samples as needed)
dataset = load_dataset(
    "poloclub/diffusiondb",
    "2m_random_1k",
    split="train"
)

# Save images
dataset.save_to_disk("data/raw/diffusiondb")
```

### 3. DIRE (Diffusion-Generated Image Detection)
- **Description**: Diverse AI-generated images from multiple models
- **Source**: Research dataset
- **Link**: https://github.com/ZhendongWang6/DIRE

### 4. Real Images (for negative samples)

**ImageNet Subset:**
```bash
# Download from ImageNet or use COCO dataset
# Or use any collection of real images
```

**COCO Dataset:**
```python
from pycocotools.coco import COCO
import urllib.request
import os

# Download COCO val2017
coco_url = "http://images.cocodataset.org/zips/val2017.zip"
urllib.request.urlretrieve(coco_url, "data/raw/val2017.zip")
```

## Directory Structure

After downloading, organize your data as follows:

```
data/
├── raw/
│   ├── cifake/
│   │   ├── real/
│   │   └── fake/
│   ├── diffusiondb/
│   ├── dire/
│   └── real_images/
└── processed/
    ├── train/
    │   ├── real/
    │   └── fake/
    ├── val/
    │   ├── real/
    │   └── fake/
    └── test/
        ├── real/
        └── fake/
```

## Data Preprocessing Script

Create a script to organize and split your data:

```python
import os
import shutil
from pathlib import Path
from sklearn.model_selection import train_test_split
import random

def prepare_dataset(
    raw_dir='data/raw',
    processed_dir='data/processed',
    train_split=0.8,
    val_split=0.1,
    test_split=0.1
):
    """
    Organize and split dataset into train/val/test.
    """
    # Create directories
    splits = ['train', 'val', 'test']
    classes = ['real', 'fake']
    
    for split in splits:
        for cls in classes:
            Path(f"{processed_dir}/{split}/{cls}").mkdir(parents=True, exist_ok=True)
    
    # Collect all real images
    real_images = []
    real_sources = [
        f"{raw_dir}/cifake/real",
        f"{raw_dir}/real_images"
    ]
    
    for source in real_sources:
        if os.path.exists(source):
            real_images.extend([
                os.path.join(source, f) 
                for f in os.listdir(source)
                if f.lower().endswith(('.jpg', '.jpeg', '.png', '.webp'))
            ])
    
    # Collect all fake images
    fake_images = []
    fake_sources = [
        f"{raw_dir}/cifake/fake",
        f"{raw_dir}/diffusiondb",
        f"{raw_dir}/dire"
    ]
    
    for source in fake_sources:
        if os.path.exists(source):
            for root, dirs, files in os.walk(source):
                fake_images.extend([
                    os.path.join(root, f)
                    for f in files
                    if f.lower().endswith(('.jpg', '.jpeg', '.png', '.webp'))
                ])
    
    # Shuffle
    random.shuffle(real_images)
    random.shuffle(fake_images)
    
    # Split data
    def split_data(images):
        train_size = int(len(images) * train_split)
        val_size = int(len(images) * val_split)
        
        train = images[:train_size]
        val = images[train_size:train_size + val_size]
        test = images[train_size + val_size:]
        
        return train, val, test
    
    real_train, real_val, real_test = split_data(real_images)
    fake_train, fake_val, fake_test = split_data(fake_images)
    
    # Copy files
    def copy_files(files, dest_dir, class_name):
        for i, file_path in enumerate(files):
            ext = Path(file_path).suffix
            dest_path = f"{dest_dir}/{class_name}/{i:06d}{ext}"
            shutil.copy2(file_path, dest_path)
            
            if (i + 1) % 1000 == 0:
                print(f"Copied {i + 1}/{len(files)} {class_name} images to {dest_dir}")
    
    print("Copying training data...")
    copy_files(real_train, f"{processed_dir}/train", "real")
    copy_files(fake_train, f"{processed_dir}/train", "fake")
    
    print("Copying validation data...")
    copy_files(real_val, f"{processed_dir}/val", "real")
    copy_files(fake_val, f"{processed_dir}/val", "fake")
    
    print("Copying test data...")
    copy_files(real_test, f"{processed_dir}/test", "real")
    copy_files(fake_test, f"{processed_dir}/test", "fake")
    
    # Print statistics
    print("\n=== Dataset Statistics ===")
    print(f"Train: {len(real_train)} real, {len(fake_train)} fake")
    print(f"Val: {len(real_val)} real, {len(fake_val)} fake")
    print(f"Test: {len(real_test)} real, {len(fake_test)} fake")
    print(f"Total: {len(real_images)} real, {len(fake_images)} fake")

if __name__ == "__main__":
    prepare_dataset()
```

## Data Augmentation

The training pipeline includes data augmentation:
- Random horizontal flips
- Random rotations (±15°)
- Color jitter (brightness, contrast, saturation, hue)
- Random crops
- Normalization using ImageNet statistics

## Quality Checks

Before training, verify your data:

```python
import os
from PIL import Image

def check_dataset_quality(data_dir):
    """Check for corrupted or invalid images."""
    issues = []
    
    for root, dirs, files in os.walk(data_dir):
        for file in files:
            if file.lower().endswith(('.jpg', '.jpeg', '.png', '.webp')):
                path = os.path.join(root, file)
                try:
                    img = Image.open(path)
                    img.verify()
                except Exception as e:
                    issues.append((path, str(e)))
    
    if issues:
        print(f"Found {len(issues)} problematic images:")
        for path, error in issues[:10]:  # Show first 10
            print(f"  {path}: {error}")
    else:
        print("All images are valid!")
    
    return issues

# Run check
check_dataset_quality("data/processed")
```

## Next Steps

After preparing your dataset:

1. Verify the directory structure
2. Check image counts in each split
3. Run quality checks
4. Update paths in `configs/train_config.yaml`
5. Start training with `python src/models/train.py`

## Tips

- **Balance classes**: Ensure similar numbers of real and fake images
- **Diversity**: Include images from various AI models (Stable Diffusion, DALL-E, Midjourney)
- **Quality**: Remove corrupted or extremely low-quality images
- **Size**: Start with a subset for quick experiments, then scale up
- **Regular updates**: As new AI models emerge, update your fake image collection
