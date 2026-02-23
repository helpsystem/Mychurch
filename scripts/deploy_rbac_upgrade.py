#!/usr/bin/env python3
"""
╔═══════════════════════════════════════════════════════╗
║     🔐 Deploy RBAC Upgrade to Server                 ║
║     MyChurch Broadcast Console Pro                    ║
╚═══════════════════════════════════════════════════════╝

Deploys the RBAC upgrade files and runs the database migration.

Usage:
    python scripts/deploy_rbac_upgrade.py              # Deploy all RBAC files
    python scripts/deploy_rbac_upgrade.py --migrate    # Deploy + run SQL migration
    python scripts/deploy_rbac_upgrade.py --dry-run    # Show what would be uploaded
"""

import paramiko
import os
import sys
from pathlib import Path

# ─── Server Configuration ────────────────────────────────────
SERVER = 'samanabyar.online'
USERNAME = 'root'
PASSWORD = 'jIVeuzsrkoWPkhUY'
BACKEND_PATH = '/root/Mychurch/backend'
FRONTEND_PATH = '/var/www/html'

# ─── Files to Deploy ─────────────────────────────────────────
# (local_relative_path, remote_path)
BACKEND_FILES = [
    # New: roles configuration
    ('backend/config/roles.js', f'{BACKEND_PATH}/config/roles.js'),

    # Updated: auth middleware
    ('backend/middleware/auth.js', f'{BACKEND_PATH}/middleware/auth.js'),

    # Updated: auth routes (JWT with permissions)
    ('backend/routes/authRoutes.js', f'{BACKEND_PATH}/routes/authRoutes.js'),

    # Updated: user routes (multi-role)
    ('backend/routes/userRoutes.js', f'{BACKEND_PATH}/routes/userRoutes.js'),

    # Updated: init DB schema
    ('backend/initDB-postgres.js', f'{BACKEND_PATH}/initDB-postgres.js'),

    # New: SQL migration
    ('backend/migrations/rbac_upgrade.sql', f'{BACKEND_PATH}/migrations/rbac_upgrade.sql'),

    # Updated: create_tables SQL
    ('backend/migrations/create_tables.sql', f'{BACKEND_PATH}/migrations/create_tables.sql'),

    # New: migration runner
    ('backend/scripts/run-rbac-migration.js', f'{BACKEND_PATH}/scripts/run-rbac-migration.js'),
]


def print_header():
    print()
    print("╔═══════════════════════════════════════════════════════╗")
    print("║     🔐 MyChurch RBAC Upgrade — Deploy Script         ║")
    print("╚═══════════════════════════════════════════════════════╝")
    print()


def ensure_remote_dir(sftp, remote_path):
    """Create remote directory if it doesn't exist."""
    dirs_to_create = []
    path = remote_path
    while path and path != '/':
        try:
            sftp.stat(path)
            break
        except FileNotFoundError:
            dirs_to_create.insert(0, path)
            path = os.path.dirname(path)

    for d in dirs_to_create:
        try:
            sftp.mkdir(d)
            print(f"   📁 Created dir: {d}")
        except IOError:
            pass


def deploy_rbac(ssh, sftp, root_dir, dry_run=False):
    """Upload all RBAC files to the server."""
    print("📤 Uploading RBAC files...")
    print()

    success = 0
    failed = 0

    for local_rel, remote_path in BACKEND_FILES:
        local_path = root_dir / local_rel

        if not local_path.exists():
            print(f"   ❌ NOT FOUND: {local_rel}")
            failed += 1
            continue

        size = local_path.stat().st_size
        size_str = f"{size:,} bytes"

        if dry_run:
            print(f"   📄 [DRY RUN] {local_rel} → {remote_path} ({size_str})")
        else:
            # Ensure target directory exists
            ensure_remote_dir(sftp, os.path.dirname(remote_path))

            sftp.put(str(local_path), remote_path)
            print(f"   ✅ {local_rel} → {remote_path} ({size_str})")

        success += 1

    print()
    print(f"   📊 Results: {success} uploaded, {failed} failed")
    return failed == 0


