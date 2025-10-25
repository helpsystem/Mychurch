#!/usr/bin/env python3
"""
Auto-sync local worship folder to a remote server over SFTP (incremental: add/modify/delete).

Features
- Watches a local directory for file changes using watchdog
- Uploads new/changed files by content hash (md5) comparison in-memory
- Deletes removed files from the remote
- Recursively creates remote directories as needed
- Optional hook: when data/worship_songs_full.json changes, run the converter script
  to produce normalized public JSON and upload it to REMOTE_DIR/data/worship_songs.json

Usage (Windows PowerShell)
  # Install deps once
  #   pip install paramiko watchdog

  # Run with environment variables or CLI flags
  py scripts/sync_to_server.py \
    --local-dir "C:\\MyChurchSync\\local" \
    --host "your.server.com" --user "username" --password "password" \
    --remote-dir "/home/youruser/public_html/worship/" \
    --converter "D:\\Windows.old\\Users\\Sami\\Desktop\\Iran Church DC\\Git\\Mychurch\\scripts\\convert_kalameh_export_to_frontend.py"

Notes
- If --converter is provided, the script will run it when the full JSON changes and then upload
  the normalized JSON from <repo_root>/public/worship/data/worship_songs.json to REMOTE_DIR/data/.
- You can also set values via env vars: LOCAL_DIR, SYNC_HOST, SYNC_PORT, SYNC_USER, SYNC_PASS,
  REMOTE_DIR, CONVERTER_SCRIPT
"""

import os
import sys
import time
import json
import hashlib
import argparse
from pathlib import Path
from typing import Optional

import paramiko
from watchdog.observers import Observer
from watchdog.events import FileSystemEventHandler, FileSystemEvent


def md5_file(path: str) -> Optional[str]:
    if not os.path.isfile(path):
        return None
    h = hashlib.md5()
    with open(path, 'rb') as f:
        for chunk in iter(lambda: f.read(8192), b''):
            h.update(chunk)
    return h.hexdigest()


def ensure_remote_dirs(sftp: paramiko.SFTPClient, remote_dir: str) -> None:
    parts = []
    # Normalize to posix and strip trailing slash
    remote_dir = remote_dir.replace('\\', '/').rstrip('/')
    for part in remote_dir.split('/'):
        if not part:
            continue
        parts.append(part)
        path = '/' + '/'.join(parts)
        try:
            sftp.stat(path)
        except FileNotFoundError:
            try:
                sftp.mkdir(path)
            except IOError:
                # Might fail if a file exists as that path; re-raise
                raise


class SshSession:
    def __init__(self, host: str, port: int, user: str, password: Optional[str] = None,
                 key_path: Optional[str] = None, key_passphrase: Optional[str] = None):
        self.host = host
        self.port = port
        self.user = user
        self.password = password
        self.key_path = key_path
        self.key_passphrase = key_passphrase

    def connect(self) -> paramiko.SSHClient:
        client = paramiko.SSHClient()
        client.set_missing_host_key_policy(paramiko.AutoAddPolicy())
        if self.key_path:
            pkey = None
            key_file = Path(self.key_path).expanduser().resolve()
            if not key_file.exists():
                raise FileNotFoundError(f"SSH key not found: {key_file}")
            try:
                pkey = paramiko.RSAKey.from_private_key_file(str(key_file), password=self.key_passphrase)
            except paramiko.PasswordRequiredException:
                raise
            client.connect(self.host, self.port, self.user, pkey=pkey)
        else:
            client.connect(self.host, self.port, self.user, self.password)
        return client


