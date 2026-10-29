"use client";
import {useEffect,useState,useRef} from 'react';
export function ErrorReference({status,reference,error}:{status:404|500;reference?:string;error?:Error}){
 const [id,setId]=useState(reference||'');const generated=useRef('');
 useEffect(()=>{if(!navigator.onLine)return;const ref=reference||generated.current||crypto.randomUUID();generated.current=ref;setId(ref);const key=`error-report:${status}:${location.pathname}:${ref}`;try{if(sessionStorage.getItem(key))return;sessionStorage.setItem(key,'1');}catch{}
 void fetch('/api/error-reports',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({status,path:location.pathname,reference:ref,message:error?.message,stack:error?.stack?.slice(0,8000)}),keepalive:true}).then(async response=>{if(response.ok){const result=await response.json();if(result.reference)setId(result.reference);}}).catch(()=>{});
 },[status,reference,error]);
 return id?<p className="mt-5 break-all text-xs text-muted-foreground">Reference: {id}</p>:null;
}
