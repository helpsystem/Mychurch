/**
 * Google Messages for Web — SMS Gateway Service
 * Uses Puppeteer to automate messages.google.com
 * Allows sending SMS from your Android phone via web without Twilio
 */

import path from 'path';
import fs from 'fs';

type Browser = any;
type Page = any;

const SESSION_DIR = process.env.GOOGLE_MESSAGES_SESSION_DIR || '/root/.google-messages-session';
const MESSAGES_URL = 'https://messages.google.com/web/';

let _browser: Browser | null = null;
let _page: Page | null = null;
let _isPaired = false;

async function ensureBrowser(): Promise<{ browser: Browser; page: Page }> {
    if (_browser && _page && !_page.isClosed()) {
        return { browser: _browser, page: _page };
    }

    console.log('[GoogleMessages] 🚀 Launching browser...');
    
    // Ensure session directory exists
    if (!fs.existsSync(SESSION_DIR)) {
        fs.mkdirSync(SESSION_DIR, { recursive: true });
    }

    let puppeteerModule: any;
    try {
        const req = eval('require');
        try {
            puppeteerModule = req('puppeteer-core');
        } catch {
            puppeteerModule = req('puppeteer');
        }
    } catch {
        throw new Error('Neither puppeteer-core nor puppeteer is installed.');
    }

    const launchArgs = [
        '--no-sandbox',
        '--disable-setuid-sandbox',
        '--disable-dev-shm-usage',
        '--disable-accelerated-2d-canvas',
        '--no-first-run',
        '--no-zygote',
        '--disable-gpu',
    ];

    const launchOptions: any = {
        headless: true,
        args: launchArgs,
        userDataDir: SESSION_DIR,
    };

    if (process.platform === 'linux' && fs.existsSync('/usr/bin/google-chrome')) {
        launchOptions.executablePath = '/usr/bin/google-chrome';
    }

    try {
        _browser = await puppeteerModule.launch(launchOptions);
    } catch (launchErr: any) {
        if (launchErr.message && launchErr.message.includes('already running')) {
            console.warn('[GoogleMessages] Stale Chrome instance detected. Terminating orphaned processes...');
            try {
                const req = eval('require');
                const cp = req('child_process');
                cp.execSync('pkill -f "chrome.*google-messages-session" || true');
                await new Promise(r => setTimeout(r, 1500));
                _browser = await puppeteerModule.launch(launchOptions);
            } catch (err: any) {
                console.error('[GoogleMessages] Failed to relaunch after kill:', err.message);
                throw launchErr;
            }
        } else {
            throw launchErr;
        }
    }

    _page = await _browser.newPage();
    await _page.setUserAgent(
        'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
    );

    return { browser: _browser, page: _page };
}

/**
 * Check if Google Messages is already paired/logged in
 */
export async function checkGoogleMessagesPairing(): Promise<{ paired: boolean; qrCodeDataUrl?: string }> {
    try {
        const { page } = await ensureBrowser();
        
        await page.goto(MESSAGES_URL, { waitUntil: 'networkidle2', timeout: 30000 });

        // Wait a bit for the page to settle
        await new Promise(r => setTimeout(r, 3000));

        // Check if we're on the main messages view (paired)
        const isMainView = await page.$('mws-conversations-list, [data-e2e-new-conversation-button]').catch(() => null);
        if (isMainView) {
            console.log('[GoogleMessages] ✅ Already paired and logged in');
            _isPaired = true;
            return { paired: true };
        }

        // Try to ensure "Remember this computer" is checked
        try {
            await page.evaluate(() => {
                const checkbox = (document.querySelector('[data-e2e-remember-this-computer]') || document.querySelector('input[type="checkbox"]')) as HTMLInputElement;
                if (checkbox && !checkbox.checked) checkbox.click();
            });
        } catch {}

        // Multi-strategy QR extraction for modern Google Messages Web:
        // Strategy 1: Look for <img> tags rendered with data:image base64 PNG
        let qrDataUrl = await page.evaluate(() => {
            const imgs = Array.from(document.querySelectorAll('img'));
            const qrImg = imgs.find(i => i.src && i.src.startsWith('data:image') && i.src.length > 500);
            if (qrImg && qrImg.src) return qrImg.src;

            const canvas = document.querySelector('canvas') as HTMLCanvasElement;
            if (canvas) {
                try {
                    const data = canvas.toDataURL();
                    if (data && data.length > 500) return data;
                } catch {}
            }
            return null;
        });

        // Strategy 2: If img/canvas didn't yield, take direct screenshot of the QR element
        if (!qrDataUrl) {
            const qrElement = await page.$('mw-qr-code, .qr-container, [class*="qr-code"], mw-authentication-instructions').catch(() => null);
            if (qrElement) {
                const shot = await qrElement.screenshot({ encoding: 'base64' }).catch(() => null);
                if (shot && shot.length > 500) {
                    qrDataUrl = `data:image/png;base64,${shot}`;
                }
            }
        }

        if (qrDataUrl) {
            console.log('[GoogleMessages] 📱 QR code extracted successfully for pairing');
            return { paired: false, qrCodeDataUrl: qrDataUrl };
        }

        console.log('[GoogleMessages] ⚠️ QR code element not found or still rendering');
        return { paired: false };
    } catch (err: any) {
        console.error('[GoogleMessages] ❌ Error checking pairing:', err.message);
        return { paired: false };
    }
}

