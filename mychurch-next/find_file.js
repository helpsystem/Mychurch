const fs = require('fs');
const path = require('path');

const audioDir = path.join(__dirname, 'public', 'worship', 'audio', 'kalameh');
const files = fs.readdirSync(audioDir);

console.log("=== SEARCHING FOR 'آمد' ===");
files.forEach(f => {
    if (f.includes("آمد") || f.includes("امد") || f.includes("مسیح") || f.includes("masih")) {
        console.log(`- File: "${f}" | Charcodes: ${f.split('').map(c => c.charCodeAt(0)).join(',')}`);
    }
});
