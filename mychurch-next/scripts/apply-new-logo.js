const fs = require('fs');
const path = require('path');

const sourcePath = 'C:\\Users\\SamYar\\.gemini\\antigravity-ide\\brain\\5c16f79e-26e0-4e21-aaa9-bb93a87c2bf2\\church_official_logo_1787949944977.jpg';
const publicDir = path.join(__dirname, '..', 'public');

if (!fs.existsSync(sourcePath)) {
  console.error('Source image not found at:', sourcePath);
  process.exit(1);
}

const buffer = fs.readFileSync(sourcePath);

const targets = [
  'logo.png',
  'logo-transparent.png',
  'favicon.ico',
  'apple-touch-icon.png',
];

targets.forEach((fileName) => {
  const destPath = path.join(publicDir, fileName);
  fs.writeFileSync(destPath, buffer);
  console.log(`Updated: ${fileName} (${(buffer.length / 1024).toFixed(1)} KB)`);
});

console.log('All logo assets successfully updated!');
