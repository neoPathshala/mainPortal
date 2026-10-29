export type PaperFormat='bit'|'csit';
export function coursePaperFormat(course:{slug?:string;shortName?:string}):PaperFormat|undefined{
 const slug=(course.slug||'').toLowerCase();const name=(course.shortName||'').toLowerCase().replace(/[^a-z0-9]/g,'');
 if(['bit','bachelor-of-information-technology'].includes(slug)||name==='bit')return 'bit';
 if(['csit','bsc-csit','bscsit'].includes(slug)||['csit','bscsit','bsccsit'].includes(name))return 'csit';
}
export function questionSection(question:{paperSection?:unknown;marks?:unknown}):'A'|'B'|undefined{
 if(question.paperSection==='A'||question.paperSection==='B')return question.paperSection;
 if(Number(question.marks)===10)return 'A';if(Number(question.marks)===5)return 'B';
}
export const paperSections=[{id:'A',title:'SECTION A',kind:'Long Answer Questions',instruction:'Attempt any TWO questions.',formula:'[ 2 × 10 = 20 ]',count:3},{id:'B',title:'SECTION B',kind:'Short Answer Questions',instruction:'Attempt any EIGHT questions.',formula:'[ 8 × 5 = 40 ]',count:9}] as const;
