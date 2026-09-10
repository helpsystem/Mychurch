import { createWorker } from 'tesseract.js';

export interface ExtractedEntities {
    documentType: string;
    certificateNumber?: string;
    dates: string[];
    names: string[];
    organization?: string;
    keywords: string[];
}

export interface OCRResult {
    rawText: string;
    confidence: number;
    language: string;
    entities: ExtractedEntities;
    summary: string;
    suggestedTitle: string;
    suggestedCategory: 'baptism' | 'marriage' | 'letter' | 'invoice' | 'identity' | 'contract' | 'archive';
}

/**
 * Normalizes Persian/Arabic digits to English digits for consistent regex parsing
 */
function normalizeDigits(str: string): string {
    const persianDigits = ['۰', '۱', '۲', '۳', '۴', '۵', '۶', '۷', '۸', '۹'];
    const arabicDigits = ['٠', '١', '٢', '٣', '٤', '٥', '٦', '٧', '٨', '٩'];
    let result = str;
    for (let i = 0; i < 10; i++) {
        result = result.replace(new RegExp(persianDigits[i], 'g'), i.toString());
        result = result.replace(new RegExp(arabicDigits[i], 'g'), i.toString());
    }
    return result;
}

/**
 * Extracts structured entities, dates, numbers, and document category from raw OCR text
 */
