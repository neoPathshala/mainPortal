import 'server-only';
import {cache} from 'react';
import {db} from './db';
import {builtInPages,builtInPage,parseSitePage,sitePagePath} from './site-pages';
export const readSitePage=cache(async(slug:string)=>{if(!/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(slug)||slug.length>120)return null;const fallback=builtInPage(slug);const row=await db.platformObject.findUnique({where:{key:`site-page:${slug}`},select:{body:true,updatedAt:true}});if(!row)return fallback||null;try{const page=parseSitePage(JSON.parse(Buffer.from(row.body).toString()));return page.slug===slug?{...page,updatedAt:row.updatedAt.toISOString()}:null;}catch{return null;}});
export async function sitePageMetadata(slug:string){const page=await readSitePage(slug);return page?.status==='PUBLISHED'?{title:page.title,description:page.description||undefined,alternates:{canonical:sitePagePath(slug)},robots:page.noIndex?{index:false,follow:false}:undefined}:{robots:{index:false,follow:false}};}

export const managedSiteLinks=cache(async()=>{const rows=await db.platformObject.findMany({where:{key:{startsWith:'site-page:'}},select:{key:true,body:true},take:1000});const pages=new Map(builtInPages.map(page=>[page.slug,page]));for(const row of rows){try{const page=parseSitePage(JSON.parse(Buffer.from(row.body).toString()));if(row.key===`site-page:${page.slug}`)pages.set(page.slug,page);}catch{const slug=row.key.slice('site-page:'.length);pages.delete(slug);}}return [...pages.values()].filter(page=>page.status==='PUBLISHED'&&!page.noIndex).map(page=>({label:page.title,href:sitePagePath(page.slug)}));});