class SyncHandler(FileSystemEventHandler):
    IGNORED_SUFFIXES = {
        '.tmp', '.swp', '.swx', '.part', '.crdownload', '.DS_Store', '.lnk', '.lock', '.log'
    }

    def __init__(self, local_dir: str, remote_dir: str, session: SshSession,
                 converter_script: Optional[str] = None):
        self.local_dir = os.path.abspath(local_dir)
        self.remote_dir = remote_dir.replace('\\', '/') if remote_dir else '/'
        if not self.remote_dir.endswith('/'):
            self.remote_dir += '/'
        self.session = session
        self.converter_script = converter_script

        # Initial snapshot
        self.hashes: dict[str, Optional[str]] = {}
        for root, _, files in os.walk(self.local_dir):
            for name in files:
                path = os.path.join(root, name)
                if self._ignored(path):
                    continue
                self.hashes[path] = md5_file(path)

        print(f"🔎 Watching: {self.local_dir}")
        print(f"🌐 Remote:  {self.remote_dir}")

    def _ignored(self, path: str) -> bool:
        lower = path.lower()
        return any(lower.endswith(sfx) for sfx in self.IGNORED_SUFFIXES)

    def _to_remote(self, local_path: str) -> str:
        rel = os.path.relpath(local_path, self.local_dir)
        rel = rel.replace('\\', '/')
        return (self.remote_dir + rel).replace('//', '/')

    def _upload(self, local_path: str) -> None:
        client = self.session.connect()
        try:
            sftp = client.open_sftp()
            remote_path = self._to_remote(local_path)
            ensure_remote_dirs(sftp, os.path.dirname(remote_path))
            sftp.put(local_path, remote_path)
            print(f"⬆️  Uploaded: {os.path.relpath(local_path, self.local_dir)}")
        finally:
            try:
                sftp.close()
            except Exception:
                pass
            client.close()

    def _delete_remote(self, local_path: str) -> None:
        client = self.session.connect()
        try:
            sftp = client.open_sftp()
            remote_path = self._to_remote(local_path)
            try:
                sftp.remove(remote_path)
                print(f"🗑️  Deleted:  {os.path.relpath(local_path, self.local_dir)}")
            except FileNotFoundError:
                pass
        finally:
            try:
                sftp.close()
            except Exception:
                pass
            client.close()

    def _maybe_run_converter_and_upload_json(self):
        if not self.converter_script:
            return
        try:
            # Run converter: py <script> --export-dir <local_dir>
            import subprocess
            print("🛠️  Running converter (normalize worship JSON)...")
            # Use the same Python interpreter
            subprocess.check_call([
                sys.executable,
                self.converter_script,
                '--export-dir', self.local_dir
            ], cwd=str(Path(self.converter_script).parent))

            # Locate output JSON in repo root
            repo_root = Path(self.converter_script).resolve().parents[1]
            out_json = repo_root / 'public' / 'worship' / 'data' / 'worship_songs.json'
            if out_json.exists():
                client = self.session.connect()
                try:
                    sftp = client.open_sftp()
                    remote_json = Path(self.remote_dir.strip('/')) / 'data' / 'worship_songs.json'
                    ensure_remote_dirs(sftp, str(remote_json.parent))
                    sftp.put(str(out_json), str(remote_json))
                    print("✅ Uploaded normalized JSON to:", str(remote_json))
                finally:
                    try:
                        sftp.close()
                    except Exception:
                        pass
                    client.close()
            else:
                print(f"⚠️  Normalized JSON not found at {out_json}")
        except Exception as e:
            print("❌ Converter failed:", e)

    # Watchdog events
    def on_modified(self, event: FileSystemEvent):
        if event.is_directory:
            return
        path = event.src_path
        if self._ignored(path):
            return
        new_hash = md5_file(path)
        if new_hash != self.hashes.get(path):
            self.hashes[path] = new_hash
            self._upload(path)
            # Trigger converter if full JSON changed
            if os.path.relpath(path, self.local_dir).replace('\\', '/') == 'data/worship_songs_full.json':
                self._maybe_run_converter_and_upload_json()

    def on_created(self, event: FileSystemEvent):
        if event.is_directory:
            return
        path = event.src_path
        if self._ignored(path):
            return
        self._upload(path)
        self.hashes[path] = md5_file(path)

    def on_deleted(self, event: FileSystemEvent):
        if event.is_directory:
            return
        path = event.src_path
        if self._ignored(path):
            return
        self._delete_remote(path)
        self.hashes.pop(path, None)

    def on_moved(self, event: FileSystemEvent):
        # Treat as delete old + upload new
        if hasattr(event, 'src_path') and event.src_path:
            src = event.src_path
            if not event.is_directory and not self._ignored(src):
                self._delete_remote(src)
                self.hashes.pop(src, None)
        if hasattr(event, 'dest_path') and event.dest_path:
            dst = event.dest_path
            if not event.is_directory and not self._ignored(dst):
                self._upload(dst)
                self.hashes[dst] = md5_file(dst)


def main():
    parser = argparse.ArgumentParser(description='Auto-sync local worship folder to remote server over SFTP')
    parser.add_argument('--local-dir', default=os.getenv('LOCAL_DIR', r'C:\\MyChurchSync\\local'))
    parser.add_argument('--host', default=os.getenv('SYNC_HOST', ''))
    parser.add_argument('--port', type=int, default=int(os.getenv('SYNC_PORT', '22')))
    parser.add_argument('--user', default=os.getenv('SYNC_USER', ''))
    parser.add_argument('--password', default=os.getenv('SYNC_PASS', ''))
    parser.add_argument('--key', default=os.getenv('SYNC_KEY_PATH', ''))
    parser.add_argument('--key-pass', default=os.getenv('SYNC_KEY_PASS', ''))
    parser.add_argument('--remote-dir', default=os.getenv('REMOTE_DIR', '/home/youruser/public_html/worship/'))
    parser.add_argument('--converter', default=os.getenv('CONVERTER_SCRIPT', ''))
    args = parser.parse_args()

    if not args.host or not args.user or (not args.password and not args.key):
        print('❌ Missing connection info. Provide --host, --user, and either --password or --key')
        sys.exit(1)

    session = SshSession(
        host=args.host,
        port=args.port,
        user=args.user,
        password=args.password or None,
        key_path=(args.key or None),
        key_passphrase=(args.key_pass or None)
    )

    converter_script = args.converter or None
    handler = SyncHandler(args.local_dir, args.remote_dir, session, converter_script)
    observer = Observer()
    observer.schedule(handler, args.local_dir, recursive=True)
    observer.start()
    print('🚀 Sync watcher started. Press Ctrl+C to stop.')
    try:
        while True:
            time.sleep(1)
    except KeyboardInterrupt:
        observer.stop()
    observer.join()


if __name__ == '__main__':
    main()
