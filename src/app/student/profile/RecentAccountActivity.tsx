import { formatBSDate, formatNepalTime } from "@/lib/nepali-date";
import Link from "next/link";
import { ChevronLeft, ChevronRight, Clock3 } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { cn } from "@/lib/utils";

type Activity = { id: string; details: string; createdAt: string };
export function RecentAccountActivity({ activity, pagination }: { activity: Activity[]; pagination: { page: number; totalPages: number; total: number } }) {
  const control = "inline-flex items-center gap-2 rounded-lg border border-border px-3 py-2 text-xs font-medium";
  const date = (value: string) => formatBSDate(value);
  return <Card><CardContent className="p-6 sm:p-8"><h2 className="mb-5 text-lg font-semibold">Recent account activity</h2>
    <ul className="divide-y divide-border">{activity.map(item => <li key={item.id} className="flex items-start gap-3 py-4"><Clock3 size={16} className="mt-1 shrink-0 text-muted-foreground" /><div className="min-w-0"><p className="text-sm">{item.details}</p><p className="mt-1 text-xs text-muted-foreground"><time dateTime={item.createdAt}>{date(item.createdAt)} · {formatNepalTime(item.createdAt)}</time> · Nepal time</p></div></li>)}</ul>
    {!activity.length && <p className="py-6 text-sm text-muted-foreground">No account activity yet.</p>}
    {pagination.totalPages > 1 && <nav aria-label="Account activity pages" className="mt-5 flex flex-wrap items-center justify-between gap-3 border-t border-border pt-5">
      {pagination.page > 1 ? <Link scroll={false} href={`/student/profile?tab=security&activityPage=${pagination.page - 1}`} className={cn(control, "hover:bg-muted")}><ChevronLeft size={14} />Previous</Link> : <span aria-disabled="true" className={cn(control, "text-muted-foreground opacity-50")}><ChevronLeft size={14} />Previous</span>}
      <span className="text-xs text-muted-foreground" aria-live="polite">Page {pagination.page} of {pagination.totalPages}</span>
      {pagination.page < pagination.totalPages ? <Link scroll={false} href={`/student/profile?tab=security&activityPage=${pagination.page + 1}`} className={cn(control, "hover:bg-muted")}>Next<ChevronRight size={14} /></Link> : <span aria-disabled="true" className={cn(control, "text-muted-foreground opacity-50")}>Next<ChevronRight size={14} /></span>}
    </nav>}
  </CardContent></Card>;
}
