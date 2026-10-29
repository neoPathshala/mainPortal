import {z} from 'zod';
import {safeSyllabusLink} from './syllabus-link';

export const MAX_SYLLABUS_BYTES=256*1024;
export type SyllabusNode={type:string;text?:string;attrs?:Record<string,unknown>;marks?:{type:string;attrs?:Record<string,unknown>}[];content?:SyllabusNode[]};
export type SyllabusDocument={type:'doc';content:SyllabusNode[]};
export type SyllabusRecord={version:1;status:'DRAFT'|'PUBLISHED'|'ARCHIVED';document:SyllabusDocument};
export const syllabusKey=(subjectId:string)=>`subject-syllabus:${subjectId}`;

const mark=z.discriminatedUnion('type',[
 z.object({type:z.enum(['bold','italic','underline','strike','code'])}).strict(),
 z.object({type:z.literal('link'),attrs:z.object({href:z.string().refine(safeSyllabusLink,'Use an HTTPS link or an internal page path.')})}).strict(),
]);
const children=()=>z.array(node).max(1000);
const cellAttrs=z.object({colspan:z.number().int().min(1).max(12).default(1),rowspan:z.number().int().min(1).max(100).default(1),colwidth:z.array(z.number().int().min(1).max(2000)).max(12).nullable().optional(),align:z.enum(['left','center','right','justify']).nullable().optional()}).strict();
const node:z.ZodType<SyllabusNode>=z.lazy(()=>z.discriminatedUnion('type',[
 z.object({type:z.literal('text'),text:z.string().min(1).max(100000),marks:z.array(mark).max(6).optional()}).strict(),
 z.object({type:z.literal('hardBreak'),marks:z.array(mark).max(6).optional()}).strict(),
 z.object({type:z.literal('horizontalRule')}).strict(),
 z.object({type:z.literal('paragraph'),content:children().optional()}).strict(),
 z.object({type:z.literal('heading'),attrs:z.object({level:z.number().int().min(1).max(3)}).strict(),content:children().optional()}).strict(),
 z.object({type:z.literal('bulletList'),content:children().min(1)}).strict(),
 z.object({type:z.literal('orderedList'),attrs:z.object({start:z.number().int().min(1).max(10000),type:z.string().max(10).nullable().optional()}).strict().optional(),content:children().min(1)}).strict(),
 z.object({type:z.literal('listItem'),content:children().min(1)}).strict(),
 z.object({type:z.literal('blockquote'),content:children().min(1)}).strict(),
 z.object({type:z.literal('table'),content:children().min(1).max(100)}).strict(),
 z.object({type:z.literal('tableRow'),content:children().min(1).max(12)}).strict(),
 z.object({type:z.literal('tableCell'),attrs:cellAttrs.optional(),content:children().min(1)}).strict(),
 z.object({type:z.literal('tableHeader'),attrs:cellAttrs.optional(),content:children().min(1)}).strict(),
]).superRefine((value,ctx)=>{
 const block=['paragraph','heading','bulletList','orderedList','blockquote','horizontalRule'];
 const allowed=value.type==='paragraph'||value.type==='heading'?['text','hardBreak']:value.type==='bulletList'||value.type==='orderedList'?['listItem']:value.type==='table'?['tableRow']:value.type==='tableRow'?['tableCell','tableHeader']:block;
 if('content' in value&&value.content?.some(child=>!allowed.includes(child.type)))ctx.addIssue({code:'custom',message:'Invalid syllabus structure.'});
 if(value.type==='listItem'&&value.content?.[0]?.type!=='paragraph')ctx.addIssue({code:'custom',message:'A list item must begin with a paragraph.'});
}));
const documentSchema=z.object({type:z.literal('doc'),content:z.array(node).min(1).max(1000)}).strict().superRefine((value,ctx)=>{
 if(value.content.some(child=>!['paragraph','heading','bulletList','orderedList','blockquote','horizontalRule','table'].includes(child.type)))ctx.addIssue({code:'custom',message:'Invalid syllabus document.'});
});
const recordSchema=z.object({version:z.literal(1),status:z.enum(['DRAFT','PUBLISHED','ARCHIVED']),document:documentSchema}).strict();

export function syllabusText(document:SyllabusDocument):string{
 const text=(item:SyllabusNode):string=>item.type==='text'?item.text||'':(item.content||[]).map(text).join(item.type==='paragraph'||item.type==='heading'?'':' ');
 return document.content.map(text).join('\n');
}
export function validateSyllabus(value:unknown):SyllabusRecord{
 // Bound the input before recursive schema validation and React rendering.
 const bytes=JSON.stringify(value);
 if(!bytes||new TextEncoder().encode(bytes).length>MAX_SYLLABUS_BYTES)throw new Error('Syllabus is too large. Use up to 100,000 characters.');
 const candidate=value as {document?:{content?:unknown[]}};
 const pending=(Array.isArray(candidate?.document?.content)?candidate.document.content:[]).map(value=>({value,depth:1}));let count=0,characters=0;
 while(pending.length){const {value:current,depth}=pending.pop()!;if(++count>4000||depth>12)throw new Error('Syllabus has too many nested sections.');if(current&&typeof current==='object'){const item=current as SyllabusNode;characters+=typeof item.text==='string'?item.text.length:0;if(characters>100000)throw new Error('Syllabus is too large. Use up to 100,000 characters.');if(Array.isArray(item.content))for(const value of item.content)pending.push({value,depth:depth+1});}}
 const parsed=recordSchema.safeParse(value);
 if(!parsed.success)throw new Error('Check the syllabus formatting and use HTTPS links.');
 if(parsed.data.status==='PUBLISHED'&&!syllabusText(parsed.data.document).trim())throw new Error('Add syllabus text before publishing.');
 return parsed.data;
}
export function parseSyllabus(value:unknown):SyllabusRecord|null{try{return validateSyllabus(value);}catch{return null;}}
export function publishedSyllabus(value:unknown):SyllabusDocument|undefined{const record=parseSyllabus(value);return record?.status==='PUBLISHED'?record.document:undefined;}

export function createSyllabusTemplate(subject:{code:string;creditHours:number;semesterId?:number|null;lectureHours?:number;description?:string|null},chapters:{number:number;title:string;hours:number;topics:string[]}[]=[]):SyllabusDocument{
 const p=(text=''):SyllabusNode=>({type:'paragraph',...(text?{content:[{type:'text',text}]}:{})});
 const h=(text:string,level=2):SyllabusNode=>({type:'heading',attrs:{level},content:[{type:'text',text}]});
 const table=(labels:string[],values:string[]):SyllabusNode=>({type:'table',content:[{type:'tableRow',content:labels.map(label=>({type:'tableHeader',content:[p(label)]}))},{type:'tableRow',content:values.map(value=>({type:'tableCell',content:[p(value)]}))}]});
 return {type:'doc',content:[
  table(['Course code','Credit hours','Semester','Lecture hours'],[subject.code,String(subject.creditHours),String(subject.semesterId||1),subject.lectureHours?`${subject.lectureHours} hours`:'']),
  table(['Course description','Course objectives'],[subject.description||'','']),
  h('Course contents'),
  ...(chapters.length?chapters.flatMap(chapter=>[h(`${chapter.number}. ${chapter.title}${chapter.hours?` · ${chapter.hours} hours`:''}`,3),p(chapter.topics.join(', '))]):[h('Unit 1',3),p()]),
  h('Laboratory works'),p(),h('Books'),h('Textbooks',3),p(),h('Reference books',3),p(),
 ]};
}
