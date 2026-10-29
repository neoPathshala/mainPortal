"use client";

import Link from "next/link";
import { useStudentPreferences } from "@/components/student-preferences-provider";
import { useState, useEffect } from "react";
import { Check, Star, Layers } from "lucide-react";
import { cn } from "@/lib/utils";

export function ActiveSemesterButton({ semesterId }: { semesterId: number }) {
  const preferences = useStudentPreferences();
  const [isActive, setIsActive] = useState(false);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    try {
      const stored = localStorage.getItem("neopathshala_user_semester");
      if (stored && parseInt(stored, 10) === semesterId) {
        setIsActive(true);
      }
    } catch {}
  }, [semesterId]);

  const handleSetActive = () => {
    try {
      localStorage.setItem("neopathshala_user_semester", String(semesterId));
      setIsActive(true);
    } catch {}
  };

  if (!mounted) return null;
  if (preferences.authenticated) return <Link href="/student/profile?tab=details" className="flex items-center gap-2 rounded-lg border border-border px-3 py-2 text-xs text-primary">{preferences.courseSlug === "csit" && preferences.semester === semesterId ? <><Check size={13} />My saved semester</> : <><Layers size={13} />Update academic settings</>}</Link>;

  return (
    <button
      onClick={handleSetActive}
      className={cn(
        "px-3 py-1.5 rounded-lg text-xs font-bold flex items-center gap-1.5 transition-all cursor-pointer",
        isActive
          ? "bg-primary text-primary-foreground border border-emerald-400/50 shadow-sm"
          : "bg-background border border-border text-muted-foreground hover:text-foreground hover:border-emerald-500/50"
      )}
      title={isActive ? "This is your currently active semester" : "Set this as your active semester"}
    >
      {isActive ? (
        <>
          <Check className="h-3.5 w-3.5 text-primary" />
          <span>My Active Semester</span>
        </>
      ) : (
        <>
          <Star className="h-3.5 w-3.5 text-muted-foreground group-hover:text-amber-400" />
          <span>Set as My Semester</span>
        </>
      )}
    </button>
  );
}
