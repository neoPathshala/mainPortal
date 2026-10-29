import { nepaliYear } from "./nepali-date";
export const templateKeys=['admin-login','smtp-test','admin-confirm','student-otp','student-delete','platform-mail'] as const;
export type TemplateKey=typeof templateKeys[number];
export type MailTemplate={subject:string;body:string;html?:string};
export const templateLabels:Record<TemplateKey,string>={'admin-login':'Administrator sign-in code','smtp-test':'SMTP test message','admin-confirm':'Security verification code','student-otp':'Student login & signup OTP','student-delete':'Student account deletion OTP','platform-mail':'Other platform email'};

// Shared shell from the supplied neoPathshala HTML email design.
function brandedEmail(title:string,lead:string,security:string,otp=true){
 return `<!DOCTYPE html>
<html lang="en"><head>
<meta charset="UTF-8"><meta name="viewport" content="width=device-width, initial-scale=1.0">
<meta name="color-scheme" content="light"><meta name="supported-color-schemes" content="light">
<title>${title}</title>
<style>
    :root { color-scheme: only light; }
    body { margin:0; padding:32px 16px; background:#f7f8f8; color:#475569; font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Arial,sans-serif; }
    .wrapper { width:100%; max-width:560px; margin:0 auto; background:#ffffff; border:1px solid #e8ecea; border-radius:12px; overflow:hidden; }
    .hero-banner { padding:32px 32px 0; background:#ffffff; text-align:left; }
    .hero-sub { margin-bottom:20px; color:#186B4F; font-size:14px; font-weight:700; letter-spacing:0; }
    .hero-title { margin:0; color:#17231d; font-size:24px; font-weight:600; line-height:1.35; }
    .content { padding:24px 32px 32px; background:#ffffff; }
    .greeting { margin:0 0 12px; color:#17231d; font-size:15px; font-weight:500; }
    .lead,.expiry-text { margin:0 0 20px; color:#57625c; font-size:14px; line-height:1.7; }
    .otp-row { margin:24px 0; }
    .otp-digit { display:inline-block; padding:14px 20px; border:1px solid #dbe6df; border-radius:8px; background:#f6faf7; color:#186B4F; font:600 28px/1.4 Consolas,Menlo,monospace; letter-spacing:7px; }
    .expiry-text strong { color:#17231d; font-weight:600; }
    .security-note { padding-top:20px; border-top:1px solid #edf0ee; color:#758078; font-size:12px; line-height:1.7; }
    .security-note strong { color:#57625c; font-weight:500; }
    .footer { padding:20px 32px; border-top:1px solid #edf0ee; background:#ffffff; color:#7a857e; font-size:12px; line-height:1.7; }
    .footer p { margin:0 0 4px; }
    .footer a { color:#186B4F; text-decoration:none; }
    .btn { display:inline-block; margin:4px 0 24px; padding:12px 20px; border-radius:6px; background:#186B4F; color:#ffffff; text-decoration:none; font-size:14px; font-weight:600; }
    @media (max-width:480px) { body { padding:16px 8px; } .hero-banner { padding:24px 20px 0; } .content { padding:20px; } .footer { padding:20px; } .hero-title { font-size:22px; } }
</style></head><body>
<div class="wrapper">
<div class="hero-banner"><div class="hero-sub">neoPathshala</div><h1 class="hero-title">${title}</h1></div>
<div class="content"><p class="greeting">Hello {{name}},</p><p class="lead">${lead}</p>
${otp?'<div class="otp-row"><span class="otp-digit">{{code}}</span></div><p class="expiry-text">This code will expire in <strong>{{expiresIn}} minutes</strong>.</p>':''}
<div class="security-note"><strong>Security Tip:</strong> ${security}</div></div>
<div class="footer"><p>© ${nepaliYear() + " BS"} {{siteName}}.</p><p>Questions? Contact our team at <a href="mailto:{{supportEmail}}">{{supportEmail}}</a></p></div>
</div></body></html>`;
}

