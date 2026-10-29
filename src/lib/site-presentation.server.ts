import {publicMediaValues} from './pdf-link-origin';
import {readPartitionJSON} from './partition-cache';
import 'server-only';
import {cache} from 'react';
import {db} from '@/lib/db';
import {defaultPresentation,parsePresentation,sitePresentationKey} from './site-presentation';
export const readSitePresentation=cache(async()=>{try{const result=await readPartitionJSON('presentation','site',async()=>{const record=await db.platformObject.findUnique({where:{key:sitePresentationKey},select:{body:true,updatedAt:true}});return {settings:record?parsePresentation(JSON.parse(Buffer.from(record.body).toString())):defaultPresentation(),revision:record?.updatedAt.toISOString()||''};});return {...result,settings:publicMediaValues(result.settings)};}catch{return {settings:defaultPresentation(),revision:''};}});
