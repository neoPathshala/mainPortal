import 'server-only';
import {randomBytes,randomInt} from 'node:crypto';
import {cookies} from 'next/headers';
import QRCode from 'qrcode';
import type {Prisma} from '@prisma/client';
import {db} from './db';
import {factorDigest,factorSecret,checkFactorCode,encryptFactor,decryptFactor,recoveryCodes,recoveryHash,factorEmailHash} from './two-factor-crypto';
import {factorNamespace,getTwoFactorPolicy,getTwoFactorAccount,finishTwoFactorLogin,sendTwoFactorEmail,auditTwoFactor} from './two-factor-context';
type Identity={id:string;email:string;name:string;sessionId:string};
type Factor={secret:string;lastStep:number;recovery:string[]};
type Pending={id:string;client:string;purpose:string;expires:number;attempts:number;enroll:boolean;factorRevision:string;secret?:string};
type Setup={expires:number;attempts:number;codeHash?:string;secret?:string;sentAt:number};
const encode=(value:unknown)=>Buffer.from(JSON.stringify(value));
const decode=<T>(value:Uint8Array)=>JSON.parse(Buffer.from(value).toString()) as T;
export const factorKey=(id:string)=>`security:totp:${factorNamespace}:${id}`;
const setupKey=(identity:Identity)=>`security:totp-setup:${factorNamespace}:${identity.id}:${factorDigest(identity.sessionId)}`;
const pendingCookie=process.env.NODE_ENV==='production'?`__Host-neopathshala_${factorNamespace}_2fa`:`neopathshala_${factorNamespace}_2fa`;
const cookieOptions={httpOnly:true,secure:process.env.NODE_ENV==='production',sameSite:'strict' as const,path:'/',maxAge:300};
const lock=async(tx:Prisma.TransactionClient,key:string)=>{await tx.$executeRaw`SELECT pg_advisory_xact_lock(hashtext(${key}))`;};
export async function needsSecondFactor(id:string,tx:Prisma.TransactionClient){
 const policy=await getTwoFactorPolicy();if(!policy.enabled)return false;const key=factorKey(id);await lock(tx,key);let factor=await tx.platformObject.findUnique({where:{key}});
 // Preserve authenticator enrollment created by the existing administrator CLI.
 if(!factor&&factorNamespace==='admin'){const account=await tx.adminAccount.findUnique({where:{id},select:{totpSecretEncrypted:true,lastTotpStep:true}});const secret=account?.totpSecretEncrypted;if(secret&&secret!=='email-otp'){decryptFactor(secret);factor=await tx.platformObject.create({data:{key,body:encode({secret,lastStep:account.lastTotpStep||-1,recovery:[]})}});await tx.adminAccount.update({where:{id},data:{totpSecretEncrypted:"email-otp",lastTotpStep:0}});}}
 return !!factor||policy.required;
}
export async function beginSecondFactor(id:string,client='web',purpose='login'){
 const policy=await getTwoFactorPolicy();if(!policy.enabled)return false;
 const factor=await db.platformObject.findUnique({where:{key:factorKey(id)}});if(!factor&&!policy.required)return false;
 await db.platformObject.deleteMany({where:{OR:[{key:{startsWith:`security:2fa-login:${factorNamespace}:`},updatedAt:{lt:new Date(Date.now()-900000)}},{key:{startsWith:`security:totp-setup:${factorNamespace}:`},updatedAt:{lt:new Date(Date.now()-900000)}}]}});
 const token=randomBytes(32).toString('hex'),key=`security:2fa-login:${factorNamespace}:${id}:${factorDigest(token)}`;
 const pending:Pending={id,client,purpose,expires:Date.now()+300000,attempts:0,enroll:!factor,factorRevision:factor?.updatedAt.toISOString()||''};
 await db.platformObject.create({data:{key,body:encode(pending)}});(await cookies()).set(pendingCookie,`${id}.${token}`,cookieOptions);return true;
}
async function pendingKey(){const value=(await cookies()).get(pendingCookie)?.value||'';const match=/^([a-zA-Z0-9_-]{1,100})\.([a-f0-9]{64})$/.exec(value);if(!match)throw new Error('Verification expired. Sign in again.');return `security:2fa-login:${factorNamespace}:${match[1]}:${factorDigest(match[2])}`;}
async function setupDetails(secret:string,email:string){const uri=`otpauth://totp/${encodeURIComponent(`neoPathshala:${email}`)}?secret=${secret}&issuer=neoPathshala&algorithm=SHA1&digits=6&period=30`;return {secret,uri,qr:await QRCode.toDataURL(uri,{width:240,margin:2,errorCorrectionLevel:'M'})};}
function factorProof(factor:Factor,code:unknown,recoveryAllowed:boolean){const step=checkFactorCode(decryptFactor(factor.secret),code,factor.lastStep);if(step!==null)return {...factor,lastStep:step};if(recoveryAllowed&&typeof code==='string'&&/^[a-f0-9\s-]{16,24}$/i.test(code)){const hash=recoveryHash(code);if(factor.recovery.includes(hash))return {...factor,recovery:factor.recovery.filter(item=>item!==hash)};}return null;}
export async function handleTwoFactor(action:string,input:Record<string,unknown>,identity:Identity|null){
 const policy=await getTwoFactorPolicy();
 if(action.startsWith('login-')){
  const key=await pendingKey();
  const result=await db.$transaction(async tx=>{
   await lock(tx,key);const row=await tx.platformObject.findUnique({where:{key}});if(!row)return {error:'Verification expired. Sign in again.'};const pending=decode<Pending>(row.body);
   if(pending.expires<Date.now()||pending.attempts>=5)return {error:'Verification expired. Sign in again.'};
   // A disabled account cannot complete a pending sign-in.
   if(!await getTwoFactorAccount(pending.id,tx))return {error:'Sign in again.'};
   const target=factorKey(pending.id);await lock(tx,target);const current=await tx.platformObject.findUnique({where:{key:target}});
   if((current?.updatedAt.toISOString()||'')!==pending.factorRevision)return {error:'Authenticator settings changed. Sign in again.'};
   if(action==='login-info')return {enroll:pending.enroll,required:policy.required,recovery:policy.recovery};
   if(!policy.enabled)return {error:'Sign in again to use the updated security settings.'};
   if(action==='login-setup'&&pending.enroll){const secret=pending.secret?decryptFactor(pending.secret):factorSecret();await tx.platformObject.update({where:{key},data:{body:encode({...pending,secret:encryptFactor(secret)})}});return {setupSecret:secret,id:pending.id};}
   if(action!=='login-verify')return {error:'Invalid verification request.'};
   let next:Factor|null=null;let codes:string[]|undefined;
   if(pending.enroll&&pending.secret){const secret=decryptFactor(pending.secret),step=checkFactorCode(secret,input.code);if(step!==null){codes=recoveryCodes();next={secret:pending.secret,lastStep:step,recovery:codes.map(recoveryHash)};}}
   else if(current)next=factorProof(decode<Factor>(current.body),input.code,policy.recovery);
   if(!next){await tx.platformObject.update({where:{key},data:{body:encode({...pending,attempts:pending.attempts+1})}});return {error:'Invalid or already used code. Check your authenticator and try again.'};}
   const body=encode(next);await tx.platformObject.upsert({where:{key:target},create:{key:target,body},update:{body}});await tx.platformObject.delete({where:{key}});await auditTwoFactor(tx,pending.id,pending.enroll?'enabled':'verified');return {verified:pending,codes};
  });
  if('setupSecret' in result&&result.setupSecret){const account=await getTwoFactorAccount(result.id!);if(!account)throw new Error('Sign in again.');return setupDetails(result.setupSecret,account.email);}
  if('verified' in result&&result.verified){const redirect=await finishTwoFactorLogin(result.verified.id,result.verified.client,result.verified.purpose);(await cookies()).delete(pendingCookie);return {success:true,redirect,recoveryCodes:result.codes};}
  return result;
 }
 if(!identity)throw new Error('Sign in to continue.');
 const target=factorKey(identity.id),key=setupKey(identity);
 if(action==='status'){const row=await db.platformObject.findUnique({where:{key:target}});return {enabled:!!row,available:policy.enabled,recovery:policy.recovery};}
 if(action==='send'){
  if(!policy.enabled)throw new Error('Authenticator setup is disabled.');const code=String(randomInt(100000,1000000));const result=await db.$transaction(async tx=>{await lock(tx,key);if(await tx.platformObject.findUnique({where:{key:target}}))return {error:'An authenticator is already enabled.'};const old=await tx.platformObject.findUnique({where:{key}});if(old&&decode<Setup>(old.body).sentAt>Date.now()-60000)return {error:'Wait one minute before requesting another code.'};const body=encode({expires:Date.now()+600000,attempts:0,codeHash:factorEmailHash(key,code),sentAt:Date.now()});await tx.platformObject.upsert({where:{key},create:{key,body},update:{body}});return {success:true};});if('error'in result)return result;try{await sendTwoFactorEmail(identity.email,identity.name,code);}catch{await db.platformObject.deleteMany({where:{key}});throw new Error('Could not deliver the verification email.');}return {success:true};
 }
 const result=await db.$transaction(async tx=>{
  await lock(tx,target);const current=await tx.platformObject.findUnique({where:{key:target}});
  if(action==='setup'||action==='enable'){
   if(!policy.enabled)return {error:'Authenticator setup is disabled.'};if(current)return {error:'An authenticator is already enabled.'};await lock(tx,key);const row=await tx.platformObject.findUnique({where:{key}});if(!row)return {error:'Verify your email again.'};const setup=decode<Setup>(row.body);if(setup.expires<Date.now()||setup.attempts>=5)return {error:'Verify your email again.'};
   if(action==='setup'&&setup.codeHash&&typeof input.code==='string'&&/^\d{6}$/.test(input.code)&&factorEmailHash(key,input.code)===setup.codeHash){const secret=factorSecret();await tx.platformObject.update({where:{key},data:{body:encode({...setup,secret:encryptFactor(secret),codeHash:undefined})}});return {setupSecret:secret};}
   if(action==='enable'&&setup.secret){const step=checkFactorCode(decryptFactor(setup.secret),input.code);if(step!==null){const codes=recoveryCodes();await tx.platformObject.create({data:{key:target,body:encode({secret:setup.secret,lastStep:step,recovery:codes.map(recoveryHash)})}});await tx.platformObject.delete({where:{key}});await auditTwoFactor(tx,identity.id,'enabled');return {success:true,recoveryCodes:codes};}}
   await tx.platformObject.update({where:{key},data:{body:encode({...setup,attempts:setup.attempts+1})}});return {error:'Invalid or expired code.'};
  }
  if(!current)return {error:'No authenticator is enabled.'};
  const next=factorProof(decode<Factor>(current.body),input.code,policy.recovery);if(!next)return {error:'Invalid or already used code.'};
  if(action==='disable'){
   if(policy.required)return {error:'Your administrator requires two-factor authentication.'};await tx.platformObject.delete({where:{key:target}});await auditTwoFactor(tx,identity.id,'disabled');return {success:true};
  }
  if(action==='recovery'&&policy.recovery){const codes=recoveryCodes();await tx.platformObject.update({where:{key:target},data:{body:encode({...next,recovery:codes.map(recoveryHash)})}});await auditTwoFactor(tx,identity.id,'recovery_rotated');return {success:true,recoveryCodes:codes};}
  return {error:'Invalid verification request.'};
 });
 if('setupSecret'in result&&result.setupSecret)return setupDetails(result.setupSecret,identity.email);return result;
}
