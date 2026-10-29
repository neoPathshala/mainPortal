"use client";
import {useEffect} from 'react';

/** One passive listener also covers dialogs and dynamically mounted scroll areas. */
export function ScrollbarVisibility(){
 useEffect(()=>{
  const timers=new Map<Element,ReturnType<typeof setTimeout>>();
  const onScroll=(event:Event)=>{
   const target=event.target===document?document.scrollingElement:event.target;
   if(!(target instanceof Element))return;
   const previous=timers.get(target);if(previous)clearTimeout(previous);
   target.setAttribute('data-scrolling','true');
   timers.set(target,setTimeout(()=>{target.removeAttribute('data-scrolling');timers.delete(target);},900));
  };
  document.addEventListener('scroll',onScroll,{capture:true,passive:true});
  return()=>{document.removeEventListener('scroll',onScroll,true);for(const [element,timer] of timers){clearTimeout(timer);element.removeAttribute('data-scrolling');}};
 },[]);
 return null;
}
