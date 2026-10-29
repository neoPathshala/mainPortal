"use client";

import { useState } from "react";

export function ProfileAvatar({ url, name, size = "small" }: { url: string | null; name: string; size?: "small" | "large" }) {
  const [failedUrl, setFailedUrl] = useState<string | null>(null);
  const initials = name.split(" ").filter(Boolean).map((word) => word[0]).slice(0, 2).join("") || "?";
  return <div className={`flex shrink-0 items-center justify-center overflow-hidden rounded-2xl bg-primary/10 font-semibold text-primary ${size === "large" ? "h-24 w-24 text-3xl" : "h-12 w-12 text-lg"}`}>
    {url && url !== failedUrl ? <img src={url} alt={`${name}’s profile photo`} width={size === "large" ? 96 : 48} height={size === "large" ? 96 : 48} loading="eager" decoding="sync" fetchPriority="high" className="h-full w-full object-cover" onError={() => setFailedUrl(url)} /> : <span aria-label={`${name}’s initials`}>{initials}</span>}
  </div>;
}

