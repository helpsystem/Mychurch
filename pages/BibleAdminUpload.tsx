/**
 * Bible Admin Upload Page
 * 
 * Admin interface for uploading Bible translation files and managing import
 */

import React, { useState } from 'react';
import { Upload, FileText, Database, CheckCircle, AlertCircle, Loader } from 'lucide-react';
import { api } from '../lib/api';

interface ImportResult {
  success: boolean;
  book: string;
  verses: number;
  language: string;
  error?: string;
}

interface ParsedFile {
  name: string;
  size: number;
  type: string;
  content?: string;
}

export const BibleAdminUpload: React.FC = () => {
  const [selectedFiles, setSelectedFiles] = useState<File[]>([]);
  const [uploading, setUploading] = useState(false);
  const [importResults, setImportResults] = useState<ImportResult[]>([]);
  const [parseMode, setParseMode] = useState<'auto' | 'html' | 'json' | 'xml' | 'txt'>('auto');

  /**
   * Handle file selection
   */
  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(event.target.files || []);
    setSelectedFiles(files);
    setImportResults([]);
  };

  /**
   * Handle drag and drop
   */
  const handleDrop = (event: React.DragEvent<HTMLDivElement>) => {
    event.preventDefault();
    const files = Array.from(event.dataTransfer.files);
    setSelectedFiles(files);
    setImportResults([]);
  };

  const handleDragOver = (event: React.DragEvent<HTMLDivElement>) => {
    event.preventDefault();
  };

  /**
   * Parse HTML file
   */
  const parseHTML = (content: string): any[] => {
    const parser = new DOMParser();
    const doc = parser.parseFromString(content, 'text/html');
    const verses: any[] = [];

    // Try different HTML structures
    // Structure 1: <div class="verse" data-chapter="1" data-verse="1">Text</div>
    doc.querySelectorAll('[data-chapter][data-verse]').forEach(el => {
      verses.push({
        chapter: parseInt(el.getAttribute('data-chapter') || '1'),
        verse: parseInt(el.getAttribute('data-verse') || '1'),
        text: el.textContent?.trim() || ''
      });
    });

    // Structure 2: <p class="verse-1-1">Text</p>
    if (verses.length === 0) {
      doc.querySelectorAll('[class*="verse"]').forEach(el => {
        const match = el.className.match(/verse-(\d+)-(\d+)/);
        if (match) {
          verses.push({
            chapter: parseInt(match[1]),
            verse: parseInt(match[2]),
            text: el.textContent?.trim() || ''
          });
        }
      });
    }

    return verses;
  };

  /**
   * Parse JSON file
   */
  const parseJSON = (content: string): any[] => {
    const data = JSON.parse(content);
    
    if (Array.isArray(data)) {
      return data;
    }
    
    if (data.verses) {
      return data.verses;
    }
    
    if (data.chapters) {
      const verses: any[] = [];
      Object.entries(data.chapters).forEach(([chapterNum, chapterVerses]: [string, any]) => {
        if (Array.isArray(chapterVerses)) {
          chapterVerses.forEach((text, index) => {
            verses.push({
              chapter: parseInt(chapterNum),
              verse: index + 1,
              text: text
            });
          });
        }
      });
      return verses;
    }
    
    return [];
  };

  /**
   * Parse text file
   */
  const parseText = (content: string): any[] => {
    const lines = content.split('\n');
    const verses: any[] = [];
    let currentChapter = 1;
    let verseNumber = 1;

    for (const line of lines) {
      const trimmed = line.trim();
      if (!trimmed) continue;

      // Check for chapter markers
      const chapterMatch = trimmed.match(/^(?:Chapter|فصل)\s+(\d+)/i);
      if (chapterMatch) {
        currentChapter = parseInt(chapterMatch[1]);
        verseNumber = 1;
        continue;
      }

      // Check for verse numbers
      const verseMatch = trimmed.match(/^(\d+)[.:]\s*(.+)/);
      if (verseMatch) {
        verses.push({
          chapter: currentChapter,
          verse: parseInt(verseMatch[1]),
          text: verseMatch[2].trim()
        });
        verseNumber = parseInt(verseMatch[1]) + 1;
      } else if (trimmed.length > 10) {
        verses.push({
          chapter: currentChapter,
          verse: verseNumber++,
          text: trimmed
        });
      }
    }

    return verses;
  };

  /**
   * Detect language
   */
  const detectLanguage = (text: string): 'en' | 'fa' => {
    const persianRegex = /[\u0600-\u06FF]/;
    return persianRegex.test(text) ? 'fa' : 'en';
  };

  /**
   * Extract book name from filename
   */
  const extractBookName = (filename: string): string => {
    const name = filename.replace(/\.[^.]+$/, '');
    
    const bookPatterns = [
      'genesis', 'exodus', 'leviticus', 'numbers', 'deuteronomy',
      'joshua', 'judges', 'ruth', 'samuel', 'kings', 'chronicles',
      'ezra', 'nehemiah', 'esther', 'job', 'psalms', 'proverbs',
      'ecclesiastes', 'song', 'isaiah', 'jeremiah', 'lamentations',
      'ezekiel', 'daniel', 'hosea', 'joel', 'amos', 'obadiah',
      'jonah', 'micah', 'nahum', 'habakkuk', 'zephaniah', 'haggai',
      'zechariah', 'malachi',
      'matthew', 'mark', 'luke', 'john', 'acts', 'romans', 'corinthians',
      'galatians', 'ephesians', 'philippians', 'colossians', 'thessalonians',
      'timothy', 'titus', 'philemon', 'hebrews', 'james', 'peter', 'jude',
      'revelation',
      // Persian names
      'پیدایش', 'خروج', 'لاویان', 'اعداد', 'تثنیه',
      'متی', 'مرقس', 'لوقا', 'یوحنا', 'اعمال'
    ];

    for (const pattern of bookPatterns) {
      if (name.toLowerCase().includes(pattern)) {
        return pattern.charAt(0).toUpperCase() + pattern.slice(1);
      }
    }

    return name;
  };

  /**
   * Process and upload files
   */
  const handleUpload = async () => {
    if (selectedFiles.length === 0) return;

    setUploading(true);
    const results: ImportResult[] = [];

    for (const file of selectedFiles) {
      try {
        // Read file content
        const content = await file.text();
        let verses: any[] = [];

        // Parse based on file type
        const extension = file.name.split('.').pop()?.toLowerCase();
        
        if (parseMode === 'auto' || parseMode === extension) {
          switch (extension) {
            case 'html':
            case 'htm':
              verses = parseHTML(content);
              break;
            case 'json':
              verses = parseJSON(content);
              break;
            case 'xml':
              // For XML, would need xml2js library
              console.warn('XML parsing not fully implemented');
              break;
            case 'txt':
              verses = parseText(content);
              break;
            default:
              verses = parseText(content); // Fallback to text parsing
          }
        }

        if (verses.length === 0) {
          results.push({
            success: false,
            book: file.name,
            verses: 0,
            language: 'unknown',
            error: 'No verses found'
          });
          continue;
        }

        // Detect language
        const language = detectLanguage(verses[0].text);
        
        // Extract book name
        const bookName = extractBookName(file.name);

        // Send to backend
        const response = await api.post('/api/bible/import', {
          book: bookName,
          language,
          verses
        });

        results.push({
          success: true,
          book: bookName,
          verses: verses.length,
          language
        });

      } catch (error: any) {
        results.push({
          success: false,
          book: file.name,
          verses: 0,
          language: 'unknown',
          error: error.message
        });
      }
    }

    setImportResults(results);
    setUploading(false);
  };

  /**
   * Format file size
   */
  const formatFileSize = (bytes: number): string => {
    if (bytes < 1024) return bytes + ' B';
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB';
    return (bytes / (1024 * 1024)).toFixed(1) + ' MB';
  };

  return (
    <div className="bible-admin-upload max-w-4xl mx-auto p-6">
      <h1 className="text-3xl font-bold mb-6">Bible Text Import</h1>

      {/* Upload Area */}
      <div
        onDrop={handleDrop}
        onDragOver={handleDragOver}
        className="upload-area border-2 border-dashed border-gray-300 rounded-lg p-8 mb-6 text-center hover:border-blue-400 transition-colors cursor-pointer"
      >
        <Upload size={48} className="mx-auto mb-4 text-gray-400" />
        <input
          type="file"
          multiple
          accept=".html,.htm,.json,.xml,.txt"
          onChange={handleFileSelect}
          className="hidden"
          id="file-upload"
        />
        <label htmlFor="file-upload" className="cursor-pointer">
          <p className="text-lg mb-2">
            Drop Bible files here or <span className="text-blue-500">browse</span>
          </p>
          <p className="text-sm text-gray-500">
            Supported formats: HTML, JSON, XML, TXT
          </p>
        </label>
      </div>

      {/* Parse Mode Selection */}
      <div className="parse-mode mb-6">
        <label className="block text-sm font-medium mb-2">Parse Mode</label>
        <select
          value={parseMode}
          onChange={(e) => setParseMode(e.target.value as any)}
          className="border border-gray-300 rounded p-2 w-full"
        >
          <option value="auto">Auto-detect</option>
          <option value="html">HTML</option>
          <option value="json">JSON</option>
          <option value="xml">XML</option>
          <option value="txt">Plain Text</option>
        </select>
      </div>

      {/* Selected Files */}
      {selectedFiles.length > 0 && (
        <div className="selected-files mb-6">
          <h3 className="font-semibold mb-3">Selected Files ({selectedFiles.length})</h3>
          <div className="space-y-2">
            {selectedFiles.map((file, index) => (
              <div key={index} className="flex items-center justify-between bg-gray-50 p-3 rounded">
                <div className="flex items-center gap-3">
                  <FileText size={20} className="text-gray-500" />
                  <div>
                    <p className="font-medium">{file.name}</p>
                    <p className="text-sm text-gray-500">{formatFileSize(file.size)}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>

          <button
            onClick={handleUpload}
            disabled={uploading}
            className="mt-4 w-full bg-blue-500 text-white py-3 rounded-lg hover:bg-blue-600 disabled:bg-gray-400 flex items-center justify-center gap-2"
          >
            {uploading ? (
              <>
                <Loader className="animate-spin" size={20} />
                Processing...
              </>
            ) : (
              <>
                <Database size={20} />
                Import to Database
              </>
            )}
          </button>
        </div>
      )}

      {/* Import Results */}
      {importResults.length > 0 && (
        <div className="import-results">
          <h3 className="font-semibold mb-3">Import Results</h3>
          <div className="space-y-2">
            {importResults.map((result, index) => (
              <div
                key={index}
                className={`flex items-center justify-between p-4 rounded-lg ${
                  result.success ? 'bg-green-50 border border-green-200' : 'bg-red-50 border border-red-200'
                }`}
              >
                <div className="flex items-center gap-3">
                  {result.success ? (
                    <CheckCircle size={24} className="text-green-500" />
                  ) : (
                    <AlertCircle size={24} className="text-red-500" />
                  )}
                  <div>
                    <p className="font-medium">{result.book}</p>
                    {result.success ? (
                      <p className="text-sm text-gray-600">
                        {result.verses} verses • {result.language === 'fa' ? 'Persian' : 'English'}
                      </p>
                    ) : (
                      <p className="text-sm text-red-600">{result.error}</p>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Instructions */}
      <div className="instructions mt-8 bg-blue-50 border border-blue-200 rounded-lg p-6">
        <h3 className="font-semibold mb-3">File Format Instructions</h3>
        
        <div className="space-y-4 text-sm">
          <div>
            <strong>HTML Format:</strong>
            <pre className="bg-white p-2 rounded mt-1 overflow-x-auto">
{`<div class="verse" data-chapter="1" data-verse="1">
  In the beginning God created the heaven and the earth.
</div>`}
            </pre>
          </div>

          <div>
            <strong>JSON Format:</strong>
            <pre className="bg-white p-2 rounded mt-1 overflow-x-auto">
{`{
  "chapters": {
    "1": [
      "In the beginning God created...",
      "And the earth was without form..."
    ]
  }
}`}
            </pre>
          </div>

          <div>
            <strong>Plain Text Format:</strong>
            <pre className="bg-white p-2 rounded mt-1 overflow-x-auto">
{`Chapter 1
1. In the beginning God created the heaven and the earth.
2. And the earth was without form, and void...`}
            </pre>
          </div>
        </div>
      </div>
    </div>
  );
};

export default BibleAdminUpload;
