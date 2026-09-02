const os = require('os');
const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');
const nodemailer = require('nodemailer');
// Parse .env.local manually
try {
  const envPath = path.join(__dirname, '../.env.local');
  if (fs.existsSync(envPath)) {
    const envFile = fs.readFileSync(envPath, 'utf8');
    envFile.split('\n').forEach(line => {
      const match = line.match(/^\s*([\w.-]+)\s*=\s*(.*)?\s*$/);
      if (match) {
        const key = match[1];
        let value = match[2] || '';
        if (value.startsWith('"') && value.endsWith('"')) {
          value = value.slice(1, -1);
        }
        process.env[key] = value;
      }
    });
  }
} catch (e) {
  console.log("Could not load .env.local");
}

const STATE_FILE = path.join(__dirname, 'health_state.json');
const ALERT_THRESHOLD = 50;
const EMAIL_TO = 'help.system@ymail.com';

function getCpuUsage() {
  const cpus = os.cpus();
  let user = 0, nice = 0, sys = 0, idle = 0, irq = 0;
  for (let cpu in cpus) {
    user += cpus[cpu].times.user;
    nice += cpus[cpu].times.nice;
    sys += cpus[cpu].times.sys;
    irq += cpus[cpu].times.irq;
    idle += cpus[cpu].times.idle;
  }
  const total = user + nice + sys + idle + irq;
  const active = user + nice + sys + irq;
  return { active, total };
}

function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

async function measureCpuPercent() {
  const start = getCpuUsage();
  await sleep(1000);
  const end = getCpuUsage();
  const idleDiff = end.total - start.total - (end.active - start.active);
  const totalDiff = end.total - start.total;
  return 100 - Math.floor((idleDiff / totalDiff) * 100);
}

function getMemoryUsage() {
  const total = os.totalmem();
  const free = os.freemem();
  const used = total - free;
  return Math.floor((used / total) * 100);
}

function getDiskUsage() {
  try {
    const output = execSync('df -h / | tail -1').toString();
    const parts = output.trim().split(/\s+/);
    const usePercent = parts[4].replace('%', '');
    return parseInt(usePercent, 10);
  } catch (e) {
    console.error("Error reading disk usage (requires Linux/Mac):", e.message);
    return 0; // fallback for non-linux
  }
}

function loadState() {
  if (fs.existsSync(STATE_FILE)) {
    return JSON.parse(fs.readFileSync(STATE_FILE, 'utf-8'));
  }
  return { cpu: 0, ram: 0, disk: 0 };
}

function saveState(state) {
  fs.writeFileSync(STATE_FILE, JSON.stringify(state, null, 2));
}

function getLevel(percent) {
  if (percent < ALERT_THRESHOLD) return 0;
  return Math.floor(percent / 10) * 10;
}

function generateChart(cpu, ram, disk) {
  const bar = (val) => {
    let color = val < 50 ? '#4CAF50' : val < 80 ? '#FF9800' : '#F44336';
    return `<div style="width: 100%; background: #ddd; border-radius: 4px; overflow: hidden; height: 20px;">
              <div style="width: ${val}%; background: ${color}; height: 100%;"></div>
            </div><span style="font-weight: bold; color: ${color};">${val}%</span>`;
  };

  return `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: auto; padding: 20px; border: 1px solid #ddd; border-radius: 8px;">
      <h2 style="color: #333; text-align: center;">🚨 Server Health Report 🚨</h2>
      <p style="text-align: center; color: #555;">The following metrics have crossed the alert threshold.</p>
      
      <table style="width: 100%; border-collapse: collapse; margin-top: 20px;">
        <tr>
          <td style="padding: 10px; width: 100px;"><b>CPU Usage</b></td>
          <td style="padding: 10px;">${bar(cpu)}</td>
        </tr>
        <tr>
          <td style="padding: 10px;"><b>RAM Usage</b></td>
          <td style="padding: 10px;">${bar(ram)}</td>
        </tr>
        <tr>
          <td style="padding: 10px;"><b>Disk Usage</b></td>
          <td style="padding: 10px;">${bar(disk)}</td>
        </tr>
      </table>

      <div style="margin-top: 20px; padding: 15px; background: #f9f9f9; border-left: 4px solid #007BFF;">
        <h4 style="margin-top: 0;">System Details:</h4>
        <ul style="margin-bottom: 0; padding-left: 20px;">
          <li>Hostname: ${os.hostname()}</li>
          <li>Platform: ${os.platform()}</li>
          <li>Total RAM: ${(os.totalmem() / (1024 ** 3)).toFixed(2)} GB</li>
          <li>Time: ${new Date().toLocaleString('fa-IR')}</li>
        </ul>
      </div>
    </div>
  `;
}

async function sendEmail(subject, html) {
  const transporter = nodemailer.createTransport({
    host: process.env.SMTP_HOST || 'smtp.gmail.com',
    port: parseInt(process.env.SMTP_PORT || '587'),
    secure: false, // true for 465, false for other ports
    auth: {
      user: process.env.SMTP_USER,
      pass: process.env.SMTP_PASS,
    },
  });

  await transporter.sendMail({
    from: process.env.SMTP_FROM || process.env.SMTP_USER,
    to: EMAIL_TO,
    subject: subject,
    html: html,
  });
}

async function run() {
  const cpu = await measureCpuPercent();
  const ram = getMemoryUsage();
  const disk = getDiskUsage();

  console.log(`Current Usage -> CPU: ${cpu}%, RAM: ${ram}%, DISK: ${disk}%`);

  const prevState = loadState();
  const cpuLevel = getLevel(cpu);
  const ramLevel = getLevel(ram);
  const diskLevel = getLevel(disk);

  let shouldAlert = false;
  let changes = [];

  const checkMetric = (name, current, prev, val) => {
    if (current > prev) {
      changes.push(`⬆️ ${name} increased to ${val}% (Threshold: ${current}%)`);
      shouldAlert = true;
    } else if (current < prev) {
      // If it dropped a level, alert the drop.
      changes.push(`⬇️ ${name} decreased to ${val}% (Threshold dropped from ${prev}%)`);
      shouldAlert = true;
    }
  };

  checkMetric('CPU', cpuLevel, getLevel(prevState.cpu), cpu);
  checkMetric('RAM', ramLevel, getLevel(prevState.ram), ram);
  checkMetric('Disk', diskLevel, getLevel(prevState.disk), disk);

  if (shouldAlert) {
    console.log("Threshold crossed. Sending email alert...");
    const subject = `⚠️ Server Health Alert - ${changes[0].substring(0, 50)}`;
    const html = generateChart(cpu, ram, disk) + `<br><p><b>Recent Changes:</b><br>${changes.join('<br>')}</p>`;
    
    try {
      await sendEmail(subject, html);
      console.log("Email sent successfully.");
      saveState({ cpu, ram, disk });
    } catch (e) {
      console.error("Failed to send email:", e);
    }
  } else {
    console.log("No significant changes. State saved.");
    // We update the exact values in state to track small drifts, 
    // but the level comparison ensures we only alert on 10% bounds.
    saveState({ cpu, ram, disk });
  }
}

run();
