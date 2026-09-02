const os = require('os');
const { execSync } = require('child_process');
const nodemailer = require('nodemailer');
const fs = require('fs');
const path = require('path');

// --- 1. Load Environment Variables ---
const envPath = path.join(__dirname, '..', '.env.local');
if (fs.existsSync(envPath)) {
    require('dotenv').config({ path: envPath });
} else {
    require('dotenv').config();
}

// --- 2. Configuration ---
const CHECK_INTERVAL_MS = 60 * 1000 * 5; // Every 5 minutes
const ALERT_EMAIL = 'help.system@ymail.com';

const transporter = nodemailer.createTransport({
    host: process.env.SMTP_HOST || 'smtp.gmail.com',
    port: process.env.SMTP_PORT || 587,
    secure: false,
    auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASS,
    },
});

// --- 3. State Tracking ---
// We track the "bucket" (e.g., 50, 60, 70, 80). 0 means below 50%.
let lastState = {
    cpu: 0,
    ram: 0,
    disk: 0
};

// Calculate which bucket the value falls into
function getBucket(value) {
    if (value < 50) return 0;
    return Math.floor(value / 10) * 10; // e.g., 54 -> 50, 68 -> 60, 95 -> 90
}

// --- 4. Resource Checkers ---

// CPU Tracker (requires two samples to calculate delta)
function getCpuUsage() {
    return new Promise((resolve) => {
        const start = getCpuTicks();
        setTimeout(() => {
            const end = getCpuTicks();
            const idleDifference = end.idle - start.idle;
            const totalDifference = end.total - start.total;
            const percentage = 100 - ~~(100 * idleDifference / totalDifference);
            resolve(percentage);
        }, 1000);
    });
}

function getCpuTicks() {
    const cpus = os.cpus();
    let idle = 0;
    let total = 0;
    for (let cpu in cpus) {
        if (!cpus.hasOwnProperty(cpu)) continue;
        for (let type in cpus[cpu].times) {
            total += cpus[cpu].times[type];
        }
        idle += cpus[cpu].times.idle;
    }
    return { idle, total };
}

// RAM Tracker
function getRamUsage() {
    const total = os.totalmem();
    const free = os.freemem();
    const used = total - free;
    return Math.round((used / total) * 100);
}

// Disk Tracker
function getDiskUsage() {
    try {
        const platform = os.platform();
        if (platform === 'linux' || platform === 'darwin') {
            const output = execSync('df -k / | tail -1 | awk \'{print $5}\'', { encoding: 'utf8' });
            return parseInt(output.replace('%', '').trim(), 10) || 0;
        } else {
            return 0; // Not easily done natively on Windows without wmic, returning 0
        }
    } catch (e) {
        return 0;
    }
}

// --- 5. Email Generator ---
function getColor(percent) {
    if (percent < 50) return '#22c55e'; // Green
    if (percent < 80) return '#eab308'; // Yellow
    return '#ef4444'; // Red
}

function generateProgressHtml(label, percent, isTrigger = false) {
    const color = getColor(percent);
    const triggerBadge = isTrigger ? '<span style="background:#ef4444;color:white;padding:2px 6px;border-radius:4px;font-size:12px;margin-left:10px;">TRIGGERED</span>' : '';
    
    return `
    <div style="margin-bottom: 20px; font-family: Arial, sans-serif;">
        <div style="display: flex; justify-content: space-between; margin-bottom: 5px;">
            <strong>${label}</strong>
            <span>${percent}% ${triggerBadge}</span>
        </div>
        <div style="width: 100%; background-color: #e5e7eb; border-radius: 8px; overflow: hidden; height: 20px;">
            <div style="width: ${percent}%; background-color: ${color}; height: 100%; transition: width 0.5s;"></div>
        </div>
    </div>
    `;
}

