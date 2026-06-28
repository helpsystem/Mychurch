const { exec } = require('child_process');
const fs = require('fs');
const path = require('path');

console.log("Connecting to VPS via SSH to check PM2 logs...");

const sshCmd = 'ssh root@samanabyar.online "echo \'=== PM2 PROCESS LIST ===\' && pm2 list && echo \'=== PM2 LOGS ===\' && pm2 logs mychurch-next --lines 100 --raw --no-colors --err && echo \'=== PM2 OUT LOGS ===\' && pm2 logs mychurch-next --lines 100 --raw --no-colors --out"';

exec(sshCmd, (error, stdout, stderr) => {
    let output = '';
    if (error) {
        output += `Error executing SSH command: ${error.message}\n`;
    }
    if (stderr) {
        output += `Standard Error:\n${stderr}\n`;
    }
    output += `Standard Output:\n${stdout}\n`;

    const destPath = path.join(__dirname, 'vps_status.txt');
    fs.writeFileSync(destPath, output, 'utf8');
    console.log("Successfully fetched VPS status and saved to vps_status.txt");
});
