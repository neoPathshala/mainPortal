"use client";

import { Suspense, useEffect, useRef, useState } from "react";
import { usePathname, useSearchParams } from "next/navigation";

function RouteObserver({ onComplete }: { onComplete: () => void }) {
  const pathname = usePathname();
  const search = useSearchParams();
  useEffect(onComplete, [pathname, search, onComplete]);
  return null;
}

export function NavigationProgress() {
  const [progress, setProgress] = useState(0);
  const [visible, setVisible] = useState(false);
  const finish = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);
  const active = useRef(false);
  const complete = useRef(() => {
    if (!active.current || document.querySelector("[data-route-loading]")) return;
    active.current = false;
    setProgress(100);
    clearTimeout(finish.current);
    finish.current = setTimeout(() => { setVisible(false); setProgress(0); }, 240);
  }).current;

  useEffect(() => {
    function start() {
      clearTimeout(finish.current);
      active.current = true;
      setProgress(12);
      setVisible(true);
      // Recover from cancelled navigation without leaving a permanent loading bar.
      finish.current = setTimeout(() => { active.current = false; setVisible(false); setProgress(0); }, 30000);
    }
    function click(event: MouseEvent) {
      if (event.defaultPrevented || event.button !== 0 || event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return;
      const anchor = (event.target as Element)?.closest?.("a[href]");
      if (!(anchor instanceof HTMLAnchorElement) || anchor.hasAttribute("download") || (anchor.target && anchor.target !== "_self")) return;
      const destination = new URL(anchor.href, location.href);
      if (destination.origin !== location.origin || !/^https?:$/.test(destination.protocol) || (destination.pathname === location.pathname && destination.search === location.search)) return;
      start();
    }
    let wasLoading = !!document.querySelector("[data-route-loading]");
    const observer = new MutationObserver(() => {
      const loading = !!document.querySelector("[data-route-loading]");
      if (loading && !active.current) start();
      if (wasLoading && !loading) complete();
      wasLoading = loading;
    });
    observer.observe(document.getElementById("main-content") || document.body, { childList: true, subtree: true });
    if (document.querySelector("[data-route-loading]")) start();
    const timer = setInterval(() => { if (active.current) setProgress(value => Math.min(92, value + (94 - value) * 0.08)); }, 350);
    document.addEventListener("click", click, true);
    let currentRoute = location.pathname + location.search;
    function popstate() {
      const nextRoute = location.pathname + location.search;
      if (nextRoute !== currentRoute) start();
      currentRoute = nextRoute;
    }
    function rememberRoute() { currentRoute = location.pathname + location.search; }
    window.addEventListener("popstate", popstate);
    document.addEventListener("click", rememberRoute);
    return () => { observer.disconnect(); clearInterval(timer); clearTimeout(finish.current); document.removeEventListener("click", click, true); window.removeEventListener("popstate", popstate); document.removeEventListener("click", rememberRoute); };
  }, [complete]);

  return <>
    <Suspense fallback={null}><RouteObserver onComplete={complete} /></Suspense>
    <div role="progressbar" aria-label="Loading page" aria-hidden={!visible} className="navigation-progress" style={{ opacity: visible ? 1 : 0 }}>
      <div className="h-full origin-left bg-primary" style={{ transform: `scaleX(${progress / 100})` }} />
    </div>
  </>;
}
