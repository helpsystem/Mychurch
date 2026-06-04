const fs = require('fs');
const JSZip = require('jszip');

async function main() {
    try {
        const zipPath = "C:\\Users\\SamYar\\Downloads\\Music\\Worship Center - MyChurch_2_all_files.zip";
        console.log("Reading ZIP file:", zipPath);
        if (!fs.existsSync(zipPath)) {
            console.error("ZIP file does not exist!");
            return;
        }

        const data = fs.readFileSync(zipPath);
        const zip = await JSZip.loadAsync(data);
        
        console.log("=== FILES INSIDE ZIP ===");
        for (const filename of Object.keys(zip.files)) {
            console.log("-", filename);
            // If it's a json file, let's print a part of it
            if (filename.endsWith('.json') && !zip.files[filename].dir) {
                const content = await zip.files[filename].async('string');
                console.log(`--- Content of ${filename} (first 800 chars) ---`);
                console.log(content.substring(0, 800));
            }
        }
    } catch (e) {
        console.error(e);
    }
}

main();
