import {ArrowUpRight,BookOpen,Terminal} from 'lucide-react';
import {codingCompanion,neoCodeBaseLinks} from '@/lib/neocodebase';

/** External links keep each platform's sessions and code execution independent. */
export function NeoCodeBaseCard({subjectName,subjectSlug}: {subjectName?:string;subjectSlug?:string}) {
  const contextual=subjectName!==undefined;
  const companion=contextual?codingCompanion(subjectName,subjectSlug||''):null;
  if(contextual&&!companion)return null;
  return <aside aria-label={companion?'MySQL learning and practice':'Learn coding with neoCodeBase'} className="my-7 overflow-hidden rounded-2xl border border-border bg-card">
    <div className="grid gap-7 p-6 sm:p-8 lg:grid-cols-[1fr_auto] lg:items-center">
      <div><div className="flex items-start gap-4"><svg role="img" aria-label="neoCodeBase logo" viewBox="0 0 32 32" width={49} height={49} className="size-[49px] shrink-0 rounded-xl"><rect width="32" height="32" rx="9" fill="hsl(var(--primary))"/><path d="M8 22l5-6 5 3 6-8" fill="none" stroke="hsl(var(--primary-foreground))" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round"/><circle cx="24" cy="11" r="2.6" fill="hsl(var(--primary-foreground))"/></svg><div><p className="mb-2 text-[10px] font-semibold uppercase tracking-[.18em] text-primary">neoCodeBase · by neoPathshala</p><h2 className="text-xl font-semibold tracking-tight">{companion?.title||'Your bachelor’s journey. Now with coding.'}</h2></div></div><p className="mt-3 max-w-xl text-sm leading-6 text-muted-foreground">{companion?'Read MySQL lessons alongside your notes, then explore the playgrounds to practise what you learn.':'Build your coding skills alongside your degree. Explore practical courses, runnable examples, and playgrounds on our coding platform.'}</p></div>
      <div className="flex flex-wrap gap-3 lg:flex-col">
        <a href={companion?.courseURL||neoCodeBaseLinks.courses} target="_blank" rel="noopener noreferrer" className="inline-flex items-center justify-center gap-2 rounded-lg bg-primary px-4 py-3 text-xs font-medium text-primary-foreground"><BookOpen size={15}/>{companion?'Read MySQL':'Explore coding courses'}<ArrowUpRight size={14}/></a>
        <a href={neoCodeBaseLinks.playground} target="_blank" rel="noopener noreferrer" className="inline-flex items-center justify-center gap-2 rounded-lg border border-border px-4 py-3 text-xs font-medium hover:bg-muted"><Terminal size={15}/>Open playground<ArrowUpRight size={14}/></a>
      </div>
    </div>
  </aside>;
}
