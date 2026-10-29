"use client";
import {videoLocation} from "@/lib/resource-video";
import { useEffect, useMemo, useState } from "react";
import { ChevronDown, Play } from "lucide-react";
import type { VideoLecture } from "@/data/courses-db";
import dynamic from "next/dynamic";
const ChapterVideoModal=dynamic(()=>import("./ChapterVideoModal").then(module=>module.ChapterVideoModal),{ssr:false});
import {loadVideoMetadata} from "@/lib/youtube-metadata-client";
import { StudyMetadata } from "./StudyMetadata";

export function VideoLecturesSection({ videos, subjectName }: { videos: VideoLecture[]; subjectName: string }) {
  const [active, setActive] = useState<VideoLecture | null>(null);
  const [showLessonLabels,setShowLessonLabels]=useState(false);
  useEffect(()=>{const controller=new AbortController();void fetch('/api/video-player-settings',{signal:controller.signal}).then(response=>response.ok?response.json():null).then(settings=>{if(settings)setShowLessonLabels(settings.showVideoLessonLabels!==false);}).catch(()=>{});return ()=>controller.abort();},[]);
  const [durations,setDurations]=useState<Record<string,string>>({});
  useEffect(()=>{
    let disposed=false;
    const ids=[...new Set(videos.flatMap(video=>{const location=videoLocation(video.videoUrl);return location?.source==='youtube'&&location.id?[location.id]:[];}))];
    void Promise.all(ids.map(async id=>{try{return [id,(await loadVideoMetadata(id)).duration] as const;}catch{return [id,''] as const;}})).then(entries=>{if(!disposed)setDurations(Object.fromEntries(entries));});
    return ()=>{disposed=true;};
  },[videos]);
  const thumbnail = (lesson: VideoLecture) => {
    if(lesson.thumbnailUrl)return lesson.thumbnailUrl;const location=videoLocation(lesson.videoUrl);return location?.source==='youtube'?location.thumbnail:null;
  };
  const groups = useMemo(() => {
    const result = new Map<string, VideoLecture[]>();
    videos.map(video=>{const location=videoLocation(video.videoUrl);return location?.source==='youtube'&&location.id&&durations[location.id]?{...video,duration:durations[location.id]}:video;}).sort((a, b) => Number(b.kind==='One shot')-Number(a.kind==='One shot')||(a.unitId||0)-(b.unitId||0)||a.order-b.order).forEach(video => {
      const key = video.unitName || subjectName;
      const group=result.get(key);if(group)group.push(video);else result.set(key,[video]);
    });
    return [...result.entries()];
  }, [videos, subjectName,durations]);
  return <div className="space-y-5">
    {active && <ChapterVideoModal active={active} lessons={groups.find(([name]) => name === (active.unitName || subjectName))?.[1] || [active]} onSelect={setActive} onClose={() => setActive(null)} />}
    <div className="overflow-hidden rounded-xl border border-border bg-card">
      {!groups.length && <p className="p-6 text-sm text-muted-foreground">No video lessons yet.</p>}
      {groups.map(([name, lessons], index) => <details key={name} open={index === 0} className="group border-b border-border last:border-0">
        <summary className="flex cursor-pointer list-none items-center gap-4 px-5 py-5 [&::-webkit-details-marker]:hidden">
          <span className="text-xs tabular-nums text-muted-foreground">{String(index + 1).padStart(2, "0")}</span>
          <h3 className="flex-1 text-sm font-medium">{name}</h3>
          <span className="text-xs text-muted-foreground">{lessons.length} videos</span>
          <ChevronDown className="h-4 w-4 text-muted-foreground transition-transform group-open:rotate-180" />
        </summary>
        <div className="grid grid-cols-1 gap-5 border-t border-border/60 p-5 sm:grid-cols-2 lg:grid-cols-4">
          {lessons.map((lesson, i) => <button key={lesson.id} onClick={() => setActive(lesson)} className={`group/card flex min-w-0 flex-col overflow-hidden rounded-xl border text-left transition-colors ${active?.id === lesson.id ? "border-primary bg-primary/5" : "border-border hover:border-primary/40"}`}>
            <span className="relative block aspect-video w-full overflow-hidden bg-muted">
              {thumbnail(lesson) && <img src={thumbnail(lesson)!} alt="" loading="lazy" onError={event => { event.currentTarget.style.display = "none"; }} className="h-full w-full object-cover" />}
              <span className="absolute inset-0 grid place-items-center bg-black/15"><span className="grid h-7 w-7 place-items-center rounded-full bg-black/65 text-white"><Play className="h-3 w-3 fill-current" /></span></span>
              <span className="absolute bottom-2 right-2 rounded bg-black/80 px-1.5 py-0.5 text-[10px] tabular-nums text-white">{lesson.duration}</span>
            </span>
            <span className="block w-full p-4">{showLessonLabels&&<span className="mb-1.5 block text-[10px] uppercase tracking-wider text-muted-foreground">Lesson {i + 1}</span>}<span className="line-clamp-2 text-sm font-medium leading-6">{lesson.title}</span>{lesson.estimatedMarks!==undefined&&<span className="mt-2 block text-[11px] text-muted-foreground">Estimated marks: {lesson.estimatedMarks}</span>}<StudyMetadata entity={`video:${lesson.id}`} /></span>
          </button>)}
        </div>
      </details>)}
    </div>
  </div>;
}
