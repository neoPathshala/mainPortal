import {parentUniversity,resourceCourse} from "@/lib/resource-selection";
import {courseUnavailable} from '@/lib/course-availability.server';
import {coursesComingSoon} from '@/lib/course-availability';
import {redirect as redirectUnavailableCourse} from 'next/navigation';
import { getNavigationCatalog } from "@/lib/catalog.server";
import { getSubjectCardStats } from "@/lib/subject-card-stats.server";
import {ResourcePlaceholders} from "./ResourcePlaceholders";
import { savedElectives } from "@/lib/security/elective-preferences";
import { getSession } from "@/lib/security/auth";

import { Suspense } from "react";
import { Metadata } from "next";
import { PinnedNoticeBanner } from "@/components/notices/PinnedNoticeBanner";
import { ResourcesClient } from "./ResourcesClient";

export const metadata: Metadata = {
  title: "Notes, Past Questions and Resources | neoPathshala Academic Portal",
  description:
    "Explore Tribhuvan University undergraduate course subjects, chapter lecture notes, TU board past question papers, and solutions for B.Sc. CSIT, BCA, BIT, BIM, BBM, BBA, and IOE.",
  keywords: [
    "TU CSIT notes",
    "BSc CSIT past questions",
    "TU BCA notes",
    "TU BIT syllabus",
    "Tribhuvan University study resources",
    "neoPathshala resources",
  ],
  alternates: {
    canonical: "/resources",
  },
};

interface ResourcesPageProps {
  searchParams: Promise<{
    university?: string;
    faculty?: string;
    course?: string;
    semester?: string;
  }>;
}

export default async function ResourcesPage({ searchParams }: ResourcesPageProps) {
 const auth=await getSession().catch(()=>null);
 if(!auth)return <ResourcePlaceholders locked/>;
 if(coursesComingSoon)redirectUnavailableCourse('/courses');
  const { resolveStudentCourse, ACADEMIC_COURSES, UNIVERSITIES } = await getNavigationCatalog();
  const params = await searchParams;

  const accountId=auth.user.id;
  const savedCourse=resolveStudentCourse(auth.user.bio||"")?.slug;
  const savedSemester=auth.user.semester||undefined;
  const selectedCourse=resourceCourse(Object.values(ACADEMIC_COURSES),params.faculty||params.course||"csit",savedCourse);
  const faculty=selectedCourse?.slug||"csit";
  if(await courseUnavailable(faculty))redirectUnavailableCourse('/courses');
  const university=parentUniversity(selectedCourse,UNIVERSITIES)?.id||"";
  const semNum = params.semester ? parseInt(params.semester, 10) : savedSemester || 1;

  const selectedElectives = accountId ? await savedElectives(accountId, resolveStudentCourse(faculty)?.slug || "csit", Number.isNaN(semNum) ? 1 : semNum) : [];

  const studyStats = await getSubjectCardStats();
  return (
    <>
    <PinnedNoticeBanner />
    <Suspense
      fallback={<ResourcePlaceholders />}
    >
      <ResourcesClient
        studyStats={studyStats}
        selectedElectives={selectedElectives}
        hasAccountPreferences={!!savedCourse}
        initialUniversity={university}
        initialFaculty={faculty}
        initialSemester={isNaN(semNum) ? 1 : semNum}
      />
    </Suspense>
    </>
  );
}
