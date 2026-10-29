import { createHash, createHmac, randomBytes, randomInt, timingSafeEqual } from "node:crypto";

// Browsers cap persistent cookies at 400 days. Successful session checks renew
// the cookie; server-side sessions remain valid until explicitly revoked.
export const SESSION_SECONDS = 400 * 24 * 60 * 60;
export const SESSION_DATABASE_EXPIRY = "9999-12-31T23:59:59.999Z";
export const OTP_MS = 10 * 60 * 1000;
export function normalizeEmail(value: unknown): string {
  if (typeof value !== "string") throw new Error("Enter a valid email address.");
  const email = value.trim().toLowerCase();
  if (email.length > 254 || !/^[^\s@<>]+@[^\s@<>]+\.[^\s@<>]+$/.test(email)) throw new Error("Enter a valid email address.");
  return email;
}
export function text(value: unknown, max: number, required = false): string {
  if (typeof value !== "string" || value.length > max || /[\x00-\x1f\x7f]/.test(value)) throw new Error("Check the information you entered.");
  const result = value.trim();
  if (required && !result) throw new Error("Complete the required fields.");
  return result;
}
export function newToken() { return randomBytes(32).toString("hex"); }
export function tokenHash(token: string) { return createHash("sha256").update(token).digest("hex"); }
export function newOtp() { return randomInt(100000, 1000000).toString(); }
export function otpHash(secret: string, email: string, purpose: string, code: string) {
  return createHmac("sha256", secret).update(`${email}\0${purpose}\0${code}`).digest("hex");
}
export function equalHash(a: string, b: string) {
  return /^[a-f0-9]{64}$/.test(a) && /^[a-f0-9]{64}$/.test(b) && timingSafeEqual(Buffer.from(a, "hex"), Buffer.from(b, "hex"));
}
export function escapeHtml(value: string) {
  return value.replace(/[&<>"']/g, (char) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[char]!));
}
export function sessionAlive(expiresAt: Date, _lastActive: Date, now = Date.now()) {
  // Keep support for explicitly expired legacy/revoked records, without an idle timeout.
  return expiresAt.getTime() > now;
}

export function validChallenge(record: { purpose: string; codeHash: string; challengeHash: string; attempts: number; expiresAt: Date }, purpose: string, digest: string, browserHash: string, now = Date.now(), maximumAttempts = 5) {
  return record.purpose === purpose && record.attempts < maximumAttempts && record.expiresAt.getTime() > now && equalHash(record.challengeHash, browserHash) && equalHash(record.codeHash, digest);
}
export function imageSignatureMatches(bytes: Uint8Array, mime: string) {
  const header = Buffer.from(bytes);
  if (mime === "image/jpeg") return header.length > 3 && header[0] === 0xff && header[1] === 0xd8 && header[2] === 0xff;
  if (mime === "image/png") return header.subarray(0, 8).equals(Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]));
  if (mime === "image/webp") return header.length >= 12 && header.toString("ascii", 0, 4) === "RIFF" && header.toString("ascii", 8, 12) === "WEBP";
  return false;
}
