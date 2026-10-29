import type {PYQSolution} from '@/data/courses-db';
export function questionNumber(value:unknown,index:number){
 const number=String(value??'').trim().replace(/[.\s]+$/,'');return `${number||index+1}.`;
}
const text=(value:unknown)=>typeof value==='string'&&value.trim().length>0;
export function questionAnswerAvailability(question:PYQSolution){
 const answer=question.textSolution;
 const video=text(question.videoSolution?.videoUrl)||!!question.solutionVideos?.some(text);
 const available=video||text(answer?.overview)||!!answer?.steps?.some(step=>text(step.content))||text(answer?.diagramOrFormula)||text(answer?.codeSnippet?.code)||text(answer?.examTips)||!!question.imageSolutions?.some(image=>text(image.url))||text(question.pdfUrl)||!!question.solutionPdfs?.some(text)||!!question.referenceLinks?.some(text);
 return {available,video};
}
