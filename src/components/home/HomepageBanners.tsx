"use client";
import {useEffect,useState} from 'react';
import {ArrowUpRight} from 'lucide-react';
import Link from 'next/link';
import {useStudentPreferences} from '@/components/student-preferences-provider';
import {SponsorBanner} from '@/components/sponsor-banner';
import {HomepageBannerDisplay} from '@/components/homepage-banner-display';
import {groupHomepageSponsors,homepageBannerActive,bannerMatchesPath,type HomepageBanner,type SponsorSlot} from '@/lib/homepage-banners';

export function HomepageBanners({banners,slot='top'}:{banners:HomepageBanner[];slot?:SponsorSlot}){
 const preferences=useStudentPreferences();
 const [now,setNow]=useState(()=>Date.now());
 useEffect(()=>{const timer=setInterval(()=>setNow(Date.now()),30000);return()=>clearInterval(timer);},[]);
 const selected=banners.filter(item=>homepageBannerActive(item,now)&&bannerMatchesPath(item,'/')&&(!item.targetCourseSlug||item.targetCourseSlug===preferences.courseSlug)&&(!item.targetSemesters?.length||preferences.semester!==null&&item.targetSemesters.includes(preferences.semester)));
 const sponsors=selected.filter(item=>item.campaignType==='sponsor'&&(item.homeSlot||'top')===slot);
 const hasSponsors=selected.some(item=>item.campaignType==='sponsor');
 const announcements=slot===(hasSponsors?'bottom':'top')?selected.filter(item=>item.campaignType!=='sponsor'&&(item.placement!=='popup'||hasSponsors)):[];
 if(!sponsors.length&&!announcements.length)return slot==='sidebar'?<SponsorOpportunity/>:null;
 return <div className="w-full">
  {groupHomepageSponsors(sponsors).map(group=><div key={group[0].id} className={slot==='top'?(group.some(banner=>banner.sponsorWidth==='full')?'w-full':'mx-auto w-full max-w-7xl'):group.some(banner=>banner.sponsorWidth==='full')&&slot!=='sidebar'?'relative left-1/2 w-screen -translate-x-1/2':'w-full'}><div className={group[0].sponsorLayout==='grid'?'grid grid-cols-1 gap-0 sm:grid-cols-2':'space-y-0'}>{group.map(banner=><SponsorBanner key={banner.id} banner={banner} loading={slot==='top'?'eager':'lazy'}/>)}</div></div>)}
  {announcements.length>0&&<div className="mx-auto w-full max-w-7xl px-4 sm:px-6 lg:px-8"><HomepageBannerDisplay banners={announcements}/></div>}
 </div>;
}
function SponsorOpportunity(){return <aside className="rounded-xl border border-dashed border-border bg-card p-5"><p className="text-[10px] uppercase tracking-wider text-muted-foreground">Sponsorship</p><h2 className="mt-3 text-sm font-semibold">Reach the next generation.</h2><p className="mt-2 text-xs leading-6 text-muted-foreground">Introduce your college, courses, or services to students on neoPathshala.</p><Link href="/contact" className="mt-4 inline-flex items-center gap-2 text-xs font-medium text-primary">Advertise with us<ArrowUpRight size={14}/></Link></aside>;}

