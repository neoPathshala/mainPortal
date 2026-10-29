"use client";
import {useOfflineSection} from "./OfflineSectionControls";
import {questionNumber} from "@/lib/question-display";
import {AnswerAvailability} from "./AnswerAvailability";
import {paperSections,questionSection} from "@/lib/paper-sections";
import {ExamStar} from "../exam-star";
import { semesterLabel } from "@/lib/semester-label";
import {useEffect} from "react";
import Link from "next/link";
import {usePathname,useSearchParams} from "next/navigation";
import {studyLink} from "@/lib/study-routing";
import { FileText } from "lucide-react";
import type { CourseDetail, PYQSolution } from "@/data/courses-db";
import { QuestionImages } from "./QuestionMedia";
import { QuestionAnswer } from "./QuestionAnswer";

export function PastPapersView({ pyqs, subjectName, course,basePath="" }: { basePath?:string;pyqs: PYQSolution[]; subjectName: string; course?: CourseDetail; onOpenPDFViewer: (title: string) => void }) {
  const papers=[...new Map(pyqs.map(question=>[`${question.year}:${question.examType}`,{year:question.year,type:question.examType}])).values()].sort((a,b)=>b.year-a.year||a.type.localeCompare(b.type));
  const pathname=usePathname(),query=useSearchParams();
  const segment=basePath&&pathname.startsWith(basePath+'/')?pathname.slice(basePath.length+1):'';
  const selectedPaper=papers.find(item=>String(item.year)===segment&&(!query.get('exam')||item.type===query.get('exam')))||papers.find(item=>String(item.year)===segment)||papers[0];
  const paper=selectedPaper?`${selectedPaper.year}:${selectedPaper.type}`:'';
  const paperHref=(item:{year:number;type:string})=>`${basePath}/${item.year}?exam=${encodeURIComponent(item.type)}`;
  useEffect(()=>{if(basePath&&!segment&&papers[0])window.history.replaceState(null,'',paperHref(papers[0]));},[basePath,segment,paper]);
  const selected=papers.find(item=>`${item.year}:${item.type}`===paper)||papers[0];const year=selected?.year;
  const current=pyqs.filter(question=>question.year===year&&question.examType===selected?.type);
  const {items:questions,controls}=useOfflineSection(`question-bank:${paper}`,current,`${year||"Selected"} ${selected?.type||"paper"}`);
  const format=course?.paperFormat;
  const header=course?.paperHeaders?.[`${year}:${selected?.type}`]||{};
  const renderQuestion=(question:PYQSolution,index:number)=><li key={question.id} id={`question-${question.id}`} className="scroll-mt-36 py-6">
        {!format&&<div className="mb-3 flex flex-wrap items-center justify-between gap-2 text-xs text-muted-foreground"><span>{question.examType} · {question.unitName}</span><span>{question.marks} marks</span></div>}
        <details id={`answer-${question.id}`} className="group scroll-mt-36"><summary className="flex cursor-pointer list-none items-start gap-3 -mx-2 rounded-lg px-2 py-2 text-base leading-7 transition-colors  outline-none focus-visible:ring-2 focus-visible:ring-primary [&::-webkit-details-marker]:hidden"><span className="font-medium transition-colors group-hover:text-primary">{questionNumber(question.questionNo,index)}</span><span className="min-w-0 flex-1 whitespace-pre-wrap font-semibold transition-colors group-hover:text-primary">{question.questionText}</span><AnswerAvailability question={question}/>{format&&<span className="shrink-0 tabular-nums">[{question.marks}]</span>}</summary><div className="mt-5"><QuestionAnswer question={question}/></div></details>
        <QuestionImages images={question.questionImages?.map((url,index)=>({url,alt:`Question diagram ${index+1}`}))||[]}/>

      </li>;
  return <div className="grid items-start gap-6 lg:grid-cols-[230px_minmax(0,1fr)]">
    <aside className="overflow-hidden rounded-xl border border-border bg-card lg:sticky lg:top-36">
      <h2 className="border-b border-border px-5 py-4 text-sm font-semibold">Exam papers</h2>
      <nav aria-label="Exam papers" className="max-h-[65vh] space-y-1 overflow-y-auto p-2">{papers.map(item => <Link href={paperHref(item)} key={`${item.year}:${item.type}`} aria-current={paper===`${item.year}:${item.type}`?"page":undefined} onClick={event=>studyLink(event,paperHref(item))} className={`flex w-full items-center gap-3 rounded-lg px-3 py-3 text-left text-sm ${paper===`${item.year}:${item.type}` ? "bg-primary/10 font-medium text-primary" : "text-muted-foreground hover:bg-muted"}`}><FileText className="h-4 w-4 shrink-0" />{item.year} BS · {item.type}</Link>)}</nav>
    </aside>
    <article className="min-w-0 rounded-xl border border-border bg-card px-5 py-8 sm:px-10">
      {format?<header className="pb-1 text-center"><h2 className="text-[16px] font-normal">{header.university||course?.universityName||'Tribhuvan University'}</h2><p className="mt-[3px] text-[16px] font-semibold">{header.institute||'Institute of Science and Technology'}</p><p className="mt-[3px] text-[16px] font-normal">{year}</p><ExamStar/><div className="mt-5 grid gap-5 text-left text-base leading-7 sm:grid-cols-[minmax(0,1fr)_auto]"><div><p>{header.academicLine||`Bachelor Level / ${semesterLabel(course?.semester||1,course)} / Science`}</p><p>{header.courseTitle||`${course?.programName||''}${course?.code?` (${course.code})`:''}`}</p><p className="font-semibold">{header.subjectTitle||subjectName}</p></div><div className="sm:text-right"><p>Full Marks: {header.fullMarks||'60'}</p><p>Pass Marks: {header.passMarks||'24'}</p><p>Time: {header.time||'3 Hours'}</p></div></div><div className="mt-5 text-left text-[13px] leading-5">{(header.instructions||'Candidates are required to give their answers in their own words as far as practicable.\nThe figures in the margin indicate full marks.').split("\n").map((line,index)=><p key={index} className={index===0?"italic":undefined}>{line||"\u00a0"}</p>)}</div></header>:<header className="border-b border-border pb-6 text-center">
        <h2 className="text-lg font-semibold">Tribhuvan University</h2><p className="mt-1 text-sm">Institute of Science and Technology</p><p className="mt-3 text-sm font-medium">{year?`${year} BS · ${selected?.type}`:"Past questions"}</p>
        <p className="mt-4 text-xs text-muted-foreground">Bachelor Level{course ? ` / ${semesterLabel(course.semester,course)}` : ""} / Science</p>
        <h3 className="mt-2 text-base font-semibold">{subjectName}{course?.code ? ` (${course.code})` : ""}</h3>
        {course && <div className="mt-5 flex flex-wrap justify-center gap-x-6 gap-y-2 text-xs text-muted-foreground"><span>Theory: {course.fullMarks.theory} marks</span><span>Practical: {course.fullMarks.practical} marks</span><span>Pass marks: {course.fullMarks.passMarks}</span></div>}
      </header>}
      {controls}
      {!questions.length && <p className="py-10 text-center text-sm text-muted-foreground">No past questions available yet.</p>}
      {format?<>{paperSections.filter(section=>questions.some(question=>questionSection(question)===section.id)).map(section=><section key={section.id} className="pb-6 pt-3"><h3 className="text-center text-[15px] font-semibold underline underline-offset-4">Section {section.id}</h3>{format==='bit'&&<p className="mt-2 text-center text-sm font-medium">{section.kind}</p>}<div className="mt-4 flex flex-wrap items-center justify-between gap-3 text-base"><p className={section.id==='A'?'font-semibold':undefined}>{section.instruction}</p><p className="font-semibold tabular-nums">{section.formula}</p></div><ol className="divide-y divide-border">{questions.filter(question=>questionSection(question)===section.id).map((question,index)=>renderQuestion(question,section.id==='B'?index+3:index))}</ol></section>)}{questions.some(question=>!questionSection(question))&&<section className="border-t border-border py-6"><h3 className="text-sm font-semibold">Additional questions</h3><ol>{questions.filter(question=>!questionSection(question)).map(renderQuestion)}</ol></section>}</>:<ol className="divide-y divide-border">{questions.map(renderQuestion)}</ol>}

    </article>
  </div>;
}
