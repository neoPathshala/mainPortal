"use client";

import { Select as PlatformSelect } from "@/components/ui/select";
import Link from "next/link";
import {usePathname} from "next/navigation";
import {chapterMatches} from "@/lib/chapter-slug";
import {chapterSegment,studyLink} from "@/lib/study-routing";
import { useEffect, useState } from "react";
import { ArrowLeft, ArrowRight, FileText, Maximize2 } from "lucide-react";
import type { ChapterResourceBundle, CourseDetail, PDFDocument, PYQSolution } from "@/data/courses-db";
import { AdvancedPDFReader } from "./AdvancedPDFReader";
import { StudyMetadata } from "./StudyMetadata";

export function NotesStudyView({ course, docs, resources, pyqs, onOpenPDF, basePath="" }: { basePath?:string;course?: CourseDetail; docs: PDFDocument[]; resources: ChapterResourceBundle; pyqs: PYQSolution[]; onOpenPDF: (doc: PDFDocument) => void }) {
  const chapters = (course?.units || []).filter(chapter=>!chapter.hiddenResourceTypes?.includes("notes"));
  const pathname=usePathname();
  const segment=basePath&&pathname.startsWith(basePath+'/')?decodeURIComponent(pathname.slice(basePath.length+1)):'';
  const chapter=chapters.find(item=>chapterMatches(item,segment));
  const unitId=segment.startsWith('note-')?undefined:(chapter||chapters[0])?.id;
  const selectChapter=(id:number|undefined)=>{const item=chapters.find(item=>item.id===id);if(item&&basePath)window.history.pushState(null,'',`${basePath}/${encodeURIComponent(chapterSegment(item))}`);};
  useEffect(()=>{if(basePath&&!segment&&chapters[0])window.history.replaceState(null,'',`${basePath}/${encodeURIComponent(chapterSegment(chapters[0]))}`);},[basePath,segment,chapters[0]?.id]);
  const [selectedDoc, setSelectedDoc] = useState<string | null>(null);
  const unit = chapters.find(chapter => chapter.id === unitId);
  const chapterNotes = resources.notes.filter(note => note.unitId === unitId);
  const available: PDFDocument[] = chapterNotes.map(note => ({ ...note, type: "notes" as const }));
  const generalDocs=docs.filter(doc=>doc.type==="notes"&&doc.unitId===undefined);
  const choices = unitId!==undefined ? available : generalDocs;
  const doc = choices.find(item => item.id === (segment.startsWith("note-")?segment.slice(5):selectedDoc)) || choices[0];
  const source = doc?.previewUrl || doc?.downloadUrl || "";
  const index = chapters.findIndex(chapter => chapter.id === unitId);
  const questions = pyqs.filter(question => question.unitId === unitId);
  return <div className="grid items-start gap-6 lg:grid-cols-[260px_minmax(0,1fr)]">
    <aside className="overflow-hidden rounded-xl border border-border bg-card lg:sticky lg:top-36"><h2 className="flex h-14 items-center border-b border-border px-5 text-sm font-semibold">Chapter notes</h2><nav aria-label="Note chapters" className="max-h-[70vh] space-y-1 overflow-y-auto p-2">{generalDocs.map(note=><Link key={note.id} href={`${basePath}/${encodeURIComponent(`note-${note.id}`)}`} onClick={event=>{studyLink(event,`${basePath}/${encodeURIComponent(`note-${note.id}`)}`);setSelectedDoc(note.id);}} aria-current={unitId===undefined&&doc?.id===note.id?"page":undefined} className="block w-full rounded-lg px-3 py-3 text-left text-sm hover:bg-muted">{/^general notes$/i.test(note.title.trim())?"Notes":note.title}</Link>)}{chapters.map(chapter => <Link key={chapter.id} href={`${basePath}/${encodeURIComponent(chapterSegment(chapter))}`} onClick={event=>{studyLink(event,`${basePath}/${encodeURIComponent(chapterSegment(chapter))}`);setSelectedDoc(null);}} aria-current={unitId === chapter.id?"page":undefined} className={`flex w-full items-start gap-3 rounded-lg px-3 py-3 text-left ${unitId === chapter.id ? "bg-primary/10 text-primary" : "text-muted-foreground hover:bg-muted"}`}><FileText className="mt-1 h-4 w-4 shrink-0" /><span className="min-w-0"><span className="block text-sm font-medium leading-5">Chapter {chapter.unitNumber}: {chapter.title}</span><span className="mt-1 block truncate text-xs text-muted-foreground">{chapter.topics.join("; ")}</span>{!!chapter.tags?.length&&<span className="mt-2 flex flex-wrap gap-1">{chapter.tags.map(tag=><span key={tag} className="rounded bg-primary/10 px-1.5 py-0.5 text-[10px] text-primary">{tag}</span>)}</span>}</span></Link>)}</nav></aside>
    <div className="min-w-0 space-y-6">
      <section className="overflow-hidden rounded-xl border border-border bg-card">
        <header className="flex h-14 items-center justify-between gap-3 border-b border-border px-4 py-2"><div className="min-w-0"><h2 className="truncate text-sm font-medium">{unit?.title || doc?.title || "Notes"}</h2></div>{choices.length>1&&<PlatformSelect aria-label="Choose chapter note" value={doc?.id||""} onChange={event=>setSelectedDoc(event.target.value)} className="min-w-0 max-w-44 rounded border border-border bg-card p-1 text-xs">{choices.map(item=><option key={item.id} value={item.id}>{item.title}</option>)}</PlatformSelect>}{doc && <button onClick={() => onOpenPDF(doc)} aria-label="Expand PDF reader" className="shrink-0 rounded-lg p-2 hover:bg-muted"><Maximize2 className="h-4 w-4" /></button>}</header>
        <div className="empty:hidden px-4 [&:has(>span)]:py-2"><StudyMetadata entity={doc ? `note:${doc.id}` : `chapter:${unitId}`} fallbackEntity={`chapter:${unitId}`} /></div>
        {source?<AdvancedPDFReader onExpand={doc?()=>onOpenPDF(doc):undefined} key={source} source={source} title={doc?.title || "Chapter PDF"} className="h-[65vh]"/>:<p className="min-h-72 py-8 text-center text-sm text-muted-foreground">Notes for this chapter have not been uploaded yet.</p>}
        <div className="flex justify-between border-t border-border p-3"><button disabled={index <= 0} onClick={() => { selectChapter(chapters[index - 1]?.id); setSelectedDoc(null); }} className="flex items-center gap-2 rounded-lg px-3 py-2 text-xs hover:bg-muted disabled:opacity-30"><ArrowLeft className="h-3.5 w-3.5" />Previous</button><button disabled={index < 0 || index >= chapters.length - 1} onClick={() => { selectChapter(chapters[index + 1]?.id); setSelectedDoc(null); }} className="flex items-center gap-2 rounded-lg px-3 py-2 text-xs hover:bg-muted disabled:opacity-30">Next<ArrowRight className="h-3.5 w-3.5" /></button></div>
      </section>
      <section className="rounded-xl border border-border bg-card p-5 sm:p-7"><h2 className="text-lg font-semibold">Important questions</h2><p className="mt-1 text-xs text-muted-foreground">{unit?.title}</p><ol className="mt-5 divide-y divide-border">{questions.map((question, position) => <li key={question.id} className="py-4 first:pt-0"><p className="mb-2 text-xs text-muted-foreground">Asked in {question.year} · {question.marks} marks</p><p className="text-sm leading-7">{position + 1}. {question.questionText}</p></li>)}</ol>{!questions.length && <p className="mt-5 text-sm text-muted-foreground">No past questions linked to this chapter yet.</p>}</section>
    </div>
  </div>;
}
