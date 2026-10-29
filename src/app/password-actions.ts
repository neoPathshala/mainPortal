'use server';
import {MAIN_SITE_IDS,isMainSite} from '@/lib/platform-site';
import {beginSecondFactor} from "@/lib/two-factor.server";
import {cookies,headers} from 'next/headers';
import {revalidatePath} from 'next/cache';
import {db} from '@/lib/db';
import {assertSameOrigin,requireSession,createSession,rateLimit} from '@/lib/security/auth';
import {passwordPolicyError} from '@/lib/security/auth-policy';
import {getAuthPolicy} from '@/lib/security/auth-settings';
import {PASSWORD_GRANT_COOKIE} from '@/lib/security/password-grant';
import {normalizeEmail,tokenHash} from '@/lib/security/core';
import {canStudentSignIn} from '@/lib/security/otp-account-policy';
import {isAllowedAccountEmail} from '@/lib/security/email-domains';
import {checkPasswordLength,hashStudentPassword,verifyStudentPassword,dummyStudentPassword} from '@/lib/security/passwords';
import {loginOtpRetryAfter,recordLoginOtpFailure,clearLoginOtpFailures,type LoginOtpGuardStore} from '@/lib/security/login-otp-lockout';
import type {Prisma} from '@prisma/client';
const guard=(tx:Prisma.TransactionClient):LoginOtpGuardStore=>({read:key=>tx.academicRateLimit.findUnique({where:{key}}),write:async(key,count,expiresAt)=>{await tx.academicRateLimit.upsert({where:{key},create:{key,count,expiresAt},update:{count,expiresAt}});},remove:async keys=>{await tx.academicRateLimit.deleteMany({where:{key:{in:keys}}});}});
export async function passwordSignIn(data:{email:string;password:string;clientType?:'web'|'pwa'}){
 try{
  await assertSameOrigin();const policy=await getAuthPolicy();if(!policy.passwordLogin)return {success:false,error:'Password sign-in is disabled.'};const email=normalizeEmail(data.email);if(typeof data.password!=='string'||data.password.length<1||data.password.length>256||!await isAllowedAccountEmail(email))return {success:false,error:'Invalid email or password.'};
  if(policy.loginRateLimit){const h=await headers();const address=h.get('x-forwarded-for')?.split(',')[0].trim()||h.get('x-real-ip')||'unknown';await rateLimit(`password-address:${tokenHash(address)}`,policy.loginRequestsPerIP,600000);await rateLimit(`password-email:${tokenHash(email)}`,policy.passwordAttemptsPerEmail,600000);}
  const emailHash=tokenHash(`password:${email}`);const result=await db.$transaction(async tx=>{
   await tx.$executeRaw`SELECT pg_advisory_xact_lock(hashtext(${emailHash}))`;const store=guard(tx);if(policy.loginRateLimit){const wait=await loginOtpRetryAfter(store,emailHash);if(wait)return {wait};}
   const user=await tx.user.findFirst({where:{site: {in: MAIN_SITE_IDS},email:{equals:email,mode:'insensitive'}}});const record=user?await tx.platformObject.findUnique({where:{key:`student-password:${user.id}`}}):null;const stored=record?Buffer.from(record.body).toString():dummyStudentPassword;
   const verified=await verifyStudentPassword(data.password,stored);if(!verified||!canStudentSignIn(user)){if(policy.loginRateLimit){const failed=await recordLoginOtpFailure(store,emailHash,Date.now(),policy.verificationAttempts);if(failed.retryAfterSeconds)return {wait:failed.retryAfterSeconds};}return {};}
   if(policy.loginRateLimit)await clearLoginOtpFailures(store,emailHash);await tx.user.update({where:{id:user!.id},data:{lastLoginAt:new Date()}});await tx.superAdminAuditLog.create({data:{userId:user!.id,action:'academic.login',details:'Password verified',ipAddress:'Not collected'}});return {userId:user!.id};
  });
  if(result.wait)return {success:false,error:`Too many incorrect passwords. Try again in ${Math.ceil(result.wait/60)} minutes.`,retryAfterSeconds:result.wait};if(!result.userId)return {success:false,error:'Invalid email or password.'};if(await beginSecondFactor(result.userId,data.clientType==='pwa'?'pwa':'web'))return {success:true,needsSecondFactor:true};await createSession(result.userId,data.clientType==='pwa'?'pwa':'web');return {success:true};
 }catch(error){return {success:false,error:error instanceof Error&&/Too many requests|Request not allowed/.test(error.message)?error.message:'Unable to sign in. Try again shortly.'};}
}
export async function setStudentPassword(_state:{error:string;success?:boolean},form:FormData){
 try{
  await assertSameOrigin();const {user,session}=await requireSession();const policy=await getAuthPolicy();if(!policy.passwordLogin||!policy.passwordReset)throw new Error('Password setup is disabled.');const password=form.get('password');checkPasswordLength(password,policy.passwordMinLength);const policyError=passwordPolicyError(password,policy);if(policyError)throw new Error(policyError);if(password!==form.get('confirmPassword'))throw new Error('Passwords do not match.');await rateLimit(`password-update:${user.id}`,5,3600000);const token=(await cookies()).get(PASSWORD_GRANT_COOKIE)?.value;if(!token||!(/^[a-f0-9]{64}$/).test(token))throw new Error('Verify your email again before setting a password.');const hash=await hashStudentPassword(password,policy.passwordMinLength);
  await db.$transaction(async tx=>{const account=await tx.user.findUnique({where:{id:user.id}});if(!account||!isMainSite(account.site)||!canStudentSignIn(account))throw new Error('Sign in to continue.');const key=`password-grant:${tokenHash(token)}`;await tx.$executeRaw`SELECT pg_advisory_xact_lock(hashtext(${key}))`;const record=await tx.platformObject.findUnique({where:{key}});const grant=record?JSON.parse(Buffer.from(record.body).toString()):null;if(!grant||grant.userId!==user.id||grant.expiresAt<=Date.now())throw new Error('Verify your email again before setting a password.');const body=Buffer.from(hash);await tx.platformObject.upsert({where:{key:`student-password:${user.id}`},create:{key:`student-password:${user.id}`,body},update:{body}});await tx.platformObject.deleteMany({where:{key}});if(policy.revokeOtherSessionsOnPasswordChange)await tx.academicSession.deleteMany({where:{userId:user.id,id:{not:session.id}}});await tx.superAdminAuditLog.create({data:{userId:user.id,action:'academic.password_changed',details:policy.revokeOtherSessionsOnPasswordChange?'Password updated after email verification; other devices signed out':'Password updated after email verification',ipAddress:'Not collected'}});});(await cookies()).delete(PASSWORD_GRANT_COOKIE);revalidatePath('/student/profile');return {error:'',success:true};
 }catch(error){const message=error instanceof Error?error.message:'';return {error:/^(Use a password|Passwords|Verify your email|Password setup|Sign in|Too many requests|Request not allowed)/.test(message)?message:'Could not update your password.'};}
}
