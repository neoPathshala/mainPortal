"use client";

import { useEffect, useRef, useState } from "react";
import { ArrowLeft, ArrowRight, Moon, RotateCw, Sun, ZoomIn, ZoomOut, Maximize2, Minimize2, Layers, File, Columns2 } from "lucide-react";
import type { PDFDocumentProxy } from "pdfjs-dist";
import {useMaximizeTransition} from "./use-maximize-transition";
import { PDFPageCanvas } from "./PDFPageCanvas";
import { OfflinePDFControls } from "./OfflinePDFControls";
import { usePDFSource } from "./use-pdf-source";

export function AdvancedPDFReader({ source, title, className = "h-[70vh]", allowMaximize = true, onExpand }: { source: string; title: string; className?: string; allowMaximize?: boolean; onExpand?:()=>void }) {
  const [mode,setMode] = useState<"all"|"single"|"two">("all");
  const [width,setWidth] = useState(800);
  const [maximized,setMaximized] = useState(false);
  const [pdf, setPdf] = useState<PDFDocumentProxy | null>(null);
  const [page, setPage] = useState(1);
  const [scale, setScale] = useState(1);
  const [rotation, setRotation] = useState(0);
  const [dark, setDark] = useState(false);
  const [readingMode, setReadingMode] = useState(false);
  useEffect(() => {
    try { setReadingMode(localStorage.getItem("neopathshala:pdf:reading-mode") === "true"); } catch {}
  }, []);
  const [fallback, setFallback] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);
  const container = useRef<HTMLDivElement>(null);
  const shell = useRef<HTMLDivElement>(null);
  const prepareMaximize=useMaximizeTransition(shell,maximized);
  const url = usePDFSource(source);
  const positionKey = `neopathshala:pdf:${source}`;

  useEffect(() => {
    if (!url) {setPdf(null);setLoading(false);setFallback(false);setError("");return;}
    let disposed = false;
    let task: ReturnType<typeof import("pdfjs-dist")["getDocument"]> | undefined;
    setLoading(true); setPdf(null); setError(""); setFallback(false); setScale(1); setRotation(0);
    import("pdfjs-dist").then(engine => {
      if (disposed) return;
      engine.GlobalWorkerOptions.workerSrc = "/pdf/pdf.worker.min.mjs";
      task = engine.getDocument({ url, cMapUrl: "/pdf/cmaps/", cMapPacked: true, standardFontDataUrl: "/pdf/standard_fonts/", wasmUrl: "/pdf/wasm/" });
      return task.promise;
    }).then(document => {
      if (!document || disposed) return;
      setPdf(document);setLoading(false);
      let saved = 1;
      try { saved = Math.floor(Number(localStorage.getItem(positionKey))) || 1; } catch {}
      setPage(Math.min(document.numPages, Math.max(1, Number.isFinite(saved)?saved:1)));
    }).catch(() => {
      if (!disposed) { setError("This PDF could not be opened. It may be password protected or unavailable."); setFallback(true); setLoading(false); }
    });
    return () => { disposed = true; void task?.destroy(); };
  }, [url, positionKey]);

  useEffect(()=>{
    const element=container.current;if(!element)return;
    const resize=new ResizeObserver(()=>{if(element.clientWidth>0)setWidth(Math.max(160,element.clientWidth-16));});
    resize.observe(element);return()=>resize.disconnect();
  },[pdf,fallback,url]);
  useEffect(()=>{
    if(!pdf)return;
    try{localStorage.setItem(positionKey,String(page));}catch{}
  },[page,pdf,positionKey]);
  const goTo=(value:number)=>{
    const next=Math.max(1,Math.min(pdf?.numPages||1,Number.isFinite(value)?Math.floor(value):1));setPage(next);
    if(mode==='all'){
      const root=container.current,element=root?.querySelector<HTMLElement>(`[data-pdf-page="${next}"]`);
      if(root&&element)root.scrollTo({top:element.getBoundingClientRect().top-root.getBoundingClientRect().top+root.scrollTop,behavior:matchMedia('(prefers-reduced-motion: reduce)').matches?'instant':'smooth'});
    }else container.current?.scrollTo({top:0,behavior:'instant'});
  };
  useEffect(()=>{
    if(mode!=='all'||!pdf)return;
    const frame=requestAnimationFrame(()=>{
      const root=container.current,element=root?.querySelector<HTMLElement>(`[data-pdf-page="${page}"]`);
      if(root&&element)root.scrollTo({top:element.getBoundingClientRect().top-root.getBoundingClientRect().top+root.scrollTop,behavior:'instant'});
    });
    return()=>cancelAnimationFrame(frame);
    // Restore the current page when changing layout or opening a document.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  },[pdf,mode]);
  useEffect(()=>{
    if(!maximized)return;
    const previous=document.body.style.overflow;document.body.style.overflow='hidden';
    const escape=(event:KeyboardEvent)=>{if(event.key==='Escape'){event.preventDefault();event.stopImmediatePropagation();prepareMaximize();setMaximized(false);}};
    document.addEventListener('keydown',escape,true);
    return()=>{document.body.style.overflow=previous;document.removeEventListener('keydown',escape,true);};
  },[maximized]);
  const toggleMaximize=()=>{if(onExpand){onExpand();return;}prepareMaximize();setMaximized(value=>!value);};
  const first=mode==='two'?Math.floor((page-1)/2)*2+1:page;
  const pages=pdf?(mode==='all'?Array.from({length:pdf.numPages},(_,index)=>index+1):mode==='two'?[first,first+1].filter(value=>value<=pdf.numPages):[page]):[];
  const control = "rounded-md p-2 text-muted-foreground hover:bg-muted hover:text-foreground disabled:opacity-30";
  return <div ref={shell} onContextMenu={event=>event.preventDefault()} style={maximized?{position:"fixed",inset:0,zIndex:100,height:"100dvh",width:"100vw"}:undefined} className={`flex min-h-96 flex-col overflow-hidden bg-background ${className}`}>
    <div className="flex shrink-0 flex-wrap items-center justify-between gap-2 bg-background px-3 py-2">
      <div className="flex items-center gap-1">
        <button aria-label="Previous page" disabled={!pdf || first <= 1 || fallback} onClick={() => goTo(first - (mode==='two'?2:1))} className={control}><ArrowLeft className="h-4 w-4" /></button>
        <input aria-label="Page number" type="number" min={1} max={pdf?.numPages || 1} value={page} disabled={!pdf || fallback} onChange={event => goTo(Number(event.target.value)||1)} className="w-12 rounded border border-border bg-background py-1 text-center text-xs" />
        <span className="px-1 text-xs text-muted-foreground">/ {pdf?.numPages || "—"}</span>
        <button aria-label="Next page" disabled={!pdf || first + (mode==='two'?1:0) >= pdf.numPages || fallback} onClick={() => goTo(first + (mode==='two'?2:1))} className={control}><ArrowRight className="h-4 w-4" /></button>
      </div>
      <div role="group" aria-label="PDF page layout" className="flex items-center gap-1 rounded-lg border border-border p-1">{([{value:'all',label:'All pages',icon:Layers},{value:'single',label:'One page',icon:File},{value:'two',label:'Two pages',icon:Columns2}] as const).map(({value,label,icon:Icon})=><button type="button" key={value} aria-pressed={mode===value} onClick={()=>{setMode(value);if(value==='two')setPage(Math.floor((page-1)/2)*2+1);}} className={`flex items-center gap-1.5 rounded-md px-2 py-1.5 text-[11px] ${mode===value?'bg-primary/10 text-primary':'text-muted-foreground hover:bg-muted'}`}><Icon size={14} aria-hidden="true"/>{label}</button>)}</div>
      <div className="flex items-center gap-1">
        {allowMaximize&&<button type="button" aria-label={maximized?'Restore PDF viewer':'Maximize PDF viewer'} aria-pressed={maximized} onClick={()=>void toggleMaximize()} className={control}>{maximized?<Minimize2 size={16}/>:<Maximize2 size={16}/>}</button>}
        {!fallback && <>
          <button aria-label="Zoom out" onClick={() => setScale(value => Math.max(.5, value - .25))} className={control}><ZoomOut className="h-4 w-4" /></button>
          <button onClick={() => setScale(1)} title="Fit width" className="px-1 text-xs">{Math.round(scale * 100)}%</button>
          <button aria-label="Zoom in" onClick={() => setScale(value => Math.min(3, value + .25))} className={control}><ZoomIn className="h-4 w-4" /></button>
          <button aria-label="Rotate page" onClick={() => setRotation(value => (value + 90) % 360)} className={control}><RotateCw className="h-4 w-4" /></button>
          <button aria-label="Toggle reading theme" onClick={() => setDark(value => !value)} className={control}>{dark ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}</button>
        </>}
        <button aria-pressed={readingMode} onClick={() => setReadingMode(value => { try { localStorage.setItem("neopathshala:pdf:reading-mode", String(!value)); } catch {} return !value; })} className={`rounded-lg px-2 py-1.5 text-[11px] ${readingMode ? "bg-amber-100 text-amber-950" : "border border-border"}`}>Reading mode</button>
      </div>
    </div>
    <OfflinePDFControls source={source} url={url}/>
    {!url && <p role="status" className="px-4 py-6 text-center text-sm text-muted-foreground">Connect to open this PDF, or download it in the installed app before going offline.</p>}
    {error && <p role="status" className="shrink-0 px-4 py-2 text-xs text-muted-foreground">{error}</p>}
    {fallback ? <div className="flex flex-1 items-center justify-center px-6 text-center text-sm text-muted-foreground">The document is unavailable in this viewer.</div> : !url ? null : <div ref={container} tabIndex={0} aria-label="PDF pages. Use left and right arrow keys to navigate." onKeyDown={event=>{if(event.target!==event.currentTarget)return;if(event.key==='ArrowRight'){event.preventDefault();goTo(first+(mode==='two'?2:1));}if(event.key==='ArrowLeft'){event.preventDefault();goTo(first-(mode==='two'?2:1));}}} onScroll={event=>{
      if(mode!=='all'||!pdf||event.currentTarget.clientHeight===0)return;
      const root=event.currentTarget,top=root.getBoundingClientRect().top;let current=1;
      for(const element of root.querySelectorAll<HTMLElement>('[data-pdf-page]')){if(element.getBoundingClientRect().top>top+root.clientHeight*.3)break;current=Number(element.dataset.pdfPage)||1;}
      setPage(current);
    }} className={`relative isolate min-h-0 flex-1 overflow-auto p-2 ${readingMode?'bg-[#e9dfca]':dark?'bg-[#171c19] dark:bg-background':'bg-muted/40'}`}>
      {loading&&<p role="status" className="py-6 text-center text-xs text-muted-foreground">Loading document…</p>}
      <div className={mode==='two'?'flex min-w-max items-start justify-center gap-2':'flex min-w-max flex-col gap-3'}>{pdf&&pages.map(number=><PDFPageCanvas key={`${mode}-${number}`} pdf={pdf} page={number} width={mode==='two'?Math.max(120,(width-8)/2):width} scale={scale} rotation={rotation} title={title} dark={dark} readingMode={readingMode} root={container}/>)}</div>
    </div>}
  </div>;
}
