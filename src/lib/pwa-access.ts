export function mobilePwa(client:string|null,device:string|null,userAgent=''){
 return client==='pwa'&&(device==='mobile'||device!=='desktop'&&/Android|iPhone|iPad|iPod|Mobile/i.test(userAgent));
}
export function publicPwaPath(path:string){return /^\/(login|register|two-factor|privacy-policy|terms|cookies)(\/|$)/.test(path);}
export function mobileDevice(userAgent:string,touchPoints=0){return /Android|iPhone|iPad|iPod|Mobile/i.test(userAgent)||touchPoints>1&&/Macintosh/.test(userAgent);}

export function tabletDevice(userAgent:string,touchPoints:number,width:number,height:number,coarsePointer=false){
 return /iPad|Tablet|PlayBook/i.test(userAgent)||/Android/i.test(userAgent)&&!/Mobile/i.test(userAgent)||touchPoints>1&&/Macintosh/.test(userAgent)||touchPoints>0&&coarsePointer&&Math.min(width,height)>=600;
}
