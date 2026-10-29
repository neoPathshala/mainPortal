"use server";
import {MAIN_SITE_IDS} from '@/lib/platform-site';
import {validPhone} from "@/lib/form-validation";
import {beginSecondFactor} from "@/lib/two-factor.server";
import {getAuthPolicy} from "@/lib/security/auth-settings";
import {issuePasswordGrant} from "@/lib/security/password-grant";
import { getNavigationCatalog } from "@/lib/catalog.server";


import { saveEnrollment } from "@/lib/security/enrollment";
import { isLoginOtpPurpose, loginOtpRetryAfter, recordLoginOtpFailure, clearLoginOtpFailures, loginOtpLockMessage, type LoginOtpGuardStore } from "@/lib/security/login-otp-lockout";
import { writeManagedAvatar, deleteManagedAvatar, saveAvatarReference } from "@/lib/security/profile-photo";
import { cookies, headers } from "next/headers";
import { db } from "@/lib/db";
import { sendMail } from "@/lib/mailer";
import { generateNeoEmailHtml } from "@/lib/email-template";
import { assertSameOrigin, authSecret, CHALLENGE_COOKIE, cookieOptions, createSession, rateLimit, reserveOtpSend, requireSession, getSessionCookie, audit } from "@/lib/security/auth";
import { escapeHtml, normalizeEmail, newToken, newOtp, otpHash, tokenHash, equalHash, text, imageSignatureMatches, validChallenge } from "@/lib/security/core";

import { deliverAdmittedOtp } from "@/lib/security/otp-delivery";
import { canStudentSignIn, otpAccountPolicy, withEligibleOtpAccount } from "@/lib/security/otp-account-policy";
import { isAllowedAccountEmail,accountEmailDomainHint } from "@/lib/security/email-domains";


import { revalidatePath } from "next/cache";
import { savedElectives } from "@/lib/security/elective-preferences";
import { electiveSelectionError, replaceElectiveSelection } from "@/lib/elective-policy";

function loginGuardStore(client: Pick<typeof db, "academicRateLimit">): LoginOtpGuardStore {
  return {
    read: key => client.academicRateLimit.findUnique({where:{key}}),
    write: async (key,count,expiresAt) => {await client.academicRateLimit.upsert({where:{key},create:{key,count,expiresAt},update:{count,expiresAt}});},
    remove: async keys => {await client.academicRateLimit.deleteMany({where:{key:{in:keys}}});},
  };
}

