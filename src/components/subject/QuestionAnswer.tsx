"use client";
import {questionAnswerAvailability} from "@/lib/question-display";
import type { PYQSolution } from "@/data/courses-db";
import { QuestionImages, QuestionVideo } from "./QuestionMedia";
import { AdvancedPDFReader } from "./AdvancedPDFReader";

export function QuestionAnswer({ question }: { question: PYQSolution }) {
  const answer = question.textSolution;
  const video = question.videoSolution;
  const videoUrl = video?.videoUrl?.trim();
  const pdfUrl = question.pdfUrl?.trim();
  return <div className="space-y-5 border-l-2 border-primary/25 pl-4 text-sm leading-7 sm:pl-5">
    {(question.solutionVideos?.length?question.solutionVideos:videoUrl?[videoUrl]:[]).map((url,index)=><QuestionVideo key={url} url={url} title={`Video solution ${index+1}`}/>)}
    {answer?.overview && <p className="whitespace-pre-wrap text-muted-foreground">{answer.overview}</p>}
    {answer?.steps?.map((step, index) => <div key={index}><h4 className="font-medium">{step.title}</h4><p className="mt-1 whitespace-pre-wrap text-muted-foreground">{step.content}</p></div>)}
    {answer?.diagramOrFormula && <pre className="overflow-x-auto rounded-lg bg-muted p-4 text-xs leading-6">{answer.diagramOrFormula}</pre>}
    {answer?.codeSnippet?.code && <div><pre className="overflow-x-auto rounded-lg bg-muted p-4 text-xs leading-6"><code>{answer.codeSnippet.code}</code></pre>{answer.codeSnippet.explanation && <p className="mt-3 whitespace-pre-wrap text-muted-foreground">{answer.codeSnippet.explanation}</p>}</div>}
    <QuestionImages images={question.imageSolutions?.map(image=>({url:image.url,alt:image.caption}))||[]}/>
    {pdfUrl && <div className="overflow-hidden rounded-xl border border-border"><AdvancedPDFReader source={pdfUrl} title={`${question.questionNo} — solution PDF`} className="h-[65vh]" /></div>}
    {question.solutionPdfs?.slice(1).map((url,index)=><div key={url} className="overflow-hidden rounded-xl border border-border"><AdvancedPDFReader source={url} title={`Solution PDF ${index+2}`} className="h-[65vh]"/></div>)}
    {answer?.examTips&&<aside className="rounded-lg bg-primary/5 p-4"><h4 className="font-medium">Exam tips & marking guidance</h4><p className="mt-1 whitespace-pre-wrap text-muted-foreground">{answer.examTips}</p></aside>}
    {question.referenceLinks?.length?<div><h4 className="font-medium">References</h4>{question.referenceLinks.map((url,index)=><a key={url} href={url} target="_blank" rel="noopener noreferrer" className="block break-all text-primary underline">Reference {index+1}</a>)}</div>:null}
    {!questionAnswerAvailability(question).available && <p className="text-muted-foreground">An answer has not been uploaded yet.</p>}
  </div>;
}
