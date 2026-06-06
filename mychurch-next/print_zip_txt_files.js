const fs = require('fs');
const JSZip = require('jszip');

const zipPath = "C:\\Users\\SamYar\\Downloads\\Music\\Worship Center - MyChurch_2_all_files.zip";

async function run() {
    const data = fs.readFileSync(zipPath);
    const zip = new JSZip();
    const loadedZip = await zip.loadAsync(data);

    const txtFiles = Object.values(loadedZip.files).filter(f => f.name.endsWith('.txt'));
    for (const file of txtFiles) {
        console.log(`\n--- File: ${file.name} ---`);
        const text = await file.async('text');
        console.log(text.split('\n').slice(0, 10).join('\n'));
    }
}

run().catch(console.error);
