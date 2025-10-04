# -*- coding: utf-8 -*-
"""
db_sanity_checks.py

Run quick sanity SELECTs on the `bible` table and print results.

Usage:
  python scripts/db_sanity_checks.py

Requires: DATABASE_URL env var and psycopg2 installed in the environment.
"""
from __future__ import annotations
import os
import sys
import json

def get_conn():
    import psycopg2
    db_url = os.environ.get('DATABASE_URL')
    if not db_url:
        raise SystemExit('DATABASE_URL not set in environment')
    if 'sslmode' not in db_url:
        sep = '&' if '?' in db_url else '?'
        db_url = db_url + sep + 'sslmode=require'
    return psycopg2.connect(dsn=db_url)

def run():
    conn = get_conn()
    cur = conn.cursor()

    print('=== Total rows in bible ===')
    cur.execute('SELECT COUNT(*) FROM bible')
    print(cur.fetchone()[0])
    print()

    print('=== Counts per book (top 50) ===')
    cur.execute("SELECT book, COUNT(*) AS cnt FROM bible GROUP BY book ORDER BY cnt DESC LIMIT 50")
    rows = cur.fetchall()
    for book,cnt in rows:
        print(f"{cnt:6d}  {book}")
    print()

    print('=== Counts per version/book ===')
    cur.execute("SELECT version, book, COUNT(*) FROM bible GROUP BY version, book ORDER BY version, book")
    rows = cur.fetchall()
    for version,book,cnt in rows:
        print(f"{version:12s} | {cnt:5d} | {book}")
    print()

    # Top books sample rows: take top 5 books by count
    cur.execute("SELECT book FROM bible GROUP BY book ORDER BY COUNT(*) DESC LIMIT 5")
    top_books = [r[0] for r in cur.fetchall()]
    print('=== Sample rows for top books ===')
    for b in top_books:
        print(f"-- {b} --")
        cur.execute("SELECT chapter, verse_number, text_fa FROM bible WHERE book=%s ORDER BY chapter, verse_number LIMIT 10", (b,))
        for ch,vs,txt in cur.fetchall():
            short = (txt[:120] + '...') if len(txt) > 120 else txt
            print(f"{b} {ch}:{vs}  {short}")
        print()

    cur.close()
    conn.close()

if __name__ == '__main__':
    try:
        run()
    except Exception as e:
        print('Error:', e)
        sys.exit(1)
