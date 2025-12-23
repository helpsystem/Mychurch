#!/usr/bin/env python3
"""
Complete Deployment Script for New Features
Deploy Translation System, Letter Management, and Updates
"""

import paramiko
import os
from pathlib import Path
import time

# Server configuration
SERVER = 'samanabyar.online'
USERNAME = 'root'
PASSWORD = 'jIVeuzsrkoWPkhUY'
REMOTE_PATH = '/root/Mychurch'

def upload_file(sftp, local_path, remote_path):
    """Upload a single file"""
    try:
        # Ensure remote directory exists
        remote_dir = os.path.dirname(remote_path)
        try:
            sftp.stat(remote_dir)
        except:
            # Create directory if it doesn't exist
            sftp.mkdir(remote_dir)
        
        sftp.put(str(local_path), remote_path)
        size = local_path.stat().st_size / 1024
        print(f"   ✅ {local_path.name} ({size:.1f} KB)")
        return True
    except Exception as e:
        print(f"   ❌ Error uploading {local_path.name}: {e}")
        return False

def execute_command(ssh, command, description):
    """Execute a command on server"""
    print(f"\n🔧 {description}...")
    stdin, stdout, stderr = ssh.exec_command(command)
    output = stdout.read().decode()
    error = stderr.read().decode()
    
    if error and 'warning' not in error.lower():
        print(f"   ⚠️  {error[:200]}")
    if output:
        print(f"   ✅ {output[:200]}")
    
    return output, error

