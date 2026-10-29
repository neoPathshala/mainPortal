"use client";
import { Suspense } from "react";
import { usePathname, useSearchParams } from "next/navigation";
import { SupportSkeleton, FeedbackSkeleton, PolicySkeleton, SitemapSkeleton, HomeSkeleton, CatalogSkeleton, CourseSkeleton, SemesterSkeleton, ResourcesSkeleton, NoticesSkeleton, ContactSkeleton, AuthSkeleton, SubmissionSkeleton, ArticlesSkeleton, ArticleSkeleton, SubscriptionsSkeleton, ProSkeleton, CheckoutSkeleton, OrderSkeleton } from "./PageSkeletons";
import { ProfileSkeleton } from "./ProfileSkeletons";
import { SubjectSkeleton } from "./StudySkeletons";
import { normalizeStudyTab } from "@/lib/study-tabs";
import { Skeleton } from "./LoadingSkeleton";
import { SemesterResourcesLoading } from "./SemesterResourcesLoading";

import { InfoSkeleton, PasswordSkeleton, TwoFactorSkeleton } from "./AdditionalSkeletons";

function CurrentRouteSkeleton() {
  const pathname = usePathname();
  const search = useSearchParams();
  const segments = pathname.split("/").filter(Boolean);
  if (["/about","/our-team"].includes(pathname)) return <InfoSkeleton/>;
  if (pathname.startsWith("/pages/")) return <PolicySkeleton/>;
  if (pathname === "/account/password") return <PasswordSkeleton/>;
  if (pathname === "/two-factor") return <TwoFactorSkeleton/>;
  if (pathname === "/support-us") return <SupportSkeleton />;
  if (pathname === "/feedback") return <FeedbackSkeleton />;
  if (pathname === "/") return <HomeSkeleton />;
  if (["/privacy-policy", "/terms", "/cookies"].includes(pathname)) return <PolicySkeleton />;
  if (pathname === "/sitemap") return <SitemapSkeleton />;
  if (pathname === "/resources") return <ResourcesSkeleton />;
  if (pathname === "/notices") return <NoticesSkeleton />;
  if (["/contact", "/contact-us"].includes(pathname)) return <ContactSkeleton />;
  if (["/login", "/register"].includes(pathname)) return <AuthSkeleton register={pathname === "/register"} />;
  if (["/ask-question", "/ask-questions", "/contribute", "/contribute-assets"].includes(pathname)) return <SubmissionSkeleton asset={pathname.startsWith("/contribute")} />;
  if (pathname === "/student" || pathname.startsWith("/student/profile")) return <ProfileSkeleton tab={search.get("tab") || "overview"} />;
  if (pathname === "/articles") return <ArticlesSkeleton />;
  if (pathname.startsWith("/articles/")) return <ArticleSkeleton />;
  if (pathname === "/subscriptions") return <SubscriptionsSkeleton />;
  if (pathname === "/pro") return <ProSkeleton />;
  if (pathname === "/checkout") return <CheckoutSkeleton />;
  if (pathname.startsWith("/order/")) return <OrderSkeleton />;
  if (["/entrance", "/online-exams"].includes(pathname)) return null;
  if (pathname.startsWith("/subject/")) return <SubjectSkeleton tab={normalizeStudyTab(search.get("tab"))} />;
  if (pathname.startsWith("/semester/")) return <SemesterSkeleton legacy />;
  if (segments[0] === "courses") segments.shift();
  if (!segments.length) return <CatalogSkeleton />;
  if (segments.length === 1) return <CourseSkeleton />;
  if (/^(?:sem|semester)-[1-8]$/.test(segments[1])) return segments.length === 2 ? <SemesterResourcesLoading /> : <SubjectSkeleton tab={normalizeStudyTab(segments[3] || search.get("tab"))} />;
  return <div role="status" aria-label="Loading page" data-route-loading className="page-shell"><Skeleton className="mx-auto h-40 w-64 max-w-full" /></div>;
}
export default function RouteSkeleton() {
  return <Suspense fallback={null}><CurrentRouteSkeleton /></Suspense>;
}
