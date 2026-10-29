"use client";
import {ManagedMenu} from "./ManagedMenu";
import {defaultPresentation,type SitePresentation} from "@/lib/site-presentation";
import { SEARCH_HISTORY_KEY, cleanSearchHistory, addSearchHistory } from "@/lib/search-history";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { usePathname } from "next/navigation";
import { ArrowRight, History, Menu, Search, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { ThemeToggle } from "@/components/theme-toggle";
import type { SearchRecord } from "@/lib/search-records";
import { AccountMenu, type AccountSummary } from "@/components/layout/AccountMenu";
import { NavigationProgress } from "@/components/loading/NavigationProgress";


export function Navbar({ onOpenSearch, account = null, presentation=defaultPresentation(),initialMobileApp=false }: {initialMobileApp?:boolean;presentation?:Pick<SitePresentation,"brand"|"menus">; onOpenSearch?: () => void; account?: AccountSummary | null }) {

  const pathname = usePathname();
  const mobileApp=initialMobileApp;
  const [mobileOpen, setMobileOpen] = useState(false);
  const mobileDialog = useRef<HTMLDialogElement>(null);
  useEffect(() => {
    const drawer = mobileDialog.current;
    if (mobileOpen && !drawer?.open) drawer?.showModal();
    else if (!mobileOpen && drawer?.open) drawer.close();
    if (!mobileOpen) return;
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    const desktop = window.matchMedia("(min-width: 1024px)");
    const closeOnDesktop = () => { if (desktop.matches) setMobileOpen(false); };
    desktop.addEventListener("change", closeOnDesktop);
    return () => { document.body.style.overflow = previousOverflow; desktop.removeEventListener("change", closeOnDesktop); };
  }, [mobileOpen]);
  useEffect(() => { setMobileOpen(false); }, [pathname]);
  const [query, setQuery] = useState("");
  const [history, setHistory] = useState<string[]>([]);
  useEffect(() => {
    function restore() { try { setHistory(cleanSearchHistory(JSON.parse(localStorage.getItem(SEARCH_HISTORY_KEY) || "[]"))); } catch { setHistory([]); } }
    restore();
    function sync(event: StorageEvent) { if (event.key === SEARCH_HISTORY_KEY || event.key === null) restore(); }
    window.addEventListener("storage", sync);
    return () => window.removeEventListener("storage", sync);
  }, []);
  function rememberSearch(term: string) {
    if (term.trim().length < 2) return;
    let saved = history;
    try { saved = cleanSearchHistory(JSON.parse(localStorage.getItem(SEARCH_HISTORY_KEY) || "[]")); } catch {}
    const next = addSearchHistory(saved, term);
    setHistory(next);
    try { localStorage.setItem(SEARCH_HISTORY_KEY, JSON.stringify(next)); } catch {}
  }
  function clearHistory() {
    setHistory([]);
    try { localStorage.removeItem(SEARCH_HISTORY_KEY); } catch {}
  }
  const dialog = useRef<HTMLDialogElement>(null);
  useEffect(() => {
    function onKey(event: KeyboardEvent) {
      if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === "k") { event.preventDefault(); if (dialog.current?.open) dialog.current.close(); else dialog.current?.showModal(); }
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);
  function closeSearch() { dialog.current?.close(); }
  const [results, setResults] = useState<SearchRecord[]>([]);
  const [searching, setSearching] = useState(false);
  const [searchError, setSearchError] = useState("");
  const [partial, setPartial] = useState(false);
  useEffect(() => {
    const term = query.trim();
    setResults([]); setSearchError(""); setPartial(false);
    if (term.length < 2) { setSearching(false); return; }
    const controller = new AbortController();
    setSearching(true);
    const timer = setTimeout(async () => {
      try {
        const response = await fetch(`/api/search?q=${encodeURIComponent(term)}`, { signal: controller.signal });
        if (!response.ok) throw new Error("Search is unavailable. Please try again.");
        const data = await response.json();
        if (!controller.signal.aborted) { setResults(data.results || []); setPartial(!!data.partial); }
      } catch (error) { if (!controller.signal.aborted) setSearchError(error instanceof Error ? error.message : "Search is unavailable."); }
      finally { if (!controller.signal.aborted) setSearching(false); }
    }, 250);
    return () => { clearTimeout(timer); controller.abort(); };
  }, [query]);
  return <>
    <header className="sticky top-0 z-40 border-b border-border bg-background/95 backdrop-blur-xl"><div className={`mx-auto grid h-[72px] max-w-7xl grid-cols-[76px_minmax(0,1fr)_76px] items-center gap-1 px-3 sm:px-6 ${mobileApp?"":"lg:flex lg:justify-between lg:gap-4 lg:px-8"}`}>
      {mobileApp?<ThemeToggle/>:<Button size="icon" variant="ghost" className="lg:hidden" aria-label={mobileOpen ? "Close navigation" : "Open navigation"} aria-expanded={mobileOpen} aria-controls="mobile-navigation" onClick={() => setMobileOpen(!mobileOpen)}>{mobileOpen ? <X size={20} /> : <Menu size={20} />}</Button>}
      <Link href="/" aria-label={`${presentation.brand.name} home`} className={`flex shrink-0 items-center justify-self-center gap-1.5 sm:gap-2.5 ${mobileApp?"":"lg:justify-self-auto"}`}><Image unoptimized src={presentation.brand.logo||"/logo.webp"} alt={presentation.brand.name} width={38} height={38} priority className="h-8 w-8 rounded-xl max-[374px]:h-6 max-[374px]:w-6 sm:h-[38px] sm:w-[38px]" /><span className={`whitespace-nowrap text-xl font-semibold tracking-[-0.045em] max-[374px]:text-base sm:text-xl ${mobileApp?"":"lg:hidden xl:inline"}`}>{presentation.brand.name}</span></Link>
      {!mobileApp&&<nav aria-label="Main navigation" className="hidden lg:block"><ManagedMenu items={presentation.menus.main}/></nav>}
      <div className="flex shrink-0 items-center justify-end gap-1 lg:gap-1.5"><Button size={mobileApp?"icon":"default"} variant="ghost" onClick={() => onOpenSearch ? onOpenSearch() : dialog.current?.showModal()} className={mobileApp?"":"hidden gap-2 lg:inline-flex"} aria-label="Search resources, questions, and settings"><Search size={17} />{!mobileApp&&<kbd className="hidden rounded border border-border px-1.5 text-[10px] font-normal sm:block">⌘ K</kbd>}</Button>{!mobileApp&&<><ThemeToggle className="hidden lg:flex" /><AccountMenu account={account} /></>}</div>
    </div>{!mobileApp&&<dialog ref={mobileDialog} id="mobile-navigation" aria-labelledby="mobile-navigation-title" onClose={() => setMobileOpen(false)} onClick={event => { if (event.target === mobileDialog.current) setMobileOpen(false); }} className="fixed inset-y-0 left-0 right-auto m-0 h-dvh max-h-dvh w-[min(340px,90vw)] max-w-none border-r border-border bg-background p-0 text-foreground shadow-xl backdrop:bg-black/40 backdrop:backdrop-blur-sm lg:hidden">
      <div className="flex min-h-full flex-col"><div className="flex items-center justify-between gap-3 border-b border-border p-5"><Link href="/" onClick={() => setMobileOpen(false)} className="flex items-center gap-2.5"><Image unoptimized src={presentation.brand.logo||"/logo.webp"} alt="" width={32} height={32} className="rounded-lg" /><span id="mobile-navigation-title" className="whitespace-nowrap text-2xl font-semibold tracking-[-0.045em]">{presentation.brand.name}</span></Link><Button size="icon" variant="ghost" aria-label="Close navigation" onClick={() => setMobileOpen(false)}><X size={20} /></Button></div>
      <nav aria-label="Mobile navigation" className="flex-1 p-4"><ManagedMenu items={presentation.menus.main} mobile onNavigate={()=>setMobileOpen(false)}/><Link href={account?"/student/profile":"/login"} onClick={()=>setMobileOpen(false)} className="mt-3 block rounded-lg border-t border-border px-3 py-3 text-sm">{account?"My profile":"Sign in"}</Link></nav>
      <div className="flex items-center justify-between gap-3 border-t border-border p-5"><ThemeToggle /></div></div>
    </dialog>}<NavigationProgress /></header>
    {!mobileApp&&<Button size="icon" aria-label="Search resources, questions, and settings" onClick={() => onOpenSearch ? onOpenSearch() : dialog.current?.showModal()} className="mobile-search-trigger fixed right-5 bottom-[calc(1.25rem+env(safe-area-inset-bottom))] z-40 h-12 w-12 rounded-full shadow-lg lg:hidden"><Search size={21} /></Button>}
    <dialog ref={dialog} onClose={() => { rememberSearch(query); setQuery(""); }} aria-labelledby="search-title" onClick={(event) => { if (event.target === dialog.current) closeSearch(); }} className="fixed inset-x-0 bottom-auto top-[calc(1rem+env(safe-area-inset-top))] mx-auto my-0 lg:inset-0 lg:m-auto h-[min(560px,80dvh)] max-h-[80dvh] w-[calc(100%-2rem)] max-w-xl rounded-2xl border border-border bg-card p-0 text-card-foreground shadow-xl backdrop:bg-black/45 backdrop:backdrop-blur-sm"><div className="flex min-h-20 items-center gap-3 border-b border-border px-5 py-5"><Search size={19} className="text-muted-foreground" /><label id="search-title" htmlFor="global-search" className="sr-only">Search resources, questions, and settings</label><input id="global-search" autoFocus maxLength={120} value={query} onChange={(event) => setQuery(event.target.value)} onKeyDown={(event) => { if (event.key === "Enter") { event.preventDefault(); rememberSearch(query); } }} placeholder="Search resources, questions, and settings…" className="h-10 min-w-0 flex-1 bg-transparent text-base outline-none" /><Button variant="ghost" size="icon" onClick={closeSearch} aria-label="Close search"><X size={17} /></Button></div><div className="h-[calc(100%-124px)] overflow-y-auto p-2">{results.map((item) => <Link key={item.id} href={item.href} onClick={closeSearch} className="flex items-center justify-between gap-4 rounded-lg p-3 hover:bg-muted"><div><p className="line-clamp-2 text-sm font-medium">{item.label}</p><span className="text-xs text-muted-foreground">{item.kind} · {item.detail}</span></div><ArrowRight size={15} className="shrink-0 text-muted-foreground" /></Link>)}{query.trim().length < 2 ? <section aria-label="Recent searches"><div className="flex items-center justify-between gap-3 px-3 py-2"><h2 className="text-xs font-medium text-muted-foreground">Recent searches</h2>{history.length > 0 && <button type="button" onClick={clearHistory} className="text-xs font-medium text-primary hover:underline">Clear all</button>}</div>{history.map(term => <button type="button" key={term.toLowerCase()} onClick={() => { rememberSearch(term); setQuery(term); }} className="flex w-full items-center gap-3 rounded-lg p-3 text-left text-sm hover:bg-muted"><History size={15} className="shrink-0 text-muted-foreground" /><span className="min-w-0 flex-1 truncate">{term}</span><ArrowRight size={14} className="shrink-0 text-muted-foreground" /></button>)}</section> : searching ? <p role="status" className="p-8 text-center text-sm text-muted-foreground">Searching…</p> : searchError ? <p role="alert" className="p-8 text-center text-sm text-destructive">{searchError}</p> : !results.length && <p className="p-8 text-center text-sm text-muted-foreground">No matching resources, questions, or settings.</p>}{partial && <p className="px-3 py-2 text-xs text-muted-foreground">Some uploaded resources couldn’t be searched. Showing available matches.</p>}</div><div className="border-t border-border px-5 py-3 text-xs text-muted-foreground">Search study content and account settings · Esc to close</div></dialog>
  </>;
}
