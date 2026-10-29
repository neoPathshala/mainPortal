/** Optional server-side public JSON cache. Credentials are never sent to browsers. */
export type CachePartition='catalog'|'presentation'|'content'|'analytics'|'entrance';
const partitions=new Set(['catalog','presentation','content','analytics','entrance']);
type Options={env:Record<string,string|undefined>;request:typeof fetch;now?:()=>number};
export function createPartitionCache({env,request,now=Date.now}:Options){
 const memory=new Map<string,{json:string;until:number}>(),pending=new Map<string,Promise<string>>();
 const failures=new Map<string,number>();
 function config(partition:CachePartition){
  if(!partitions.has(partition))throw new Error('Unknown cache partition');
  const prefix='REDIS_'+partition.toUpperCase();const endpoint=env[prefix+'_URL'],token=env[prefix+'_TOKEN'];
  if(!endpoint||!token)return null;
  const url=new URL(endpoint);
  if(url.protocol!=='https:'||!url.hostname.endsWith('.upstash.io')||url.username||url.password||url.port||url.pathname!=='/'||url.search||url.hash)throw new Error('Use the Upstash HTTPS REST endpoint.');
  return {url:url.origin,token};
 }
 function key(partition:CachePartition,name:string){if(!/^[a-zA-Z0-9:_-]{1,160}$/.test(name))throw new Error('Invalid cache key');return `neopathshala:${env.REDIS_CACHE_NAMESPACE||'main'}:v1:${partition}:${name}`;}
 async function command(partition:CachePartition,args:(string|number)[]){
  if((failures.get(partition)||0)>now())return null;
  const connection=config(partition);if(!connection)return null;
  const response=await request(connection.url,{method:'POST',headers:{Authorization:`Bearer ${connection.token}`,'Content-Type':'application/json'},body:JSON.stringify(args),cache:'no-store',redirect:'error',signal:AbortSignal.timeout(200)});
  if(!response.ok)throw new Error('Cache unavailable');
  const text=await response.text();if(text.length>1400000)throw new Error('Cache response too large');
  const result=JSON.parse(text);if(result.error)throw new Error('Cache command failed');return result.result;
 }
 async function safe(partition:CachePartition,args:(string|number)[]){try{return await command(partition,args);}catch{failures.set(partition,now()+30000);return null;}}
 return {
  async read<T>(partition:CachePartition,name:string,load:()=>Promise<T>,ttl=10):Promise<T>{
   if(!Number.isInteger(ttl)||ttl<1||ttl>300)throw new Error('Cache TTL must be 1–300 seconds');
   // Public data only: short local caching also works without Redis.
   let configured=false;try{configured=Boolean(config(partition));}catch{}
   const id=key(partition,name),local=memory.get(id);
   if(local&&local.until>now())return JSON.parse(local.json);
   if(!pending.has(id))pending.set(id,(async()=>{
    const hit=configured?await safe(partition,['GET',id]):null;
    if(typeof hit==='string'&&hit.length<=1000000){try{JSON.parse(hit);if(memory.size>=100)memory.clear();memory.set(id,{json:hit,until:now()+1000});return hit;}catch{}}
    const json=JSON.stringify(await load());
    if(typeof json!=='string')throw new Error('Cache reads must return JSON');
    if(json.length<=1000000){if(memory.size>=100)memory.clear();memory.set(id,{json,until:now()+Math.min(ttl,configured?1:5)*1000});if(configured)await safe(partition,['SET',id,json,'EX',ttl]);}
    return json;
   })().finally(()=>{pending.delete(id);}));
   return JSON.parse(await pending.get(id)!);
  },
  async invalidate(partition:CachePartition,name:string){const id=key(partition,name);memory.delete(id);return safe(partition,['DEL',id]);},
 };
}
let instance:ReturnType<typeof createPartitionCache>|undefined,revision='';
export async function readPartitionJSON<T>(partition:CachePartition,name:string,load:()=>Promise<T>,ttl=10):Promise<T>{
 let env:Record<string,string|undefined>=typeof process==='undefined'?{}:process.env;
 if(env.PLATFORM_CACHE_KEY){const {runtimeCacheEnvironment}=await import('./runtime-cache-config.server');env=await runtimeCacheEnvironment();}
 const next=env.REDIS_CACHE_REVISION||'environment';
 if(!instance||revision!==next){instance=createPartitionCache({env,request:(input,init)=>fetch(input,init)});revision=next;}
 const configured=Number(env['REDIS_'+partition.toUpperCase()+'_TTL']);
 return instance.read(partition,name,load,Number.isInteger(configured)&&configured>=1&&configured<=300?configured:ttl);
}
