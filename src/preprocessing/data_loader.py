"""
Data preprocessing utilities for deepfake detection.
"""

import os
import numpy as np
from PIL import Image
import torch
from torch.utils.data import Dataset, DataLoader
from torchvision import transforms
from typing import Tuple, List, Optional
from pathlib import Path
import cv2


class DeepfakeDataset(Dataset):
    """Custom dataset for deepfake detection."""
    
    def __init__(
        self,
        data_dir: str,
        image_size: int = 224,
        transform: Optional[transforms.Compose] = None,
        mode: str = 'train'
    ):
        """
        Initialize dataset.
        
        Args:
            data_dir: Root directory containing 'real' and 'fake' subdirectories
            image_size: Target image size
            transform: Optional transforms to apply
            mode: Dataset mode ('train', 'val', 'test')
        """
        self.data_dir = Path(data_dir)
        self.image_size = image_size
        self.mode = mode
        
        # Setup transforms
        if transform is None:
            self.transform = self._get_default_transforms()
        else:
            self.transform = transform
        
        # Load image paths and labels
        self.image_paths = []
        self.labels = []
        self._load_data()
    
    def _load_data(self):
        """Load image paths and labels."""
        # Real images (label = 0)
        real_dir = self.data_dir / 'real'
        if real_dir.exists():
            for img_path in real_dir.glob('*'):
                if img_path.suffix.lower() in ['.jpg', '.jpeg', '.png', '.webp']:
                    self.image_paths.append(str(img_path))
                    self.labels.append(0)
        
        # Fake images (label = 1)
        fake_dir = self.data_dir / 'fake'
        if fake_dir.exists():
            for img_path in fake_dir.glob('*'):
                if img_path.suffix.lower() in ['.jpg', '.jpeg', '.png', '.webp']:
                    self.image_paths.append(str(img_path))
                    self.labels.append(1)
        
        print(f"Loaded {len(self.image_paths)} images for {self.mode} set")
        print(f"Real: {self.labels.count(0)}, Fake: {self.labels.count(1)}")
    
    def _get_default_transforms(self) -> transforms.Compose:
        """Get default transforms based on mode."""
        if self.mode == 'train':
            return transforms.Compose([
                transforms.Resize((self.image_size, self.image_size)),
                transforms.RandomHorizontalFlip(p=0.5),
                transforms.RandomRotation(15),
                transforms.ColorJitter(
                    brightness=0.2,
                    contrast=0.2,
                    saturation=0.2,
                    hue=0.1
                ),
                transforms.ToTensor(),
                transforms.Normalize(
                    mean=[0.485, 0.456, 0.406],
                    std=[0.229, 0.224, 0.225]
                )
            ])
        else:
            return transforms.Compose([
                transforms.Resize((self.image_size, self.image_size)),
                transforms.ToTensor(),
                transforms.Normalize(
                    mean=[0.485, 0.456, 0.406],
                    std=[0.229, 0.224, 0.225]
                )
            ])
    
    def __len__(self) -> int:
        """Return dataset size."""
        return len(self.image_paths)
    
    def __getitem__(self, idx: int) -> Tuple[torch.Tensor, int]:
        """
        Get item from dataset.
        
        Args:
            idx: Index
            
        Returns:
            Tuple of (image tensor, label)
        """
        # Load image
        img_path = self.image_paths[idx]
        image = Image.open(img_path).convert('RGB')
        
        # Apply transforms
        if self.transform:
            image = self.transform(image)
        
        # Get label
        label = self.labels[idx]
        
        return image, label


def create_dataloaders(
    data_dir: str,
    batch_size: int = 32,
    image_size: int = 224,
    num_workers: int = 4
) -> Tuple[DataLoader, DataLoader, DataLoader]:
    """
    Create train, validation, and test dataloaders.
    
    Args:
        data_dir: Root data directory
        batch_size: Batch size
        image_size: Target image size
        num_workers: Number of workers for data loading
        
    Returns:
        Tuple of (train_loader, val_loader, test_loader)
    """
    data_path = Path(data_dir)
    
    # Create datasets
    train_dataset = DeepfakeDataset(
        data_path / 'train',
        image_size=image_size,
        mode='train'
    )
    
    val_dataset = DeepfakeDataset(
        data_path / 'val',
        image_size=image_size,
        mode='val'
    )
    
    test_dataset = DeepfakeDataset(
        data_path / 'test',
        image_size=image_size,
        mode='test'
    )
    
    # Create dataloaders
    train_loader = DataLoader(
        train_dataset,
        batch_size=batch_size,
        shuffle=True,
        num_workers=num_workers,
        pin_memory=True
    )
    
    val_loader = DataLoader(
        val_dataset,
        batch_size=batch_size,
        shuffle=False,
        num_workers=num_workers,
        pin_memory=True
    )
    
    test_loader = DataLoader(
        test_dataset,
        batch_size=batch_size,
        shuffle=False,
        num_workers=num_workers,
        pin_memory=True
    )
    
    return train_loader, val_loader, test_loader


def preprocess_image_for_inference(
    image_path: str,
    image_size: int = 224
) -> torch.Tensor:
    """
    Preprocess a single image for inference.
    
    Args:
        image_path: Path to image
        image_size: Target image size
        
    Returns:
        Preprocessed image tensor
    """
    # Define transforms
    transform = transforms.Compose([
        transforms.Resize((image_size, image_size)),
        transforms.ToTensor(),
        transforms.Normalize(
            mean=[0.485, 0.456, 0.406],
            std=[0.229, 0.224, 0.225]
        )
    ])
    
    # Load and transform image
    image = Image.open(image_path).convert('RGB')
    image_tensor = transform(image)
    
    # Add batch dimension
    image_tensor = image_tensor.unsqueeze(0)
    
    return image_tensor


def extract_frames_from_video(
    video_path: str,
    num_frames: int = 30,
    output_dir: Optional[str] = None
) -> List[np.ndarray]:
    """
    Extract frames from video for analysis.
    
    Args:
        video_path: Path to video file
        num_frames: Number of frames to extract
        output_dir: Optional directory to save frames
        
    Returns:
        List of frame arrays
    """
    cap = cv2.VideoCapture(video_path)
    total_frames = int(cap.get(cv2.CAP_PROP_FRAME_COUNT))
    
    # Calculate frame indices to extract
    frame_indices = np.linspace(0, total_frames - 1, num_frames, dtype=int)
    
    frames = []
    for idx in frame_indices:
        cap.set(cv2.CAP_PROP_POS_FRAMES, idx)
        ret, frame = cap.read()
        if ret:
            frame = cv2.cvtColor(frame, cv2.COLOR_BGR2RGB)
            frames.append(frame)
            
            # Save frame if output directory specified
            if output_dir:
                os.makedirs(output_dir, exist_ok=True)
                frame_path = os.path.join(output_dir, f"frame_{idx:04d}.jpg")
                cv2.imwrite(frame_path, cv2.cvtColor(frame, cv2.COLOR_RGB2BGR))
    
    cap.release()
    return frames


if __name__ == "__main__":
    # Test dataset loading
    print("Testing dataset loading...")
    # Note: This will fail without actual data, but shows the structure