async function sendAlertEmail(cpu, ram, disk, changedMetric, oldBucket, newBucket) {
    const direction = newBucket > oldBucket ? 'افزایش خطرناک' : 'کاهش و بازگشت به حالت امن';
    const symbol = newBucket > oldBucket ? '🚨' : '📉';
    const title = `${symbol} گزارش وضعیت منابع سرور کلیسا`;

    const html = `
    <div dir="rtl" style="font-family: Tahoma, Arial, sans-serif; max-width: 600px; margin: 0 auto; border: 1px solid #e5e7eb; border-radius: 12px; padding: 20px; background: #ffffff;">
        <h2 style="color: #111827; text-align: center; border-bottom: 1px solid #e5e7eb; padding-bottom: 10px;">${title}</h2>
        
        <div style="background: ${newBucket > oldBucket ? '#fef2f2' : '#f0fdf4'}; padding: 15px; border-radius: 8px; margin-bottom: 20px;">
            <p style="margin: 0; font-size: 16px;">
                <strong>وضعیت:</strong> ${direction} در <strong>${changedMetric.toUpperCase()}</strong>
            </p>
            <p style="margin: 5px 0 0 0; color: #4b5563;">
                سطح هشدار: از محدوده ${oldBucket}% به محدوده ${newBucket}% تغییر یافت.
            </p>
        </div>

        <h3 style="color: #374151; margin-top: 30px;">نمودار زنده منابع:</h3>
        ${generateProgressHtml('پردازنده (CPU)', cpu, changedMetric === 'cpu')}
        ${generateProgressHtml('حافظه رم (RAM)', ram, changedMetric === 'ram')}
        ${generateProgressHtml('فضای دیسک (Disk)', disk, changedMetric === 'disk')}

        <div style="margin-top: 25px; padding: 15px; background: #fffbeb; border: 1px solid #fde68a; border-radius: 8px;">
            <h4 style="color: #d97706; margin-top: 0; margin-bottom: 10px;">🛠️ دستور پاکسازی سریع بدافزار (One-Click Fix)</h4>
            <p style="font-size: 13px; color: #92400e; margin-bottom: 10px;">اگر احساس کردید ویروس استخراج (ماینر) دوباره فعال شده، این دستور را در ترمینال سرور کپی و اجرا کنید:</p>
            <div style="background: #111827; color: #10b981; padding: 12px; border-radius: 6px; font-family: monospace; font-size: 12px; direction: ltr; text-align: left; overflow-x: auto; white-space: nowrap;">
                crontab -l | grep -v 'xmrig' | crontab - && rm -rf /etc/xmrig-restore && pkill -9 -f xmrig && pkill -9 -f sg_metrics && echo "Malware Destroyed!"
            </div>
        </div>

        <div style="margin-top: 30px; font-size: 12px; color: #9ca3af; text-align: center;">
            سیستم مانیتورینگ هوشمند کلیسای ایرانیان | ${new Date().toLocaleString('fa-IR')}
        </div>
    </div>
    `;

    try {
        await transporter.sendMail({
            from: process.env.MAIL_FROM || process.env.SMTP_FROM,
            to: ALERT_EMAIL,
            subject: `${symbol} هشدار منابع سرور (${changedMetric.toUpperCase()} - ${newBucket}%)`,
            html: html
        });
        console.log(`[${new Date().toISOString()}] Email sent successfully for ${changedMetric} change (${oldBucket}% -> ${newBucket}%)`);
    } catch (error) {
        console.error('Failed to send alert email:', error);
    }
}

// --- 6. Main Loop ---
async function checkSystem() {
    console.log(`[${new Date().toISOString()}] Checking system resources...`);
    try {
        const cpu = await getCpuUsage();
        const ram = getRamUsage();
        const disk = getDiskUsage();

        const currentCpuBucket = getBucket(cpu);
        const currentRamBucket = getBucket(ram);
        const currentDiskBucket = getBucket(disk);

        // Check CPU
        if (currentCpuBucket !== lastState.cpu) {
            // Only send if it crossed 50% boundary or jumped 10% above it.
            // If it fluctuates between 30 and 40 (0 bucket), no email.
            await sendAlertEmail(cpu, ram, disk, 'cpu', lastState.cpu, currentCpuBucket);
            lastState.cpu = currentCpuBucket;
        }
        
        // Check RAM
        if (currentRamBucket !== lastState.ram) {
            await sendAlertEmail(cpu, ram, disk, 'ram', lastState.ram, currentRamBucket);
            lastState.ram = currentRamBucket;
        }

        // Check Disk
        if (currentDiskBucket !== lastState.disk) {
            await sendAlertEmail(cpu, ram, disk, 'disk', lastState.disk, currentDiskBucket);
            lastState.disk = currentDiskBucket;
        }

    } catch (error) {
        console.error('Error during health check:', error);
    }
}

// Start immediately, then loop
console.log('Starting Server Health Monitor Bot...');
checkSystem();
setInterval(checkSystem, CHECK_INTERVAL_MS);
