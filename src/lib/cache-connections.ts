import {createHash,randomBytes,createCipheriv,createDecipheriv} from 'node:crypto';
import {z} from 'zod';
export const cachePurposes=['catalog','presentation','content','analytics','entrance'] as const;
export const cachePortal=z.enum(['main','entrance']);
export const cachePurpose=z.enum(cachePurposes);
export const cacheEndpoint=z.string().max(250).url().refine(value=>{try{const u=new URL(value);return u.protocol==='https:'&&u.hostname.endsWith('.upstash.io')&&!u.username&&!u.password&&!u.port&&u.pathname==='/'&&!u.search&&!u.hash;}catch{return false;}},'Use the Upstash HTTPS REST endpoint.');
export const cacheConnection=z.object({enabled:z.boolean(),url:cacheEndpoint.optional(),token:z.string().min(1).max(4096).optional(),ttl:z.number().int().min(1).max(300).default(10)});
export const cacheConnections=z.object({version:z.literal(1),revision:z.string().max(100),connections:z.partialRecord(cachePurpose,cacheConnection)});
export type CacheConnections=z.infer<typeof cacheConnections>;
export const cacheConnectionsKey=(portal:string)=>`cache:connections:${cachePortal.parse(portal)}`;
function key(secret:string|undefined){if(!secret||secret.length<32)throw new Error('Configure a cache encryption key with at least 32 characters.');return createHash('sha256').update(secret).digest();}
export function sealConnections(value:CacheConnections,secret:string|undefined){const iv=randomBytes(12),cipher=createCipheriv('aes-256-gcm',key(secret),iv);const body=Buffer.concat([cipher.update(JSON.stringify(cacheConnections.parse(value)),'utf8'),cipher.final()]);return Buffer.concat([iv,cipher.getAuthTag(),body]).toString('base64');}
export function openConnections(value:unknown,secret:string|undefined){if(typeof value!=='string'||value.length>50000)throw new Error('Invalid cache configuration');const bytes=Buffer.from(value,'base64');if(bytes.length<29)throw new Error('Invalid cache configuration');const cipher=createDecipheriv('aes-256-gcm',key(secret),bytes.subarray(0,12));cipher.setAuthTag(bytes.subarray(12,28));return cacheConnections.parse(JSON.parse(Buffer.concat([cipher.update(bytes.subarray(28)),cipher.final()]).toString()));}
export function connectionEnvironment(config:CacheConnections,base:Record<string,string|undefined>){const env:Record<string,string|undefined>={...base,REDIS_CACHE_REVISION:config.revision};for(const purpose of cachePurposes){const item=config.connections[purpose],prefix='REDIS_'+purpose.toUpperCase();env[prefix+'_URL']=item?.enabled?item.url:undefined;env[prefix+'_TOKEN']=item?.enabled?item.token:undefined;env[prefix+'_TTL']=String(item?.ttl||10);}return env;}
