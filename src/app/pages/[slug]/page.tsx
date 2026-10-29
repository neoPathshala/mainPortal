import {redirect} from 'next/navigation';
import {ManagedSitePage} from '@/components/managed-site-page';
import {sitePageMetadata} from '@/lib/site-pages.server';
import {builtInPage,sitePagePath} from '@/lib/site-pages';
export const dynamic='force-dynamic';
export async function generateMetadata({params}:{params:Promise<{slug:string}>}){return sitePageMetadata((await params).slug);}
export default async function Page({params}:{params:Promise<{slug:string}>}){const {slug}=await params;if(builtInPage(slug))redirect(sitePagePath(slug));return <ManagedSitePage slug={slug}/>;}