export const defaultTemplates:Record<TemplateKey,MailTemplate>={
 'student-otp':{subject:'Your {{siteName}} verification code',body:'Hello {{name}},\n\nYour verification code is {{code}}. Use it to sign in or create your student account. This code expires in {{expiresIn}} minutes. If you did not request this code, ignore this email.\n\n{{siteName}}'},
 'student-delete':{subject:'Confirm your {{siteName}} account deletion',body:'Hello {{name}},\n\nYour account deletion code is {{code}}. Use this code only if you want to permanently delete your account. This cannot be undone. The code expires in {{expiresIn}} minutes.\n\n{{siteName}}'},
 'platform-mail':{subject:'{{siteName}} notification',body:'Hello {{name}},\n\n{{action}}\n\n{{siteName}}'},
 'admin-login':{subject:'Your {{siteName}} sign-in code',body:'Hello {{name}},\n\nYour administrator sign-in code is {{code}}.\n\nThis code expires in {{expiresIn}} minutes. Keep it private. If you did not request this code, ignore this email.\n\n{{siteName}}'},
 'admin-confirm':{subject:'Confirm action on {{siteName}}',body:'Hello {{name}},\n\nRequested action: {{action}}\n\nYour verification code is {{code}}. It expires in {{expiresIn}} minutes. If you did not request this action, do not share this code.\n\n{{siteName}}'},
 'smtp-test':{subject:'{{siteName}} email delivery test',body:'Hello {{name}},\n\nThis message confirms that your saved SMTP settings can deliver email to {{email}}.\n\n{{siteName}}'},
};

const brandedContent:Record<TemplateKey,[string,string,string,boolean?]>={
 'student-otp':['Verify Your E-Mail Address','Welcome to {{siteName}}! Please use the verification code below to confirm your email address and sign in or activate your student portal access.','{{siteName}} team members will never ask for your verification code. Never share this code with anyone.'],
 'admin-login':['Your Administrator Sign-In Code','A sign-in request was initiated for your {{siteName}} administrative console. Use the security code below to authorize your session.','This code grants access to your administrator account. Never share it. If you did not request it, ignore this email.'],
 'admin-confirm':['Confirm Your Requested Action','Requested action: {{action}}. Use the verification code below to confirm this action on {{siteName}}.','Only enter this code if you initiated this action. Never share it with anyone.'],
 'student-delete':['Confirm Account Deletion','Use the code below only if you want to permanently delete your {{siteName}} student account. This action cannot be undone.','If you did not request account deletion, do not enter or share this code.'],
 'smtp-test':['Email Delivery Test','Your saved SMTP connection successfully delivered this test message to {{email}}.','This is a delivery test. No verification code or account action is required.',false],
 'platform-mail':['{{siteName}} Notification','{{action}}','If you need help with this notification, contact our team using the address below.',false],
};
for(const key of templateKeys)defaultTemplates[key].html=brandedEmail(...brandedContent[key]);

