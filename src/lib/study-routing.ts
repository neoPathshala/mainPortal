import {chapterMatches} from "./chapter-slug";
export {chapterSegment} from "./chapter-slug";
export function studyLink(event:{button:number;metaKey:boolean;ctrlKey:boolean;shiftKey:boolean;altKey:boolean;preventDefault:()=>void},href:string){
 if(event.button!==0||event.metaKey||event.ctrlKey||event.shiftKey||event.altKey)return;
 event.preventDefault();if(location.pathname+location.search!==href)window.history.pushState(null,'',href);
}

export function validStudySelection(tab:string,selection:string,chapters:{unitNumber:number;title:string;slug?:string;hiddenResourceTypes?:string[]}[],docs:{id:string;type:string;unitId?:number}[],questions:{year:number}[]){
 if(tab==='notes')return chapters.some(chapter=>!chapter.hiddenResourceTypes?.includes('notes')&&chapterMatches(chapter,selection))||docs.some(doc=>doc.type==='notes'&&doc.unitId===undefined&&`note-${doc.id}`===selection);
 return tab==='pyqs'&&questions.some(question=>String(question.year)===selection);
}
