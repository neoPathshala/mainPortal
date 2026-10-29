import type {StudySystem} from "./academic-structure";
export function semesterLabel(number:number,system?:{studySystem?:StudySystem}|StudySystem){
 const mode=typeof system==='string'?system:system?.studySystem;
 const last=number%100,suffix=last>=11&&last<=13?'th':({1:'st',2:'nd',3:'rd'}[number%10]||'th');
 return `${number}${suffix} ${mode==='year'?'Year':'Semester'}`;
}
