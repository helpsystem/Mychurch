
import { BibleBook } from '../types';

export const MOCK_TRANSLATIONS = [
    {
        id: 1,
        code: 'TPV',
        name: { en: 'Persian Old Version', fa: 'ترجمه قدیم فارسی' },
        description: { en: 'Traditional Persian translation', fa: 'ترجمه سنتی و ادبی کتاب مقدس' },
        language: 'fa',
        isDefault: true,
        sortOrder: 1,
        hasAudio: true
    },
    {
        id: 2,
        code: 'PCB',
        name: { en: 'Persian Contemporary Bible', fa: 'ترجمه مژده (عصر جدید)' },
        description: { en: 'Modern Persian translation', fa: 'ترجمه تفسیری و روان امروزی' },
        language: 'fa',
        isDefault: false,
        sortOrder: 2,
        hasAudio: false
    },
    {
        id: 3,
        code: 'NMV',
        name: { en: 'New Millennium Version', fa: 'ترجمه هزاره نو' },
        description: { en: 'Contemporary Persian translation', fa: 'ترجمه دقیق و ادبی معاصر' },
        language: 'fa',
        isDefault: false,
        sortOrder: 3,
        hasAudio: true
    },
    {
        id: 4,
        code: 'NIV',
        name: { en: 'New International Version', fa: 'نسخه بین‌المللی جدید' },
        description: { en: 'Modern English translation', fa: 'ترجمه مدرن انگلیسی' },
        language: 'en',
        isDefault: false,
        sortOrder: 4,
        hasAudio: true
    },
    {
        id: 5,
        code: 'KJV',
        name: { en: 'King James Version', fa: 'نسخه کینگ جیمز' },
        description: { en: 'Traditional English translation', fa: 'ترجمه کلاسیک و ادبی انگلیسی' },
        language: 'en',
        isDefault: false,
        sortOrder: 5,
        hasAudio: true
    },
    {
        id: 6,
        code: 'ESV',
        name: { en: 'English Standard Version', fa: 'نسخه استاندارد انگلیسی' },
        description: { en: 'Literal English translation', fa: 'ترجمه دقیق کلمه به کلمه انگلیسی' },
        language: 'en',
        isDefault: false,
        sortOrder: 6,
        hasAudio: false
    },
    {
        id: 7,
        code: 'NLT',
        name: { en: 'New Living Translation', fa: 'ترجمه زنده جدید' },
        description: { en: 'Easy-to-read English translation', fa: 'ترجمه انگلیسی بسیار روان و ساده' },
        language: 'en',
        isDefault: false,
        sortOrder: 7,
        hasAudio: true
    }
];

export const MOCK_BOOKS: (BibleBook & { hasAudio: boolean })[] = [
    { key: 'GEN', name: { en: 'Genesis', fa: 'پیدایش' }, chapters: 50, testament: 'OT', hasAudio: true },
    { key: 'EXO', name: { en: 'Exodus', fa: 'خروج' }, chapters: 40, testament: 'OT', hasAudio: false },
    { key: 'PSA', name: { en: 'Psalms', fa: 'مزامیر' }, chapters: 150, testament: 'OT', hasAudio: true },
    { key: 'MAT', name: { en: 'Matthew', fa: 'متی' }, chapters: 28, testament: 'NT', hasAudio: true },
    { key: 'MRK', name: { en: 'Mark', fa: 'مرقس' }, chapters: 16, testament: 'NT', hasAudio: true },
    { key: 'LUK', name: { en: 'Luke', fa: 'لوقا' }, chapters: 24, testament: 'NT', hasAudio: true },
    { key: 'JHN', name: { en: 'John', fa: 'یوحنا' }, chapters: 21, testament: 'NT', hasAudio: true },
    { key: 'ACT', name: { en: 'Acts', fa: 'اعمال رسولان' }, chapters: 28, testament: 'NT', hasAudio: true },
    { key: 'ROM', name: { en: 'Romans', fa: 'رومیان' }, chapters: 16, testament: 'NT', hasAudio: false },
    { key: 'EPH', name: { en: 'Ephesians', fa: 'افسسیان' }, chapters: 6, testament: 'NT', hasAudio: true },
    { key: 'REV', name: { en: 'Revelation', fa: 'مکاشفه' }, chapters: 22, testament: 'NT', hasAudio: false }
];

