/** Shared period metadata; existing semester integers remain stable storage keys. */
export type StudySystem='semester'|'year';
export const courseStructureKey=(id:string)=>`course-structure:${id}`;
export const subjectPlacementPrefix='subject-placement:';
export const subjectPlacementKey=(courseId:string,period:number,subjectId:string)=>`${subjectPlacementPrefix}${courseId}:${period}:${subjectId}`;
export function studySystem(value:unknown):StudySystem{return typeof value==='string'&&value.toLowerCase()==='year'?'year':'semester';}
export function periodName(value?:{studySystem?:StudySystem}|StudySystem,plural=false){const mode=typeof value==='string'?value:value?.studySystem;return (mode==='year'?'year':'semester')+(plural?'s':'');}
export function periodSlug(number:number,value?:{studySystem?:StudySystem}|StudySystem){return `${periodName(value)==='year'?'year':'sem'}-${number}`;}
export function periodLabel(number:number,value?:{studySystem?:StudySystem}|StudySystem){const last=number%100,suffix=last>=11&&last<=13?'th':({1:'st',2:'nd',3:'rd'}[number%10]||'th');return `${number}${suffix} ${periodName(value)==='year'?'Year':'Semester'}`;}
export type SubjectPlacement={version:1;courseId:string;subjectId:string;period:number};
export function parseSubjectPlacement(value:unknown):SubjectPlacement|null{
 if(!value||typeof value!=='object'||Array.isArray(value))return null;
 const v=value as Record<string,unknown>;
 if(v.version!==1||typeof v.courseId!=='string'||typeof v.subjectId!=='string'||![v.courseId,v.subjectId].every(id=>/^[a-zA-Z0-9_-]{1,100}$/.test(id))||!Number.isInteger(v.period)||Number(v.period)<1||Number(v.period)>8)return null;
 return {version:1,courseId:v.courseId,subjectId:v.subjectId,period:Number(v.period)};
}
