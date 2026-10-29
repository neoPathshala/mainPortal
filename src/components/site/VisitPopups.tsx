'use client';
import {useEffect,useRef,useState} from 'react';
import {usePathname} from 'next/navigation';
import Link from 'next/link';
import {X,ArrowUpRight} from 'lucide-react';
import {useStudentPreferences} from '@/components/student-preferences-provider';
import {BannerMedia} from '@/components/banner-media';
import {hasHomepageSponsor,bannerMatchesPath,homepageBannerActive,safeBannerURL,type HomepageBanner} from '@/lib/homepage-banners';
function seenKey(banner:HomepageBanner){return `neopathshala:popup:${banner.id}:${banner.frequency==='daily'?new Intl.DateTimeFormat('en-CA',{timeZone:'Asia/Kathmandu'}).format(new Date()):'session'}`;}
export function VisitPopups(){
 const pathname=usePathname(),preferences=useStudentPreferences();
 const [banners,setBanners]=useState<HomepageBanner[]>([]),[active,setActive]=useState<HomepageBanner|null>(null);
 const [now,setNow]=useState(0),dialog=useRef<HTMLDialogElement>(null);
 const shown=useRef(new Set<string>()),restore=useRef<HTMLElement|null>(null);
 useEffect(()=>{const controller=new AbortController();async function load(){try{const response=await fetch('/api/site-banners',{signal:controller.signal,cache:'no-store'});if(response.ok){const data=await response.json();if(Array.isArray(data.banners))setBanners(current=>JSON.stringify(current)===JSON.stringify(data.banners)?current:data.banners);}}catch{}setNow(Date.now());}const first=setTimeout(()=>void load(),500);const timer=setInterval(()=>{if(document.visibilityState==='visible')void load();},60000);return()=>{clearTimeout(first);clearInterval(timer);controller.abort();};},[]);
 useEffect(()=>{shown.current.clear();setActive(null);dialog.current?.close();},[pathname]);
 useEffect(()=>{
  if(/^\/(login|register|two-factor|account|student|checkout|order|api)(\/|$)/.test(pathname))return;
  // On the homepage, sponsored placements stay unobstructed; popup campaigns render below them inline.
  if(pathname==='/'&&hasHomepageSponsor(banners,preferences.courseSlug,preferences.semester,now||Date.now()))return;
  const viewKey=pathname;
  if(shown.current.has(viewKey))return;
  const next=banners.find(item=>item.placement==='popup'&&homepageBannerActive(item,now||Date.now())&&bannerMatchesPath(item,pathname)&&(!item.targetCourseSlug||item.targetCourseSlug===preferences.courseSlug)&&(!item.targetSemesters.length||preferences.semester!==null&&item.targetSemesters.includes(preferences.semester))&&(()=>{try{return item.frequency==='visit'||!(item.frequency==='daily'?localStorage:sessionStorage).getItem(seenKey(item));}catch{return true;}})());
  if(!next)return;
  const timer=setTimeout(()=>{if(document.visibilityState!=='visible'||document.querySelector('dialog[open]'))return;shown.current.add(viewKey);restore.current=document.activeElement instanceof HTMLElement?document.activeElement:null;setActive(next);try{if(next.frequency!=='visit')(next.frequency==='daily'?localStorage:sessionStorage).setItem(seenKey(next),'1');}catch{}},(next.delaySeconds||0)*1000);
  return()=>clearTimeout(timer);
 },[pathname,banners,preferences.courseSlug,preferences.semester,now]);
 useEffect(()=>{if(active)dialog.current?.showModal();},[active]);
 useEffect(()=>{if(active&&((pathname==='/'&&hasHomepageSponsor(banners,preferences.courseSlug,preferences.semester,now||Date.now()))||!homepageBannerActive(active,now||Date.now())||!banners.some(item=>item.id===active.id))){dialog.current?.close();setActive(null);}},[now,banners,active,pathname,preferences.courseSlug,preferences.semester]);
 function close(){dialog.current?.close();setActive(null);restore.current?.focus();}
 if(!active)return null;
 const href=safeBannerURL(active.link,true);
 if(active.design==='creative')return <dialog ref={dialog} aria-label={active.title} onCancel={event=>{event.preventDefault();close();}} onClick={event=>{if(event.target===dialog.current){const rect=dialog.current.getBoundingClientRect();if(event.clientX<rect.left||event.clientX>rect.right||event.clientY<rect.top||event.clientY>rect.bottom)close();}}} className="fixed inset-0 m-auto max-h-[90dvh] w-[min(960px,calc(100vw-2rem))] overflow-y-auto rounded-xl border-0 bg-card p-0 shadow-2xl backdrop:bg-black/65"><button type="button" autoFocus aria-label="Close announcement" onClick={close} className="absolute right-2 top-2 z-10 rounded-full bg-black/75 p-2 text-white"><X size={20}/></button>{href&&active.mediaType==='image'?<Link href={href} onClick={close} aria-label={active.title}><BannerMedia banner={active}/></Link>:<BannerMedia banner={active}/ >}{href&&active.mediaType!=='image'&&<Link href={href} onClick={close} className="m-4 inline-flex rounded-lg bg-primary px-4 py-2 text-sm text-primary-foreground">{active.buttonText||'Learn more'}</Link>}</dialog>;
 return <dialog ref={dialog} aria-labelledby="visit-popup-title" onCancel={event=>{event.preventDefault();close();}} onClick={event=>{if(event.target===dialog.current){const rect=dialog.current.getBoundingClientRect();if(event.clientX<rect.left||event.clientX>rect.right||event.clientY<rect.top||event.clientY>rect.bottom)close();}}} className="fixed inset-0 m-auto max-h-[85dvh] w-[min(640px,calc(100vw-2rem))] overflow-y-auto rounded-2xl border border-border bg-card p-6 text-foreground shadow-2xl backdrop:bg-black/50 sm:p-8"><button type="button" autoFocus aria-label="Close announcement" onClick={close} className="absolute right-3 top-3 rounded-lg p-2 text-muted-foreground hover:bg-muted"><X size={18}/></button><p className="mb-3 pr-8 text-[10px] font-semibold uppercase tracking-wider text-emerald-700 dark:text-emerald-400">{active.label||'Announcement'}</p><h2 id="visit-popup-title" className="mb-5 pr-8 text-2xl font-semibold leading-8">{active.title}</h2><BannerMedia banner={active}/>{active.description&&<p className="mt-5 whitespace-pre-wrap break-words text-sm leading-7 text-muted-foreground">{active.description}</p>}{href&&<Link href={href} onClick={close} className="mt-6 inline-flex items-center gap-2 rounded-lg bg-emerald-700 px-4 py-3 text-sm font-medium text-white hover:bg-emerald-800">{active.buttonText||'Learn more'}<ArrowUpRight size={15}/></Link>}</dialog>;
}
