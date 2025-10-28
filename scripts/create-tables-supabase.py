#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
ساخت خودکار جداول در Supabase
"""

import os
import sys
from dotenv import load_dotenv
from supabase import create_client, Client

# Load environment variables
load_dotenv()

SUPABASE_URL = os.getenv("SUPABASE_URL")
SUPABASE_KEY = os.getenv("SUPABASE_ANON_KEY")

if not SUPABASE_URL or not SUPABASE_KEY:
    print("❌ SUPABASE_URL یا SUPABASE_ANON_KEY در .env یافت نشد!")
    sys.exit(1)

# Initialize Supabase client
supabase: Client = create_client(SUPABASE_URL, SUPABASE_KEY)

SQL_CREATE_TABLES = """
-- ======================================================================
-- Bible Books Table
-- ======================================================================
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

CREATE INDEX IF NOT EXISTS idx_bible_books_iso ON bible_books(book_iso);
CREATE INDEX IF NOT EXISTS idx_bible_books_number ON bible_books(book_number);

-- ======================================================================
-- Bible Chapters Table
-- ======================================================================
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

CREATE INDEX IF NOT EXISTS idx_bible_chapters_book ON bible_chapters(book_iso);
CREATE INDEX IF NOT EXISTS idx_bible_chapters_lang ON bible_chapters(language);
CREATE INDEX IF NOT EXISTS idx_bible_chapters_book_chapter ON bible_chapters(book_iso, chapter_number);

-- ======================================================================
-- Bible Audio Files Table
-- ======================================================================
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

CREATE INDEX IF NOT EXISTS idx_bible_audio_book ON bible_audio_files(book_iso);
CREATE INDEX IF NOT EXISTS idx_bible_audio_lang ON bible_audio_files(language);
CREATE INDEX IF NOT EXISTS idx_bible_audio_file ON bible_audio_files(filepath);
"""

print("=" * 70)
print("🔧 ساخت جداول در Supabase")
print("=" * 70)
print()
print("⚠️  نکته مهم:")
print("   این اسکریپت نمی‌تواند مستقیماً SQL را در Supabase اجرا کند.")
print("   شما باید این مراحل را به صورت دستی انجام دهید:")
print()
print("📋 مراحل:")
print("   1. به Supabase Dashboard بروید:")
print(f"      {SUPABASE_URL.replace('/rest/v1', '')}")
print()
print("   2. به SQL Editor بروید (منوی سمت چپ)")
print()
print("   3. SQL زیر را کپی کنید:")
print()
print("-" * 70)
print(SQL_CREATE_TABLES)
print("-" * 70)
print()
print("   4. در SQL Editor paste کنید")
print()
print("   5. دکمه RUN را کلیک کنید")
print()
print("   6. بعد از ساخت جداول، دوباره اجرا کنید:")
print("      python upload-to-supabase.py")
print()
print("=" * 70)
print()

# Save SQL to file
sql_file = "output/bible_data/create_tables_supabase.sql"
os.makedirs(os.path.dirname(sql_file), exist_ok=True)
with open(sql_file, 'w', encoding='utf-8') as f:
    f.write(SQL_CREATE_TABLES)

print(f"✅ SQL ذخیره شد در: {sql_file}")
print()
