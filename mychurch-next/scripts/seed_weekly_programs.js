const { Pool } = require('pg');

const pool = new Pool({
  connectionString: process.env.DATABASE_URL || process.env.POSTGRES_URL,
  ssl: { rejectUnauthorized: false },
});

async function run() {
  await pool.query(`
    CREATE TABLE IF NOT EXISTS church_weekly_programs (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        day_of_week VARCHAR(50) NOT NULL,
        day_name_fa VARCHAR(100) NOT NULL,
        day_name_en VARCHAR(100) NOT NULL DEFAULT '',
        title_fa VARCHAR(255) NOT NULL,
        title_en VARCHAR(255) NOT NULL DEFAULT '',
        category_fa VARCHAR(100) NOT NULL DEFAULT 'کلاس درس کتاب مقدس',
        category_en VARCHAR(100) NOT NULL DEFAULT 'Bible Study',
        main_teacher_fa VARCHAR(255) NOT NULL DEFAULT 'با قدرت و رهبر و معلم اصلی: روح‌القدس',
        main_teacher_en VARCHAR(255) NOT NULL DEFAULT 'Lead & Main Teacher: Holy Spirit',
        assistant_fa VARCHAR(255) NOT NULL DEFAULT '',
        assistant_en VARCHAR(255) NOT NULL DEFAULT '',
        time_fa VARCHAR(255) NOT NULL,
        time_en VARCHAR(255) NOT NULL DEFAULT '',
        start_time TIME,
        end_time TIME,
        location_fa VARCHAR(255) NOT NULL DEFAULT 'آنلاین (پخش زنده و تعاملی)',
        location_en VARCHAR(255) NOT NULL DEFAULT 'Online (Live & Interactive)',
        description_fa TEXT NOT NULL DEFAULT '',
        description_en TEXT NOT NULL DEFAULT '',
        icon VARCHAR(50) NOT NULL DEFAULT 'BookOpen',
        color VARCHAR(50) NOT NULL DEFAULT '#8b5cf6',
        badge_fa VARCHAR(100) NOT NULL DEFAULT '',
        badge_en VARCHAR(100) NOT NULL DEFAULT '',
        action_url VARCHAR(255) NOT NULL DEFAULT '/broadcast/view',
        action_text_fa VARCHAR(100) NOT NULL DEFAULT 'ورود به جلسه',
        action_text_en VARCHAR(100) NOT NULL DEFAULT 'Join Session',
        is_active BOOLEAN NOT NULL DEFAULT TRUE,
        sort_order INT NOT NULL DEFAULT 0,
        created_at TIMESTAMPTZ DEFAULT NOW(),
        updated_at TIMESTAMPTZ DEFAULT NOW()
    );
  `);

  const cnt = (await pool.query('SELECT COUNT(*) FROM church_weekly_programs')).rows[0].count;
  console.log('Current count before seed:', cnt);

  if (cnt === '0') {
    await pool.query(`
      INSERT INTO church_weekly_programs (
          day_of_week, day_name_fa, day_name_en,
          title_fa, title_en,
          category_fa, category_en,
          main_teacher_fa, main_teacher_en,
          assistant_fa, assistant_en,
          time_fa, time_en,
          location_fa, location_en,
          description_fa, description_en,
          icon, color, badge_fa, badge_en,
          action_url, action_text_fa, action_text_en,
          is_active, sort_order
      ) VALUES
      (
          'sunday', 'یکشنبه‌ها', 'Sundays',
          'جلسه و عبادت یکشنبه‌ها', 'Sunday Worship & Service',
          'جلسه عمومی و عبادت', 'Worship Service',
          'شبانی و موعظه کلام: کشیش جواد', 'Pastoral Teaching: Pastor Javad',
          'با همراهی تیم پرستش و خدمتگزاران کلیسا', 'With Church Worship & Ministry Team',
          'ساعت ۱۱:۰۰ صبح به وقت واشنگتن دی‌سی (EST)', '11:00 AM Washington D.C. Time (EST)',
          'حضوری در واشنگتن دی‌سی و پخش زنده همزمان', 'In-Person (Washington D.C.) & Live Broadcast',
          'مشارکت پربرکت ایمانداران، سرودهای پرستشی، موعظه کلام زنده خدا و دعای شفاعتی.',
          'Fellowship of believers, worship songs, living word sermon and intercessory prayer.',
          'Church', '#6366f1', 'جلسه اصلی کلیسا', 'Main Service',
          '/broadcast/view', 'پخش زنده یکشنبه', 'Live Broadcast',
          TRUE, 0
      ),
      (
          'tuesday', 'سه‌شنبه شب‌ها', 'Tuesday Nights',
          'کلاس درس کتاب مقدس', 'Tuesday Night Bible Study',
          'تدریس کتاب مقدس', 'Bible Study',
          'با قدرت و رهبر و معلم اصلی: روح‌القدس', 'Lead & Main Teacher: The Holy Spirit',
          'با کمک خواهر اعظم', 'Assisted by Sister Azam',
          'ساعت ۸:۰۰ تا ۹:۰۰ شب به وقت واشنگتن دی‌سی (EST)', '8:00 PM – 9:00 PM Washington D.C. Time (EST)',
          'آنلاین (پخش زنده و مشارکت صمیمانه)', 'Online (Live Broadcast & Fellowship)',
          'تعلیم کلام خدا با قدرت روح‌القدس، بررسی تفسیری آیات و گفتگوی ایمانی هفتگی.',
          'Teaching God''s Word through the power of the Holy Spirit, verse-by-verse study and weekly fellowship.',
          'BookOpen', '#8b5cf6', 'کلاس هفتگی کلام', 'Weekly Bible Class',
          '/broadcast/view', 'ورود به کلاس', 'Join Class',
          TRUE, 1
      ),
      (
          'wednesday', 'چهارشنبه شب‌ها', 'Wednesday Nights',
          'کلاس درس کتاب مقدس', 'Wednesday Night Bible Study',
          'تدریس کتاب مقدس', 'Bible Study',
          'با قدرت و رهبر و معلم اصلی: روح‌القدس', 'Lead & Main Teacher: The Holy Spirit',
          'با کمک کشیش جواد', 'Assisted by Pastor Javad',
          'ساعت ۸:۰۰ تا ۹:۰۰ شب به وقت واشنگتن دی‌سی (EST)', '8:00 PM – 9:00 PM Washington D.C. Time (EST)',
          'آنلاین (پخش زنده و بررسی عمیق کلام)', 'Online (Live Broadcast & In-depth Study)',
          'مطالعه عمیق فصول کتاب مقدس، تعالیم شبانی و تقویت بنیادهای الهیاتی ایمانداران.',
          'In-depth study of Scripture chapters, pastoral teachings, and strengthening theological foundations.',
          'BookOpen', '#06b6d4', 'کلاس شبانی کلام', 'Pastoral Study',
          '/broadcast/view', 'ورود به کلاس', 'Join Class',
          TRUE, 2
      ),
      (
          'thursday', 'پنجشنبه شب‌ها', 'Thursday Nights',
          'کلاس درس کتاب مقدس', 'Thursday Night Bible Study',
          'تدریس کتاب مقدس', 'Bible Study',
          'با قدرت و رهبر و معلم اصلی: روح‌القدس', 'Lead & Main Teacher: The Holy Spirit',
          'با کمک خواهر نازی', 'Assisted by Sister Nazi',
          'ساعت ۸:۰۰ تا ۹:۰۰ شب به وقت واشنگتن دی‌سی (EST)', '8:00 PM – 9:00 PM Washington D.C. Time (EST)',
          'آنلاین (پخش تعاملی و پرسش و پاسخ)', 'Online (Interactive & Q&A Session)',
          'جلسه تعاملی بررسی کتاب مقدس با روح‌القدس، پرسش و پاسخ‌های ایمانی و دعای مشترک.',
          'Interactive Bible exploration with the Holy Spirit, faith questions & answers, and corporate prayer.',
          'BookOpen', '#ec4899', 'کلاس تعاملی کلام', 'Interactive Study',
          '/broadcast/view', 'ورود به کلاس', 'Join Class',
          TRUE, 3
      ),
      (
          'flexible', 'جلسات بانوان', 'Women''s Fellowship',
          'برنامه و خدمت خواهران (بانوان)', 'Women''s Ministry & Fellowship',
          'خدمت بانوان', 'Women''s Ministry',
          'با هدایت روح‌القدس و خدمتگزاران بانوان کلیسا', 'Led by the Holy Spirit & Church Women Leaders',
          'شورای خواهران کلیسا', 'Sisters Ministry Board',
          'جلسات ویژه هفتگی / ماهانه (به وقت واشنگتن دی‌سی)', 'Weekly / Monthly Gatherings (Washington D.C. Time)',
          'آنلاین و حضوری', 'Online & In-Person',
          'رشد روحانی، دعا و شفاعت برای خانواده‌ها، مشارکت صمیمانه و توانمندسازی بانوان در ایمان مسیحی.',
          'Spiritual growth, prayer for families, warm fellowship and empowering women in the Christian faith.',
          'Heart', '#f59e0b', 'خدمت بانوان', 'Women''s Ministry',
          '/contact', 'اطلاعات برنامه بانوان', 'Learn More',
          TRUE, 4
      );
    `);
    console.log('Seeded initial 5 weekly programs successfully!');
  }

  const rows = (await pool.query('SELECT day_name_fa, title_fa, main_teacher_fa, assistant_fa, time_fa FROM church_weekly_programs ORDER BY sort_order ASC')).rows;
  console.log('Current weekly programs count:', rows.length);
  rows.forEach((r, i) => {
    console.log(`[${i + 1}] ${r.day_name_fa}: ${r.title_fa} | Teacher: ${r.main_teacher_fa} | Assistant: ${r.assistant_fa} | Time: ${r.time_fa}`);
  });
}

run().catch(console.error).finally(() => pool.end());
