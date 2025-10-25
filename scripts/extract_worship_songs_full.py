#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
Extract a full, rich worship songs JSON from a structured local folder.

Folder layout example:
Worship Songs/
 ┣ 🎵 El Shaddai/
 │   ┣ audio.mp3
 │   ┣ lyrics_fa.txt
 │   ┣ lyrics_en.txt
 │   ┣ notes.txt
 │   ┣ notation.txt
 │   ┣ song.pptx
 │   ┣ sheet.pdf
 │   ┣ info.json  ← optional per-song metadata
 │   ┣ timepoints.json  ← optional word-level timing
 │   ┗ attachments/
 │       ┣ chords.pdf
 │       ┗ translation.docx
 ┣ 🎵 Bekhan Name Isa Ra/
 │   ┣ audio.mp3
 │   ┣ lyrics_fa.txt
 │   ┣ lyrics_en.txt
 │   ┣ song.pptx
 │   ┣ sheet.pdf
 │   ┗ info.json

Output:
- worship_songs_full.json with structure { "worshipSongs": [ { ...per song... } ] }

Notes:
- Paths are converted to be relative to the base directory, using forward slashes.
- If info.json (or info.yaml/yml) exists, it merges on top of auto-detected fields.
- Attachments are listed from attachments/ subfolder.
- If timepoints.json exists (array of {time:number, word:string}), it's included as 'timepoints'.

CLI:
    python extract_worship_songs_full.py \
        --base "C:/Users/Sami/Desktop/Iran Church DC/Worship Songs" \
        --output "C:/Users/Sami/Desktop/Iran Church DC/Worship Songs/worship_songs_full.json"
