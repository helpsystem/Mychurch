const fs = require('fs');
const path = require('path');
const { spawn } = require('child_process');

let serverFile = null;
const possiblePaths = [
    path.join(__dirname, '.next', 'standalone', 'server.js'),
    path.join(__dirname, '.next', 'standalone', 'mychurch-next', 'server.js'),
];

for (const p of possiblePaths) {
    if (fs.existsSync(p)) {
        serverFile = p;
        break;
    }
}

if (serverFile) {
    console.log(`[MyChurch] Starting Next.js standalone server: ${serverFile}`);
    const standaloneDir = path.dirname(serverFile);
    
    // Copy public directory to standalone if needed
    const publicSrc = path.join(__dirname, 'public');
    const publicDest = path.join(standaloneDir, 'public');
    if (fs.existsSync(publicSrc) && !fs.existsSync(publicDest)) {
        try {
            fs.cpSync(publicSrc, publicDest, { recursive: true });
            console.log('[MyChurch] Copied public/ to standalone/public');
        } catch (e) {
            console.error('[MyChurch] Error copying public to standalone:', e);
        }
    }

    // Copy .next/static to standalone/.next/static if needed
    const staticSrc = path.join(__dirname, '.next', 'static');
    const staticDest = path.join(standaloneDir, '.next', 'static');
    if (fs.existsSync(staticSrc) && !fs.existsSync(staticDest)) {
        try {
            fs.mkdirSync(path.dirname(staticDest), { recursive: true });
            fs.cpSync(staticSrc, staticDest, { recursive: true });
            console.log('[MyChurch] Copied .next/static to standalone/.next/static');
        } catch (e) {
            console.error('[MyChurch] Error copying static to standalone:', e);
        }
    }

    // Set port environment variable
    process.env.PORT = process.env.PORT || '3000';
    process.env.HOSTNAME = process.env.HOSTNAME || '0.0.0.0';

    // Start server
    require(serverFile);
} else {
    console.log('[MyChurch] Standalone server not found. Starting with next start...');
    const nextBin = path.join(__dirname, 'node_modules', '.bin', process.platform === 'win32' ? 'next.cmd' : 'next');
    const child = spawn(nextBin, ['start', '-p', process.env.PORT || '3000'], { stdio: 'inherit' });
    child.on('exit', (code) => process.exit(code || 0));
}
