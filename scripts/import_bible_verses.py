# -*- coding: utf-8 -*-
"""
import_bible_verses.py

Safe importer for Persian Bible PDFs / TXT into a Postgres `bible` table.

Features:
- Uses PyMuPDF (fitz) to extract text from PDFs, falls back to TXT if present.
- Supports dry-run (--dry-run) to report counts without touching DB.
- Supports --apply to insert rows into Postgres (uses DATABASE_URL env var).
- Optionally creates a backup of existing `bible` table before applying (--backup).
- Batch inserts using psycopg2.extras.execute_values for speed.

Usage examples:
  python scripts/import_bible_verses.py --dry-run
  python scripts/import_bible_verses.py --apply --backup

"""

from __future__ import annotations
import os
import re
import json
import argparse
import unicodedata
from typing import List, Tuple

try:
    import fitz  # PyMuPDF
except Exception:
    fitz = None

DB_TABLE = "bible"
DEFAULT_DB_NAME = "npyugcbr_iranjesusdc"
BATCH_SIZE = 1000

# Which versions to look for and the preferred filenames (if present)
VERSIONS = {
    "qadim":      "کتاب-مقدس-کامل-از-ترجمه-قدیم.pdf",
    "mojdeh":     "کتاب-مقدس-کامل-از-ترجمه-مژده.pdf",
    "tafsiri_ot": "عهدعتیق،ترجمه-تفسیری.pdf",
    "tafsiri_nt": "verses_tafsiri_nt.txt",  # prefer TXT for tafsiri_nt if available
}

# Where to search for files (looks in project root and public documents)
SEARCH_DIRS = [".", "public/documents/bible-pdfs"]

BIBLE_BOOKS_FA = [
    "پیدایش","خروج","لاویان","اعداد","تثنیه","یوشع","داوران","روت","اول سموئیل","دوم سموئیل",
    "اول پادشاهان","دوم پادشاهان","اول تواریخ","دوم تواریخ","عزرا","نحمیا","استر","ایوب","مزامیر",
    "امثال","جامعه","غزل غزلها","اشعیا","ارمیا","مراثی ارمیا","حزقیال","دانیال","هوشع","یوئیل",
    "عاموس","عوبدیا","یونس","میکاه","ناحوم","حبقوق","صفنیا","حجی","زکریا","ملاکی",
    "متی","مرقس","لوقا","یوحنا","اعمال رسولان","رومیان","اول قرنتیان","دوم قرنتیان",
    "غلاطیان","افسسیان","فیلیپیان","کولسیان","اول تسالونیکیان","دوم تسالونیکیان",
    "اول تیموتائوس","دوم تیموتائوس","تیتوس","فلیمون","عبرانیان","یعقوب",
    "اول پطرس","دوم پطرس","اول یوحنا","دوم یوحنا","سوم یوحنا","یهودا","مکاشفه"
]

# English -> Persian book name mapping (many filenames in public/documents are English)
EN_TO_FA = {
    'genesis':'پیدایش','exodus':'خروج','leviticus':'لاویان','numbers':'اعداد','deuteronomy':'تثنیه',
    'joshua':'یوشع','judges':'داوران','ruth':'روت','1samuel':'اول سموئیل','firstsamuel':'اول سموئیل','samuel1':'اول سموئیل','2samuel':'دوم سموئیل','secondsamuel':'دوم سموئیل','second-samuel':'دوم سموئیل',
    '1kings':'اول پادشاهان','first-kings':'اول پادشاهان','firstkings':'اول پادشاهان','2kings':'دوم پادشاهان','second-kings':'دوم پادشاهان','secondkings':'دوم پادشاهان',
    '1chronicles':'اول تواریخ','first-chronicles':'اول تواریخ','firstchronicles':'اول تواریخ','2chronicles':'دوم تواریخ','second-chronicles':'دوم تواریخ','secondchronicles':'دوم تواریخ',
    'ezra':'عزرا','nehemiah':'نحمیا','esther':'استر','job':'ایوب','psalms':'مزامیر','psalm':'مزامیر','proverbs':'امثال','ecclesiastes':'جامعه','song-of-solomon':'غزل غزلها','songofsolomon':'غزل غزلها','songs':'غزل غزلها',
    'isaiah':'اشعیا','jeremiah':'ارمیا','lamentations':'مراثی ارمیا','ezekiel':'حزقیال','daniel':'دانیال','hosea':'هوشع','joel':'یوئیل','amos':'عاموس','obadiah':'عوبدیا','jonah':'یونس','micah':'میکاه','nahum':'ناحوم','habakkuk':'حبقوق','zephaniah':'صفنیا','haggai':'حجی','zechariah':'زکریا','malachi':'ملاکی',
    'matthew':'متی','mark':'مرقس','luke':'لوقا','john':'یوحنا','acts':'اعمال رسولان','romans':'رومیان','1corinthians':'اول قرنتیان','first-corinthians':'اول قرنتیان','2corinthians':'دوم قرنتیان','second-corinthians':'دوم قرنتیان','galatians':'غلاطیان','ephesians':'افسسیان','philippians':'فیلیپیان','colossians':'کولسیان','1thessalonians':'اول تسالونیکیان','2thessalonians':'دوم تسالونیکیان','1timothy':'اول تیموتائوس','2timothy':'دوم تیموتائوس','titus':'تیتوس','philemon':'فلیمون','hebrews':'عبرانیان','james':'یعقوب','1peter':'اول پطرس','2peter':'دوم پطرس','1john':'اول یوحنا','2john':'دوم یوحنا','3john':'سوم یوحنا','jude':'یهودا','revelation':'مکاشفه'
}

