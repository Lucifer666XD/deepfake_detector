"""
Model architectures for deepfake detection.
"""

import torch
import torch.nn as nn
import torchvision.models as models
from typing import Optional
import timm


class DeepfakeDetector(nn.Module):
    """
    Deepfake detection model using transfer learning.
    Supports multiple backbone architectures.
    """
    
    def __init__(
        self,
        architecture: str = 'efficientnet_b0',
        num_classes: int = 2,
        pretrained: bool = True,
        dropout_rate: float = 0.3
    ):
        """
        Initialize model.
        
        Args:
            architecture: Backbone architecture name
            num_classes: Number of output classes (2 for binary classification)
            pretrained: Whether to use pretrained weights
            dropout_rate: Dropout rate for regularization
        """
        super(DeepfakeDetector, self).__init__()
        
        self.architecture = architecture
        self.num_classes = num_classes
        
        # Create backbone based on architecture
        self.backbone = self._create_backbone(architecture, pretrained)
        
        # Get number of features from backbone
        self.num_features = self._get_num_features()
        
        # Create classifier head
        self.classifier = nn.Sequential(
            nn.Dropout(dropout_rate),
            nn.Linear(self.num_features, 512),
            nn.ReLU(),
            nn.Dropout(dropout_rate / 2),
            nn.Linear(512, num_classes)
        )
    
    def _create_backbone(self, architecture: str, pretrained: bool) -> nn.Module:
        """
        Create backbone model.
        
        Args:
            architecture: Architecture name
            pretrained: Use pretrained weights
            
        Returns:
            Backbone model
        """
        if architecture.startswith('efficientnet'):
            # Use timm for EfficientNet variants
            model = timm.create_model(architecture, pretrained=pretrained)
            # Remove classifier
            if hasattr(model, 'classifier'):
                model.classifier = nn.Identity()
            elif hasattr(model, 'fc'):
                model.fc = nn.Identity()
        
        elif architecture == 'resnet50':
            model = models.resnet50(pretrained=pretrained)
            model.fc = nn.Identity()
        
        elif architecture == 'resnet101':
            model = models.resnet101(pretrained=pretrained)
            model.fc = nn.Identity()
        
        elif architecture == 'vit_base':
            model = timm.create_model('vit_base_patch16_224', pretrained=pretrained)
            model.head = nn.Identity()
        
        elif architecture == 'convnext_base':
            model = timm.create_model('convnext_base', pretrained=pretrained)
            model.head = nn.Identity()
        
        else:
            raise ValueError(f"Unknown architecture: {architecture}")
        
        return model
    
    def _get_num_features(self) -> int:
        """
        Get number of output features from backbone.
        
        Returns:
            Number of features
        """
        # Create dummy input
        dummy_input = torch.randn(1, 3, 224, 224)
        with torch.no_grad():
            features = self.backbone(dummy_input)
        
        return features.shape[1]
    
    def forward(self, x: torch.Tensor) -> torch.Tensor:
        """
        Forward pass.
        
        Args:
            x: Input tensor of shape (batch_size, 3, H, W)
            
        Returns:
            Output logits of shape (batch_size, num_classes)
        """
        # Extract features
        features = self.backbone(x)
        
        # Classify
        output = self.classifier(features)
        
        return output
    
    def predict_proba(self, x: torch.Tensor) -> torch.Tensor:
        """
        Get probability predictions.
        
        Args:
            x: Input tensor
            
        Returns:
            Probability tensor
        """
        logits = self.forward(x)
        probs = torch.softmax(logits, dim=1)
        return probs


class EnsembleDetector(nn.Module):
    """
    Ensemble of multiple deepfake detectors for improved accuracy.
    """
    
    def __init__(
        self,
        models: list,
        weights: Optional[list] = None
    ):
        """
        Initialize ensemble.
        
        Args:
            models: List of model instances
            weights: Optional weights for each model
        """
        super(EnsembleDetector, self).__init__()
        
        self.models = nn.ModuleList(models)
        
        if weights is None:
            self.weights = [1.0 / len(models)] * len(models)
        else:
            self.weights = weights
    
    def forward(self, x: torch.Tensor) -> torch.Tensor:
        """
        Forward pass through ensemble.
        
        Args:
            x: Input tensor
            
        Returns:
            Weighted average of predictions
        """
        outputs = []
        for model in self.models:
            output = model(x)
            outputs.append(output)
        
        # Weighted average
        weighted_output = sum(w * o for w, o in zip(self.weights, outputs))
        
        return weighted_output
    
    def predict_proba(self, x: torch.Tensor) -> torch.Tensor:
        """
        Get probability predictions from ensemble.
        
        Args:
            x: Input tensor
            
        Returns:
            Probability tensor
        """
        logits = self.forward(x)
        probs = torch.softmax(logits, dim=1)
        return probs


def create_model(
    architecture: str = 'efficientnet_b0',
    num_classes: int = 2,
    pretrained: bool = True,
    dropout_rate: float = 0.3
) -> DeepfakeDetector:
    """
    Create a deepfake detection model.
    
    Args:
        architecture: Model architecture
        num_classes: Number of classes
        pretrained: Use pretrained weights
        dropout_rate: Dropout rate
        
    Returns:
        DeepfakeDetector model
    """
    model = DeepfakeDetector(
        architecture=architecture,
        num_classes=num_classes,
        pretrained=pretrained,
        dropout_rate=dropout_rate
    )
    
    return model


if __name__ == "__main__":
    # Test model creation
    print("Testing model creation...")
    
    model = create_model(architecture='efficientnet_b0')
    print(f"Model created with {sum(p.numel() for p in model.parameters()):,} parameters")
    
    # Test forward pass
    dummy_input = torch.randn(2, 3, 224, 224)
    output = model(dummy_input)
    print(f"Output shape: {output.shape}")
    
    # Test probability prediction
    probs = model.predict_proba(dummy_input)
    print(f"Probabilities shape: {probs.shape}")
    print(f"Sample probabilities: {probs[0]}")
