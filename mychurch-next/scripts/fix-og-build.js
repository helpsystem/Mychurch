const fs = require('fs');
const path = require('path');

const srcDir = path.join(__dirname, '..', 'src', 'app');
const publicDir = path.join(__dirname, '..', 'public');
const sourceLogo = 'C:\\Users\\SamYar\\.gemini\\antigravity-ide\\brain\\5c16f79e-26e0-4e21-aaa9-bb93a87c2bf2\\church_official_logo_1787949944977.jpg';

// 1. Remove problematic dynamic font files that break Satori build
const filesToRemove = [
  path.join(srcDir, 'opengraph-image.tsx'),
  path.join(srcDir, 'twitter-image.tsx'),
];

filesToRemove.forEach((f) => {
  if (fs.existsSync(f)) {
    fs.unlinkSync(f);
    console.log('Removed:', f);
  }
});

// 2. Ensure public/og-image.jpg exists
if (fs.existsSync(sourceLogo)) {
  const dest = path.join(publicDir, 'og-image.jpg');
  fs.copyFileSync(sourceLogo, dest);
  console.log('Created static:', dest);
}

console.log('Fix complete.');
