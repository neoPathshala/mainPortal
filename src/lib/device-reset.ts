/** Change this revision only when a deliberate, one-time device migration is needed. */
export const DEVICE_RESET_REVISION='main-2026-10-28-study-patch-1';
export const deviceResetScript=String.raw`(()=>{
 const revision='main-2026-10-28-study-patch-1',marker='neopathshala:device-reset';
 const appKey=key=>/^(neopathshala|neocsit|offline-access:main|platform:offline-policy|error-report:)/.test(key)||key==='theme';
 const appCache=key=>/^(neopathshala-|neocsit-)/.test(key);
 let completed=false;try{completed=localStorage.getItem(marker)===revision;}catch{}
 if(completed){window.__neoDeviceReset=Promise.resolve();return;}
 // Run before React restores preferences or initializes client state.
 for(const storageName of ['localStorage','sessionStorage'])try{
  const storage=window[storageName],keys=[];for(let i=0;i<storage.length;i++){const key=storage.key(i);if(key&&key!==marker&&appKey(key))keys.push(key);}
  keys.forEach(key=>storage.removeItem(key));
 }catch{}
 window.__neoDeviceReset=(async()=>{
  if('serviceWorker' in navigator){const registrations=await navigator.serviceWorker.getRegistrations();await Promise.all(registrations.filter(registration=>[registration.active,registration.waiting,registration.installing].some(worker=>worker&&new URL(worker.scriptURL,location.href).pathname==='/sw.js')).map(registration=>registration.unregister()));}
  if('caches' in window){const keys=await caches.keys();await Promise.all(keys.filter(appCache).map(key=>caches.delete(key)));}
  if('indexedDB' in window)await new Promise((resolve,reject)=>{
   const request=indexedDB.deleteDatabase('neopathshala-offline-pdfs-v1');const timer=setTimeout(()=>reject(Error('Offline storage reset is blocked')),8000);
   request.onsuccess=()=>{clearTimeout(timer);resolve();};request.onerror=()=>{clearTimeout(timer);reject(Error('Offline storage reset failed'));};
  });
  // Mark success only after every cache and downloaded document has been cleared.
  try{localStorage.setItem(marker,revision);}catch{return;}
  // Preferences reset before React starts; cleanup needs no page reload.
 })().catch(()=>{ /* No success marker: retry safely on the next visit. */ });
})();`;
export function waitForDeviceReset():Promise<void>{
 return typeof window==='undefined'?Promise.resolve():(window as Window & {__neoDeviceReset?:Promise<void>}).__neoDeviceReset||Promise.resolve();
}
