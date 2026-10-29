export type SemesterSummaryOverride={subjectCount:number;creditHours:number};
type Subject={isElective?:boolean;creditHours?:number;electiveGroup?:string|null};
export const semesterSummaryKey=(course:string,semester:number)=>`semester-summary:${course}:${semester}`;
export function parseSemesterSummary(value:unknown):SemesterSummaryOverride|null{
 if(!value||typeof value!=='object')return null;
 const {subjectCount,creditHours}=value as SemesterSummaryOverride;
 return Number.isInteger(subjectCount)&&subjectCount>=1&&subjectCount<=40&&Number.isInteger(creditHours)&&creditHours>=0&&creditHours<=120?{subjectCount,creditHours}:null;
}
/** One elective per group counts toward the study load, not every elective option. */
export function semesterSummary(course:string,semester:number,subjects:Subject[],override?:SemesterSummaryOverride|null){
 const core=subjects.filter(subject=>!subject.isElective),groups=new Map<string,number>();
 for(const subject of subjects.filter(subject=>subject.isElective)){const group=subject.electiveGroup||'Elective';if(!groups.has(group))groups.set(group,subject.creditHours||3);}
 const csitFifth=['csit','bsc-csit','bsc.csit'].includes(course.toLowerCase())&&semester===5;
 const subjectCount=override?.subjectCount??(csitFifth?6:core.length+groups.size);
 const creditHours=override?.creditHours??(csitFifth?18:core.reduce((sum,subject)=>sum+(subject.creditHours||0),0)+[...groups.values()].reduce((sum,credits)=>sum+credits,0));
 return {subjectCount,creditHours,coreCount:csitFifth&&core.length===0?5:core.length,electiveCount:Math.max(0,subjectCount-(core.length|| (csitFifth?5:0)))};
}
