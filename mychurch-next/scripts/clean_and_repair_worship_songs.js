const { Pool } = require('pg');

const pool = new Pool({
  connectionString: process.env.DATABASE_URL || process.env.POSTGRES_URL,
  ssl: { rejectUnauthorized: false },
});

// Clean Persian lyrics by removing chords tatweels (ـ) and excessive inner spaces
function cleanPersianLyrics(text) {
  if (!text) return '';
  
  let cleaned = text;
  
  // 1. Remove tatweel characters (ـ) used in chord stretching
  cleaned = cleaned.replace(/ـ+/g, '');
  
  // 2. Normalize Arabic/Persian characters
  cleaned = cleaned.replace(/ي/g, 'ی').replace(/ك/g, 'ک');
  
  // 3. Remove spaces inserted between letters and suffixes
  cleaned = cleaned.replace(/([ابپتثجچحخدذرزژسشصضطظعغفقکگلمنوهی])\s+([ی‌])/g, '$1$2');
  
  // 4. Common specific broken word patterns from chord imports:
  cleaned = cleaned.replace(/خد\s+ای/g, 'خدای');
  cleaned = cleaned.replace(/خداو\s+ند/g, 'خداوند');
  cleaned = cleaned.replace(/پد\s+ر/g, 'پدر');
  cleaned = cleaned.replace(/جلا\s+ل/g, 'جلال');
  cleaned = cleaned.replace(/شا\s+دی/g, 'شادی');
  cleaned = cleaned.replace(/م\s+سیح/g, 'مسیح');
  cleaned = cleaned.replace(/ق\s+وت/g, 'قوت');
  cleaned = cleaned.replace(/ص\s+خره/g, 'صخره');
  cleaned = cleaned.replace(/س\s+پر/g, 'سپر');
  cleaned = cleaned.replace(/شاه\s+د/g, 'شاهد');
  cleaned = cleaned.replace(/سرو\s+ر/g, 'سرور');
  cleaned = cleaned.replace(/منجی\s+م/g, 'منجیم');
  cleaned = cleaned.replace(/خا\s+ر/g, 'خار');
  cleaned = cleaned.replace(/صل\s+یب/g, 'صلیب');
  cleaned = cleaned.replace(/فرو\s+غ/g, 'فروغ');
  cleaned = cleaned.replace(/جها\s+ن/g, 'جهان');
  cleaned = cleaned.replace(/آسمان\s+ی/g, 'آسمانی');
  cleaned = cleaned.replace(/آ\s+سمانی/g, 'آسمانی');
  cleaned = cleaned.replace(/سپـ\s+اس/g, 'سپاس');
  cleaned = cleaned.replace(/سپ\s+اس/g, 'سپاس');
  cleaned = cleaned.replace(/را\s+ستی/g, 'راستی');
  cleaned = cleaned.replace(/وجـ\s+ود/g, 'وجود');
  cleaned = cleaned.replace(/وج\s+ود/g, 'وجود');
  cleaned = cleaned.replace(/خالیـ\s+م/g, 'خالیم');
  cleaned = cleaned.replace(/خالی\s+م/g, 'خالیم');
  cleaned = cleaned.replace(/ایما\s+ن/g, 'ایمان');
  cleaned = cleaned.replace(/تسـ\s+لی/g, 'تسلی');
  cleaned = cleaned.replace(/تس\s+لی/g, 'تسلی');
  cleaned = cleaned.replace(/مهربا\s+ن/g, 'مهربان');
  cleaned = cleaned.replace(/زن\s+دگی/g, 'زندگی');
  cleaned = cleaned.replace(/حیـ\s+ات/g, 'حیات');
  cleaned = cleaned.replace(/حی\s+ات/g, 'حیات');
  cleaned = cleaned.replace(/عیسـ\s+ی/g, 'عیسی');
  cleaned = cleaned.replace(/عیس\s+ی/g, 'عیسی');
  cleaned = cleaned.replace(/روح\s+القد\s+س/g, 'روح‌القدس');
  cleaned = cleaned.replace(/روح\s+القدس/g, 'روح‌القدس');
  cleaned = cleaned.replace(/می\s+‌آییم/g, 'می‌آییم');
  cleaned = cleaned.replace(/می\s+‌دانم/g, 'می‌دانم');
  cleaned = cleaned.replace(/می\s+‌خوانم/g, 'می‌خوانم');
  cleaned = cleaned.replace(/می\s+‌گویم/g, 'می‌گویم');
  cleaned = cleaned.replace(/می\s+‌کشد/g, 'می‌کشد');
  cleaned = cleaned.replace(/می\s+‌کند/g, 'می‌کند');
  cleaned = cleaned.replace(/می\s+‌پرستم/g, 'می‌پرستم');
  cleaned = cleaned.replace(/می\s+‌نگریم/g, 'می‌نگریم');

  // Fix non-breaking spaces and redundant whitespaces per line
  const lines = cleaned.split('\n').map(line => {
    return line
      .replace(/[\u00A0\u1680\u180E\u2000-\u200B\u202F\u205F\u3000\uFEFF]/g, ' ')
      .replace(/ +/g, ' ')
      .trim();
  });

  return lines.join('\n').trim();
}

