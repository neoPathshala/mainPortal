import type { PYQSolution } from '@/data/courses-db';
function urls(value:unknown):string[] {
 if(!Array.isArray(value))return [];
 return value.filter((item):item is string=>{if(typeof item!=='string')return false;try{const url=new URL(item);return !url.username&&!url.password&&(url.protocol==='https:'||(url.protocol==='http:'&&['localhost','127.0.0.1'].includes(url.hostname)&&/^\/api\/(?:resource-pdfs|question-images)\/[a-f0-9-]{36}$/.test(url.pathname)));}catch{return false;}}).slice(0,100);
}
export function buildQuestionSolution(q:{id:string;year:number|null;marks:number;title:string;answer:string},subjectSlug:string,metadata:Record<string,unknown>={},chapters:{id:string;number:number;title:string}[]=[]):PYQSolution {
 const text=(key:string)=>typeof metadata[key]==='string'?metadata[key] as string:'';
 const tokens=(typeof metadata.chapters==='string'?metadata.chapters:'').split(/[,;\n]+/).map(value=>value.trim().toLowerCase()).filter(Boolean);
 const matches=chapters.filter(chapter=>tokens.some(value=>value===String(chapter.number)||value===`chapter ${chapter.number}`||value===chapter.title.toLowerCase()));
 const chapter=chapters.find(item=>item.id===metadata.chapterId);const videos=urls(metadata.solutionVideos);const pdfs=urls(metadata.solutionPdfs);
 let youtubeId:string|undefined;
 if(videos[0]){const url=new URL(videos[0]);const candidate=url.hostname==='youtu.be'?url.pathname.slice(1):['youtube.com','www.youtube.com','m.youtube.com'].includes(url.hostname)?url.searchParams.get('v')||url.pathname.match(/^\/(?:embed|shorts)\/([^/]+)/)?.[1]:undefined;if(candidate&&/^[\w-]{11}$/.test(candidate))youtubeId=candidate;}
 return {paperSection:text('paperSection'),id:q.id,subjectSlug,year:q.year||0,marks:q.marks,questionNo:text('questionNo'),examType:['Regular','Back','Model'].includes(text('examType'))?text('examType') as PYQSolution['examType']:'Regular',questionText:text('questionText')||q.title,questionImages:urls(metadata.questionImages),unitIds:matches.length?matches.map(item=>item.number):chapter?[chapter.number]:[],unitId:matches[0]?.number||chapter?.number,unitName:tokens.length?text("chapters"):chapter?`Chapter ${chapter.number}: ${chapter.title}`:'',textSolution:{overview:q.answer,examTips:text('examTips')},videoSolution:videos[0]?{videoUrl:videos[0],youtubeId,title:'Video solution',instructor:'',duration:''}:undefined,solutionVideos:videos,solutionPdfs:pdfs,pdfUrl:pdfs[0],imageSolutions:urls(metadata.solutionImages).map((url,index)=>({id:`${q.id}-image-${index}`,url,caption:`Solution image ${index+1}`})),referenceLinks:urls(metadata.solutionLinks)};
}