export async function dispatchOtpEmailAction(data: { email: string; name?: string; phone?: string; course?: string; semester?: number | null; electives?: string[]; purpose: "register" | "login" | "reset" }) {
  try {
    await assertSameOrigin();
    if (data.purpose === "register") {
      const settings=await db.siteConfig.findFirst({where:{site: {in: MAIN_SITE_IDS}}});
      if(settings && (!settings.allowRegistration || settings.maintenanceMode))return {success:false,message:"Registration is temporarily closed."};
    }
    const authPolicy=await getAuthPolicy();
    if(data.purpose==="login"&&!authPolicy.otpLogin)return {success:false,message:"Email-code sign-in is disabled. Use your password."};
    if(data.purpose==="reset"&&(!authPolicy.passwordLogin||!authPolicy.passwordReset))return {success:false,message:"Password recovery is disabled."};
    const secret = authSecret();
    const email = normalizeEmail(data.email);
    if (!await isAllowedAccountEmail(email)) return { success: false, status: "domain_not_allowed", message: await accountEmailDomainHint() };
    if (!["register", "login", "reset"].includes(data.purpose)) throw new Error("Invalid request.");
    const requestHeaders = await headers();
    const requestAddress = requestHeaders.get("x-forwarded-for")?.split(",")[0].trim() || requestHeaders.get("x-real-ip") || "unknown";
    if(authPolicy.otpSendRateLimit)await rateLimit(`auth-request-address:${tokenHash(requestAddress)}`, authPolicy.loginRequestsPerIP, 600_000);
    if(authPolicy.otpSendRateLimit)await rateLimit(`auth-request-email:${tokenHash(email)}`, authPolicy.otpHourlyLimit * 4, 3_600_000);
    const account = await db.user.findFirst({ where: { site: {in: MAIN_SITE_IDS}, email: { equals: email, mode: "insensitive" } }, select: { role: true, status: true, emergencyLockdown: true, name: true } });
    const policy = otpAccountPolicy(account, data.purpose);
    if (!policy.allowed) return { success: false, status: policy.status, message: policy.message };
    if (authPolicy.loginRateLimit && isLoginOtpPurpose(data.purpose)) {
      const retryAfterSeconds=await loginOtpRetryAfter(loginGuardStore(db),tokenHash(email));
      if(retryAfterSeconds) return {success:false,status:"otp_locked" as const,retryAfterSeconds,message:loginOtpLockMessage(retryAfterSeconds)};
    }
    const name = text(data.purpose === "register" ? data.name || "" : account?.name || "Student", 100, true);
    const phone = text(data.phone || "", 25);
    if (!validPhone(phone)) return { success: false, message: "Enter a valid phone number." };
    const academic = data.purpose === "register" ? (await getNavigationCatalog()).registrationAcademics(data.course, data.semester, data.electives) : null;
    if (academic && !academic.valid) return { success: false, message: academic.message };
    const course = academic?.valid ? JSON.stringify({ version: 1, course: academic.course.slug, semester: academic.semester, electives: academic.electives }) : "";
    const eligibility = await withEligibleOtpAccount(account, data.purpose, () => deliverAdmittedOtp(() => reserveOtpSend(tokenHash(email)), async () => {
    const code = newOtp();
    const challenge = newToken();
    const record = { purpose: data.purpose, codeHash: otpHash(secret, email, data.purpose, code), challengeHash: tokenHash(challenge), attempts: 0, expiresAt: new Date(Date.now() + authPolicy.otpExpiryMinutes * 60_000), name, phone, course };
    if(authPolicy.loginRateLimit && isLoginOtpPurpose(data.purpose)) {
      const blocked=await db.$transaction(async tx => {
        await tx.$executeRaw`SELECT pg_advisory_xact_lock(728301005, hashtext(${tokenHash(email)}))`;
        const retry=await loginOtpRetryAfter(loginGuardStore(tx),tokenHash(email));
        if(retry) return retry;
        await tx.academicOtp.upsert({where:{email},create:{email,...record},update:record});
        return 0;
      });
      if(blocked) return {success:false,status:"otp_locked" as const,retryAfterSeconds:blocked,message:loginOtpLockMessage(blocked)};
    } else await db.academicOtp.upsert({ where: { email }, create: { email, ...record }, update: record });
    const mail = await sendMail({ templateKey:"student-otp",templateValues:{name,code,expiresIn:String(authPolicy.otpExpiryMinutes)},fromName: "neoPathshala", to: email, subject: "Your neoPathshala verification code", html: generateNeoEmailHtml({ heroTitle: "Your sign-in code", greeting: `Hello ${escapeHtml(name)},`, lead: "Use this code to continue to your student account. If this was not you, ignore this email.", otpCode: code, expiryMinutes: authPolicy.otpExpiryMinutes }) });
    if (!mail.success || mail.isTest) {
      await db.academicOtp.deleteMany({ where: { email, challengeHash: tokenHash(challenge) } });
      return { success: false, message: "Email delivery is unavailable. Please try again later." };
    }
    (await cookies()).set(CHALLENGE_COOKIE, challenge, { ...cookieOptions, maxAge: authPolicy.otpExpiryMinutes * 60 });
    // Do not expose mail-provider errors, test inbox URLs, or codes to the caller.
    return { success: true, message: "Check your email for a verification code.", retryAfterSeconds: authPolicy.otpSendRateLimit ? authPolicy.otpResendSeconds : 0, status: "sent" as const };
    }));
    if (!eligibility.eligible) return { success: false, status: eligibility.status, message: eligibility.message };
    const delivery = eligibility.result;
    if (delivery.delivered) return delivery.result;
    const { retryAfterSeconds, reason } = delivery.admission;
    const browserChallenge = (await cookies()).get(CHALLENGE_COOKIE)?.value;
    const activeCode = browserChallenge ? await db.academicOtp.findUnique({ where: { email } }) : null;
    const canVerifyExisting = !!(activeCode && activeCode.purpose === data.purpose && activeCode.expiresAt.getTime() > Date.now() && (isLoginOtpPurpose(data.purpose) || activeCode.attempts < authPolicy.verificationAttempts) && equalHash(activeCode.challengeHash, tokenHash(browserChallenge!)));
    return { success: false, status: "rate_limited" as const, retryAfterSeconds, canVerifyExisting,
      message: reason === "cooldown" ? "No new code was sent. Use the code already requested, or wait for the resend timer." : reason === "hourly" ? `You’ve reached ${authPolicy.otpHourlyLimit} code requests this hour. No new code was sent.` : "Code requests are temporarily busy. No new code was sent. Please try again later." };

  } catch (error) {
    const code = error && typeof error === "object" && "code" in error ? String(error.code) : "";
    console.error("[auth] Verification code request failed", { code: code || "configuration-or-validation" });
    const message = error instanceof Error ? error.message : "";
    if (/Too many requests/.test(message)) return { success: false, message: "Too many sign-in attempts. Please wait before trying again." };
    if (code === "P2021" || code === "P2022") return { success: false, message: "Sign-in needs a database update. Please contact support." };
    if (["P1001", "P1002", "P1017", "ENOTFOUND", "ECONNREFUSED"].includes(code) || /reach database|connect|ENOTFOUND|ECONNREFUSED/i.test(message)) return { success: false, message: "The account database is unavailable. Please try again shortly." };
    if (/Request not allowed/.test(message)) return { success: false, message: "Open the app using its configured address and try again." };
    if (/configuration|origin is not configured/i.test(message)) return { success: false, message: "Sign-in is not configured yet. Please contact support." };
    return { success: false, message: "Unable to send a code. Check your email address and try again." };
  }
}

