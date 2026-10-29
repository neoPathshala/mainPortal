"use client";

import {ErrorReference} from "../error-reference";
import { useState, useTransition } from "react";
import { ArrowRight, BookOpen, Clock3, CloudOff, FileWarning, House, LockKeyhole, RefreshCw, ShieldCheck, WifiOff, Wrench } from "lucide-react";
import { ERROR_PAGES, type ErrorCode } from "@/lib/error-pages";
import { errorStyles } from "./error-styles";

const icons = { book: BookOpen, clock: Clock3, cloud: CloudOff, file: FileWarning, lock: LockKeyhole, shield: ShieldCheck, tools: Wrench, wifi: WifiOff };
export function ErrorPage({ code, onRetry, standalone = false, reference, error }: { code: ErrorCode; onRetry?: () => void; standalone?: boolean; reference?: string; error?:Error }) {
  const content = ERROR_PAGES[code];
  const Icon = icons[content.icon];
  const [pending, startTransition] = useTransition();
  const [reloading, setReloading] = useState(false);
  function retry() {
    if (onRetry) startTransition(() => onRetry());
    else { setReloading(true); window.location.reload(); }
  }
  const busy = pending || reloading;
  return <section aria-labelledby="error-heading" className={`error-screen${standalone ? " error-screen--standalone" : ""}`}>
    <style>{errorStyles}</style>
    <div className="error-panel">
      {standalone && <a href="/" className="error-brand" aria-label="neoPathshala home">neo<span>Pathshala</span></a>}
      <div className="error-art" aria-hidden="true"><div className="error-icon"><Icon strokeWidth={1.5} /></div><span className={`error-number${code === "offline" ? " error-number--offline" : ""}`}>{code === "offline" ? "Offline" : code}</span></div>
      <p className="error-label">{content.label}</p>
      <h1 id="error-heading" className="error-heading">{content.title}</h1>
      <p className="error-description">{content.description}</p>
      <div className="error-actions">
        {content.action === "retry" ? <button type="button" className="error-action error-action--primary" disabled={busy} onClick={retry}><RefreshCw aria-hidden="true" />{busy ? "Trying again…" : "Try again"}</button> : content.action === "login" ? <a href="/login" className="error-action error-action--primary">Sign in<ArrowRight aria-hidden="true" /></a> : content.action === "resources" ? <a href="/resources" className="error-action error-action--primary">Browse resources<ArrowRight aria-hidden="true" /></a> : <a href="/" className="error-action error-action--primary"><House aria-hidden="true" />Back to home</a>}
        {content.action !== "home" && <a href="/" className="error-action"><House aria-hidden="true" />Back to home</a>}
        {content.action === "home" && <a href="/resources" className="error-action">Browse resources<ArrowRight aria-hidden="true" /></a>}
      </div>
      <div className="error-help"><span>Need a hand? <a href="/contact">Contact us</a></span>{(code==="404"||code==="500")&&<ErrorReference status={code==="404"?404:500} reference={reference} error={error}/>}</div>
    </div>
  </section>;
}
