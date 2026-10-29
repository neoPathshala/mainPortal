import 'server-only';
import { db } from './db';
import {createDecipheriv,createHash} from 'node:crypto';
import { withTemplateDefaults, currentBranding, renderTemplate, type TemplateKey, type MailTemplate } from './platform-mail-templates';
export type {TemplateKey};
function decrypt(value:string,secret:string){
 const bytes=Buffer.from(value,'base64');if(bytes.length<28)throw new Error('Invalid stored mail credentials.');
 const decipher=createDecipheriv('aes-256-gcm',createHash('sha256').update(secret).digest(),bytes.subarray(0,12));
 decipher.setAuthTag(bytes.subarray(12,28));return Buffer.concat([decipher.update(bytes.subarray(28)),decipher.final()]).toString('utf8');
}
type Connection={enabled:boolean;host:string;port:number;secure:boolean;username:string;passwordEncrypted?:string;fromName:string;fromEmail:string;replyTo?:string;id?:string};
export async function platformMail(key:TemplateKey){
 const [settingsRow,routingRow]=await Promise.all([db.platformObject.findUnique({where:{key:'admin:mail-settings'}}),db.platformObject.findUnique({where:{key:'platform:mail-routing:v1'}})]);
 if(!settingsRow&&!routingRow)return null;
 const settings=settingsRow?JSON.parse(Buffer.from(settingsRow.body).toString()) as Connection&{templates:Partial<Record<TemplateKey,MailTemplate>>}:null;
 const routing=routingRow?JSON.parse(Buffer.from(routingRow.body).toString()) as {connections:Connection[];assignments:Partial<Record<TemplateKey,{enabled:boolean;connectionId:string}>>}:null;
 const assignment=routing?.assignments[key];
 if(assignment&&!assignment.enabled)throw new Error('This email feature is disabled.');
 let connection:Connection|null=settings;
 if(assignment&&assignment.connectionId!=='default'){
  connection=routing?.connections.find(item=>item.id===assignment.connectionId)||null;
  if(!connection)throw new Error('Assigned SMTP connection is unavailable.');
 }
 if(connection&&!connection.enabled)throw new Error('Assigned SMTP connection is disabled.');
 const secret=process.env.PLATFORM_MAIL_KEY||process.env.AUTH_SECRET||'';
 const password=connection?.passwordEncrypted?decrypt(connection.passwordEncrypted,`admin-smtp-v1:${secret}`):'';
 return {connection:connection?{...connection,fromName:currentBranding(connection.fromName),fromEmail:currentBranding(connection.fromEmail),replyTo:currentBranding(connection.replyTo||''),password}:null,template:withTemplateDefaults(settings?.templates)[key],customTemplates:!!settings};
}
export function renderPlatformTemplate(template:MailTemplate,to:string,values:Record<string,string>){return renderTemplate(template,{siteName:'neoPathshala',email:to,name:to.split('@')[0],expiresIn:'10',...values});}