export async function verifyOtpAction(data: { email: string; code: string; purpose?: string; clientType?: "web" | "pwa" }) {
  try {
    await assertSameOrigin();
    const authPolicy=await getAuthPolicy();
    if(data.purpose==="login"&&!authPolicy.otpLogin)return {success:false,error:"Email-code sign-in is disabled. Use your password."};
    if(data.purpose==="reset"&&(!authPolicy.passwordLogin||!authPolicy.passwordReset))return {success:false,error:"Password recovery is disabled."};
    const email = normalizeEmail(data.email);
    if (!await isAllowedAccountEmail(email)) return { success: false, error: await accountEmailDomainHint() };
    if (typeof data.code !== "string" || !/^\d{6}$/.test(data.code) || !["register", "login", "reset"].includes(data.purpose || "")) return { success: false, error: "Invalid or expired code." };
    if(authPolicy.loginRateLimit&&!isLoginOtpPurpose(data.purpose)) await rateLimit(`verify:${tokenHash(email)}`, 10, 600_000);
    const challenge = (await cookies()).get(CHALLENGE_COOKIE)?.value;
    if (!challenge || !/^[a-f0-9]{64}$/.test(challenge)) return { success: false, error: "Request a code from this browser first." };
    const digest = otpHash(authSecret(), email, data.purpose!, data.code);
    const result = await db.$transaction(async (tx) => {
      if(authPolicy.loginRateLimit && isLoginOtpPurpose(data.purpose)) {
        await tx.$executeRaw`SELECT pg_advisory_xact_lock(728301005, hashtext(${tokenHash(email)}))`;
        const retryAfterSeconds=await loginOtpRetryAfter(loginGuardStore(tx),tokenHash(email));
        if(retryAfterSeconds) return {kind:"locked" as const,retryAfterSeconds};
      }
      const otp = await tx.academicOtp.findUnique({ where: { email } });
      if (!otp || otp.purpose !== data.purpose || otp.expiresAt.getTime() <= Date.now() || !equalHash(otp.challengeHash, tokenHash(challenge))) return null;
      if(authPolicy.loginRateLimit && isLoginOtpPurpose(data.purpose)) {
        if(!equalHash(otp.codeHash,digest)) {
          const attempt=await tx.academicOtp.updateMany({where:{email,purpose:data.purpose,challengeHash:otp.challengeHash,expiresAt:{gt:new Date()}},data:{attempts:{increment:1}}});
          if(!attempt.count) return null;
          const failure=await recordLoginOtpFailure(loginGuardStore(tx),tokenHash(email),Date.now(),authPolicy.verificationAttempts);
          return failure.retryAfterSeconds ? {kind:"locked" as const,retryAfterSeconds:failure.retryAfterSeconds} : {kind:"incorrect" as const,attemptsRemaining:failure.attemptsRemaining};
        }
      } else {
        // Registration retains their existing per-code five-attempt limit.
        if(otp.attempts >= authPolicy.verificationAttempts) return null;
        const attempt = await tx.academicOtp.updateMany({ where: { email, challengeHash: otp.challengeHash, attempts: { lt: authPolicy.verificationAttempts }, expiresAt: { gt: new Date() } }, data: { attempts: { increment: 1 } } });
        if (!attempt.count || !validChallenge(otp, data.purpose!, digest, tokenHash(challenge),Date.now(),authPolicy.verificationAttempts)) return null;
      }
      const consumed = await tx.academicOtp.deleteMany({ where: { email, codeHash: digest, challengeHash: otp.challengeHash } });
      if (!consumed.count) return null;
      let account = await tx.user.findFirst({ where: { site: {in: MAIN_SITE_IDS}, email: { equals: email, mode: "insensitive" } } });
      if (!otpAccountPolicy(account, data.purpose!).allowed) return null;
      if (!account && data.purpose === "register") {
        let saved;
        try { saved = JSON.parse(otp.course); } catch { return null; }
        const academic = (await getNavigationCatalog()).registrationAcademics(saved.course, saved.semester, saved.electives);
        if (!academic.valid) return null;
        account = await tx.user.create({ data: { email, name: otp.name, phone: otp.phone, bio: academic.course.shortName, semester: academic.semester, role: "STUDENT", status: "Active", site: "neopathshala", jobTitle: null } });
        await saveEnrollment(tx,account.id,academic.course.slug,academic.semester,academic.electives);
        await tx.superAdminAuditLog.create({ data: { userId: account.id, action: "academic.electives_updated", details: JSON.stringify({ course: academic.course.slug, semester: academic.semester, electives: academic.electives }), ipAddress: "Not collected" } });
      }
      if (!account || !canStudentSignIn(account)) return null;
      await tx.user.update({ where: { id: account.id }, data: { lastLoginAt: new Date() } });
      await tx.superAdminAuditLog.create({ data: { userId: account.id, action: "academic.login", details: "Email code verified", ipAddress: "Not collected" } });
      if(authPolicy.loginRateLimit && isLoginOtpPurpose(data.purpose)) await clearLoginOtpFailures(loginGuardStore(tx),tokenHash(email));
      return {kind:"verified" as const,account};
    });
    if(result?.kind === "locked") return {success:false,status:"otp_locked" as const,retryAfterSeconds:result.retryAfterSeconds,error:loginOtpLockMessage(result.retryAfterSeconds)};
    if(result?.kind === "incorrect") return {success:false,error:`Incorrect login code. ${result.attemptsRemaining} attempt${result.attemptsRemaining === 1 ? '' : 's'} remaining before a temporary lock.`};
    const user=result?.kind === "verified" ? result.account : null;
    if (!user) return { success: false, error: "Invalid or expired code, or account unavailable." };
    // A verified primary factor does not issue a session until any required authenticator step completes.
    if(await beginSecondFactor(user.id,data.clientType==="pwa"?"pwa":"web",data.purpose||"login")){(await cookies()).delete(CHALLENGE_COOKIE);return {success:true,needsSecondFactor:true};}
    // Session replacement and device limits are enforced atomically at creation.
    await createSession(user.id, data.clientType === "pwa" ? "pwa" : "web");
    if(data.purpose==="reset")await issuePasswordGrant(user.id);
    (await cookies()).delete(CHALLENGE_COOKIE);
    await db.academicSession.deleteMany({ where: { expiresAt: { lt: new Date() } } });
    await db.academicRateLimit.deleteMany({ where: { expiresAt: { lt: new Date() } } });
    await db.academicOtp.deleteMany({ where: { expiresAt: { lt: new Date() } } });
    return { success: true };
  } catch { return { success: false, error: "Unable to verify this code. Please request a new one." }; }
}

