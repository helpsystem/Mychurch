#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
بازسازی کامل جداول Supabase
"""

import os
import sys
import psycopg2
from dotenv import load_dotenv

load_dotenv()

DATABASE_URL = os.getenv("DATABASE_URL")

if not DATABASE_URL:
    print("❌ DATABASE_URL در .env یافت نشد!")
    sys.exit(1)

SQL_DROP_AND_CREATE = """
-- حذف جداول قدیمی
DROP TABLE IF EXISTS bible_audio_files CASCADE;
DROP TABLE IF EXISTS bible_chapters CASCADE;
DROP TABLE IF EXISTS bible_books CASCADE;

-- ======================================================================
-- Bible Books Table
-- ======================================================================
CREATE TABLE bible_books (
    id SERIAL PRIMARY KEY,
    book_name VARCHAR(100) NOT NULL,
    book_name_fa VARCHAR(100),
    book_iso VARCHAR(10) UNIQUE NOT NULL,
    book_number INTEGER,
    testament VARCHAR(2) CHECK (testament IN ('OT', 'NT')),
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_bible_books_iso ON bible_books(book_iso);
CREATE INDEX idx_bible_books_number ON bible_books(book_number);

-- ======================================================================
-- Bible Chapters Table
-- ======================================================================
CREATE TABLE bible_chapters (
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

CREATE INDEX idx_bible_chapters_book ON bible_chapters(book_iso);
CREATE INDEX idx_bible_chapters_lang ON bible_chapters(language);
CREATE INDEX idx_bible_chapters_book_chapter ON bible_chapters(book_iso, chapter_number);

-- ======================================================================
-- Bible Audio Files Table
-- ======================================================================
CREATE TABLE bible_audio_files (
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

CREATE INDEX idx_bible_audio_book ON bible_audio_files(book_iso);
CREATE INDEX idx_bible_audio_lang ON bible_audio_files(language);
CREATE INDEX idx_bible_audio_file ON bible_audio_files(filepath);
"""

print("=" * 70)
print("🔧 بازسازی کامل جداول Supabase")
print("=" * 70)
print()

try:
    conn = psycopg2.connect(DATABASE_URL)
    cursor = conn.cursor()
    
    print("🗑️  حذف جداول قدیمی و ساخت جداول جدید...")
    cursor.execute(SQL_DROP_AND_CREATE)
    conn.commit()
    
    print("✅ جداول با موفقیت بازسازی شدند!")
    print()
    print("📋 جداول ساخته شده:")
    print("   • bible_books")
    print("   • bible_chapters (با ستون book_iso)")
    print("   • bible_audio_files")
    print()
    
    cursor.close()
    conn.close()
    
    print("🚀 حالا می‌تونید آپلود رو دوباره اجرا کنید:")
    print("   python upload-to-supabase.py")
    print()
    
except Exception as e:
    print(f"❌ خطا: {e}")
    sys.exit(1)
