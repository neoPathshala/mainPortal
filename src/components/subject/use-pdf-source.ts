"use client";
import {publicPDFLink, isPDFLinkAlias} from '@/lib/pdf-link-origin';
import {installedStudyApp,readOfflinePDF} from '@/lib/offline-pdfs';
import {useOfflineAccess} from '@/components/offline-access';
import {useEffect, useState} from 'react';

const hostedPDFPath = /^\/api\/resource-pdfs\/[a-f0-9-]{36}$/;

/**
 * Resolves a viewer source, returning an empty string while a local link is prepared.
 * Online viewing uses the authorized reader endpoint. Offline PDFs are available
 * only after an explicit app download, decrypted from account-scoped storage.
 */
export function usePDFSource(source: string) {
  const {enabled} = useOfflineAccess();
  const [url, setUrl] = useState('');
  const [revision,setRevision]=useState(0);
  useEffect(()=>{const refresh=()=>setRevision(value=>value+1);window.addEventListener('online',refresh);window.addEventListener('offline',refresh);window.addEventListener('offline-pdf-saved',refresh);return()=>{window.removeEventListener('online',refresh);window.removeEventListener('offline',refresh);window.removeEventListener('offline-pdf-saved',refresh);};},[]);

  useEffect(() => {
    setUrl('');
    if (!source) return;
    if(!navigator.onLine){
      let stopped=false,objectURL='';
      if(enabled&&installedStudyApp())void readOfflinePDF(source).then(blob=>{if(blob&&!stopped){objectURL=URL.createObjectURL(blob);setUrl(objectURL);}}).catch(()=>{});
      return()=>{stopped=true;if(objectURL)URL.revokeObjectURL(objectURL);};
    }
    // Published banner PDFs are public presentation media, independent of course access.
    if (/^\/api\/banner-media\/[a-f0-9-]{36}$/.test(source)) { setUrl(source); return; }

    if (!source.startsWith('/') || source.startsWith('/api/pdf?token=') || hostedPDFPath.test(source.split('?')[0])) {
      const viewerURL = new URL(publicPDFLink(source), window.location.origin);
      if (isPDFLinkAlias(viewerURL.href) || hostedPDFPath.test(viewerURL.pathname)) {
        viewerURL.searchParams.set('reader', '1');
      }
      setUrl(viewerURL.href);
      return;
    }

    // Only hosted documents are supported. The reader reports stale local links
    // as unavailable instead of signing or loading files from the server disk.
    setUrl(new URL(source, window.location.origin).href);
  }, [source, enabled, revision]);

  return url;
}
