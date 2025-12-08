const fs = require('fs');
const path = require('path');

const TARGET_DIRS = [
    'D:\\Bible',
    'D:\\fa_new',
    'D:\\Windows.old\\Users\\Sami\\Desktop\\Iran Church DC\\En Fr Bible'
];

const OUTPUT_FILE = path.join(__dirname, '../../backend/data/external_bible_scan.json');

function scanDirectory(dirPath) {
    if (!fs.existsSync(dirPath)) {
        return { error: 'Directory not found', path: dirPath };
    }

    const results = {
        path: dirPath,
        mp3: [],
        html: [],
        txt: [],
        structure: {} // To see folder hierarchy
    };

    try {
        const files = fs.readdirSync(dirPath, { recursive: true });

        files.forEach(file => {
            // file is relative path from dirPath in newer node versions with recursive:true, 
            // but let's handle standard readdir if recursive not supported or just flat list
            // Actually recursive option is Node 20+. Let's assume standard recursion needed if older node.
            // For safety, let's use a simple recursive walker.
        });
    } catch (e) {
        // Fallback for older node or permission issues
    }

    // Custom recursive walker
    function walk(currentDir, relativePath = '') {
        try {
            const list = fs.readdirSync(currentDir);
            list.forEach(file => {
                const fullPath = path.join(currentDir, file);
                const relPath = path.join(relativePath, file);
                try {
                    const stat = fs.statSync(fullPath);
                    if (stat.isDirectory()) {
                        walk(fullPath, relPath);
                    } else {
                        const ext = path.extname(file).toLowerCase();
                        if (['.mp3', '.wav'].includes(ext)) {
                            results.mp3.push(relPath);
                        } else if (['.html', '.htm'].includes(ext)) {
                            results.html.push(relPath);
                        } else if (['.txt'].includes(ext)) {
                            results.txt.push(relPath);
                        }

                        // Capture structure sample (first 5 files of each folder)
                        const dirName = path.dirname(relPath);
                        if (!results.structure[dirName]) results.structure[dirName] = [];
                        if (results.structure[dirName].length < 5) results.structure[dirName].push(file);
                    }
                } catch (err) {
                    // Ignore access errors
                }
            });
        } catch (err) {
            console.error(`Error reading ${currentDir}: ${err.message}`);
        }
    }

    walk(dirPath);
    return results;
}

console.log('🔍 Scanning external Bible directories...');
const allResults = TARGET_DIRS.map(dir => scanDirectory(dir));

fs.writeFileSync(OUTPUT_FILE, JSON.stringify(allResults, null, 2));
console.log(`✅ Scan complete. Results saved to ${OUTPUT_FILE}`);
