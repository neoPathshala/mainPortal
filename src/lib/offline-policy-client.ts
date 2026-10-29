import {parseOfflinePolicy,type OfflinePolicy} from './offline-policy';

export function offlinePolicyRetryDelay(failures:number,retryAfter:string|null,now:number):number{
 const seconds=retryAfter&&/^\d+$/.test(retryAfter)?Number(retryAfter)*1000:0;
 const date=retryAfter&&!seconds?Date.parse(retryAfter)-now:0;
 return Math.min(15*60*1000,Math.max(60*1000*2**Math.min(Math.max(0,failures-1),4),seconds,Number.isFinite(date)?date:0));
}
/** Coalesce concurrent polls and preserve the last verified flags on failure. */
export function createOfflinePolicyPoller(onPolicy:(policy:OfflinePolicy)=>void,options:{request?:()=>Promise<Response>;now?:()=>number}={}){
 const request=options.request||(()=>fetch('/api/offline-policy',{cache:'no-store',signal:AbortSignal.timeout(10000)}));
 const now=options.now||Date.now;let inFlight:Promise<void>|undefined,failures=0,nextAttempt=0,stopped=false;
 function refresh(force=false):Promise<void>{
  if(stopped)return Promise.resolve();
  if(inFlight)return inFlight;
  if(!force&&now()<nextAttempt)return Promise.resolve();
  inFlight=Promise.resolve().then(async()=>{
   try{
    const response=await request();
    if(!response.ok){nextAttempt=now()+offlinePolicyRetryDelay(++failures,response.headers.get('Retry-After'),now());return;}
    const data=await response.json(),policy=parseOfflinePolicy(data?.policy);
    if(!stopped)onPolicy(policy);failures=0;nextAttempt=0;
   }catch{nextAttempt=now()+offlinePolicyRetryDelay(++failures,null,now());}
   finally{inFlight=undefined;}
  });
  return inFlight;
 }
 return {refresh,dispose(){stopped=true;}};
}
