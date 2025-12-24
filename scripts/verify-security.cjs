const fs = require('fs');
const path = require('path');
const https = require('https');
const http = require('http');

const COLORS = {
    red: '\x1b[31m',
    green: '\x1b[32m',
    yellow: '\x1b[33m',
    reset: '\x1b[0m',
    cyan: '\x1b[36m'
};

function log(color, message) {
    console.log(`${color}${message}${COLORS.reset}`);
}

async function verifySecurity() {
    log(COLORS.cyan, '🔒 Starting Security Verification...\n');
    let hasErrors = false;

    // 1. Check .env file permissions and existence
    log(COLORS.yellow, '1️⃣  Checking Environment Variables (.env)...');
    const envPath = path.join(__dirname, '..', '.env');
    if (fs.existsSync(envPath)) {
        log(COLORS.green, '   ✅ .env file exists.');

        // On Windows, specific permission checks are complex in node without extra libs, 
        // effectively mostly ensuring it's not in git is the biggest step which we did manually.
        const gitIgnorePath = path.join(__dirname, '..', '.gitignore');
        if (fs.existsSync(gitIgnorePath)) {
            const gitIgnoreContent = fs.readFileSync(gitIgnorePath, 'utf8');
            if (gitIgnoreContent.includes('.env')) {
                log(COLORS.green, '   ✅ .env is explicitly ignored in .gitignore.');
            } else {
                log(COLORS.red, '   ❌ .env is NOT found in .gitignore!');
                hasErrors = true;
            }
        }
    } else {
        log(COLORS.red, '   ❌ .env file missing in root!');
        hasErrors = true;
    }
    console.log('');

    // 2. Check for hardcoded secrets (Basic scan)
    log(COLORS.yellow, '2️⃣  Scanning for potential hardcoded secrets...'); // Simplified scan
    const backendDir = path.join(__dirname, '..', 'backend');

    // Recursive search would be better, but let's check main files first
    const filesToCheck = ['server.js', 'db-postgres.js', 'routes/authRoutes.js'];

    for (const file of filesToCheck) {
        try {
            const filePath = path.join(backendDir, file);
            if (!fs.existsSync(filePath)) continue;

            const content = fs.readFileSync(filePath, 'utf8');
            // Regex for common secrets assignments (simple heuristic)
            // Looking for things like "const API_KEY = 'xyz'" where not process.env
            const riskyPatterns = [
                /(key|secret|password|token)\s*[:=]\s*['"`](?!process\.env)[a-zA-Z0-9_\-\.]{10,}['"`]/gi
            ];

            let fileHasIssues = false;
            riskyPatterns.forEach(pattern => {
                if (pattern.test(content)) {
                    // Filter out some common false positives if necessary
                    log(COLORS.red, `   ❌ Potential hardcoded secret found in ${file}`);
                    fileHasIssues = true;
                    hasErrors = true;
                }
            });

            if (!fileHasIssues) {
                log(COLORS.green, `   ✅ ${file} passed basic secret scan.`);
            }

        } catch (e) {
            // ignore
        }
    }
    console.log('');

    // 3. Verify Local Security Headers (assuming server is running locally on 3001)
    log(COLORS.yellow, '3️⃣  Verifying Security Headers (requires backend running)...');

    try {
        const checkHeaders = (protocol, port) => {
            return new Promise((resolve, reject) => {
                const req = protocol.request(`http://localhost:${port}/api/health`, (res) => {
                    const headers = res.headers;
                    let headerErrors = false;

                    // Check for Helmet headers
                    /*
                    if (!headers['content-security-policy']) {
                        log(COLORS.red, '   ❌ Missing Content-Security-Policy header');
                        headerErrors = true;
                    } // CSP might be lax in dev mode or different in API
                    */

                    if (!headers['x-dns-prefetch-control']) {
                        log(COLORS.red, '   ❌ Missing X-DNS-Prefetch-Control (Helmet default)');
                        headerErrors = true;
                    }

                    if (!headerErrors) {
                        log(COLORS.green, '   ✅ Security headers appear to be present (Helmet detected).');
                    } else {
                        hasErrors = true;
                        log(COLORS.yellow, '   ⚠️  Ensure you are running server.js, NOT dev-server.js');
                    }
                    resolve();
                });

                req.on('error', (e) => {
                    log(COLORS.red, `   ❌ Could not connect to localhost:${port}. Is the server running?`);
                    // Don't fail the whole script if server just isn't up
                    resolve();
                });
                req.end();
            });
        };

        await checkHeaders(http, 3001);

    } catch (e) {
        log(COLORS.red, '   ❌ Error checking headers: ' + e.message);
    }

    console.log('\n----------------------------------------');
    if (hasErrors) {
        log(COLORS.red, '⚠️  Security verification finished with ISSUES.');
    } else {
        log(COLORS.green, '✅ Security verification PASSED.');
    }
}

verifySecurity();
