const fs = require('fs');
const JSZip = require('jszip');

const zipPath = "C:\\Users\\SamYar\\Downloads\\Music\\Worship Center - MyChurch_2_all_files.zip";

async function run() {
    const data = fs.readFileSync(zipPath);
    const zip = new JSZip();
    const loadedZip = await zip.loadAsync(data);

    const masterFileEntry = Object.values(loadedZip.files).find(f => f.name.endsWith('project_master.json'));
    if (!masterFileEntry) return;

    const text = await masterFileEntry.async('text');
    const masterJson = JSON.parse(text);

    console.log("Finglish type:", typeof masterJson.translations?.finglish);
    console.log("Finglish value:", JSON.stringify(masterJson.translations?.finglish, null, 2));
}

run().catch(console.error);
