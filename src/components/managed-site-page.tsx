import {notFound} from 'next/navigation';
import Link from 'next/link';
import {readSitePage} from '@/lib/site-pages.server';
import {builtInPage,builtInPages,sitePagePath} from '@/lib/site-pages';
import {formatBSDate} from '@/lib/nepali-date';
import {ArticleContent} from './article-content';
export async function ManagedSitePage({slug}:{slug:string}){const page=await readSitePage(slug);if(!page||page.status!=='PUBLISHED')notFound();return <article className="mx-auto max-w-4xl px-5 py-12 sm:py-16"><nav aria-label="Breadcrumb" className="mb-8 text-xs text-muted-foreground"><Link href="/">Home</Link><span className="mx-2">/</span>{page.title}</nav><header className="mb-9 border-b border-border pb-7"><h1 className="text-3xl font-semibold tracking-tight">{page.title}</h1>{page.updatedAt&&<p className="mt-4 text-xs text-muted-foreground">Updated {formatBSDate(page.updatedAt)}</p>}</header><ArticleContent content={page.body}/>{builtInPage(slug)&&<nav aria-label="Policy pages" className="mt-10 flex flex-wrap gap-5 border-t border-border pt-6 text-xs text-muted-foreground">{builtInPages.map(item=><Link key={item.slug} href={sitePagePath(item.slug)}>{item.title}</Link>)}</nav>}</article>;}
