import {ensureSiteAnalytics} from '@/lib/site-analytics-schema.server';
import {createHmac} from 'node:crypto';
import {db} from '@/lib/db';
import {assertSameOrigin,authSecret,rateLimit} from '@/lib/security/auth';
import {parseVisit,parsePWAEvent,clientDimensions,trafficSource} from '@/lib/site-analytics';
import {analyticsRejectionStatus} from '@/lib/analytics-rejections';
import {apiUnavailable} from '@/lib/api-failure.server';
export const runtime='nodejs';
export async function POST(request:Request){
 let stage='origin verification';
 try{
  await assertSameOrigin();
  if(request.headers.get('dnt')==='1'||request.headers.get('sec-gpc')==='1'||/bot|crawler|spider|headless/i.test(request.headers.get('user-agent')||''))return new Response(null,{status:204});
  if(!request.headers.get('content-type')?.startsWith('application/json'))return new Response(null,{status:415,headers:{'Cache-Control':'no-store'}});
  if(Number(request.headers.get('content-length')||0)>4096)return new Response(null,{status:413,headers:{'Cache-Control':'no-store'}});
  const reader=request.body?.getReader();if(!reader)return new Response(null,{status:400});let length=0;const chunks:Uint8Array[]=[];
  while(true){const {done,value}=await reader.read();if(done)break;length+=value.byteLength;if(length>4096){await reader.cancel();return new Response(null,{status:413});}chunks.push(value);}
  const input=JSON.parse(Buffer.concat(chunks).toString('utf8'));const value=input?.type==='event'?parsePWAEvent(input):parseVisit(input);
  stage='request throttling';
  const hash=(text:string)=>createHmac('sha256',authSecret()).update('site-analytics:'+text).digest('hex');
  const visitor=hash(value.visitor),session=hash(value.session);
  const ip=request.headers.get('x-forwarded-for')?.split(',')[0]?.trim()||'unknown';
  await rateLimit(`analytics:${hash(ip)}`,600,60000);
  await rateLimit(`analytics-visitor:${visitor}`,90,60000);
  stage='analytics schema verification';await ensureSiteAnalytics(value.type==='event');stage='analytics persistence';
  if(value.type==='event'&&'event' in value){const dimensions=clientDimensions(request.headers.get('user-agent')||'');await db.$executeRaw`INSERT INTO "neo"."SitePWAEvent" ("id","visitor","session","type","clientType","path","device","browser","occurredAt") VALUES (${value.id},${visitor},${session},${value.event},${value.clientType},${value.path},${dimensions.device},${dimensions.browser},${value.occurredAt}) ON CONFLICT ("id") DO NOTHING`;}else if(value.type==='view'){
   const dimensions=clientDimensions(request.headers.get('user-agent')||'');const source=trafficSource(value.referrer,new URL(request.url).origin);
   await db.$executeRaw`INSERT INTO "neo"."SitePageView" ("id","visitor","session","path","source","device","browser","clientType") VALUES (${value.id},${visitor},${session},${value.path},${source},${dimensions.device},${dimensions.browser},${value.clientType}) ON CONFLICT ("id") DO NOTHING`;
  }else{
   await db.$executeRaw`UPDATE "neo"."SitePageView" SET "lastSeen"=CURRENT_TIMESTAMP,"activeSeconds"=LEAST(86400,GREATEST("activeSeconds",${value.activeSeconds}),GREATEST(0,EXTRACT(EPOCH FROM CURRENT_TIMESTAMP-"createdAt")::int)) WHERE "id"=${value.id} AND "visitor"=${visitor} AND "session"=${session} AND "path"=${value.path}`;
  }
  return new Response(null,{status:204,headers:{'Cache-Control':'no-store'}});
 }catch(error){const status=analyticsRejectionStatus(error);if(status)return new Response(null,{status,headers:{'Cache-Control':'no-store',...(status===429?{'Retry-After':'60'}:{})}});return apiUnavailable(error,{path:'/api/site-analytics',stage,title:'Analytics collection unavailable',message:'Analytics is temporarily unavailable.'});}
}