def run_migration(ssh):
    """Run the RBAC SQL migration on the server."""
    print()
    print("🗃️  Running RBAC database migration...")
    print()

    # Run the migration using the Node.js runner
    cmd = f"cd {BACKEND_PATH} && node scripts/run-rbac-migration.js"
    print(f"   $ {cmd}")
    print()

    stdin, stdout, stderr = ssh.exec_command(cmd, timeout=30)
    output = stdout.read().decode('utf-8', errors='replace')
    errors = stderr.read().decode('utf-8', errors='replace')

    if output:
        for line in output.strip().split('\n'):
            print(f"   {line}")
    if errors:
        for line in errors.strip().split('\n'):
            print(f"   ⚠️  {line}")

    exit_code = stdout.channel.recv_exit_status()
    if exit_code == 0:
        print()
        print("   ✅ Migration completed successfully!")
    else:
        print()
        print(f"   ❌ Migration failed (exit code: {exit_code})")
        print("   You can run it manually on the server:")
        print(f"   cd {BACKEND_PATH} && node scripts/run-rbac-migration.js")

    return exit_code == 0


def restart_backend(ssh):
    """Restart PM2 processes."""
    print()
    print("🔄 Restarting backend (PM2)...")

    stdin, stdout, stderr = ssh.exec_command("pm2 restart all")
    output = stdout.read().decode('utf-8', errors='replace')
    print(output)
    print("   ✅ Backend restarted!")


def main():
    print_header()

    # Parse args
    dry_run = '--dry-run' in sys.argv
    run_migrate = '--migrate' in sys.argv
    skip_restart = '--no-restart' in sys.argv

    # Show options
    print(f"🌐 Server: {SERVER}")
    print(f"📁 Backend: {BACKEND_PATH}")
    if dry_run:
        print("⚠️  DRY RUN mode — no files will be uploaded")
    if run_migrate:
        print("🗃️  Will run database migration after upload")
    print()

    # Find project root
    root_dir = Path(__file__).parent.parent
    print(f"📂 Project root: {root_dir}")
    print()

    if dry_run:
        # Just show files
        deploy_rbac(None, None, root_dir, dry_run=True)
        print()
        print("💡 Remove --dry-run to actually deploy.")
        return

    # Connect
    print("🔗 Connecting to server...")
    ssh = paramiko.SSHClient()
    ssh.set_missing_host_key_policy(paramiko.AutoAddPolicy())

    try:
        ssh.connect(SERVER, username=USERNAME, password=PASSWORD, timeout=15)
        sftp = ssh.open_sftp()
        print("   ✅ Connected!")
        print()

        # Deploy files
        success = deploy_rbac(ssh, sftp, root_dir)

        if not success:
            print("⚠️  Some files failed. Check errors above.")

        # Run migration if requested
        if run_migrate and success:
            run_migration(ssh)

        # Restart
        if not skip_restart:
            restart_backend(ssh)

        sftp.close()
        ssh.close()

        print()
        print("═══════════════════════════════════════════════════════")
        print("✅ RBAC DEPLOY COMPLETE!")
        print("═══════════════════════════════════════════════════════")
        print()
        print("🔗 Test: https://samanabyar.online")
        print("🔗 Admin: https://samanabyar.online/#/admin")
        print()
        print("📋 Next steps:")
        if not run_migrate:
            print("   1. Run migration: python scripts/deploy_rbac_upgrade.py --migrate")
        print("   2. Test login with admin/leader/worship_leader accounts")
        print("   3. Verify multi-role assignment works")
        print()

    except Exception as e:
        print(f"❌ Error: {e}")
        sys.exit(1)


if __name__ == "__main__":
    main()
