import {MAIN_SITE_IDS} from '@/lib/platform-site';
import {readFeedback} from '@/lib/community-storage';
import {readManagedAvatar} from '@/lib/security/profile-photo';
import {db} from '@/lib/db';
const headers={'Cache-Control':'private, no-store','X-Content-Type-Options':'nosniff'};
export async function GET(request:Request){
 const id=new URL(request.url).searchParams.get('id')||'';
 if(!/^[a-f0-9-]{36}$/.test(id))return new Response(null,{status:404,headers});
 try{
  const record=await readFeedback(id);
  if(!record||record.status!=='published'||record.anonymous||!record.userId)return new Response(null,{status:404,headers});
  const user=await db.user.findFirst({where:{id:record.userId,site: {in: MAIN_SITE_IDS}},select:{avatarUrl:true}});
  const file=user?.avatarUrl?.match(/^\/api\/account\/photo\/([a-f0-9]{64}\.webp)$/)?.[1];
  if(!file)return new Response(null,{status:404,headers});
  return new Response(new Uint8Array(await readManagedAvatar(file)),{headers:{...headers,'Content-Type':'image/webp'}});
 }catch{return new Response(null,{status:404,headers});}
}
