export interface YouTubePlayerInstance {
 playVideo():void; pauseVideo():void; seekTo(seconds:number,allowSeekAhead:boolean):void;
 getCurrentTime():number; getDuration():number; getVideoLoadedFraction():number; getPlayerState():number;
 getVolume():number; setVolume(volume:number):void; isMuted():boolean; mute():void; unMute():void;
 getPlaybackRate():number; setPlaybackRate(rate:number):void; getAvailablePlaybackRates():number[];
 getPlaylist():string[]; getPlaylistIndex():number; nextVideo():void; previousVideo():void;
 getIframe():HTMLIFrameElement; destroy():void;
}
export type YouTubeEvent={target:YouTubePlayerInstance;data:number};
export interface YouTubeAPI { Player:new(element:HTMLIFrameElement,options:{events:Record<string,(event:YouTubeEvent)=>void>})=>YouTubePlayerInstance }
declare global { interface Window { YT?:YouTubeAPI; onYouTubeIframeAPIReady?:()=>void } }
let loading:Promise<YouTubeAPI>|null=null;
/** One script for every player; never load YouTube until playback is requested. */
export function loadYouTubeAPI():Promise<YouTubeAPI>{
 if(window.YT?.Player)return Promise.resolve(window.YT);
 if(loading)return loading;
 loading=new Promise<YouTubeAPI>((resolve,reject)=>{
  const previous=window.onYouTubeIframeAPIReady;
  const script=document.createElement('script');script.src='https://www.youtube.com/iframe_api';script.async=true;
  const nonce=document.querySelector<HTMLScriptElement>('script[nonce]')?.nonce;if(nonce)script.nonce=nonce;
  const finish=(error?:Error)=>{clearTimeout(timer);if(window.onYouTubeIframeAPIReady===ready)window.onYouTubeIframeAPIReady=previous;script.onerror=null;if(error){script.remove();reject(error);}else if(window.YT?.Player)resolve(window.YT);else reject(new Error('YouTube player could not initialize.'));};
  const ready=()=>{try{previous?.();}finally{finish();}};
  const timer=setTimeout(()=>finish(new Error('YouTube took too long to load. Check your connection and retry.')),15000);
  window.onYouTubeIframeAPIReady=ready;
  script.onerror=()=>finish(new Error('YouTube could not load. Check your connection or content blocker.'));
  document.head.appendChild(script);
 }).catch(error=>{loading=null;throw error;});
 return loading;
}
export function youtubeEmbedURL({id,list,origin,nativeControls=false,start=0}:{id?:string|null;list?:string|null;origin:string;nativeControls?:boolean;start?:number}){
 if(!id&&!list||id&&!/^[a-zA-Z0-9_-]{11}$/.test(id)||list&&!/^[a-zA-Z0-9_-]{1,160}$/.test(list))throw new Error('Invalid YouTube video.');
 const site=new URL(origin);if(!['https:','http:'].includes(site.protocol)||site.username||site.password)throw new Error('Invalid player origin.');
 const url=new URL(`https://www.youtube-nocookie.com/embed/${id||'videoseries'}`);
 const params={enablejsapi:'1',origin:site.origin,widget_referrer:site.origin,controls:nativeControls?'1':'0',playsinline:'1',rel:'0',fs:'1',start:String(Math.max(0,Math.floor(start)))};
 for(const [key,value]of Object.entries(params))url.searchParams.set(key,value);
 if(list){url.searchParams.set('list',list);url.searchParams.set('listType','playlist');}
 return url.href;
}
export function youtubeErrorMessage(code:number){
 if(code===153)return 'YouTube could not verify this site (153). Reload after the server update; check that your browser allows the site referrer.';
 if(code===101||code===150)return 'The owner has disabled embedded playback. Open this lesson on YouTube.';
 if(code===100)return 'This YouTube video is private, removed or unavailable.';
 if(code===2)return 'This YouTube link is invalid. Check the video or playlist URL.';
 return 'YouTube could not play this lesson. Retry or open it on YouTube.';
}
