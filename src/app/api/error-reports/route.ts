import {z} from 'zod';
import {recordError} from '@/lib/error-reports.server';
import {randomUUID} from 'node:crypto';
export const runtime='nodejs';
const visits=new Map<string,{at:number;reference:string}>();
let windowStart=0;let count=0;
const maxBytes=14000;
const reportSchema=z.object({
 status:z.union([z.literal(404),z.literal(500)]),
 path:z.string().min(1).max(500).regex(/^\/(?!\/)/).refine(value=>!/[\\\x00-\x1f\x7f]/.test(value)),
 reference:z.string().regex(/^[a-zA-Z0-9-]{1,80}$/).optional(),
 message:z.string().max(2000).optional(),
 stack:z.string().max(8000).optional(),
}).strict();
class InvalidBody extends Error { constructor(readonly status:number){super('Invalid report');} }
async function readReport(request:Request):Promise<unknown>{
 if(request.headers.get('content-type')?.split(';')[0].trim().toLowerCase()!=='application/json')throw new InvalidBody(415);
 const length=request.headers.get('content-length');
 if(length!==null&&(!/^\d+$/.test(length)||Number(length)>maxBytes))throw new InvalidBody(413);
 const reader=request.body?.getReader();if(!reader)throw new InvalidBody(400);
 const chunks:Uint8Array[]=[];let size=0;let expired=false;
 const timer=setTimeout(()=>{expired=true;void reader.cancel().catch(()=>{});},5000);
 try{for(;;){const {done,value}=await reader.read();if(expired)throw new InvalidBody(408);if(done)break;size+=value.byteLength;if(size>maxBytes){await reader.cancel();throw new InvalidBody(413);}chunks.push(value);}}
 finally{clearTimeout(timer);reader.releaseLock();}
 const bytes=new Uint8Array(size);let offset=0;for(const chunk of chunks){bytes.set(chunk,offset);offset+=chunk.byteLength;}
 return JSON.parse(new TextDecoder('utf-8',{fatal:true}).decode(bytes));
}
export async function POST(request:Request){
 const noStore={'Cache-Control':'no-store'};
 const reject=(status:number)=>new Response(null,{status,headers:noStore});
 if(request.headers.get('origin')!==new URL(request.url).origin||request.headers.get('sec-fetch-site')==='cross-site')return reject(403);
 // Local safety ceiling only; distributed abuse controls belong at trusted ingress.
 const now=Date.now();if(now-windowStart>60000){windowStart=now;count=0;}if(++count>60)return new Response(null,{status:429,headers:{...noStore,'Retry-After':'60'}});
 try{
 const parsed=reportSchema.safeParse(await readReport(request));
 if(!parsed.success)return reject(400);
 const body=parsed.data;
 const key=body.path.split(/[?#]/)[0];
 const dedup=`${body.status}:${key}:${body.status===500?body.reference||'':''}`;
 for(const [id,item] of visits)if(item.at<=now-60000)visits.delete(id);
 const previous=visits.get(dedup);if(previous)return Response.json({reference:previous.reference},{headers:noStore});
 // A browser reference is correlation data, never proof of a server failure.
 const reference=typeof body.reference==='string'?body.reference:randomUUID();
 await recordError({reference,status:body.status,path:key,severity:body.status===404?'info':'warning',category:body.status===404?'page':'runtime',title:body.status===404?'Page not found (client reported)':'Browser error (unverified)',message:body.status===404?'The browser reported a missing page.':(typeof body.message==='string'?'Browser: '+body.message:'Browser error boundary displayed.'),stack:typeof body.stack==='string'?body.stack:'',route:'browser (client reported)'});
 if(visits.size>=1000)visits.clear();visits.set(dedup,{at:now,reference});
 return Response.json({reference},{headers:noStore});
 }catch(error){return reject(error instanceof InvalidBody?error.status:400);}
}
