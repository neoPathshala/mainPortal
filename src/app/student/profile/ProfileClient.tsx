"use client";
import {periodName} from "@/lib/academic-structure";
import {defaultAuthPolicy,type AuthPolicy} from "@/lib/security/auth-policy";
import {TwoFactorSettings} from "@/components/two-factor-settings";
import { useCatalog } from "@/components/catalog-provider";
import { RELEASE_FEATURES } from "@/lib/release-features";
import { formatBSDateTime } from "@/lib/nepali-date";
import { RecentAccountActivity } from "./RecentAccountActivity";
import { PWA_DEVICE_PREFIX } from "@/lib/session-device";
import { electiveSelectionError } from "@/lib/elective-policy";

import { semesterLabel } from "@/lib/semester-label";
import { DeleteAccount } from "./DeleteAccount";
import { ProfileDashboardShell } from "./ProfileDashboardShell";


import { Select } from "@/components/ui/select";
import dynamic from "next/dynamic";
import { ProfileTabSkeleton } from "@/components/loading/ProfileSkeletons";
const SemesterNotices = dynamic(() => import("./SemesterNotices").then(module => module.SemesterNotices), { loading: () => <ProfileTabSkeleton tab="notices" /> });
import type { SemesterNotice } from "@/lib/semester-notices";
const ProfileOverview = dynamic(() => import("./ProfileOverview").then(module => module.ProfileOverview), { loading: () => <ProfileTabSkeleton tab="overview" /> });
import { useEffect, useState, useTransition } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { ArrowRight, Check, Mail, LayoutDashboard, Monitor, ShieldCheck, ShoppingBag, Smartphone, User } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { updateMyProfileAction, revokeSessionAction, signOutAction } from "@/app/actions";
import { ProfilePhotoEditor } from "@/components/auth/ProfilePhoto";
import { cn } from "@/lib/utils";

import { SupportHistory, type SupportHistoryData } from "./SupportHistory";

