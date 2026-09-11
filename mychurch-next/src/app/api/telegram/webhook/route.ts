import { NextRequest, NextResponse } from "next/server";
import { query } from "@/lib/db";
import { sendTelegramMessage } from "@/services/telegram";

export const dynamic = "force-dynamic";

export async function POST(req: NextRequest) {
    try {
        const body = await req.json().catch(() => null);
        if (!body || !body.message) {
            return NextResponse.json({ ok: true });
        }

        const msg = body.message;
        const chatId = msg.chat?.id?.toString();
        const text = msg.text?.trim() || "";
        const fromUser = msg.from;

        if (!chatId) {
            return NextResponse.json({ ok: true });
        }

        console.log(`[Telegram Webhook] Received message from ${chatId} (${fromUser?.username || fromUser?.first_name}): "${text}"`);

        // Check if user is registered in the church database
        const dbUserRes = await query(
            `SELECT id, email, name, role, permissions, telegram_id, phone 
             FROM users 
             WHERE telegram_id = $1 OR (telegram_id IS NULL AND phone IS NOT NULL AND $2 != '' AND phone LIKE '%' || $2)
             LIMIT 1`,
            [chatId, fromUser?.phone_number || '']
        );

        const user = dbUserRes.rows && dbUserRes.rows[0];

        // Handle /start, /status, /help
        if (text.startsWith("/start") || text.startsWith("/status") || text.startsWith("/help")) {
            if (!user) {
                // Unregistered user
                const welcomeUnregistered = `
سلام ${fromUser?.first_name || 'گرامی'} عزیز! 🕊️
Hello dear ${fromUser?.first_name || 'friend'}!

به ربات رسمی <b>کلیسای پروتستان ایرانیان واشنگتن دی‌سی</b> خوش آمدید.
Welcome to the official Telegram bot of <b>Iranian Presbyterian Church DC</b>.

برای اینکه نوتیفیکیشن‌ها و اعلان‌های اختصاصی متناسب با سطح دسترسی خود (مدیریت، شبانی، برودکست یا عضویت) را دریافت کنید، حساب کاربری شما باید به این شناسه متصل باشد:
To receive custom notifications matching your role (Admin, Pastoral, Operator, or Member), connect your account using your Telegram Chat ID:

🆔 <b>شناسه عددی تلگرام شما | Your Telegram Chat ID:</b>
<code>${chatId}</code>

🔗 <b>نحوه اتصال | How to connect:</b>
۱. وارد پروفایل خود در سایت شوید | Go to: <a href="https://www.iranianchurchdc.com/profile">پروفایل کاربری من | My Profile</a>
۲. در بخش «کانال‌های ارتباطی و اعلان»، شناسه عددی بالا را ذخیره کنید.
Enter and save the numeric ID above in the "Communication & Notifications" section.
۳. پس از ذخیره، دسترسی‌های شما بلافاصله در این ربات فعال خواهند شد.
Your role permissions and alerts will activate immediately.
`.trim();

                await sendTelegramMessage(chatId, welcomeUnregistered, {
                    parse_mode: "HTML",
                    reply_markup: {
                        inline_keyboard: [
                            [{ text: "🌐 ورود به پروفایل و ثبت شناسه | Profile & Setup", url: "https://www.iranianchurchdc.com/profile" }],
                            [{ text: "🕊️ مشاهده دیوار دعا | Prayer Wall", url: "https://www.iranianchurchdc.com/prayers" }]
                        ]
                    }
                });

                return NextResponse.json({ ok: true });
            }

            // User is registered! Respond according to their exact Role & Permissions
            const role = user.role || "User";
            const userName = user.name || fromUser?.first_name || "ایماندار گرامی";
            const perms = user.permissions || {};

            let roleBadge = "👤 عضو کلیسا | Church Member";
            let roleDescription = "شما اعلان‌های مربوط به وضعیت دعاهای شخصی، گواهی‌ها و حساب کاربری خود را در این چت دریافت خواهید کرد.\nYou will receive notifications regarding your personal prayers, certificates, and church account updates.";

            if (role === "Admin") {
                roleBadge = "👑 مدیر ارشد سیستم | System Administrator";
                roleDescription = "شما دسترسی کامل دارید. تمامی هشدارهای امنیتی، درخواست‌های دعای جدید، اسناد محرمانه، تبرعات، و ارتقای کاربران به صورت آنی برای شما ارسال می‌گردد.\nYou have full system access. All security alerts, new prayer requests, confidential documents, and user permission updates are sent to you in real-time.";
            } else if (role === "Leader") {
                roleBadge = "🛡️ رهبر کلیسا و خدمت شبانی | Church Leader / Pastoral Staff";
                roleDescription = "شما دسترسی شبانی دارید. اعلان‌های درخواست‌های دعای جدید اعضا، ارائه‌های موعظه، و اسناد شبانی برای بررسی و تأیید برای شما ارسال می‌گردد.\nYou have pastoral access. Member prayer requests, sermon presentations, and pastoral documents are routed to you for review and approval.";
            } else if (role === "Operator") {
                roleBadge = "💼 مدیر / اپراتور فنی استودیو | Studio & Broadcast Operator";
                roleDescription = "شما به کنسول برودکست متصل هستید. اعلان‌های استودیوی پخش زنده، سینک کارائوکه، و ذخیره‌سازی مدیا برای شما فعال است.\nYou are connected to the Broadcast Console. Live studio, karaoke sync, and media storage notifications are active.";
            }

            const welcomeRegistered = `
سلام <b>${userName}</b> عزیز! 🕊️
Hello dear <b>${userName}</b>!

به سامانه اعلان‌های هوشمند <b>کلیسای پروتستان ایرانیان واشنگتن دی‌سی</b> خوش آمدید.
Welcome to the intelligent notification system of <b>Iranian Presbyterian Church DC</b>.

📌 <b>سطح دسترسی فعلی شما در سیستم | Your System Role:</b>
<b>${roleBadge}</b>

📄 <b>وضعیت اعلان‌ها | Notification Status:</b>
${roleDescription}

🔒 <b>سیستم مجوزدهی پویا | Dynamic Permissions:</b>
این سیستم مستقیماً به پایگاه داده کلیسا متصل است و تغییرات سطح دسترسی به صورت خودکار و آنی اعمال می‌گردد.
Connected directly to the church database. Permissions and alerts are updated dynamically in real-time.
`.trim();

            const actionButtons = [];
            if (role === "Admin") {
                actionButtons.push([{ text: "👑 داشبورد مدیریت کل | Admin Cockpit", url: "https://www.iranianchurchdc.com/admin" }]);
                actionButtons.push([{ text: "🕊️ بررسی درخواست‌های دعا | Review Prayers", url: "https://www.iranianchurchdc.com/admin/prayers" }]);
                actionButtons.push([{ text: "📑 بایگانی و اسکنر اسناد | Documents", url: "https://www.iranianchurchdc.com/admin/documents" }]);
            } else if (role === "Leader") {
                actionButtons.push([{ text: "🕊️ بررسی و تأیید دعاها | Review Prayers", url: "https://www.iranianchurchdc.com/admin/prayers" }]);
                actionButtons.push([{ text: "🛡️ فضای کاری رهبران | Leader Workspace", url: "https://www.iranianchurchdc.com/admin" }]);
            } else if (role === "Operator") {
                actionButtons.push([{ text: "🎥 استودیوی پخش زنده | Broadcast Studio", url: "https://www.iranianchurchdc.com/broadcast" }]);
                actionButtons.push([{ text: "🎵 بانک سرودها و کارائوکه | Worship Songs", url: "https://www.iranianchurchdc.com/admin/worship" }]);
            } else {
                actionButtons.push([{ text: "🕊️ ثبت درخواست دعا | Submit Prayer", url: "https://www.iranianchurchdc.com/prayers" }]);
                actionButtons.push([{ text: "👤 پروفایل من | My Profile", url: "https://www.iranianchurchdc.com/profile" }]);
            }

            await sendTelegramMessage(chatId, welcomeRegistered, {
                parse_mode: "HTML",
                reply_markup: {
                    inline_keyboard: actionButtons
                }
            });

            return NextResponse.json({ ok: true });
        }

        // Generic reply for any other message
        await sendTelegramMessage(
            chatId,
            "پیام شما دریافت شد. جهت مشاهده وضعیت دسترسی از دستور /status استفاده فرمایید.\nYour message was received. Please use the /status command to check your access level and panel."
        );
        return NextResponse.json({ ok: true });

    } catch (err: any) {
        console.error("[Telegram Webhook] Error:", err.message);
        return NextResponse.json({ ok: true });
    }
}
