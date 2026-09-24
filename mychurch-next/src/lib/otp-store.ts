// In-memory OTP store for Admin 2FA
// Since Next.js might clear module cache in dev, we use globalThis
// In production PM2 (fork mode, 1 instance), this is completely safe and persistent.

type OTPRecord = { code: string; expiresAt: number; attempts: number };

const globalForOtp = globalThis as unknown as {
    otpStore: Map<string, OTPRecord> | undefined;
};

const store = globalForOtp.otpStore ?? new Map<string, OTPRecord>();

if (process.env.NODE_ENV !== 'production') {
    globalForOtp.otpStore = store;
}

// A 6-digit code has ~900,000 possibilities; without an attempt cap it is
// brute-forceable well within its 10-minute lifetime by someone who has
// already stolen the primary session (exactly who 2FA exists to stop).
const MAX_VERIFY_ATTEMPTS = 5;

export function generateOTP(email: string): string {
    const existing = store.get(email);
    // If an OTP already exists and is valid for at least 5 more minutes, reuse it
    if (existing && existing.expiresAt > Date.now() + 5 * 60 * 1000) {
        console.log(`[Auth OTP] Reusing existing OTP for ${email}`);
        return existing.code;
    }

    const code = Math.floor(100000 + Math.random() * 900000).toString();
    const expiresAt = Date.now() + 10 * 60 * 1000; // 10 minutes
    store.set(email, { code, expiresAt, attempts: 0 });
    console.log(`[Auth OTP] Generated NEW OTP for ${email}`);
    return code;
}

export function verifyOTP(email: string, code: string): boolean {
    const record = store.get(email);
    if (!record) return false;

    if (Date.now() > record.expiresAt) {
        store.delete(email); // Expired
        return false;
    }

    if (record.attempts >= MAX_VERIFY_ATTEMPTS) {
        store.delete(email); // Too many wrong guesses — force a fresh code
        return false;
    }

    if (record.code === code) {
        store.delete(email); // Success, remove it to prevent reuse
        return true;
    }

    record.attempts += 1;
    return false;
}