"""
from __future__ import annotations

import argparse
import json
import os
import re
import sys
import hashlib
from datetime import datetime
from typing import Any, Dict, List, Optional

# Optional YAML support
try:
    import yaml  # type: ignore
except Exception:  # pragma: no cover - optional dependency
    yaml = None

# Default configuration (can be overridden by CLI)
DEFAULT_BASE_DIR = r"C:\\Users\\Sami\\Desktop\\Iran Church DC\\Worship Songs"
DEFAULT_OUTPUT = None  # If None, will write to <BASE_DIR>/worship_songs_full.json

AUDIO_EXTS = [".mp3", ".wav", ".m4a", ".aac", ".flac"]
PPT_EXTS = [".pptx", ".ppt"]
PDF_EXTS = [".pdf"]
TEXT_EXTS = [".txt"]
SHEET_EXTS = [".musicxml", ".gp5", ".midi", ".mid", ".xml"]

# Regex patterns for flexible filename matching
LYRICS_FA_PATTERNS = [r"^lyrics[_\-.]?fa\b", r"^fa[_\-.]?lyrics\b", r"^lyrics\b.*fa\b"]
LYRICS_EN_PATTERNS = [r"^lyrics[_\-.]?en\b", r"^en[_\-.]?lyrics\b", r"^lyrics\b.*en\b"]
TIMEPOINTS_PATTERNS = [r"^timepoints\b", r"^lyrics[_\-.]?time\b", r"^words[_\-.]?time\b"]

# ------------- Helpers -------------

def normalize_rel_path(path: Optional[str], base_dir: str) -> Optional[str]:
    if not path:
        return None
    try:
        abs_base = os.path.abspath(base_dir)
        abs_path = os.path.abspath(path)
        if abs_path.startswith(abs_base):
            rel = abs_path[len(abs_base):].replace("\\", "/").lstrip("/")
            return f"./{rel}" if rel else "."
        # If path is not under base (unlikely), return as-is but with fw slashes
        return path.replace("\\", "/")
    except Exception:
        return path.replace("\\", "/")

def listdir_safe(folder: str) -> List[str]:
    try:
        return os.listdir(folder)
    except Exception:
        return []


def first_matching_file(folder: str, extensions: List[str], name_hints: Optional[List[str]] = None) -> Optional[str]:
    """Find the first file in folder that matches extension and optional name-hint regex(es)."""
    files = listdir_safe(folder)
    # Prioritize by name hints if provided
    if name_hints:
        patterns = [re.compile(pat, re.IGNORECASE) for pat in name_hints]
        for f in files:
            name, ext = os.path.splitext(f)
            if ext.lower() in extensions and any(p.search(name) for p in patterns):
                return os.path.join(folder, f)
    # Fallback: first by extension
    for f in files:
        name, ext = os.path.splitext(f)
        if ext.lower() in extensions:
            return os.path.join(folder, f)
    return None


def read_text(path: Optional[str]) -> Optional[str]:
    if not path:
        return None
    try:
        with open(path, "r", encoding="utf-8") as fh:
            return fh.read().strip()
    except Exception:
        return None


def read_json(path: str) -> Optional[Any]:
    try:
        with open(path, "r", encoding="utf-8") as fh:
            return json.load(fh)
    except Exception:
        return None


def read_yaml(path: str) -> Optional[Any]:
    if not yaml:
        return None
    try:
        with open(path, "r", encoding="utf-8") as fh:
            return yaml.safe_load(fh)
    except Exception:
        return None


def list_attachments(folder: str) -> List[Dict[str, Any]]:
    atts: List[Dict[str, Any]] = []
    att_dir = os.path.join(folder, "attachments")
    if os.path.isdir(att_dir):
        for f in listdir_safe(att_dir):
            full = os.path.join(att_dir, f)
            if os.path.isfile(full):
                try:
                    size_kb = round(os.path.getsize(full) / 1024.0, 1)
                except Exception:
                    size_kb = None
                atts.append({
                    "name": f,
                    "url": f"./attachments/{f}",
                    "size_kb": size_kb,
                })
    return atts


def is_song_folder(folder: str) -> bool:
    files = [f.lower() for f in listdir_safe(folder)]
    # Heuristic: contains at least one of audio, ppt, lyrics file
    if any(f.endswith(tuple([ext.lower() for ext in AUDIO_EXTS])) for f in files):
        return True
    if any(f.endswith(tuple([ext.lower() for ext in PPT_EXTS])) for f in files):
        return True
    if any(re.match(pat, os.path.splitext(f)[0], re.IGNORECASE) for f in files for pat in LYRICS_FA_PATTERNS + LYRICS_EN_PATTERNS):
        return True
    # Also allow explicit hints like sheet.pdf or lyrics_fa.txt common names
    if "lyrics_fa.txt" in files or "lyrics_en.txt" in files or "sheet.pdf" in files:
        return True
    return False


def derive_titles_from_folder(folder_name: str) -> Dict[str, str]:
    # Strip common emoji/prefixes and extra spaces
    clean = folder_name
    clean = re.sub(r"^[\W_]+", "", clean).strip()
    clean = re.sub(r"^🎵\s*", "", clean).strip()
    # Use same for fa/en as a default; can be overridden by info.json
    return {
        "title_fa": clean,
        "title_en": clean,
    }


def folder_times(folder: str) -> Dict[str, str]:
    try:
        ctime = datetime.fromtimestamp(os.path.getctime(folder)).isoformat()
    except Exception:
        ctime = datetime.now().isoformat()
    # updated_at: max mtime among files within folder
    mtimes: List[float] = []
    for root, _, files in os.walk(folder):
        for f in files:
            try:
                mtimes.append(os.path.getmtime(os.path.join(root, f)))
            except Exception:
                pass
    try:
        mtime = max(mtimes) if mtimes else os.path.getmtime(folder)
        mtime_iso = datetime.fromtimestamp(mtime).isoformat()
    except Exception:
        mtime_iso = ctime
    return {"created_at": ctime, "updated_at": mtime_iso}


def load_timepoints(folder: str) -> Optional[List[Dict[str, Any]]]:
    # Look for JSON/YAML/CSV under the folder root
    files = listdir_safe(folder)
    # JSON
    for f in files:
        name, ext = os.path.splitext(f)
        if ext.lower() == ".json" and any(re.match(pat, name, re.IGNORECASE) for pat in TIMEPOINTS_PATTERNS):
            data = read_json(os.path.join(folder, f))
            if isinstance(data, list):
                return data
    # YAML
    for f in files:
        name, ext = os.path.splitext(f)
        if ext.lower() in (".yaml", ".yml") and any(re.match(pat, name, re.IGNORECASE) for pat in TIMEPOINTS_PATTERNS):
            data = read_yaml(os.path.join(folder, f))
            if isinstance(data, list):
                return data
    # CSV (simple: time,word)
    for f in files:
        name, ext = os.path.splitext(f)
        if ext.lower() == ".csv" and any(re.match(pat, name, re.IGNORECASE) for pat in TIMEPOINTS_PATTERNS):
            try:
                import csv  # local import
                out: List[Dict[str, Any]] = []
                with open(os.path.join(folder, f), "r", encoding="utf-8") as fh:
                    reader = csv.DictReader(fh)
                    for row in reader:
                        try:
                            t = float(row.get("time") or row.get("t") or 0)
                            w = row.get("word") or row.get("w") or row.get("text") or ""
                            out.append({"time": t, "word": w})
                        except Exception:
                            continue
                return out if out else None
            except Exception:
                return None
    return None


def process_song_folder(folder: str, base_dir: str) -> Dict[str, Any]:
    folder_name = os.path.basename(folder.rstrip("/\\"))
    titles = derive_titles_from_folder(folder_name)

    # Core media/files
    audio_path = first_matching_file(folder, AUDIO_EXTS)
    ppt_path = first_matching_file(folder, PPT_EXTS)

    # Prefer a general PDF file; if only sheet.pdf exists, it will be treated as pdf_file too
    pdf_path = first_matching_file(folder, PDF_EXTS)
    # A separate, non-PDF sheet file
    sheet_path = first_matching_file(folder, SHEET_EXTS)

    # Lyrics detection (flexible filenames)
    lyrics_fa = None
    lyrics_en = None
    fa_hint = first_matching_file(folder, TEXT_EXTS, LYRICS_FA_PATTERNS)
    en_hint = first_matching_file(folder, TEXT_EXTS, LYRICS_EN_PATTERNS)
    # Common fallback names
    lyrics_fa = read_text(fa_hint) or read_text(os.path.join(folder, "lyrics_fa.txt"))
    lyrics_en = read_text(en_hint) or read_text(os.path.join(folder, "lyrics_en.txt"))

    notation = read_text(os.path.join(folder, "notation.txt"))
    notes = read_text(os.path.join(folder, "notes.txt"))

    timepoints = load_timepoints(folder) or []

    # Base record
    data: Dict[str, Any] = {
        "id": hashlib.md5((folder_name + "|" + folder).encode("utf-8")).hexdigest()[:8],
        "title_fa": titles["title_fa"],
        "title_en": titles["title_en"],
        "artist": None,
        "composer": None,
        "audio_file": normalize_rel_path(audio_path, base_dir),
        "video_url": None,
        "pptx_file": normalize_rel_path(ppt_path, base_dir),
        # If the only pdf is sheet.pdf, it's okay; we still put it in pdf_file
        "pdf_file": normalize_rel_path(pdf_path, base_dir),
        "sheet_file": normalize_rel_path(sheet_path, base_dir),
        "lyrics_fa": lyrics_fa,
        "lyrics_en": lyrics_en,
        "notation": notation,
        "notes": notes,
        "attachments": list_attachments(folder),
        "timepoints": timepoints,
        **folder_times(folder),
    }

    # Merge user-provided metadata from info.json or info.yaml
    info_json = os.path.join(folder, "info.json")
    info_yaml = os.path.join(folder, "info.yaml")
    info_yml = os.path.join(folder, "info.yml")

    info: Dict[str, Any] = {}
    for ipath in (info_json, info_yaml, info_yml):
        if os.path.isfile(ipath):
            meta = read_json(ipath) if ipath.endswith(".json") else read_yaml(ipath)
            if isinstance(meta, dict):
                info.update(meta)

    if info:
        # Normalize known path fields that might be absolute in info
        for k in ["audio_file", "pptx_file", "pdf_file", "sheet_file"]:
            if k in info:
                info[k] = normalize_rel_path(info.get(k), base_dir)
        # Allow video_url override etc.
        data.update(info)

    return data


def find_song_folders(base_dir: str) -> List[str]:
    """Return top-level subfolders that look like song folders."""
    folders: List[str] = []
    for name in listdir_safe(base_dir):
        full = os.path.join(base_dir, name)
        if os.path.isdir(full) and is_song_folder(full):
            folders.append(full)
    return folders


def main() -> int:
    parser = argparse.ArgumentParser(description="Extract worship songs into a full JSON file.")
    parser.add_argument("--base", dest="base_dir", default=DEFAULT_BASE_DIR, help="Base folder containing song subfolders")
    parser.add_argument("--output", dest="output", default=DEFAULT_OUTPUT, help="Output JSON file (default: <base>/worship_songs_full.json)")
    args = parser.parse_args()

    base_dir = os.path.abspath(args.base_dir)
    if not os.path.isdir(base_dir):
        print(f"❌ Base folder not found: {base_dir}")
        return 2

    output = args.output or os.path.join(base_dir, "worship_songs_full.json")

    print(f"📂 Base: {base_dir}")
    print(f"📝 Output: {output}")

    song_folders = find_song_folders(base_dir)
    if not song_folders:
        print("⚠️ No song folders detected. Ensure each song has at least one of: audio, ppt, or lyrics file.")

    songs: List[Dict[str, Any]] = []
    for folder in sorted(song_folders):
        print(f"🎶 Processing: {os.path.basename(folder)}")
        try:
            songs.append(process_song_folder(folder, base_dir))
        except Exception as e:
            print(f"  ⚠️ Skipped {folder}: {e}")

    payload = {"worshipSongs": songs}

    try:
        with open(output, "w", encoding="utf-8") as fh:
            json.dump(payload, fh, ensure_ascii=False, indent=2)
        print(f"\n✅ Extraction complete. {len(songs)} songs exported to:\n{output}")
        return 0
    except Exception as e:
        print(f"❌ Failed to write output: {e}")
        return 1


if __name__ == "__main__":
    sys.exit(main())
