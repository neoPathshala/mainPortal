type VideoMetadata={id:string;name:string;logo:string;duration:string};
const pending=new Map<string,Promise<VideoMetadata>>();
export function loadVideoMetadata(id:string):Promise<VideoMetadata>{
 if(!/^[a-zA-Z0-9_-]{11}$/.test(id))return Promise.reject(new Error('Invalid video'));
 const key=`youtube-metadata:v1:${id}`;
 try{const saved=JSON.parse(sessionStorage.getItem(key)||'null');if(saved?.expires>Date.now()&&saved.value?.id===id)return Promise.resolve(saved.value);}catch{}
 const existing=pending.get(id);if(existing)return existing;
 const request=fetch(`/api/video-channel?id=${encodeURIComponent(id)}`).then(async response=>{
  if(!response.ok)throw new Error('Video metadata unavailable');
  const value=await response.json();if(value.id!==id||typeof value.duration!=='string'||(!value.duration&&!value.name))throw new Error('Video metadata unavailable');
  try{sessionStorage.setItem(key,JSON.stringify({expires:Date.now()+(value.duration?86400000:60000),value}));}catch{}
  return value as VideoMetadata;
 }).finally(()=>pending.delete(id));
 pending.set(id,request);return request;
}
