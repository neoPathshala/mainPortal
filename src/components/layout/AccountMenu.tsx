"use client";

import { isReleasedLink } from "@/lib/release-features";
import { useEffect, useId, useRef, useState, useTransition } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { BookOpen, ChevronDown, CreditCard, Loader2, LogOut, Settings2, ShieldCheck, UserRound } from "lucide-react";
import { ProfileAvatar } from "@/components/auth/ProfileAvatar";
import { Button } from "@/components/ui/button";
import { useStudentPreferences } from "@/components/student-preferences-provider";
import { signOutAction } from "@/app/actions";

export type AccountSummary = { name: string; email: string; avatarUrl: string | null };
const links = [
  { label: "View profile", detail: "Your student account", href: "/student/profile", icon: UserRound },
  { label: "Profile settings", detail: "Photo and personal details", href: "/student/profile?tab=details", icon: Settings2 },
  { label: "Sign-in & security", detail: "Devices and account activity", href: "/student/profile?tab=security", icon: ShieldCheck },
  { label: "Subscriptions", detail: "Explore plans and membership", href: "/subscriptions", icon: CreditCard },
].filter(item => isReleasedLink(item.href));

export function AccountMenu({ account }: { account: AccountSummary | null }) {
  const preferences = useStudentPreferences();
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState("");
  const container = useRef<HTMLDivElement>(null);
  const trigger = useRef<HTMLButtonElement>(null);
  const menu = useRef<HTMLDivElement>(null);
  const startAtEnd = useRef(false);
  const id = useId();
  useEffect(() => {
    if (!open) return;
    const items = menu.current?.querySelectorAll<HTMLElement>('[role="menuitem"]:not(:disabled)');
    (startAtEnd.current ? items?.[items.length - 1] : items?.[0])?.focus();
    function outside(event: PointerEvent) { if (!container.current?.contains(event.target as Node)) setOpen(false); }
    function focusOutside(event: FocusEvent) { if (!container.current?.contains(event.target as Node)) setOpen(false); }
    document.addEventListener("pointerdown", outside);
    document.addEventListener("focusin", focusOutside);
    return () => { document.removeEventListener("pointerdown", outside); document.removeEventListener("focusin", focusOutside); };
  }, [open]);
  useEffect(() => { if (!account) setOpen(false); }, [account]);
  if (!account) return <Button asChild variant="outline" className="px-2 text-xs sm:text-sm lg:px-4"><Link href="/login"><UserRound size={15} className="mr-1 shrink-0 sm:mr-2" />Sign in</Link></Button>;
  const close = () => { setOpen(false); setError(""); };
  function keys(event: React.KeyboardEvent<HTMLDivElement>) {
    const items = Array.from(menu.current?.querySelectorAll<HTMLElement>('[role="menuitem"]:not(:disabled)') || []);
    const current = items.indexOf(document.activeElement as HTMLElement);
    if (event.key === "Escape") { event.preventDefault(); event.stopPropagation(); close(); trigger.current?.focus(); }
    else if (event.key === "Tab") { close(); trigger.current?.focus(); }
    else if (["ArrowDown", "ArrowUp", "Home", "End"].includes(event.key)) {
      event.preventDefault();
      const index = event.key === "Home" ? 0 : event.key === "End" ? items.length - 1 : (current + (event.key === "ArrowDown" ? 1 : -1) + items.length) % items.length;
      items[index]?.focus();
    } else if (event.key.length === 1 && !event.ctrlKey && !event.metaKey && event.key !== " ") {
      const ordered = [...items.slice(current + 1), ...items.slice(0, current + 1)];
      ordered.find((item) => item.textContent?.trim().toLowerCase().startsWith(event.key.toLowerCase()))?.focus();
    }
  }
  function logout() {
    setError("");
    startTransition(async () => {
      try {
        const result = await signOutAction();
        if (!result.success) { setError("Unable to sign out. Please try again."); return; }
        navigator.serviceWorker?.controller?.postMessage({type:"OFFLINE_CLEAR"});
        try { ["neopathshala_user_name", "neopathshala_user_email", "neopathshala_user_phone", "neopathshala_user_course", "neopathshala_user_orders"].forEach((key) => localStorage.removeItem(key)); } catch {}
        close(); router.replace("/login"); router.refresh();
      } catch { setError("Unable to sign out. Please try again."); }
    });
  }
  return <div ref={container} className="relative ml-1">
    <button ref={trigger} id={`${id}-trigger`} type="button" aria-label={`Open account menu for ${account.name}`} aria-haspopup="menu" aria-expanded={open} aria-controls={`${id}-menu`} onClick={() => { startAtEnd.current = false; setOpen(!open); }} onKeyDown={(event) => { if (event.key === "ArrowDown" || event.key === "ArrowUp") { event.preventDefault(); startAtEnd.current = event.key === "ArrowUp"; setOpen(true); } }} className="flex items-center gap-2 rounded-full p-1 transition-colors hover:bg-muted focus-visible:ring-2 focus-visible:ring-ring">
      <span className="block overflow-hidden rounded-full [&>div]:h-9 [&>div]:w-9 [&>div]:rounded-full [&>div]:text-sm"><ProfileAvatar url={account.avatarUrl} name={account.name} /></span><ChevronDown size={13} aria-hidden="true" className={`mr-1 hidden text-muted-foreground transition-transform sm:block ${open ? "rotate-180" : ""}`} />
    </button>
    {open && <div ref={menu} id={`${id}-menu`} role="menu" aria-labelledby={`${id}-trigger`} onKeyDown={keys} className="absolute right-0 top-full z-50 mt-3 w-[min(320px,calc(100vw-2rem))] overflow-hidden rounded-2xl border border-border bg-popover text-popover-foreground shadow-[0_16px_50px_#0003]">
      <div className="flex items-center gap-3 border-b border-border p-4"><ProfileAvatar url={account.avatarUrl} name={account.name} /><div className="min-w-0"><p className="truncate text-sm font-semibold">{account.name}</p><p className="mt-1 truncate text-xs text-muted-foreground">{account.email}</p><span className="mt-2 inline-flex items-center gap-1 text-[10px] font-medium text-primary"><ShieldCheck size={11} />Signed in</span></div></div>
      <div className="space-y-0.5 p-1.5">{links.map((item) => <Link role="menuitem" tabIndex={-1} href={item.href} key={item.href} onClick={close} className="flex items-center gap-3 rounded-lg px-3 py-2.5 outline-none hover:bg-muted focus:bg-muted"><item.icon size={17} strokeWidth={1.7} className="shrink-0 text-muted-foreground" /><span><span className="block text-sm font-medium">{item.label}</span><span className="mt-0.5 block text-[11px] text-muted-foreground">{item.detail}</span></span></Link>)}</div>
      <div className="space-y-0.5 border-t border-border p-1.5"><Link role="menuitem" tabIndex={-1} href={preferences.resourceHref} onClick={close} className="flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm outline-none hover:bg-muted focus:bg-muted"><BookOpen size={17} className="text-muted-foreground" />Study resources</Link></div>
      <div className="border-t border-border p-1.5"><button role="menuitem" tabIndex={-1} type="button" disabled={pending} onClick={logout} className="flex w-full items-center gap-3 rounded-lg px-3 py-3 text-left text-sm font-medium text-destructive outline-none hover:bg-destructive/5 focus:bg-destructive/5 disabled:opacity-50">{pending ? <Loader2 size={17} className="animate-spin" /> : <LogOut size={17} />}{pending ? "Signing out…" : "Sign out"}</button>{error && <p role="alert" className="px-3 pb-3 text-xs text-destructive">{error}</p>}</div>
    </div>}
  </div>;
}
