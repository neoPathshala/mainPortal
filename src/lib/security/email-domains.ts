import 'server-only';
import {cache} from 'react';
import {DEFAULT_EMAIL_DOMAINS,emailDomainAllowed,parseEmailDomainSettings,enabledEmailDomains} from '@/lib/platform/email-domain-policy';
import {readContent} from '@/lib/platform/content';
const readDomains=cache(async()=>parseEmailDomainSettings(await readContent('content/email-domains.json',{domains:DEFAULT_EMAIL_DOMAINS,disabled:[]})));
export async function isAllowedAccountEmail(email:string){return emailDomainAllowed(email,enabledEmailDomains(await readDomains()));}
export async function accountEmailDomainHint(){const domains=enabledEmailDomains(await readDomains()).filter(domain=>domain!=='neopathshala.com');return domains.includes('gmail.com')&&domains.includes('icloud.com')?'This email domain is not supported. Please use Gmail (@gmail.com) or iCloud (@icloud.com).':domains.length?`This email domain is not supported. Use an enabled provider: ${domains.slice(0,4).join(', ')}.`:'Email sign-in for this provider is temporarily unavailable. Contact support.';}
