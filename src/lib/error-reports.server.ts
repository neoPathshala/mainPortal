import {classifyPlatformEvent,type EventCategory,type EventSeverity} from './platform-events';
import {randomUUID} from 'node:crypto';
import {appendFile,mkdir,readFile,stat,rename} from 'node:fs/promises';
import path from 'node:path';
import {db} from './db';
export type ErrorReport={category?:EventCategory;severity?:EventSeverity;title?:string;id:string;reference:string;portal:string;status:number;path:string;method:string;message:string;stack:string;route:string;createdAt:string};
export function safeErrorText(value:unknown){
 return String(value||'').slice(0,20000)
  .replace(/(?:postgres(?:ql)?|https?):\/\/[^\s"'<>]+/gi,'[redacted URL]')
  .replace(/\bBearer\s+[^\s,;"'<>]+/gi,'Bearer [redacted]')
  .replace(/((?:["']?)(?:password|passwd|secret|token|access_token|refresh_token|authorization|cookie|api[_-]?key|client_secret|otp)(?:["']?)\s*[:=]\s*)(?:"(?:\\.|[^"\\])*"|'(?:\\.|[^'\\])*'|[^\s,;}]+)/gi,'$1[redacted]')
  .replace(/-----BEGIN (?:[A-Z ]*PRIVATE KEY)-----[\s\S]*?(?:-----END [A-Z ]*PRIVATE KEY-----|$)/g,'[redacted private key]')
  .slice(0,10000);
}
export async function recordError(input:Partial<ErrorReport>){
 const id=randomUUID();const classification=classifyPlatformEvent(input.status||500,input.path||'/',input.route,input.message);const report:ErrorReport={...classification,...(input.category?{category:input.category}:{}),...(input.severity?{severity:input.severity}:{}),...(input.title?{title:safeErrorText(input.title)}:{}),id,reference:input.reference||id,portal:'Student',status:input.status||500,path:(input.path||'/').split('?')[0].slice(0,500),method:input.method||'GET',message:safeErrorText(input.message),stack:safeErrorText(input.stack),route:input.route||'',createdAt:new Date().toISOString()};
 // Write independently of the database so connection failures remain traceable.
 try{const dir=path.join(process.cwd(),'.data');await mkdir(dir,{recursive:true});const log=path.join(dir,'error-reports.jsonl');try{if((await stat(log)).size>5*1024*1024)await rename(log,log+'.previous');}catch{}await appendFile(log,JSON.stringify(report)+'\n',{mode:0o600});}catch{console.error('[error-report]',JSON.stringify(report));}
 try{await db.platformObject.create({data:{key:`errors/${report.createdAt}/${id}.json`,body:Buffer.from(JSON.stringify(report))}});}catch{console.error('[error-report database unavailable]',report.reference);}
 return report;
}
export async function readErrorReports(){
 const reports:ErrorReport[]=[];
 try{const rows=await db.platformObject.findMany({where:{key:{startsWith:'errors/'}},orderBy:{key:'desc'},take:200});for(const row of rows){try{reports.push(JSON.parse(Buffer.from(row.body).toString()));}catch{}}}catch{}
 for(const dir of [process.cwd()])for(const file of ['error-reports.jsonl.previous','error-reports.jsonl']){try{const lines=(await readFile(path.join(dir,'.data',file),'utf8')).trim().split('\n').slice(-200);for(const line of lines){try{reports.push(JSON.parse(line));}catch{}}}catch{}}
 return [...new Map(reports.map(report=>[report.id,report])).values()].sort((a,b)=>b.createdAt.localeCompare(a.createdAt)).slice(0,200);
}
