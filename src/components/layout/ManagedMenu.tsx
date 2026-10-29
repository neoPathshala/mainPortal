"use client";
import {NoticeUnreadBadge} from "@/components/notice-read-provider";
import Link from "next/link";
import { isReleasedLink } from "@/lib/release-features";
import { usePathname } from "next/navigation";
import { ChevronDown } from "lucide-react";
import type { MenuLink } from "@/lib/site-presentation";
import { useStudentPreferences } from "@/components/student-preferences-provider";
export function ManagedMenu({
  items,
  mobile = false,
  onNavigate,
  rootId = "",
}: {
  items: MenuLink[];
  mobile?: boolean;
  rootId?: string;
  onNavigate?: () => void;
}) {
  items = items.filter((item) => !item.href || isReleasedLink(item.href));
  const path = usePathname(),
    preferences = useStudentPreferences();
  const href = (value: string) =>
    value === "/resources"
      ? preferences.resourceHref
      : value === "/notices"
        ? preferences.noticesHref
        : value;
  const render = (parent: string, depth = 0) =>
    items
      .filter((item) => item.parentId === parent && item.enabled)
      .map((item) => {
        const children = items.some(
          (child) => child.parentId === item.id && child.enabled,
        );
        const link = item.href ? (
          <Link
            href={href(item.href)}
            target={item.newTab ? "_blank" : undefined}
            rel={item.newTab ? "noopener noreferrer" : undefined}
            onClick={(event) => {
              (
                event.currentTarget.closest(
                  "details",
                ) as HTMLDetailsElement | null
              )?.removeAttribute("open");
              onNavigate?.();
            }}
            aria-current={path === item.href.split("?")[0] ? "page" : undefined}
            className="block rounded-lg px-3 py-2.5 text-sm text-muted-foreground transition-colors hover:bg-muted/70 hover:text-foreground"
          >
            {item.label}{item.href?.split(/[?#]/)[0] === "/notices" && <NoticeUnreadBadge/>}
          </Link>
        ) : (
          <span className="block px-3 py-2 text-sm font-medium">
            {item.label}{item.href?.split(/[?#]/)[0] === "/notices" && <NoticeUnreadBadge/>}
          </span>
        );
        return children ? (
          <details
            key={item.id}
            className={mobile ? "rounded-lg" : "relative"}
            onBlur={(event) => {
              if (
                !event.currentTarget.contains(
                  event.relatedTarget as Node | null,
                )
              )
                event.currentTarget.removeAttribute("open");
            }}
            onKeyDown={(event) => {
              if (event.key === "Escape") {
                event.currentTarget.removeAttribute("open");
                event.currentTarget.querySelector("summary")?.focus();
              }
            }}
          >
            <summary className="flex cursor-pointer list-none items-center justify-between gap-2 rounded-lg px-3 py-2.5 text-sm text-muted-foreground hover:bg-muted/70">
              {item.label}{item.href?.split(/[?#]/)[0] === "/notices" && <NoticeUnreadBadge/>}
              <ChevronDown size={13} />
            </summary>
            <div
              className={
                mobile
                  ? "ml-3 border-l border-border pl-2"
                  : `absolute ${depth ? "left-full top-0" : "left-0 top-full"} z-50 min-w-52 rounded-xl border border-border bg-card p-1.5 shadow-xl`
              }
            >
              {item.href && link}
              {render(item.id, depth + 1)}
            </div>
          </details>
        ) : (
          <div key={item.id}>{link}</div>
        );
      });
  return (
    <div className={mobile ? "space-y-1" : "flex items-center gap-0.5"}>
      {render(rootId)}
    </div>
  );
}
