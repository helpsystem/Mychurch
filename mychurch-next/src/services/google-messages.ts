/**
 * Google Messages for Web — SMS Gateway Service
 * Uses Puppeteer to automate messages.google.com
 * Allows sending SMS from your Android phone via web without Twilio
 */

import puppeteer, { Browser, Page } from 'puppeteer';
import path from 'path';
import fs from 'fs';

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

    _browser = await puppeteer.launch({
        headless: true,
        args: [
            '--no-sandbox',
            '--disable-setuid-sandbox',
            '--disable-dev-shm-usage',
            '--disable-accelerated-2d-canvas',
            '--no-first-run',
            '--no-zygote',
            '--disable-gpu',
        ],
        userDataDir: SESSION_DIR, // Persist session across restarts
    });

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
        const isMainView = await page.$('mws-conversations-list').catch(() => null);
        if (isMainView) {
            console.log('[GoogleMessages] ✅ Already paired and logged in');
            _isPaired = true;
            return { paired: true };
        }

        // Check for QR code
        const qrElement = await page.$('mw-qr-code').catch(() => null);
        if (qrElement) {
            const qrCanvas = await page.$('canvas').catch(() => null);
            if (qrCanvas) {
                const qrDataUrl = await page.evaluate(() => {
                    const canvas = document.querySelector('canvas') as HTMLCanvasElement;
                    return canvas ? canvas.toDataURL() : null;
                });
                console.log('[GoogleMessages] 📱 QR code available for pairing');
                return { paired: false, qrCodeDataUrl: qrDataUrl || undefined };
            }
        }

        // Try to find pairing button or remember this device option
        const rememberDeviceBtn = await page.$('[data-e2e-remember-this-computer]').catch(() => null);
        if (rememberDeviceBtn) {
            await page.evaluate(() => {
                const checkbox = document.querySelector('[data-e2e-remember-this-computer]') as HTMLInputElement;
                if (checkbox && !checkbox.checked) checkbox.click();
            });
        }

        // Screenshot for debugging
        const screenshot = await page.screenshot({ encoding: 'base64' });
        console.log('[GoogleMessages] ⚠️ Unknown state — check screenshot');
        
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

        const qrDataUrl = await page.evaluate(() => {
            const canvas = document.querySelector('canvas') as HTMLCanvasElement;
            return canvas ? canvas.toDataURL() : null;
        });
        
        return qrDataUrl;
    } catch (err: any) {
        console.error('[GoogleMessages] ❌ Failed to get QR code:', err.message);
        return null;
    }
}