type Profile = { electives: string[]; avatarUrl: string | null; name: string; email: string; phone: string; course: string; semester: number | null; joined: string; lastLogin: string | null };
type Session = { id: string; device: string; createdAt: string; lastActive: string; expiresAt: string };
type Activity = { id: string; action: string; details: string; createdAt: string };
const date = (value: string) => formatBSDateTime(value);
const tabs = [{ id: "overview", label: "Dashboard", icon: LayoutDashboard }, { id: "details", label: "Profile settings", icon: User }, { id: "security", label: "Sign-in & security", icon: ShieldCheck }, { id: "orders", label: "Membership & orders", icon: ShoppingBag }];
export function ProfileClient({ authPolicy=defaultAuthPolicy(), profile, sessions, currentSessionId, activity, notices, activityPagination, supportHistory, supportUnavailable }: { authPolicy?:AuthPolicy; supportHistory: SupportHistoryData; supportUnavailable: boolean; activityPagination: { page: number; totalPages: number; total: number }; notices: SemesterNotice[]; profile: Profile; sessions: Session[]; currentSessionId: string; activity: Activity[] }) {
  const { electiveSubjects, ACADEMIC_COURSES, resolveStudentCourse, studentResourceHref } = useCatalog();
  const params = useSearchParams();
  const tab = [...tabs.filter(item => item.id !== "orders" || RELEASE_FEATURES.subscriptions), { id: "notices" }].some((item) => item.id === params.get("tab")) ? params.get("tab")! : "overview";
  const router = useRouter();
  const [avatarUrl, setAvatarUrl] = useState(profile.avatarUrl);
  const [name, setName] = useState(profile.name);
  const [phone, setPhone] = useState(profile.phone);
  const [course, setCourse] = useState(resolveStudentCourse(profile.course)?.slug || "");
  const [semester, setSemester] = useState<number | null>(profile.semester);
  const [electives, setElectives] = useState<string[]>(profile.electives);
  useEffect(() => { setElectives(profile.electives); }, [profile.electives]);
  const availableElectives = semester && course ? electiveSubjects(course, semester) : [];
  const [message, setMessage] = useState("");
  const [success, setSuccess] = useState(false);
  const [pending, startTransition] = useTransition();
  const [confirmAll, setConfirmAll] = useState(false);
  function save(event: React.FormEvent) {
    event.preventDefault(); setMessage("");
    const electiveError = electiveSelectionError(course, semester, electives, availableElectives);
    if (electiveError) { setSuccess(false); setMessage(electiveError); document.getElementById("profile-electives")?.focus(); return; }
    startTransition(async () => { try { const result = await updateMyProfileAction({ name, phone, course, semester, electives }); setSuccess(result.success); setMessage(result.message); if (result.success) {
      try {
        localStorage.setItem("neopathshala_selected_university", "tribhuwan-university");
        localStorage.setItem("neopathshala_selected_course", course === "csit" ? "csit" : course);
        if (semester !== null) { localStorage.setItem("neopathshala_selected_semester", String(semester)); localStorage.setItem("neopathshala_user_semester", String(semester)); }
        else { localStorage.removeItem("neopathshala_selected_semester"); localStorage.removeItem("neopathshala_user_semester"); }
      } catch {}
      router.refresh();
    } } catch { setSuccess(false); setMessage("Unable to save your changes. Try again."); } });
  }
  function logout(all = false) {
    setMessage("");
    startTransition(async () => { try { const result = await signOutAction(all); if (result.success) { navigator.serviceWorker?.controller?.postMessage({type:"OFFLINE_CLEAR"}); try { ["neopathshala_user_name", "neopathshala_user_email", "neopathshala_user_phone", "neopathshala_user_course", "neopathshala_user_orders"].forEach((key) => localStorage.removeItem(key)); } catch {} router.replace("/login"); router.refresh(); } else { setSuccess(false); setMessage("Unable to sign out. Please try again."); } } catch { setSuccess(false); setMessage("Unable to sign out. Please try again."); } });
  }
  const field = "h-11 w-full rounded-lg border border-input bg-background px-3 text-sm";
  return <ProfileDashboardShell courseSlug={resolveStudentCourse(profile.course)?.slug} tab={tab} name={profile.name} email={profile.email} avatarUrl={avatarUrl} studyHref={studentResourceHref(profile.course, profile.semester)} semester={profile.semester} pending={pending} onSignOut={() => logout()}><div className="min-w-0 space-y-6">{message && <p role="status" className={cn("rounded-lg border p-3 text-sm", success ? "border-primary/20 bg-primary/5 text-primary" : "border-destructive/20 bg-destructive/5 text-destructive")}>{message}</p>}
    {tab === "overview" && <ProfileOverview profile={profile} avatarUrl={avatarUrl} sessions={sessions} currentSessionId={currentSessionId} activity={activity} notices={notices} />}
    {tab === "notices" && <SemesterNotices courseSlug={resolveStudentCourse(profile.course)?.slug} notices={notices} semester={profile.semester} />}
    {tab === "details" && <><Card><CardContent className="p-6 sm:p-8"><div className="mb-7 border-b border-border pb-6"><h2 className="text-lg font-semibold tracking-tight">Personal details</h2><p className="mt-2 text-sm text-muted-foreground">Keep your student profile up to date.</p></div><ProfilePhotoEditor url={avatarUrl} name={profile.name} onSaved={(url) => { setAvatarUrl(url); router.refresh(); }} /><form onSubmit={save} className="space-y-6"><div className="grid gap-5 sm:grid-cols-2"><div><label htmlFor="profile-name" className="mb-2 block text-xs font-medium">Full name</label><input id="profile-name" autoComplete="name" required maxLength={100} className={field} value={name} onChange={(event) => setName(event.target.value)} /></div><div><label htmlFor="profile-phone" className="mb-2 block text-xs font-medium">Phone <span className="text-muted-foreground">(optional)</span></label><input id="profile-phone" autoComplete="tel" type="tel" maxLength={25} className={field} value={phone} onChange={(event) => setPhone(event.target.value)} placeholder="+977" /></div></div><div><label htmlFor="profile-email" className="mb-2 block text-xs font-medium">Email address</label><div className="flex flex-wrap items-center gap-3 rounded-lg border border-border bg-muted/40 px-3 py-3"><Mail size={16} className="text-muted-foreground" /><span className="min-w-0 break-all text-sm">{profile.email}</span><span className="ml-auto flex items-center gap-1 text-xs text-primary"><Check size={13} />Verified at sign-in</span></div><p className="mt-2 text-xs text-muted-foreground">Your verified email identifies this account and cannot be edited here.</p></div><div><label htmlFor="profile-course" className="mb-2 block text-xs font-medium">Course & university</label><Select id="profile-course" required value={course} onChange={(event) => { setCourse(event.target.value); setSemester(null); setElectives([]); }}><option value="">Choose your course</option>{Object.values(ACADEMIC_COURSES).map((item) => <option key={item.slug} value={item.slug}>{item.shortName} — {item.name}</option>)}</Select></div><div><label htmlFor="profile-semester" className="mb-2 block text-xs font-medium">Current {periodName(ACADEMIC_COURSES[course])}</label><Select id="profile-semester" value={semester === null ? "" : String(semester)} onChange={(event) => { setSemester(event.target.value ? Number(event.target.value) : null); setElectives([]); }}><option value="">Select your semester</option>{Array.from({ length: resolveStudentCourse(course)?.totalSemesters || 8 }, (_, index) => index + 1).map((number) => <option key={number} value={String(number)}>{semesterLabel(number,ACADEMIC_COURSES[course])}</option>)}</Select><p className="mt-2 text-xs leading-6 text-muted-foreground">Your notice board includes this semester’s announcements and notices for all semesters. Save your changes to apply.</p></div>{availableElectives.length > 0 && <fieldset id="profile-electives" tabIndex={-1} className="space-y-4 rounded-lg focus:outline-none focus-visible:ring-2 focus-visible:ring-primary"><legend className="text-xs font-medium">Elective subjects</legend><p className="text-xs text-muted-foreground">Choose one subject from each elective group shown below.</p>{Array.from(new Set(availableElectives.map(subject => subject.electiveGroup || "Elective"))).map(group => <fieldset key={group}><legend className="mb-2 text-xs font-medium">{group}</legend><div className="grid gap-2 sm:grid-cols-2">{availableElectives.filter(subject => (subject.electiveGroup || "Elective") === group).map(subject => <label key={subject.slug} className={cn("flex cursor-pointer items-center gap-3 rounded-lg border p-3 text-xs", electives.includes(subject.slug) ? "border-primary/40 bg-primary/5" : "border-border")}><input type="radio" name={`elective-${group}`} required className="h-4 w-4 accent-primary" checked={electives.includes(subject.slug)} onChange={() => { const groupSlugs = availableElectives.filter(item => (item.electiveGroup || "Elective") === group).map(item => item.slug); setElectives(current => [...current.filter(slug => !groupSlugs.includes(slug)), subject.slug]); }} /><span>{subject.name}</span></label>)}</div></fieldset>)}</fieldset>}<div className="flex flex-wrap items-center justify-between gap-3 border-t border-border pt-5"><p className="text-xs text-muted-foreground">Only you can update these details.</p><Button type="submit" disabled={pending}>{pending ? "Saving…" : "Save changes"}</Button></div></form></CardContent></Card><SupportHistory history={supportHistory} unavailable={supportUnavailable} /><DeleteAccount email={profile.email} /></>}
    {tab === "security" && <><Card><CardContent className="p-6 sm:p-8"><TwoFactorSettings/></CardContent></Card><Card><CardContent className="p-6 sm:p-8"><div className="mb-6 flex items-start gap-4"><span className="rounded-xl bg-primary/10 p-3 text-primary"><ShieldCheck size={22} /></span><div><h2 className="text-lg font-semibold tracking-tight">Sign-in & security</h2>{authPolicy.passwordLogin&&authPolicy.passwordReset&&<Link href="/login?mode=password-setup" className="mt-2 inline-block text-sm text-primary underline">Set or reset your password</Link>}<p className="mt-2 text-sm leading-6 text-muted-foreground">Use the sign-in methods enabled for your account. Keep your verification codes, passwords and recovery codes private.</p></div></div><div className="grid gap-4 border-t border-border pt-5 text-sm sm:grid-cols-2"><div><p className="text-xs text-muted-foreground">Sign-in method</p><p className="mt-2 font-medium">{[authPolicy.otpLogin?"Email code":"",authPolicy.passwordLogin?"Password":""].filter(Boolean).join(" or ")}</p></div><div><p className="text-xs text-muted-foreground">Latest verified sign-in</p><p className="mt-2 font-medium">{profile.lastLogin ? date(profile.lastLogin) : "Not available"}</p></div></div></CardContent></Card><Card><CardContent className="p-6 sm:p-8"><div className="mb-5 flex items-center justify-between"><h2 className="text-lg font-semibold">Your devices</h2><span className="text-xs text-muted-foreground">{sessions.length} active</span></div><div className="divide-y divide-border">{sessions.map((item) => <div key={item.id} className="flex flex-wrap items-center gap-3 py-5">{item.device.startsWith(PWA_DEVICE_PREFIX) ? <Smartphone size={20} className="text-muted-foreground" /> : <Monitor size={20} className="text-muted-foreground" />}<div className="min-w-0 flex-1"><p className="text-sm font-medium">{item.device}{item.id === currentSessionId && <span className="ml-2 text-xs text-primary">This device</span>}</p><p className="mt-1 text-xs leading-5 text-muted-foreground">Signed in {date(item.createdAt)} · Last account activity {date(item.lastActive)}</p></div><Button variant="outline" size="sm" disabled={pending} onClick={() => { if (item.id === currentSessionId) { logout(); return; } startTransition(async () => { try { const result = await revokeSessionAction(item.id); setSuccess(result.success); setMessage(result.success ? "Device signed out." : "Could not sign out this device."); router.refresh(); } catch { setSuccess(false); setMessage("Unable to sign out this device."); } }); }}>Sign out</Button></div>)}</div><div className="border-t border-border pt-5">{confirmAll ? <div className="space-y-3"><p className="text-sm">Sign out every device, including this one?</p><div className="flex gap-2"><Button variant="destructive" disabled={pending} onClick={() => logout(true)}>Sign out everywhere</Button><Button variant="ghost" onClick={() => setConfirmAll(false)}>Cancel</Button></div></div> : <Button variant="outline" onClick={() => setConfirmAll(true)}>Sign out all devices</Button>}</div></CardContent></Card><RecentAccountActivity activity={activity} pagination={activityPagination} /></>}
    {RELEASE_FEATURES.subscriptions && tab === "orders" && <Card><CardContent className="p-6 sm:p-8"><p className="eyebrow mb-3">Membership & orders</p><h2 className="text-xl font-semibold">Keep your learning moving.</h2><p className="mt-3 max-w-lg text-sm leading-7 text-muted-foreground">Your free study resources are always available. Browse Pro plans to see additional materials.</p><div className="my-8 rounded-xl border border-dashed border-border p-7 text-center"><ShoppingBag size={25} className="mx-auto mb-3 text-muted-foreground" /><h3 className="text-sm font-medium">Verified order history is not connected yet</h3><p className="mx-auto mt-2 max-w-sm text-xs leading-6 text-muted-foreground">Browser payment drafts are not proof of purchase. Confirmed orders and memberships will appear when server payment verification is available.</p></div><Button asChild variant="outline"><Link href="/pro">Browse Pro plans<ArrowRight size={15} className="ml-3" /></Link></Button></CardContent></Card>}
  </div></ProfileDashboardShell>;
}
