import {HomepageBanners} from '@/components/home/HomepageBanners';
import {getHomepageBanners} from '@/lib/homepage-banners.server';
import {getStudentNotices} from "@/lib/student-notices.server";
import { noticeBannerActive } from "@/lib/platform/notice-expiry";
import { UrgentNoticeTicker } from "@/components/notices/UrgentNoticeTicker";
import { StudyDashboard } from "@/components/home/StudyDashboard";

export const revalidate = 60;

export default async function HomePage() {
  const [notices,banners]=await Promise.all([getStudentNotices().then(feed=>feed.notices).catch(()=>[]),getHomepageBanners().catch(()=>[])]);

  const tickerNotices = notices.filter(notice => notice.showInTicker && noticeBannerActive(notice));
  return <>{tickerNotices.length > 0 && <UrgentNoticeTicker notices={tickerNotices} />}<HomepageBanners banners={banners}/><StudyDashboard banners={banners}/></>;
}
