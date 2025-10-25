#!/usr/bin/env python3
"""
Convert a Kalameh full-archive export into the frontend format and copy assets
into Mychurch/public/worship so the site can play audio and offer downloads.

Input structure (produced by your extractor):
    <BASE_DIR>/exported_full_archive/
        - audio/*.mp3
        - pptx/*.pptx
        - videos/* (optional)
        - docs/* (pdf/doc)
        - data/worship_songs_full.json  # raw objects

Output (frontend):
    <REPO_ROOT>/public/worship/
        - audio/*.mp3
        - pptx/*.pptx
        - docs/*
        - data/worship_songs.json       # normalized array of WorshipSong

WorshipSong shape expected by frontend (types.ts):
{
    id: number,
    title: { fa: string, en: string, es?: string },
    artist: string,
    youtubeId?: string,
    audioUrl?: string,
    videoUrl?: string,
    presentationFileUrl?: string,
    pdfFileUrl?: string,
    sheetMusicUrl?: string,
    lyrics?: { fa?: string, en?: string },
    timepoints?: Array<{ time: number, word: string }>
}

Run:
    py scripts/convert_kalameh_export_to_frontend.py --export-dir "C:\\path\\to\\exported_full_archive"
    # or set env KALAMEH_EXPORT_DIR, or place folder at ./exported_full_archive or ./attached_assets/exported_full_archive
"""
import argparse
import json
import os
import re
import shutil
from pathlib import Path

 # ---- CONFIG ----
# Default path where your exported_full_archive might be located (can be overridden)
DEFAULT_EXPORT_DIR = r"D:\\Windows.old\\Users\\Sami\\Desktop\\Iran Church DC\\My Web Sites\\Bible\\www.kalameh.com\\exported_full_archive"
# Will be resolved at runtime in main()
EXPORT_DIR = DEFAULT_EXPORT_DIR
# Repo root (auto-detected from this script location)
REPO_ROOT = str(Path(__file__).resolve().parents[1])
PUBLIC_WORSHIP = os.path.join(REPO_ROOT, 'public', 'worship')
PUBLIC_AUDIO = os.path.join(PUBLIC_WORSHIP, 'audio')
PUBLIC_PPTX  = os.path.join(PUBLIC_WORSHIP, 'pptx')
PUBLIC_DOCS  = os.path.join(PUBLIC_WORSHIP, 'docs')
PUBLIC_DATA  = os.path.join(PUBLIC_WORSHIP, 'data')

# These depend on the resolved export dir; set later in main()
RAW_JSON = None
OUT_JSON = os.path.join(PUBLIC_DATA, 'worship_songs.json')

# ---- UTILS ----
YOUTUBE_RE = re.compile(r"(?:v=|youtu.be/|embed/)([A-Za-z0-9_-]{6,})")

def ensure_dirs():
    for d in [PUBLIC_AUDIO, PUBLIC_PPTX, PUBLIC_DOCS, PUBLIC_DATA]:
        os.makedirs(d, exist_ok=True)


def youtube_id_from(url: str | None) -> str | None:
    if not url:
        return None
    m = YOUTUBE_RE.search(url)
    return m.group(1) if m else None


def copy_if_exists(src_rel: str | None, src_base: str, dst_dir: str) -> str | None:
    """Copy a file from export to public folder if exists. Returns public relative URL."""
    if not src_rel:
        return None
    # src_rel like './audio/file.mp3' or './pptx/file.pptx'
    src_rel_clean = src_rel.replace('./', '').replace('/', os.sep)
    src_path = os.path.join(src_base, src_rel_clean)
    if not os.path.isfile(src_path):
        return None
    os.makedirs(dst_dir, exist_ok=True)
    dst_path = os.path.join(dst_dir, os.path.basename(src_path))
    if os.path.abspath(src_path) != os.path.abspath(dst_path):
        shutil.copy2(src_path, dst_path)
    # public URL
    public_sub = os.path.basename(dst_dir)
    return f"/worship/{public_sub}/{os.path.basename(dst_path)}"


