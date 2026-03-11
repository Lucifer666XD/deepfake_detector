"""
Configuration utilities for loading and managing config files.
"""

import yaml
import os
from pathlib import Path
from typing import Dict, Any


class Config:
    """Configuration manager class."""
    
    def __init__(self, config_path: str):
        """
        Initialize configuration manager.
        
        Args:
            config_path: Path to YAML configuration file
        """
        self.config_path = config_path
        self.config = self.load_config()
    
    def load_config(self) -> Dict[str, Any]:
        """
        Load configuration from YAML file.
        
        Returns:
            Dictionary containing configuration
        """
        if not os.path.exists(self.config_path):
            raise FileNotFoundError(f"Config file not found: {self.config_path}")
        
        with open(self.config_path, 'r') as f:
            config = yaml.safe_load(f)
        
        return config
    
    def get(self, key: str, default: Any = None) -> Any:
        """
        Get configuration value by key (supports nested keys with dot notation).
        
        Args:
            key: Configuration key (e.g., 'model.architecture')
            default: Default value if key not found
            
        Returns:
            Configuration value
        """
        keys = key.split('.')
        value = self.config
        
        for k in keys:
            if isinstance(value, dict) and k in value:
                value = value[k]
            else:
                return default
        
        return value
    
    def __getitem__(self, key: str) -> Any:
        """Allow dictionary-style access."""
        return self.get(key)


def get_project_root() -> Path:
    """
    Get the project root directory.
    
    Returns:
        Path object pointing to project root
    """
    return Path(__file__).parent.parent.parent


def get_config_path(config_name: str) -> str:
    """
    Get full path to configuration file.
    
    Args:
        config_name: Name of configuration file (e.g., 'train_config.yaml')
        
    Returns:
        Full path to configuration file
    """
    root = get_project_root()
    return str(root / 'configs' / config_name)


def load_train_config() -> Config:
    """Load training configuration."""
    return Config(get_config_path('train_config.yaml'))


def load_api_config() -> Config:
    """Load API configuration."""
    return Config(get_config_path('api_config.yaml'))


if __name__ == "__main__":
    # Test configuration loading
    try:
        train_config = load_train_config()
        print("Training config loaded successfully!")
        print(f"Model architecture: {train_config.get('model.architecture')}")
        print(f"Batch size: {train_config.get('data.batch_size')}")
        
        api_config = load_api_config()
        print("\nAPI config loaded successfully!")
        print(f"API version: {api_config.get('api.version')}")
        print(f"Server port: {api_config.get('server.port')}")
    except Exception as e:
        print(f"Error loading config: {e}")
