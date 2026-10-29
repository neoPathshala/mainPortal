import {readSupport,readCommunityFile} from '@/lib/community-storage';
import {supportPaymentMethods} from '@/lib/platform/community/schema';
export async function GET(request:Request){try{
 const url=new URL(request.url),settings=await readSupport();const methods=supportPaymentMethods(settings).filter(method=>method.enabled);const method=url.searchParams.has('method')?methods.find(item=>item.id===url.searchParams.get('method')):methods[0];if(!method||url.searchParams.get('v')&&url.searchParams.get('v')!==method.qrFile)return new Response(null,{status:404});
 const bytes=await readCommunityFile(method.qrFile),type=method.qrFile.endsWith('png')?'image/png':method.qrFile.endsWith('jpg')?'image/jpeg':'image/webp';return new Response(new Uint8Array(bytes),{headers:{'Content-Type':type,'Cache-Control':url.searchParams.get('v')===method.qrFile?'public, max-age=31536000, immutable':'public, max-age=300','X-Content-Type-Options':'nosniff'}});
 }catch{return new Response(null,{status:404,headers:{'Cache-Control':'no-store'}});}}
