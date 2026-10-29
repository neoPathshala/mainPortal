/** Canonical site ID; the legacy ID is read only during the database transition. */
export const MAIN_SITE='neopathshala';
export const LEGACY_MAIN_SITE='neocsit';
export const MAIN_SITE_IDS:string[]=[MAIN_SITE,LEGACY_MAIN_SITE];
export function isMainSite(site:string){return MAIN_SITE_IDS.includes(site);}

export const migratePlatformStorageScript=String.raw`(()=>{
 const legacy='${LEGACY_MAIN_SITE}',current='neopathshala';
 for(const name of ['localStorage','sessionStorage'])try{
  const storage=window[name],keys=[];for(let i=0;i<storage.length;i++){const key=storage.key(i);if(key&&(key.startsWith(legacy+'_')||key.startsWith(legacy+'-')))keys.push(key);}
  for(const key of keys){const target=current+key.slice(legacy.length);if(storage.getItem(target)===null)storage.setItem(target,storage.getItem(key));storage.removeItem(key);}
 }catch{}
})();`;
