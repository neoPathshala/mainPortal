/** Browser-only release. Retire workers installed by earlier PWA builds. */
export function sessionClientBootstrap(){return String.raw`(()=>{
 if(!('serviceWorker' in navigator))return;
 const owned=worker=>worker&&new URL(worker.scriptURL,location.href).origin===location.origin&&new URL(worker.scriptURL,location.href).pathname==='/sw.js';
 navigator.serviceWorker.getRegistrations().then(async registrations=>{
  await Promise.all(registrations.filter(registration=>[registration.active,registration.waiting,registration.installing].some(owned)).map(registration=>registration.unregister()));
  if('caches' in window){const keys=await caches.keys();await Promise.all(keys.filter(key=>/^(neocsit-|neopathshala-)/.test(key)).map(key=>caches.delete(key)));}
  // Unregistering does not detach the controller from open documents.
  // Cleanup must never reload: a lingering controller could repeat it forever.
 }).catch(()=>{});
})();`;}
