import type {AuthPolicy} from './auth-policy';
/** Run inside a database transaction with a cross-worker lock. No mail is sent here. */
export type OtpAdmission = { allowed: true; retryAfterSeconds: number } | { allowed: false; retryAfterSeconds: number; reason: "cooldown" | "hourly" | "capacity" };
export type OtpRateStore = {
  get: (key: string) => Promise<{ count: number; expiresAt: Date } | null>;
  put: (key: string, count: number, expiresAt: Date) => Promise<void>;
};
export async function admitOtpSend(store: OtpRateStore, emailHash: string, now = Date.now(), policy: Pick<AuthPolicy, 'otpHourlyLimit' | 'otpGlobalHourlyLimit' | 'otpResendSeconds'> = {otpHourlyLimit:5, otpGlobalHourlyLimit:100, otpResendSeconds:60}): Promise<OtpAdmission> {
  const hour = 3_600_000;
  const bucket = Math.floor(now / hour);
  const hourReset = (bucket + 1) * hour;
  const cooldownKey = `otp-send-cooldown:${emailHash}`;
  const accountKey = `otp-hour:${emailHash}:${bucket}`;
  const capacityKey = `otp-global:${bucket}`;
  const [cooldown, account, capacity] = await Promise.all([store.get(cooldownKey), store.get(accountKey), store.get(capacityKey)]);
  const retry = (until: number) => Math.max(1, Math.ceil((until - now) / 1000));
  // Check every limit before reserving any quota. Rejected clicks never extend a lockout.
  if ((account?.count || 0) >= policy.otpHourlyLimit) return { allowed: false, reason: "hourly", retryAfterSeconds: retry(hourReset) };
  if ((capacity?.count || 0) >= policy.otpGlobalHourlyLimit) return { allowed: false, reason: "capacity", retryAfterSeconds: retry(hourReset) };
  if (cooldown && cooldown.expiresAt.getTime() > now) return { allowed: false, reason: "cooldown", retryAfterSeconds: retry(cooldown.expiresAt.getTime()) };
  await store.put(cooldownKey, 1, new Date(now + policy.otpResendSeconds * 1000));
  await store.put(accountKey, (account?.count || 0) + 1, new Date(hourReset + hour));
  await store.put(capacityKey, (capacity?.count || 0) + 1, new Date(hourReset + hour));
  return { allowed: true, retryAfterSeconds: policy.otpResendSeconds };
}

/** A rejected admission never calls delivery, including when requests race across workers. */
export async function deliverAdmittedOtp<T>(reserve: () => Promise<OtpAdmission>, deliver: () => Promise<T>) {
  const admission = await reserve();
  if (!admission.allowed) return { delivered: false as const, admission };
  return { delivered: true as const, admission, result: await deliver() };
}
