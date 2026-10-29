export interface LoginOtpGuardStore {
  read(key: string): Promise<{ count: number; expiresAt: Date } | null>;
  write(key: string, count: number, expiresAt: Date): Promise<void>;
  remove(keys: string[]): Promise<void>;
}
// Legacy reset codes also establish a login session; changing purpose must not bypass a lock.
export function isLoginOtpPurpose(purpose: unknown) { return purpose === "login" || purpose === "reset"; }
const durations = [60, 300, 900, 3600];
export function loginOtpGuardKeys(emailHash: string) {
  return { failures: `login-otp-failures:${emailHash}`, lock: `login-otp-lock:${emailHash}` };
}
export async function loginOtpRetryAfter(store: LoginOtpGuardStore, emailHash: string, now = Date.now()) {
  const lock = await store.read(loginOtpGuardKeys(emailHash).lock);
  return lock ? Math.max(0,Math.ceil((lock.expiresAt.getTime()-now)/1000)) : 0;
}
/** Caller must hold the account's transaction lock across checking, guessing, and writing. */
export async function recordLoginOtpFailure(store: LoginOtpGuardStore, emailHash: string, now = Date.now(), maximumAttempts = 5) {
  const keys=loginOtpGuardKeys(emailHash);
  const blocked=await loginOtpRetryAfter(store,emailHash,now);
  if(blocked) return { retryAfterSeconds:blocked,attemptsRemaining:0 };
  const previous=await store.read(keys.failures);
  const next=(previous?.count || 0)+1;
  const retryAfterSeconds=next%maximumAttempts === 0 ? durations[Math.min(Math.floor(next/maximumAttempts)-1,durations.length-1)] : 0;
  // Keep the escalation across resends and expired lock rows. Once at one hour,
  // retain the stage and cycle through a fresh group of five attempts.
  await store.write(keys.failures,next >= maximumAttempts*5 ? maximumAttempts*4 : next,new Date('9999-12-31T23:59:59.999Z'));
  if(retryAfterSeconds) await store.write(keys.lock,1,new Date(now+retryAfterSeconds*1000));
  return { retryAfterSeconds,attemptsRemaining:retryAfterSeconds ? 0 : maximumAttempts-(next%maximumAttempts) };
}
export async function clearLoginOtpFailures(store: LoginOtpGuardStore, emailHash: string) {
  const keys=loginOtpGuardKeys(emailHash);
  await store.remove([keys.failures,keys.lock]);
}
export function loginOtpLockMessage(seconds: number) {
  const minutes=Math.ceil(seconds/60);
  return `Too many incorrect login codes. Try again in ${minutes === 60 ? '1 hour' : `${minutes} minute${minutes === 1 ? '' : 's'}`}.`;
}
