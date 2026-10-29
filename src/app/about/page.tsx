import {PlatformInfoPage} from '@/components/platform-info-page';
import {sitePageMetadata} from '@/lib/site-pages.server';
export const dynamic='force-dynamic';
export async function generateMetadata(){return sitePageMetadata('about');}
export default function Page(){return <PlatformInfoPage slug="about"/>;}
