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
