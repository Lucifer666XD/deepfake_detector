"""
API Test Script
Tests all endpoints of the Deepfake Detection API
"""

import requests
import json
from pathlib import Path
import sys

# Configuration
BASE_URL = "http://localhost:3000"
TEST_IMAGE_DIR = Path("data/processed/test")

def print_header(text):
    """Print formatted header."""
    print("\n" + "=" * 60)
    print(f"  {text}")
    print("=" * 60)

def print_result(name, status, details=""):
    """Print test result."""
    icon = "✅" if status else "❌"
    print(f"{icon} {name}")
    if details:
        print(f"   {details}")

def test_health():
    """Test health check endpoint."""
    print_header("Testing /api/health")
    
    try:
        response = requests.get(f"{BASE_URL}/api/health")
        data = response.json()
        
        success = response.status_code == 200 and data.get('status') == 'healthy'
        print_result(
            "Health Check",
            success,
            f"Status: {data.get('status')}, Model Loaded: {data.get('model_loaded')}, Device: {data.get('device')}"
        )
        return success
    except Exception as e:
        print_result("Health Check", False, f"Error: {e}")
        return False

def test_api_info():
    """Test API info endpoint."""
    print_header("Testing /api/info")
    
    try:
        response = requests.get(f"{BASE_URL}/api/info")
        data = response.json()
        
        success = response.status_code == 200 and 'version' in data
        print_result(
            "API Info",
            success,
            f"Version: {data.get('version')}, Title: {data.get('title')}"
        )
        return success
    except Exception as e:
        print_result("API Info", False, f"Error: {e}")
        return False

def test_image_detection(image_path):
    """Test image detection endpoint."""
    print_header(f"Testing /api/detect/image with {image_path.name}")
    
    try:
        with open(image_path, 'rb') as f:
            files = {'image': f}
            response = requests.post(f"{BASE_URL}/api/detect/image", files=files)
        
        if response.status_code == 200:
            data = response.json()
            if data.get('success'):
                print_result(
                    "Image Detection",
                    True,
                    f"Prediction: {data.get('prediction')}, "
                    f"Confidence: {data.get('confidence', 0):.2%}, "
                    f"Time: {data.get('processing_time', 0):.3f}s"
                )
                return True
            else:
                print_result("Image Detection", False, f"API Error: {data.get('error')}")
                return False
        else:
            print_result("Image Detection", False, f"HTTP {response.status_code}")
            return False
    except FileNotFoundError:
        print_result("Image Detection", False, f"Image not found: {image_path}")
        return False
    except Exception as e:
        print_result("Image Detection", False, f"Error: {e}")
        return False

def test_batch_detection(image_paths):
    """Test batch detection endpoint."""
    print_header(f"Testing /api/detect/batch with {len(image_paths)} images")
    
    try:
        files = [('images', open(path, 'rb')) for path in image_paths if path.exists()]
        
        if not files:
            print_result("Batch Detection", False, "No valid images found")
            return False
        
        response = requests.post(f"{BASE_URL}/api/detect/batch", files=files)
        
        # Close all files
        for _, f in files:
            f.close()
        
        if response.status_code == 200:
            data = response.json()
            if data.get('success'):
                print_result(
                    "Batch Detection",
                    True,
                    f"Processed {data.get('total_images')} images"
                )
                
                # Print individual results
                for result in data.get('results', [])[:3]:  # Show first 3
                    print(f"   → {result.get('filename')}: {result.get('prediction')} "
                          f"({result.get('confidence', 0):.2%})")
                
                return True
            else:
                print_result("Batch Detection", False, f"API Error: {data.get('error')}")
                return False
        else:
            print_result("Batch Detection", False, f"HTTP {response.status_code}")
            return False
    except Exception as e:
        print_result("Batch Detection", False, f"Error: {e}")
        return False

def test_stats():
    """Test stats endpoint."""
    print_header("Testing /api/stats")
    
    try:
        response = requests.get(f"{BASE_URL}/api/stats")
        data = response.json()
        
        success = response.status_code == 200
        print_result(
            "Stats Endpoint",
            success,
            f"Data: {json.dumps(data, indent=2)}"
        )
        return success
    except Exception as e:
        print_result("Stats Endpoint", False, f"Error: {e}")
        return False

def find_test_images():
    """Find test images in the dataset."""
    test_images = []
    
    # Look in various test directories
    search_paths = [
        TEST_IMAGE_DIR / "real",
        TEST_IMAGE_DIR / "fake",
        Path("data/raw/cifake/real"),
        Path("data/raw/cifake/fake"),
    ]
    
    for search_path in search_paths:
        if search_path.exists():
            images = list(search_path.glob("*.jpg"))[:2]  # Get up to 2 images
            test_images.extend(images)
            if len(test_images) >= 3:
                break
    
    return test_images[:3]  # Return max 3 images

def main():
    """Run all tests."""
    print("\n" + "🧪" * 30)
    print("  DEEPFAKE DETECTION API - TEST SUITE")
    print("🧪" * 30)
    print(f"\n📍 Testing API at: {BASE_URL}")
    print("⚠️  Make sure the API server is running (python run_api.py)")
    
    # Check if server is reachable
    try:
        requests.get(BASE_URL, timeout=2)
    except requests.exceptions.ConnectionError:
        print("\n❌ ERROR: Cannot connect to API server!")
        print(f"   Please start the server first: python run_api.py")
        return 1
    except Exception:
        pass  # Server might be running but different route
    
    results = []
    
    # Run tests
    results.append(("Health Check", test_health()))
    results.append(("API Info", test_api_info()))
    results.append(("Stats", test_stats()))
    
    # Find test images
    test_images = find_test_images()
    
    if test_images:
        print(f"\n📸 Found {len(test_images)} test images")
        
        # Test single image detection
        results.append(("Single Image Detection", test_image_detection(test_images[0])))
        
        # Test batch detection if we have multiple images
        if len(test_images) > 1:
            results.append(("Batch Detection", test_batch_detection(test_images)))
    else:
        print("\n⚠️  No test images found. Skipping image detection tests.")
        print("   Add images to data/processed/test/ or data/raw/cifake/ to test detection.")
    
    # Print summary
    print_header("TEST SUMMARY")
    passed = sum(1 for _, success in results if success)
    total = len(results)
    
    for name, success in results:
        icon = "✅" if success else "❌"
        print(f"{icon} {name}")
    
    print(f"\n📊 Results: {passed}/{total} tests passed")
    
    if passed == total:
        print("🎉 All tests passed!")
        return 0
    else:
        print(f"⚠️  {total - passed} test(s) failed")
        return 1

if __name__ == '__main__':
    sys.exit(main())
