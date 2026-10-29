"use client";

import { useEffect,useLayoutEffect,useState,type ReactNode } from "react";
import {detectSessionClient} from "@/lib/session-device";
import {mobileDevice,publicPwaPath} from "@/lib/pwa-access";
import { usePathname } from "next/navigation";

export function SessionGuard({ sessionId,initialMobileApp=false,children }: { sessionId: string | null;initialMobileApp?:boolean;children?:ReactNode }) {
  const pathname = usePathname();
  const [mobileApp,setMobileApp]=useState(initialMobileApp);
  useLayoutEffect(()=>{setMobileApp(detectSessionClient()==='pwa'&&mobileDevice(navigator.userAgent,navigator.maxTouchPoints));},[]);
  useEffect(() => {
    if (!sessionId) {
      if(detectSessionClient()==='pwa'&&mobileDevice(navigator.userAgent,navigator.maxTouchPoints)&&!publicPwaPath(pathname))window.location.replace('/login?app=pwa&reason=app-sign-in');
      return;
    }
    const controller = new AbortController();
    let checking = false;
    let leaving = false;
    async function check() {
      if (checking || leaving || document.visibilityState !== "visible" || !navigator.onLine) return;
      checking = true;
      try {
        const response = await fetch("/api/account/session", { credentials: "same-origin", cache: "no-store", signal: controller.signal });
        // A network/database outage is not evidence of a revoked session.
        if (!response.ok || controller.signal.aborted) return;
        const current = await response.json();
        if (controller.signal.aborted) return;
        if (current.authenticated === false) {
          leaving = true;
          navigator.serviceWorker?.controller?.postMessage({type:"OFFLINE_CLEAR"});
          // Full navigation clears cached private client state, including pages
          // kept in the App Router cache. Never sign out a newly issued cookie.
          window.location.replace("/login?reason=session-ended");
        } else if (current.authenticated === true && current.sessionId && current.sessionId !== sessionId) {
          leaving = true;
          window.location.reload();
        }
      } catch { /* Keep the page usable during connection failures. */ }
      finally { checking = false; }
    }
    void check();
    const timer = window.setInterval(() => { void check(); }, 30000);
    window.addEventListener("focus", check);
    window.addEventListener("online", check);
    document.addEventListener("visibilitychange", check);
    return () => {
      controller.abort(); window.clearInterval(timer);
      window.removeEventListener("focus", check);
      window.removeEventListener("online", check);
      document.removeEventListener("visibilitychange", check);
    };
  }, [sessionId, pathname]);
  if(mobileApp&&!sessionId&&!publicPwaPath(pathname))return null;
  return children;
}
