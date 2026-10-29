"use client";

import { useEffect } from "react";
import { ErrorPage } from "@/components/errors/ErrorPage";

export default function Error({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) {
  useEffect(() => {
    const key = `offline-recovery:${location.pathname}${location.search}`;
    try { if (navigator.serviceWorker?.controller && !sessionStorage.getItem(key)) { sessionStorage.setItem(key, "1"); location.reload(); return; } } catch {}
    const retry = () => { try { sessionStorage.removeItem(key); } catch {} reset(); };
    window.addEventListener("online", retry);
    return () => window.removeEventListener("online", retry);
  }, [reset]);
  return <ErrorPage code="500" onRetry={reset} reference={error.digest} error={error} />;
}