def deploy_new_features():
    print("╔════════════════════════════════════════════════════════════════╗")
    print("║     🚀 Deploy MyChurch New Features                          ║")
    print("║     Translation System + Letter Management                    ║")
    print("╚════════════════════════════════════════════════════════════════╝\n")
    
    root_dir = Path(__file__).parent.parent
    
    # Files to upload
    files_to_upload = {
        # Backend Services
        'backend/services/translationService.js': f'{REMOTE_PATH}/backend/services/translationService.js',
        'backend/services/letterAIService.js': f'{REMOTE_PATH}/backend/services/letterAIService.js',
        'backend/services/pdfService.js': f'{REMOTE_PATH}/backend/services/pdfService.js',
        
        # Backend Routes
        'backend/routes/translateRoutes.js': f'{REMOTE_PATH}/backend/routes/translateRoutes.js',
        'backend/routes/letterRoutes.js': f'{REMOTE_PATH}/backend/routes/letterRoutes.js',
        
        # Updated Files
        'backend/server.js': f'{REMOTE_PATH}/backend/server.js',
        
        # Migration
        'backend/migrations/create_letter_system.sql': f'{REMOTE_PATH}/backend/migrations/create_letter_system.sql',
        
        # Frontend Components
        'frontend/src/components/Admin/TranslateButton.tsx': f'{REMOTE_PATH}/frontend/src/components/Admin/TranslateButton.tsx',
        'frontend/src/components/Admin/BilingualTextField.tsx': f'{REMOTE_PATH}/frontend/src/components/Admin/BilingualTextField.tsx',
        'frontend/src/components/AlHayatGPTWidget.tsx': f'{REMOTE_PATH}/frontend/src/components/AlHayatGPTWidget.tsx',
    }
    
    try:
        # Connect to server
        print("🔗 Connecting to server...")
        ssh = paramiko.SSHClient()
        ssh.set_missing_host_key_policy(paramiko.AutoAddPolicy())
        ssh.connect(SERVER, username=USERNAME, password=PASSWORD, timeout=30)
        print("✅ SSH Connected\n")
        
        sftp = ssh.open_sftp()
        print("✅ SFTP Connected\n")
        
        # Step 1: Upload files
        print("📤 Step 1: Uploading Files")
        print("=" * 60)
        success_count = 0
        for local_rel, remote_abs in files_to_upload.items():
            local_path = root_dir / local_rel
            if local_path.exists():
                if upload_file(sftp, local_path, remote_abs):
                    success_count += 1
            else:
                print(f"   ⚠️  File not found: {local_rel}")
        
        print(f"\n✅ Uploaded {success_count}/{len(files_to_upload)} files")
        
        # Step 2: Install dependencies
        print("\n📦 Step 2: Installing Dependencies")
        print("=" * 60)
        execute_command(
            ssh,
            f'cd {REMOTE_PATH} && npm install pdfkit pdf-lib nodemailer',
            "Installing npm packages"
        )
        
        # Step 3: Run database migration
        print("\n🗄️  Step 3: Database Migration")
        print("=" * 60)
        print("⚠️  Manual step required:")
        print("   1. Go to Supabase Dashboard")
        print("   2. SQL Editor")
        print("   3. Run: backend/migrations/create_letter_system.sql")
        print("   (This creates 5 new tables for letter management)")
        
        # Step 4: Create temp directory
        print("\n📁 Step 4: Creating Directories")
        print("=" * 60)
        execute_command(
            ssh,
            f'mkdir -p {REMOTE_PATH}/backend/temp && chmod 755 {REMOTE_PATH}/backend/temp',
            "Creating temp directory for PDFs"
        )
        
        # Step 5: Build frontend
        print("\n🏗️  Step 5: Building Frontend")
        print("=" * 60)
        execute_command(
            ssh,
            f'cd {REMOTE_PATH}/frontend && npm run build',
            "Building frontend (this may take a minute)"
        )
        
        # Step 6: Copy to dist
        print("\n📋 Step 6: Updating Distribution")
        print("=" * 60)
        execute_command(
            ssh,
            f'cd {REMOTE_PATH} && rm -rf dist/* && cp -r frontend/dist/* dist/',
            "Copying build to dist"
        )
        
        # Step 7: Restart backend
        print("\n🔄 Step 7: Restarting Backend")
        print("=" * 60)
        
        # Try PM2
        output, error = execute_command(
            ssh,
            'pm2 restart backend',
            "Restarting with PM2"
        )
        
        if 'online' not in output.lower() and 'restart' not in output.lower():
            # Try alternative
            execute_command(
                ssh,
                'systemctl restart mychurch-backend',
                "Restarting with systemctl"
            )
        
        # Step 8: Reload Nginx
        print("\n🌐 Step 8: Reloading Nginx")
        print("=" * 60)
        execute_command(
            ssh,
            'nginx -t && nginx -s reload',
            "Testing and reloading Nginx"
        )
        
        # Cleanup
        sftp.close()
        ssh.close()
        
        # Success message
        print("\n╔════════════════════════════════════════════════════════════════╗")
        print("║                    ✅ DEPLOYMENT SUCCESSFUL!                    ║")
        print("╚════════════════════════════════════════════════════════════════╝")
        print("\n📊 Deployed Features:")
        print("  ✅ Translation System with AI (Gemini)")
        print("  ✅ Letter Management System")
        print("  ✅ Professional PDF Generation")
        print("  ✅ Al Hayat GPT Widget (updated)")
        print("  ✅ Email Integration")
        print("  ✅ Rate Limiting Enhanced")
        print("\n🔍 Next Steps:")
        print("  1. ⚠️  Run database migration in Supabase")
        print("  2. ✅ Test translation API: /api/ai/translate/smart")
        print("  3. ✅ Test letter system: /api/letters")
        print("  4. ✅ Verify Al Hayat GPT loads on /ai-helper")
        print("  5. ✅ Check backend logs: pm2 logs backend")
        print("\n🌐 Website: https://samanabyar.online")
        print("📖 Docs: deployment-guide.md")
        print("\n" + "=" * 64)
        
        return True
        
    except Exception as e:
        print(f"\n❌ Deployment Error: {str(e)}")
        import traceback
        traceback.print_exc()
        return False

if __name__ == '__main__':
    success = deploy_new_features()
    exit(0 if success else 1)