def detect_book_from_filename(fn: str) -> str | None:
    s = fn.lower()
    s = re.sub(r'[^a-z0-9]', '', s)
    # try to find longest match first
    keys = sorted(EN_TO_FA.keys(), key=lambda k: -len(k))
    for k in keys:
        if k in s:
            return EN_TO_FA[k]
    return None

def _norm_filename(s: str) -> str:
    s = unicodedata.normalize('NFKC', s or '')
    s = s.replace('ي','ی').replace('ك','ک')
    s = re.sub(r'[\s\-_,]+', ' ', s)
    return s.lower()

def smart_find(code: str) -> str | None:
    pref = VERSIONS.get(code)
    # look in SEARCH_DIRS for preferred filename first
    if pref:
        for d in SEARCH_DIRS:
            p = os.path.join(d, pref)
            if os.path.exists(p):
                return p

    targets = [_norm_filename(tok) for tok in re.split(r'[\s_\-\.]+', code) if tok]
    # also add keywords of code
    keywords = []
    if code == 'qadim': keywords = ['قدیم']
    if code == 'mojdeh': keywords = ['مژده']
    if code == 'tafsiri_ot': keywords = ['عهد','عتیق','تفسیری']
    if code == 'tafsiri_nt': keywords = ['عهد','جدید','تفسیری','tafsiri']

    for d in SEARCH_DIRS:
        if not os.path.isdir(d):
            continue
        for fn in os.listdir(d):
            if not fn.lower().endswith(('.pdf', '.txt')):
                continue
            nf = _norm_filename(fn)
            if all(k in nf for k in [k for k in keywords if k]):
                return os.path.join(d, fn)
    return None

_digit_map = str.maketrans({
    "۰":"0","۱":"1","۲":"2","۳":"3","۴":"4","۵":"5","۶":"6","۷":"7","۸":"8","۹":"9",
    "٠":"0","١":"1","٢":"2","٣":"3","٤":"4","٥":"5","٦":"6","٧":"7","٨":"8","٩":"9",
})
def to_ascii_digits(s: str) -> str:
    return s.translate(_digit_map)

def clean_text(t: str) -> str:
    t = re.sub(r'[\u200c\u200d\uf0ff\uf0b7]', '', t)
    t = re.sub(r'\s+', ' ', t).strip()
    return t

def parse_text_content(full_text: str) -> List[Tuple[str,int,int,str]]:
    # mark book boundaries
    for book in BIBLE_BOOKS_FA:
        full_text = full_text.replace(f" {book} ", f"||BOOK||{book}||").replace(f"\n{book}\n", f"||BOOK||{book}||")

    rows: List[Tuple[str,int,int,str]] = []
    current_book = ""
    parts = full_text.split("||BOOK||")
    for block in parts:
        if not block.strip():
            continue
        if block in BIBLE_BOOKS_FA:
            current_book = block
            continue

        chapters = re.split(r'\s(\d{1,3})\s', block)
        chap = 0
        for part in chapters:
            if part.isdigit():
                chap = int(part); continue
            if chap == 0: continue

            pieces = re.split(r'(\d+)\s', part)
            verse = 0
            for ch in pieces:
                if ch.isdigit():
                    verse = int(ch); continue
                if verse and current_book:
                    text = clean_text(ch)
                    if len(text) > 1:
                        rows.append((current_book, chap, verse, text))
                verse = 0
    return rows

