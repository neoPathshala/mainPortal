'use client';
import {useEffect} from 'react';
import {usePathname} from 'next/navigation';
import {analyticsIdentity} from '@/lib/site-analytics-client';
import {detectSessionClient} from '@/lib/session-device';
import {analyticsPath} from '@/lib/site-analytics';
export function SiteActivityTracker(){
 const pathname=usePathname();
 useEffect(()=>{
  const path=analyticsPath(pathname);const privacy=navigator as Navigator&{globalPrivacyControl?:boolean};
  if(!path||privacy.doNotTrack==='1'||privacy.globalPrivacyControl||!navigator.onLine)return;
  let cancelled=false,ready=false,inflight=false,disabled=false;const controller=new AbortController();
  const ids=analyticsIdentity(),id=crypto.randomUUID();let activeSeconds=0,lastTick=Date.now(),interaction=Date.now();
  function interacted(){interaction=Date.now();}
  async function send(type:'view'|'pulse',final=false){
   if(inflight||disabled||type==='pulse'&&!ready)return;
   inflight=true;
   try{const response=await fetch('/api/site-analytics',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({type,id,...ids,path,clientType:detectSessionClient()==='pwa'?'pwa':'browser',activeSeconds:Math.floor(activeSeconds),referrer:type==='view'?document.referrer:''}),keepalive:final,signal:final?undefined:controller.signal,cache:'no-store'});if(response.status===204)ready=true;else if(response.status>=400)disabled=true;}catch{}finally{inflight=false;}
  }
  function accountTime(){const now=Date.now();if(document.visibilityState==='visible'&&now-interaction<60000)activeSeconds+=Math.min(25,(now-lastTick)/1000);lastTick=now;}
  function pulse(){accountTime();if(document.visibilityState==='visible'&&Date.now()-interaction<60000){try{sessionStorage.setItem('neopathshala:analytics:session',JSON.stringify({id:ids.session,at:Date.now()}));}catch{}void send(ready?'pulse':'view');}}
  function visibility(){accountTime();if(document.visibilityState==='hidden')void send('pulse',true);else{interaction=Date.now();pulse();}}
  const start=setTimeout(()=>{if(!cancelled)void send('view');},0);const timer=setInterval(pulse,20000);
  document.addEventListener('visibilitychange',visibility);for(const event of ['pointerdown','keydown','scroll'])window.addEventListener(event,interacted,{passive:true});
  return()=>{cancelled=true;clearTimeout(start);clearInterval(timer);accountTime();void send('pulse',true);controller.abort();document.removeEventListener('visibilitychange',visibility);for(const event of ['pointerdown','keydown','scroll'])window.removeEventListener(event,interacted);};
 },[pathname]);
 return null;
}
