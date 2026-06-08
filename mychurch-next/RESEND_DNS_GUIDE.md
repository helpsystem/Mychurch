# 📧 Domain DNS Configuration Guide for Resend (SPF, DKIM, DMARC)

To ensure that welcome emails, OTP/2FA codes, and store purchase receipts from MyChurch land directly in users' Inboxes (rather than Spam or Junk folders), you must configure DNS records on your domain registrar (e.g., GoDaddy, Namecheap, Cloudflare, Google Domains).

Resend utilizes Amazon SES as its delivery backbone. Implementing the correct DKIM, SPF, and DMARC records authorizes Resend to send emails on behalf of your domain (`iranianchurchdc.org`).

---

## 1️⃣ DKIM (DomainKeys Identified Mail)

DKIM cryptographically signs outgoing emails, verifying that the email was indeed sent by your domain and was not altered in transit.

When you add your domain inside the **Resend Dashboard** (Settings -> Domains), Resend will generate **3 CNAME records** for DKIM. You must add them to your DNS manager.

### Example CNAME Records:
| Type | Host / Name | Value / Target | TTL |
| :--- | :--- | :--- | :--- |
| `CNAME` | `resend._domainkey` | `dkim.resend.com` | `Auto / 3600` |
| `CNAME` | `resend2._domainkey` | `dkim2.resend.com` | `Auto / 3600` |
| `CNAME` | `resend3._domainkey` | `dkim3.resend.com` | `Auto / 3600` |

*Note: Replace the values above with the exact CNAME keys and values provided in your Resend Dashboard.*

---

## 2️⃣ SPF (Sender Policy Framework)

SPF lists the authorized IP addresses and servers allowed to send email from your domain.

Since Resend handles email bounces using a custom return path (usually a subdomain like `bounces.iranianchurchdc.org`), Resend sets up the SPF record on that subdomain rather than your root domain.

### A. Subdomain MX & SPF (Required by Resend):
Create the following records in your DNS editor:

1. **MX Record (Mail Exchange)**
   - **Host/Name:** `bounces` (or `bounces.iranianchurchdc.org`)
   - **Priority:** `10`
   - **Value:** `feedback-smtp.us-east-1.amazonses.com`

2. **TXT Record (SPF)**
   - **Host/Name:** `bounces` (or `bounces.iranianchurchdc.org`)
   - **Value:** `v=spf1 include:amazonses.com ~all`

### B. Root Domain SPF (Best Practice):
If you already have a root SPF record (e.g., for Google Workspace/Gmail), append Resend's sending server to it.

- **Existing Record:** `v=spf1 include:_spf.google.com ~all`
- **Updated Record:** `v=spf1 include:_spf.google.com include:amazonses.com ~all`

---

## 3️⃣ DMARC (Domain-based Message Authentication, Reporting, and Conformance)

DMARC uses SPF and DKIM to determine the authenticity of an email message. It tells receiving mail servers (Gmail, Yahoo, Outlook) what to do if an email fails SPF or DKIM checks.

Add the following record to your DNS settings:

| Type | Host / Name | Value | TTL |
| :--- | :--- | :--- | :--- |
| `TXT` | `_dmarc` (or `_dmarc.iranianchurchdc.org`) | `v=DMARC1; p=quarantine; pct=100; rua=mailto:dmarc-reports@iranianchurchdc.org` | `Auto / 3600` |

### DMARC Policy (`p=`) Options:
- `p=none`: Monitoring mode. Fails are logged but emails are still delivered to Inbox. (Good for initial setup).
- `p=quarantine`: Fails are sent directly to the Spam/Junk folder. (Recommended once DNS propagates).
- `p=reject`: Fails are completely blocked/dropped by the recipient server. (Most secure).

---

## 4️⃣ Verifying the Setup

1. Wait **10 to 30 minutes** for DNS records to propagate globally.
2. In your Resend Dashboard, click **"Verify"** next to your domain. Once verified, the status will change to **Active** (green).
3. Test your email delivery by triggering an OTP code or signup on the website and checking the headers (e.g., using "Show original" in Gmail) to verify that `PASS` is displayed next to SPF, DKIM, and DMARC.
