"""
Create a small subset of data for quick testing.
"""

import os
import shutil
import random
from pathlib import Path


def create_subset(
    source_dir='data/raw/cifake',
    dest_dir='data/raw/cifake_subset',
    num_images_per_class=100
):
    """
    Create a small subset of the dataset for quick testing.
    
    Args:
        source_dir: Source directory containing real/ and fake/ folders
        dest_dir: Destination directory for subset
        num_images_per_class: Number of images per class (real/fake)
    """
    print(f"Creating subset with {num_images_per_class} images per class...")
    
    # Create destination directories
    classes = ['real', 'fake']
    for cls in classes:
        Path(f"{dest_dir}/{cls}").mkdir(parents=True, exist_ok=True)
    
    # Process each class
    for cls in classes:
        source_path = os.path.join(source_dir, cls)
        dest_path = os.path.join(dest_dir, cls)
        
        if not os.path.exists(source_path):
            print(f"Warning: {source_path} does not exist, skipping...")
            continue
        
        # Get all images
        all_images = [
            f for f in os.listdir(source_path)
            if f.lower().endswith(('.jpg', '.jpeg', '.png', '.webp'))
        ]
        
        # Randomly sample
        if len(all_images) < num_images_per_class:
            print(f"Warning: Only {len(all_images)} {cls} images available, using all of them")
            selected = all_images
        else:
            selected = random.sample(all_images, num_images_per_class)
        
        # Copy selected images
        print(f"Copying {len(selected)} {cls} images...")
        for img in selected:
            src = os.path.join(source_path, img)
            dst = os.path.join(dest_path, img)
            shutil.copy2(src, dst)
        
        print(f"✓ Copied {len(selected)} {cls} images to {dest_path}")
    
    print(f"\n✓ Subset created at: {dest_dir}")
    print(f"\nNow run: python src/preprocessing/prepare_dataset.py")


if __name__ == "__main__":
    random.seed(42)  # For reproducibility
    create_subset()