export async function updateMyProfileAction(data: { name: string; phone: string; course: string; semester: number | null; electives?: string[] }) {
  try {
  const { resolveStudentCourse, electiveSubjects } = await getNavigationCatalog();
    await assertSameOrigin();
    const { user, session } = await requireSession();
    await rateLimit(`profile:${user.id}`, 20, 3_600_000);
    const name = text(data.name, 100, true);
    const phone = text(data.phone, 25);
    if (!validPhone(phone)) throw new Error("Enter a valid phone number.");
    const selectedCourse = resolveStudentCourse(text(data.course, 150, true));
    if (!selectedCourse) throw new Error("Choose a supported course.");
    const course = selectedCourse.shortName;
    const semester = data.semester;
    if (semester !== null && (!Number.isInteger(semester) || semester < 1 || semester > selectedCourse.totalSemesters)) throw new Error("Choose a valid year or semester from your course.");
    const electives = data.electives ?? [];
    const available = semester ? electiveSubjects(selectedCourse.slug, semester) : [];
    const electiveError = electiveSelectionError(selectedCourse.slug, semester, electives, available);
    if (electiveError) return { success: false, message: electiveError };
    await db.$transaction(async tx=>{
      await tx.user.update({where:{id:user.id},data:{name,phone,bio:course,semester}});
      await saveEnrollment(tx,user.id,selectedCourse.slug,semester,electives);
      await tx.academicSession.update({where:{id:session.id},data:{lastActive:new Date()}});
      await tx.superAdminAuditLog.create({data:{userId:user.id,action:"academic.profile_updated",details:"Personal details and enrollment updated",ipAddress:"Not collected"}});
    });
    revalidatePath("/", "layout");
    return { success: true, message: "Your profile has been updated." };
  } catch(error) { const message=error instanceof Error?error.message:"";return { success: false, message: /^(Enter a valid|Choose a|Complete the|required|Check the information)/.test(message)?message:"Unable to save. Check your details and sign-in status." }; }
}

