import {isPDFLinkAlias} from './pdf-link-origin';
import {publicMediaValues} from './pdf-link-origin';
import {readPartitionJSON} from './partition-cache';
import 'server-only';
import {cache} from 'react';
import {db} from './db';
import {homepageBannerPrefix,parseHomepageBanner,homepageBannerActive,orderHomepageBanners} from './homepage-banners';
export const getHomepageBanners=cache(async()=>{const banners=await readPartitionJSON('content','homepage-banners',async()=>{const rows=await db.platformObject.findMany({where:{key:{startsWith:homepageBannerPrefix}},select:{key:true,body:true},take:1000});return orderHomepageBanners(rows.flatMap(row=>{try{const banner=parseHomepageBanner(JSON.parse(Buffer.from(row.body).toString()));return row.key===homepageBannerPrefix+banner.id&&homepageBannerActive(banner)?[banner]:[];}catch{return [];}}));});return banners.filter(banner=>(banner.targetPortal||'main')==='main'&&homepageBannerActive(banner)).map(banner=>typeof process!=='undefined'&&process.env.NODE_ENV==='development'?{...banner,image:localBannerImage(banner.image),mediaUrl:localBannerImage(banner.mediaUrl||'')}:publicMediaValues(banner));});

function localBannerImage(value:string){
 try{const url=new URL(value);if(isPDFLinkAlias(value))return '/api/banner-media/'+url.pathname.slice(1);}catch{}
 return value;
}