def parse_pdf(path: str) -> List[Tuple[str,int,int,str]]:
    if fitz is None:
        raise RuntimeError('PyMuPDF (fitz) is required to parse PDFs. Install with `pip install pymupdf`')
    doc = fitz.open(path)
    txt = "".join(page.get_text('text') for page in doc)
    txt = to_ascii_digits(txt)
    rows = parse_text_content(txt)
    # if parse_text_content returned nothing (per-book PDFs often lack book markers),
    # fall back to freestyle chapter/verse parsing and assume this file is a single book
    if rows:
        return rows
    # freestyle fallback
    book_guess = detect_book_from_filename(os.path.basename(path))
    if book_guess:
        return parse_pdf_freestyle(txt, book_guess)
    return rows

def parse_pdf_freestyle(full_text: str, book_fa: str) -> List[Tuple[str,int,int,str]]:
    # attempt to parse chapters and verses without book markers
    full_text = to_ascii_digits(full_text)
    rows: List[Tuple[str,int,int,str]] = []
    chapters = re.split(r'\s(\d{1,3})\s', full_text)
    cur_ch = 0
    for part in chapters:
        if part.isdigit():
            cur_ch = int(part); continue
        if cur_ch == 0:
            continue
        pieces = re.split(r'(\d+)\s', part)
        verse = 0
        for p in pieces:
            if p.isdigit():
                verse = int(p); continue
            if verse > 0:
                txt = clean_text(p)
                if len(txt) > 1:
                    rows.append((book_fa, cur_ch, verse, txt))
            verse = 0
    return rows

def parse_txt(path: str) -> List[Tuple[str,int,int,str]]:
    raw = open(path, 'r', encoding='utf-8-sig').read()
    raw = to_ascii_digits(raw)
    return parse_text_content(raw)

def collect_rows(only: List[str] | None = None) -> dict:
    todo = list(VERSIONS.keys()) if not only else [t for t in only if t in VERSIONS]
    out = {}
    total = 0
    for code in todo:
        path = smart_find(code)
        if not path:
            print(f"⚠️  منبع برای {code} پیدا نشد. در مسیرها بررسی کن.")
            out[code] = []
            continue
        print(f"→ پردازش {code}: {path}")
        ext = os.path.splitext(path)[1].lower()
        try:
            if ext == '.txt':
                rows = parse_txt(path)
            else:
                rows = parse_pdf(path)
        except Exception as e:
            print(f"   ⚠️ خطا هنگام پردازش {path}: {e}")
            rows = []
        print(f"   ✓ آیات استخراج‌شده: {len(rows)}")
        out[code] = rows
        total += len(rows)
    print(f"→ مجموع آیات استخراج‌شده: {total}")
    # If nothing was found from the expected version files, try scanning the
    # `public/documents/bible-pdfs` (or other SEARCH_DIRS) for per-book PDFs.
    if total == 0:
        print('\n⚠️ هیچ منبع کاملِ نسخه‌ای پیدا نشد؛ تلاش برای اسکن فایل‌های جداگانه (per-book) ...')
        per_book_rows = []
        files_seen = 0
        for d in SEARCH_DIRS:
            if not os.path.isdir(d):
                continue
            for fn in os.listdir(d):
                if not fn.lower().endswith(('.pdf', '.txt')):
                    continue
                files_seen += 1
                full = os.path.join(d, fn)
                book_fa = detect_book_from_filename(fn)
                try:
                    if fn.lower().endswith('.txt'):
                        r = parse_txt(full)
                    else:
                        r = parse_pdf(full)
                except Exception as e:
                    print(f"   ⚠️ خطا هنگام پردازش {full}: {e}")
                    r = []
                # If parser returned rows but with a wrong book name, and we have a book_fa from filename,
                # replace the book name in rows with the detected book.
                if r and book_fa:
                    r = [(book_fa, ch, vs, fa) for (_b,ch,vs,fa) in r]
                # If parser returned nothing but we have a book guess, try freestyle parse
                if not r and book_fa and fn.lower().endswith('.pdf'):
                    # open and extract raw text then freestyle parse
                    if fitz is not None:
                        doc = fitz.open(full)
                        raw = "".join(page.get_text('text') for page in doc)
                        r = parse_pdf_freestyle(raw, book_fa)
                print(f"   → {fn}: parsed {len(r)} rows; mapped book: {book_fa}")
                per_book_rows.extend(r)
        print(f"   ✓ Files scanned: {files_seen}; total verses parsed: {len(per_book_rows)}")
        out = {'split_pdf': per_book_rows}
    return out

