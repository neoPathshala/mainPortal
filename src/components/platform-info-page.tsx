import Link from 'next/link';
import {notFound} from 'next/navigation';
import {ArrowUpRight,BookOpen,Code2,Heart,Users} from 'lucide-react';
import {readSitePage} from '@/lib/site-pages.server';
import {ArticleContent} from './article-content';

/** Team profiles use one Markdown H2 per person, so the existing page editor owns all content. */
export async function PlatformInfoPage({slug}: {slug:'about'|'our-team'}) {
  const page=await readSitePage(slug);
  if(!page||page.status!=='PUBLISHED')notFound();
  const team=slug==='our-team';
  const [introduction,...sections]=page.body.split(/^## /m);
  const icons=[BookOpen,Heart,Users,Code2];
  return <main className="mx-auto max-w-6xl px-5 py-12 sm:px-8 sm:py-20">
    <nav className="mb-12 flex items-center gap-2 text-xs text-muted-foreground" aria-label="Breadcrumb"><Link href="/">Home</Link><span>/</span><span>{page.title}</span></nav>
    <header className="grid gap-8 border-b border-border pb-12 md:grid-cols-[1fr_240px] md:items-end">
      <div><p className="mb-5 text-xs font-semibold uppercase tracking-[.2em] text-primary">{team?'People behind the platform':'Learn. Explore your space.'}</p><h1 className="text-4xl font-semibold tracking-tight sm:text-5xl">{page.title}</h1><p className="mt-5 max-w-xl text-base leading-7 text-muted-foreground">{page.description}</p></div>
      <div className="flex items-center gap-3 text-sm text-primary"><span className="rounded-2xl bg-primary/10 p-4">{team?<Users size={28} strokeWidth={1.4}/>:<BookOpen size={28} strokeWidth={1.4}/>}</span><span>Built with care.<br/><span className="text-muted-foreground">Made for learners.</span></span></div>
    </header>
    <div className="my-10 max-w-3xl"><ArticleContent content={introduction}/></div>
    {!!sections.length&&<div className="grid gap-5 md:grid-cols-2">{sections.map((section,index)=>{const newline=section.indexOf('\n');const title=newline<0?section:section.slice(0,newline);const content=newline<0?'':section.slice(newline+1);const Icon=icons[index%icons.length];return <section key={index} className="rounded-2xl border border-border bg-card p-6 sm:p-8"><Icon className="mb-6 text-primary" size={24} strokeWidth={1.5}/><h2 className="mb-4 text-xl font-semibold tracking-tight">{title}</h2><ArticleContent content={content}/></section>;})}</div>}
    <footer className="mt-12 flex flex-wrap items-center justify-between gap-4 border-t border-border pt-7 text-sm"><p className="text-muted-foreground">Help us build a better learning experience.</p><Link href="/contact" className="inline-flex items-center gap-2 font-medium text-primary">Let’s talk<ArrowUpRight size={16}/></Link></footer>
  </main>;
}
