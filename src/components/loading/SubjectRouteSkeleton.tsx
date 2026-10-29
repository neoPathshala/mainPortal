"use client";
import { normalizeStudyTab } from "@/lib/study-tabs";
import { Suspense } from "react";
import { useParams, useSearchParams } from "next/navigation";
import { SubjectSkeleton } from "./StudySkeletons";
function SubjectLoadingContent() {
  const params = useParams<{ tab?: string }>();
  const search = useSearchParams();
  const tab = normalizeStudyTab(params.tab || search.get("tab"));
  return <SubjectSkeleton tab={tab} />;
}
export default function SubjectRouteSkeleton() {
  return <Suspense fallback={<SubjectSkeleton />}><SubjectLoadingContent /></Suspense>;
}
