import {Fragment,type ReactNode} from 'react';
import {safeSyllabusLink} from '@/lib/syllabus-link';
import type {SyllabusDocument,SyllabusNode} from '@/lib/syllabus';

function renderNode(node:SyllabusNode,key:number):ReactNode{
 const children=node.content?.map(renderNode);
 switch(node.type){
  case 'text':return <Fragment key={key}>{(node.marks||[]).reduce<ReactNode>((text,mark)=>{
   if(mark.type==='bold')return <strong>{text}</strong>;
   if(mark.type==='italic')return <em>{text}</em>;
   if(mark.type==='underline')return <u>{text}</u>;
   if(mark.type==='strike')return <s>{text}</s>;
   if(mark.type==='code')return <code>{text}</code>;
   if(mark.type==='link'&&safeSyllabusLink(mark.attrs?.href))return <a href={mark.attrs.href} target={mark.attrs.href.startsWith('https:')?'_blank':undefined} rel="noopener noreferrer">{text}</a>;
   return text;
  },node.text||'')}</Fragment>;
  case 'paragraph':return <p key={key}>{children?.length?children:<br/>}</p>;
  case 'heading':return node.attrs?.level===1?<h1 key={key}>{children}</h1>:node.attrs?.level===2?<h2 key={key}>{children}</h2>:<h3 key={key}>{children}</h3>;
  case 'bulletList':return <ul key={key}>{children}</ul>;
  case 'orderedList':return <ol key={key} start={typeof node.attrs?.start==='number'?node.attrs.start:1}>{children}</ol>;
  case 'listItem':return <li key={key}>{children}</li>;
  case 'blockquote':return <blockquote key={key}>{children}</blockquote>;
  case 'hardBreak':return <br key={key}/>;
  case 'horizontalRule':return <hr key={key}/>;
  case 'table':return <div key={key} className="syllabus-table"><table><tbody>{children}</tbody></table></div>;
  case 'tableRow':return <tr key={key}>{children}</tr>;
  case 'tableCell':case 'tableHeader':{
   const Tag=node.type==='tableHeader'?'th':'td';
   return <Tag key={key} colSpan={typeof node.attrs?.colspan==='number'?Math.min(12,Math.max(1,node.attrs.colspan)):1} rowSpan={typeof node.attrs?.rowspan==='number'?Math.min(100,Math.max(1,node.attrs.rowspan)):1}>{children}</Tag>;
  }
  default:return null;
 }
}
/** Render validated data as React elements; stored HTML and arbitrary attributes are never executed. */
export function SyllabusContent({document}:{document:SyllabusDocument}){
 return <div className="syllabus-content">{document.content.map(renderNode)}</div>;
}