export async function selectMyElectiveAction(data: { course: string; semester: number; slug: string }) {
  try {
  const { resolveStudentCourse, electiveSubjects } = await getNavigationCatalog();
    await assertSameOrigin();
    const { user, session } = await requireSession();
    await rateLimit(`elective:${user.id}`, 40, 3_600_000);
    const course = resolveStudentCourse(text(data.course, 150, true));
    if (!course || !Number.isInteger(data.semester) || data.semester < 1 || data.semester > course.totalSemesters) return { success: false, message: "Choose a supported course and semester." };
    const semester = data.semester;
    const slug = text(data.slug, 150, true);
    const available = electiveSubjects(course.slug, semester);
    if (!available.some(subject => subject.slug === slug)) return { success: false, message: "Choose an elective offered in this semester." };
    const electives = await db.$transaction(async tx => {
      // Serialize selections for this account so simultaneous requests cannot
      // overwrite another elective group's selection.
      await tx.user.update({ where: { id: user.id }, data: { updatedAt: new Date() } });
      const current = await savedElectives(user.id, course.slug, semester, tx);
      const next = replaceElectiveSelection(current, slug, available);
      await saveEnrollment(tx,user.id,course.slug,semester,next);
      await tx.superAdminAuditLog.create({ data: { userId: user.id, action: "academic.electives_updated", details: JSON.stringify({ course: course.slug, semester, electives: next }), ipAddress: "Not collected" } });
      await tx.academicSession.update({ where: { id: session.id }, data: { lastActive: new Date() } });
      return next;
    });
    revalidatePath("/", "layout");
    return { success: true, message: "Elective saved. Your subjects and profile settings are updated.", electives };
  } catch { return { success: false, message: "Unable to change your elective. Please sign in and try again." }; }
}

