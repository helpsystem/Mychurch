import { getNewsletterSubscribers } from "@/actions/newsletter";
import NewsletterAdminClient from "./NewsletterAdminClient";

export const metadata = {
    title: "Newsletter Management | MyChurch Admin",
};

export default async function NewsletterAdminPage() {
    const { data: subscribers, success, error } = await getNewsletterSubscribers();

    return (
        <div className="p-6 md:p-8 space-y-8" dir="rtl">
            <div className="flex flex-col gap-2">
                <h1 className="text-3xl font-black text-white font-[Vazirmatn]">مدیریت خبرنامه</h1>
                <p className="text-slate-400 font-[Vazirmatn]">
                    در این بخش می‌توانید لیست اعضای خبرنامه را مشاهده کرده و برای آن‌ها ایمیل‌های اطلاع‌رسانی ارسال کنید.
                </p>
            </div>

            {!success ? (
                <div className="bg-red-500/10 border border-red-500/20 text-red-400 p-4 rounded-xl font-[Vazirmatn]">
                    خطا در دریافت لیست اعضا: {error}
                </div>
            ) : (
                <NewsletterAdminClient initialSubscribers={subscribers || []} />
            )}
        </div>
    );
}
