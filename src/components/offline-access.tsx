'use client';
import {waitForDeviceReset} from '@/lib/device-reset';
import { createContext, useContext, useEffect, useState } from 'react';
import { usePathname } from 'next/navigation';
import {createOfflinePolicyPoller} from '@/lib/offline-policy-client';
import { OfflineScreen } from './offline-screen';
import { offlineClientKind, type OfflinePlatform } from '@/lib/offline-policy';
const Context = createContext<{ enabled: boolean; prepared: number }>({ enabled: false, prepared: 0 });
export function useOfflineAccess() { return useContext(Context); }
export function OfflineAccess({ platform, children }: { platform: OfflinePlatform; children: React.ReactNode }) {
  const path = usePathname(); const [enabled, setEnabled] = useState(false); const [online, setOnline] = useState(true); const [prepared, setPrepared] = useState(0);
  useEffect(() => {
    let stopped = false;let configured=false;let refreshing=false;let registrationPromise:Promise<ServiceWorkerRegistration>|undefined;
    const installed = matchMedia('(display-mode: standalone)').matches || matchMedia('(display-mode: minimal-ui)').matches || matchMedia('(display-mode: fullscreen)').matches || (navigator as Navigator & { standalone?: boolean }).standalone === true;
    const ua = navigator.maxTouchPoints > 1 && /Macintosh/.test(navigator.userAgent) ? 'iPad' : navigator.userAgent;
    const kind = offlineClientKind(ua, installed); const eligible=platform!=='main'||installed; setEnabled(eligible); setOnline(navigator.onLine); const key = `offline-access:${platform}:${kind.mode}:${kind.device}`;
    try { const saved = localStorage.getItem(key); if (saved !== null) setEnabled(eligible && saved === 'true'); } catch {}
    const apply = (flag: boolean) => { if (stopped) return; setEnabled(eligible && flag); try { localStorage.setItem(key, String(flag)); } catch {} };
    const polling=createOfflinePolicyPoller(policy=>apply(policy[platform][kind.mode][kind.device]));
    async function refresh(force=false) {
      await waitForDeviceReset();
      if(stopped||refreshing)return;
      if(platform==='admin'&&/^\/(login|setup|two-factor)(\/|$)/.test(location.pathname))return;
      refreshing=true;
      try{
      setOnline(navigator.onLine);
      if (navigator.onLine && (process.env.NODE_ENV!=='production'||!('serviceWorker' in navigator))) {
        await polling.refresh(force);
      }
      if ('serviceWorker' in navigator && process.env.NODE_ENV === 'production') {
        try { const registration = await (registrationPromise ||= navigator.serviceWorker.register(platform === 'admin' ? '/admin-sw.js' : '/sw.js', { updateViaCache: 'none' }).catch(error=>{registrationPromise=undefined;throw error;})); const worker = registration.active || (await navigator.serviceWorker.ready).active; if (!stopped) {worker?.postMessage({ type: 'OFFLINE_CONFIGURE', ...kind, force });configured=!!worker;} } catch {}
      }
      if(process.env.NODE_ENV!=='production')configured=true;
      }finally{refreshing=false;}
    }
    const refreshNow=()=>{void refresh(true);};
    const route=()=>{if(!configured)void refresh();else navigator.serviceWorker?.controller?.postMessage({type:'OFFLINE_VISIT'});};
    window.addEventListener('offline-route-change',route);
    const message = (event: MessageEvent) => { if (event.data?.type === 'OFFLINE_ACCESS') { if (typeof event.data.enabled === 'boolean') apply(event.data.enabled); if (typeof event.data.prepared === 'number') setPrepared(event.data.prepared); } };
    const offline = () => setOnline(false);
    const navigate = (event: MouseEvent) => {
      if (!eligible || navigator.onLine || event.defaultPrevented || event.button !== 0 || event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return;
      const link = (event.target as Element)?.closest?.('a'); if (!link || link.target === '_blank' || link.hasAttribute('download')) return;
      const url = new URL(link.href, location.href); if (url.origin !== location.origin || url.pathname.startsWith('/api/') || url.pathname === location.pathname && url.search === location.search) return;
      // Full offline navigation lets the worker replay the exact regular document,
      // rather than asking a disconnected server for an App Router payload.
      event.preventDefault(); event.stopPropagation(); if (kind.mode === 'pwa') url.searchParams.set('app', 'pwa'); location.assign(url.href);
    };
    const contentChanged = () => { navigator.serviceWorker?.controller?.postMessage({type:'OFFLINE_CONTENT_CHANGED'}); void refresh(true); };
    const controller = () => { navigator.serviceWorker.controller?.postMessage({ type: 'OFFLINE_CONFIGURE', ...kind, force:true }); };
    navigator.serviceWorker?.addEventListener('message', message); navigator.serviceWorker?.addEventListener('controllerchange', controller);
    window.addEventListener('online', refreshNow); window.addEventListener('offline', offline); window.addEventListener('offline-policy-refresh', refreshNow); window.addEventListener('admin-content-synced', contentChanged); document.addEventListener('click', navigate, true);
    const timer = setInterval(() => { if (navigator.onLine&&document.visibilityState==='visible') void refresh(); }, 60000);
    void refresh();
    return () => { stopped = true; polling.dispose(); clearInterval(timer); window.removeEventListener('offline-route-change',route); navigator.serviceWorker?.removeEventListener('message', message); navigator.serviceWorker?.removeEventListener('controllerchange', controller); window.removeEventListener('online', refreshNow); window.removeEventListener('offline', offline); window.removeEventListener('offline-policy-refresh', refreshNow); window.removeEventListener('admin-content-synced', contentChanged); document.removeEventListener('click', navigate, true); };
  }, [platform]);
  useEffect(()=>{const timer=setTimeout(()=>window.dispatchEvent(new Event('offline-route-change')),1500);return()=>clearTimeout(timer);},[path]);
  return <Context.Provider value={{ enabled, prepared }}><div hidden={!online&&!enabled} className="contents">{children}</div>{!online&&!enabled&&<OfflineScreen />}</Context.Provider>;
}
