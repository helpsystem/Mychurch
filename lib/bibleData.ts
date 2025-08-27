import { BibleBook, Language } from '../types';

export const INITIAL_BIBLE_BOOKS: BibleBook[] = [
    { key: "Psalms", name: { en: "Psalms", fa: "مزامیر" }, chapters: 3 },
    { key: "John", name: { en: "John", fa: "یوحنا" }, chapters: 3 },
];

// Content is now structured as: Book -> Chapter -> Language -> Verses
export const INITIAL_BIBLE_CONTENT: Record<string, Record<string, Record<Language, string[]>>> = {
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
                "he refreshes my soul. He guides me along the right paths for his name’s sake.",
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
                "I will say of the Lord, “He is my refuge and my fortress, my God, in whom I trust.”",
                "Surely he will save you from the fowler’s snare and from the deadly pestilence.",
                "He will cover you with his feathers, and under his wings you will find refuge; his faithfulness will be your shield and rampart.",
                "You will not fear the terror of night, nor the arrow that flies by day,",
                "nor the pestilence that stalks in the darkness, nor the plague that destroys at midday.",
                "A thousand may fall at your side, ten thousand at your right hand, but it will not come near you.",
                "You will only observe with your eyes and see the punishment of the wicked.",
                "If you say, “The Lord is my refuge,” and you make the Most High your dwelling,",
                "no harm will overtake you, no disaster will come near your tent.",
                "For he will command his angels concerning you to guard you in all your ways;",
                "they will lift you up in their hands, so that you will not strike your foot against a stone.",
                "You will tread on the lion and the cobra; you will trample the great lion and the serpent.",
                "“Because he loves me,” says the Lord, “I will rescue him; I will protect him, for he acknowledges my name.",
                "He will call on me, and I will answer him; I will be with him in trouble, I will deliver him and honor him.",
                "With long life I will satisfy him and show him my salvation.”"
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
                "با عمر طولانی او را سیر خواهم کرد و نجات خود را به او نشان خواهم داد.»"
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
                "children born not of natural descent, nor of human decision or a husband’s will, but born of God.",
                "The Word became flesh and made his dwelling among us. We have seen his glory, the glory of the one and only Son, who came from the Father, full of grace and truth.",
                "John testified concerning him. He cried out, saying, “This is the one I spoke about when I said, ‘He who comes after me has surpassed me because he was before me.’”",
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
                "و کلمه، انسان شد و در میان ما ساکن گردید. و ما جلال او را دیدیم، جلالی شایسته پسر یگانه پدر، پر از فیض و راستی.",
                "یحیی درباره او شهادت داد و فریادکنان گفت: «این است آن کسی که درباره‌اش گفتم، آنکه پس از من می‌آید، بر من مقدم است، زیرا پیش از من وجود داشت.»",
                "از پری او، همه ما فیض بر روی فیض یافته‌ایم.",
                "زیرا شریعت به وسیله موسی داده شد؛ اما فیض و راستی به وسیله عیسی مسیح آمد.",
                "هیچ‌کس هرگز خدا را ندیده است، اما پسر یگانه که خود خداست و در آغوش پدر است، او را آشکار ساخته است."
            ]
        },
        "2": {
            en: [
               "On the third day a wedding took place at Cana in Galilee. Jesus’ mother was there,",
               "and Jesus and his disciples had also been invited to the wedding.",
               "When the wine was gone, Jesus’ mother said to him, “They have no more wine.”",
               "“Woman, why do you involve me?” Jesus replied. “My hour has not yet come.”",
               "His mother said to the servants, “Do whatever he tells you.”",
               "Nearby stood six stone water jars, the kind used by the Jews for ceremonial washing, each holding from twenty to thirty gallons.",
               "Jesus said to the servants, “Fill the jars with water”; so they filled them to the brim.",
               "Then he told them, “Now draw some out and take it to the master of the banquet.” They did so,",
               "and the master of the banquet tasted the water that had been turned into wine. He did not realize where it had come from, though the servants who had drawn the water knew. Then he called the bridegroom aside",
               "and said, “Everyone brings out the choice wine first and then the cheaper wine after the guests have had too much to drink; but you have saved the best till now.”",
               "What Jesus did here in Cana of Galilee was the first of the signs through which he revealed his glory; and his disciples believed in him."
            ],
            fa: [
                "در روز سوم، در قانای جلیل عروسی بود و مادر عیسی در آنجا حضور داشت.",
                "عیسی و شاگردانش نیز به عروسی دعوت شده بودند.",
                "وقتی شراب تمام شد، مادر عیسی به او گفت: «آنها دیگر شراب ندارند.»",
                "عیسی پاسخ داد: «ای زن، این به من و تو چه مربوط است؟ ساعت من هنوز فرا نرسیده است.»",
                "مادرش به خدمتکاران گفت: «هر چه به شما می‌گوید، انجام دهید.»",
                "در آنجا شش خمره سنگی برای تطهیر یهودیان قرار داشت که هر کدام گنجایش بیست تا سی گالن را داشت.",
                "عیسی به خدمتکاران گفت: «خمره‌ها را از آب پر کنید.» و آنها را تا لبه پر کردند.",
                "سپس به آنها گفت: «حالا مقداری از آن را بردارید و نزد رئیس مجلس ببرید.» آنها چنین کردند.",
                "و رئیس مجلس آبی را که به شراب تبدیل شده بود، چشید. او نمی‌دانست از کجا آمده است، هرچند خدمتکارانی که آب را کشیده بودند، می‌دانستند. آنگاه داماد را فرا خواند",
                "و گفت: «همه ابتدا شراب بهتر را می‌آورند و سپس وقتی مهمانان مست شدند، شراب ارزان‌تر را؛ اما تو شراب بهتر را تا به حال نگه داشته‌ای.»",
                "این اولین معجزه عیسی در قانای جلیل بود که از طریق آن جلال خود را آشکار ساخت و شاگردانش به او ایمان آوردند."
            ]
        },
        "3": {
            en: [
                "Now there was a Pharisee, a man named Nicodemus who was a member of the Jewish ruling council.",
                "He came to Jesus at night and said, “Rabbi, we know that you are a teacher who has come from God. For no one could perform the signs you are doing if God were not with him.”",
                "Jesus replied, “Very truly I tell you, no one can see the kingdom of God unless they are born again.”",
                "“How can someone be born when they are old?” Nicodemus asked. “Surely they cannot enter a second time into their mother’s womb to be born!”",
                "Jesus answered, “Very truly I tell you, no one can enter the kingdom of God unless they are born of water and the Spirit.",
                "Flesh gives birth to flesh, but the Spirit gives birth to spirit.",
                "You should not be surprised at my saying, ‘You must be born again.’",
                "The wind blows wherever it pleases. You hear its sound, but you cannot tell where it comes from or where it is going. So it is with everyone born of the Spirit.”",
                "“How can this be?” Nicodemus asked.",
                "“You are Israel’s teacher,” said Jesus, “and do you not understand these things?",
                "Very truly I tell you, we speak of what we know, and we testify to what we have seen, but still you people do not accept our testimony.",
                "I have spoken to you of earthly things and you do not believe; how then will you believe if I speak of heavenly things?",
                "No one has ever gone into heaven except the one who came from heaven—the Son of Man.",
                "Just as Moses lifted up the snake in the wilderness, so the Son of Man must be lifted up,",
                "that everyone who believes may have eternal life in him.”",
                "For God so loved the world that he gave his one and only Son, that whoever believes in him shall not perish but have eternal life.",
                "For God did not send his Son into the world to condemn the world, but to save the world through him.",
                "Whoever believes in him is not condemned, but whoever does not believe stands condemned already because they have not believed in the name of God’s one and only Son."
            ],
            fa: [
                "مردی از فریسیان به نام نیقودیموس بود که یکی از اعضای شورای یهود بود.",
                "او شبانه نزد عیسی آمد و گفت: «استاد، می‌دانیم که تو معلمی هستی که از جانب خدا آمده‌ای. زیرا هیچ‌کس نمی‌تواند این معجزاتی را که تو انجام می‌دهی، انجام دهد، مگر اینکه خدا با او باشد.»",
                "عیسی پاسخ داد: «به راستی، به راستی به تو می‌گویم، هیچ‌کس نمی‌تواند پادشاهی خدا را ببیند، مگر اینکه از نو زاده شود.»",
                "نیقودیموس پرسید: «چگونه ممکن است کسی که پیر است، زاده شود؟ آیا می‌تواند بار دیگر به شکم مادرش بازگردد و زاده شود؟»",
                "عیسی پاسخ داد: «به راستی، به راستی به تو می‌گویم، هیچ‌کس نمی‌تواند وارد پادشاهی خدا شود، مگر اینکه از آب و روح زاده شود.",
                "آنچه از جسم زاده شود، جسم است و آنچه از روح زاده شود، روح است.",
                "از اینکه به تو گفتم «باید از نو زاده شوید» تعجب مکن.",
                "باد هر جا که بخواهد می‌وزد. صدای آن را می‌شنوی، اما نمی‌دانی از کجا می‌آید یا به کجا می‌رود. هر کس که از روح زاده شود، چنین است.»",
                "نیقودیموس پرسید: «چگونه چنین چیزی ممکن است؟»",
                "عیسی گفت: «تو معلم اسرائیل هستی و این چیزها را نمی‌فهمی؟",
                "به راستی، به راستی به تو می‌گویم، ما از آنچه می‌دانیم سخن می‌گوییم و به آنچه دیده‌ایم شهادت می‌دهیم، اما شما شهادت ما را نمی‌پذیرید.",
                "من درباره امور زمینی با شما سخن گفتم و شما ایمان نمی‌آورید؛ پس چگونه ایمان خواهید آورد اگر درباره امور آسمانی سخن بگویم؟",
                "هیچ‌کس به آسمان صعود نکرده است، جز آنکه از آسمان نازل شد—یعنی پسر انسان.",
                "همان‌طور که موسی مار را در بیابان برافراشت، پسر انسان نیز باید برافراشته شود،",
                "تا هر که به او ایمان آورد، حیات جاودان داشته باشد.»",
                "زیرا خدا جهانیان را آن‌قدر محبت کرد که پسر یگانه خود را داد تا هر که به او ایمان آورد، هلاک نگردد، بلکه حیات جاودان یابد.",
                "زیرا خدا پسر خود را به جهان نفرستاد تا جهان را محکوم کند، بلکه تا جهان به وسیله او نجات یابد.",
                "هر که به او ایمان آورد، محکوم نمی‌شود، اما هر که ایمان نیاورد، از پیش محکوم شده است، زیرا به نام پسر یگانه خدا ایمان نیاورده است."
            ]
        }
    }
};