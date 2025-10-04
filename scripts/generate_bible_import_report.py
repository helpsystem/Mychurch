# -*- coding: utf-8 -*-
"""
generate_bible_import_report.py

Scans per-book PDFs/TXTs, parses verse counts per source file, queries the `bible` table
for counts per mapped book, and writes `scripts/report_bible_imports.json` and `.csv`.

Usage:
  python scripts/generate_bible_import_report.py

Requires: pymupdf and psycopg2 installed and DATABASE_URL env var set.
"""
from __future__ import annotations
import os, re, json, csv
import unicodedata
from typing import List, Tuple

SEARCH_DIRS = ["public/documents/bible-pdfs"]

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
    keys = sorted(EN_TO_FA.keys(), key=lambda k: -len(k))
    for k in keys:
        if k in s:
            return EN_TO_FA[k]
    return None

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
    import fitz
    doc = fitz.open(path)
    txt = "".join(page.get_text('text') for page in doc)
    txt = to_ascii_digits(txt)
    rows = parse_text_content(txt)
    if rows:
        return rows
    # fallback: try to detect book from filename and freestyle parse
    book_guess = detect_book_from_filename(os.path.basename(path))
    if book_guess:
        return parse_pdf_freestyle(txt, book_guess)
    return rows

def parse_pdf_freestyle(full_text: str, book_fa: str) -> List[Tuple[str,int,int,str]]:
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

def collect_files() -> List[str]:
    out = []
    for d in SEARCH_DIRS:
        if not os.path.isdir(d):
            continue
        for fn in os.listdir(d):
            if fn.lower().endswith(('.pdf', '.txt')):
                out.append(os.path.join(d, fn))
    return sorted(out)

def get_db_counts():
    import psycopg2
    import os
    db_url = os.environ.get('DATABASE_URL')
    if not db_url:
        raise SystemExit('Set DATABASE_URL in environment')
    if 'sslmode' not in db_url:
        sep = '&' if '?' in db_url else '?'
        db_url = db_url + sep + 'sslmode=require'
    conn = psycopg2.connect(dsn=db_url)
    cur = conn.cursor()
    cur.execute('SELECT book, COUNT(*) FROM bible GROUP BY book')
    d = {r[0]: r[1] for r in cur.fetchall()}
    cur.close(); conn.close()
    return d

def main():
    files = collect_files()
    results = []
    for f in files:
        fn = os.path.basename(f)
        mapped = detect_book_from_filename(fn)
        try:
            if fn.lower().endswith('.txt'):
                rows = parse_txt(f)
            else:
                rows = parse_pdf(f)
        except Exception as e:
            print(f'Error parsing {f}:', e)
            rows = []
        results.append({
            'file': fn,
            'path': f,
            'mapped_book': mapped,
            'extracted_count': len(rows)
        })

    db_counts = get_db_counts()
    for r in results:
        mb = r['mapped_book']
        r['db_count_for_book'] = db_counts.get(mb, 0) if mb else None

    out_json = os.path.join('scripts', 'report_bible_imports.json')
    out_csv = os.path.join('scripts', 'report_bible_imports.csv')
    with open(out_json, 'w', encoding='utf-8') as f:
        json.dump(results, f, ensure_ascii=False, indent=2)
    with open(out_csv, 'w', encoding='utf-8', newline='') as f:
        writer = csv.DictWriter(f, fieldnames=['file','path','mapped_book','extracted_count','db_count_for_book'])
        writer.writeheader()
        for r in results:
            writer.writerow(r)

    print(f'Reports written: {out_json} and {out_csv} (files: {len(results)})')

if __name__ == '__main__':
    main()
