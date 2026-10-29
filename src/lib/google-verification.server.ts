import 'server-only';
import {cache} from 'react';
import {db} from './db';
import {readPartitionJSON} from './partition-cache';
export const googleVerification=cache(async()=>{try{
 const token=await readPartitionJSON('presentation','google-verification',async()=>{
  const row=await db.platformObject.findUnique({where:{key:'platform:google-site-verification:v1'},select:{body:true}});
  if(!row)return null;const token=JSON.parse(Buffer.from(row.body).toString()).token;
  return typeof token==='string'&&/^[A-Za-z0-9_-]{10,200}$/.test(token)?token:null;
 });return token||undefined;
}catch{return undefined;}});
