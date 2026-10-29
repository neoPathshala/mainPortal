'use client';
import {useEffect,useState} from 'react';
import {usePathname} from 'next/navigation';
import {Download,Check,Trash2} from 'lucide-react';
import {installedStudyApp,readOfflinePart,saveOfflinePart,removeOfflinePDF} from '@/lib/offline-pdfs';
import {useOfflineAccess} from '@/components/offline-access';

export function useOfflineSection<T>(part:string,items:T[],label:string){
 const path=usePathname(),id=`${path}:${part}`,{enabled}=useOfflineAccess();
 const [online,setOnline]=useState(true),[saved,setSaved]=useState<T[]|null>(null),[installed,setInstalled]=useState(false),[pending,setPending]=useState(false),[message,setMessage]=useState('');
 useEffect(()=>{let stopped=false;setSaved(null);setMessage('');setInstalled(installedStudyApp());const refresh=()=>{setOnline(navigator.onLine);if(enabled&&installedStudyApp())void readOfflinePart<T[]>(id).then(value=>{if(!stopped)setSaved(value);}).catch(()=>{});};refresh();window.addEventListener('online',refresh);window.addEventListener('offline',refresh);return()=>{stopped=true;window.removeEventListener('online',refresh);window.removeEventListener('offline',refresh);};},[id,enabled]);
 async function save(remove=false){setPending(true);setMessage('');try{if(remove){await removeOfflinePDF(`section:${id}`);setSaved(null);}else{await saveOfflinePart(id,items);setSaved(items);}}catch(error){setMessage(error instanceof Error?error.message:'Could not save section.');}finally{setPending(false);}}
 const controls=<div className="my-4 rounded-lg border border-border px-3 py-3"><div className="flex flex-wrap items-center justify-between gap-3"><p className="text-xs leading-5 text-muted-foreground">{!installed?'Install the app to save this section for offline reading.':saved?`${label} saved in this app.`:`Download ${label.toLowerCase()} first for offline reading. Only this section is saved.`}</p>{installed&&enabled&&(saved?<div className="flex items-center gap-2"><span className="flex items-center gap-1 text-xs text-primary"><Check size={14}/>Available offline</span><button aria-label="Remove downloaded section" disabled={pending} onClick={()=>void save(true)} className="rounded-md border border-border p-2"><Trash2 size={14}/></button></div>:<button disabled={pending||!online||!items.length} onClick={()=>void save()} className="inline-flex items-center gap-2 rounded-lg border border-border px-3 py-2 text-xs disabled:opacity-50"><Download size={14}/>{pending?'Downloading…':'Download for offline reading'}</button>)}</div>{message&&<p role="status" className="mt-2 text-xs text-destructive">{message}</p>}{saved&&<p className="mt-2 text-[11px] text-muted-foreground">Question text and written answers are saved. Download attached PDFs separately in their reader; videos require internet.</p>}</div>;
 return {items:enabled&&!online?saved||[]:items,controls:enabled?controls:null};
}
