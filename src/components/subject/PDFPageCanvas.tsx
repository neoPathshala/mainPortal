"use client";
import {useEffect,useRef,useState,type RefObject} from 'react';
import type {PDFDocumentProxy} from 'pdfjs-dist';

/** Keep every page in the document flow, rendering canvases only near the viewport. */
export function PDFPageCanvas({pdf,page,width,scale,rotation,title,dark,readingMode,root}:{pdf:PDFDocumentProxy;page:number;width:number;scale:number;rotation:number;title:string;dark:boolean;readingMode:boolean;root:RefObject<HTMLDivElement|null>}){
 const holder=useRef<HTMLDivElement>(null),canvas=useRef<HTMLCanvasElement>(null);
 const [near,setNear]=useState(false),[aspect,setAspect]=useState(1.414),[loading,setLoading]=useState(true),[error,setError]=useState(false);
 useEffect(()=>{
  const element=holder.current;if(!element)return;
  const observer=new IntersectionObserver(entries=>setNear(entries[0].isIntersecting),{root:root.current,rootMargin:'800px'});
  observer.observe(element);return()=>observer.disconnect();
 },[root]);
 useEffect(()=>{
  if(!near){if(canvas.current){canvas.current.width=0;canvas.current.height=0;canvas.current.style.width='0px';canvas.current.style.height='0px';}return;}
  let cancelled=false,task:ReturnType<Awaited<ReturnType<PDFDocumentProxy['getPage']>>['render']>|undefined;
  setLoading(true);setError(false);
  void pdf.getPage(page).then(async sheet=>{
   if(cancelled||!canvas.current)return;
   const base=sheet.getViewport({scale:1,rotation});
   const viewport=sheet.getViewport({scale:width/base.width*scale,rotation});
   setAspect(viewport.height/viewport.width);
   const element=canvas.current,context=element.getContext('2d');if(!context)throw Error('Canvas unavailable');
   const ratio=Math.min(window.devicePixelRatio||1,2,8192/Math.max(viewport.width,viewport.height),Math.sqrt(16000000/(viewport.width*viewport.height)));
   element.width=Math.floor(viewport.width*ratio);element.height=Math.floor(viewport.height*ratio);
   element.style.width=`${viewport.width}px`;element.style.height=`${viewport.height}px`;
   task=sheet.render({canvas:element,canvasContext:context,viewport,transform:[ratio,0,0,ratio,0,0]});
   await task.promise;if(!cancelled)setLoading(false);
  }).catch(reason=>{if(!cancelled&&reason?.name!=='RenderingCancelledException'){setError(true);setLoading(false);}});
  return()=>{cancelled=true;task?.cancel();};
 },[pdf,page,width,scale,rotation,near]);
 return <div ref={holder} data-pdf-page={page} className="relative mx-auto shrink-0" style={{width:width*scale,minHeight:width*scale*aspect}}>
  {(loading||error)&&<p role="status" className="absolute inset-x-0 top-6 text-center text-xs text-muted-foreground">{error?'This page could not be rendered.':`Loading page ${page}…`}</p>}
  <canvas ref={canvas} aria-label={`${title}, page ${page}`} style={{filter:readingMode?'sepia(0.45) brightness(0.92) contrast(0.92)':dark?'invert(1) grayscale(1)':undefined,mixBlendMode:dark&&!readingMode?'screen':'normal'}} className="block"/>
 </div>;
}
