import 'server-only';
import {cookies} from 'next/headers';
import {db} from '../db';
import {newToken,tokenHash} from './core';
import {cookieOptions} from './auth';
export const PASSWORD_GRANT_COOKIE=process.env.NODE_ENV==='production'?'__Host-neopathshala_password_grant':'neopathshala_password_grant';
export async function issuePasswordGrant(userId:string){const token=newToken();await db.platformObject.create({data:{key:`password-grant:${tokenHash(token)}`,body:Buffer.from(JSON.stringify({userId,expiresAt:Date.now()+600000}))}});(await cookies()).set(PASSWORD_GRANT_COOKIE,token,{...cookieOptions,path:'/',maxAge:600});}
