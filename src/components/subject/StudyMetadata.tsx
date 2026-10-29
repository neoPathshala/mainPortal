"use client";
import { createContext, useContext, useEffect, useState, type ReactNode } from "react";
import { Clock } from "lucide-react";
type Entry = { difficulty?: "Easy" | "Medium" | "Hard"; preparation?: string };
const Context = createContext<Record<string, Entry>>({});
export function StudyMetadataProvider({ subject, children }: { subject: string; children: ReactNode }) {
  const [data, setData] = useState<Record<string, Entry>>({});
  useEffect(() => {
    const controller = new AbortController();
    const refresh = () => fetch(`/api/study-metadata?subject=${encodeURIComponent(subject)}`, { signal: controller.signal }).then(async response => { if (response.ok) setData(await response.json()); }).catch(() => {});
    setData({}); void refresh();
    const timer = window.setInterval(refresh, 60000);
    return () => { controller.abort(); clearInterval(timer); };
  }, [subject]);
  return <Context.Provider value={data}>{children}</Context.Provider>;
}
export function StudyMetadata({ entity, fallbackEntity, showUnset = false }: { entity: string; fallbackEntity?: string; showUnset?: boolean }) {
  const data = useContext(Context);
  const entry = data[entity] || (fallbackEntity ? data[fallbackEntity] : undefined);
  if (!showUnset && !entry?.difficulty && !entry?.preparation) return null;
  const color = entry?.difficulty === "Easy" ? "text-emerald-600 dark:text-emerald-300 bg-emerald-500/10" : entry?.difficulty === "Medium" ? "text-amber-700 dark:text-amber-300 bg-amber-500/10" : entry?.difficulty === "Hard" ? "text-rose-600 dark:text-rose-300 bg-rose-500/10" : "text-muted-foreground bg-muted";
  return <span className="mt-2 flex flex-wrap items-center gap-2 text-[11px] font-normal leading-5">{(entry?.difficulty || showUnset) && <span className={`rounded-md px-2 py-0.5 ${color}`}>{entry?.difficulty || "Difficulty not set"}</span>}{(entry?.preparation || showUnset) && <span className="inline-flex items-center gap-1 text-muted-foreground"><Clock className="h-3 w-3" />{entry?.preparation ? `Preparation: ${entry.preparation}` : "Preparation time not set"}</span>}</span>;
}