export async function revokeSessionAction(sessionId: string) {
  try {
    await assertSameOrigin();
    const { user, session } = await requireSession();
    await db.academicSession.deleteMany({ where: { id: text(sessionId, 100, true), userId: user.id } });
    await audit(user.id, "session_revoked", "A browser session was signed out");
    if (session.id === sessionId) (await cookies()).delete(await getSessionCookie());
    return { success: true };
  } catch { return { success: false }; }
}

export async function signOutAction(allDevices = false) {
  try {
    await assertSameOrigin();
    const { user, session } = await requireSession();
    await db.academicSession.deleteMany({ where: { userId: user.id, ...(allDevices === true ? {} : { id: session.id }) } });
    await audit(user.id, allDevices === true ? "all_sessions_revoked" : "logout", "Student signed out");
    (await cookies()).delete(await getSessionCookie());
    (await cookies()).delete(CHALLENGE_COOKIE);
    return { success: true };
  } catch { return { success: false }; }
}

export async function updateProfilePhotoAction(formData: FormData) {
  let url: string | null = null;
  try {
    await assertSameOrigin();
    const { user } = await requireSession();
    await rateLimit(`avatar:${user.id}`, 10, 3_600_000);
    const file = formData.get("file");
    if (!(file instanceof File) || file.size < 1 || file.size > 3 * 1024 * 1024 || !["image/jpeg", "image/png", "image/webp"].includes(file.type)) {
      return { success: false, error: "Choose a JPG, PNG, or WebP photo up to 3 MB." };
    }
    const bytes = Buffer.from(await file.arrayBuffer());
    if (!imageSignatureMatches(bytes, file.type)) return { success: false, error: "This file is not a supported image." };
    const sharp = (await import("sharp")).default;
    const buffer = await sharp(bytes, { limitInputPixels: 20_000_000, animated: false })
      .rotate().resize(480, 480, { fit: "cover", position: "attention" }).webp({ quality: 85 }).toBuffer();
    const fileName = `${newToken()}.webp`;
    await writeManagedAvatar(fileName,buffer);
    url = `/api/account/photo/${fileName}`;
    await saveAvatarReference(user.id, url);
    return { success: true, url };
  } catch {
    await deleteManagedAvatar(url);
    return { success: false, error: "Unable to update your photo. Sign in and try a different image." };
  }
}

export async function removeProfilePhotoAction() {
  try {
    await assertSameOrigin();
    const { user } = await requireSession();
    await rateLimit(`avatar:${user.id}`, 10, 3_600_000);
    await saveAvatarReference(user.id, null);
    return { success: true };
  } catch { return { success: false, error: "Unable to remove your photo. Please try again." }; }
}

// These legacy administration endpoints were exposed by the public application.
// Fail closed until an independently authenticated admin API is connected.
