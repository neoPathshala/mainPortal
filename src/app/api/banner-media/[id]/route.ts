// The admin media gateway checks the current banner publication and schedule
// before granting a short-lived storage URL. Drafts stay private.
async function serve(_request:Request,{params}:{params:Promise<{id:string}>}){
 const {id}=await params;if(!/^[a-f0-9-]{36}$/.test(id))return new Response('Not found',{status:404});
 const origin=process.env.ADMIN_PORTAL_URL||(process.env.NODE_ENV==='production'?'https://admin.neopathshala.com':'http://localhost:3000');
 return new Response(null,{status:307,headers:{Location:new URL(`/api/banner-media/${id}`,origin).href,'Cache-Control':'private, no-store','Referrer-Policy':'no-referrer'}});
}
export const GET=serve;export const HEAD=serve;
