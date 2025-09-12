import { BibleBook, Language } from '../types';

export const INITIAL_BIBLE_BOOKS: BibleBook[] = [
    // Old Testament
    { key: "Genesis", name: { en: "Genesis", fa: "تکوین" }, chapters: 50 },
    { key: "Exodus", name: { en: "Exodus", fa: "خروج" }, chapters: 40 },
    { key: "Leviticus", name: { en: "Leviticus", fa: "لاویان" }, chapters: 27 },
    { key: "Numbers", name: { en: "Numbers", fa: "اعداد" }, chapters: 36 },
    { key: "Deuteronomy", name: { en: "Deuteronomy", fa: "تثنیه" }, chapters: 34 },
    { key: "Joshua", name: { en: "Joshua", fa: "یوشع" }, chapters: 24 },
    { key: "Judges", name: { en: "Judges", fa: "داوران" }, chapters: 21 },
    { key: "Ruth", name: { en: "Ruth", fa: "روت" }, chapters: 4 },
    { key: "1Samuel", name: { en: "1 Samuel", fa: "اول سموئیل" }, chapters: 31 },
    { key: "2Samuel", name: { en: "2 Samuel", fa: "دوم سموئیل" }, chapters: 24 },
    { key: "1Kings", name: { en: "1 Kings", fa: "اول پادشاهان" }, chapters: 22 },
    { key: "2Kings", name: { en: "2 Kings", fa: "دوم پادشاهان" }, chapters: 25 },
    { key: "1Chronicles", name: { en: "1 Chronicles", fa: "اول تواریخ" }, chapters: 29 },
    { key: "2Chronicles", name: { en: "2 Chronicles", fa: "دوم تواریخ" }, chapters: 36 },
    { key: "Ezra", name: { en: "Ezra", fa: "عزرا" }, chapters: 10 },
    { key: "Nehemiah", name: { en: "Nehemiah", fa: "نحمیا" }, chapters: 13 },
    { key: "Esther", name: { en: "Esther", fa: "استر" }, chapters: 10 },
    { key: "Job", name: { en: "Job", fa: "ایوب" }, chapters: 42 },
    { key: "Psalms", name: { en: "Psalms", fa: "مزامیر" }, chapters: 150 },
    { key: "Proverbs", name: { en: "Proverbs", fa: "امثال" }, chapters: 31 },
    { key: "Ecclesiastes", name: { en: "Ecclesiastes", fa: "جامعه" }, chapters: 12 },
    { key: "SongOfSongs", name: { en: "Song of Songs", fa: "غزل غزلها" }, chapters: 8 },
    { key: "Isaiah", name: { en: "Isaiah", fa: "اشعیا" }, chapters: 66 },
    { key: "Jeremiah", name: { en: "Jeremiah", fa: "ارمیا" }, chapters: 52 },
    { key: "Lamentations", name: { en: "Lamentations", fa: "مراثی" }, chapters: 5 },
    { key: "Ezekiel", name: { en: "Ezekiel", fa: "حزقیال" }, chapters: 48 },
    { key: "Daniel", name: { en: "Daniel", fa: "دانیال" }, chapters: 12 },
    { key: "Hosea", name: { en: "Hosea", fa: "هوشع" }, chapters: 14 },
    { key: "Joel", name: { en: "Joel", fa: "یوئیل" }, chapters: 3 },
    { key: "Amos", name: { en: "Amos", fa: "عاموس" }, chapters: 9 },
    { key: "Obadiah", name: { en: "Obadiah", fa: "عوبدیا" }, chapters: 1 },
    { key: "Jonah", name: { en: "Jonah", fa: "یونس" }, chapters: 4 },
    { key: "Micah", name: { en: "Micah", fa: "میکاه" }, chapters: 7 },
    { key: "Nahum", name: { en: "Nahum", fa: "ناحوم" }, chapters: 3 },
    { key: "Habakkuk", name: { en: "Habakkuk", fa: "حبقوق" }, chapters: 3 },
    { key: "Zephaniah", name: { en: "Zephaniah", fa: "صفنیا" }, chapters: 3 },
    { key: "Haggai", name: { en: "Haggai", fa: "حجی" }, chapters: 2 },
    { key: "Zechariah", name: { en: "Zechariah", fa: "زکریا" }, chapters: 14 },
    { key: "Malachi", name: { en: "Malachi", fa: "ملاکی" }, chapters: 4 },
    
    // New Testament
    { key: "Matthew", name: { en: "Matthew", fa: "متی" }, chapters: 28 },
    { key: "Mark", name: { en: "Mark", fa: "مرقس" }, chapters: 16 },
    { key: "Luke", name: { en: "Luke", fa: "لوقا" }, chapters: 24 },
    { key: "John", name: { en: "John", fa: "یوحنا" }, chapters: 21 },
    { key: "Acts", name: { en: "Acts", fa: "اعمال" }, chapters: 28 },
    { key: "Romans", name: { en: "Romans", fa: "رومیان" }, chapters: 16 },
    { key: "1Corinthians", name: { en: "1 Corinthians", fa: "اول قورنتیان" }, chapters: 16 },
    { key: "2Corinthians", name: { en: "2 Corinthians", fa: "دوم قورنتیان" }, chapters: 13 },
    { key: "Galatians", name: { en: "Galatians", fa: "غلاطیان" }, chapters: 6 },
    { key: "Ephesians", name: { en: "Ephesians", fa: "افسسیان" }, chapters: 6 },
    { key: "Philippians", name: { en: "Philippians", fa: "فیلیپیان" }, chapters: 4 },
    { key: "Colossians", name: { en: "Colossians", fa: "کولسیان" }, chapters: 4 },
    { key: "1Thessalonians", name: { en: "1 Thessalonians", fa: "اول تسالونیکیان" }, chapters: 5 },
    { key: "2Thessalonians", name: { en: "2 Thessalonians", fa: "دوم تسالونیکیان" }, chapters: 3 },
    { key: "1Timothy", name: { en: "1 Timothy", fa: "اول تیموتاؤس" }, chapters: 6 },
    { key: "2Timothy", name: { en: "2 Timothy", fa: "دوم تیموتاؤس" }, chapters: 4 },
    { key: "Titus", name: { en: "Titus", fa: "تیطس" }, chapters: 3 },
    { key: "Philemon", name: { en: "Philemon", fa: "فلیمون" }, chapters: 1 },
    { key: "Hebrews", name: { en: "Hebrews", fa: "عبرانیان" }, chapters: 13 },
    { key: "James", name: { en: "James", fa: "یعقوب" }, chapters: 5 },
    { key: "1Peter", name: { en: "1 Peter", fa: "اول پطرس" }, chapters: 5 },
    { key: "2Peter", name: { en: "2 Peter", fa: "دوم پطرس" }, chapters: 3 },
    { key: "1John", name: { en: "1 John", fa: "اول یوحنا" }, chapters: 5 },
    { key: "2John", name: { en: "2 John", fa: "دوم یوحنا" }, chapters: 1 },
    { key: "3John", name: { en: "3 John", fa: "سوم یوحنا" }, chapters: 1 },
    { key: "Jude", name: { en: "Jude", fa: "یهودا" }, chapters: 1 },
    { key: "Revelation", name: { en: "Revelation", fa: "مکاشفه" }, chapters: 22 },
];

