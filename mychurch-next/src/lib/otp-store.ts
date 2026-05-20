// In-memory OTP store for Admin 2FA
// Since Next.js might clear module cache in dev, we use globalThis
// In production PM2 (fork mode, 1 instance), this is completely safe and persistent.

type OTPRecord = { code: string; expiresAt: number };

const globalForOtp = globalThis as unknown as {
    otpStore: Map<string, OTPRecord> | undefined;
};

const store = globalForOtp.otpStore ?? new Map<string, OTPRecord>();

if (process.env.NODE_ENV !== 'production') {
    globalForOtp.otpStore = store;
}

export function generateOTP(email: string): string {
    const code = Math.floor(100000 + Math.random() * 900000).toString();
    const expiresAt = Date.now() + 10 * 60 * 1000; // 10 minutes
    store.set(email, { code, expiresAt });
    return code;
}

export function verifyOTP(email: string, code: string): boolean {
    const record = store.get(email);
    if (!record) return false;
    
    if (Date.now() > record.expiresAt) {
        store.delete(email); // Expired
        return false;
    }
    
    if (record.code === code) {
        store.delete(email); // Success, remove it to prevent reuse
        return true;
    }
    
    return false;
}
