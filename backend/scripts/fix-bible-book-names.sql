-- Fix Bible Book Names - Replace Arabic with Persian and English
-- این اسکریپت نام کتاب‌های کتاب مقدس را از عربی به فارسی و انگلیسی تغییر می‌دهد

-- عهد عتیق (Old Testament)
UPDATE bible_books SET name_en = 'Genesis', name_fa = 'پیدایش' WHERE code = 'GEN';
UPDATE bible_books SET name_en = 'Exodus', name_fa = 'خروج' WHERE code = 'EXO';
UPDATE bible_books SET name_en = 'Leviticus', name_fa = 'لاویان' WHERE code = 'LEV';
UPDATE bible_books SET name_en = 'Numbers', name_fa = 'اعداد' WHERE code = 'NUM';
UPDATE bible_books SET name_en = 'Deuteronomy', name_fa = 'تثنیه' WHERE code = 'DEU';
UPDATE bible_books SET name_en = 'Joshua', name_fa = 'یوشع' WHERE code = 'JOS';
UPDATE bible_books SET name_en = 'Judges', name_fa = 'داوران' WHERE code = 'JDG';
UPDATE bible_books SET name_en = 'Ruth', name_fa = 'روت' WHERE code = 'RUT';
UPDATE bible_books SET name_en = '1 Samuel', name_fa = 'اول سموئیل' WHERE code = '1SA';
UPDATE bible_books SET name_en = '2 Samuel', name_fa = 'دوم سموئیل' WHERE code = '2SA';
UPDATE bible_books SET name_en = '1 Kings', name_fa = 'اول پادشاهان' WHERE code = '1KI';
UPDATE bible_books SET name_en = '2 Kings', name_fa = 'دوم پادشاهان' WHERE code = '2KI';
UPDATE bible_books SET name_en = '1 Chronicles', name_fa = 'اول تواریخ' WHERE code = '1CH';
UPDATE bible_books SET name_en = '2 Chronicles', name_fa = 'دوم تواریخ' WHERE code = '2CH';
UPDATE bible_books SET name_en = 'Ezra', name_fa = 'عزرا' WHERE code = 'EZR';
UPDATE bible_books SET name_en = 'Nehemiah', name_fa = 'نحمیا' WHERE code = 'NEH';
UPDATE bible_books SET name_en = 'Esther', name_fa = 'استر' WHERE code = 'EST';
UPDATE bible_books SET name_en = 'Job', name_fa = 'ایوب' WHERE code = 'JOB';
UPDATE bible_books SET name_en = 'Psalms', name_fa = 'مزامیر' WHERE code = 'PSA';
UPDATE bible_books SET name_en = 'Proverbs', name_fa = 'امثال' WHERE code = 'PRO';
UPDATE bible_books SET name_en = 'Ecclesiastes', name_fa = 'جامعه' WHERE code = 'ECC';
UPDATE bible_books SET name_en = 'Song of Solomon', name_fa = 'غزل غزلها' WHERE code = 'SNG';
UPDATE bible_books SET name_en = 'Isaiah', name_fa = 'اشعیا' WHERE code = 'ISA';
UPDATE bible_books SET name_en = 'Jeremiah', name_fa = 'ارمیا' WHERE code = 'JER';
UPDATE bible_books SET name_en = 'Lamentations', name_fa = 'مراثی ارمیا' WHERE code = 'LAM';
UPDATE bible_books SET name_en = 'Ezekiel', name_fa = 'حزقیال' WHERE code = 'EZK';
UPDATE bible_books SET name_en = 'Daniel', name_fa = 'دانیال' WHERE code = 'DAN';
UPDATE bible_books SET name_en = 'Hosea', name_fa = 'هوشع' WHERE code = 'HOS';
UPDATE bible_books SET name_en = 'Joel', name_fa = 'یوئیل' WHERE code = 'JOL';
UPDATE bible_books SET name_en = 'Amos', name_fa = 'عاموس' WHERE code = 'AMO';
UPDATE bible_books SET name_en = 'Obadiah', name_fa = 'عوبدیا' WHERE code = 'OBA';
UPDATE bible_books SET name_en = 'Jonah', name_fa = 'یونس' WHERE code = 'JON';
UPDATE bible_books SET name_en = 'Micah', name_fa = 'میخا' WHERE code = 'MIC';
UPDATE bible_books SET name_en = 'Nahum', name_fa = 'ناحوم' WHERE code = 'NAM';
UPDATE bible_books SET name_en = 'Habakkuk', name_fa = 'حبقوق' WHERE code = 'HAB';
UPDATE bible_books SET name_en = 'Zephaniah', name_fa = 'صفنیا' WHERE code = 'ZEP';
UPDATE bible_books SET name_en = 'Haggai', name_fa = 'حجی' WHERE code = 'HAG';
UPDATE bible_books SET name_en = 'Zechariah', name_fa = 'زکریا' WHERE code = 'ZEC';
UPDATE bible_books SET name_en = 'Malachi', name_fa = 'ملاکی' WHERE code = 'MAL';

