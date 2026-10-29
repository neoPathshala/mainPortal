export const validChapterSlug=(value:string)=>value.length<=120&&/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(value)&&!value.startsWith('note-');
export function chapterSegment(chapter:{unitNumber:number;title:string;slug?:string}){
 if(chapter.slug&&validChapterSlug(chapter.slug))return chapter.slug;
 const title=chapter.title.normalize('NFKD').replace(/[\u0300-\u036f]/g,'').toLowerCase().replace(/[^\p{L}\p{N}]+/gu,'-').replace(/^-|-$/g,'');
 return `chapter-${chapter.unitNumber}${title?'-'+title:''}`;
}
export function chapterMatches(chapter:{unitNumber:number;title:string;slug?:string},segment:string){return [chapterSegment(chapter),chapterSegment({...chapter,slug:undefined}),String(chapter.unitNumber),`chapter-${chapter.unitNumber}`].includes(segment);}
