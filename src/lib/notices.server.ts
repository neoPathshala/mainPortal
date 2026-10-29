import {readPartitionJSON} from './partition-cache';
import "server-only";
import { cache } from "react";
import { db } from "./db";
import {contentMetadataKey,parseContentMetadata} from './content-metadata';
import {normalizeNoticeTags} from './platform/notice-tags';
export const getPublishedNotices=cache(async()=>{const notices=await readPartitionJSON('content','notices',async()=>{
 const now=new Date();const rows=await db.notice.findMany({where:{status:"PUBLISHED",publishedAt:{lte:now},OR:[{expiresAt:null},{expiresAt:{gt:now}}]},orderBy:[{isPinned:"desc"},{publishedAt:"desc"}],take:250});
 const records=rows.length?await db.platformObject.findMany({where:{key:{in:rows.map(row=>contentMetadataKey('notices',row.id))}},select:{key:true,body:true}}):[];
 const metadata=new Map(records.map(item=>[item.key,parseContentMetadata(item.body)]));
 return rows.map(row=>{
  const info=metadata.get(contentMetadataKey('notices',row.id))||{};const text=(key:string)=>typeof info[key]==='string'?String(info[key]):undefined;let tags:string[]=[];try{tags=normalizeNoticeTags(info.tags);}catch{}
  const priority=['CRITICAL_URGENT','URGENT','IMPORTANT','NORMAL','LOW'].includes(String(info.priority))?String(info.priority):'NORMAL';
  return {...row,published:true,targetPortal:'neopathshala' as const,priority,targetCourseSlug:text('targetCourseSlug'),targetAudience:text('targetAudience')||'all',author:text('author')||'Academic office',department:text('department'),tags,attachmentUrl:text('attachmentUrl'),attachmentName:text('attachmentName'),attachmentSize:text('attachmentSize'),tickerHeadline:text('tickerHeadline'),bannerExpiresAt:text('bannerExpiresAt'),publishedAt:(row.publishedAt||row.createdAt).toISOString(),createdAt:row.createdAt.toISOString(),updatedAt:row.updatedAt.toISOString(),expiresAt:row.expiresAt?.toISOString(),externalLink:row.externalLink||undefined};
 });
});return notices.filter(notice=>!notice.expiresAt||new Date(notice.expiresAt).getTime()>Date.now());
});