// Content is now structured as: Book -> Chapter -> Language -> Verses
export const INITIAL_BIBLE_CONTENT: Record<string, Record<string, Record<Language, string[]>>> = {
    "Genesis": {
        "1": {
            en: [
                "In the beginning God created the heavens and the earth.",
                "Now the earth was formless and empty, darkness was over the surface of the deep, and the Spirit of God was hovering over the waters.",
                "And God said, \"Let there be light,\" and there was light.",
                "God saw that the light was good, and he separated the light from the darkness.",
                "God called the light \"day,\" and the darkness he called \"night.\" And there was evening, and there was morning—the first day.",
                "And God said, \"Let there be a vault between the waters to separate water from water.\"",
                "So God made the vault and separated the water under the vault from the water above it. And it was so.",
                "God called the vault \"sky.\" And there was evening, and there was morning—the second day.",
                "And God said, \"Let the water under the sky be gathered to one place, and let dry ground appear.\" And it was so.",
                "God called the dry ground \"land,\" and the gathered waters he called \"seas.\" And God saw that it was good."
            ],
            fa: [
                "در ابتدا، خدا آسمان‌ها و زمین را آفرید.",
                "و زمین بی‌شکل و خالی بود و تاریکی بر روی لجه‌ها بود و روح خدا بر آب‌ها حرکت می‌کرد.",
                "و خدا فرمود: «نور باشد» و نور شد.",
                "و خدا نور را دید که نیکو است و خدا در میان نور و تاریکی جدایی انداخت.",
                "و خدا نور را روز نامید و تاریکی را شب نامید. پس شام شد و صبح شد، روز اول.",
                "و خدا فرمود: «فلکی در میان آب‌ها باشد تا در میان آب و آب جدایی کند.»",
                "پس خدا فلک را ساخت و در میان آبی که زیر فلک است و آبی که بالای فلک است جدایی انداخت و چنین شد.",
                "و خدا فلک را آسمان نامید. پس شام شد و صبح شد، روز دوم.",
                "و خدا فرمود: «آب‌هایی که زیر آسمان است در یک جا جمع شود و خشکی پیدا گردد» و چنین شد.",
                "و خدا خشکی را زمین نامید و اجتماع آب‌ها را دریا نامید. و خدا دید که نیکو است."
            ]
        },
        "2": {
            en: [
                "Thus the heavens and the earth were completed in all their vast array.",
                "By the seventh day God had finished the work he had been doing; so on the seventh day he rested from all his work.",
                "Then God blessed the seventh day and made it holy, because on it he rested from all the work of creating that he had done.",
                "This is the account of the heavens and the earth when they were created, when the Lord God made the earth and the heavens.",
                "Now no shrub had yet appeared on the earth and no plant had yet sprung up, for the Lord God had not sent rain on the earth and there was no one to work the ground.",
                "But streams came up from the earth and watered the whole surface of the ground.",
                "Then the Lord God formed a man from the dust of the ground and breathed into his nostrils the breath of life, and the man became a living being.",
                "Now the Lord God had planted a garden in the east, in Eden; and there he put the man he had formed.",
                "The Lord God made all kinds of trees grow out of the ground—trees that were pleasing to the sight and good for food. In the middle of the garden were the tree of life and the tree of the knowledge of good and evil."
            ],
            fa: [
                "پس آسمان‌ها و زمین و تمامی لشکر آن‌ها تمام شد.",
                "و خدا در روز هفتم، عملی را که کرده بود تمام کرد. پس در روز هفتم از همه عملی که کرده بود آرامید.",
                "و خدا روز هفتم را مبارک ساخت و آن را تقدیس نمود زیرا که در آن از همه عملی که خدا به آفرینش کرده بود آرامید.",
                "اینکه سوابق آسمان و زمین است هنگامی که آفریده شدند، که یهوه خدا زمین و آسمان را ساخت.",
                "و هیچ نهال صحرایی هنوز بر زمین نبود و هیچ علف صحرایی هنوز نرویده بود، زیرا یهوه خدا بر زمین باران نبرانده بود و آدمی نبود تا زمین را کار کند.",
                "اما بخاری از زمین برمی‌آمد و تمامی سطح زمین را سیراب می‌کرد.",
                "پس یهوه خدا آدم را از خاک زمین بسرشت و در بینی او نسمه حیات دمید و آدم جان زنده شد.",
                "و یهوه خدا باغی در عدن از سمت مشرق غرس نمود و آدمی را که سرشته بود در آنجا گذاشت.",
                "و یهوه خدا از زمین هر درختی را که برای نظر دلپسند و برای خوردن نیکو باشد رویانید و درخت حیات را در وسط باغ و درخت معرفت نیک و بد را نیز."
            ]
        },
        "3": {
            en: [
                "Now the serpent was more crafty than any of the wild animals the Lord God had made. He said to the woman, \"Did God really say, 'You must not eat from any tree in the garden'?\"",
                "The woman said to the serpent, \"We may eat fruit from the trees in the garden,",
                "but God did say, 'You must not eat fruit from the tree that is in the middle of the garden, and you must not touch it, or you will die.'\"",
                "\"You will not certainly die,\" the serpent said to the woman.",
                "\"For God knows that when you eat from it your eyes will be opened, and you will be like God, knowing good and evil.\"",
                "When the woman saw that the fruit of the tree was good for food and pleasing to the eyes, and also desirable for gaining wisdom, she took some and ate it. She also gave some to her husband, who was with her, and he ate it.",
                "Then the eyes of both of them were opened, and they realized they were naked; so they sewed fig leaves together and made coverings for themselves.",
                "Then the man and his wife heard the sound of the Lord God as he was walking in the garden in the cool of the day, and they hid from the Lord God among the trees of the garden.",
                "But the Lord God called to the man, \"Where are you?\""
            ],
            fa: [
                "اما مار از همه حیوانات صحرا که یهوه خدا ساخته بود حیله‌گرتر بود. پس به زن گفت: «آیا راستی خدا فرموده است که از هر درخت باغ نخورید؟»",
                "زن به مار گفت: «از میوه درختان باغ می‌خوریم،",
                "اما از میوه درختی که در وسط باغ است خدا فرموده که نخورید و آن را لمس نکنید مبادا بمیرید.»",
                "مار به زن گفت: «البته نخواهید مرد.",
                "زیرا خدا می‌داند که در روزی که از آن بخورید چشمان شما باز خواهد شد و مثل خدا خواهید شد و نیک و بد را خواهید شناخت.»",
                "پس زن دید که درخت برای خوردن نیکو و برای چشم‌ها دلپسند و درختی است مرغوب برای عقل. پس از میوه‌اش گرفت و خورد و نیز به شوهرش که نزد او بود داد و او نیز خورد.",
                "آنگاه چشمان هر دوی ایشان باز شد و دانستند که عریانند. پس برگ انجیر با هم دوختند و ازار برای خود ساختند.",
                "و آواز یهوه خدا را شنیدند که در باغ در هوای روز قدم می‌زد. پس آدم و زنش از حضور یهوه خدا در میان درختان باغ خود را پنهان کردند.",
                "اما یهوه خدا آدم را خوانده گفت: «کجایی؟»"
            ]
        }
    },
    "Psalms": {
        "1": {
            en: [
                "Blessed is the one who does not walk in step with the wicked or stand in the way that sinners take or sit in the company of mockers,",
                "but whose delight is in the law of the Lord, and who meditates on his law day and night.",
                "That person is like a tree planted by streams of water, which yields its fruit in season and whose leaf does not wither— whatever they do prospers.",
                "Not so the wicked! They are like chaff that the wind blows away.",
                "Therefore the wicked will not stand in the judgment, nor sinners in the assembly of the righteous.",
                "For the Lord watches over the way of the righteous, but the way of the wicked leads to destruction."
            ],
            fa: [
                "خوشا به حال کسی که در مشورت شریران راه نمی‌رود و در طریق گناهکاران نمی‌ایستد و در مجلس استهزاکنندگان نمی‌نشیند.",
                "بلکه شادمانی او در شریعت خداوند است و شبانه‌روز در شریعت او تفکر می‌کند.",
                "او مانند درختی است که کنار نهرهای آب کاشته شده، که میوه‌اش را در فصلش می‌دهد و برگش پژمرده نمی‌شود؛ و هر آنچه می‌کند، موفقیت‌آمیز است.",
                "شریران چنین نیستند! آنها مانند کاهی هستند که باد پراکنده می‌کند.",
                "بنابراین، شریران در روز داوری نخواهند ایستاد، و نه گناهکاران در جماعت صالحان.",
                "زیرا خداوند راه صالحان را می‌شناسد، اما راه شریران به هلاکت می‌انجامد."
            ]
        },
        "23": {
            en: [
                "The Lord is my shepherd, I shall not be in want.",
                "He makes me lie down in green pastures, he leads me beside quiet waters,",
                "he refreshes my soul. He guides me along the right paths for his name's sake.",
                "Even though I walk through the darkest valley, I will fear no evil, for you are with me; your rod and your staff, they comfort me.",
                "You prepare a table before me in the presence of my enemies. You anoint my head with oil; my cup overflows.",
                "Surely your goodness and love will follow me all the days of my life, and I will dwell in the house of the Lord forever."
            ],
            fa: [
                "خداوند شبان من است، محتاج به هیچ چیز نخواهم بود.",
                "او مرا در مراتع سرسبز می‌خواباند و نزد آبهای آرام رهبری می‌کند.",
                "جانم را تازه می‌سازد و به خاطر نام خود، مرا به راه‌های عدالت هدایت می‌کند.",
                "حتی اگر در دره سایه موت راه بروم، از بدی نخواهم ترسید، زیرا تو با من هستی؛ عصا و چوب‌دستی تو، به من تسلی می‌بخشند.",
                "سفره‌ای برایم در برابر دشمنانم می‌گسترانی. سر من را با روغن تدهین می‌کنی و جام من لبریز است.",
                "یقیناً نیکویی و رحمت تو تمام روزهای عمرم با من خواهد بود و تا ابد در خانه خداوند ساکن خواهم بود."
            ]
        },
        "91": {
            en: [
                "Whoever dwells in the shelter of the Most High will rest in the shadow of the Almighty.",
                "I will say of the Lord, \"He is my refuge and my fortress, my God, in whom I trust.\"",
                "Surely he will save you from the fowler's snare and from the deadly pestilence.",
                "He will cover you with his feathers, and under his wings you will find refuge; his faithfulness will be your shield and rampart.",
                "You will not fear the terror of night, nor the arrow that flies by day,",
                "nor the pestilence that stalks in the darkness, nor the plague that destroys at midday.",
                "A thousand may fall at your side, ten thousand at your right hand, but it will not come near you.",
                "You will only observe with your eyes and see the punishment of the wicked.",
                "If you say, \"The Lord is my refuge,\" and you make the Most High your dwelling,",
                "no harm will overtake you, no disaster will come near your tent.",
                "For he will command his angels concerning you to guard you in all your ways;",
                "they will lift you up in their hands, so that you will not strike your foot against a stone.",
                "You will tread on the lion and the cobra; you will trample the great lion and the serpent.",
                "\"Because he loves me,\" says the Lord, \"I will rescue him; I will protect him, for he acknowledges my name.",
                "He will call on me, and I will answer him; I will be with him in trouble, I will deliver him and honor him.",
                "With long life I will satisfy him and show him my salvation.\""
            ],
            fa: [
                "آنکه در پناه حضرت اعلی ساکن است، در سایه قادر متعال آرام خواهد گرفت.",
                "درباره خداوند خواهم گفت: «او پناهگاه و دژ من است، خدای من که بر او توکل دارم.»",
                "یقیناً او تو را از دام صیاد و از طاعون مهلک نجات خواهد داد.",
                "او تو را با پرهای خود خواهد پوشاند و زیر بالهایش پناه خواهی یافت؛ وفاداری او سپر و حفاظ تو خواهد بود.",
                "از وحشت شب نخواهی ترسید، و نه از تیری که در روز پرواز می‌کند،",
                "و نه از طاعونی که در تاریکی می‌گردد، و نه از وبایی که در نیمروز هلاک می‌کند.",
                "هزار نفر در کنارت و ده هزار نفر در دست راستت خواهند افتاد، اما به تو نزدیک نخواهد شد.",
                "فقط با چشمانت خواهی دید و مجازات شریران را مشاهده خواهی کرد.",
                "اگر بگویی «خداوند پناه من است» و حضرت اعلی را مسکن خود سازی،",
                "هیچ بدی بر تو واقع نخواهد شد و هیچ بلایی به خیمه‌ات نزدیک نخواهد آمد.",
                "زیرا او به فرشتگانش درباره تو فرمان خواهد داد تا تو را در همه راه‌هایت حفظ کنند؛",
                "آنها تو را بر دستهایشان بلند خواهند کرد تا پایت به سنگی نخورد.",
                "بر شیر و کبرا قدم خواهی گذاشت؛ شیر بزرگ و مار را لگدمال خواهی کرد.",
                "خداوند می‌گوید: «چون او مرا دوست دارد، من او را نجات خواهم داد؛ من او را محافظت خواهم کرد، زیرا نام مرا می‌شناسد.",
                "او مرا خواهد خواند و من به او پاسخ خواهم داد؛ در سختی با او خواهم بود، او را رهایی خواهم داد و گرامی خواهم داشت.",
                "با عمر درازی او را سیر خواهم ساخت و نجات خود را به او نشان خواهم داد.»"
            ]
        }
    },
    "John": {
        "1": {
            en: [
                "In the beginning was the Word, and the Word was with God, and the Word was God.",
                "He was with God in the beginning.",
                "Through him all things were made; without him nothing was made that has been made.",
                "In him was life, and that life was the light of all mankind.",
                "The light shines in the darkness, and the darkness has not overcome it.",
                "There was a man sent from God whose name was John.",
                "He came as a witness to testify concerning that light, so that through him all might believe.",
                "He himself was not the light; he came only as a witness to the light.",
                "The true light that gives light to everyone was coming into the world.",
                "He was in the world, and though the world was made through him, the world did not recognize him.",
                "He came to that which was his own, but his own did not receive him.",
                "Yet to all who did receive him, to those who believed in his name, he gave the right to become children of God—",
                "children born not of natural descent, nor of human decision or a husband's will, but born of God.",
                "The Word became flesh and made his dwelling among us. We have seen his glory, the glory of the one and only Son, who came from the Father, full of grace and truth.",
                "John testified concerning him. He cried out, saying, \"This is the one I spoke about when I said, 'He who comes after me has surpassed me because he was before me.'\"",
                "Out of his fullness we have all received grace in place of grace already given.",
                "For the law was given through Moses; grace and truth came through Jesus Christ.",
                "No one has ever seen God, but the one and only Son, who is himself God and is in closest relationship with the Father, has made him known."
            ],
            fa: [
                "در ابتدا کلمه بود و کلمه نزد خدا بود و کلمه خدا بود.",
                "او در ابتدا نزد خدا بود.",
                "همه چیز به واسطه او آفریده شد و هیچ چیز بدون او به وجود نیامد.",
                "در او حیات بود و آن حیات، نور آدمیان بود.",
                "و نور در تاریکی می‌تابد و تاریکی آن را درک نکرد.",
                "مردی فرستاده از جانب خدا بود که نامش یحیی بود.",
                "او برای شهادت آمد تا بر آن نور شهادت دهد تا همه به وسیله او ایمان آورند.",
                "او آن نور نبود، بلکه آمد تا بر آن نور شهادت دهد.",
                "آن نور حقیقی که به هر انسانی روشنایی می‌بخشد، در حال آمدن به جهان بود.",
                "او در جهان بود و جهان به وسیله او آفریده شد، اما جهان او را نشناخت.",
                "او به ملک خود آمد، اما قوم خودش او را نپذیرفتند.",
                "اما به همه کسانی که او را پذیرفتند، یعنی به کسانی که به نام او ایمان آوردند، این قدرت را داد که فرزندان خدا شوند—",
                "فرزندانی که نه از خون، نه از خواهش تن و نه از خواسته یک مرد، بلکه از خدا تولد یافتند.",
                "و کلمه جسم شد و در میان ما ساکن گردید پر از فیض و راستی، و جلال او را دیدیم، جلالی چون جلال یگانه‌زاده از نزد پدر.",
                "یحیی درباره او شهادت داد و فریاد برآورده گفت: «این همان است که من درباره او گفتم: آنکه بعد از من می‌آید، از من برتر است، زیرا قبل از من بود.»",
                "و از پری او همه ما فیضی بر فیض یافته‌ایم.",
                "زیرا شریعت به وسیله موسی داده شد، اما فیض و راستی به وسیله عیسی مسیح آمد.",
                "هیچ کس هرگز خدا را ندیده است؛ یگانه‌زاده که خود خدا است و در آغوش پدر می‌باشد، او او را آشکار ساخته است."
            ]
        }
    }
};