import {db} from '@/lib/db';
import {createHash,createDecipheriv} from 'node:crypto';
function decrypt(value:string,secret:string|undefined){if(!secret||secret.length<32)throw new Error('YouTube key encryption unavailable');const bytes=Buffer.from(value,'base64');if(bytes.length<29)throw new Error('Invalid encrypted key');const cipher=createDecipheriv('aes-256-gcm',createHash('sha256').update(secret).digest(),bytes.subarray(0,12));cipher.setAuthTag(bytes.subarray(12,28));return Buffer.concat([cipher.update(bytes.subarray(28)),cipher.final()]).toString('utf8');}
import {NextRequest} from 'next/server';
import {youtubeDuration} from '@/lib/youtube-metadata';
const pending=new Map<string,Promise<unknown>>();
async function cached<T>(key:string,load:()=>Promise<T>,ttl=30*86400000):Promise<T>{
 try{const row=await db.platformObject.findUnique({where:{key},select:{body:true}});if(row){const saved=JSON.parse(Buffer.from(row.body).toString());if(saved.expires>Date.now())return saved.value;}}catch{}
 const running=pending.get(key);if(running)return running as Promise<T>;
 const task=(async()=>{const value=await load();const body=Buffer.from(JSON.stringify({expires:Date.now()+ttl,value}));try{await db.platformObject.upsert({where:{key},create:{key,body},update:{body}});}catch{}return value;})();
 pending.set(key,task);try{return await task;}finally{pending.delete(key);}
}

async function youtubeJSON(url:URL){
 const response=await fetch(url,{redirect:'error',signal:AbortSignal.timeout(4000),next:{revalidate:86400}});
 if(!response.ok)throw new Error('Channel information unavailable');
 return response.json();
}
export async function GET(request:NextRequest){
 const id=request.nextUrl.searchParams.get('id')||'';
 if(!/^[a-zA-Z0-9_-]{11}$/.test(id))return Response.json({error:'Invalid video'},{status:400});
 let fallbackName='';
 try{
  const result=await cached(`youtube:video:v2:${id}`,async()=>{
  const embedURL=new URL('https://www.youtube.com/oembed');embedURL.searchParams.set('url',`https://www.youtube.com/watch?v=${id}`);embedURL.searchParams.set('format','json');
  const embed=await youtubeJSON(embedURL).catch(()=>({}));
  let name=typeof embed.author_name==='string'?embed.author_name.slice(0,200):'';
  fallbackName=name;
  let logo='',duration='';
  // Channel avatars require channel metadata; the oEmbed thumbnail is a video image.
  let key=process.env.YOUTUBE_DATA_API_KEY;
  try{const stored=await db.platformObject.findUnique({where:{key:'integration:youtube:v1'},select:{body:true}});if(stored)key=decrypt(Buffer.from(stored.body).toString(),process.env.MAIN_CACHE_ENCRYPTION_KEY||process.env.PLATFORM_CACHE_KEY);}catch{/* Environment fallback preserves playback when configuration is unavailable. */}
  if(key)try{
   const videos=new URL('https://www.googleapis.com/youtube/v3/videos');videos.search=new URLSearchParams({part:'snippet,contentDetails',id,key,fields:'items(snippet(channelId,channelTitle),contentDetails(duration))'}).toString();
   const video=await youtubeJSON(videos);const channelId=video.items?.[0]?.snippet?.channelId;duration=youtubeDuration(video.items?.[0]?.contentDetails?.duration);if(!name)name=String(video.items?.[0]?.snippet?.channelTitle||'').slice(0,200);
   if(typeof channelId==='string'&&/^UC[a-zA-Z0-9_-]{22}$/.test(channelId)){
    const channels=new URL('https://www.googleapis.com/youtube/v3/channels');channels.search=new URLSearchParams({part:'snippet',id:channelId,key,fields:'items(snippet(thumbnails))'}).toString();
    const channel=await cached(`youtube:channel:v1:${channelId}`,()=>youtubeJSON(channels));const thumbnail=channel.items?.[0]?.snippet?.thumbnails?.default?.url;
    if(typeof thumbnail==='string'){const parsed=new URL(thumbnail);if(parsed.protocol==='https:'&&(parsed.hostname==='yt3.ggpht.com'||parsed.hostname==='yt3.googleusercontent.com'))logo=parsed.href;}
   }
  }catch{/* Channel name remains available when avatar lookup fails. */}
  if(!duration)throw new Error('Video metadata unavailable');
  return {id,name,logo,duration};
  });
  return Response.json(result,{headers:{'Cache-Control':'public, max-age=86400'}});
 }catch{return Response.json({id,name:fallbackName,logo:'',duration:''},{headers:{'Cache-Control':'public, max-age=60'}});}
}