export const contactEmail='contact@neopathshala.com';
export function currentBranding(value:string){
 return value.replace(/(?:csit|info|support|auth|security)@(?:neo(?:csit)|neopathshala)\.com/gi,contactEmail)
  .replace(/csit\.neopathshala\.com/gi,'neopathshala.com')
  .replace(/neo(?:csit)\.com/gi,'neopathshala.com').replace(/neo(?:csit)/gi,'neoPathshala');
}
export function lightOnlyMailHtml(value:string){
 let html=currentBranding(value);
 // Remove complete dark-mode CSS blocks, including their nested selectors.
 const dark=/@media[^{}]*prefers-color-scheme\s*:\s*dark[^{}]*\{/i;
 let match:RegExpExecArray|null;
 while((match=dark.exec(html))){
  let end=match.index+match[0].length,depth=1;
  for(;end<html.length&&depth;end++){if(html[end]==='{')depth++;else if(html[end]==='}')depth--;}
  html=html.slice(0,match.index)+html.slice(end);
 }
 return html.replace(/content=["']light\s+dark["']/gi,'content="light"')
  .replace(/color-scheme:\s*(?:light\s+dark|dark\s+light)/gi,'color-scheme: only light');
}

// Upgrade the previous built-in design and normalize saved templates on read.
export function withTemplateDefaults(saved:Partial<Record<TemplateKey,MailTemplate>>={}){
 return Object.fromEntries(templateKeys.map(key=>{
  const template=saved[key];
  if(!template)return [key,{...defaultTemplates[key]}];
  const normalized={subject:currentBranding(template.subject),body:currentBranding(template.body),html:template.html===undefined?undefined:lightOnlyMailHtml(template.html)};
  const unchanged=normalized.subject===defaultTemplates[key].subject&&normalized.body===defaultTemplates[key].body;
  const oldDefault=unchanged&&!!template.html?.includes('class="hero-banner"')&&/prefers-color-scheme\s*:\s*dark/i.test(template.html||'');
  return [key,{...normalized,...(unchanged&&(!template.html?.trim()||oldDefault)?{html:defaultTemplates[key].html}:{})}];
 })) as Record<TemplateKey,MailTemplate>;
}

const variables=['siteName','code','expiresIn','name','email','action','supportEmail'];
export function validateTemplate(key:TemplateKey,template:MailTemplate){
 if(!template.subject.trim()||template.subject.length>180||/[\r\n\x00]/.test(template.subject))throw new Error('Use a subject between 1 and 180 characters on one line.');
 if(template.body.trim().length<10||template.body.length>12000)throw new Error('Use an email body between 10 and 12,000 characters.');
 if((template.html||'').length>50000)throw new Error('HTML template must be under 50,000 characters.');
 for(const match of `${template.subject}\n${template.body}\n${template.html||''}`.matchAll(/\{\{\s*([^{}]+?)\s*\}\}/g)){if(!variables.includes(match[1]))throw new Error(`Unknown template variable: ${match[1]}.`);}
 if((['admin-login','admin-confirm','student-otp','student-delete'].includes(key))&&!/\{\{\s*code\s*\}\}/.test(template.body))throw new Error('The sign-in template must include {{code}} in its body.');
 return {subject:currentBranding(template.subject.trim()),body:currentBranding(template.body.trim()),html:lightOnlyMailHtml((template.html||'').trim())};
}
export function renderTemplate(template:MailTemplate,values:Record<string,string>){
 template={subject:currentBranding(template.subject),body:currentBranding(template.body),html:template.html?lightOnlyMailHtml(template.html):undefined};
 values={...values,siteName:'neoPathshala',supportEmail:contactEmail};
 const replace=(text:string)=>text.replace(/\{\{\s*(siteName|code|expiresIn|name|email|action|supportEmail)\s*\}\}/g,(_match,key)=>values[key]||'');
 const subject=replace(template.subject).replace(/[\r\n\x00]/g,' ');
 const text=replace(template.body);
 const escape=(value:string)=>value.replace(/[&<>"']/g,char=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[char]!));
 const html=template.html?.trim()?template.html.replace(/\{\{\s*(siteName|code|expiresIn|name|email|action|supportEmail)\s*\}\}/g,(_match,key)=>escape(values[key]||'')):`<div style="background:#f6f8f7;padding:32px 16px;font-family:Arial,sans-serif;color:#18231d"><div style="max-width:560px;margin:auto;background:#fff;border:1px solid #dce5df;border-radius:16px;padding:32px"><h2 style="margin:0 0 24px;color:#206d50;font-size:20px">${escape(values.siteName||'neoPathshala')}</h2><div style="font-size:15px;line-height:1.7">${escape(text).replace(/\n/g,'<br>')}</div></div></div>`;
 return {subject,text,html};
}
