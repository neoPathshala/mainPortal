"use server";
import { eraseFeedbackIdentity, eraseSupportReceipts } from "@/lib/community-storage";

import { cookies } from "next/headers";
import { db } from "@/lib/db";
import { assertSameOrigin, authSecret, cookieOptions, requireSession, reserveOtpSend, rateLimit, SESSION_COOKIE, CHALLENGE_COOKIE } from "@/lib/security/auth";
import { newOtp, newToken, tokenHash, otpHash, validChallenge, OTP_MS, escapeHtml } from "@/lib/security/core";
import { canStudentSignIn } from "@/lib/security/otp-account-policy";
import { deleteStudentSubmissions } from "@/lib/security/student-submissions";
import { deleteManagedAvatar } from "@/lib/security/profile-photo";
import { sendMail } from "@/lib/mailer";
import { generateNeoEmailHtml } from "@/lib/email-template";

const PURPOSE = "delete_account";
const COOKIE = process.env.NODE_ENV === "production" ? "__Host-neopathshala_delete" : "neopathshala_delete";

export async function requestAccountDeletionCode() {
  try {
    await assertSameOrigin();
    const { user, session } = await requireSession();
    const admission = await reserveOtpSend(tokenHash(user.email));
    if (!admission.allowed) return { success: false, message: "Please wait before requesting another code.", retryAfterSeconds: admission.retryAfterSeconds };
    const code = newOtp();
    const challenge = newToken();
    const record = { purpose: PURPOSE, codeHash: otpHash(authSecret(), user.email, PURPOSE, code), challengeHash: tokenHash(`${session.id}:${challenge}`), attempts: 0, expiresAt: new Date(Date.now() + OTP_MS), name: user.name, phone: "", course: "" };
    await db.academicOtp.upsert({ where: { email: user.email }, create: { email: user.email, ...record }, update: record });
    const mail = await sendMail({templateKey:"student-delete",templateValues:{name:user.name,code,expiresIn:"10"}, fromName: "neoPathshala", to: user.email, subject: "Confirm your neoPathshala account deletion", html: generateNeoEmailHtml({ heroTitle: "Confirm account deletion", greeting: `Hello ${escapeHtml(user.name)},`, lead: "Use this code only if you want to permanently delete your account. This action cannot be undone. If you did not request this, ignore this email.", otpCode: code, expiryMinutes: 10 }) });
    if (!mail.success || mail.isTest) {
      await db.academicOtp.deleteMany({ where: { email: user.email, challengeHash: record.challengeHash } });
      return { success: false, message: "We couldn’t send the deletion code. Please try again later." };
    }
    (await cookies()).set(COOKIE, challenge, { ...cookieOptions, maxAge: OTP_MS / 1000 });
    return { success: true, message: "Deletion code sent to your email.", retryAfterSeconds: 60 };
  } catch { return { success: false, message: "Unable to request deletion. Please try again later." }; }
}

export async function deleteMyAccount(code: string, confirmed: boolean) {
  try {
    await assertSameOrigin();
    const { user, session } = await requireSession();
    if (confirmed !== true || typeof code !== "string" || !/^\d{6}$/.test(code)) return { success: false, message: "Enter the six-digit code and confirm permanent deletion." };
    await rateLimit(`account-delete:${user.id}`, 10, 600_000);
    const challenge = (await cookies()).get(COOKIE)?.value;
    if (!challenge || !/^[a-f0-9]{64}$/.test(challenge)) return { success: false, message: "Request a deletion code from this browser first." };
    const browserHash = tokenHash(`${session.id}:${challenge}`);
    const digest = otpHash(authSecret(), user.email, PURPOSE, code);
    const deleted = await db.$transaction(async tx => {
      const otp = await tx.academicOtp.findUnique({ where: { email: user.email } });
      if (!otp || otp.purpose !== PURPOSE || otp.challengeHash !== browserHash) return false;
      const attempt = await tx.academicOtp.updateMany({ where: { email: user.email, purpose: PURPOSE, challengeHash: browserHash, attempts: { lt: 5 }, expiresAt: { gt: new Date() } }, data: { attempts: { increment: 1 } } });
      if (!attempt.count || !validChallenge(otp, PURPOSE, digest, browserHash)) return false;
      const account = await tx.user.findUnique({ where: { id: user.id } });
      if (!account || account.email !== user.email || !canStudentSignIn(account)) return false;
      const consumed = await tx.academicOtp.deleteMany({ where: { email: user.email, purpose: PURPOSE, codeHash: digest, challengeHash: browserHash } });
      if (!consumed.count) return false;
      await tx.academicSession.deleteMany({ where: { userId: user.id } });
      await tx.platformObject.deleteMany({where:{OR:[{key:`student-password:${user.id}`},{key:`security:totp:student:${user.id}`},{key:{startsWith:`security:totp-setup:student:${user.id}:`}},{key:{startsWith:`security:2fa-login:student:${user.id}:`}}]}});
      await tx.platformObject.deleteMany({where:{key:{startsWith:`notice-read:${user.id}:`}}});
      await tx.user.delete({ where: { id: user.id } });
      return true;
    });
    if (!deleted) return { success: false, message: "Invalid or expired deletion code. Request a new code if needed." };
    const jar = await cookies();
    for (const name of [SESSION_COOKIE, `${SESSION_COOKIE}_pwa`, CHALLENGE_COOKIE, COOKIE]) jar.delete(name);
    await Promise.allSettled([deleteManagedAvatar(user.avatarUrl), deleteStudentSubmissions(user.id), eraseFeedbackIdentity(user.id), eraseSupportReceipts(user.id)]);
    return { success: true, message: "Your account has been deleted." };
  } catch { return { success: false, message: "Unable to delete your account. Please try again later." }; }
}
