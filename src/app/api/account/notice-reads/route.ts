import {z} from 'zod';
import {getSession,assertSameOrigin} from '@/lib/security/auth';
import {boundedJSON} from '@/lib/security/bounded-form-data';
import {markNoticesRead,unreadNoticeState} from '@/lib/notice-reads.server';
const headers={'Cache-Control':'private, no-store'};
const input=z.object({ids:z.array(z.string().regex(/^[a-zA-Z0-9_-]{1,100}$/)).min(1).max(50)}).strict();
export async function GET(){
 try{
  const auth=await getSession();
  return Response.json(auth?await unreadNoticeState(auth.user.id):{unreadIds:[],pendingIds:[]},{headers});
 }catch{return Response.json({error:'Unable to load unread notices.'},{status:503,headers});}
}
export async function POST(request:Request){
 try{
  await assertSameOrigin();
  const auth=await getSession();
  if(!auth)return Response.json({error:'Sign in to continue.'},{status:401,headers});
  const {ids}=input.parse(await boundedJSON(request,8192));
  await markNoticesRead(auth.user.id,ids);
  return Response.json(await unreadNoticeState(auth.user.id),{headers});
 }catch(error){
  if(error instanceof z.ZodError||error instanceof SyntaxError)return Response.json({error:'Choose valid notices.'},{status:400,headers});
  const message=error instanceof Error?error.message:'';
  if(message==='Request not allowed.')return Response.json({error:message},{status:403,headers});
  if(['Request is too large.','Expected JSON.','Missing request body.'].includes(message))return Response.json({error:message},{status:message==='Request is too large.'?413:400,headers});
  return Response.json({error:'Unable to save notice read status.'},{status:503,headers});
 }
}
