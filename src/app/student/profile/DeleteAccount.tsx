"use client";

import { useEffect, useRef, useState, useTransition } from "react";
import { Trash2, ArrowLeft, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { requestAccountDeletionCode, deleteMyAccount } from "./delete-account-actions";

export function DeleteAccount({ email }: { email: string }) {
  const [open, setOpen] = useState(false);
  const [sent, setSent] = useState(false);
  const [code, setCode] = useState("");
  const [confirmed, setConfirmed] = useState(false);
  const [error, setError] = useState("");
  const [remaining, setRemaining] = useState(0);
  const [pending, startTransition] = useTransition();
  const lock = useRef(false);
  const input = useRef<HTMLInputElement>(null);
  useEffect(() => { if (sent && !pending) input.current?.focus(); }, [sent, pending]);
  useEffect(() => { if (!remaining) return; const timer = setTimeout(() => setRemaining(value => Math.max(0, value - 1)), 1000); return () => clearTimeout(timer); }, [remaining]);
  function request() {
    if (lock.current || remaining) return;
    lock.current = true; setError("");
    startTransition(async () => {
      try { const result = await requestAccountDeletionCode(); if (result.retryAfterSeconds) setRemaining(result.retryAfterSeconds); if (result.success) { setSent(true); setCode(""); } else setError(result.message); }
      catch { setError("Unable to send the code. Please try again."); }
      finally { lock.current = false; }
    });
  }
  return <section className="rounded-xl border border-destructive/25 p-6 sm:p-8" aria-labelledby="delete-account-title">
    <div className="flex items-start gap-3"><Trash2 size={20} className="mt-0.5 shrink-0 text-destructive" /><div><h2 id="delete-account-title" className="text-base font-semibold">Delete account</h2><p className="mt-2 text-xs leading-6 text-muted-foreground">Permanently delete your profile, saved preferences, and account sessions. This cannot be undone.</p></div></div>
    {!open ? <Button variant="outline" className="mt-5 border-destructive/30 text-destructive hover:bg-destructive/10" onClick={() => setOpen(true)}>Delete my account</Button> : <div className="mt-5 space-y-4 border-t border-border pt-5">
      <p className="text-sm leading-6">To confirm it’s you, we’ll send a deletion code to <span className="break-all font-medium">{email}</span>.</p>
      {sent && <form className="space-y-4" onSubmit={event => {
        event.preventDefault(); if (lock.current) return; lock.current = true; setError("");
        startTransition(async () => {
          try { const result = await deleteMyAccount(code, confirmed); if (result.success) { try { Object.keys(localStorage).filter(key => key.startsWith("neopathshala_")).forEach(key => localStorage.removeItem(key)); } catch {} window.location.replace("/login?account=deleted"); } else { setError(result.message); input.current?.focus(); input.current?.select(); } }
          catch { setError("Unable to delete your account. Please try again."); }
          finally { lock.current = false; }
        });
      }}><div><label htmlFor="delete-otp" className="mb-2 block text-xs font-medium">Deletion verification code</label><input ref={input} id="delete-otp" value={code} onChange={event => { setCode(event.target.value.replace(/\D/g, "")); setError(""); }} required pattern="[0-9]{6}" maxLength={6} inputMode="numeric" autoComplete="one-time-code" disabled={pending} aria-invalid={!!error} aria-describedby={error ? "delete-error" : undefined} className="h-11 w-full max-w-xs rounded-lg border border-input bg-background px-3 font-mono tracking-[0.4em] focus:outline-none focus:ring-2 focus:ring-primary aria-invalid:border-destructive" /></div><label className="flex items-start gap-3 text-xs leading-6"><input type="checkbox" required checked={confirmed} onChange={event => setConfirmed(event.target.checked)} disabled={pending} className="mt-1 h-4 w-4 accent-destructive" />I understand this permanently deletes my account.</label><Button type="submit" variant="destructive" disabled={pending || !confirmed || code.length !== 6}>{pending && <Loader2 size={15} className="mr-2 animate-spin" />}Permanently delete account</Button></form>}
      {error && <p id="delete-error" role="alert" className="text-xs text-destructive">{error}</p>}
      <div className="flex flex-wrap items-center gap-3"><Button type="button" variant={sent ? "ghost" : "outline"} disabled={pending || remaining > 0} onClick={request}>{remaining ? `Resend in ${remaining}s` : sent ? "Resend deletion code" : pending ? "Sending…" : "Send deletion code"}</Button><Button type="button" variant="ghost" disabled={pending} onClick={() => { setOpen(false); setCode(""); setConfirmed(false); setError(""); }}><ArrowLeft size={14} className="mr-2" />Cancel</Button></div>
    </div>}
  </section>;
}
