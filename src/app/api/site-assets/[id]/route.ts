import {unstable_cache} from 'next/cache';
import {db} from '@/lib/db';

// Uploaded branding assets have immutable UUID URLs; replacing a logo creates a new ID.
const readAsset=unstable_cache(async(id:string)=>{
 const file=await db.platformObject.findUnique({where:{key:`site-asset:${id}`},select:{body:true}});
 if(!file)throw new Error('Asset not found');
 return Buffer.from(file.body).toString('base64');
},['public-site-asset-v1'],{revalidate:false});

export async function GET(_request:Request,{params}:{params:Promise<{id:string}>}){
 const {id}=await params;
 if(!/^[a-f0-9-]{36}$/.test(id))return new Response(null,{status:404,headers:{'Cache-Control':'no-store'}});
 try{
  const bytes=Buffer.from(await readAsset(id),'base64');
  return new Response(new Uint8Array(bytes),{headers:{'Content-Type':'image/webp','Cache-Control':'public, max-age=31536000, immutable','X-Content-Type-Options':'nosniff'}});
 }catch{return new Response(null,{status:404,headers:{'Cache-Control':'no-store'}});}
}