def normalize_song(raw: dict, idx: int) -> dict:
    title_fa = raw.get('title_fa') or raw.get('titleFa') or ''
    title_en = raw.get('title_en') or raw.get('titleEn') or ''
    artist   = raw.get('title_en') or raw.get('song_author') or raw.get('artist') or ''
    composer = raw.get('composer') or ''

    # Prefer author as artist; fallback to composer
    artist_final = artist or composer

    ytid = youtube_id_from(raw.get('video_url') or raw.get('videoUrl'))

    audio_url = copy_if_exists(raw.get('audio_file'), EXPORT_DIR, PUBLIC_AUDIO)
    pptx_url  = copy_if_exists(raw.get('pptx_file'),  EXPORT_DIR, PUBLIC_PPTX)

    # Try to detect PDF/doc as sheet or pdf and also build attachments list
    pdf_url = None
    sheet_url = None
    attachments_list: list[dict] = []
    for att in raw.get('attachments', []) or []:
        name = (att.get('name') or '').strip()
        lower = name.lower()
        path = att.get('path')
        url = copy_if_exists(path, EXPORT_DIR, PUBLIC_DOCS)
        if url:
            attachments_list.append({'name': name or os.path.basename(url), 'url': url})
        if lower.endswith('.pdf') and not pdf_url:
            pdf_url = url
        elif (lower.endswith('.doc') or lower.endswith('.docx')) and not sheet_url:
            sheet_url = url

    lyrics_fa = raw.get('lyrics_text') or ''

    return {
        'id': idx,
        'title': {'fa': title_fa, 'en': title_en},
        'artist': artist_final,
        'youtubeId': ytid or '',
        'audioUrl': audio_url or '',
        'videoUrl': raw.get('video_url') or '',
        'presentationFileUrl': pptx_url or '',
        'pdfFileUrl': pdf_url or '',
        'sheetMusicUrl': sheet_url or '',
        # Optional extended metadata if present in source
        'chord': raw.get('chord') or raw.get('chord_base') or '',
        'mode': raw.get('mode') or '',
        'notation': raw.get('notation') or '',
        'notes': raw.get('notes') or '',
        'attachments': attachments_list,
        'lyrics': {'fa': lyrics_fa} if lyrics_fa else {},
        'timepoints': [],
    }


def find_export_dir(cli_arg: str | None) -> str | None:
    """Resolve export directory via precedence: CLI > ENV > common locations > default."""
    # 1) CLI argument
    if cli_arg:
        return cli_arg
    # 2) Environment variable
    env_dir = os.environ.get('KALAMEH_EXPORT_DIR')
    if env_dir:
        return env_dir
    # 3) Common locations inside the repo
    candidates = [
        os.path.join(REPO_ROOT, 'exported_full_archive'),
        os.path.join(REPO_ROOT, 'attached_assets', 'exported_full_archive'),
    ]
    # Also scan attached_assets for any dir that contains the name
    aa = os.path.join(REPO_ROOT, 'attached_assets')
    if os.path.isdir(aa):
        for name in os.listdir(aa):
            p = os.path.join(aa, name)
            if os.path.isdir(p) and 'exported_full_archive' in name:
                candidates.append(p)
    # 4) Fallback to historical default path
    candidates.append(DEFAULT_EXPORT_DIR)

    for c in candidates:
        if os.path.isdir(c):
            return c
    return None


def main():
    parser = argparse.ArgumentParser(description='Convert Kalameh worship export to frontend format')
    parser.add_argument('--export-dir', dest='export_dir', help='Path to exported_full_archive directory')
    args = parser.parse_args()

    export_dir = find_export_dir(args.export_dir)
    if not export_dir:
        print("❌ Export directory not found. Provide with --export-dir or set KALAMEH_EXPORT_DIR.")
        print("   Also accepted locations: ./exported_full_archive or ./attached_assets/exported_full_archive")
        return

    global RAW_JSON, EXPORT_DIR  # set the module-level vars now that we know the directory
    RAW_JSON = os.path.join(export_dir, 'data', 'worship_songs_full.json')
    EXPORT_DIR = export_dir

    if not os.path.isfile(RAW_JSON):
        print(f"❌ Raw JSON not found: {RAW_JSON}")
        return

    ensure_dirs()

    with open(RAW_JSON, 'r', encoding='utf-8') as f:
        raw_songs = json.load(f)

    normalized: list[dict] = []
    for i, raw in enumerate(raw_songs, start=1):
        normalized.append(normalize_song(raw, i))

    # Optional: de-duplicate by FA+artist
    seen = set()
    deduped = []
    for s in normalized:
        key = (s['title'].get('fa', '').strip(), s.get('artist', '').strip())
        if key in seen:
            continue
        seen.add(key)
        deduped.append(s)

    with open(OUT_JSON, 'w', encoding='utf-8') as f:
        json.dump(deduped, f, ensure_ascii=False)

    print(f"✅ Wrote {len(deduped)} songs to {OUT_JSON}")
    print(f"📁 Assets copied to: {PUBLIC_WORSHIP}")
    print("➡️  Now run: npm run build ; then deploy to server")

if __name__ == '__main__':
    main()
