import { redirect } from "next/navigation";

export const dynamic = "force-dynamic";

// Auto-redirect page that calls restore-access then goes to /admin
export default function RestoreAccessPage() {
    return (
        <html lang="fa" dir="rtl">
            <head>
                <meta charSet="utf-8" />
                <meta name="viewport" content="width=device-width, initial-scale=1" />
                <title>بازیابی دسترسی مدیریت | Restore Admin Access</title>
                <style>{`
                    * { margin: 0; padding: 0; box-sizing: border-box; }
                    body { 
                        background: #09090b; 
                        color: #fff; 
                        font-family: 'Vazirmatn', Tahoma, sans-serif;
                        min-height: 100vh;
                        display: flex;
                        align-items: center;
                        justify-content: center;
                    }
                    .card {
                        background: #1c1917;
                        border: 1px solid rgba(255,255,255,0.1);
                        border-radius: 24px;
                        padding: 40px;
                        max-width: 480px;
                        width: 100%;
                        text-align: center;
                        box-shadow: 0 25px 50px rgba(0,0,0,0.5);
                    }
                    .icon { font-size: 48px; margin-bottom: 16px; }
                    h1 { font-size: 22px; font-weight: 900; margin-bottom: 8px; }
                    p { color: #a1a1aa; font-size: 14px; margin-bottom: 24px; line-height: 1.6; }
                    button {
                        background: #f59e0b;
                        color: #000;
                        border: none;
                        padding: 14px 32px;
                        border-radius: 14px;
                        font-size: 16px;
                        font-weight: 900;
                        cursor: pointer;
                        width: 100%;
                        transition: all 0.2s;
                        font-family: inherit;
                    }
                    button:hover { background: #d97706; transform: scale(0.99); }
                    button:disabled { opacity: 0.6; cursor: not-allowed; transform: none; }
                    .status { margin-top: 20px; font-size: 13px; min-height: 20px; }
                    .success { color: #34d399; }
                    .error { color: #f87171; }
                    .warning { color: #fbbf24; margin-top: 16px; font-size: 12px; }
                `}</style>
            </head>
            <body>
                <div className="card">
                    <div className="icon">🛡️</div>
                    <h1>بازیابی دسترسی مدیریت</h1>
                    <p>
                        اگر با خطای «عدم دسترسی» مواجه شده‌اید، روی دکمه زیر کلیک کنید تا دسترسی شما فوراً بازیابی شود.
                        <br /><br />
                        <small style={{color: '#71717a'}}>ابتدا باید در سایت لاگین کرده باشید.</small>
                    </p>
                    <button id="restoreBtn">
                        🔓 بازیابی دسترسی و ورود به پنل
                    </button>
                    <div className="status" id="status"></div>
                    <p className="warning">⚠️ این صفحه فقط برای ادمین‌ها و رهبران سایت قابل استفاده است.</p>
                </div>
                <script dangerouslySetInnerHTML={{__html: `
                    async function restoreAccess() {
                        const btn = document.getElementById('restoreBtn');
                        const status = document.getElementById('status');
                        btn.disabled = true;
                        btn.textContent = '⏳ در حال بازیابی دسترسی...';
                        status.textContent = '';
                        try {
                            const res = await fetch('/api/admin/restore-access');
                            const data = await res.json();
                            if (data.success) {
                                status.className = 'status success';
                                status.textContent = '✅ ' + data.message;
                                btn.textContent = '✅ موفق! در حال انتقال به پنل...';
                                setTimeout(() => { window.location.href = '/admin'; }, 1500);
                            } else {
                                status.className = 'status error';
                                status.textContent = '❌ ' + (data.error || 'خطای ناشناخته');
                                btn.disabled = false;
                                btn.textContent = '🔓 تلاش مجدد';
                            }
                        } catch(e) {
                            status.className = 'status error';
                            status.textContent = '❌ خطا در اتصال به سرور';
                            btn.disabled = false;
                            btn.textContent = '🔓 تلاش مجدد';
                        }
                    }
                    document.getElementById('restoreBtn').addEventListener('click', restoreAccess);
                `}} />
            </body>
        </html>
    );
}
