import {getHomepageBanners} from '@/lib/homepage-banners.server';
export async function GET(){
 try{return Response.json({banners:(await getHomepageBanners()).filter(item=>(item.targetPortal||'main')==='main'&&(item.placement==='popup'||item.campaignType==='sponsor'))},{headers:{'Cache-Control':'private, no-store'}});}
 catch{return Response.json({banners:[]},{status:503,headers:{'Cache-Control':'no-store'}});}
}
