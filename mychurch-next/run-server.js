const fs = require('fs');
const path = require('path');
const http = require('http');
const { spawn } = require('child_process');

// 0. Load environment variables before doing anything else
try {
    const dotenv = require('dotenv');
    const envLocal = path.join(__dirname, '.env.local');
    const envProd = path.join(__dirname, '.env.production');
    const envBase = path.join(__dirname, '.env');
    if (fs.existsSync(envBase)) dotenv.config({ path: envBase });
    if (fs.existsSync(envProd)) dotenv.config({ path: envProd, override: true });
    if (fs.existsSync(envLocal)) dotenv.config({ path: envLocal, override: true });
    console.log('[MyChurch] Environment variables loaded from .env.local / .env');
} catch (e) {
    console.warn('[MyChurch] Failed to load dotenv:', e.message);
}

const PUBLIC_PORT = parseInt(process.env.PORT || '3000', 10);
const INTERNAL_PORT = PUBLIC_PORT + 1; // 3001

const MIME_TYPES = {
    '.css': 'text/css; charset=utf-8',
    '.js': 'application/javascript; charset=utf-8',
    '.mjs': 'application/javascript; charset=utf-8',
    '.json': 'application/json; charset=utf-8',
    '.png': 'image/png',
    '.jpg': 'image/jpeg',
    '.jpeg': 'image/jpeg',
    '.gif': 'image/gif',
    '.svg': 'image/svg+xml',
    '.ico': 'image/x-icon',
    '.webp': 'image/webp',
    '.avif': 'image/avif',
    '.woff': 'font/woff',
    '.woff2': 'font/woff2',
    '.ttf': 'font/ttf',
    '.otf': 'font/otf',
    '.txt': 'text/plain; charset=utf-8',
    '.mp3': 'audio/mpeg',
    '.mp4': 'video/mp4',
};

// 1. Find Standalone Server
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

// 2. Sync public and static folders to all possible standalone destinations
function syncAssets() {
    const staticSrc = path.join(__dirname, '.next', 'static');
    const publicSrc = path.join(__dirname, 'public');

    const destDirs = [
        path.join(__dirname, '.next', 'standalone'),
        path.join(__dirname, '.next', 'standalone', 'mychurch-next'),
    ];

    for (const d of destDirs) {
        if (fs.existsSync(d)) {
            // Sync public
            if (fs.existsSync(publicSrc)) {
                try {
                    fs.cpSync(publicSrc, path.join(d, 'public'), { recursive: true });
                } catch (e) {}
            }
            // Sync static
            if (fs.existsSync(staticSrc)) {
                try {
                    const destStatic = path.join(d, '.next', 'static');
                    fs.mkdirSync(path.dirname(destStatic), { recursive: true });
                    fs.cpSync(staticSrc, destStatic, { recursive: true });
                } catch (e) {}
            }
        }
    }
}

syncAssets();

if (serverFile) {
    console.log(`[MyChurch] Standalone server detected: ${serverFile}`);

    // Set internal port for Next.js standalone process
    process.env.PORT = String(INTERNAL_PORT);
    process.env.HOSTNAME = '127.0.0.1';

    // Start Next.js standalone in background
    require(serverFile);
    console.log(`[MyChurch] Next.js standalone listening on internal port ${INTERNAL_PORT}`);

    // Create front-facing proxy server on PUBLIC_PORT
    const server = http.createServer((req, res) => {
        const parsedUrl = new URL(req.url, `http://${req.headers.host || 'localhost'}`);
        const pathname = decodeURIComponent(parsedUrl.pathname);

        // 🚀 Directly serve static files from .next/static
        if (pathname.startsWith('/_next/static/')) {
            const relPath = pathname.slice('/_next/static/'.length);
            const filePath = path.join(__dirname, '.next', 'static', relPath);

            if (fs.existsSync(filePath) && fs.statSync(filePath).isFile()) {
                const ext = path.extname(filePath).toLowerCase();
                const contentType = MIME_TYPES[ext] || 'application/octet-stream';
                res.writeHead(200, {
                    'Content-Type': contentType,
                    'Cache-Control': 'public, max-age=31536000, immutable',
                });
                return fs.createReadStream(filePath).pipe(res);
            }
        }

        // 🚀 Directly serve public static files if available
        if (pathname !== '/' && !pathname.startsWith('/api/') && !pathname.startsWith('/_next/')) {
            const pubFile = path.join(__dirname, 'public', pathname);
            if (fs.existsSync(pubFile) && fs.statSync(pubFile).isFile()) {
                const ext = path.extname(pubFile).toLowerCase();
                const contentType = MIME_TYPES[ext] || 'application/octet-stream';
                res.writeHead(200, {
                    'Content-Type': contentType,
                    'Cache-Control': 'public, max-age=86400',
                });
                return fs.createReadStream(pubFile).pipe(res);
            }
        }

        // 🔁 Proxy all other requests to Next.js internal server
        const proxyReq = http.request({
            hostname: '127.0.0.1',
            port: INTERNAL_PORT,
            path: req.url,
            method: req.method,
            headers: req.headers,
        }, (proxyRes) => {
            res.writeHead(proxyRes.statusCode, proxyRes.headers);
            proxyRes.pipe(res);
        });

        proxyReq.on('error', (err) => {
            console.error('[Proxy Error]', err.message);
            if (!res.headersSent) {
                res.writeHead(502, { 'Content-Type': 'text/plain; charset=utf-8' });
                res.end('Next.js service booting... Please reload in a few seconds.');
            }
        });

        req.pipe(proxyReq);
    });

    // Handle WebSocket Upgrades
    server.on('upgrade', (req, socket, head) => {
        const proxyReq = http.request({
            hostname: '127.0.0.1',
            port: INTERNAL_PORT,
            path: req.url,
            method: req.method,
            headers: req.headers,
        });

        proxyReq.on('upgrade', (proxyRes, proxySocket, proxyHead) => {
            socket.write(`HTTP/1.1 101 Switching Protocols\r\n`);
            for (const [key, value] of Object.entries(proxyRes.headers)) {
                socket.write(`${key}: ${value}\r\n`);
            }
            socket.write('\r\n');
            proxySocket.pipe(socket);
            socket.pipe(proxySocket);
        });

        proxyReq.on('error', () => {
            socket.destroy();
        });

        proxyReq.end();
    });

    server.listen(PUBLIC_PORT, '0.0.0.0', () => {
        console.log(`[MyChurch] Universal proxy server listening on port ${PUBLIC_PORT}`);
    });
} else {
    console.log('[MyChurch] Standalone server not found. Starting with next start...');
    const nextBin = path.join(__dirname, 'node_modules', '.bin', process.platform === 'win32' ? 'next.cmd' : 'next');
    const child = spawn(nextBin, ['start', '-p', String(PUBLIC_PORT)], { stdio: 'inherit' });
    child.on('exit', (code) => process.exit(code || 0));
}
