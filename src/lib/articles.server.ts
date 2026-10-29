import {MAIN_SITE_IDS} from '@/lib/platform-site';
import 'server-only';
import {cache} from 'react';
import {db} from './db';
import {contentMetadataKey,parseContentMetadata} from './content-metadata';
export const getPublishedArticle=cache(async(slug:string)=>{
 const article=await db.article.findFirst({where:{slug,status:{in:['PUBLISHED','SCHEDULED']},publishedAt:{lte:new Date()},site:{in:['all',...MAIN_SITE_IDS]}}});
 if(!article)return null;
 const record=await db.platformObject.findUnique({where:{key:contentMetadataKey('articles',article.id)},select:{body:true}});
 const info=parseContentMetadata(record?.body);
 return {...article,coverImageAlt:typeof info.coverImageAlt==='string'?info.coverImageAlt:article.title,noIndex:info.noIndex===true,showToc:info.showToc!==false};
});
export async function articleSitemapPaths(){
 const articles=await db.article.findMany({where:{status:{in:['PUBLISHED','SCHEDULED']},publishedAt:{lte:new Date()},site:{in:['all',...MAIN_SITE_IDS]}},select:{id:true,slug:true}});
 if(!articles.length)return [];
 const records=await db.platformObject.findMany({where:{key:{in:articles.map(article=>contentMetadataKey('articles',article.id))}},select:{key:true,body:true}});
 const excluded=new Set(records.filter(record=>parseContentMetadata(record.body).noIndex===true).map(record=>record.key));
 return articles.filter(article=>!excluded.has(contentMetadataKey('articles',article.id))).map(article=>`/articles/${article.slug}`);
}