export function extractEntitiesFromText(rawText: string): {
    entities: ExtractedEntities;
    summary: string;
    suggestedTitle: string;
    suggestedCategory: OCRResult['suggestedCategory'];
} {
    const normalized = normalizeDigits(rawText);
    const lines = rawText.split('\n').map(l => l.trim()).filter(Boolean);

    // 1. Detect Dates (Solar Hijri & Gregorian)
    const dates: string[] = [];
    
    // Solar Hijri format (e.g., 1402/05/12 or 1399/11/04)
    const shamsiRegex = /\b(13\d{2}|14\d{2})[\/\-.](0?[1-9]|1[0-2])[\/\-.](0?[1-9]|[12]\d|3[01])\b/g;
    let match;
    while ((match = shamsiRegex.exec(normalized)) !== null) {
        dates.push(match[0]);
    }

    // Gregorian format (e.g., 2023-11-20 or 2024/04/15)
    const miladiRegex = /\b(19\d{2}|20\d{2})[\/\-.](0?[1-9]|1[0-2])[\/\-.](0?[1-9]|[12]\d|3[01])\b/g;
    while ((match = miladiRegex.exec(normalized)) !== null) {
        if (!dates.includes(match[0])) {
            dates.push(match[0]);
        }
    }

    // Persian text month names (فروردین، اردیبهشت، ...، دی، بهمن، اسفند)
    const persianMonthRegex = /(\d{1,2})\s+(فروردین|اردیبهشت|خرداد|تیر|مرداد|شهریور|مهر|آبان|آذر|دی|بهمن|اسفند)\s+(13\d{2}|14\d{2})/g;
    while ((match = persianMonthRegex.exec(normalized)) !== null) {
        dates.push(match[0]);
    }

    // English text month names (January, February, etc.)
    const engMonthRegex = /(?:Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec)[a-z]*\s+\d{1,2},?\s+(?:19|20)\d{2}/gi;
    while ((match = engMonthRegex.exec(rawText)) !== null) {
        dates.push(match[0]);
    }

    // 2. Certificate or Reference Number
    let certificateNumber: string | undefined;
    const certNumberRegexes = [
        /(?:شماره(?:\s+ثبت|\s+سریال|\s+نامه|\s+گواهی)?|شمار‌ه|شماره|ref|no|cert(?:ificate)?\s*(?:no|#)?)\s*[:#\-]?\s*([A-Za-z0-9\-_/]{3,25})/i,
        /(?:کد|شناسه)\s*[:#\-]?\s*([A-Za-z0-9\-_/]{4,25})/i
    ];
    for (const rx of certNumberRegexes) {
        const m = rx.exec(normalized);
        if (m && m[1]) {
            certificateNumber = m[1].trim();
            break;
        }
    }

    // 3. Document Category & Suggested Title
    let suggestedCategory: OCRResult['suggestedCategory'] = 'archive';
    let suggestedTitle = 'سند اسکن شده بدون عنوان';

    const lower = rawText.toLowerCase();
    if (lower.includes('تعمید') || lower.includes('baptism') || lower.includes('christening')) {
        suggestedCategory = 'baptism';
        suggestedTitle = 'گواهی رسمی تعمید';
    } else if (lower.includes('ازدواج') || lower.includes('عقد') || lower.includes('marriage') || lower.includes('wedding')) {
        suggestedCategory = 'marriage';
        suggestedTitle = 'سند رسمی عقد و ازدواج';
    } else if (lower.includes('فاکتور') || lower.includes('رسید') || lower.includes('مالی') || lower.includes('invoice') || lower.includes('receipt') || lower.includes('donation') || lower.includes('هدایا')) {
        suggestedCategory = 'invoice';
        suggestedTitle = 'سند مالی و رسید پرداخت';
    } else if (lower.includes('پاسپورت') || lower.includes('شناسنامه') || lower.includes('کارت ملی') || lower.includes('passport') || lower.includes('identification') || lower.includes('id card')) {
        suggestedCategory = 'identity';
        suggestedTitle = 'مدرک شناسایی و هویت';
    } else if (lower.includes('قرارداد') || lower.includes('تعهد') || lower.includes('contract') || lower.includes('agreement')) {
        suggestedCategory = 'contract';
        suggestedTitle = 'قرارداد رسمی';
    } else if (lower.includes('نامه') || lower.includes('کلیسای') || lower.includes('church') || lower.includes('letter') || lower.includes('گواهی')) {
        suggestedCategory = 'letter';
        suggestedTitle = 'نامه اداری کلیسا';
    }

    // 4. Extract Names
    const names: string[] = [];
    const pastorRegex = /(?:کشیش|شبان|pastor|reverend|rev\.?)\s+([\u0600-\u06FF\w\s]{3,30})/i;
    const pastorMatch = pastorRegex.exec(rawText);
    if (pastorMatch && pastorMatch[1]) {
        const pastorName = pastorMatch[1].split('\n')[0].trim();
        if (pastorName.length < 35) names.push(`کشیش: ${pastorName}`);
    }

    const memberRegex = /(?:فرزند|نام و نام خانوادگی|نام عضو|آقای|خانم|name|full name)\s*[:\-]?\s*([\u0600-\u06FF\w\s]{3,35})/i;
    const memberMatch = memberRegex.exec(rawText);
    if (memberMatch && memberMatch[1]) {
        const memName = memberMatch[1].split('\n')[0].trim();
        if (memName.length < 35) names.push(`عضو: ${memName}`);
    }

    // 5. Organization
    let organization: string | undefined;
    if (rawText.includes('Iranian Presbyterian Church') || rawText.includes('کلیسای انجیلی ایرانیان واشنگتن') || rawText.includes('ایران چرچ')) {
        organization = 'کلیسای انجیلی ایرانیان واشنگتن دی‌سی (IPCDC)';
    }

    // 6. Keywords & Tags
    const keywords: string[] = [suggestedCategory];
    if (dates.length > 0) keywords.push(dates[0]);
    if (certificateNumber) keywords.push(`شماره:${certificateNumber}`);
    if (organization) keywords.push('IPCDC');

    // 7. Auto-generate Concise Persian Summary
    const summaryParts: string[] = [];
    summaryParts.push(`نوع سند: ${suggestedTitle}`);
    if (certificateNumber) summaryParts.push(`شماره ثبت: ${certificateNumber}`);
    if (dates.length > 0) summaryParts.push(`تاریخ: ${dates.join(' - ')}`);
    if (names.length > 0) summaryParts.push(`اشخاص: ${names.join(', ')}`);
    
    // First two lines of text as contextual snippet
    const previewSnippet = lines.slice(0, 2).join(' - ');
    if (previewSnippet) {
        summaryParts.push(`خلاصه متن: ${previewSnippet.substring(0, 150)}...`);
    }

    const summary = summaryParts.join(' | ');

    if (certificateNumber) {
        suggestedTitle += ` - شماره ${certificateNumber}`;
    }

    return {
        entities: {
            documentType: suggestedCategory,
            certificateNumber,
            dates,
            names,
            organization,
            keywords
        },
        summary,
        suggestedTitle,
        suggestedCategory
    };
}

/**
 * Runs bilingual OCR (Persian & English) on an image buffer or URL using Tesseract.js
 */
export async function processDocumentOCR(imageSource: Buffer | string): Promise<OCRResult> {
    try {
        console.log('[OCRService] Starting OCR worker with fas+eng...');
        const worker = await createWorker('fas+eng');

        const ret = await worker.recognize(imageSource);
        await worker.terminate();

        const rawText = ret.data.text ? ret.data.text.trim() : '';
        const confidence = ret.data.confidence || 0;

        const { entities, summary, suggestedTitle, suggestedCategory } = extractEntitiesFromText(rawText);

        console.log('[OCRService] Completed OCR. Confidence:', confidence, 'Category:', suggestedCategory);

        return {
            rawText,
            confidence: Math.round(confidence),
            language: 'fas+eng',
            entities,
            summary,
            suggestedTitle,
            suggestedCategory
        };
    } catch (err: any) {
        console.error('[OCRService] OCR processing failed:', err);
        throw new Error(`خطا در پردازش OCR سند: ${err.message}`);
    }
}
