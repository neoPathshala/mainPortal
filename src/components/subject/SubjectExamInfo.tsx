"use client";
import { useEffect, useState } from "react";
import { Clock } from "lucide-react";

export function SubjectExamInfo({ slug }: { slug: string }) {
  const [settings, setSettings] = useState<{ category?: string; preparation?: string; examAt?: string; enabled?: boolean }>({});
  const [now, setNow] = useState<number | null>(null);
  useEffect(() => {
    const controller = new AbortController();
    const refresh = () => fetch(`/api/subject-exam?subject=${encodeURIComponent(slug)}`, { signal: controller.signal }).then(r => r.json()).then(setSettings).catch(() => {});
    refresh(); setNow(Date.now());
    const tick = window.setInterval(() => setNow(Date.now()), 1000);
    const sync = window.setInterval(refresh, 60000);
    return () => { controller.abort(); clearInterval(tick); clearInterval(sync); };
  }, [slug]);
  if (!settings.enabled) return null;
  const end = Date.parse(settings.examAt || "");
  const minutes = now && Number.isFinite(end) ? Math.max(0, Math.floor((end - now) / 60000)) : null;
  return <div className="mt-3 flex flex-wrap items-center gap-x-4 gap-y-2 text-xs">
    {settings.category && <span className="font-medium text-primary">{settings.category}</span>}
    {settings.preparation && <span className="text-muted-foreground">Exam Preparation · {settings.preparation}</span>}
    {minutes !== null && <span className="flex items-center gap-1.5 tabular-nums text-muted-foreground"><Clock className="h-3.5 w-3.5" />{now! >= end ? "Exam time reached" : `${Math.floor(minutes / 1440)} days ${Math.floor(minutes / 60) % 24} hr ${minutes % 60} min remaining`}</span>}
  </div>;
}
