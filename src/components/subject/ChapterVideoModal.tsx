"use client";

import {createPortal} from "react-dom";
import { useLayoutEffect, useEffect, useRef, useState } from "react";
import { PictureInPicture2, Check, ExternalLink, Maximize2, Minimize2, Play, Pause, ListVideo, SkipBack, SkipForward, Clock3, X } from "lucide-react";
import type { VideoLecture } from "@/data/courses-db";
import {QuestionVideo} from "./QuestionMedia";
import {videoLocation} from "@/lib/resource-video";
import { SponsorBanner } from "@/components/sponsor-banner";
import { bannerMatchesPath, homepageBannerActive, parseHomepageBanner, type HomepageBanner } from "@/lib/homepage-banners";
import {loadVideoMetadata} from "@/lib/youtube-metadata-client";
import { StudyMetadata } from "./StudyMetadata";

export function ChapterVideoModal({ active, lessons, onSelect, onClose }: {
  active: VideoLecture; lessons: VideoLecture[]; onSelect: (video: VideoLecture) => void; onClose: () => void;
}) {
  const [maximized, setMaximized] = useState(false);
  const [mode, setMode] = useState<"modal" | "mini">("modal");
  const dialog = useRef<HTMLDialogElement>(null);
  useLayoutEffect(() => {
    const element=dialog.current;
    if(!element?.animate || matchMedia("(prefers-reduced-motion: reduce)").matches)return;
    const animation=element.animate([{opacity:0,transform:"translateY(18px) scale(.96)"},{opacity:1,transform:"none"}],{duration:260,easing:"cubic-bezier(.22,1,.36,1)"});
    return ()=>animation.cancel();
  },[mode]);
  const player = useRef<HTMLDivElement>(null);
  const [showYouTubeButton, setShowYouTubeButton] = useState(false);
  useEffect(() => { const controller = new AbortController(); void fetch('/api/video-player-settings', {signal:controller.signal}).then(response => response.ok ? response.json() : null).then(value => setShowYouTubeButton(value?.showYouTubeButton === true)).catch(() => {}); return () => controller.abort(); }, []);
  const youtubeLocation = videoLocation(active.videoUrl);
  const youtubeURL = youtubeLocation?.source === 'youtube' ? youtubeLocation.id ? `https://www.youtube.com/watch?v=${encodeURIComponent(youtubeLocation.id)}` : youtubeLocation.list ? `https://www.youtube.com/playlist?list=${encodeURIComponent(youtubeLocation.list)}` : null : null;
  const [channel, setChannel] = useState<{id:string;name:string;logo:string}|null>(null);
  const channelVideoId = youtubeLocation?.source === 'youtube' ? youtubeLocation.id : null;
  useEffect(() => {
    if (!channelVideoId) return;
    let disposed=false;
    void loadVideoMetadata(channelVideoId).then(value=>{if(!disposed)setChannel(value);}).catch(()=>{});
    return ()=>{disposed=true;};
  }, [channelVideoId]);
  const channelName = (channel?.id === channelVideoId ? channel.name : '') || active.instructor;
  const channelLogo = channel?.id === channelVideoId ? channel.logo : '';
  const [playingId, setPlayingId] = useState<string | null>(null);
  const isPlaying = playingId === active.id;
  const [watched, setWatched] = useState<string[]>([]);
  const [autoplayNext, setAutoplayNext] = useState(true);
  const [sidebarBanners, setSidebarBanners] = useState<HomepageBanner[]>([]);
  useEffect(() => {
    const controller = new AbortController();
    // Only public, published sidebar campaigns are eligible inside the player.
    void fetch('/api/site-banners', { signal: controller.signal }).then(response => response.ok ? response.json() : null).then(data => {
      if (!Array.isArray(data?.banners)) return;
      setSidebarBanners(data.banners.flatMap((value: unknown) => {
        try { const banner = parseHomepageBanner(value); return banner && homepageBannerActive(banner, Date.now()) && banner.homeSlot === 'sidebar' && bannerMatchesPath(banner, window.location.pathname) && !banner.targetCourseSlug && !banner.targetSemesters?.length ? [banner] : []; } catch { return []; }
      }));
    }).catch(() => {});
    return () => controller.abort();
  }, []);
  const index = lessons.findIndex(lesson => lesson.id === active.id);
  const previous = lessons[index - 1];
  const next = lessons[index + 1];
  const youtubeId=(lesson:VideoLecture)=>{const location=videoLocation(lesson.videoUrl);return location?.source==='youtube'?location.id:null;};
  const markWatched = () => setWatched(items => items.includes(active.id) ? items : [...items, active.id]);

  useEffect(() => {
    const element = dialog.current;
    const focused = document.activeElement as HTMLElement | null;
    const overflow = document.body.style.overflow;
    if(mode !== "modal") { element?.show(); return () => element?.close(); }
    element?.showModal();
    document.body.style.overflow = "hidden";
    return () => { element?.close(); document.body.style.overflow = overflow; focused?.focus(); };
  }, [mode]);

  return createPortal(<><dialog ref={dialog} onCancel={event => { event.preventDefault(); onClose(); }} onClick={event => { if (event.target === dialog.current) onClose(); }} aria-label={mode === "mini" ? `${active.title} mini-player` : undefined} aria-labelledby={mode === "mini" ? undefined : "chapter-video-title"} style={mode === "mini" ? {inset:"auto 1rem calc(100px + env(safe-area-inset-bottom)) auto",width:"min(360px, calc(100vw - 2rem))",maxHeight:"60dvh",margin:0,zIndex:45} : undefined} className={`fixed inset-0 m-auto flex max-w-none flex-col overflow-hidden border border-border bg-background p-0 text-foreground shadow-2xl backdrop:bg-background/80 ${mode === "mini" ? "rounded-xl" : maximized ? "h-dvh max-h-dvh w-screen rounded-none" : "max-h-[94dvh] w-[min(1320px,96vw)] rounded-2xl"}`}>
    {mode === "mini" && <div className="absolute right-1 top-1 z-10 flex gap-1">
      <button type="button" onClick={()=>{setMaximized(true);setMode("modal");}} aria-label="Maximize video" title="Maximize video" className="flex size-11 items-center justify-center rounded-lg bg-black/70 text-white hover:bg-black/90 focus-visible:outline-2 focus-visible:outline-white"><Maximize2 size={18}/></button>
      <button type="button" onClick={onClose} aria-label="Close video" title="Close video" className="flex size-11 items-center justify-center rounded-lg bg-black/70 text-white hover:bg-black/90 focus-visible:outline-2 focus-visible:outline-white"><X size={18}/></button>
    </div>}
    <header hidden={mode === "mini"} className="flex items-center justify-between gap-4 shrink-0 border-b border-border px-5 py-4">
      <div className="min-w-0">{active.unitName && !/^one[ -]?shot(?: videos?)?$/i.test(active.unitName.trim()) && <p className="truncate text-xs text-muted-foreground">{active.unitName}</p>}<h2 id="chapter-video-title" className="mt-1 truncate text-sm font-medium">{active.title}</h2></div>
      <div className="flex shrink-0 items-center gap-1"><button type="button" onClick={()=>setMode(mode === "mini" ? "modal" : "mini")} aria-label={mode === "mini" ? "Restore video modal" : "Open video mini-player"} className="rounded-lg p-2"><PictureInPicture2 size={16}/></button><button type="button" onClick={() => setMaximized(value => !value)} aria-label={maximized ? "Restore popup" : "Maximize popup"} aria-pressed={maximized} className="rounded-lg p-2 text-muted-foreground hover:bg-muted hover:text-foreground">{maximized ? <Minimize2 className="h-4 w-4"/> : <Maximize2 className="h-4 w-4"/>}</button><button onClick={onClose} aria-label="Close video" className="rounded-lg p-2 text-muted-foreground hover:bg-muted hover:text-foreground"><X className="h-5 w-5" /></button></div>
    </header>
    <div className={`grid min-h-0 overflow-y-auto lg:overflow-hidden ${mode === "modal" ? "lg:grid-cols-[minmax(0,1fr)_380px]" : ""} ${mode === "mini" ? "" : maximized ? "flex-1" : "max-h-[calc(94dvh-81px)]"}`}>
      <main className="min-w-0 lg:overflow-y-auto">
        <div ref={player} className="w-full bg-background">
          <QuestionVideo videoOnly={mode === "mini"} cleanEndScreen key={active.id} url={active.videoUrl} title={active.title} poster={active.thumbnailUrl} onPlaybackChange={playing => setPlayingId(playing ? active.id : null)} autoPlay onEnded={()=>{markWatched();if(autoplayNext&&next)onSelect(next);}}/>
        </div>
        <div hidden={mode === "mini"} className="space-y-3 px-5 pb-5 pt-1 sm:px-6 sm:pb-6">
          <div><h3 className="text-base font-semibold leading-6 tracking-tight sm:text-lg">{active.title}</h3><div className="mt-4 flex items-center justify-between gap-3">{channelName ? <div className="flex min-w-0 items-center gap-2.5">{channelLogo ? <img key={channelLogo} src={channelLogo} alt="" referrerPolicy="no-referrer" className="size-9 shrink-0 rounded-full object-cover" onError={event => {event.currentTarget.style.display='none';}}/> : <span aria-hidden="true" className="grid size-9 shrink-0 place-items-center rounded-full bg-primary/10 text-sm font-semibold text-primary">{channelName.slice(0,1).toUpperCase()}</span>}<span className="truncate text-xs font-medium">{channelName}</span></div> : <span/>}{showYouTubeButton && youtubeURL && <a href={youtubeURL} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1 rounded-md border border-border px-2 py-1.5 text-[11px] font-medium text-muted-foreground transition-colors hover:bg-muted hover:text-foreground">Open in YT<ExternalLink size={12}/></a>}</div></div>
          <StudyMetadata entity={`video:${active.id}`} />{active.estimatedMarks!==undefined&&<p className="mt-3 text-xs text-muted-foreground">Estimated marks: {active.estimatedMarks}</p>}

        </div>
      </main>
      <aside style={{display:mode === "mini" ? "none" : undefined}} className="flex min-h-0 flex-col gap-3 border-t border-border bg-background p-3 lg:border-l lg:border-t-0">

        {sidebarBanners.map(banner => <div key={banner.id} className="overflow-hidden rounded-xl">{banner.mediaUrl || banner.image ? <SponsorBanner banner={banner}/> : <section className="bg-muted p-4"><h4 className="text-sm font-semibold">{banner.title}</h4><p className="mt-2 whitespace-pre-wrap text-xs leading-6 text-muted-foreground">{banner.description}</p></section>}</div>)}
        {active.description?.trim() && <section className="rounded-xl bg-muted px-4 py-3 text-xs leading-6 text-muted-foreground"><h4 className="mb-1 font-medium text-foreground">Video guide</h4><p className="whitespace-pre-wrap">{active.description}</p></section>}
        <div className="grid shrink-0 grid-cols-[minmax(0,1fr)_auto_minmax(0,1fr)] items-center gap-2 rounded-md bg-muted px-2 py-1.5"><h3 className="flex shrink-0 items-center gap-2 text-xs font-medium"><ListVideo size={17}/>Playlist</h3><div role="group" aria-label="Lesson playback controls" className="flex items-center justify-center gap-1"><button type="button" aria-label="Previous lesson" disabled={!previous} onClick={() => previous && onSelect(previous)} className="rounded p-1 hover:bg-background disabled:opacity-30"><SkipBack size={14}/></button><button type="button" aria-label={isPlaying ? 'Pause lesson' : 'Play lesson'} onClick={() => player.current?.querySelector<HTMLButtonElement>(`button[aria-label="${isPlaying ? 'Pause' : 'Play'}"]`)?.click()} className="rounded p-1 hover:bg-background">{isPlaying ? <Pause size={14}/> : <Play size={14}/>}</button><button type="button" aria-label="Next lesson" disabled={!next} onClick={() => next && onSelect(next)} className="rounded p-1 hover:bg-background disabled:opacity-30"><SkipForward size={14}/></button></div><label className="justify-self-end inline-flex cursor-pointer items-center gap-2 pr-1 text-[11px]"><span>Autoplay</span><input type="checkbox" role="switch" aria-label="Autoplay next lesson" checked={autoplayNext} onChange={event => setAutoplayNext(event.target.checked)} className="peer sr-only"/><span aria-hidden="true" className="relative h-4 w-7 shrink-0 rounded-full bg-foreground/20 transition-colors after:absolute after:left-0.5 after:top-0.5 after:size-3 after:rounded-full after:bg-background after:transition-transform peer-checked:bg-primary peer-checked:after:translate-x-3 peer-focus-visible:outline peer-focus-visible:outline-2 peer-focus-visible:outline-offset-2 peer-focus-visible:outline-primary"/></label></div>
        <div className="min-h-0 space-y-4 lg:flex-1 lg:overflow-y-auto" aria-label="Chapter playlist">
          {lessons.map((lesson, position) => <button type="button" key={lesson.id} onClick={() => onSelect(lesson)} aria-current={lesson.id === active.id ? 'true' : undefined} className="flex w-full items-start gap-3 rounded-lg text-left focus-visible:outline-primary">
            <span className="relative grid aspect-video w-[46%] shrink-0 place-items-center overflow-hidden rounded-lg bg-muted">{(lesson.thumbnailUrl||youtubeId(lesson)) && <img alt="" loading="lazy" src={lesson.thumbnailUrl||`https://i.ytimg.com/vi/${youtubeId(lesson)}/mqdefault.jpg`} className="absolute inset-0 h-full w-full object-cover"/>}{lesson.id === active.id && isPlaying && <span role="status" aria-label="Playing" className="relative flex h-7 items-center gap-0.5 rounded-full bg-background/90 px-3 text-primary">{[0,1,2,3].map(bar => <span key={bar} className="video-playing-bar block h-4 w-0.5 rounded-full bg-current" style={{animationDelay:`${bar * -0.18}s`}}/>)}</span>}<span className="absolute bottom-1 left-1 inline-flex items-center gap-1 rounded-full bg-black/60 px-1.5 py-0.5 text-[10px] text-white"><Clock3 size={11}/>{lesson.duration}</span></span>
            <span className="min-w-0 pt-0.5"><span className={`line-clamp-2 text-sm font-medium leading-5 ${lesson.id === active.id ? 'text-primary' : ''}`}>{lesson.title}</span><span className="mt-1 block truncate text-[11px] text-muted-foreground">#{position + 1}{lesson.instructor ? ` - ${lesson.instructor}` : ''}</span>{watched.includes(lesson.id) && <span className="mt-1 inline-flex items-center gap-1 text-[10px] text-primary"><Check size={12}/>Completed</span>}</span>
          </button>)}
        </div>
        
      </aside>
    </div>
  </dialog></>,document.body);
}
