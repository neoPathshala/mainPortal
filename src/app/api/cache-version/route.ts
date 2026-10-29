import {coursesComingSoon} from '@/lib/course-availability';
import { db } from "@/lib/db";
export const dynamic = "force-dynamic";
export async function GET() {
  try {
    const record = await db.siteConfig.findUnique({ where: { site: "browser-cache-version" }, select: { announcement: true } });
    const data = record?.announcement ? JSON.parse(record.announcement) : { version: "mainpanel-v2" };
    return Response.json({ version: `${data.version}:courses-${coursesComingSoon?'coming-soon':'open'}-v1` }, { headers: { "Cache-Control": "no-store" } });
  } catch {
    return Response.json({ error: "Cache version unavailable" }, { status: 503, headers: { "Cache-Control": "no-store" } });
  }
}
