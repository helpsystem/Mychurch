BEGIN TRANSACTION;

CREATE TABLE IF NOT EXISTS chapters(
  id INTEGER PRIMARY KEY,
  book_id INTEGER NOT NULL,
  chapter_number INTEGER NOT NULL,
  audio_local TEXT,
  audio_online_fa TEXT,
  audio_online_en TEXT
);
CREATE TABLE IF NOT EXISTS verses(
  id INTEGER PRIMARY KEY,
  chapter_id INTEGER NOT NULL,
  verse_number INTEGER NOT NULL,
  text_fa TEXT,
  text_en TEXT
);

id INTEGER PRIMARY KEY,
book_id INTEGER NOT NULL,
chapter_number INTEGER NOT NULL,
audio_local TEXT,
audio_online_fa TEXT,
audio_online_en TEXT
);
id INTEGER PRIMARY KEY,
chapter_id INTEGER NOT NULL,
verse_number INTEGER NOT NULL,
text_fa TEXT,
text_en TEXT
);
INSERT INTO chapters VALUES (1001,1,1,NULL,'http://audio1.wordfree.net/bibles/app/audio/20/1/1.mp3','http://audio1.wordfree.net/bibles/app/audio/20/1/1.mp3');
INSERT INTO verses VALUES (100100001,1001,1,'span class="verse" id="1">1 </span در ابتدا، خدا آسمانها و زمین‌ را آفرید.','span class="verse" id="1">1 </span In the beginning God created the heaven and the earth.');
INSERT INTO verses VALUES (100100002,1001,2,'وزمین‌ تهی‌ و بایر بود و تاریكی‌ بر روی‌ لجه‌ و روح‌ خدا سطح‌ آبها را فرو گرفت‌.','And the earth was without form, and void; and darkness was upon the face of the deep. And the Spirit of God moved upon the face of the waters.');
INSERT INTO verses VALUES (100100003,1001,3,'و خدا گفت‌: «روشنایی‌ بشود.» و روشنایی‌ شد.','And God said, Let there be light: and there was light.');
INSERT INTO verses VALUES (100100004,1001,4,'و خدا روشنایی‌ را دید كه‌ نیكوست‌ و خدا روشنایی‌ را از تاریكی‌ جدا ساخت‌.','And God saw the light, that it was good: and God divided the light from the darkness.');
INSERT INTO verses VALUES (100100005,1001,5,'و خدا روشنایی‌ را روز نامید و تاریكی‌ را شب‌ نامید. و شام‌ بود و صبح‌ بود، روزی‌ اول‌.','And God called the light Day, and the darkness he called Night. And the evening and the morning were the first day.');
INSERT INTO verses VALUES (100100006,1001,6,'و خدا گفت‌: «فلكی‌ باشد در میان‌ آبها و آبها را از آبها جدا كند.»','And God said, Let there be a firmament in the midst of the waters, and let it divide the waters from the waters.');
INSERT INTO verses VALUES (100100007,1001,7,'و خدا فلك‌ را بساخت‌ و آبهای‌ زیر فلك‌ را از آبهای‌ بالای‌ فلك‌ جدا كرد. و چنین‌ شد.','And God made the firmament, and divided the waters which were under the firmament from the waters which were above the firmament: and it was so.');
INSERT INTO verses VALUES (100100008,1001,8,'و خدا فلك‌ را آسمان‌ نامید. و شام‌ بود و صبح‌ بود، روزی‌ دوم‌.','And God called the firmament Heaven. And the evening and the morning were the second day.');
INSERT INTO verses VALUES (100100009,1001,9,'و خدا گفت‌: «آبهای‌ زیر آسمان‌ در یكجا جمع‌ شود و خشكی‌ ظاهر گردد.» و چنین‌ شد.','And God said, Let the waters under the heaven be gathered together unto one place, and let the dry land appear: and it was so.');
INSERT INTO verses VALUES (100100010,1001,10,'و خدا خشكی‌ را زمین‌ نامید و اجتماع‌ آبها را دریا نامید. و خدا دید كه‌ نیكوست‌.','And God called the dry land Earth; and the gathering together of the waters called he Seas: and God saw that it was good.');
INSERT INTO verses VALUES (100100011,1001,11,'و خدا گفت‌: «زمین‌ نباتات‌ برویاند، علفی‌ كه‌ تخم‌ بیاورد و درخت‌ میوه‌ای‌ كه‌ موافق‌ جنس‌ خود میوه‌ آورد كه‌ تخمش‌ در آن‌ باشد، بر روی‌ زمین‌.» و چنین‌ شد.','And God said, Let the earth bring forth grass, the herb yielding seed, and the fruit tree yielding fruit after his kind, whose seed is in itself, upon the earth: and it was so.');
INSERT INTO verses VALUES (100100012,1001,12,'و زمین‌ نباتات‌ را رویانید، علفی‌ كه‌ موافق‌ جنس‌ خود تخم‌ آورد و درخت‌ میوه‌داری‌ كه‌ تخمش‌ در آن‌، موافق‌ جنس‌ خود باشد. و خدا دید كه‌ نیكوست‌.','And the earth brought forth grass, and herb yielding seed after his kind, and the tree yielding fruit, whose seed was in itself, after his kind: and God saw that it was good.');
INSERT INTO verses VALUES (100100013,1001,13,'و شام‌ بود و صبح‌ بود، روزی‌ سوم‌.','And the evening and the morning were the third day.');
INSERT INTO verses VALUES (100100014,1001,14,'و خدا گفت‌: «نیرها در فلك‌ آسمان‌ باشند تا روز را از شب‌ جدا كنند و برای‌ آیات‌ و زمانها و روزها و سالها باشند.','And God said, Let there be lights in the firmament of the heaven to divide the day from the night; and let them be for signs, and for seasons, and for days, and years:');
INSERT INTO verses VALUES (100100015,1001,15,'و نیرها در فلك‌ آسمان‌ باشند تا بر زمین‌ روشنایی‌ دهند.» و چنین‌ شد.','And let them be for lights in the firmament of the heaven to give light upon the earth: and it was so.');
INSERT INTO verses VALUES (100100016,1001,16,'و خدا دو نیر بزرگ‌ ساخت‌، نیر اعظم‌ را برای‌ سلطنت‌ روز و نیر اصغر را برای‌ سلطنت‌ شب‌، و ستارگان‌ را.','And God made two great lights; the greater light to rule the day, and the lesser light to rule the night: he made the stars also.');
INSERT INTO verses VALUES (100100017,1001,17,'و خدا آنها را در فلك‌ آسمان‌ گذاشت‌ تا بر زمین‌ روشنایی‌ دهند،','And God set them in the firmament of the heaven to give light upon the earth,');
INSERT INTO verses VALUES (100100018,1001,18,'و تا سلطنت‌ نمایند بر روز و بر شب‌، و روشنایی‌ را از تاریكی‌ جدا كنند. و خدا دید كه‌ نیكوست‌.','And to rule over the day and over the night, and to divide the light from the darkness: and God saw that it was good.');
INSERT INTO verses VALUES (100100019,1001,19,'و شام‌ بود و صبح‌ بود، روزی‌ چهارم‌.','And the evening and the morning were the fourth day.');
INSERT INTO verses VALUES (100100020,1001,20,'و خدا گفت‌: «آبها به‌ انبوه‌ جانوران‌ پر شود و پرندگان‌ بالای‌ زمین‌ بر روی‌ فلك‌ آسمان‌ پرواز كنند.»','And God said, Let the waters bring forth abundantly the moving creature that hath life, and fowl that may fly above the earth in the open firmament of heaven.');
INSERT INTO verses VALUES (100100021,1001,21,'پس‌ خدا نهنگان‌ بزرگ‌ آفرید و همۀ جانداران‌ خزنده‌ را، كه‌ آبها از آنها موافق‌ اجناس‌ آنها پر شد، و همۀ پرندگان‌ بالدار را به‌ اجناس‌ آنها. و خدا دید كه‌ نیكوست‌.','And God created great whales, and every living creature that moveth, which the waters brought forth abundantly, after their kind, and every winged fowl after his kind: and God saw that it was good.');
INSERT INTO verses VALUES (100100022,1001,22,'و خدا آنها را بركت‌ داده‌، گفت‌: «بارور و كثیر شوید و آبهای‌ دریا را پر سازید، و پرندگان‌ در زمین‌ كثیر بشوند.»','And God blessed them, saying, Be fruitful, and multiply, and fill the waters in the seas, and let fowl multiply in the earth.');
INSERT INTO verses VALUES (100100023,1001,23,'و شام‌ بود و صبح‌ بود، روزی‌ پنجم‌.','And the evening and the morning were the fifth day.');
INSERT INTO verses VALUES (100100024,1001,24,'و خدا گفت‌: «زمین‌، جانوران‌ را موافق‌ اجناس‌ آنها بیرون‌ آورد، بهایم‌ و حشرات‌ و حیوانات‌ زمین‌ به‌ اجناس‌ آنها.» و چنین‌ شد.','And God said, Let the earth bring forth the living creature after his kind, cattle, and creeping thing, and beast of the earth after his kind: and it was so.');
INSERT INTO verses VALUES (100100025,1001,25,'پس‌ خدا حیوانات‌ زمین‌ را به‌ اجناس‌ آنها بساخت‌ و بهایم‌ را به‌ اجناس‌ آنها و همۀ حشرات‌ زمین‌ را به‌ اجناس‌ آنها. و خدا دید كه‌ نیكوست‌.','And God made the beast of the earth after his kind, and cattle after their kind, and every thing that creepeth upon the earth after his kind: and God saw that it was good.');
INSERT INTO verses VALUES (100100026,1001,26,'و خدا گفت‌»: آدم‌ را بصورت‌ ما و موافق‌ شبیه‌ ما بسازیم‌ تا بر ماهیان‌ دریا و پرندگان‌ آسمان‌ و بهایم‌ و بر تمامی‌ زمین‌ و همۀ حشراتی‌ كه‌ بر زمین‌ می‌خزند، حكومت‌ نماید. «','And God said, Let us make man in our image, after our likeness: and let them have dominion over the fish of the sea, and over the fowl of the air, and over the cattle, and over all the earth, and over every creeping thing that creepeth upon the earth.');
INSERT INTO verses VALUES (100100027,1001,27,'پس‌ خدا آدم‌ را بصورت‌ خود آفرید. او را بصورت‌ خدا آفرید. ایشان‌ را نر و ماده‌ آفرید.','So God created man in his own image, in the image of God created he him; male and female created he them.');
INSERT INTO verses VALUES (100100028,1001,28,'و خدا ایشان‌ را بركت‌ داد و خدا بدیشان‌ گفت‌: «بارور و كثیر شوید و زمین‌ را پر سازید و در آن‌ تسلط‌ نمایید، و بر ماهیان‌ دریا و پرندگان‌ آسمان‌ و همۀ حیواناتی‌ كه‌ بر زمین‌ می‌خزند، حكومت‌ كنید.»','And God blessed them, and God said unto them, Be fruitful, and multiply, and replenish the earth, and subdue it: and have dominion over the fish of the sea, and over the fowl of the air, and over every living thing that moveth upon the earth.');
INSERT INTO verses VALUES (100100029,1001,29,'و خدا گفت‌: «همانا همۀ علف‌های‌ تخم‌داری‌ كه‌ بر روی‌ تمام‌ زمین‌ است‌ و همۀ درختهایی‌ كه‌ در آنها میوۀ درخت‌ تخم‌دار است‌، به‌ شما دادم‌ تا برای‌ شما خوراك‌ باشد.','And God said, Behold, I have given you every herb bearing seed, which is upon the face of all the earth, and every tree, in the which is the fruit of a tree yielding seed; to you it shall be for meat.');
INSERT INTO verses VALUES (100100030,1001,30,'و به‌ همۀ حیوانـات‌ زمیـن‌ و به‌ همۀ پرندگان‌ آسمان‌ و به‌ همۀ حشرات‌ زمین‌ كه‌ در آنهـا حیـات‌ است‌، هر علف‌ سبز را برای‌ خوراك‌ دادم‌.» و چنیـن‌ شـد.','And to every beast of the earth, and to every fowl of the air, and to every thing that creepeth upon the earth, wherein there is life, I have given every green herb for meat: and it was so.');
INSERT INTO verses VALUES (100100031,1001,31,'و خدا هر چه‌ ساختـه‌ بـود، دیـد و همانـا بسیار نیكـو بود. و شام‌ بـود و صبح‌ بـود، روز ششـم‌.','And God saw every thing that he had made, and, behold, it was very good. And the evening and the morning were the sixth day.');
id INTEGER PRIMARY KEY,
book_id INTEGER NOT NULL,
chapter_number INTEGER NOT NULL,
audio_local TEXT,
audio_online_fa TEXT,
audio_online_en TEXT
);
id INTEGER PRIMARY KEY,
chapter_id INTEGER NOT NULL,
verse_number INTEGER NOT NULL,
text_fa TEXT,
text_en TEXT
);
INSERT INTO chapters VALUES (2001,2,1,NULL,'http://audio1.wordfree.net/bibles/app/audio/20/2/1.mp3','http://audio1.wordfree.net/bibles/app/audio/20/2/1.mp3');
INSERT INTO verses VALUES (200100001,2001,1,'span class="verse" id="1">1 </span و این‌ است‌ نامهای‌ پسران‌ اسرائیل‌ كه‌ به‌مصر آمدند، هر كس‌ با اهل‌ خانه‌اش‌ همراه‌ یعقوب‌ آمدند:','span class="verse" id="1">1 </span Now these are the names of the children of Israel , which came into Egypt ; every man and his household came with Jacob .');
INSERT INTO verses VALUES (200100002,2001,2,'رؤبین‌ و شمعون‌ و لاوی‌ و یهودا،','Reuben , Simeon , Levi , and Judah ,');
INSERT INTO verses VALUES (200100003,2001,3,'یساكار و زبولون‌ و بنیامین‌،','Issachar , Zebulun , and Benjamin ,');
INSERT INTO verses VALUES (200100004,2001,4,'و دان‌ و نفتالی‌، و جاد و اشیر.','Dan , and Naphtali , Gad , and Asher .');
INSERT INTO verses VALUES (200100005,2001,5,'و همۀ نفوسی‌ كه‌ از صُلب‌ یعقوب‌ پدید آمدند هفتاد نفر بودند. و یوسف‌ در مصر بود.','And all the souls that came out of the loins of Jacob were seventy souls: for Joseph was in Egypt already.');
INSERT INTO verses VALUES (200100006,2001,6,'و یوسف‌ و همۀ برادرانش‌، و تمامی‌ آن‌ طبقه‌ مردند.','And Joseph died, and all his brethren, and all that generation.');
INSERT INTO verses VALUES (200100007,2001,7,'و بنی‌اسرائیل‌ بارور و منتشر شدند، و كثیر و بی‌نهایت‌ زورآور گردیدند و زمین‌ از ایشان‌ پر گشت‌.','And the children of Israel were fruitful, and increased abundantly, and multiplied, and waxed exceeding mighty; and the land was filled with them.');
INSERT INTO verses VALUES (200100008,2001,8,'اما پادشاهی‌ دیگر بر مصر برخاست‌ كه‌ یوسف‌ را نشناخت‌،','Now there arose up a new king over Egypt , which knew not Joseph .');
INSERT INTO verses VALUES (200100009,2001,9,'و به‌ قوم‌ خود گفت‌: «همانا قوم‌ بنی‌اسرائیل‌ از ما زیاده‌ و زورآورترند.','And he said unto his people, Behold, the people of the children of Israel are more and mightier than we:');
INSERT INTO verses VALUES (200100010,2001,10,'بیایید با ایشان‌ به‌ حكمت‌ رفتار كنیم‌، مبادا كه‌ زیاد شوند. و واقع‌ شود كه‌ چون‌ جنگ‌ پدید آید، ایشان‌ نیز با دشمنان‌ ما همداستان‌ شوند، و با ما جنگ‌ كرده‌، از زمین‌ بیرون‌ روند.»','Come on, let us deal wisely with them; lest they multiply, and it come to pass, that, when there falleth out any war, they join also unto our enemies, and fight against us, and so get them up out of the land.');
INSERT INTO verses VALUES (200100011,2001,11,'پس‌ سركاران‌ بر ایشان‌ گماشتند، تا ایشان‌ را به‌ كارهای‌ دشوار ذلیل‌ سازند، و برای‌ فرعون‌ شهرهای‌ خزینه‌، یعنی‌ فیتوم‌ و رَعمسیس‌ را بنا كردند.','Therefore they did set over them taskmasters to afflict them with their burdens. And they built for Pharaoh treasure cities, Pithom and Raamses .');
INSERT INTO verses VALUES (200100012,2001,12,'لیكن‌ چندانكه‌ بیشتر ایشان‌ را ذلیل‌ ساختند، زیادتر متزاید و منتشر گردیدند، و از بنی‌اسرائیل‌ احتراز می‌نمودند.','But the more they afflicted them, the more they multiplied and grew. And they were grieved because of the children of Israel .');
INSERT INTO verses VALUES (200100013,2001,13,'و مصریان‌ از بنی‌اسرائیل‌ به‌ ظلم‌ خدمت‌ گرفتند.','And the Egyptians made the children of Israel to serve with rigour:');
INSERT INTO verses VALUES (200100014,2001,14,'و جانهای‌ ایشان‌ را به‌ بندگی سخت‌، به‌ گل‌كاری‌ وخشت‌سازی‌ و هر گونه‌ عمل‌ صحرایی‌، تلخ‌ ساختندی‌. و هر خدمتی‌ كه‌ بر ایشان‌ نهادندی‌ به‌ ظلم‌ می‌بود.','And they made their lives bitter with hard bondage, in morter, and in brick, and in all manner of service in the field: all their service, wherein they made them serve, was with rigour.');
INSERT INTO verses VALUES (200100015,2001,15,'و پادشاه‌ مصر به‌ قابله‌های‌ عبرانی‌ كه‌ یكی‌ را شِفرَه‌ و دیگری‌ را فُوعَه‌ نام‌ بود، امر كرده‌،','And the king of Egypt spake to the Hebrew midwives, of which the name of the one was Shiphrah , and the name of the other Puah :');
INSERT INTO verses VALUES (200100016,2001,16,'گفت‌: «چون‌ قابله‌گری‌ برای‌ زنان‌ عبرانی‌ بكنید، و بر سنگها نگاه‌ كنید. اگر پسر باشد او را بكُشید، و اگر دختر بود زنده‌ بماند.»','And he said, When ye do the office of a midwife to the Hebrew women, and see them upon the stools; if it be a son, then ye shall kill him: but if it be a daughter, then she shall live.');
INSERT INTO verses VALUES (200100017,2001,17,'لكن‌ قابله‌ها از خدا ترسیدند، و آنچه‌ پادشاه‌ مصر بدیشان‌ فرموده‌ بود نكردند، بلكه‌ پسران‌ را زنده‌ گذاردند.','But the midwives feared God, and did not as the king of Egypt commanded them, but saved the men children alive.');
INSERT INTO verses VALUES (200100018,2001,18,'پس‌ پادشاه‌ مصر قابله‌ها را طلبیده‌، بدیشان‌ گفت‌: «چرا این‌ كار را كردید، و پسران‌ را زنده‌ گذاردید؟»','And the king of Egypt called for the midwives, and said unto them, Why have ye done this thing, and have saved the men children alive?');
INSERT INTO verses VALUES (200100019,2001,19,'قابله‌ها به‌ فرعون‌ گفتند: «از این‌ سبب‌ كه‌ زنان‌ عبرانی‌ چون‌ زنان‌ مصری‌ نیستند، بلكه‌ زورآورند، و قبل‌ از رسیدن‌ قابله‌ می‌زایند.»','And the midwives said unto Pharaoh, Because the Hebrew women are not as the Egyptian women; for they are lively, and are delivered ere the midwives come in unto them.');
INSERT INTO verses VALUES (200100020,2001,20,'و خدا با قابله‌ها احسان‌ نمود، و قوم‌ كثیر شدند، و بسیار توانا گردیدند.','Therefore God dealt well with the midwives: and the people multiplied, and waxed very mighty.');
INSERT INTO verses VALUES (200100021,2001,21,'و واقع‌ شد چونكه‌ قابله‌ها از خدا ترسیدند، خانه‌ها برای‌ ایشان‌ بساخت‌.','And it came to pass, because the midwives feared God, that he made them houses.');
INSERT INTO verses VALUES (200100022,2001,22,'و فرعون‌ قوم‌ خود را امر كرده‌، گفت‌: «هر پسری‌ كه‌ زاییده‌ شود به‌ نهر اندازید، و هر دختری‌ را زنده‌ نگاه‌ دارید.»','And Pharaoh charged all his people, saying, Every son that is born ye shall cast into the river, and every daughter ye shall save alive.');
id INTEGER PRIMARY KEY,
book_id INTEGER NOT NULL,
chapter_number INTEGER NOT NULL,
audio_local TEXT,
audio_online_fa TEXT,
audio_online_en TEXT
);
id INTEGER PRIMARY KEY,
chapter_id INTEGER NOT NULL,
verse_number INTEGER NOT NULL,
text_fa TEXT,
text_en TEXT
);
INSERT INTO chapters VALUES (3001,3,1,NULL,'http://audio1.wordfree.net/bibles/app/audio/20/3/1.mp3','http://audio1.wordfree.net/bibles/app/audio/20/3/1.mp3');
INSERT INTO verses VALUES (300100001,3001,1,'span class="verse" id="1">1 </span و خداوند موسی‌ را خواند، و او را از خیمۀ اجتماع‌ خطاب‌ كرده‌، گفت‌:','span class="verse" id="1">1 </span And the LORD called unto Moses , and spake unto him out of the tabernacle of the congregation, saying,');
INSERT INTO verses VALUES (300100002,3001,2,'«بنی‌اسرائیل‌ را خطاب‌ كرده‌، به‌ ایشان‌ بگو: هرگاه‌ كسی‌ از شما قربانی‌ نزد خداوند بگذراند، پس‌ قربانی‌ خود را از بهایم‌ یعنی‌ از گاو یا از گوسفند بگذرانید.','Speak unto the children of Israel , and say unto them, If any man of you bring an offering unto the LORD, ye shall bring your offering of the cattle, even of the herd, and of the flock.');
INSERT INTO verses VALUES (300100003,3001,3,'اگر قربانی‌ او قربانی‌ سوختنی‌ از گاو باشد، آن‌ را نر بی‌عیب‌ بگذارند، و آن‌ را نزد در خیمۀ اجتماع‌ بیاورد تا به‌ حضور خداوند مقبول‌ شود.','If his offering be a burnt sacrifice of the herd, let him offer a male without blemish: he shall offer it of his own voluntary will at the door of the tabernacle of the congregation before the LORD.');
INSERT INTO verses VALUES (300100004,3001,4,'و دست‌ خود را بر سر قربانی‌ سوختنی‌ بگذارد، و برایش‌ مقبول‌ خواهد شد تا بجهت‌ او كفاره‌ كند.','And he shall put his hand upon the head of the burnt offering; and it shall be accepted for him to make atonement for him.');
INSERT INTO verses VALUES (300100005,3001,5,'پس‌ گاو را به‌ حضور خداوند ذبح‌ نماید، و پسران‌ هارون‌ كَهَنه‌ خون‌ را نزدیك‌ بیاورند، و خون‌ را بر اطراف‌ مذبح‌ كه‌ نزد در خیمۀ اجتماع‌ است‌ بپاشند.','And he shall kill the bullock before the LORD: and the priests, Aaron ''s sons, shall bring the blood, and sprinkle the blood round about upon the altar that is by the door of the tabernacle of the congregation.');
INSERT INTO verses VALUES (300100006,3001,6,'و پوست‌ قربانی‌ سوختنی‌ را بكَنَد و آن‌ را قطعه‌قطعه‌ كند.','And he shall flay the burnt offering, and cut it into his pieces.');
INSERT INTO verses VALUES (300100007,3001,7,'و پسران‌ هارونِ كاهن‌ آتش‌ بر مذبح‌ بگذارند، و هیزم‌ بر آتش‌ بچینند.','And the sons of Aaron the priest shall put fire upon the altar, and lay the wood in order upon the fire:');
INSERT INTO verses VALUES (300100008,3001,8,'و پسران‌ هارونِ كَهَنه‌ قطعه‌ها و سر و پیه‌ را بر هیزمی‌ كه‌ بر آتش‌ روی‌ مذبح‌ است‌ بچینند.','And the priests, Aaron ''s sons, shall lay the parts, the head, and the fat, in order upon the wood that is on the fire which is upon the altar:');
INSERT INTO verses VALUES (300100009,3001,9,'و احشایش‌ و پاچه‌هایش‌ را به‌ آب‌ بشویند، و كاهن‌ همه‌ را بر مذبح‌ بسوزاند، برای‌ قربانی‌ سوختنی‌ و هدیۀ آتشین‌ و عطر خوشبو بجهت‌ خداوند .','But his inwards and his legs shall he wash in water: and the priest shall burn all on the altar, to be a burnt sacrifice, an offering made by fire, of a sweet savour unto the LORD.');
INSERT INTO verses VALUES (300100010,3001,10,'و اگر قربانی‌ او از گله‌ باشد خواه‌ از گوسفند خواه‌ از بز بجهت‌ قربانی‌ سوختنی‌، آن‌ را نر بی‌عیب‌ بگذراند.','And if his offering be of the flocks, namely, of the sheep, or of the goats, for a burnt sacrifice; he shall bring it a male without blemish.');
INSERT INTO verses VALUES (300100011,3001,11,'و آن‌ را به‌ طرف‌ شمالی‌ مذبح‌ به‌ حضور خداوند ذبح‌ نماید، و پسران‌ هارون‌ كهنه‌ خونش‌ را به‌ اطراف‌ مذبح‌ بپاشند.','And he shall kill it on the side of the altar northward before the LORD: and the priests, Aaron ''s sons, shall sprinkle his blood round about upon the altar.');
INSERT INTO verses VALUES (300100012,3001,12,'و آن‌ را با سرش‌ و پیه‌اش‌ قطعه‌قطعه‌ كند، و كاهن‌ آنها را بر هیزمی‌ كه‌ بر آتش‌ روی‌ مذبح‌ است‌ بچیند.','And he shall cut it into his pieces, with his head and his fat: and the priest shall lay them in order on the wood that is on the fire which is upon the altar:');
INSERT INTO verses VALUES (300100013,3001,13,'و احشایش‌ و پاچه‌هایش‌ را به‌ آب‌ بشوید، و كاهن‌ همه‌ را نزدیك‌ بیاورد و بر مذبح‌ بسوزاند، كه‌ آن‌ قربانی‌ سوختنی‌ و هدیۀ آتشین‌ و عطر خوشبو بجهت‌ خداوند است‌.','But he shall wash the inwards and the legs with water: and the priest shall bring it all, and burn it upon the altar: it is a burnt sacrifice, an offering made by fire, of a sweet savour unto the LORD.');
INSERT INTO verses VALUES (300100014,3001,14,'« و اگر قربانی‌ او بجهت‌ خداوند قربانی‌ سوختنی‌ از مرغان‌ باشد، پس‌ قربانی‌ خود را از فاخته‌ها یا از جوجه‌های‌ كبوتر بگذراند.','And if the burnt sacrifice for his offering to the LORD be of fowls, then he shall bring his offering of turtledoves, or of young pigeons.');
INSERT INTO verses VALUES (300100015,3001,15,'و كاهن‌ آن‌ را نزد مذبح‌ بیاورد و سرش‌ را بپیچد و بر مذبح‌ بسوزاند، و خونش‌ بر پهلوی‌ مذبح‌ افشرده‌ شود.','And the priest shall bring it unto the altar, and wring off his head, and burn it on the altar; and the blood thereof shall be wrung out at the side of the altar:');
INSERT INTO verses VALUES (300100016,3001,16,'و چینه‌دانش‌ را با فضلات‌ آن‌ بیرون‌ كرده‌، آن‌ را بر جانب‌ شرقی‌ مذبح‌ در جای‌ خاكستر بیندازد.','And he shall pluck away his crop with his feathers, and cast it beside the altar on the east part, by the place of the ashes:');
INSERT INTO verses VALUES (300100017,3001,17,'و آن‌ را از میان‌ بالهایش‌ چاك‌ كند و از هم‌ جدا نكند، و كاهن‌ آن‌ را بر مذبح‌ بر هیزمی‌ كه‌ بر آتش‌ است‌ بسوزاند، كه‌ آن‌ قربانی‌ سوختنی‌ و هدیۀ آتشین‌ و عطر خوشبو بجهت‌ خداوند است‌.','And he shall cleave it with the wings thereof, but shall not divide it asunder: and the priest shall burn it upon the altar, upon the wood that is upon the fire: it is a burnt sacrifice, an offering made by fire, of a sweet savour unto the LORD.');
id INTEGER PRIMARY KEY,
book_id INTEGER NOT NULL,
chapter_number INTEGER NOT NULL,
audio_local TEXT,
audio_online_fa TEXT,
audio_online_en TEXT
);
id INTEGER PRIMARY KEY,
chapter_id INTEGER NOT NULL,
verse_number INTEGER NOT NULL,
text_fa TEXT,
text_en TEXT
);
INSERT INTO chapters VALUES (4001,4,1,NULL,'http://audio1.wordfree.net/bibles/app/audio/20/4/1.mp3','http://audio1.wordfree.net/bibles/app/audio/20/4/1.mp3');
INSERT INTO verses VALUES (400100001,4001,1,'span class="verse" id="1">1 </span و در روز اول‌ ماه‌ دوم‌ از سال‌ دوم‌ از بیرون آمدن‌ ایشان‌ از زمین‌ مصر، خداوند در بیابان‌ سینا در خیمۀ اجتماع‌ موسی‌ را خطاب‌ كرده‌، گفت‌:','span class="verse" id="1">1 </span And the LORD spake unto Moses in the wilderness of Sinai , in the tabernacle of the congregation, on the first day of the second month, in the second year after they were come out of the land of Egypt , saying,');
INSERT INTO verses VALUES (400100002,4001,2,'« حساب‌ تمامی‌ جماعت‌ بنی‌اسرائیل‌ را برحسب‌ قبایل‌ و خاندان‌ آبای‌ ایشان‌، به‌ شمارۀ اسم‌های‌ همۀ ذكوران‌ موافق‌ سرهای‌ ایشان‌ بگیرید.','Take ye the sum of all the congregation of the children of Israel , after their families, by the house of their fathers, with the number of their names, every male by their polls;');
INSERT INTO verses VALUES (400100003,4001,3,'از بیست‌ ساله‌ و زیاده‌، هر كه‌ از اسرائیل‌ به‌ جنگ‌ بیرون‌ می‌رود، تو و هارون‌ ایشان‌ را برحسب‌ افواج‌ ایشان‌ بشمارید.','From twenty years old and upward, all that are able to go forth to war in Israel : thou and Aaron shall number them by their armies.');
INSERT INTO verses VALUES (400100004,4001,4,'و همراه‌ شما یك‌ نفر از هر سبط‌ باشد كه‌ هر یك‌ رئیس‌ خاندان‌ آبایش‌ باشد.','And with you there shall be a man of every tribe; every one head of the house of his fathers.');
INSERT INTO verses VALUES (400100005,4001,5,'و اسم‌های‌ كسانی‌ كه‌ با شما باید بایستند، این‌ است‌: از رؤبین‌، الیصوربن‌ شَدَیئور.','And these are the names of the men that shall stand with you: of the tribe of Reuben ; Elizur the son of Shedeur.');
INSERT INTO verses VALUES (400100006,4001,6,'و از شمعون‌، شِلومیئیل‌ بن‌ صوریشَدّای‌.','Of Simeon ; Shelumiel the son of Zurishaddai.');
INSERT INTO verses VALUES (400100007,4001,7,'و از یهودا، نَحشون‌ بن‌ عمیناداب‌.','Of Judah ; Nahshon the son of Amminadab .');
INSERT INTO verses VALUES (400100008,4001,8,'و از یساكار، نَتَنائیل‌ بن‌ صوغَر.','Of Issachar ; Nethaneel the son of Zuar.');
INSERT INTO verses VALUES (400100009,4001,9,'و از زَبولون‌، اَلیاب‌ بن‌ حِیلون‌.','Of Zebulun ; Eliab the son of Helon.');
INSERT INTO verses VALUES (400100010,4001,10,'و از بنی‌ یوسف‌: از اَفرایم‌، اَلیشَمَع‌ بن‌ عَمّیهود. و از مَنَسّی‌، جَملیئیل‌ بن‌ فَدَهْصور.','Of the children of Joseph : of Ephraim ; Elishama the son of Ammihud: of Manasseh ; Gamaliel the son of Pedahzur.');
INSERT INTO verses VALUES (400100011,4001,11,'از بنیامین‌، اَبیدان‌ بن‌ جِدعونی‌.','Of Benjamin ; Abidan the son of Gideoni.');
INSERT INTO verses VALUES (400100012,4001,12,'و از دان‌، اَخیعَزَر بن‌ عَمّیشَدّای‌.','Of Dan ; Ahiezer the son of Ammishaddai.');
INSERT INTO verses VALUES (400100013,4001,13,'و از اشیر، فَجْعیئیل‌ بن‌ عُكْران‌.','Of Asher ; Pagiel the son of Ocran.');
INSERT INTO verses VALUES (400100014,4001,14,'و از جاد، اَلیاساف‌ بن‌ دَعوئیل‌.','Of Gad ; Eliasaph the son of Deuel.');
INSERT INTO verses VALUES (400100015,4001,15,'و از نَفتالی‌، اَخیرَع‌ بن‌ عینان‌.»','Of Naphtali ; Ahira the son of Enan.');
INSERT INTO verses VALUES (400100016,4001,16,'اینانند دعوت‌ شدگان‌ جماعت‌ و سروران‌ اسباط آبای‌ ایشان‌، و رؤسای‌ هزاره‌های‌ اسرائیل‌.','These were the renowned of the congregation, princes of the tribes of their fathers, heads of thousands in Israel .');
INSERT INTO verses VALUES (400100017,4001,17,'و موسی‌ و هارون‌ این‌ كسان‌ را كه‌ به‌ نام‌، معین‌ شدند، گرفتند.','And Moses and Aaron took these men which are expressed by their names:');
INSERT INTO verses VALUES (400100018,4001,18,'و در روز اول‌ ماه‌ دوم‌، تمامی‌ جماعت‌ را جمع‌ كرده‌، نسب‌ نامه‌های‌ ایشان‌ را برحسب‌ قبایل‌ و خاندان‌ آبای‌ ایشان‌، به‌ شمارۀ اسم‌ها از بیست‌ ساله‌ و بالاتر موافق‌ سرهای‌ ایشان‌ خواندند.','And they assembled all the congregation together on the first day of the second month, and they declared their pedigrees after their families, by the house of their fathers, according to the number of the names, from twenty years old and upward, by their polls.');
INSERT INTO verses VALUES (400100019,4001,19,'چنانكه‌ خداوند موسی‌ را امر فرموده‌ بود، ایشان‌ را در بیابان‌ سینا بشمرد.','As the LORD commanded Moses , so he numbered them in the wilderness of Sinai .');
INSERT INTO verses VALUES (400100020,4001,20,'و اما انساب‌ بنی‌رؤبین‌ نخست‌زادۀ اسرائیل‌، برحسب‌ قبایل‌ و خاندان‌ آبای‌ ایشان‌، موافق‌ نامها و سرهای‌ ایشان‌ این‌ بود: هر ذكور از بیست‌ ساله‌ و بالاتر، جمیع‌ كسانی‌ كه‌ برای‌ جنگ‌ بیرون‌ می‌رفتند.','And the children of Reuben , Israel ''s eldest son, by their generations, after their families, by the house of their fathers, according to the number of the names, by their polls, every male from twenty years old and upward, all that were able to go forth to war;');
INSERT INTO verses VALUES (400100021,4001,21,'شمرده‌شدگان‌ ایشان‌ از سبط‌ رؤبین‌، چهل‌ و شش‌ هزار و پانصد نفر بودند.','Those that were numbered of them, even of the tribe of Reuben , were forty and six thousand and five hundred.');
INSERT INTO verses VALUES (400100022,4001,22,'و انساب‌ بنی‌شمعون‌ برحسب‌ قبایل‌ و خاندان‌ آبای‌ ایشان‌، كسانی‌ كه‌ از ایشان‌ شمرده‌ شدند، موافق‌ شمارۀ اسم‌ها و سرهای‌ ایشان‌ این‌ بود: هر ذكور از بیست‌ ساله‌ و بالاتر، هر كه‌ برای‌ جنگ‌ بیرون‌ می‌رفت‌.','Of the children of Simeon , by their generations, after their families, by the house of their fathers, those that were numbered of them, according to the number of the names, by their polls, every male from twenty years old and upward, all that were able to go forth to war;');
INSERT INTO verses VALUES (400100023,4001,23,'شمرده‌شدگان‌ ایشان‌ از سبط‌ شمعون‌، پنجاه‌ و نه‌ هزار و سیصد نفر بودند.','Those that were numbered of them, even of the tribe of Simeon , were fifty and nine thousand and three hundred.');
INSERT INTO verses VALUES (400100024,4001,24,'و انساب‌ بنی‌جاد برحسب‌ قبایل‌ و خاندان‌ آبای‌ ایشان‌، موافق‌ شمارۀ اسم‌ها، از بیست‌ ساله‌ و بالاتر، هر كه‌ برای‌ جنگ‌ بیرون‌ می‌رفت‌.','Of the children of Gad , by their generations, after their families, by the house of their fathers, according to the number of the names, from twenty years old and upward, all that were able to go forth to war;');
INSERT INTO verses VALUES (400100025,4001,25,'شمرده‌شدگان‌ ایشان‌ از سبط‌ جاد، چهل‌ و پنج‌ هزار و ششصد و پنجاه‌ نفر بودند.','Those that were numbered of them, even of the tribe of Gad , were forty and five thousand six hundred and fifty.');
INSERT INTO verses VALUES (400100026,4001,26,'و انساب‌ بنی‌یهودا برحسب‌ قبایل‌ و خاندان‌ آبای‌ ایشان‌، موافق‌ شمارۀ اسم‌ها از بیست‌ ساله‌ و بالاتر، هر كه‌ برای‌ جنگ‌ بیرون‌ می‌رفت‌.','Of the children of Judah , by their generations, after their families, by the house of their fathers, according to the number of the names, from twenty years old and upward, all that were able to go forth to war;');
INSERT INTO verses VALUES (400100027,4001,27,'شمرده‌شدگان‌ ایشان‌ از سبط‌ یهودا،هفتاد و چهار هزار و شش‌ صد نفر بودند.','Those that were numbered of them, even of the tribe of Judah , were threescore and fourteen thousand and six hundred.');
INSERT INTO verses VALUES (400100028,4001,28,'و انساب‌ بنی‌یسّاكار برحسب‌ قبایل‌ و خاندان‌ آبای‌ ایشان‌، موافق‌ شمارۀ اسم‌ها از بیست‌ ساله‌ و بالاتر، هر كه‌ برای‌ جنگ‌ بیرون‌ می‌رفت‌.','Of the children of Issachar , by their generations, after their families, by the house of their fathers, according to the number of the names, from twenty years old and upward, all that were able to go forth to war;');
INSERT INTO verses VALUES (400100029,4001,29,'شمرده‌شدگان‌ ایشان‌ از سبط‌ یسّاكار، پنجاه‌ و چهار هزار و چهارصد نفر بودند.','Those that were numbered of them, even of the tribe of Issachar , were fifty and four thousand and four hundred.');
INSERT INTO verses VALUES (400100030,4001,30,'و انساب‌ بنی‌زبولون‌ برحسب‌ قبایل‌ و خاندان‌ آبای‌ ایشان‌، موافق‌ شمارۀ اسم‌ها از بیست‌ ساله‌ و بالاتر، هر كه‌ برای‌ جنگ‌ بیرون‌ می‌رفت‌.','Of the children of Zebulun , by their generations, after their families, by the house of their fathers, according to the number of the names, from twenty years old and upward, all that were able to go forth to war;');
INSERT INTO verses VALUES (400100031,4001,31,'شمرده‌شدگان‌ ایشان‌ از سبط‌ زبولون‌ پنجاه‌ و هفت‌ هزار و چهارصد نفر بودند.','Those that were numbered of them, even of the tribe of Zebulun , were fifty and seven thousand and four hundred.');
INSERT INTO verses VALUES (400100032,4001,32,'و انساب‌ بنی‌یوسف‌ از بنی‌اَفرایم‌ برحسب‌ قبایل‌ و خاندان‌ آبای‌ ایشان‌، موافق‌ شمارۀ اسم‌ها از بیست‌ ساله‌ و بالاتر، هر كه‌ برای‌ جنگ‌ بیرون‌ می‌رفت‌.','Of the children of Joseph , namely, of the children of Ephraim , by their generations, after their families, by the house of their fathers, according to the number of the names, from twenty years old and upward, all that were able to go forth to war;');
INSERT INTO verses VALUES (400100033,4001,33,'شمرده‌شدگان‌ ایشان‌ از سبط‌ اَفرایم‌، چهل‌ هزار و پانصد نفر بودند.','Those that were numbered of them, even of the tribe of Ephraim , were forty thousand and five hundred.');
INSERT INTO verses VALUES (400100034,4001,34,'و انساب‌ بنی‌مَنَسّی‌ برحسب‌ قبایل‌ و خاندان‌ آبای‌ ایشان‌، موافق‌ شمارۀ اسم‌ها، از بیست‌ ساله‌ و بالاتر، هر كه‌ برای‌ جنگ‌ بیرون‌ می‌رفت‌.','Of the children of Manasseh , by their generations, after their families, by the house of their fathers, according to the number of the names, from twenty years old and upward, all that were able to go forth to war;');
INSERT INTO verses VALUES (400100035,4001,35,'شمرده‌شدگان‌ ایشان‌ از سبط‌ منسی‌، سی‌ و دو هزار و دویست‌ نفر بودند.','Those that were numbered of them, even of the tribe of Manasseh , were thirty and two thousand and two hundred.');
INSERT INTO verses VALUES (400100036,4001,36,'و انساب‌ بنی‌بنیامین‌ برحسب‌ قبایل‌ و خاندان‌ آبای‌ ایشان‌، موافق‌ شمارۀ اسم‌ها، از بیست‌ ساله‌ و بالاتر، هر كه‌ برای‌ جنگ‌ بیرون‌ می‌رفت‌.','Of the children of Benjamin , by their generations, after their families, by the house of their fathers, according to the number of the names, from twenty years old and upward, all that were able to go forth to war;');
INSERT INTO verses VALUES (400100037,4001,37,'شمرده‌شدگان‌ ایشان‌ از سبط‌ بنیامین‌، سی‌ و پنج‌ هزار و چهارصد نفر بودند.','Those that were numbered of them, even of the tribe of Benjamin , were thirty and five thousand and four hundred.');
INSERT INTO verses VALUES (400100038,4001,38,'و انساب‌ بنی‌دان‌ برحسب‌ قبایل‌ و خاندان‌ آبای‌ ایشان‌، موافق‌ شمارۀ اسم‌ها از بیست‌ ساله‌ و بالاتر، هر كه‌ برای‌ جنگ‌ می‌رفت‌.','Of the children of Dan , by their generations, after their families, by the house of their fathers, according to the number of the names, from twenty years old and upward, all that were able to go forth to war;');
INSERT INTO verses VALUES (400100039,4001,39,'شمرده‌شدگان‌ ایشان‌ از سبط‌ دان‌، شصت‌ و دوهزار و هفتصد نفر بودند.','Those that were numbered of them, even of the tribe of Dan , were threescore and two thousand and seven hundred.');
INSERT INTO verses VALUES (400100040,4001,40,'و انساب‌ بنی‌اَشیر برحسب‌ قبایل‌ و خاندان‌ آبای‌ ایشان‌، موافق‌ شمارۀ اسم‌ها از بیست‌ ساله‌ و بالاتر، هر كه‌ برای‌ جنگ‌ بیرون‌ می‌رفت‌.','Of the children of Asher , by their generations, after their families, by the house of their fathers, according to the number of the names, from twenty years old and upward, all that were able to go forth to war;');
INSERT INTO verses VALUES (400100041,4001,41,'شمرده‌شدگان‌ ایشان‌ از سبط‌ اَشیر، چهل‌ و یك‌ هزار و پانصد نفر بودند.','Those that were numbered of them, even of the tribe of Asher , were forty and one thousand and five hundred.');
INSERT INTO verses VALUES (400100042,4001,42,'و انساب‌ بنی‌نَفْتالی‌ برحسب‌ قبایل‌ و خاندان‌ آبای‌ ایشان‌، موافق‌ شمارۀ اسم‌ها از بیست‌ ساله‌ و بالاتر، هر كه‌ برای‌ جنگ‌ بیرون‌ می‌رفت‌.','Of the children of Naphtali , throughout their generations, after their families, by the house of their fathers, according to the number of the names, from twenty years old and upward, all that were able to go forth to war;');
INSERT INTO verses VALUES (400100043,4001,43,'شمرده‌شدگان‌ ایشان‌ از سبط‌ نَفْتالی‌، پنجاه‌ و سه‌ هزار و پانصد نفر بودند.','Those that were numbered of them, even of the tribe of Naphtali , were fifty and three thousand and four hundred.');
INSERT INTO verses VALUES (400100044,4001,44,'اینانند شمرده‌شدگانی‌ كه‌ موسی‌ و هارون‌ با دوازده‌ نفر از سروران‌ اسرائیل‌، كه‌ یك‌ نفر برای‌ هر خاندان‌ آبای‌ ایشان‌ بود، شمردند.','These are those that were numbered, which Moses and Aaron numbered, and the princes of Israel , being twelve men: each one was for the house of his fathers.');
INSERT INTO verses VALUES (400100045,4001,45,'و تمامی‌ شمرده‌شدگان‌ بنی‌اسرائیل‌ برحسب‌ خاندان‌ آبای‌ ایشان‌، از بیست‌ ساله‌ و بالاتر، هر كس‌ از اسرائیل‌ كه‌ برای‌ جنگ‌ بیرون‌ می‌رفت‌.','So were all those that were numbered of the children of Israel , by the house of their fathers, from twenty years old and upward, all that were able to go forth to war in Israel ;');
INSERT INTO verses VALUES (400100046,4001,46,'همۀ شمرده‌شدگان‌، ششصد و سه‌ هزار و پانصد و پنجاه‌ نفر بودند.','Even all they that were numbered were six hundred thousand and three thousand and five hundred and fifty.');
INSERT INTO verses VALUES (400100047,4001,47,'اما لاویان‌ برحسب‌ سبط‌ آبای‌ ایشان‌ در میان‌ آنها شمرده‌ نشدند.','But the Levites after the tribe of their fathers were not numbered among them.');
INSERT INTO verses VALUES (400100048,4001,48,'زیرا خداوند موسی‌ را خطاب‌ كرده‌، گفت‌:','For the LORD had spoken unto Moses , saying,');
INSERT INTO verses VALUES (400100049,4001,49,'« اما سبط‌ لاوی‌ را مشمار و حساب‌ ایشان‌ را در میان‌ بنی‌اسرائیل‌ مگیر.','Only thou shalt not number the tribe of Levi , neither take the sum of them among the children of Israel :');
INSERT INTO verses VALUES (400100050,4001,50,'لیكن‌ لاویان‌ را بر مسكن‌ شهادت‌ و تمامی‌ اسبابش‌ و بر هرچه‌ علاقه‌ به‌ آن‌ دارد بگمار، و ایشان‌ مسكن‌ و تمامی‌ اسبابش‌ را بردارند، و ایشان‌ آن‌ را خدمت‌ نمایند و به‌ اطراف‌ مسكن‌ خیمه‌ زنند.','But thou shalt appoint the Levites over the tabernacle of testimony, and over all the vessels thereof, and over all things that belong to it: they shall bear the tabernacle, and all the vessels thereof; and they shall minister unto it, and shall encamp round about the tabernacle.');
INSERT INTO verses VALUES (400100051,4001,51,'و چون‌ مسكن‌ روانه‌ شود لاویان‌ آن‌ را پایین‌ بیاورند، و چون‌ مسكن‌ افراشته‌ شود لاویان‌ آن‌ را برپا نمایند، و غریبی‌ كه‌ نزدیك آن‌ آید، كشته‌ شود.','And when the tabernacle setteth forward, the Levites shall take it down: and when the tabernacle is to be pitched, the Levites shall set it up: and the stranger that cometh nigh shall be put to death.');
INSERT INTO verses VALUES (400100052,4001,52,'و بنی‌اسرائیل‌ هر كس‌ در محلۀ خود و هر كس‌ نزد عَلَم‌ خویش‌ برحسب‌ افواج‌ خود، خیمه‌ زنند.','And the children of Israel shall pitch their tents, every man by his own camp, and every man by his own standard, throughout their hosts.');
INSERT INTO verses VALUES (400100053,4001,53,'و لاویان‌ به‌ اطراف‌ مسكن‌ شهادت‌ خیمه‌ زنند، مبادا غضب‌ بر جماعت‌ بنی‌اسرائیل‌ بشود، و لاویان‌ شعائر مسكن‌ شهادت‌ را نگاه‌ دارند.»','But the Levites shall pitch round about the tabernacle of testimony, that there be no wrath upon the congregation of the children of Israel : and the Levites shall keep the charge of the tabernacle of testimony.');
INSERT INTO verses VALUES (400100054,4001,54,'پس‌ بنی‌اسرائیل‌ چنین‌ كردند، و برحسب‌ آنچه‌ خداوند موسی‌ را امر فرموده‌ بود، به‌ عمل‌ آوردند.','And the children of Israel did according to all that the LORD commanded Moses , so did they.');
id INTEGER PRIMARY KEY,
book_id INTEGER NOT NULL,
chapter_number INTEGER NOT NULL,
audio_local TEXT,
audio_online_fa TEXT,
audio_online_en TEXT
);
id INTEGER PRIMARY KEY,
chapter_id INTEGER NOT NULL,
verse_number INTEGER NOT NULL,
text_fa TEXT,
text_en TEXT
);
INSERT INTO chapters VALUES (5001,5,1,NULL,'http://audio1.wordfree.net/bibles/app/audio/20/5/1.mp3','http://audio1.wordfree.net/bibles/app/audio/20/5/1.mp3');
INSERT INTO verses VALUES (500100001,5001,1,'span class="verse" id="1">1 </span این‌ است‌ سخنانی‌ كه‌ موسی‌ به‌ آنطرف اردنّ، در بیابان‌ عَرَبه‌ مقابل‌ سوف‌، در میان‌ فاران‌ و توفَل‌ و لابان‌ و حَضیروت‌ و دی‌ذَهَب‌ با تمامی‌ اسرائیل‌ گفت.','span class="verse" id="1">1 </span These be the words which Moses spake unto all Israel on this side Jordan in the wilderness, in the plain over against the Red sea, between Paran , and Tophel, and Laban , and Hazeroth, and Dizahab.');
INSERT INTO verses VALUES (500100002,5001,2,'از حوریب‌ به‌ راه‌ جبل‌ سعیر تا قادِش‌ برنیع‌، سفر یازده‌ روزه‌ است‌.','(There are eleven days'' journey from Horeb by the way of mount Seir unto Kadeshbarnea.)');
INSERT INTO verses VALUES (500100003,5001,3,'پس‌ در روز اول‌ ماه‌ یازدهم‌ سال‌ چهلم‌، موسی‌ بنی‌اسرائیل‌ را برحسب‌ هرآنچه‌ خداوند او را برای‌ ایشان‌ امر فرموده‌ بود تكلم‌ نمود،','And it came to pass in the fortieth year, in the eleventh month, on the first day of the month, that Moses spake unto the children of Israel , according unto all that the LORD had given him in commandment unto them;');
INSERT INTO verses VALUES (500100004,5001,4,'بعد از آنكه‌ سیحون‌ ملك‌ اموریان‌ را كه‌ در حَشْبون‌ ساكن‌ بود و عوج‌ ملك‌ باشان‌ را كه‌ در عَشتاروت‌ در اَدْرَعِی‌ ساكن‌ بود، كشته‌ بود.','After he had slain Sihon the king of the Amorites, which dwelt in Heshbon, and Og the king of Bashan, which dwelt at Astaroth in Edrei:');
INSERT INTO verses VALUES (500100005,5001,5,'به‌ آن‌ طرف‌ اُرْدُن‌ در زمین‌ موآب‌، موسی‌ به‌ بیان‌ كردنِ این‌ شریعت‌ شروع‌ كرده‌، گفت‌:','On this side Jordan , in the land of Moab , began Moses to declare this law, saying,');
INSERT INTO verses VALUES (500100006,5001,6,'یهُوَه‌ خدای‌ ما، ما را در حوریب‌ خطاب‌ كرده‌، گفت‌: «توقف‌ شما در این‌ كوه‌ بس‌ شده‌ است‌.','The LORD our God spake unto us in Horeb , saying, Ye have dwelt long enough in this mount:');
INSERT INTO verses VALUES (500100007,5001,7,'پس‌ توجه‌ نموده‌، كوچ‌ كنید و به‌ كوهستان‌ اموریان‌، و جمیع‌ حوالی‌ آن‌ از عربه‌ و كوهستان‌ و هامون‌ و جنوب‌ و كناره‌ دریا، یعنی‌ زمین‌ كنعانیان‌ و لُبْنان‌ تا نهر بزرگ‌ كه‌ نهر فرات‌ باشد، داخل‌ شوید.','Turn you, and take your journey, and go to the mount of the Amorites, and unto all the places nigh thereunto, in the plain, in the hills, and in the vale, and in the south, and by the sea side, to the land of the Canaanites, and unto Lebanon, unto the great river, the river Euphrates .');
INSERT INTO verses VALUES (500100008,5001,8,'اینك‌ زمین‌ را پیش‌ روی‌ شما گذاشتم‌. پس‌ داخل‌ شده‌، زمینی‌ را كه‌ خداوند برای‌ پدران‌ شما، ابراهیم‌ و اسحاق‌ و یعقوب‌، قسم‌ خورد كه‌ به‌ ایشان‌ و بعد از آنها به‌ ذریت‌ ایشان‌ بدهد، به‌تصرف‌ آورید.»','Behold, I have set the land before you: go in and possess the land which the LORD sware unto your fathers, Abraham , Isaac , and Jacob , to give unto them and to their seed after them.');
INSERT INTO verses VALUES (500100009,5001,9,'و در آن‌ وقت‌ به‌ شما متكلم‌ شده‌، گفتم‌: «من‌ به‌ تنهایی‌ نمی‌توانم‌ متحمل‌ شما باشم‌.','And I spake unto you at that time, saying, I am not able to bear you myself alone:');
INSERT INTO verses VALUES (500100010,5001,10,'یهُوَه‌ خدای‌ شما، شما را افزوده‌ است‌ و اینك‌ شما امروز مثل‌ ستارگان‌ آسمان‌ كثیر هستید.','The LORD your God hath multiplied you, and, behold, ye are this day as the stars of heaven for multitude.');
INSERT INTO verses VALUES (500100011,5001,11,'یهُوَه‌ خدای‌ پدران‌ شما، شما را هزار چندان‌ كه‌ هستید بیفزاید و شما را برحسب‌ آنچه‌ به‌ شما گفته‌ است‌، بركت‌ دهد.','(The LORD God of your fathers make you a thousand times so many more as ye are, and bless you, as he hath promised you!)');
INSERT INTO verses VALUES (500100012,5001,12,'لیكن‌ من‌ چگونه‌ به‌ تنهایی‌ متحمل‌ محنت‌ و بار و منازعت‌ شما بشوم‌.','How can I myself alone bear your cumbrance, and your burden, and your strife?');
INSERT INTO verses VALUES (500100013,5001,13,'پس‌ مردان‌ حكیم‌ و عاقل‌ و معروف‌ از اسباط‌ خود بیاورید، تا ایشان‌ را بر شما رؤسا سازم‌.»','Take you wise men, and understanding, and known among your tribes, and I will make them rulers over you.');
INSERT INTO verses VALUES (500100014,5001,14,'و شما در جواب‌ من‌ گفتید: «سخنی‌ كه‌ گفتی‌ نیكو است‌ كه‌ بكنیم‌.»','And ye answered me, and said, The thing which thou hast spoken is good for us to do.');
INSERT INTO verses VALUES (500100015,5001,15,'پس‌ رؤسای‌ اسباط‌ شما را كه‌ مردان‌ حكیم‌ و معروف‌ بودند گرفته‌، ایشان‌ را بر شما رؤسا ساختم‌، تا سروران‌ هزاره‌ها و سروران‌ صدها و سروران‌ پنجاهها و سروران‌ دهها و ناظران‌ اسباط‌ شما باشند.','So I took the chief of your tribes, wise men, and known, and made them heads over you, captains over thousands, and captains over hundreds, and captains over fifties, and captains over tens, and officers among your tribes.');
INSERT INTO verses VALUES (500100016,5001,16,'و در آنوقت‌ داوران‌ شما را امر كرده‌، گفتم‌: دعوای‌ برادران‌ خود را بشنوید، و در میان‌ هركس‌ و برادرش‌ و غریبی‌ كه‌ نزد وی‌ باشد به‌ انصاف‌ داوری‌ نمایید.','And I charged your judges at that time, saying, Hear the causes between your brethren, and judge righteously between every man and his brother, and the stranger that is with him.');
INSERT INTO verses VALUES (500100017,5001,17,'و در داوری‌ طرف‌داری‌ مكنید، كوچك‌ را مثل‌ بزرگ‌ بشنوید و از روی‌ انسان‌ مترسید، زیرا كه‌ داوری‌ از آن‌ خداست‌، و هر دعوایی‌ كه‌ برای‌ شما مشكل‌ است‌، نزد من‌ بیاورید تا آن‌ را بشنوم‌.','Ye shall not respect persons in judgment; but ye shall hear the small as well as the great; ye shall not be afraid of the face of man; for the judgment is God''s: and the cause that is too hard for you, bring it unto me, and I will hear it.');
INSERT INTO verses VALUES (500100018,5001,18,'و آن‌ وقت‌ همه‌ چیزهایی‌ را كه‌ باید بكنید، برای‌ شماامر فرمودم‌.','And I commanded you at that time all the things which ye should do.');
INSERT INTO verses VALUES (500100019,5001,19,'پس‌ از حوریب‌ كوچ‌ كرده‌، از تمامی‌ این‌ بیابان‌ بزرگ‌ و ترسناك‌ كه‌ شما دیدید به‌ راه‌ كوهستان‌ اموریان‌ رفتیم‌، چنانكه‌ یهُوَه‌ خدای‌ ما به‌ ما امر فرمود و به‌ قادِش‌ برنیع‌ رسیدیم‌.','And when we departed from Horeb , we went through all that great and terrible wilderness, which ye saw by the way of the mountain of the Amorites, as the LORD our God commanded us; and we came to Kadeshbarnea.');
INSERT INTO verses VALUES (500100020,5001,20,'و به‌ شما گفتم‌: «به‌ كوهستان‌ اموریانی‌ كه‌ یهُوَه‌ خدای‌ ما به‌ ما می‌دهد، رسیده‌اید.','And I said unto you, Ye are come unto the mountain of the Amorites, which the LORD our God doth give unto us.');
INSERT INTO verses VALUES (500100021,5001,21,'اینك‌ یهُوَه‌ خدای‌ تو، این‌ زمین‌ را پیش‌ روی‌ تو گذاشته‌ است‌، پس‌ برآی‌ و چنانكه‌ یهُوَه‌ خدای‌ پدرانت‌ به‌ تو گفته‌ است‌، آن‌ را به‌ تصرف‌ آور و ترسان‌ و هراسان‌ مباش‌.»','Behold, the LORD thy God hath set the land before thee: go up and possess it, as the LORD God of thy fathers hath said unto thee; fear not, neither be discouraged.');
INSERT INTO verses VALUES (500100022,5001,22,'آنگاه‌ جمیع‌ شما نزد من‌ آمده‌، گفتید: «مردانِ چند، پیش‌ روی‌ خود بفرستیم‌ تا زمین‌ را برای‌ ما جاسوسی‌ نمایند، و ما را از راهی‌ كه‌ باید برویم‌ و از شهرهایی‌ كه‌ به‌ آنها می‌رویم‌، خبر بیاورند.»','And ye came near unto me every one of you, and said, We will send men before us, and they shall search us out the land, and bring us word again by what way we must go up, and into what cities we shall come.');
INSERT INTO verses VALUES (500100023,5001,23,'و این‌ سخن‌ مرا پسند آمد، پس‌ دوازده‌ نفر از شما، یعنی‌ یكی‌ را از هر سبط‌ گرفتم‌،','And the saying pleased me well: and I took twelve men of you, one of a tribe:');
INSERT INTO verses VALUES (500100024,5001,24,'و ایشان‌ متوجه‌ راه‌ شده‌، به‌ كوه‌ برآمدند و به‌ وادی‌ اَشْكُول‌ رسیده‌، آن‌ را جاسوسی‌ نمودند.','And they turned and went up into the mountain, and came unto the valley of Eshcol , and searched it out.');
INSERT INTO verses VALUES (500100025,5001,25,'و از میوه‌ زمین‌ به‌ دست‌ خود گرفته‌، آن‌ را نزد ما آوردند، و ما را مخبر ساخته‌، گفتند: «زمینی‌ كه‌ یهُوَه‌ خدای‌ ما، به‌ ما می‌دهد، نیكوست‌.»','And they took of the fruit of the land in their hands, and brought it down unto us, and brought us word again, and said, It is a good land which the LORD our God doth give us.');
INSERT INTO verses VALUES (500100026,5001,26,'لیكن‌ شما نخواستید كه‌ بروید، بلكه‌ از فرمان‌ خداوند عصیان‌ ورزیدید.','Notwithstanding ye would not go up, but rebelled against the commandment of the LORD your God:');
INSERT INTO verses VALUES (500100027,5001,27,'و در خیمه‌های‌ خود همهمه‌ كرده‌، گفتید: «چونكه‌ خداوند ما را دشمن‌ داشت‌، ما را از زمین‌ مصر بیرون‌ آورد، تا ما را به‌ دست‌ اموریان‌ تسلیم‌ كرده‌، هلاك‌ سازد.','And ye murmured in your tents, and said, Because the LORD hated us, he hath brought us forth out of the land of Egypt , to deliver us into the hand of the Amorites, to destroy us.');
INSERT INTO verses VALUES (500100028,5001,28,'و حال‌ كجا برویم‌ چونكه‌ برادران‌ ما دل‌ ما را گداخته‌، گفتند كه‌ این‌ قوم‌ از ما بزرگتر و بلندترند و شهرهای‌ ایشان‌ بزرگ‌ و تا آسمان‌ حصاردار است‌، و نیز بنی‌عناق‌ را در آنجا دیده‌ایم‌.»','Whither shall we go up? our brethren have discouraged our heart, saying, The people is greater and taller than we; the cities are great and walled up to heaven; and moreover we have seen the sons of the Anakims there.');
INSERT INTO verses VALUES (500100029,5001,29,'پس‌ من‌ به‌ شما گفتم‌: «مترسید و از ایشان‌ هراسان‌ مباشید.','Then I said unto you, Dread not, neither be afraid of them.');
INSERT INTO verses VALUES (500100030,5001,30,'یهُوَه‌ خدای‌ شما كه‌ پیش‌ روی‌ شما می‌رود برای‌ شما جنگ‌ خواهد كرد، برحسب‌ هرآنچه‌ به‌ نظر شما در مصر برای‌ شما كرده‌ است‌.»','The LORD your God which goeth before you, he shall fight for you, according to all that he did for you in Egypt before your eyes;');
INSERT INTO verses VALUES (500100031,5001,31,'و هم‌ در بیابان‌ كه‌ در آنجا دیدید چگونه‌ یهُوَه‌ خدای‌ تو مثل‌ كسی‌ كه‌ پسر خود را می‌برد تو را در تمامی‌ راه‌ كه‌ می‌رفتید برمی‌داشت‌ تا به‌ اینجا رسیدید.','And in the wilderness, where thou hast seen how that the LORD thy God bare thee, as a man doth bear his son, in all the way that ye went, until ye came into this place.');
INSERT INTO verses VALUES (500100032,5001,32,'لیكن‌ با وجود این‌، همۀ شما به‌ یهُوَه‌ خدای‌ خود ایمان‌ نیاوردید.','Yet in this thing ye did not believe the LORD your God,');
INSERT INTO verses VALUES (500100033,5001,33,'كه‌ پیش‌ روی‌ شما در راه‌ می‌رفت‌ تا جایی‌ برای‌ نزول‌ شما بطلبد، وقت‌ شب‌ در آتش‌ تا راهی‌ را كه‌ به‌ آن‌ بروید به‌ شما بنماید و وقت‌ روز در ابر.','Who went in the way before you, to search you out a place to pitch your tents in, in fire by night, to shew you by what way ye should go, and in a cloud by day.');
INSERT INTO verses VALUES (500100034,5001,34,'و خداوند آواز سخنان‌ شما را شنیده‌، غضبناك‌ شد، و قسم‌ خورده‌، گفت‌:','And the LORD heard the voice of your words, and was wroth, and sware, saying,');
INSERT INTO verses VALUES (500100035,5001,35,'« هیچكدام‌ از این‌ مردمان‌ و از این‌ طبقه‌ شریر، آن‌ زمین‌ نیكو را كه‌ قسم‌ خوردم‌ كه‌ به‌ پدران‌ شما بدهم‌، هرگز نخواهند دید.','Surely there shall not one of these men of this evil generation see that good land, which I sware to give unto your fathers,');
INSERT INTO verses VALUES (500100036,5001,36,'سوای‌ كالیب‌ بن‌ یفُنَّه‌ كه‌ آن‌ را خواهد دید و زمینی‌ را كه‌ در آن‌ رفته‌ بود، به‌ وی‌ و به‌ پسرانش‌ خواهم‌ داد، چونكه‌ خداوند را پیروی‌ كامل‌ نمود.»','Save Caleb the son of Jephunneh; he shall see it, and to him will I give the land that he hath trodden upon, and to his children, because he hath wholly followed the LORD.');
INSERT INTO verses VALUES (500100037,5001,37,'و خداوند بخاطر شما برمن‌ نیز خشم‌ نموده‌، گفت‌ كه‌ «تو هم‌ داخل‌ آنجا نخواهی‌ شد.','Also the LORD was angry with me for your sakes, saying, Thou also shalt not go in thither.');
INSERT INTO verses VALUES (500100038,5001,38,'یوشع‌ بن‌ نون‌ كه‌ بحضور تو می‌ایستد داخل‌ آنجا خواهد شد. پس‌ او را قوی‌گردان‌ زیرا اوست‌ كه‌ آن‌ را برای‌ بنی‌اسرائیل‌ تقسیم‌ خواهد نمود.','But Joshua the son of Nun, which standeth before thee, he shall go in thither: encourage him: for he shall cause Israel to inherit it.');
INSERT INTO verses VALUES (500100039,5001,39,'و اطفال‌ شما كه‌ درباره‌ آنها گفتید كه‌ به‌ یغما خواهند رفت‌، و پسران‌ شما كه‌ امروز نیك‌ و بد را تمیز نمی‌دهند، داخل‌ آنجا خواهند شد، و آن‌ را به‌ ایشان‌ خواهم‌ داد تا مالك‌ آن‌ بشوند.','Moreover your little ones, which ye said should be a prey, and your children, which in that day had no knowledge between good and evil, they shall go in thither, and unto them will I give it, and they shall possess it.');
INSERT INTO verses VALUES (500100040,5001,40,'و اما شما روگردانیده‌، از راه‌ بحرقلزم‌ به‌ بیابان‌ كوچ‌ كنید.»','But as for you, turn you, and take your journey into the wilderness by the way of the Red sea.');
INSERT INTO verses VALUES (500100041,5001,41,'و شما در جواب‌ من‌ گفتید كه‌ «به‌ خداوند گناه‌ ورزیده‌ایم‌؛ پس‌ رفته‌، جنگ‌ خواهیم‌ كرد، موافق‌ هرآنچه‌ یهُوَه‌ خدای‌ ما به‌ ما امر فرموده‌ است‌. و همه‌ شما اسلحه‌ جنگ‌ خود را بسته‌، عزیمت‌ كردید كه‌ به‌ كوه‌ برآیید.','Then ye answered and said unto me, We have sinned against the LORD, we will go up and fight, according to all that the LORD our God commanded us. And when ye had girded on every man his weapons of war, ye were ready to go up into the hill.');
INSERT INTO verses VALUES (500100042,5001,42,'آنگاه‌ خداوند به‌ من‌ گفت‌: «به‌ ایشان‌ بگو كه‌ نروند و جنگ‌ منمایند زیرا كه‌ من‌ در میان‌ شما نیستم‌، مبادا از حضور دشمنان‌ خود مغلوب‌ شوید.»','And the LORD said unto me, Say unto them, Go not up, neither fight; for I am not among you; lest ye be smitten before your enemies.');
INSERT INTO verses VALUES (500100043,5001,43,'پس‌ به‌ شما گفتم‌، لیكن‌ نشنیدید، بلكه‌ از فرمان‌ خداوند عصیان‌ ورزیدید، و مغرور شده‌، به‌ فراز كوه‌ برآمدید.','So I spake unto you; and ye would not hear, but rebelled against the commandment of the LORD, and went presumptuously up into the hill.');
INSERT INTO verses VALUES (500100044,5001,44,'و اموریانی‌ كه‌ در آن‌ كوه‌ ساكن‌ بودند به‌ مقابله‌ شما بیرون‌ آمده‌، شما را تعاقب‌ نمودند، بطوری‌ كه‌ زنبورها می‌كنند و شما را از سعیر تا حُرْما شكست‌ دادند.','And the Amorites, which dwelt in that mountain, came out against you, and chased you, as bees do, and destroyed you in Seir , even unto Hormah.');
INSERT INTO verses VALUES (500100045,5001,45,'پس‌ برگشته‌، به‌ حضور خداوند گریه‌ نمودید، اما خداوند آواز شما را نشنید و به‌ شما گوش‌ نداد.','And ye returned and wept before the LORD; but the LORD would not hearken to your voice, nor give ear unto you.');
INSERT INTO verses VALUES (500100046,5001,46,'و در قادِش‌ برحسب‌ ایام‌ توقّفِ خود، روزهای‌ بسیار ماندید.','So ye abode in Kadesh many days, according unto the days that ye abode there.');
id INTEGER PRIMARY KEY,
book_id INTEGER NOT NULL,
chapter_number INTEGER NOT NULL,
audio_local TEXT,
audio_online_fa TEXT,
audio_online_en TEXT
);
id INTEGER PRIMARY KEY,
chapter_id INTEGER NOT NULL,
verse_number INTEGER NOT NULL,
text_fa TEXT,
text_en TEXT
);
INSERT INTO chapters VALUES (6001,6,1,NULL,'http://audio1.wordfree.net/bibles/app/audio/20/6/1.mp3','http://audio1.wordfree.net/bibles/app/audio/20/6/1.mp3');
INSERT INTO verses VALUES (600100001,6001,1,'span class="verse" id="1">1 </span و واقع‌ شد بعد از وفات‌ موسی‌، بندۀ خداوند ، كه‌ خداوند یوشع‌ بن‌ نون‌، خادم‌ موسی‌ را خطاب‌ كرده‌، گفت‌:','span class="verse" id="1">1 </span Now after the death of Moses the servant of the LORD it came to pass, that the LORD spake unto Joshua the son of Nun, Moses '' minister, saying,');
INSERT INTO verses VALUES (600100002,6001,2,'« موسی‌ بندۀ من‌ وفات‌ یافته‌ است‌. پس‌ الا´ن‌ برخیز و از این‌ اُرْدُن‌ عبور كن‌، تو و تمامی‌ این‌ قوم‌، به‌ زمینی‌ كه‌ من‌ به‌ ایشان‌، یعنی‌ به‌ بنی‌اسرائیل‌ می‌دهم‌.','Moses my servant is dead; now therefore arise, go over this Jordan , thou, and all this people, unto the land which I do give to them, even to the children of Israel .');
INSERT INTO verses VALUES (600100003,6001,3,'هر جایی‌ كه‌ كف‌ پای‌ شما گذارده‌ شود به‌ شما داده‌ام‌، چنانكه‌ به‌ موسی‌ گفتم‌.','Every place that the sole of your foot shall tread upon, that have I given unto you, as I said unto Moses .');
INSERT INTO verses VALUES (600100004,6001,4,'از صحرا و این‌ لبنان‌ تا نهر بزرگ‌ یعنی‌ نهر فرات‌، تمامی‌ زمین‌ حِتّیان‌ و تا دریای‌ بزرگ‌ به‌ طرف‌ مغرب‌ آفتاب‌، حدود شما خواهد بود.','From the wilderness and this Lebanon even unto the great river, the river Euphrates , all the land of the Hittites, and unto the great sea toward the going down of the sun, shall be your coast.');
INSERT INTO verses VALUES (600100005,6001,5,'هیچكس‌ را در تمامی‌ ایام‌ عمرت‌ یارای‌ مقاومت‌ با تو نخواهد بود. چنانكه‌ با موسی‌ بودم‌ با تو خواهم‌ بود؛ تو را مهمل‌ نخواهم‌ گذاشت‌ و ترك‌ نخواهم‌ نمود.','There shall not any man be able to stand before thee all the days of thy life: as I was with Moses , so I will be with thee: I will not fail thee, nor forsake thee.');
INSERT INTO verses VALUES (600100006,6001,6,'قوی‌ و دلیر باش‌، زیرا كه‌ تو این‌ قوم‌ را متصرف‌ زمینی‌ كه‌ برای‌ پدران‌ ایشان‌ قسم‌ خوردم‌ كه‌ به‌ ایشان‌ بدهم‌، خواهی‌ ساخت‌.','Be strong and of a good courage: for unto this people shalt thou divide for an inheritance the land, which I sware unto their fathers to give them.');
INSERT INTO verses VALUES (600100007,6001,7,'فقط‌ قوی‌ و بسیار دلیر باش‌ تا برحسب‌ تمامی‌ شریعتی‌ كه‌ بندۀ من‌، موسی‌ تو را امر كرده‌ است‌ متوجه‌ شده‌، عمل‌ نمایی‌. زنهار از آن‌ به‌ طرف‌ راست‌ یا چپ‌ تجاوز منما تا هر جایی‌ كه‌ روی‌، كامیاب‌ شوی‌.','Only be thou strong and very courageous, that thou mayest observe to do according to all the law, which Moses my servant commanded thee: turn not from it to the right hand or to the left, that thou mayest prosper whithersoever thou goest.');
INSERT INTO verses VALUES (600100008,6001,8,'این‌ كتاب‌ تورات‌ از دهان‌ تو دور نشود، بلكه‌ روز و شب‌ در آن‌ تفكر كن‌ تا برحسب‌ هر آنچه‌ در آن‌ مكتوب‌ است‌ متوجه‌ شده‌، عمل‌ نمایی‌ زیرا همچنین‌ راه‌ خودرا فیروز خواهی‌ ساخت‌، و همچنین‌ كامیاب‌ خواهی‌ شد.','This book of the law shall not depart out of thy mouth; but thou shalt meditate therein day and night, that thou mayest observe to do according to all that is written therein: for then thou shalt make thy way prosperous, and then thou shalt have good success.');
INSERT INTO verses VALUES (600100009,6001,9,'آیا تو را امر نكردم‌؟ پس‌ قوی‌ و دلیر باش‌؛ مترس‌ و هراسان‌ مباش‌ زیرا در هر جا كه‌ بروی‌ یهُوَه‌ خدای‌ تو، با توست‌.»','Have not I commanded thee? Be strong and of a good courage; be not afraid, neither be thou dismayed: for the LORD thy God is with thee whithersoever thou goest.');
INSERT INTO verses VALUES (600100010,6001,10,'پس‌ یوشع‌ رؤسای‌ قوم‌ را امر فرموده‌، گفت‌:','Then Joshua commanded the officers of the people, saying,');
INSERT INTO verses VALUES (600100011,6001,11,'« در میان‌ لشكرگاه‌ بگذرید و قوم‌ را امر فرموده‌، بگویید: برای‌ خود توشه‌ حاضر كنید، زیرا كه‌ بعد از سه‌ روز، شما از این‌ اُرْدُن‌ عبور كرده‌، داخل‌ خواهید شد تا تصرف‌ كنید در زمینی‌ كه‌ یهُوَه‌ خدای‌ شما، به‌ شما برای‌ ملكّیت‌ می‌دهد.»','Pass through the host, and command the people, saying, Prepare you victuals; for within three days ye shall pass over this Jordan , to go in to possess the land, which the LORD your God giveth you to possess it.');
INSERT INTO verses VALUES (600100012,6001,12,'و یوشع‌ رؤبینیان‌ و جادیان‌ و نصف‌ سبط‌ مَنَسَّی‌ را خطاب‌ كرده‌، گفت‌:','And to the Reubenites, and to the Gadites, and to half the tribe of Manasseh , spake Joshua , saying,');
INSERT INTO verses VALUES (600100013,6001,13,'« بیاد آورید آن‌ سخن‌ را كه‌ موسی‌، بندۀ خداوند ، به‌ شما امر فرموده‌، گفت‌: یهُوَه‌، خدای‌ شما به‌ شما آرامی‌ می‌دهد و این‌ زمین‌ را به‌ شما می‌بخشد.','Remember the word which Moses the servant of the LORD commanded you, saying, The LORD your God hath given you rest, and hath given you this land.');
INSERT INTO verses VALUES (600100014,6001,14,'زنان‌ و اطفال‌ و مواشی‌ شما در زمینی‌ كه‌ موسی‌ در آن‌ طرف‌ اُرْدُن‌ به‌ شما داد خواهند ماند، و اما شما مسلح‌ شده‌، یعنی‌ جمیع‌ مردان‌ جنگی‌ پیش‌ روی‌ برادران‌ خود عبور كنید، و ایشان‌ را اعانت‌ نمایید.','Your wives, your little ones, and your cattle, shall remain in the land which Moses gave you on this side Jordan ; but ye shall pass before your brethren armed, all the mighty men of valour, and help them;');
INSERT INTO verses VALUES (600100015,6001,15,'تا خداوند برادران‌ شما را مثل‌ شما آرامی‌ داده‌ باشد، و ایشان‌ نیز در زمینی‌ كه‌ یهُوَه‌، خدای‌ شما به‌ ایشان‌ می‌دهد تصرف‌ كرده‌ باشند؛ آنگاه‌ به‌ زمین‌ ملكّیت‌ خود خواهید برگشت‌ و متصرف‌ خواهید شد، در آن‌ كه‌ موسی‌، بندۀ خداوند به‌آن‌ طرف‌ اُرْدُن‌ به‌ سوی‌ مشرق‌ آفتاب‌ به‌ شما داد.»','Until the LORD have given your brethren rest, as he hath given you, and they also have possessed the land which the LORD your God giveth them: then ye shall return unto the land of your possession, and enjoy it, which Moses the LORD''s servant gave you on this side Jordan toward the sunrising.');
INSERT INTO verses VALUES (600100016,6001,16,'ایشان‌ در جواب‌ یوشع‌ گفتند: «هر آنچه‌ به‌ ما فرمودی‌ خواهیم‌ كرد، و هر جا ما را بفرستی‌، خواهیم‌ رفت‌.','And they answered Joshua , saying, All that thou commandest us we will do, and whithersoever thou sendest us, we will go.');
INSERT INTO verses VALUES (600100017,6001,17,'چنانكه‌ موسی‌ را در هر چیز اطاعت‌ نمودیم‌، تو را نیز اطاعت‌ خواهیم‌ نمود، فقط‌ یهُوَه‌، خدای‌ تو، با تو باشد چنانكه‌ با موسی‌ بود.','According as we hearkened unto Moses in all things, so will we hearken unto thee: only the LORD thy God be with thee, as he was with Moses .');
INSERT INTO verses VALUES (600100018,6001,18,'هر كسی‌ كه‌ از حكم‌ تو رو گرداند و كلام‌ تو را در هر چیزی‌ كه‌ او را امر فرمایی‌ اطاعت‌ نكند، كشته‌ خواهد شد؛ فقط‌ قوی‌ و دلیر باش‌.»','Whosoever he be that doth rebel against thy commandment, and will not hearken unto thy words in all that thou commandest him, he shall be put to death: only be strong and of a good courage.');
id INTEGER PRIMARY KEY,
book_id INTEGER NOT NULL,
chapter_number INTEGER NOT NULL,
audio_local TEXT,
audio_online_fa TEXT,
audio_online_en TEXT
);
id INTEGER PRIMARY KEY,
chapter_id INTEGER NOT NULL,
verse_number INTEGER NOT NULL,
text_fa TEXT,
text_en TEXT
);
INSERT INTO chapters VALUES (7001,7,1,NULL,'http://audio1.wordfree.net/bibles/app/audio/20/7/1.mp3','http://audio1.wordfree.net/bibles/app/audio/20/7/1.mp3');
INSERT INTO verses VALUES (700100001,7001,1,'span class="verse" id="1">1 </span و بعد از وفات‌ یوشع‌، واقع‌ شد كه‌بنی‌اسرائیل‌ از خداوند سؤال‌ كرده‌، گفتند: «كیست‌ كه‌ برای‌ ما بر كنعانیان‌، اول‌ برآید و با ایشان‌ جنگ‌ نماید؟»','span class="verse" id="1">1 </span Now after the death of Joshua it came to pass, that the children of Israel asked the LORD, saying, Who shall go up for us against the Canaanites first, to fight against them?');
INSERT INTO verses VALUES (700100002,7001,2,'خداوند گفت‌: «یهودا برآید، اینك‌ زمین‌ را به‌ دست‌ او تسلیم‌ كرده‌ام‌.»','And the LORD said, Judah shall go up: behold, I have delivered the land into his hand.');
INSERT INTO verses VALUES (700100003,7001,3,'و یهودا به‌ برادر خود شَمْعُون‌ گفت‌: «به‌ قرعۀ من‌ همراه‌ من‌ برآی‌، و با كنعانیان‌ جنگ‌ كنیم‌، و من‌ نیز همراه‌ تو به‌ قرعۀ تو خواهم‌ آمد.» پس‌ شَمْعُون‌ همراه‌ او رفت‌.','And Judah said unto Simeon his brother, Come up with me into my lot, that we may fight against the Canaanites; and I likewise will go with thee into thy lot. So Simeon went with him.');
INSERT INTO verses VALUES (700100004,7001,4,'و یهودا برآمد، و خداوند كنعانیان‌ و فَرِزّیان‌ را به‌ دست‌ ایشان‌ تسلیم‌ نمود، و ده‌هزار نفر از ایشان‌ را در بازَق‌ كشتند.','And Judah went up; and the LORD delivered the Canaanites and the Perizzites into their hand: and they slew of them in Bezek ten thousand men.');
INSERT INTO verses VALUES (700100005,7001,5,'و اَدُونی‌ بازَق‌ را در بازَق‌ یافته‌، با او جنگ‌ كردند، و كنعانیان‌ و فَرِزّیان‌ را شكست‌ دادند.','And they found Adonibezek in Bezek: and they fought against him, and they slew the Canaanites and the Perizzites.');
INSERT INTO verses VALUES (700100006,7001,6,'و اَدُونی‌ بازَق‌ فرار كرد و او را تعاقب‌ نموده‌، گرفتندش‌، و شستهای‌ دست‌ و پایش‌ را بریدند.','But Adonibezek fled; and they pursued after him, and caught him, and cut off his thumbs and his great toes.');
INSERT INTO verses VALUES (700100007,7001,7,'و اَدُونی‌ بازَق‌ گفت‌: «هفتاد مَلِك‌ با شستهای‌ دست‌ و پا بریده‌ زیر سفرۀ من‌ خورده‌هـا برمی‌چیدنـد. موافـق‌ آنچه‌ مـن‌ كردم‌ خـدا به‌ من‌ مكافات‌ رسانیـده‌ است‌.» پس‌ او را به‌ اورشلیم‌ آوردند و در آنجـا مـرد.','And Adonibezek said, Threescore and ten kings, having their thumbs and their great toes cut off, gathered their meat under my table: as I have done, so God hath requited me. And they brought him to Jerusalem , and there he died.');
INSERT INTO verses VALUES (700100008,7001,8,'و بنی‌یهودا با اورشلیم‌ جنگ‌ كرده‌، آن‌ را گرفتند، و آن‌ را به‌ دم‌ شمشیر زده‌، شهر را به‌ آتش‌ سوزانیدند.','Now the children of Judah had fought against Jerusalem , and had taken it, and smitten it with the edge of the sword, and set the city on fire.');
INSERT INTO verses VALUES (700100009,7001,9,'و بعد از آن‌ بنی‌یهودا فرود شدند تا با كنعانیانی‌ كه‌ در كوهستان‌ و جنوب‌ و بیابان‌ ساكن‌ بودند، جنگ‌ كنند.','And afterward the children of Judah went down to fight against the Canaanites, that dwelt in the mountain, and in the south, and in the valley.');
INSERT INTO verses VALUES (700100010,7001,10,'و یهودا بر كنعانیانی‌ كه‌ در حَبْرون‌ ساكن‌ بودند برآمد، و اسم‌ حَبْرون‌ قبل‌ از آن‌ قریه‌ اَرْبَع‌ بود. و شیشای‌ و اَخیمان‌ و تَلْمای‌ را كشتند.','And Judah went against the Canaanites that dwelt in Hebron : (now the name of Hebron before was Kirjatharba :) and they slew Sheshai, and Ahiman, and Talmai.');
INSERT INTO verses VALUES (700100011,7001,11,'و از آنجا بر ساكنان‌ دَبیر برآمد و اسم‌ دَبیر قبل‌ از آن‌، قریه‌ سَفیر بود.','And from thence he went against the inhabitants of Debir: and the name of Debir before was Kirjathsepher:');
INSERT INTO verses VALUES (700100012,7001,12,'و كالیب‌ گفت‌: «آنكه‌ قریه‌ سَفیر را زده‌، فتح‌ نماید، دختر خود عَكْسَه‌ را به‌ او به‌ زنی‌ خواهم‌ داد.»','And Caleb said, He that smiteth Kirjathsepher, and taketh it, to him will I give Achsah my daughter to wife.');
INSERT INTO verses VALUES (700100013,7001,13,'و عُتْنیئیل‌ بن‌قناز برادر كوچك‌ كالیب‌ آن‌ را گرفت‌؛ پس‌ دختر خود عَكْسَه‌ را به‌ او به‌ زنی‌ داد.','And Othniel the son of Kenaz , Caleb''s younger brother, took it: and he gave him Achsah his daughter to wife.');
INSERT INTO verses VALUES (700100014,7001,14,'و چون‌ دختر نزد وی‌ آمد، او را ترغیب‌ كرد كه‌ از پدرش‌ زمینی‌ طلب‌ كند. و آن‌ دختر از الاغ‌ خود پیاده‌ شده‌، كالیب‌ وی‌ را گفت‌: «چه‌ می‌خواهی‌؟»','And it came to pass, when she came to him, that she moved him to ask of her father a field: and she lighted from off her ass; and Caleb said unto her, What wilt thou?');
INSERT INTO verses VALUES (700100015,7001,15,'به‌ وی‌ گفت‌: «مرا بركت‌ ده‌ زیرا كه‌ مرا در زمین‌ جنوب‌ ساكن‌ گردانیدی‌، پس‌ مرا چشمه‌هـای‌ آب‌ بده‌.» و كالیب‌ چشمه‌های‌ بالا و چشمه‌های‌ پایین‌ را به‌ او داد.','And she said unto him, Give me a blessing: for thou hast given me a south land; give me also springs of water. And Caleb gave her the upper springs and the nether springs.');
INSERT INTO verses VALUES (700100016,7001,16,'و پسران‌ قِینِی‌ پدر زن‌ موسی‌ از شهر نخلستان‌ همراه‌ بنی‌یهودا به‌ صحرای‌ یهودا كه‌ به‌ جنوب‌ عَراد است‌ برآمده‌، رفتند و با قوم‌ ساكن‌ شدند.','And the children of the Kenite, Moses '' father in law, went up out of the city of palm trees with the children of Judah into the wilderness of Judah , which lieth in the south of Arad; and they went and dwelt among the people.');
INSERT INTO verses VALUES (700100017,7001,17,'و یهودا همراه‌ برادر خود شَمْعُون‌ رفت‌، و كنعانیانی‌ را كه‌ در صَفَت‌ ساكن‌ بودند، شكست‌ دادند، و آن‌ را خراب‌ كرده‌، اسم‌ شهر را حُرما نامیدند.','And Judah went with Simeon his brother, and they slew the Canaanites that inhabited Zephath, and utterly destroyed it. And the name of the city was called Hormah.');
INSERT INTO verses VALUES (700100018,7001,18,'و یهودا غَزَّه‌ و نواحی‌اش‌ و اَشْقَلون‌ و نواحی‌اش‌ و عَقْرُون‌ و نواحی‌اش‌ را گرفت‌.','Also Judah took Gaza with the coast thereof, and Askelon with the coast thereof, and Ekron with the coast thereof.');
INSERT INTO verses VALUES (700100019,7001,19,'و خداوند با یهودا می‌بود، و او اهل‌ كوهستان‌ را بیرون‌ كرد، لیكن‌ ساكنان‌ وادی‌ را نتوانست‌ بیرون‌ كند، زیرا كه‌ ارابه‌های‌ آهنین‌ داشتند.','And the LORD was with Judah ; and he drave out the inhabitants of the mountain; but could not drive out the inhabitants of the valley, because they had chariots of iron.');
INSERT INTO verses VALUES (700100020,7001,20,'و حَبْرون‌ را برحسب‌ قول‌ موسی‌ به‌ كالیب‌ دادند، و او سه‌ پسر عناق‌ را از آنجا بیرون‌ كرد.','And they gave Hebron unto Caleb, as Moses said: and he expelled thence the three sons of Anak.');
INSERT INTO verses VALUES (700100021,7001,21,'و بنی‌بنیامین‌ یبُوسیان‌ را كه‌ در اورشلیم‌ساكن‌ بودند بیرون‌ نكردند، و یبوسیان‌ با بنی‌بنیامین‌ تا امروز در اورشلیم‌ ساكنند.','And the children of Benjamin did not drive out the Jebusites that inhabited Jerusalem ; but the Jebusites dwell with the children of Benjamin in Jerusalem unto this day.');
INSERT INTO verses VALUES (700100022,7001,22,'و خاندان‌ یوسف‌ نیز به‌ بیت‌ئیل‌ برآمدند، و خداوند با ایشان‌ بود.','And the house of Joseph , they also went up against Bethel : and the LORD was with them.');
INSERT INTO verses VALUES (700100023,7001,23,'و خاندان‌ یوسف‌ بیت‌ئیل‌ را جاسوسی‌ كردند، و نام‌ آن‌ شهر قبل‌ از آن‌ لُوز بود.','And the house of Joseph sent to descry Bethel . (Now the name of the city before was Luz .)');
INSERT INTO verses VALUES (700100024,7001,24,'و كشیكچیان‌ مردی‌ را كه‌ از شهر بیرون‌ می‌آمد دیده‌، به‌ وی‌ گفتند: «مدخل‌ شهر را به‌ ما نشان‌ بده‌ كه‌ با تو احسان‌ خواهیم‌ نمود.»','And the spies saw a man come forth out of the city, and they said unto him, Shew us, we pray thee, the entrance into the city, and we will shew thee mercy.');
INSERT INTO verses VALUES (700100025,7001,25,'پس‌ مدخل‌ شهر را به‌ ایشان‌ نشان‌ داده‌، پس‌ شهر را به‌ دم‌ شمشیر زدند، و آن‌ مرد را با تمامی‌ خاندانش‌ رها كردند.','And when he shewed them the entrance into the city, they smote the city with the edge of the sword; but they let go the man and all his family.');
INSERT INTO verses VALUES (700100026,7001,26,'و آن‌ مرد به‌ زمین‌ حِتّیان‌ رفته‌، شهری‌ بنا نمود و آن‌ را لوز نامید كه‌ تا امروز اسمش‌ همان‌ است‌.','And the man went into the land of the Hittites, and built a city, and called the name thereof Luz : which is the name thereof unto this day.');
INSERT INTO verses VALUES (700100027,7001,27,'و مَنَسّی‌ اهل‌ بیت‌شان‌ و دهات‌ آن‌ را و اهل‌ تَعَنَك‌ و دهات‌ آن‌ و ساكنان‌ دُوْر و دهات‌ آن‌ و ساكنان‌ یبْلَعام‌ و دهات‌ آن‌ و ساكنان‌ مَجِدّو و دهات‌ آن‌ را بیرون‌ نكرد، و كنعانیان‌ عزیمت‌ داشتند كه‌ در آن‌ زمین‌ ساكن‌ باشند.','Neither did Manasseh drive out the inhabitants of Bethshean and her towns, nor Taanach and her towns, nor the inhabitants of Dor and her towns, nor the inhabitants of Ibleam and her towns, nor the inhabitants of Megiddo and her towns: but the Canaanites would dwell in that land.');
INSERT INTO verses VALUES (700100028,7001,28,'و چون‌ اسرائیل‌ قوی‌ شدند، بر كنعانیان‌ جزیه‌ نهادند، لیكن‌ ایشان‌ را تماماً بیرون‌ نكردند.','And it came to pass, when Israel was strong, that they put the Canaanites to tribute, and did not utterly drive them out.');
INSERT INTO verses VALUES (700100029,7001,29,'و افرایم‌ كنعانیانی‌ را كه‌ در جازَر ساكن‌ بودند، بیرون‌ نكرد، پس‌ كنعانیان‌ در میان‌ ایشان‌ در جازَر ساكن‌ ماندند.','Neither did Ephraim drive out the Canaanites that dwelt in Gezer; but the Canaanites dwelt in Gezer among them.');
INSERT INTO verses VALUES (700100030,7001,30,'و زَبُولون‌ ساكنان‌ فِطرون‌ و ساكنان‌ نَهْلول‌ را بیرون‌ نكرد، پس‌ كنعانیان‌ در میان‌ ایشان‌ ساكن‌ ماندند، و جزیه‌ بر آنها گذارده‌ شد.','Neither did Zebulun drive out the inhabitants of Kitron, nor the inhabitants of Nahalol; but the Canaanites dwelt among them, and became tributaries.');
INSERT INTO verses VALUES (700100031,7001,31,'و اَشیر ساكنان‌ عَكّو و ساكنان‌ صِیدون‌ و اَحْلَب‌ و اَكْزِیب‌ و حَلْبَه‌ و عَفیق‌ و رَحُوب‌ را بیرون‌ نكرد.','Neither did Asher drive out the inhabitants of Accho, nor the inhabitants of Zidon, nor of Ahlab, nor of Achzib, nor of Helbah, nor of Aphik, nor of Rehob:');
INSERT INTO verses VALUES (700100032,7001,32,'پس‌ اَشیریان‌ در میان‌ كنعانیانی‌ كه‌ ساكن‌ آن‌ زمین‌ بودند سكونت‌ گرفتند، زیرا كه‌ ایشان‌ رابیرون‌ نكردند.','But the Asherites dwelt among the Canaanites, the inhabitants of the land: for they did not drive them out.');
INSERT INTO verses VALUES (700100033,7001,33,'و نفتالی‌ ساكنان‌ بیت‌ شمس‌ و ساكنان‌ بیت‌عنات‌ را بیرون‌ نكرد، پس‌ در میان‌ كنعانیانی‌ كه‌ ساكن‌ آن‌ زمین‌ بودند، سكونت‌ گرفت‌. لیكن‌ ساكنان‌ بیت‌شمس‌ و بیت‌عَنات‌ به‌ ایشان‌ جزیه‌ می‌دادند.','Neither did Naphtali drive out the inhabitants of Bethshemesh, nor the inhabitants of Bethanath; but he dwelt among the Canaanites, the inhabitants of the land: nevertheless the inhabitants of Bethshemesh and of Bethanath became tributaries unto them.');
INSERT INTO verses VALUES (700100034,7001,34,'و اَموریان‌ بنی‌دان‌ را به‌ كوهستان‌ مسدود ساختند زیرا كه‌ نگذاشتند كه‌ به‌ بیابان‌ فرود آیند.','And the Amorites forced the children of Dan into the mountain: for they would not suffer them to come down to the valley:');
INSERT INTO verses VALUES (700100035,7001,35,'پس‌ اموریان‌ عزیمت‌ داشتند كه‌ در اَیلُون‌ و شَعَلُبّیم‌ در كوه‌ حارَس‌ ساكن‌ باشند، و لیكن‌ چون‌ دست‌ خاندان‌ یوسف‌ قوت‌ گرفت‌، جزیه‌ برایشان‌ گذارده‌ شد.','But the Amorites would dwell in mount Heres in Aijalon, and in Shaalbim: yet the hand of the house of Joseph prevailed, so that they became tributaries.');
INSERT INTO verses VALUES (700100036,7001,36,'و حد اموریان‌ از سر بالای‌ عَقْرَبّیم‌ و از سالَع‌ تا بالاتر بود.','And the coast of the Amorites was from the going up to Akrabbim, from the rock, and upward.');
id INTEGER PRIMARY KEY,
book_id INTEGER NOT NULL,
chapter_number INTEGER NOT NULL,
audio_local TEXT,
audio_online_fa TEXT,
audio_online_en TEXT
);
id INTEGER PRIMARY KEY,
chapter_id INTEGER NOT NULL,
verse_number INTEGER NOT NULL,
text_fa TEXT,
text_en TEXT
);
INSERT INTO chapters VALUES (8001,8,1,NULL,'http://audio1.wordfree.net/bibles/app/audio/20/8/1.mp3','http://audio1.wordfree.net/bibles/app/audio/20/8/1.mp3');
INSERT INTO verses VALUES (800100001,8001,1,'span class="verse" id="1">1 </span و واقع‌ شد در ایام‌ حكومت‌ داوران‌ كه قحطی‌ در زمین‌ پیدا شد، و مردی‌ از بیت‌لحم‌ یهودا رفت‌ تا در بلاد موآب‌ ساكن‌ شود، او و زنش‌ و دو پسرش‌.','span class="verse" id="1">1 </span Now it came to pass in the days when the judges ruled, that there was a famine in the land. And a certain man of Bethlehemjudah went to sojourn in the country of Moab , he, and his wife, and his two sons.');
INSERT INTO verses VALUES (800100002,8001,2,'و اسم‌ آن‌ مرد اَلیمَلَك‌ بود، و اسم‌ زنش‌ نَعُومی‌، و پسرانش‌ به‌ مَحْلُون‌ و كِلْیون‌ مسمّی‌ و اَفْراتیانِ بیت‌لحم‌ یهودا بودند. پس‌ به‌ بلاد موآب‌ رسیده‌، در آنجا ماندند.','And the name of the man was Elimelech, and the name of his wife Naomi, and the name of his two sons Mahlon and Chilion, Ephrathites of Bethlehemjudah. And they came into the country of Moab , and continued there.');
INSERT INTO verses VALUES (800100003,8001,3,'و اَلیمَلَك‌ شوهر نعومی‌، مرد و او با دو پسرش‌ باقی‌ ماند.','And Elimelech Naomi''s husband died; and she was left, and her two sons.');
INSERT INTO verses VALUES (800100004,8001,4,'و ایشان‌ از زنان‌ موآب‌ برای‌ خود زن‌ گرفتند كه‌ نام‌ یكی‌ عُرْفَه‌ و نام‌ دیگری‌ روت‌ بود، و در آنجا قریب‌ به‌ ده‌ سال‌ توقف‌ نمودند.','And they took them wives of the women of Moab ; the name of the one was Orpah, and the name of the other Ruth : and they dwelled there about ten years.');
INSERT INTO verses VALUES (800100005,8001,5,'و هر دو ایشان‌ مَحْلُون‌ و كِلْیون‌ نیز مردند، و آن‌ زن‌ از دو پسر و شوهر خود محروم‌ ماند.','And Mahlon and Chilion died also both of them; and the woman was left of her two sons and her husband.');
INSERT INTO verses VALUES (800100006,8001,6,'پس‌ او با دو عروس‌ خود برخاست‌ تا از بلاد موآب‌ برگردد، زیرا كه‌ در بلاد موآب‌ شنیده‌ بود كه‌ خداوند از قوم‌ خود تفقّد نموده‌، نان‌ به‌ ایشان‌ داده‌ است‌.','Then she arose with her daughters in law, that she might return from the country of Moab : for she had heard in the country of Moab how that the LORD had visited his people in giving them bread.');
INSERT INTO verses VALUES (800100007,8001,7,'و از مكانی‌ كه‌ در آن‌ ساكن‌ بود بیرون‌ آمد، و دو عروسش‌ همراه‌ وی‌ بودند، و به‌ راه‌ روانه‌ شدند تا به‌ زمین‌ یهودا مراجعت‌ كنند.','Wherefore she went forth out of the place where she was, and her two daughters in law with her; and they went on the way to return unto the land of Judah .');
INSERT INTO verses VALUES (800100008,8001,8,'و نعومی‌ به‌ دو عروس‌ خود گفت‌: «بروید و هر یكی‌ از شما به‌ خانۀ مادر خود برگردید، و خداوند بر شما احسان‌ كناد، چنانكه‌ شما به‌ مردگان‌ و به‌ من‌ كردید.','And Naomi said unto her two daughters in law, Go, return each to her mother''s house: the LORD deal kindly with you, as ye have dealt with the dead, and with me.');
INSERT INTO verses VALUES (800100009,8001,9,'و خداوند به‌ شما عطا كناد كه‌ هر یكی‌ از شما در خانۀ شوهر خود راحت‌ یابید.» پس‌ ایشان‌ را بوسید و آواز خود را بلند كرده‌، گریستند.','The LORD grant you that ye may find rest, each of you in the house of her husband. Then she kissed them; and they lifted up their voice, and wept.');
INSERT INTO verses VALUES (800100010,8001,10,'و به‌ او گفتند: «نی‌ بلكه‌ همراه‌ تو نزد قوم‌ تو خواهیم‌ برگشت‌.»','And they said unto her, Surely we will return with thee unto thy people.');
INSERT INTO verses VALUES (800100011,8001,11,'نعومی‌ گفت‌: «ای‌ دخترانم‌ برگردید، چرا همراه‌ من‌ بیایید؟ آیا در رحم‌ من‌ هنوز پسران‌ هستند كه‌ برای‌ شما شوهر باشند؟','And Naomi said, Turn again, my daughters: why will ye go with me? are there yet any more sons in my womb, that they may be your husbands?');
INSERT INTO verses VALUES (800100012,8001,12,'ای‌ دخترانم‌ برگشته‌، راه‌ خود را پیش‌ گیرید زیرا كه‌ برای‌ شوهر گرفتن‌ زیاده‌ پیر هستم‌، و اگر گویم‌ كه‌ امید دارم‌ و امشب‌ نیز به‌ شوهر داده‌ شوم‌ وپسران‌ هم‌ بزایم‌،','Turn again, my daughters, go your way; for I am too old to have an husband. If I should say, I have hope, if I should have an husband also to night, and should also bear sons;');
INSERT INTO verses VALUES (800100013,8001,13,'آیا تا بالغ‌ شدن‌ ایشان‌ صبر خواهید كرد، و به‌ خاطر ایشان‌، خود را از شوهر گرفتن‌ محروم‌ خواهید داشت‌؟ نی‌ ای‌ دخترانم‌ زیرا كه‌ جانم‌ برای‌ شما بسیار تلخ‌ شده‌ است‌ چونكه‌ دست‌ خداوند بر من‌ دراز شده‌ است‌.»','Would ye tarry for them till they were grown? would ye stay for them from having husbands? nay, my daughters; for it grieveth me much for your sakes that the hand of the LORD is gone out against me.');
INSERT INTO verses VALUES (800100014,8001,14,'پس‌ بار دیگر آواز خود را بلند كرده‌، گریستند و عرفه‌ مادر شوهر خود را بوسید، اما روت‌ به‌ وی‌ چسبید.','And they lifted up their voice, and wept again: and Orpah kissed her mother in law; but Ruth clave unto her.');
INSERT INTO verses VALUES (800100015,8001,15,'و او گفت‌: «اینك‌ زن‌ برادر شوهرت‌ نزد قوم‌ خود و خدایان‌ خویش‌ برگشته‌ است‌ تو نیز در عقب‌ زن‌ برادر شوهرت‌ برگرد.»','And she said, Behold, thy sister in law is gone back unto her people, and unto her gods: return thou after thy sister in law.');
INSERT INTO verses VALUES (800100016,8001,16,'روت‌ گفت‌: «بر من‌ اصرار مكن‌ كه‌ تو را ترك‌ كنم‌ و از نزد تو برگردم‌، زیرا هر جایی‌ كه‌ رَوْی‌ می‌آیم‌ و هر جایی‌ كه‌ منزل‌ كنی‌، منزل‌ می‌كنم‌، قوم‌ تو قوم‌ من‌ و خدای‌ تو خدای‌ من‌ خواهد بود.','And Ruth said, Intreat me not to leave thee, or to return from following after thee: for whither thou goest, I will go; and where thou lodgest, I will lodge: thy people shall be my people, and thy God my God:');
INSERT INTO verses VALUES (800100017,8001,17,'جایی‌ كه‌ بمیری‌، می‌میرم‌ و در آنجا دفن‌ خواهم‌ شد. خداوند به‌ من‌ چنین‌ بلكه‌ زیاده‌ بر این‌ كند اگر چیزی‌ غیر از موت‌، مرا از تو جدا نماید.»','Where thou diest, will I die, and there will I be buried: the LORD do so to me, and more also, if ought but death part thee and me.');
INSERT INTO verses VALUES (800100018,8001,18,'پس‌ چون‌ دید كه‌ او برای‌ رفتن‌ همراهش‌ مصمم‌ شده‌ است‌، از سخن‌ گفتن‌ با وی‌ باز ایستاد.','When she saw that she was stedfastly minded to go with her, then she left speaking unto her.');
INSERT INTO verses VALUES (800100019,8001,19,'و ایشان‌ هر دو روانه‌ شدند تا به‌ بیت‌لحم‌ رسیدند. و چون‌ وارد بیت‌لحم‌ گردیدند، تمامی‌ شهر بر ایشان‌ به‌ حركت‌ آمده‌، زنان‌ گفتند كه‌ «آیااین‌ نعومی‌ است‌؟»','So they two went until they came to Bethlehem . And it came to pass, when they were come to Bethlehem , that all the city was moved about them, and they said, Is this Naomi?');
INSERT INTO verses VALUES (800100020,8001,20,'او به‌ ایشان‌ گفت‌: «مرا نعومی‌ مخوانید بلكه‌ مرا مُرَّه‌ بخوانید زیرا قادر مطلق‌ به‌ من‌ مرارت‌ سخت‌ رسانیده‌ است‌.','And she said unto them, Call me not Naomi, call me Mara: for the Almighty hath dealt very bitterly with me.');
INSERT INTO verses VALUES (800100021,8001,21,'من‌ پُر بیرون‌ رفتم‌ و خداوند مرا خالی‌ برگردانید. پس‌ برای‌ چه‌ مرا نعومی‌ می‌خوانید چونكه‌ خداوند مرا ذلیل‌ ساخته‌ است‌ و قادرمطلق‌ به‌ من‌ بدی‌ رسانیده‌ است‌.»','I went out full, and the LORD hath brought me home again empty: why then call ye me Naomi, seeing the LORD hath testified against me, and the Almighty hath afflicted me?');
INSERT INTO verses VALUES (800100022,8001,22,'و نعومی‌ مراجعت‌ كرد و عروسش‌ روتِ موآبیه‌ كه‌ از بلاد موآب‌ برگشته‌ بود، همراه‌ وی‌ آمد؛ و در ابتدای‌ درویدن‌ جو وارد بیت‌لحم‌ شدند.','So Naomi returned, and Ruth the Moabitess, her daughter in law, with her, which returned out of the country of Moab : and they came to Bethlehem in the beginning of barley harvest.');
id INTEGER PRIMARY KEY,
book_id INTEGER NOT NULL,
chapter_number INTEGER NOT NULL,
audio_local TEXT,
audio_online_fa TEXT,
audio_online_en TEXT
);
id INTEGER PRIMARY KEY,
chapter_id INTEGER NOT NULL,
verse_number INTEGER NOT NULL,
text_fa TEXT,
text_en TEXT
);
INSERT INTO chapters VALUES (9001,9,1,NULL,'http://audio1.wordfree.net/bibles/app/audio/20/9/1.mp3','http://audio1.wordfree.net/bibles/app/audio/20/9/1.mp3');
INSERT INTO verses VALUES (900100001,9001,1,'span class="verse" id="1">1 </span و مردی بود از رامَه تایم صُوفیم ازكوهستان افرایم، مسمّی به اَلْقانَه بن یرُوحام بن اَلِیهُو بن تُوحُو بن صُوف. و او افرایمی بود.','span class="verse" id="1">1 </span Now there was a certain man of Ramathaimzophim, of mount Ephraim , and his name was Elkanah , the son of Jeroham, the son of Elihu, the son of Tohu, the son of Zuph, an Ephrathite:');
INSERT INTO verses VALUES (900100002,9001,2,'و او دو زن داشت. اسم یكی حَنّا و اسم دیگری فَنِنَّه بود. و فَنِنَّه اولاد داشت لیكن حَنّا را اولاد نبود.','And he had two wives; the name of the one was Hannah, and the name of the other Peninnah: and Peninnah had children, but Hannah had no children.');
INSERT INTO verses VALUES (900100003,9001,3,'و آن مرد هر سال برای عبادت نمودن و قربانی گذرانیدن برای یهُوَه صبایوت از شهر خود به شیلُوه میآمد، و حُفْنِی و فینَحاس دو پسر عِیلِی، كاهنان خداوند در آنجا بودند.','And this man went up out of his city yearly to worship and to sacrifice unto the LORD of hosts in Shiloh. And the two sons of Eli, Hophni and Phinehas , the priests of the LORD, were there.');
INSERT INTO verses VALUES (900100004,9001,4,'و چون روزی میآمد كه اَلْقانَه قربانی میگذرانید، به زن خود فَنِنَّه و همۀ پسران و دختران خود قسمتها میداد.','And when the time was that Elkanah offered, he gave to Peninnah his wife, and to all her sons and her daughters, portions:');
INSERT INTO verses VALUES (900100005,9001,5,'و اما به حَنّا قسمت مضاعف میداد زیرا كه حَنّا را دوست میداشت، اگر چه خداوند رَحِم او را بسته بود.','But unto Hannah he gave a worthy portion; for he loved Hannah: but the LORD had shut up her womb.');
INSERT INTO verses VALUES (900100006,9001,6,'و هئوی وی او را نیز سخت میرنجانید به حدی كه وی را خشمناك میساخت، چونكه خداوند رحم او را بسته بود.','And her adversary also provoked her sore, for to make her fret, because the LORD had shut up her womb.');
INSERT INTO verses VALUES (900100007,9001,7,'و همچنین سال به سال واقع میشد كه چون حَنّا به خانۀ خدا میآمد، فَنِنَّه همچنین او را میرنجانید و او گریه نموده، چیزی نمیخورد.','And as he did so year by year, when she went up to the house of the LORD, so she provoked her; therefore she wept, and did not eat.');
INSERT INTO verses VALUES (900100008,9001,8,'و شوهرش، اَلْقانَه، وی را میگفت: «ای حَنّا، چرا گریانی و چرا نمیخوری و دلت چرا غمگین است؟ آیا من برای تو از ده پسر بهتر نیستم؟»','Then said Elkanah her husband to her, Hannah, why weepest thou? and why eatest thou not? and why is thy heart grieved? am not I better to thee than ten sons?');
INSERT INTO verses VALUES (900100009,9001,9,'و بعد از اكل و شرب نمودنِ ایشان در شیلوه، حَنّا برخاست و عیلی كاهن بر كرسی خود نزدستونی در هیكل خدا نشسته بود.','So Hannah rose up after they had eaten in Shiloh, and after they had drunk. Now Eli the priest sat upon a seat by a post of the temple of the LORD.');
INSERT INTO verses VALUES (900100010,9001,10,'و او به تلخی جان نزد خداوند دعا كرد، و زارزار بگریست.','And she was in bitterness of soul, and prayed unto the LORD, and wept sore.');
INSERT INTO verses VALUES (900100011,9001,11,'و نذر كرده، گفت: «ای یهُوَه صبایوت اگر فی الواقع به مصیبت كنیز خود نظر كرده، مرا بیاد آوری و كنیزك خود را فراموش نكرده، اولاد ذكوری به كنیز خود عطا فرمایی، او را تمامی ایام عُمْرش به خداوند خواهم داد، و اُسْتُرَه بر سرش نخواهد آمد.»','And she vowed a vow, and said, O LORD of hosts, if thou wilt indeed look on the affliction of thine handmaid, and remember me, and not forget thine handmaid, but wilt give unto thine handmaid a man child, then I will give him unto the LORD all the days of his life, and there shall no razor come upon his head.');
INSERT INTO verses VALUES (900100012,9001,12,'و چون دعای خود را به حضور خداوند طول داد، عیلی دهن او را ملاحظه كرد.','And it came to pass, as she continued praying before the LORD, that Eli marked her mouth.');
INSERT INTO verses VALUES (900100013,9001,13,'و حَنّا در دل خود سخن میگفت، و لبهایش فقط، متحرك بود و آوازش مسموع نمیشد، و عیلی گمان برد كه مست است.','Now Hannah, she spake in her heart; only her lips moved, but her voice was not heard: therefore Eli thought she had been drunken.');
INSERT INTO verses VALUES (900100014,9001,14,'پس عیلی وی را گفت: «تا به كی مست میشوی؟ شرابت را از خود دور كن.»','And Eli said unto her, How long wilt thou be drunken? put away thy wine from thee.');
INSERT INTO verses VALUES (900100015,9001,15,'و حَنّا در جواب گفت: «نی آقایم، بلكه زن شكسته روح هستم، و شراب و مسكرات ننوشیده ام، بلكه جان خود را به حضور خداوند ریخته ام.','And Hannah answered and said, No, my lord, I am a woman of a sorrowful spirit: I have drunk neither wine nor strong drink, but have poured out my soul before the LORD.');
INSERT INTO verses VALUES (900100016,9001,16,'كنیز خود را از دختران بَلِیعال مشمار، زیرا كه از كثرت غم و رنجیدگی خود تا بحال میگفتم.»','Count not thine handmaid for a daughter of Belial: for out of the abundance of my complaint and grief have I spoken hitherto.');
INSERT INTO verses VALUES (900100017,9001,17,'عیلی در جواب گفت: «به سلامتی برو و خدای اسرائیل مسألتی را كه از او طلب نمودی، تو را عطا فرماید.»','Then Eli answered and said, Go in peace: and the God of Israel grant thee thy petition that thou hast asked of him.');
INSERT INTO verses VALUES (900100018,9001,18,'گفت: «كنیزت در نظرت التفات یابد.» پس آن زن راه خود را پیش گرفت و میخورد و دیگر ترشرو نبود.','And she said, Let thine handmaid find grace in thy sight. So the woman went her way, and did eat, and her countenance was no more sad.');
INSERT INTO verses VALUES (900100019,9001,19,'و ایشان بامدادان برخاسته، به حضور خداوند عبادت كردند و برگشته، به خانۀ خویش به رامه آمدند.و اَلْقانَه زن خود حَنّا را بشناخت و خداوند او را به یاد آورد.','And they rose up in the morning early, and worshipped before the LORD, and returned, and came to their house to Ramah: and Elkanah knew Hannah his wife; and the LORD remembered her.');
INSERT INTO verses VALUES (900100020,9001,20,'و بعد از مرور ایام حَنّا حامله شده، پسری زایید و او را سموئیل نام نهاد، زیرا گفت: «او را از خداوند سؤال نمودم.»','Wherefore it came to pass, when the time was come about after Hannah had conceived, that she bare a son, and called his name Samuel , saying, Because I have asked him of the LORD.');
INSERT INTO verses VALUES (900100021,9001,21,'و شوهرش اَلْقانَه با تمامی اهل خانه اش رفت تا قربانی سالیانه و نذر خود را نزد خداوند بگذراند.','And the man Elkanah , and all his house, went up to offer unto the LORD the yearly sacrifice, and his vow.');
INSERT INTO verses VALUES (900100022,9001,22,'و حَنّا نرفت زیرا كه به شوهر خود گفته بود تا پسر از شیر باز داشته نشود، نمی آیم، آنگاه او را خواهم آورد و به حضور خداوند حاضر شده، آنجا دائماً خواهد ماند.','But Hannah went not up; for she said unto her husband, I will not go up until the child be weaned, and then I will bring him, that he may appear before the LORD, and there abide for ever.');
INSERT INTO verses VALUES (900100023,9001,23,'شوهرش اَلْقانَه وی را گفت: «آنچه در نظرت پسند آید، بكن، تا وقت باز داشتنش از شیر بمان؛ لیكن خداوند كلام خود را استوار نماید.» پس آن زن ماند و تا وقت بازداشتن پسر خود از شیر، او را شیر میداد.','And Elkanah her husband said unto her, Do what seemeth thee good; tarry until thou have weaned him; only the LORD establish his word. So the woman abode, and gave her son suck until she weaned him.');
INSERT INTO verses VALUES (900100024,9001,24,'و چون او را از شیر باز داشته بود، وی را با سه گاو و یك ایفۀ آرد و یك مشك شراب با خود آورده، به خانۀ خداوند در شیلوه رسانید و آن پسر كوچك بود.','And when she had weaned him, she took him up with her, with three bullocks, and one ephah of flour, and a bottle of wine, and brought him unto the house of the LORD in Shiloh: and the child was young.');
INSERT INTO verses VALUES (900100025,9001,25,'و گاو را ذبح نمودند، و پسر را نزد عیلی آوردند.','And they slew a bullock, and brought the child to Eli.');
INSERT INTO verses VALUES (900100026,9001,26,'و حَنّا گفت: «عرض میكنم ای آقایم! جانت زنده باد ای آقایم! من آن زن هستم كه در اینجا نزد تو ایستاده، از خداوند مسألت نمودم.','And she said, Oh my lord, as thy soul liveth, my lord, I am the woman that stood by thee here, praying unto the LORD.');
INSERT INTO verses VALUES (900100027,9001,27,'برای این پسر مسألت نمودم و خداوند مسألت مرا كه از او طلب نموده بودم، به من عطا فرموده است.','For this child I prayed; and the LORD hath given me my petition which I asked of him:');
INSERT INTO verses VALUES (900100028,9001,28,'و من نیز او را برای خداوند وقف نمودم؛ تمام ایامی كه زنده باشد وقف خداوند خواهد بود.» پس در آنجا خداوندرا عبادت نمودند.','Therefore also I have lent him to the LORD; as long as he liveth he shall be lent to the LORD. And he worshipped the LORD there.');
id INTEGER PRIMARY KEY,
book_id INTEGER NOT NULL,
chapter_number INTEGER NOT NULL,
audio_local TEXT,
audio_online_fa TEXT,
audio_online_en TEXT
);
id INTEGER PRIMARY KEY,
chapter_id INTEGER NOT NULL,
verse_number INTEGER NOT NULL,
text_fa TEXT,
text_en TEXT
);
INSERT INTO chapters VALUES (10001,10,1,NULL,'http://audio1.wordfree.net/bibles/app/audio/20/10/1.mp3','http://audio1.wordfree.net/bibles/app/audio/20/10/1.mp3');
INSERT INTO verses VALUES (1000100001,10001,1,'span class="verse" id="1">1 </span و بعد از وفات‌ شاؤل‌ و مراجعت‌ داود از مقاتلۀ عَمالَقَه‌، واقع‌ شد كه‌ داود دو روز در صِقْلَغ‌ توقف‌ نمود.','span class="verse" id="1">1 </span Now it came to pass after the death of Saul , when David was returned from the slaughter of the Amalekites, and David had abode two days in Ziklag;');
INSERT INTO verses VALUES (1000100002,10001,2,'و در روز سوم‌ ناگاه‌ شخصی‌ از نزد شاؤل‌ با لباس‌ دریده‌ و خاك‌ بر سرش‌ ریخته‌ از لشكر آمد، و چون‌ نزد داود رسید، به‌ زمین‌ افتاده‌، تعظیم‌ نمود.','It came even to pass on the third day, that, behold, a man came out of the camp from Saul with his clothes rent, and earth upon his head: and so it was, when he came to David , that he fell to the earth, and did obeisance.');
INSERT INTO verses VALUES (1000100003,10001,3,'و داود وی‌ را گفت‌: «از كجا آمدی‌؟» او در جواب‌ وی‌ گفت‌: «از لشكر اسرائیل‌ فرار كرده‌ام‌.»','And David said unto him, From whence comest thou? And he said unto him, Out of the camp of Israel am I escaped.');
INSERT INTO verses VALUES (1000100004,10001,4,'داود وی‌ را گفت‌: «مرا خبر بده‌ كه‌ كار چگونه‌ شده‌ است‌.» او گفت‌: «قوم‌ از جنگ‌ فرار كردند و بسیاری‌ از قوم‌ نیز افتادند و مُردند، و هم‌ شاؤل‌ و پسرش‌، یوناتان‌، مُردند.»','And David said unto him, How went the matter? I pray thee, tell me. And he answered, That the people are fled from the battle, and many of the people also are fallen and dead; and Saul and Jonathan his son are dead also.');
INSERT INTO verses VALUES (1000100005,10001,5,'پس‌ داود به‌ جوانی‌ كه‌ او را مخبر ساخته‌ بود، گفت‌: «چگونه‌ دانستی‌ كه‌ شاؤل‌ و پسرش‌ یوناتان‌ مرده‌اند.»','And David said unto the young man that told him, How knowest thou that Saul and Jonathan his son be dead?');
INSERT INTO verses VALUES (1000100006,10001,6,'و جوانی‌ كه‌ او را مخبر ساخته‌ بود، گفت‌: «اتفاقاً مرا در كوه‌ جِلْبُوع‌ گذر افتاد و اینك‌ شاؤل‌ بر نیزه‌ خود تكیه‌ می‌نمود، و اینك‌ ارابه‌ها و سوارانْ او را به‌ سختی‌ تعاقب‌ می‌كردند.','And the young man that told him said, As I happened by chance upon mount Gilboa, behold, Saul leaned upon his spear; and, lo, the chariots and horsemen followed hard after him.');
INSERT INTO verses VALUES (1000100007,10001,7,'و به‌ عقب‌ نگریسته‌، مرا دید و مرا خواند و جواب‌ دادم‌، لبّیك‌.','And when he looked behind him, he saw me, and called unto me. And I answered, Here am I.');
INSERT INTO verses VALUES (1000100008,10001,8,'او مرا گفت‌: تو كیستی‌؟ وی‌ را گفتم‌: عمالیقی‌ هستم‌.','And he said unto me, Who art thou? And I answered him, I am an Amalekite.');
INSERT INTO verses VALUES (1000100009,10001,9,'او به‌ من‌ گفت‌: تمنّا اینكه‌ بر من‌ بایستی‌ و مرا بكشی‌ زیرا كه‌ پریشانی‌ مرا در گرفته‌ است‌ چونكه‌ تمام‌ جانم‌ تا بحال‌ در من‌ است‌.','He said unto me again, Stand, I pray thee, upon me, and slay me: for anguish is come upon me, because my life is yet whole in me.');
INSERT INTO verses VALUES (1000100010,10001,10,'پس‌ بر او ایستاده‌، او را كُشتم‌ زیرا دانستم‌ كه‌ بعد از افتادنش‌ زنده‌ نخواهد ماند و تاجی‌ كه‌ بر سرش‌ و بازوبندی‌ كه‌ بر بازویش‌ بود، گرفته‌، آنهارا اینجا نزد آقایم‌ آوردم‌.»','So I stood upon him, and slew him, because I was sure that he could not live after that he was fallen: and I took the crown that was upon his head, and the bracelet that was on his arm, and have brought them hither unto my lord.');
INSERT INTO verses VALUES (1000100011,10001,11,'آنگاه‌ داود جامۀ خود را گرفته‌، آن‌ را درید و تمامی‌ كسانی‌ كه‌ همراهش‌ بودند، چنین‌ كردند.','Then David took hold on his clothes, and rent them; and likewise all the men that were with him:');
INSERT INTO verses VALUES (1000100012,10001,12,'و برای‌ شاؤل‌ و پسرش‌، یوناتان‌، و برای‌ قوم‌ خداوند و خاندان‌ اسرائیل‌ ماتم‌ گرفتند و گریه‌ كردند، و تا شام‌ روزه‌ داشتند، زیرا كه‌ به‌ دم‌ شمشیر افتاده‌ بودند.','And they mourned, and wept, and fasted until even, for Saul , and for Jonathan his son, and for the people of the LORD, and for the house of Israel ; because they were fallen by the sword.');
INSERT INTO verses VALUES (1000100013,10001,13,'و داود به‌ جوانی‌ كه‌ او را مخبر ساخت‌، گفت‌: «تو از كجا هستی‌؟» او گفت‌: «من‌ پسر مرد غریب‌ عمالیقی‌ هستم‌.»','And David said unto the young man that told him, Whence art thou? And he answered, I am the son of a stranger, an Amalekite.');
INSERT INTO verses VALUES (1000100014,10001,14,'داود وی‌ را گفت‌: «چگونه‌ نترسیدی‌ كه‌ دست‌ خود را بلند كرده‌، مسیح‌ خداوند را هلاك‌ ساختی‌؟»','And David said unto him, How wast thou not afraid to stretch forth thine hand to destroy the LORD''s anointed?');
INSERT INTO verses VALUES (1000100015,10001,15,'آنگاه‌ داود یكی‌ از خادمان‌ خود را طلبیده‌، گفت‌: «نزدیك‌ آمده‌، او را بكش‌.» پس‌ او را زد كه‌ مرد.','And David called one of the young men, and said, Go near, and fall upon him. And he smote him that he died.');
INSERT INTO verses VALUES (1000100016,10001,16,'و داود او راگفت‌: «خونت‌ بر سر خودت‌ باشد زیرا كه‌ دهانت‌ بر تو شهادت‌ داده‌، گفت‌ كه‌ من‌ مسیح‌ خداوند را كشتم‌.»','And David said unto him, Thy blood be upon thy head; for thy mouth hath testified against thee, saying, I have slain the LORD''s anointed.');
INSERT INTO verses VALUES (1000100017,10001,17,'و داود این‌ مرثیه‌ را دربارۀ شاؤل‌ و پسرش‌ یوناتان‌ انشا كرد.','And David lamented with this lamentation over Saul and over Jonathan his son:');
INSERT INTO verses VALUES (1000100018,10001,18,'و امر فرمود كه‌ نشید قوس‌ را به‌ بنی‌یهودا تعلیم‌ دهند. اینك‌ در سِفْر یاشَر مكتوب‌ است‌:','(Also he bade them teach the children of Judah the use of the bow: behold, it is written in the book of Jasher.)');
INSERT INTO verses VALUES (1000100019,10001,19,'« زیبایی‌ تو ای‌ اسرائیل‌ در مكانهای‌ بلندت‌ كشته‌ شد. جباران‌ چگونه‌ افتادند!','The beauty of Israel is slain upon thy high places: how are the mighty fallen!');
INSERT INTO verses VALUES (1000100020,10001,20,'در جَتّ اطلاع‌ ندهید و در كوچه‌های‌ اَشْقَلُون‌ خبر مرسانید، مبادا دختران‌ فلسطینیان‌ شادی كنند. و مبادا دختران‌ نامختونان‌ وجد نمایند.','Tell it not in Gath, publish it not in the streets of Askelon; lest the daughters of the Philistines rejoice, lest the daughters of the uncircumcised triumph.');
INSERT INTO verses VALUES (1000100021,10001,21,'ای‌ كوههای‌ جِلْبُوع‌، شبنم‌ و باران‌ بر شما نبارد، و نه‌ از كشتزارهایت‌ هدایا بشود، زیرا در آنجا سپر جباران‌ دور انداخته‌ شد، سپر شاؤل‌ كه‌ گویا به‌ روغن‌ مسح‌ نشده‌ بود.','Ye mountains of Gilboa, let there be no dew, neither let there be rain, upon you, nor fields of offerings: for there the shield of the mighty is vilely cast away, the shield of Saul , as though he had not been anointed with oil.');
INSERT INTO verses VALUES (1000100022,10001,22,'از خون‌ كشتگان‌ و از پیه‌ جباران‌، كَمان‌ یوناتان‌ برنگردید و شمشیر شاؤل‌ تهی‌ برنگشت‌.','From the blood of the slain, from the fat of the mighty, the bow of Jonathan turned not back, and the sword of Saul returned not empty.');
INSERT INTO verses VALUES (1000100023,10001,23,'شاؤل‌ و یوناتان‌ در حیات‌ خویش‌ محبوب‌ نازنین‌ بودند، و در موت‌ خود از یكدیگر جدا نشدند. از عقابها تیزپرتر و از شیران‌ تواناتر بودند.','Saul and Jonathan were lovely and pleasant in their lives, and in their death they were not divided: they were swifter than eagles, they were stronger than lions.');
INSERT INTO verses VALUES (1000100024,10001,24,'ای‌ دختران‌ اسرائیل‌ برای‌ شاؤل‌ گریه‌ كنید كه‌ شما را به‌ قرمز و نفایس‌ ملبس‌ می‌ساخت‌ و زیورهای‌ طلا بر لباس‌ شما می‌گذاشت‌.','Ye daughters of Israel , weep over Saul , who clothed you in scarlet, with other delights, who put on ornaments of gold upon your apparel.');
INSERT INTO verses VALUES (1000100025,10001,25,'شجاعان‌ در معرض‌ جنگ‌ چگونه‌ افتادند! ای‌ یوناتان‌ بر مكان‌های‌ بلند خود كُشته‌ شدی‌.','How are the mighty fallen in the midst of the battle! O Jonathan, thou wast slain in thine high places.');
INSERT INTO verses VALUES (1000100026,10001,26,'ای‌ برادر من‌ یوناتان‌ برای‌ تو دلتنگ‌ شده‌ام‌. برای‌ من‌ بسیار نازنین‌ بودی‌. محبت‌ تو با من‌ عجیب‌تر از محبت‌ زنان‌ بود.','I am distressed for thee, my brother Jonathan: very pleasant hast thou been unto me: thy love to me was wonderful, passing the love of women.');
INSERT INTO verses VALUES (1000100027,10001,27,'جبّاران‌ چگونه‌ افتادند و چگونه‌ اسلحۀ جنگ‌ تلف‌ شد!»','How are the mighty fallen, and the weapons of war perished!');
id INTEGER PRIMARY KEY,
book_id INTEGER NOT NULL,
chapter_number INTEGER NOT NULL,
audio_local TEXT,
audio_online_fa TEXT,
audio_online_en TEXT
);
id INTEGER PRIMARY KEY,
chapter_id INTEGER NOT NULL,
verse_number INTEGER NOT NULL,
text_fa TEXT,
text_en TEXT
);
INSERT INTO chapters VALUES (11001,11,1,NULL,'http://audio1.wordfree.net/bibles/app/audio/20/11/1.mp3','http://audio1.wordfree.net/bibles/app/audio/20/11/1.mp3');
INSERT INTO verses VALUES (1100100001,11001,1,'span class="verse" id="1">1 </span و داود پادشاه‌ پیر و سالخورده‌ شده‌، هر چند او را به‌ لباس‌ می‌پوشانیدند، لیكن‌ گرم‌ نمی‌شد.','span class="verse" id="1">1 </span Now king David was old and stricken in years; and they covered him with clothes, but he gat no heat.');
INSERT INTO verses VALUES (1100100002,11001,2,'و خادمانش‌ وی‌ را گفتند: «به‌ جهت‌ آقای‌ ما، پادشاه‌، باكره‌ای‌ جوان‌ بطلبند تا به‌ حضور پادشاه‌ بایستد و او را پرستاری‌ نماید، و در آغوش‌ تو بخوابد تا آقای‌ ما، پادشاه‌، گرم‌ بشود.»','Wherefore his servants said unto him, Let there be sought for my lord the king a young virgin: and let her stand before the king, and let her cherish him, and let her lie in thy bosom, that my lord the king may get heat.');
INSERT INTO verses VALUES (1100100003,11001,3,'پس‌ در تمامی‌ حدود اسرائیل‌ دختری‌ نیكو منظر طلبیدند و اَبیشَكِ شونمیه‌ را یافته‌، او را نزد پادشاه‌ آوردند.','So they sought for a fair damsel throughout all the coasts of Israel , and found Abishag a Shunammite, and brought her to the king.');
INSERT INTO verses VALUES (1100100004,11001,4,'و آن‌ دختر بسیار نیكو منظر بود و پادشاه‌ را پرستاری‌ نموده‌، او را خدمت‌ می‌كرد. امّا پادشاه‌ او را نشناخت‌.','And the damsel was very fair, and cherished the king, and ministered to him: but the king knew her not.');
INSERT INTO verses VALUES (1100100005,11001,5,'آنگاه‌ اَدُنیا پسر حَجِّیت‌، خویشتن‌ را برافراشته‌، گفت‌: «من‌ سلطنت‌ خواهم‌ نمود.» و برای‌ خود ارابه‌ها و سواران‌ و پنجاه‌ نفر را كه‌ پیش‌ روی‌ وی‌ بدوند، مهیا ساخت‌.','Then Adonijah the son of Haggith exalted himself, saying, I will be king: and he prepared him chariots and horsemen, and fifty men to run before him.');
INSERT INTO verses VALUES (1100100006,11001,6,'و پدرش‌ او را در تمامی‌ ایام‌ عمرش‌ نرنجانیده‌، و نگفته‌ بود چرا چنین‌ و چنان‌ می‌كنی‌، و او نیز بسیار خوش‌اندام‌ بود و مادرش‌ او را بعد از اَبْشالوم‌ زاییده‌ بود.','And his father had not displeased him at any time in saying, Why hast thou done so? and he also was a very goodly man; and his mother bare him after Absalom.');
INSERT INTO verses VALUES (1100100007,11001,7,'و با یوآب‌ بن‌ صَرُویه‌ و ابیاتار كاهن‌ مشورت‌ كرد و ایشان‌ اَدُنیا را اعانت‌ نمودند.','And he conferred with Joab the son of Zeruiah, and with Abiathar the priest: and they following Adonijah helped him.');
INSERT INTO verses VALUES (1100100008,11001,8,'و اما صادوق‌ كاهن‌ و بَنایاهُو ابن‌ یهُویاداع‌ و ناتان‌ نبی‌ و شِمْعِی‌ و رِیعی‌ و شجاعانی‌ كه‌ از آن‌ داود بودند، با اَدُنیا نرفتند.','But Zadok the priest, and Benaiah the son of Jehoiada, and Nathan the prophet, and Shimei, and Rei, and the mighty men which belonged to David , were not with Adonijah.');
INSERT INTO verses VALUES (1100100009,11001,9,'و اَدُنیا گوسفندان‌ و گاوان‌ و پرواریها نزد سنگ‌ زُوحَلَت‌ كه‌ به‌ جانب‌ عین‌ روجَل‌ است‌، ذبح‌نمود، و تمامی‌ برادرانش‌، پسران‌ پادشاه‌ را با جمیع‌ مردان‌ یهودا كه‌ خادمان‌ پادشاه‌ بودند، دعوت‌ نمود.','And Adonijah slew sheep and oxen and fat cattle by the stone of Zoheleth, which is by Enrogel, and called all his brethren the king''s sons, and all the men of Judah the king''s servants:');
INSERT INTO verses VALUES (1100100010,11001,10,'اما ناتان‌ نبی‌ و بَنایاهُو و شجاعان‌ و برادر خود، سلیمان‌ را دعوت‌ نكرد.','But Nathan the prophet, and Benaiah, and the mighty men, and Solomon his brother, he called not.');
INSERT INTO verses VALUES (1100100011,11001,11,'و ناتان‌ به‌ بَتْشَبَع‌، مادر سلیمان‌، عرض‌ كرده‌، گفت‌: «آیا نشنیدی‌ كه‌ اَدُنیا، پسر حَجِّیت‌، سلطنت‌ می‌كند و آقای‌ ما داود نمی‌داند.','Wherefore Nathan spake unto Bathsheba the mother of Solomon , saying, Hast thou not heard that Adonijah the son of Haggith doth reign, and David our lord knoweth it not?');
INSERT INTO verses VALUES (1100100012,11001,12,'پس‌ حال‌ بیا تو را مشورت‌ دهم‌ تا جان‌ خود و جان‌ پسرت‌، سلیمان‌ را برهانی‌.','Now therefore come, let me, I pray thee, give thee counsel, that thou mayest save thine own life, and the life of thy son Solomon .');
INSERT INTO verses VALUES (1100100013,11001,13,'برو ونزد داود پادشاه‌ داخل‌ شده‌، وی‌ را بگو كه‌ ای‌ آقایم‌ پادشاه‌، آیا تو برای‌ كنیز خود قسم‌ خورده‌، نگفتی‌ كه‌ پسر تو سلیمان‌، بعد از من‌ پادشاه‌ خواهد شد؟ و او بر كرسی من‌ خواهد نشست‌؟ پس‌ چرا اَدُنیا پادشاه‌ شده‌ است‌؟','Go and get thee in unto king David , and say unto him, Didst not thou, my lord, O king, swear unto thine handmaid, saying, Assuredly Solomon thy son shall reign after me, and he shall sit upon my throne? why then doth Adonijah reign?');
INSERT INTO verses VALUES (1100100014,11001,14,'اینك‌ وقتی‌ كه‌ تو هنوز در آنجا با پادشاه‌ سخن‌ گویی‌، من‌ نیز بعد از تو خواهم‌ آمد و كلام‌ تو را ثابت‌ خواهم‌ كرد.»','Behold, while thou yet talkest there with the king, I also will come in after thee, and confirm thy words.');
INSERT INTO verses VALUES (1100100015,11001,15,'پس‌ بَتْشَبَع‌ نزد پادشاه‌ به‌ اطاق‌ درآمد و پادشاه‌ بسیار پیر بود و اَبیشَك‌ شونمیه‌، پادشاه‌ را خدمت‌ می‌نمود.','And Bathsheba went in unto the king into the chamber: and the king was very old; and Abishag the Shunammite ministered unto the king.');
INSERT INTO verses VALUES (1100100016,11001,16,'و بَتْشَبَع‌ خم‌ شده‌، پادشاه‌ را تعظیم‌ نمود و پادشاه‌ گفت‌: «تو را چه‌ شده‌ است‌؟»','And Bathsheba bowed, and did obeisance unto the king. And the king said, What wouldest thou?');
INSERT INTO verses VALUES (1100100017,11001,17,'او وی‌ را گفت‌: «ای‌ آقایم‌ تو برای‌ كنیز خود به‌ یهُوَه‌ خدای‌ خویش‌ قسم‌ خوردی‌ كه‌ پسر تو، سلیمان‌ بعد از من‌ پادشاه‌ خواهد شد و او بر كرسی‌ من‌ خواهد نشست‌.','And she said unto him, My lord, thou swarest by the LORD thy God unto thine handmaid, saying, Assuredly Solomon thy son shall reign after me, and he shall sit upon my throne.');
INSERT INTO verses VALUES (1100100018,11001,18,'و حال‌ اینك‌ اَدُنیا پادشاه‌ شده‌ است‌ و آقایم‌ پادشاه‌ اطلاع‌ ندارد.','And now, behold, Adonijah reigneth; and now, my lord the king, thou knowest it not:');
INSERT INTO verses VALUES (1100100019,11001,19,'و گاوان‌ و پرواریها و گوسفندان‌ بسیار ذبح‌كرده‌، همۀ پسران‌ پادشاه‌ و ابیاتار كاهن‌ و یوآب‌، سردار لشكر را دعوت‌ كرده‌، اما بنده‌ات‌ سلیمان‌ را دعوت‌ ننموده‌ است‌.','And he hath slain oxen and fat cattle and sheep in abundance, and hath called all the sons of the king, and Abiathar the priest, and Joab the captain of the host: but Solomon thy servant hath he not called.');
INSERT INTO verses VALUES (1100100020,11001,20,'و اما ای‌ آقایم‌ پادشاه‌، چشمان‌ تمامی‌ اسرائیل‌ به‌ سوی‌ توست‌ تا ایشان‌ را خبر دهی‌ كه‌ بعد از آقایم‌، پادشاه‌، كیست‌ كه‌ بر كرسی‌ وی‌ خواهد نشست‌.','And thou, my lord, O king, the eyes of all Israel are upon thee, that thou shouldest tell them who shall sit on the throne of my lord the king after him.');
INSERT INTO verses VALUES (1100100021,11001,21,'والاّ واقع‌ خواهد شد هنگامی‌ كه‌ آقایم‌ پادشاه‌ با پدران‌ خویش‌ بخوابد كه‌ من‌ و پسرم‌ سلیمان‌ مقصّر خواهیم‌ بود.»','Otherwise it shall come to pass, when my lord the king shall sleep with his fathers, that I and my son Solomon shall be counted offenders.');
INSERT INTO verses VALUES (1100100022,11001,22,'و اینك‌ چون‌ او هنوز با پادشاه‌ سخن‌ می‌گفت‌، ناتان‌ نبی‌ نیز داخل‌ شد.','And, lo, while she yet talked with the king, Nathan the prophet also came in.');
INSERT INTO verses VALUES (1100100023,11001,23,'و پادشاه‌ را خبر داده‌، گفتند كه‌ «اینك‌ ناتان‌ نبی‌ است‌.» و او به‌ حضور پادشاه‌ درآمده‌، رو به‌ زمین‌ خم‌ شده‌، پادشاه‌ را تعظیم‌ نمود.','And they told the king, saying, Behold Nathan the prophet. And when he was come in before the king, he bowed himself before the king with his face to the ground.');
INSERT INTO verses VALUES (1100100024,11001,24,'و ناتان‌ گفت‌: «ای‌ آقایم‌ پادشاه‌، آیا تو گفته‌ای‌ كه‌ اَدُنیا بعد از من‌ پادشاه‌ خواهد شد و او بر كرسی‌ من‌ خواهد نشست‌؟','And Nathan said, My lord, O king, hast thou said, Adonijah shall reign after me, and he shall sit upon my throne?');
INSERT INTO verses VALUES (1100100025,11001,25,'زیرا كه‌ امروز او روانه‌ شده‌، گاوان‌ و پرواریها و گوسفندان‌ بسیار ذبح‌ نموده‌، و همۀ پسران‌ پادشاه‌ و سرداران‌ لشكر و ابیاتار كاهن‌ را دعوت‌ كرده‌ است‌، و اینك‌ ایشان‌ به‌ حضورش‌ به‌ اكل‌ و شرب‌ مشغولند و می‌گویند اَدُنیای‌ پادشاه‌ زنده‌ بماند.','For he is gone down this day, and hath slain oxen and fat cattle and sheep in abundance, and hath called all the king''s sons, and the captains of the host, and Abiathar the priest; and, behold, they eat and drink before him, and say, God save king Adonijah.');
INSERT INTO verses VALUES (1100100026,11001,26,'لیكن‌ بنده‌ات‌ مرا و صادوق‌ كاهن‌ و بَنایاهُو ابن‌ یهُویاداع‌ و بنده‌ات‌، سلیمان‌ را دعوت‌ نكرده‌ است‌.','But me, even me thy servant, and Zadok the priest, and Benaiah the son of Jehoiada, and thy servant Solomon , hath he not called.');
INSERT INTO verses VALUES (1100100027,11001,27,'آیا این‌ كار از جانب‌ آقایم‌، پادشاه‌ شده‌ و آیا به‌ بنده‌ات‌ خبر ندادی‌ كه‌ بعد از آقایم‌، پادشاه‌ كیست‌ كه‌ بر كرسی‌ وی‌ بنشیند؟»','Is this thing done by my lord the king, and thou hast not shewed it unto thy servant, who should sit on the throne of my lord the king after him?');
INSERT INTO verses VALUES (1100100028,11001,28,'و داود پادشاه‌ در جواب‌ گفت‌: «بَتْشَبَع‌ را نزد من‌ بخوانید.» پس‌ او به‌ حضور پادشاه‌ درآمد و به‌ حضور پادشاه‌ ایستاد.','Then king David answered and said, Call me Bathsheba. And she came into the king''s presence, and stood before the king.');
INSERT INTO verses VALUES (1100100029,11001,29,'و پادشاه‌ سوگند خورده‌، گفت‌: «قسم‌ به‌ حیات‌ خداوند كه‌ جان‌ مرااز تمام‌ تنگیها رهانیده‌ است‌،','And the king sware, and said, As the LORD liveth, that hath redeemed my soul out of all distress,');
INSERT INTO verses VALUES (1100100030,11001,30,'چنانكه‌ برای‌ تو، به‌ یهُوَه‌ خدای‌ اسرائیل‌، قسم‌ خورده‌، گفتم‌ كه‌ پسر تو، سلیمان‌ بعد از من‌ پادشاه‌ خواهد شد، و او به‌ جای‌ من‌ بر كرسی‌ من‌ خواهد نشست‌، به‌ همان‌ طور امروز به‌ عمل‌ خواهم‌ آورد.»','Even as I sware unto thee by the LORD God of Israel , saying, Assuredly Solomon thy son shall reign after me, and he shall sit upon my throne in my stead; even so will I certainly do this day.');
INSERT INTO verses VALUES (1100100031,11001,31,'و بَتْشَبَع‌ رو به‌ زمین‌ خم‌ شده‌، پادشاه‌ را تعظیم‌ نمود و گفت‌: «آقایم‌، داودِ پادشاه‌ تا به‌ ابد زنده‌ بماند!»','Then Bathsheba bowed with her face to the earth, and did reverence to the king, and said, Let my lord king David live for ever.');
INSERT INTO verses VALUES (1100100032,11001,32,'و داود پادشاه‌ گفت‌: «صادوق‌ كاهن‌ و ناتان‌ نبی‌ و بَنایاهُو بن‌ یهُویاداع‌ را نزد من‌ بخوانید.» پس‌ ایشان‌ به‌ حضور پادشاه‌ داخل‌ شدند.','And king David said, Call me Zadok the priest, and Nathan the prophet, and Benaiah the son of Jehoiada. And they came before the king.');
INSERT INTO verses VALUES (1100100033,11001,33,'و پادشاه‌ به‌ ایشان‌ گفت‌: «بندگان‌ آقای‌ خویش‌ را همراه‌ خود بردارید و پسرم‌، سلیمان‌ را بر قاطر من‌ سوار نموده‌، او را به‌ جِیحُون‌ ببرید.','The king also said unto them, Take with you the servants of your lord, and cause Solomon my son to ride upon mine own mule, and bring him down to Gihon :');
INSERT INTO verses VALUES (1100100034,11001,34,'و صادوق‌ كاهن‌ و ناتان‌ نبی‌ او را در آنجا به‌ پادشاهی‌ اسرائیل‌ مسح‌ نمایند و كَرِنّا را نواخته‌، بگویید: سلیمان‌ پادشاه‌ زنده‌ بماند!','And let Zadok the priest and Nathan the prophet anoint him there king over Israel : and blow ye with the trumpet, and say, God save king Solomon .');
INSERT INTO verses VALUES (1100100035,11001,35,'و شما در عقب‌ وی‌ برآیید تا او داخل‌ شده‌، بر كرسی‌ من‌ بنشیند و او به‌ جای‌ من‌ پادشاه‌ خواهد شد، و او را مأمور فرمودم‌ كه‌ بر اسرائیل‌ و بر یهودا پیشوا باشد.»','Then ye shall come up after him, that he may come and sit upon my throne; for he shall be king in my stead: and I have appointed him to be ruler over Israel and over Judah .');
INSERT INTO verses VALUES (1100100036,11001,36,'و بَنایاهُو ابن‌ یهُویاداع‌ در جواب‌ پادشاه‌ گفت‌: «آمین‌! یهُوَه‌، خدای‌ آقایم‌، پادشاه‌ نیز چنین‌ بگوید.','And Benaiah the son of Jehoiada answered the king, and said, Amen: the LORD God of my lord the king say so too.');
INSERT INTO verses VALUES (1100100037,11001,37,'چنانكه‌ خداوند با آقایم‌، پادشاه‌ بوده‌ است‌، همچنین‌ با سلیمان‌ نیز باشد، و كرسی‌ وی‌ را از كرسی‌ آقایم‌ داودِ پادشاه‌ عظیم‌تر گرداند.»','As the LORD hath been with my lord the king, even so be he with Solomon , and make his throne greater than the throne of my lord king David .');
INSERT INTO verses VALUES (1100100038,11001,38,'و صادوق‌ كاهن‌ و ناتان‌ نبی‌ و بَنایاهُو ابن‌ یهُویاداع‌ و كریتیان‌ و فلیتیان‌ رفته‌، سلیمان‌ را بر قاطرِ داودِ پادشاه‌ سوار كردند و او را به‌ جِیحُون‌ آوردند.','So Zadok the priest, and Nathan the prophet, and Benaiah the son of Jehoiada, and the Cherethites, and the Pelethites, went down, and caused Solomon to ride upon king David ''s mule, and brought him to Gihon .');
INSERT INTO verses VALUES (1100100039,11001,39,'و صادوق‌ كاهن‌، حُقّه‌ روغن‌ را از خیمه‌ گرفته‌، سلیمان‌ را مسح‌ كرد و چون‌ كَرِنّا را نواختند تمامی‌ قوم‌ گفتند: «سلیمان‌ پادشاه‌ زنده‌ بماند.»','And Zadok the priest took an horn of oil out of the tabernacle, and anointed Solomon . And they blew the trumpet; and all the people said, God save king Solomon .');
INSERT INTO verses VALUES (1100100040,11001,40,'و تمامی‌ قوم‌ در عقب‌ وی‌ برآمدند و قوم‌ نای‌ نواختند و به‌ فرح‌ عظیم‌ شادی‌ نمودند، به‌حدی‌ كه‌ زمین‌ از آواز ایشان‌ منشق‌ می‌شد.','And all the people came up after him, and the people piped with pipes, and rejoiced with great joy, so that the earth rent with the sound of them.');
INSERT INTO verses VALUES (1100100041,11001,41,'و اَدُنیا و تمامی‌ دعوت‌ شدگانی‌ كه‌ با او بودند، چون‌ از خوردن‌ فراغت‌ یافتند، این‌ را شنیدند و چون‌ یوآب‌ آواز كَرِنّا را شنید، گفت‌: «چیست‌ این‌ صدای‌ اضطراب‌ در شهر؟»','And Adonijah and all the guests that were with him heard it as they had made an end of eating. And when Joab heard the sound of the trumpet, he said, Wherefore is this noise of the city being in an uproar?');
INSERT INTO verses VALUES (1100100042,11001,42,'و چون‌ او هنوز سخن‌ می‌گفت‌، اینك‌ یوناتان‌ بن‌ ابیاتارِ كاهن‌ رسید و اَدُنیا گفت‌: «بیا زیرا كه‌ تو مرد شجاع‌ هستی‌ و خبر نیكو می‌آوری‌.»','And while he yet spake, behold, Jonathan the son of Abiathar the priest came; and Adonijah said unto him, Come in; for thou art a valiant man, and bringest good tidings.');
INSERT INTO verses VALUES (1100100043,11001,43,'یوناتان‌ در جواب‌ اَدُنیا گفت‌: «به‌ درستی‌ كه‌ آقای‌ ما، داودِ پادشاه‌، سلیمان‌ را پادشاه‌ ساخته‌ است‌.','And Jonathan answered and said to Adonijah, Verily our lord king David hath made Solomon king.');
INSERT INTO verses VALUES (1100100044,11001,44,'و پادشاه‌، صادوق‌ كاهن‌ و ناتان‌ نبی‌ و بَنایاهُو ابن‌ یهُویاداع‌ و كَرِیتیان‌ و فِلِیتیان‌ را با او فرستاده‌، او را بر قاطر پادشاه‌ سوار كرده‌اند.','And the king hath sent with him Zadok the priest, and Nathan the prophet, and Benaiah the son of Jehoiada, and the Cherethites, and the Pelethites, and they have caused him to ride upon the king''s mule:');
INSERT INTO verses VALUES (1100100045,11001,45,'و صادوق‌ كاهن‌ و ناتان‌ نبی‌، او را در جِیحُون‌ به‌ پادشاهی‌ مسح‌ كرده‌اند و از آنجا شادی‌ كنان‌ برآمدند، چنانكه‌ شهر به‌ آشوب‌ درآمد. و این‌ است‌ صدایی‌ كه‌ شنیدید.','And Zadok the priest and Nathan the prophet have anointed him king in Gihon : and they are come up from thence rejoicing, so that the city rang again. This is the noise that ye have heard.');
INSERT INTO verses VALUES (1100100046,11001,46,'و سلیمان‌ نیز بر كرسی‌ سلطنت‌ جلوس‌ نموده‌ است‌.','And also Solomon sitteth on the throne of the kingdom.');
INSERT INTO verses VALUES (1100100047,11001,47,'و ایضاً بندگان‌ پادشاه‌ به‌ جهت‌ تهنیت‌ آقای‌ ما، داودِ پادشاه‌ آمده‌، گفتند: خدای‌ تو اسم‌ سلیمان‌ را از اسم‌ تو افضل‌ و كرسی‌ او را از كرسی‌ تو اعظم‌ گرداند. و پادشاه‌ بر بستر خود سجده‌ نمود.','And moreover the king''s servants came to bless our lord king David , saying, God make the name of Solomon better than thy name, and make his throne greater than thy throne. And the king bowed himself upon the bed.');
INSERT INTO verses VALUES (1100100048,11001,48,'و پادشاه‌ نیز چنین‌ گفت‌: متبارك‌ باد یهُوَه‌، خدای‌ اسرائیل‌، كه‌ امروز كسی‌ را كه‌ بر كرسی‌ من‌ بنشیند، به‌ من‌ داده‌ است‌ و چشمان‌ من‌، این‌ را می‌بیند.»','And also thus said the king, Blessed be the LORD God of Israel , which hath given one to sit on my throne this day, mine eyes even seeing it.');
INSERT INTO verses VALUES (1100100049,11001,49,'آنگاه‌ تمامی‌ مهمانان‌ اَدُنیا ترسان‌ شده‌، برخاستند و هركس‌ به‌ راه‌ خود رفت‌.','And all the guests that were with Adonijah were afraid, and rose up, and went every man his way.');
INSERT INTO verses VALUES (1100100050,11001,50,'و اَدُنیا از سلیمان‌ ترسان‌ شده‌، برخاست‌ و روانه‌ شده‌، شاخهای‌ مذبح‌ را گرفت‌.','And Adonijah feared because of Solomon , and arose, and went, and caught hold on the horns of the altar.');
INSERT INTO verses VALUES (1100100051,11001,51,'و سلیمان‌ را خبر داده‌، گفتند كه‌ «اینك‌ اَدُنیا از سلیمان‌ پادشاه‌می‌ترسد و شاخهای‌ مذبح‌ را گرفته‌، می‌گوید كه‌ سلیمان‌ پادشاه‌ امروز برای‌ من‌ قسم‌ بخورد كه‌ بندۀ خود را به‌ شمشیر نخواهد كُشت‌.»','And it was told Solomon , saying, Behold, Adonijah feareth king Solomon : for, lo, he hath caught hold on the horns of the altar, saying, Let king Solomon swear unto me to day that he will not slay his servant with the sword.');
INSERT INTO verses VALUES (1100100052,11001,52,'و سلیمان‌ گفت‌: «اگر مرد صالح‌ باشد، یكی‌ از مویهایش‌ بر زمین‌ نخواهد افتاد، اما اگر بدی‌ در او یافت‌ شود، خواهد مُرد.»','And Solomon said, If he will shew himself a worthy man, there shall not an hair of him fall to the earth: but if wickedness shall be found in him, he shall die.');
INSERT INTO verses VALUES (1100100053,11001,53,'و سلیمان‌ پادشاه‌ فرستاد تا او را از نزد مذبح‌ آوردند و او آمده‌، سلیمان‌ پادشاه‌ را تعظیم‌ نمود و سلیمان‌ گفت‌: «به‌ خانۀ خود برو.»','So king Solomon sent, and they brought him down from the altar. And he came and bowed himself to king Solomon : and Solomon said unto him, Go to thine house.');
id INTEGER PRIMARY KEY,
book_id INTEGER NOT NULL,
chapter_number INTEGER NOT NULL,
audio_local TEXT,
audio_online_fa TEXT,
audio_online_en TEXT
);
id INTEGER PRIMARY KEY,
chapter_id INTEGER NOT NULL,
verse_number INTEGER NOT NULL,
text_fa TEXT,
text_en TEXT
);
INSERT INTO chapters VALUES (12001,12,1,NULL,'http://audio1.wordfree.net/bibles/app/audio/20/12/1.mp3','http://audio1.wordfree.net/bibles/app/audio/20/12/1.mp3');
INSERT INTO verses VALUES (1200100001,12001,1,'span class="verse" id="1">1 </span و بعد از وفات‌ اَخاب‌، موآب‌ بر اسرائیل‌عاصی‌ شدند.','span class="verse" id="1">1 </span Then Moab rebelled against Israel after the death of Ahab.');
INSERT INTO verses VALUES (1200100002,12001,2,'و اَخَزْیا از پنجرۀ بالاخانۀ خود كه‌ در سامره‌ بود افتاده‌، بیمار شد. پس‌ رسولان‌ را روانه‌ نموده‌، به‌ ایشان‌ گفت‌: «نزد بَعْل‌ زَبُوب‌، خدای‌ عَقْرُون‌ رفته‌، بپرسید كه‌ آیا از این‌ مرض‌ شفا خواهم‌ یافت‌؟»','And Ahaziah fell down through a lattice in his upper chamber that was in Samaria , and was sick: and he sent messengers, and said unto them, Go, enquire of Baalzebub the god of Ekron whether I shall recover of this disease.');
INSERT INTO verses VALUES (1200100003,12001,3,'و فرشتۀ خداوند به‌ ایلیای‌ تِشْبی‌ گفت‌: «برخیز و به‌ ملاقاتِ رسولانِ پادشاهِ سامره‌ برآمده‌، به‌ ایشان‌ بگو كه‌ آیا از این‌ جهت‌ كه‌ خدایی‌ در اسرائیل‌ نیست‌، شما برای‌ سؤال‌ نمودن‌ از بَعْل‌ زَبُوب‌، خدای‌ عَقْرُون‌ می‌روید؟','But the angel of the LORD said to Elijah the Tishbite, Arise, go up to meet the messengers of the king of Samaria , and say unto them, Is it not because there is not a God in Israel , that ye go to enquire of Baalzebub the god of Ekron?');
INSERT INTO verses VALUES (1200100004,12001,4,'پس‌ خداوند چنین‌ می‌گوید: از بستری‌ كه‌ بر آن‌ برآمدی‌، فرود نخواهی‌ شد بلكه‌ البته‌ خواهی‌ مرد.»','Now therefore thus saith the LORD, Thou shalt not come down from that bed on which thou art gone up, but shalt surely die. And Elijah departed.');
INSERT INTO verses VALUES (1200100005,12001,5,'و ایلیا رفت‌ و رسولان‌ نزد وی‌ برگشتند و او به‌ ایشان‌ گفت‌: «چرا برگشتید؟»','And when the messengers turned back unto him, he said unto them, Why are ye now turned back?');
INSERT INTO verses VALUES (1200100006,12001,6,'ایشان‌ در جواب‌ وی‌ گفتند: «شخصی‌ به‌ ملاقات‌ ما برآمده‌، ما را گفت‌: بروید و نزد پادشاهی‌ كه‌ شما را فرستاده‌ است‌، مراجعت‌ كرده‌، او را گویید: خداوند چنین‌ می‌فرماید: آیا از این‌ جهت‌ كه‌ خدایی‌ در اسرائیل‌ نیست‌، تو برای‌ سؤال‌ نمودن‌ از بَعْل‌ زَبُوب‌، خدای‌ عَقْرُون‌ می‌فرستی‌؟ بنابراین‌ از بستری‌ كه‌ به‌ آن‌ برآمدی‌، فرود نخواهی‌ شد بلكه‌ البته‌ خواهی‌ مُرد.»','And they said unto him, There came a man up to meet us, and said unto us, Go, turn again unto the king that sent you, and say unto him, Thus saith the LORD, Is it not because there is not a God in Israel , that thou sendest to enquire of Baalzebub the god of Ekron? therefore thou shalt not come down from that bed on which thou art gone up, but shalt surely die.');
INSERT INTO verses VALUES (1200100007,12001,7,'او به‌ ایشان‌ گفت‌: «هیأت‌ شخصی‌ كه‌ به‌ ملاقات‌ شما برآمد و این‌سخنان‌ را به‌ شما گفت‌ چگونه‌ بود؟»','And he said unto them, What manner of man was he which came up to meet you, and told you these words?');
INSERT INTO verses VALUES (1200100008,12001,8,'ایشان‌ او را جواب‌ دادند: «مرد موی‌دار بود و كمربند چرمی‌ بر كمرش‌ بسته‌ بود.» او گفت‌: «ایلیای‌ تِشْبی‌ است‌.»','And they answered him, He was an hairy man, and girt with a girdle of leather about his loins. And he said, It is Elijah the Tishbite.');
INSERT INTO verses VALUES (1200100009,12001,9,'آنگاه‌ سردار پنجاهه‌ را با پنجاه‌ نفرش‌ نزد وی‌ فرستاد و او نزد وی‌ آمد در حالتی‌ كه‌ او بر قلۀ كوه‌ نشسته‌ بود و به‌ وی‌ عرض‌ كرد كه‌ «ای‌ مرد خدا، پادشاه‌ می‌گوید به‌ زیر آی‌؟»','Then the king sent unto him a captain of fifty with his fifty. And he went up to him: and, behold, he sat on the top of an hill. And he spake unto him, Thou man of God, the king hath said, Come down.');
INSERT INTO verses VALUES (1200100010,12001,10,'ایلیا در جواب‌ سردار پنجاهه‌ گفت‌: «اگر من‌ مرد خدا هستم‌، آتش‌ از آسمان‌ نازل‌ شده‌، تو را و پنجاه‌ نفرت‌ را بسوزاند.» پس‌ آتش‌ از آسمان‌ نازل‌ شده‌، او را و پنجاه‌ نفرش‌ را بسوخت‌.','And Elijah answered and said to the captain of fifty, If I be a man of God, then let fire come down from heaven, and consume thee and thy fifty. And there came down fire from heaven, and consumed him and his fifty.');
INSERT INTO verses VALUES (1200100011,12001,11,'و باز سردار پنجاهۀ دیگر را با پنجاه‌ نفرش‌ نزد وی‌ فرستاد و او وی‌ را خطاب‌ كرده‌، گفت‌: «ای‌ مرد خدا، پادشاه‌ چنین‌ می‌فرماید كه‌ به‌ زودی‌ به‌ زیر آی‌؟»','Again also he sent unto him another captain of fifty with his fifty. And he answered and said unto him, O man of God, thus hath the king said, Come down quickly.');
INSERT INTO verses VALUES (1200100012,12001,12,'ایلیا در جواب‌ ایشان‌ گفت‌: «اگر من‌ مرد خدا هستم‌، آتش‌ از آسمان‌ نازل‌ شده‌، تو را و پنجاه‌ نفرت‌ را بسوزاند.» پس‌ آتش‌ خدا از آسمان‌ نازل‌ شده‌، او را و پنجاه‌ نفرش‌ را بسوخت‌.','And Elijah answered and said unto them, If I be a man of God, let fire come down from heaven, and consume thee and thy fifty. And the fire of God came down from heaven, and consumed him and his fifty.');
INSERT INTO verses VALUES (1200100013,12001,13,'پس‌ سردار پنجاهۀ سوم‌ را با پنجاه‌ نفرش‌ فرستاد و سردار پنجاهۀ سوم‌ آمده‌، نزد ایلیا به‌ زانو درآمد و از او التماس‌ نموده‌، گفت‌ كه‌ «ای‌ مرد خدا، تمنّا اینكه‌ جان‌ من‌ و جان‌ این‌ پنجاه‌ نفر بندگانت‌ در نظر تو عزیز باشد.','And he sent again a captain of the third fifty with his fifty. And the third captain of fifty went up, and came and fell on his knees before Elijah , and besought him, and said unto him, O man of God, I pray thee, let my life, and the life of these fifty thy servants, be precious in thy sight.');
INSERT INTO verses VALUES (1200100014,12001,14,'اینك‌ آتش‌ از آسمان‌ نازل‌ شده‌، آن‌ دو سردار پنجاهۀ اول‌ را باپنجاهه‌های‌ ایشان‌ سوزانید؛ اما الا´ن‌ جان‌ من‌ در نظر تو عزیز باشد.»','Behold, there came fire down from heaven, and burnt up the two captains of the former fifties with their fifties: therefore let my life now be precious in thy sight.');
INSERT INTO verses VALUES (1200100015,12001,15,'و فرشتۀ خداوند به‌ ایلیا گفت‌: «همراه‌ او به‌ زیر آی‌ و از او مترس‌.» پس‌ برخاسته‌، همراه‌ وی‌ نزد پادشاه‌ فرود شد.','And the angel of the LORD said unto Elijah , Go down with him: be not afraid of him. And he arose, and went down with him unto the king.');
INSERT INTO verses VALUES (1200100016,12001,16,'و وی‌ را گفت‌: « خداوند چنین‌ می‌گوید: چونكه‌ رسولان‌ فرستادی‌ تا از بَعْل‌ زَبُوب‌، خدای‌ عَقْرُون‌ سؤال‌ نمایند، آیا از این‌ سبب‌ بود كه‌ در اسرائیل‌ خدایی‌ نبود كه‌ از كلام‌ او سؤال‌ نمایی‌؟ بنابراین‌ از بستری‌ كه‌ به‌ آن‌ برآمدی‌، فرود نخواهی‌ شد البته‌ خواهی‌ مرد.»','And he said unto him, Thus saith the LORD, Forasmuch as thou hast sent messengers to enquire of Baalzebub the god of Ekron, is it not because there is no God in Israel to enquire of his word? therefore thou shalt not come down off that bed on which thou art gone up, but shalt surely die.');
INSERT INTO verses VALUES (1200100017,12001,17,'پس‌ او موافق‌ كلامی‌ كه‌ خداوند به‌ ایلیا گفته‌ بود، مرد و یهُورام‌ در سال‌ دوم‌ یهُورام‌ بن‌ یهُوشافاط‌، پادشاه‌ یهودا در جایش‌ پادشاه‌ شد، زیرا كه‌ او را پسری‌ نبود.','So he died according to the word of the LORD which Elijah had spoken. And Jehoram reigned in his stead in the second year of Jehoram the son of Jehoshaphat king of Judah ; because he had no son.');
INSERT INTO verses VALUES (1200100018,12001,18,'و بقیۀ اعمال‌ اَخَزْیا كه‌ كرد، آیا در كتابِ تواریخِ ایامِ پادشاهانِ اسرائیل‌ مكتوب‌ نیست‌؟','Now the rest of the acts of Ahaziah which he did, are they not written in the book of the chronicles of the kings of Israel ?');
id INTEGER PRIMARY KEY,
book_id INTEGER NOT NULL,
chapter_number INTEGER NOT NULL,
audio_local TEXT,
audio_online_fa TEXT,
audio_online_en TEXT
);
id INTEGER PRIMARY KEY,
chapter_id INTEGER NOT NULL,
verse_number INTEGER NOT NULL,
text_fa TEXT,
text_en TEXT
);
INSERT INTO chapters VALUES (13001,13,1,NULL,'http://audio1.wordfree.net/bibles/app/audio/20/13/1.mp3','http://audio1.wordfree.net/bibles/app/audio/20/13/1.mp3');
INSERT INTO verses VALUES (1300100001,13001,1,'span class="verse" id="1">1 </span آدم‌، شِیث‌ اَنُوش‌،','span class="verse" id="1">1 </span Adam , Sheth, Enosh ,');
INSERT INTO verses VALUES (1300100002,13001,2,'قِینان‌ مهْلَلْئِیلْ یارَدْ،','Kenan, Mahalaleel , Jered,');
INSERT INTO verses VALUES (1300100003,13001,3,'خَنُوخْ مَتُوشالَحْ لَمَكْ،','Henoch, Methuselah , Lamech ,');
INSERT INTO verses VALUES (1300100004,13001,4,'نُوحْ سامْ حامْ یافَثْ.','Noah , Shem , Ham , and Japheth .');
INSERT INTO verses VALUES (1300100005,13001,5,'پسران‌ یافَثْ: جُومَر و ماجُوج‌ و مادای‌ و یاوان‌ و تُوبال‌ و ماشَكْ و تیراس‌.','The sons of Japheth ; Gomer , and Magog , and Madai , and Javan , and Tubal , and Meshech , and Tiras .');
INSERT INTO verses VALUES (1300100006,13001,6,'و پسران‌ جُومَر: اَشْكَناز و ریفات‌ و تُجَرْمَه‌.','And the sons of Gomer ; Ashchenaz, and Riphath , and Togarmah .');
INSERT INTO verses VALUES (1300100007,13001,7,'و پسران‌ یاوان‌: اَلِیشَه‌ و تَرْشِیش‌ و كتیم‌ و دُودانِیم‌.','And the sons of Javan ; Elishah , and Tarshish , Kittim , and Dodanim .');
INSERT INTO verses VALUES (1300100008,13001,8,'و پسران‌ حامْ: كوش‌ و مِصْرایم‌ و فُوت‌ و كَنْعان‌.','The sons of Ham ; Cush, and Mizraim , Put, and Canaan .');
INSERT INTO verses VALUES (1300100009,13001,9,'و پسران‌ كوش‌: سَبا و حَویلَه‌ و سبتا و رَعْما و سَبْتَكا. و پسران‌ رَعْما: شَبا و دَدان‌.','And the sons of Cush; Seba , and Havilah , and Sabta, and Raamah, and Sabtecha. And the sons of Raamah; Sheba , and Dedan .');
INSERT INTO verses VALUES (1300100010,13001,10,'و كوش‌، نِمْرود را آورد، و او به‌ جبار شدن‌ در جهان‌ شروع‌ نمود.','And Cush begat Nimrod : he began to be mighty upon the earth.');
INSERT INTO verses VALUES (1300100011,13001,11,'و مِصْرایم‌، لُودیم‌ و عَنَامیم‌ و لَهابیم‌ و نَفْتُوحیم‌ را آورد،','And Mizraim begat Ludim, and Anamim, and Lehabim, and Naphtuhim,');
INSERT INTO verses VALUES (1300100012,13001,12,'و فَتْروسیم‌ و كَسْلُوحیم‌ را كه‌ فَلَسْتیم‌ و كَفْتوریم‌ از ایشان‌ پدید آمدند.','And Pathrusim, and Casluhim, (of whom came the Philistines,) and Caphthorim.');
INSERT INTO verses VALUES (1300100013,13001,13,'و كَنْعان‌ نخست‌زادۀ خود، صیدون‌ و حِتّ را آورد،','And Canaan begat Zidon his firstborn, and Heth ,');
INSERT INTO verses VALUES (1300100014,13001,14,'و یبُوسی‌ و اَمُوری‌ و جَرْجاشی‌،','The Jebusite also, and the Amorite, and the Girgashite,');
INSERT INTO verses VALUES (1300100015,13001,15,'و حِوّی‌ و عِرْقی‌ و سِینی‌،','And the Hivite, and the Arkite, and the Sinite,');
INSERT INTO verses VALUES (1300100016,13001,16,'و اروادی‌ و صَماری‌ و حَماتی‌ را.','And the Arvadite, and the Zemarite, and the Hamathite.');
INSERT INTO verses VALUES (1300100017,13001,17,'پسران‌ سامْ: عیلام‌ و آَشُّور و اَرْفَكْشاد و لُود و اَرام‌ و عُوص‌ و حُول‌ و جاتَر و ماشَكْ.','The sons of Shem ; Elam , and Asshur , and Arphaxad , and Lud , and Aram , and Uz , and Hul , and Gether , and Meshech .');
INSERT INTO verses VALUES (1300100018,13001,18,'و اَرْفَكْشاد، شالَح‌ را آورد و شالَح‌، عابَر را آورد.','And Arphaxad begat Shelah , and Shelah begat Eber .');
INSERT INTO verses VALUES (1300100019,13001,19,'و برای‌ عابَر، دو پسر متولد شدند كه‌ یكی‌ را فالَج‌ نام‌ بود زیرا در ایام‌ وی‌ زمین‌ منقسم‌ شد و اسم‌ برادرش‌ یقْطان‌ بود.','And unto Eber were born two sons: the name of the one was Peleg ; because in his days the earth was divided: and his brother''s name was Joktan .');
INSERT INTO verses VALUES (1300100020,13001,20,'و یقْطان‌، اَلْمُوداد و شالَف‌ و حَضَرْموت‌ و یارَح‌ را آورد؛','And Joktan begat Almodad , and Sheleph , and Hazarmaveth , and Jerah ,');
INSERT INTO verses VALUES (1300100021,13001,21,'و هَدُورام‌ و اُوزال‌ و دِقْلَه‌،','Hadoram also, and Uzal , and Diklah ,');
INSERT INTO verses VALUES (1300100022,13001,22,'و اِیبال‌ و اَبیمایل‌ و شَبا،','And Ebal , and Abimael , and Sheba ,');
INSERT INTO verses VALUES (1300100023,13001,23,'و اُوفیر و حَویلَه‌ و یوباب‌ را كه‌ جمیع‌ اینها پسران‌ یقْطان‌ بودند.','And Ophir , and Havilah , and Jobab . All these were the sons of Joktan .');
INSERT INTO verses VALUES (1300100024,13001,24,'سامْ، اَرْفَكْشاد سالَحْ،','Shem , Arphaxad , Shelah ,');
INSERT INTO verses VALUES (1300100025,13001,25,'عابَرْ فالَجْ رَعُو،','Eber , Peleg , Reu ,');
INSERT INTO verses VALUES (1300100026,13001,26,'سَروج‌ ناحُور تارَح‌،','Serug , Nahor , Terah ,');
INSERT INTO verses VALUES (1300100027,13001,27,'اَبْرام‌ كه‌ همان‌ ابراهیم‌ باشد.','Abram ; the same is Abraham .');
INSERT INTO verses VALUES (1300100028,13001,28,'پسران‌ ابراهیم‌: اسحاق‌ و اسماعیل‌.','The sons of Abraham ; Isaac , and Ishmael .');
INSERT INTO verses VALUES (1300100029,13001,29,'این‌ است‌ پیدایش‌ ایشان‌: نخستزاده‌ اسماعیل‌: نَبایوت‌ و قیدار و اَدَبْئیل‌ و مِبْسام‌،','These are their generations: The firstborn of Ishmael , Nebaioth; then Kedar , and Adbeel , and Mibsam ,');
INSERT INTO verses VALUES (1300100030,13001,30,'و مِشْماع‌ و دُوْمَه‌ و مَسّا و حَدَد و تیما،','Mishma , and Dumah , Massa , Hadad , and Tema ,');
INSERT INTO verses VALUES (1300100031,13001,31,'و یطُور و نافیش‌ و قِدْمَه‌ كه‌ اینان‌ پسران‌ اسماعیل‌ بودند.','Jetur, Naphish , and Kedemah . These are the sons of Ishmael .');
INSERT INTO verses VALUES (1300100032,13001,32,'و پسران‌ قَطُورَه‌ كه‌ مُتعه‌ ابراهیم‌ بود، پس‌ او زِمْران‌ و یقْشان‌ و مَدان‌ و مِدْیان‌ و یشْباق‌ و شُوحا را زایید و پسران‌ یقْشان‌: شَبا و دَدان‌ بودند.','Now the sons of Keturah , Abraham ''s concubine: she bare Zimran , and Jokshan , and Medan , and Midian , and Ishbak , and Shuah . And the sons of Jokshan ; Sheba , and Dedan .');
INSERT INTO verses VALUES (1300100033,13001,33,'و پسران‌ مِدْیان‌ عِیفَه‌ و عِیفَر و خَنُوح‌ و اَبیداع‌ و اَلْدَعَه‌ بودند. پس‌ جمیع‌ اینها پسران‌ قَطُورَه‌ بودند.','And the sons of Midian ; Ephah , and Epher , and Henoch, and Abida, and Eldaah . All these are the sons of Keturah .');
INSERT INTO verses VALUES (1300100034,13001,34,'و ابراهیم‌ اسحاق‌ را آورد؛ و پسران‌ اسحاق‌ عِیسُو و اسرائیل‌ بودند.','And Abraham begat Isaac . The sons of Isaac ; Esau and Israel .');
INSERT INTO verses VALUES (1300100035,13001,35,'و پسران‌ عِیسُو: اَلیفاز و رَعُوئیل‌ و یعُوش‌ و یعْلام‌ و قُوْرَح‌.','The sons of Esau ; Eliphaz , Reuel , and Jeush , and Jaalam , and Korah .');
INSERT INTO verses VALUES (1300100036,13001,36,'پسران‌ اَلیفاز: تیمان‌ و اُومار و صَفی‌ و جَعْتام‌ و قَناز و تِمْناع‌ و عَمالیق‌.','The sons of Eliphaz ; Teman , and Omar , Zephi, and Gatam , Kenaz , and Timna , and Amalek .');
INSERT INTO verses VALUES (1300100037,13001,37,'پسران‌ رَعُوئیل‌: نَحَت‌ و زارَح‌ و شَمَّه‌ و مِزَّه‌.','The sons of Reuel ; Nahath , Zerah , Shammah , and Mizzah .');
INSERT INTO verses VALUES (1300100038,13001,38,'و پسران‌ سَعِیر: لُوطان‌ و شُوبال‌ و صِبْعُون‌ و عَنَه‌ و دِیشُون‌ و اِیصر و دِیشان‌.','And the sons of Seir ; Lotan , and Shobal , and Zibeon , and Anah , and Dishon , and Ezer, and Dishan .');
INSERT INTO verses VALUES (1300100039,13001,39,'و پسران‌ لُوطان‌: حوری‌ و هُومام‌ و خواهر لُوطانْ تِمْناع‌.','And the sons of Lotan ; Hori , and Homam: and Timna was Lotan ''s sister.');
INSERT INTO verses VALUES (1300100040,13001,40,'پسران‌ شُوْبالْ: عَلْیان‌ و مَنَاحَت‌ و عِیبال‌ و شَفی‌ و اُوْنام‌ و پسران‌ صِبْعُون‌: اَیه‌ و عَنَه‌.','The sons of Shobal ; Alian, and Manahath , and Ebal , Shephi, and Onam . And the sons of Zibeon ; Aiah, and Anah .');
INSERT INTO verses VALUES (1300100041,13001,41,'و پسران‌ عَنَه‌: دیشون‌ و پسران‌ دیشون‌: حَمْران‌ و اِشْبان‌ و یتْران‌ و كَران‌.','The sons of Anah ; Dishon . And the sons of Dishon ; Amram , and Eshban , and Ithran , and Cheran .');
INSERT INTO verses VALUES (1300100042,13001,42,'پسران‌ ایصْر: بِلْهان‌ و زَعْوان‌ ویعْقان‌ و پسران‌ دیشان‌: عوُص‌ و اَران‌.','The sons of Ezer ; Bilhan , and Zavan, and Jakan. The sons of Dishan ; Uz , and Aran.');
INSERT INTO verses VALUES (1300100043,13001,43,'و پادشاهانی‌ كه‌ در زمین‌ اَدُوم‌ سلطنت‌ نمودند، پیش‌ از آنكه‌ پادشاهی‌ بر بنی‌اسرائیل‌ سلطنت‌ كند، اینانند: بالَع‌ بن‌ بَعُور و اسم‌ شهر او دِنْهابَه‌ بود.','Now these are the kings that reigned in the land of Edom before any king reigned over the children of Israel ; Bela the son of Beor : and the name of his city was Dinhabah .');
INSERT INTO verses VALUES (1300100044,13001,44,'و بالَع‌ مُرد و یوباب‌ بن‌ زارَح‌ از بُصْرَه‌ به‌ جایش‌ پادشاه‌ شد.','And when Bela was dead, Jobab the son of Zerah of Bozrah reigned in his stead.');
INSERT INTO verses VALUES (1300100045,13001,45,'و یوباب‌ مرد و حوشام‌ از زمین‌ تیمانی‌ به‌ جایش‌ سلطنت‌ نمود.','And when Jobab was dead, Husham of the land of the Temanites reigned in his stead.');
INSERT INTO verses VALUES (1300100046,13001,46,'و حُوْشام‌ مُرد و هَدَد بن‌ بَدَد كه‌ مِدْیان‌ را در زمین‌ موآب‌ شكست‌ داد در جایش‌ پادشاه‌ شد و اسم‌ شهرش‌ عَوِیت‌ بود.','And when Husham was dead, Hadad the son of Bedad , which smote Midian in the field of Moab , reigned in his stead: and the name of his city was Avith .');
INSERT INTO verses VALUES (1300100047,13001,47,'و هَدَد مُرد و سَمْلَه‌ از مَسْریقَه‌ به‌ جایش‌ پادشاه‌ شد.','And when Hadad was dead, Samlah of Masrekah reigned in his stead.');
INSERT INTO verses VALUES (1300100048,13001,48,'و سَمْلَه‌ مُرد و شاؤل‌ از رَحُوبوت‌ نهر به‌ جایش‌ پادشاه‌ شد.','And when Samlah was dead, Shaul of Rehoboth by the river reigned in his stead.');
INSERT INTO verses VALUES (1300100049,13001,49,'و شاؤل‌ مُرد و بَعْل‌ حانان‌ بن‌ عَكْبور به‌ جایش‌ پادشاه‌ شد.','And when Shaul was dead, Baalhanan the son of Achbor reigned in his stead.');
INSERT INTO verses VALUES (1300100050,13001,50,'و بَعْل‌ حانان‌ مُرد و هَدَد به‌ جایش‌ پادشاه‌ شد؛ و اسم‌ شهرش‌ فاعی‌ و اسم‌ زنش‌ مَهِیطَبئیل‌ دختر مَطْرِد دختر مَی‌ذَهَب‌ بود.','And when Baalhanan was dead, Hadad reigned in his stead: and the name of his city was Pai; and his wife''s name was Mehetabel , the daughter of Matred , the daughter of Mezahab .');
INSERT INTO verses VALUES (1300100051,13001,51,'و هَدَد مُرد و امیرانِ اَدُوم‌ امیر تِمْناع‌ و امیر اَلْیه‌ و امیر یتِیت‌ بودند؛','Hadad died also. And the dukes of Edom were; duke Timnah , duke Aliah, duke Jetheth ,');
INSERT INTO verses VALUES (1300100052,13001,52,'و اَمیرْ اَهُولِیبَامَه‌ و امیر اِیلَه‌ و امیر فِینُون‌؛','Duke Aholibamah , duke Elah , duke Pinon ,');
INSERT INTO verses VALUES (1300100053,13001,53,'و امیر قَناز و امیرِ تیمان‌ و امیر مِبْصار؛','Duke Kenaz , duke Teman , duke Mibzar ,');
INSERT INTO verses VALUES (1300100054,13001,54,'وامیر مَجْدِیئیل‌ و امیر عیرام‌؛ اینان‌ امیران‌ اَدُوم‌ بودند.','Duke Magdiel , duke Iram . These are the dukes of Edom .');
id INTEGER PRIMARY KEY,
book_id INTEGER NOT NULL,
chapter_number INTEGER NOT NULL,
audio_local TEXT,
audio_online_fa TEXT,
audio_online_en TEXT
);
id INTEGER PRIMARY KEY,
chapter_id INTEGER NOT NULL,
verse_number INTEGER NOT NULL,
text_fa TEXT,
text_en TEXT
);
INSERT INTO chapters VALUES (14001,14,1,NULL,'http://audio1.wordfree.net/bibles/app/audio/20/14/1.mp3','http://audio1.wordfree.net/bibles/app/audio/20/14/1.mp3');
INSERT INTO verses VALUES (1400100001,14001,1,'span class="verse" id="1">1 </span و سلیمان‌ پسر داود در سلطنت‌ خود قوی شد و یهُوَه‌ خدایش‌ با وی‌ می‌بود و او را عظمت‌ بسیار بخشید.','span class="verse" id="1">1 </span And Solomon the son of David was strengthened in his kingdom, and the LORD his God was with him, and magnified him exceedingly.');
INSERT INTO verses VALUES (1400100002,14001,2,'و سلیمان‌ تمامی اسرائیل‌ و سرداران‌ هزاره‌ و صده‌ و داوران‌ و هر رئیسی‌ را كه‌ در تمامی اسرائیل‌ بود، از رؤسای‌ خاندانهای‌ آبا خواند،','Then Solomon spake unto all Israel , to the captains of thousands and of hundreds, and to the judges, and to every governor in all Israel , the chief of the fathers.');
INSERT INTO verses VALUES (1400100003,14001,3,'و سلیمان‌ با تمامی جماعت‌ به‌ مكان‌ بلندی‌ كه‌ در جبعون‌ بود رفتند، زیرا خیمۀ اجتماع‌ خدا كه‌ موسی‌ بندۀ خداوند آن‌ را در بیابان‌ ساخته‌ بود، در آنجا بود.','So Solomon , and all the congregation with him, went to the high place that was at Gibeon; for there was the tabernacle of the congregation of God, which Moses the servant of the LORD had made in the wilderness.');
INSERT INTO verses VALUES (1400100004,14001,4,'لیكن‌ داود تابوت‌ خدا را از قریه‌ یعاریم‌ به‌ جایی‌ كه‌ داود برایش‌ مهیا كرده‌ بود، بالا آورد و خیمه‌ای‌ برایش‌ در اورشلیم‌ برپا نمود.','But the ark of God had David brought up from Kirjathjearim to the place which David had prepared for it: for he had pitched a tent for it at Jerusalem .');
INSERT INTO verses VALUES (1400100005,14001,5,'و مذبح‌ برنجینی‌ كه‌ بصلئیل‌ بن‌اوری‌ ابن‌ حور ساخته‌ بود، در آنجا پیش‌ مسكن‌ خداوند ماند و سلیمان‌ و جماعت‌ نزد آن‌ مسألت‌ نمودند.','Moreover the brasen altar, that Bezaleel the son of Uri , the son of Hur , had made, he put before the tabernacle of the LORD: and Solomon and the congregation sought unto it.');
INSERT INTO verses VALUES (1400100006,14001,6,'پس‌ سلیمان‌ به‌ آنجا نزد مذبح‌ برنجینی‌ كه‌ در خیمۀ اجتماع‌ بود، به‌ حضور خداوند برآمده‌، هزار قربانی سوختنی‌ بر آن‌ گذرانید.','And Solomon went up thither to the brasen altar before the LORD, which was at the tabernacle of the congregation, and offered a thousand burnt offerings upon it.');
INSERT INTO verses VALUES (1400100007,14001,7,'در همان‌ شب‌ خدا به‌ سلیمان‌ ظاهر شد و او را گفت‌: «آنچه‌ را كه‌ به‌ تو بدهم‌ طلب‌ نما.»','In that night did God appear unto Solomon , and said unto him, Ask what I shall give thee.');
INSERT INTO verses VALUES (1400100008,14001,8,'سلیمان‌ به‌ خدا گفت‌: «تو به‌ پدرم‌ داود احسان‌ عظیم‌ نمودی‌ و مرا به‌ جای‌ او پادشاه‌ ساختی‌.','And Solomon said unto God, Thou hast shewed great mercy unto David my father, and hast made me to reign in his stead.');
INSERT INTO verses VALUES (1400100009,14001,9,'حال‌ ای‌ یهُوَه‌ خدا به‌ وعدۀ خود كه‌ به‌ پدرم‌ داود دادی‌ وفا نما زیرا كه‌ تو مرا بر قومی‌ كه‌ مثل‌ غبارزمین‌ كثیرند پادشاه‌ ساختی‌.','Now, O LORD God, let thy promise unto David my father be established: for thou hast made me king over a people like the dust of the earth in multitude.');
INSERT INTO verses VALUES (1400100010,14001,10,'الا´ن‌ حكمت‌ و معرفت‌ را به‌ من‌ عطا فرما تا به‌ حضور این‌ قوم‌ خروج‌ و دخول‌ نمایم‌ زیرا كیست‌ كه‌ این‌ قوم‌ عظیم‌ تو را داوری‌ تواند نمود؟»','Give me now wisdom and knowledge, that I may go out and come in before this people: for who can judge this thy people, that is so great?');
INSERT INTO verses VALUES (1400100011,14001,11,'خدا به‌ سلیمان‌ گفت‌: «چونكه‌ این‌ در خاطر تو بود و دولت‌ و توانگری‌ و حشمت‌ و جان‌ دشمنانت‌ را نطلبیدی‌ و نیز طول‌ ایام‌ را نخواستی‌، بلكه‌ به‌ جهت‌ خود حكمت‌ و معرفت‌ را درخواست‌ كردی‌ تا بر قوم‌ من‌ كه‌ تو را بر سلطنت‌ ایشان‌ نصب‌ نموده‌ام‌ داوری‌ نمایی‌،','And God said to Solomon , Because this was in thine heart, and thou hast not asked riches, wealth, or honour, nor the life of thine enemies, neither yet hast asked long life; but hast asked wisdom and knowledge for thyself, that thou mayest judge my people, over whom I have made thee king:');
INSERT INTO verses VALUES (1400100012,14001,12,'لهذا حكمت‌ و معرفت‌ به‌ تو بخشیده‌ شد و دولت‌ و توانگری‌ و حشمت‌ را نیز به‌ تو خواهم‌ داد كه‌ پادشاهانی‌ كه‌ قبل‌ از تو بودند مثل‌ آن‌ را نداشتند و بعد از تو نیز مثل‌ آن‌ را نخواهند داشت‌.»','Wisdom and knowledge is granted unto thee; and I will give thee riches, and wealth, and honour, such as none of the kings have had that have been before thee, neither shall there any after thee have the like.');
INSERT INTO verses VALUES (1400100013,14001,13,'پس‌ سلیمان‌ از مكان‌ بلندی‌ كه‌ در جبعون‌ بود، از حضور خیمه‌ اجتماع‌ به‌ اورشلیم‌ مراجعت‌ كرد و بر اسرائیل‌ سلطنت‌ نمود.','Then Solomon came from his journey to the high place that was at Gibeon to Jerusalem , from before the tabernacle of the congregation, and reigned over Israel .');
INSERT INTO verses VALUES (1400100014,14001,14,'و سلیمان‌ ارابه‌ها و سواران‌ جمع‌ كرده‌، هزار و چهارصد ارابه‌ و دوازده‌ هزار سوار داشت‌، و آنها را در شهرهای‌ ارابه‌ها و نزد پادشاه‌ در اورشلیم‌ گذاشت‌.','And Solomon gathered chariots and horsemen: and he had a thousand and four hundred chariots, and twelve thousand horsemen, which he placed in the chariot cities, and with the king at Jerusalem .');
INSERT INTO verses VALUES (1400100015,14001,15,'و پادشاه‌ نقره‌ و طلا را در اورشلیم‌ مثل‌ سنگها و چوب‌ سرو آزاد را مثل‌ چوب‌ افراغ‌ كه‌ در همواری‌ است‌ فراوان‌ ساخت‌.','And the king made silver and gold at Jerusalem as plenteous as stones, and cedar trees made he as the sycomore trees that are in the vale for abundance.');
INSERT INTO verses VALUES (1400100016,14001,16,'و اسبهای‌ سلیمان‌ از مصر آورده‌ می‌شد، وتاجران‌ پادشاه‌ دسته‌های‌ آنها را می‌خریدند هر دسته‌ را به‌ قیمت‌ معین‌.','And Solomon had horses brought out of Egypt , and linen yarn: the king''s merchants received the linen yarn at a price.');
INSERT INTO verses VALUES (1400100017,14001,17,'و یك‌ ارابه‌ را به‌ قیمت‌ ششصد مثقال‌ نقره‌ از مصر بیرون‌ می‌آوردند و می‌رسانیدند و یك‌ اسب‌ را به‌ قیمت‌ صد و پنجاه‌؛ و همچنین‌ برای‌ جمیع‌ پادشاهان‌ حتّیان‌ و پادشاهان‌ ارام‌ به‌ توسط‌ آنها بیرون‌ می‌آوردند.','And they fetched up, and brought forth out of Egypt a chariot for six hundred shekels of silver, and an horse for an hundred and fifty: and so brought they out horses for all the kings of the Hittites, and for the kings of Syria , by their means.');
id INTEGER PRIMARY KEY,
book_id INTEGER NOT NULL,
chapter_number INTEGER NOT NULL,
audio_local TEXT,
audio_online_fa TEXT,
audio_online_en TEXT
);
id INTEGER PRIMARY KEY,
chapter_id INTEGER NOT NULL,
verse_number INTEGER NOT NULL,
text_fa TEXT,
text_en TEXT
);
INSERT INTO chapters VALUES (15001,15,1,NULL,'http://audio1.wordfree.net/bibles/app/audio/20/15/1.mp3','http://audio1.wordfree.net/bibles/app/audio/20/15/1.mp3');
INSERT INTO verses VALUES (1500100001,15001,1,'span class="verse" id="1">1 </span و در سال‌ اوّل‌ كورش‌، پادشاه‌ فارس‌ تا كلام خداوند به‌ زبان‌ ارمیا كامل‌ شود، خداوند روح‌ كورش‌ پادشاه‌ فارس‌ را برانگیخت‌ تا در تمامی‌ ممالك‌ خود فرمانی‌ نافذ كرد و آن‌ را نیز مرقوم‌ داشت‌ و گفت‌:','span class="verse" id="1">1 </span Now in the first year of Cyrus king of Persia, that the word of the LORD by the mouth of Jeremiah might be fulfilled, the LORD stirred up the spirit of Cyrus king of Persia, that he made a proclamation throughout all his kingdom, and put it also in writing, saying,');
INSERT INTO verses VALUES (1500100002,15001,2,'«كورش‌ پادشاه‌ فارس‌ چنین‌ می‌فرماید: یهوه‌ خدای‌ آسمانها جمیع‌ ممالك‌ زمین‌ را به‌ من‌ داده‌ و مرا امر فرموده‌ است‌ كه‌ خانه‌ای‌ برای‌ وی‌ در اورشلیم‌ كه‌ در یهودا است‌ بنا نمایم‌.','Thus saith Cyrus king of Persia, The LORD God of heaven hath given me all the kingdoms of the earth; and he hath charged me to build him an house at Jerusalem , which is in Judah .');
INSERT INTO verses VALUES (1500100003,15001,3,'پس‌ كیست‌ از شما از تمامی‌ قوم‌ او كه‌ خدایش‌ با وی‌ باشد؟ او به‌ اورشلیم‌ كه‌ در یهودا است‌، برود و خانه‌ یهوه‌ را كه‌ خدای‌ اسرائیل‌ و خدای‌ حقیقی‌ است‌، در اورشلیم‌ بنا نماید.','Who is there among you of all his people? his God be with him, and let him go up to Jerusalem , which is in Judah , and build the house of the LORD God of Israel , (he is the God,) which is in Jerusalem .');
INSERT INTO verses VALUES (1500100004,15001,4,'و هر كه‌ باقی‌ مانده‌ باشد، در هر مكانی‌ از مكان‌هایی‌ كه‌ در آنها غریب‌ می‌باشد، اهل‌ آن‌ مكان‌ او را به‌ نقره‌ و طلا و اموال‌ و چهارپایان‌ علاوه‌ بر هدایای‌ تبرّعی‌ به‌ جهت‌ خانه‌ خدا كه‌ در اورشلیم‌ است‌ اعانت‌ نمایند.»','And whosoever remaineth in any place where he sojourneth, let the men of his place help him with silver, and with gold, and with goods, and with beasts, beside the freewill offering for the house of God that is in Jerusalem .');
INSERT INTO verses VALUES (1500100005,15001,5,'پس‌ رؤسای‌ آبای‌ یهودا و بنیامین‌ و كاهنان‌ و لاویان‌ با همه‌ كسانی‌ كه‌ خدا روح‌ ایشان‌ را برانگیزانیده‌ بود برخاسته‌، روانه‌ شدند تا خانه‌ خداوند را كه‌ در اورشلیم‌ است‌ بنا نمایند.','Then rose up the chief of the fathers of Judah and Benjamin , and the priests, and the Levites, with all them whose spirit God had raised, to go up to build the house of the LORD which is in Jerusalem .');
INSERT INTO verses VALUES (1500100006,15001,6,'و جمیع‌ همسایگان‌ ایشان‌، ایشان‌ را به‌ آلات‌ نقره‌ و طلا و اموال‌ و چهارپایان‌ و تحفه‌ها، علاوه‌ بر همه‌ هدایای‌ تَبَرُّعی‌ اعانت‌ كردند.','And all they that were about them strengthened their hands with vessels of silver, with gold, with goods, and with beasts, and with precious things, beside all that was willingly offered.');
INSERT INTO verses VALUES (1500100007,15001,7,'و كورش‌ پادشاه‌ ظروف‌ خانه‌ خداوند را كه‌ نبوكدنصّر آنها را ازاورشلیم‌ آورده‌ و در خانه‌ خدایان‌ خود گذاشته‌ بود، بیرون‌ آورد.','Also Cyrus the king brought forth the vessels of the house of the LORD, which Nebuchadnezzar had brought forth out of Jerusalem , and had put them in the house of his gods;');
INSERT INTO verses VALUES (1500100008,15001,8,'و كورش‌ پادشاه‌ فارس‌، آنها را از دست‌ مِتْرَدات‌، خزانه‌دار خود بیرون‌ آورده‌، به‌ شیشَبصَّر رئیس‌ یهودیان‌ شمرد.','Even those did Cyrus king of Persia bring forth by the hand of Mithredath the treasurer, and numbered them unto Sheshbazzar, the prince of Judah .');
INSERT INTO verses VALUES (1500100009,15001,9,'و عدد آنها این‌ است‌: سی‌ طاس‌ طلا و هزار طاس‌ نقره‌ و بیست‌ و نه‌ كارد،','And this is the number of them: thirty chargers of gold, a thousand chargers of silver, nine and twenty knives,');
INSERT INTO verses VALUES (1500100010,15001,10,'و سی‌ جام‌ طلا و چهارصد و ده‌ جام‌ نقره‌ از قسم‌ دوّم‌ و هزار ظرف‌ دیگر.','Thirty basons of gold, silver basons of a second sort four hundred and ten, and other vessels a thousand.');
INSERT INTO verses VALUES (1500100011,15001,11,'تمامی‌ ظروف‌ طلا و نقره‌ پنجهزار و چهارصد بود و شیشبصّر همه‌ آنها را با اسیرانی‌ كه‌ از بابل‌ به‌ اورشلیم‌ می‌رفتند برد.','All the vessels of gold and of silver were five thousand and four hundred. All these did Sheshbazzar bring up with them of the captivity that were brought up from Babylon unto Jerusalem .');
id INTEGER PRIMARY KEY,
book_id INTEGER NOT NULL,
chapter_number INTEGER NOT NULL,
audio_local TEXT,
audio_online_fa TEXT,
audio_online_en TEXT
);
id INTEGER PRIMARY KEY,
chapter_id INTEGER NOT NULL,
verse_number INTEGER NOT NULL,
text_fa TEXT,
text_en TEXT
);
INSERT INTO chapters VALUES (16001,16,1,NULL,'http://audio1.wordfree.net/bibles/app/audio/20/16/1.mp3','http://audio1.wordfree.net/bibles/app/audio/20/16/1.mp3');
INSERT INTO verses VALUES (1600100001,16001,1,'span class="verse" id="1">1 </span كلام‌ نَحَمِیا ابن‌ حَكَلْیا: در ماهِ كِسلوُ در سال‌بیستم‌، هنگامی‌ كه‌ من‌ در دارالّسلطنه‌ شوشان‌ بودم‌، واقع‌ شد','span class="verse" id="1">1 </span The words of Nehemiah the son of Hachaliah. And it came to pass in the month Chisleu, in the twentieth year, as I was in Shushan the palace,');
INSERT INTO verses VALUES (1600100002,16001,2,'كه‌ حنانی‌، یكی‌ از برادرانم‌ با كسانی‌ چند از یهودا آمدند و از ایشان‌ درباره‌ بقیه‌ یهودی‌ كه‌ از اسیری‌ باقی‌ مانده‌ بودند و درباره‌ اورشلیم‌ سؤال‌ نمودم‌.','That Hanani, one of my brethren, came, he and certain men of Judah ; and I asked them concerning the Jews that had escaped, which were left of the captivity, and concerning Jerusalem .');
INSERT INTO verses VALUES (1600100003,16001,3,'ایشان‌ مرا جواب‌ دادند: «آنانی‌ كه‌ آنجا در بلوك‌ از اسیری‌ باقی‌ مانده‌اند، در مصیبت‌ سخت‌ و افتضاح‌ می‌باشند و حصار اورشلیم‌ خراب‌ و دروازه‌هایش‌ به‌ آتش‌ سوخته‌ شده‌ است‌.»','And they said unto me, The remnant that are left of the captivity there in the province are in great affliction and reproach: the wall of Jerusalem also is broken down, and the gates thereof are burned with fire.');
INSERT INTO verses VALUES (1600100004,16001,4,'و چون‌ این‌ سخنان‌ را شنیدم‌، نشستم‌ و گریه‌ كرده‌، ایامی‌ چند ماتم‌ داشتم‌ و به‌ حضور خدای‌ آسمانها روزه‌ گرفته‌، دعا نمودم‌.','And it came to pass, when I heard these words, that I sat down and wept, and mourned certain days, and fasted, and prayed before the God of heaven,');
INSERT INTO verses VALUES (1600100005,16001,5,'و گفتم‌: «آه‌ ای‌ یهوه‌، خدای‌ آسمانها، ای‌ خدای‌ عظیم‌ و مَهیب‌ كه‌ عهد و رحمت‌ را بر آنانی‌ كه‌ تو را دوست‌ می‌دارند و اوامر تو را حفظ‌ می‌نمایند، نگاه‌ می‌داری‌،','And said, I beseech thee, O LORD God of heaven, the great and terrible God, that keepeth covenant and mercy for them that love him and observe his commandments:');
INSERT INTO verses VALUES (1600100006,16001,6,'گوشهای‌ تو متوجّه‌ و چشمانت‌ گشاده‌ شود و دعای‌ بنده‌ خود را كه‌ من‌ در این‌ وقت‌ نزد تو روز و شب‌ درباره‌ بندگانت‌ بنی‌اسرائیل‌ می‌نمایم‌، اجابت‌ فرمایی‌ و به‌ گناهان‌ بنی‌اسرائیل‌ كه‌ به‌ تو ورزیده‌ایم‌، اعتراف‌ می‌نمایم‌، زیرا كه‌ هم‌ من‌ و هم‌ خاندان‌ پدرم‌ گناه‌ كرده‌ایم‌.','Let thine ear now be attentive, and thine eyes open, that thou mayest hear the prayer of thy servant, which I pray before thee now, day and night, for the children of Israel thy servants, and confess the sins of the children of Israel , which we have sinned against thee: both I and my father''s house have sinned.');
INSERT INTO verses VALUES (1600100007,16001,7,'به‌ درستی‌ كه‌ به‌ تو مخالفت‌ عظیمی‌ ورزیده‌ایم‌ و اوامر و فرایض‌ و احكامی‌ را كه‌ به‌ بنده‌ خود موسی‌ فرموده‌ بودی‌، نگاه‌ نداشته‌ایم‌.','We have dealt very corruptly against thee, and have not kept the commandments, nor the statutes, nor the judgments, which thou commandedst thy servant Moses .');
INSERT INTO verses VALUES (1600100008,16001,8,'پس‌ حال‌، كلامی‌ را كه‌ به‌ بنده‌ خود موسی‌ امر فرمودی‌، بیاد آور كه‌ گفتی‌ شما خیانت‌ خواهید ورزید و من‌ شما را در میان‌ امّت‌ها پراكنده‌ خواهم‌ ساخت‌.','Remember, I beseech thee, the word that thou commandedst thy servant Moses , saying, If ye transgress, I will scatter you abroad among the nations:');
INSERT INTO verses VALUES (1600100009,16001,9,'اما چون‌ بسوی‌ من‌ بازگشت‌ نمایید و اوامر مرا نگاه‌ داشته‌، به‌ آنها عمل‌ نمایید، اگر چه‌ پراكندگان‌ شما در اقصای‌ آسمانها باشند، من‌ ایشان‌ را از آنجا جمع‌ خواهم‌ كرد و به‌ مكانی‌ كه‌ آن‌ را برگزیده‌ام‌ تا نام‌ خود را در آن‌ ساكن‌ سازم‌ درخواهم‌ آورد.','But if ye turn unto me, and keep my commandments, and do them; though there were of you cast out unto the uttermost part of the heaven, yet will I gather them from thence, and will bring them unto the place that I have chosen to set my name there.');
INSERT INTO verses VALUES (1600100010,16001,10,'و ایشان‌ بندگان‌ و قوم‌ تو می‌باشند كه‌ ایشان‌ را به‌ قوّت‌ عظیم‌ خود و به‌ دست‌ قوی خویش‌ فدیه‌ داده‌ای‌.','Now these are thy servants and thy people, whom thou hast redeemed by thy great power, and by thy strong hand.');
INSERT INTO verses VALUES (1600100011,16001,11,'ای‌ خداوند، گوش‌ تو بسوی‌ دعای‌ بنده‌ات‌ و دعای‌ بندگانت‌ كه‌ به‌ رغبت‌ تمام‌ از اسم‌ تو ترسان‌ می‌باشند، متوجّه‌ بشود و بنده‌ خود را امروز كامیاب‌ فرمایی‌ و او را به‌ حضور این‌ مرد مرحمت‌ عطا كنی‌.» زیرا كه‌ من‌ ساقی پادشاه‌ بودم‌.','O LORD, I beseech thee, let now thine ear be attentive to the prayer of thy servant, and to the prayer of thy servants, who desire to fear thy name: and prosper, I pray thee, thy servant this day, and grant him mercy in the sight of this man. For I was the king''s cupbearer.');
id INTEGER PRIMARY KEY,
book_id INTEGER NOT NULL,
chapter_number INTEGER NOT NULL,
audio_local TEXT,
audio_online_fa TEXT,
audio_online_en TEXT
);
id INTEGER PRIMARY KEY,
chapter_id INTEGER NOT NULL,
verse_number INTEGER NOT NULL,
text_fa TEXT,
text_en TEXT
);
INSERT INTO chapters VALUES (17001,17,1,NULL,'http://audio1.wordfree.net/bibles/app/audio/20/17/1.mp3','http://audio1.wordfree.net/bibles/app/audio/20/17/1.mp3');
INSERT INTO verses VALUES (1700100001,17001,1,'span class="verse" id="1">1 </span در ایام‌ اَخْشُورُش‌ (این‌ امور واقع‌ شد). این‌همان‌ اَخْشُورُش‌ است‌ كه‌ از هند تا حَبَش‌، بر صد و بیست‌ و هفت‌ ولایت‌ سلطنت‌ می‌كرد.','span class="verse" id="1">1 </span Now it came to pass in the days of Ahasuerus, (this is Ahasuerus which reigned, from India even unto Ethiopia , over an hundred and seven and twenty provinces:)');
INSERT INTO verses VALUES (1700100002,17001,2,'در آن‌ ایام‌ حینی‌ كه‌ اَخْشُورُش‌ پادشاه‌، بر كرسی‌ سلطنت‌ خویش‌ در دارالسّلطنه‌ شُوشَن‌ نشسته‌ بود.','That in those days, when the king Ahasuerus sat on the throne of his kingdom, which was in Shushan the palace,');
INSERT INTO verses VALUES (1700100003,17001,3,'در سال‌ سوّم‌ از سلطنت‌ خویش‌، ضیافتی‌ برای‌ جمیع‌ سروران‌ و خادمان‌ خود برپا نمود و حشمت‌ فارس‌ و مادی‌ از اُمرا و سرورانِ ولایتها، به‌ حضور او بودند.','In the third year of his reign, he made a feast unto all his princes and his servants; the power of Persia and Media, the nobles and princes of the provinces, being before him:');
INSERT INTO verses VALUES (1700100004,17001,4,'پس‌ مدّت‌ مدیدِ صد و هشتاد روز، توانگری‌ جلال‌ سلطنت‌ خویش‌ و حشمت‌ مجد عظمت‌ خود را جلوه‌ می‌داد.','When he shewed the riches of his glorious kingdom and the honour of his excellent majesty many days, even an hundred and fourscore days.');
INSERT INTO verses VALUES (1700100005,17001,5,'پس‌ بعد از انقضای‌ آنروزها، پادشاه‌ برای‌ همه‌ كسانی‌ كه‌ دردارالسّلطنه‌ شُوشَن‌ از خرد و بزرگ‌ یافت‌ شدند، ضیافت‌ هفت‌ روزه‌ در عمارت‌ باغ‌ قصر پادشاه‌ برپا نمود.','And when these days were expired, the king made a feast unto all the people that were present in Shushan the palace, both unto great and small, seven days, in the court of the garden of the king''s palace;');
INSERT INTO verses VALUES (1700100006,17001,6,'پرده‌ها از كتان‌ سفید و لاجورد، با ریسمانهای‌ سفید و ارغوان‌ در حلقه‌های‌ نقره‌ بر ستونهای‌ مَرمَرِ سفید آویخته‌ و تختهای‌ طلا و نقره‌ بر سنگفرشی‌ از سنگ‌ سماق‌ و مَرمَرِ سفید و دُرّ و مَرمَرِ سیاه‌ بود.','Where were white, green, and blue, hangings, fastened with cords of fine linen and purple to silver rings and pillars of marble: the beds were of gold and silver, upon a pavement of red, and blue, and white, and black, marble.');
INSERT INTO verses VALUES (1700100007,17001,7,'و آشامیدن‌، از ظرفهای‌ طلا بود و ظرفها را اشكال‌ مختلفه‌ بود و شرابهای‌ ملوكانه‌ برحسب‌ كرم‌ پادشاه‌ فراوان‌ بود.','And they gave them drink in vessels of gold, (the vessels being diverse one from another,) and royal wine in abundance, according to the state of the king.');
INSERT INTO verses VALUES (1700100008,17001,8,'و آشامیدن‌ برحسب‌ قانون‌ بود كه‌ كسی‌ بر كسی‌ تكلّف‌ نمی‌نمود، زیرا پادشاه‌ درباره‌ همه‌ بزرگان‌ خانه‌اش‌ چنین‌ امر فرموده‌ بود كه‌ هر كس‌موافق‌ میل‌ خود رفتار نماید.','And the drinking was according to the law; none did compel: for so the king had appointed to all the officers of his house, that they should do according to every man''s pleasure.');
INSERT INTO verses VALUES (1700100009,17001,9,'و وَشْتی مَلِكه‌ نیز ضیافتی‌ برای‌ زنان‌ خانه‌ خسروی‌ اَخْشُورُش‌ پادشاه‌ برپا نمود.','Also Vashti the queen made a feast for the women in the royal house which belonged to king Ahasuerus.');
INSERT INTO verses VALUES (1700100010,17001,10,'در روز هفتم‌، چون‌ دل‌ پادشاه‌ از شراب‌ خوش‌ شد، هفت‌ خواجه‌سرا یعنی‌ مَهُومان‌ و بِزْتا و حَرْبُونا و بِغْتا و اَبَغْتا و زاتَر و كَرْكَس‌ را كه‌ در حضور اَخْشُورُش‌ پادشاه‌ خدمت‌ می‌كردند، امر فرمود','On the seventh day, when the heart of the king was merry with wine, he commanded Mehuman, Biztha, Harbona, Bigtha, and Abagtha, Zethar, and Carcas, the seven chamberlains that served in the presence of Ahasuerus the king,');
INSERT INTO verses VALUES (1700100011,17001,11,'كه‌ وَشْتی مَلِكه‌ را با تاج‌ ملوكانه‌ به‌ حضور پادشاه‌ بیاورند تا زیبایی‌ او را به‌ خلایق‌ و سروران‌ نشان‌ دهد، زیرا كه‌ نیكو منظر بود.','To bring Vashti the queen before the king with the crown royal, to shew the people and the princes her beauty: for she was fair to look on.');
INSERT INTO verses VALUES (1700100012,17001,12,'امّا وَشْتی مَلِكه‌ نخواست‌ كه‌ برحسب‌ فرمانی‌ كه‌ پادشاه‌ به‌ دست‌ خواجه‌سرایان‌ فرستاده‌ بود بیاید. پس‌ پادشاه‌ بسیار خشمناك‌ شده‌، غضبش‌ در دلش‌ مشتعل‌ گردید.','But the queen Vashti refused to come at the king''s commandment by his chamberlains: therefore was the king very wroth, and his anger burned in him.');
INSERT INTO verses VALUES (1700100013,17001,13,'آنگاه‌ پادشاه‌ به‌ حكیمانی‌ كه‌ از زمانها مخبر بودند تكلّم‌ نموده‌، (زیرا كه‌ عادت‌ پادشاه‌ با همه‌ كسانی‌ كه‌ به‌ شریعت‌ و احكام‌ عارف‌ بودند چنین‌ بود.','Then the king said to the wise men, which knew the times, (for so was the king''s manner toward all that knew law and judgment:');
INSERT INTO verses VALUES (1700100014,17001,14,'و مقرّبان‌ او كَرْشَنا و شیتار و اَدْماتا و تَرْشیش‌ و مَرَس‌ و مَرْسَنا و مَمُوكان‌، هفت‌ رئیس‌ فارس‌ و مادی‌ بودند كه‌ روی‌ پادشاه‌ را می‌دیدند و در مملكت‌ به‌ درجه‌ اوّل‌ می‌نشستند)','And the next unto him was Carshena, Shethar, Admatha, Tarshish , Meres, Marsena, and Memucan, the seven princes of Persia and Media, which saw the king''s face, and which sat the first in the kingdom;)');
INSERT INTO verses VALUES (1700100015,17001,15,'گفت‌: «موافق‌ شریعت‌، به‌ وَشْتی مَلِكه‌ چه‌ باید كرد، چونكه‌ به‌ فرمانی‌ كه‌ اَخْشُورُش‌ پادشاه‌ به‌ دست‌ خواجه‌سرایان‌ فرستاده‌ است‌، عمل‌ ننموده‌؟»','What shall we do unto the queen Vashti according to law, because she hath not performed the commandment of the king Ahasuerus by the chamberlains?');
INSERT INTO verses VALUES (1700100016,17001,16,'آنگاه‌ مَموكان‌ به‌ حضور پادشاه‌ و سروران‌عرض‌ كرد كه‌ «وَشْتی مَلِكه‌، نه‌ تنها به‌ پادشاه‌ تقصیر نموده‌، بلكه‌ به‌ همه‌ رؤسا و جمیع‌ طوایفی‌ كه‌ در تمامی‌ ولایتهای‌ اَخْشُورُش‌ پادشاه‌ می‌باشند،','And Memucan answered before the king and the princes, Vashti the queen hath not done wrong to the king only, but also to all the princes, and to all the people that are in all the provinces of the king Ahasuerus.');
INSERT INTO verses VALUES (1700100017,17001,17,'زیرا چون‌ این‌ عمل‌ ملكه‌ نزد تمامی‌ زنان‌ شایع‌ شود، آنگاه‌ شوهرانشان‌ در نظر ایشان‌ خوار خواهند شد، حینی‌ كه‌ مخبر شوند كه‌ اَخْشُورُش‌ پادشاه‌ امر فرموده‌ است‌ كه‌ وَشْتی ملكه‌ را به‌ حضورش‌ بیاورند و نیامده‌ است‌.','For this deed of the queen shall come abroad unto all women, so that they shall despise their husbands in their eyes, when it shall be reported, The king Ahasuerus commanded Vashti the queen to be brought in before him, but she came not.');
INSERT INTO verses VALUES (1700100018,17001,18,'و در آنوقت‌، خانمهای‌ فارس‌ و مادی‌ كه‌ این‌ عمل‌ ملكه‌ را بشنوند، به‌ جمیع‌ روسای‌ پادشاه‌ چنین‌ خواهند گفت‌ و این‌ مورد بسیار احتقار و غضب‌ خواهد شد.','Likewise shall the ladies of Persia and Media say this day unto all the king''s princes, which have heard of the deed of the queen. Thus shall there arise too much contempt and wrath.');
INSERT INTO verses VALUES (1700100019,17001,19,'پس‌ اگر پادشاه‌ این‌ را مصلحت‌ داند، فرمان‌ ملوكانه‌ای‌ از حضور وی‌ صادر شود و در شرایع‌ فارس‌ و مادی‌ ثبت‌ گردد، تا تبدیل‌ نپذیرد، كه‌ وَشْتی‌ به‌ حضور اَخْشُورُش‌ پادشاه‌ دیگر نیاید و پادشاه‌ رتبه‌ ملوكانه‌ او را به‌ دیگری‌ كه‌ بهتر از او باشد بدهد.','If it please the king, let there go a royal commandment from him, and let it be written among the laws of the Persians and the Medes, that it be not altered, That Vashti come no more before king Ahasuerus; and let the king give her royal estate unto another that is better than she.');
INSERT INTO verses VALUES (1700100020,17001,20,'و چون‌ فرمانی‌ كه‌ پادشاه‌ صادر گرداند در تمامی‌ مملكت‌ عظیم‌ او مسموع‌ شود، آنگاه‌ همه‌ زنان‌ شوهران‌ خود را از بزرگ‌ و كوچك‌، احترام‌ خواهند نمود.»','And when the king''s decree which he shall make shall be published throughout all his empire, (for it is great,) all the wives shall give to their husbands honour, both to great and small.');
INSERT INTO verses VALUES (1700100021,17001,21,'و این‌ سخن‌ در نظر پادشاه‌ و رؤسا پسند آمد و پادشاه‌ موافق‌ سخن‌ مموكان‌ عمل‌ نمود.','And the saying pleased the king and the princes; and the king did according to the word of Memucan:');
INSERT INTO verses VALUES (1700100022,17001,22,'و مكتوبات‌ به‌ همه‌ ولایتهای‌ پادشاه‌ به‌ هر ولایت‌، موافق‌ خطّ آن‌ و به‌ هر قوم‌، موافق‌ زبانش‌ فرستاد تا هر مرد در خانه‌ خود مسلّط‌ شود و در زبان‌ قوم‌ خود آن‌ را بخواند.','For he sent letters into all the king''s provinces, into every province according to the writing thereof, and to every people after their language, that every man should bear rule in his own house, and that it should be published according to the language of every people.');
id INTEGER PRIMARY KEY,
book_id INTEGER NOT NULL,
chapter_number INTEGER NOT NULL,
audio_local TEXT,
audio_online_fa TEXT,
audio_online_en TEXT
);
id INTEGER PRIMARY KEY,
chapter_id INTEGER NOT NULL,
verse_number INTEGER NOT NULL,
text_fa TEXT,
text_en TEXT
);
INSERT INTO chapters VALUES (18001,18,1,NULL,'http://audio1.wordfree.net/bibles/app/audio/20/18/1.mp3','http://audio1.wordfree.net/bibles/app/audio/20/18/1.mp3');
INSERT INTO verses VALUES (1800100001,18001,1,'span class="verse" id="1">1 </span در زمین‌ عُوص‌، مردی‌ بود كه‌ ایوب‌ نام‌داشت‌؛ و آن‌ مرد كامل‌ و راست‌ و خداترس‌ بود و از بدی‌ اجتناب‌ می‌نمود.','span class="verse" id="1">1 </span There was a man in the land of Uz , whose name was Job ; and that man was perfect and upright, and one that feared God, and eschewed evil.');
INSERT INTO verses VALUES (1800100002,18001,2,'و برای‌ او، هفت‌ پسر و سه‌ دختر زاییده‌ شدند.','And there were born unto him seven sons and three daughters.');
INSERT INTO verses VALUES (1800100003,18001,3,'و اموال‌ او هفت‌ هزار گوسفند و سه‌ هزار شتر و پانصد جفت‌ گاو و پانصد الاغ‌ ماده‌ بود و نوكران‌ بسیار كثیر داشت‌ و آن‌ مرد از تمامی‌ بنی‌ مشرق‌ بزرگتر بود.','His substance also was seven thousand sheep, and three thousand camels, and five hundred yoke of oxen, and five hundred she asses, and a very great household; so that this man was the greatest of all the men of the east.');
INSERT INTO verses VALUES (1800100004,18001,4,'و پسرانش‌ می‌رفتند و در خانه‌ هر یكی‌ از ایشان‌، در روزش‌ مهمانی‌ می‌كردند و فرستاده‌، سه‌ خواهر خود را دعوت‌ می‌نمودند تا با ایشان‌ اكل‌ و شرب‌ بنمایند.','And his sons went and feasted in their houses, every one his day; and sent and called for their three sisters to eat and to drink with them.');
INSERT INTO verses VALUES (1800100005,18001,5,'و واقع‌ می‌شد كه‌ چون‌ دوره‌ روزهای‌ مهمانی‌ ایشان‌ بسر می‌رفت‌، ایوب‌ فرستاده‌، ایشان‌ را تقدیس‌ می‌نمود و بامدادان‌ برخاسته‌، قربانی‌های‌ سوختنی‌، به‌ شماره‌ همه‌ ایشان‌ می‌گذرانید، زیرا ایوب‌ می‌گفت‌: «شاید پسران‌ من‌ گناه‌ كرده‌، خدا را در دل‌ خود ترك‌ نموده‌ باشند» و ایوب‌ همیشه‌ چنین‌ می‌كرد.','And it was so, when the days of their feasting were gone about, that Job sent and sanctified them, and rose up early in the morning, and offered burnt offerings according to the number of them all: for Job said, It may be that my sons have sinned, and cursed God in their hearts. Thus did Job continually.');
INSERT INTO verses VALUES (1800100006,18001,6,'و روزی‌ واقع‌ شد كه‌ پسران‌ خدا آمدند تا به‌ حضور خداوند حاضر شوند؛ و شیطان‌ نیز در میان‌ ایشان‌ آمد.','Now there was a day when the sons of God came to present themselves before the LORD, and Satan came also among them.');
INSERT INTO verses VALUES (1800100007,18001,7,'و خداوند به‌ شیطان‌ گفت‌: «از كجا آمدی‌؟» شیطان‌ در جواب‌ خداوند گفت‌: «از تردّد كردن‌ در زمین‌ و سیر كردن‌ در آن‌.»','And the LORD said unto Satan , Whence comest thou? Then Satan answered the LORD, and said, From going to and fro in the earth, and from walking up and down in it.');
INSERT INTO verses VALUES (1800100008,18001,8,'خداوند به‌ شیطان‌ گفت‌: «آیا در بنده‌ من‌ ایوب‌تفكّر كردی‌ كه‌ مثل‌ او در زمین‌ نیست‌؟ مرد كامل‌ و راست‌ و خداترس‌ كه‌ از گناه‌ اجتناب‌ می‌كند!»','And the LORD said unto Satan , Hast thou considered my servant Job , that there is none like him in the earth, a perfect and an upright man, one that feareth God, and escheweth evil?');
INSERT INTO verses VALUES (1800100009,18001,9,'شیطان‌ در جواب‌ خداوند گفت‌: «آیا ایوب‌ مجّاناً از خدا می‌ترسد؟','Then Satan answered the LORD, and said, Doth Job fear God for nought?');
INSERT INTO verses VALUES (1800100010,18001,10,'آیا تو گِرْد او و گِرْد خانه‌ او و گِرْد همه‌ اموال‌ او، به‌ هر طرف‌ حصار نكشیدی‌ و اعمال‌ دست‌ او را بركت‌ ندادی‌ و مواشی‌ او در زمین‌ منتشر نشد؟','Hast not thou made an hedge about him, and about his house, and about all that he hath on every side? thou hast blessed the work of his hands, and his substance is increased in the land.');
INSERT INTO verses VALUES (1800100011,18001,11,'لیكن‌ الا´ن‌ دست‌ خود را دراز كن‌ و تمامی مایملك‌ او را لمس‌ نما و پیش‌ روی‌ تو، تو را ترك‌ خواهد نمود.»','But put forth thine hand now, and touch all that he hath, and he will curse thee to thy face.');
INSERT INTO verses VALUES (1800100012,18001,12,'خداوند به‌ شیطان‌ گفت‌: «اینك‌ همه‌ اموالش‌ در دست‌ تو است‌؛ لیكن‌ دستت‌ را بر خود او دراز مكن‌.» پس‌ شیطان‌ از حضور خداوند بیرون‌ رفت‌.','And the LORD said unto Satan , Behold, all that he hath is in thy power; only upon himself put not forth thine hand. So Satan went forth from the presence of the LORD.');
INSERT INTO verses VALUES (1800100013,18001,13,'و روزی‌ واقع‌ شد كه‌ پسران‌ و دخترانش‌ در خانه‌ برادر بزرگ‌ خود می‌خوردند و شراب‌ می‌نوشیدند.','And there was a day when his sons and his daughters were eating and drinking wine in their eldest brother''s house:');
INSERT INTO verses VALUES (1800100014,18001,14,'و رسولی‌ نزد ایوب‌ آمده‌، گفت‌: «گاوان‌ شیار می‌كردند و ماده‌ الاغان‌ نزد آنها می‌چریدند.','And there came a messenger unto Job , and said, The oxen were plowing, and the asses feeding beside them:');
INSERT INTO verses VALUES (1800100015,18001,15,'و سابیان‌ بر آنها حمله‌ آورده‌، بردند و جوانان‌ را به‌ دم‌ شمشیر كشتند و من‌ به‌ تنهایی‌ رهایی‌ یافتم‌ تا تو را خبر دهم‌.»','And the Sabeans fell upon them, and took them away; yea, they have slain the servants with the edge of the sword; and I only am escaped alone to tell thee.');
INSERT INTO verses VALUES (1800100016,18001,16,'و او هنوز سخن‌ می‌گفت‌ كه‌ دیگری‌ آمده‌، گفت‌: «آتش‌ خدا از آسمان‌ افتاد و گله‌ و جوانان‌ را سوزانیده‌، آنها را هلاك‌ ساخت‌ و من‌ به‌ تنهایی‌ رهایی‌ یافتم‌ تا تو را خبر دهم‌.»','While he was yet speaking, there came also another, and said, The fire of God is fallen from heaven, and hath burned up the sheep, and the servants, and consumed them; and I only am escaped alone to tell thee.');
INSERT INTO verses VALUES (1800100017,18001,17,'و او هنوز سخن‌ می‌گفت‌ كه‌ دیگری‌ آمده‌، گفت‌: «كلدانیان‌ سه‌ فرقه‌ شدند و بر شتران‌ هجوم‌ آورده‌، آنها رابردند و جوانان‌ را به‌ دم‌ شمشیر كشتند و من‌ به‌ تنهایی‌ رهایی‌ یافتم‌ تا تو را خبر دهم‌.»','While he was yet speaking, there came also another, and said, The Chaldeans made out three bands, and fell upon the camels, and have carried them away, yea, and slain the servants with the edge of the sword; and I only am escaped alone to tell thee.');
INSERT INTO verses VALUES (1800100018,18001,18,'و او هنوز سخن‌ می‌گفت‌ كه‌ دیگری‌ آمده‌، گفت‌: «پسران‌ و دخترانت‌ در خانه‌ برادر بزرگ‌ خود می‌خوردند و شراب‌ می‌نوشیدند','While he was yet speaking, there came also another, and said, Thy sons and thy daughters were eating and drinking wine in their eldest brother''s house:');
INSERT INTO verses VALUES (1800100019,18001,19,'كه‌ اینك‌ باد شدیدی‌ از طرف‌ بیابان‌ آمده‌، چهار گوشه‌ خانه‌ را زد و بر جوانان‌ افتاد كه‌ مردند و من‌ به‌ تنهایی‌ رهایی‌ یافتم‌ تا تو را خبر دهم‌.»','And, behold, there came a great wind from the wilderness, and smote the four corners of the house, and it fell upon the young men, and they are dead; and I only am escaped alone to tell thee.');
INSERT INTO verses VALUES (1800100020,18001,20,'آنگاه‌ ایوب‌ برخاسته‌، جامه‌ خود را درید و سر خود را تراشید و به‌ زمین‌ افتاده‌، سجده‌ كرد','Then Job arose, and rent his mantle, and shaved his head, and fell down upon the ground, and worshipped,');
INSERT INTO verses VALUES (1800100021,18001,21,'و گفت‌: «برهنه‌ از رحم‌ مادر خود بیرون‌ آمدم‌ و برهنه‌ به‌ آنجا خواهم‌ برگشت‌! خداوند داد و خداوند گرفت‌! و نام‌ خداوند متبارك‌ باد!»','And said, Naked came I out of my mother''s womb, and naked shall I return thither: the LORD gave, and the LORD hath taken away; blessed be the name of the LORD.');
INSERT INTO verses VALUES (1800100022,18001,22,'در این‌ همه‌، ایوب‌ گناه‌ نكرد و به‌ خدا جهالت‌ نسبت‌ نداد.','In all this Job sinned not, nor charged God foolishly.');
id INTEGER PRIMARY KEY,
book_id INTEGER NOT NULL,
chapter_number INTEGER NOT NULL,
audio_local TEXT,
audio_online_fa TEXT,
audio_online_en TEXT
);
id INTEGER PRIMARY KEY,
chapter_id INTEGER NOT NULL,
verse_number INTEGER NOT NULL,
text_fa TEXT,
text_en TEXT
);
INSERT INTO chapters VALUES (19001,19,1,NULL,'http://audio1.wordfree.net/bibles/app/audio/20/19/1.mp3','http://audio1.wordfree.net/bibles/app/audio/20/19/1.mp3');
INSERT INTO verses VALUES (1900100001,19001,1,'span class="verse" id="1">1 </span خوشابحال کسی که به مشورت شریران نرود و به راه گناهکاران نایستد، و در مجلس استهزاکنندگان ننشیند؛','span class="verse" id="1">1 </span Blessed is the man that walketh not in the counsel of the ungodly, nor standeth in the way of sinners, nor sitteth in the seat of the scornful.');
INSERT INTO verses VALUES (1900100002,19001,2,'بلکه رغبت او در شریعت خداوند است و روز و شب در شریعت او تفکر می‌کند.','But his delight is in the law of the LORD; and in his law doth he meditate day and night.');
INSERT INTO verses VALUES (1900100003,19001,3,'پس مثل درختی نشانده نزد نهرهای آب خواهد بود، که میوهٔٔ خود را در موسمش می‌دهد، و برگش پژمرده نمی‌گردد و هر آنچه می‌کند نیک انجام خواهد بود.','And he shall be like a tree planted by the rivers of water, that bringeth forth his fruit in his season; his leaf also shall not wither; and whatsoever he doeth shall prosper.');
INSERT INTO verses VALUES (1900100004,19001,4,'شریران چنین نیستند، بلکه مثل کاهند که باد آن را پراکنده می‌کند.','The ungodly are not so: but are like the chaff which the wind driveth away.');
INSERT INTO verses VALUES (1900100005,19001,5,'لهذا شریران در داوری نخواهند ایستاد و نه گناهکاران در جماعت عادلان.','Therefore the ungodly shall not stand in the judgment, nor sinners in the congregation of the righteous.');
INSERT INTO verses VALUES (1900100006,19001,6,'زیرا خداوند طریق عادلان را می‌داند، ولی طریق گناهکاران هلاک خواهد شد.','For the LORD knoweth the way of the righteous: but the way of the ungodly shall perish.');
id INTEGER PRIMARY KEY,
book_id INTEGER NOT NULL,
chapter_number INTEGER NOT NULL,
audio_local TEXT,
audio_online_fa TEXT,
audio_online_en TEXT
);
id INTEGER PRIMARY KEY,
chapter_id INTEGER NOT NULL,
verse_number INTEGER NOT NULL,
text_fa TEXT,
text_en TEXT
);
INSERT INTO chapters VALUES (20001,20,1,NULL,'http://audio1.wordfree.net/bibles/app/audio/20/20/1.mp3','http://audio1.wordfree.net/bibles/app/audio/20/20/1.mp3');
INSERT INTO verses VALUES (2000100001,20001,1,'span class="verse" id="1">1 </span امثال‌ سلیمان‌ بن‌ داود پادشاه‌ اسرائیل‌،','span class="verse" id="1">1 </span The proverbs of Solomon the son of David , king of Israel ;');
INSERT INTO verses VALUES (2000100002,20001,2,'به‌ جهت‌ دانستن‌ حكمت‌ و عدل‌، و برای‌ فهمیدن‌ كلمات‌ فطانت‌؛','To know wisdom and instruction; to perceive the words of understanding;');
INSERT INTO verses VALUES (2000100003,20001,3,'به‌ جهت‌ اكتساب‌ ادب‌ معرفت‌آمیز، و عدالت‌ و انصاف‌ و استقامت‌؛','To receive the instruction of wisdom, justice, and judgment, and equity;');
INSERT INTO verses VALUES (2000100004,20001,4,'تا ساده ‌دلان‌ را زیركی‌ بخشد، و جوانان‌ را معرفت‌ و تمیز؛','To give subtilty to the simple, to the young man knowledge and discretion.');
INSERT INTO verses VALUES (2000100005,20001,5,'تا مرد حكیم‌ بشنود و علم‌ را بیفزاید، و مرد فهیم‌ تدابیر را تحصیل‌ نماید؛','A wise man will hear, and will increase learning; and a man of understanding shall attain unto wise counsels:');
INSERT INTO verses VALUES (2000100006,20001,6,'تا امثال‌ و كنایات‌ را بفهمند، كلمات‌ حكیمان‌ و غوامض‌ ایشان‌ را.','To understand a proverb, and the interpretation; the words of the wise, and their dark sayings.');
INSERT INTO verses VALUES (2000100007,20001,7,'ترس‌ یهوه‌ آغاز علم‌ است‌، لیكن‌ جاهلان‌ حكمت‌ و ادب‌ را خوار می‌شمارند.','The fear of the LORD is the beginning of knowledge: but fools despise wisdom and instruction.');
INSERT INTO verses VALUES (2000100008,20001,8,'ای‌ پسر من‌ تأدیب‌ پدر خود را بشنو، و تعلیم‌ مادر خویش‌ را ترك‌ منما.','My son, hear the instruction of thy father, and forsake not the law of thy mother:');
INSERT INTO verses VALUES (2000100009,20001,9,'زیرا كه‌ آنها تاج‌ زیبایی‌ برای‌ سر تو، و جواهر برای‌ گردن‌ تو خواهد بود.','For they shall be an ornament of grace unto thy head, and chains about thy neck.');
INSERT INTO verses VALUES (2000100010,20001,10,'ای‌ پسر من‌ اگر گناهكاران‌ تو را فریفته‌ سازند، قبول‌ منما.','My son, if sinners entice thee, consent thou not.');
INSERT INTO verses VALUES (2000100011,20001,11,'اگر گویند: «همراه‌ ما بیا تا برای‌ خون‌ در كمین‌ بنشینیم‌، و برای‌ بی‌گناهان‌ بی‌جهت‌ پنهان‌ شویم‌،','If they say, Come with us, let us lay wait for blood, let us lurk privily for the innocent without cause:');
INSERT INTO verses VALUES (2000100012,20001,12,'مثل‌ هاویه‌ ایشان‌ را زنده‌ خواهیم‌ بلعید، و تندرست‌ مانند آنانی‌ كه‌ به‌ گور فرو می‌روند.','Let us swallow them up alive as the grave; and whole, as those that go down into the pit:');
INSERT INTO verses VALUES (2000100013,20001,13,'هر گونه‌ اموال‌ نفیسه‌ را پیدا خواهیم‌ نمود و خانه‌های‌ خود را از غنیمت‌ مملو خواهیم‌ ساخت‌.','We shall find all precious substance, we shall fill our houses with spoil:');
INSERT INTO verses VALUES (2000100014,20001,14,'قرعه‌ خود را در میان‌ ما بینداز. و جمیع‌ ما را یك‌ كیسه‌ خواهد بود.»','Cast in thy lot among us; let us all have one purse:');
INSERT INTO verses VALUES (2000100015,20001,15,'ای‌ پسر من‌ با ایشان‌ در راه‌ مرو. و پای‌ خود را از طریقهای‌ ایشان‌ باز دار','My son, walk not thou in the way with them; refrain thy foot from their path:');
INSERT INTO verses VALUES (2000100016,20001,16,'زیرا كه‌ پایهای‌ ایشان‌ برای‌ شرارت‌ می‌دود و به‌ جهت‌ ریختن‌ خون‌ می‌شتابد.','For their feet run to evil, and make haste to shed blood.');
INSERT INTO verses VALUES (2000100017,20001,17,'به‌ تحقیق‌، گستردن‌ دام‌ در نظر هر بالداری‌ بی‌فایده‌ است‌.','Surely in vain the net is spread in the sight of any bird.');
INSERT INTO verses VALUES (2000100018,20001,18,'لیكن‌ ایشان‌ به‌ جهت‌ خون‌ خود كمین‌ می‌سازند، و برای‌ جان‌ خویش‌ پنهان‌ می‌شوند.','And they lay wait for their own blood; they lurk privily for their own lives.');
INSERT INTO verses VALUES (2000100019,20001,19,'همچنین‌ است‌ راههای‌ هر كس‌ كه‌ طّماع‌ سود باشد، كه‌ آن‌ جان‌ مالك‌ خود را هلاك‌ می‌سازد.','So are the ways of every one that is greedy of gain; which taketh away the life of the owners thereof.');
INSERT INTO verses VALUES (2000100020,20001,20,'حكمت‌ در بیرون‌ ندا می‌دهد و در شوارع‌ عام‌ آواز خود را بلند می‌كند.','Wisdom crieth without; she uttereth her voice in the streets:');
INSERT INTO verses VALUES (2000100021,20001,21,'در سر چهارراهها در دهنه‌ دروازه‌ها می‌خواند و در شهر به‌ سخنان‌ خود متّكلم‌ می‌شود','She crieth in the chief place of concourse, in the openings of the gates: in the city she uttereth her words, saying,');
INSERT INTO verses VALUES (2000100022,20001,22,'كه‌ «ای‌ جاهلان‌ تا به‌ كی‌ جهالت‌ را دوست‌ خواهید داشت‌؟ و تا به‌ كی‌ مستهزئین‌ از استهزا شادی‌ می‌كنند و احمقان‌ از معرفت‌ نفرت‌ می‌نمایند؟','How long, ye simple ones, will ye love simplicity? and the scorners delight in their scorning, and fools hate knowledge?');
INSERT INTO verses VALUES (2000100023,20001,23,'به‌ سبب‌ عتاب‌ من‌ بازگشت‌ نمایید. اینك‌ روح‌ خود را بر شما افاضه‌ خواهم‌ نمود و كلمات‌ خود را بر شما اعلام‌ خواهم‌ كرد.','Turn you at my reproof: behold, I will pour out my spirit unto you, I will make known my words unto you.');
INSERT INTO verses VALUES (2000100024,20001,24,'زیرا كه‌ چون‌ خواندم‌، شما ابا نمودید و دستهای‌ خود را افراشتم‌ و كسی‌ اعتنا نكرد.','Because I have called, and ye refused; I have stretched out my hand, and no man regarded;');
INSERT INTO verses VALUES (2000100025,20001,25,'بلكه‌ تمامی نصیحت‌ مرا ترك‌ نمودید و توبیخ‌ مرا نخواستید.','But ye have set at nought all my counsel, and would none of my reproof:');
INSERT INTO verses VALUES (2000100026,20001,26,'پس‌ من‌ نیز در حین‌ مصیبت‌ شما خواهم‌ خندید و چون‌ ترس‌ بر شما مستولی‌ شود استهزا خواهم‌ نمود.','I also will laugh at your calamity; I will mock when your fear cometh;');
INSERT INTO verses VALUES (2000100027,20001,27,'چون‌خوف‌ مثل‌ باد تند بر شما عارض‌ شود، و مصیبت‌ مثل‌ گردباد به‌ شما دررسد، حینی‌ كه‌ تنگی‌ و ضیق‌ بر شما آید.','When your fear cometh as desolation, and your destruction cometh as a whirlwind; when distress and anguish cometh upon you.');
INSERT INTO verses VALUES (2000100028,20001,28,'آنگاه‌ مرا خواهند خواند لیكن‌ اجابت‌ نخواهم‌ كرد، و صبحگاهان‌ مرا جستجو خواهند نمود اما مرا نخواهند یافت‌.','Then shall they call upon me, but I will not answer; they shall seek me early, but they shall not find me:');
INSERT INTO verses VALUES (2000100029,20001,29,'چونكه‌ معرفت‌ را مكروه‌ داشتند، و ترس‌ خداوند را اختیار ننمودند،','For that they hated knowledge, and did not choose the fear of the LORD:');
INSERT INTO verses VALUES (2000100030,20001,30,'و نصیحت‌ مرا پسند نكردند، و تمامی توبیخ‌ مرا خوار شمردند،','They would none of my counsel: they despised all my reproof.');
INSERT INTO verses VALUES (2000100031,20001,31,'بنابراین‌، از میوه‌ طریق‌ خود خواهند خورد، و از تدابیر خویش‌ سیر خواهند شد.','Therefore shall they eat of the fruit of their own way, and be filled with their own devices.');
INSERT INTO verses VALUES (2000100032,20001,32,'زیرا كه‌ ارتدادِ جاهلان‌، ایشان‌ را خواهد كشت‌ و راحتِ غافلانه‌ احمقان‌، ایشان‌ را هلاك‌ خواهد ساخت‌.','For the turning away of the simple shall slay them, and the prosperity of fools shall destroy them.');
INSERT INTO verses VALUES (2000100033,20001,33,'اما هر كه‌ مرا بشنود در امنّیت‌ ساكن‌ خواهد بود، و از ترس‌ بلا مستریح‌ خواهد ماند.»','But whoso hearkeneth unto me shall dwell safely, and shall be quiet from fear of evil.');
id INTEGER PRIMARY KEY,
book_id INTEGER NOT NULL,
chapter_number INTEGER NOT NULL,
audio_local TEXT,
audio_online_fa TEXT,
audio_online_en TEXT
);
id INTEGER PRIMARY KEY,
chapter_id INTEGER NOT NULL,
verse_number INTEGER NOT NULL,
text_fa TEXT,
text_en TEXT
);
INSERT INTO chapters VALUES (21001,21,1,NULL,'http://audio1.wordfree.net/bibles/app/audio/20/21/1.mp3','http://audio1.wordfree.net/bibles/app/audio/20/21/1.mp3');
INSERT INTO verses VALUES (2100100001,21001,1,'span class="verse" id="1">1 </span كلام‌ جامعه‌ بن‌ داود كه‌ در اورشلیم‌ پادشاه‌ بود:','span class="verse" id="1">1 </span The words of the Preacher, the son of David , king in Jerusalem .');
INSERT INTO verses VALUES (2100100002,21001,2,'باطل‌ اباطیل‌، جامعه‌ می‌گوید، باطل‌ اباطیـل‌، همه‌ چیـز باطل‌ است‌.','Vanity of vanities, saith the Preacher, vanity of vanities; all is vanity.');
INSERT INTO verses VALUES (2100100003,21001,3,'انسان‌ را از تمامی‌ مشقّتش‌ كه‌ زیر آسمان‌ می‌كشد چه‌ منفعت‌ است‌؟','What profit hath a man of all his labour which he taketh under the sun?');
INSERT INTO verses VALUES (2100100004,21001,4,'یك‌ طبقه‌ می‌روند و طبقه‌ دیگر می‌آیند و زمین‌ تا به‌ ابـد پایـدار می‌مانـد.','One generation passeth away, and another generation cometh: but the earth abideth for ever.');
INSERT INTO verses VALUES (2100100005,21001,5,'آفتـاب‌ طلوع‌ می‌كند و آفتاب‌ غروب‌ می‌كند و به‌ جایی‌ كه‌ از آن‌ طلوع‌ نمود می‌شتابد.','The sun also ariseth, and the sun goeth down, and hasteth to his place where he arose.');
INSERT INTO verses VALUES (2100100006,21001,6,'باد بطرف‌ جنوب‌ می‌رود و بطرف‌ شمال‌ دور می‌زند؛ دورزنان‌ دورزنان‌ مـی‌رود و بـاد به‌ مدارهـای‌ خـود برمـی‌گردد.','The wind goeth toward the south, and turneth about unto the north; it whirleth about continually, and the wind returneth again according to his circuits.');
INSERT INTO verses VALUES (2100100007,21001,7,'جمیـع‌ نهرهـا به‌ دریـا جـاری‌ می‌شـود اما دریا پر نمی‌گردد؛ به‌ مكانی‌ كه‌ نهرها از آن‌ جاری‌ شد به‌ همان‌ جا باز برمی‌گردد.','All the rivers run into the sea; yet the sea is not full; unto the place from whence the rivers come, thither they return again.');
INSERT INTO verses VALUES (2100100008,21001,8,'همه‌ چیزها پـر از خستگـی‌ اسـت‌ كه‌ انسـان‌ آن‌ را بیـان‌ نتوانـد كـرد. چشـم‌ از دیـدن‌ سیـر نمی‌شـود و گـوش‌ از شنیدن‌ مملو نمی‌گردد.','All things are full of labour; man cannot utter it: the eye is not satisfied with seeing, nor the ear filled with hearing.');
INSERT INTO verses VALUES (2100100009,21001,9,'آنچه‌ بوده‌ است‌ همان‌ است‌ كه‌ خواهد بود، و آنچه‌ شده‌ است‌ همان‌ است‌ كه‌ خواهد شد و زیـر آفتاب‌ هیـچ‌ چیـز تـازه‌ نیست‌.','The thing that hath been, it is that which shall be; and that which is done is that which shall be done: and there is no new thing under the sun.');
INSERT INTO verses VALUES (2100100010,21001,10,'آیا چیـزی‌ هست‌ كه‌ درباره‌اش‌ گفته‌ شـود ببیـن‌ این‌ تازه‌ است‌؟ در دهرهایی‌ كه‌ قبـل‌ از مـا بـود آن‌ چیز قدیم‌ بود.','Is there any thing whereof it may be said, See, this is new? it hath been already of old time, which was before us.');
INSERT INTO verses VALUES (2100100011,21001,11,'ذكری‌ از پیشینیان‌ نیست‌، و از آیندگان‌ نیـز كه‌ خواهند آمد، نزد آنانی‌ كه‌ بعد از ایشان‌ خواهند آمد، ذكری‌ نخواهد بود.','There is no remembrance of former things; neither shall there be any remembrance of things that are to come with those that shall come after.');
INSERT INTO verses VALUES (2100100012,21001,12,'من‌ كه‌ جامعه‌ هستم‌ بر اسرائیل‌ در اورشلیم‌ پادشاه‌ بودم‌،','I the Preacher was king over Israel in Jerusalem .');
INSERT INTO verses VALUES (2100100013,21001,13,'و دل‌ خود را بر آن‌ نهادم‌ كه‌ در هر چیزی‌ كه‌ زیر آسمان‌ كرده‌ می‌شود، با حكمت‌ تفحّص‌ و تجسّس‌ نمایم‌. این‌ مشقّت‌ سخت‌ است‌ كه‌ خدا به‌ بنی‌آدم‌ داده‌ است‌ كه‌ به‌ آن‌ زحمت‌ بكشند.','And I gave my heart to seek and search out by wisdom concerning all things that are done under heaven: this sore travail hath God given to the sons of man to be exercised therewith.');
INSERT INTO verses VALUES (2100100014,21001,14,'و تمامی‌ كارهایی‌ را كه‌ زیر آسمان‌ كرده‌ می‌شود، دیدم‌ كه‌ اینك‌ همه‌ آنها بطالت‌ و در پی‌ باد زحمت‌ كشیدن‌ است‌.','I have seen all the works that are done under the sun; and, behold, all is vanity and vexation of spirit.');
INSERT INTO verses VALUES (2100100015,21001,15,'كج‌ را راست‌ نتوان‌ كرد و ناقص‌ را بشمار نتوان‌ آورد.','That which is crooked cannot be made straight: and that which is wanting cannot be numbered.');
INSERT INTO verses VALUES (2100100016,21001,16,'در دل‌ خود تفكّر نموده‌، گفتم‌: اینك‌ من‌ حكمت‌ را به‌ غایت‌ افزودم‌، بیشتر از همگانی‌ كه‌ قبل‌ از من‌ بر اورشلیم‌ بودند؛ و دل‌ من‌ حكمت‌ و معرفت‌ را بسیار دریافت‌ نمود؛','I communed with mine own heart, saying, Lo, I am come to great estate, and have gotten more wisdom than all they that have been before me in Jerusalem : yea, my heart had great experience of wisdom and knowledge.');
INSERT INTO verses VALUES (2100100017,21001,17,'و دل‌ خود را بر دانستن‌ حكمت‌ و دانستن‌ حماقت‌ و جهالت‌ مشغول‌ ساختم‌. پس‌ فهمیدم‌ كه‌ این‌ نیز در پی‌ باد زحمت‌ كشیدن‌ است‌.','And I gave my heart to know wisdom, and to know madness and folly: I perceived that this also is vexation of spirit.');
INSERT INTO verses VALUES (2100100018,21001,18,'زیرا كه‌ در كثرت‌ حكمت‌ كثرت‌ غم‌ است‌ و هر كه‌ عِلم‌ را بیفزاید، حزن‌ را می‌افزاید.','For in much wisdom is much grief: and he that increaseth knowledge increaseth sorrow.');
id INTEGER PRIMARY KEY,
book_id INTEGER NOT NULL,
chapter_number INTEGER NOT NULL,
audio_local TEXT,
audio_online_fa TEXT,
audio_online_en TEXT
);
id INTEGER PRIMARY KEY,
chapter_id INTEGER NOT NULL,
verse_number INTEGER NOT NULL,
text_fa TEXT,
text_en TEXT
);
INSERT INTO chapters VALUES (22001,22,1,NULL,'http://audio1.wordfree.net/bibles/app/audio/20/22/1.mp3','http://audio1.wordfree.net/bibles/app/audio/20/22/1.mp3');
INSERT INTO verses VALUES (2200100001,22001,1,'span class="verse" id="1">1 </span غزل‌ غزلها كه‌ از آن‌ سلیمان‌ است‌.','span class="verse" id="1">1 </span The song of songs, which is Solomon ''s.');
INSERT INTO verses VALUES (2200100002,22001,2,'محبوبه‌: او مرا به‌ بوسه‌های‌ دهان‌ خود ببوسد زیرا كه‌ محبّت‌ تو از شراب‌ نیكوتر است‌.','Let him kiss me with the kisses of his mouth: for thy love is better than wine.');
INSERT INTO verses VALUES (2200100003,22001,3,'عطرهای‌ تو بوی‌ خوش‌ دارد و اسم‌ تو مثل‌ عطر ریخته‌ شده‌ می‌باشد. بنابراین‌ دوشیزگان‌، تو را دوست‌ می‌دارند.','Because of the savour of thy good ointments thy name is as ointment poured forth, therefore do the virgins love thee.');
INSERT INTO verses VALUES (2200100004,22001,4,'مرا بِكِش‌ تا در عقب‌ تو بدویم‌. پادشاه‌ مرا به‌ حجله‌های‌ خود آورد. از تو وجد و شادی‌ خواهیم‌ كرد. محبّت‌ تو را از شراب‌ زیاده‌ ذكر خواهیم‌ نمود. تو را از روی‌ خلوص‌ دوست‌ می‌دارند.','Draw me, we will run after thee: the king hath brought me into his chambers: we will be glad and rejoice in thee, we will remember thy love more than wine: the upright love thee.');
INSERT INTO verses VALUES (2200100005,22001,5,'ای‌ دختران‌ اورشلیم‌، من‌ سیه‌ فام‌ امّا جمیل‌ هستم‌، مثل‌ خیمه‌های‌ قیدار و مانند پرده‌های‌ سلیمان‌.','I am black, but comely, O ye daughters of Jerusalem , as the tents of Kedar , as the curtains of Solomon .');
INSERT INTO verses VALUES (2200100006,22001,6,'بر من‌ نگاه‌ نكنید چونكه‌ سیه‌فام‌ هستم‌، زیرا كه‌ آفتاب‌ مرا سوخته‌ است‌. پسران‌ مادرم‌ بر من‌ خشم‌ نموده‌، مرا ناطور تاكستانها ساختند، امّا تاكستان‌ خود را دیده‌بانی‌ ننمودم‌.','Look not upon me, because I am black, because the sun hath looked upon me: my mother''s children were angry with me; they made me the keeper of the vineyards; but mine own vineyard have I not kept.');
INSERT INTO verses VALUES (2200100007,22001,7,'ای‌ حبیب‌ جان‌ من‌، مرا خبر ده‌ كه‌ كجا می‌چرانی‌ و در وقت‌ ظهر گلّه‌ را كجا می‌خوابانی‌؟ زیرا چرا نزد گله‌های‌ رفیقانت‌ مثل‌ آواره‌ گردم‌.','Tell me, O thou whom my soul loveth, where thou feedest, where thou makest thy flock to rest at noon: for why should I be as one that turneth aside by the flocks of thy companions?');
INSERT INTO verses VALUES (2200100008,22001,8,'محبوب‌: ای‌ جمیل‌تر از زنان‌، اگر نمی‌دانی‌، در اثر گله‌ها بیرون‌ رو و بزغاله‌هایت‌ را نزد مسكن‌های‌شبانان‌ بچران‌.','If thou know not, O thou fairest among women, go thy way forth by the footsteps of the flock, and feed thy kids beside the shepherds'' tents.');
INSERT INTO verses VALUES (2200100009,22001,9,'ای‌ محبوبه‌ من‌، تو را به‌ اسبی‌ كه‌ در ارابۀ فرعون‌ باشد تشبیه‌ داده‌ام‌.','I have compared thee, O my love, to a company of horses in Pharaoh''s chariots.');
INSERT INTO verses VALUES (2200100010,22001,10,'رخسارهایت‌ به‌ جواهرها و گردنت‌ به‌ گردن‌بندها چه‌ بسیار جمیل‌ است‌.','Thy cheeks are comely with rows of jewels, thy neck with chains of gold.');
INSERT INTO verses VALUES (2200100011,22001,11,'محبوبه‌: زنجیرهای‌ طلا با حَبّه‌های‌ نقره‌ برای‌ تو خواهیم‌ ساخت‌.','We will make thee borders of gold with studs of silver.');
INSERT INTO verses VALUES (2200100012,22001,12,'چون‌ پادشاه‌ بر سفره‌ خود می‌نشیند، سنبل‌ من‌ بوی‌ خود را می‌دهد.','While the king sitteth at his table, my spikenard sendeth forth the smell thereof.');
INSERT INTO verses VALUES (2200100013,22001,13,'محبوب‌ من‌، مرا مثل‌ طَبله‌ مرّ است‌ كه‌ در میان‌ پستانهای‌ من‌ می‌خوابد.','A bundle of myrrh is my well-beloved unto me; he shall lie all night betwixt my breasts.');
INSERT INTO verses VALUES (2200100014,22001,14,'محبوب‌: محبوب‌ من‌، برایم‌ مثل‌ خوشه‌بان‌ در باغهای‌ عین‌جدی‌ می‌باشد.','My beloved is unto me as a cluster of camphire in the vineyards of Engedi.');
INSERT INTO verses VALUES (2200100015,22001,15,'اینك‌ تو زیبا هستی‌ ای‌ محبوبه‌ من‌، اینك‌ تو زیبا هستی‌ و چشمانت‌ مثل‌ چشمان‌ كبوتر است‌.','Behold, thou art fair, my love; behold, thou art fair; thou hast doves'' eyes.');
INSERT INTO verses VALUES (2200100016,22001,16,'محبوبه‌: اینك‌ تو زیبا و شیرین‌ هستی‌ ای‌ محبوب‌ من‌ و تخت‌ ما هم‌ سبز است‌.','Behold, thou art fair, my beloved, yea, pleasant: also our bed is green.');
INSERT INTO verses VALUES (2200100017,22001,17,'محبوب‌: تیرهای‌ خانه‌ ما از سرو آزاد است‌ و سقف‌ ما از چوب‌ صنوبر.','The beams of our house are cedar, and our rafters of fir.');
id INTEGER PRIMARY KEY,
book_id INTEGER NOT NULL,
chapter_number INTEGER NOT NULL,
audio_local TEXT,
audio_online_fa TEXT,
audio_online_en TEXT
);
id INTEGER PRIMARY KEY,
chapter_id INTEGER NOT NULL,
verse_number INTEGER NOT NULL,
text_fa TEXT,
text_en TEXT
);
INSERT INTO chapters VALUES (23001,23,1,NULL,'http://audio1.wordfree.net/bibles/app/audio/20/23/1.mp3','http://audio1.wordfree.net/bibles/app/audio/20/23/1.mp3');
INSERT INTO verses VALUES (2300100001,23001,1,'span class="verse" id="1">1 </span رؤیای‌ اشعیا ابن‌ آموص‌ كه‌ آن‌ را درباره‌یهودا و اورشلیم‌، در روزهای‌ عزّیا و یوتام‌ و آحاز و حزقیا، پادشاهان‌ یهودا دید.','span class="verse" id="1">1 </span The vision of Isaiah the son of Amoz, which he saw concerning Judah and Jerusalem in the days of Uzziah, Jotham, Ahaz, and Hezekiah, kings of Judah .');
INSERT INTO verses VALUES (2300100002,23001,2,'ای‌ آسمان‌ بشنو و ای‌ زمین‌ گوش‌ بگیر زیرا خداوند سخن‌ می‌گوید. پسران‌ پروردم‌ و برافراشتم‌ امّا ایشان‌ بر من‌ عصیان‌ ورزیدند.','Hear, O heavens, and give ear, O earth: for the LORD hath spoken, I have nourished and brought up children, and they have rebelled against me.');
INSERT INTO verses VALUES (2300100003,23001,3,'گاو مالك‌ خویش‌ را و الاغ‌ آخور صاحب‌ خود را می‌شناسد، امّا اسرائیل‌ نمی‌شناسند و قوم‌ من‌ فهم‌ ندارند.','The ox knoweth his owner, and the ass his master''s crib: but Israel doth not know, my people doth not consider.');
INSERT INTO verses VALUES (2300100004,23001,4,'وای‌ بر امّت‌ خطاكار و قومی‌ كه‌ زیر بار گناه‌ می‌باشند و بر ذریت‌ شریران‌ و پسران‌ مفسد. خداوند را ترك‌ كردند و قدّوس‌ اسرائیل‌ را اهانت‌ نمودند و بسوی‌ عقب‌ منحرف‌ شدند.','Ah sinful nation, a people laden with iniquity, a seed of evildoers, children that are corrupters: they have forsaken the LORD, they have provoked the Holy One of Israel unto anger, they are gone away backward.');
INSERT INTO verses VALUES (2300100005,23001,5,'چرا دیگر ضرب‌ یابید و زیاده‌ فتنه‌ نمایید؟ تمامی‌ سر بیمار است‌ و تمامی‌ دل‌ مریض‌.','Why should ye be stricken any more? ye will revolt more and more: the whole head is sick, and the whole heart faint.');
INSERT INTO verses VALUES (2300100006,23001,6,'از كف‌ پا تا به‌ سر در آن‌ تندرستی‌ نیست‌ بلكه‌ جراحت‌ و كوفتگی‌ و زخم‌ متعفّن‌، كه‌ نه‌ بخیه‌ شده‌ و نه‌ بسته‌ گشته‌ و نه‌ با روغن‌ التیام‌ شده‌ است‌.','From the sole of the foot even unto the head there is no soundness in it; but wounds, and bruises, and putrifying sores: they have not been closed, neither bound up, neither mollified with ointment.');
INSERT INTO verses VALUES (2300100007,23001,7,'ولایت‌ شما ویران‌ و شهرهای‌ شما به‌ آتش‌ سوخته‌ شده‌ است‌. غریبان‌، زمین‌ شما را در نظر شما می‌خورند و آن‌ مثل‌ واژگونی‌ بیگانگان‌ خراب‌ گردیده‌ است‌.','Your country is desolate, your cities are burned with fire: your land, strangers devour it in your presence, and it is desolate, as overthrown by strangers.');
INSERT INTO verses VALUES (2300100008,23001,8,'و دختر صهیون‌ مثل‌ سایه‌بان‌ در تاكستان‌ و مانند كپر در بوستان‌ خیار و مثل‌ شهر محاصره‌ شده‌، متروك‌ است‌.','And the daughter of Zion is left as a cottage in a vineyard, as a lodge in a garden of cucumbers, as a besieged city.');
INSERT INTO verses VALUES (2300100009,23001,9,'اگر یهوه‌صبایوت‌ بقیه‌ اندكی‌ برای‌ ما وا نمی‌گذاشت‌، مثل‌ سدوم‌ می‌شدیم‌ و مانند عموره‌ می‌گشتیم‌.','Except the LORD of hosts had left unto us a very small remnant, we should have been as Sodom , and we should have been like unto Gomorrah .');
INSERT INTO verses VALUES (2300100010,23001,10,'ای‌ حاكمان‌ سدوم‌ كلام‌ خداوند را بشنوید و ای‌ قوم‌ عموره‌ شریعت‌ خدای‌ ما را گوش‌ بگیرید.','Hear the word of the LORD, ye rulers of Sodom ; give ear unto the law of our God, ye people of Gomorrah .');
INSERT INTO verses VALUES (2300100011,23001,11,'خداوند می‌گوید از كثرت‌ قربانی‌های‌ شما مرا چه‌ فایده‌ است‌؟ از قربانی‌های‌ سوختنی‌ قوچها و پیه‌ پرواریها سیر شده‌ام‌ و به‌ خون‌ گاوان‌ و بره‌ها و بزها رغبت‌ ندارم‌.','To what purpose is the multitude of your sacrifices unto me? saith the LORD: I am full of the burnt offerings of rams, and the fat of fed beasts; and I delight not in the blood of bullocks, or of lambs, or of he goats.');
INSERT INTO verses VALUES (2300100012,23001,12,'وقتی‌ كه‌ می‌آیید تا به‌ حضور من‌ حاضر شوید، كیست‌ كه‌ این‌ را از دست‌ شما طلبیده‌ است‌ كه‌ دربار مرا پایمال‌ كنید؟','When ye come to appear before me, who hath required this at your hand, to tread my courts?');
INSERT INTO verses VALUES (2300100013,23001,13,'هدایای‌ باطل‌ دیگر میاورید. بخور نزد من‌ مكروه‌ است‌ و غرّه‌ ماه‌ و سَبَّت‌ و دعوت‌ جماعت‌ نیز. گناه‌ را با محفل‌ مقدّس‌ نمی‌توانم‌ تحمّل‌ نمایم‌.','Bring no more vain oblations; incense is an abomination unto me; the new moons and sabbaths, the calling of assemblies, I cannot away with; it is iniquity, even the solemn meeting.');
INSERT INTO verses VALUES (2300100014,23001,14,'غرّه‌ها و عیدهای‌ شما را جان‌ من‌ نفرت‌ دارد؛ آنها برای‌ من‌ بار سنگین‌ است‌ كه‌ از تحمّل‌ نمودنش‌ خسته‌ شده‌ام‌.','Your new moons and your appointed feasts my soul hateth: they are a trouble unto me; I am weary to bear them.');
INSERT INTO verses VALUES (2300100015,23001,15,'هنگامی‌ كه‌ دستهای‌ خود را دراز می‌كنید، چشمان‌ خود را از شما خواهم‌ پوشانید و چون‌ دعای‌ بسیار می‌كنید، اجابت‌ نخواهم‌ نمود زیرا كه‌ دستهای‌ شما پر از خون‌ است.','And when ye spread forth your hands, I will hide mine eyes from you: yea, when ye make many prayers, I will not hear: your hands are full of blood.');
INSERT INTO verses VALUES (2300100016,23001,16,'خویشتن‌ را شسته‌، طاهر نمایید و بدی‌ اعمال‌ خویش‌ را از نظر من‌ دور كرده‌، از شرارت‌ دست‌ بردارید.','Wash you, make you clean; put away the evil of your doings from before mine eyes; cease to do evil;');
INSERT INTO verses VALUES (2300100017,23001,17,'نیكوكاری‌ را بیاموزید و انصاف‌ را بطلبید. مظلومان‌ را رهایی‌ دهید، یتیمان‌ را دادرسی‌ كنید و بیوه‌ زنان‌ را حمایت‌ نمایید.','Learn to do well; seek judgment, relieve the oppressed, judge the fatherless, plead for the widow.');
INSERT INTO verses VALUES (2300100018,23001,18,'خداوند می‌گوید: «بیایید تا با همدیگر محاجه‌ نماییم‌. اگر گناهان‌ شما مثل‌ ارغوان‌ باشد مانند برف‌ سفید خواهد شد و اگر مثل‌ قرمز سرخ‌ باشد، مانند پشم‌ خواهد شد.','Come now, and let us reason together, saith the LORD: though your sins be as scarlet, they shall be as white as snow; though they be red like crimson, they shall be as wool.');
INSERT INTO verses VALUES (2300100019,23001,19,'اگر خواهش‌ داشته‌، اطاعت‌ نمایید، نیكویی‌ زمین‌ را خواهید خورد.','If ye be willing and obedient, ye shall eat the good of the land:');
INSERT INTO verses VALUES (2300100020,23001,20,'امّا اگر ابا نموده‌، تمرّد كنید، شمشیر شما را خواهد خورد»، زیرا كه‌ دهان‌ خداوند چنین‌ می‌گوید.','But if ye refuse and rebel, ye shall be devoured with the sword: for the mouth of the LORD hath spoken it.');
INSERT INTO verses VALUES (2300100021,23001,21,'شهر امین‌ چگونه‌ زانیه‌ شده‌ است‌. آنكه‌ از انصاف‌ مملّو می‌بود و عدالت‌ در وی‌ سكونت‌ می‌داشت‌، امّا حال‌ قاتلان‌.','How is the faithful city become an harlot! it was full of judgment; righteousness lodged in it; but now murderers.');
INSERT INTO verses VALUES (2300100022,23001,22,'نقره‌ تو به‌ دُرد مبدّل‌ شده‌، و شراب‌ تو از آب‌ ممزوج‌ گشته‌ است‌.','Thy silver is become dross, thy wine mixed with water:');
INSERT INTO verses VALUES (2300100023,23001,23,'سروران‌ تو متمرّد شده‌ و رفیق‌ دزدان‌ گردیده‌، هریك‌ از ایشان‌ رشوه‌ را دوست‌ می‌دارند و در پی‌ هدایا می‌روند. یتیمان‌ را دادرسی‌ نمی‌نمایند و دعوی‌ بیوه‌ زنان‌ نزد ایشان‌ نمی‌رسد.','Thy princes are rebellious, and companions of thieves: every one loveth gifts, and followeth after rewards: they judge not the fatherless, neither doth the cause of the widow come unto them.');
INSERT INTO verses VALUES (2300100024,23001,24,'بنابراین‌، خداوند یهوه‌ صبایوت‌، قدیر اسرائیل‌ می‌گوید: «هان‌ من‌ از خصمان‌ خود استراحت‌ خواهم‌ یافت‌ و از دشمنان‌ خویش‌ انتقام‌ خواهم‌ كشید.','Therefore saith the LORD, the LORD of hosts, the mighty One of Israel , Ah, I will ease me of mine adversaries, and avenge me of mine enemies:');
INSERT INTO verses VALUES (2300100025,23001,25,'و دست‌ خود را بر تو برگردانیده‌، دُرْد تو را بالكلّ پاك‌ خواهم‌ كرد، و تمامی‌ ریمت‌ را دور خواهم‌ ساخت‌.','And I will turn my hand upon thee, and purely purge away thy dross, and take away all thy tin:');
INSERT INTO verses VALUES (2300100026,23001,26,'و داوران‌ تو را مثل‌ اوّل‌ و مشیران‌ تو را مثل‌ ابتدا خواهم‌ برگردانید و بعد از آن‌، به‌ شهر عدالت‌ و قریه‌ امین‌ مسمّی‌ خواهی‌ شد.»','And I will restore thy judges as at the first, and thy counsellors as at the beginning: afterward thou shalt be called, The city of righteousness, the faithful city.');
INSERT INTO verses VALUES (2300100027,23001,27,'صهیون‌ به‌ انصاف‌ فدیه‌ داده‌ خواهد شد و انابت‌ كنندگانش‌ به‌ عدالت‌.','Zion shall be redeemed with judgment, and her converts with righteousness.');
INSERT INTO verses VALUES (2300100028,23001,28,'و هلاكت‌ عاصیان‌ و گناهكاران‌ با هم‌ خواهد شد و آنانی‌ كه‌ خداوند را ترك‌ نمایند، نابود خواهند گردید.','And the destruction of the transgressors and of the sinners shall be together, and they that forsake the LORD shall be consumed.');
INSERT INTO verses VALUES (2300100029,23001,29,'زیرا ایشان‌ از درختان‌ بلوطی‌ كه‌ شما خواسته‌ بودید خجل‌ خواهند شد و از باغاتی‌ كه‌ شما برگزیده‌بودید رسوا خواهند گردید.','For they shall be ashamed of the oaks which ye have desired, and ye shall be confounded for the gardens that ye have chosen.');
INSERT INTO verses VALUES (2300100030,23001,30,'زیرا شما مثل‌ بلوطی‌ كه‌ برگش‌ پژمرده‌ و مانند باغی‌ كه‌ آب‌ نداشته‌ باشد خواهید شد.','For ye shall be as an oak whose leaf fadeth, and as a garden that hath no water.');
INSERT INTO verses VALUES (2300100031,23001,31,'و مرد زورآور پُرزه‌ كتان‌ و عملش‌ شعله‌ خواهد شد و هردوی‌ آنها با هم‌ سوخته‌ خواهند گردید و خاموش‌ كننده‌ای‌ نخواهد بود.','And the strong shall be as tow, and the maker of it as a spark, and they shall both burn together, and none shall quench them.');
id INTEGER PRIMARY KEY,
book_id INTEGER NOT NULL,
chapter_number INTEGER NOT NULL,
audio_local TEXT,
audio_online_fa TEXT,
audio_online_en TEXT
);
id INTEGER PRIMARY KEY,
chapter_id INTEGER NOT NULL,
verse_number INTEGER NOT NULL,
text_fa TEXT,
text_en TEXT
);
INSERT INTO chapters VALUES (24001,24,1,NULL,'http://audio1.wordfree.net/bibles/app/audio/20/24/1.mp3','http://audio1.wordfree.net/bibles/app/audio/20/24/1.mp3');
INSERT INTO verses VALUES (2400100001,24001,1,'span class="verse" id="1">1 </span كلام‌ ارمیا ابن‌ حلقیا از كاهنانی‌ كه‌ درعناتوت‌ در زمین‌ بنیامین‌ بودند،','span class="verse" id="1">1 </span The words of Jeremiah the son of Hilkiah, of the priests that were in Anathoth in the land of Benjamin :');
INSERT INTO verses VALUES (2400100002,24001,2,'كه‌ كلام‌ خداوند در ایام‌ یوشیا ابن‌ آمون‌ پادشاه‌ یهودا در سال‌ سیزدهم‌ از سلطنت‌ او بر وی‌ نازل‌ شد،','To whom the word of the LORD came in the days of Josiah the son of Amon king of Judah , in the thirteenth year of his reign.');
INSERT INTO verses VALUES (2400100003,24001,3,'و در ایام‌ یهویاقیم‌ بن‌ یوشیا پادشاه‌ یهودا تا آخر سال‌ یازدهم‌ صدقیا ابن‌ یوشیا پادشاه‌ یهودا نازل‌ می‌شد تا زمانی‌ كه‌ اورشلیم‌ در ماه‌ پنجم‌ به‌ اسیری‌ برده‌ شد.','It came also in the days of Jehoiakim the son of Josiah king of Judah , unto the end of the eleventh year of Zedekiah the son of Josiah king of Judah , unto the carrying away of Jerusalem captive in the fifth month.');
INSERT INTO verses VALUES (2400100004,24001,4,'پس‌ كلام‌ خداوند بر من‌ نازل‌ شده‌، گفت‌:','Then the word of the LORD came unto me, saying,');
INSERT INTO verses VALUES (2400100005,24001,5,'«قبل‌ از آنكه‌ تو را در شكم‌ صورت‌ بندم‌ تو را شناختم‌ و قبل‌ از بیرون‌ آمدنت‌ از رحم‌ تو را تقدیس‌ نمودم‌ و تو را نبی‌ امّت‌ها قرار دادم‌.»','Before I formed thee in the belly I knew thee; and before thou camest forth out of the womb I sanctified thee, and I ordained thee a prophet unto the nations.');
INSERT INTO verses VALUES (2400100006,24001,6,'پس‌ گفتم‌: «آه‌ ای‌ خداوند یهوه‌ اینك‌ من‌ تكلّم‌ كردن‌ را نمی‌دانم‌ چونكه‌ طفل‌ هستم‌.»','Then said I, Ah, Lord GOD! behold, I cannot speak: for I am a child.');
INSERT INTO verses VALUES (2400100007,24001,7,'اما خداوند مرا گفت‌: «مگو من‌ طفل‌ هستم‌، زیرا هر جایی‌ كه‌ تو را بفرستم‌ خواهی‌ رفت‌ و بهر چه‌ تو را امر فرمایم‌ تكلّم‌ خواهی‌ نمود.','But the LORD said unto me, Say not, I am a child: for thou shalt go to all that I shall send thee, and whatsoever I command thee thou shalt speak.');
INSERT INTO verses VALUES (2400100008,24001,8,'از ایشان‌ مترس‌ زیرا خداوند می‌گوید: من‌ با تو هستم‌ و تو را رهایی‌ خواهم‌ داد.»','Be not afraid of their faces: for I am with thee to deliver thee, saith the LORD.');
INSERT INTO verses VALUES (2400100009,24001,9,'آنگاه‌ خداوند دست‌ خود را دراز كرده‌، دهان‌ مرا لمس‌ كرد و خداوند به‌ من‌ گفت‌: «اینك‌ كلام‌ خود را در دهان‌ تو نهادم‌.','Then the LORD put forth his hand, and touched my mouth. And the LORD said unto me, Behold, I have put my words in thy mouth.');
INSERT INTO verses VALUES (2400100010,24001,10,'بدان‌ كه‌ تو را امروز بر امّت‌ها و ممالك‌ مبعوث‌ كردم‌ تا از ریشه‌ بركنی‌ و منهدم‌ سازی‌ و هلاك‌ كنی‌ و خراب‌ نمایی‌ و بنا نمایی‌ و غرس‌ كنی‌.»','See, I have this day set thee over the nations and over the kingdoms, to root out, and to pull down, and to destroy, and to throw down, to build, and to plant.');
INSERT INTO verses VALUES (2400100011,24001,11,'پس‌ كلام‌ خداوند بر من‌ نازل‌ شده‌، گفت‌: «ای‌ ارمیا چه‌ می‌بینی‌؟ گفتم‌: «شاخه‌ای‌ از درخت‌ بادام‌ می‌بینم‌.»','Moreover the word of the LORD came unto me, saying, Jeremiah , what seest thou? And I said, I see a rod of an almond tree.');
INSERT INTO verses VALUES (2400100012,24001,12,'خداوند مرا گفت‌: «نیكو دیدی‌ زیرا كه‌ من‌ بر كلام‌ خود دیده‌بانی‌ می‌كنم‌ تا آن‌ را به‌ انجام‌ رسانم‌.»','Then said the LORD unto me, Thou hast well seen: for I will hasten my word to perform it.');
INSERT INTO verses VALUES (2400100013,24001,13,'پس‌ كلام‌ خداوند بار دیگر به‌ من‌ رسیده‌، گفت‌: «چه‌ چیز می‌بینی‌؟» گفتم‌: «دیگی‌ جوشنده‌ می‌بینم‌ كه‌ رویش‌ از طرف‌ شمال‌ است‌.»','And the word of the LORD came unto me the second time, saying, What seest thou? And I said, I see a seething pot; and the face thereof is toward the north.');
INSERT INTO verses VALUES (2400100014,24001,14,'و خداوند مرا گفت‌: «بلایی‌ از طرف‌ شمال‌ بر جمیع‌ سكنه‌ این‌ زمین‌ منبسط‌ خواهد شد.','Then the LORD said unto me, Out of the north an evil shall break forth upon all the inhabitants of the land.');
INSERT INTO verses VALUES (2400100015,24001,15,'زیرا خداوند می‌گوید اینك‌ من‌ جمیع‌ قبایل‌ ممالك‌ شمالی‌ را خواهم‌ خواند و ایشان‌ آمده‌، هر كس‌ كرسی خود را در دهنه‌ دروازه‌ اورشلیم‌ و بر تمامی‌ حصارهایش‌ گرداگرد و به‌ ضدّ تمامی‌ شهرهای‌ یهودا برپا خواهد داشت‌.','For, lo, I will call all the families of the kingdoms of the north, saith the LORD; and they shall come, and they shall set every one his throne at the entering of the gates of Jerusalem , and against all the walls thereof round about, and against all the cities of Judah .');
INSERT INTO verses VALUES (2400100016,24001,16,'و بر ایشان‌ احكام‌ خود را درباره‌ همه‌ شرارتشان‌ جاری‌ خواهم‌ ساخت‌ چونكه‌ مرا ترك‌ كردند و برای‌ خدایان‌ غیر بخور سوزانیدند و اعمال‌ دستهای‌ خود را سجده‌ نمودند.','And I will utter my judgments against them touching all their wickedness, who have forsaken me, and have burned incense unto other gods, and worshipped the works of their own hands.');
INSERT INTO verses VALUES (2400100017,24001,17,'پس‌ تو كمر خود را ببند و برخاسته‌، هر آنچه‌ را من‌ به‌ تو امر فرمایم‌ به‌ ایشان‌ بگو و از ایشان‌ هراسان‌ مباش‌، مبادا تو را پیش‌ روی‌ ایشان‌ مشوّش‌ سازم‌.','Thou therefore gird up thy loins, and arise, and speak unto them all that I command thee: be not dismayed at their faces, lest I confound thee before them.');
INSERT INTO verses VALUES (2400100018,24001,18,'زیرا اینك‌ من‌ تو را امروز شهر حصاردار و ستون‌ آهنین‌ و حصارهای‌ برنجین‌ به‌ ضدّ تمامی‌ زمین‌ برای‌ پادشاهان‌ یهودا و سروران‌ و كاهنانش‌ و قوم‌ زمین‌ ساختم‌.','For, behold, I have made thee this day a defenced city, and an iron pillar, and brasen walls against the whole land, against the kings of Judah , against the princes thereof, against the priests thereof, and against the people of the land.');
INSERT INTO verses VALUES (2400100019,24001,19,'و ایشان‌ با تو جنگ‌ خواهند كرد اما بر تو غالب‌ نخواهند آمد، زیرا خداوندمی‌گوید: من‌ با تو هستم‌ و تو را رهایی‌ خواهم‌ داد.»','And they shall fight against thee; but they shall not prevail against thee; for I am with thee, saith the LORD, to deliver thee.');
id INTEGER PRIMARY KEY,
book_id INTEGER NOT NULL,
chapter_number INTEGER NOT NULL,
audio_local TEXT,
audio_online_fa TEXT,
audio_online_en TEXT
);
id INTEGER PRIMARY KEY,
chapter_id INTEGER NOT NULL,
verse_number INTEGER NOT NULL,
text_fa TEXT,
text_en TEXT
);
INSERT INTO chapters VALUES (25001,25,1,NULL,'http://audio1.wordfree.net/bibles/app/audio/20/25/1.mp3','http://audio1.wordfree.net/bibles/app/audio/20/25/1.mp3');
INSERT INTO verses VALUES (2500100001,25001,1,'span class="verse" id="1">1 </span چگونه‌ شهری‌ كه‌ پر از مخلوق‌ بود منفرد نشسته‌ است‌! چگونه‌ آنكه‌ در میان‌ امّت‌ها بزرگ‌ بود مثل‌ بیوه‌زن‌ شده‌ است‌! چگونه‌ آنكه‌ در میان‌ كشورها ملكه‌ بود خراجگذار گردیده‌ است‌!','span class="verse" id="1">1 </span How doth the city sit solitary, that was full of people! how is she become as a widow! she that was great among the nations, and princess among the provinces, how is she become tributary!');
INSERT INTO verses VALUES (2500100002,25001,2,'شبانگاه‌ زارزار گریه‌ می‌كند و اشكهایش‌ بر رخسارهایش‌ می‌باشد. از جمیع‌ محبّانش‌ برای‌ وی‌ تسلّی ‌دهنده‌ای‌ نیست‌. همه‌ دوستانش‌ بدو خیانت‌ ورزیده‌، دشمن‌ او شده‌اند.','She weepeth sore in the night, and her tears are on her cheeks: among all her lovers she hath none to comfort her: all her friends have dealt treacherously with her, they are become her enemies.');
INSERT INTO verses VALUES (2500100003,25001,3,'یهودا به‌ سبب‌ مصیبت‌ و سختی‌ بندگی‌، جلای‌ وطن‌ شده‌ است‌. در میان‌ امّت‌ها نشسته‌، راحت‌ نمی‌یابد و جمیع‌ تعاقب‌كنندگانش‌ در میان‌ جایهای‌ تنگ‌ به‌ او در رسیده‌اند.','Judah is gone into captivity because of affliction, and because of great servitude: she dwelleth among the heathen, she findeth no rest: all her persecutors overtook her between the straits.');
INSERT INTO verses VALUES (2500100004,25001,4,'راههای‌ صهیون‌ ماتم‌ می‌گیرند، چونكه‌ كسی‌ به‌ عیدهای‌ او نمی‌آید. همه‌ دروازه‌هایش‌ خراب‌ شده‌، كاهنانش‌ آه‌ می‌كشند. دوشیزگانش‌ در مرارت‌ می‌باشند و خودش‌ در تلخی‌.','The ways of Zion do mourn, because none come to the solemn feasts: all her gates are desolate: her priests sigh, her virgins are afflicted, and she is in bitterness.');
INSERT INTO verses VALUES (2500100005,25001,5,'خصمانش‌ سر شده‌اند و دشمنانش‌ فیروز گردیده‌، زیرا كه‌ یهوه‌ به‌ سبب‌ كثرت‌ عصیانش‌، او را ذلیل‌ ساخته‌ است‌. اطفالش‌ پیش‌ روی‌ دشمن‌ به‌ اسیری‌ رفته‌اند.','Her adversaries are the chief, her enemies prosper; for the LORD hath afflicted her for the multitude of her transgressions: her children are gone into captivity before the enemy.');
INSERT INTO verses VALUES (2500100006,25001,6,'و تمامی‌ زیبایی‌ دختر صهیون‌ از او زایل‌ شده‌، سرورانش‌ مثل‌ غزالهایی‌ كه‌ مرتعی‌ پیدا نمی‌كنند گردیده‌، از حضور تعاقب‌ كننده‌ بی‌قوّت‌ می‌روند.','And from the daughter of Zion all her beauty is departed: her princes are become like harts that find no pasture, and they are gone without strength before the pursuer.');
INSERT INTO verses VALUES (2500100007,25001,7,'اورشلیم‌ در روزهای‌ مذلّت‌ و شقاوت‌ خویش‌ تمام‌ نفایسی‌ را كه‌ در ایام‌ سابق‌ داشته‌ بود، به‌ یاد می‌آورد. زیرا كه‌ قوم‌ او به‌ دست‌ دشمن‌ افتاده‌اند و برای‌ وی‌ مدد كننده‌ای‌ نیست‌. دشمنانش‌ او را دیده‌، بر خرابیهایش‌ خندیدند.','Jerusalem remembered in the days of her affliction and of her miseries all her pleasant things that she had in the days of old, when her people fell into the hand of the enemy, and none did help her: the adversaries saw her, and did mock at her sabbaths.');
INSERT INTO verses VALUES (2500100008,25001,8,'اورشلیم‌ به‌ شدّت‌ گناه‌ ورزیده‌ و از این‌ سبب‌ مكروه‌ گردیده‌ است‌. جمیع‌ آنانی‌ كه‌ او را محترم‌ می‌داشتند، او را خوار می‌شمارند چونكه‌ برهنگی‌ او را دیده‌اند. و خودش‌ نیز آه‌ می‌كشد و به‌ عقب‌ برگشته‌ است‌.','Jerusalem hath grievously sinned; therefore she is removed: all that honoured her despise her, because they have seen her nakedness: yea, she sigheth, and turneth backward.');
INSERT INTO verses VALUES (2500100009,25001,9,'نجاست‌ او در دامنش‌ می‌باشد و آخرت‌ خویش‌ را به‌ یاد نمی‌آورد. و بطور عجیب‌ پست‌ گردیده‌، برای‌ وی‌ تسلّی‌دهنده‌ای‌ نیست‌. ای‌ یهوه‌ مذلّت‌ مرا ببین‌ زیرا كه‌ دشمن‌ تكبّر می‌نماید.','Her filthiness is in her skirts; she remembereth not her last end; therefore she came down wonderfully: she had no comforter. O LORD, behold my affliction: for the enemy hath magnified himself.');
INSERT INTO verses VALUES (2500100010,25001,10,'دشمن‌ دست‌ خویش‌ را بر همه‌ نفایس‌ او دراز كرده‌ است‌. زیرا امّت‌هایی‌ را كه‌ امر فرمودی‌ كه‌ به‌ جماعت‌ تو داخل‌ نشوند، دیده‌ است‌ كه‌ به‌ مقدس‌ او در می‌آیند.','The adversary hath spread out his hand upon all her pleasant things: for she hath seen that the heathen entered into her sanctuary, whom thou didst command that they should not enter into thy congregation.');
INSERT INTO verses VALUES (2500100011,25001,11,'تمام‌ قوم‌ او آه‌ كشیده‌، نان‌ می‌جویند. تمام‌ نفایس‌ خود را به‌ جهت‌ خوراك‌ داده‌اند تا جان‌ خود را تازه‌ كنند. ای‌ یهوه‌ ببین‌ و ملاحظه‌ فرما زیرا كه‌ من‌ خوار شده‌ام‌.','All her people sigh, they seek bread; they have given their pleasant things for meat to relieve the soul: see, O LORD, and consider; for I am become vile.');
INSERT INTO verses VALUES (2500100012,25001,12,'ای‌ جمیع‌ راه‌ گذریان‌ آیا این‌ در نظر شما هیچ‌ است‌؟ ملاحظه‌ كنید و ببینید آیا غمی‌ مثل‌ غم‌ من‌ بوده‌ است‌ كه‌ بر من‌ عارض‌ گردیده‌ و یهوه‌ در روز حدّت‌ خشم‌ خویش‌ مرا به‌ آن‌ مبتلا ساخته‌ است‌؟','Is it nothing to you, all ye that pass by? behold, and see if there be any sorrow like unto my sorrow, which is done unto me, wherewith the LORD hath afflicted me in the day of his fierce anger.');
INSERT INTO verses VALUES (2500100013,25001,13,'آتش‌ از اعلی‌ علیین‌ به‌ استخوانهای‌ من‌ فرستاده‌، آنها را زبون‌ ساخته‌ است‌. دام‌ برای‌ پایهایم‌ گسترانیده‌، مرا به‌ عقب‌ برگردانیده‌، و مرا ویران‌ و در تمام‌ روز غمگین‌ ساخته‌ است‌.','From above hath he sent fire into my bones, and it prevaileth against them: he hath spread a net for my feet, he hath turned me back: he hath made me desolate and faint all the day.');
INSERT INTO verses VALUES (2500100014,25001,14,'یوغ‌ عصیان‌ من‌ به‌ دست‌ وی‌ محكم‌ بسته‌شده‌، آنها به‌ هم‌ پیچیده‌ بر گردن‌ من‌ برآمده‌ است‌. خداوند قوّت‌ مرا زایل‌ ساخته‌ و مرا به‌ دست‌ كسانی‌ كه‌ با ایشان‌ مقاومت‌ نتوانم‌ نمود تسلیم‌ كرده‌ است‌.','The yoke of my transgressions is bound by his hand: they are wreathed, and come up upon my neck: he hath made my strength to fall, the LORD hath delivered me into their hands, from whom I am not able to rise up.');
INSERT INTO verses VALUES (2500100015,25001,15,'خداوند جمیع‌ شجاعان‌ مرا در میانم‌ تلف‌ ساخته‌ است‌. جماعتی‌ بر من‌ خوانده‌ است‌ تا جوانان‌ مرا منكسر سازند. و خداوند آن‌ دوشیزه‌ یعنی‌ دختر یهودا را در چرخشت‌ پایمال‌ كرده‌ است‌.','The LORD hath trodden under foot all my mighty men in the midst of me: he hath called an assembly against me to crush my young men: the LORD hath trodden the virgin, the daughter of Judah , as in a winepress.');
INSERT INTO verses VALUES (2500100016,25001,16,'به‌ سبب‌ این‌ چیزها گریه‌ می‌كنم‌. از چشم‌ من‌، از چشم‌ من‌ آب‌ می‌ریزد زیرا تسلّی‌ دهنده‌ و تازه‌ كننده‌ جانم‌ از من‌ دور است‌. پسرانم‌ هلاك‌ شده‌اند زیرا كه‌ دشمن‌، غالب‌ آمده‌ است‌.','For these things I weep; mine eye, mine eye runneth down with water, because the comforter that should relieve my soul is far from me: my children are desolate, because the enemy prevailed.');
INSERT INTO verses VALUES (2500100017,25001,17,'صهیون‌ دستهای‌ خود را دراز می‌كند امّا برایش‌ تسلّی‌دهنده‌ای‌ نیست‌. یهوه‌ درباره‌ یعقوب‌ امر فرموده‌ است‌ كه‌ مجاورانش‌ دشمن‌ او بشوند، پس‌ اورشلیم‌ در میان‌ آنها مكروه‌ گردیده‌ است‌.','Zion spreadeth forth her hands, and there is none to comfort her: the LORD hath commanded concerning Jacob , that his adversaries should be round about him: Jerusalem is as a menstruous woman among them.');
INSERT INTO verses VALUES (2500100018,25001,18,'یهوه‌ عادل‌ است‌ زیرا كه‌ من‌ از فرمان‌ او عصیان‌ ورزیده‌ام‌. ای‌ جمیع‌ امّت‌ها بشنوید و غم‌ مرا مشاهده‌ نمایید! دوشیزگان‌ و جوانان‌ من‌ به‌ اسیری‌ رفته‌اند.','The LORD is righteous; for I have rebelled against his commandment: hear, I pray you, all people, and behold my sorrow: my virgins and my young men are gone into captivity.');
INSERT INTO verses VALUES (2500100019,25001,19,'محبّان‌ خویش‌ را خواندم‌ امّا ایشان‌ مرا فریب‌ دادند. كاهنان‌ و مشایخ‌ من‌ كه‌ خوراك‌ می‌جستند تا جان‌ خود را تازه‌ كنند، در شهر جان‌ دادند.','I called for my lovers, but they deceived me: my priests and mine elders gave up the ghost in the city, while they sought their meat to relieve their souls.');
INSERT INTO verses VALUES (2500100020,25001,20,'ای‌ یهوه‌ نظر كن‌ زیرا كه‌ در تنگی‌ هستم‌. احشایم‌ می‌جوشد و دلم‌ در اندرون‌ من‌ منقلب‌ شده‌ است‌ چونكه‌ به‌ شدّت‌ عصیان‌ ورزیده‌ام‌. در بیرون‌ شمشیر هلاك‌ می‌كند و در خانه‌ها مثل‌ موت‌ است‌.','Behold, O LORD; for I am in distress: my bowels are troubled; mine heart is turned within me; for I have grievously rebelled: abroad the sword bereaveth, at home there is as death.');
INSERT INTO verses VALUES (2500100021,25001,21,'می‌شنوند كه‌ آه‌ می‌كشم‌ امّا برایم‌تسلّی‌دهنده‌ای‌ نیست‌. دشمنانم‌ چون‌ بلای‌ مرا شنیدند، مسرور شدند كه‌ تو این‌ را كرده‌ای‌. امّا تو روزی‌ را كه‌ اعلان‌ نموده‌ای‌ خواهی‌ آورد و ایشان‌ مثل‌ من‌ خواهند شد.','They have heard that I sigh: there is none to comfort me: all mine enemies have heard of my trouble; they are glad that thou hast done it: thou wilt bring the day that thou hast called, and they shall be like unto me.');
INSERT INTO verses VALUES (2500100022,25001,22,'تمامی‌ شرارت‌ ایشان‌ به‌ نظر تو بیاید. و چنانكه‌ با من‌ به‌ سبب‌ تمامی‌ معصیتم‌ عمل‌ نمودی‌، به‌ ایشان‌ نیز عمل‌ نما. زیرا كه‌ ناله‌های‌ من‌ بسیار است‌ و دلم‌ بی‌تاب‌ شده‌ است‌.','Let all their wickedness come before thee; and do unto them, as thou hast done unto me for all my transgressions: for my sighs are many, and my heart is faint.');
id INTEGER PRIMARY KEY,
book_id INTEGER NOT NULL,
chapter_number INTEGER NOT NULL,
audio_local TEXT,
audio_online_fa TEXT,
audio_online_en TEXT
);
id INTEGER PRIMARY KEY,
chapter_id INTEGER NOT NULL,
verse_number INTEGER NOT NULL,
text_fa TEXT,
text_en TEXT
);
INSERT INTO chapters VALUES (26001,26,1,NULL,'http://audio1.wordfree.net/bibles/app/audio/20/26/1.mp3','http://audio1.wordfree.net/bibles/app/audio/20/26/1.mp3');
INSERT INTO verses VALUES (2600100001,26001,1,'span class="verse" id="1">1 </span و در روز پنجم‌ ماه‌ چهارم‌ سال‌ سی‌ام‌، چون‌من‌ در میان‌ اسیران‌ نزد نهر خابور بودم‌، واقع‌ شد كه‌ آسمان‌ گشوده‌ گردید و رؤیاهای‌ خدا را دیدم‌.','span class="verse" id="1">1 </span Now it came to pass in the thirtieth year, in the fourth month, in the fifth day of the month, as I was among the captives by the river of Chebar, that the heavens were opened, and I saw visions of God.');
INSERT INTO verses VALUES (2600100002,26001,2,'در پنجم‌ آن‌ ماه‌ كه‌ سال‌ پنجم‌ اسیری‌ یهویاكین‌ پادشاه‌ بود،','In the fifth day of the month, which was the fifth year of king Jehoiachin''s captivity,');
INSERT INTO verses VALUES (2600100003,26001,3,'كلام‌ یهوه‌ بر حزقیال‌ بن‌ بوزی‌ كاهن‌ نزد نهر خابور در زمین‌ كلدانیان‌ نازل‌ شد و دست‌ خداوند در آنجا بر او بود.','The word of the LORD came expressly unto Ezekiel the priest, the son of Buzi, in the land of the Chaldeans by the river Chebar; and the hand of the LORD was there upon him.');
INSERT INTO verses VALUES (2600100004,26001,4,'پس‌ نگریستم‌ و اینك‌ باد شدیدی‌ از طرف‌ شمال‌ برمی‌آید و ابر عظیمی‌ و آتش‌ جهنده‌ و درخشندگی‌ای‌ گرداگردش‌ و از میانش‌ یعنی‌ از میان‌ آتش‌، مثل‌ منظر برنج‌ تابان‌ بود.','And I looked, and, behold, a whirlwind came out of the north, a great cloud, and a fire infolding itself, and a brightness was about it, and out of the midst thereof as the colour of amber, out of the midst of the fire.');
INSERT INTO verses VALUES (2600100005,26001,5,'و از میانش‌ شبیه‌ چهار حیوان‌ پدید آمد و نمایش‌ ایشان‌ این‌ بود كه‌ شبیه‌ انسان‌ بودند.','Also out of the midst thereof came the likeness of four living creatures. And this was their appearance; they had the likeness of a man.');
INSERT INTO verses VALUES (2600100006,26001,6,'و هریك‌ از آنها چهار رو داشت‌ و هریك‌ از آنها چهار بال‌ داشت‌.','And every one had four faces, and every one had four wings.');
INSERT INTO verses VALUES (2600100007,26001,7,'و پایهای‌ آنها پایهای‌ مستقیم‌ و كف‌ پای‌ آنها مانند كف‌ پای‌ گوساله‌ بود و مثل‌ منظر برنج‌ صیقلی‌ درخشان‌ بود.','And their feet were straight feet; and the sole of their feet was like the sole of a calf''s foot: and they sparkled like the colour of burnished brass.');
INSERT INTO verses VALUES (2600100008,26001,8,'و زیر بالهای‌ آنها از چهار طرف‌ آنها دستهای‌ انسان‌ بود و آن‌ چهار رویها و بالهای‌ خود را چنین‌ داشتند.','And they had the hands of a man under their wings on their four sides; and they four had their faces and their wings.');
INSERT INTO verses VALUES (2600100009,26001,9,'و بالهای‌ آنها به‌ یكدیگر پیوسته‌ بود و چون‌ می‌رفتند رو نمی‌تافتند، بلكه‌ هریك‌ به‌ راه‌ مستقیم‌ می‌رفتند.','Their wings were joined one to another; they turned not when they went; they went every one straight forward.');
INSERT INTO verses VALUES (2600100010,26001,10,'و امّا شباهت‌ رویهای‌ آنها (این‌ بود كه‌) آنها روی‌ انسان‌ داشتند و آن‌ چهار روی‌ شیر بطرف‌ راست‌ داشتند و آن‌ چهار روی‌ گاو بطرف‌ چپ‌ داشتند و آن‌ چهارروی‌ عقاب‌ داشتند.','As for the likeness of their faces, they four had the face of a man, and the face of a lion, on the right side: and they four had the face of an ox on the left side; they four also had the face of an eagle.');
INSERT INTO verses VALUES (2600100011,26001,11,'و رویها و بالهای‌ آنها از طرف‌ بالا از یكدیگر جدا بود و دو بال‌ هریك‌ به‌ همدیگر پیوسته‌ و دو بال‌ دیگر بدن‌ آنها را می‌پوشانید.','Thus were their faces: and their wings were stretched upward; two wings of every one were joined one to another, and two covered their bodies.');
INSERT INTO verses VALUES (2600100012,26001,12,'و هر یك‌ از آنها به‌ راه‌ مستقیم‌ می‌رفتند و به‌ هر جایی‌ كه‌ روح‌ می‌رفت‌ آنها می‌رفتند و درحین‌ رفتن‌ رو نمی‌تافتند.','And they went every one straight forward: whither the spirit was to go, they went; and they turned not when they went.');
INSERT INTO verses VALUES (2600100013,26001,13,'و امّا شباهت‌ این‌ حیوانات‌ (این‌ بود كه‌) صورت‌ آنها مانند شعله‌های‌ اخگرهای‌ آتش‌ افروخته‌ شده‌، مثل‌ صورت‌ مشعلها بود. و آن‌ آتش‌ در میان‌ آن‌ حیوانات‌ گردش‌ می‌كرد و درخشان‌ می‌بود و از میان‌ آتش‌ برق‌ می‌جهید.','As for the likeness of the living creatures, their appearance was like burning coals of fire, and like the appearance of lamps: it went up and down among the living creatures; and the fire was bright, and out of the fire went forth lightning.');
INSERT INTO verses VALUES (2600100014,26001,14,'و آن‌ حیوانات‌ مثل‌ صورت‌ برق‌ می‌دویدند و برمی‌گشتند.','And the living creatures ran and returned as the appearance of a flash of lightning.');
INSERT INTO verses VALUES (2600100015,26001,15,'و چون‌ آن‌ حیوانات‌ را ملاحظه‌ می‌كردم‌، اینك‌ یك‌ چرخ‌ به‌ پهلوی‌ آن‌ حیوانات‌ برای‌ هر روی‌ (هركدام‌ از) آن‌ چهار بر زمین‌ بود.','Now as I beheld the living creatures, behold one wheel upon the earth by the living creatures, with his four faces.');
INSERT INTO verses VALUES (2600100016,26001,16,'و صورت‌ چرخها و صنعت‌ آنها مثل‌ منظر زبرجد بود و آن‌ چهار یك‌ شباهت‌ داشتند. و صورت‌ و صنعت‌ آنها مثل‌ چرخ‌ در میان‌ چرخ‌ بود.','The appearance of the wheels and their work was like unto the colour of a beryl: and they four had one likeness: and their appearance and their work was as it were a wheel in the middle of a wheel.');
INSERT INTO verses VALUES (2600100017,26001,17,'و چون‌ آنها می‌رفتند، بر چهار جانب‌ خود می‌رفتند و در حین‌ رفتن‌ به‌ هیچ‌ طرف‌ میل‌ نمی‌كردند.','When they went, they went upon their four sides: and they turned not when they went.');
INSERT INTO verses VALUES (2600100018,26001,18,'و فلكه‌های‌ آنها بلند و مهیب‌ بود و فلكه‌های‌ آن‌ چهار از هر طرف‌ از چشمها پر بود.','As for their rings, they were so high that they were dreadful; and their rings were full of eyes round about them four.');
INSERT INTO verses VALUES (2600100019,26001,19,'و چون‌ آن‌ حیوانات‌ می‌رفتند، چرخها در پهلوی‌ آنها می‌رفت‌ و چون‌ آن‌ حیوانات‌ از زمین‌ بلند می‌شدند، چرخها بلند می‌شد.','And when the living creatures went, the wheels went by them: and when the living creatures were lifted up from the earth, the wheels were lifted up.');
INSERT INTO verses VALUES (2600100020,26001,20,'و هرجایی‌ كه‌ روح‌ می‌رفت‌ آنها می‌رفتند، به‌ هر جا كه‌ روح‌ سیر می‌كرد و چرخها پیش‌ روی‌ آنها بلند می‌شد، زیرا كه‌ روح‌ حیوانات‌ در چرخها بود.','Whithersoever the spirit was to go, they went, thither was their spirit to go; and the wheels were lifted up over against them: for the spirit of the living creature was in the wheels.');
INSERT INTO verses VALUES (2600100021,26001,21,'و چون‌ آنها می‌رفتند، اینها می‌رفت‌ و چون‌ آنها می‌ایستادند، اینها می‌ایستاد. و چون‌ آنها از زمین‌ بلند می‌شدند، چرخها پیش‌ روی‌ آنها از زمین‌ بلند می‌شد، زیرا روح‌ حیوانات‌ در چرخها بود.','When those went, these went; and when those stood, these stood; and when those were lifted up from the earth, the wheels were lifted up over against them: for the spirit of the living creature was in the wheels.');
INSERT INTO verses VALUES (2600100022,26001,22,'و شباهت‌ فلكی‌ كه‌ بالای‌ سر حیوانات‌ بود مثل‌ منظر بلّورِ مهیب‌ بود و بالای‌ سر آنها پهن‌ شده‌ بود.','And the likeness of the firmament upon the heads of the living creature was as the colour of the terrible crystal, stretched forth over their heads above.');
INSERT INTO verses VALUES (2600100023,26001,23,'و بالهای‌ آنها زیر فلك‌ بسوی‌ یكدیگر مستقیم‌ بود و دو بال‌ هریك‌ از این‌ طرف‌ می‌پوشانید و دو بال‌ هر یك‌ از آن‌ طرف‌ بدنهای‌ آنها را می‌پوشانید.','And under the firmament were their wings straight, the one toward the other: every one had two, which covered on this side, and every one had two, which covered on that side, their bodies.');
INSERT INTO verses VALUES (2600100024,26001,24,'و چون‌ می‌رفتند، من‌ صدای‌ بالهای‌ آنها را مانند صدای‌ آبهای‌ بسیار، مثل‌ آواز حضرت‌ اعلی‌ و صدای‌ هنگامه‌ را مثل‌ صدای‌ فوج‌ شنیدم‌؛ زیرا كه‌ چون‌ می‌ایستادند بالهای‌ خویش‌ را فرو می‌هشتند.','And when they went, I heard the noise of their wings, like the noise of great waters, as the voice of the Almighty, the voice of speech, as the noise of an host: when they stood, they let down their wings.');
INSERT INTO verses VALUES (2600100025,26001,25,'و چون‌ در حین‌ ایستادن‌ بالهای‌ خود را فرو می‌هشتند، صدایی‌ از فلكی‌ كه‌ بالای‌ سر آنها بود مسموع‌ می‌شد.','And there was a voice from the firmament that was over their heads, when they stood, and had let down their wings.');
INSERT INTO verses VALUES (2600100026,26001,26,'و بالای‌ فلكی‌ كه‌ بر سر آنها بود شباهتِ تختی‌ مثل‌ صورت‌ یاقوت‌ كبود بود و برآن‌ شباهتِ تخت‌، شباهتی‌ مثل‌ صورت‌ انسان‌ بر فوق‌ آن‌ بود.','And above the firmament that was over their heads was the likeness of a throne, as the appearance of a sapphire stone: and upon the likeness of the throne was the likeness as the appearance of a man above upon it.');
INSERT INTO verses VALUES (2600100027,26001,27,'و از منظر كمر او بطرف‌ بالا مثل‌ منظر برنج‌ تابان‌، مانند نمایش‌ آتش‌ در اندرون‌ آن‌ و گرداگردش‌ دیدم‌. و از منظر كمر او به‌ طرف‌ پایین‌ مثل‌ نمایش‌ آتشی‌ كه‌ از هر طرف‌ درخشان‌ بود دیدم‌.','And I saw as the colour of amber, as the appearance of fire round about within it, from the appearance of his loins even upward, and from the appearance of his loins even downward, I saw as it were the appearance of fire, and it had brightness round about.');
INSERT INTO verses VALUES (2600100028,26001,28,'مانند نمایش‌ قوس‌ قزح‌ كه‌ در روز باران‌ در ابر می‌باشد، همچنین‌ آن‌ درخشندگی‌ گرداگرد آن‌ بود. این‌ منظرِ شباهتِ جلال‌ یهوه‌ بودو چون‌ آن‌ را دیدم‌، به‌ روی‌ خود در افتادم‌ و آواز قائلی‌ را شنیدم‌،','As the appearance of the bow that is in the cloud in the day of rain, so was the appearance of the brightness round about. This was the appearance of the likeness of the glory of the LORD. And when I saw it, I fell upon my face, and I heard a voice of one that spake.');
id INTEGER PRIMARY KEY,
book_id INTEGER NOT NULL,
chapter_number INTEGER NOT NULL,
audio_local TEXT,
audio_online_fa TEXT,
audio_online_en TEXT
);
id INTEGER PRIMARY KEY,
chapter_id INTEGER NOT NULL,
verse_number INTEGER NOT NULL,
text_fa TEXT,
text_en TEXT
);
INSERT INTO chapters VALUES (27001,27,1,NULL,'http://audio1.wordfree.net/bibles/app/audio/20/27/1.mp3','http://audio1.wordfree.net/bibles/app/audio/20/27/1.mp3');
INSERT INTO verses VALUES (2700100001,27001,1,'span class="verse" id="1">1 </span در سال‌ سوم‌ سلطنت‌ یهُویاقیم‌ پادشاه یهودا، نَبوْكَدْنَصَّر پادشاه‌ بابل‌ به‌ اورشلیم‌ آمده‌، آن‌ را محاصره‌ نمود.','span class="verse" id="1">1 </span In the third year of the reign of Jehoiakim king of Judah came Nebuchadnezzar king of Babylon unto Jerusalem , and besieged it.');
INSERT INTO verses VALUES (2700100002,27001,2,'و خداوند یهُویاقیم‌ پادشاه‌ یهودا را با بعضی‌ از ظروف‌ خانه‌ خدا به‌ دست‌ او تسلیم‌ نمود و او آنها را به‌ زمین‌ شِنْعار به‌ خانه‌ خدای‌ خود آورد و ظروف‌ را به‌ بیت‌المال‌ خدای‌ خویش‌ گذاشت‌.','And the Lord gave Jehoiakim king of Judah into his hand, with part of the vessels of the house of God: which he carried into the land of Shinar to the house of his god; and he brought the vessels into the treasure house of his god.');
INSERT INTO verses VALUES (2700100003,27001,3,'و پادشاه‌ اَشفَناز رئیس‌ خواجه‌ سرایان‌ خویش‌ را امر فرمود كه‌ بعضی‌ از بنی‌اسرائیل‌ و از اولاد پادشاهان‌ و از شُرَفا را بیاورد.','And the king spake unto Ashpenaz the master of his eunuchs, that he should bring certain of the children of Israel , and of the king''s seed, and of the princes;');
INSERT INTO verses VALUES (2700100004,27001,4,'جوانانی‌ كه‌ هیچ‌ عیبی‌ نداشته‌ باشند و نیكومنظر و در هرگونه‌ حكمت‌ ماهر و به‌ علم‌ دانا و به‌ فنون‌ فهیم‌ باشند كه‌ قابلیت‌ برای‌ ایستادن‌ در قصر پادشاه‌ داشته‌ باشند و علم‌ و زبان‌ كلدانیان‌ را به‌ ایشان‌ تعلیم‌ دهند.','Children in whom was no blemish, but well favoured, and skilful in all wisdom, and cunning in knowledge, and understanding science, and such as had ability in them to stand in the king''s palace, and whom they might teach the learning and the tongue of the Chaldeans.');
INSERT INTO verses VALUES (2700100005,27001,5,'و پادشاه‌ وظیفه‌ روزینه‌ از طعام‌ پادشاه‌ و از شرابی‌ كه‌ او می‌نوشید تعیین‌ نمود و (امر فرمود) كه‌ ایشان‌ را سه‌ سال‌ تربیت‌ نمایند و بعد از انقضای‌ آن‌ مدّت‌ در حضور پادشاه‌ حاضر شوند.','And the king appointed them a daily provision of the king''s meat, and of the wine which he drank: so nourishing them three years, that at the end thereof they might stand before the king.');
INSERT INTO verses VALUES (2700100006,27001,6,'و در میان‌ ایشان‌ دانیال‌ و حَنَنْیا و میشائیل‌ و عَزَرْیا از بنی‌یهودا بودند.','Now among these were of the children of Judah , Daniel , Hananiah, Mishael , and Azariah:');
INSERT INTO verses VALUES (2700100007,27001,7,'و رئیس‌ خواجه‌ سرایان‌ نامها به‌ ایشان‌ نهاد، اما دانیال‌ را به‌ بَلْطَشَصَّر و حَنَنْیا را به‌ شَدْرَك‌ و میشائیل‌ را به‌ میشَك‌ و عَزَرْیا را به‌ عَبْدْنَغُو مسمّی‌ ساخت‌.','Unto whom the prince of the eunuchs gave names: for he gave unto Daniel the name of Belteshazzar; and to Hananiah, of Shadrach; and to Mishael , of Meshach; and to Azariah, of Abednego.');
INSERT INTO verses VALUES (2700100008,27001,8,'امّا دانیال‌ در دل‌ خود قصد نمود كه‌ خویشتن‌ را از طعام‌ پادشاه‌ و از شرابی‌ كه‌ او می‌نوشیدنجس‌ نسازد. پس‌ از رئیس‌ خواجه‌ سرایان‌ درخواست‌ نمود كه‌ خویشتن‌ را نجس‌ نسازد.','But Daniel purposed in his heart that he would not defile himself with the portion of the king''s meat, nor with the wine which he drank: therefore he requested of the prince of the eunuchs that he might not defile himself.');
INSERT INTO verses VALUES (2700100009,27001,9,'و خدا دانیال‌ را نزد رئیس‌ خواجه‌ سرایان‌ محترم‌ و مكرّم‌ ساخت‌.','Now God had brought Daniel into favour and tender love with the prince of the eunuchs.');
INSERT INTO verses VALUES (2700100010,27001,10,'پس‌ رئیس‌ خواجه‌ سرایان‌ به‌ دانیال‌ گفت‌: «من‌ از آقای‌ خود پادشاه‌ كه‌ خوراك‌ و مشروبات‌ شما را تعیین‌ نموده‌ است‌ می‌ترسم‌. چرا چهره‌های‌ شما را از سایر جوانانی‌ كه‌ ابنای‌ جنس‌ شما می‌باشند، زشتتر بیند و همچنین‌ سر مرا نزد پادشاه‌ در خطر خواهید انداخت‌.»','And the prince of the eunuchs said unto Daniel , I fear my lord the king, who hath appointed your meat and your drink: for why should he see your faces worse liking than the children which are of your sort? then shall ye make me endanger my head to the king.');
INSERT INTO verses VALUES (2700100011,27001,11,'پس‌ دانیال‌ به‌ رئیس‌ ساقیان‌ كه‌ رئیس‌ خواجه‌سرایان‌ او را بر دانیال‌ و حَنَنْیا و میشائیل‌ و عَزَرْیا گماشته‌ بود گفت‌:','Then said Daniel to Melzar, whom the prince of the eunuchs had set over Daniel , Hananiah, Mishael , and Azariah,');
INSERT INTO verses VALUES (2700100012,27001,12,'«مستدعی‌ آنكه‌ بندگان‌ خود را ده‌ روز تجربه‌ نمایی‌ و به‌ ما بُقُول‌ برای‌ خوردن‌ بدهند و آب‌ به‌ جهت‌ نوشیدن‌.','Prove thy servants, I beseech thee, ten days; and let them give us pulse to eat, and water to drink.');
INSERT INTO verses VALUES (2700100013,27001,13,'و چهره‌های‌ ما و چهره‌های‌ سایر جوانانی‌ را كه‌ طعام‌ پادشاه‌ را می‌خورند به‌ حضور تو ملاحظه‌ نمایند و به‌ نَهجی‌ كه‌ خواهی‌ دید با بندگانت‌ عمل‌ نمای‌.»','Then let our countenances be looked upon before thee, and the countenance of the children that eat of the portion of the king''s meat: and as thou seest, deal with thy servants.');
INSERT INTO verses VALUES (2700100014,27001,14,'و او ایشان‌ را در این‌ امر اجابت‌ نموده‌، ده‌ روز ایشان‌ را تجربه‌ كرد.','So he consented to them in this matter, and proved them ten days.');
INSERT INTO verses VALUES (2700100015,27001,15,'و بعد از انقضای‌ ده‌ روز معلوم‌ شد كه‌ چهره‌های‌ ایشان‌ از سایر جوانانی‌ كه‌ طعام‌ پادشاه‌ را می‌خوردند نیكوتر و فربه‌تر بود.','And at the end of ten days their countenances appeared fairer and fatter in flesh than all the children which did eat the portion of the king''s meat.');
INSERT INTO verses VALUES (2700100016,27001,16,'پس‌ رئیس‌ ساقیان‌ طعام‌ ایشان‌ و شراب‌ را كه‌ باید بنوشند برداشت‌ و بُقُول‌ به‌ ایشان‌ داد.','Thus Melzar took away the portion of their meat, and the wine that they should drink; and gave them pulse.');
INSERT INTO verses VALUES (2700100017,27001,17,'اما خدا به‌ این‌ چهار جوان‌ معرفت‌ و ادراك‌ در هر گونه‌ علم‌ و حكمت‌ عطا فرمود و دانیال‌ در همه‌ رؤیاها و خوابها فهیم‌ گردید.','As for these four children, God gave them knowledge and skill in all learning and wisdom: and Daniel had understanding in all visions and dreams.');
INSERT INTO verses VALUES (2700100018,27001,18,'و بعد ازانقضای‌ روزهایی‌ كه‌ پادشاه‌ امر فرموده‌ بود كه‌ ایشان‌ را بیاورند، رئیس‌ خواجه‌ سرایان‌ ایشان‌ را به‌ حضور نَبوْكَدْنَصَّر آورد.','Now at the end of the days that the king had said he should bring them in, then the prince of the eunuchs brought them in before Nebuchadnezzar .');
INSERT INTO verses VALUES (2700100019,27001,19,'و پادشاه‌ با ایشان‌ گفتگو كرد و از جمیع‌ ایشان‌ كسی‌ مثل‌ دانیال‌ و حَنَنْیا و میشائیل‌ و عَزَرْیا یافت‌ نشد پس‌ در حضور پادشاه‌ ایستادند.','And the king communed with them; and among them all was found none like Daniel , Hananiah, Mishael , and Azariah: therefore stood they before the king.');
INSERT INTO verses VALUES (2700100020,27001,20,'و در هر مسأله‌ حكمت‌ و فطانت‌ كه‌ پادشاه‌ از ایشان‌ استفسار كرد، ایشان‌ را از جمیع‌ مجوسیان‌ و جادوگرانی‌ كه‌ در تمام‌ مملكت‌ او بودند ده‌ مرتبه‌ بهتر یافت‌.','And in all matters of wisdom and understanding, that the king enquired of them, he found them ten times better than all the magicians and astrologers that were in all his realm.');
INSERT INTO verses VALUES (2700100021,27001,21,'و دانیال‌ بود تا سال‌ اول‌ كورش‌ پادشاه‌.','And Daniel continued even unto the first year of king Cyrus .');
id INTEGER PRIMARY KEY,
book_id INTEGER NOT NULL,
chapter_number INTEGER NOT NULL,
audio_local TEXT,
audio_online_fa TEXT,
audio_online_en TEXT
);
id INTEGER PRIMARY KEY,
chapter_id INTEGER NOT NULL,
verse_number INTEGER NOT NULL,
text_fa TEXT,
text_en TEXT
);
INSERT INTO chapters VALUES (28001,28,1,NULL,'http://audio1.wordfree.net/bibles/app/audio/20/28/1.mp3','http://audio1.wordfree.net/bibles/app/audio/20/28/1.mp3');
INSERT INTO verses VALUES (2800100001,28001,1,'span class="verse" id="1">1 </span كلام‌ خداوند كه‌ در ایام‌ عُزّیا و یوتام‌ و آحاز و حِزقیا پادشاهان‌ یهودا و در ایام‌ یربعام‌ بن‌ یوآش‌ پادشاه‌ اسرائیل‌، بر هوشع‌ بن‌ بَئیری‌ نازل‌ شد.','span class="verse" id="1">1 </span The word of the LORD that came unto Hosea, the son of Beeri , in the days of Uzziah, Jotham, Ahaz, and Hezekiah, kings of Judah , and in the days of Jeroboam the son of Joash, king of Israel .');
INSERT INTO verses VALUES (2800100002,28001,2,'ابتدای‌ كلام‌ خداوند به‌ هوشع‌. خداوند به‌ هوشع‌ گفت‌: «برو و زنی‌ زانیه‌ و اولاد زناكار برای‌ خود بگیر زیرا كه‌ این‌ زمین‌ از خداوند برگشته‌، سخت‌ زناكار شده‌اند.»','The beginning of the word of the LORD by Hosea. And the LORD said to Hosea, Go, take unto thee a wife of whoredoms and children of whoredoms: for the land hath committed great whoredom, departing from the LORD.');
INSERT INTO verses VALUES (2800100003,28001,3,'پس‌ رفت‌ و جُومَر دختر دبلایم‌ را گرفت‌ و او حامله‌ شده‌، پسری‌ برایش‌ زایید.','So he went and took Gomer the daughter of Diblaim; which conceived, and bare him a son.');
INSERT INTO verses VALUES (2800100004,28001,4,'و خداوند وی‌ را گفت‌: «او را یزرعیل‌ نام‌ بنه‌ زیرا كه‌ بعد از اندك‌ زمانی‌ انتقام‌ خون‌ یزرعیل‌ را از خاندان‌ ییهو خواهم‌ گرفت‌ و مملكت‌ خاندان‌ اسرائیل‌ را تلف‌ خواهم‌ ساخت‌.','And the LORD said unto him, Call his name Jezreel; for yet a little while, and I will avenge the blood of Jezreel upon the house of Jehu, and will cause to cease the kingdom of the house of Israel .');
INSERT INTO verses VALUES (2800100005,28001,5,'و در آن‌ روز كمان‌ اسرائیل‌ را در وادی‌ یزرعیل‌ خواهم‌ شكست‌.»','And it shall come to pass at that day, that I will break the bow of Israel in the valley of Jezreel.');
INSERT INTO verses VALUES (2800100006,28001,6,'پس‌ بار دیگر حامله‌ شده‌، دختری‌ زایید و او وی‌ را گفت‌: «او را لُوروحامَه‌ نام‌ بگذار، زیرا بار دیگر بر خاندان‌ اسرائیل‌ رحمت‌ نخواهم‌ فرمود، بلكه‌ ایشان‌ را از میان‌ بالكلّ خواهم‌ برداشت‌.','And she conceived again, and bare a daughter. And God said unto him, Call her name Loruhamah: for I will no more have mercy upon the house of Israel ; but I will utterly take them away.');
INSERT INTO verses VALUES (2800100007,28001,7,'لیكن‌ بر خاندان‌ یهودا رحمت‌ خواهم‌ فرمود و ایشان‌ را به‌ یهوه‌ خدای‌ ایشان‌ نجات‌ خواهم‌ داد و ایشان‌ را به‌ كمان‌ و شمشیر و جنگ‌ و اسبان‌ و سواران‌ نخواهم‌ رهانید.»','But I will have mercy upon the house of Judah , and will save them by the LORD their God, and will not save them by bow, nor by sword, nor by battle, by horses, nor by horsemen.');
INSERT INTO verses VALUES (2800100008,28001,8,'و چون‌ لُوروحامَه‌ را از شیر بازداشته‌ بود، حامله‌ شده‌، پسری‌ زایید.','Now when she had weaned Loruhamah, she conceived, and bare a son.');
INSERT INTO verses VALUES (2800100009,28001,9,'و او گفت‌: «نام‌ او را لُوعَمّی‌ بخوان‌ زیرا كه‌ شما قوم‌ من‌ نیستید و من‌ (خدای‌) شما نیستم‌.','Then said God, Call his name Loammi: for ye are not my people, and I will not be your God.');
INSERT INTO verses VALUES (2800100010,28001,10,'لیكن‌ شماره‌ بنی‌اسرائیل‌ مثل‌ ریگ‌ دریا خواهد بود كه‌ نتوان‌ پیمود و نتوان‌ شمرد و در مكانی‌ كه‌ به‌ ایشان‌ گفته‌ می‌شد شما قوم‌ من‌ نیستید، در آنجا گفته‌ خواهد شد پسران‌ خدای‌ حی می‌باشید.','Yet the number of the children of Israel shall be as the sand of the sea, which cannot be measured nor numbered; and it shall come to pass, that in the place where it was said unto them, Ye are not my people, there it shall be said unto them, Ye are the sons of the living God.');
INSERT INTO verses VALUES (2800100011,28001,11,'و بنی‌یهودا و بنی‌اسرائیل‌ با هم‌ جمع‌ خواهند شد و یك‌ رئیس‌ به‌ جهت‌ خود نصب‌ نموده‌، از آن‌ زمین‌ برخواهند آمد زیرا كه‌ روز یزرعیل‌، روز عظیمی‌ خواهد بود.»','Then shall the children of Judah and the children of Israel be gathered together, and appoint themselves one head, and they shall come up out of the land: for great shall be the day of Jezreel.');
id INTEGER PRIMARY KEY,
book_id INTEGER NOT NULL,
chapter_number INTEGER NOT NULL,
audio_local TEXT,
audio_online_fa TEXT,
audio_online_en TEXT
);
id INTEGER PRIMARY KEY,
chapter_id INTEGER NOT NULL,
verse_number INTEGER NOT NULL,
text_fa TEXT,
text_en TEXT
);
INSERT INTO chapters VALUES (29001,29,1,NULL,'http://audio1.wordfree.net/bibles/app/audio/20/29/1.mp3','http://audio1.wordfree.net/bibles/app/audio/20/29/1.mp3');
INSERT INTO verses VALUES (2900100001,29001,1,'span class="verse" id="1">1 </span كلام‌ خداوند كه‌ بر یوئیل‌ بن‌ فَتُوئیل‌نازل‌ شد.','span class="verse" id="1">1 </span The word of the LORD that came to Joel the son of Pethuel.');
INSERT INTO verses VALUES (2900100002,29001,2,'ای‌ مشایخ‌ این‌ را بشنوید! و ای‌ جمیع‌ ساكنان‌ زمین‌ این‌ را گوش‌ گیرید! آیا مثل‌ این‌ در ایام‌ شما یا در ایام‌ پدران‌ شما واقع‌ شده‌ است‌؟','Hear this, ye old men, and give ear, all ye inhabitants of the land. Hath this been in your days, or even in the days of your fathers?');
INSERT INTO verses VALUES (2900100003,29001,3,'شما از این‌ به‌ پسران‌ خود و پسران‌ شما به‌ پسران‌ خویش‌ و پسران‌ ایشان‌ به‌ طبقه‌ بعد خبر بدهید.','Tell ye your children of it, and let your children tell their children, and their children another generation.');
INSERT INTO verses VALUES (2900100004,29001,4,'آنچه‌ از سِنْ باقی‌ مانَدْ، ملخ‌ می‌خورد و آنچه‌ از ملخ‌ باقی‌ مانَدْ، لَنْبَه‌ می‌خورد و آنچه‌ از لَنْبَه‌ باقی‌ ماند، سوس‌ می‌خورد.','That which the palmerworm hath left hath the locust eaten; and that which the locust hath left hath the cankerworm eaten; and that which the cankerworm hath left hath the caterpiller eaten.');
INSERT INTO verses VALUES (2900100005,29001,5,'ای‌ مستان‌ بیدار شده‌، گریه‌ كنید و ای‌ همه‌ میگساران‌ به‌ جهت‌ عصیر انگور ولوله‌ نمایید زیرا كه‌ از دهان‌ شما منقطع‌ شده‌ است‌.','Awake, ye drunkards, and weep; and howl, all ye drinkers of wine, because of the new wine; for it is cut off from your mouth.');
INSERT INTO verses VALUES (2900100006,29001,6,'زیرا كه‌ امّتی‌ قوی‌ و بیشمار به‌ زمین‌ من‌ هجوم‌ می‌آورند. دندانهای‌ ایشان‌ دندانهای‌ شیر است‌ و اضراس‌ ایشان‌ اضراس‌ هژبر است‌.','For a nation is come up upon my land, strong, and without number, whose teeth are the teeth of a lion, and he hath the cheek teeth of a great lion.');
INSERT INTO verses VALUES (2900100007,29001,7,'تاكستان‌ مرا ویران‌ و انجیرهای‌ مرا خراب‌ كرده‌ و پوست‌ آنها را بالكلّ كنده‌، بیرون‌ انداخته‌اند و شاخه‌های‌ آنها سفید شده‌ است‌.','He hath laid my vine waste, and barked my fig tree: he hath made it clean bare, and cast it away; the branches thereof are made white.');
INSERT INTO verses VALUES (2900100008,29001,8,'مثل‌ دختری‌ كه‌ برای‌ شوهر جوانی‌ خود پلاس‌ می‌پوشد، ماتم‌ بگیر.','Lament like a virgin girded with sackcloth for the husband of her youth.');
INSERT INTO verses VALUES (2900100009,29001,9,'هدیه‌ آردی‌ و هدیه‌ ریختنی‌ از خانه‌ خداوند منقطع‌ شده‌ است‌. كاهنانی‌ كه‌ خدّام‌ خداوند هستند ماتم‌ می‌گیرند.','The meat offering and the drink offering is cut off from the house of the LORD; the priests, the LORD''s ministers, mourn.');
INSERT INTO verses VALUES (2900100010,29001,10,'صحرا خشك‌ شده‌ و زمین‌ ماتم‌ می‌گیرد زیرا گندم‌ تلف‌ شده‌ و شیره‌ خشك‌ گردیده‌ و روغن‌ ضایع‌ شده‌ است‌.','The field is wasted, the land mourneth; for the corn is wasted: the new wine is dried up, the oil languisheth.');
INSERT INTO verses VALUES (2900100011,29001,11,'ای‌ فلاّحان‌ خجل‌ شوید، و ای‌ باغبانان‌ ولوله‌ نمایید، به‌ جهت‌ گندم‌ و جو زیرا محصول‌ زمین‌ تلف‌ شده‌ است‌.','Be ye ashamed, O ye husbandmen; howl, O ye vinedressers, for the wheat and for the barley; because the harvest of the field is perished.');
INSERT INTO verses VALUES (2900100012,29001,12,'موها خشك‌ و انجیرها ضایع‌ شده‌؛ انار و خرما و سیب‌ و همه‌ درختان‌ صحرا خشك‌ گردیده‌، زیرا خوشی‌ از بنی‌آدم‌ رفع‌ شده‌ است‌.','The vine is dried up, and the fig tree languisheth; the pomegranate tree, the palm tree also, and the apple tree, even all the trees of the field, are withered: because joy is withered away from the sons of men.');
INSERT INTO verses VALUES (2900100013,29001,13,'ای‌ كاهنان‌ پلاس‌ در بر كرده‌، نوحه‌گری‌ نمایید و ای‌ خادمان‌ مذبح‌ ولوله‌ كنید و ای‌ خادمان‌ خدای‌ من‌ داخل‌ شده‌، در پلاس‌ شب‌ را بسر برید، زیرا كه‌ هدیه‌ آردی‌ و هدیه‌ ریختنی‌ از خانه‌ خدای‌ شما باز داشته‌ شده‌ است‌.','Gird yourselves, and lament, ye priests: howl, ye ministers of the altar: come, lie all night in sackcloth, ye ministers of my God: for the meat offering and the drink offering is withholden from the house of your God.');
INSERT INTO verses VALUES (2900100014,29001,14,'روزه‌ را تعیین‌ نمایید و محفل‌ مقدس‌ را ندا كنید! مشایخ‌ و تمامی‌ ساكنان‌ زمین‌ را به‌ خانه‌ یهوه‌ خدای‌ خود جمع‌ نموده‌، نزد خداوند تضرّع‌ نمایید.','Sanctify ye a fast, call a solemn assembly, gather the elders and all the inhabitants of the land into the house of the LORD your God, and cry unto the LORD.');
INSERT INTO verses VALUES (2900100015,29001,15,'وای‌ بر آن‌ روز زیرا روز خداوند نزدیك‌ است‌ و مثل‌ هلاكتی‌ از قادر مطلق‌ می‌آید.','Alas for the day! for the day of the LORD is at hand, and as a destruction from the Almighty shall it come.');
INSERT INTO verses VALUES (2900100016,29001,16,'آیا مأكولات‌ در نظر ما منقطع‌ نشد و سُرور و شادمانی‌ از خانه‌ خدای‌ ما؟','Is not the meat cut off before our eyes, yea, joy and gladness from the house of our God?');
INSERT INTO verses VALUES (2900100017,29001,17,'دانه‌ها زیر كلوخها پوسید. مخزنها ویران‌ و انبارها خراب‌ شد زیرا گندم‌ تلف‌ گردید.','The seed is rotten under their clods, the garners are laid desolate, the barns are broken down; for the corn is withered.');
INSERT INTO verses VALUES (2900100018,29001,18,'بهایم‌ چه‌ قدر ناله‌ می‌كنند و رمه‌های‌ گاوان‌ شوریده‌ احوالند، چونكه‌ مرتعی‌ ندارند و گله‌های‌ گوسفند نیز تلف‌ شده‌اند.','How do the beasts groan! the herds of cattle are perplexed, because they have no pasture; yea, the flocks of sheep are made desolate.');
INSERT INTO verses VALUES (2900100019,29001,19,'ای‌ خداوند نزد تو تضرّع‌ می‌نمایم‌ زیرا كه‌ آتش‌ مرتع‌های‌ صحرا را سوزانیده‌ و شعله‌ همه‌درختان‌ صحرا را افروخته‌ است‌.','O LORD, to thee will I cry: for the fire hath devoured the pastures of the wilderness, and the flame hath burned all the trees of the field.');
INSERT INTO verses VALUES (2900100020,29001,20,'بهایم‌ صحرا بسوی‌ تو صیحه‌ می‌زنند زیرا كه‌ جویهای‌ آب‌ خشك‌ شده‌ و آتشْ مرتعهای‌ صحرا را سوزانیده‌ است‌.','The beasts of the field cry also unto thee: for the rivers of waters are dried up, and the fire hath devoured the pastures of the wilderness.');
id INTEGER PRIMARY KEY,
book_id INTEGER NOT NULL,
chapter_number INTEGER NOT NULL,
audio_local TEXT,
audio_online_fa TEXT,
audio_online_en TEXT
);
id INTEGER PRIMARY KEY,
chapter_id INTEGER NOT NULL,
verse_number INTEGER NOT NULL,
text_fa TEXT,
text_en TEXT
);
INSERT INTO chapters VALUES (30001,30,1,NULL,'http://audio1.wordfree.net/bibles/app/audio/20/30/1.mp3','http://audio1.wordfree.net/bibles/app/audio/20/30/1.mp3');
INSERT INTO verses VALUES (3000100001,30001,1,'span class="verse" id="1">1 </span کلمات عاموس که از شبانان تقوع بود و آنها را در ایام عزیا، پادشاه یهودا و ایام یربعام بن یوآش، پادشاه اسرائیل در سال قبل از زلزله در باره اسرائیل دید.','span class="verse" id="1">1 </span The words of Amos, who was among the herdmen of Tekoa, which he saw concerning Israel in the days of Uzziah king of Judah , and in the days of Jeroboam the son of Joash king of Israel , two years before the earthquake.');
INSERT INTO verses VALUES (3000100002,30001,2,'پس گفت: خداوند از صهیون نعره می زند و آواز خود را از اورشلیم بلند می کند و مرتع های شبانان ماتم می گیرند و قله کرمل خشک می گردد.','And he said, The LORD will roar from Zion, and utter his voice from Jerusalem ; and the habitations of the shepherds shall mourn, and the top of Carmel shall wither.');
INSERT INTO verses VALUES (3000100003,30001,3,'خداوند چنین می گوید: به سبب سه و چهار تقصیر دمشق، عقوبتش را نخواهم برگردانید زیرا که جلعاد را به چومهای آهنین کوفتند.','Thus saith the LORD; For three transgressions of Damascus , and for four, I will not turn away the punishment thereof; because they have threshed Gilead with threshing instruments of iron:');
INSERT INTO verses VALUES (3000100004,30001,4,'پس آتش در خاندان حزائیل خواهم فرستاد تا قصرهای بنهدد را بسوزاند.','But I will send a fire into the house of Hazael, which shall devour the palaces of Benhadad.');
INSERT INTO verses VALUES (3000100005,30001,5,'و پشت بندهای دمشق را خواهم شکست و ساکنان را از همواری آون و صاحب عصا را از بیت عدن منقطع خواهم ساخت و خداوند می گوید که قوم قوم آرام به قیر به اسیری خواهند رفت.','I will break also the bar of Damascus , and cut off the inhabitant from the plain of Aven, and him that holdeth the sceptre from the house of Eden : and the people of Syria shall go into captivity unto Kir, saith the LORD.');
INSERT INTO verses VALUES (3000100006,30001,6,'خداوند چنین می گوید: به سبب سه و چهار تقصیر غزه، عقوبتش را نخواهم برگردانید زیرا که تمامی (قوم را) به اسیری بردند تا ایشان را به ادوم تسلیم نمایند.','Thus saith the LORD; For three transgressions of Gaza , and for four, I will not turn away the punishment thereof; because they carried away captive the whole captivity, to deliver them up to Edom :');
INSERT INTO verses VALUES (3000100007,30001,7,'پس آتش به حصارهای غزه خواهم فرستاد تا قصرهایش را بسوزاند.','But I will send a fire on the wall of Gaza , which shall devour the palaces thereof:');
INSERT INTO verses VALUES (3000100008,30001,8,'و ساکنان را از اشدود و صاحب عصا را از اشقلون منقطع ساخته، دست خود را به عقرون فرود خواهم آورد و خداوند یهوه می گوید که باقی ماندگان فلسطینیان هلاک خواهند شد.','And I will cut off the inhabitant from Ashdod, and him that holdeth the sceptre from Ashkelon, and I will turn mine hand against Ekron: and the remnant of the Philistines shall perish, saith the Lord GOD.');
INSERT INTO verses VALUES (3000100009,30001,9,'خداوند چنین می گوید: به سبب سه و چهار تقصیر صور، عقوبتش را نخواهم برگردانید زیرا که تمامی (قوم را) به اسیری برده، ایشان را به ادوم تسلیم نمودند و عهد برادران را به یاد نیاوردند.','Thus saith the LORD; For three transgressions of Tyrus, and for four, I will not turn away the punishment thereof; because they delivered up the whole captivity to Edom , and remembered not the brotherly covenant:');
INSERT INTO verses VALUES (3000100010,30001,10,'پس آتش بر حصارهای صور خواهم فرستاد تا قصرهایش را بسوزاند.','But I will send a fire on the wall of Tyrus, which shall devour the palaces thereof.');
INSERT INTO verses VALUES (3000100011,30001,11,'خداوند چنین می گوید: به سبب سه و چهار تقصیر ادوم، عقوبتش را نخواهم برگردانید زیرا که برادر خود را به شمشیر تعاقب نمود و رحمهای خویش را تباه ساخت و خشم او پیوسته می درید و غضب خود را دایما نگاه می داشت.','Thus saith the LORD; For three transgressions of Edom , and for four, I will not turn away the punishment thereof; because he did pursue his brother with the sword, and did cast off all pity, and his anger did tear perpetually, and he kept his wrath for ever:');
INSERT INTO verses VALUES (3000100012,30001,12,'پس آتش بر تیمان خواهم فرستاد تا قصرهای بصره را بسوزاند.','But I will send a fire upon Teman , which shall devour the palaces of Bozrah .');
INSERT INTO verses VALUES (3000100013,30001,13,'خداوند چنین می گوید: به سبب سه و چهار تقصیر بنی عمون، عقوبتش را نخواهم برگردانید زیرا که زنان حامله جلعاد را شکم پاره کردند تا حدود خویش را وسیع گردانند.','Thus saith the LORD; For three transgressions of the children of Ammon, and for four, I will not turn away the punishment thereof; because they have ripped up the women with child of Gilead , that they might enlarge their border:');
INSERT INTO verses VALUES (3000100014,30001,14,'پس آتش در حصارهای ربه مشتعل خواهم ساخت تا قصرهایش را با صدای عظیمی در روز جنگ و با تند بادی در روز طوفان بسوزاند.','But I will kindle a fire in the wall of Rabbah, and it shall devour the palaces thereof, with shouting in the day of battle, with a tempest in the day of the whirlwind:');
INSERT INTO verses VALUES (3000100015,30001,15,'و خداوند می گوید پادشاه ایشان به اسیری خواهد رفت او و سرورانش جمیعا.','And their king shall go into captivity, he and his princes together, saith the LORD.');
id INTEGER PRIMARY KEY,
book_id INTEGER NOT NULL,
chapter_number INTEGER NOT NULL,
audio_local TEXT,
audio_online_fa TEXT,
audio_online_en TEXT
);
id INTEGER PRIMARY KEY,
chapter_id INTEGER NOT NULL,
verse_number INTEGER NOT NULL,
text_fa TEXT,
text_en TEXT
);
INSERT INTO chapters VALUES (31001,31,1,NULL,'http://audio1.wordfree.net/bibles/app/audio/20/31/1.mp3','http://audio1.wordfree.net/bibles/app/audio/20/31/1.mp3');
INSERT INTO verses VALUES (3100100001,31001,1,'span class="verse" id="1">1 </span خداوند یهوه‌ درباره‌ اَدُوم‌ چنین‌ می‌گوید: از جانب‌ خداوند خبری‌ شنیدیم‌ كه‌ رسولی‌ نزد امت‌ها فرستاده‌ شده‌، (می‌گوید): برخیزید و با او در جنگ‌ مقاومت‌ نماییم‌.','span class="verse" id="1">1 </span The vision of Obadiah. Thus saith the Lord GOD concerning Edom ; We have heard a rumour from the LORD, and an ambassador is sent among the heathen, Arise ye, and let us rise up against her in battle.');
INSERT INTO verses VALUES (3100100002,31001,2,'هان‌ من‌ تو را كوچكترین‌ امّت‌ها گردانیدم‌ و تو بسیار خوار هستی‌.','Behold, I have made thee small among the heathen: thou art greatly despised.');
INSERT INTO verses VALUES (3100100003,31001,3,'ای‌ كه‌ در شكافهای‌ صخره‌ ساكن‌ هستی‌ و مسكن‌ تو بلند می‌باشد و در دل‌ خود می‌گویی‌ كیست‌ كه‌ مرا به‌ زمین‌ فرود بیاورد، تكبّرِ دلت‌، تو را فریب‌ داده‌ است‌،','The pride of thine heart hath deceived thee, thou that dwellest in the clefts of the rock, whose habitation is high; that saith in his heart, Who shall bring me down to the ground?');
INSERT INTO verses VALUES (3100100004,31001,4,'خداوند می‌گوید: اگرچه‌ خویشتن‌ را مثل‌ عقاب‌ بلند سازی‌ و آشیانه‌ خود را در میان‌ ستارگان‌ بگذاری‌، من‌ تو را از آنجا فرود خواهم‌ آورد.','Though thou exalt thyself as the eagle, and though thou set thy nest among the stars, thence will I bring thee down, saith the LORD.');
INSERT INTO verses VALUES (3100100005,31001,5,'اگر دزدان‌ یا غارت‌كنندگانِ شب‌ نزد تو آیند، (چگونه‌ هلاك‌ شدی‌)؟ آیا بقدر كفایت‌ غارت‌ نمی‌كنند؟ و اگر انگورچینان‌ نزد تو آیند آیا بعضی‌ خوشه‌ها را نمی‌گذارند؟','If thieves came to thee, if robbers by night, (how art thou cut off!) would they not have stolen till they had enough? if the grapegatherers came to thee, would they not leave some grapes?');
INSERT INTO verses VALUES (3100100006,31001,6,'چیزهای‌ عیسو چگونه‌ تفتیش‌ شده‌ و چیزهای‌ مخفی‌ او چگونه‌ تفحّص‌ گردیده‌ است‌؟','How are the things of Esau searched out! how are his hidden things sought up!');
INSERT INTO verses VALUES (3100100007,31001,7,'همه‌ آنانی‌ كه‌ با تو همعهد بودند، تو را به‌ سرحدّ فرستادند و صلح‌اندیشان‌ تو، تو را فریب‌ داده‌، بر تو غالب‌ آمدند و خورندگان‌ نان‌ تو دامی‌ زیر تو گستردند. در ایشان‌ فطانتی‌ نیست‌.','All the men of thy confederacy have brought thee even to the border: the men that were at peace with thee have deceived thee, and prevailed against thee; they that eat thy bread have laid a wound under thee: there is none understanding in him.');
INSERT INTO verses VALUES (3100100008,31001,8,'خداوند می‌گوید: آیا در آن‌ روز حكیمان‌ اَدُوم‌ را و فطانت‌ را از كوه‌ عیسو نابود نخواهم‌ گردانید؟','Shall I not in that day, saith the LORD, even destroy the wise men out of Edom , and understanding out of the mount of Esau ?');
INSERT INTO verses VALUES (3100100009,31001,9,'و جبّاران‌ تو ای‌ تیمان‌ هراسان‌ خواهند شد تا هر كس‌ از كوه‌ عیسو به‌ قتل‌ منقطع‌ شود.','And thy mighty men, O Teman , shall be dismayed, to the end that every one of the mount of Esau may be cut off by slaughter.');
INSERT INTO verses VALUES (3100100010,31001,10,'به‌ سبب‌ ظلمی‌ كه‌ بر برادرت‌ یعقوب‌ نمودی‌، خجالت‌ تو را خواهد پوشانید و تا به‌ ابد منقطع‌ خواهی‌ شد.','For thy violence against thy brother Jacob shame shall cover thee, and thou shalt be cut off for ever.');
INSERT INTO verses VALUES (3100100011,31001,11,'در روزی‌ كه‌ به‌ مقابل‌ وی‌ ایستاده‌ بودی‌، هنگامی‌ كه‌ غریبان‌ اموال‌ او را غارت‌ نمودند و بیگانگان‌ به‌ دروازه‌هایش‌ داخل‌ شدند و بر اورشلیم‌ قرعه‌ انداختند، تو نیز مثل‌ یكی‌ از آنها بودی‌.','In the day that thou stoodest on the other side, in the day that the strangers carried away captive his forces, and foreigners entered into his gates, and cast lots upon Jerusalem , even thou wast as one of them.');
INSERT INTO verses VALUES (3100100012,31001,12,'بر روز برادر خود هنگام‌ مصیبتش‌ نگاه‌ مكن‌ و بر بنی‌یهودا در روز هلاكت‌ ایشان‌ شادی‌ منما و در روز تنگی‌ ایشان‌ لاف‌ مزن‌.','But thou shouldest not have looked on the day of thy brother in the day that he became a stranger; neither shouldest thou have rejoiced over the children of Judah in the day of their destruction; neither shouldest thou have spoken proudly in the day of distress.');
INSERT INTO verses VALUES (3100100013,31001,13,'و به‌ دروازه‌های‌ قوم‌ من‌ در روز بلای‌ ایشان‌ داخل‌ مشو و تو نیز بر بدی‌ ایشان‌ در روز بلای‌ ایشان‌ مَنگَر و دست‌ خود را بر اموال‌ ایشان‌ در روز بلای‌ ایشان‌ دراز مكن‌.','Thou shouldest not have entered into the gate of my people in the day of their calamity; yea, thou shouldest not have looked on their affliction in the day of their calamity, nor have laid hands on their substance in the day of their calamity;');
INSERT INTO verses VALUES (3100100014,31001,14,'و بر سر دو راه‌ مایست‌ تا فراریان‌ ایشان‌ را منقطع‌ سازی‌ و باقی‌ماندگان‌ ایشان‌ را در روز تنگی‌ تسلیم‌ منما.','Neither shouldest thou have stood in the crossway, to cut off those of his that did escape; neither shouldest thou have delivered up those of his that did remain in the day of distress.');
INSERT INTO verses VALUES (3100100015,31001,15,'زیرا كه‌ روز خداوند بر جمیع‌ امّت‌ها نزدیك‌ است‌؛ و چنانكه‌ عمل‌ نمودی‌ همچنان‌ به‌ تو عمل‌ كرده‌ خواهد شد و اعمالت‌ بر سرت‌ خواهد برگشت.','For the day of the LORD is near upon all the heathen: as thou hast done, it shall be done unto thee: thy reward shall return upon thine own head.');
INSERT INTO verses VALUES (3100100016,31001,16,'زیرا چنانكه‌ بر كوه‌ مقدّس‌ من‌ نوشیدید، همچنان‌ جمیع‌ امّت‌ها خواهند نوشید و آشامیده‌، خواهند بلعید و چنان‌ خواهند شد كه‌ گویا نبوده‌اند.','For as ye have drunk upon my holy mountain, so shall all the heathen drink continually, yea, they shall drink, and they shall swallow down, and they shall be as though they had not been.');
INSERT INTO verses VALUES (3100100017,31001,17,'امّا بر كوه‌ صهیون‌ نجات‌ خواهد بود و مقدّس‌ خواهد شد و خاندان‌ یعقوب‌ میراث‌ خود را به‌ تصرّف‌ خواهند آورد.','But upon mount Zion shall be deliverance, and there shall be holiness; and the house of Jacob shall possess their possessions.');
INSERT INTO verses VALUES (3100100018,31001,18,'و خاندان‌ یعقوب‌ آتش‌ و خاندان‌ یوسف‌ شعله‌ و خاندان‌ عیسو كاه‌خواهند بود و در میان‌ ایشان‌ مشتعل‌ شده‌، ایشان‌ را خواهد سوزانید و برای‌ خاندان‌ عیسو بقیتّی‌ نخواهد ماند زیرا خداوند تكلّم‌ نموده‌ است‌.','And the house of Jacob shall be a fire, and the house of Joseph a flame, and the house of Esau for stubble, and they shall kindle in them, and devour them; and there shall not be any remaining of the house of Esau ; for the LORD hath spoken it.');
INSERT INTO verses VALUES (3100100019,31001,19,'و اهل‌ جنوب‌ كوه‌ عیسو را و اهل‌ هامون‌ فلسطینیان‌ را به‌ تصرّف‌ خواهند آورد و صحرای‌ افرایم‌ و صحرای‌ سامره‌ را به‌ تصرّف‌ خواهند آورد و بنیامین‌ جِلْعاد را (متصرّف‌ خواهد شد).','And they of the south shall possess the mount of Esau ; and they of the plain the Philistines: and they shall possess the fields of Ephraim , and the fields of Samaria : and Benjamin shall possess Gilead .');
INSERT INTO verses VALUES (3100100020,31001,20,'واسیـران‌ این‌ لشكـر بنی‌اسرائیـل‌ ملك‌ كنعانیان‌ را تا صرْفَه‌ به‌ تصرّف‌ خواهند آورد و اسیرانِ اورشلیم‌ كه‌ در صَفارِدْ هستند، شهرهـای‌ جنوب‌ را به‌ تصرّف‌ خواهند آورد.','And the captivity of this host of the children of Israel shall possess that of the Canaanites, even unto Zarephath; and the captivity of Jerusalem , which is in Sepharad, shall possess the cities of the south.');
INSERT INTO verses VALUES (3100100021,31001,21,'و نجات‌ دهندگان‌ به‌ كوه‌ صهیون‌ برآمده‌، بر كوه‌ عیسو داوری‌ خواهند كرد و ملكوت‌ از آن‌ خداوند خواهد شـد.','And saviours shall come up on mount Zion to judge the mount of Esau ; and the kingdom shall be the LORD''s.');
id INTEGER PRIMARY KEY,
book_id INTEGER NOT NULL,
chapter_number INTEGER NOT NULL,
audio_local TEXT,
audio_online_fa TEXT,
audio_online_en TEXT
);
id INTEGER PRIMARY KEY,
chapter_id INTEGER NOT NULL,
verse_number INTEGER NOT NULL,
text_fa TEXT,
text_en TEXT
);
INSERT INTO chapters VALUES (32001,32,1,NULL,'http://audio1.wordfree.net/bibles/app/audio/20/32/1.mp3','http://audio1.wordfree.net/bibles/app/audio/20/32/1.mp3');
INSERT INTO verses VALUES (3200100001,32001,1,'span class="verse" id="1">1 </span و كلام‌ خداوند بر یونس‌ بن‌ اَمِتّای‌ نازل‌ شده‌، گفت‌:','span class="verse" id="1">1 </span Now the word of the LORD came unto Jonah the son of Amittai, saying,');
INSERT INTO verses VALUES (3200100002,32001,2,'«برخیز و به‌ نینوا شهر بزرگ‌ برو و بر آن‌ ندا كن‌ زیرا كه‌ شرارت‌ ایشان‌ به‌ حضور من‌ برآمده‌ است‌.»','Arise, go to Nineveh , that great city, and cry against it; for their wickedness is come up before me.');
INSERT INTO verses VALUES (3200100003,32001,3,'امّا یونس‌ برخاست‌ تا از حضور خداوند به‌ تَرْشیش‌ فرار كند و به‌ یافا فرود آمده‌، كشتی‌ای‌ یافت‌ كه‌ عازم‌ تَرْشیش‌ بود. پس‌ كرایه‌اش‌ را داده‌، سوار شد تا همراه‌ ایشان‌ از حضور خداوند به‌ تَرْشیش‌ برود.','But Jonah rose up to flee unto Tarshish from the presence of the LORD, and went down to Joppa; and he found a ship going to Tarshish : so he paid the fare thereof, and went down into it, to go with them unto Tarshish from the presence of the LORD.');
INSERT INTO verses VALUES (3200100004,32001,4,'و خداوند باد شدیدی‌ بر دریا وزانید كه‌ تلاطم‌ عظیمی‌ در دریا پدید آمد چنانكه‌ نزدیك‌ بود كه‌ كشتی‌ شكسته‌ شود.','But the LORD sent out a great wind into the sea, and there was a mighty tempest in the sea, so that the ship was like to be broken.');
INSERT INTO verses VALUES (3200100005,32001,5,'و ملاّحان‌ ترسان‌ شده‌، هر كدام‌ نزد خدای‌ خود استغاثه‌ نمودند و اسباب‌ را كه‌ در كشتی‌ بود به‌ دریا ریختند تا آن‌ را برای‌ خود سبك‌ سازند. امّا یونس‌ در اندرون‌ كشتی‌ فرود شده‌، دراز شد و خواب‌ سنگینی‌ او را در ربود.','Then the mariners were afraid, and cried every man unto his god, and cast forth the wares that were in the ship into the sea, to lighten it of them. But Jonah was gone down into the sides of the ship; and he lay, and was fast asleep.');
INSERT INTO verses VALUES (3200100006,32001,6,'و ناخدای‌ كشتی‌ نزد او آمده‌، وی‌ را گفت‌: «ای‌ كه‌ خفته‌ای‌، تو را چه‌ شده‌ است‌؟ برخیز و خدای‌ خود را بخوان‌؛ شاید كه‌ خدا ما را بخاطر آورد تا هلاك‌ نشویم‌.»','So the shipmaster came to him, and said unto him, What meanest thou, O sleeper? arise, call upon thy God, if so be that God will think upon us, that we perish not.');
INSERT INTO verses VALUES (3200100007,32001,7,'و به‌ یكدیگر گفتند: «بیایید قرعه‌ بیندازیم‌ تا بدانیم‌ كه‌ این‌ بلا به‌ سبب‌ چه‌ كس‌ بر ما وارد شده‌ است‌؟» پس‌ چون‌ قرعه‌ انداختند، قرعه‌ به‌ نام‌ یونس‌ درآمد.','And they said every one to his fellow, Come, and let us cast lots, that we may know for whose cause this evil is upon us. So they cast lots, and the lot fell upon Jonah .');
INSERT INTO verses VALUES (3200100008,32001,8,'پس‌ او را گفتند: «ما را اطّلاع‌ ده‌ كه‌ این‌ بلا به‌ سبب‌ چه‌ كس‌ بر ما عارض‌ شده‌؟ شغل‌ تو چیست‌ و از كجا آمده‌ای‌ و وطنت‌ كدام‌ است‌ و از چه‌ قوم‌ هستی‌؟»','Then said they unto him, Tell us, we pray thee, for whose cause this evil is upon us; What is thine occupation? and whence comest thou? what is thy country? and of what people art thou?');
INSERT INTO verses VALUES (3200100009,32001,9,'او ایشان‌ را جواب‌ داد كه‌: «من‌ عبرانی‌ هستم‌ و از یهوه‌ خدای‌ آسمان‌ كه‌ دریا و خشكی‌ را آفریده‌ است‌ ترسان‌ می‌باشم‌.»','And he said unto them, I am an Hebrew; and I fear the LORD, the God of heaven, which hath made the sea and the dry land.');
INSERT INTO verses VALUES (3200100010,32001,10,'پس‌ آن‌ مردمان‌ سخت‌ ترسان‌ شدند و او را گفتند: «چه‌ كرده‌ای‌؟» زیرا كه‌ ایشان‌ می‌دانستند كه‌ از حضور خداوند فرار كرده‌ است‌ چونكه‌ ایشان‌ را اطلاّع‌ داده‌ بود.','Then were the men exceedingly afraid, and said unto him, Why hast thou done this? For the men knew that he fled from the presence of the LORD, because he had told them.');
INSERT INTO verses VALUES (3200100011,32001,11,'و او را گفتند: «با تو چه‌ كنیم‌ تا دریا برای‌ ما ساكـن‌ شود؟» زیرا دریا در تلاطم‌ همی‌ افزود.','Then said they unto him, What shall we do unto thee, that the sea may be calm unto us? for the sea wrought, and was tempestuous.');
INSERT INTO verses VALUES (3200100012,32001,12,'او به‌ ایشـان‌ گفت‌: «مرا برداشتـه‌، به‌ دریا بیندازید و دریا برای‌ شما ساكن‌ خواهد شد، زیـرا می‌دانم‌ این‌ تلاطم‌ عظیم‌ به‌ سبب‌ من‌ بر شما وارد آمده‌ است‌.','And he said unto them, Take me up, and cast me forth into the sea; so shall the sea be calm unto you: for I know that for my sake this great tempest is upon you.');
INSERT INTO verses VALUES (3200100013,32001,13,'امّا آن‌ مردمان‌ سعی‌ نمودند تا كشتی‌ را به‌ خشكی‌ برسانند امّا نتوانستند زیرا كه‌ دریا به‌ ضدّ ایشان‌ زیاده‌ و زیاده‌ تلاطم‌ می‌نمود.','Nevertheless the men rowed hard to bring it to the land; but they could not: for the sea wrought, and was tempestuous against them.');
INSERT INTO verses VALUES (3200100014,32001,14,'پس‌ نزد یهوه‌ دعا كرده‌، گفتند: «آه‌ ای‌ خداوند به‌ خاطر جان‌ این‌ شخص‌ هلاك‌ نشویم‌ و خون‌ بی‌گناه‌ را بر ما مگذار زیرا تو ای‌ خداوند هر چه‌ می‌خواهی‌ می‌كنی‌.»','Wherefore they cried unto the LORD, and said, We beseech thee, O LORD, we beseech thee, let us not perish for this man''s life, and lay not upon us innocent blood: for thou, O LORD, hast done as it pleased thee.');
INSERT INTO verses VALUES (3200100015,32001,15,'پس‌ یونس‌ را برداشته‌، در دریا انداختند و دریا از تلاطمش‌ آرام‌ شد.','So they took up Jonah , and cast him forth into the sea: and the sea ceased from her raging.');
INSERT INTO verses VALUES (3200100016,32001,16,'و آن‌ مردمان‌ از خداوند سخت‌ ترسان‌ شدند و برای‌ خداوند قربانی‌ها گذرانیدند و نذرها نمودند.','Then the men feared the LORD exceedingly, and offered a sacrifice unto the LORD, and made vows.');
INSERT INTO verses VALUES (3200100017,32001,17,'و امّا خداوند ماهی‌ بزرگی‌ پیدا كرد كه‌ یونس‌ را فرو بُرْد و یونس‌ سه‌ روز و سه‌ شب‌ در شكم‌ ماهی‌ ماند.','Now the LORD had prepared a great fish to swallow up Jonah . And Jonah was in the belly of the fish three days and three nights.');
id INTEGER PRIMARY KEY,
book_id INTEGER NOT NULL,
chapter_number INTEGER NOT NULL,
audio_local TEXT,
audio_online_fa TEXT,
audio_online_en TEXT
);
id INTEGER PRIMARY KEY,
chapter_id INTEGER NOT NULL,
verse_number INTEGER NOT NULL,
text_fa TEXT,
text_en TEXT
);
INSERT INTO chapters VALUES (33001,33,1,NULL,'http://audio1.wordfree.net/bibles/app/audio/20/33/1.mp3','http://audio1.wordfree.net/bibles/app/audio/20/33/1.mp3');
INSERT INTO verses VALUES (3300100001,33001,1,'span class="verse" id="1">1 </span كلام‌ خداوند كه‌ بر میكاهِ مورَشَتی‌ در ایام یوتام‌ و آحاز و حِزْقیا، پادشاهان‌ یهودا نازل‌ شد و آن‌ را درباره‌ سامره‌ و اورشلیم‌ دید.','span class="verse" id="1">1 </span The word of the LORD that came to Micah the Morasthite in the days of Jotham, Ahaz, and Hezekiah, kings of Judah , which he saw concerning Samaria and Jerusalem .');
INSERT INTO verses VALUES (3300100002,33001,2,'ای‌ جمیع‌ قوم‌ها بشنوید و ای‌ زمین‌ و هر چه‌ در آن‌ است‌ گوش‌ بدهید، و خداوند یهوه‌ یعنی‌ خداوند از هیكل‌ قدسش‌ بر شما شاهد باشد.','Hear, all ye people; hearken, O earth, and all that therein is: and let the Lord GOD be witness against you, the LORD from his holy temple.');
INSERT INTO verses VALUES (3300100003,33001,3,'زیرا اینك‌ خداوند از مكان‌ خود بیرون‌ می‌آید و نزول‌ نموده‌، بر مكان‌های‌ بلند زمین‌ می‌خرامد.','For, behold, the LORD cometh forth out of his place, and will come down, and tread upon the high places of the earth.');
INSERT INTO verses VALUES (3300100004,33001,4,'و كوهها زیر او گداخته‌ می‌شود و وادیها مُنْشَقّ می‌گردد، مثل‌ موم‌ پیش‌ آتش‌ و مثل‌ آب‌ كه‌ به‌ نشیب‌ ریخته‌ شود.','And the mountains shall be molten under him, and the valleys shall be cleft, as wax before the fire, and as the waters that are poured down a steep place.');
INSERT INTO verses VALUES (3300100005,33001,5,'این‌ همه‌ به‌ سبب‌ عصیان‌ یعقوب‌ و گناه‌ خاندان‌ اسرائیل‌ است‌. عصیان‌ یعقوب‌ چیست‌؟ آیا سامره‌ نیست‌؟ و مكان‌های‌ بلند یهودا چیست‌؟ آیا اورشلیم‌ نمی‌باشد؟','For the transgression of Jacob is all this, and for the sins of the house of Israel . What is the transgression of Jacob ? is it not Samaria ? and what are the high places of Judah ? are they not Jerusalem ?');
INSERT INTO verses VALUES (3300100006,33001,6,'پس‌ سامره‌ را به‌ توده‌ سنگ‌ صحرا و مكان‌ غَرس‌ نمودن‌ مَوْها مبدّل‌ خواهم‌ ساخت‌ و سنگهایش‌ را به‌ درّه‌ ریخته‌، بنیادش‌ را منكشف‌ خواهم‌ نمود.','Therefore I will make Samaria as an heap of the field, and as plantings of a vineyard: and I will pour down the stones thereof into the valley, and I will discover the foundations thereof.');
INSERT INTO verses VALUES (3300100007,33001,7,'و همه‌ بتهای‌ تراشیده‌ شده‌ آن‌ خرد و همه‌ مزدهایش‌ به‌ آتش‌ سوخته‌ خواهد شد و همه‌ تماثیلش‌ را خراب‌ خواهم‌ كرد زیرا كه‌ از مزد فاحشه‌ آنها را جمع‌ كرد و به‌ مزد فاحشه‌ خواهد برگشت‌.','And all the graven images thereof shall be beaten to pieces, and all the hires thereof shall be burned with the fire, and all the idols thereof will I lay desolate: for she gathered it of the hire of an harlot, and they shall return to the hire of an harlot.');
INSERT INTO verses VALUES (3300100008,33001,8,'به‌ این‌ سبب‌ ماتم‌ گرفته‌، وِلْوَلَه‌ خواهم‌ نمود و برهنه‌ و عریان‌ راه‌ خواهم‌ رفت‌ و مثل‌ شغالها ماتم‌ خواهم‌ گرفت‌ و مانند شتر مرغهانوحه‌گری‌ خواهم‌ نمود.','Therefore I will wail and howl, I will go stripped and naked: I will make a wailing like the dragons, and mourning as the owls.');
INSERT INTO verses VALUES (3300100009,33001,9,'زیرا كه‌ جراحت‌های‌ وی‌ علاج‌پذیر نیست‌ چونكه‌ به‌ یهودا رسیده‌ و به‌ دروازه‌های‌ قوم‌ من‌ یعنی‌ به‌ اورشلیم‌ داخل‌ گردیده‌ است‌.','For her wound is incurable; for it is come unto Judah ; he is come unto the gate of my people, even to Jerusalem .');
INSERT INTO verses VALUES (3300100010,33001,10,'در جَتّ خبر مرسانید و هرگز گریه‌ منمایید. در خانه‌ عَفْرَه‌، در غبار خویشتن‌ را غلطانیدم‌.','Declare ye it not at Gath, weep ye not at all: in the house of Aphrah roll thyself in the dust.');
INSERT INTO verses VALUES (3300100011,33001,11,'ای‌ ساكنه‌ شافیر عریان‌ و خجل‌ شده‌، بگذر. ساكنه‌ صأنان‌ بیرون‌ نمی‌آید. ماتم‌ بیتْاِیصَلْ مكانش‌ را از شما می‌گیرد.','Pass ye away, thou inhabitant of Saphir, having thy shame naked: the inhabitant of Zaanan came not forth in the mourning of Bethezel; he shall receive of you his standing.');
INSERT INTO verses VALUES (3300100012,33001,12,'زیرا كه‌ ساكنه‌ ماروت‌ به‌ جهت‌ نیكویی‌ درد زه‌ می‌كشد، چونكه‌ بلا از جانب‌ خداوند به‌ دروازه‌ اورشلیم‌ فرود آمده‌ است‌.','For the inhabitant of Maroth waited carefully for good: but evil came down from the LORD unto the gate of Jerusalem .');
INSERT INTO verses VALUES (3300100013,33001,13,'ای‌ ساكنه‌ لاكیش‌ اسب‌ تندرو را به‌ ارابه‌ ببند. او ابتدای‌ گناه‌ دختر صَهیون‌ بود، چونكه‌ عصیان‌ اسرائیل‌ در تو یافت‌ شده‌ است‌.','O thou inhabitant of Lachish, bind the chariot to the swift beast: she is the beginning of the sin to the daughter of Zion: for the transgressions of Israel were found in thee.');
INSERT INTO verses VALUES (3300100014,33001,14,'بنابراین‌ طلاق‌ نامه‌ای‌ به‌ مُورَشَتْ جَتّ خواهی‌ داد. خانه‌های‌ اَكْذِیب‌، چشمه‌ فریبنده‌ برای‌ پادشاهان‌ اسرائیل‌ خواهد بود.','Therefore shalt thou give presents to Moreshethgath: the houses of Achzib shall be a lie to the kings of Israel .');
INSERT INTO verses VALUES (3300100015,33001,15,'ای‌ ساكنه‌ مَریشَه‌ بار دیگر مالكی‌ بر تو خواهم‌ آورد. جلال‌ اسرائیل‌ تا به‌ عَدُلاّم‌ خواهد آمد.','Yet will I bring an heir unto thee, O inhabitant of Mareshah: he shall come unto Adullam the glory of Israel .');
INSERT INTO verses VALUES (3300100016,33001,16,'خویشتن‌ را برای‌ فرزندان‌ نازنین‌ خود گَرْ ساز و موی‌ خود را بتراش‌. گری‌ سر خود را مثل‌ كركس‌ زیاد كن‌ زیرا كه‌ ایشان‌ از نزد تو به‌ اسیری‌ رفته‌اند.','Make thee bald, and poll thee for thy delicate children; enlarge thy baldness as the eagle; for they are gone into captivity from thee.');
id INTEGER PRIMARY KEY,
book_id INTEGER NOT NULL,
chapter_number INTEGER NOT NULL,
audio_local TEXT,
audio_online_fa TEXT,
audio_online_en TEXT
);
id INTEGER PRIMARY KEY,
chapter_id INTEGER NOT NULL,
verse_number INTEGER NOT NULL,
text_fa TEXT,
text_en TEXT
);
INSERT INTO chapters VALUES (34001,34,1,NULL,'http://audio1.wordfree.net/bibles/app/audio/20/34/1.mp3','http://audio1.wordfree.net/bibles/app/audio/20/34/1.mp3');
INSERT INTO verses VALUES (3400100001,34001,1,'span class="verse" id="1">1 </span وَحی‌ درباره‌ نینـوی‌. كتاب‌ رویـای‌ ناحُوم‌اَلْقوشی‌.','span class="verse" id="1">1 </span The burden of Nineveh . The book of the vision of Nahum the Elkoshite.');
INSERT INTO verses VALUES (3400100002,34001,2,'یهوه‌ خدای‌ غیور و انتقام‌ گیرنده‌ است‌. خداوند انتقام‌ گیرنده‌ و صاحب‌ غضب‌ است‌. خداوند از دشمنان‌ خویش‌ انتقام‌ می‌گیرد و برای‌ خصمان‌ خود خشم‌ را نگاه‌ می‌دارد.','God is jealous, and the LORD revengeth; the LORD revengeth, and is furious; the LORD will take vengeance on his adversaries, and he reserveth wrath for his enemies.');
INSERT INTO verses VALUES (3400100003,34001,3,'خداوند دیرغضب‌ و عظیم‌القوّت‌ است‌ و گناه‌ را هرگز بی‌سزا نمی‌گذارد. راه‌ خداوند در تند باد و طوفان‌ است‌ و ابرها خاك‌ پای‌ او می‌باشد.','The LORD is slow to anger, and great in power, and will not at all acquit the wicked: the LORD hath his way in the whirlwind and in the storm, and the clouds are the dust of his feet.');
INSERT INTO verses VALUES (3400100004,34001,4,'دریا را عتاب‌ می‌كند و آن‌ را می‌خشكاند و جمیع‌ نهرها را خشك‌ می‌سازد. باشان‌ و كَرْمَلْ كاهیده‌ می‌شوند و گُلِ لُبنان‌ پژمرده‌ می‌گردد.','He rebuketh the sea, and maketh it dry, and drieth up all the rivers: Bashan languisheth, and Carmel, and the flower of Lebanon languisheth.');
INSERT INTO verses VALUES (3400100005,34001,5,'كوهها از او متزلزل‌ و تلّها گداخته‌ می‌شوند و جهان‌ از حضور وی‌ متحرّك‌ می‌گردد و ربع‌ مسكون‌ و جمیع‌ ساكنانش‌.','The mountains quake at him, and the hills melt, and the earth is burned at his presence, yea, the world, and all that dwell therein.');
INSERT INTO verses VALUES (3400100006,34001,6,'پیش‌ خشم‌ وی‌ كه‌ تواند ایستاد؟ و در حِدَّت‌ غضب‌ او كه‌ تواند برخاست‌؟ غضب‌ او مثل‌ آتش‌ ریخته‌ می‌شود و صَخْره‌ها از او خرد می‌گردد.','Who can stand before his indignation? and who can abide in the fierceness of his anger? his fury is poured out like fire, and the rocks are thrown down by him.');
INSERT INTO verses VALUES (3400100007,34001,7,'خداوند نیكو است‌ و در روز تنگی‌ ملجا می‌باشد و متوكّلان‌ خود را می‌شناسد.','The LORD is good, a strong hold in the day of trouble; and he knoweth them that trust in him.');
INSERT INTO verses VALUES (3400100008,34001,8,'و به‌ سیل‌ سرشار، مكان‌ آن‌ را بالكلّ خراب‌ خواهد ساخت‌ و تاریكی‌ دشمنان‌ او را تعاقب‌ خواهد نمود.','But with an overrunning flood he will make an utter end of the place thereof, and darkness shall pursue his enemies.');
INSERT INTO verses VALUES (3400100009,34001,9,'كدام‌ تدبیر را به‌ ضدّ خداوند توانید نمود؟ او دفعةً هلاك‌ خواهد كرد و مصیبت‌ دفعه‌ دیگر بر پا نخواهد شد.','What do ye imagine against the LORD? he will make an utter end: affliction shall not rise up the second time.');
INSERT INTO verses VALUES (3400100010,34001,10,'زیرا اگرچه‌ مثل‌ خارها به‌ هم‌پیچیده‌ و مانند می‌گساران‌ مست‌ بشوند، لیكن‌ چون‌ كاهِ خشك‌ بالّكل‌ سوخته‌ خواهند شد.','For while they be folden together as thorns, and while they are drunken as drunkards, they shall be devoured as stubble fully dry.');
INSERT INTO verses VALUES (3400100011,34001,11,'مُشیرِ بَلیعال‌ كه‌ به‌ ضدّ خداوند بد می‌اندیشد، از تو بیرون‌ آمده‌ است‌.','There is one come out of thee, that imagineth evil against the LORD, a wicked counsellor.');
INSERT INTO verses VALUES (3400100012,34001,12,'خداوند چنین‌ می‌گوید: «اگرچه‌ ایشان‌ در قوّت‌ سالم‌ و در شماره‌ نیز بسیار باشند لیكن‌ منقطع‌ شده‌، در خواهند گذشت‌. و اگر چه‌ تو را ذلیل‌ ساختم‌، لیكن‌ بار دیگر تو را ذلیل‌ نخواهم‌ نمود.','Thus saith the LORD; Though they be quiet, and likewise many, yet thus shall they be cut down, when he shall pass through. Though I have afflicted thee, I will afflict thee no more.');
INSERT INTO verses VALUES (3400100013,34001,13,'و الا´ن‌ یوغ‌ او را از گردن‌ تو خواهم‌ شكست‌ و بندهای‌ تو را خواهم‌ گسیخت‌.»','For now will I break his yoke from off thee, and will burst thy bonds in sunder.');
INSERT INTO verses VALUES (3400100014,34001,14,'و خداوند درباره‌ تو امر فرموده‌ است‌ كه‌ بار دیگر ذریتی‌ به‌ نام‌ تو نخواهد بود و از خانه‌ خدایانت‌ بتهای‌ تراشیده‌ و اصنام‌ ریخته‌ شده‌ را منقطع‌ خواهم‌ نمود و قبر تو را خواهم‌ ساخت‌ زیرا خوار شده‌ای.','And the LORD hath given a commandment concerning thee, that no more of thy name be sown: out of the house of thy gods will I cut off the graven image and the molten image: I will make thy grave; for thou art vile.');
INSERT INTO verses VALUES (3400100015,34001,15,'اینك‌ بر كوهها پایهای‌ مبشّر كه‌ سلامتی‌ را ندا می‌كند! ای‌ یهودا عیدهای‌ خود را نگاه‌ دار و نذرهای‌ خود را وفا كن‌ زیرا كه‌ مردِ بَلیعال‌ بار دیگر از تو نخواهد گذشت‌ بلكه‌ بالّكل‌ منقطع‌ خواهد شد.','Behold upon the mountains the feet of him that bringeth good tidings, that publisheth peace! O Judah , keep thy solemn feasts, perform thy vows: for the wicked shall no more pass through thee; he is utterly cut off.');
id INTEGER PRIMARY KEY,
book_id INTEGER NOT NULL,
chapter_number INTEGER NOT NULL,
audio_local TEXT,
audio_online_fa TEXT,
audio_online_en TEXT
);
id INTEGER PRIMARY KEY,
chapter_id INTEGER NOT NULL,
verse_number INTEGER NOT NULL,
text_fa TEXT,
text_en TEXT
);
INSERT INTO chapters VALUES (35001,35,1,NULL,'http://audio1.wordfree.net/bibles/app/audio/20/35/1.mp3','http://audio1.wordfree.net/bibles/app/audio/20/35/1.mp3');
INSERT INTO verses VALUES (3500100001,35001,1,'span class="verse" id="1">1 </span وحی‌ كه‌ حَبَقُّوق‌ نبّی‌ آن‌ را دید.','span class="verse" id="1">1 </span The burden which Habakkuk the prophet did see.');
INSERT INTO verses VALUES (3500100002,35001,2,'ای‌ خداوند تا به‌ كی‌ فریاد برمی‌آورم‌ و نمی‌شنوی‌؟ تا به‌ كی‌ نزد تو از ظلم‌ فریاد برمی‌آورم‌ و نجات‌ نمی‌دهی‌؟','O LORD, how long shall I cry, and thou wilt not hear! even cry out unto thee of violence, and thou wilt not save!');
INSERT INTO verses VALUES (3500100003,35001,3,'چرا بی‌ انصافی‌ را به‌ من‌ نشان‌ می‌دهی‌ و بر ستم‌ نظر می‌نمایی‌ و غضب‌ و ظلم‌ پیش‌ روی‌ من‌ می‌باشد؟ منازعه‌ پدید می‌آید و مخاصمت‌ سر خود را بلند می‌كند.','Why dost thou shew me iniquity, and cause me to behold grievance? for spoiling and violence are before me: and there are that raise up strife and contention.');
INSERT INTO verses VALUES (3500100004,35001,4,'از این‌ سبب‌، شریعت‌ سست‌ شده‌ است‌ و عدالت‌ هرگز صادر نمی‌شود. چونكه‌ شریران‌ عادلان‌ را احاطه‌ می‌نمایند. بنابراین‌ عدالت‌ مُعْوَج‌ شده‌ صادر می‌گردد.','Therefore the law is slacked, and judgment doth never go forth: for the wicked doth compass about the righteous; therefore wrong judgment proceedeth.');
INSERT INTO verses VALUES (3500100005,35001,5,'در میان‌ امّت‌ها نظر كنید و ملاحظه‌ نمایید و بشدّت‌ متحیر شوید. زیرا كه‌ در ایام‌ شما كاری‌ می‌كنم‌ كه‌ اگر شما را هم‌ از آن‌ مخبر سازند، باور نخواهید كرد.','Behold ye among the heathen, and regard, and wonder marvellously: for I will work a work in your days, which ye will not believe, though it be told you.');
INSERT INTO verses VALUES (3500100006,35001,6,'زیرا كه‌ اینك‌ آن‌ امّت‌ تلخ‌ و تندخو، یعنی‌ كلدانیان‌ را برمی‌انگیزانم‌ كه‌ در وسعت‌ جهان‌ می‌خرامند تا مسكن‌هایی‌ را كه‌ از آن‌ ایشان‌ نیست‌ به‌ تصرّف‌ آورند.','For, lo, I raise up the Chaldeans, that bitter and hasty nation, which shall march through the breadth of the land, to possess the dwellingplaces that are not theirs.');
INSERT INTO verses VALUES (3500100007,35001,7,'ایشان‌ هولناك‌ و مَهیب‌ می‌باشند. حكم‌ و جلال‌ ایشان‌ از خود ایشان‌ صادر می‌شود.','They are terrible and dreadful: their judgment and their dignity shall proceed of themselves.');
INSERT INTO verses VALUES (3500100008,35001,8,'اسبان‌ ایشان‌ از پلنگها چالاكتر و از گرگانِ شب‌ تیزروترند و سواران‌ایشان‌ جست‌ و خیز می‌كنند. و سواران‌ ایشان‌ از جای‌ دور آمده‌، مثل‌ عقابی‌ كه‌ برای‌ خوراك‌ بشتابد می‌پرند.','Their horses also are swifter than the leopards, and are more fierce than the evening wolves: and their horsemen shall spread themselves, and their horsemen shall come from far; they shall fly as the eagle that hasteth to eat.');
INSERT INTO verses VALUES (3500100009,35001,9,'جمیع‌ ایشان‌ برای‌ ظلم‌ می‌آیند. عزیمت‌ روی‌ ایشان‌ بطرف‌ پیش‌ است‌ و اسیران‌ را مثل‌ ریگ‌ جمع‌ می‌كنند.','They shall come all for violence: their faces shall sup up as the east wind, and they shall gather the captivity as the sand.');
INSERT INTO verses VALUES (3500100010,35001,10,'و ایشان‌ پادشاهان‌ را استهزا می‌نمایند و سرورانْ مسخره‌ ایشان‌ می‌باشند. بر همه‌ قلعه‌ها می‌خندند و خاك‌ را توده‌ نموده‌، آنها را مُسَخّر می‌سازند.','And they shall scoff at the kings, and the princes shall be a scorn unto them: they shall deride every strong hold; for they shall heap dust, and take it.');
INSERT INTO verses VALUES (3500100011,35001,11,'پس‌ مثل‌ باد بشتاب‌ رفته‌، عبور می‌كنند و مجرم‌ می‌شوند. این‌ قوّت‌ ایشان‌ خدای‌ ایشان‌ است‌.','Then shall his mind change, and he shall pass over, and offend, imputing this his power unto his god.');
INSERT INTO verses VALUES (3500100012,35001,12,'ای‌ یهوه‌ خدای‌ من‌! ای‌ قدّوس‌ من‌! آیا تو از ازل‌ نیستی‌؟ پس‌ نخواهیم‌ مرد. ای‌ خداوند ایشان‌ را برای‌ داوری‌ معین‌ كرده‌ای‌ و ای‌ صَخْره‌، ایشان‌ را برای‌ تأدیب‌ تأسیس‌ نموده‌ای‌.','Art thou not from everlasting, O LORD my God, mine Holy One? we shall not die. O LORD, thou hast ordained them for judgment; and, O mighty God, thou hast established them for correction.');
INSERT INTO verses VALUES (3500100013,35001,13,'چشمان‌ تو پاكتر است‌ از اینكه‌ به‌ بدی‌ بنگری‌ و به‌ بی‌انصافی‌ نظر نمی‌توانی‌ كرد. پس‌ چرا خیانتكاران‌ را ملاحظه‌ می‌نمایی‌ و حینی‌ كه‌ شریر كسی‌ را كه‌ از خودش‌ عادل‌ تر است‌ می‌بلعد، خاموش‌ می‌مانی‌؟','Thou art of purer eyes than to behold evil, and canst not look on iniquity: wherefore lookest thou upon them that deal treacherously, and holdest thy tongue when the wicked devoureth the man that is more righteous than he?');
INSERT INTO verses VALUES (3500100014,35001,14,'و مردمان‌ را مثل‌ ماهیان‌ دریا و مانند حشراتی‌ كه‌ حاكمی‌ ندارند می‌گردانی‌؟','And makest men as the fishes of the sea, as the creeping things, that have no ruler over them?');
INSERT INTO verses VALUES (3500100015,35001,15,'او همگی‌ ایشان‌ را به‌ قّلاب‌ برمی‌كشد و ایشان‌ را به‌ دام‌ خود می‌گیرد و در تور خویش‌ آنها را جمع‌ می‌نماید. از اینجهت‌، مسرور و شادمان‌ می‌شود.','They take up all of them with the angle, they catch them in their net, and gather them in their drag: therefore they rejoice and are glad.');
INSERT INTO verses VALUES (3500100016,35001,16,'بنابراین‌، برای‌ دام‌ خود قربانی‌ می‌گذراند وبرای‌ تور خویش‌ بخور می‌سوزاند. چونكه‌ نصیب‌ او از آنها فربه‌ و خوراك‌ وی‌ لذیذ می‌شود.','Therefore they sacrifice unto their net, and burn incense unto their drag; because by them their portion is fat, and their meat plenteous.');
INSERT INTO verses VALUES (3500100017,35001,17,'آیا از اینجهت‌ دام‌ خود را خالـی‌ خواهـد كـرد و از پیوسته‌ كُشتنِ امّت‌ها دریغ‌ نخواهد نمود؟','Shall they therefore empty their net, and not spare continually to slay the nations?');
id INTEGER PRIMARY KEY,
book_id INTEGER NOT NULL,
chapter_number INTEGER NOT NULL,
audio_local TEXT,
audio_online_fa TEXT,
audio_online_en TEXT
);
id INTEGER PRIMARY KEY,
chapter_id INTEGER NOT NULL,
verse_number INTEGER NOT NULL,
text_fa TEXT,
text_en TEXT
);
INSERT INTO chapters VALUES (36001,36,1,NULL,'http://audio1.wordfree.net/bibles/app/audio/20/36/1.mp3','http://audio1.wordfree.net/bibles/app/audio/20/36/1.mp3');
INSERT INTO verses VALUES (3600100001,36001,1,'span class="verse" id="1">1 </span كلام‌ خداوند كه‌ در ایام‌ یوشّیا ابن‌ آمون‌،پادشاه‌ یهودا، بر صَفَنْیا ابن‌ كوشی‌ ابن‌ جَدَلْیا ابن‌ اَمَرْیا ابن‌ حِزْقِیا نازل‌ شد.','span class="verse" id="1">1 </span The word of the LORD which came unto Zephaniah the son of Cushi, the son of Gedaliah, the son of Amariah, the son of Hizkiah, in the days of Josiah the son of Amon , king of Judah .');
INSERT INTO verses VALUES (3600100002,36001,2,'خداوند می‌گوید كه‌ همه‌ چیزها را از روی‌ زمین‌ بالّكل‌ هلاك‌ خواهم‌ ساخت‌.','I will utterly consume all things from off the land, saith the LORD.');
INSERT INTO verses VALUES (3600100003,36001,3,'انسان‌ و بهایم‌ را هلاك‌ می‌سازم‌. مرغان‌ هوا و ماهیان‌ دریا و سنگهای‌ مصادم‌ را با شریران‌ هلاك‌ می‌سازم‌. و انسان‌ را از روی‌ زمین‌ منقطع‌ می‌نمایم‌. قول‌ خداوند این‌ است‌.','I will consume man and beast; I will consume the fowls of the heaven, and the fishes of the sea, and the stumblingblocks with the wicked: and I will cut off man from off the land, saith the LORD.');
INSERT INTO verses VALUES (3600100004,36001,4,'و دست‌ خود را بر یهودا و بر جمیع‌ سَكَنه‌ اورشلیم‌ دراز می‌نمایم‌. و بقیه‌ بَعْل‌ و اسمهای‌ مؤبدان‌ و كاهنان‌ را از این‌ مكان‌ منقطع‌ می‌سازم‌.','I will also stretch out mine hand upon Judah , and upon all the inhabitants of Jerusalem ; and I will cut off the remnant of Baal from this place, and the name of the Chemarims with the priests;');
INSERT INTO verses VALUES (3600100005,36001,5,'و آنانی‌ را كه‌ لشكر آسمان‌ را بر بامها می‌پرستند، و آن‌ پرستندگان‌ را كه‌ به‌ یهوه‌ قَسَم‌ می‌خورند و آنانی‌ را كه‌ به‌ مَلْكوم‌ سوگند می‌خورند،','And them that worship the host of heaven upon the housetops; and them that worship and that swear by the LORD, and that swear by Malcham;');
INSERT INTO verses VALUES (3600100006,36001,6,'و آنانی‌ را كه‌ از پیروی‌ یهوه‌ مُرتَدّ شده‌اند، و آنانی‌ را كه‌ خداوند را نمی‌طلبند و از او مسألت‌ نمی‌نمایند.','And them that are turned back from the LORD; and those that have not sought the LORD, nor enquired for him.');
INSERT INTO verses VALUES (3600100007,36001,7,'به‌ حضور خداوند یهوه‌ خاموش‌ باش‌، زیرا كه‌ روز خداوند نزدیك‌ است‌، چونكه‌ خداوند قربانی‌ای‌ مهیا كرده‌ است‌ و دعوت‌شدگان‌ خود را تقدیس‌ نموده‌ است‌.','Hold thy peace at the presence of the Lord GOD: for the day of the LORD is at hand: for the LORD hath prepared a sacrifice, he hath bid his guests.');
INSERT INTO verses VALUES (3600100008,36001,8,'و در روز قربانی خداوند واقع‌ خواهد شد كه‌ من‌ بر سروران‌ و پسران‌ پادشاه‌ و همه‌ آنانی‌ كه‌ لباس‌ بیگانه‌ می‌پوشند عقوبت‌ خواهم‌ رسانید.','And it shall come to pass in the day of the LORD''s sacrifice, that I will punish the princes, and the king''s children, and all such as are clothed with strange apparel.');
INSERT INTO verses VALUES (3600100009,36001,9,'و در آن‌ روز بر همه‌ آنانی‌ كه‌ برآستانه‌ می‌جَهَند عقوبت‌ خواهم‌ رسانید و بر آنانی‌ كه‌ خانه‌ خداوند خود را از ظلم‌ و فریب‌ پر می‌سازند.','In the same day also will I punish all those that leap on the threshold, which fill their masters'' houses with violence and deceit.');
INSERT INTO verses VALUES (3600100010,36001,10,'و خداوند می‌گوید كه‌ در آن‌ روز صدای‌ نعره‌ای‌ از دروازه‌ ماهی‌ و وِلوِله‌ای‌ از محلّه‌ دوّم‌ و شكستگی‌ عظیمی‌ از تلّها مسموع‌ خواهد شد.','And it shall come to pass in that day, saith the LORD, that there shall be the noise of a cry from the fish gate, and an howling from the second, and a great crashing from the hills.');
INSERT INTO verses VALUES (3600100011,36001,11,'ای‌ ساكنان‌ مَكْتیش‌ ولوله‌ نمایید زیرا كه‌ تمامی‌ قوم‌ كنعان‌ تلف‌ شده‌ و همه‌ آنانی‌ كه‌ نقره‌ را برمی‌دارند منقطع‌ گردیده‌اند.','Howl, ye inhabitants of Maktesh, for all the merchant people are cut down; all they that bear silver are cut off.');
INSERT INTO verses VALUES (3600100012,36001,12,'و در آنوقت‌ اورشلیم‌ را به‌ چراغها تفتیش‌ خواهم‌ نمود و بر آنانی‌ كه‌ بر دُرْدهای‌ خود نشسته‌اند و در دلهای‌ خود می‌گویند خداوند نه‌ نیكویی‌ می‌كند و نه‌ بدی‌، عقوبت‌ خواهم‌ رسانید.','And it shall come to pass at that time, that I will search Jerusalem with candles, and punish the men that are settled on their lees: that say in their heart, The LORD will not do good, neither will he do evil.');
INSERT INTO verses VALUES (3600100013,36001,13,'بنابراین‌، دولت‌ ایشان‌ تاراج‌ و خانه‌های‌ ایشان‌ خراب‌ خواهد شد؛ و خانه‌ها بنا خواهند نمود، امّا در آنها ساكن‌ نخواهند شد و تاكستانها غرس‌ خواهند كرد، امّا شراب‌ آنها را نخواهند نوشید.','Therefore their goods shall become a booty, and their houses a desolation: they shall also build houses, but not inhabit them; and they shall plant vineyards, but not drink the wine thereof.');
INSERT INTO verses VALUES (3600100014,36001,14,'روز عظیم‌ خداوند نزدیك‌ است‌، نزدیك‌ است‌ و بزودی‌ هرچه‌ تمام‌تر می‌رسد. آواز روز خداوند مسموع‌ است‌ و مرد زورآور در آن‌ به‌ تلخی‌ فریاد برخواهد آورد.','The great day of the LORD is near, it is near, and hasteth greatly, even the voice of the day of the LORD: the mighty man shall cry there bitterly.');
INSERT INTO verses VALUES (3600100015,36001,15,'آن‌ روز، روز غضب‌ است‌، روز تنگی‌ و اضطراب‌، روز خرابی‌ و ویرانی‌، روزِ تاریكی‌ و ظلمت‌، روز ابرها و ظلمتِ غلیظ‌،','That day is a day of wrath, a day of trouble and distress, a day of wasteness and desolation, a day of darkness and gloominess, a day of clouds and thick darkness,');
INSERT INTO verses VALUES (3600100016,36001,16,'روز كَرِنّا و هنگامه‌ جنگ‌ به‌ ضدّ شهرهای‌ حصاردار و به‌ ضدّ برجهای‌ بلند.','A day of the trumpet and alarm against the fenced cities, and against the high towers.');
INSERT INTO verses VALUES (3600100017,36001,17,'و مردمان‌ را چنان‌ به‌ تنگ‌ می‌آورم‌ كه‌ كورانه‌ راه‌ خواهند رفت‌ زیرا كه‌ به‌ خداوند گناه‌ ورزیده‌اند. پس‌ خون‌ ایشان‌ مثل‌ غبار و گوشت‌ ایشان‌ مانند سرگین‌ ریخته‌ خواهد شد.','And I will bring distress upon men, that they shall walk like blind men, because they have sinned against the LORD: and their blood shall be poured out as dust, and their flesh as the dung.');
INSERT INTO verses VALUES (3600100018,36001,18,'در روز غضبِ خداوند نه‌ نقره‌ و نه‌ طلای‌ ایشان‌ ایشان‌ را تواند رهانید و تمامی‌ جهان‌ از آتش‌ غیرت‌ او سوخته‌ خواهدشد، زیرا كه‌ بر تمامی‌ ساكنان‌ جهان‌ هلاكتی‌ هولناك‌ وارد خواهد آورد.','Neither their silver nor their gold shall be able to deliver them in the day of the LORD''s wrath; but the whole land shall be devoured by the fire of his jealousy: for he shall make even a speedy riddance of all them that dwell in the land.');
id INTEGER PRIMARY KEY,
book_id INTEGER NOT NULL,
chapter_number INTEGER NOT NULL,
audio_local TEXT,
audio_online_fa TEXT,
audio_online_en TEXT
);
id INTEGER PRIMARY KEY,
chapter_id INTEGER NOT NULL,
verse_number INTEGER NOT NULL,
text_fa TEXT,
text_en TEXT
);
INSERT INTO chapters VALUES (37001,37,1,NULL,'http://audio1.wordfree.net/bibles/app/audio/20/37/1.mp3','http://audio1.wordfree.net/bibles/app/audio/20/37/1.mp3');
INSERT INTO verses VALUES (3700100001,37001,1,'span class="verse" id="1">1 </span در روز اوّل‌ ماه‌ ششم‌ از سال‌ دوّمِ داریوش پادشاه‌، كلام‌ خداوند به‌ واسطه‌ حَجَّی‌نبی‌ و به‌ زَرُبّابِل‌ بن‌ شألْتِیئِیل‌ والی‌ یهودا و به‌ یهُوْشَع‌ بن‌ یهُوصادق‌ رئیس‌ كَهَنه‌ رسیده‌، گفت‌:','span class="verse" id="1">1 </span In the second year of Darius the king, in the sixth month, in the first day of the month, came the word of the LORD by Haggai the prophet unto Zerubbabel the son of Shealtiel, governor of Judah , and to Joshua the son of Josedech, the high priest, saying,');
INSERT INTO verses VALUES (3700100002,37001,2,'یهوه‌ صبایوت‌ تكلّم‌ نموده‌، چنین‌ می‌فرماید: این‌ قوم‌ می‌گویند وقتِ آمدن‌ ما یعنی‌ وقت‌ بنا نمودن‌ خانه‌ خداوند نرسیده‌ است‌.','Thus speaketh the LORD of hosts, saying, This people say, The time is not come, the time that the LORD''s house should be built.');
INSERT INTO verses VALUES (3700100003,37001,3,'پس‌ كلام‌ خداوند به‌ واسطه‌ حَجَّی‌ نبی‌ نازل‌ شده‌، گفت‌:','Then came the word of the LORD by Haggai the prophet, saying,');
INSERT INTO verses VALUES (3700100004,37001,4,'آیا وقت‌ شماست‌ كه‌ شما در خانه‌های‌ مُسَقَّف‌ خود ساكن‌ شوید و این‌ خانه‌ خراب‌ بماند؟','Is it time for you, O ye, to dwell in your cieled houses, and this house lie waste?');
INSERT INTO verses VALUES (3700100005,37001,5,'پس‌ حال‌ یهوه‌ صبایوت‌ چنین‌ می‌گوید دل‌ خود را به‌ راههای‌ خویش‌ مشغول‌ سازید.','Now therefore thus saith the LORD of hosts; Consider your ways.');
INSERT INTO verses VALUES (3700100006,37001,6,'بسیار كاشته‌اید و اندك‌ حاصل‌ می‌كنید. می‌خورید امّا سیر نمی‌شوید و می‌نوشید لیكن‌ سیراب‌ نمی‌گردید. (رخت‌) می‌پوشید امّا گرم‌ نمی‌شوید و آنكه‌ مُزد می‌گیرد، مزد خویش‌ را در كیسه‌ سوراخ‌دار می‌گذارد.','Ye have sown much, and bring in little; ye eat, but ye have not enough; ye drink, but ye are not filled with drink; ye clothe you, but there is none warm; and he that earneth wages earneth wages to put it into a bag with holes.');
INSERT INTO verses VALUES (3700100007,37001,7,'پس‌ یهوه‌ صبایوت‌ چنین‌ می‌گوید: دل‌ خود را به‌ راههای‌ خود مشغول‌ سازید.','Thus saith the LORD of hosts; Consider your ways.');
INSERT INTO verses VALUES (3700100008,37001,8,'به‌ كوه‌ برآمده‌ وچوب‌ آورده‌، خانه‌ را بنا نمایید و خداوند می‌گوید: از آن‌ راضی‌ شده‌، جلال‌ خواهم‌ یافت‌.','Go up to the mountain, and bring wood, and build the house; and I will take pleasure in it, and I will be glorified, saith the LORD.');
INSERT INTO verses VALUES (3700100009,37001,9,'منتظر بسیار بودید و اینك‌ كم‌ شد و چون‌ آن‌ را به‌ خانه‌ آوردید من‌ بر آن‌ دمیدم‌. یهوه‌ صبایوت‌ می‌پرسد كه‌ سبب‌ این‌ چیست‌؟ سبب‌ این‌ است‌ كه‌ خانه‌ من‌ خراب‌ می‌ماند و هركدام‌ از شما به‌ خانه‌ خویش‌ می‌شتابید.','Ye looked for much, and lo, it came to little; and when ye brought it home, I did blow upon it. Why? saith the LORD of hosts. Because of mine house that is waste, and ye run every man unto his own house.');
INSERT INTO verses VALUES (3700100010,37001,10,'از این‌ سبب‌، آسمانهابخاطر شما از شبنم‌ باز داشته‌ می‌شود و زمین‌ از محصولش‌ بازداشته‌ می‌گردد.','Therefore the heaven over you is stayed from dew, and the earth is stayed from her fruit.');
INSERT INTO verses VALUES (3700100011,37001,11,'و من‌ بر زمین‌ و بر كوهها و بر غلّه‌ و عصیر انگور و روغن‌ زیتون‌ و بر هر آنچه‌ زمین‌ می‌رویاند و بر انسان‌ و بهایم‌ و تمامی‌ مشقّت‌های‌ دستها خشكسالی‌ را خواندم‌.','And I called for a drought upon the land, and upon the mountains, and upon the corn, and upon the new wine, and upon the oil, and upon that which the ground bringeth forth, and upon men, and upon cattle, and upon all the labour of the hands.');
INSERT INTO verses VALUES (3700100012,37001,12,'آنگاه‌ زَرُبابِل‌ بن‌ شَأَلْتَیئیل‌ و یهوشَع‌ بن‌ یهُو صادق‌ رئیس‌ كَهَنَه‌ و تمامی‌ بقیه‌ قوم‌ به‌ قول‌ یهوه‌ خدای‌ خود و به‌ كلام‌ حَجَّی‌ نبی‌ چنانكه‌ یهوه‌ خدای‌ ایشان‌ او را فرستاده‌ بود گوش‌ دادند، و قوم‌ از خداوند ترسیدند.','Then Zerubbabel the son of Shealtiel, and Joshua the son of Josedech, the high priest, with all the remnant of the people, obeyed the voice of the LORD their God, and the words of Haggai the prophet, as the LORD their God had sent him, and the people did fear before the LORD.');
INSERT INTO verses VALUES (3700100013,37001,13,'و حَجَّی‌، رسولِ خداوند، پیغام‌ خداوند را برای‌ قوم‌ بیان‌ كرده‌، گفت‌: خداوند می‌گوید كه‌ من‌ با شما هستم‌.','Then spake Haggai the LORD''s messenger in the LORD''s message unto the people, saying, I am with you, saith the LORD.');
INSERT INTO verses VALUES (3700100014,37001,14,'و خداوند روح‌ زَرُبابِل‌ بن‌ شَأَلْتَیئیل‌ والی‌ یهودا و روح‌ یهوشَع‌ بن‌ یهُوصادق‌، رئیس‌ كَهَنَه‌، و روح‌ تمامی‌ بقیه‌ قوم‌ را برانگیزانید تا بروند و در خانه‌ یهوه‌ صبایوت‌ خدای‌ خود به‌ كار پردازند.','And the LORD stirred up the spirit of Zerubbabel the son of Shealtiel, governor of Judah , and the spirit of Joshua the son of Josedech, the high priest, and the spirit of all the remnant of the people; and they came and did work in the house of the LORD of hosts, their God,');
INSERT INTO verses VALUES (3700100015,37001,15,'در روز بیست‌ و چهارم‌ ماه‌ ششم‌ از سال‌ دوّمِ داریوش‌ پادشاه‌، این‌ واقع‌ شد.','In the four and twentieth day of the sixth month, in the second year of Darius the king.');
id INTEGER PRIMARY KEY,
book_id INTEGER NOT NULL,
chapter_number INTEGER NOT NULL,
audio_local TEXT,
audio_online_fa TEXT,
audio_online_en TEXT
);
id INTEGER PRIMARY KEY,
chapter_id INTEGER NOT NULL,
verse_number INTEGER NOT NULL,
text_fa TEXT,
text_en TEXT
);
INSERT INTO chapters VALUES (38001,38,1,NULL,'http://audio1.wordfree.net/bibles/app/audio/20/38/1.mp3','http://audio1.wordfree.net/bibles/app/audio/20/38/1.mp3');
INSERT INTO verses VALUES (3800100001,38001,1,'span class="verse" id="1">1 </span در ماه‌ هشتم‌ از سال‌ دوّم‌ داریوش‌، كلام‌ خداوند بر زَكَرّیا ابن‌ بَرَكیا ابن‌ عدُّوی‌ نبی‌ نازل‌ شده‌، گفت:','span class="verse" id="1">1 </span In the eighth month, in the second year of Darius, came the word of the LORD unto Zechariah, the son of Berechiah, the son of Iddo the prophet, saying,');
INSERT INTO verses VALUES (3800100002,38001,2,'« خداوند بر پدران‌ شما بسیار غضبناك‌ بود.','The LORD hath been sore displeased with your fathers.');
INSERT INTO verses VALUES (3800100003,38001,3,'پس‌ به‌ ایشان‌ بگو: یهوه‌ صبایوت‌ چنین‌ می‌گوید بسوی‌ من‌ بازگشت‌ كنید. قول‌ یهوه‌ صبایوت‌ این‌ است‌. و یهوه‌ صبایوت‌ می‌گوید: من‌ به‌ سوی‌ شما رجوع‌ خواهم‌ نمود.','Therefore say thou unto them, Thus saith the LORD of hosts; Turn ye unto me, saith the LORD of hosts, and I will turn unto you, saith the LORD of hosts.');
INSERT INTO verses VALUES (3800100004,38001,4,'شما مثل‌ پدران‌ خود مباشید كه‌ انبیا سَلَف‌ ایشان‌ را ندا كرده‌، گفتند یهوه‌ صبایوت‌ چنین‌ می‌گوید از راههای‌ زشت‌ خود و از اعمال‌ بد خویش‌ بازگشت‌ نمایید، امّا خداوند می‌گوید كه‌ ایشان‌ نشنیدند و به‌ من‌ گوش‌ ندادند.','Be ye not as your fathers, unto whom the former prophets have cried, saying, Thus saith the LORD of hosts; Turn ye now from your evil ways, and from your evil doings: but they did not hear, nor hearken unto me, saith the LORD.');
INSERT INTO verses VALUES (3800100005,38001,5,'پدران‌ شما كجا هستند و آیا انبیا همیشه‌ زنده‌ می‌مانند؟','Your fathers, where are they? and the prophets, do they live for ever?');
INSERT INTO verses VALUES (3800100006,38001,6,'لیكن‌ كلام‌ و فرایض‌ من‌ كه‌ به‌ بندگان‌ خود انبیا امرفرموده‌ بودم‌، آیا پدران‌ شما را در نگرفت‌؟ و چون‌ ایشان‌ بازگشت‌ نمودند، گفتند چنانكه‌ یهوه‌ صبایوت‌ قصد نمود كه‌ موافق‌ راهها و اعمال‌ ما به‌ ما عمل‌ نماید همچنان‌ به‌ ما عمل‌ نموده‌ است‌.»','But my words and my statutes, which I commanded my servants the prophets, did they not take hold of your fathers? and they returned and said, Like as the LORD of hosts thought to do unto us, according to our ways, and according to our doings, so hath he dealt with us.');
INSERT INTO verses VALUES (3800100007,38001,7,'در روز بیست‌ و چهارم‌ ماه‌ یازدهم‌ كه‌ ماه‌ شَباط‌ باشد، از سال‌ دوّم‌ داریوش‌، كلام‌ خداوند بر زَكَریا ابن‌ بَرَكیا ابن‌ عِدّوُی‌ نبی‌ نازل‌ شده‌، گفت‌:','Upon the four and twentieth day of the eleventh month, which is the month Sebat, in the second year of Darius, came the word of the LORD unto Zechariah, the son of Berechiah, the son of Iddo the prophet, saying,');
INSERT INTO verses VALUES (3800100008,38001,8,'در وقت‌ شب‌ دیدم‌ كه‌ اینك‌ مردی‌ بر اسب‌ سرخ‌ سوار بود و در میان‌ درختان‌ آس‌ كه‌ در وادی‌ بودایستاده‌ و در عقب‌ او اسبان‌ سرخ‌ و زرد و سفید بود.','I saw by night, and behold a man riding upon a red horse, and he stood among the myrtle trees that were in the bottom; and behind him were there red horses, speckled, and white.');
INSERT INTO verses VALUES (3800100009,38001,9,'و گفتم‌: «ای‌ آقایم‌ اینها چیستند؟» و فرشته‌ای‌ كه‌ با من‌ تكلّم‌ می‌نمود، مرا گفت‌: «من‌ تو را نشان‌ می‌دهم‌ كه‌ اینها چیستند.»','Then said I, O my lord, what are these? And the angel that talked with me said unto me, I will shew thee what these be.');
INSERT INTO verses VALUES (3800100010,38001,10,'پس‌ آن‌ مرد كه‌ در میان‌ درختان‌ آس‌ ایستاده‌ بود، جواب‌ داد و گفت‌: «اینها كسانی‌ می‌باشند كه‌ خداوند ایشان‌ را برای‌ تردّد نمودن‌ در جهان‌ فرستاده‌ است‌.»','And the man that stood among the myrtle trees answered and said, These are they whom the LORD hath sent to walk to and fro through the earth.');
INSERT INTO verses VALUES (3800100011,38001,11,'و ایشان‌ به‌ فرشته‌ خداوند كه‌ در میان‌ درختان‌ آس‌ ایستاده‌ بود جواب‌ داده‌، گفتند: «ما در جهان‌ تردّد نموده‌ایم‌ و اینك‌ تمامی‌ جهان‌ مستریح‌ و آرام‌ است‌.»','And they answered the angel of the LORD that stood among the myrtle trees, and said, We have walked to and fro through the earth, and, behold, all the earth sitteth still, and is at rest.');
INSERT INTO verses VALUES (3800100012,38001,12,'و فرشته‌ خداوند جواب‌ داده‌، گفت‌: «ای‌ یهوه‌ صبایوت‌ تا به‌ كی‌ بر اورشلیم‌ و شهرهای‌ یهودا كه‌ در این‌ هفتاد سال‌ غضبناك‌ می‌بودی‌ رحمت‌ نخواهی‌ نمود؟»','Then the angel of the LORD answered and said, O LORD of hosts, how long wilt thou not have mercy on Jerusalem and on the cities of Judah , against which thou hast had indignation these threescore and ten years?');
INSERT INTO verses VALUES (3800100013,38001,13,'و خداوند با سخنان‌ نیكو و كلام‌ تسلّی‌آمیز آن‌ فرشته‌ای‌ را كه‌ با من‌ تكلّم‌ می‌نمود جواب‌ داد.','And the LORD answered the angel that talked with me with good words and comfortable words.');
INSERT INTO verses VALUES (3800100014,38001,14,'پس‌ فرشته‌ای‌ كه‌ با من‌ تكلّم‌ می‌نمود مرا گفت‌: «ندا كرده‌ بگو یهوه‌ صبایوت‌ چنین‌ می‌گوید: در باره‌ اورشلیم‌ و صَهْیون‌ غیرت‌ عظیمی‌ داشتم‌.','So the angel that communed with me said unto me, Cry thou, saying, Thus saith the LORD of hosts; I am jealous for Jerusalem and for Zion with a great jealousy.');
INSERT INTO verses VALUES (3800100015,38001,15,'و برامّت‌های‌ مطمئن‌ سخت‌ غضبناك‌ شدم‌ زیرا كه‌ اندك‌ غضبناك‌ می‌بودم‌ لیكن‌ ایشان‌ بلا را زیاده‌ كردند.','And I am very sore displeased with the heathen that are at ease: for I was but a little displeased, and they helped forward the affliction.');
INSERT INTO verses VALUES (3800100016,38001,16,'بنابراین‌ خداوند چنین‌ می‌گوید: به‌ اورشلیم‌ با رحمت‌ها رجوع‌ خواهم‌ نمود و خانه‌ من‌ در آن‌ بنا خواهد شد. قول‌ یهوه‌ صبایوت‌ این‌ است‌ و ریسمانكاری‌ براورشلیم‌ كشیده‌ خواهد شد.','Therefore thus saith the LORD; I am returned to Jerusalem with mercies: my house shall be built in it, saith the LORD of hosts, and a line shall be stretched forth upon Jerusalem .');
INSERT INTO verses VALUES (3800100017,38001,17,'بار دیگر ندا كرده‌، بگو كه‌ یهوه‌ صبایوت‌ چنین‌ می‌گوید: شهرهای‌ من‌ بار دیگر به‌ سعادتمندی‌ لبریز خواهد شد و خداوند صَهْیون‌ را باز تسلّی‌ خواهـد داد و اورشلیم‌ را بار دیگر خواهد برگزید.»','Cry yet, saying, Thus saith the LORD of hosts; My cities through prosperity shall yet be spread abroad; and the LORD shall yet comfort Zion, and shall yet choose Jerusalem .');
INSERT INTO verses VALUES (3800100018,38001,18,'پس‌ چشمان‌ خود را برافراشته‌، نگریستم‌ و اینك‌ چهار شاخ‌ بود.','Then lifted I up mine eyes, and saw, and behold four horns.');
INSERT INTO verses VALUES (3800100019,38001,19,'و به‌ فرشته‌ای‌ كه‌ با من‌ تكلّم‌ می‌نمود گفتم‌: «اینها چیستند؟» او مرا گفت‌: «اینها شاخها می‌باشند كه‌ یهودا و اسرائیل‌ و اورشلیم‌ را پراكنده‌ ساخته‌اند.»','And I said unto the angel that talked with me, What be these? And he answered me, These are the horns which have scattered Judah , Israel , and Jerusalem .');
INSERT INTO verses VALUES (3800100020,38001,20,'و خداوند چهار آهنگر به‌ من‌ نشان‌ داد.','And the LORD shewed me four carpenters.');
INSERT INTO verses VALUES (3800100021,38001,21,'و گفتم‌: «اینان‌ برای‌ چه‌ كار می‌آیند؟» او در جواب‌ گفت‌: «آنها شاخها می‌باشند كه‌ یهودا را چنان‌ پراكنده‌ نموده‌اند كه‌ احدی‌ سر خود را بلند نمی‌تواند كرد. و اینها می‌آیند تا آنها را بترسانند و شاخهای‌ امّت‌هایی‌ را كه‌ شاخ‌ خود را بر زمین‌ یهودا برافراشته‌، آن‌ را پراكنده‌ ساخته‌اند بیرون‌ افكننـد.»','Then said I, What come these to do? And he spake, saying, These are the horns which have scattered Judah , so that no man did lift up his head: but these are come to fray them, to cast out the horns of the Gentiles, which lifted up their horn over the land of Judah to scatter it.');
id INTEGER PRIMARY KEY,
book_id INTEGER NOT NULL,
chapter_number INTEGER NOT NULL,
audio_local TEXT,
audio_online_fa TEXT,
audio_online_en TEXT
);
id INTEGER PRIMARY KEY,
chapter_id INTEGER NOT NULL,
verse_number INTEGER NOT NULL,
text_fa TEXT,
text_en TEXT
);
INSERT INTO chapters VALUES (39001,39,1,NULL,'http://audio1.wordfree.net/bibles/app/audio/20/39/1.mp3','http://audio1.wordfree.net/bibles/app/audio/20/39/1.mp3');
INSERT INTO verses VALUES (3900100001,39001,1,'span class="verse" id="1">1 </span وَحْی كلام‌ خداوند درباره‌ اسرائیل‌ به‌واسطه‌ مَلاكی‌.','span class="verse" id="1">1 </span The burden of the word of the LORD to Israel by Malachi.');
INSERT INTO verses VALUES (3900100002,39001,2,'خداوند می‌گوید كه‌ شما را دوست‌ داشته‌ام‌. امّا شما می‌گویید: چگونه‌ ما را دوست‌ داشته‌ای‌؟ آیا عیسُو برادر یعقوب‌ نبود؟ و خداوند می‌گوید كه‌ یعقوب‌ را دوست‌ داشتم‌،','I have loved you, saith the LORD. Yet ye say, Wherein hast thou loved us? Was not Esau Jacob ''s brother? saith the LORD: yet I loved Jacob ,');
INSERT INTO verses VALUES (3900100003,39001,3,'و از عیسو نفرت‌ نمودم‌ و كوههای‌ او را ویران‌ و میراث‌ وی‌ را نصیب‌ شغالهای‌ بیابان‌ گردانیدم‌.','And I hated Esau , and laid his mountains and his heritage waste for the dragons of the wilderness.');
INSERT INTO verses VALUES (3900100004,39001,4,'چونكه‌ اَدوْم‌ می‌گوید: منهدم‌ شده‌ایم‌ امّا خواهیم‌ برگشت‌ و مخروبه‌ها را بنا خواهیم‌ نمود. یهوه‌ صبایوت‌ چنین‌ می‌فرماید: ایشان‌ بنا خواهند نمود، امّا من‌ منهدم‌ خواهم‌ ساخت‌ و ایشان‌ را به‌ سرحدّ شرارت‌ و به‌ قومی‌ كه‌ خداوند بر ایشان‌ تا به‌ ابد غضبناك‌ می‌باشد، مسمّی‌ خواهند ساخت‌.','Whereas Edom saith, We are impoverished, but we will return and build the desolate places; thus saith the LORD of hosts, They shall build, but I will throw down; and they shall call them, The border of wickedness, and, The people against whom the LORD hath indignation for ever.');
INSERT INTO verses VALUES (3900100005,39001,5,'و چون‌ چشمان‌ شما این‌ را بیند خواهید گفت‌: خداوند از حدود اسرائیل‌ متعظّم‌ باد!','And your eyes shall see, and ye shall say, The LORD will be magnified from the border of Israel .');
INSERT INTO verses VALUES (3900100006,39001,6,'پسر، پدر خود و غلام‌، آقای‌ خویش‌ را احترام‌ می‌نماید. پس‌ اگر من‌ پدر هستم‌ احترام‌ من‌ كجا است‌؟ و اگر من‌ آقا هستم‌ هیبت‌ من‌ كجا است‌؟ یهوه‌ صبایوت‌ به‌ شما تكلّم‌ می‌كند. ای‌ كاهنانی‌ كه‌ اسم‌ مرا حقیر می‌شمارید و می‌گوییدچگونه‌ اسم‌ تو را حقیر شمرده‌ایم‌؟','A son honoureth his father, and a servant his master: if then I be a father, where is mine honour? and if I be a master, where is my fear? saith the LORD of hosts unto you, O priests, that despise my name. And ye say, Wherein have we despised thy name?');
INSERT INTO verses VALUES (3900100007,39001,7,'نان‌ نجس‌ بر مذبح‌ من‌ می‌گذرانید و می‌گویید چگونه‌ تو را بی‌حرمت‌ نموده‌ایم‌؟ از اینكه‌ می‌گویید خوان‌ خداوند محقّر است‌.','Ye offer polluted bread upon mine altar; and ye say, Wherein have we polluted thee? In that ye say, The table of the LORD is contemptible.');
INSERT INTO verses VALUES (3900100008,39001,8,'و چون‌ كور را برای‌ قربانی‌ می‌گذرانید، آیا قبیح‌ نیست‌؟ و چون‌ لنگ‌ یا بیمار را می‌گذرانید، آیا قبیح‌ نیست‌؟ آن‌ را به‌ حاكم‌ خود هدیه‌ بگذران‌ و آیا او از تو راضی‌ خواهد شد یا تو را مقبول‌ خواهد داشت‌؟ قول‌ یهوه‌ صبایوت‌ این‌ است‌.','And if ye offer the blind for sacrifice, is it not evil? and if ye offer the lame and sick, is it not evil? offer it now unto thy governor; will he be pleased with thee, or accept thy person? saith the LORD of hosts.');
INSERT INTO verses VALUES (3900100009,39001,9,'و الا´ن‌ از خدا مسألت‌ نما تا بر ما ترحّم‌ نماید. یهوه‌ صبایوت‌ می‌گوید این‌ از دست‌ شما واقع‌ شده‌ است‌، پس‌ آیا هیچ‌ كدام‌ از شما را مستجاب‌ خواهد فرمود؟','And now, I pray you, beseech God that he will be gracious unto us: this hath been by your means: will he regard your persons? saith the LORD of hosts.');
INSERT INTO verses VALUES (3900100010,39001,10,'كاش‌ كه‌ یكی‌ از شما می‌بود كه‌ درها را ببندد تا آتش‌ بر مذبح‌ من‌ بیجا نیفروزید. یهوه‌ صبایوت‌ می‌گوید: در شما هیچ‌ خوشی‌ ندارم‌ و هیچ‌ هدیه‌ از دست‌ شما قبول‌ نخواهم‌ كرد.','Who is there even among you that would shut the doors for nought? neither do ye kindle fire on mine altar for nought. I have no pleasure in you, saith the LORD of hosts, neither will I accept an offering at your hand.');
INSERT INTO verses VALUES (3900100011,39001,11,'زیرا كه‌ از مطلع‌ آفتاب‌ تا مغربش‌ اسم‌ من‌ در میان‌ امّت‌ها عظیم‌ خواهد بود؛ و بُخُور و هدیه‌ طاهر در هر جا به‌ اسم‌ من‌ گذرانیده‌ خواهد شد، زیرا یهوه‌ صبایوت‌ می‌گوید كه‌ اسم‌ من‌ در میان‌ امّت‌ها عظیم‌ خواهد بود.','For from the rising of the sun even unto the going down of the same my name shall be great among the Gentiles; and in every place incense shall be offered unto my name, and a pure offering: for my name shall be great among the heathen, saith the LORD of hosts.');
INSERT INTO verses VALUES (3900100012,39001,12,'امّا شما آن‌ را بی‌حرمت‌ می‌سازید چونكه‌ می‌گویید كه‌ خوان‌ خداوند نجس‌ است‌ و ثمره‌ آن‌ یعنی‌ طعامش‌ محقّر است‌.','But ye have profaned it, in that ye say, The table of the LORD is polluted; and the fruit thereof, even his meat, is contemptible.');
INSERT INTO verses VALUES (3900100013,39001,13,'و یهوه‌ صبایوت‌ می‌فرماید كه‌ شما می‌گویید اینك‌ این‌ چه‌ زحمت‌ است‌ و آن‌ رااهانت‌ می‌كنید و چون‌ (حیوانات‌) دریده‌ شده‌ و لنگ‌ و بیمار را آورده‌، آنها را برای‌ هدیه‌ می‌گذرانید آیا من‌ آنها را از دست‌ شما قبول‌ خواهم‌ كرد؟ قول‌ خداوند این‌ است‌.','Ye said also, Behold, what a weariness is it! and ye have snuffed at it, saith the LORD of hosts; and ye brought that which was torn, and the lame, and the sick; thus ye brought an offering: should I accept this of your hand? saith the LORD.');
INSERT INTO verses VALUES (3900100014,39001,14,'پس‌ ملعون‌ باد هر كه‌ فریب‌ دهد و با آنكه‌ نرینه‌ای‌ در گله‌ خود دارد معیوبی‌ برای‌ خداوند نذر كرده‌، آن‌ را ذبح‌ نماید. زیرا كه‌ یهوه‌ صبایوت‌ می‌گوید: من‌ پادشاه‌ عظیم‌ می‌باشم‌ و اسم‌ من‌ در میان‌ امّت‌ها مهیب‌ خواهد بود.','But cursed be the deceiver, which hath in his flock a male, and voweth, and sacrificeth unto the LORD a corrupt thing: for I am a great King, saith the LORD of hosts, and my name is dreadful among the heathen.');
id INTEGER PRIMARY KEY,
book_id INTEGER NOT NULL,
chapter_number INTEGER NOT NULL,
audio_local TEXT,
audio_online_fa TEXT,
audio_online_en TEXT
);
id INTEGER PRIMARY KEY,
chapter_id INTEGER NOT NULL,
verse_number INTEGER NOT NULL,
text_fa TEXT,
text_en TEXT
);
INSERT INTO chapters VALUES (40001,40,1,NULL,'http://audio1.wordfree.net/bibles/app/audio/20/40/1.mp3','http://audio1.wordfree.net/bibles/app/audio/20/40/1.mp3');
INSERT INTO verses VALUES (4000100001,40001,1,'span class="verse" id="1">1 </span کتاب نسب نامه عیسی مسیح بن داود بن ابراهیم،','span class="verse" id="1">1 </span The book of the generation of Jesus Christ , the son of David , the son of Abraham .');
INSERT INTO verses VALUES (4000100002,40001,2,'ابراهیم اسحاق را آورد و اسحاق یعقوب را آورد و یعقوب یهودا و برادران او را آورد.','Abraham begat Isaac ; and Isaac begat Jacob ; and Jacob begat Judas and his brethren;');
INSERT INTO verses VALUES (4000100003,40001,3,'و یهودا، فارَص و زارَح را از تامار آورد و فارَص، حَصْرون را آورد و حَصْرون، اَرام را آورد.','And Judas begat Phares and Zara of Thamar ; and Phares begat Esrom ; and Esrom begat Aram ;');
INSERT INTO verses VALUES (4000100004,40001,4,'و اَرام، عَمِّیناداب را آورد و عَمّیناداب، نَحشون را آورد و نَحْشون، شَلْمون را آورد.','And Aram begat Aminadab ; and Aminadab begat Naasson ; and Naasson begat Salmon ;');
INSERT INTO verses VALUES (4000100005,40001,5,'و شَلْمون، بوعَز را از راحاب آورد و بوعَز، عوبید را از راعوت آورد و عوبید، یَسّا را آورد.','And Salmon begat Booz of Rachab; and Booz begat Obed of Ruth ; and Obed begat Jesse ;');
INSERT INTO verses VALUES (4000100006,40001,6,'و یَسّا داود پادشاه را آورد و داود پادشاه، سلیمان را از زن اوریّا آورد.','And Jesse begat David the king; and David the king begat Solomon of her that had been the wife of Urias ;');
INSERT INTO verses VALUES (4000100007,40001,7,'و سلیمان، رَحَبْعام را آورد و رَحبْعام، اَبِیَّا را آورد و اَبِیّا، آسا را آورد.','And Solomon begat Roboam ; and Roboam begat Abia ; and Abia begat Asa ;');
INSERT INTO verses VALUES (4000100008,40001,8,'و آسا، یَهوشافاط را آورد و یَهوشافاط، یورام را آورد و یورام، عُزیّا را آورد.','And Asa begat Josaphat ; and Josaphat begat Joram ; and Joram begat Ozias ;');
INSERT INTO verses VALUES (4000100009,40001,9,'و عُزیّا، یوتام را آورد و یوتام، اَحاز را آورد و اَحاز، حِزْقیَّا را آورد.','And Ozias begat Joatham ; and Joatham begat Achaz ; and Achaz begat Ezekias ;');
INSERT INTO verses VALUES (4000100010,40001,10,'و حِزْقیّا، مَنَسّی را آورد و مَنَسّی، آمون را آورد و آمون، یوشیّا را آورد.','And Ezekias begat Manasses ; and Manasses begat Amon ; and Amon begat Josias ;');
INSERT INTO verses VALUES (4000100011,40001,11,'و یوشیَّا، یَکُنیا و برادرانش را در زمان جلای بابِل آورد.','And Josias begat Jechonias and his brethren, about the time they were carried away to Babylon :');
INSERT INTO verses VALUES (4000100012,40001,12,'و بعد از جلای بابل، یَکُنْیا، سَألْتیئیل را آورد و سَأَلْتیئیل، زَرُوبابِل را آورد.','And after they were brought to Babylon , Jechonias begat Salathiel ; and Salathiel begat Zorobabel ;');
INSERT INTO verses VALUES (4000100013,40001,13,'زَرُوبابِل، اَبیهود را آورد و اَبیهود، ایلیاقیم را آورد و ایلیاقیم، عازور را آورد.','And Zorobabel begat Abiud ; and Abiud begat Eliakim ; and Eliakim begat Azor ;');
INSERT INTO verses VALUES (4000100014,40001,14,'و عازور، صادوق را آورد و صادوق، یاکین را آورد و یاکین، ایلَیهُود را آورد.','And Azor begat Sadoc ; and Sadoc begat Achim ; and Achim begat Eliud ;');
INSERT INTO verses VALUES (4000100015,40001,15,'و ایلیهود، ایلعازَر را آورد و ایلعازَر، مَتّان را آورد و مَتّان، یعقوب را آورد.','And Eliud begat Eleazar ; and Eleazar begat Matthan ; and Matthan begat Jacob ;');
INSERT INTO verses VALUES (4000100016,40001,16,'و یعقوب، یوسف شوهر مریم را آورد که عیسی مُسمّیٰ به مسیح از او متولّد شد.','And Jacob begat Joseph the husband of Mary , of whom was born Jesus , who is called Christ .');
INSERT INTO verses VALUES (4000100017,40001,17,'پس تمام طبقات، از ابراهیم تا داود چهارده طبقه است، و از داود تا جلای بابِل چهارده طبقه، و از جلای بابِل تا مسیح چهارده طبقه.','So all the generations from Abraham to David are fourteen generations; and from David until the carrying away into Babylon are fourteen generations; and from the carrying away into Babylon unto Christ are fourteen generations.');
INSERT INTO verses VALUES (4000100018,40001,18,'امّا ولادت عیسی مسیح چنین بود که چون مادرش مریم به یوسف نامزد شده بود، قبل از آنکه با هم آیند، او را از روح‌القدس حامله یافتند.','Now the birth of Jesus Christ was on this wise: When as his mother Mary was espoused to Joseph , before they came together, she was found with child of the Holy Ghost.');
INSERT INTO verses VALUES (4000100019,40001,19,'و شوهرش یوسف چونکه مرد صالح بود و نخواست او را عبرت نماید، پس اراده نمود او را به پنهانی رها کند.','Then Joseph her husband, being a just man, and not willing to make her a publick example, was minded to put her away privily.');
INSERT INTO verses VALUES (4000100020,40001,20,'امّا چون او در این چیزها تفکّر می‌کرد، ناگاه فرشته خداوند در خواب بر وی ظاهر شده، گفت، ای یوسف پسر داود، از گرفتن زن خویش مریم مترس، زیرا که آنچه در وی قرار گرفته است، از روح‌القدس است.','But while he thought on these things, behold, the angel of the LORD appeared unto him in a dream, saying, Joseph , thou son of David , fear not to take unto thee Mary thy wife: for that which is conceived in her is of the Holy Ghost.');
INSERT INTO verses VALUES (4000100021,40001,21,'و او پسری خواهد زایید و نام او را عیسی خواهی نهاد، زیرا که او امّت خویش را از گناهانشان خواهد رهانید.','And she shall bring forth a son, and thou shalt call his name JESUS: for he shall save his people from their sins.');
INSERT INTO verses VALUES (4000100022,40001,22,'،و این همه برای آن واقع شد تا کلامی که خداوند به زبان نبی گفته بود، تمام گردد،','Now all this was done, that it might be fulfilled which was spoken of the Lord by the prophet, saying,');
INSERT INTO verses VALUES (4000100023,40001,23,'که اینک، باکره آبستن شده پسری خواهد زایید و نام او را عمّانوئیل خواهند خواند که تفسیرش این است، خدا با ما.','Behold, a virgin shall be with child, and shall bring forth a son, and they shall call his name Emmanuel , which being interpreted is, God with us.');
INSERT INTO verses VALUES (4000100024,40001,24,'پس چون یوسف از خواب بیدار شد، چنانکه فرشتهٔ خداوند بدو امر کرده بود، به عمل آورد و زن خویش را گرفت','Then Joseph being raised from sleep did as the angel of the Lord had bidden him, and took unto him his wife:');
INSERT INTO verses VALUES (4000100025,40001,25,'و تا پسر نخستین خود را نزایید، او را نشناخت؛ و او را عیسی نام نهاد.','And knew her not till she had brought forth her firstborn son: and he called his name JESUS.');
id INTEGER PRIMARY KEY,
book_id INTEGER NOT NULL,
chapter_number INTEGER NOT NULL,
audio_local TEXT,
audio_online_fa TEXT,
audio_online_en TEXT
);
id INTEGER PRIMARY KEY,
chapter_id INTEGER NOT NULL,
verse_number INTEGER NOT NULL,
text_fa TEXT,
text_en TEXT
);
INSERT INTO chapters VALUES (41001,41,1,NULL,'http://audio1.wordfree.net/bibles/app/audio/20/41/1.mp3','http://audio1.wordfree.net/bibles/app/audio/20/41/1.mp3');
INSERT INTO verses VALUES (4100100001,41001,1,'span class="verse" id="1">1 </span ابتدای انجیل عیسی مسیح پسر خدا','span class="verse" id="1">1 </span The beginning of the gospel of Jesus Christ , the Son of God;');
INSERT INTO verses VALUES (4100100002,41001,2,'چنانکه در اشعیا نبی مکتوب است، اینک، رسول خود را پیش روی تو می‌فرستم تا راه تو را پیش تو مهیّا سازد.','As it is written in the prophets, Behold, I send my messenger before thy face, which shall prepare thy way before thee.');
INSERT INTO verses VALUES (4100100003,41001,3,'صدای ندا کننده‌ای در بیابان که راه خداوند را مهیّا سازید و طُرُق او را راست نمایید.','The voice of one crying in the wilderness, Prepare ye the way of the Lord, make his paths straight.');
INSERT INTO verses VALUES (4100100004,41001,4,'یحیی تعمید‌دهنده در بیابان ظاهر شد و بجهت آمرزش گناهان به تعمید توبه موعظه می‌نمود.','John did baptize in the wilderness, and preach the baptism of repentance for the remission of sins.');
INSERT INTO verses VALUES (4100100005,41001,5,'و تمامی مرز و بوم یهودیه و جمیع سَکَنه اورشلیم نزد وی بیرون شدند و به گناهان خود معترف گردیده، در رود اُردُن از او تعمید می‌یافتند.','And there went out unto him all the land of Judæa , and they of Jerusalem , and were all baptized of him in the river of Jordan , confessing their sins.');
INSERT INTO verses VALUES (4100100006,41001,6,'و یحیی را لباس از پشم شتر و کمربند چرمی بر کمر می‌بود و خوراک وی از ملخ و عسل برّی.','And John was clothed with camel''s hair, and with a girdle of a skin about his loins; and he did eat locusts and wild honey;');
INSERT INTO verses VALUES (4100100007,41001,7,'و موعظه می‌کرد و می‌گفت که، بعد از من کسی تواناتر از من می‌آید که لایق آن نیستم که خم شده، دوال نعلین او را باز کنم.','And preached, saying, There cometh one mightier than I after me, the latchet of whose shoes I am not worthy to stoop down and unloose.');
INSERT INTO verses VALUES (4100100008,41001,8,'من شما را به آب تعمید دادم. لیکن او شما را به روح‌القدس تعمید خواهد داد.','I indeed have baptized you with water: but he shall baptize you with the Holy Ghost.');
INSERT INTO verses VALUES (4100100009,41001,9,'و واقع شد در آن ایّام که عیسی از ناصرهٔجلیل آمده در اُرْدُن از یحیی تعمید یافت.','And it came to pass in those days, that Jesus came from Nazareth of Galilee , and was baptized of John in Jordan .');
INSERT INTO verses VALUES (4100100010,41001,10,'و چون از آب برآمد، در ساعت آسمان را شکافته دید و روح را که مانند کبوتری بروی نازل می‌شود.','And straightway coming up out of the water, he saw the heavens opened, and the Spirit like a dove descending upon him:');
INSERT INTO verses VALUES (4100100011,41001,11,'و آوازی از آسمان در رسید که تو پسر حبیب من هستی که از تو خشنودم.','And there came a voice from heaven, saying, Thou art my beloved Son, in whom I am well pleased.');
INSERT INTO verses VALUES (4100100012,41001,12,'پس بی‌درنگ روح وی را به بیابان می‌بَرَد.','And immediately the Spirit driveth him into the wilderness.');
INSERT INTO verses VALUES (4100100013,41001,13,'و مدّت چهل روز در صحرا بود و شیطان او را تجربه می‌کرد و با وحوش بسر می‌برد و فرشتگان او را پرستاری می‌نمودند.','And he was there in the wilderness forty days, tempted of Satan ; and was with the wild beasts; and the angels ministered unto him.');
INSERT INTO verses VALUES (4100100014,41001,14,'و بعد از گرفتاری یحیی، عیسی به جلیل آمده، به بشارت ملکوت خدا موعظه کرده،','Now after that John was put in prison, Jesus came into Galilee , preaching the gospel of the kingdom of God,');
INSERT INTO verses VALUES (4100100015,41001,15,'می‌گفت، وقت تمام شد و ملکوت خدا نزدیک است. پس توبه کنید و به انجیل ایمان بیاورید.','And saying, The time is fulfilled, and the kingdom of God is at hand: repent ye, and believe the gospel.');
INSERT INTO verses VALUES (4100100016,41001,16,'و چون به کناره دریای جلیل می‌گشت،شمعون و برادرش اندریاس را دید که دامی در دریا می‌اندازند زیرا که صیّاد بودند.','Now as he walked by the sea of Galilee , he saw Simon and Andrew his brother casting a net into the sea: for they were fishers.');
INSERT INTO verses VALUES (4100100017,41001,17,'عیسی ایشان را گفت، از عقب من آیید که شما را صیّاد مردم گردانم.','And Jesus said unto them, Come ye after me, and I will make you to become fishers of men.');
INSERT INTO verses VALUES (4100100018,41001,18,'بیتأمّل دامهای خود را گذارده، از پی او روانه شدند.','And straightway they forsook their nets, and followed him.');
INSERT INTO verses VALUES (4100100019,41001,19,'و از آنجا قدری پیشتر رفته، یعقوب بن زِبِدی و برادرش یوحنّا را دید که در کشتی دامهای خود را اصلاح می‌کنند.','And when he had gone a little further thence, he saw James the son of Zebedee , and John his brother, who also were in the ship mending their nets.');
INSERT INTO verses VALUES (4100100020,41001,20,'در حال ایشان را دعوت نمود. پس پدر خود زِبِدی را با مزدوران در کشتی گذارده، از عقب وی روانه شدند.','And straightway he called them: and they left their father Zebedee in the ship with the hired servants, and went after him.');
INSERT INTO verses VALUES (4100100021,41001,21,'و چون وارد کفرناحوم شدند، بیتأمّل در روز سَبَّت به کنیسه درآمده، به تعلیم دادن شروع کرد،','And they went into Capernaum ; and straightway on the sabbath day he entered into the synagogue, and taught.');
INSERT INTO verses VALUES (4100100022,41001,22,'به قسمی که از تعلیم وی حیران شدند، زیرا که ایشان را مقتدرانه تعلیم می‌داد نه مانند کاتبان.','And they were astonished at his doctrine: for he taught them as one that had authority, and not as the scribes.');
INSERT INTO verses VALUES (4100100023,41001,23,'و در کنیسه ایشان شخصی بود که روح پلید داشت. ناگاه صیحه زده،','And there was in their synagogue a man with an unclean spirit; and he cried out,');
INSERT INTO verses VALUES (4100100024,41001,24,'گفت، ای عیسی ناصری ما را با تو چه کار است؟ آیا برای هلاک کردنِ ما آمدی؟ تو را می‌شناسم کیستی، ای قدّوس خدا!','Saying, Let us alone; what have we to do with thee, thou Jesus of Nazareth ? art thou come to destroy us? I know thee who thou art, the Holy One of God.');
INSERT INTO verses VALUES (4100100025,41001,25,'عیسی به وی نهیب داده، گفت، خاموش شو و از او درآی!','And Jesus rebuked him, saying, Hold thy peace, and come out of him.');
INSERT INTO verses VALUES (4100100026,41001,26,'در ساعت آن روح خبیث او را مصروع نمود و به آواز بلند صدا زده، از او بیرون آمد.','And when the unclean spirit had torn him, and cried with a loud voice, he came out of him.');
INSERT INTO verses VALUES (4100100027,41001,27,'و همه متعجّب شدند، به‌حدّی که از همدیگر سؤال کرده، گفتند، این چیست و این چه تعلیم تازه است که ارواح پلید را نیز با قدرت امر می‌کند و اطاعتش می‌نمایند؟','And they were all amazed, insomuch that they questioned among themselves, saying, What thing is this? what new doctrine is this? for with authority commandeth he even the unclean spirits, and they do obey him.');
INSERT INTO verses VALUES (4100100028,41001,28,'و اسم او فوراً در تمامی مرز و بوم جلیلشهرت یافت.','And immediately his fame spread abroad throughout all the region round about Galilee .');
INSERT INTO verses VALUES (4100100029,41001,29,'و از کنیسه بیرون آمده، فوراً با یعقوب و یوحنّا به خانهٔ شمعون و اندریاس درآمدند.','And forthwith, when they were come out of the synagogue, they entered into the house of Simon and Andrew , with James and John .');
INSERT INTO verses VALUES (4100100030,41001,30,'و مادر زن شمعون تب کرده، خوابیده بود. در ساعت وی را از حالت او خبر دادند.','But Simon ''s wife''s mother lay sick of a fever, and anon they tell him of her.');
INSERT INTO verses VALUES (4100100031,41001,31,'پس نزدیک شده، دست او را گرفته، برخیزانیدش که همان وقت تب از او زایل شد و به خدمتگزاری ایشان مشغول گشت.','And he came and took her by the hand, and lifted her up; and immediately the fever left her, and she ministered unto them.');
INSERT INTO verses VALUES (4100100032,41001,32,'شامگاه چون آفتاب به مغرب شد، جمیع مریضان و مجانین را پیش او آوردند.','And at even, when the sun did set, they brought unto him all that were diseased, and them that were possessed with devils.');
INSERT INTO verses VALUES (4100100033,41001,33,'و تمام شهر بر درِ خانه ازدحام نمودند.','And all the city was gathered together at the door.');
INSERT INTO verses VALUES (4100100034,41001,34,'و بسا کسانی را که به انواع امراض مبتلا بودند، شفا داد و دیوهای بسیاری بیرون کرده، نگذارد که دیوها حرف زنند زیرا که او را شناختند.','And he healed many that were sick of divers diseases, and cast out many devils; and suffered not the devils to speak, because they knew him.');
INSERT INTO verses VALUES (4100100035,41001,35,'بامدادان قبل از صبح برخاسته، بیرون رفت و به ویرانهای رسیده، در آنجا به دعا مشغول شد.','And in the morning, rising up a great while before day, he went out, and departed into a solitary place, and there prayed.');
INSERT INTO verses VALUES (4100100036,41001,36,'و شمعون و رفقایش در پی او شتافتند.','And Simon and they that were with him followed after him.');
INSERT INTO verses VALUES (4100100037,41001,37,'چون او را دریافتند، گفتند، همه تو را می‌طلبند.','And when they had found him, they said unto him, All men seek for thee.');
INSERT INTO verses VALUES (4100100038,41001,38,'بدیشان گفت، به دهات مجاور هم برویم تا در آنها نیز موعظه کنم، زیرا که بجهت این کار بیرون آمدم.','And he said unto them, Let us go into the next towns, that I may preach there also: for therefore came I forth.');
INSERT INTO verses VALUES (4100100039,41001,39,'پس در تمام جلیل در کنایس ایشان وعظ می‌نمود و دیوها را اخراج می‌کرد.','And he preached in their synagogues throughout all Galilee , and cast out devils.');
INSERT INTO verses VALUES (4100100040,41001,40,'و ابرصی پیش وی آمده، استدعا کرد و زانو زده، بدو گفت، اگر بخواهی، می‌توانی مرا طاهر سازی!','And there came a leper to him, beseeching him, and kneeling down to him, and saying unto him, If thou wilt, thou canst make me clean.');
INSERT INTO verses VALUES (4100100041,41001,41,'عیسی ترحّم نموده، دست خود را دراز کرد و او را لمس نموده، گفت، می‌خواهم. طاهر شو!','And Jesus , moved with compassion, put forth his hand, and touched him, and saith unto him, I will; be thou clean.');
INSERT INTO verses VALUES (4100100042,41001,42,'و چون سخن گفت، فی‌الفور برص از او زایل شده، پاک گشت.','And as soon as he had spoken, immediately the leprosy departed from him, and he was cleansed.');
INSERT INTO verses VALUES (4100100043,41001,43,'و او را قدغن کرد و فوراً مرخّص فرموده،','And he straitly charged him, and forthwith sent him away;');
INSERT INTO verses VALUES (4100100044,41001,44,'گفت، زنهار کسی را خبر مده، بلکه رفته خود را به کاهن بنما و آنچه موسی فرموده، بجهت تطهیر خود بگذران تا برای ایشان شهادتی بشود.','And saith unto him, See thou say nothing to any man: but go thy way, shew thyself to the priest, and offer for thy cleansing those things which Moses commanded, for a testimony unto them.');
INSERT INTO verses VALUES (4100100045,41001,45,'لیکن او بیرون رفته، به موعظه نمودن و شهرت دادن این امر شروع کرد، بقسمی که بعد از آن او نتوانست آشکارا به شهر درآید، بلکه در ویرانه‌های بیرون بسر می‌برد و مردم از همهٔ اطراف نزد وی می‌آمدند.','But he went out, and began to publish it much, and to blaze abroad the matter, insomuch that Jesus could no more openly enter into the city, but was without in desert places: and they came to him from every quarter.');
id INTEGER PRIMARY KEY,
book_id INTEGER NOT NULL,
chapter_number INTEGER NOT NULL,
audio_local TEXT,
audio_online_fa TEXT,
audio_online_en TEXT
);
id INTEGER PRIMARY KEY,
chapter_id INTEGER NOT NULL,
verse_number INTEGER NOT NULL,
text_fa TEXT,
text_en TEXT
);
INSERT INTO chapters VALUES (42001,42,1,NULL,'http://audio1.wordfree.net/bibles/app/audio/20/42/1.mp3','http://audio1.wordfree.net/bibles/app/audio/20/42/1.mp3');
INSERT INTO verses VALUES (4200100001,42001,1,'span class="verse" id="1">1 </span از آن‌جهت که بسیاری دست خود را دراز کردند به سوی تألیف حکایت آن اموری که نزد ما به اتمام رسید،','span class="verse" id="1">1 </span Forasmuch as many have taken in hand to set forth in order a declaration of those things which are most surely believed among us,');
INSERT INTO verses VALUES (4200100002,42001,2,'چنانچه آنانی که از ابتدا نظارگان و خادمان کلام بودند به ما رسانیدند،','Even as they delivered them unto us, which from the beginning were eyewitnesses, and ministers of the word;');
INSERT INTO verses VALUES (4200100003,42001,3,'من نیز مصلحت چنان دیدم که همه را من البدایهٔ به تدقیق در پی رفته، به ترتیب به تو بنویسم ای تیوفلس عزیز،','It seemed good to me also, having had perfect understanding of all things from the very first, to write unto thee in order, most excellent Theophilus,');
INSERT INTO verses VALUES (4200100004,42001,4,'تا صحّت آن کلامی را که در آن تعلیم یافته‌ای دریابی.','That thou mightest know the certainty of those things, wherein thou hast been instructed.');
INSERT INTO verses VALUES (4200100005,42001,5,'در ایّام هیرودیس، پادشاه یهودیّه، کاهنی زکرّیا نام از فرقه ابیّا بود که زن او از دختران هارون بود و الیصابات نام داشت.','There was in the days of Herod , the king of Judæa , a certain priest named Zacharias , of the course of Abia : and his wife was of the daughters of Aaron , and her name was Elisabeth.');
INSERT INTO verses VALUES (4200100006,42001,6,'و هر دو در حضور خدا صالح و به جمیع احکام و فرایض خداوند، بی‌عیب سالک بودند.','And they were both righteous before God, walking in all the commandments and ordinances of the Lord blameless.');
INSERT INTO verses VALUES (4200100007,42001,7,'و ایشان را فرزندی نبود زیرا که الیصابات نازاد بود و هر دو دیرینه سال بودند.','And they had no child, because that Elisabeth was barren, and they both were now well stricken in years.');
INSERT INTO verses VALUES (4200100008,42001,8,'و واقع شد که چون به نوبت فرقه خود در حضور خدا کهانت می‌کرد،','And it came to pass, that while he executed the priest''s office before God in the order of his course,');
INSERT INTO verses VALUES (4200100009,42001,9,'حسب عادت کهانت، نوبت او شد که به قدس خداوند درآمده، بخور بسوزاند.','According to the custom of the priest''s office, his lot was to burn incense when he went into the temple of the Lord.');
INSERT INTO verses VALUES (4200100010,42001,10,'و در وقت بخور، تمام جماعت قوم بیرون عبادت می‌کردند.','And the whole multitude of the people were praying without at the time of incense.');
INSERT INTO verses VALUES (4200100011,42001,11,'ناگاه فرشته خداوند به طرف راست مذبح بخور ایستاده، بر وی ظاهر گشت.','And there appeared unto him an angel of the Lord standing on the right side of the altar of incense.');
INSERT INTO verses VALUES (4200100012,42001,12,'چون زکرّیا او را دید، در حیرت افتاده، ترس بر او مستولی شد.','And when Zacharias saw him, he was troubled, and fear fell upon him.');
INSERT INTO verses VALUES (4200100013,42001,13,'فرشته بدو گفت، ای زکریّا ترسان مباش،زیرا که دعای تو مستجاب گردیده است و زوجهات الیصابات برای تو پسری خواهد زایید و او را یحیی خواهی نامید.','But the angel said unto him, Fear not, Zacharias : for thy prayer is heard; and thy wife Elisabeth shall bear thee a son, and thou shalt call his name John .');
INSERT INTO verses VALUES (4200100014,42001,14,'و تو را خوشی و شادی رخ خواهد نمود و بسیاری از ولادت او مسرور خواهند شد.','And thou shalt have joy and gladness; and many shall rejoice at his birth.');
INSERT INTO verses VALUES (4200100015,42001,15,'زیرا که در حضور خداوند بزرگ خواهد بود و شراب و مُسکری نخواهد نوشید و از شکم مادر خود، پر از روح‌القدس خواهد بود.','For he shall be great in the sight of the Lord, and shall drink neither wine nor strong drink; and he shall be filled with the Holy Ghost, even from his mother''s womb.');
INSERT INTO verses VALUES (4200100016,42001,16,'و بسیاری از بنی‌اسرائیل را به سوی خداوند خدای ایشان خواهد برگردانید.','And many of the children of Israel shall he turn to the Lord their God.');
INSERT INTO verses VALUES (4200100017,42001,17,'و او به روح و قوّت الیاس پیش روی وی خواهد خرامید، تا دلهای پدران را به طرف پسران و نافرمانان را به حکمت عادلان بگرداند تا قومی مستعّد برای خدا مهیّا سازد.','And he shall go before him in the spirit and power of Elias, to turn the hearts of the fathers to the children, and the disobedient to the wisdom of the just; to make ready a people prepared for the Lord.');
INSERT INTO verses VALUES (4200100018,42001,18,'زکریّا به فرشته گفت، این را چگونه بدانم و حال آنکه من پیر هستم و زوجهام دیرینه سال است؟','And Zacharias said unto the angel, Whereby shall I know this? for I am an old man, and my wife well stricken in years.');
INSERT INTO verses VALUES (4200100019,42001,19,'فرشته در جواب وی گفت، من جبرائیل هستم که در حضور خدا میایستم و فرستاده شدم تا به تو سخن گویم و از این امور تو را مژده دهم.','And the angel answering said unto him, I am Gabriel, that stand in the presence of God; and am sent to speak unto thee, and to shew thee these glad tidings.');
INSERT INTO verses VALUES (4200100020,42001,20,'و الحال تا این امور واقع نگردد، گنگ شده یارای حرف زدن نخواهی داشت، زیرا سخنهای مرا که در وقت خود به وقوع خواهد پیوست، باور نکردی.','And, behold, thou shalt be dumb, and not able to speak, until the day that these things shall be performed, because thou believest not my words, which shall be fulfilled in their season.');
INSERT INTO verses VALUES (4200100021,42001,21,'و جماعت منتظر زکریّا می‌بودند و از طول توقّف او در قدس متعجّب شدند.','And the people waited for Zacharias , and marvelled that he tarried so long in the temple.');
INSERT INTO verses VALUES (4200100022,42001,22,'امّا چون بیرون آمده نتوانست با ایشان حرف زند، پس فهمیدند که در قدس رؤیایی دیده است. پس به سوی ایشان اشاره می‌کرد وساکت ماند.','And when he came out, he could not speak unto them: and they perceived that he had seen a vision in the temple: for he beckoned unto them, and remained speechless.');
INSERT INTO verses VALUES (4200100023,42001,23,'و چون ایّام خدمت او به اتمام رسید، به خانه خود رفت.','And it came to pass, that, as soon as the days of his ministration were accomplished, he departed to his own house.');
INSERT INTO verses VALUES (4200100024,42001,24,'و بعد از آن روزها، زن او الیصابات حامله شده، مدّت پنج ماه خود را پنهان نمود و گفت،','And after those days his wife Elisabeth conceived, and hid herself five months, saying,');
INSERT INTO verses VALUES (4200100025,42001,25,'به اینطور خداوند به من عمل نمود در روزهایی که مرا منظور داشت، تا ننگ مرا از نظر مردم بردارد.','Thus hath the Lord dealt with me in the days wherein he looked on me, to take away my reproach among men.');
INSERT INTO verses VALUES (4200100026,42001,26,'و در ماه ششم جبرائیل فرشته از جانب خدا به بلدی از جلیل که ناصره نام داشت، فرستاده شد.','And in the sixth month the angel Gabriel was sent from God unto a city of Galilee , named Nazareth ,');
INSERT INTO verses VALUES (4200100027,42001,27,'نزد باکرهای نامزد مردی مسمّیٰ به یوسف از خاندان داود و نام آن باکره مریم بود.','To a virgin espoused to a man whose name was Joseph , of the house of David ; and the virgin''s name was Mary .');
INSERT INTO verses VALUES (4200100028,42001,28,'پس فرشته نزد او داخل شده، گفت، سلام بر تو ای نعمت رسیده، خداوند با توست و تو در میان زنان مبارک هستی.','And the angel came in unto her, and said, Hail, thou that art highly favoured, the Lord is with thee: blessed art thou among women.');
INSERT INTO verses VALUES (4200100029,42001,29,'چون او را دید، از سخن او مضطرب شده، متفکّر شد که این چه نوع تحیّت است.','And when she saw him, she was troubled at his saying, and cast in her mind what manner of salutation this should be.');
INSERT INTO verses VALUES (4200100030,42001,30,'فرشته بدو گفت، ای مریم ترسان مباش زیرا که نزد خدا نعمت یافته‌ای.','And the angel said unto her, Fear not, Mary : for thou hast found favour with God.');
INSERT INTO verses VALUES (4200100031,42001,31,'و اینک، حامله شده، پسری خواهی زایید و او را عیسی خواهی نامید.','And, behold, thou shalt conceive in thy womb, and bring forth a son, and shalt call his name JESUS.');
INSERT INTO verses VALUES (4200100032,42001,32,'او بزرگ خواهد بود و به پسر حضرت اعلیٰ، مسمّیٰ شود، و خداوند خدا تخت پدرش داود را بدو عطا خواهد فرمود.','He shall be great, and shall be called the Son of the Highest: and the Lord God shall give unto him the throne of his father David :');
INSERT INTO verses VALUES (4200100033,42001,33,'و او بر خاندان یعقوب تا به ابد پادشاهی خواهد کرد و سلطنت او را نهایت نخواهد بود.','And he shall reign over the house of Jacob for ever; and of his kingdom there shall be no end.');
INSERT INTO verses VALUES (4200100034,42001,34,'مریم به فرشته گفت، این چگونه می‌شود و حال آنکه مردی را نشناختهام؟','Then said Mary unto the angel, How shall this be, seeing I know not a man?');
INSERT INTO verses VALUES (4200100035,42001,35,'فرشته در جواب وی گفت، روح‌القدس بر تو خواهد آمد و قوّت حضرت اعلی بر تو سایه خواهد افکند، ازآن‌جهت آن مولود مقدّس، پسر خدا خوانده خواهد شد.','And the angel answered and said unto her, The Holy Ghost shall come upon thee, and the power of the Highest shall overshadow thee: therefore also that holy thing which shall be born of thee shall be called the Son of God.');
INSERT INTO verses VALUES (4200100036,42001,36,'و اینک، الیصابات از خویشان تو نیز در پیری به پسری حامله شده و این ماه ششم است، مر او را که نازاد می‌خواندند.','And, behold, thy cousin Elisabeth, she hath also conceived a son in her old age: and this is the sixth month with her, who was called barren.');
INSERT INTO verses VALUES (4200100037,42001,37,'زیرا نزد خدا هیچ امری محال نیست.','For with God nothing shall be impossible.');
INSERT INTO verses VALUES (4200100038,42001,38,'مریم گفت، اینک، کنیز خداوندم. مرا برحسب سخن تو واقع شود. پس فرشته از نزد او رفت.','And Mary said, Behold the handmaid of the Lord; be it unto me according to thy word. And the angel departed from her.');
INSERT INTO verses VALUES (4200100039,42001,39,'در آن روزها، مریم برخاست و به بلدی از کوهستان یهودیّه بشتاب رفت.','And Mary arose in those days, and went into the hill country with haste, into a city of Juda;');
INSERT INTO verses VALUES (4200100040,42001,40,'و به خانهٔ زکریّا درآمده، به الیصابات سلام کرد.','And entered into the house of Zacharias , and saluted Elisabeth.');
INSERT INTO verses VALUES (4200100041,42001,41,'و چون الیصابات سلام مریم را شنید، بچه در رَحم او به حرکت آمد و الیصابات به روح‌القدس پر شده،','And it came to pass, that, when Elisabeth heard the salutation of Mary , the babe leaped in her womb; and Elisabeth was filled with the Holy Ghost:');
INSERT INTO verses VALUES (4200100042,42001,42,'به آواز بلند صدا زده گفت، تو در میان زنان مبارک هستی و مبارک است ثمرهٔ رحم تو.','And she spake out with a loud voice, and said, Blessed art thou among women, and blessed is the fruit of thy womb.');
INSERT INTO verses VALUES (4200100043,42001,43,'و از کجا این به من رسید که مادرِ خداوندِ من، به نزد من آید؟','And whence is this to me, that the mother of my Lord should come to me?');
INSERT INTO verses VALUES (4200100044,42001,44,'زیرا اینک، چون آواز سلام تو گوش زدِ من شد، بچه از خوشی در رَحِم من به حرکت آمد.','For, lo, as soon as the voice of thy salutation sounded in mine ears, the babe leaped in my womb for joy.');
INSERT INTO verses VALUES (4200100045,42001,45,'و خوشابحال او که ایمان آوَرْد، زیرا که آنچه از جانب خداوند به وی گفته شد، به انجام خواهد رسید.','And blessed is she that believed: for there shall be a performance of those things which were told her from the Lord.');
INSERT INTO verses VALUES (4200100046,42001,46,'پس مریم گفت، جان من خداوند را تمجید می‌کند،','And Mary said, My soul doth magnify the Lord,');
INSERT INTO verses VALUES (4200100047,42001,47,'و روح من به رهاننده من خدا بوجد آمد،','And my spirit hath rejoiced in God my Saviour.');
INSERT INTO verses VALUES (4200100048,42001,48,'زیرا بر حقارتِ کنیزِ خود نظر افکند. زیرا هان از کنون تمامی طبقات مرا خوشحال خواهند خواند،','For he hath regarded the low estate of his handmaiden: for, behold, from henceforth all generations shall call me blessed.');
INSERT INTO verses VALUES (4200100049,42001,49,'زیرا آن قادر، به من کارهای عظیم کرده و نام او قدّوس است،','For he that is mighty hath done to me great things; and holy is his name.');
INSERT INTO verses VALUES (4200100050,42001,50,'و رحمت او نسلاً بعد نسل است بر آنانی که از اومی‌ترسند.','And his mercy is on them that fear him from generation to generation.');
INSERT INTO verses VALUES (4200100051,42001,51,'به بازوی خود، قدرت را ظاهر فرمود و متکبّران را به خیال دل ایشان پراکنده ساخت.','He hath shewed strength with his arm; he hath scattered the proud in the imagination of their hearts.');
INSERT INTO verses VALUES (4200100052,42001,52,'جبّاران را از تختها به زیر افکند و فروتنان را سرافراز گردانید.','He hath put down the mighty from their seats, and exalted them of low degree.');
INSERT INTO verses VALUES (4200100053,42001,53,'گرسنگان را به چیزهای نیکو سیر فرمود و دولتمندان را تهیدست ردّ نمود.','He hath filled the hungry with good things; and the rich he hath sent empty away.');
INSERT INTO verses VALUES (4200100054,42001,54,'بندهٔ خود اسرائیل را یاری کرد، به یادگاری رحمانیّت خویش،','He hath holpen his servant Israel , in remembrance of his mercy;');
INSERT INTO verses VALUES (4200100055,42001,55,'چنانکه به اجداد ما گفته بود، به ابراهیم و به ذریّت او تا ابدالآباد.','As he spake to our fathers, to Abraham , and to his seed for ever.');
INSERT INTO verses VALUES (4200100056,42001,56,'و مریم قریب به سه ماه نزد وی ماند، پس به خانهٔ خود مراجعت کرد.','And Mary abode with her about three months, and returned to her own house.');
INSERT INTO verses VALUES (4200100057,42001,57,'امّا چون الیصابات را وقت وضع حمل رسید، پسری بزاد.','Now Elisabeth''s full time came that she should be delivered; and she brought forth a son.');
INSERT INTO verses VALUES (4200100058,42001,58,'و همسایگان و خویشان او چون شنیدند که خداوند رحمت عظیمی بر وی کرده، با او شادی کردند.','And her neighbours and her cousins heard how the Lord had shewed great mercy upon her; and they rejoiced with her.');
INSERT INTO verses VALUES (4200100059,42001,59,'و واقع شد در روز هشتم چون برای ختنه طفل آمدند، که نام پدرش زکریّا را بر او می‌نهادند.','And it came to pass, that on the eighth day they came to circumcise the child; and they called him Zacharias , after the name of his father.');
INSERT INTO verses VALUES (4200100060,42001,60,'امّا مادرش ملتفت شده، گفت، نی بلکه به یحیی نامیده می‌شود.','And his mother answered and said, Not so; but he shall be called John .');
INSERT INTO verses VALUES (4200100061,42001,61,'به وی گفتند، از قبیله تو هیچ‌کس این اسم را ندارد.','And they said unto her, There is none of thy kindred that is called by this name.');
INSERT INTO verses VALUES (4200100062,42001,62,'پس به پدرش اشاره کردند که او را چه نام خواهی نهاد؟','And they made signs to his father, how he would have him called.');
INSERT INTO verses VALUES (4200100063,42001,63,'او تختهای خواسته بنوشت که نام او یحیی است و همه متعجب شدند.','And he asked for a writing table, and wrote, saying, His name is John . And they marvelled all.');
INSERT INTO verses VALUES (4200100064,42001,64,'در ساعت، دهان و زبان او باز گشته، به حمد خدا متکلّم شد.','And his mouth was opened immediately, and his tongue loosed, and he spake, and praised God.');
INSERT INTO verses VALUES (4200100065,42001,65,'پس بر تمامی همسایگان ایشان، خوف مستولی گشت و جمیع این وقایع در همهٔ کوهستان یهودیّه شهرت یافت.','And fear came on all that dwelt round about them: and all these sayings were noised abroad throughout all the hill country of Judæa .');
INSERT INTO verses VALUES (4200100066,42001,66,'و هر که شنید، در خاطر خود تفکّر نموده، گفت، این چه نوع طفل خواهد بود؟ و دست خداوند با ویمی‌بود.','And all they that heard them laid them up in their hearts, saying, What manner of child shall this be! And the hand of the Lord was with him.');
INSERT INTO verses VALUES (4200100067,42001,67,'و پدرش زکریّا از روح‌القدس پر شده، نبوّت نموده، گفت،','And his father Zacharias was filled with the Holy Ghost, and prophesied, saying,');
INSERT INTO verses VALUES (4200100068,42001,68,'خداوند خدای اسرائیل متبارک باد، زیرا از قوم خود تفقّد نموده، برای ایشان فدایی قرار داد','Blessed be the Lord God of Israel ; for he hath visited and redeemed his people,');
INSERT INTO verses VALUES (4200100069,42001,69,'و شاخ نجاتی برای ما برافراشت، در خانهٔ بندهٔ خود داود.','And hath raised up an horn of salvation for us in the house of his servant David ;');
INSERT INTO verses VALUES (4200100070,42001,70,'چنانچه به زبان مقدّسین گفت که، از بدوِ عالم انبیای او می‌بودند،','As he spake by the mouth of his holy prophets, which have been since the world began:');
INSERT INTO verses VALUES (4200100071,42001,71,'رهایی از دشمنان ما و از دست آنانی که از ما نفرت دارند،','That we should be saved from our enemies, and from the hand of all that hate us;');
INSERT INTO verses VALUES (4200100072,42001,72,'تا رحمت را بر پدران ما بجا آرد و عهد مقدّس خود را تذکّر فرماید،','To perform the mercy promised to our fathers, and to remember his holy covenant;');
INSERT INTO verses VALUES (4200100073,42001,73,'سوگندی که برای پدر ما ابراهیم یاد کرد،','The oath which he sware to our father Abraham ,');
INSERT INTO verses VALUES (4200100074,42001,74,'که ما را فیض عطا فرماید، تا از دست دشمنان خود رهایی یافته، او را بیخوف عبادت کنیم،','That he would grant unto us, that we being delivered out of the hand of our enemies might serve him without fear,');
INSERT INTO verses VALUES (4200100075,42001,75,'در حضور او به قدّوسیّت و عدالت، در تمامی روزهای عمر خود.','In holiness and righteousness before him, all the days of our life.');
INSERT INTO verses VALUES (4200100076,42001,76,'و تو ای طفل، نبیحضرت اعلیٰ خوانده خواهی شد، زیرا پیش روی خداوند خواهی خرامید، تا طرق او را مهیّا سازی،','And thou, child, shalt be called the prophet of the Highest: for thou shalt go before the face of the Lord to prepare his ways;');
INSERT INTO verses VALUES (4200100077,42001,77,'تا قوم او را معرفت نجات دهی، در آمرزش گناهان ایشان.','To give knowledge of salvation unto his people by the remission of their sins,');
INSERT INTO verses VALUES (4200100078,42001,78,'به احشای رحمت خدای ما که به آن سپیده از عالم اعلی از ما تفقد نمود،','Through the tender mercy of our God; whereby the dayspring from on high hath visited us,');
INSERT INTO verses VALUES (4200100079,42001,79,'تا ساکنان در ظلمت و ظّل موت را نور دهد و پایهای ما را به طریق سلامتی هدایت نماید.','To give light to them that sit in darkness and in the shadow of death, to guide our feet into the way of peace.');
INSERT INTO verses VALUES (4200100080,42001,80,'پس طفل نمّو کرده، در روح قوّی می‌گشت و تا روز ظهور خود برای اسرائیل، در بیابان بسر می‌برد.','And the child grew, and waxed strong in spirit, and was in the deserts till the day of his shewing unto Israel .');
id INTEGER PRIMARY KEY,
book_id INTEGER NOT NULL,
chapter_number INTEGER NOT NULL,
audio_local TEXT,
audio_online_fa TEXT,
audio_online_en TEXT
);
id INTEGER PRIMARY KEY,
chapter_id INTEGER NOT NULL,
verse_number INTEGER NOT NULL,
text_fa TEXT,
text_en TEXT
);
INSERT INTO chapters VALUES (43001,43,1,NULL,'http://audio1.wordfree.net/bibles/app/audio/20/43/1.mp3','http://audio1.wordfree.net/bibles/app/audio/20/43/1.mp3');
INSERT INTO verses VALUES (4300100001,43001,1,'span class="verse" id="1">1 </span در ابتدا کلمه بود و کلمه نزد خدا بود و کلمه خدا بود.','span class="verse" id="1">1 </span In the beginning was the Word, and the Word was with God, and the Word was God.');
INSERT INTO verses VALUES (4300100002,43001,2,'همان در ابتدا نزد خدا بود.','The same was in the beginning with God.');
INSERT INTO verses VALUES (4300100003,43001,3,'همه‌چیز به‌واسطهٔ او آفریده شد و به غیر از او چیزی از موجودات وجود نیافت.','All things were made by him; and without him was not any thing made that was made.');
INSERT INTO verses VALUES (4300100004,43001,4,'در او حیات بود و حیات نور انسان بود.','In him was life; and the life was the light of men.');
INSERT INTO verses VALUES (4300100005,43001,5,'و نور در تاریکی می‌درخشد و تاریکی آن را درنیافت.','And the light shineth in darkness; and the darkness comprehended it not.');
INSERT INTO verses VALUES (4300100006,43001,6,'شخصی از جانب خدا فرستاده شد که اسمش یحیی بود؛','There was a man sent from God, whose name was John .');
INSERT INTO verses VALUES (4300100007,43001,7,'او برای شهادت آمد تا بر نور شهادت دهد تا همه به‌وسیلهٔ او ایمان آورند.','The same came for a witness, to bear witness of the Light, that all men through him might believe.');
INSERT INTO verses VALUES (4300100008,43001,8,'او آن نور نبود بلکه آمد تا بر نور شهادت دهد.','He was not that Light, but was sent to bear witness of that Light.');
INSERT INTO verses VALUES (4300100009,43001,9,'آن نورِ حقیقی بود که هر انسان را منوّر می‌گرداند و در جهان آمدنی بود.','That was the true Light, which lighteth every man that cometh into the world.');
INSERT INTO verses VALUES (4300100010,43001,10,'او در جهان بود و جهان به‌واسطهٔ او آفریده شد و جهان او را نشناخت.','He was in the world, and the world was made by him, and the world knew him not.');
INSERT INTO verses VALUES (4300100011,43001,11,'به نزد خاصّان خود آمد و خاصّانش او را نپذیرفتند؛','He came unto his own, and his own received him not.');
INSERT INTO verses VALUES (4300100012,43001,12,'و امّا به آن کسانی که او را قبول کردند قدرت داد تا فرزندان خدا گردند، یعنی به هر که به اسم او ایمان آورد،','But as many as received him, to them gave he power to become the sons of God, even to them that believe on his name:');
INSERT INTO verses VALUES (4300100013,43001,13,'که نه از خون و نه از خواهش جسد و نه از خواهش مردم، بلکه از خدا تولّد یافتند.','Which were born, not of blood, nor of the will of the flesh, nor of the will of man, but of God.');
INSERT INTO verses VALUES (4300100014,43001,14,'و کلمه جسم گردید و میان ما ساکن شد، پُر از فیض و راستی؛ و جلال او را دیدیم، جلالی شایستهٔ پسر یگانهٔ پدر.','And the Word was made flesh, and dwelt among us, (and we beheld his glory, the glory as of the only begotten of the Father,) full of grace and truth.');
INSERT INTO verses VALUES (4300100015,43001,15,'و یحیی بر او شهادت داد و ندا کرده، می‌گفت، این است آنکه دربارهٔ او گفتم آنکه بعد از من می‌آید، پیش از من شده است زیرا که بر من مقدّم بود.','John bare witness of him, and cried, saying, This was he of whom I spake, He that cometh after me is preferred before me: for he was before me.');
INSERT INTO verses VALUES (4300100016,43001,16,'و از پُری او جمیع ما بهره یافتیم و فیض به عوض فیض،','And of his fulness have all we received, and grace for grace.');
INSERT INTO verses VALUES (4300100017,43001,17,'زیرا شریعت به‌وسیلهٔ موسی عطا شد، امّا فیض و راستی به‌وسیلهٔ عیسی مسیح رسید.','For the law was given by Moses , but grace and truth came by Jesus Christ .');
INSERT INTO verses VALUES (4300100018,43001,18,'خدا را هرگز کسی ندیده است؛ پسر یگانه‌ای که در آغوش پدر است، همان او را ظاهر کرد.','No man hath seen God at any time; the only begotten Son, which is in the bosom of the Father, he hath declared him.');
INSERT INTO verses VALUES (4300100019,43001,19,'و این است شهادت یحیی در وقتی که یهودیان از اورشلیم کاهنان و لاویان را فرستادند تا از او سؤال کنند که تو کیستی؛','And this is the record of John , when the Jews sent priests and Levites from Jerusalem to ask him, Who art thou?');
INSERT INTO verses VALUES (4300100020,43001,20,'که معترف شد و انکار ننمود، بلکه اقرار کرد که من مسیح نیستم.','And he confessed, and denied not; but confessed, I am not the Christ .');
INSERT INTO verses VALUES (4300100021,43001,21,'آنگاه از او سؤال کردند، پس چه؟ آیا تو الیاس هستی؟ گفت، نیستم. آیا تو آن نبی هستی؟ جواب داد که نی.','And they asked him, What then? Art thou Elias? And he saith, I am not. Art thou that prophet? And he answered, No.');
INSERT INTO verses VALUES (4300100022,43001,22,'آنگاه بدو گفتند، پس کیستی تا به آن کسانی که ما را فرستادند جواب بریم؟ دربارهٔ خود چه می‌گویی؟','Then said they unto him, Who art thou? that we may give an answer to them that sent us. What sayest thou of thyself?');
INSERT INTO verses VALUES (4300100023,43001,23,'گفت، من صدای ندا کننده‌ای در بیابانم که راه خداوند را راست کنید، چنانکه اشعیا نبی گفت.','He said, I am the voice of one crying in the wilderness, Make straight the way of the Lord, as said the prophet Esaias.');
INSERT INTO verses VALUES (4300100024,43001,24,'و فرستادگان از فریسیان بودند.','And they which were sent were of the Pharisees.');
INSERT INTO verses VALUES (4300100025,43001,25,'پس از او سؤال کرده، گفتند، اگر تو مسیح و الیاس و آن نبی نیستی، پس برای چه تعمید می‌دهی؟','And they asked him, and said unto him, Why baptizest thou then, if thou be not that Christ , nor Elias, neither that prophet?');
INSERT INTO verses VALUES (4300100026,43001,26,'یحیی در جواب ایشان گفت، من به آب تعمید می‌دهم و در میان شما کسی ایستاده است که شما او را نمی‌شناسید.','John answered them, saying, I baptize with water: but there standeth one among you, whom ye know not;');
INSERT INTO verses VALUES (4300100027,43001,27,'و او آن است که بعد از من می‌آید، امّا پیش از من شده است، که من لایق آن نیستم که بند نعلینش را باز کنم.','He it is, who coming after me is preferred before me, whose shoe''s latchet I am not worthy to unloose.');
INSERT INTO verses VALUES (4300100028,43001,28,'و این در بیت‌عَبَرَه که آن طرف اُرْدُن است، در جایی که یحیی تعمید می‌داد واقع گشت.','These things were done in Bethabara beyond Jordan , where John was baptizing.');
INSERT INTO verses VALUES (4300100029,43001,29,'و در فردای آن روز یحیی عیسی را دید که به جانب او می‌آید. پس گفت، اینک، برّه خدا که گناه جهان را برمی‌دارد!','The next day John seeth Jesus coming unto him, and saith, Behold the Lamb of God, which taketh away the sin of the world.');
INSERT INTO verses VALUES (4300100030,43001,30,'این است آنکه من دربارهٔ او گفتم که مردی بعد از من می‌آید که پیش از من شده است زیرا که بر من مقدّم بود.','This is he of whom I said, After me cometh a man which is preferred before me: for he was before me.');
INSERT INTO verses VALUES (4300100031,43001,31,'و من او را نشناختم، لیکن تا او به اسرائیل ظاهر گردد، برای همین من آمده به آب تعمید می‌دادم.','And I knew him not: but that he should be made manifest to Israel , therefore am I come baptizing with water.');
INSERT INTO verses VALUES (4300100032,43001,32,'پس یحیی شهادت داده، گفت، روح را دیدم که مثل کبوتری از آسمان نازل شده، بر او قرار گرفت.','And John bare record, saying, I saw the Spirit descending from heaven like a dove, and it abode upon him.');
INSERT INTO verses VALUES (4300100033,43001,33,'و من او را نشناختم، لیکن او که مرا فرستاد تا به آب تعمید دهم، همان به من گفت بر هر کس بینی که روح نازل شده، بر او قرار گرفت، همان است او که به روح‌القدس تعمید می‌دهد.','And I knew him not: but he that sent me to baptize with water, the same said unto me, Upon whom thou shalt see the Spirit descending, and remaining on him, the same is he which baptizeth with the Holy Ghost.');
INSERT INTO verses VALUES (4300100034,43001,34,'و من دیده شهادت می‌دهم که این است پسر خدا.','And I saw, and bare record that this is the Son of God.');
INSERT INTO verses VALUES (4300100035,43001,35,'و در روز بعد نیز یحیی با دو نفر از شاگردان خود ایستاده بود.','Again the next day after John stood, and two of his disciples;');
INSERT INTO verses VALUES (4300100036,43001,36,'ناگاه عیسی را دید که راه می‌رود؛ و گفت، اینک، برّهٔ خدا.','And looking upon Jesus as he walked, he saith, Behold the Lamb of God!');
INSERT INTO verses VALUES (4300100037,43001,37,'و چون آن دو شاگرد کلام او را شنیدند، از پی عیسی روانه شدند.','And the two disciples heard him speak, and they followed Jesus .');
INSERT INTO verses VALUES (4300100038,43001,38,'پس عیسی روی گردانیده، آن دو نفر را دید که از عقب می‌آیند. بدیشان گفت،','Then Jesus turned, and saw them following, and saith unto them, What seek ye? They said unto him, Rabbi, (which is to say, being interpreted, Master,) where dwellest thou?');
INSERT INTO verses VALUES (4300100039,43001,39,'چه می‌خواهید؟ بدو گفتند، ربّی (یعنی ای معلّم) در کجا منزل می‌نمایی؟','He saith unto them, Come and see. They came and saw where he dwelt, and abode with him that day: for it was about the tenth hour.');
INSERT INTO verses VALUES (4300100040,43001,40,'بدیشان گفت، بیایید و ببینید. آنگاه آمده، دیدند که کجا منزل دارد، و آن روز را نزد او بماندند و قریب به ساعت دهم بود.','One of the two which heard John speak, and followed him, was Andrew , Simon Peter ''s brother.');
INSERT INTO verses VALUES (4300100041,43001,41,'و یکی از آن دو که سخن یحیی را شنیده، پیروی او نمودند، اندریاس برادر شمعون پطرس بود.','He first findeth his own brother Simon , and saith unto him, We have found the Messias, which is, being interpreted, the Christ .');
INSERT INTO verses VALUES (4300100042,43001,42,'او اوّل برادر خود شمعون را یافته، به او گفت، مسیح را (که ترجمهٔ آن کَرِسْتُس است) یافتیم. و چون او را نزد عیسی آورد، عیسی بدو نگریسته، گفت، تو شمعون پسر یونا هستی؛ و اکنون کیفا خوانده خواهی شد (که ترجمهٔ آن پطرس است).','And he brought him to Jesus . And when Jesus beheld him, he said, Thou art Simon the son of Jona: thou shalt be called Cephas, which is by interpretation, A stone.');
INSERT INTO verses VALUES (4300100043,43001,43,'بامدادان چون عیسی خواست به سوی جلیل روانه شود، فیلپُس را یافته، بدو گفت، از عقب من بیا.','The day following Jesus would go forth into Galilee , and findeth Philip , and saith unto him, Follow me.');
INSERT INTO verses VALUES (4300100044,43001,44,'و فیلپُس از بیت صیدا از شهر اندریاس و پطرس بود.','Now Philip was of Bethsaida , the city of Andrew and Peter .');
INSERT INTO verses VALUES (4300100045,43001,45,'فیلپس نَتَنائیل را یافته، بدو گفت، آن کسی را که موسی در تورات و انبیا مذکور داشته‌اند، یافته‌ایم که عیسی پسر یوسف ناصری است.','Philip findeth Nathanael, and saith unto him, We have found him, of whom Moses in the law, and the prophets, did write, Jesus of Nazareth , the son of Joseph .');
INSERT INTO verses VALUES (4300100046,43001,46,'نتنائیل بدو گفت، مگر می‌شود که از ناصره چیزی خوب پیدا شود؟ فیلپس بدو گفت، بیا و ببین.','And Nathanael said unto him, Can there any good thing come out of Nazareth ? Philip saith unto him, Come and see.');
INSERT INTO verses VALUES (4300100047,43001,47,'و عیسی چون دید که نتنائیل به سوی او می‌آید، دربارهٔ او گفت، اینک، اسرائیلی حقیقی که در او مکری نیست.','Jesus saw Nathanael coming to him, and saith of him, Behold an Israelite indeed, in whom is no guile!');
INSERT INTO verses VALUES (4300100048,43001,48,'نتنائیل بدو گفت، مرا از کجا می‌شناسی؟ عیسی در جواب وی گفت، قبل از آنکه فیلپس تو را دعوت کند، در حینی که زیر درخت انجیر بودی تو را دیدم.','Nathanael saith unto him, Whence knowest thou me? Jesus answered and said unto him, Before that Philip called thee, when thou wast under the fig tree, I saw thee.');
INSERT INTO verses VALUES (4300100049,43001,49,'نتنائیل در جواب او گفت، ای استاد تو پسر خدایی! تو پادشاه اسرائیل هستی!','Nathanael answered and saith unto him, Rabbi, thou art the Son of God; thou art the King of Israel .');
INSERT INTO verses VALUES (4300100050,43001,50,'عیسی در جواب او گفت، آیا از اینکه به تو گفتم که تو را زیر درخت انجیر دیدم، ایمان آوردی؟ بعد از این چیزهای بزرگتر از این خواهی دید.','Jesus answered and said unto him, Because I said unto thee, I saw thee under the fig tree, believest thou? thou shalt see greater things than these.');
INSERT INTO verses VALUES (4300100051,43001,51,'پس بدو گفت، آمین آمین به شما می‌گویم که از کنون آسمان را گشاده، و فرشتگان خدا را که بر پسر انسان صعود و نزول می‌کنند خواهید دید.','And he saith unto him, Verily, verily, I say unto you, Hereafter ye shall see heaven open, and the angels of God ascending and descending upon the Son of man .');
id INTEGER PRIMARY KEY,
book_id INTEGER NOT NULL,
chapter_number INTEGER NOT NULL,
audio_local TEXT,
audio_online_fa TEXT,
audio_online_en TEXT
);
id INTEGER PRIMARY KEY,
chapter_id INTEGER NOT NULL,
verse_number INTEGER NOT NULL,
text_fa TEXT,
text_en TEXT
);
INSERT INTO chapters VALUES (44001,44,1,NULL,'http://audio1.wordfree.net/bibles/app/audio/20/44/1.mp3','http://audio1.wordfree.net/bibles/app/audio/20/44/1.mp3');
INSERT INTO verses VALUES (4400100001,44001,1,'span class="verse" id="1">1 </span صحیفه اوّل را انشا نمودم، ای تیؤفِلُس،دربارهٔ همهٔ اموری که عیسی به عمل نمودن و تعلیم دادن آنها شروع کرد.','span class="verse" id="1">1 </span The former treatise have I made, O Theophilus, of all that Jesus began both to do and teach,');
INSERT INTO verses VALUES (4400100002,44001,2,'تا آن روزی که رسولان برگزیده خود را به روح‌القدس حکم کرده، بالا برده شد.','Until the day in which he was taken up, after that he through the Holy Ghost had given commandments unto the apostles whom he had chosen:');
INSERT INTO verses VALUES (4400100003,44001,3,'که بدیشان نیز بعد از زحمت کشیدن خود، خویشتن را زنده ظاهر کرد به دلیلهای بسیار که در مدّت چهل روز بر ایشان ظاهر می‌شد و دربارهٔ امور ملکوت خدا سخن می‌گفت.','To whom also he shewed himself alive after his passion by many infallible proofs, being seen of them forty days, and speaking of the things pertaining to the kingdom of God:');
INSERT INTO verses VALUES (4400100004,44001,4,'و چون با ایشان جمع شد، ایشان را قدغن فرمود که از اورشلیم جدا مشوید، بلکه منتظر آن وعدهٔ پدر باشید که از من شنیده‌اید.','And, being assembled together with them, commanded them that they should not depart from Jerusalem , but wait for the promise of the Father, which, saith he, ye have heard of me.');
INSERT INTO verses VALUES (4400100005,44001,5,'زیرا که یحیی به آب تعمید می‌داد، لیکن شما بعد از اندک ایّامی، به روح‌القدس تعمید خواهید یافت.','For John truly baptized with water; but ye shall be baptized with the Holy Ghost not many days hence.');
INSERT INTO verses VALUES (4400100006,44001,6,'پس آنانی که جمع بودند، از او سؤال نموده، گفتند، خداوندا آیا در این وقت ملکوت را بر اسرائیل باز برقرار خواهی داشت؟','When they therefore were come together, they asked of him, saying, Lord, wilt thou at this time restore again the kingdom to Israel ?');
INSERT INTO verses VALUES (4400100007,44001,7,'بدیشان گفت، از شما نیست که زمانها و اوقاتی را که پدر در قدرت خود نگاه داشته است بدانید.','And he said unto them, It is not for you to know the times or the seasons, which the Father hath put in his own power.');
INSERT INTO verses VALUES (4400100008,44001,8,'لیکن چون روح‌القدس بر شما می‌آید، قوّت خواهید یافت و شاهدان من خواهید بود، در اورشلیم و تمامی یهودیّه و سامره و تا اقصای جهان.','But ye shall receive power, after that the Holy Ghost is come upon you: and ye shall be witnesses unto me both in Jerusalem , and in all Judaea , and in Samaria , and unto the uttermost part of the earth.');
INSERT INTO verses VALUES (4400100009,44001,9,'و چون این را گفت، وقتی که ایشان همی نگریستند، بالا برده شد و ابری او را از چشمانایشان در ربود.','And when he had spoken these things, while they beheld, he was taken up; and a cloud received him out of their sight.');
INSERT INTO verses VALUES (4400100010,44001,10,'و چون به سوی آسمان چشم دوخته می‌بودند، هنگامی که او می‌رفت، ناگاه دو مرد سفیدپوش نزد ایشان ایستاده،','And while they looked stedfastly toward heaven as he went up, behold, two men stood by them in white apparel;');
INSERT INTO verses VALUES (4400100011,44001,11,'گفتند، ای مردان جلیلی چرا ایستاده، به سوی آسمان نگرانید؟ همین عیسی که از نزد شما به آسمان بالا برده شد، باز خواهد آمد به همین طوری که او را به سوی آسمان روانه دیدید.','Which also said, Ye men of Galilee , why stand ye gazing up into heaven? this same Jesus , which is taken up from you into heaven, shall so come in like manner as ye have seen him go into heaven.');
INSERT INTO verses VALUES (4400100012,44001,12,'آنگاه به اورشلیم مراجعت کردند، از کوه مسمّی به زیتون که نزدیک به اورشلیم به مسافت سفر یک روز سَبَّت است.','Then returned they unto Jerusalem from the mount called Olivet, which is from Jerusalem a sabbath day''s journey.');
INSERT INTO verses VALUES (4400100013,44001,13,'و چون داخل شدند، به بالاخانهای برآمدند که در آنجا پطرس و یوحنّا و یعقوب و اَندرِیاس و فیلپُّس و توما و بَرْتولما و متّی و یعقوب بن حلفی و شمعوْنِ غیور و یهودای برادر یعقوب مقیم بودند.','And when they were come in, they went up into an upper room, where abode both Peter , and James , and John , and Andrew , Philip , and Thomas , Bartholomew , and Matthew , James the son of Alphaeus , and Simon Zelotes, and Judas the brother of James .');
INSERT INTO verses VALUES (4400100014,44001,14,'و جمیع اینها با زنان و مریم مادر عیسی و برادران او به یکدل در عبادت و دعا مواظب می‌بودند.','These all continued with one accord in prayer and supplication, with the women, and Mary the mother of Jesus , and with his brethren.');
INSERT INTO verses VALUES (4400100015,44001,15,'و در آن ایّام، پطرس در میان برادران که عدد اسامی ایشان جملهًٔ قریب به صد و بیست بود برخاسته، گفت،','And in those days Peter stood up in the midst of the disciples, and said, (the number of names together were about an hundred and twenty,)');
INSERT INTO verses VALUES (4400100016,44001,16,'ای برادران، می‌بایست آن نوشته تمام شود که روح‌القدس از زبان داود پیش گفت دربارهٔ یهودا که راهنما شد برای آنانی که عیسی را گرفتند.','Men and brethren, this scripture must needs have been fulfilled, which the Holy Ghost by the mouth of David spake before concerning Judas , which was guide to them that took Jesus .');
INSERT INTO verses VALUES (4400100017,44001,17,'که او با ما محسوب شده، نصیبی در این خدمت یافت.','For he was numbered with us, and had obtained part of this ministry.');
INSERT INTO verses VALUES (4400100018,44001,18,'پس او از اجرتظلمِ خود، زمینی خریده، به روی درافتاده، از میان پاره شد و تمامی امعایش ریخته گشت.','Now this man purchased a field with the reward of iniquity; and falling headlong, he burst asunder in the midst, and all his bowels gushed out.');
INSERT INTO verses VALUES (4400100019,44001,19,'و بر تمام سکنه اورشلیم معلوم گردید چنانکه آن زمین در لغت ایشان به حقل دما، یعنی زمین خون نامیده شد.','And it was known unto all the dwellers at Jerusalem ; insomuch as that field is called in their proper tongue, Aceldama, that is to say, The field of blood.');
INSERT INTO verses VALUES (4400100020,44001,20,'زیرا در کتاب زبور مکتوب است که خانهٔ او خراب بشود و هیچ‌کس در آن مسکن نگیرد و نظارتش را دیگری ضبط نماید.','For it is written in the book of Psalms, Let his habitation be desolate, and let no man dwell therein: and his bishoprick let another take.');
INSERT INTO verses VALUES (4400100021,44001,21,'الحال می‌باید از آن مردمانی که همراهان ما بودند، در تمام آن مدّتی که عیسی خداوند با ما آمد و رفت می‌کرد،','Wherefore of these men which have companied with us all the time that the Lord Jesus went in and out among us,');
INSERT INTO verses VALUES (4400100022,44001,22,'از زمان تعمید یحیی، تا روزی که از نزد ما بالا برده شد، یکی از ایشان با ما شاهدِ برخاستن او بشود.','Beginning from the baptism of John , unto that same day that he was taken up from us, must one be ordained to be a witness with us of his resurrection.');
INSERT INTO verses VALUES (4400100023,44001,23,'آنگاه دو نفر، یعنی یوسف مسمّیٰ به بَرسَبا که به یوُستُس ملقّب بود و مَتِیاس را برپا داشتند،','And they appointed two, Joseph called Barsabas, who was surnamed Justus, and Matthias.');
INSERT INTO verses VALUES (4400100024,44001,24,'و دعا کرده، گفتند، تو ای خداوند که عارف قلوب همه هستی، بنما کدام یک از این دو را برگزیده‌ای','And they prayed, and said, Thou, Lord, which knowest the hearts of all men, shew whether of these two thou hast chosen,');
INSERT INTO verses VALUES (4400100025,44001,25,'تا قسمت این خدمت و رسالت را بیابد که یهودا از آن باز افتاده، به مکان خود پیوست.','That he may take part of this ministry and apostleship, from which Judas by transgression fell, that he might go to his own place.');
INSERT INTO verses VALUES (4400100026,44001,26,'پس قرعه به نام ایشان افکندند و قرعه به نام مَتِّیاس برآمد و او با یازده رسول محسوب گشت.','And they gave forth their lots; and the lot fell upon Matthias; and he was numbered with the eleven apostles.');
id INTEGER PRIMARY KEY,
book_id INTEGER NOT NULL,
chapter_number INTEGER NOT NULL,
audio_local TEXT,
audio_online_fa TEXT,
audio_online_en TEXT
);
id INTEGER PRIMARY KEY,
chapter_id INTEGER NOT NULL,
verse_number INTEGER NOT NULL,
text_fa TEXT,
text_en TEXT
);
INSERT INTO chapters VALUES (45001,45,1,NULL,'http://audio1.wordfree.net/bibles/app/audio/20/45/1.mp3','http://audio1.wordfree.net/bibles/app/audio/20/45/1.mp3');
INSERT INTO verses VALUES (4500100001,45001,1,'span class="verse" id="1">1 </span پولُس، غلام عیسی مسیح و رسول خوانده شده و جدا نموده شده برای انجیل خدا،','span class="verse" id="1">1 </span Paul , a servant of Jesus Christ , called to be an apostle, separated unto the gospel of God,');
INSERT INTO verses VALUES (4500100002,45001,2,'که سابقاً وعدهٔ آن را داده بود به وساطت انبیای خود در کتب مقدّسه،','(Which he had promised afore by his prophets in the holy scriptures,)');
INSERT INTO verses VALUES (4500100003,45001,3,'دربارهٔ پسر خود که بحسب جسم از نسل داود متولّد شد،','Concerning his Son Jesus Christ our Lord, which was made of the seed of David according to the flesh;');
INSERT INTO verses VALUES (4500100004,45001,4,'و بحسب روح قدّوسیّت، پسر خدا به قوّت معروف گردید از قیامت مردگان، یعنی خداوند ما عیسی مسیح،','And declared to be the Son of God with power, according to the spirit of holiness, by the resurrection from the dead:');
INSERT INTO verses VALUES (4500100005,45001,5,'که به او فیض و رسالت را یافتیم برای اطاعت ایمان در جمیع امّت‌ها به‌خاطر اسم او،','By whom we have received grace and apostleship, for obedience to the faith among all nations, for his name:');
INSERT INTO verses VALUES (4500100006,45001,6,'که در میان ایشان شما نیز خوانده شده عیسی مسیح هستید،','Among whom are ye also the called of Jesus Christ :');
INSERT INTO verses VALUES (4500100007,45001,7,'به همه که در روم محبوب خدا و خوانده شده و مقدّسید، فیض و سلامتی از جانب پدر ما خدا و عیسی مسیح خداوند بر شما باد.','To all that be in Rome, beloved of God, called to be saints: Grace to you and peace from God our Father, and the Lord Jesus Christ .');
INSERT INTO verses VALUES (4500100008,45001,8,'اوّل شکر می‌کنم خدای خود را به وساطت عیسی مسیح دربارهٔ همگی شما که ایمان شما در تمام عالم شهرت یافته است؛','First, I thank my God through Jesus Christ for you all, that your faith is spoken of throughout the whole world.');
INSERT INTO verses VALUES (4500100009,45001,9,'زیرا خدایی که او را به روح خود در انجیل پسرش خدمت می‌کنم، مرا شاهد است که چگونه پیوسته شما را یاد می‌کنم،','For God is my witness, whom I serve with my spirit in the gospel of his Son, that without ceasing I make mention of you always in my prayers;');
INSERT INTO verses VALUES (4500100010,45001,10,'و دائماً در دعاهای خود مسألت می‌کنم که شاید الآن آخر به ارادهٔ خدا سعادت یافته، نزد شما بیایم.','Making request, if by any means now at length I might have a prosperous journey by the will of God to come unto you.');
INSERT INTO verses VALUES (4500100011,45001,11,'زیرا بسیار اشتیاق دارم که شما را ببینم تا نعمتی روحانی به شما برسانم که شما استوار بگردید،','For I long to see you, that I may impart unto you some spiritual gift, to the end ye may be established;');
INSERT INTO verses VALUES (4500100012,45001,12,'یعنی تا در میان شما تسلّی یابیم از ایمان یکدیگر، ایمان من و ایمان شما.','That is, that I may be comforted together with you by the mutual faith both of you and me.');
INSERT INTO verses VALUES (4500100013,45001,13,'لکن ای برادران، نمی‌خواهم که شما بی‌خبر باشید از اینکه مکرّراً ارادهٔ آمدن نزد شما کردم و تا به حال ممنوع شدم تا ثمری حاصل کنم در میان شما نیز چنانکه در سایر امّت‌ها.','Now I would not have you ignorant, brethren, that oftentimes I purposed to come unto you, (but was let hitherto,) that I might have some fruit among you also, even as among other Gentiles.');
INSERT INTO verses VALUES (4500100014,45001,14,'زیرا که یونانیان و بَرْبِریان و حکما و جهلا را هم مدیونم.','I am debtor both to the Greeks, and to the Barbarians; both to the wise, and to the unwise.');
INSERT INTO verses VALUES (4500100015,45001,15,'پس همچنین بقدر طاقت خود مستعدّم که شما را نیز که در روم هستید بشارت دهم.','So, as much as in me is, I am ready to preach the gospel to you that are at Rome also.');
INSERT INTO verses VALUES (4500100016,45001,16,'زیرا که از انجیل مسیح عار ندارم چونکه قوّت خداست، برای نجات هر کس که ایمان آورد، اوّل یهود و پس یونانی،','For I am not ashamed of the gospel of Christ : for it is the power of God unto salvation to every one that believeth; to the Jew first, and also to the Greek.');
INSERT INTO verses VALUES (4500100017,45001,17,'که در آن عدالت خدا مکشوف می‌شود، از ایمان تا ایمان، چنانکه مکتوب است که عادل به ایمان زیست خواهد نمود.','For therein is the righteousness of God revealed from faith to faith: as it is written, The just shall live by faith.');
INSERT INTO verses VALUES (4500100018,45001,18,'زیرا غضب خدا از آسمان مکشوف می‌شود بر هر بی‌دینی و ناراستی مردمانی که راستی را در ناراستی باز می‌دارند.','For the wrath of God is revealed from heaven against all ungodliness and unrighteousness of men, who hold the truth in unrighteousness;');
INSERT INTO verses VALUES (4500100019,45001,19,'چونکه آنچه از خدا می‌توان شناخت، در ایشان ظاهر است زیرا خدا آن را بر ایشان ظاهر کرده است.','Because that which may be known of God is manifest in them; for God hath shewed it unto them.');
INSERT INTO verses VALUES (4500100020,45001,20,'زیرا که چیزهای نادیدهٔ او، یعنی قوّت سَرْمَدی و اُلوهیّتش از حین آفرینش عالم به‌وسیلهٔ کارهای او فهمیده و دیده می‌شود تا ایشان را عذری نباشد.','For the invisible things of him from the creation of the world are clearly seen, being understood by the things that are made, even his eternal power and Godhead; so that they are without excuse:');
INSERT INTO verses VALUES (4500100021,45001,21,'زیرا هر چند خدا را شناختند، ولی او را چون خدا تمجید و شکر نکردند بلکه در خیالات خود باطل گردیده، دل بی‌فهم ایشان تاریک گشت.','Because that, when they knew God, they glorified him not as God, neither were thankful; but became vain in their imaginations, and their foolish heart was darkened.');
INSERT INTO verses VALUES (4500100022,45001,22,'ادّعای حکمت می‌کردند و احمق گردیدند.','Professing themselves to be wise, they became fools,');
INSERT INTO verses VALUES (4500100023,45001,23,'و جلال خدای غیرفانی را به شبیه صورت انسان فانی و طیور و بهایم و حشرات تبدیل نمودند.','And changed the glory of the uncorruptible God into an image made like to corruptible man, and to birds, and fourfooted beasts, and creeping things.');
INSERT INTO verses VALUES (4500100024,45001,24,'لهذا خدا نیز ایشان را در شهوات دل خودشان به ناپاکی تسلیم فرمود تا در میان خود بدنهای خویش را خوار سازند،','Wherefore God also gave them up to uncleanness through the lusts of their own hearts, to dishonour their own bodies between themselves:');
INSERT INTO verses VALUES (4500100025,45001,25,'که ایشان حقّ خدا را به دروغ مبدّل کردند و عبادت و خدمت نمودند مخلوق را به عوض خالقی که تا ابدالآباد متبارک است. آمین.','Who changed the truth of God into a lie, and worshipped and served the creature more than the Creator, who is blessed for ever. Amen.');
INSERT INTO verses VALUES (4500100026,45001,26,'از این سبب خدا ایشان را به هوسهای خباثت تسلیم نمود، به نوعی که زنانشان نیز عمل طبیعی را به آنچه خلاف طبیعت است تبدیل نمودند.','For this cause God gave them up unto vile affections: for even their women did change the natural use into that which is against nature:');
INSERT INTO verses VALUES (4500100027,45001,27,'و همچنین مردان هم استعمال طبیعی زنان را ترک کرده، از شهوات خود با یکدیگر سوختند. مرد با مرد مرتکب اعمال زشت شده، عقوبت سزاوار تقصیر خود را در خود یافتند.','And likewise also the men, leaving the natural use of the woman, burned in their lust one toward another; men with men working that which is unseemly, and receiving in themselves that recompence of their error which was meet.');
INSERT INTO verses VALUES (4500100028,45001,28,'و چون روا نداشتند که خدا را در دانش خود نگاه دارند، خدا ایشان را به ذهن مردود واگذاشت تا کارهای ناشایسته بجا آورند.','And even as they did not like to retain God in their knowledge, God gave them over to a reprobate mind, to do those things which are not convenient;');
INSERT INTO verses VALUES (4500100029,45001,29,'ممّلو از هر نوع ناراستی و شرارت و طمع و خباثت؛ پُر از حسد و قتل و جدال و مکر و بدخویی؛','Being filled with all unrighteousness, fornication, wickedness, covetousness, maliciousness; full of envy, murder, debate, deceit, malignity; whisperers,');
INSERT INTO verses VALUES (4500100030,45001,30,'غمّازان و غیبتکنندگان و دشمنان خدا و اهانتکنندگان و متکبّران و لافزنان و مُبْدِعان شرّ و نامطیعانوالدین؛','Backbiters, haters of God, despiteful, proud, boasters, inventors of evil things, disobedient to parents,');
INSERT INTO verses VALUES (4500100031,45001,31,'بی‌فهم و بیوفا و بی‌الفت و بیرحم.','Without understanding, covenantbreakers, without natural affection, implacable, unmerciful:');
INSERT INTO verses VALUES (4500100032,45001,32,'زیرا هر چند انصاف خدا را می‌دانند که کنندگان چنین کارها مستوجب موت هستند، نه فقط آنها را می‌کنند بلکه کنندگان را نیز خوش می‌دارند.','Who knowing the judgment of God, that they which commit such things are worthy of death, not only do the same, but have pleasure in them that do them.');
id INTEGER PRIMARY KEY,
book_id INTEGER NOT NULL,
chapter_number INTEGER NOT NULL,
audio_local TEXT,
audio_online_fa TEXT,
audio_online_en TEXT
);
id INTEGER PRIMARY KEY,
chapter_id INTEGER NOT NULL,
verse_number INTEGER NOT NULL,
text_fa TEXT,
text_en TEXT
);
INSERT INTO chapters VALUES (46001,46,1,NULL,'http://audio1.wordfree.net/bibles/app/audio/20/46/1.mp3','http://audio1.wordfree.net/bibles/app/audio/20/46/1.mp3');
INSERT INTO verses VALUES (4600100001,46001,1,'span class="verse" id="1">1 </span پولُس به ارادهٔ خدا رسولِ خوانده شدهعیسی مسیح و سوُستْانِیس برادر،','span class="verse" id="1">1 </span Paul , called to be an apostle of Jesus Christ through the will of God, and Sosthenes our brother,');
INSERT INTO verses VALUES (4600100002,46001,2,'به کلیسای خدا که در قُرِنْتُس است، از مقدّسین در مسیح عیسی که برای تقدّس خوانده شده‌اند، با همهٔ کسانی که در هرجا نام خداوند ما عیسی مسیح را می‌خوانند که [خداوند] ما و [خداوند] ایشان است.','Unto the church of God which is at Corinth, to them that are sanctified in Christ Jesus , called to be saints, with all that in every place call upon the name of Jesus Christ our Lord, both theirs and ours:');
INSERT INTO verses VALUES (4600100003,46001,3,'فیض و سلامتی از جانب پدر ما خدا و عیسی مسیح خداوند بر شما باد.','Grace be unto you, and peace, from God our Father, and from the Lord Jesus Christ .');
INSERT INTO verses VALUES (4600100004,46001,4,'خدای خود را پیوسته شکر می‌کنم دربارهٔ شما برای آن فیض خدا که در مسیح عیسی به شما عطا شده است،','I thank my God always on your behalf, for the grace of God which is given you by Jesus Christ ;');
INSERT INTO verses VALUES (4600100005,46001,5,'زیرا شما از هرچیز در وی دولتمند شده‌اید، در هر کلام و در هر معرفت.','That in every thing ye are enriched by him, in all utterance, and in all knowledge;');
INSERT INTO verses VALUES (4600100006,46001,6,'چنانکه شهادت مسیح در شما استوار گردید،','Even as the testimony of Christ was confirmed in you:');
INSERT INTO verses VALUES (4600100007,46001,7,'بحّدی که در هیچ بخشش ناقص نیستید و منتظر مکاشفه خداوند ما عیسی مسیح می‌باشید.','So that ye come behind in no gift; waiting for the coming of our Lord Jesus Christ :');
INSERT INTO verses VALUES (4600100008,46001,8,'که او نیز شما را تا به آخر استوار خواهد فرمود تا در روز خداوند ما عیسی مسیح بی‌ملامت باشید.','Who shall also confirm you unto the end, that ye may be blameless in the day of our Lord Jesus Christ .');
INSERT INTO verses VALUES (4600100009,46001,9,'امین است خدایی که شما را به شراکت پسر خود عیسی مسیح خداوند ما خوانده است.','God is faithful, by whom ye were called unto the fellowship of his Son Jesus Christ our Lord.');
INSERT INTO verses VALUES (4600100010,46001,10,'لکن ای برادران از شما استدعا دارم به نام خداوند ما عیسی مسیح که همه یک سخن گویید و شقاق در میان شما نباشد، بلکه در یک فکر و یک رأی کامل شوید.','Now I beseech you, brethren, by the name of our Lord Jesus Christ , that ye all speak the same thing, and that there be no divisions among you; but that ye be perfectly joined together in the same mind and in the same judgment.');
INSERT INTO verses VALUES (4600100011,46001,11,'زیرا که ای برادرانِ من، از اهل خانهٔ خَلُوئی دربارهٔ شما خبر به من رسید که نزاع‌ها در میان شما پیدا شده است.','For it hath been declared unto me of you, my brethren, by them which are of the house of Chloe, that there are contentions among you.');
INSERT INTO verses VALUES (4600100012,46001,12,'غرض اینکه هریکی از شما می‌گوید که من از پولُس هستم، و من از اَپَلُّس، و من از کیفا، و من از مسیح.','Now this I say, that every one of you saith, I am of Paul ; and I of Apollos; and I of Cephas; and I of Christ .');
INSERT INTO verses VALUES (4600100013,46001,13,'آیا مسیح منقسم شد؟ یا پولُس در راه شما مصلوب گردید؟ یا به نام پولُس تعمید یافتید؟','Is Christ divided? was Paul crucified for you? or were ye baptized in the name of Paul ?');
INSERT INTO verses VALUES (4600100014,46001,14,'خدا را شکر می‌کنم که هیچ یکی از شما را تعمید ندادم جز کَرِسْپُس و قایوس،','I thank God that I baptized none of you, but Crispus and Gaius;');
INSERT INTO verses VALUES (4600100015,46001,15,'که مبادا کسی گوید که به نام خود تعمید دادم.','Lest any should say that I had baptized in mine own name.');
INSERT INTO verses VALUES (4600100016,46001,16,'و خاندان اَسْتِیفان را نیز تعمید دادم و دیگر یاد ندارم که کسی را تعمید داده باشم.','And I baptized also the household of Stephanas: besides, I know not whether I baptized any other.');
INSERT INTO verses VALUES (4600100017,46001,17,'زیرا که مسیح مرا فرستاد، نه تا تعمید دهم بلکه تا بشارت رسانم، نه به حکمت کلام مبادا صلیب مسیح باطل شود.','For Christ sent me not to baptize, but to preach the gospel: not with wisdom of words, lest the cross of Christ should be made of none effect.');
INSERT INTO verses VALUES (4600100018,46001,18,'زیرا ذکر صلیب برای هالکان حماقت است، لکن نزد ما که ناجیان هستیم قوّت خداست.','For the preaching of the cross is to them that perish foolishness; but unto us which are saved it is the power of God.');
INSERT INTO verses VALUES (4600100019,46001,19,'زیرا مکتوب است، حکمت حکما را باطل سازم و فهم فهیمان را نابود گردانم.','For it is written, I will destroy the wisdom of the wise, and will bring to nothing the understanding of the prudent.');
INSERT INTO verses VALUES (4600100020,46001,20,'کجا است حکیم؟ کجا کاتب؟ کجا مباحِث این دنیا؟ مگر خدا حکمت جهان را جهالت نگردانیده است؟','Where is the wise? where is the scribe? where is the disputer of this world? hath not God made foolish the wisdom of this world?');
INSERT INTO verses VALUES (4600100021,46001,21,'زیرا که چون برحسب حکمتِ خدا، جهان از حکمت خود به معرفت خدا نرسید، خدا بدین رضا داد که به‌وسیلهٔ جهالتِ موعظه، ایمانداران را نجات بخشد.','For after that in the wisdom of God the world by wisdom knew not God, it pleased God by the foolishness of preaching to save them that believe.');
INSERT INTO verses VALUES (4600100022,46001,22,'چونکه یهود آیتی می‌خواهند و یونانیان طالب حکمت هستند.','For the Jews require a sign, and the Greeks seek after wisdom:');
INSERT INTO verses VALUES (4600100023,46001,23,'لکن ما به مسیح مصلوب وعظ می‌کنیم که یهود را لغزش و امّت‌ها را جهالت است.','But we preach Christ crucified, unto the Jews a stumblingblock, and unto the Greeks foolishness;');
INSERT INTO verses VALUES (4600100024,46001,24,'لکن دعوت شدگان را خواه یهود و خواه یونانی مسیح قوّت خدا و حکمت خدا است.','But unto them which are called, both Jews and Greeks, Christ the power of God, and the wisdom of God.');
INSERT INTO verses VALUES (4600100025,46001,25,'زیرا که جهالت خدا از انسان حکیمتر است و ناتوانی خدا از مردم، تواناتر.','Because the foolishness of God is wiser than men; and the weakness of God is stronger than men.');
INSERT INTO verses VALUES (4600100026,46001,26,'زیرا ای برادران دعوت خود را ملاحظه نمایید که بسیاری بحسب جسم حکیم نیستند و بسیاری توانا نی و بسیاری شریف نی.','For ye see your calling, brethren, how that not many wise men after the flesh, not many mighty, not many noble, are called:');
INSERT INTO verses VALUES (4600100027,46001,27,'بلکه خدا جهّال جهان را برگزید تا حکما را رسوا سازد و خدا ناتوانان عالم را برگزید تا توانایان را رسوا سازد،','But God hath chosen the foolish things of the world to confound the wise; and God hath chosen the weak things of the world to confound the things which are mighty;');
INSERT INTO verses VALUES (4600100028,46001,28,'و خسیسان دنیا و محقّران را خدا برگزید، بلکه نیستیها را تا هستیها را باطل گرداند.','And base things of the world, and things which are despised, hath God chosen, yea, and things which are not, to bring to nought things that are:');
INSERT INTO verses VALUES (4600100029,46001,29,'تا هیچ بشری در حضور او فخر نکند.','That no flesh should glory in his presence.');
INSERT INTO verses VALUES (4600100030,46001,30,'لکن از او شما هستید در عیسی مسیح که از جانب خدا برای شما حکمت شده است و عدالت قدّوسیّت و فدا.','But of him are ye in Christ Jesus , who of God is made unto us wisdom, and righteousness, and sanctification, and redemption:');
INSERT INTO verses VALUES (4600100031,46001,31,'تا چنانکه مکتوب است هر که فخر کند در خداوند فخر نماید.','That, according as it is written, He that glorieth, let him glory in the Lord.');
id INTEGER PRIMARY KEY,
book_id INTEGER NOT NULL,
chapter_number INTEGER NOT NULL,
audio_local TEXT,
audio_online_fa TEXT,
audio_online_en TEXT
);
id INTEGER PRIMARY KEY,
chapter_id INTEGER NOT NULL,
verse_number INTEGER NOT NULL,
text_fa TEXT,
text_en TEXT
);
INSERT INTO chapters VALUES (47001,47,1,NULL,'http://audio1.wordfree.net/bibles/app/audio/20/47/1.mp3','http://audio1.wordfree.net/bibles/app/audio/20/47/1.mp3');
INSERT INTO verses VALUES (4700100001,47001,1,'span class="verse" id="1">1 </span پولُس، به ارادهٔ خدا رسولِ عیسی مسیح، و تیموتاؤس برادر، به کلیسای خدا که در قُرِنتُس می‌باشد با همهٔ مقدّسینی که در تمام اَخائیه هستند،','span class="verse" id="1">1 </span Paul , an apostle of Jesus Christ by the will of God, and Timothy our brother, unto the church of God which is at Corinth, with all the saints which are in all Achaia:');
INSERT INTO verses VALUES (4700100002,47001,2,'فیض و سلامتی از پدر ما خدا و عیسی مسیح خداوند به شما باد.','Grace be to you and peace from God our Father, and from the Lord Jesus Christ .');
INSERT INTO verses VALUES (4700100003,47001,3,'متبارک باد خدا و پدر خداوند ما عیسی مسیح که پدر رحمتها و خدای جمیع تسلیّات است،','Blessed be God, even the Father of our Lord Jesus Christ , the Father of mercies, and the God of all comfort;');
INSERT INTO verses VALUES (4700100004,47001,4,'که ما را در هر تنگی ما تسلّی می‌دهد تا ما بتوانیم دیگران را در هر مصیبتی که باشد تسلّی نماییم، به آن تسلّی که خود از خدا یافته‌ایم.','Who comforteth us in all our tribulation, that we may be able to comfort them which are in any trouble, by the comfort wherewith we ourselves are comforted of God.');
INSERT INTO verses VALUES (4700100005,47001,5,'زیرا به اندازه‌ای که دردهای مسیح در ما زیاده شود، به همین قِسْم تسلّی ما نیز به‌وسیلهٔ مسیح می‌افزاید.','For as the sufferings of Christ abound in us, so our consolation also aboundeth by Christ .');
INSERT INTO verses VALUES (4700100006,47001,6,'امّا خواه زحمت کشیم، این است برای تسلّی و نجات شما، و خواه تسلّی پذیریم این هم بجهت تسّلی و نجات شما است که میسّر می‌شود از صبر داشتن در همین دردهایی که ما هم می‌بینیم.','And whether we be afflicted, it is for your consolation and salvation, which is effectual in the enduring of the same sufferings which we also suffer: or whether we be comforted, it is for your consolation and salvation.');
INSERT INTO verses VALUES (4700100007,47001,7,'و امید ما برای شما استوار می‌شود زیرا می‌دانیم که چنانکه شما شریک دردها هستید، همچنین شریک تسلّی نیز خواهید بود.','And our hope of you is stedfast, knowing, that as ye are partakers of the sufferings, so shall ye be also of the consolation.');
INSERT INTO verses VALUES (4700100008,47001,8,'زیرا ای برادران نمی‌خواهیم شما بی‌خبر باشید از تنگیای که در آسیا به ما عارض گردیدکه بی‌نهایت و فوق از طاقت بار کشیدیم، به‌حدّی که از جان هم مأیوس شدیم.','For we would not, brethren, have you ignorant of our trouble which came to us in Asia, that we were pressed out of measure, above strength, insomuch that we despaired even of life:');
INSERT INTO verses VALUES (4700100009,47001,9,'لکن در خود فتوای موت داشتیم تا بر خود توکّل نکنیم، بلکه بر خدا که مردگان را برمی‌خیزاند،','But we had the sentence of death in ourselves, that we should not trust in ourselves, but in God which raiseth the dead:');
INSERT INTO verses VALUES (4700100010,47001,10,'که ما را از چنین موت رهانید و می‌رهاند و به او امیدواریم که بعد از این هم خواهد رهانید.','Who delivered us from so great a death, and doth deliver: in whom we trust that he will yet deliver us;');
INSERT INTO verses VALUES (4700100011,47001,11,'و شما نیز به دعا در حقّ ما اعانت می‌کنید تا آنکه برای آن نعمتی که از اشخاص بسیاری به ما رسید، شکرگزاری هم بجهت ما از بسیاری بجا آورده شود.','Ye also helping together by prayer for us, that for the gift bestowed upon us by the means of many persons thanks may be given by many on our behalf.');
INSERT INTO verses VALUES (4700100012,47001,12,'زیرا که فخر ما این است، یعنی شهادت ضمیر ما که به قدّوسیّت و اخلاص خدایی، نه به حکمت جسمانی، بلکه به فیض الهی در جهان رفتار نمودیم و خصوصاً نسبت به شما.','For our rejoicing is this, the testimony of our conscience, that in simplicity and godly sincerity, not with fleshly wisdom, but by the grace of God, we have had our conversation in the world, and more abundantly to you-ward.');
INSERT INTO verses VALUES (4700100013,47001,13,'زیرا چیزی به شما نمی‌نویسیم مگر آنچه می‌خوانید و به آن اعتراف می‌کنید و امیدوارم که تا به آخر اعتراف هم خواهید کرد.','For we write none other things unto you, than what ye read or acknowledge; and I trust ye shall acknowledge even to the end;');
INSERT INTO verses VALUES (4700100014,47001,14,'چنانکه به ما فیالجمله اعتراف کردید که محلّ فخر شما هستیم، چنانکه شما نیز ما را می‌باشید در روز عیسی خداوند.','As also ye have acknowledged us in part, that we are your rejoicing, even as ye also are ours in the day of the Lord Jesus .');
INSERT INTO verses VALUES (4700100015,47001,15,'و بدین اعتماد قبل از این خواستم به نزد شما آیم تا نعمتی دیگر بیابید،','And in this confidence I was minded to come unto you before, that ye might have a second benefit;');
INSERT INTO verses VALUES (4700100016,47001,16,'و از راه شما به مکادونیه بروم و باز از مکادونیه نزد شما بیایم وشما مرا به سوی یهودیه مشایعت کنید.','And to pass by you into Macedonia , and to come again out of Macedonia unto you, and of you to be brought on my way toward Judaea .');
INSERT INTO verses VALUES (4700100017,47001,17,'پس چون این را خواستم، آیا سهلانگاری کردم یا عزیمت من عزیمت بشری باشد تا آنکه به نزد من بلی بلی و نی نی باشد.','When I therefore was thus minded, did I use lightness? or the things that I purpose, do I purpose according to the flesh, that with me there should be yea yea, and nay nay?');
INSERT INTO verses VALUES (4700100018,47001,18,'لیکن خدا امین است که سخن ما با شما بلی و نی نیست.','But as God is true, our word toward you was not yea and nay.');
INSERT INTO verses VALUES (4700100019,47001,19,'زیرا که پسر خدا عیسی مسیح که ما، یعنی من و سِلْوانُس و تیموتاؤس در میان شما به وی موعظه کردیم، بلی و نی نشد، بلکه در او بلی شده است.','For the Son of God, Jesus Christ , who was preached among you by us, even by me and Silvanus and Timotheus, was not yea and nay, but in him was yea.');
INSERT INTO verses VALUES (4700100020,47001,20,'زیرا چندان که وعده‌های خدا است، همه در او بلی و از این جهت در او امین است تا خدا از ما تمجید یابد.','For all the promises of God in him are yea, and in him Amen, unto the glory of God by us.');
INSERT INTO verses VALUES (4700100021,47001,21,'امّا او که ما را با شما در مسیح استوار می‌گرداند و ما را مسح نموده است، خداست.','Now he which stablisheth us with you in Christ , and hath anointed us, is God;');
INSERT INTO verses VALUES (4700100022,47001,22,'که او نیز ما را مُهر نموده و بیعانه روح را در دلهای ما عطا کرده است.','Who hath also sealed us, and given the earnest of the Spirit in our hearts.');
INSERT INTO verses VALUES (4700100023,47001,23,'لیکن من خدا را بر جان خود شاهد می‌خوانم که برای شفقت بر شما تا بحال به قرِنْتُس نیامدم،','Moreover I call God for a record upon my soul, that to spare you I came not as yet unto Corinth.');
INSERT INTO verses VALUES (4700100024,47001,24,'نه آنکه بر ایمان شما حکم کرده باشیم بلکه شادی شما را مددکار هستیم زیرا که به ایمان قایم هستید.','Not for that we have dominion over your faith, but are helpers of your joy: for by faith ye stand.');
id INTEGER PRIMARY KEY,
book_id INTEGER NOT NULL,
chapter_number INTEGER NOT NULL,
audio_local TEXT,
audio_online_fa TEXT,
audio_online_en TEXT
);
id INTEGER PRIMARY KEY,
chapter_id INTEGER NOT NULL,
verse_number INTEGER NOT NULL,
text_fa TEXT,
text_en TEXT
);
INSERT INTO chapters VALUES (48001,48,1,NULL,'http://audio1.wordfree.net/bibles/app/audio/20/48/1.mp3','http://audio1.wordfree.net/bibles/app/audio/20/48/1.mp3');
INSERT INTO verses VALUES (4800100001,48001,1,'span class="verse" id="1">1 </span پولُس، رسول نه از جانب انسان و نه به‌وسیلهٔ انسان بلکه به عیسی مسیح و خدای پدر که او را از مردگان برخیزانید،','span class="verse" id="1">1 </span Paul , an apostle, (not of men, neither by man, but by Jesus Christ , and God the Father, who raised him from the dead;)');
INSERT INTO verses VALUES (4800100002,48001,2,'و همهٔٔ برادرانی که با من می‌باشند، به کلیساهای غلاطیه،','And all the brethren which are with me, unto the churches of Galatia:');
INSERT INTO verses VALUES (4800100003,48001,3,'فیض و سلامتی از جانب خدای پدر و خداوند ما عیسی مسیح با شما باد؛','Grace be to you and peace from God the Father, and from our Lord Jesus Christ ,');
INSERT INTO verses VALUES (4800100004,48001,4,'که خود را برای گناهان ما داد تا ما را از این عالم حاضر شریر بحسب ارادهٔ خدا و پدر ما خلاصی بخشد،','Who gave himself for our sins, that he might deliver us from this present evil world, according to the will of God and our Father:');
INSERT INTO verses VALUES (4800100005,48001,5,'که او را تا ابدالآباد جلال باد. آمین.','To whom be glory for ever and ever. Amen.');
INSERT INTO verses VALUES (4800100006,48001,6,'تعجّب می‌کنم که بدین زودی از آن کس که شما را به فیض مسیح خوانده است، برمی‌گردید به سوی انجیلی دیگر،','I marvel that ye are so soon removed from him that called you into the grace of Christ unto another gospel:');
INSERT INTO verses VALUES (4800100007,48001,7,'که [انجیل] دیگر نیست. لکن بعضی هستند که شما را مضطرب می‌سازند و می‌خواهند انجیل مسیح را تبدیل نمایند.','Which is not another; but there be some that trouble you, and would pervert the gospel of Christ .');
INSERT INTO verses VALUES (4800100008,48001,8,'بلکه هرگاه ما هم یا فرشته‌ای از آسمان، انجیلی غیر از آنکه ما به آن بشارت دادیم به شما رساند، اَناتیما باد.','But though we, or an angel from heaven, preach any other gospel unto you than that which we have preached unto you, let him be accursed.');
INSERT INTO verses VALUES (4800100009,48001,9,'چنانکه پیش گفتیم، الآن هم باز می‌گویم، اگر کسی انجیلی غیر از آنکه پذیرفتید بیاورد، اَناتیما باد.','As we said before, so say I now again, If any man preach any other gospel unto you than that ye have received, let him be accursed.');
INSERT INTO verses VALUES (4800100010,48001,10,'آیا الحال مردم را در رأی خود می‌آورم یا خدا را؟ یا رضامندی مردم را می‌طلبم؟ اگر تا به حال رضامندی مردم را می‌خواستم، غلام مسیح نمی‌بودم.','For do I now persuade men, or God? or do I seek to please men? for if I yet pleased men, I should not be the servant of Christ .');
INSERT INTO verses VALUES (4800100011,48001,11,'امّا ای برادران شما را اعلام می‌کنم از انجیلی که من بدان بشارت دادم که به طریق انسان نیست.','But I certify you, brethren, that the gospel which was preached of me is not after man.');
INSERT INTO verses VALUES (4800100012,48001,12,'زیرا که من آن را از انسان نیافتم و نیاموختم، مگر به کشف عیسی مسیح.','For I neither received it of man, neither was I taught it, but by the revelation of Jesus Christ .');
INSERT INTO verses VALUES (4800100013,48001,13,'زیرا سرگذشتِ سابقِ مرا در دین یهود شنیده‌اید که بر کلیسای خدا بی‌نهایت جفا می‌نمودم و آن را ویران می‌ساختم،','For ye have heard of my conversation in time past in the Jews'' religion, how that beyond measure I persecuted the church of God, and wasted it:');
INSERT INTO verses VALUES (4800100014,48001,14,'و در دین یهود از اکثر همسالان قوم خود سبقت می‌جستم و در تقالید اجداد خود بغایت غیور می‌بودم.','And profited in the Jews'' religion above many my equals in mine own nation, being more exceedingly zealous of the traditions of my fathers.');
INSERT INTO verses VALUES (4800100015,48001,15,'امّا چون خدا که مرا از شکم مادرم برگزید و به فیض خود مرا خواند، رضا بدین داد','But when it pleased God, who separated me from my mother''s womb, and called me by his grace,');
INSERT INTO verses VALUES (4800100016,48001,16,'که پسر خود را در من آشکار سازد تا در میان امّت‌ها بدو بشارت دهم، در آنوقت با جسم و خون مشورت نکردم،','To reveal his Son in me, that I might preach him among the heathen; immediately I conferred not with flesh and blood:');
INSERT INTO verses VALUES (4800100017,48001,17,'و به اورشلیم هم نزد آنانی که قبل از من رسول بودند نرفتم، بلکه به عَرَب شدم و باز به دمشق مراجعت کردم.','Neither went I up to Jerusalem to them which were apostles before me; but I went into Arabia, and returned again unto Damascus .');
INSERT INTO verses VALUES (4800100018,48001,18,'پس بعد از سه سال، برای ملاقات پطرس به اورشلیم رفتم و پانزده روز با وی بسر بردم.','Then after three years I went up to Jerusalem to see Peter , and abode with him fifteen days.');
INSERT INTO verses VALUES (4800100019,48001,19,'امّا از سایر رسولان جز یعقوب برادر خداوند را ندیدم.','But other of the apostles saw I none, save James the Lord''s brother.');
INSERT INTO verses VALUES (4800100020,48001,20,'امّا دربارهٔ آنچه به شما می‌نویسم، اینک، در حضور خدا دروغ نمی‌گویم.','Now the things which I write unto you, behold, before God, I lie not.');
INSERT INTO verses VALUES (4800100021,48001,21,'بعد از آن به نواحی سوریه و قیلیقیه آمدم.','Afterwards I came into the regions of Syria and Cilicia;');
INSERT INTO verses VALUES (4800100022,48001,22,'و به کلیساهای یهودیه که در مسیح بودند صورتاً غیر معروف بودم،','And was unknown by face unto the churches of Judaea which were in Christ :');
INSERT INTO verses VALUES (4800100023,48001,23,'جز اینکه شنیده بودند که آنکه پیشتر بر ما جفا می‌نمود، الحال بشارت می‌دهد به همان ایمانی که قبل از این ویران می‌ساخت.','But they had heard only, That he which persecuted us in times past now preacheth the faith which once he destroyed.');
INSERT INTO verses VALUES (4800100024,48001,24,'و خدا را در من تمجید نمودند.','And they glorified God in me.');
id INTEGER PRIMARY KEY,
book_id INTEGER NOT NULL,
chapter_number INTEGER NOT NULL,
audio_local TEXT,
audio_online_fa TEXT,
audio_online_en TEXT
);
id INTEGER PRIMARY KEY,
chapter_id INTEGER NOT NULL,
verse_number INTEGER NOT NULL,
text_fa TEXT,
text_en TEXT
);
INSERT INTO chapters VALUES (49001,49,1,NULL,'http://audio1.wordfree.net/bibles/app/audio/20/49/1.mp3','http://audio1.wordfree.net/bibles/app/audio/20/49/1.mp3');
INSERT INTO verses VALUES (4900100001,49001,1,'span class="verse" id="1">1 </span پولُس به ارادهٔ خدا رسول عیسی مسیح، به مقدّسینی که در اِفِسُسْ می‌باشند و ایمانداران در مسیح عیسی.','span class="verse" id="1">1 </span Paul , an apostle of Jesus Christ by the will of God, to the saints which are at Ephesus, and to the faithful in Christ Jesus :');
INSERT INTO verses VALUES (4900100002,49001,2,'فیض و سلامتی از جانب پدر ما خدا و عیسی مسیح خداوند بر شما باد.','Grace be to you, and peace, from God our Father, and from the Lord Jesus Christ .');
INSERT INTO verses VALUES (4900100003,49001,3,'متبارک باد خدا و پدر خداوند ما عیسی مسیح که ما را مبارک ساخت به هر برکت روحانی در جایهای آسمانی در مسیح.','Blessed be the God and Father of our Lord Jesus Christ , who hath blessed us with all spiritual blessings in heavenly places in Christ :');
INSERT INTO verses VALUES (4900100004,49001,4,'چنانکه ما را پیش از بنیاد عالم در او برگزید تا در حضور او در محبّت، مقدّس و بی‌عیب باشیم.','According as he hath chosen us in him before the foundation of the world, that we should be holy and without blame before him in love:');
INSERT INTO verses VALUES (4900100005,49001,5,'که ما را از قبل تعیین نمود تا او را پسرخوانده شویم بوساطت عیسی مسیح برحسب خشنودی ارادهٔ خود،','Having predestinated us unto the adoption of children by Jesus Christ to himself, according to the good pleasure of his will,');
INSERT INTO verses VALUES (4900100006,49001,6,'برای ستایش جلال فیض خود که ما را به آن مستفیض گردانید در آن حبیب.','To the praise of the glory of his grace, wherein he hath made us accepted in the beloved.');
INSERT INTO verses VALUES (4900100007,49001,7,'که در وی به‌سبب خون او فدیه، یعنی آمرزش گناهان را به اندازهٔ دولت فیض او یافته‌ایم.','In whom we have redemption through his blood, the forgiveness of sins, according to the riches of his grace;');
INSERT INTO verses VALUES (4900100008,49001,8,'که آن را به ما به فراوانی عطا فرمود در هر حکمت و فطانت.','Wherein he hath abounded toward us in all wisdom and prudence;');
INSERT INTO verses VALUES (4900100009,49001,9,'چونکه سرّ ارادهٔ خود را به ما شناسانید، برحسب خشنودی خود که در خود عزم نموده بود،','Having made known unto us the mystery of his will, according to his good pleasure which he hath purposed in himself:');
INSERT INTO verses VALUES (4900100010,49001,10,'برای انتظام کمال زمانها تا همه‌چیز را خواه آنچه در آسمان و خواه آنچه بر زمین است، در مسیح جمع کند، یعنی در او.','That in the dispensation of the fulness of times he might gather together in one all things in Christ , both which are in heaven, and which are on earth; even in him:');
INSERT INTO verses VALUES (4900100011,49001,11,'که ما نیز در وی میراث او شده‌ایم، چنانکه پیش معیّن گشتیم برحسب قصد او که همهٔٔ چیزها را موافق رأی ارادهٔ خود می‌کند.','In whom also we have obtained an inheritance, being predestinated according to the purpose of him who worketh all things after the counsel of his own will:');
INSERT INTO verses VALUES (4900100012,49001,12,'تا از ما که اوّل امیدوار به مسیح می‌بودیم، جلال او ستوده شود.','That we should be to the praise of his glory, who first trusted in Christ .');
INSERT INTO verses VALUES (4900100013,49001,13,'و در وی، شما نیز چون کلام راستی، یعنی بشارت نجات خود را شنیدید، در وی چون ایمان آوردید، از روح قُدوسِ وعده مختوم شدید.','In whom ye also trusted, after that ye heard the word of truth, the gospel of your salvation: in whom also after that ye believed, ye were sealed with that holy Spirit of promise,');
INSERT INTO verses VALUES (4900100014,49001,14,'که بیعانهٔ میراث ما است برای فدای آن مِلْکِ خاصّ او، تا جلال او ستوده شود.','Which is the earnest of our inheritance until the redemption of the purchased possession, unto the praise of his glory.');
INSERT INTO verses VALUES (4900100015,49001,15,'بنابراین، من نیز چون خبر ایمان شما را در عیسی خداوند و محبّت شما را با همهٔٔ مقدّسین شنیدم،','Wherefore I also, after I heard of your faith in the Lord Jesus , and love unto all the saints,');
INSERT INTO verses VALUES (4900100016,49001,16,'باز نمی‌ایستم از شکر نمودن برای شما و از یاد آوردن شما در دعاهای خود،','Cease not to give thanks for you, making mention of you in my prayers;');
INSERT INTO verses VALUES (4900100017,49001,17,'تا خدای خداوند ما عیسی مسیح که پدر ذوالجلال است، روح حکمت و کشف را در معرفت خود به شما عطا فرماید.','That the God of our Lord Jesus Christ , the Father of glory, may give unto you the spirit of wisdom and revelation in the knowledge of him:');
INSERT INTO verses VALUES (4900100018,49001,18,'تا چشمان دل شما روشن گشته، بدانید که امید دعوت او چیست و کدام است دولت جلال میراث او در مقدّسین،','The eyes of your understanding being enlightened; that ye may know what is the hope of his calling, and what the riches of the glory of his inheritance in the saints,');
INSERT INTO verses VALUES (4900100019,49001,19,'و چه مقدار است عظمت بی‌نهایت قوّت او نسبت به ما مؤمنین، برحسب عمل توانایی قوّت او،','And what is the exceeding greatness of his power to us-ward who believe, according to the working of his mighty power,');
INSERT INTO verses VALUES (4900100020,49001,20,'که در مسیح عمل کرد چون او را از مردگان برخیزانید و به دست راست خود در جایهای آسمانی نشانید،','Which he wrought in Christ , when he raised him from the dead, and set him at his own right hand in the heavenly places,');
INSERT INTO verses VALUES (4900100021,49001,21,'بالاتر از هر ریاست و قدرت و قوّت و سلطنت و هر نامی که خوانده می‌شود، نه در این عالم فقط بلکه در عالم آینده نیز.','Far above all principality, and power, and might, and dominion, and every name that is named, not only in this world, but also in that which is to come:');
INSERT INTO verses VALUES (4900100022,49001,22,'و همه‌چیز را زیر پایهای او نهاد و او را سر همه‌چیز به کلیسا داد،','And hath put all things under his feet, and gave him to be the head over all things to the church,');
INSERT INTO verses VALUES (4900100023,49001,23,'که بدن اوست، یعنی پُریِ او که همه را در همه پر می‌سازد.','Which is his body, the fulness of him that filleth all in all.');
id INTEGER PRIMARY KEY,
book_id INTEGER NOT NULL,
chapter_number INTEGER NOT NULL,
audio_local TEXT,
audio_online_fa TEXT,
audio_online_en TEXT
);
id INTEGER PRIMARY KEY,
chapter_id INTEGER NOT NULL,
verse_number INTEGER NOT NULL,
text_fa TEXT,
text_en TEXT
);
INSERT INTO chapters VALUES (50001,50,1,NULL,'http://audio1.wordfree.net/bibles/app/audio/20/50/1.mp3','http://audio1.wordfree.net/bibles/app/audio/20/50/1.mp3');
INSERT INTO verses VALUES (5000100001,50001,1,'span class="verse" id="1">1 </span پولُس و تیموتاؤس، غلامان عیسی مسیح، به همهٔٔ مقدّسین در مسیح عیسی که در فیلّپی می‌باشند، با اُسْقُفان و شَمّاسان.','span class="verse" id="1">1 </span Paul and Timotheus, the servants of Jesus Christ , to all the saints in Christ Jesus which are at Philippi , with the bishops and deacons:');
INSERT INTO verses VALUES (5000100002,50001,2,'فیض و سلامتی از جانب پدر ما خدا و عیسی مسیح خداوند بر شما باد.','Grace be unto you, and peace, from God our Father, and from the Lord Jesus Christ .');
INSERT INTO verses VALUES (5000100003,50001,3,'در تمامی یادگاری شما خدای خود را شکر می‌گزارم،','I thank my God upon every remembrance of you,');
INSERT INTO verses VALUES (5000100004,50001,4,'و پیوسته در هر دعای خود برای جمیع شما به خوشی دعا می‌کنم،','Always in every prayer of mine for you all making request with joy,');
INSERT INTO verses VALUES (5000100005,50001,5,'به‌سبب مشارکت شما برای انجیل از روز اوّل تا به حال.','For your fellowship in the gospel from the first day until now;');
INSERT INTO verses VALUES (5000100006,50001,6,'چونکه به این اعتماد دارم که او که عمل نیکو را در شما شروع کرد، آن را تا روز عیسی مسیح به کمال خواهد رسانید.','Being confident of this very thing, that he which hath begun a good work in you will perform it until the day of Jesus Christ :');
INSERT INTO verses VALUES (5000100007,50001,7,'چنانکه مرا سزاوار است که دربارهٔ همهٔٔ شما همین فکر کنم زیرا که شما را در دل خود می‌دارم که در زنجیرهای من و در حجّت و اثبات انجیل همهٔٔ شما با من شریک در این نعمت هستید.','Even as it is meet for me to think this of you all, because I have you in my heart; inasmuch as both in my bonds, and in the defence and confirmation of the gospel, ye all are partakers of my grace.');
INSERT INTO verses VALUES (5000100008,50001,8,'زیرا خدا مرا شاهد است که چقدر در احشای عیسی مسیح، مشتاق همهٔٔ شما هستم.','For God is my record, how greatly I long after you all in the bowels of Jesus Christ .');
INSERT INTO verses VALUES (5000100009,50001,9,'و برای این دعا می‌کنم تا محبّت شما در معرفت و کمال فهم بسیار افزونتر شود.','And this I pray, that your love may abound yet more and more in knowledge and in all judgment;');
INSERT INTO verses VALUES (5000100010,50001,10,'تا چیزهای بهتر را برگزینید و در روز مسیح بی‌غش و بی‌لغزش باشید،','That ye may approve things that are excellent; that ye may be sincere and without offence till the day of Christ ;');
INSERT INTO verses VALUES (5000100011,50001,11,'و پر شوید از میوهٔ عدالت که به‌وسیلهٔ عیسی مسیح برای تمجید و حمد خداست.','Being filled with the fruits of righteousness, which are by Jesus Christ , unto the glory and praise of God.');
INSERT INTO verses VALUES (5000100012,50001,12,'امّا ای برادران، می‌خواهم شما بدانید که آنچه بر من واقع گشت، برعکس به ترقّی انجیل انجامید،','But I would ye should understand, brethren, that the things which happened unto me have fallen out rather unto the furtherance of the gospel;');
INSERT INTO verses VALUES (5000100013,50001,13,'به حدّی که زنجیرهای من آشکارا شد در مسیح در تمام فوج خاصّ و به همهٔ دیگران.','So that my bonds in Christ are manifest in all the palace, and in all other places;');
INSERT INTO verses VALUES (5000100014,50001,14,'و اکثر از برادران در خداوند از زنجیرهای من اعتماد به هم رسانیده، بیشتر جرأت می‌کنند که کلام خدا را بی‌ترس بگویند.','And many of the brethren in the Lord, waxing confident by my bonds, are much more bold to speak the word without fear.');
INSERT INTO verses VALUES (5000100015,50001,15,'امّا بعضی از حسد و نزاع به مسیح موعظه می‌کنند، ولی بعضی هم از خشنودی.','Some indeed preach Christ even of envy and strife; and some also of good will:');
INSERT INTO verses VALUES (5000100016,50001,16,'امّا آنان از تعصّب نه از اخلاص به مسیح اعلام می‌کنند و گمان می‌برند که به زنجیرهای من زحمت می‌افزایند.','The one preach Christ of contention, not sincerely, supposing to add affliction to my bonds:');
INSERT INTO verses VALUES (5000100017,50001,17,'ولی اینان از راه محبّت، چونکه می‌دانند که من بجهتِ حمایتِ انجیل معیّن شده‌ام.','But the other of love, knowing that I am set for the defence of the gospel.');
INSERT INTO verses VALUES (5000100018,50001,18,'پس چه؟ جز اینکه به هر صورت، خواه به بهانه و خواه به راستی، به مسیح موعظه می‌شود و از این شادمانم بلکه شادی هم خواهم کرد،','What then? notwithstanding, every way, whether in pretence, or in truth, Christ is preached; and I therein do rejoice, yea, and will rejoice.');
INSERT INTO verses VALUES (5000100019,50001,19,'زیرا می‌دانم که به نجات من خواهد انجامید به‌وسیلهٔ دعای شما و تأیید روح عیسی مسیح،','For I know that this shall turn to my salvation through your prayer, and the supply of the Spirit of Jesus Christ ,');
INSERT INTO verses VALUES (5000100020,50001,20,'برحسب انتظار و امید من که در هیچ چیز خجالت نخواهم کشید، بلکه در کمال دلیری، چنانکه همیشه، الآن نیز مسیح در بدن من جلال خواهد یافت، خواه در حیات و خواه در موت.','According to my earnest expectation and my hope, that in nothing I shall be ashamed, but that with all boldness, as always, so now also Christ shall be magnified in my body, whether it be by life, or by death.');
INSERT INTO verses VALUES (5000100021,50001,21,'زیرا که مرا زیستن مسیح است و مردن نفع.','For to me to live is Christ , and to die is gain.');
INSERT INTO verses VALUES (5000100022,50001,22,'و لیکن اگر زیستن در جسم، همان ثمر کار من است، پس نمی‌دانم کدام را اختیار کنم.','But if I live in the flesh, this is the fruit of my labour: yet what I shall choose I wot not.');
INSERT INTO verses VALUES (5000100023,50001,23,'زیرا در میان این دو سخت گرفتار هستم، چونکه خواهش دارم که رحلت کنم و با مسیح باشم، زیرا این بسیار بهتر است.','For I am in a strait betwixt two, having a desire to depart, and to be with Christ ; which is far better:');
INSERT INTO verses VALUES (5000100024,50001,24,'لیکن در جسم ماندن برای شما لازمتر است.','Nevertheless to abide in the flesh is more needful for you.');
INSERT INTO verses VALUES (5000100025,50001,25,'و چون این اعتماد را دارم، می‌دانم که خواهم ماند و نزد همهٔٔ شما توقف خواهم نمود بجهت ترقی و خوشی ایمان شما،','And having this confidence, I know that I shall abide and continue with you all for your furtherance and joy of faith;');
INSERT INTO verses VALUES (5000100026,50001,26,'تا فخر شما در مسیح عیسی در من افزوده شود به‌وسیلهٔ آمدن من بار دیگر نزد شما.','That your rejoicing may be more abundant in Jesus Christ for me by my coming to you again.');
INSERT INTO verses VALUES (5000100027,50001,27,'باری بطور شایستهٔ انجیل مسیح رفتار نمایید تا خواه آیم و شما را بینم و خواه غایب باشم، احوال شما را بشنوم که به یک روح برقرارید و به یک نَفس برای ایمان انجیل مجاهده می‌کنید.','Only let your conversation be as it becometh the gospel of Christ : that whether I come and see you, or else be absent, I may hear of your affairs, that ye stand fast in one spirit, with one mind striving together for the faith of the gospel;');
INSERT INTO verses VALUES (5000100028,50001,28,'و در هیچ امری از دشمنان ترسان نیستید که همین برای ایشان دلیل هلاکت است، امّا شما را دلیل نجات و این از خداست.','And in nothing terrified by your adversaries: which is to them an evident token of perdition, but to you of salvation, and that of God.');
INSERT INTO verses VALUES (5000100029,50001,29,'زیرا که به شما عطا شد به‌خاطر مسیح نه فقط ایمان آوردن به او، بلکه زحمت کشیدن هم برای او.','For unto you it is given in the behalf of Christ , not only to believe on him, but also to suffer for his sake;');
INSERT INTO verses VALUES (5000100030,50001,30,'و شما را همان مجاهده است که در من دیدید و الآن هم می‌شنوید که در من است.','Having the same conflict which ye saw in me, and now hear to be in me.');
id INTEGER PRIMARY KEY,
book_id INTEGER NOT NULL,
chapter_number INTEGER NOT NULL,
audio_local TEXT,
audio_online_fa TEXT,
audio_online_en TEXT
);
id INTEGER PRIMARY KEY,
chapter_id INTEGER NOT NULL,
verse_number INTEGER NOT NULL,
text_fa TEXT,
text_en TEXT
);
INSERT INTO chapters VALUES (51001,51,1,NULL,'http://audio1.wordfree.net/bibles/app/audio/20/51/1.mp3','http://audio1.wordfree.net/bibles/app/audio/20/51/1.mp3');
INSERT INTO verses VALUES (5100100001,51001,1,'span class="verse" id="1">1 </span پولُس به ارادهٔ خدا رسولِ مسیح عیسی و تیموتاؤس برادر،','span class="verse" id="1">1 </span Paul , an apostle of Jesus Christ by the will of God, and Timotheus our brother,');
INSERT INTO verses VALUES (5100100002,51001,2,'به مقدّسان در کُولُسی و برادران امین در مسیح فیض و سلامتی از جانب پدر ما خدا و عیسی مسیح خداوند بر شما باد.','To the saints and faithful brethren in Christ which are at Colosse: Grace be unto you, and peace, from God our Father and the Lord Jesus Christ .');
INSERT INTO verses VALUES (5100100003,51001,3,'خدا و پدر خداوند خود عیسی مسیح را شکر می‌کنیم و پیوسته برای شما دعا می‌نماییم،','We give thanks to God and the Father of our Lord Jesus Christ , praying always for you,');
INSERT INTO verses VALUES (5100100004,51001,4,'چونکه ایمان شما را در مسیح عیسی و محبّتی را که با جمیع مقدّسان می‌نمایید شنیدیم،','Since we heard of your faith in Christ Jesus , and of the love which ye have to all the saints,');
INSERT INTO verses VALUES (5100100005,51001,5,'به‌سبب امیدی که بجهت شما در آسمان گذاشته شده است که خبر آن را در کلام راستی انجیل سابقاً شنیدید،','For the hope which is laid up for you in heaven, whereof ye heard before in the word of the truth of the gospel;');
INSERT INTO verses VALUES (5100100006,51001,6,'که به شما وارد شد چنانکه در تمامی عالم نیز و میوه می‌آورد و نمّو می‌کند، چنانکه در میان شما نیز از روزی که آن را شنیدید و فیض خدا را در راستی دانسته‌اید.','Which is come unto you, as it is in all the world; and bringeth forth fruit, as it doth also in you, since the day ye heard of it, and knew the grace of God in truth:');
INSERT INTO verses VALUES (5100100007,51001,7,'چنانکه از اِپَفْراس تعلیم یافتید که هم‌خدمت عزیز ما و خادم امین مسیح برای شما است.','As ye also learned of Epaphras our dear fellowservant, who is for you a faithful minister of Christ ;');
INSERT INTO verses VALUES (5100100008,51001,8,'و او ما را نیز از محبّت شما که در روح است خبر داد.','Who also declared unto us your love in the Spirit.');
INSERT INTO verses VALUES (5100100009,51001,9,'و از آن جهت ما نیز از روزی که این را شنیدیم، باز نمی‌ایستیم از دعا کردن برای شما و مسألت نمودن تا از کمال معرفت ارادهٔ او در هر حکمت و فهم روحانی پُر شوید،','For this cause we also, since the day we heard it, do not cease to pray for you, and to desire that ye might be filled with the knowledge of his will in all wisdom and spiritual understanding;');
INSERT INTO verses VALUES (5100100010,51001,10,'تا شما به طریق شایستهٔٔ خداوند به کمال رضامندی رفتار نمایید و در هر عمل نیکو بار آورید و به معرفت کامل خدا نمّو کنید،','That ye might walk worthy of the Lord unto all pleasing, being fruitful in every good work, and increasing in the knowledge of God;');
INSERT INTO verses VALUES (5100100011,51001,11,'و به اندازهٔ توانایی جلال او به قوّت تمام زورآور شوید تا صبر کامل و تحمّل را با شادمانی داشته باشید؛','Strengthened with all might, according to his glorious power, unto all patience and longsuffering with joyfulness;');
INSERT INTO verses VALUES (5100100012,51001,12,'و پدر را شکر گزارید که ما را لایق بهره میراث مقدّسان در نور گردانیده است،','Giving thanks unto the Father, which hath made us meet to be partakers of the inheritance of the saints in light:');
INSERT INTO verses VALUES (5100100013,51001,13,'و ما را از قدرت ظلمت رهانیده، به ملکوت پسر محبّت خود منتقل ساخت،','Who hath delivered us from the power of darkness, and hath translated us into the kingdom of his dear Son:');
INSERT INTO verses VALUES (5100100014,51001,14,'که در وی فدیهٔ خود، یعنی آمرزش گناهان خویش را یافته‌ایم.','In whom we have redemption through his blood, even the forgiveness of sins:');
INSERT INTO verses VALUES (5100100015,51001,15,'و او صورت خدای نادیده است، نخست‌زادهٔ تمامی آفریدگان.','Who is the image of the invisible God, the firstborn of every creature:');
INSERT INTO verses VALUES (5100100016,51001,16,'زیرا که در او همه‌چیز آفریده شد، آنچه در آسمان و آنچه بر زمین است از چیزهای دیدنی و نادیدنی و تختها و سلطنتها و ریاسات و قوّات؛ همه به‌وسیلهٔ او و برای او آفریده شد.','For by him were all things created, that are in heaven, and that are in earth, visible and invisible, whether they be thrones, or dominions, or principalities, or powers: all things were created by him, and for him:');
INSERT INTO verses VALUES (5100100017,51001,17,'و او قبل از همه است و در وی همه‌چیز قیام دارد.','And he is before all things, and by him all things consist.');
INSERT INTO verses VALUES (5100100018,51001,18,'و او بدن یعنی کلیسا را سر است، زیرا که او ابتدا است و نخست‌زاده از مردگان تا در همه‌چیز او مقدّم شود.','And he is the head of the body, the church: who is the beginning, the firstborn from the dead; that in all things he might have the preeminence.');
INSERT INTO verses VALUES (5100100019,51001,19,'زیرا خدا رضا بدین داد که تمامی پُری در او ساکن شود،','For it pleased the Father that in him should all fulness dwell;');
INSERT INTO verses VALUES (5100100020,51001,20,'و اینکه بوساطت او همه‌چیز را با خود مصالحه دهد، چونکه به خون صلیب وی سلامتی را پدید آورد. بلی به‌وسیلهٔ او خواه آنچه بر زمین و خواه آنچه در آسمان است.','And, having made peace through the blood of his cross, by him to reconcile all things unto himself; by him, I say, whether they be things in earth, or things in heaven.');
INSERT INTO verses VALUES (5100100021,51001,21,'و شما را که سابقاً از نیّت دل در اعمال بد خویش اجنبی و دشمن بودید، بالفعل مصالحه داده است،','And you, that were sometime alienated and enemies in your mind by wicked works, yet now hath he reconciled');
INSERT INTO verses VALUES (5100100022,51001,22,'در بدن بشریِ خود به‌وسیلهٔ موت تا شما را در حضور خود مقدّس و بی‌عیب و بی‌ملامت حاضر سازد،','In the body of his flesh through death, to present you holy and unblameable and unreproveable in his sight:');
INSERT INTO verses VALUES (5100100023,51001,23,'به شرطی که در ایمان بنیاد نهاده و قایم بمانید و جنبش نخورید از امید انجیل که در آن تعلیم یافته‌اید و به تمامی خلقتِ زیر آسمان بدان موعظه شده است و من پولُس خادم آن شده‌ام.','If ye continue in the faith grounded and settled, and be not moved away from the hope of the gospel, which ye have heard, and which was preached to every creature which is under heaven; whereof I Paul am made a minister;');
INSERT INTO verses VALUES (5100100024,51001,24,'الآن از زحمتهای خود در راه شما شادی می‌کنم و نقصهای زحمات مسیح را در بدن خود به کمال می‌رسانم برای بدن او که کلیسا است،','Who now rejoice in my sufferings for you, and fill up that which is behind of the afflictions of Christ in my flesh for his body''s sake, which is the church:');
INSERT INTO verses VALUES (5100100025,51001,25,'که من خادم آن گشته‌ام برحسب نظارت خدا که به من برای شما سپرده شد تا کلام خدا را به کمال رسانم؛','Whereof I am made a minister, according to the dispensation of God which is given to me for you, to fulfil the word of God;');
INSERT INTO verses VALUES (5100100026,51001,26,'یعنی آن سرّی که از دهرها و قرنها مخفی داشته شده بود، لیکن الحال به مقدّسان او مکشوف گردید،','Even the mystery which hath been hid from ages and from generations, but now is made manifest to his saints:');
INSERT INTO verses VALUES (5100100027,51001,27,'که خدا اراده نمود تا بشناساند که چیست دولت جلال این سرّ در میان امّت‌ها که آن مسیح در شما و امید جلال است.','To whom God would make known what is the riches of the glory of this mystery among the Gentiles; which is Christ in you, the hope of glory:');
INSERT INTO verses VALUES (5100100028,51001,28,'و ما او را اعلان می‌نماییم، در حالتی که هر شخص را تنبیه می‌کنیم و هر کس را به هر حکمت تعلیم می‌دهیم تا هرکس را کامل در مسیح عیسی حاضر سازیم.','Whom we preach, warning every man, and teaching every man in all wisdom; that we may present every man perfect in Christ Jesus :');
INSERT INTO verses VALUES (5100100029,51001,29,'و برای این نیز محنت می‌کشم و مجاهده می‌نمایم بحسب عمل او که در من به قوّت عمل می‌کند.','Whereunto I also labour, striving according to his working, which worketh in me mightily.');
id INTEGER PRIMARY KEY,
book_id INTEGER NOT NULL,
chapter_number INTEGER NOT NULL,
audio_local TEXT,
audio_online_fa TEXT,
audio_online_en TEXT
);
id INTEGER PRIMARY KEY,
chapter_id INTEGER NOT NULL,
verse_number INTEGER NOT NULL,
text_fa TEXT,
text_en TEXT
);
INSERT INTO chapters VALUES (52001,52,1,NULL,'http://audio1.wordfree.net/bibles/app/audio/20/52/1.mp3','http://audio1.wordfree.net/bibles/app/audio/20/52/1.mp3');
INSERT INTO verses VALUES (5200100001,52001,1,'span class="verse" id="1">1 </span پولُس و سِلْوانُس و تیموتاؤس، به کلیسای تَسّالونیکیان که در خدای پدر و عیسی مسیح خداوند می‌باشید. فیض و سلامتی از جانب پدر ما خدا و عیسی مسیح خداوند با شما باد.','span class="verse" id="1">1 </span Paul , and Silvanus, and Timotheus, unto the church of the Thessalonians which is in God the Father and in the Lord Jesus Christ : Grace be unto you, and peace, from God our Father, and the Lord Jesus Christ .');
INSERT INTO verses VALUES (5200100002,52001,2,'پیوسته دربارهٔ جمیع شما خدا را شکر می‌کنیم و دائماً در دعاهای خود شما را ذکر می‌نماییم،','We give thanks to God always for you all, making mention of you in our prayers;');
INSERT INTO verses VALUES (5200100003,52001,3,'چون اعمالِ ایمانِ شما و محنتِ محبّت و صبر امید شما را در خداوند ما عیسی مسیح در حضور خدا و پدر خود یاد می‌کنیم.','Remembering without ceasing your work of faith, and labour of love, and patience of hope in our Lord Jesus Christ , in the sight of God and our Father;');
INSERT INTO verses VALUES (5200100004,52001,4,'زیرا که ای برادران و ای عزیزانِ خدا، از برگزیده‌شدنِ شما مطلّع هستیم،','Knowing, brethren beloved, your election of God.');
INSERT INTO verses VALUES (5200100005,52001,5,'زیرا که انجیل ما بر شما محض سخن وارد نشده، بلکه با قوّت و روح‌القدس و یقین کامل، چنانکه می‌دانید که در میان شما بخاطر شما چگونه مردمان شدیم.','For our gospel came not unto you in word only, but also in power, and in the Holy Ghost, and in much assurance; as ye know what manner of men we were among you for your sake.');
INSERT INTO verses VALUES (5200100006,52001,6,'و شما به ما و به خداوند اقتدا نمودید و کلام را در زحمتِ شَدید، با خوشیِ روح‌القدس پذیرفتید،','And ye became followers of us, and of the Lord, having received the word in much affliction, with joy of the Holy Ghost:');
INSERT INTO verses VALUES (5200100007,52001,7,'به حدّی که شما جمیع ایمانداران مکادونیه و اَخائیه را نمونه شدید،','So that ye were ensamples to all that believe in Macedonia and Achaia.');
INSERT INTO verses VALUES (5200100008,52001,8,'به نوعی که از شما کلام خداوند نه فقط در مَکادونیه و اَخائیه نواخته شد، بلکه در هرجا ایمان شما به خدا شیوع یافت، به قسمی که احتیاج نیست که ما چیزی بگوییم','For from you sounded out the word of the Lord not only in Macedonia and Achaia, but also in every place your faith to God-ward is spread abroad; so that we need not to speak any thing.');
INSERT INTO verses VALUES (5200100009,52001,9,'زیرا خود ایشان دربارهٔ ما خبر می‌دهند که چه قسم وارد به شما شدیم و به چه نوع شما از بتها به سوی خدا بازگشت کردید تا خدای حیِّ حقیقی را بندگی نمایید،','For they themselves shew of us what manner of entering in we had unto you, and how ye turned to God from idols to serve the living and true God;');
INSERT INTO verses VALUES (5200100010,52001,10,'و تا پسر او را از آسمان انتظار بکشید که او را از مردگان برخیزانید، یعنی عیسی که ما را از غضب آینده می‌رهاند.','And to wait for his Son from heaven, whom he raised from the dead, even Jesus , which delivered us from the wrath to come.');
id INTEGER PRIMARY KEY,
book_id INTEGER NOT NULL,
chapter_number INTEGER NOT NULL,
audio_local TEXT,
audio_online_fa TEXT,
audio_online_en TEXT
);
id INTEGER PRIMARY KEY,
chapter_id INTEGER NOT NULL,
verse_number INTEGER NOT NULL,
text_fa TEXT,
text_en TEXT
);
INSERT INTO chapters VALUES (53001,53,1,NULL,'http://audio1.wordfree.net/bibles/app/audio/20/53/1.mp3','http://audio1.wordfree.net/bibles/app/audio/20/53/1.mp3');
INSERT INTO verses VALUES (5300100001,53001,1,'span class="verse" id="1">1 </span پولُس و سِلْوانُس و تیموتاؤس، به کلیسای تسالونیکیان که در خدای پدر ما و عیسی مسیح خداوند می‌باشید.','span class="verse" id="1">1 </span Paul , and Silvanus, and Timotheus, unto the church of the Thessalonians in God our Father and the Lord Jesus Christ :');
INSERT INTO verses VALUES (5300100002,53001,2,'فیض و سلامتی از جانب پدر ما خدا و عیسی مسیح خداوند بر شما باد.','Grace unto you, and peace, from God our Father and the Lord Jesus Christ .');
INSERT INTO verses VALUES (5300100003,53001,3,'ای برادران، می‌باید همیشه بجهت شما خدا را شکر کنیم، چنانکه سزاوار است، از آنجا که ایمان شما بغایت نمّو می‌کند و محبّت هر یکی از شما جمیعاً با همدیگر می‌افزاید،','We are bound to thank God always for you, brethren, as it is meet, because that your faith groweth exceedingly, and the charity of every one of you all toward each other aboundeth;');
INSERT INTO verses VALUES (5300100004,53001,4,'به‌حدّی که خود ما در خصوص شما در کلیساهای خدا فخر می‌کنیم به‌سبب صبر و ایمانتان در همهٔ مصایب شما و عذابهایی که متحمّل آنها می‌شوید،','So that we ourselves glory in you in the churches of God for your patience and faith in all your persecutions and tribulations that ye endure:');
INSERT INTO verses VALUES (5300100005,53001,5,'که دلیل است بر داوری عادلِ خدا تا شما مستحقّ ملکوت خدا بشوید که برای آن هم زحمت می‌کشید.','Which is a manifest token of the righteous judgment of God, that ye may be counted worthy of the kingdom of God, for which ye also suffer:');
INSERT INTO verses VALUES (5300100006,53001,6,'زیرا که این انصاف است نزد خدا که عذاب‌کنندگانِ شما را عذاب دهد.','Seeing it is a righteous thing with God to recompense tribulation to them that trouble you;');
INSERT INTO verses VALUES (5300100007,53001,7,'و شما را که عذاب می‌کشید، با ما راحت بخشد در هنگامی که عیسی خداوند از آسمان با فرشتگان قوّت خود ظهور خواهد نمود','And to you who are troubled rest with us, when the Lord Jesus shall be revealed from heaven with his mighty angels,');
INSERT INTO verses VALUES (5300100008,53001,8,'در آتش مشتعل و انتقام خواهد کشید از آنانی که خدا را نمی‌شناسند و انجیل خداوند ما عیسی مسیح را اطاعت نمی‌کنند،','In flaming fire taking vengeance on them that know not God, and that obey not the gospel of our Lord Jesus Christ :');
INSERT INTO verses VALUES (5300100009,53001,9,'که ایشان به قصاص هلاکت جاودانی خواهند رسید از حضور خداوند و جلال قوّت او','Who shall be punished with everlasting destruction from the presence of the Lord, and from the glory of his power;');
INSERT INTO verses VALUES (5300100010,53001,10,'هنگامی که آید تا در مقدّسان خود جلال یابد و در همهٔ ایمانداران از او تعجّب کنند در آن روز، زیرا که شما شهادت ما را تصدیق کردید.','When he shall come to be glorified in his saints, and to be admired in all them that believe (because our testimony among you was believed) in that day.');
INSERT INTO verses VALUES (5300100011,53001,11,'و برای این هم پیوسته بجهت شما دعا می‌کنیم که خدای ما شما را مستحقّ این دعوت شمارد و تمام مسرّت نیکویی و عمل ایمان را با قوّت کامل گرداند،','Wherefore also we pray always for you, that our God would count you worthy of this calling, and fulfil all the good pleasure of his goodness, and the work of faith with power:');
INSERT INTO verses VALUES (5300100012,53001,12,'تا نام خداوند ما عیسی مسیح در شما تمجید یابد و شما در وی بحسب فیض خدای ما و عیسی مسیح خداوند.','That the name of our Lord Jesus Christ may be glorified in you, and ye in him, according to the grace of our God and the Lord Jesus Christ .');
id INTEGER PRIMARY KEY,
book_id INTEGER NOT NULL,
chapter_number INTEGER NOT NULL,
audio_local TEXT,
audio_online_fa TEXT,
audio_online_en TEXT
);
id INTEGER PRIMARY KEY,
chapter_id INTEGER NOT NULL,
verse_number INTEGER NOT NULL,
text_fa TEXT,
text_en TEXT
);
INSERT INTO chapters VALUES (54001,54,1,NULL,'http://audio1.wordfree.net/bibles/app/audio/20/54/1.mp3','http://audio1.wordfree.net/bibles/app/audio/20/54/1.mp3');
INSERT INTO verses VALUES (5400100001,54001,1,'span class="verse" id="1">1 </span پولُس، رسول عیسی مسیح به حکم نجات‌دهندهٔ ما خدا و مسیح عیسی خداوند که امید ما است،','span class="verse" id="1">1 </span Paul , an apostle of Jesus Christ by the commandment of God our Saviour, and Lord Jesus Christ , which is our hope;');
INSERT INTO verses VALUES (5400100002,54001,2,'به فرزند حقیقی خود در ایمان، تیموتاؤس. فیض و رحم و سلامتی از جانب خدای پدر و خداوند ما مسیح عیسی بر تو باد.','Unto Timothy , my own son in the faith: Grace, mercy, and peace, from God our Father and Jesus Christ our Lord.');
INSERT INTO verses VALUES (5400100003,54001,3,'چنانکه هنگامی که عازم مکادونیه بودم، به شما التماس نمودم که در اَفَسُس بمانی تا بعضی را امر کنی که تعلیمی دیگر ندهند،','As I besought thee to abide still at Ephesus, when I went into Macedonia , that thou mightest charge some that they teach no other doctrine,');
INSERT INTO verses VALUES (5400100004,54001,4,'و افسانه‌ها و نسب‌نامه‌های نامتناهی را اِصغا ننمایند، که اینها مباحثات را نه آن تعمیر الهی را که در ایمان است پدید می‌آورد.','Neither give heed to fables and endless genealogies, which minister questions, rather than godly edifying which is in faith: so do.');
INSERT INTO verses VALUES (5400100005,54001,5,'امّا غایتِ حکم، محبّت است از دل پاک و ضمیر صالح و ایمان بی‌ریا.','Now the end of the commandment is charity out of a pure heart, and of a good conscience, and of faith unfeigned:');
INSERT INTO verses VALUES (5400100006,54001,6,'که از این امور بعضی منحرف گشته به بیهوده‌گویی توجّه نموده‌اند،','From which some having swerved have turned aside unto vain jangling;');
INSERT INTO verses VALUES (5400100007,54001,7,'و می‌خواهند معلمان شریعت بشوند، و حال آنکه نمی‌فهمند آنچه می‌گویند و نه آنچه به تأکید اظهار می‌نمایند.','Desiring to be teachers of the law; understanding neither what they say, nor whereof they affirm.');
INSERT INTO verses VALUES (5400100008,54001,8,'لیکن می‌دانیم که شریعت نیکو است اگر کسی آن را برحسب شریعت بکار بَرَد.','But we know that the law is good, if a man use it lawfully;');
INSERT INTO verses VALUES (5400100009,54001,9,'و این بداند که شریعت بجهت عادل موضوع نمی‌شود، بلکه برای سرکشان و طاغیان و بی‌دینان و گناهکاران و ناپاکان و حرامکاران و قاتلان پدر و قاتلان مادر و قاتلان مردم','Knowing this, that the law is not made for a righteous man, but for the lawless and disobedient, for the ungodly and for sinners, for unholy and profane, for murderers of fathers and murderers of mothers, for manslayers,');
INSERT INTO verses VALUES (5400100010,54001,10,'و زانیان و لوّاطان و مردم‌دزدان و دروغ‌گویان و قسم‌دروغ‌خوران و برای هر عمل دیگری که برخلاف تعلیم صحیح باشد،','For whoremongers, for them that defile themselves with mankind, for menstealers, for liars, for perjured persons, and if there be any other thing that is contrary to sound doctrine;');
INSERT INTO verses VALUES (5400100011,54001,11,'برحسب انجیل جلال خدای متبارک که به من سپرده شده است.','According to the glorious gospel of the blessed God, which was committed to my trust.');
INSERT INTO verses VALUES (5400100012,54001,12,'و شکر می‌کنم خداوند خود مسیح عیسی را که مرا تقویت داد، چونکه امین شمرده، به این خدمتم ممتاز فرمود،','And I thank Christ Jesus our Lord, who hath enabled me, for that he counted me faithful, putting me into the ministry;');
INSERT INTO verses VALUES (5400100013,54001,13,'که سابقاً کفرگو و مضّر و سَقَط‌گو بودم، لیکن رحم یافتم، از آنرو که از جهالت در بی‌ایمانی کردم.','Who was before a blasphemer, and a persecutor, and injurious: but I obtained mercy, because I did it ignorantly in unbelief.');
INSERT INTO verses VALUES (5400100014,54001,14,'امّا فیض خداوند ما بی‌نهایت افزود با ایمان و محبّتی که در مسیح عیسی است.','And the grace of our Lord was exceeding abundant with faith and love which is in Christ Jesus .');
INSERT INTO verses VALUES (5400100015,54001,15,'این سخن امین است و لایق قبول تامّ که مسیح عیسی به دنیا آمد تا گناهکاران را نجات بخشد که من بزرگترین آنها هستم.','This is a faithful saying, and worthy of all acceptation, that Christ Jesus came into the world to save sinners; of whom I am chief.');
INSERT INTO verses VALUES (5400100016,54001,16,'بلکه از این جهت بر من رحم شد تا اوّل در من، مسیح عیسی کمال حلم را ظاهر سازد، تا آنانی را که بجهت حیات جاودانی به وی ایمان خواهند آورد، نمونه باشم.','Howbeit for this cause I obtained mercy, that in me first Jesus Christ might shew forth all longsuffering, for a pattern to them which should hereafter believe on him to life everlasting.');
INSERT INTO verses VALUES (5400100017,54001,17,'باری پادشاه سَرمَدی و باقی و نادیده را، خدای حکیم وحید را اکرام و جلال تا ابدالآباد باد. آمین.','Now unto the King eternal, immortal, invisible, the only wise God, be honour and glory for ever and ever. Amen.');
INSERT INTO verses VALUES (5400100018,54001,18,'ای فرزند تیموتاؤس، این وصیّت را به تو می‌سپارم برحسب نبوّتهایی که سابقاً بر تو شد تا در آنها جنگِ نیکو کنی،','This charge I commit unto thee, son Timothy , according to the prophecies which went before on thee, that thou by them mightest war a good warfare;');
INSERT INTO verses VALUES (5400100019,54001,19,'و ایمان و ضمیر صالح را نگاه داری، که بعضی این را از خود دور انداخته، مر ایمان را شکسته‌کشتی شدند.','Holding faith, and a good conscience; which some having put away concerning faith have made shipwreck:');
INSERT INTO verses VALUES (5400100020,54001,20,'که از آن جمله هیمیناؤس و اسکندر می‌باشند که ایشان را به شیطان سپردم تا تأدیب شده، دیگر کفر نگویند.','Of whom is Hymenaeus and Alexander; whom I have delivered unto Satan , that they may learn not to blaspheme.');
id INTEGER PRIMARY KEY,
book_id INTEGER NOT NULL,
chapter_number INTEGER NOT NULL,
audio_local TEXT,
audio_online_fa TEXT,
audio_online_en TEXT
);
id INTEGER PRIMARY KEY,
chapter_id INTEGER NOT NULL,
verse_number INTEGER NOT NULL,
text_fa TEXT,
text_en TEXT
);
INSERT INTO chapters VALUES (55001,55,1,NULL,'http://audio1.wordfree.net/bibles/app/audio/20/55/1.mp3','http://audio1.wordfree.net/bibles/app/audio/20/55/1.mp3');
INSERT INTO verses VALUES (5500100001,55001,1,'span class="verse" id="1">1 </span پولُس، به ارادهٔ خدا رسولِ مسیح عیسی، برحسب وعدهٔٔ حیاتی که در مسیح عیسی است،','span class="verse" id="1">1 </span Paul , an apostle of Jesus Christ by the will of God, according to the promise of life which is in Christ Jesus ,');
INSERT INTO verses VALUES (5500100002,55001,2,'فرزند حبیب خود تیموتاؤس را فیض و رحمت و سلامتی از جانب خدای پدر و خداوند ما عیسی مسیح باد.','To Timothy , my dearly beloved son: Grace, mercy, and peace, from God the Father and Christ Jesus our Lord.');
INSERT INTO verses VALUES (5500100003,55001,3,'شکر می‌کنم آن خدایی را که از اجداد خود به ضمیر خالص بندگی او را می‌کنم، چونکه دائماً در دعاهای خود تو را شبانه‌روز یاد می‌کنم،','I thank God, whom I serve from my forefathers with pure conscience, that without ceasing I have remembrance of thee in my prayers night and day;');
INSERT INTO verses VALUES (5500100004,55001,4,'و مشتاق ملاقات تو هستم، چونکه اشکهای تو را بخاطر می‌دارم تا از خوشی سیر شوم.','Greatly desiring to see thee, being mindful of thy tears, that I may be filled with joy;');
INSERT INTO verses VALUES (5500100005,55001,5,'زیرا که یاد می‌دارم ایمان بی‌ریای تو را که نخست در جدّه‌ات لوئیس و مادرت افنیکی ساکن می‌بود و مرا یقین است که در تو نیز هست.','When I call to remembrance the unfeigned faith that is in thee, which dwelt first in thy grandmother Lois, and thy mother Eunice; and I am persuaded that in thee also.');
INSERT INTO verses VALUES (5500100006,55001,6,'لهذا به یاد تو می‌آورم که آن عطای خدا را که به‌وسیلهٔ گذاشتن دستهای من بر تو است برافروزی.','Wherefore I put thee in remembrance that thou stir up the gift of God, which is in thee by the putting on of my hands.');
INSERT INTO verses VALUES (5500100007,55001,7,'زیرا خدا روح جبن را به ما نداده است بلکه روح قوّت و محبّت و تأدیب را.','For God hath not given us the spirit of fear; but of power, and of love, and of a sound mind.');
INSERT INTO verses VALUES (5500100008,55001,8,'پس از شهادت خداوند ما عار مدار و نه از من که اسیر او می‌باشم، بلکه در زحمات انجیل شریک باش، برحسب قوّت خدا،','Be not thou therefore ashamed of the testimony of our Lord, nor of me his prisoner: but be thou partaker of the afflictions of the gospel according to the power of God;');
INSERT INTO verses VALUES (5500100009,55001,9,'که ما را نجات داد و به دعوت مقدّس خواند، نه به حسب اعمال ما، بلکه برحسب ارادهٔ خود و آن فیضی که قبل از قدیم‌الایّام در مسیح عیسی به ما عطا شد.','Who hath saved us, and called us with an holy calling, not according to our works, but according to his own purpose and grace, which was given us in Christ Jesus before the world began,');
INSERT INTO verses VALUES (5500100010,55001,10,'امّا الحال آشکار گردید به ظهور نجات‌دهندهٔ ما عیسی مسیح که موت را نیست ساخت و حیات و بی‌فسادی را روشن گردانید به‌وسیلهٔ انجیل،','But is now made manifest by the appearing of our Saviour Jesus Christ , who hath abolished death, and hath brought life and immortality to light through the gospel:');
INSERT INTO verses VALUES (5500100011,55001,11,'که برای آن من واعظ و رسول و معلّمِ امّت‌ها مقرّر شده‌ام.','Whereunto I am appointed a preacher, and an apostle, and a teacher of the Gentiles.');
INSERT INTO verses VALUES (5500100012,55001,12,'و از این جهت این زحمات را می‌کشم بلکه عار ندارم، چون می‌دانم به که ایمان آوردم و مرا یقین است که او قادر است که امانت مرا تا به آن روز حفظ کند.','For the which cause I also suffer these things: nevertheless I am not ashamed: for I know whom I have believed, and am persuaded that he is able to keep that which I have committed unto him against that day.');
INSERT INTO verses VALUES (5500100013,55001,13,'نمونه‌ای بگیر از سخنان صحیح که از من شنیدی در ایمان و محبّتی که در مسیح عیسی است.','Hold fast the form of sound words, which thou hast heard of me, in faith and love which is in Christ Jesus .');
INSERT INTO verses VALUES (5500100014,55001,14,'آن امانت نیکو را به‌وسیلهٔ روح‌القدس که در ما ساکن است، حفظ کن.','That good thing which was committed unto thee keep by the Holy Ghost which dwelleth in us.');
INSERT INTO verses VALUES (5500100015,55001,15,'از این آگاه هستی که همهٔ آنانی که در آسیا هستند، از من رخ تافته‌اند، که از آن جمله فیجِلُس و هَرمُوجَنِس می‌باشند.','This thou knowest, that all they which are in Asia be turned away from me; of whom are Phygellus and Hermogenes.');
INSERT INTO verses VALUES (5500100016,55001,16,'خداوند اهل خانهٔ اُنیسیفورُس را ترحم کند زیرا که او بارها دل مرا تازه کرد و از زنجیر من عار نداشت،','The Lord give mercy unto the house of Onesiphorus; for he oft refreshed me, and was not ashamed of my chain:');
INSERT INTO verses VALUES (5500100017,55001,17,'بلکه چون به روم رسید، مرا به کوشش بسیار تفحّص کرده، پیدا نمود.','But, when he was in Rome, he sought me out very diligently, and found me.');
INSERT INTO verses VALUES (5500100018,55001,18,'(خداوند بدو عطا کند که در آن روز در حضور خداوند رحمت یابد.) و خدمتهایی را که در اَفَسُس کرد تو بهتر می‌دانی.','The Lord grant unto him that he may find mercy of the Lord in that day: and in how many things he ministered unto me at Ephesus, thou knowest very well.');
id INTEGER PRIMARY KEY,
book_id INTEGER NOT NULL,
chapter_number INTEGER NOT NULL,
audio_local TEXT,
audio_online_fa TEXT,
audio_online_en TEXT
);
id INTEGER PRIMARY KEY,
chapter_id INTEGER NOT NULL,
verse_number INTEGER NOT NULL,
text_fa TEXT,
text_en TEXT
);
INSERT INTO chapters VALUES (56001,56,1,NULL,'http://audio1.wordfree.net/bibles/app/audio/20/56/1.mp3','http://audio1.wordfree.net/bibles/app/audio/20/56/1.mp3');
INSERT INTO verses VALUES (5600100001,56001,1,'span class="verse" id="1">1 </span پولُس، غلام خدا و رسول عیسی مسیح برحسب ایمان برگزیدگانِ خدا و معرفت آن راستی که در دینداری است،','span class="verse" id="1">1 </span Paul , a servant of God, and an apostle of Jesus Christ , according to the faith of God''s elect, and the acknowledging of the truth which is after godliness;');
INSERT INTO verses VALUES (5600100002,56001,2,'به امید حیات جاودانی که خدایی که دروغ نمی‌تواند گفت، از زمانهای ازلی وعدهٔ آن را داد،','In hope of eternal life, which God, that cannot lie, promised before the world began;');
INSERT INTO verses VALUES (5600100003,56001,3,'امّا در زمان معیّن، کلام خود را ظاهر کرد به موعظه‌ای که برحسب حکم نجات‌دهندهٔ ما خدا به من سپرده شد،','But hath in due times manifested his word through preaching, which is committed unto me according to the commandment of God our Saviour;');
INSERT INTO verses VALUES (5600100004,56001,4,'تیطُس را که فرزند حقیقی من برحسب ایمان عاّم است، فیض و رحمت و سلامتی از جانب خدای پدر و نجات‌دهندهٔ ما عیسی مسیح خداوند باد.','To Titus, mine own son after the common faith: Grace, mercy, and peace, from God the Father and the Lord Jesus Christ our Saviour.');
INSERT INTO verses VALUES (5600100005,56001,5,'بدین جهت تو را در کریت واگذاشتم، تا آنچه را که باقی مانده است اصلاح نمایی و چنانکه من به تو امر نمودم، کشیشان در هر شهر مقرّر کنی.','For this cause left I thee in Crete, that thou shouldest set in order the things that are wanting, and ordain elders in every city, as I had appointed thee:');
INSERT INTO verses VALUES (5600100006,56001,6,'اگر کسی بی‌ملامت، و شوهر یک زن باشد که فرزندان مؤمن دارد، بَری از تهمتِ فجور و تمرّد،','If any be blameless, the husband of one wife, having faithful children not accused of riot or unruly.');
INSERT INTO verses VALUES (5600100007,56001,7,'زیرا که اُسْقُفْ می‌باید چون وکیل خدا بی‌ملامت باشد، و خودرأی یا تندمزاج یا می‌گسار یا زننده یا طمّاع سود قبیح نباشد،','For a bishop must be blameless, as the steward of God; not selfwilled, not soon angry, not given to wine, no striker, not given to filthy lucre;');
INSERT INTO verses VALUES (5600100008,56001,8,'بلکه مهمان‌دوست و خیردوست و خرد اندیش و عادل و مقدّس و پرهیزکار؛','But a lover of hospitality, a lover of good men, sober, just, holy, temperate;');
INSERT INTO verses VALUES (5600100009,56001,9,'و مُتِمَسِّک به کلامِ امین برحسب تعلیمی که یافته، تا بتواند به تعلیم صحیح نصیحت کند و مخالفان را توبیخ نماید.','Holding fast the faithful word as he hath been taught, that he may be able by sound doctrine both to exhort and to convince the gainsayers.');
INSERT INTO verses VALUES (5600100010,56001,10,'زیرا که یاوه‌گویان و فریبندگان، بسیار و مُتمرّد می‌باشند، علی‌الخصوص آنانی که از اهل ختنه هستند؛','For there are many unruly and vain talkers and deceivers, specially they of the circumcision:');
INSERT INTO verses VALUES (5600100011,56001,11,'که دهان ایشان را باید بست زیرا خانه‌ها را بالکّل واژگون می‌سازند و برای سود قبیح، تعالیم ناشایسته می‌دهند.','Whose mouths must be stopped, who subvert whole houses, teaching things which they ought not, for filthy lucre''s sake.');
INSERT INTO verses VALUES (5600100012,56001,12,'یکی از ایشان که نبّی خاصّ ایشان است، گفته است که، اهل کریت همیشه دروغگو و وحوش شریر و شکم‌پرست بیکاره می‌باشند.','One of themselves, even a prophet of their own, said, The Cretians are alway liars, evil beasts, slow bellies.');
INSERT INTO verses VALUES (5600100013,56001,13,'این شهادت راست است؛ از این جهت ایشان را به سختی توبیخ فرما تا در ایمان، صحیح باشند،','This witness is true. Wherefore rebuke them sharply, that they may be sound in the faith;');
INSERT INTO verses VALUES (5600100014,56001,14,'و گوش نگیرند به افسانه‌های یهود و احکام مردمانی که از راستی انحراف می‌جویند.','Not giving heed to Jewish fables, and commandments of men, that turn from the truth.');
INSERT INTO verses VALUES (5600100015,56001,15,'هرچیز برای پاکان پاک است، لیکن آلودگان و بی‌ایمانان را هیچ‌چیز پاک نیست، بلکه فهم و ضمیر ایشان نیز ملوّث است؛','Unto the pure all things are pure: but unto them that are defiled and unbelieving is nothing pure; but even their mind and conscience is defiled.');
INSERT INTO verses VALUES (5600100016,56001,16,'مدّعیِ معرفت خدا می‌باشند، امّا به افعال خود او را انکار می‌کنند، چونکه مکروه و متمرّد هستند و بجهت هر عمل نیکو مردود.','They profess that they know God; but in works they deny him, being abominable, and disobedient, and unto every good work reprobate.');
id INTEGER PRIMARY KEY,
book_id INTEGER NOT NULL,
chapter_number INTEGER NOT NULL,
audio_local TEXT,
audio_online_fa TEXT,
audio_online_en TEXT
);
id INTEGER PRIMARY KEY,
chapter_id INTEGER NOT NULL,
verse_number INTEGER NOT NULL,
text_fa TEXT,
text_en TEXT
);
INSERT INTO chapters VALUES (57001,57,1,NULL,'http://audio1.wordfree.net/bibles/app/audio/20/57/1.mp3','http://audio1.wordfree.net/bibles/app/audio/20/57/1.mp3');
INSERT INTO verses VALUES (5700100001,57001,1,'span class="verse" id="1">1 </span پولُس، اسیر مسیح عیسی و تیمؤتاؤس برادر، به فِلیمون عزیز و همکار ما،','span class="verse" id="1">1 </span Paul , a prisoner of Jesus Christ , and Timothy our brother, unto Philemon our dearly beloved, and fellowlabourer,');
INSERT INTO verses VALUES (5700100002,57001,2,'و به اَپْفِیّهٔ محبوبه و اَرْخِپُّس هم‌سپاه ما و به کلیسایی که در خانه‌ات می‌باشد:','And to our beloved Apphia, and Archippus our fellowsoldier, and to the church in thy house:');
INSERT INTO verses VALUES (5700100003,57001,3,'فیض و سلامتی از جانب پدر ما خدا و عیسی مسیح خداوند با شما باد.','Grace to you, and peace, from God our Father and the Lord Jesus Christ .');
INSERT INTO verses VALUES (5700100004,57001,4,'خدای خود را شکر می‌کنم و پیوسته تو را در دعاهای خود یاد می‌آورم،','I thank my God, making mention of thee always in my prayers,');
INSERT INTO verses VALUES (5700100005,57001,5,'چونکه ذکر محبّت و ایمان تو را شنیده‌ام که به عیسی خداوند و به همهٔ مقدّسین داری،','Hearing of thy love and faith, which thou hast toward the Lord Jesus , and toward all saints;');
INSERT INTO verses VALUES (5700100006,57001,6,'تا شراکت ایمانت مؤثّر شود در معرفتِ کاملِ هر نیکویی که در ما است برای مسیحْ عیسی.','That the communication of thy faith may become effectual by the acknowledging of every good thing which is in you in Christ Jesus .');
INSERT INTO verses VALUES (5700100007,57001,7,'زیرا که مرا خوشیِ کامل و تسلّی رخ نمود از محبّت تو، از آنرو که دلهای مقدّسین از تو ای برادر استراحت می‌پذیرند.','For we have great joy and consolation in thy love, because the bowels of the saints are refreshed by thee, brother.');
INSERT INTO verses VALUES (5700100008,57001,8,'بدین جهت، هرچند در مسیح کمال جسارت را دارم که به آنچه مناسب است تو را حکم دهم،','Wherefore, though I might be much bold in Christ to enjoin thee that which is convenient,');
INSERT INTO verses VALUES (5700100009,57001,9,'لیکن برای محبّت، سزاوارتر آن است که التماس نمایم، هرچند مردی چون پولُسِ پیر و الآن اسیر مسیح عیسی نیز می‌باشم.','Yet for love''s sake I rather beseech thee, being such an one as Paul the aged, and now also a prisoner of Jesus Christ .');
INSERT INTO verses VALUES (5700100010,57001,10,'پس تو را التماس می‌کنم دربارهٔٔ فرزند خود اُنیسیمُس، که در زنجیرهای خود او را تولید نمودم،','I beseech thee for my son Onesimus, whom I have begotten in my bonds:');
INSERT INTO verses VALUES (5700100011,57001,11,'که سابقاً او برای تو بی‌فایده بود، لیکن الحال تو را و مرا فایده‌مند می‌باشد؛','Which in time past was to thee unprofitable, but now profitable to thee and to me:');
INSERT INTO verses VALUES (5700100012,57001,12,'که او را نزد تو پس می‌فرستم. پس تو او را بپذیر، که جان من است.','Whom I have sent again: thou therefore receive him, that is, mine own bowels:');
INSERT INTO verses VALUES (5700100013,57001,13,'و من می‌خواستم که او را نزد خود نگاه دارم، تا به عوض تو مرا در زنجیرهای انجیل خدمت کند،','Whom I would have retained with me, that in thy stead he might have ministered unto me in the bonds of the gospel:');
INSERT INTO verses VALUES (5700100014,57001,14,'امّا نخواستم کاری بدون رأی تو کرده باشم، تا احسان تو از راه اضطرار نباشد، بلکه از روی اختیار.','But without thy mind would I do nothing; that thy benefit should not be as it were of necessity, but willingly.');
INSERT INTO verses VALUES (5700100015,57001,15,'زیرا که شاید بدین‌جهت ساعتی از تو جدا شد، تا او را تا به ابد دریابی.','For perhaps he therefore departed for a season, that thou shouldest receive him for ever;');
INSERT INTO verses VALUES (5700100016,57001,16,'لیکن بعد از این نه چون غلام، بلکه فوق از غلام، یعنی برادر عزیز خصوصاً به من، امّا چند مرتبه زیادتر به تو، هم در جسم و هم در خداوند.','Not now as a servant, but above a servant, a brother beloved, specially to me, but how much more unto thee, both in the flesh, and in the Lord?');
INSERT INTO verses VALUES (5700100017,57001,17,'پس هرگاه مرا رفیق می‌دانی، او را چون من قبول فرما.','If thou count me therefore a partner, receive him as myself.');
INSERT INTO verses VALUES (5700100018,57001,18,'امّا اگر ضرری به تو رسانیده باشد یا طلبی از او داشته باشی، آن را بر من محسوب دار.','If he hath wronged thee, or oweth thee ought, put that on mine account;');
INSERT INTO verses VALUES (5700100019,57001,19,'من که پولُس هستم، به دست خود می‌نویسم، خود ادا خواهم کرد، تا به تو نگویم که به جان خود نیز مدیون من هستی.','I Paul have written it with mine own hand, I will repay it: albeit I do not say to thee how thou owest unto me even thine own self besides.');
INSERT INTO verses VALUES (5700100020,57001,20,'بلی، ای برادر، تا من از تو در خداوند برخوردار شوم. پس جان مرا در مسیح تازگی بده.','Yea, brother, let me have joy of thee in the Lord: refresh my bowels in the Lord.');
INSERT INTO verses VALUES (5700100021,57001,21,'چون بر اطاعت تو اعتماد دارم به تو می‌نویسم، از آن‌جهت که می‌دانم بیشتر از آنچه می‌گویم هم خواهی کرد.','Having confidence in thy obedience I wrote unto thee, knowing that thou wilt also do more than I say.');
INSERT INTO verses VALUES (5700100022,57001,22,'معهذا منزلی نیز برای من حاضر کن، زیرا که امیدوارم از دعاهای شما به شما بخشیده شوم.','But withal prepare me also a lodging: for I trust that through your prayers I shall be given unto you.');
INSERT INTO verses VALUES (5700100023,57001,23,'اِپَفْراس که در مسیح عیسی همزندان من است، و مرقُس','There salute thee Epaphras, my fellowprisoner in Christ Jesus ;');
INSERT INTO verses VALUES (5700100024,57001,24,'و اَرِسْتَرخُس و دیماس و لوقا همکاران من تو را سلام می‌رسانند.','Marcus, Aristarchus, Demas, Lucas, my fellowlabourers.');
INSERT INTO verses VALUES (5700100025,57001,25,'فیض خداوند ما عیسی مسیح با روح شما باد. آمین.','The grace of our Lord Jesus Christ be with your spirit. Amen.');
id INTEGER PRIMARY KEY,
book_id INTEGER NOT NULL,
chapter_number INTEGER NOT NULL,
audio_local TEXT,
audio_online_fa TEXT,
audio_online_en TEXT
);
id INTEGER PRIMARY KEY,
chapter_id INTEGER NOT NULL,
verse_number INTEGER NOT NULL,
text_fa TEXT,
text_en TEXT
);
INSERT INTO chapters VALUES (58001,58,1,NULL,'http://audio1.wordfree.net/bibles/app/audio/20/58/1.mp3','http://audio1.wordfree.net/bibles/app/audio/20/58/1.mp3');
INSERT INTO verses VALUES (5800100001,58001,1,'span class="verse" id="1">1 </span خدا، که در زمانِ سَلَف به اقسام متعدّد و طریق‌های مختلف بوساطت انبیا به پدران ما تکلّم نمود،','span class="verse" id="1">1 </span God, who at sundry times and in divers manners spake in time past unto the fathers by the prophets,');
INSERT INTO verses VALUES (5800100002,58001,2,'در این ایّام آخر به ما بوساطت پسر خود متکلّم شد، که او را وارث جمیع موجودات قرار داد، و به‌وسیلهٔ او عالمها را آفرید؛','Hath in these last days spoken unto us by his Son, whom he hath appointed heir of all things, by whom also he made the worlds;');
INSERT INTO verses VALUES (5800100003,58001,3,'که فروغ جلالش و خاتم جوهرش بوده و به کلمهٔ قوّت خود حامل همهٔ موجودات بوده، چون طهارت گناهان را به اتمام رسانید، به دست راست کبریا در اعلی‌علّییّن بنشست؛','Who being the brightness of his glory, and the express image of his person, and upholding all things by the word of his power, when he had by himself purged our sins, sat down on the right hand of the Majesty on high;');
INSERT INTO verses VALUES (5800100004,58001,4,'و از فرشتگان افضال گردید، به مقدار آنکه اسمی بزرگتر از ایشان به میراث یافته بود.','Being made so much better than the angels, as he hath by inheritance obtained a more excellent name than they.');
INSERT INTO verses VALUES (5800100005,58001,5,'زیرا به کدام یک از فرشتگان هرگز گفت که، تو پسر من هستی، من امروز تو را تولید نمودم؟ و ایضاً، من او را پدر خواهم بود و او پسر من خواهد بود؟','For unto which of the angels said he at any time, Thou art my Son, this day have I begotten thee? And again, I will be to him a Father, and he shall be to me a Son?');
INSERT INTO verses VALUES (5800100006,58001,6,'و هنگامی که نخست‌زاده را باز به جهان می‌آورَد، می‌گوید که، جمیع فرشتگان خدا او را پرستش کنند.','And again, when he bringeth in the firstbegotten into the world, he saith, And let all the angels of God worship him.');
INSERT INTO verses VALUES (5800100007,58001,7,'و در حقّ فرشتگان می‌گوید که فرشتگان خود را بادها می‌گرداند و خادمان خود را شعلهٔ آتش.','And of the angels he saith, Who maketh his angels spirits, and his ministers a flame of fire.');
INSERT INTO verses VALUES (5800100008,58001,8,'امّا در حقّ پسر [نیز می‌گوید]، ای خدا تخت تو تا ابدالآباد است و عصای ملکوت تو عصای راستی است.','But unto the Son he saith, Thy throne, O God, is for ever and ever: a sceptre of righteousness is the sceptre of thy kingdom.');
INSERT INTO verses VALUES (5800100009,58001,9,'عدالت را دوست و شرارت را دشمن می‌داری؛ بنابراین خدا، خدای تو، تو را به روغن شادمانی بیشتر از رفقایت مسح کرده است.','Thou hast loved righteousness, and hated iniquity; therefore God, even thy God, hath anointed thee with the oil of gladness above thy fellows.');
INSERT INTO verses VALUES (5800100010,58001,10,'و، تو ای خداوند، در ابتدا زمین را بنا کردی و افلاک مصنوع دستهای تو است.','And, Thou, Lord, in the beginning hast laid the foundation of the earth; and the heavens are the works of thine hands:');
INSERT INTO verses VALUES (5800100011,58001,11,'آنها فانی، لکن تو باقی هستی، و جمیع آنها چون جامه مندرس خواهد شد،','They shall perish; but thou remainest; and they all shall wax old as doth a garment;');
INSERT INTO verses VALUES (5800100012,58001,12,'و مثل ردا آنها را خواهی پیچید و تغییر خواهند یافت. لکن تو همان هستی و سالهای تو تمام نخواهد شد.','And as a vesture shalt thou fold them up, and they shall be changed: but thou art the same, and thy years shall not fail.');
INSERT INTO verses VALUES (5800100013,58001,13,'و به کدام یک از فرشتگان هرگز گفت، بنشین به دست راست من تا دشمنان تو را پای‌انداز تو سازم؟','But to which of the angels said he at any time, Sit on my right hand, until I make thine enemies thy footstool?');
INSERT INTO verses VALUES (5800100014,58001,14,'آیا همگی ایشان روح‌های خدمتگزار نیستند که برای خدمت آنانی که وارث نجات خواهند شد، فرستاده می‌شوند؟','Are they not all ministering spirits, sent forth to minister for them who shall be heirs of salvation?');
id INTEGER PRIMARY KEY,
book_id INTEGER NOT NULL,
chapter_number INTEGER NOT NULL,
audio_local TEXT,
audio_online_fa TEXT,
audio_online_en TEXT
);
id INTEGER PRIMARY KEY,
chapter_id INTEGER NOT NULL,
verse_number INTEGER NOT NULL,
text_fa TEXT,
text_en TEXT
);
INSERT INTO chapters VALUES (59001,59,1,NULL,'http://audio1.wordfree.net/bibles/app/audio/20/59/1.mp3','http://audio1.wordfree.net/bibles/app/audio/20/59/1.mp3');
INSERT INTO verses VALUES (5900100001,59001,1,'span class="verse" id="1">1 </span یعقوب، که غلام خدا و خداوندْ عیسی مسیح است، به دوازده سبط که پراکنده هستند؛ خوش باشید.','span class="verse" id="1">1 </span James , a servant of God and of the Lord Jesus Christ , to the twelve tribes which are scattered abroad, greeting.');
INSERT INTO verses VALUES (5900100002,59001,2,'ای برادران من، وقتی که در تجربه‌های گوناگون مبتلا شوید، کمال خوشی دانید؛','My brethren, count it all joy when ye fall into divers temptations;');
INSERT INTO verses VALUES (5900100003,59001,3,'چونکه می‌دانید که امتحان ایمان شما صبر را پیدا می‌کند.','Knowing this, that the trying of your faith worketh patience.');
INSERT INTO verses VALUES (5900100004,59001,4,'لکن صبر را عمل تاّم خود باشد، تا کامل و تمام شوید و محتاج هیچ چیز نباشید.','But let patience have her perfect work, that ye may be perfect and entire, wanting nothing.');
INSERT INTO verses VALUES (5900100005,59001,5,'و اگر از شما کسی محتاج به حکمت باشد، سؤال بکند از خدایی که هر کس را به سخاوت عطا می‌کند و ملامت نمی‌نماید، و به او داده خواهد شد.','If any of you lack wisdom, let him ask of God, that giveth to all men liberally, and upbraideth not; and it shall be given him.');
INSERT INTO verses VALUES (5900100006,59001,6,'لکن به ایمان سؤال بکند، و هرگز شک نکند. زیرا هرکه شک کند، مانند موج دریاست که از باد رانده و متلاطم می‌شود.','But let him ask in faith, nothing wavering. For he that wavereth is like a wave of the sea driven with the wind and tossed.');
INSERT INTO verses VALUES (5900100007,59001,7,'زیرا چنین شخص گمان نبرد که از خداوند چیزی خواهد یافت.','For let not that man think that he shall receive any thing of the Lord.');
INSERT INTO verses VALUES (5900100008,59001,8,'مرد دودل در تمام رفتار خود ناپایدار است.','A double minded man is unstable in all his ways.');
INSERT INTO verses VALUES (5900100009,59001,9,'لکن برادرِ مسکین به سرافرازی خود فخر بنماید،','Let the brother of low degree rejoice in that he is exalted:');
INSERT INTO verses VALUES (5900100010,59001,10,'و دولتمند از مسکنت خود، زیرا مثل گُلِ علف در گذر است.','But the rich, in that he is made low: because as the flower of the grass he shall pass away.');
INSERT INTO verses VALUES (5900100011,59001,11,'از آنرو که آفتاب با گرمی طلوع کرده، علف را خشکانید و گُلَشْ به زیر افتاده، حُسن صورتش زایل شد: به همینطور شخص دولتمند نیز در راه‌های خود، پژمرده خواهد گردید.','For the sun is no sooner risen with a burning heat, but it withereth the grass, and the flower thereof falleth, and the grace of the fashion of it perisheth: so also shall the rich man fade away in his ways.');
INSERT INTO verses VALUES (5900100012,59001,12,'خوشابحال کسی که متحمّل تجربه شود، زیرا که چون آزموده شد، آن تاج حیاتی را که خداوند به محبّان خود وعده فرموده است خواهد یافت.','Blessed is the man that endureth temptation: for when he is tried, he shall receive the crown of life, which the Lord hath promised to them that love him.');
INSERT INTO verses VALUES (5900100013,59001,13,'هیچ‌کس چون در تجربه افتد، نگوید، خدا مرا تجربه می‌کند، زیرا خدا هرگز از بدیها تجربه نمی‌شود و او هیچ‌کس را تجربه نمی‌کند.','Let no man say when he is tempted, I am tempted of God: for God cannot be tempted with evil, neither tempteth he any man:');
INSERT INTO verses VALUES (5900100014,59001,14,'لکن هرکس در تجربه می‌افتد، وقتی که شهوت وی او را می‌کَشَد، و فریفته می‌سازد.','But every man is tempted, when he is drawn away of his own lust, and enticed.');
INSERT INTO verses VALUES (5900100015,59001,15,'پس شهوت آبستن شده، گناه را می‌زاید و گناه به انجام رسیده، موت را تولید می‌کند.','Then when lust hath conceived, it bringeth forth sin: and sin, when it is finished, bringeth forth death.');
INSERT INTO verses VALUES (5900100016,59001,16,'ای برادرانِ عزیز من، گمراه مشوید!','Do not err, my beloved brethren.');
INSERT INTO verses VALUES (5900100017,59001,17,'هر بخشندگیِ نیکو و هر بخششِ کامل از بالا است، و نازل می‌شود از پدر نورها، که نزد او هیچ تبدیل و سایهٔ گَردِش نیست.','Every good gift and every perfect gift is from above, and cometh down from the Father of lights, with whom is no variableness, neither shadow of turning.');
INSERT INTO verses VALUES (5900100018,59001,18,'او محض ارادهٔ خود ما را به‌وسیلهٔ کلمه حقّ تولید نمود، تا ما چون نوبر مخلوقات او باشیم.','Of his own will begat he us with the word of truth, that we should be a kind of firstfruits of his creatures.');
INSERT INTO verses VALUES (5900100019,59001,19,'بنابراین، ای برادرانِ عزیز من، هرکس در شنیدن تند، و در گفتن آهسته، و در خشم سُست باشد،','Wherefore, my beloved brethren, let every man be swift to hear, slow to speak, slow to wrath:');
INSERT INTO verses VALUES (5900100020,59001,20,'زیرا خشمِ انسان عدالت خدا را به عمل نمی‌آورد.','For the wrath of man worketh not the righteousness of God.');
INSERT INTO verses VALUES (5900100021,59001,21,'پس هر نجاست و افزونیِ شرّ را دور کنید و با فروتنی، کلامِ کاشته شده را بپذیرید، که قادر است که جانهای شما را نجات بخشد.','Wherefore lay apart all filthiness and superfluity of naughtiness, and receive with meekness the engrafted word, which is able to save your souls.');
INSERT INTO verses VALUES (5900100022,59001,22,'لکن کنندگانِ کلام باشید نه فقط شنوندگان، که خود را فریب می‌دهند.','But be ye doers of the word, and not hearers only, deceiving your own selves.');
INSERT INTO verses VALUES (5900100023,59001,23,'زیرا اگر کسی کلام را بشنود و عمل نکند، شخصی را ماند که صورت طبیعیِ خود را در آینه می‌نگرد:','For if any be a hearer of the word, and not a doer, he is like unto a man beholding his natural face in a glass:');
INSERT INTO verses VALUES (5900100024,59001,24,'زیرا خود را نگریست و رفت و فوراً فراموش کرد که چطور شخصی بود.','For he beholdeth himself, and goeth his way, and straightway forgetteth what manner of man he was.');
INSERT INTO verses VALUES (5900100025,59001,25,'لکن کسی که بر شریعتِ کاملِ آزادی چشم دوخت، و در آن ثابت ماند، او چون شنوندهٔ فراموشکار نمی‌باشد، بلکه کنندهٔ عمل، پس او در عمل خود مبارک خواهد بود.','But whoso looketh into the perfect law of liberty, and continueth therein, he being not a forgetful hearer, but a doer of the work, this man shall be blessed in his deed.');
INSERT INTO verses VALUES (5900100026,59001,26,'اگر کسی از شما گمان برد که پرستندهٔ خدا است و عنان زبان خود را نکشد، بلکه دل خود را فریب دهد، پرستش او باطل است.','If any man among you seem to be religious, and bridleth not his tongue, but deceiveth his own heart, this man''s religion is vain.');
INSERT INTO verses VALUES (5900100027,59001,27,'پرستش صاف و بی‌عیب نزد خدا و پدر این است، که یتیمان و بیوه‌زنان را در مصیبت ایشان تفقّد کنند، [و] خود را از آلایش دنیا نگاه دارند.','Pure religion and undefiled before God and the Father is this, To visit the fatherless and widows in their affliction, and to keep himself unspotted from the world.');
id INTEGER PRIMARY KEY,
book_id INTEGER NOT NULL,
chapter_number INTEGER NOT NULL,
audio_local TEXT,
audio_online_fa TEXT,
audio_online_en TEXT
);
id INTEGER PRIMARY KEY,
chapter_id INTEGER NOT NULL,
verse_number INTEGER NOT NULL,
text_fa TEXT,
text_en TEXT
);
INSERT INTO chapters VALUES (60001,60,1,NULL,'http://audio1.wordfree.net/bibles/app/audio/20/60/1.mp3','http://audio1.wordfree.net/bibles/app/audio/20/60/1.mp3');
INSERT INTO verses VALUES (6000100001,60001,1,'span class="verse" id="1">1 </span پطرُس، رسول عیسی مسیح، به غریبانی که پراکنده‌اند در پُنطُسْ و غَلاطیه و قَپَّدوقیه و آسیا و بطانیه؛','span class="verse" id="1">1 </span Peter , an apostle of Jesus Christ , to the strangers scattered throughout Pontus, Galatia, Cappadocia, Asia, and Bithynia,');
INSERT INTO verses VALUES (6000100002,60001,2,'برگزیدگان برحسب علم سابق خدای پدر، به تقدیس روح برای اطاعت و پاشیدن خون عیسی مسیح. فیض و سلامتی بر شما افزون باد.','Elect according to the foreknowledge of God the Father, through sanctification of the Spirit, unto obedience and sprinkling of the blood of Jesus Christ : Grace unto you, and peace, be multiplied.');
INSERT INTO verses VALUES (6000100003,60001,3,'متبارک باد خدا و پدر خداوند ما عیسی مسیح که بحسب رحمت عظیم خود ما را بوساطت برخاستنِ عیسی مسیح از مردگان از نو تولید نمود برای امید زنده،','Blessed be the God and Father of our Lord Jesus Christ , which according to his abundant mercy hath begotten us again unto a lively hope by the resurrection of Jesus Christ from the dead,');
INSERT INTO verses VALUES (6000100004,60001,4,'بجهت میراث بی‌فساد و بی‌آلایش و ناپژمرده که نگاه داشته شده است در آسمان برای شما؛','To an inheritance incorruptible, and undefiled, and that fadeth not away, reserved in heaven for you,');
INSERT INTO verses VALUES (6000100005,60001,5,'که به قوّت خدا محروس هستید به ایمان برای نجاتی که مهیّا شده است تا در ایّام آخر ظاهر شود.','Who are kept by the power of God through faith unto salvation ready to be revealed in the last time.');
INSERT INTO verses VALUES (6000100006,60001,6,'و در آن وجد می‌نمایید، هرچند در حال، اندکی از راه ضرورت در تجربه‌های گوناگون محزون شده‌اید،','Wherein ye greatly rejoice, though now for a season, if need be, ye are in heaviness through manifold temptations:');
INSERT INTO verses VALUES (6000100007,60001,7,'تا آزمایشِ ایمانِ شما، که از طلای فانی با آزموده شدن در آتش، گرانبهاتر است، برای تسبیح و جلال و اکرام یافت شود در حین ظهور عیسی مسیح:','That the trial of your faith, being much more precious than of gold that perisheth, though it be tried with fire, might be found unto praise and honour and glory at the appearing of Jesus Christ :');
INSERT INTO verses VALUES (6000100008,60001,8,'که او را اگرچه ندیده‌اید محبّت می‌نمایید و الآن اگرچه او را نمی‌بینید؛ لکن بر او ایمان آورده، وجد می‌نمایید با خرّمیای که نمی‌توان بیان کرد و پر از جلال است:','Whom having not seen, ye love; in whom, though now ye see him not, yet believing, ye rejoice with joy unspeakable and full of glory:');
INSERT INTO verses VALUES (6000100009,60001,9,'و انجام ایمان خود، یعنی نجاتِ جانِ خویش را می‌یابید.','Receiving the end of your faith, even the salvation of your souls.');
INSERT INTO verses VALUES (6000100010,60001,10,'که دربارهٔ این نجات، انبیایی که از فیضی که برای شما مقرّر بود، اِخبار نمودند، تفتیش و تفحّص می‌کردند','Of which salvation the prophets have enquired and searched diligently, who prophesied of the grace that should come unto you:');
INSERT INTO verses VALUES (6000100011,60001,11,'و دریافت می‌نمودند که کدام و چگونه زمان است که روح مسیح که در ایشان بود از آن خبر می‌داد، چون از زحماتی که برای مسیح مقرّر بود، و جلالهایی که بعد از آنها خواهد بود، شهادت می‌داد؛','Searching what, or what manner of time the Spirit of Christ which was in them did signify, when it testified beforehand the sufferings of Christ , and the glory that should follow.');
INSERT INTO verses VALUES (6000100012,60001,12,'و بدیشان مکشوف شد، که نه به خود، بلکه به ما خدمت می‌کردند، در آن اموری که شما اکنون از آنها خبر یافته‌اید از کسانی که به روح‌القدس که از آسمان فرستاده شده است، بشارت داده‌اند و فرشتگان نیز مشتاق هستند که در آنها نظر کنند.','Unto whom it was revealed, that not unto themselves, but unto us they did minister the things, which are now reported unto you by them that have preached the gospel unto you with the Holy Ghost sent down from heaven; which things the angels desire to look into.');
INSERT INTO verses VALUES (6000100013,60001,13,'لهٰذا، کمر دلهای خود را ببندید و هشیار شده، امید کامل آن فیضی را که در مکاشفه عیسی مسیح به شما عطا خواهد شد، بدارید.','Wherefore gird up the loins of your mind, be sober, and hope to the end for the grace that is to be brought unto you at the revelation of Jesus Christ ;');
INSERT INTO verses VALUES (6000100014,60001,14,'و چون ابنای اطاعت هستید، مشابه مشوید بدان شهواتی که در ایّام جهالت می‌داشتید،','As obedient children, not fashioning yourselves according to the former lusts in your ignorance:');
INSERT INTO verses VALUES (6000100015,60001,15,'بلکه مثل آن قدّوس که شما را خوانده است، خودِ شما نیز در هر سیرت، مقدّس باشید؛','But as he which hath called you is holy, so be ye holy in all manner of conversation;');
INSERT INTO verses VALUES (6000100016,60001,16,'زیرا مکتوب است، مقدّس باشید زیرا که من قدّوسم.','Because it is written, Be ye holy; for I am holy.');
INSERT INTO verses VALUES (6000100017,60001,17,'و چون او را پدر می‌خوانید که بدون ظاهربینی برحسب اعمال هرکس داوری می‌نماید، پس هنگام غربت خود را با ترس صرف نمایید.','And if ye call on the Father, who without respect of persons judgeth according to every man''s work, pass the time of your sojourning here in fear:');
INSERT INTO verses VALUES (6000100018,60001,18,'زیرا می‌دانید که خریده شده‌اید از سیرتِ باطلی که از پدران خود یافته‌اید، نه به چیزهای فانی مثل نقره و طلا،','Forasmuch as ye know that ye were not redeemed with corruptible things, as silver and gold, from your vain conversation received by tradition from your fathers;');
INSERT INTO verses VALUES (6000100019,60001,19,'بلکه به خون گرانبها، چون خون برّهٔ بی‌عیب و بی‌داغ، یعنی خون مسیح،','But with the precious blood of Christ , as of a lamb without blemish and without spot:');
INSERT INTO verses VALUES (6000100020,60001,20,'که پیش از بنیاد عالم معیّن شد، لکن در زمان آخر برای شما ظاهر گردید،','Who verily was foreordained before the foundation of the world, but was manifest in these last times for you,');
INSERT INTO verses VALUES (6000100021,60001,21,'که بوساطت او شما بر آن خدایی که او را از مردگان برخیزانید و او را جلال داد، ایمان آورده‌اید، تا ایمان و امید شما بر خدا باشد.','Who by him do believe in God, that raised him up from the dead, and gave him glory; that your faith and hope might be in God.');
INSERT INTO verses VALUES (6000100022,60001,22,'چون نَفْسهای خود را به اطاعت راستی طاهر ساخته‌اید تا محبّت برادرانهٔ بی‌ریا داشته باشید، پس یکدیگر را از دل به شدّت محبّت بنمایید،','Seeing ye have purified your souls in obeying the truth through the Spirit unto unfeigned love of the brethren, see that ye love one another with a pure heart fervently:');
INSERT INTO verses VALUES (6000100023,60001,23,'از آنرو که تولّد تازه یافتید، نه از تخم فانی بلکه از غیرفانی، یعنی به کلام خدا که زنده و تا ابدالآباد باقی است.','Being born again, not of corruptible seed, but of incorruptible, by the word of God, which liveth and abideth for ever.');
INSERT INTO verses VALUES (6000100024,60001,24,'زیرا که، هر بشری مانند گیاه است و تمام جلال او چون گُل گیاه. گیاه پژمرده شد و گُلش ریخت:','For all flesh is as grass, and all the glory of man as the flower of grass. The grass withereth, and the flower thereof falleth away:');
INSERT INTO verses VALUES (6000100025,60001,25,'لکن کلمه خدا تا ابدالآباد باقی است. و این است آن کلامی که به شما بشارت داده شده است.','But the word of the Lord endureth for ever. And this is the word which by the gospel is preached unto you.');
id INTEGER PRIMARY KEY,
book_id INTEGER NOT NULL,
chapter_number INTEGER NOT NULL,
audio_local TEXT,
audio_online_fa TEXT,
audio_online_en TEXT
);
id INTEGER PRIMARY KEY,
chapter_id INTEGER NOT NULL,
verse_number INTEGER NOT NULL,
text_fa TEXT,
text_en TEXT
);
INSERT INTO chapters VALUES (61001,61,1,NULL,'http://audio1.wordfree.net/bibles/app/audio/20/61/1.mp3','http://audio1.wordfree.net/bibles/app/audio/20/61/1.mp3');
INSERT INTO verses VALUES (6100100001,61001,1,'span class="verse" id="1">1 </span شمعون پطرس، غلام و رسول عیسی مسیح، به آنانی که ایمان گرانبها را به مساویِ ما یافته‌اند، در عدالت خدای ما و عیسی مسیح نجات دهنده:','span class="verse" id="1">1 </span Simon Peter , a servant and an apostle of Jesus Christ , to them that have obtained like precious faith with us through the righteousness of God and our Saviour Jesus Christ :');
INSERT INTO verses VALUES (6100100002,61001,2,'فیض و سلامتی در معرفت خدا، و خداوند ما عیسی بر شما افزون باد.','Grace and peace be multiplied unto you through the knowledge of God, and of Jesus our Lord,');
INSERT INTO verses VALUES (6100100003,61001,3,'چنانکه قوّت الهیهٔ او همهٔ چیزهایی را که برای حیات و دینداری لازم است، به ما عنایت فرموده است، به معرفت او که ما را به جلال و فضیلت خود دعوت نموده:','According as his divine power hath given unto us all things that pertain unto life and godliness, through the knowledge of him that hath called us to glory and virtue:');
INSERT INTO verses VALUES (6100100004,61001,4,'که بوساطت آنها وعده‌های بی‌نهایت عظیم و گرانبها به ما داده شد: تا شما به اینها شریکِ طبیعتِ الٰهی گردید، و از فسادی که از شهوت در جهان است، خلاصی یابید:','Whereby are given unto us exceeding great and precious promises: that by these ye might be partakers of the divine nature, having escaped the corruption that is in the world through lust.');
INSERT INTO verses VALUES (6100100005,61001,5,'و به همین جهت، کمال سعی نموده، در ایمان خود فضیلت پیدا نمایید؛','And beside this, giving all diligence, add to your faith virtue; and to virtue knowledge;');
INSERT INTO verses VALUES (6100100006,61001,6,'و در فضیلت، علم و در علم، عفّت و در عفّت، صبر و در صبر، دینداری؛','And to knowledge temperance; and to temperance patience; and to patience godliness;');
INSERT INTO verses VALUES (6100100007,61001,7,'و در دینداری، محبّت برادران و در محبّت برادران، محبّت را.','And to godliness brotherly kindness; and to brotherly kindness charity.');
INSERT INTO verses VALUES (6100100008,61001,8,'زیرا هرگاه اینها در شما یافت شود و بیفزاید، شما را نمی‌گذارد که در معرفت خداوند ما عیسی مسیح کاهل یا بی‌ثمر بوده باشید.','For if these things be in you, and abound, they make you that ye shall neither be barren nor unfruitful in the knowledge of our Lord Jesus Christ .');
INSERT INTO verses VALUES (6100100009,61001,9,'زیرا هرکه اینها را ندارد، کور و کوتاه نظر است و تطیهرِ گناهانِ گذشتهٔ خود را فراموش کرده است.','But he that lacketh these things is blind, and cannot see afar off, and hath forgotten that he was purged from his old sins.');
INSERT INTO verses VALUES (6100100010,61001,10,'لهذا ای برادران، بیشتر جدّ و جهد کنید تا دعوت و برگزیدگی خود را ثابت نمایید: زیرا اگر چنین کنید، هرگز لغزش نخواهید خورد:','Wherefore the rather, brethren, give diligence to make your calling and election sure: for if ye do these things, ye shall never fall:');
INSERT INTO verses VALUES (6100100011,61001,11,'و همچنین دخول در ملکوت جاودانی خداوند و نجات‌دهندهٔ ما عیسی مسیح به شما به دولتمندی داده خواهد شد.','For so an entrance shall be ministered unto you abundantly into the everlasting kingdom of our Lord and Saviour Jesus Christ .');
INSERT INTO verses VALUES (6100100012,61001,12,'لهذا از پیوسته یاد دادن شما از این امور غفلت نخواهم ورزید، هرچند آنها را می‌دانید، و در آن راستی که نزد شما است استوار هستید.','Wherefore I will not be negligent to put you always in remembrance of these things, though ye know them, and be established in the present truth.');
INSERT INTO verses VALUES (6100100013,61001,13,'لکن، این را صواب می‌دانم، مادامی که در این خیمه هستم، شما را به یاد آوری برانگیزانم؛','Yea, I think it meet, as long as I am in this tabernacle, to stir you up by putting you in remembrance;');
INSERT INTO verses VALUES (6100100014,61001,14,'چونکه می‌دانم که وقت بیرون کردن خیمهٔ من نزدیک است، چنانکه خداوند ما عیسی مسیح نیز مرا آگاهانید.','Knowing that shortly I must put off this my tabernacle, even as our Lord Jesus Christ hath shewed me.');
INSERT INTO verses VALUES (6100100015,61001,15,'و برای این نیز کوشش می‌کنم تا شما در هر وقت بعد از رحلت من بتوانید این امور را یاد آورید.','Moreover I will endeavour that ye may be able after my decease to have these things always in remembrance.');
INSERT INTO verses VALUES (6100100016,61001,16,'زیرا که در پی افسانه‌های جعلی نرفتیم، چون از قوّت و آمدن خداوند ما عیسی مسیح شما را اعلام دادیم، بلکه کبریایی او را دیده بودیم.','For we have not followed cunningly devised fables, when we made known unto you the power and coming of our Lord Jesus Christ , but were eyewitnesses of his majesty.');
INSERT INTO verses VALUES (6100100017,61001,17,'زیرا از خدای پدر اکرام و جلال یافت، هنگامی که آوازی از جلال کبریایی به او رسید که، این است پسر حبیب من، که از وی خشنودم.','For he received from God the Father honour and glory, when there came such a voice to him from the excellent glory, This is my beloved Son, in whom I am well pleased.');
INSERT INTO verses VALUES (6100100018,61001,18,'و این آواز را ما زمانی که با وی در کوه مقدّس بودیم شنیدیم، که از آسمان آورده شد.','And this voice which came from heaven we heard, when we were with him in the holy mount.');
INSERT INTO verses VALUES (6100100019,61001,19,'و کلام انبیا را نیز محکمتر داریم؛ که نیکو می‌کنید اگر در آن اهتمام کنید، مثل چراغی درخشنده در مکان تاریک، تا روز بشکافد و ستارهٔ صبح در دلهای شما طلوع کند:','We have also a more sure word of prophecy; whereunto ye do well that ye take heed, as unto a light that shineth in a dark place, until the day dawn, and the day star arise in your hearts:');
INSERT INTO verses VALUES (6100100020,61001,20,'و این را نخست بدانید که، هیچ نبوّتِ کتاب از تفسیر خود نبی نیست.','Knowing this first, that no prophecy of the scripture is of any private interpretation.');
INSERT INTO verses VALUES (6100100021,61001,21,'زیرا که نبوّت به ارادهٔ انسان هرگز آورده نشد: بلکه مردمان به روح‌القدس مجذوب شده، از جانب خدا سخن گفتند.','For the prophecy came not in old time by the will of man: but holy men of God spake as they were moved by the Holy Ghost.');
id INTEGER PRIMARY KEY,
book_id INTEGER NOT NULL,
chapter_number INTEGER NOT NULL,
audio_local TEXT,
audio_online_fa TEXT,
audio_online_en TEXT
);
id INTEGER PRIMARY KEY,
chapter_id INTEGER NOT NULL,
verse_number INTEGER NOT NULL,
text_fa TEXT,
text_en TEXT
);
INSERT INTO chapters VALUES (62001,62,1,NULL,'http://audio1.wordfree.net/bibles/app/audio/20/62/1.mp3','http://audio1.wordfree.net/bibles/app/audio/20/62/1.mp3');
INSERT INTO verses VALUES (6200100001,62001,1,'span class="verse" id="1">1 </span آنچه از ابتدا بود و آنچه شنیده‌ایم و به چشم خود دیده، آنچه بر آن نگریستیم و دستهای ما لمس کرد، دربارهٔٔ کلمهٔ حیات.','span class="verse" id="1">1 </span That which was from the beginning, which we have heard, which we have seen with our eyes, which we have looked upon, and our hands have handled, of the Word of life;');
INSERT INTO verses VALUES (6200100002,62001,2,'(و حیات ظاهر شد و آن را دیده‌ایم و شهادت می‌دهیم و به شما خبر می‌دهیم از حیات جاودانی که نزد پدر بود و بر ما ظاهر شد.)','(For the life was manifested, and we have seen it, and bear witness, and shew unto you that eternal life, which was with the Father, and was manifested unto us;)');
INSERT INTO verses VALUES (6200100003,62001,3,'از آنچه دیده و شنیده‌ایم شما را اعلام می‌نماییم تا شما هم با ما شراکت داشته باشید. و امّا شراکت ما با پدر و با پسرش عیسی مسیح است.','That which we have seen and heard declare we unto you, that ye also may have fellowship with us: and truly our fellowship is with the Father, and with his Son Jesus Christ .');
INSERT INTO verses VALUES (6200100004,62001,4,'و این را به شما می‌نویسم تا خوشیِ ما کامل گردد.','And these things write we unto you, that your joy may be full.');
INSERT INTO verses VALUES (6200100005,62001,5,'و این است پیغامی که از او شنیده‌ایم و به شما اعلام می‌نماییم، که خدا نور است و هیچ ظلمت در وی هرگز نیست.','This then is the message which we have heard of him, and declare unto you, that God is light, and in him is no darkness at all.');
INSERT INTO verses VALUES (6200100006,62001,6,'اگر گوییم که با وی شراکت داریم، در حالیکه در ظلمت سلوک می‌نماییم، دروغ می‌گوییم و براستی عمل نمی‌کنیم.','If we say that we have fellowship with him, and walk in darkness, we lie, and do not the truth:');
INSERT INTO verses VALUES (6200100007,62001,7,'لکن اگر در نور سلوک می‌نماییم، چنانکه او در نور است، با یکدیگر شراکت داریم و خون پسر او عیسی مسیح ما را از هر گناه پاک می‌سازد.','But if we walk in the light, as he is in the light, we have fellowship one with another, and the blood of Jesus Christ his Son cleanseth us from all sin.');
INSERT INTO verses VALUES (6200100008,62001,8,'اگر گوییم که گناه نداریم خود را گمراه می‌کنیم و راستی در ما نیست.','If we say that we have no sin, we deceive ourselves, and the truth is not in us.');
INSERT INTO verses VALUES (6200100009,62001,9,'اگر به گناهان خود اعتراف کنیم، او امین و عادل است تا گناهان ما را بیامرزد و ما را از هر ناراستی پاک سازد.','If we confess our sins, he is faithful and just to forgive us our sins, and to cleanse us from all unrighteousness.');
INSERT INTO verses VALUES (6200100010,62001,10,'اگر گوییم که گناه نکرده‌ایم، او را دروغگو می‌شماریم و کلام او در ما نیست.','If we say that we have not sinned, we make him a liar, and his word is not in us.');
id INTEGER PRIMARY KEY,
book_id INTEGER NOT NULL,
chapter_number INTEGER NOT NULL,
audio_local TEXT,
audio_online_fa TEXT,
audio_online_en TEXT
);
id INTEGER PRIMARY KEY,
chapter_id INTEGER NOT NULL,
verse_number INTEGER NOT NULL,
text_fa TEXT,
text_en TEXT
);
INSERT INTO chapters VALUES (63001,63,1,NULL,'http://audio1.wordfree.net/bibles/app/audio/20/63/1.mp3','http://audio1.wordfree.net/bibles/app/audio/20/63/1.mp3');
INSERT INTO verses VALUES (6300100001,63001,1,'span class="verse" id="1">1 </span من که پیرم، به خاتون برگزیده و فرزندانش که ایشان را در راستی محبّت می‌نمایم، و نه من فقط بلکه همهٔٔ کسانی که راستی را می‌دانند،','span class="verse" id="1">1 </span The elder unto the elect lady and her children, whom I love in the truth; and not I only, but also all they that have known the truth;');
INSERT INTO verses VALUES (6300100002,63001,2,'بخاطر آن راستی که در ما ساکن است و با ما تا به ابد خواهد بود.','For the truth''s sake, which dwelleth in us, and shall be with us for ever.');
INSERT INTO verses VALUES (6300100003,63001,3,'فیض و رحمت و سلامتی از جانب خدای پدر و عیسی مسیح خداوند و پسر پدر در راستی و محبّت با ما خواهد بود.','Grace be with you, mercy, and peace, from God the Father, and from the Lord Jesus Christ , the Son of the Father, in truth and love.');
INSERT INTO verses VALUES (6300100004,63001,4,'بسیار مسرور شدم چونکه بعضی از فرزندان تو را یافتم که در راستی رفتار می‌کنند، چنانکه از پدر حکم یافتیم.','I rejoiced greatly that I found of thy children walking in truth, as we have received a commandment from the Father.');
INSERT INTO verses VALUES (6300100005,63001,5,'و الآن ای خاتون از تو التماس دارم، نه آنکه حکمی تازه به تو بنویسم، بلکه همان را که از ابتداء داشتیم که یکدیگر را محبّت بنماییم.','And now I beseech thee, lady, not as though I wrote a new commandment unto thee, but that which we had from the beginning, that we love one another.');
INSERT INTO verses VALUES (6300100006,63001,6,'و این است محبّت که موافق احکام او سلوک بنماییم و حکم همان است که از اوّل شنیدید تا در آن سلوک نماییم.','And this is love, that we walk after his commandments. This is the commandment, That, as ye have heard from the beginning, ye should walk in it.');
INSERT INTO verses VALUES (6300100007,63001,7,'زیرا گمراه‌کنندگانِ بسیار به دنیا بیرون شدند که عیسی مسیح ظاهرشدهٔ در جسم را اقرار نمی‌کنند. آن است گمراه‌کننده و دجّال.','For many deceivers are entered into the world, who confess not that Jesus Christ is come in the flesh. This is a deceiver and an antichrist.');
INSERT INTO verses VALUES (6300100008,63001,8,'خود را نگاه بدارید مبادا آنچه را که عمل کردیم برباد دهید بلکه تا اجرت کامل بیابید.','Look to yourselves, that we lose not those things which we have wrought, but that we receive a full reward.');
INSERT INTO verses VALUES (6300100009,63001,9,'هرکه پیشوایی می‌کند و در تعلیم مسیح ثابت نیست، خدا را نیافته است. امّا آنکه در تعلیم مسیح ثابت مانَد، او هم پدر و پسر را دارد.','Whosoever transgresseth, and abideth not in the doctrine of Christ , hath not God. He that abideth in the doctrine of Christ , he hath both the Father and the Son.');
INSERT INTO verses VALUES (6300100010,63001,10,'اگر کسی به نزد شما آید و این تعلیم را نیاوَرَد، او را به خانهٔ خود مپذیرید و او را تحیّت مگویید،','If there come any unto you, and bring not this doctrine, receive him not into your house, neither bid him God speed:');
INSERT INTO verses VALUES (6300100011,63001,11,'زیرا هرکه او را تحیّت گوید، در کارهای قبیحش شریک گردد.','For he that biddeth him God speed is partaker of his evil deeds.');
INSERT INTO verses VALUES (6300100012,63001,12,'چیزهای بسیار دارم که به شما بنویسم، لکن نخواستم که به کاغذ و مرکّب بنویسم، بلکه امیدوارم که به نزد شما بیایم و زبانی گفتگو نمایم تا خوشیِ ما کامل شود.','Having many things to write unto you, I would not write with paper and ink: but I trust to come unto you, and speak face to face, that our joy may be full.');
INSERT INTO verses VALUES (6300100013,63001,13,'فرزندانِ خواهرِ برگزیدهٔ تو، به تو سلام می‌رسانند. آمین.','The children of thy elect sister greet thee. Amen.');
id INTEGER PRIMARY KEY,
book_id INTEGER NOT NULL,
chapter_number INTEGER NOT NULL,
audio_local TEXT,
audio_online_fa TEXT,
audio_online_en TEXT
);
id INTEGER PRIMARY KEY,
chapter_id INTEGER NOT NULL,
verse_number INTEGER NOT NULL,
text_fa TEXT,
text_en TEXT
);
INSERT INTO chapters VALUES (64001,64,1,NULL,'http://audio1.wordfree.net/bibles/app/audio/20/64/1.mp3','http://audio1.wordfree.net/bibles/app/audio/20/64/1.mp3');
INSERT INTO verses VALUES (6400100001,64001,1,'span class="verse" id="1">1 </span من که پیرم، به غایُس حبیب که او را در راستی محبّت می‌نمایم.','span class="verse" id="1">1 </span The elder unto the wellbeloved Gaius, whom I love in the truth.');
INSERT INTO verses VALUES (6400100002,64001,2,'ای حبیب، دعا می‌کنم که در هر وجه کامیاب و تندرست بوده باشی، چنانکه جان تو کامیاب است.','Beloved, I wish above all things that thou mayest prosper and be in health, even as thy soul prospereth.');
INSERT INTO verses VALUES (6400100003,64001,3,'زیرا که بسیار شاد شدم چون برادران آمدند و بر راستیِ تو شهادت دادند، چنانکه تو در راستی سلوک می‌نمایی.','For I rejoiced greatly, when the brethren came and testified of the truth that is in thee, even as thou walkest in the truth.');
INSERT INTO verses VALUES (6400100004,64001,4,'مرا بیش از این شادی نیست که بشنوم که فرزندانم در راستی سلوک می‌نمایند.','I have no greater joy than to hear that my children walk in truth.');
INSERT INTO verses VALUES (6400100005,64001,5,'ای حبیب، آنچه می‌کنی به برادران و خصوصاً به غریبان، به امانت می‌کنی،','Beloved, thou doest faithfully whatsoever thou doest to the brethren, and to strangers;');
INSERT INTO verses VALUES (6400100006,64001,6,'که در حضور کلیسا بر محبّت تو شهادت دادند و هرگاه ایشان را بطور شایستهٔٔ خدا بدرقه کنی، نیکویی می‌نمایی','Which have borne witness of thy charity before the church: whom if thou bring forward on their journey after a godly sort, thou shalt do well:');
INSERT INTO verses VALUES (6400100007,64001,7,'زیرا که بجهت اسم او بیرون رفتند و از امّت‌ها چیزی نمی‌گیرند.','Because that for his name''s sake they went forth, taking nothing of the Gentiles.');
INSERT INTO verses VALUES (6400100008,64001,8,'پس بر ما واجب است که چنین اشخاص را بپذیریم تا شریک راستی بشویم.','We therefore ought to receive such, that we might be fellowhelpers to the truth.');
INSERT INTO verses VALUES (6400100009,64001,9,'به کلیسا چیزی نوشتم لکن دِیوتْرِفیس که سرداری بر ایشان را دوست می‌دارد، ما را قبول نمی‌کند.','I wrote unto the church: but Diotrephes, who loveth to have the preeminence among them, receiveth us not.');
INSERT INTO verses VALUES (6400100010,64001,10,'لهذا اگر آیم، کارهایی را که او می‌کند به یاد خواهم آورد زیرا به سخنان ناشایسته بر ما یاوه‌گویی می‌کند و به این قانع نشده، برادران را خود نمی‌پذیرد و کسانی را نیز که می‌خواهند، مانع ایشان می‌شود و از کلیسا بیرون می‌کند.','Wherefore, if I come, I will remember his deeds which he doeth, prating against us with malicious words: and not content therewith, neither doth he himself receive the brethren, and forbiddeth them that would, and casteth them out of the church.');
INSERT INTO verses VALUES (6400100011,64001,11,'ای حبیب، به بدی اقتدا منما، بلکه به نیکویی. زیرا نیکوکردار از خداست، و بدکردار خدا را ندیده است.','Beloved, follow not that which is evil, but that which is good. He that doeth good is of God: but he that doeth evil hath not seen God.');
INSERT INTO verses VALUES (6400100012,64001,12,'همهٔٔ مردم و خودِ راستی نیز بر دیمتریوس شهادت می‌دهند و ما هم شهادت می‌دهیم و آگاهید که شهادت ما راست است.','Demetrius hath good report of all men, and of the truth itself: yea, and we also bear record; and ye know that our record is true.');
INSERT INTO verses VALUES (6400100013,64001,13,'مرا چیزهای بسیار بود که به تو بنویسم، لکن نمی‌خواهم به مرکّب و قلم به تو بنویسم.','I had many things to write, but I will not with ink and pen write unto thee:');
INSERT INTO verses VALUES (6400100014,64001,14,'لکن امیدوارم که به زودی تو را خواهم دید و زبانی گفتگو کنیم. سلام بر تو باد. دوستان به تو سلام می‌رسانند. سلام مرا به دوستان نام به نام برسان.','But I trust I shall shortly see thee, and we shall speak face to face. Peace be to thee. Our friends salute thee. Greet the friends by name.');
id INTEGER PRIMARY KEY,
book_id INTEGER NOT NULL,
chapter_number INTEGER NOT NULL,
audio_local TEXT,
audio_online_fa TEXT,
audio_online_en TEXT
);
id INTEGER PRIMARY KEY,
chapter_id INTEGER NOT NULL,
verse_number INTEGER NOT NULL,
text_fa TEXT,
text_en TEXT
);
INSERT INTO chapters VALUES (65001,65,1,NULL,'http://audio1.wordfree.net/bibles/app/audio/20/65/1.mp3','http://audio1.wordfree.net/bibles/app/audio/20/65/1.mp3');
INSERT INTO verses VALUES (6500100001,65001,1,'span class="verse" id="1">1 </span یهودا، غلام عیسی مسیح و برادر یعقوب، به خوانده‌شدگانی که در خدای پدر، حبیب و برای عیسی مسیح محفوظ می‌باشید.','span class="verse" id="1">1 </span Jude, the servant of Jesus Christ , and brother of James , to them that are sanctified by God the Father, and preserved in Jesus Christ , and called:');
INSERT INTO verses VALUES (6500100002,65001,2,'رحمت و سلامتی و محبّت بر شما افزون باد.','Mercy unto you, and peace, and love, be multiplied.');
INSERT INTO verses VALUES (6500100003,65001,3,'ای حبیبان، چون شوق تمام داشتم که دربارهٔ نجات عاّم به شما بنویسم، ناچار شدم که الآن به شما بنویسم و نصیحت دهم تا شما مجاهده کنید برای آن ایمانی که یکبار به مقدّسین سپرده شد.','Beloved, when I gave all diligence to write unto you of the common salvation, it was needful for me to write unto you, and exhort you that ye should earnestly contend for the faith which was once delivered unto the saints.');
INSERT INTO verses VALUES (6500100004,65001,4,'زیرا که بعضی اشخاص در خفا درآمده‌اند که از قدیم برای این قصاص مقرّر شده بودند؛ مردمان بی‌دین که فیض خدای ما را به فجور تبدیل نموده و عیسی مسیح آقای واحد و خداوند ما را انکار کرده‌اند.','For there are certain men crept in unawares, who were before of old ordained to this condemnation, ungodly men, turning the grace of our God into lasciviousness, and denying the only Lord God, and our Lord Jesus Christ .');
INSERT INTO verses VALUES (6500100005,65001,5,'پس می‌خواهم شما را یاد دهم، هرچند همه‌چیز را دفعةً می‌دانید که بعد از آنکه خداوند، قوم را از زمین مصر رهایی بخشیده بود، بار دیگر بی‌ایمانان را هلاک فرمود.','I will therefore put you in remembrance, though ye once knew this, how that the Lord, having saved the people out of the land of Egypt , afterward destroyed them that believed not.');
INSERT INTO verses VALUES (6500100006,65001,6,'و فرشتگانی را که ریاست خود را حفظ نکردند بلکه مسکن حقیقی خود را ترک نمودند، در زنجیرهای ابدی در تحت ظلمت بجهت قصاص یومِ عظیم نگاه داشته است.','And the angels which kept not their first estate, but left their own habitation, he hath reserved in everlasting chains under darkness unto the judgment of the great day.');
INSERT INTO verses VALUES (6500100007,65001,7,'و همچنین سدوم و غموره و سایر بُلدان نواحیِ آنها مثل ایشان چونکه زناکار شدند و در پی بشر دیگر افتادند، در عقوبت آتشِ ابدی گرفتار شده، بجهت عبرت مقرّر شدند.','Even as Sodom and Gomorrha, and the cities about them in like manner, giving themselves over to fornication, and going after strange flesh, are set forth for an example, suffering the vengeance of eternal fire.');
INSERT INTO verses VALUES (6500100008,65001,8,'لیکن با وجود این، همهٔٔ این خواب‌بینندگان نیز جسد خود را نجس می‌سازند و خداوندی را خوار می‌شمارند و بر بزرگان تهمت می‌زنند.','Likewise also these filthy dreamers defile the flesh, despise dominion, and speak evil of dignities.');
INSERT INTO verses VALUES (6500100009,65001,9,'امّا می‌کائیل، رئیس ملائکه، چون دربارهٔ جسد موسی با ابلیس منازعه می‌کرد، جرأت ننمود که حکم افترا بر او بزند بلکه گفت، خداوند تو را توبیخ فرماید.','Yet Michael the archangel, when contending with the devil he disputed about the body of Moses , durst not bring against him a railing accusation, but said, The Lord rebuke thee.');
INSERT INTO verses VALUES (6500100010,65001,10,'لکن این اشخاص بر آنچه نمی‌دانند افترا می‌زنند و در آنچه مثل حیوان غیرناطق بالطبّع فهمیده‌اند، خود را فاسد می‌سازند.','But these speak evil of those things which they know not: but what they know naturally, as brute beasts, in those things they corrupt themselves.');
INSERT INTO verses VALUES (6500100011,65001,11,'وای بر ایشان زیرا که به راه قائن رفته‌اند و در گمراهی بلعَام بجهت اُجرت غرق شده‌اند و در مشاجرتِ قورَح هلاک گشته‌اند.','Woe unto them! for they have gone in the way of Cain , and ran greedily after the error of Balaam for reward, and perished in the gainsaying of Core.');
INSERT INTO verses VALUES (6500100012,65001,12,'اینها در ضیافت‌های محبّتانهٔ شما صخره‌ها هستند چون با شما شادی می‌کنند، و شبانانی که خویشتن را بی‌خوف می‌پرورند و ابرهای بی‌آب از بادها رانده شده و درختان صیفی بی‌میوه، دوباره مرده و از ریشه کنده شده،','These are spots in your feasts of charity, when they feast with you, feeding themselves without fear: clouds they are without water, carried about of winds; trees whose fruit withereth, without fruit, twice dead, plucked up by the roots;');
INSERT INTO verses VALUES (6500100013,65001,13,'و امواج جوشیدهٔ دریا که رسوایی خود را مثل کف برمی‌آورند و ستارگان آواره هستند که برای ایشان تاریکی ظلمتِ جاودانی مقرّر است.','Raging waves of the sea, foaming out their own shame; wandering stars, to whom is reserved the blackness of darkness for ever.');
INSERT INTO verses VALUES (6500100014,65001,14,'لکن خنوخ که هفتم از آدم بود، دربارهٔ همین اشخاص خبر داده، گفت، اینک، خداوند با هزاران هزار از مقّدسین خود آمد','And Enoch also, the seventh from Adam , prophesied of these, saying, Behold, the Lord cometh with ten thousands of his saints,');
INSERT INTO verses VALUES (6500100015,65001,15,'تا بر همه داوری نماید و جمیع بی‌دینان را ملزم سازد، بر همهٔ کارهای بی‌دینی که ایشان کردند و بر تمامی سخنان زشت که گناهکاران بی‌دین به خلاف او گفتند.','To execute judgment upon all, and to convince all that are ungodly among them of all their ungodly deeds which they have ungodly committed, and of all their hard speeches which ungodly sinners have spoken against him.');
INSERT INTO verses VALUES (6500100016,65001,16,'اینانند همهمه‌کنان و گِله‌مندان که برحسب شهوات خود سلوک می‌نمایند و به زبان خود سخنان تکبّرآمیز می‌گویند و صورتهای مردم را بجهت سود می‌پسندند.','These are murmurers, complainers, walking after their own lusts; and their mouth speaketh great swelling words, having men''s persons in admiration because of advantage.');
INSERT INTO verses VALUES (6500100017,65001,17,'امّا شما ای حبیبان، بخاطر آورید آن سخنانی که رسولان خداوند ما عیسی مسیح پیش گفته‌اند،','But, beloved, remember ye the words which were spoken before of the apostles of our Lord Jesus Christ ;');
INSERT INTO verses VALUES (6500100018,65001,18,'چون به شما خبر دادند که در زمان آخر مستهزئین خواهند آمد که برحسب شهوات بی‌دینیِ خود رفتار خواهند کرد.','How that they told you there should be mockers in the last time, who should walk after their own ungodly lusts.');
INSERT INTO verses VALUES (6500100019,65001,19,'اینانند که تفرقه‌ها پیدا می‌کنند و نفسانی هستند که روح را ندارند.','These be they who separate themselves, sensual, having not the Spirit.');
INSERT INTO verses VALUES (6500100020,65001,20,'امّا شما ای حبیبان، خود را به ایمانِ اقدس خود بنا کرده و در روح‌القدس عبادت نموده،','But ye, beloved, building up yourselves on your most holy faith, praying in the Holy Ghost,');
INSERT INTO verses VALUES (6500100021,65001,21,'خویشتن را در محبّت خدا محفوظ دارید و منتظر رحمت خداوند ما عیسی مسیح برای حیات جاودانی بوده باشید.','Keep yourselves in the love of God, looking for the mercy of our Lord Jesus Christ unto eternal life.');
INSERT INTO verses VALUES (6500100022,65001,22,'و بعضی را که مجادله می‌کنند ملزم سازید.','And of some have compassion, making a difference:');
INSERT INTO verses VALUES (6500100023,65001,23,'و بعضی را از آتش بیرون کشیده، برهانید و بر بعضی با خوف رحمت کنید و از لباس جسم‌آلود نفرت نمایید.','And others save with fear, pulling them out of the fire; hating even the garment spotted by the flesh.');
INSERT INTO verses VALUES (6500100024,65001,24,'الآن او را که قادر است که شما را از لغزش محفوظ دارد و در حضور جلال خود شما را بی‌عیب به فرحی عظیم قایم فرماید،','Now unto him that is able to keep you from falling, and to present you faultless before the presence of his glory with exceeding joy,');
INSERT INTO verses VALUES (6500100025,65001,25,'یعنی خدای واحد و نجات‌دهندهٔ ما را جلال و عظمت و توانایی و قدرت باد، الآن و تا ابدالآباد. آمین.','To the only wise God our Saviour, be glory and majesty, dominion and power, both now and ever. Amen.');
id INTEGER PRIMARY KEY,
book_id INTEGER NOT NULL,
chapter_number INTEGER NOT NULL,
audio_local TEXT,
audio_online_fa TEXT,
audio_online_en TEXT
);
id INTEGER PRIMARY KEY,
chapter_id INTEGER NOT NULL,
verse_number INTEGER NOT NULL,
text_fa TEXT,
text_en TEXT
);
INSERT INTO chapters VALUES (66001,66,1,NULL,'http://audio1.wordfree.net/bibles/app/audio/20/66/1.mp3','http://audio1.wordfree.net/bibles/app/audio/20/66/1.mp3');
INSERT INTO verses VALUES (6600100001,66001,1,'span class="verse" id="1">1 </span مکاشفهٔ عیسی مسیح، که خدا به او داد تا اموری را که می‌باید زود واقع شود؛ بر غلامان خود ظاهر سازد و به‌وسیلهٔ فرشتهٔ خود فرستاده، آن را ظاهر نمود بر غلام خود یوحنّا:','span class="verse" id="1">1 </span The Revelation of Jesus Christ , which God gave unto him, to shew unto his servants things which must shortly come to pass; and he sent and signified it by his angel unto his servant John :');
INSERT INTO verses VALUES (6600100002,66001,2,'که گواهی داد به کلام خدا و به شهادت عیسی مسیح در اموری که دیده بود.','Who bare record of the word of God, and of the testimony of Jesus Christ , and of all things that he saw.');
INSERT INTO verses VALUES (6600100003,66001,3,'خوشابحال کسی که می‌خواند و آنانی که می‌شنوند کلام این نبوّت را، و آنچه در این مکتوب است نگاه می‌دارند، چونکه وقت نزدیک است.','Blessed is he that readeth, and they that hear the words of this prophecy, and keep those things which are written therein: for the time is at hand.');
INSERT INTO verses VALUES (6600100004,66001,4,'یوحنّا، به هفت کلیسایی که در آسیا هستند: فیض و سلامتی بر شما باد: از او که هست و بود و می‌آید؛ و از هفت روح که پیش تخت وی هستند؛','John to the seven churches which are in Asia: Grace be unto you, and peace, from him which is, and which was, and which is to come; and from the seven Spirits which are before his throne;');
INSERT INTO verses VALUES (6600100005,66001,5,'و از عیسی مسیح که شاهد امین و نخست‌زادهٔ از مردگان و رئیس پادشاهان جهان است. مر او را که ما را محبّت می‌نماید و ما را از گناهان ما به خون خود شست،','And from Jesus Christ , who is the faithful witness, and the first begotten of the dead, and the prince of the kings of the earth. Unto him that loved us, and washed us from our sins in his own blood,');
INSERT INTO verses VALUES (6600100006,66001,6,'و ما را نزد خدا و پدر خود، پادشاهان و کهنه ساخت؛ او را جلال و توانایی باد تا ابدالآباد. آمین.','And hath made us kings and priests unto God and his Father; to him be glory and dominion for ever and ever. Amen.');
INSERT INTO verses VALUES (6600100007,66001,7,'اینک، با ابرها می‌آید؛ و هر چشمی او را خواهد دید، و آنانی که او را نیزه زدند، و تمامی امّت‌های جهان برای وی خواهند نالید. بلی! آمین.','Behold, he cometh with clouds; and every eye shall see him, and they also which pierced him: and all kindreds of the earth shall wail because of him. Even so, Amen.');
INSERT INTO verses VALUES (6600100008,66001,8,'من هستم الف و یا، اوّل و آخر، می‌گوید آن خداوند خدا، که هست و بود و می‌آید، قادر عَلَی‌الاِطلاق.','I am Alpha and Omega, the beginning and the ending, saith the Lord, which is, and which was, and which is to come, the Almighty.');
INSERT INTO verses VALUES (6600100009,66001,9,'من یوحنّا، که برادر شما و شریک در مصیبت و ملکوت و صبر در عیسی مسیح هستم، بجهت کلام خدا و شهادت عیسی مسیح در جزیره‌ای مسمّیٰ به پَطْمُس شدم.','I John , who also am your brother, and companion in tribulation, and in the kingdom and patience of Jesus Christ , was in the isle that is called Patmos, for the word of God, and for the testimony of Jesus Christ .');
INSERT INTO verses VALUES (6600100010,66001,10,'و در روز خداوند در روح شدم، و از عقب خود آوازی بلند چون صدای صور شنیدم،','I was in the Spirit on the Lord''s day, and heard behind me a great voice, as of a trumpet,');
INSERT INTO verses VALUES (6600100011,66001,11,'که می‌گفت، من الف و یا، و اوّل و آخر هستم: آنچه می‌بینی در کتابی بنویس، و آن را به هفت کلیسایی که در آسیا هستند، یعنی به اَفَسُس و اِسمیرنا و پَرغامُس و طیاتیرا و ساردِس و فیلادَلفیه و لائودکیه بفرست.','Saying, I am Alpha and Omega, the first and the last: and, What thou seest, write in a book, and send it unto the seven churches which are in Asia; unto Ephesus, and unto Smyrna, and unto Pergamos, and unto Thyatira, and unto Sardis, and unto Philadelphia, and unto Laodicea.');
INSERT INTO verses VALUES (6600100012,66001,12,'پس رو برگردانیدم تا آن آوازی را که با من تکلّم می‌نمود بنگرم. و چون رو گردانیدم، هفت چراغدان طلا دیدم؛','And I turned to see the voice that spake with me. And being turned, I saw seven golden candlesticks;');
INSERT INTO verses VALUES (6600100013,66001,13,'و در میان هفت چراغدان، شبیه پسرِ انسان را که ردای بلند در بر داشت و بر سینهٔ وی کمربندی طلا بسته بود.','And in the midst of the seven candlesticks one like unto the Son of man, clothed with a garment down to the foot, and girt about the paps with a golden girdle.');
INSERT INTO verses VALUES (6600100014,66001,14,'و سر و موی او سفید چون پشم، مثل برف سفید بود و چشمان او مثل شعلهٔ آتش،','His head and his hairs were white like wool, as white as snow; and his eyes were as a flame of fire;');
INSERT INTO verses VALUES (6600100015,66001,15,'و پایهایش مانند برنج صیقلی که در کوره تابیده شود، و آواز او مثل صدای آبهای بسیار؛','And his feet like unto fine brass, as if they burned in a furnace; and his voice as the sound of many waters.');
INSERT INTO verses VALUES (6600100016,66001,16,'و در دست راست خود هفت ستاره داشت، و از دهانش شمشیری دودمه تیز بیرون می‌آمد، و چهره‌اش چون آفتاب بود که در قوّتش می‌تابد.','And he had in his right hand seven stars: and out of his mouth went a sharp twoedged sword: and his countenance was as the sun shineth in his strength.');
INSERT INTO verses VALUES (6600100017,66001,17,'و چون او را دیدم، مثل مرده پیش پایهایش افتادم. و دست راست خود را بر من نهاده، گفت، ترسان مباش؛ من هستم اوّل و آخر و زنده،','And when I saw him, I fell at his feet as dead. And he laid his right hand upon me, saying unto me, Fear not; I am the first and the last:');
INSERT INTO verses VALUES (6600100018,66001,18,'و مرده شدم؛ و اینک، تا ابدالآباد زنده هستم؛ و کلیدهای موت و عالم اموات نزد من است.','I am he that liveth, and was dead; and, behold, I am alive for evermore, Amen; and have the keys of hell and of death.');
INSERT INTO verses VALUES (6600100019,66001,19,'پس بنویس چیزهایی را که دیدی و چیزهایی که هستند و چیزهایی را که بعد از این خواهند شد؛','Write the things which thou hast seen, and the things which are, and the things which shall be hereafter;');
INSERT INTO verses VALUES (6600100020,66001,20,'سرّ هفت ستاره‌ای را که در دست راست من دیدی و هفت چراغدان طلا را. امّا هفت ستاره، فرشتگان هفت کلیسا هستند: و هفت چراغدان، هفت کلیسا می‌باشند.','The mystery of the seven stars which thou sawest in my right hand, and the seven golden candlesticks. The seven stars are the angels of the seven churches: and the seven candlesticks which thou sawest are the seven churches.');

COMMIT;
