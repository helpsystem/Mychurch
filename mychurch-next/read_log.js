const fs = require('fs');
const path = require('path');

function convertUtf16ToUtf8(srcFile, destFile) {
    const srcPath = path.join(__dirname, srcFile);
    const destPath = path.join(__dirname, destFile);

    if (!fs.existsSync(srcPath)) {
        console.log(`Source file does not exist: ${srcFile}`);
        return;
    }

    const content = fs.readFileSync(srcPath, 'utf16le');
    fs.writeFileSync(destPath, content, 'utf8');
    console.log(`Successfully converted ${srcFile} (UTF-16LE) to ${destFile} (UTF-8).`);
}

convertUtf16ToUtf8('deploy_run_latest.log', 'deploy_run_latest_utf8.txt');
convertUtf16ToUtf8('deploy_run.log', 'deploy_run_utf8.txt');
