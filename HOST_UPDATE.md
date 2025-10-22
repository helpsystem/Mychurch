# 🎯 دستور جادویی: هاست آپدیت شو!

## 🚀 استفاده فوق‌العاده ساده

فقط یک دستور:

```powershell
npm run host:update
```

**همین!** 🎉

## چه کاری انجام می‌دهد؟

این دستور به صورت خودکار:

1. ✅ تغییرات شما را commit می‌کند
2. ✅ به GitHub push می‌کند
3. ✅ به سرور SSH می‌زند
4. ✅ آخرین کد را از GitHub می‌گیرد
5. ✅ npm install و build می‌کند
6. ✅ PM2 را ریستارت می‌کند
7. ✅ سایت را live می‌کند

## مثال استفاده

```powershell
# فقط این یک دستور!
npm run host:update
```

خروجی:
```
╔════════════════════════════════════════════╗
║   🚀 AUTO DEPLOYMENT - هاست آپدیت شو!     ║
╚════════════════════════════════════════════╝

📝 مرحله 1: Commit و Push تغییرات به GitHub...
✓ تغییرات یافت شد، در حال commit...
پیام commit را وارد کنید (Enter برای پیش‌فرض): 
✅ تغییرات با موفقیت به GitHub ارسال شد

🚀 مرحله 2: آپدیت خودکار سرور...
✅ اتصال به samanabyar.online برقرار شد
✅ تمام دستورات با موفقیت اجرا شدند

╔════════════════════════════════════════════╗
║        ✅ آپدیت کامل انجام شد!            ║
╚════════════════════════════════════════════╝

🌐 سایت شما آماده است:
   https://samanabyar.online
```

## دستورات دیگر

```powershell
# فقط deployment (بدون commit/push)
npm run deploy

# تست اتصال SSH
npm run test:ssh

# آپلود با FTP (بدون SSH)
npm run deploy:ftp
```

## نکات مهم

- ✅ همیشه قبل از deploy، تغییرات را test کنید
- ✅ اگر خطایی دیدید، لاگ‌ها را بررسی کنید
- ✅ فایل `.env` commit نمی‌شود (برای امنیت)

## عیب‌یابی

### خطا: اتصال SSH برقرار نشد
بررسی کنید اطلاعات در `backend/.env` صحیح باشد:
```env
SSH_HOST=samanabyar.online
SSH_USER=root
SSH_PASS=your_password
```

### خطا: Git push failed
اول commit کنید:
```bash
git add .
git commit -m "message"
git push origin main
```

## 📚 اطلاعات بیشتر

- [راهنمای کامل](./HOST_UPDATE_GUIDE.md)
- [راهنمای deployment](./REMOTE_DEPLOYMENT_GUIDE.md)

---

**یادتون نره:** فقط یک دستور! 🎯

```powershell
npm run host:update
```
