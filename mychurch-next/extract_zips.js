const fs = require('fs');
const path = require('path');
const JSZip = require('jszip');

async function extractZip(zipPath, outputDir) {
    console.log(`\nExtracting ${zipPath} to ${outputDir}...`);
    if (!fs.existsSync(zipPath)) {
        console.error(`ZIP file does not exist at: ${zipPath}`);
        return;
    }
    
    if (!fs.existsSync(outputDir)) {
        fs.mkdirSync(outputDir, { recursive: true });
    }
    
    const data = fs.readFileSync(zipPath);
    const zip = await JSZip.loadAsync(data);
    
    for (const filename of Object.keys(zip.files)) {
        const file = zip.files[filename];
        const destPath = path.join(outputDir, filename);
        
        if (file.dir) {
            fs.mkdirSync(destPath, { recursive: true });
        } else {
            // Ensure parent directory exists
            fs.mkdirSync(path.dirname(destPath), { recursive: true });
            const content = await file.async('nodebuffer');
            fs.writeFileSync(destPath, content);
            console.log(`Extracted: ${filename}`);
        }
    }
    console.log("Extraction complete!");
}

async function main() {
    const letterZip = "C:\\Users\\SamYar\\OneDrive\\mychurch-next\\letter temp.zip";
    const translateZip = "C:\\Users\\SamYar\\OneDrive\\mychurch-next\\translate.zip";
    
    const letterOut = path.join(__dirname, "extracted_letter_temp");
    const translateOut = path.join(__dirname, "extracted_translate");
    
    await extractZip(letterZip, letterOut);
    await extractZip(translateZip, translateOut);
}

main().catch(err => console.error(err));
