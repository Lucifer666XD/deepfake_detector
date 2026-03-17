#!/usr/bin/env python3
"""
Startup script for Deepfake Detection API
Run this script to start the API server
"""

import os
import sys
from pathlib import Path

# Add project root to Python path
project_root = Path(__file__).parent
sys.path.insert(0, str(project_root))

# Import and run the API
from src.api.app import main

if __name__ == '__main__':
    print("=" * 60)
    print("🚀 Starting Deepfake Detection API")
    print("=" * 60)
    print("\nℹ️  API will be available at: http://localhost:5000")
    print("📚 API Documentation: http://localhost:5000/api/info")
    print("🏥 Health Check: http://localhost:5000/api/health")
    print("\n⏹️  Press CTRL+C to stop the server")
    print("=" * 60)
    print()
    
    main()
