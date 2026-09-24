"use client";

import ScrollCrossReveal, { type Verse } from "@/components/ui/3d/ScrollCrossReveal";
import { useLanguage } from "@/providers/LanguageProvider";

const VERSES_BY_LANG: Record<"en" | "fa" | "es", Verse[]> = {
  fa: [
    {
      text: "زیرا خدا جهان را آنقدر محبت کرد که پسر یگانه‌ی خود را داد تا هر که به او ایمان آورد، هلاک نگردد بلکه حیات جاودانی یابد.",
      reference: "یوحنا ۳:۱۶",
    },
    {
      text: "با مسیح مصلوب شده‌ام؛ دیگر من زندگی نمی‌کنم، بلکه مسیح در من زندگی می‌کند.",
      reference: "غلاطیان ۲:۲۰",
    },
    {
      text: "پیام صلیب برای هلاک‌شوندگان جهالت است، اما برای ما که نجات می‌یابیم، قدرت خداست.",
      reference: "۱ قرنتیان ۱:۱۸",
    },
  ],
  en: [
    {
      text: "For God so loved the world that he gave his one and only Son, that whoever believes in him shall not perish but have eternal life.",
      reference: "John 3:16",
    },
    {
      text: "I have been crucified with Christ; it is no longer I who live, but Christ who lives in me.",
      reference: "Galatians 2:20",
    },
    {
      text: "For the message of the cross is foolishness to those who are perishing, but to us who are being saved it is the power of God.",
      reference: "1 Corinthians 1:18",
    },
  ],
  es: [
    {
      text: "Porque de tal manera amó Dios al mundo, que ha dado a su Hijo unigénito, para que todo aquel que en él cree no se pierda, mas tenga vida eterna.",
      reference: "Juan 3:16",
    },
    {
      text: "Con Cristo estoy juntamente crucificado, y ya no vivo yo, más vive Cristo en mí.",
      reference: "Gálatas 2:20",
    },
    {
      text: "Porque la palabra de la cruz es locura a los que se pierden; mas a los que se salvan, es poder de Dios.",
      reference: "1 Corintios 1:18",
    },
  ],
};

export default function GospelStorySection() {
  const { language, isRTL } = useLanguage();
  const verses = VERSES_BY_LANG[language] || VERSES_BY_LANG.fa;

  return <ScrollCrossReveal verses={verses} dir={isRTL ? "rtl" : "ltr"} />;
}
