const fs = require('fs');
const path = require('path');
const JSZip = require('jszip');

const zipPath = "C:\\Users\\SamYar\\Downloads\\Music\\Worship Center - MyChurch_2_all_files.zip";

async function inspect() {
    if (!fs.existsSync(zipPath)) {
        console.error("ZIP file does not exist at:", zipPath);
        return;
    }

    console.log("Reading ZIP:", zipPath);
    const data = fs.readFileSync(zipPath);
    const zip = new JSZip();
    const loadedZip = await zip.loadAsync(data);

    console.log("\n--- List of files in ZIP ---");
    const files = Object.keys(loadedZip.files);
    files.forEach(name => {
        const file = loadedZip.files[name];
        console.log(`- ${name} (dir: ${file.dir}, size: ${file._data?.uncompressedSize || 0} bytes)`);
    });

    // Check for JSON files and inspect their structure
    for (const name of files) {
        if (name.endsWith('.json')) {
            console.log(`\n--- Inspecting JSON file: ${name} ---`);
            try {
                const text = await loadedZip.files[name].async('text');
                const parsed = JSON.parse(text);
                console.log("Keys available in root:", Object.keys(parsed));
                
                if (Array.isArray(parsed)) {
                    console.log(`It is a JSON Array. Length: ${parsed.length}`);
                    console.log("Sample element:", JSON.stringify(parsed[0], null, 2).substring(0, 300));
                } else {
                    console.log("Sample root values (first 300 chars of stringified):", JSON.stringify(parsed, null, 2).substring(0, 500));
                    if (parsed.metadata) {
                        console.log("Metadata:", parsed.metadata);
                    }
                    if (parsed.translations) {
                        console.log("Translations structure keys:", Object.keys(parsed.translations));
                    }
                    if (parsed.original) {
                        console.log("Original structure keys:", Object.keys(parsed.original));
                        if (parsed.original.lines) {
                            console.log(`Original lines count: ${parsed.original.lines.length}`);
                            console.log("First line:", JSON.stringify(parsed.original.lines[0], null, 2));
                        }
                    }
                }
            } catch (e) {
                console.error(`Failed to parse/read JSON file ${name}:`, e.message);
            }
        }
    }
}

inspect().catch(err => console.error(err));
