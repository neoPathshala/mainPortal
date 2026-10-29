"use client";
import {useOfflineSection} from "./OfflineSectionControls";
import {questionNumber} from "@/lib/question-display";
import {AnswerAvailability} from "./AnswerAvailability";
import { useState } from "react";
import { BookOpen } from "lucide-react";
import type { CourseDetail, PYQSolution } from "@/data/courses-db";
import { QuestionImages } from "./QuestionMedia";
import { QuestionAnswer } from "./QuestionAnswer";
import { StudyMetadata } from "./StudyMetadata";

export function ImportantQuestionsView({ course, questions }: { course?: CourseDetail; questions: PYQSolution[] }) {
  const chapters = course?.units.map(unit => ({ id: unit.id, title: unit.title })) || [...new Map(questions.map(question => [question.unitId || 0, { id: question.unitId || 0, title: question.unitName || "General questions" }])).values()];
  if(questions.some(question=>!question.unitId&&!question.unitIds?.length)&&!chapters.some(chapter=>chapter.id===0))chapters.push({id:0,title:"General questions"});
  const [selected, setSelected] = useState(chapters[0]?.id);
  const chapter = chapters.find(item => item.id === selected);
  const current = questions.filter(question => (question.unitId || 0) === selected || !!question.unitIds?.includes(selected || 0));
  const {items:list,controls}=useOfflineSection(`important:chapter:${selected}`,current,chapter?.title||"This chapter");
  return <div className="grid items-start gap-6 lg:grid-cols-[260px_minmax(0,1fr)]">
    <aside className="overflow-hidden rounded-xl border border-border bg-card lg:sticky lg:top-36"><h2 className="border-b border-border p-4 text-sm font-semibold">Chapters</h2><nav aria-label="Important question chapters" className="max-h-[65vh] space-y-1 overflow-y-auto p-2">{chapters.map((item, index) => <button key={item.id} onClick={() => setSelected(item.id)} aria-pressed={selected === item.id} className={`flex w-full items-start gap-3 rounded-lg p-3 text-left text-sm ${selected === item.id ? "bg-primary/10 text-primary" : "text-muted-foreground hover:bg-muted"}`}><span className="text-xs leading-5">{index+1}.</span><span>{item.title}</span></button>)}</nav></aside>
    <section className="min-w-0 rounded-xl border border-border bg-card p-5 sm:p-7"><p className="text-xs text-muted-foreground">Important Questions Bank</p><h2 className="mt-2 text-xl font-semibold">{chapter?.title || "Important questions"}</h2><StudyMetadata entity={`chapter:${selected}`} />{controls}<div className="mt-5 divide-y divide-border">{list.map((question, index) => <details key={question.id} id={`question-${question.id}`} className="group scroll-mt-36 py-5"><summary className="flex cursor-pointer list-none items-start gap-3 -mx-2 rounded-lg px-2 py-2 text-sm leading-7 transition-colors  focus-visible:outline focus-visible:outline-2 focus-visible:outline-primary [&::-webkit-details-marker]:hidden"><span className="font-medium transition-colors group-hover:text-primary">{questionNumber(question.questionNo,index)}</span><span className="min-w-0 flex-1"><span className="block font-semibold transition-colors group-hover:text-primary">{question.questionText}</span><StudyMetadata entity={`question:${question.id}`} /></span><AnswerAvailability question={question}/></summary><div className="mt-5 space-y-5"><QuestionImages images={question.questionImages?.map((url,index)=>({url,alt:`Question diagram ${index+1}`}))||[]}/><QuestionAnswer question={question} /></div></details>)}</div>{!list.length && <div className="py-12 text-center text-sm text-muted-foreground"><BookOpen className="mx-auto mb-3 h-6 w-6" />No questions added for this chapter yet.</div>}</section>
  </div>;
}
