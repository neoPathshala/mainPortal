"use client";
import {useLayoutEffect,useRef,type RefObject} from 'react';

/** Animate between the measured inline and viewport bounds without affecting layout. */
export function useMaximizeTransition(ref:RefObject<HTMLElement|null>,expanded:boolean){
 const previous=useRef<DOMRect|null>(null);
 const animation=useRef<Animation|null>(null);
 const prepare=()=>{previous.current=ref.current?.getBoundingClientRect()||null;};
 useLayoutEffect(()=>{
  const element=ref.current,from=previous.current;
  previous.current=null;animation.current?.cancel();
  if(!element||!from||!element.animate||matchMedia('(prefers-reduced-motion: reduce)').matches)return;
  const to=element.getBoundingClientRect();if(!to.width||!to.height)return;
  animation.current=element.animate([
   {transformOrigin:'top left',transform:`translate(${from.left-to.left}px, ${from.top-to.top}px) scale(${from.width/to.width}, ${from.height/to.height})`,borderRadius:'16px'},
   {transformOrigin:'top left',transform:'none',borderRadius:expanded?'0px':'16px'},
  ],{duration:280,easing:'cubic-bezier(0.22, 1, 0.36, 1)'});
  return()=>animation.current?.cancel();
 },[expanded,ref]);
 return prepare;
}
