$sshCommand = "ssh -o StrictHostKeyChecking=no root@iranianchurchdc.com 'pm2 logs mychurch-next --lines 50 --nostream'"
Invoke-Expression $sshCommand
