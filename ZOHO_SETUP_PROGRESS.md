# 🚀 Zoho Mail Setup - Step by Step Guide

**Domain:** iranianchurchdc.org  
**Started:** December 22, 2025, 10:12 PM  
**Plan:** Forever Free (5 users)

---

## 📋 Setup Checklist

### Phase 1: Registration
- [ ] Sign up for Zoho Mail Free
- [ ] Enter domain: iranianchurchdc.org
- [ ] Verify email address
- [ ] Complete account setup

### Phase 2: Domain Verification
- [ ] Get verification TXT record from Zoho
- [ ] Add TXT record to IONOS DNS
- [ ] Wait for verification (5-30 minutes)

### Phase 3: MX Records
- [ ] Get MX records from Zoho
- [ ] Add MX records to IONOS DNS:
  - mx.zoho.com (Priority 10)
  - mx2.zoho.com (Priority 20)
  - mx3.zoho.com (Priority 50)
- [ ] Wait for propagation (2-48 hours)

### Phase 4: Create Email Accounts
- [ ] pastor@iranianchurchdc.org
- [ ] admin@iranianchurchdc.org
- [ ] info@iranianchurchdc.org

### Phase 5: Testing
- [ ] Send test email
- [ ] Receive test email
- [ ] Check spam folder
- [ ] Verify mobile access

### Phase 6: Website Integration
- [ ] Update .env with SMTP settings
- [ ] Test email sending from website
- [ ] Verify Letter Management emails work

---

## 🔧 DNS Records to Add

### TXT Record (Verification):
```
Name: @ (or leave blank)
Type: TXT
Value: [Zoho will provide - paste here when ready]
TTL: 3600
```

### MX Records (Email Routing):
```
Record 1:
Priority: 10
Hostname: @ (or domain root)
Points to: mx.zoho.com
TTL: 3600

Record 2:
Priority: 20
Hostname: @
Points to: mx2.zoho.com
TTL: 3600

Record 3:
Priority: 50
Hostname: @
Points to: mx3.zoho.com
TTL: 3600
```

### SPF Record (Optional, for better deliverability):
```
Name: @
Type: TXT
Value: v=spf1 include:zoho.com ~all
TTL: 3600
```

---

## 📧 Email Accounts Plan

### Account 1: Pastor
```
Email: pastor@iranianchurchdc.org
Name: [Pastor Name]
Password: [Strong password]
Role: Super Admin
```

### Account 2: Administrator
```
Email: admin@iranianchurchdc.org
Name: Church Administrator
Password: [Strong password]
Role: Admin
```

### Account 3: Information
```
Email: info@iranianchurchdc.org
Name: Iranian Christian Church DC
Password: [Strong password]
Role: User
```

### Aliases (Free):
```
leaders@iranianchurchdc.org → pastor@...
youth@iranianchurchdc.org → admin@...
events@iranianchurchdc.org → info@...
prayer@iranianchurchdc.org → info@...
```

---

## 🔐 SMTP Settings for Website

After setup complete, update `.env`:

```env
# Zoho SMTP Configuration
SMTP_HOST=smtp.zoho.com
SMTP_PORT=587
SMTP_USER=admin@iranianchurchdc.org
SMTP_PASS=[password_from_zoho]
SMTP_FROM=info@iranianchurchdc.org
```

---

## ⏱️ Timeline

| Step | Estimated Time |
|------|---------------|
| Sign Up | 5 minutes |
| Domain Verification | 5-30 minutes |
| MX Records Setup | 5 minutes |
| MX Propagation | 2-48 hours |
| Create Accounts | 10 minutes |
| **TOTAL** | **2-48 hours** |

**Note:** DNS changes can take up to 48 hours but usually complete in 2-4 hours.

---

## 📱 Access Methods

### Webmail:
```
URL: https://mail.zoho.com
Login: pastor@iranianchurchdc.org
Password: [your password]
```

### Mobile App:
```
iOS: Zoho Mail (App Store)
Android: Zoho Mail (Play Store)

Login with church email
```

### Email Client (Outlook, Apple Mail, etc.):
```
IMAP Incoming:
Server: imap.zoho.com
Port: 993
Security: SSL
Username: pastor@iranianchurchdc.org

SMTP Outgoing:
Server: smtp.zoho.com
Port: 587
Security: TLS
Username: pastor@iranianchurchdc.org
```

---

## 🎯 Next Steps

**After browser opens:**

1. ✅ Click "Sign Up Free" on Zoho Mail page
2. ✅ Enter domain: `iranianchurchdc.org`
3. ✅ Fill registration form
4. ✅ Verify email
5. ✅ Get DNS records
6. ✅ I'll help add to IONOS

---

**Status:** Ready to start! 🚀
Browser will open shortly...
