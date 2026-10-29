import {isMainSite} from '@/lib/platform-site';
import 'server-only';
import {db} from './db';
import {createSession} from './security/auth';
import {issuePasswordGrant} from './security/password-grant';
import {getAuthPolicy} from './security/auth-settings';
import {canStudentSignIn} from './security/otp-account-policy';
import {sendMail} from './mailer';
import {generateNeoEmailHtml} from './email-template';
import {escapeHtml} from './security/core';
export const factorNamespace:string='student';
export async function getTwoFactorPolicy(){const policy=await getAuthPolicy();return {enabled:policy.studentTwoFactor,required:policy.studentTwoFactorRequired,recovery:policy.studentRecoveryCodes};}
export async function getTwoFactorAccount(id:string,client:import('@prisma/client').Prisma.TransactionClient=db){const user=await client.user.findUnique({where:{id}});return user&&isMainSite(user.site)&&canStudentSignIn(user)?{id,email:user.email,name:user.name}:null;}
export async function finishTwoFactorLogin(id:string,client:string,purpose:string){await createSession(id,client==='pwa'?'pwa':'web');if(purpose==='reset')await issuePasswordGrant(id);return purpose==='reset'?'/account/password':'/student/profile';}
export async function sendTwoFactorEmail(email:string,name:string,code:string){const result=await sendMail({to:email,subject:'Verify authenticator setup · neoPathshala',html:generateNeoEmailHtml({heroTitle:'Secure your account',greeting:`Hello ${escapeHtml(name)},`,lead:'Use this code to set up an authenticator app for your account.',otpCode:code,expiryMinutes:10})});if(!result.success||result.isTest)throw new Error('Could not deliver the verification email.');}
export async function auditTwoFactor(tx:import('@prisma/client').Prisma.TransactionClient,id:string,action:string){await tx.superAdminAuditLog.create({data:{userId:id,action:`academic.two_factor_${action}`,details:'Authenticator settings updated',ipAddress:'Not collected'}});}
