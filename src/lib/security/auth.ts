import {isMainSite} from '@/lib/platform-site';
import "server-only";
import {getAuthPolicy} from "./auth-settings";
import { cache } from "react";
import { cookies, headers } from "next/headers";
import { randomBytes } from "node:crypto";
import { db } from "@/lib/db";
import { PWA_DEVICE_PREFIX, sessionCookieName, type SessionClientType } from "../session-device";
import { admitOtpSend } from "./otp-delivery";
import { canStudentSignIn } from "./otp-account-policy";
import { ensureSecuritySchema } from "./schema";
import { newToken, tokenHash, sessionAlive, SESSION_SECONDS, SESSION_DATABASE_EXPIRY } from "./core";

export const SESSION_COOKIE = process.env.NODE_ENV === "production" ? "__Host-neopathshala_session" : "neopathshala_session";
export async function getSessionCookie(){return sessionCookieName(SESSION_COOKIE,(await headers()).get('x-session-client')==='pwa'?'pwa':'web');}
export const CHALLENGE_COOKIE = process.env.NODE_ENV === "production" ? "__Host-neopathshala_challenge" : "neopathshala_challenge";
const secretGlobal = globalThis as typeof globalThis & { __NEOPATHSHALA_DEV_AUTH_SECRET__?: string };
const developmentSecret = secretGlobal.__NEOPATHSHALA_DEV_AUTH_SECRET__ ||= randomBytes(32).toString("hex");
export function authSecret() {
  const secret = process.env.AUTH_SECRET;
  if (secret && secret.length >= 32) return secret;
  if (process.env.NODE_ENV === "production") throw new Error("Authentication configuration unavailable.");
  return developmentSecret;
}
export const cookieOptions = { httpOnly: true, secure: process.env.NODE_ENV === "production", sameSite: "lax" as const, path: "/" };
export async function assertSameOrigin() {
  const request = await headers();
  const origin = request.get("origin");
  const fetchSite = request.get("sec-fetch-site");
  if (fetchSite === "cross-site") throw new Error("Request not allowed.");
  const configured = process.env.VERCEL_ENV === "preview" && process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : process.env.APP_ORIGIN;
  if (process.env.NODE_ENV === "production" && !configured) throw new Error("Application origin is not configured.");
  if (!origin || origin !== (configured || `http://${request.get("host")}`)) throw new Error("Request not allowed.");
}
export async function rateLimit(scope: string, limit: number, windowMs: number) {
  await ensureSecuritySchema();
  const bucket = Math.floor(Date.now() / windowMs);
  const entry = await db.academicRateLimit.upsert({
    where: { key: `${scope}:${bucket}` },
    create: { key: `${scope}:${bucket}`, count: 1, expiresAt: new Date((bucket + 2) * windowMs) },
    update: { count: { increment: 1 } },
  });
  if (entry.count > limit) throw new Error("Too many requests. Please try again later.");
}
export async function reserveOtpSend(emailHash: string) {
  const policy=await getAuthPolicy();if(!policy.otpSendRateLimit)return {allowed:true as const,retryAfterSeconds:0};
  await ensureSecuritySchema();
  return db.$transaction(async (tx) => {
    // One short admission lock makes account and platform quotas atomic across workers.
    await tx.$executeRaw`SELECT pg_advisory_xact_lock(728301002)`;
    return admitOtpSend({
      get: (key) => tx.academicRateLimit.findUnique({ where: { key }, select: { count: true, expiresAt: true } }),
      put: async (key, count, expiresAt) => { await tx.academicRateLimit.upsert({ where: { key }, create: { key, count, expiresAt }, update: { count, expiresAt } }); },
    }, emailHash, Date.now(), policy);
  });
}

