'use client';
import {createContext,useCallback,useContext,useEffect,useRef,useState,type ReactNode,type RefObject} from 'react';
import {useStudentPreferences} from './student-preferences-provider';

type NoticeState={unreadIds:string[];pendingIds:string[]};
type NoticeReads=NoticeState&{markRead:(ids:string[])=>Promise<boolean>};
const Context=createContext<NoticeReads>({unreadIds:[],pendingIds:[],markRead:async()=>false});
function parseIds(value:unknown):NoticeState{
 if(!value||typeof value!=='object'||!('unreadIds' in value)||!Array.isArray(value.unreadIds)||!('pendingIds' in value)||!Array.isArray(value.pendingIds))throw Error('Invalid notice response.');
 return {unreadIds:value.unreadIds.filter((id):id is string=>typeof id==='string'),pendingIds:value.pendingIds.filter((id):id is string=>typeof id==='string')};
}
export function NoticeReadProvider({children}:{children:ReactNode}){
 const {authenticated,courseSlug,semester}=useStudentPreferences();
 const enabled=authenticated&&!!courseSlug;
 const [status,setStatus]=useState<NoticeState>({unreadIds:[],pendingIds:[]});
 const current=useRef<string[]>([]),revision=useRef(0),busy=useRef(false);
 const apply=useCallback((value:NoticeState)=>{current.current=value.pendingIds;setStatus(value);},[]);
 const refresh=useCallback(async()=>{
  if(busy.current)return;
  const version=revision.current;
  try{
   const response=await fetch('/api/account/notice-reads',{cache:'no-store'});
   if(response.ok){const ids=parseIds(await response.json());if(version===revision.current)apply(ids);}
  }catch{/* Keep the last confirmed count while offline. */}
 },[apply]);
 useEffect(()=>{
  revision.current++;apply({unreadIds:[],pendingIds:[]});
  if(!enabled)return;
  void refresh();
  const update=()=>{if(document.visibilityState==='visible')void refresh();};
  const timer=setInterval(update,30000);
  window.addEventListener('focus',update);window.addEventListener('online',update);document.addEventListener('visibilitychange',update);
  return ()=>{revision.current++;clearInterval(timer);window.removeEventListener('focus',update);window.removeEventListener('online',update);document.removeEventListener('visibilitychange',update);};
 },[enabled,courseSlug,semester,refresh,apply]);
 const markRead=useCallback(async(ids:string[])=>{
  const requested=[...new Set(ids)].filter(id=>current.current.includes(id)).slice(0,50);
  if(!enabled||!requested.length||busy.current)return false;
  busy.current=true;const version=++revision.current;
  try{
   const response=await fetch('/api/account/notice-reads',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({ids:requested}),cache:'no-store'});
   if(!response.ok)return false;
   const unread=parseIds(await response.json());if(version===revision.current)apply(unread);
   return true;
  }catch{return false;}finally{busy.current=false;}
 },[enabled,apply]);
 return <Context.Provider value={{unreadIds:enabled?status.unreadIds:[],pendingIds:enabled?status.pendingIds:[],markRead}}>{children}</Context.Provider>;
}
export function NoticeUnreadBadge(){
 const {unreadIds}=useContext(Context);
 if(!unreadIds.length)return null;
 return <span aria-label={`${unreadIds.length} unread notices`} className="ml-1.5 inline-flex min-w-5 items-center justify-center rounded-full bg-primary px-1.5 py-0.5 text-[10px] font-semibold leading-4 text-primary-foreground">{unreadIds.length}</span>;
}
/** A notice is read only after it has remained visible in an active tab. */
export function useVisibleNoticeReads(root:RefObject<HTMLElement|null>,disabled=false,viewKey=""){
 const {markRead,pendingIds}=useContext(Context);
 useEffect(()=>{
  const container=root.current;
  if(disabled||!container||!pendingIds.length||typeof IntersectionObserver==='undefined')return;
  const visible=new Map<string,number>();
  const observer=new IntersectionObserver(entries=>{
   for(const entry of entries){const id=(entry.target as HTMLElement).dataset.noticeId;if(!id)continue;if(entry.isIntersecting&&entry.intersectionRatio>=0.5)visible.set(id,Date.now());else visible.delete(id);}
  },{threshold:[0,0.5]});
  container.querySelectorAll('[data-notice-id]').forEach(node=>observer.observe(node));
  const resetVisibleTime=()=>{for(const id of visible.keys())visible.set(id,Date.now());};
  const onClick=(event:MouseEvent)=>{const id=(event.target as HTMLElement).closest<HTMLElement>('[data-notice-id]')?.dataset.noticeId;if(id)void markRead([id]);};
  const timer=setInterval(()=>{if(document.visibilityState==='visible')void markRead([...visible].filter(([,since])=>Date.now()-since>=1000).map(([id])=>id));},1500);
  document.addEventListener('visibilitychange',resetVisibleTime);container.addEventListener('click',onClick);
  return ()=>{clearInterval(timer);observer.disconnect();document.removeEventListener('visibilitychange',resetVisibleTime);container.removeEventListener('click',onClick);};
 },[root,disabled,viewKey,markRead,pendingIds]);
}
