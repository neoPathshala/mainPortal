import {PlatformInfoPage} from '@/components/platform-info-page';
import {sitePageMetadata} from '@/lib/site-pages.server';
export const dynamic='force-dynamic';
export async function generateMetadata(){return sitePageMetadata('our-team');}
export default function Page(){return <PlatformInfoPage slug="our-team"/>;}