-- عهد جدید (New Testament)
UPDATE bible_books SET name_en = 'Matthew', name_fa = 'متی' WHERE code = 'MAT';
UPDATE bible_books SET name_en = 'Mark', name_fa = 'مرقس' WHERE code = 'MRK';
UPDATE bible_books SET name_en = 'Luke', name_fa = 'لوقا' WHERE code = 'LUK';
UPDATE bible_books SET name_en = 'John', name_fa = 'یوحنا' WHERE code = 'JHN';
UPDATE bible_books SET name_en = 'Acts', name_fa = 'اعمال رسولان' WHERE code = 'ACT';
UPDATE bible_books SET name_en = 'Romans', name_fa = 'رومیان' WHERE code = 'ROM';
UPDATE bible_books SET name_en = '1 Corinthians', name_fa = 'اول قرنتیان' WHERE code = '1CO';
UPDATE bible_books SET name_en = '2 Corinthians', name_fa = 'دوم قرنتیان' WHERE code = '2CO';
UPDATE bible_books SET name_en = 'Galatians', name_fa = 'غلاطیان' WHERE code = 'GAL';
UPDATE bible_books SET name_en = 'Ephesians', name_fa = 'افسسیان' WHERE code = 'EPH';
UPDATE bible_books SET name_en = 'Philippians', name_fa = 'فیلیپیان' WHERE code = 'PHP';
UPDATE bible_books SET name_en = 'Colossians', name_fa = 'کولسیان' WHERE code = 'COL';
UPDATE bible_books SET name_en = '1 Thessalonians', name_fa = 'اول تسالونیکیان' WHERE code = '1TH';
UPDATE bible_books SET name_en = '2 Thessalonians', name_fa = 'دوم تسالونیکیان' WHERE code = '2TH';
UPDATE bible_books SET name_en = '1 Timothy', name_fa = 'اول تیموتاؤس' WHERE code = '1TI';
UPDATE bible_books SET name_en = '2 Timothy', name_fa = 'دوم تیموتاؤس' WHERE code = '2TI';
UPDATE bible_books SET name_en = 'Titus', name_fa = 'تیطس' WHERE code = 'TIT';
UPDATE bible_books SET name_en = 'Philemon', name_fa = 'فلیمون' WHERE code = 'PHM';
UPDATE bible_books SET name_en = 'Hebrews', name_fa = 'عبرانیان' WHERE code = 'HEB';
UPDATE bible_books SET name_en = 'James', name_fa = 'یعقوب' WHERE code = 'JAS';
UPDATE bible_books SET name_en = '1 Peter', name_fa = 'اول پطرس' WHERE code = '1PE';
UPDATE bible_books SET name_en = '2 Peter', name_fa = 'دوم پطرس' WHERE code = '2PE';
UPDATE bible_books SET name_en = '1 John', name_fa = 'اول یوحنا' WHERE code = '1JN';
UPDATE bible_books SET name_en = '2 John', name_fa = 'دوم یوحنا' WHERE code = '2JN';
UPDATE bible_books SET name_en = '3 John', name_fa = 'سوم یوحنا' WHERE code = '3JN';
UPDATE bible_books SET name_en = 'Jude', name_fa = 'یهودا' WHERE code = 'JUD';
UPDATE bible_books SET name_en = 'Revelation', name_fa = 'مکاشفه' WHERE code = 'REV';

-- بررسی نتیجه
SELECT code, name_en, name_fa, testament 
FROM bible_books 
ORDER BY id;
