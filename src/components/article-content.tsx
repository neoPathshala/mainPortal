import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import {articleHeadings} from '@/lib/article-content';
export function ArticleContent({content}:{content:string}) {
 const headings=articleHeadings(content);let index=0;
 return <div className="article-content"><ReactMarkdown remarkPlugins={[remarkGfm]} skipHtml components={{
 h2:({children})=><h2 id={headings[index++]?.id}>{children}</h2>, h3:({children})=><h3 id={headings[index++]?.id}>{children}</h3>,
 a:({href,children})=><a href={href} rel="noopener noreferrer">{children}</a>,
 img:({src,alt})=><img src={src} alt={alt||''} loading="lazy" decoding="async"/>,
 table:({children})=><div className="article-table"><table>{children}</table></div>,
 }}>{content}</ReactMarkdown></div>;
}
