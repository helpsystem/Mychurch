#!/usr/bin/env python3
"""
Quick fix: Create placeholder images directly on server
"""

from PIL import Image, ImageDraw, ImageFont
import os

def create_icon(filename, size, color, text):
    """Create a simple colored icon with text"""
    img = Image.new('RGB', size, color)
    draw = ImageDraw.Draw(img)
    
    # Try to use a default font
    try:
        font = ImageFont.truetype("/usr/share/fonts/truetype/dejavu/DejaVuSans-Bold.ttf", 40)
    except:
        font = ImageFont.load_default()
    
    # Get text bounding box
    bbox = draw.textbbox((0, 0), text, font=font)
    text_width = bbox[2] - bbox[0]
    text_height = bbox[3] - bbox[1]
    
    # Center text
    position = ((size[0] - text_width) // 2, (size[1] - text_height) // 2)
    
    # Draw text
    draw.text(position, text, fill='white', font=font)
    
    # Save
    if filename.endswith('.png'):
        img.save(filename, 'PNG', optimize=True)
    else:
        img.save(filename, 'JPEG', quality=90, optimize=True)
    
    print(f"✅ Created: {filename} ({size[0]}x{size[1]})")

# Create placeholders
os.makedirs('/root/Mychurch/public/images', exist_ok=True)
os.makedirs('/root/Mychurch/public/church-photos', exist_ok=True)
os.makedirs('/root/Mychurch/dist/images', exist_ok=True)
os.makedirs('/root/Mychurch/dist/church-photos', exist_ok=True)

print("Creating placeholder images...")
print()

# Icons
create_icon('/root/Mychurch/public/images/apple.png', (180, 180), (0, 122, 255), '🍎')
create_icon('/root/Mychurch/public/images/google.png', (180, 180), (66, 133, 244), 'G')
create_icon('/root/Mychurch/public/images/card.png', (400, 300), (59, 130, 246), 'Sermon')

# Copy to dist
import shutil
for f in ['apple.png', 'google.png', 'card.png']:
    src = f'/root/Mychurch/public/images/{f}'
    dst = f'/root/Mychurch/dist/images/{f}'
    shutil.copy2(src, dst)
    print(f"📋 Copied to dist: {f}")

print()
print("✅ Placeholder icons created!")
print()
print("For church photos, please upload real photos using:")
print("  scp your-photo.jpg root@samanabyar.online:/root/Mychurch/public/church-photos/church-interior-1.jpg")