export const getSession = cache(async function getSession() {
  const token = (await cookies()).get(await getSessionCookie())?.value;
  if (!token || !/^[a-f0-9]{64}$/.test(token)) return null;
  await ensureSecuritySchema();
  const session = await db.academicSession.findUnique({ where: { tokenHash: tokenHash(token) } });
  if (!session || !sessionAlive(session.expiresAt, session.lastActive)) return null;
  const isPwa=(await headers()).get('x-session-client')==='pwa';
  if((session.device||'').startsWith(PWA_DEVICE_PREFIX)!==isPwa)return null;
  const user = await db.user.findUnique({ where: { id: session.userId } });
  if (!user || !isMainSite(user.site) || !canStudentSignIn(user)) return null;
  const persistentExpiry = new Date(SESSION_DATABASE_EXPIRY);
  if (session.lastActive.getTime() < Date.now() - 300_000 || session.expiresAt.getTime() < persistentExpiry.getTime()) {
    // Upgrade existing valid sessions without forcing another sign-in.
    const renewed = await db.academicSession.updateMany({ where: { id: session.id, tokenHash: session.tokenHash }, data: { lastActive: new Date(), expiresAt: persistentExpiry } });
    if (!renewed.count) return null;
    session.expiresAt = persistentExpiry;
  }
  // The session-status route renews the browser cookie without rotating the token.
  return { session, user };
});
export async function requireSession() {
  const auth = await getSession();
  if (!auth) throw new Error("Sign in to continue.");
  return auth;
}
export async function createSession(userId: string, clientType: SessionClientType = "web") {
  await ensureSecuritySchema();
  const isPwa = clientType === "pwa";
  const token = newToken();
  const jar = await cookies();
  const cookieName=sessionCookieName(SESSION_COOKIE,clientType);
  const previous = jar.get(cookieName)?.value;
  const agent = (await headers()).get("user-agent") || "Unknown browser";
  const device = /Firefox/i.test(agent) ? "Firefox" : /Edg/i.test(agent) ? "Edge" : /Chrome/i.test(agent) ? "Chrome" : /Safari/i.test(agent) ? "Safari" : "Browser";
  const os = /Android/i.test(agent) ? "Android" : /iPhone|iPad/i.test(agent) ? "iOS" : /Windows/i.test(agent) ? "Windows" : /Macintosh/i.test(agent) ? "macOS" : "Other device";
  const session = await db.$transaction(async tx => {
    // An account-scoped database lock protects the limit across tabs, workers,
    // and simultaneous sign-ins. Installed PWA sign-ins use the app slot.
    await tx.$queryRaw`SELECT 1 AS locked FROM pg_advisory_xact_lock(hashtext(${`academic-session:${userId}`}))`;
    const account = await tx.user.findUnique({ where: { id: userId } });
    if (!account || !isMainSite(account.site) || !canStudentSignIn(account)) throw new Error("This account cannot sign in.");
    const now = new Date();
    await tx.academicSession.deleteMany({ where: { userId, expiresAt: { lte: now } } });
    if (previous && /^[a-f0-9]{64}$/.test(previous)) await tx.academicSession.deleteMany({ where: { userId, tokenHash: tokenHash(previous) } });
    const policy = account.devicePolicy === "inherit" ? (await getAuthPolicy()).devicePolicy : account.devicePolicy;
    if (policy !== "unlimited") {
      const webAndPwa = policy === "1_web_1_app";
      const limit = /^custom:([1-9]|[1-9][0-9]|100)$/.test(policy) ? Number(policy.split(":")[1]) : 1;
      const slot = webAndPwa ? { device: isPwa ? { startsWith: PWA_DEVICE_PREFIX } : { not: { startsWith: PWA_DEVICE_PREFIX } } } : {};
      const excess = await tx.academicSession.findMany({where: {userId, ...slot}, orderBy: [{createdAt: "desc"}, {id: "desc"}], skip: limit - 1, select: {id:true}});
      let revokedCount = excess.length ? (await tx.academicSession.deleteMany({where:{userId,id:{in:excess.map(item=>item.id)}}})).count : 0;
      if (webAndPwa) {
        const other = await tx.academicSession.findMany({where:{userId,device:isPwa?{not:{startsWith:PWA_DEVICE_PREFIX}}:{startsWith:PWA_DEVICE_PREFIX}},orderBy:[{createdAt:"desc"},{id:"desc"}],skip:1,select:{id:true}});
        if(other.length)revokedCount += (await tx.academicSession.deleteMany({where:{userId,id:{in:other.map(item=>item.id)}}})).count;
      }
      if (revokedCount) await tx.superAdminAuditLog.create({ data: {
        userId, action: "academic.device_limit_enforced", details: `${revokedCount} previous device session(s) revoked after a new verified ${isPwa ? "PWA" : "browser"} sign-in`, ipAddress: "Not collected", severity: "info",
      } });
    }
    return tx.academicSession.create({ data: { userId, tokenHash: tokenHash(token), device: `${isPwa ? PWA_DEVICE_PREFIX : "Browser · "}${device} on ${os}`, expiresAt: new Date(SESSION_DATABASE_EXPIRY) } });
  });
  // Publish the new cookie only after replacement and creation both commit.
  jar.set(cookieName, token, { ...cookieOptions, maxAge: SESSION_SECONDS });
  return session;
}

export async function audit(userId: string, action: string, details: string) {
  await db.superAdminAuditLog.create({ data: { userId, action: `academic.${action}`, details, ipAddress: "Not collected", severity: "info" } });
}
