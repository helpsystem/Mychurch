const fs = require('fs');
const path = require('path');

// Sources of the AI generated images
const javadSrc = "C:\\Users\\SamYar\\.gemini\\antigravity\\brain\\649fd653-6363-4995-a2d4-bca7421103eb\\pastor_javad_1772807309802.png";
const naziSrc = "C:\\Users\\SamYar\\.gemini\\antigravity\\brain\\649fd653-6363-4995-a2d4-bca7421103eb\\nazi_rasti_1772807322799.png";

const destDir = path.join(process.cwd(), 'public', 'images');

// Create the directory if it doesn't exist
if (!fs.existsSync(destDir)) {
    fs.mkdirSync(destDir, { recursive: true });
    console.log("Created directory:", destDir);
}

// Destination paths (keeping the same filenames as expected by the frontend: pastor-javad-real.jpg and leader-nazi-real.jpg, though they are pngs)
const javadDest = path.join(destDir, 'pastor-javad-real.jpg');
const naziDest = path.join(destDir, 'leader-nazi-real.jpg');

try {
    if (fs.existsSync(javadSrc)) {
        fs.copyFileSync(javadSrc, javadDest);
        console.log("Copied Javad photo to", javadDest);
    } else {
        console.log("Source not found:", javadSrc);
    }

    if (fs.existsSync(naziSrc)) {
        fs.copyFileSync(naziSrc, naziDest);
        console.log("Copied Nazi photo to", naziDest);
    } else {
        console.log("Source not found:", naziSrc);
    }
    console.log("Image setup complete.");
} catch (e) {
    console.error("Error copying images:", e);
}
