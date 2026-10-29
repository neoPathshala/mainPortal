import type {PYQSolution} from '@/data/courses-db';
import {questionAnswerAvailability} from '@/lib/question-display';
export function AnswerAvailability({question}:{question:PYQSolution}){
 const {available,video}=questionAnswerAvailability(question);
 const iconClass="size-4";
 return <span className="inline-flex h-7 shrink-0 items-center gap-2">
  <span title={available?'Answer available':'Answer not available'} className={available?'text-emerald-600 dark:text-emerald-400':'text-red-600 dark:text-red-400'}>
   <svg aria-hidden="true" className={iconClass} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="9"/>{available?<path d="m8 12 2.5 2.5L16 9"/>:<path d="m9 9 6 6m0-6-6 6"/>}</svg>
   <span className="sr-only">{available?'Answer available':'Answer not available'}</span>
  </span>
  {video&&<span title="Video answer available" className="text-emerald-600 dark:text-emerald-400"><svg aria-hidden="true" className={iconClass} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="9"/><path d="m10 8 6 4-6 4Z"/></svg><span className="sr-only">Video answer available</span></span>}
 </span>;
}
