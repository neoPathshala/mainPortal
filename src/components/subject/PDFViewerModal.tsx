"use client";

import { useEffect, useLayoutEffect, useRef, useState } from "react";
import {createPortal} from "react-dom";
import { X, Maximize2, Minimize2, Minus, BookOpen } from "lucide-react";

import { PDFDocument } from "@/data/courses-db";
import {useMaximizeTransition} from "./use-maximize-transition";
import { AdvancedPDFReader } from "./AdvancedPDFReader";

interface PDFViewerModalProps {
  isOpen: boolean;
  onClose: () => void;
  document: PDFDocument | null;
  subjectName?: string;
}

export function PDFViewerModal({
  isOpen,
  onClose,
  document,
  subjectName = "B.Sc. CSIT",
}: PDFViewerModalProps) {
  const modalShell = useRef<HTMLDivElement>(null);
  const [maximized,setMaximized]=useState(true);
  const [minimized,setMinimized]=useState(false);
  const [minimizing,setMinimizing]=useState(false);
  const launcher=useRef<HTMLButtonElement>(null);
  const shrink=useRef<Animation|null>(null);
  const restoreBounds=useRef<DOMRect|null>(null);
  const prepareMaximize=useMaximizeTransition(modalShell,maximized);
  useEffect(()=>{if(!isOpen){shrink.current?.cancel();setMaximized(true);setMinimized(false);setMinimizing(false);}},[isOpen]);
  useEffect(()=>()=>shrink.current?.cancel(),[]);
  useLayoutEffect(()=>{
    if(minimized||!restoreBounds.current||!modalShell.current)return;
    const from=restoreBounds.current;restoreBounds.current=null;
    if(matchMedia('(prefers-reduced-motion: reduce)').matches)return;
    const element=modalShell.current,to=element.getBoundingClientRect();
    if(!to.width||!to.height||!element.animate)return;
    shrink.current=element.animate([
      {transformOrigin:'top left',transform:`translate(${from.left-to.left}px, ${from.top-to.top}px) scale(${from.width/to.width}, ${from.height/to.height})`,opacity:.1,borderRadius:'24px'},
      {transformOrigin:'top left',transform:'none',opacity:1,borderRadius:'16px'},
    ],{duration:360,easing:'cubic-bezier(.22,1,.36,1)'});
  },[minimized]);
  useEffect(()=>{if(minimized)launcher.current?.focus({preventScroll:true});},[minimized]);
  const minimize=async()=>{
    if(minimizing)return;
    const element=modalShell.current,target=launcher.current;
    if(!element||!target)return;
    setMinimizing(true);
    if(element.animate&&!matchMedia('(prefers-reduced-motion: reduce)').matches){
      const from=element.getBoundingClientRect(),to=target.getBoundingClientRect();
      shrink.current=element.animate([
        {transformOrigin:'top left',transform:'none',opacity:1,borderRadius:'16px'},
        {transformOrigin:'top left',transform:`translate(${to.left-from.left}px, ${to.top-from.top}px) scale(${to.width/from.width}, ${to.height/from.height})`,opacity:.1,borderRadius:'24px'},
      ],{duration:360,easing:'cubic-bezier(.4,0,.2,1)',fill:'forwards'});
      const finished=await Promise.race([shrink.current.finished.then(()=>true,()=>false),new Promise<boolean>(resolve=>setTimeout(()=>resolve(true),420))]);
      if(!finished){setMinimizing(false);return;}
    }
    setMinimized(true);setMinimizing(false);
  };
  const restore=(full=false)=>{if(full)setMaximized(true);restoreBounds.current=launcher.current?.getBoundingClientRect()||null;shrink.current?.cancel();setMinimized(false);};

  useEffect(() => {
    if (!isOpen||minimized) return;
    const previous = window.document.body.style.overflow;
    const previousFocus = window.document.activeElement as HTMLElement | null;
    window.document.body.style.overflow = "hidden";
    return () => {
      window.document.body.style.overflow = previous;
      previousFocus?.focus({preventScroll:true});
    };
  }, [isOpen,minimized]);

  useEffect(() => {
    if (!isOpen||minimized) return;
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {if(maximized){prepareMaximize();setMaximized(false);}else onClose();}
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isOpen, onClose, maximized,minimized]);

  if (!isOpen || !document) return null;

  const source = document.previewUrl || document.downloadUrl;
  if (source && source !== "#" && /^(\/|https?:\/\/)/i.test(source)) {
    return createPortal(<>
      <div className={`fixed inset-0 z-50 flex items-center justify-center ${maximized?"p-0":"p-3 sm:p-6"}`} style={{display:minimized?'none':undefined}} onClick={event => { if (event.target === event.currentTarget) onClose(); }}>
      <div aria-hidden="true" className="pointer-events-none absolute inset-0 bg-black/65 backdrop-blur-sm transition-opacity duration-300 motion-reduce:transition-none" style={{opacity:minimizing?0:1}}/>
      <div ref={modalShell} role="dialog" aria-modal="true" aria-label={document.title} className={`relative flex w-full flex-col overflow-hidden bg-background shadow-2xl ${maximized?"h-dvh max-h-dvh max-w-none rounded-none":"h-[78dvh] max-h-[850px] max-w-5xl rounded-2xl"}`}>
        <div className="flex h-16 shrink-0 items-center justify-between gap-4 border-b border-border px-4 sm:px-6">
          <div className="min-w-0">
            <h2 className="truncate text-sm font-medium">{document.title}</h2>
            <p className="mt-1 text-xs text-muted-foreground">{subjectName}</p>
          </div>
          <div className="flex shrink-0 items-center gap-2">
            <button type="button" disabled={minimizing} onClick={()=>void minimize()} aria-label="Minimize PDF to icon" className="rounded-lg p-2 hover:bg-muted disabled:opacity-40"><Minus className="h-4 w-4"/></button>
            <button type="button" disabled={minimizing} onClick={()=>{prepareMaximize();setMaximized(value=>!value);}} aria-label={maximized?"Restore PDF popup":"Maximize PDF popup"} aria-pressed={maximized} className="rounded-lg p-2 hover:bg-muted">{maximized?<Minimize2 className="h-4 w-4"/>:<Maximize2 className="h-4 w-4"/>}</button>
            <button autoFocus onClick={onClose} className="rounded-lg p-2 hover:bg-muted" aria-label="Close PDF reader"><X className="h-5 w-5" /></button>
          </div>
        </div>
        <AdvancedPDFReader allowMaximize={false} key={source} source={source} title={document.title} className="min-h-0 flex-1" />
      </div>
      </div>
      <div className="pdf-minimized-trigger fixed left-5 z-40" style={{visibility:minimized?'visible':'hidden'}}>
        <button ref={launcher} type="button" onClick={()=>restore(false)} aria-label={`Restore PDF: ${document.title}`} title={document.title} className="flex h-12 w-12 items-center justify-center rounded-full border border-border bg-card text-primary shadow-lg hover:bg-muted"><BookOpen size={23} aria-hidden="true"/></button>
        {minimized&&<button type="button" onClick={()=>restore(true)} aria-label="Maximize minimized PDF" title="Maximize PDF" className="absolute -right-3 bottom-0 flex h-7 w-7 items-center justify-center rounded-full border border-border bg-card text-primary shadow-sm"><Maximize2 size={14}/></button>}{minimized&&<button type="button" onClick={onClose} aria-label="Close minimized PDF" className="absolute -right-2 -top-2 flex h-6 w-6 items-center justify-center rounded-full border border-border bg-card text-muted-foreground shadow-sm"><X size={12}/></button>}
      </div>
    </>,window.document.body);
  }

  return <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/65 p-4"><section role="dialog" aria-modal="true" aria-label="Document unavailable" className="max-w-md rounded-2xl bg-card p-6 text-center"><h2 className="text-base font-semibold">Document unavailable</h2><p className="mt-2 text-sm text-muted-foreground">Ask the administrator to upload a PDF for this resource.</p><button autoFocus type="button" onClick={onClose} className="mt-5 rounded-lg border border-border px-4 py-2 text-sm">Close</button></section></div>;
}
