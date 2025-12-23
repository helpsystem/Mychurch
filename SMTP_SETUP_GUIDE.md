# 🔐 Gmail App Password Setup Guide

**For:** MyChurch Letter System Email Functionality

---

## Step-by-Step Instructions

### 1️⃣ Open Google Account Settings

Navigate to: https://myaccount.google.com/apppasswords

(Browser will open this for you)

---

### 2️⃣ Sign In

Use your church Gmail account:
- Email: `church@iranianchurchdc.org`
- Or whatever email you want to use for sending letters

---

### 3️⃣ Enable 2-Step Verification (If Not Already Enabled)

If you see "2-Step Verification is off":

1. Click **"Get Started"**
2. Follow the prompts to set up 2-Step
3. Verify with phone number
4. Complete setup

**Then return to:** https://myaccount.google.com/apppasswords

---

### 4️⃣ Generate App Password

1. You should see **"App passwords"** section

2. Click on **"Select app"** dropdown:
   - Choose: **"Mail"**

3. Click on **"Select device"** dropdown:
   - Choose: **"Other (Custom name)"**
   - Type: **"MyChurch Letter System"**

4. Click **"Generate"**

5. Google will show you a **16-character password** like:
   ```
   abcd efgh ijkl mnop
   ```

6. **Copy this password** (you'll need it in the next step)

---

### 5️⃣ Update .env File

Open `.env` file and update these lines:

```env
# Change this to your actual church email
SMTP_USER=church@iranianchurchdc.org

# Paste the 16-character password here (remove spaces)
SMTP_PASS=abcdefghijklmnop
```

**Example:**
```env
SMTP_USER=info@iranianchurchdc.org
SMTP_PASS=xyzw1234abcd5678
```

---

### 6️⃣ Save and Test

1. Save the `.env` file

2. Restart backend:
   ```bash
   # If using PM2
   pm2 restart mychurch-backend
   
   # Or locally
   # Ctrl+C and restart
   ```

3. Test email sending from Letter Management

---

## 🔍 Troubleshooting

### "App passwords not available"
- Make sure 2-Step Verification is enabled
- Sign in with the correct Google account

### "Password doesn't work"
- Remove all spaces from the password
- Make sure you copied the full 16 characters
- Restart backend after changing `.env`

### "Authentication failed"
- Double-check email address
- Generate a new App Password
- Try a different email provider (SendGrid, Mailgun)

---

## 🌟 Alternative Email Providers

If Gmail doesn't work, consider:

### SendGrid (Free 100 emails/day)
```env
SMTP_HOST=smtp.sendgrid.net
SMTP_PORT=587
SMTP_USER=apikey
SMTP_PASS=your_sendgrid_api_key
```

### Mailgun (Free 5,000 emails/month)
```env
SMTP_HOST=smtp.mailgun.org
SMTP_PORT=587
SMTP_USER=postmaster@your-domain.mailgun.org
SMTP_PASS=your_mailgun_password
```

---

**Ready?** Follow the steps above and tell me when you have the App Password!
