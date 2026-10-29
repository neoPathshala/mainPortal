import 'server-only';
import {db} from './db';
import {cacheConnectionsKey,openConnections,connectionEnvironment} from './cache-connections';
const portal='main';
let current:Record<string,string|undefined>|undefined,expires=0,pending:Promise<Record<string,string|undefined>>|undefined;
export async function runtimeCacheEnvironment(){
 if(current&&Date.now()<expires)return current;
 if(!pending)pending=(async()=>{
  const base={...process.env,REDIS_CACHE_NAMESPACE:process.env.REDIS_CACHE_NAMESPACE||portal};
  try{const record=await db.platformObject.findUnique({where:{key:cacheConnectionsKey(portal)},select:{body:true}});current=record?connectionEnvironment(openConnections(JSON.parse(Buffer.from(record.body).toString()),process.env.PLATFORM_CACHE_KEY),base):base;expires=Date.now()+30000;}
  catch{current=base;for(const name of ['CATALOG','PRESENTATION','CONTENT','ANALYTICS','ENTRANCE']){current['REDIS_'+name+'_URL']=undefined;current['REDIS_'+name+'_TOKEN']=undefined;}expires=Date.now()+3000;}
  return current;
 })().finally(()=>{pending=undefined;});
 return pending;
}
