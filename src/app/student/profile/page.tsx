import {getAuthPolicy} from "@/lib/security/auth-settings";
import { getPublishedNotices } from "@/lib/notices.server";
import { getNavigationCatalog } from "@/lib/catalog.server";
import { listSupportReceipts } from "@/lib/community-storage";
import { supportHistory } from "@/lib/platform/community/schema";
import { activityPagination } from "@/lib/activity-pagination";

import { accountActivityMessage } from "@/lib/account-activity";
import { savedElectives } from "@/lib/security/elective-preferences";
import { noticesForSemester } from "@/lib/semester-notices";
import Link from "next/link";
import { redirect } from "next/navigation";
import { db } from "@/lib/db";
import { getSession } from "@/lib/security/auth";
import { ProfileClient } from "./ProfileClient";
import { Button } from "@/components/ui/button";

export const dynamic = "force-dynamic";
export default async function StudentProfilePage({ searchParams }: { searchParams: Promise<{ tab?: string; activityPage?: string; supportPage?: string }> }) {
  const { resolveStudentCourse } = await getNavigationCatalog();
  const params = await searchParams;
  let auth;
  try { auth = await getSession(); } catch {
    return <section className="mx-auto max-w-lg px-6 py-24"><p className="eyebrow mb-4">Account temporarily unavailable</p><h1 className="text-3xl font-semibold tracking-tight">We couldn’t load your account.</h1><p className="mt-4 text-sm leading-6 text-muted-foreground">Your account service is unavailable. Please try again later.</p><Button asChild variant="outline" className="mt-6"><Link href="/">Back to your study space</Link></Button></section>;
  }
  if (!auth) redirect("/login");
  const { user, session } = auth;
  const authPolicy=await getAuthPolicy();
  let support = supportHistory([],user.id), supportUnavailable = false;
  try { support = supportHistory(await listSupportReceipts(),user.id,params.supportPage); } catch { supportUnavailable = true; }
  const activityWhere = { userId: user.id, action: { startsWith: "academic." } };
  const [sessions, activityTotal] = await Promise.all([
    db.academicSession.findMany({ where: { userId: user.id, expiresAt: { gt: new Date() } }, orderBy: { createdAt: "desc" }, select: { id: true, device: true, createdAt: true, lastActive: true, expiresAt: true } }),
    db.superAdminAuditLog.count({ where: activityWhere }),
  ]);
  const activityPage = activityPagination(params.tab === "security" ? params.activityPage : undefined, activityTotal);
  const activity = await db.superAdminAuditLog.findMany({ where: activityWhere, orderBy: [{ createdAt: "desc" }, { id: "desc" }], skip: activityPage.skip, take: activityPage.take, select: { id: true, action: true, details: true, createdAt: true } });
  const selectedCourse = resolveStudentCourse(user.bio || "");
  const electives = selectedCourse && user.semester ? await savedElectives(user.id, selectedCourse.slug, user.semester) : [];
  const notices=noticesForSemester(await getPublishedNotices().catch(()=>[]),user.semester,selectedCourse?.slug);
  return <ProfileClient authPolicy={authPolicy} supportHistory={support} supportUnavailable={supportUnavailable} activityPagination={activityPage} notices={notices} profile={{ electives, avatarUrl: user.avatarUrl, name: user.name, email: user.email, phone: user.phone || "", course: user.bio || "", semester: user.semester, joined: user.createdAt.toISOString(), lastLogin: user.lastLoginAt?.toISOString() || null }} currentSessionId={session.id} sessions={sessions.map((item) => ({ ...item, createdAt: item.createdAt.toISOString(), lastActive: item.lastActive.toISOString(), expiresAt: item.expiresAt.toISOString() }))} activity={activity.map((item) => ({ ...item, details: accountActivityMessage(item.action, item.details), createdAt: item.createdAt.toISOString() }))} />;
}
