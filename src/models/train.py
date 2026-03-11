"""
Training script for deepfake detection model.
"""

import os
import torch
import torch.nn as nn
import torch.optim as optim
from torch.utils.data import DataLoader
from torch.cuda.amp import GradScaler, autocast
import numpy as np
from tqdm import tqdm
from pathlib import Path
import sys

# Add parent directory to path
sys.path.append(str(Path(__file__).parent.parent.parent))

from src.models.model import create_model
from src.preprocessing.data_loader import create_dataloaders
from src.utils.config import load_train_config
from src.utils.logger import get_logger
from sklearn.metrics import accuracy_score, precision_score, recall_score, f1_score, roc_auc_score


class Trainer:
    """Trainer class for deepfake detection model."""
    
    def __init__(self, config_path: str = None):
        """
        Initialize trainer.
        
        Args:
            config_path: Path to configuration file
        """
        # Load configuration
        if config_path:
            from src.utils.config import Config
            self.config = Config(config_path)
        else:
            self.config = load_train_config()
        
        # Setup logger
        self.logger = get_logger('trainer')
        
        # Setup device
        self.device = torch.device(
            'cuda' if torch.cuda.is_available() and self.config.get('hardware.device') == 'cuda'
            else 'cpu'
        )
        self.logger.info(f"Using device: {self.device}")
        
        # Create model
        self.model = self._create_model()
        
        # Setup optimizer
        self.optimizer = self._create_optimizer()
        
        # Setup scheduler
        self.scheduler = self._create_scheduler()
        
        # Setup loss function
        self.criterion = nn.CrossEntropyLoss()
        
        # Setup mixed precision training
        self.use_amp = self.config.get('hardware.mixed_precision', True)
        self.scaler = GradScaler() if self.use_amp else None
        
        # Tracking variables
        self.best_val_loss = float('inf')
        self.best_val_acc = 0.0
        self.epochs_no_improve = 0
        self.current_epoch = 0
    
    def _create_model(self) -> nn.Module:
        """Create model."""
        model = create_model(
            architecture=self.config.get('model.architecture'),
            num_classes=self.config.get('model.num_classes'),
            pretrained=self.config.get('model.pretrained'),
            dropout_rate=self.config.get('model.dropout_rate')
        )
        model = model.to(self.device)
        
        self.logger.info(f"Model created: {self.config.get('model.architecture')}")
        total_params = sum(p.numel() for p in model.parameters())
        self.logger.info(f"Total parameters: {total_params:,}")
        
        return model
    
    def _create_optimizer(self) -> optim.Optimizer:
        """Create optimizer."""
        optimizer_name = self.config.get('training.optimizer', 'adam').lower()
        lr = self.config.get('training.learning_rate')
        weight_decay = self.config.get('training.weight_decay')
        
        if optimizer_name == 'adam':
            optimizer = optim.Adam(
                self.model.parameters(),
                lr=lr,
                weight_decay=weight_decay
            )
        elif optimizer_name == 'adamw':
            optimizer = optim.AdamW(
                self.model.parameters(),
                lr=lr,
                weight_decay=weight_decay
            )
        elif optimizer_name == 'sgd':
            optimizer = optim.SGD(
                self.model.parameters(),
                lr=lr,
                momentum=0.9,
                weight_decay=weight_decay
            )
        else:
            raise ValueError(f"Unknown optimizer: {optimizer_name}")
        
        return optimizer
    
    def _create_scheduler(self):
        """Create learning rate scheduler."""
        scheduler_name = self.config.get('training.scheduler', 'cosine').lower()
        
        if scheduler_name == 'cosine':
            scheduler = optim.lr_scheduler.CosineAnnealingLR(
                self.optimizer,
                T_max=self.config.get('training.epochs')
            )
        elif scheduler_name == 'step':
            scheduler = optim.lr_scheduler.StepLR(
                self.optimizer,
                step_size=10,
                gamma=0.1
            )
        elif scheduler_name == 'plateau':
            scheduler = optim.lr_scheduler.ReduceLROnPlateau(
                self.optimizer,
                mode='min',
                patience=5,
                factor=0.5
            )
        else:
            scheduler = None
        
        return scheduler
    
    def train_epoch(self, train_loader: DataLoader) -> dict:
        """
        Train for one epoch.
        
        Args:
            train_loader: Training data loader
            
        Returns:
            Dictionary of metrics
        """
        self.model.train()
        
        total_loss = 0
        all_preds = []
        all_labels = []
        
        pbar = tqdm(train_loader, desc=f"Epoch {self.current_epoch + 1} [Train]")
        
        for batch_idx, (images, labels) in enumerate(pbar):
            images = images.to(self.device)
            labels = labels.to(self.device)
            
            # Zero gradients
            self.optimizer.zero_grad()
            
            # Forward pass with mixed precision
            if self.use_amp:
                with autocast():
                    outputs = self.model(images)
                    loss = self.criterion(outputs, labels)
                
                # Backward pass
                self.scaler.scale(loss).backward()
                self.scaler.step(self.optimizer)
                self.scaler.update()
            else:
                outputs = self.model(images)
                loss = self.criterion(outputs, labels)
                
                loss.backward()
                self.optimizer.step()
            
            # Track metrics
            total_loss += loss.item()
            preds = torch.argmax(outputs, dim=1)
            all_preds.extend(preds.cpu().numpy())
            all_labels.extend(labels.cpu().numpy())
            
            # Update progress bar
            pbar.set_postfix({'loss': loss.item()})
        
        # Calculate metrics
        avg_loss = total_loss / len(train_loader)
        accuracy = accuracy_score(all_labels, all_preds)
        
        return {
            'loss': avg_loss,
            'accuracy': accuracy
        }
    
    def validate(self, val_loader: DataLoader) -> dict:
        """
        Validate model.
        
        Args:
            val_loader: Validation data loader
            
        Returns:
            Dictionary of metrics
        """
        self.model.eval()
        
        total_loss = 0
        all_preds = []
        all_labels = []
        all_probs = []
        
        with torch.no_grad():
            pbar = tqdm(val_loader, desc=f"Epoch {self.current_epoch + 1} [Val]")
            
            for images, labels in pbar:
                images = images.to(self.device)
                labels = labels.to(self.device)
                
                # Forward pass
                outputs = self.model(images)
                loss = self.criterion(outputs, labels)
                
                # Get probabilities
                probs = torch.softmax(outputs, dim=1)
                
                # Track metrics
                total_loss += loss.item()
                preds = torch.argmax(outputs, dim=1)
                all_preds.extend(preds.cpu().numpy())
                all_labels.extend(labels.cpu().numpy())
                all_probs.extend(probs[:, 1].cpu().numpy())  # Probability of fake class
        
        # Calculate metrics
        avg_loss = total_loss / len(val_loader)
        accuracy = accuracy_score(all_labels, all_preds)
        precision = precision_score(all_labels, all_preds, zero_division=0)
        recall = recall_score(all_labels, all_preds, zero_division=0)
        f1 = f1_score(all_labels, all_preds, zero_division=0)
        auc_roc = roc_auc_score(all_labels, all_probs) if len(set(all_labels)) > 1 else 0.0
        
        return {
            'loss': avg_loss,
            'accuracy': accuracy,
            'precision': precision,
            'recall': recall,
            'f1_score': f1,
            'auc_roc': auc_roc
        }
    
    def save_checkpoint(self, metrics: dict, is_best: bool = False):
        """
        Save model checkpoint.
        
        Args:
            metrics: Dictionary of metrics
            is_best: Whether this is the best model so far
        """
        checkpoint_dir = Path(self.config.get('training.checkpoint_path'))
        checkpoint_dir.mkdir(parents=True, exist_ok=True)
        
        checkpoint = {
            'epoch': self.current_epoch,
            'model_state_dict': self.model.state_dict(),
            'optimizer_state_dict': self.optimizer.state_dict(),
            'metrics': metrics,
            'config': dict(self.config.config)
        }
        
        # Save latest checkpoint
        latest_path = checkpoint_dir / 'latest_checkpoint.pth'
        torch.save(checkpoint, latest_path)
        
        # Save best checkpoint
        if is_best:
            best_path = checkpoint_dir / 'best_checkpoint.pth'
            torch.save(checkpoint, best_path)
            self.logger.info(f"Saved best model with val_acc: {metrics['accuracy']:.4f}")
    
    def train(
        self,
        train_loader: DataLoader,
        val_loader: DataLoader,
        epochs: int = None
    ):
        """
        Full training loop.
        
        Args:
            train_loader: Training data loader
            val_loader: Validation data loader
            epochs: Number of epochs (overrides config if provided)
        """
        if epochs is None:
            epochs = self.config.get('training.epochs')
        
        early_stopping_patience = self.config.get('training.early_stopping_patience')
        
        self.logger.info(f"Starting training for {epochs} epochs")
        
        for epoch in range(epochs):
            self.current_epoch = epoch
            
            # Train
            train_metrics = self.train_epoch(train_loader)
            
            # Validate
            val_metrics = self.validate(val_loader)
            
            # Log metrics
            self.logger.info(
                f"Epoch {epoch + 1}/{epochs} - "
                f"Train Loss: {train_metrics['loss']:.4f}, "
                f"Train Acc: {train_metrics['accuracy']:.4f}, "
                f"Val Loss: {val_metrics['loss']:.4f}, "
                f"Val Acc: {val_metrics['accuracy']:.4f}, "
                f"Val F1: {val_metrics['f1_score']:.4f}"
            )
            
            # Update scheduler
            if self.scheduler:
                if isinstance(self.scheduler, optim.lr_scheduler.ReduceLROnPlateau):
                    self.scheduler.step(val_metrics['loss'])
                else:
                    self.scheduler.step()
            
            # Check if best model
            is_best = val_metrics['accuracy'] > self.best_val_acc
            if is_best:
                self.best_val_acc = val_metrics['accuracy']
                self.best_val_loss = val_metrics['loss']
                self.epochs_no_improve = 0
            else:
                self.epochs_no_improve += 1
            
            # Save checkpoint
            if (epoch + 1) % self.config.get('logging.save_frequency') == 0:
                self.save_checkpoint(val_metrics, is_best=is_best)
            
            # Early stopping
            if self.epochs_no_improve >= early_stopping_patience:
                self.logger.info(f"Early stopping triggered after {epoch + 1} epochs")
                # Save final checkpoint before stopping
                self.save_checkpoint(val_metrics, is_best=False)
                break
        
        # Save final checkpoint after training completes
        self.save_checkpoint(val_metrics, is_best=False)
        self.logger.info("Training completed!")
        self.logger.info(f"Best validation accuracy: {self.best_val_acc:.4f}")


def main():
    """Main training function."""
    # Load config
    config = load_train_config()
    
    # Create trainer
    trainer = Trainer()
    
    # Create data loaders
    train_loader, val_loader, test_loader = create_dataloaders(
        data_dir=config.get('data.processed_path'),
        batch_size=config.get('data.batch_size'),
        image_size=config.get('data.image_size'),
        num_workers=config.get('data.num_workers')
    )
    
    # Train model
    trainer.train(train_loader, val_loader)


if __name__ == "__main__":
    main()
