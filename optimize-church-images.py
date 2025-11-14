#!/usr/bin/env python3
"""
Church Image Optimizer and Uploader
Optimizes church photos for web and uploads to server
"""

import os
import sys
from PIL import Image
from pathlib import Path

# Configuration
IMAGE_DIR = Path(__file__).parent / "church-photos-source"
OUTPUT_DIR = Path(__file__).parent / "church-photos-optimized"
MAX_WIDTH = 1920  # Full HD width
MAX_HEIGHT = 1080  # Full HD height
QUALITY = 85  # JPEG quality (1-100)
THUMBNAIL_WIDTH = 800  # For thumbnails

def optimize_image(input_path, output_path, max_width=MAX_WIDTH, max_height=MAX_HEIGHT, quality=QUALITY):
    """
    Optimize an image for web use
    """
    try:
        # Open image
        with Image.open(input_path) as img:
            # Convert RGBA to RGB if needed
            if img.mode == 'RGBA':
                background = Image.new('RGB', img.size, (255, 255, 255))
                background.paste(img, mask=img.split()[3])
                img = background
            elif img.mode != 'RGB':
                img = img.convert('RGB')
            
            # Calculate new size maintaining aspect ratio
            ratio = min(max_width / img.width, max_height / img.height)
            if ratio < 1:  # Only resize if image is larger
                new_size = (int(img.width * ratio), int(img.height * ratio))
                img = img.resize(new_size, Image.Resampling.LANCZOS)
            
            # Save with optimization
            img.save(output_path, 'JPEG', quality=quality, optimize=True, progressive=True)
            
            original_size = os.path.getsize(input_path)
            optimized_size = os.path.getsize(output_path)
            reduction = ((original_size - optimized_size) / original_size) * 100
            
            print(f"✅ {output_path.name}")
            print(f"   Size: {original_size // 1024}KB → {optimized_size // 1024}KB ({reduction:.1f}% reduction)")
            print(f"   Dimensions: {img.width}x{img.height}")
            
            return True
    except Exception as e:
        print(f"❌ Error processing {input_path.name}: {e}")
        return False

def create_placeholder_images():
    """
    Create placeholder images for missing files
    """
    placeholders = {
        'apple.png': (180, 180, (0, 122, 255)),  # Apple blue
        'google.png': (180, 180, (66, 133, 244)),  # Google blue
        'card.png': (400, 300, (59, 130, 246)),  # Cyan
    }
    
    OUTPUT_DIR.mkdir(parents=True, exist_ok=True)
    
    for filename, (width, height, color) in placeholders.items():
        output_path = OUTPUT_DIR / filename
        
        # Create colored rectangle
        img = Image.new('RGB', (width, height), color)
        
        # Save
        if filename.endswith('.png'):
            img.save(output_path, 'PNG', optimize=True)
        else:
            img.save(output_path, 'JPEG', quality=90, optimize=True)
        
        print(f"✅ Created placeholder: {filename} ({width}x{height})")

def main():
    """
    Main function
    """
    print("=" * 60)
    print("Church Image Optimizer")
    print("=" * 60)
    print()
    
    # Create output directory
    OUTPUT_DIR.mkdir(parents=True, exist_ok=True)
    
    # Check if source directory exists
    if not IMAGE_DIR.exists():
        print(f"⚠️  Source directory not found: {IMAGE_DIR}")
        print(f"   Creating directory...")
        IMAGE_DIR.mkdir(parents=True, exist_ok=True)
        print(f"   Please place your church photos in: {IMAGE_DIR}")
        print()
    
    # Process church interior photos
    print("📸 Processing church interior photos...")
    print()
    
    # Look for images in source directory
    image_files = list(IMAGE_DIR.glob("*.jpg")) + list(IMAGE_DIR.glob("*.jpeg")) + list(IMAGE_DIR.glob("*.png"))
    
    if not image_files:
        print("⚠️  No images found in source directory")
        print(f"   Please add photos to: {IMAGE_DIR}")
    else:
        # Process each image
        for idx, img_path in enumerate(sorted(image_files), start=1):
            output_name = f"church-interior-{idx}.jpg"
            output_path = OUTPUT_DIR / output_name
            optimize_image(img_path, output_path)
            print()
    
    # Create placeholder images for icons
    print("🎨 Creating placeholder icon images...")
    print()
    create_placeholder_images()
    
    print()
    print("=" * 60)
    print("✅ Image optimization complete!")
    print("=" * 60)
    print()
    print(f"Output directory: {OUTPUT_DIR}")
    print()
    print("Next steps:")
    print("1. Review optimized images in:", OUTPUT_DIR)
    print("2. Upload to server using SCP or FTP")
    print("3. Run: npm run build")
    print("4. Deploy to production")
    print()
    
    # Create upload script
    upload_script = Path(__file__).parent / "upload-images.sh"
    with open(upload_script, 'w', encoding='utf-8') as f:
        f.write(f"""#!/bin/bash
# Upload optimized images to server

echo "Uploading church photos to server..."

# Upload church interior photos
scp {OUTPUT_DIR}/church-interior-*.jpg root@samanabyar.online:/root/Mychurch/public/church-photos/

# Upload placeholder icons
scp {OUTPUT_DIR}/apple.png root@samanabyar.online:/root/Mychurch/public/images/
scp {OUTPUT_DIR}/google.png root@samanabyar.online:/root/Mychurch/public/images/
scp {OUTPUT_DIR}/card.png root@samanabyar.online:/root/Mychurch/public/images/

echo "✅ Upload complete!"
echo "Now rebuild and deploy:"
echo "  ssh root@samanabyar.online 'cd /root/Mychurch && npm run build'"
""")
    
    print(f"📤 Upload script created: {upload_script}")
    print(f"   Run: bash {upload_script.name}")

if __name__ == '__main__':
    main()