/**
 * Send an SMS via Google Messages for Web
 */
export async function sendSMSViaGoogleMessages(phoneNumber: string, text: string): Promise<boolean> {
    try {
        const { page } = await ensureBrowser();

        // First ensure we're on the messages page
        const currentUrl = page.url();
        if (!currentUrl.includes('messages.google.com')) {
            await page.goto(MESSAGES_URL, { waitUntil: 'networkidle2', timeout: 30000 });
            await new Promise(r => setTimeout(r, 2000));
        }

        // Check if paired
        const pairedStatus = await checkGoogleMessagesPairing();
        if (!pairedStatus.paired) {
            console.error('[GoogleMessages] ❌ Not paired — cannot send SMS');
            return false;
        }

        // Click "Start chat" / New conversation button
        const newChatBtn = await page.$('[data-e2e-new-conversation-button], mws-new-conversation-button button, [aria-label="Start chat"]').catch(() => null);
        if (!newChatBtn) {
            console.error('[GoogleMessages] ❌ Could not find new chat button');
            return false;
        }
        await newChatBtn.click();
        await new Promise(r => setTimeout(r, 1500));

        // Type phone number in search/recipient field
        const recipientInput = await page.$('[data-e2e-new-conversation-name-field], input[placeholder*="name"], input[type="search"]').catch(() => null);
        if (!recipientInput) {
            console.error('[GoogleMessages] ❌ Could not find recipient input');
            return false;
        }

        // Normalize phone number — ensure it has country code
        const normalizedPhone = phoneNumber.startsWith('+') ? phoneNumber : `+${phoneNumber}`;
        await recipientInput.type(normalizedPhone, { delay: 50 });
        await new Promise(r => setTimeout(r, 1500));

        // Press Enter or click the suggested contact
        await page.keyboard.press('Enter');
        await new Promise(r => setTimeout(r, 1500));

        // Click "Send a message" or the conversation start button
        const startBtn = await page.$('[data-e2e-action-button], button[type="submit"]').catch(() => null);
        if (startBtn) {
            await startBtn.click();
            await new Promise(r => setTimeout(r, 1500));
        }

        // Type the message
        const messageInput = await page.$('[data-e2e-message-input-box], textarea[aria-label="Message"]').catch(() => null);
        if (!messageInput) {
            console.error('[GoogleMessages] ❌ Could not find message input');
            return false;
        }
        
        await messageInput.click();
        await messageInput.type(text, { delay: 30 });
        await new Promise(r => setTimeout(r, 500));

        // Press Enter to send
        await page.keyboard.press('Enter');
        await new Promise(r => setTimeout(r, 1000));

        console.log(`[GoogleMessages] ✅ SMS sent to ${normalizedPhone}`);
        return true;

    } catch (err: any) {
        console.error('[GoogleMessages] ❌ Failed to send SMS:', err.message);
        return false;
    }
}

/**
 * Get a fresh QR code screenshot for pairing UI
 */
export async function getGoogleMessagesQRCode(): Promise<string | null> {
    try {
        const { page } = await ensureBrowser();
        await page.goto(MESSAGES_URL, { waitUntil: 'networkidle2', timeout: 30000 });
        await new Promise(r => setTimeout(r, 3000));

        let qrDataUrl = await page.evaluate(() => {
            const imgs = Array.from(document.querySelectorAll('img'));
            const qrImg = imgs.find(i => i.src && i.src.startsWith('data:image') && i.src.length > 500);
            if (qrImg && qrImg.src) return qrImg.src;

            const canvas = document.querySelector('canvas') as HTMLCanvasElement;
            if (canvas) {
                try {
                    const data = canvas.toDataURL();
                    if (data && data.length > 500) return data;
                } catch {}
            }
            return null;
        });

        if (!qrDataUrl) {
            const qrElement = await page.$('mw-qr-code, .qr-container, [class*="qr-code"], mw-authentication-instructions').catch(() => null);
            if (qrElement) {
                const shot = await qrElement.screenshot({ encoding: 'base64' }).catch(() => null);
                if (shot && shot.length > 500) {
                    qrDataUrl = `data:image/png;base64,${shot}`;
                }
            }
        }
        
        return qrDataUrl;
    } catch (err: any) {
        console.error('[GoogleMessages] ❌ Failed to get QR code:', err.message);
        return null;
    }
}
