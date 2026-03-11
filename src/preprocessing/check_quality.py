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
