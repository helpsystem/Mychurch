import sys
try:
    from PIL import Image
except ImportError:
    print("Pillow not found, skipping or needs install")
    sys.exit(1)

input_path = "d:/Windows.old/Users/Sami/Desktop/Iran Church DC/Git/Mychurch/mychurch-next/public/logo.png"
output_path = "d:/Windows.old/Users/Sami/Desktop/Iran Church DC/Git/Mychurch/mychurch-next/public/logo-transparent.png"
print(f"Opening {input_path}")
img = Image.open(input_path)
img = img.convert("RGBA")

datas = img.getdata()
newData = []

for item in datas:
    # Remove white or near-white background
    if item[0] > 230 and item[1] > 230 and item[2] > 230:
        newData.append((255, 255, 255, 0))
    else:
        newData.append(item)

img.putdata(newData)
img.save(output_path, "PNG")
print(f"Saved transparent logo to {output_path}")
