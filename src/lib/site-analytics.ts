export const ANALYTICS_EXCLUDED=/^\/(api|_next|login|register|two-factor|account|order|checkout)(\/|$)/;
export function analyticsPath(input:unknown){
 if(typeof input!=='string'||input.length>2000||!input.startsWith('/')||input.startsWith('//')||/[\\\x00-\x20\x7f]/.test(input))return null;
 const path=input.split(/[?#]/)[0];
 if(ANALYTICS_EXCLUDED.test(path)||/@|%40/i.test(path))return null;
 // Private student details are counted only under their route category.
 return /^\/student(\/|$)/.test(path)?'/student':path.slice(0,300);
}
const uuid=/^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
export function isAnalyticsID(value:unknown):value is string{return typeof value==='string'&&uuid.test(value);}
export function parseVisit(input:unknown){
 const value=input as Record<string,unknown>;
 if(!value||!['view','pulse'].includes(String(value.type))||!['id','visitor','session'].every(key=>isAnalyticsID(value[key])))throw new Error('Invalid visit.');
 const path=analyticsPath(value.path);if(!path)throw new Error('Invalid path.');
 const seconds=Number(value.activeSeconds??0);if(!Number.isInteger(seconds)||seconds<0||seconds>86400)throw new Error('Invalid engagement time.');
 return {clientType:value.clientType==='pwa'?'pwa':'browser',type:value.type as 'view'|'pulse',id:String(value.id),visitor:String(value.visitor),session:String(value.session),path,activeSeconds:seconds,referrer:typeof value.referrer==='string'?value.referrer.slice(0,2048):''};
}
export function trafficSource(referrer:string,origin:string){try{const source=new URL(referrer);return source.origin===origin?'Internal':source.protocol==='https:'||source.protocol==='http:'?source.hostname.slice(0,200):'Direct';}catch{return 'Direct';}}
export function clientDimensions(ua:string){return {device:/ipad|tablet/i.test(ua)?'Tablet':/mobile|android|iphone/i.test(ua)?'Mobile':'Desktop',browser:/Edg\//.test(ua)?'Edge':/Firefox\//.test(ua)?'Firefox':/Chrome\/|CriOS\//.test(ua)?'Chrome':/Safari\//.test(ua)?'Safari':'Other'};}

export const PWA_EVENTS=['install_available','install_prompt','install_accepted','install_dismissed','installed','launch','offline_launch','update_ready'] as const;
export type PWAEventType=typeof PWA_EVENTS[number];
export function parsePWAEvent(input:unknown,now=Date.now()){
 const value=input as Record<string,unknown>;
 if(!value||value.type!=='event'||!PWA_EVENTS.includes(value.event as PWAEventType))throw new Error('Invalid PWA event.');
 const visit=parseVisit({...value,type:'view'});const occurredAt=new Date(String(value.occurredAt||''));
 if(!Number.isFinite(occurredAt.getTime())||occurredAt.getTime()>now+300000||occurredAt.getTime()<now-7*86400000)throw new Error('Invalid PWA event time.');
 return {...visit,type:'event' as const,event:value.event as PWAEventType,occurredAt};
}
