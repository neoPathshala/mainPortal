import {getStudentNotices} from "@/lib/student-notices.server";
import {redirect} from "next/navigation";
import { noticeBannerActive } from "@/lib/platform/notice-expiry";
import { noticesForSemester } from "@/lib/semester-notices";

import { NoticesHubClient, NoticeHubItem } from "./NoticesHubClient";
import { UrgentNoticeTicker } from "@/components/notices/UrgentNoticeTicker";

export const metadata = {
  title: "Notices & Board Examination Routines | neoPathshala",
  description: "Notices, exam schedules, and updates for your registered course.",
  robots: {index:false,follow:false},
};

export const dynamic = "force-dynamic";

export default async function NoticesPage({ searchParams }: { searchParams: Promise<{ semester?: string }> }) {
  const {student,notices}=await getStudentNotices();
  if(!student.authenticated)return <NoticesHubClient locked courseSlug="" initialNotices={[]}/>;
  if(!student.courseSlug)redirect('/student/profile?tab=details&reason=notice-course');
  const params = await searchParams;
  const requested = params.semester;
  const selectedSemester = requested === "all" ? "all" : requested && /^[1-8]$/.test(requested) ? requested : student.semester ? String(student.semester) : "all";

  // Ticker notices
  const tickerNotices = (selectedSemester === "all" ? notices : noticesForSemester(notices, Number(selectedSemester),student.courseSlug)).filter((n) => (n as NoticeHubItem).showInTicker && noticeBannerActive(n as NoticeHubItem)) as NoticeHubItem[];

  return (
    <div className="flex flex-col">
      {tickerNotices.length > 0 && <UrgentNoticeTicker notices={tickerNotices} />}
      <NoticesHubClient courseSlug={student.courseSlug} initialSemester={selectedSemester} initialNotices={notices} />
    </div>
  );
}
