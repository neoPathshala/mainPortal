'use client';
import type {CSSProperties,ReactNode} from 'react';
import {safeBannerMediaURL,safeBannerURL,type HomepageBanner} from '@/lib/homepage-banners';

function corner(position:string){return `${position.startsWith('bottom')?'bottom-2':'top-2'} ${position.endsWith('right')?'right-2 text-right':'left-2'}`;}
export function SponsorBanner({banner,preview=false,mobilePreview=false,loading='lazy'}:{banner:HomepageBanner;preview?:boolean;mobilePreview?:boolean;loading?:'eager'|'lazy'}){
 const image=safeBannerMediaURL(banner.mediaUrl||banner.image),href=safeBannerURL(banner.link,true);
 const position=banner.sponsorLabelPosition||'top-left',grouped=banner.sponsorOverlayGrouped!==false;
 const labelVisible=banner.sponsorLabelVisible!==false,advertiseVisible=banner.sponsorAdvertiseVisible!==false;
 const labelText=banner.sponsorLabelText||`Sponsored · ${banner.sponsorName||'Sponsor name'}`;
 const labelHref=safeBannerURL(banner.sponsorLabelLink||banner.link,true),advertiseHref=safeBannerURL(banner.sponsorAdvertiseLink||'https://neopathshala.com/contact',true);
 function overlayLink(text:string,url:string){return preview||!url?<span>{text}</span>:<a href={url} target="_blank" rel="sponsored noopener noreferrer" className="underline-offset-2 hover:underline">{text}</a>;}
 function box(content:ReactNode,position:string,background:string,color:string){return <div className={`absolute z-10 max-w-[calc(100%-1rem)] rounded-md px-2.5 py-1.5 text-[10px] leading-4 ${corner(position)}`} style={{backgroundColor:background,color}}>{content}</div>;}
 const artwork=image?<img src={image} alt={banner.imageAlt||banner.title} width={1460} height={200} loading={loading} decoding="async" referrerPolicy="no-referrer" className={`block size-full ${banner.sponsorFit==='cover'?'object-cover':'object-contain'}`}/>:<span className="flex size-full items-center justify-center text-xs text-neutral-500">Upload sponsor artwork</span>;
 return <aside aria-label={`Sponsored by ${banner.sponsorName||'Sponsor name'}`} className={`relative w-full min-w-0 overflow-hidden ${mobilePreview?'h-[var(--sponsor-mobile-height)]':'h-[var(--sponsor-mobile-height)] sm:h-[var(--sponsor-height)]'}`} style={{'--sponsor-height':`${banner.sponsorHeight??140}px`,'--sponsor-mobile-height':`${banner.sponsorMobileHeight??80}px`,backgroundColor:banner.sponsorBackground||'#ffffff'} as CSSProperties}>
  {!preview&&href?<a href={href} target="_blank" rel="sponsored noopener noreferrer" aria-label={`${banner.title} (opens in a new tab)`} className="block size-full focus-visible:outline-2 focus-visible:outline-primary focus-visible:outline-offset-[-3px]">{artwork}</a>:artwork}
  {grouped?(labelVisible||advertiseVisible)&&box(<div className={`flex flex-col gap-0.5 ${position.endsWith('right')?'items-end':'items-start'}`}>{labelVisible&&overlayLink(labelText,labelHref)}{advertiseVisible&&overlayLink(banner.sponsorAdvertiseText||'Advertise with us',advertiseHref)}</div>,position,banner.sponsorLabelBackground||'#262626',banner.sponsorLabelColor||'#ffffff'):<>
   {labelVisible&&box(overlayLink(labelText,labelHref),position,banner.sponsorLabelBackground||'#262626',banner.sponsorLabelColor||'#ffffff')}
   {advertiseVisible&&box(overlayLink(banner.sponsorAdvertiseText||'Advertise with us',advertiseHref),banner.sponsorAdvertisePosition||'top-right',banner.sponsorAdvertiseBackground||'#262626',banner.sponsorAdvertiseColor||'#ffffff')}
  </>}
 </aside>;
}