def pg_connect_from_env():
    import os
    from urllib.parse import urlparse
    db_url = os.environ.get('DATABASE_URL')
    if not db_url:
        raise SystemExit('DATABASE_URL env var not set. Set it to your Postgres connection string (postgres://...)')
    # Ensure sslmode=require is present for hosted Postgres (Supabase/PGPool)
    if 'sslmode' not in db_url:
        sep = '&' if '?' in db_url else '?'
        db_url = db_url + sep + 'sslmode=require'
    import psycopg2
    # psycopg2 accepts a DSN string
    conn = psycopg2.connect(dsn=db_url)
    return conn

def ensure_table(conn):
    sql = f"""
    CREATE TABLE IF NOT EXISTS {DB_TABLE} (
      id BIGSERIAL PRIMARY KEY,
      version VARCHAR(64),
      book VARCHAR(128) NOT NULL,
      chapter INTEGER NOT NULL,
      verse_number INTEGER NOT NULL,
      text_fa TEXT NOT NULL,
      text_en TEXT,
      UNIQUE (version, book, chapter, verse_number)
    );
    CREATE INDEX IF NOT EXISTS idx_bible_ref ON {DB_TABLE} (book, chapter, verse_number);
    """
    with conn.cursor() as cur:
        cur.execute(sql)
    conn.commit()

def backup_table(conn, suffix: str):
    import time
    ts = suffix
    backup_name = f"{DB_TABLE}_backup_{ts}"
    with conn.cursor() as cur:
        cur.execute(f"DROP TABLE IF EXISTS {backup_name}")
        cur.execute(f"CREATE TABLE {backup_name} AS TABLE {DB_TABLE}")
    conn.commit()
    print(f"   ✓ Backup created: {backup_name}")

def apply_inserts(conn, rows_by_version: dict):
    from psycopg2.extras import execute_values
    total = 0
    with conn.cursor() as cur:
        for version, rows in rows_by_version.items():
            if not rows:
                continue
            # Deduplicate by (book,chapter,verse) keeping last occurrence
            seen = {}
            for (b,ch,vs,fa) in rows:
                key = (b, int(ch), int(vs))
                seen[key] = fa
            tuples = [(version, key[0], int(key[1]), int(key[2]), seen[key]) for key in seen]
            sql = f"INSERT INTO {DB_TABLE} (version, book, chapter, verse_number, text_fa) VALUES %s ON CONFLICT (version, book, chapter, verse_number) DO UPDATE SET text_fa = EXCLUDED.text_fa"
            # batch execute
            for i in range(0, len(tuples), BATCH_SIZE):
                batch = tuples[i:i+BATCH_SIZE]
                execute_values(cur, sql, batch, template=None, page_size=BATCH_SIZE)
            total += len(tuples)
            print(f"   ✓ Applied {len(tuples)} rows for version {version}")
    conn.commit()
    print(f"→ مجموع ردیف‌های درج‌شده/بروزرسانی‌شده: {total}")

def main():
    ap = argparse.ArgumentParser(description='Import Persian Bible PDFs/TXT into Postgres (bible table)')
    ap.add_argument('--dry-run', action='store_true', help='Only parse and report counts')
    ap.add_argument('--apply', action='store_true', help='Apply inserts to DATABASE_URL')
    ap.add_argument('--backup', action='store_true', help='Create a backup table before applying')
    ap.add_argument('--only', nargs='*', help='Limit to specific versions (qadim mojdeh tafsiri_ot tafsiri_nt)')
    args = ap.parse_args()

    rows = collect_rows(args.only)

    if args.dry_run or not args.apply:
        summary = {k: len(v) for k,v in rows.items()}
        print('\nDry-run summary:')
        print(json.dumps(summary, ensure_ascii=False, indent=2))
        return

    # Apply to DB
    try:
        conn = pg_connect_from_env()
    except Exception as e:
        raise SystemExit(f'Failed to connect to Postgres: {e}')

    # Ensure target table exists before attempting a backup
    ensure_table(conn)

    if args.backup:
        import datetime
        ts = datetime.datetime.utcnow().strftime('%Y%m%d%H%M%S')
        backup_table(conn, ts)
    apply_inserts(conn, rows)
    conn.close()

if __name__ == '__main__':
    main()
