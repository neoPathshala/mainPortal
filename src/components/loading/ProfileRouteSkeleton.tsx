"use client";

import { Suspense } from "react";
import { useSearchParams } from "next/navigation";
import { ProfileSkeleton } from "./PageSkeletons";

function ProfileLoadingContent() {
  const search = useSearchParams();
  return <ProfileSkeleton tab={search.get("tab") || "overview"} />;
}
export default function ProfileRouteSkeleton() {
  return <Suspense fallback={<ProfileSkeleton />}><ProfileLoadingContent /></Suspense>;
}
