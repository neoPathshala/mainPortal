import {coursesComingSoon} from '@/lib/course-availability';
import {canReadStudyResources} from '@/lib/study-access.server';
import { assetCDNOrigin } from '@/lib/asset-cdn';
import { getSession } from '@/lib/security/auth';
import { readOfflineSettings } from '@/lib/offline-settings';
import {apiUnavailable} from '@/lib/api-failure.server';
export const dynamic = 'force-dynamic';
export async function GET() {
  let stage='session verification';
  try {
    const session=await getSession();
    stage='stored policy read';const settings=await readOfflineSettings();
    settings.policy.main.browser={desktop:false,mobile:false};
    if(coursesComingSoon||(!session&&!await canReadStudyResources()))for(const mode of ['browser','pwa'] as const)for(const device of ['desktop','mobile'] as const)settings.policy.main[mode][device]=false;
    return Response.json({ ...settings, staticAssetOrigin: assetCDNOrigin(process.env.NEXT_PUBLIC_STATIC_CDN_ORIGIN) || null, scope: session ? `student-${session.user.id}` : 'public', routes: ['/', '/courses', '/resources', '/notices', '/contact', '/feedback', '/support-us', '/privacy-policy', '/terms', '/cookies', '/sitemap', ...(session ? ['/student/profile?tab=details', '/student/profile?tab=security'] : [])] }, { headers: { 'Cache-Control': 'private, no-store' } });
  } catch(error) { return apiUnavailable(error,{path:'/api/offline-policy',stage,title:'Offline access policy unavailable',message:'Offline settings are temporarily unavailable.'}); }
}
