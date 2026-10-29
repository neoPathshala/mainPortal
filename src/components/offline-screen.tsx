'use client';
import { WifiOff, RefreshCw } from 'lucide-react';

export function OfflineScreen() {
  return <section className="offline-screen" role="status" aria-labelledby="offline-title">
    <div className="offline-panel">
      <p className="offline-brand">neoPathshala</p>
      <div className="offline-orbit" aria-hidden="true"><span/><span/><WifiOff size={36} strokeWidth={1.5}/></div>
      <p className="offline-label">Waiting for a connection</p>
      <h1 id="offline-title">You’re offline</h1>
      <p>Reconnect to continue browsing. Your page will return when you’re back online.</p>
      <button type="button" onClick={()=>window.location.reload()}><RefreshCw size={16}/>Try again</button>
      <p className="offline-hint">Offline study is available in the installed app. Download each PDF in the app while connected first.</p>
    </div>
  </section>;
}
