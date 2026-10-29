import {ManagedSitePage} from '@/components/managed-site-page';
import {sitePageMetadata} from '@/lib/site-pages.server';
export const dynamic='force-dynamic';
export async function generateMetadata(){return sitePageMetadata('terms');}
export default function Page(){return <ManagedSitePage slug="terms"/>;}
