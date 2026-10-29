import {isPDFLinkAlias} from './pdf-link-origin';
export const MAX_VIDEO_BYTES=250*1024*1024;
export type VideoSource='youtube'|'drive'|'url'|'upload';
export function videoLocation(value:string){
 let url:URL;try{url=new URL(value,value.startsWith('/')&&!value.startsWith('//')&&!value.includes('\\')?'https://neopathshala.com':undefined);}catch{return null;}
 const local=url.protocol==='http:'&&['localhost','127.0.0.1'].includes(url.hostname)&&/^\/api\/resource-videos\/[a-f0-9-]{36}$/.test(url.pathname);
 if((url.protocol!=='https:'&&!local)||url.username||url.password)return null;
 const host=url.hostname.toLowerCase();
 if(['youtube.com','www.youtube.com','m.youtube.com','youtu.be','youtube-nocookie.com','www.youtube-nocookie.com'].includes(host)){
  const rawId=host==='youtu.be'?url.pathname.slice(1):url.searchParams.get('v')||url.pathname.match(/^\/(?:embed|shorts|live)\/([^/]+)/)?.[1];
  const id=rawId&&/^[a-zA-Z0-9_-]{11}$/.test(rawId)?rawId:null;const rawList=url.searchParams.get('list');const list=rawList&&/^[a-zA-Z0-9_-]{1,160}$/.test(rawList)?rawList:null;
  if(!id&&!list)return null;return {source:'youtube' as const,id,list,embed:list?`https://www.youtube-nocookie.com/embed/videoseries?list=${encodeURIComponent(list)}${id?`&v=${id}`:''}`:`https://www.youtube-nocookie.com/embed/${id}?rel=0&playsinline=1`,thumbnail:id?`https://i.ytimg.com/vi/${id}/hqdefault.jpg`:''};
 }
 if(host==='drive.google.com'){
  const id=url.pathname.match(/^\/file\/d\/([a-zA-Z0-9_-]+)/)?.[1]||url.searchParams.get('id');if(!id||!/^[a-zA-Z0-9_-]{10,200}$/.test(id))return null;
  return {source:'drive' as const,embed:`https://drive.google.com/file/d/${id}/preview`,thumbnail:''};
 }
 return {source:isPDFLinkAlias(value)||/^\/api\/resource-videos\/[a-f0-9-]{36}$/.test(url.pathname)?'upload' as const:'url' as const,embed:'',thumbnail:''};
}
export function videoExtension(type:string){return type==='video/mp4'?'mp4':type==='video/webm'?'webm':null;}
export function videoSignatureMatches(bytes:Uint8Array,type:string){
 if(type==='video/mp4'){const size=bytes.length>=12?new DataView(bytes.buffer,bytes.byteOffset,bytes.byteLength).getUint32(0):0;return bytes.length>=16&&size>=16&&String.fromCharCode(...bytes.slice(4,8))==='ftyp';}
 if(type==='video/webm')return bytes[0]===0x1a&&bytes[1]===0x45&&bytes[2]===0xdf&&bytes[3]===0xa3&&new TextDecoder().decode(bytes).includes('webm');return false;
}
export async function readVideoUpload(file:Blob){if(!videoExtension(file.type)||!file.size||file.size>MAX_VIDEO_BYTES)throw new Error('Choose an MP4 or WebM video up to 250 MB.');if(!videoSignatureMatches(new Uint8Array(await file.slice(0,4096).arrayBuffer()),file.type))throw new Error('Choose a valid MP4 or WebM video file.');}
export function normalizeVideoMetadata(url:string,metadata:Record<string,unknown>){const location=videoLocation(url);if(!location)throw new Error('Choose a valid YouTube, Google Drive or HTTPS video URL.');const selected=String(metadata.videoSource||location.source);if(['youtube','drive','upload'].includes(selected)&&selected!==location.source)throw new Error('Choose a URL that matches the selected video source.');return {...metadata,videoSource:location.source};}
