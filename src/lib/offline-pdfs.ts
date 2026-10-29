import {waitForDeviceReset} from './device-reset';
const DATABASE = 'neopathshala-offline-pdfs-v1';
const STORE = 'documents';
type SavedPDF = {id:string;scope:string;iv:Uint8Array<ArrayBuffer>;ciphertext:ArrayBuffer;key:CryptoKey};
export function installedStudyApp() {
  return false; // Offline app support is deferred for this release.
}
function identity(source:string){
  if(!installedStudyApp())throw Error('Offline reading is available only in the installed app.');
  const scope=document.querySelector<HTMLMetaElement>('meta[name="offline-account-scope"]')?.content;
  if(!scope||scope==='public')throw Error('Sign in to save PDFs for offline reading.');
  return {id:`${scope}:${source.split('#')[0]}`,scope};
}
function openDB():Promise<IDBDatabase>{return new Promise((resolve,reject)=>{const request=indexedDB.open(DATABASE,1);request.onupgradeneeded=()=>request.result.createObjectStore(STORE,{keyPath:'id'});request.onsuccess=()=>resolve(request.result);request.onerror=()=>reject(Error('App storage is unavailable.'));});}
async function access<T>(mode:IDBTransactionMode,run:(store:IDBObjectStore)=>IDBRequest<T>):Promise<T>{
 await waitForDeviceReset();const db=await openDB();return new Promise((resolve,reject)=>{const tx=db.transaction(STORE,mode);const request=run(tx.objectStore(STORE));let value:T;request.onsuccess=()=>{value=request.result;};tx.oncomplete=()=>{db.close();resolve(value);};tx.onerror=tx.onabort=()=>{db.close();reject(Error('Could not update offline storage.'));};});
}
export async function hasOfflinePDF(source:string){const current=identity(source);return !!await access<SavedPDF|undefined>('readonly',store=>store.get(current.id));}
export async function readOfflinePDF(source:string):Promise<Blob|null>{
 const current=identity(source);const saved=await access<SavedPDF|undefined>('readonly',store=>store.get(current.id));
 if(!saved||saved.scope!==current.scope)return null;
 const bytes=await crypto.subtle.decrypt({name:'AES-GCM',iv:saved.iv,additionalData:new TextEncoder().encode(current.id)},saved.key,saved.ciphertext);
 if(identity(source).id!==current.id)throw Error('Your account changed.');return new Blob([bytes],{type:'application/pdf'});
}
export async function saveOfflinePDF(source:string,viewerURL:string){
 const current=identity(source);if(!navigator.onLine)throw Error('Connect to the internet to download this PDF first.');
 const response=await fetch(viewerURL,{credentials:'same-origin',cache:'no-store'});
 if(!response.ok||!response.headers.get('content-type')?.includes('application/pdf'))throw Error('This PDF could not be downloaded. Try again while online.');
 const bytes=await response.arrayBuffer();if(bytes.byteLength>40*1024*1024)throw Error('This PDF is too large to save offline (40 MB limit).');
 if(new TextDecoder().decode(bytes.slice(0,1024)).indexOf('%PDF-')<0)throw Error('The response is not a valid PDF.');
 const key=await crypto.subtle.generateKey({name:'AES-GCM',length:256},false,['encrypt','decrypt']);
 const iv=crypto.getRandomValues(new Uint8Array(12));
 const ciphertext=await crypto.subtle.encrypt({name:'AES-GCM',iv,additionalData:new TextEncoder().encode(current.id)},key,bytes);
 if(identity(source).id!==current.id)throw Error('Your account changed. Please try again.');
 await prepareReader();
 if(identity(source).id!==current.id)throw Error('Your account changed.');
 await access('readwrite',store=>store.put({...current,iv,ciphertext,key} satisfies SavedPDF));
 await navigator.storage?.persist?.().catch(()=>false);
 // Retain the worker needed to render PDFs without a network connection.

 window.dispatchEvent(new Event('offline-pdf-saved'));
}
export async function removeOfflinePDF(source:string){const current=identity(source);await access('readwrite',store=>store.delete(current.id));window.dispatchEvent(new Event('offline-pdf-saved'));}
export function clearOfflinePDFs(){return new Promise<void>((resolve,reject)=>{const request=indexedDB.deleteDatabase(DATABASE);request.onsuccess=()=>resolve();request.onerror=()=>reject(Error('Could not clear offline PDFs.'));});}

async function prepareReader(){
 const worker=navigator.serviceWorker?.controller;if(!worker)throw Error('The app is preparing offline access. Reopen the app and try again.');
 await new Promise<void>((resolve,reject)=>{const channel=new MessageChannel();const timer=setTimeout(()=>{channel.port1.close();reject(Error('Reader download timed out. Please try again.'));},120000);channel.port1.onmessage=event=>{clearTimeout(timer);channel.port1.close();event.data?.ok?resolve():reject(Error('Could not save the offline reader. Try again while connected.'));};worker.postMessage({type:'OFFLINE_PDF_ENGINE'},[channel.port2]);});
}

/** Selected chapter/paper data only; never a course or semester bundle. */
export async function saveOfflinePart(source:string,value:unknown){
 const current=identity(`section:${source}`);
 if(!navigator.onLine)throw Error('Connect to download this section first.');
 const bytes=new TextEncoder().encode(JSON.stringify(value));
 if(bytes.byteLength>5*1024*1024)throw Error('This section is too large to save.');
 const key=await crypto.subtle.generateKey({name:'AES-GCM',length:256},false,['encrypt','decrypt']);
 const iv=crypto.getRandomValues(new Uint8Array(12));
 const ciphertext=await crypto.subtle.encrypt({name:'AES-GCM',iv,additionalData:new TextEncoder().encode(current.id)},key,bytes);
 if(identity(`section:${source}`).id!==current.id)throw Error('Your account changed.');
 await access('readwrite',store=>store.put({...current,iv,ciphertext,key} satisfies SavedPDF));
 window.dispatchEvent(new Event('offline-pdf-saved'));
}
export async function readOfflinePart<T>(source:string):Promise<T|null>{const blob=await readOfflinePDF(`section:${source}`);return blob?JSON.parse(await blob.text()) as T:null;}
