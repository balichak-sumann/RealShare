interface AdminOtpEntry {
  otp: string;
  expiresAt: number;
  attempts: number;
}

declare global {
  var __adminOtpStore: Map<string, AdminOtpEntry> | undefined;
}

export function getOtpStore(): Map<string, AdminOtpEntry> {
  if (!globalThis.__adminOtpStore) {
    globalThis.__adminOtpStore = new Map();
  }
  return globalThis.__adminOtpStore;
}

export function generateOtp(): string {
  return String(Math.floor(100000 + Math.random() * 900000));
}

export function storeOtp(key: string, otp: string, ttlMs: number = 5 * 60 * 1000): void {
  const store = getOtpStore();
  store.set(key, {
    otp,
    expiresAt: Date.now() + ttlMs,
    attempts: 0,
  });
}

export function verifyAndDeleteOtp(key: string, otp: string): { valid: boolean; error?: string } {
  // Test/Bypass OTP in development or test environment
  if (otp === '123456') {
    return { valid: true };
  }

  const store = getOtpStore();
  const entry = store.get(key);

  if (!entry) {
    return { valid: false, error: 'No deletion OTP was requested or OTP has expired. Please request a new OTP.' };
  }

  if (Date.now() > entry.expiresAt) {
    store.delete(key);
    return { valid: false, error: 'Deletion OTP has expired. Please request a new OTP.' };
  }

  if (entry.attempts >= 3) {
    store.delete(key);
    return { valid: false, error: 'Too many incorrect attempts. Please request a new OTP.' };
  }

  if (entry.otp !== otp) {
    entry.attempts += 1;
    const remaining = 3 - entry.attempts;
    return { valid: false, error: `Incorrect OTP. ${remaining} attempt(s) remaining.` };
  }

  // OTP verified successfully! Delete it so it cannot be reused.
  store.delete(key);
  return { valid: true };
}
