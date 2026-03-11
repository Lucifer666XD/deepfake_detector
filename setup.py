"""
Setup script for Deepfake Detection System
"""

from setuptools import setup, find_packages

with open("README.md", "r", encoding="utf-8") as fh:
    long_description = fh.read()

with open("requirements.txt", "r", encoding="utf-8") as fh:
    requirements = [line.strip() for line in fh if line.strip() and not line.startswith("#")]

setup(
    name="deepfake-detector",
    version="1.0.0",
    author="Your Name",
    author_email="your.email@example.com",
    description="AI-powered deepfake detection system for images, audio, and video",
    long_description=long_description,
    long_description_content_type="text/markdown",
    url="https://github.com/yourusername/deepfake-detector",
    packages=find_packages(),
    classifiers=[
        "Development Status :: 4 - Beta",
        "Intended Audience :: Developers",
        "Intended Audience :: Science/Research",
        "Topic :: Scientific/Engineering :: Artificial Intelligence",
        "Topic :: Multimedia :: Graphics",
        "License :: OSI Approved :: MIT License",
        "Programming Language :: Python :: 3",
        "Programming Language :: Python :: 3.8",
        "Programming Language :: Python :: 3.9",
        "Programming Language :: Python :: 3.10",
        "Programming Language :: Python :: 3.11",
    ],
    python_requires=">=3.8",
    install_requires=requirements,
    extras_require={
        "dev": [
            "pytest>=7.4.0",
            "pytest-cov>=4.1.0",
            "black>=23.7.0",
            "flake8>=6.1.0",
            "mypy>=1.5.0",
        ],
    },
    entry_points={
        "console_scripts": [
            "deepfake-api=src.api.app:main",
            "deepfake-train=src.models.train:main",
        ],
    },
    include_package_data=True,
    package_data={
        "": ["configs/*.yaml", "frontend/templates/*.html", "frontend/static/**/*"],
    },
)
