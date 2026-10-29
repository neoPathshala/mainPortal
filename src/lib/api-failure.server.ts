import 'server-only';
import {randomUUID} from 'node:crypto';
import {after} from 'next/server';
import {recordError} from './error-reports.server';

/** Keep exception details in the private log; send only a reference to clients. */
export function apiUnavailable(error:unknown,{path,stage,title,message='This service is temporarily unavailable.',code='SERVICE_UNAVAILABLE'}:{path:string;stage:string;title:string;message?:string;code?:string}):Response{
 const reference=randomUUID();
 const failure=error as {message?:unknown;stack?:unknown;code?:unknown;meta?:{driverAdapterError?:{cause?:{kind?:unknown;originalCode?:unknown}}}}|null;
 const diagnostic=[failure?.code,failure?.meta?.driverAdapterError?.cause?.originalCode,failure?.meta?.driverAdapterError?.cause?.kind].map(value=>String(value||'')).filter(value=>/^[a-zA-Z0-9_]{1,60}$/.test(value)).join(' / ');
 after(async()=>{try{await recordError({reference,status:503,path,method:path==='/api/site-analytics'?'POST':'GET',category:'api',title,message:`${title} during ${stage}${diagnostic?` (${diagnostic})`:''}. ${String(failure?.message||'Unexpected failure.')}`,stack:String(failure?.stack||''),route:`${path} (route)`});}catch{console.error('[API error capture failed]',reference);}});
 return Response.json({error:message,code,reference},{status:503,headers:{'Cache-Control':'private, no-store','Retry-After':'60','X-Error-Reference':reference}});
}
