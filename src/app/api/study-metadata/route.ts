import {subjectCourseUnavailable} from '@/lib/course-availability.server';
import { validStudyGuidance } from "@/lib/subject-card-stats";
import { listContent } from "@/lib/platform/content";
import { NextRequest, NextResponse } from "next/server";
export const dynamic = "force-dynamic";
export async function GET(request: NextRequest) {
  const subject = request.nextUrl.searchParams.get("subject") || "";
  if (!/^[a-z0-9-]{1,120}$/.test(subject)) return NextResponse.json({}, { status: 400 });
  try {
    if(await subjectCourseUnavailable(subject))return NextResponse.json({error:'This course is coming soon.'},{status:403,headers:{'Cache-Control':'private, no-store'}});
    const result: Record<string, unknown> = Object.create(null);
    for (const { value: entry } of await listContent<{ entity: string }>(`content/study-metadata/${subject}/`)) {
      if (!entry || typeof entry.entity !== "string" || !/^(subject|chapter:[\w-]+|note:[\w-]+|video:[\w-]+|question:[\w-]+)$/.test(entry.entity) || entry.entity.length > 160) continue;
      result[entry.entity] = validStudyGuidance(entry);
    }
    return NextResponse.json(result, { headers: { "Cache-Control": "no-store" } });
  } catch { return NextResponse.json({}, { status: 503, headers: { "Cache-Control": "no-store" } }); }
}
