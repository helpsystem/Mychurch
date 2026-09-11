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
به ربات رسمی <b>کلیسای پروتستان ایرانیان واشنگتن دی‌سی</b> خوش آمدید.

برای اینکه نوتیفیکیشن‌ها و اعلان‌های اختصاصی متناسب با سطح دسترسی خود (مدیریت، شبانی، برودکست یا عضویت) را دریافت کنید، حساب کاربری شما باید به این شناسه متصل باشد:

🆔 <b>شناسه عددی تلگرام شما:</b>
<code>${chatId}</code>

🔗 <b>نحوه اتصال:</b>
۱. وارد سایت کلیسا شوید: <a href="https://www.iranianchurchdc.com/profile">پروفایل کاربری من</a>
۲. در بخش «کانال‌های ارتباطی و اعلان»، شناسه عددی بالا را وارد و ذخیره کنید.
۳. پس از ذخیره، هرگونه دسترسی که توسط مدیر به شما داده شود فوراً در این ربات فعال خواهد شد.
`.trim();

                await sendTelegramMessage(chatId, welcomeUnregistered, {
                    parse_mode: "HTML",
                    reply_markup: {
                        inline_keyboard: [
                            [{ text: "🌐 ورود به پروفایل و ثبت شناسه", url: "https://www.iranianchurchdc.com/profile" }],
                            [{ text: "🕊️ مشاهده دیوار دعای کلیسا", url: "https://www.iranianchurchdc.com/prayers" }]
                        ]
                    }
                });

                return NextResponse.json({ ok: true });
            }

            // User is registered! Respond according to their exact Role & Permissions
            const role = user.role || "User";
            const userName = user.name || fromUser?.first_name || "ایماندار گرامی";
            const perms = user.permissions || {};

            let roleBadge = "👤 عضو کلیسا (Church Member)";
            let roleDescription = "شما اعلان‌های مربوط به وضعیت دعاهای شخصی، گواهی‌های تعمید و فیش‌های خود را در این چت دریافت خواهید کرد.";

            if (role === "Admin") {
                roleBadge = "👑 مدیر ارشد سیستم (System Administrator)";
                roleDescription = "شما دسترسی کامل دارید. تمامی هشدارهای امنیتی، درخواست‌های دعای جدید، اسناد محرمانه، تبرعات، و ارتقای کاربران به صورت آنی برای شما ارسال می‌گردد.";
            } else if (role === "Leader") {
                roleBadge = "🛡️ رهبر کلیسا و خدمت شبانی (Church Leader)";
                roleDescription = "شما دسترسی شبانی دارید. اعلان‌های درخواست‌های دعای جدید اعضا، ارائه‌های موعظه، و اسناد شبانی برای بررسی و تأیید برای شما ارسال می‌گردد.";
            } else if (role === "Operator") {
                roleBadge = "💼 مدیر / اپراتور فنی استودیو (Studio Operator)";
                roleDescription = "شما به کنسول برودکست و رسانه متصل هستید. اعلان‌های استودیوی پخش زنده، سینک کارائوکه، و ذخیره‌سازی مدیا برای شما فعال است.";
            }

            const welcomeRegistered = `
سلام <b>${userName}</b> عزیز! 🕊️
به سامانه اعلان‌های هوشمند <b>کلیسای پروتستان ایرانیان واشنگتن دی‌سی</b> خوش آمدید.

📌 <b>سطح دسترسی فعلی شما در سیستم:</b>
<b>${roleBadge}</b>

📄 <b>وضعیت اعلان‌ها:</b>
${roleDescription}

🔒 <b>سیستم مجوزدهی پویا:</b>
این سیستم مستقیماً به پایگاه داده کلیسا متصل است. در صورتی که مدیر ارشد دسترسی جدیدی به شما اختصاص دهد، فوراً فعال می‌گردد و در صورت لغو دسترسی، اعلان‌های مدیریتی بلافاصله متوقف می‌شوند.
`.trim();

            const actionButtons = [];
            if (role === "Admin") {
                actionButtons.push([{ text: "👑 داشبورد مدیریت کل", url: "https://www.iranianchurchdc.com/admin" }]);
                actionButtons.push([{ text: "🕊️ بررسی درخواست‌های دعا", url: "https://www.iranianchurchdc.com/admin/prayers" }]);
                actionButtons.push([{ text: "📑 بایگانی و اسکنر اسناد", url: "https://www.iranianchurchdc.com/admin/documents" }]);
            } else if (role === "Leader") {
                actionButtons.push([{ text: "🕊️ بررسی و تأیید دعاها", url: "https://www.iranianchurchdc.com/admin/prayers" }]);
                actionButtons.push([{ text: "🛡️ فضای کاری رهبران", url: "https://www.iranianchurchdc.com/admin" }]);
            } else if (role === "Operator") {
                actionButtons.push([{ text: "🎥 استودیوی پخش زنده", url: "https://www.iranianchurchdc.com/broadcast" }]);
                actionButtons.push([{ text: "🎵 بانک سرودها و کارائوکه", url: "https://www.iranianchurchdc.com/admin/worship" }]);
            } else {
                actionButtons.push([{ text: "🕊️ ثبت درخواست دعا", url: "https://www.iranianchurchdc.com/prayers" }]);
                actionButtons.push([{ text: "👤 پروفایل من", url: "https://www.iranianchurchdc.com/profile" }]);
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
        await sendTelegramMessage(chatId, "پیام شما دریافت شد. جهت مشاهده وضعیت دسترسی و پنل خود از دستور /status استفاده فرمایید.");
        return NextResponse.json({ ok: true });

    } catch (err: any) {
        console.error("[Telegram Webhook] Error:", err.message);
        return NextResponse.json({ ok: true });
    }
}
