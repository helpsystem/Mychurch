#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
ساخت خودکار جداول در Supabase با استفاده از REST API
"""

import os
import sys
import requests
from dotenv import load_dotenv

# Load environment variables
load_dotenv()

SUPABASE_URL = os.getenv("SUPABASE_URL")
SUPABASE_KEY = os.getenv("SUPABASE_SERVICE_KEY") or os.getenv("SUPABASE_ANON_KEY")

if not SUPABASE_URL or not SUPABASE_KEY:
    print("❌ SUPABASE_URL یا SUPABASE_KEY در .env یافت نشد!")
    sys.exit(1)

# SQL برای ساخت جداول
SQL_STATEMENTS = [
    # Bible Books Table
    """
    CREATE TABLE IF NOT EXISTS bible_books (
        id SERIAL PRIMARY KEY,
        book_name VARCHAR(100) NOT NULL,
        book_name_fa VARCHAR(100),
        book_iso VARCHAR(10) UNIQUE NOT NULL,
        book_number INTEGER,
        testament VARCHAR(2) CHECK (testament IN ('OT', 'NT')),
        created_at TIMESTAMP DEFAULT NOW(),
        updated_at TIMESTAMP DEFAULT NOW()
    );
    """,
    "CREATE INDEX IF NOT EXISTS idx_bible_books_iso ON bible_books(book_iso);",
    "CREATE INDEX IF NOT EXISTS idx_bible_books_number ON bible_books(book_number);",
    
    # Bible Chapters Table
    """
    CREATE TABLE IF NOT EXISTS bible_chapters (
        id SERIAL PRIMARY KEY,
        book_iso VARCHAR(10) NOT NULL,
        chapter_number INTEGER NOT NULL,
        language VARCHAR(20) NOT NULL,
        text_content TEXT,
        audio_url VARCHAR(500),
        created_at TIMESTAMP DEFAULT NOW(),
        updated_at TIMESTAMP DEFAULT NOW(),
        UNIQUE(book_iso, chapter_number, language)
    );
    """,
    "CREATE INDEX IF NOT EXISTS idx_bible_chapters_book ON bible_chapters(book_iso);",
    "CREATE INDEX IF NOT EXISTS idx_bible_chapters_lang ON bible_chapters(language);",
    "CREATE INDEX IF NOT EXISTS idx_bible_chapters_book_chapter ON bible_chapters(book_iso, chapter_number);",
    
    # Bible Audio Files Table
    """
    CREATE TABLE IF NOT EXISTS bible_audio_files (
        id SERIAL PRIMARY KEY,
        book_iso VARCHAR(10),
        chapter_number INTEGER,
        language VARCHAR(20) NOT NULL,
        filename VARCHAR(255) NOT NULL,
        filepath VARCHAR(1000) UNIQUE NOT NULL,
        file_size INTEGER,
        url VARCHAR(500),
        duration FLOAT,
        created_at TIMESTAMP DEFAULT NOW(),
        updated_at TIMESTAMP DEFAULT NOW()
    );
    """,
    "CREATE INDEX IF NOT EXISTS idx_bible_audio_book ON bible_audio_files(book_iso);",
    "CREATE INDEX IF NOT EXISTS idx_bible_audio_lang ON bible_audio_files(language);",
    "CREATE INDEX IF NOT EXISTS idx_bible_audio_file ON bible_audio_files(filepath);",
]

print("=" * 70)
print("🔧 ساخت خودکار جداول در Supabase")
print("=" * 70)
print()
print(f"📡 اتصال به: {SUPABASE_URL}")
print()

# استفاده از Database URL مستقیم اگر موجود باشه
database_url = os.getenv("DATABASE_URL")

if database_url:
    print("✅ استفاده از اتصال مستقیم دیتابیس")
    print()
    
    try:
        import psycopg2
        
        # اتصال به دیتابیس
        conn = psycopg2.connect(database_url)
        cursor = conn.cursor()
        
        success_count = 0
        error_count = 0
        
        for i, sql in enumerate(SQL_STATEMENTS, 1):
            try:
                print(f"[{i}/{len(SQL_STATEMENTS)}] اجرای دستور SQL...")
                cursor.execute(sql)
                conn.commit()
                success_count += 1
                print(f"    ✅ موفق")
            except Exception as e:
                conn.rollback()  # Rollback failed transaction
                error_count += 1
                error_msg = str(e).split('\n')[0][:100]
                print(f"    ⚠️  {error_msg}")
        
        cursor.close()
        conn.close()
        
        print()
        print("=" * 70)
        print(f"✅ تمام شد! {success_count} موفق، {error_count} خطا")
        print("=" * 70)
        print()
        print("🚀 حالا می‌تونید آپلود رو شروع کنید:")
        print("   python upload-to-supabase.py")
        print()
        
    except ImportError:
        print("❌ psycopg2 نصب نیست! نصب کنید:")
        print("   pip install psycopg2-binary")
        sys.exit(1)
    except Exception as e:
        print(f"❌ خطا در اتصال به دیتابیس: {e}")
        sys.exit(1)
else:
    print("⚠️  DATABASE_URL در .env یافت نشد!")
    print()
    print("لطفاً یکی از این کارها رو انجام بدید:")
    print()
    print("1️⃣  DATABASE_URL رو به .env اضافه کنید:")
    print("   DATABASE_URL=postgresql://postgres:password@db.xxx.supabase.co:5432/postgres")
    print()
    print("2️⃣  یا به صورت دستی SQL رو اجرا کنید:")
    print(f"   فایل: scripts/output/bible_data/create_tables_supabase.sql")
    print()
    sys.exit(1)
