"use client";

import type {CSSProperties} from 'react';
import {PlaybackSpeedMenu} from "./playback-speed-menu";
import {useEffect,useRef,useState,type KeyboardEvent} from 'react';
import {Play,Pause,Volume2,VolumeX,Maximize2,SkipBack,SkipForward,ChevronLeft,ChevronRight,Settings2,RotateCw,LoaderCircle} from 'lucide-react';
import {loadYouTubeAPI,youtubeEmbedURL,youtubeErrorMessage,type YouTubePlayerInstance} from '@/lib/youtube-player';
const button='inline-flex shrink-0 items-center justify-center size-8 rounded-lg p-2 text-foreground hover:bg-muted focus-visible:outline focus-visible:outline-2 focus-visible:outline-emerald-400 disabled:opacity-35';
const clock=(seconds:number)=>{const n=Math.max(0,Math.floor(Number.isFinite(seconds)?seconds:0)),h=Math.floor(n/3600),m=Math.floor(n%3600/60),s=String(n%60).padStart(2,'0');return h?`${h}:${String(m).padStart(2,'0')}:${s}`:`${m}:${s}`;};
export function YouTubePlayer({id,list,title,autoPlay=false,onEnded,poster,onPlaybackChange,cleanEndScreen=false,videoOnly=false}:{id?:string|null;list?:string|null;title:string;url:string;autoPlay?:boolean;onEnded?:()=>void;poster?:string;cleanEndScreen?:boolean;videoOnly?:boolean;onPlaybackChange?:(playing:boolean)=>void}){
 const shell=useRef<HTMLDivElement>(null),mount=useRef<HTMLDivElement>(null),player=useRef<YouTubePlayerInstance|null>(null),ended=useRef(onEnded),playbackChanged=useRef(onPlaybackChange),resume=useRef(0),wantPlay=useRef(autoPlay);
 ended.current=onEnded;playbackChanged.current=onPlaybackChange;
 const [activated,setActivated]=useState(autoPlay),[attempt,setAttempt]=useState(0),[nativeControls,setNativeControls]=useState(false),[ready,setReady]=useState(false),[state,setState]=useState(-1),[time,setTime]=useState(0),[duration,setDuration]=useState(0),[loaded,setLoaded]=useState(0),[volume,setVolume]=useState(100),[muted,setMuted]=useState(false),[rate,setRate]=useState(1),[rates,setRates]=useState([1]),[playlist,setPlaylist]=useState({index:0,total:0}),[error,setError]=useState(''),[notice,setNotice]=useState('');
 const [started,setStarted]=useState(false);
 useEffect(()=>{
  if(!activated)return;let disposed=false,instance:YouTubePlayerInstance|null=null,ticker:ReturnType<typeof setInterval>|undefined,readyTimer:ReturnType<typeof setTimeout>|undefined;
  const stop=()=>{if(ticker){clearInterval(ticker);ticker=undefined;}};
  const read=()=>{if(disposed||!instance)return;try{setTime(instance.getCurrentTime()||0);setDuration(instance.getDuration()||0);setLoaded(instance.getVideoLoadedFraction()||0);setVolume(instance.getVolume());setMuted(instance.isMuted());setRate(instance.getPlaybackRate()||1);setRates(instance.getAvailablePlaybackRates()||[1]);const items=instance.getPlaylist()||[];setPlaylist({index:Math.max(0,instance.getPlaylistIndex()||0),total:items.length});}catch{/* Player may have been removed while navigating. */}};
  const schedule=()=>{stop();if(instance?.getPlayerState()===1&&!document.hidden)ticker=setInterval(read,500);};
  const visibility=()=>{read();schedule();};document.addEventListener('visibilitychange',visibility);
  playbackChanged.current?.(false);setReady(false);setStarted(false);setError('');setNotice('');setState(-1);
  void loadYouTubeAPI().then(api=>{
   if(disposed||!mount.current)return;
   const frame=document.createElement('iframe');frame.src=youtubeEmbedURL({id,list,origin:window.location.origin,nativeControls,start:resume.current});frame.title=title;frame.referrerPolicy='strict-origin-when-cross-origin';frame.allow='accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; fullscreen';frame.allowFullscreen=true;frame.className='aspect-video min-h-[200px] w-full border-0';
   mount.current.replaceChildren(frame);
   readyTimer=setTimeout(()=>{if(!disposed)setError('YouTube did not respond. Check the connection or retry.');},15000);
   instance=new api.Player(frame,{events:{
    onReady:event=>{if(disposed)return;player.current=event.target;clearTimeout(readyTimer);setReady(true);read();if(wantPlay.current)event.target.playVideo();},
    onStateChange:event=>{if(disposed)return;setState(event.data);playbackChanged.current?.(event.data===1);read();schedule();if(event.data===1){setStarted(true);setError('');setNotice('');}if(event.data===0){const items=event.target.getPlaylist()||[];if(!items.length||event.target.getPlaylistIndex()===items.length-1)ended.current?.();}},
    onPlaybackRateChange:event=>{if(!disposed)setRate(event.data);},
    onError:event=>{if(!disposed){clearTimeout(readyTimer);stop();playbackChanged.current?.(false);setState(-1);setError(youtubeErrorMessage(event.data));}},
    onAutoplayBlocked:()=>{if(!disposed)setNotice('Press play to start this lesson.');},
   }});
  }).catch(error=>{if(!disposed)setError(error instanceof Error?error.message:'YouTube could not load.');});
  return()=>{disposed=true;clearTimeout(readyTimer);stop();document.removeEventListener('visibilitychange',visibility);player.current=null;instance?.destroy();mount.current?.replaceChildren();};
 },[activated,attempt,id,list,nativeControls,title]);
 useEffect(()=>{const frame=player.current?.getIframe();if(frame)frame.tabIndex=videoOnly||!nativeControls?-1:0;},[videoOnly,nativeControls,ready]);
 const [showQualityButton,setShowQualityButton]=useState(false);
 useEffect(()=>{
  const controller=new AbortController();
  void fetch('/api/video-player-settings',{signal:controller.signal}).then(response=>response.ok?response.json():null).then(settings=>{if(settings)setShowQualityButton(settings.showVideoQualityButton!==false);}).catch(()=>{});
  return ()=>controller.abort();
 },[]);
 const [centerVisible,setCenterVisible]=useState(false);
 const centerTimer=useRef<ReturnType<typeof setTimeout>|null>(null);
 const hideCenter=()=>{if(centerTimer.current)clearTimeout(centerTimer.current);setCenterVisible(false);};
 const showCenter=()=>{if(centerTimer.current)clearTimeout(centerTimer.current);setCenterVisible(true);centerTimer.current=setTimeout(()=>setCenterVisible(false),2000);};
 useEffect(()=>()=>{if(centerTimer.current)clearTimeout(centerTimer.current);},[]);
 const command=(run:(p:YouTubePlayerInstance)=>void)=>{if(player.current&&ready){try{run(player.current);}catch{setNotice('The player is not ready. Try again.');}}};
 const seek=(value:number)=>command(p=>{const next=Math.max(0,Math.min(duration||0,value));p.seekTo(next,true);setTime(next);});
 const toggle=()=>command(p=>{if(p.getPlayerState()===1)p.pauseVideo();else p.playVideo();});
 const fullscreen=()=>{if(document.fullscreenElement)void document.exitFullscreen().catch(()=>{});else if(shell.current?.requestFullscreen)void shell.current.requestFullscreen().catch(()=>setNotice('Fullscreen is unavailable. Use the player settings for more options.'));else setNotice('Use the player settings for fullscreen on this device.');};
 const changeVolume=(value:number)=>command(p=>{p.setVolume(value);p.unMute();setMuted(false);setVolume(value);});
 const keyboard=(event:KeyboardEvent)=>{if((event.target as HTMLElement).closest('button,input,select,a')||event.altKey||event.ctrlKey||event.metaKey)return;const key=event.key.toLowerCase();if(![' ','k','j','l','arrowleft','arrowright','arrowup','arrowdown','m','f','home','end'].includes(key))return;event.preventDefault();if(key===' '||key==='k')toggle();else if(key==='j'||key==='arrowleft')seek(time-10);else if(key==='l'||key==='arrowright')seek(time+10);else if(key==='arrowup')changeVolume(Math.min(100,volume+5));else if(key==='arrowdown')changeVolume(Math.max(0,volume-5));else if(key==='m')command(p=>{if(p.isMuted())p.unMute();else p.mute();setMuted(p.isMuted());});else if(key==='f')fullscreen();else seek(key==='home'?0:duration);};
 const retry=()=>{resume.current=time;wantPlay.current=true;setAttempt(value=>value+1);};
 const activate=()=>{wantPlay.current=true;setActivated(true);};

 return <div ref={shell} data-starting={activated&&!started || undefined} data-video-only={videoOnly || undefined} data-native-controls={nativeControls || undefined} tabIndex={videoOnly ? undefined : 0} onKeyDown={keyboard} aria-label={`${title} video player`} className="neo-youtube-player overflow-hidden rounded-none bg-background text-foreground focus-visible:outline focus-visible:outline-2 focus-visible:outline-emerald-400">
  <div className="neo-youtube-stage relative" onPointerEnter={showCenter} onPointerMove={showCenter} onPointerDown={showCenter} onPointerLeave={hideCenter}>
  {!activated?<button type="button" onClick={activate} className="relative flex aspect-video min-h-[200px] w-full items-center justify-center overflow-hidden bg-background" aria-label={`Play ${title}`}>{(poster||id)&&<img src={poster||`https://i.ytimg.com/vi/${id}/hqdefault.jpg`} alt="" loading="lazy" className="absolute inset-0 h-full w-full object-cover"/>}<span className="relative flex items-center gap-3 size-14 justify-center rounded-full border border-border bg-background text-foreground shadow-lg"><Play size={20} fill="currentColor"/></span></button>:<div ref={mount} className={`neo-youtube-frame aspect-video min-h-[200px] w-full bg-background ${cleanEndScreen&&state===0?"invisible pointer-events-none":""}`}/>}
  {activated&&!started&&<div aria-hidden="true" className="pointer-events-none absolute inset-0 bg-black">{(poster||id)&&<img src={poster||`https://i.ytimg.com/vi/${id}/hqdefault.jpg`} alt="" className="h-full w-full object-cover"/>}</div>}
  {activated&&!started&&!error&&!notice&&<span role="status" aria-label="Loading video" className="pointer-events-none absolute left-1/2 top-1/2 z-20 flex size-14 -translate-x-1/2 -translate-y-1/2 items-center justify-center rounded-full bg-black/60 text-white"><LoaderCircle aria-hidden="true" size={28} className="animate-spin motion-reduce:animate-none"/></span>}
  {activated&&(!nativeControls||videoOnly)&&<button type="button" aria-label={state===1?'Pause video':'Play video'} disabled={!ready} onClick={toggle} onFocus={showCenter} className={`neo-youtube-center absolute left-1/2 top-1/2 z-10 flex size-14 -translate-x-1/2 -translate-y-1/2 items-center justify-center rounded-full bg-black/70 text-white ${centerVisible ? "opacity-100" : "opacity-0 pointer-events-none"} transition-opacity hover:bg-black/90 focus-visible:opacity-100 focus-visible:pointer-events-auto focus-visible:outline-2 focus-visible:outline-white disabled:pointer-events-none`}>{state===1?<Pause size={26} fill="currentColor"/>:<Play size={26} fill="currentColor"/>}</button>}
  </div>
  <div hidden={videoOnly} className="space-y-1.5 border-t border-border px-3 pb-2 pt-1.5 sm:px-4">
   <input type="range" aria-label="Video position" aria-valuetext={`${clock(time)} of ${clock(duration)}`} min={0} max={duration||0} step={0.25} value={Math.min(time,duration||0)} disabled={!ready||!duration} onChange={event=>seek(Number(event.target.value))} className="video-progress block h-3 w-full cursor-pointer accent-primary" style={{"--video-progress":`${duration ? time / duration * 100 : 0}%`,background:`linear-gradient(to right,transparent ${loaded*100}%,rgba(255,255,255,.06) ${loaded*100}%)`} as CSSProperties}/>
   <div className="flex flex-wrap items-center gap-0.5"><button type="button" className={button} disabled={activated&&!ready} aria-label={state===1?'Pause':'Play'} onClick={()=>activated?toggle():activate()}>{state===1?<Pause size={19}/>:<Play size={19}/>}</button><button type="button" className={button} disabled={!ready} aria-label="Back 10 seconds" onClick={()=>seek(time-10)}><SkipBack size={17}/></button><button type="button" className={button} disabled={!ready} aria-label="Forward 10 seconds" onClick={()=>seek(time+10)}><SkipForward size={17}/></button><span className="mr-auto px-1 text-xs tabular-nums text-muted-foreground">{clock(time)} <span className="text-muted-foreground">/</span> {clock(duration)}</span>
    {playlist.total>1&&<><button type="button" className={button} disabled={!ready||playlist.index===0} aria-label="Previous playlist video" onClick={()=>command(p=>p.previousVideo())}><ChevronLeft size={17}/></button><span className="text-xs text-muted-foreground">{playlist.index+1}/{playlist.total}</span><button type="button" className={button} disabled={!ready||playlist.index>=playlist.total-1} aria-label="Next playlist video" onClick={()=>command(p=>p.nextVideo())}><ChevronRight size={17}/></button></>}
    <button type="button" className={button} disabled={!ready} aria-label={muted||volume===0?'Unmute':'Mute'} onClick={()=>command(p=>{if(p.isMuted()||p.getVolume()===0){p.unMute();if(!p.getVolume()){p.setVolume(100);setVolume(100);}setMuted(false);}else{p.mute();setMuted(true);}})}>{muted||!volume?<VolumeX size={17}/>:<Volume2 size={17}/>}</button><input type="range" aria-label="Volume" min={0} max={100} step={1} disabled={!ready} value={muted?0:volume} onChange={event=>changeVolume(Number(event.target.value))} className="video-progress hidden h-3 w-16 accent-primary sm:block" style={{"--video-progress":`${muted ? 0 : volume}%`} as CSSProperties}/>
    <PlaybackSpeedMenu value={rate} rates={rates} disabled={!ready} onChange={speed=>command(p=>p.setPlaybackRate(speed))}/>
{showQualityButton&&<button type="button" className={button} disabled={!ready} aria-label="Video quality settings" aria-pressed={nativeControls} title="Video quality" onClick={()=>{resume.current=time;wantPlay.current=state===1;setNativeControls(value=>!value);setNotice('');}}><Settings2 size={17}/></button>}<button type="button" className={button} aria-label="Fullscreen player" onClick={fullscreen}><Maximize2 size={17}/></button>
   </div>
   {(error||notice)&&<div role="status" className="flex flex-wrap items-center gap-2 rounded-lg bg-muted px-3 py-2 text-xs leading-5"><p className="flex-1">{error||notice}</p>{error&&<button type="button" onClick={retry} className="inline-flex items-center gap-1 rounded-md border border-white/20 px-2 py-1"><RotateCw size={12}/>Retry</button>}</div>}
  </div>
 </div>;
}
