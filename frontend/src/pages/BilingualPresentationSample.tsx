// BilingualPresentationSample.tsx
// ------------------------------------------------------------
// Simple demo with hardcoded sample data
// ------------------------------------------------------------

import React from "react";
import BilingualBiblePresentation, { BiblePayload } from "@/components/BilingualBiblePresentation";

const sampleData: BiblePayload = {
  book_en: "Ephesians",
  book_fa: "افسسیان",
  chapters: [
    {
      chapterNumber: 1,
      verses: [
        {
          verseNumber: 1,
          text_en: "Paul, an apostle of Christ Jesus by the will of God, To God's holy people in Ephesus, the faithful in Christ Jesus:",
          text_fa: "پولس، رسول عیسی مسیح به اراده خدا، به مقدسین که در افسس هستند و ایمانداران در عیسی مسیح:",
        },
        {
          verseNumber: 2,
          text_en: "Grace and peace to you from God our Father and the Lord Jesus Christ.",
          text_fa: "فیض و سلامتی از خدای پدر ما و خداوند عیسی مسیح بر شما باد.",
        },
        {
          verseNumber: 3,
          text_en: "Praise be to the God and Father of our Lord Jesus Christ, who has blessed us in the heavenly realms with every spiritual blessing in Christ.",
          text_fa: "متبارک باد خدا و پدر خداوند ما عیسی مسیح که ما را در مسیح به هر برکت روحانی در جایهای آسمانی برکت داده است.",
        },
        {
          verseNumber: 4,
          text_en: "For he chose us in him before the creation of the world to be holy and blameless in his sight. In love",
          text_fa: "چنانکه ما را در وی پیش از بنیاد عالم برگزیده است تا در نظر او مقدس و بی‌عیب باشیم در محبت.",
        },
        {
          verseNumber: 5,
          text_en: "he predestined us for adoption to sonship through Jesus Christ, in accordance with his pleasure and will—",
          text_fa: "و ما را برای فرزندخواندگی به واسطه عیسی مسیح به موجب مسرت اراده خود برای خود پیش تعیین فرموده است،",
        },
        {
          verseNumber: 6,
          text_en: "to the praise of his glorious grace, which he has freely given us in the One he loves.",
          text_fa: "تا جلال فیض او که ما را در حبیب خود بدان فائز ساخته است، مسبح گردد.",
        },
        {
          verseNumber: 7,
          text_en: "In him we have redemption through his blood, the forgiveness of sins, in accordance with the riches of God's grace",
          text_fa: "که در وی فدیه را از راه خون او یافتیم یعنی آمرزش گناهان را، به موجب دولت فیض وی،",
        },
        {
          verseNumber: 8,
          text_en: "that he lavished on us. With all wisdom and understanding,",
          text_fa: "که آن را بر ما به هر حکمت و فطانت افزون ساخته است،",
        },
        {
          verseNumber: 9,
          text_en: "he made known to us the mystery of his will according to his good pleasure, which he purposed in Christ,",
          text_fa: "و سر اراده خود را به موجب آنچه در او پسندیده بود برای ما ظاهر ساخته است،",
        },
        {
          verseNumber: 10,
          text_en: "to be put into effect when the times reach their fulfillment—to bring unity to all things in heaven and on earth under Christ.",
          text_fa: "تا در تدبیر کمال زمان‌ها همه چیز را که در آسمان و بر زمین است در مسیح جمع کند.",
        },
      ]
    }
  ]
};

const BilingualPresentationSample: React.FC = () => {
  return (
    <BilingualBiblePresentation 
      data={sampleData} 
      autoStart={false}
      bookCode="EPH"
      enableAudio={true}
    />
  );
};

export default BilingualPresentationSample;
