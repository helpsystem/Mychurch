
import { Sermon, Leader, Event, WorshipSong, ScheduleEvent, Gallery, PrayerRequest, AdminMessage, Testimonial, ChurchLetter, Email } from '../types';
import { getRandomImage } from './theme';
import { CHURCH_ADDRESS, DEFAULT_AVATAR_URL } from './constants';

export const leadersData: Leader[] = [
  {
    id: 1,
    name: { en: 'Rev. Javad Pishghadamian', fa: 'کشیش جواد پیشقدمیان' },
    title: { en: 'Senior Pastor', fa: 'کشیش ارشد' },
    imageUrl: '/images/pastor-javad-real.jpg',
    bio: {
        en: 'Rev. Javad has been leading our church with passion and dedication for over 15 years, guiding our community with wisdom and a deep love for the Word of God.',
        fa: 'کشیش جواد بیش از ۱۵ سال است که با اشتیاق و فداکاری کلیسای ما را رهبری می‌کند و جامعه ما را با حکمت و عشقی عمیق به کلام خدا هدایت می‌نماید.'
    },
    whatsappNumber: '+11234567890'
  },
  {
    id: 2,
    name: { en: 'Nazi Rasti', fa: 'نازی راستی' },
    title: { en: "Women's Bible Study Leader", fa: 'رهبر مطالعه کتاب مقدس بانوان' },
    imageUrl: '/images/leader-nazi-real.jpg',
    bio: {
        en: "Nazi Rasti leads our women's ministry with a heart for fellowship and discipleship, creating a welcoming space for women to grow in their faith together.",
        fa: 'نازی راستی خدمت بانوان ما را با قلبی برای مشارکت و شاگردسازی رهبری می‌کند و فضایی پذیرا برای رشد مشترک بانوان در ایمانشان ایجاد می‌نماید.'
    }
  },
];

