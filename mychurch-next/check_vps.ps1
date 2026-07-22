$sshCommand = "ssh -o StrictHostKeyChecking=no root@samanabyar.online 'pm2 logs mychurch-next --lines 50 --nostream'"
Invoke-Expression $sshCommand
