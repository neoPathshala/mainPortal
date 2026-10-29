"use client";
import { useCatalog } from "@/components/catalog-provider";
import { semesterLabel } from "@/lib/semester-label";
import { useEffect, useRef, useState } from "react";
import {SignInCard} from "@/components/auth/SignInCard";
import { useRouter } from "next/navigation";
import { CheckCircle2, FileUp, Loader2, Send, X } from "lucide-react";
import { Select } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { useStudentPreferences } from "@/components/student-preferences-provider";


import { compressImageToWebP, formatFileSize } from "@/lib/image-compressor";
import { submitStudentCommunity } from "@/app/community-actions";

const inputClass = "w-full rounded-lg border border-input bg-background px-3.5 py-3 text-sm focus-visible:outline-2 focus-visible:outline-primary";
export function SubmissionForm({ kind, authenticated }: { kind: "asset" | "question"; authenticated: boolean }) {
  const { ACADEMIC_COURSES, getCurriculumSubjects } = useCatalog();
  const preferences = useStudentPreferences();
  const router = useRouter();
  const [course,setCourse] = useState(preferences.courseSlug || "");
  const [semester,setSemester] = useState(preferences.semester ? String(preferences.semester) : "");
  const [subject,setSubject] = useState("");
  const [file,setFile] = useState<File | null>(null);
  const [fileInfo,setFileInfo] = useState("");
  const [processing,setProcessing] = useState(false);
  const [pending,setPending] = useState(false);
  const [error,setError] = useState("");
  const [receipt,setReceipt] = useState("");
  const lock = useRef(false);
  const generation = useRef(0);
  const uploadInput = useRef<HTMLInputElement>(null);
  useEffect(() => { setCourse(preferences.courseSlug || ""); setSemester(preferences.semester ? String(preferences.semester) : ""); setSubject(""); },[preferences.courseSlug,preferences.semester]);
  const subjects = course && semester ? getCurriculumSubjects(course,Number(semester)) : [];
  async function chooseFile(chosen?: File) {
    const current = ++generation.current;
    setFile(null); setFileInfo(""); setError("");
    if (!chosen) return;
    if (chosen.size > 3 * 1024 * 1024 || !["application/pdf","image/jpeg","image/png","image/webp"].includes(chosen.type)) { setError("Choose a PDF, JPG, PNG, or WebP up to 3 MB."); return; }
    setProcessing(true);
    try {
      if (chosen.type.startsWith("image/")) {
        const result = await compressImageToWebP(chosen,{maxWidth:2400,maxHeight:2400,quality:0.86});
        if (current !== generation.current) return;
        const optimized = result.file.size < chosen.size ? result.file : chosen;
        setFile(optimized); setFileInfo(`${formatFileSize(optimized.size)}${optimized.size < chosen.size ? ` · ${Math.round((1 - optimized.size / chosen.size) * 100)}% smaller` : " · ready to upload"}`);
      } else { setFile(chosen); setFileInfo(formatFileSize(chosen.size)); }
    } catch { if (current === generation.current) setError("We couldn’t process this image. Try another file."); }
    finally { if (current === generation.current) setProcessing(false); }
  }
  async function submit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (lock.current || processing || !authenticated) return;
    if (kind === "asset" && !file) { setError("Choose a file to contribute."); return; }
    lock.current = true; setPending(true); setError("");
    const form = event.currentTarget;
    const data = new FormData(form);
    data.set("kind",kind); data.set("course",course); data.set("semester",semester); data.set("subject",subject);
    if (file) data.set("file",file);
    try {
      const result = await submitStudentCommunity(data);
      if (result.error) setError(result.error);
      else if (result.id) { setReceipt(result.id); setFile(null); setFileInfo(""); form.reset(); router.refresh(); }
    } catch { setError("Your submission could not be saved. Check your connection and try again."); }
    finally { lock.current = false; setPending(false); }
  }
  if (receipt) return <section className="rounded-2xl border border-primary/20 bg-card p-8 sm:p-12" aria-live="polite"><CheckCircle2 size={36} strokeWidth={1.5} className="mb-5 text-primary" /><h2 className="text-2xl font-semibold tracking-tight">{kind === "asset" ? "Your contribution is saved." : "Your question is saved."}</h2><p className="mt-3 text-sm leading-7 text-muted-foreground">It has been received privately. {kind === "asset" ? "It has not been published." : "Answers are not available yet."} You can find the receipt in your submission history.</p><p className="mt-5 break-all rounded-lg bg-muted px-4 py-3 font-mono text-xs">Reference: {receipt}</p><Button onClick={() => setReceipt("")} className="mt-6">{kind === "asset" ? "Contribute another asset" : "Ask another question"}</Button></section>;
  return <div className="flex h-full min-h-0 min-w-0 flex-col">{!authenticated&&<SignInCard title={kind==="asset"?"Sign in to contribute resources":"Sign in to ask a question"} description={kind==="asset"?"Sign in to save your contribution and share study resources.":"Sign in to save your question and follow your submissions."}/>}<form onSubmit={submit} className="rounded-2xl border border-border bg-card p-5 sm:p-7"><div className="mb-6 border-b border-border pb-5"><h2 className="text-base font-semibold">{kind === "asset" ? "Share a study resource" : "Write your question"}</h2><p className="mt-2 text-xs leading-6 text-muted-foreground">Add the details below. Your saved course and study period are selected when available.</p></div><fieldset disabled={pending || !authenticated} className="space-y-5 disabled:opacity-60"><p className="eyebrow">01 / Academic context</p><div className="grid gap-5 sm:grid-cols-2"><label className="flex min-w-0 flex-col gap-2.5 text-xs font-medium"><span>Course</span><Select aria-label="Course" value={course} required onChange={e => { setCourse(e.target.value); setSubject(""); }}><option value="" disabled>Select a course</option>{Object.values(ACADEMIC_COURSES).map(c => <option key={c.slug} value={c.slug}>{c.shortName}</option>)}</Select></label><label className="flex min-w-0 flex-col gap-2.5 text-xs font-medium"><span>{ACADEMIC_COURSES[course]?.studySystem==='year'?'Year':'Semester'}</span><Select aria-label="Semester" value={semester} required onChange={e => { setSemester(e.target.value); setSubject(""); }}><option value="" disabled>Select study period</option>{Array.from({length:ACADEMIC_COURSES[course]?.totalSemesters||0},(_,i) => <option key={i} value={i+1}>{semesterLabel(i+1,ACADEMIC_COURSES[course])}</option>)}</Select></label></div><label className="flex min-w-0 flex-col gap-2.5 text-xs font-medium"><span>Subject <span className="font-normal text-muted-foreground">(optional)</span></span><Select aria-label="Subject" value={subject} onChange={e => setSubject(e.target.value)}><option value="">General / course question</option>{subjects.map(s => <option key={s.code} value={s.name}>{s.name}</option>)}</Select></label><div className="border-t border-border pt-5"><p className="eyebrow">02 / {kind === "asset" ? "Resource information" : "Your question"}</p></div><label className="flex min-w-0 flex-col gap-2.5 text-xs font-medium"><span>{kind === "asset" ? "Resource title" : "Your question"}</span><input name="title" required minLength={8} maxLength={140} placeholder={kind === "asset" ? "e.g. Data structures — linked list revision notes" : "e.g. How do I choose between a stack and a queue?"} className={inputClass} /></label><label className="flex min-w-0 flex-col gap-2.5 text-xs font-medium"><span>{kind === "asset" ? "About this resource" : "Add some context"}</span><textarea name="description" required minLength={20} maxLength={5000} rows={6} placeholder={kind === "asset" ? "What does it cover? Include the source, year, and any useful context." : "Explain where you’re stuck and what you have tried so far."} className={`${inputClass} resize-y leading-7`} /></label>{kind === "asset" && <div><label htmlFor="asset-upload" className="mb-2.5 block text-xs font-medium">Upload asset</label><div className="rounded-xl border border-dashed border-border bg-muted/30 p-5"><div className="mb-3 flex items-center gap-3"><FileUp size={23} strokeWidth={1.5} className="text-primary" /><div><p className="text-xs font-medium">PDF or study image</p><p className="mt-1 text-[11px] text-muted-foreground">Up to 3 MB · images compressed automatically</p></div></div><input ref={uploadInput} id="asset-upload" type="file" disabled={processing} accept="application/pdf,image/jpeg,image/png,image/webp" onChange={e => void chooseFile(e.target.files?.[0])} className="w-full text-xs text-muted-foreground file:mr-3 file:rounded-lg file:border-0 file:bg-primary/10 file:px-3 file:py-2 file:text-xs file:font-medium file:text-primary" />{processing && <p className="mt-3 flex items-center gap-2 text-xs text-muted-foreground"><Loader2 size={14} className="animate-spin" />Optimizing image…</p>}{file && <div className="mt-3 flex items-center justify-between gap-2 rounded-lg bg-card p-3"><div className="min-w-0"><p className="truncate text-xs font-medium">{file.name}</p><p className="mt-1 text-[11px] text-muted-foreground">{fileInfo}</p></div><button type="button" aria-label="Remove selected file" onClick={() => { setFile(null); if (uploadInput.current) uploadInput.current.value = ""; }} className="rounded-md p-2 hover:bg-muted"><X size={15} /></button></div>}</div></div>}<label className="flex items-start gap-3 text-xs leading-6 text-muted-foreground"><input type="checkbox" name="consent" required className="mt-1 h-4 w-4 shrink-0 accent-primary" /><span>{kind === "asset" ? "I have permission to share this material and it contains no private student information." : "My question contains no sensitive personal information and follows respectful discussion guidelines."}</span></label><Button type="submit" disabled={pending || processing} className="w-full gap-2 sm:w-auto">{pending ? <Loader2 size={16} className="animate-spin" /> : <Send size={16} />}{pending ? "Saving…" : kind === "asset" ? "Submit contribution" : "Submit question"}</Button></fieldset>{error && <p role="alert" className="mt-4 rounded-lg border border-destructive/20 bg-destructive/5 p-3 text-sm text-destructive">{error}</p>}</form></div>;
}
