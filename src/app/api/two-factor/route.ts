import {boundedJSON} from '@/lib/security/bounded-form-data';
import {assertSameOrigin as assertOrigin,getSession} from '@/lib/security/auth';
import {headers} from 'next/headers';
import {db} from '@/lib/db';
import {factorDigest} from '@/lib/two-factor-crypto';
import {handleTwoFactor} from '@/lib/two-factor.server';
export async function POST(request:Request){try{
 await assertOrigin();const raw=await boundedJSON(request,8192);if(!raw||typeof raw!=='object'||Array.isArray(raw))throw Error('Invalid request.');const input=raw as Record<string,unknown>;if(typeof input.action!=='string'||input.action.length>30||input.code!==undefined&&(typeof input.code!=='string'||input.code.length>24))throw Error('Invalid verification details.');const action=input.action;
 const auth=await getSession();const identity=auth?{id:auth.user.id,email:auth.user.email,name:auth.user.name,sessionId:auth.session.id}:null;
 const address=(await headers()).get('x-forwarded-for')?.split(',')[0]||'unknown';const bucket=Math.floor(Date.now()/600000),key=`two-factor-request:student:${factorDigest(identity?.id||address)}:${bucket}`;
 const rate=await db.academicRateLimit.upsert({where:{key},create:{key,count:1,expiresAt:new Date((bucket+2)*600000)},update:{count:{increment:1}}});if(rate.count>30)return Response.json({error:'Too many attempts. Try again in ten minutes.'},{status:429});
 const result=await handleTwoFactor(action,input,identity);return Response.json(result,{headers:{'Cache-Control':'private, no-store'}});
 }catch(error){const message=error instanceof Error?error.message:'';if(message==='Request is too large.')return Response.json({error:'Request is too large.'},{status:413,headers:{'Cache-Control':'private, no-store'}});return Response.json({error:/^(Sign in|Verification expired|Could not deliver|Authenticator setup|Request not allowed|Wait |Invalid)/.test(message)?message:'Unable to complete authenticator verification.'},{status:400,headers:{'Cache-Control':'private, no-store'}});}}
