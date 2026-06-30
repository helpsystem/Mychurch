// ─────────────────────────────────────────────────────────────
//  اطلاعات سربرگ شرکت — این فایل را با اطلاعات واقعی خود عوض کنید
//  Company / letterhead settings — replace with your real data
// ─────────────────────────────────────────────────────────────

export const company = {
  // نام شرکت / Company name
  nameFa: "شرکت نمونه پارس",
  nameEn: "Pars Sample Co.",

  // شعار / Slogan (اختیاری)
  sloganFa: "کیفیت، تعهد، نوآوری",
  sloganEn: "Quality · Commitment · Innovation",

  // لوگو: مسیر داخل پوشه public — مثلاً "/logo.png"
  // اگر خالی باشد، یک لوگوی متنی نمایش داده می‌شود
  logo: "/logo.svg",

  // آدرس / Address
  addressFa: "تهران، خیابان نمونه، پلاک ۱۲۳، طبقه ۴",
  addressEn: "No. 123, Sample St., Tehran, Iran",

  // اطلاعات تماس / Contact
  phone: "+98 21 1234 5678",
  fax: "+98 21 1234 5679",
  email: "info@example.com",
  website: "www.example.com",

  // اطلاعات قانونی / Legal (برای فاکتور)
  economicCode: "۱۱۱۱-۲۲۲۲-۳۳۳۳", // کد اقتصادی
  nationalId: "۱۴۰۰۱۲۳۴۵۶",        // شناسه ملی
  registrationNo: "۵۴۳۲۱",          // شماره ثبت

  // رنگ اصلی برند / Brand color
  brandColor: "#1d4ed8",
  brandColorSoft: "#eff6ff",
};

// تنظیمات پیش‌فرض ایمیل (در .env.local مقداردهی شود)
export const mailDefaults = {
  fromName: company.nameFa,
};