const today = new Date();
const sermons: Sermon[] = [
  { id: 1, title: { en: 'The Power of Forgiveness', fa: 'قدرت بخشش' }, speaker: 'Rev. Javad Pishghadamian', date: new Date(new Date().setDate(today.getDate() - 7)).toISOString().split('T')[0], audioUrl: 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-1.mp3', series: { en: 'Foundations of Faith', fa: 'مبانی ایمان' }, notesUrl: '/sample-notes.pdf' },
  { id: 2, title: { en: 'Living in Hope', fa: 'زندگی در امید' }, speaker: 'Rev. Javad Pishghadamian', date: new Date(new Date().setDate(today.getDate() - 14)).toISOString().split('T')[0], audioUrl: 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-2.mp3', series: { en: 'Foundations of Faith', fa: 'مبانی ایمان' } },
  { id: 3, title: { en: 'The Heart of a Servant', fa: 'قلب یک خدمتگزار' }, speaker: 'Guest Speaker', date: new Date(new Date().setDate(today.getDate() - 21)).toISOString().split('T')[0], audioUrl: 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-3.mp3' },
];
export const sermonsData: Sermon[] = sermons;


export const worshipSongsData: WorshipSong[] = [
  { 
    id: 1, 
    title: { en: 'In Christ Alone', fa: 'تنها در مسیح' }, 
    artist: 'Kristian Stanfill, Passion', 
    youtubeId: 'rJgN-p_8p9Y',
    lyrics: {
        en: `In Christ alone my hope is found
He is my light, my strength, my song
This cornerstone, this solid ground
Firm through the fiercest drought and storm
What heights of love, what depths of peace
When fears are stilled, when strivings cease
My comforter, my all in all
Here in the love of Christ I stand`,
        fa: `تنها در مسیح امیدم یافت می‌شود
او نور من، قوت من، سرود من است
این سنگ بنا، این زمین محکم
در سخت‌ترین خشکسالی و طوفان استوار است
چه بلندای محبت، چه عمق آرامش
وقتی ترس‌ها آرام می‌گیرند، وقتی تلاش‌ها متوقف می‌شوند
آرامش‌دهنده من، همه چیز من
اینجا در محبت مسیح ایستاده‌ام`
    },
    audioUrl: 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-1.mp3'
  },
  { id: 2, title: { en: 'Amazing Grace (My Chains Are Gone)', fa: 'فیض حیرت‌انگیز (زنجیرهایم گسست)' }, artist: 'Chris Tomlin', youtubeId: 'Jbe7OruLk8I', videoUrl: 'https://test-videos.co.uk/vids/bigbuckbunny/mp4/h264/360/Big_Buck_Bunny_360_10s_1MB.mp4' },
  { id: 3, title: { en: '10,000 Reasons (Bless the Lord)', fa: 'ده هزار دلیل (خداوند را متبارک بخوان)' }, artist: 'Matt Redman', youtubeId: 'XtwIT8JjddM' },
  { id: 4, title: { en: 'What A Beautiful Name', fa: 'چه نام زیبایی' }, artist: 'Hillsong Worship', youtubeId: 'nQWFzMvCfLE' },
];

const futureEvent1 = new Date();
futureEvent1.setDate(futureEvent1.getDate() + 20);
const futureEvent2 = new Date();
futureEvent2.setFullYear(2025, 9, 4); // October 4, 2025

export const eventsData: Event[] = [
  {
    id: 1,
    title: { en: 'Summer Picnic', fa: 'پیک‌نیک تابستانی' },
    date: futureEvent1.toISOString().split('T')[0],
    description: { en: 'Join us for a day of fun, food, and fellowship at Rock Creek Park.', fa: 'برای یک روز پر از سرگرمی، غذا و مشارکت در پارک راک کریک به ما بپیوندید.' },
    imageUrl: getRandomImage()
  },
  {
    id: 2,
    title: { en: 'Christmas Service', fa: 'مراسم کریسمس' },
    date: futureEvent2.toISOString().split('T')[0],
    description: { en: 'Celebrate the birth of our Savior with a special candlelight service.', fa: 'تولد نجات‌دهنده ما را با یک مراسم ویژه با شمع جشن بگیرید.' },
    imageUrl: getRandomImage()
  },
];


const nextSunday = new Date();
nextSunday.setDate(today.getDate() + (7 - today.getDay()) % 7);
const nextWednesday = new Date();
nextWednesday.setDate(today.getDate() + (3 - today.getDay() + 7) % 7);

export const scheduleData: ScheduleEvent[] = [
    {
        id: 1,
        title: { en: 'Sunday Worship Service', fa: 'مراسم پرستشی یکشنبه' },
        description: { en: 'Join us for a session of praise, worship, prayer and sermon in Persian language.', fa: 'برای جلسه پرستش، عبادت، دعا و موعظه به زبان فارسی به ما بپیوندید.' },
        leader: 'Rev. Javad Pishghadamian',
        date: nextSunday.toISOString().split('T')[0],
        startTime: '13:00',
        endTime: '15:00',
        type: 'hybrid',
        location: CHURCH_ADDRESS,
    },
    {
        id: 2,
        title: { en: 'Mid-week Bible Study', fa: 'مطالعه کتاب مقدس وسط هفته' },
        description: { en: 'A deep dive into the book of Romans. Join us online for study and discussion.', fa: 'بررسی عمیق کتاب رومیان. برای مطالعه و گفتگو به صورت آنلاین به ما بپیوندید.' },
        leader: 'Nazi Rasti',
        date: nextWednesday.toISOString().split('T')[0],
        startTime: '19:30',
        endTime: '21:00',
        type: 'online',
        location: 'https://zoom.us/j/1234567890',
    }
];

export const galleriesData: Gallery[] = [
  {
    id: 1,
    title: { en: 'Church Picnic 2024', fa: 'پیک‌نیک کلیسا ۲۰۲۴' },
    description: { en: 'A wonderful day of fellowship and fun at the park.', fa: 'یک روز فوق‌العاده برای مشارکت و سرگرمی در پارک.' },
    images: [
      { id: 101, url: getRandomImage(), caption: { en: 'Group photo', fa: 'عکس دسته‌جمعی' } },
      { id: 102, url: getRandomImage(), caption: { en: 'Serving food', fa: 'سرو غذا' } },
      { id: 103, url: getRandomImage(), caption: { en: 'Kids playing', fa: 'بازی بچه‌ها' } },
    ]
  },
  {
    id: 2,
    title: { en: 'Christmas Service', fa: 'مراسم کریسمس' },
    description: { en: 'Celebrating the birth of our Savior.', fa: 'جشن تولد نجات‌دهنده ما.' },
    images: [
       { id: 201, url: getRandomImage(), caption: { en: 'Candlelight worship', fa: 'پرستش با شمع' } },
       { id: 202, url: getRandomImage(), caption: { en: 'The choir singing', fa: 'گروه سرود در حال خواندن' } },
    ]
  }
];

export const prayerRequestsData: PrayerRequest[] = [
    { id: 1, text: 'Pray for my mother who is undergoing surgery next week. For peace for our family and skill for the doctors.', category: 'healing', isAnonymous: false, authorName: 'Sarah K.', prayerCount: 12, createdAt: new Date().toISOString() },
    { id: 2, text: 'Thanking God for a new job opportunity! It\'s a blessing and an answer to many prayers.', category: 'thanksgiving', isAnonymous: true, prayerCount: 25, createdAt: new Date(Date.now() - 86400000).toISOString() },
    { id: 3, text: 'Seeking guidance on a major life decision I have to make about moving to a new city.', category: 'guidance', isAnonymous: false, authorName: 'Amir P.', prayerCount: 8, createdAt: new Date(Date.now() - 172800000).toISOString() },
    { id: 4, text: 'Please pray for unity and strength for my family during a difficult time.', category: 'family', isAnonymous: true, prayerCount: 18, createdAt: new Date(Date.now() - 259200000).toISOString() },
];

export const testimonialsData: Testimonial[] = [
    { 
        id: 1, 
        authorName: 'Lila J.', 
        text: { 
            en: 'The leaders are genuine and caring. I have grown so much in my faith since joining this church family.',
            fa: 'رهبران صادق و دلسوز هستند. از زمان پیوستن به این خانواده کلیسایی، در ایمانم بسیار رشد کرده‌ام.'
        }, 
        isAnonymous: false, 
        status: 'approved', 
        createdAt: new Date().toISOString() 
    },
    { 
        id: 2, 
        authorName: 'Anonymous', 
        text: { 
            en: 'I felt welcomed from the very first day. The Farsi services make it feel like home.',
            fa: ''
        }, 
        isAnonymous: true, 
        status: 'pending', 
        createdAt: new Date().toISOString() 
    }
];

export const churchLettersData: ChurchLetter[] = [
    {
        id: 1,
        from: { en: 'Iranian Christian Church of D.C.', fa: 'کلیسای مسیحی ایرانی واشنگتن دی‌سی' },
        to: { en: 'U.S. Citizenship and Immigration Services', fa: 'خدمات شهروندی و مهاجرت ایالات متحده' },
        requestedBy: { en: 'Javad', fa: 'جواد' },
        body: {
            en: '<p>To Whom It May Concern,</p><p>This letter is to confirm that Javad has been a dedicated and active member of our congregation since January 2020. He regularly attends our weekly services and participates in our community outreach programs.</p><p>We have found him to be a person of good character, demonstrating kindness, integrity, and a strong commitment to his faith and community. He is a valued member of our church family, and we are pleased to provide this reference for him.</p><p>Should you require any further information, please do not hesitate to contact us.</p>',
            fa: '<p>به مسئول مربوطه،</p><p>این نامه جهت تأیید این موضوع است که جواد از ژانویه ۲۰۲۰ عضو فداکار و فعال جماعت ما بوده است. ایشان به طور منظم در مراسم هفتگی ما شرکت کرده و در برنامه‌های اجتماعی ما مشارکت دارند.</p><p>ما ایشان را فردی با شخصیت خوب، مهربان، با صداقت و تعهدی قوی به ایمان و جامعه خود یافته‌ایم. او عضو ارزشمندی از خانواده کلیسای ما است و ما خرسندیم که این گواهی را برای ایشان ارائه دهیم.</p><p>در صورت نیاز به اطلاعات بیشتر، لطفاً با ما تماس بگیرید.</p>'
        },
        authorEmail: 'admin@example.com',
        createdAt: new Date().toISOString(),
        authorizedUsers: ['javad@example.com']
    }
];

export const mockEmails: Email[] = [
    {
        id: 'info-1',
        from: { name: 'Sarah K.', email: 'sarah.k@example.com' },
        to: 'info@iccdc.com',
        subject: 'Question about Sunday service',
        body: '<p>Hello, I am new to the area and was wondering what time your Sunday service starts. Thank you!</p>',
        date: new Date(Date.now() - 86400000 * 1).toISOString(),
        isRead: false,
    },
    {
        id: 'info-2',
        from: { name: 'Church Volunteer Coordinator', email: 'volunteer@iccdc.com' },
        to: 'info@iccdc.com',
        subject: 'Update: Volunteer meeting next week',
        body: '<p>Hi team, a friendly reminder that our monthly volunteer meeting is scheduled for next Tuesday at 7 PM in the main hall. Please RSVP. Blessings!</p>',
        date: new Date(Date.now() - 86400000 * 2).toISOString(),
        isRead: true,
    },
    {
        id: 'admin-1',
        from: { name: 'Website Hosting Provider', email: 'support@hosting.com' },
        to: 'admin@example.com',
        subject: 'Scheduled Server Maintenance',
        body: '<p>Dear Customer, we will be performing scheduled maintenance on our servers this Saturday at 2 AM EST. We anticipate a brief downtime of approximately 15 minutes.</p>',
        date: new Date(Date.now() - 86400000 * 3).toISOString(),
        isRead: false,
    },
     {
        id: 'admin-2',
        from: { name: 'Nazi Rasti', email: 'nazi.r@example.com' },
        to: 'admin@example.com',
        subject: "Women's Bible Study Materials",
        body: '<p>Hi Pastor, could you please order 20 more copies of the "Women of the Word" study guide? We have many new members joining. Thanks!</p>',
        date: new Date(Date.now() - 86400000 * 4).toISOString(),
        isRead: true,
    }
];
