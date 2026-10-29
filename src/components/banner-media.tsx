'use client';
import dynamic from 'next/dynamic';
import { safeBannerMediaURL, type HomepageBanner } from '@/lib/homepage-banners';
const BannerPDFReader=dynamic(()=>import('./subject/AdvancedPDFReader').then(module=>module.AdvancedPDFReader),{ssr:false});
export function BannerMedia({banner}:{banner:HomepageBanner}){
 const type=banner.mediaType||(banner.image?'image':'text');const url=safeBannerMediaURL(banner.mediaUrl||banner.image);
 if(!url||type==='text')return null;
 if(type==='image')return <img src={url} alt={banner.imageAlt||''} width={960} height={480} loading="lazy" decoding="async" className={banner.design==='creative'?'block max-h-[75dvh] w-full object-contain':'max-h-80 w-full rounded-xl object-contain'}/>;
 if(type==='video')return <video src={url} controls playsInline preload="metadata" className="max-h-80 w-full rounded-xl bg-black">Your browser cannot play this video. <a href={url}>Open video</a></video>;
 return <div className="overflow-hidden rounded-xl border border-border"><BannerPDFReader source={url} title={banner.title} className="h-[480px]"/></div>;
}