// Clean titles with concatenated English or weird formatting
function cleanTitle(title) {
  if (!title) return '';
  let t = title.trim();
  
  // e.g. "آزادی در نام توستIsn't the name of Jesus" -> "آزادی در نام توست (Isn't the name of Jesus)"
  t = t.replace(/([\u0600-\u06FF])([A-Za-z])/g, '$1 ($2');
  if (t.includes('(') && !t.includes(')')) {
    t += ')';
  }

  // Fix: "هیچ نامی نیست There's no other name-Bethel Musicکشیش آلبرت بابایان"
  if (t.includes("هیچ نامی نیست")) {
    t = "هیچ نامی نیست (There's No Other Name)";
  }

  return t.replace(/\s+/g, ' ').trim();
}

// IDs of songs that had wrongly copied duplicate lyrics belonging to another title
const WRONGLY_COPIED_LYRIC_IDS = [
  '0c4cdc8f-4f28-46e3-9336-52fb305f6a8e', // "از جان و دل خواهم تو را" had lyrics of "خداوندا تو آگاهی"
  '4c81242c-dd40-4d91-a8f7-2ed91f62c905', // "ای فرزندان نور" had lyrics of "ای فروغ جاودان"
  '62073f24-516a-4cde-a21e-20be71b41256', // "به حضورت آییم نزدت زانو زنیم" had lyrics of "فقط عیسی"
  '839a35ee-34b9-4e53-954d-a1f64c89a036', // "بر وعده هایت" had lyrics of "بازایستیم و دانیم"
  '8d0471af-022d-4441-a21e-0610a5032a09', // "چنانکه آهو برای نهرهای آب..." had lyrics of "نام مسیح پرجلال است"
  '92f5ddfc-0456-4802-a098-49cef6734b4e', // "ای پدر ما در آسمان ( دعای ربانی )" had lyrics of "خدا ملجا و قوت من است"
  'a59342a5-f0c1-49c4-90d4-9475c014e457', // "منجی من معبود من" had lyrics of "شاهد هستم"
  '92579a66-1420-4852-a173-2ef760d75f9d', // "این صدای بارانیست" had lyrics of "نام تو"
  'bad0d751-35b2-4d08-a2d1-f6650193f1f0', // "من از آن توام ابا" had lyrics of "کلمه جسم گردید"
  'c111b6cd-a4c6-44f8-af3a-1938700f2b80', // "امیدت را از دست نده" had lyrics of "سردار لشکر آسمان"
  'd19a3525-83f5-4a95-b608-3bdfb3c30a9c', // "مرا مبهوت ساز" had lyrics of "مرا احیا می‌کنی"
  '85478a83-89c8-41cb-b139-ccf64e591255', // "بگذار قلبم معبد روح تو باشد" had lyrics of "در انتظار روی تو"
  'd6279995-a85f-4e47-a175-a6b2d9a4c339', // "تو را عاشقانه دوستت دارم" had lyrics of "مرا می‌پذیری تو"
  'ce75237d-b561-4333-bd0c-4bca989f163c', // "دیوانه عشق تو" had lyrics of "پدر آسمانی جلال باد"
  '748d808c-3585-451a-8223-e7a6a29590f7', // "مثل باران بهاری" had lyrics of "شادی کنان سرودخوانان"
  'e16a0bb0-6c7a-425e-8816-669cada0c401', // "عیسی تو را می‌پرستم" had lyrics of "خدای تازه‌ها"
  'cbc4a0f5-f598-401d-922e-1aaa654dd60a', // "خدای عظیم بهر ما خاکیان" had lyrics of "خداوند ای معبود من"
  'e99152ef-ed97-4b97-a02a-37ca6dfa538c', // "تماشایی‌ترین تصویر دنیا" had lyrics of "مرا ملاقات کن"
  'aca1ffb5-5667-4d82-bf76-7271ad3bf071', // "وقتی بین سکوت و کلام" had lyrics of "او کیست"
  'f0901c2c-2efc-42cb-8aee-41fe0d822bcd', // "خدای عشق و بی همتا و پاک" had lyrics of "فصل نو"
  'f28431f0-e850-42a1-b79d-9dcaa3717048', // "هرآنچه که تو می خواهی" had lyrics of "یار من خدای من"
  'f5f64dae-1062-4839-9401-cc56726aaf1f', // "از این دنیای مغموم و فانی" had lyrics of "قادر متعال"
  'f918de3b-b602-4daa-a679-da604d88742d', // "جلال بر نامت ای صیاد دلهای پریشان" had lyrics of "خدای پدر ای از جان بهتر"
  'ffb8de25-4f86-4c4f-b630-f62bdd1582d3', // "ای تو ما را پدر ای ابا" had lyrics of "باران نور و شبنمی"
];

