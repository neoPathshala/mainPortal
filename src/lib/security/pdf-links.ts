import "server-only";
import { createCipheriv, createDecipheriv, createHash, randomBytes } from "node:crypto";
import { authSecret } from "./auth";
const key = () => createHash("sha256").update(`pdf-links:${authSecret()}`).digest();
export function encodePDFLink(file: string) {
  const iv = randomBytes(12);
  const cipher = createCipheriv("aes-256-gcm", key(), iv);
  const encrypted = Buffer.concat([cipher.update(JSON.stringify({ file, expires: Date.now() + 6 * 3600000 })), cipher.final()]);
  return Buffer.concat([iv, cipher.getAuthTag(), encrypted]).toString("base64url");
}
export function decodePDFLink(token: string): string {
  if (token.length > 4000) throw new Error("Invalid link");
  const bytes = Buffer.from(token, "base64url");
  const decipher = createDecipheriv("aes-256-gcm", key(), bytes.subarray(0, 12));
  decipher.setAuthTag(bytes.subarray(12, 28));
  const value = JSON.parse(Buffer.concat([decipher.update(bytes.subarray(28)), decipher.final()]).toString());
  if (typeof value.file !== "string" || !Number.isFinite(value.expires) || value.expires < Date.now()) throw new Error("Expired link");
  return value.file;
}
