const { exec } = require('child_process');
const fs = require('fs');
const path = require('path');

console.log("Connecting to VPS via SSH to check PM2 logs (using non-streaming tail)...");

const sshCmd = 'ssh root@samanabyar.online "echo \'=== PM2 PROCESS LIST ===\' && pm2 list && echo \'=== LAST 50 ERROR LOG LINES ===\' && tail -n 50 ~/.pm2/logs/mychurch-next-err.log && echo \'=== LAST 50 OUT LOG LINES ===\' && tail -n 50 ~/.pm2/logs/mychurch-next-out.log"';

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