export const MOCK_CONTENT: Record<string, Record<number, { fa: string[], en: string[] }>> = {
    'GEN': {
        1: {
            fa: [
                'در ابتدا خدا آسمانها و زمین را آفرید.',
                'و زمین تهی و بایر بود و تاریکی بر روی لجه و روح خدا بر روی آبها در حرکت بود.',
                'و خدا گفت: «روشنایی بشود.» و روشنایی شد.',
                'و خدا روشنایی را دید که نیکوست و خدا روشنایی را از تاریکی جدا ساخت.',
                'و خدا روشنایی را روز نامید و تاریکی را شب نامید. و شام بود و صبح بود، روزی اول.',
                'و خدا گفت: «فلکی باشد در میان آبها و آبها را از آبها جدا کند.»',
                'و خدا فلک را ساخت و آبهای زیر فلک را از آبهای بالای فلک جدا کرد. و چنین شد.',
                'و خدا فلک را آسمان نامید. و شام بود و صبح بود، روزی دوم.',
                'و خدا گفت: «آبهای زیر آسمان در یکجا جمع شوند و خشکی ظاهر گردد.» و چنین شد.',
                'و خدا خشکی را زمین نامید و اجتماع آبها را دریا نامید. و خدا دید که نیکوست.',
                'و خدا گفت: «زمین نباتات برویاند، علفی که تخم بیاورد و درخت میوه‌ای که موافق جنس خود میوه آورد که تخمش در آن باشد، بر روی زمین.» و چنین شد.',
                'و زمین نباتات رویانید، علفی که موافق جنس خود تخم می‌آورد و درخت میوه‌داری که تخمش در آن موافق جنس خود می‌باشد. و خدا دید که نیکوست.',
                'و شام بود و صبح بود، روزی سوم.',
                'و خدا گفت: «نیرها در فلک آسمان باشند تا روز را از شب جدا کنند و برای آیات و زمانها و روزها و سالها باشند.',
                'و نیرها در فلک آسمان باشند تا بر زمین روشنایی دهند.» و چنین شد.',
                'و خدا دو نیر بزرگ ساخت، نیر اعظم را برای سلطنت روز و نیر اصغر را برای سلطنت شب، و ستارگان را.',
                'و خدا آنها را در فلک آسمان گذاشت تا بر زمین روشنایی دهند،',
                'و تا بر روز و شب سلطنت نمایند و روشنایی را از تاریکی جدا کنند. و خدا دید که نیکوست.',
                'و شام بود و صبح بود، روزی چهارم.',
                'و خدا گفت: «آبها به انبوه جانوران پر شود و پرندگان بالای زمین بر روی فلک آسمان پرواز کنند.»',
                'پس خدا نهنگان بزرگ آفرید و همه جانداران خزنده را، که آبها از آنها موافق اجناس آنها پر شد، و همه پرندگان بالدار را به اجناس آنها. و خدا دید که نیکوست.',
                'و خدا آنها را برکت داده، گفت: «بارور و کثیر شوید و آبهای دریا را پر سازید و پرندگان در زمین کثیر شوند.»',
                'و شام بود و صبح بود، روزی پنجم.',
                'و خدا گفت: «زمین جانوران را موافق اجناس آنها بیرون آورد، بهایم و حشرات و حیوانات زمین به اجناس آنها.» و چنین شد.',
                'پس خدا حیوانات زمین را به اجناس آنها ساخت و بهایم را به اجناس آنها و همه حشرات زمین را به اجناس آنها. و خدا دید که نیکوست.',
                'و خدا گفت: «آدم را بصورت ما و موافق شبیه ما بسازیم تا بر ماهیان دریا و پرندگان آسمان و بهایم و بر تمام زمین و همه حشراتی که بر زمین می‌خزند، حکومت نماید.»',
                'پس خدا آدم را بصورت خود آفرید. او را بصورت خدا آفرید. ایشان را نر و ماده آفرید.',
                'و خدا ایشان را برکت داد و خدا بدیشان گفت: «بارور و کثیر شوید و زمین را پر سازید و در آن تسلط نمایید، و بر ماهیان دریا و پرندگان آسمان و بر هر حیوانی که بر زمین می‌خزد، حکومت کنید.»',
                'و خدا گفت: «همانا من همه علفهای تخم‌داری که بر روی تمام زمین است و همه درختهایی که در آنها میوه درخت تخم‌دار است، به شما دادم تا برای شما خوراک باشد.',
                'و به همه حیوانات زمین و به همه پرندگان آسمان و به هر چه بر زمین می‌خزد که در آن حیات است، هر علف سبز را برای خوراک دادم.» و چنین شد.',
                'و خدا هر چه ساخته بود، دید و همانا بسیار نیکو بود. و شام بود و صبح بود، روزی ششم.'
            ],
            en: [
                'In the beginning God created the heavens and the earth.',
                'Now the earth was formless and empty, darkness was over the surface of the deep, and the Spirit of God was hovering over the waters.',
                'And God said, "Let there be light," and there was light.',
                'God saw that the light was good, and he separated the light from the darkness.',
                'God called the light "day," and the darkness he called "night." And there was evening, and there was morning—the first day.',
                'And God said, "Let there be a vault between the waters to separate water from water."',
                'So God made the vault and separated the water under the vault from the water above it. And it was so.',
                'God called the vault "sky." And there was evening, and there was morning—the second day.',
                'And God said, "Let the water under the sky be gathered to one place, and let dry ground appear." And it was so.',
                'God called the dry ground "land," and the gathered waters he called "seas." And God saw that it was good.',
                'Then God said, "Let the land produce vegetation: seed-bearing plants and trees on the land that bear fruit with seed in it, according to their various kinds." And it was so.',
                'The land produced vegetation: plants bearing seed according to their kinds and trees bearing fruit with seed in it according to their kinds. And God saw that it was good.',
                'And there was evening, and there was morning—the third day.',
                'And God said, "Let there be lights in the vault of the sky to separate the day from the night, and let them serve as signs to mark sacred times, and days and years,',
                'and let them be lights in the vault of the sky to give light on the earth." And it was so.',
                'God made two great lights—the greater light to govern the day and the lesser light to govern the night. He also made the stars.',
                'God set them in the vault of the sky to give light on the earth,',
                'to govern the day and the night, and to separate light from darkness. And God saw that it was good.',
                'And there was evening, and there was morning—the fourth day.',
                'And God said, "Let the water teem with living creatures, and let birds fly above the earth across the vault of the sky."',
                'So God created the great creatures of the sea and every living thing with which the water teems and that moves about in it, according to their kinds, and every winged bird according to its kind. And God saw that it was good.',
                'God blessed them and said, "Be fruitful and increase in number and fill the water in the seas, and let the birds increase on the earth."',
                'And there was evening, and there was morning—the fifth day.',
                'And God said, "Let the land produce living creatures according to their kinds: the livestock, the creatures that move along the ground, and the wild animals, each according to its kind." And it was so.',
                'God made the wild animals according to their kinds, the livestock according to their kinds, and all the creatures that move along the ground according to their kinds. And God saw that it was good.',
                'Then God said, "Let us make mankind in our image, in our likeness, so that they may rule over the fish in the sea and the birds in the sky, over the livestock and all the wild animals, and over all the creatures that move along the ground."',
                'So God created mankind in his own image, in the image of God he created them; male and female he created them.',
                'God blessed them and said to them, "Be fruitful and increase in number; fill the earth and subdue it. Rule over the fish in the sea and the birds in the sky and over every living creature that moves on the ground."',
                'Then God said, "I give you every seed-bearing plant on the face of the whole earth and every tree that has fruit with seed in it. They will be yours for food.',
                'And to all the beasts of the earth and all the birds in the sky and all the creatures that move along the ground—everything that has the breath of life in it—I give every green plant for food." And it was so.',
                'God saw all that he had made, and it was very good. And there was evening, and there was morning—the sixth day.'
            ]
        },
        2: {
            fa: [
                'و آسمانها و زمین و همه لشکر آنها تمام شد.',
                'و در روز هفتم خدا از همه کار خود که ساخته بود فارغ شد، و در روز هفتم از همه کار خود که ساخته بود آرامی گرفت.',
                'و خدا روز هفتم را برکت داد و آن را مقدس ساخت، زیرا که در آن آرام گرفت از همه کار خود که خدا آفریده و ساخته بود.',
                'این است پیدایش آسمانها و زمین در حین آفرینش آنها در روزی که یهوه خدا زمین و آسمانها را بساخت.',
                'و هیچ نهال صحرا هنوز در زمین نبود و هیچ علف صحرا هنوز نروییده بود، زیرا خداوند خدا باران بر زمین نبارانیده بود و آدمی نبود که کار زمین را بکند.',
                'و مه از زمین برآمده، تمام روی زمین را سیراب می‌کرد.',
                'خداوند خدا پس آدم را از خاک زمین بسرشت و در بینی وی روح حیات دمید، و آدم نفس زنده شد.',
                'و خداوند خدا باغی در عدن به طرف مشرق غرس نمود و آن آدم را که سرشته بود، در آنجا گذاشت.',
                'و خداوند خدا هر درخت خوش‌نما و خوش‌خوراک را از زمین رویانید، و درخت حیات را در وسط باغ و درخت معرفت نیک و بد را.',
                'و نهری از عدن بیرون آمد تا باغ را سیراب کند، و از آنجا منقسم گشته، چهار شعبه شد.',
                'نام اول فیشون است که تمام زمین حویله را که در آنجا طلاست، احاطه می‌کند.',
                'و طلای آن زمین نیکوست و در آنجا مروارید و سنگ جزع است.',
                'و نام نهر دوم جیحون که تمام زمین کوش را احاطه می‌کند.',
                'و نام نهر سوم حدقل که به جانب شرقی آشور جاری است. و نهر چهارم فرات.',
                'پس خداوند خدا آدم را گرفت و او را در باغ عدن گذاشت تا کار آن را بکند و از آن محافظت نماید.',
                'و خداوند خدا آدم را امر فرموده، گفت: «از همه درختان باغ بی‌ممانعت بخور،',
                'اما از درخت معرفت نیک و بد زنهار نخوری، زیرا روزی که از آن خوردی، هرآینه خواهی مرد.»',
                'و خداوند خدا گفت: «خوب نیست که آدم تنها باشد. پس برایش معاونی موافق وی بسازم.»',
                'و خداوند خدا هر حیوان صحرا و هر پرنده آسمان را از زمین سرشت و نزد آدم آورد تا ببیند که چه نام خواهد نهاد و آنچه آدم هر ذی‌حیات را خواند، همان نام او شد.',
                'پس آدم همه بهایم و پرندگان آسمان و همه حیوانات صحرا را نام نهاد. لیکن برای آدم معاونی موافق وی یافت نشد.',
                'و خداوند خدا خوابی گران بر آدم مستولی گردانید تا بخفت، و یکی از دنده‌هایش را گرفت و گوشت در جایش پر کرد.',
                'و خداوند خدا آن دنده را که از آدم گرفته بود، زنی بنا کرد و وی را به نزد آدم آورد.',
                'و آدم گفت: «همانا اینست استخوانی از استخوانهایم و گوشتی از گوشتم، از این سبب "نسا" نامیده شود زیرا که از انسان گرفته شد.»',
                'از این سبب مرد پدر و مادر خود را ترک کرده، با زن خویش خواهد پیوست و یک تن خواهند بود.',
                'و آدم و زنش هر دو برهنه بودند و خجلت نمی‌کشیدند.'
            ],
            en: [
                'Thus the heavens and the earth were completed in all their vast array.',
                'By the seventh day God had finished the work he had been doing; so on the seventh day he rested from all his work.',
                'Then God blessed the seventh day and made it holy, because on it he rested from all the work of creating that he had done.',
                'This is the account of the heavens and the earth when they were created, when the Lord God made the earth and the heavens.',
                'Now no shrub had yet appeared on the earth and no plant had yet sprung up, for the Lord God had not sent rain on the earth and there was no one to work the ground,',
                'but streams came up from the earth and watered the whole surface of the ground.',
                'Then the Lord God formed a man from the dust of the ground and breathed into his nostrils the breath of life, and the man became a living being.',
                'Now the Lord God had planted a garden in the east, in Eden; and there he put the man he had formed.',
                'The Lord God made all kinds of trees grow out of the ground—trees that were pleasing to the eye and good for food. In the middle of the garden were the tree of life and the tree of the knowledge of good and evil.',
                'A river watering the garden flowed from Eden; from there it was separated into four headwaters.',
                'The name of the first is the Pishon; it winds through the entire land of Havilah, where there is gold.',
                '(The gold of that land is good; aromatic resin and onyx are also there.)',
                'The name of the second river is the Gihon; it winds through the entire land of Cush.',
                'The name of the third river is the Tigris; it runs along the east side of Ashur. And the fourth river is the Euphrates.',
                'The Lord God took the man and put him in the Garden of Eden to work it and take care of it.',
                'And the Lord God commanded the man, "You are free to eat from any tree in the garden;',
                'but you must not eat from the tree of the knowledge of good and evil, for when you eat from it you will certainly die."',
                'The Lord God said, "It is not good for the man to be alone. I will make a helper suitable for him."',
                'Now the Lord God had formed out of the ground all the wild animals and all the birds in the sky. He brought them to the man to see what he would name them; and whatever the man called each living creature, that was its name.',
                'So the man gave names to all the livestock, the birds in the sky and all the wild animals. But for Adam no suitable helper was found.',
                'So the Lord God caused the man to fall into a deep sleep; and while he was sleeping, he took one of the man’s ribs and then closed up the place with flesh.',
                'Then the Lord God made a woman from the rib he had taken out of the man, and he brought her to the man.',
                'The man said, "This is now bone of my bones and flesh of my flesh; she shall be called ‘woman,’ for she was taken out of man."',
                'That is why a man leaves his father and mother and is united to his wife, and they become one flesh.',
                'Adam and his wife were both naked, and they felt no shame.'
            ]
        }
    },
    'JHN': {
        1: {
            fa: [
                'در ابتدا کلمه بود و کلمه نزد خدا بود و کلمه خدا بود.',
                'همان در ابتدا نزد خدا بود.',
                'همه چیز به واسطه او آفریده شد و به غیر از او چیزی از موجودات وجود نیافت.',
                'در او حیات بود و حیات نور انسان بود.',
                'و نور در تاریکی می‌درخشد و تاریکی آن را درنیافت.'
            ],
            en: [
                'In the beginning was the Word, and the Word was with God, and the Word was God.',
                'He was with God in the beginning.',
                'Through him all things were made; without him nothing was made that has been made.',
                'In him was life, and that life was the light of all mankind.',
                'The light shines in the darkness, and the darkness has not overcome it.'
            ]
        }
    },
    'EPH': {
        1: {
            fa: [
                'پولس، رسول عیسی مسیح به اراده خدا، به مقدسینی که در افسس می‌باشند و به مؤمنین در عیسی مسیح.',
                'فیض و سلامتی از جانب پدر ما خدا و عیسی مسیح خداوند بر شما باد.',
                'متبارک باد خدا و پدر خداوند ما عیسی مسیح که ما را در مسیح به هر برکت روحانی در جایهای آسمانی مبارک ساخته است.',
                'چنانکه ما را پیش از بنیاد عالم در او برگزید تا در حضور او مقدس و بی‌عیب باشیم.',
                'و ما را از قبل تعیین نمود تا او را پسرخوانده شویم به وساطت عیسی مسیح برحسب خشنودی اراده خود،'
            ],
            en: [
                'Paul, an apostle of Christ Jesus by the will of God, To God’s holy people in Ephesus, the faithful in Christ Jesus:',
                'Grace and peace to you from God our Father and the Lord Jesus Christ.',
                'Praise be to the God and Father of our Lord Jesus Christ, who has blessed us in the heavenly realms with every spiritual blessing in Christ.',
                'For he chose us in him before the creation of the world to be holy and blameless in his sight. In love',
                'he predestined us for adoption to sonship through Jesus Christ, in accordance with his pleasure and will—'
            ]
        }
    }
};