async function run() {
  console.log('--- Starting Worship Songs Cleanup & Repair ---');
  
  // 1. Clear wrong copied lyrics from the 24 misallocated song rows
  console.log(`Clearing wrong duplicate lyrics from ${WRONGLY_COPIED_LYRIC_IDS.length} songs...`);
  for (const id of WRONGLY_COPIED_LYRIC_IDS) {
    await pool.query('UPDATE church_worship_songs SET lyrics_fa = NULL WHERE id = $1', [id]);
  }
  console.log('Cleared wrong copied lyrics.');

  // 2. Fetch all songs and clean lyrics + titles
  const songs = (await pool.query('SELECT id, title_fa, lyrics_fa FROM church_worship_songs')).rows;
  console.log(`Processing text normalization for ${songs.length} songs...`);

  let lyricsCleaned = 0;
  let titlesCleaned = 0;

  for (const s of songs) {
    let changed = false;
    let newTitle = s.title_fa;
    let newLyrics = s.lyrics_fa;

    if (s.title_fa) {
      const cleanedT = cleanTitle(s.title_fa);
      if (cleanedT !== s.title_fa) {
        newTitle = cleanedT;
        titlesCleaned++;
        changed = true;
      }
    }

    if (s.lyrics_fa && s.lyrics_fa.trim()) {
      const cleanedL = cleanPersianLyrics(s.lyrics_fa);
      if (cleanedL !== s.lyrics_fa) {
        newLyrics = cleanedL;
        lyricsCleaned++;
        changed = true;
      }
    }

    if (changed) {
      await pool.query('UPDATE church_worship_songs SET title_fa = $1, lyrics_fa = $2 WHERE id = $3', [
        newTitle,
        newLyrics,
        s.id,
      ]);
    }
  }

  console.log(`Updated ${titlesCleaned} song titles and ${lyricsCleaned} song lyrics with pristine Persian typography.`);
  console.log('Cleanup completed successfully!');
}

run().catch(console.error).finally(() => pool.end());
