import os
import zipfile

def zipdir(path, ziph):
    for root, dirs, files in os.walk(path):
        # Skip development cache folders that cause recursion or not found errors
        if 'dev' in root.split(os.sep) or 'cache' in root.split(os.sep):
            continue
            
        for file in files:
            file_path = os.path.join(root, file)
            try:
                ziph.write(file_path, os.path.relpath(file_path, os.path.join(path, '..')))
            except FileNotFoundError:
                print(f"Skipping missing file: {file_path}")

try:
    print("Zipping Next.js build...")
    zipf = zipfile.ZipFile('next_build.zip', 'w', zipfile.ZIP_DEFLATED)
    zipdir('.next', zipf)
    zipf.close()
    print("Successfully created next_build.zip. Please upload this file to the VPS.")
except Exception as e:
    print(f"Failed to zip: {e}")
