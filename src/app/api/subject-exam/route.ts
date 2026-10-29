import {subjectCourseUnavailable} from '@/lib/course-availability.server';
import { NextRequest, NextResponse } from "next/server";
import { readContent } from "@/lib/platform/content";

export const dynamic = "force-dynamic";
export async function GET(request: NextRequest) {
  const slug = request.nextUrl.searchParams.get("subject") || "";
  if (!/^[a-z0-9-]{1,120}$/.test(slug)) return NextResponse.json({}, { status: 400 });
  try {
    if(await subjectCourseUnavailable(slug))return NextResponse.json({error:'This course is coming soon.'},{status:403,headers:{'Cache-Control':'private, no-store'}});
    const settings = await readContent<Record<string, unknown>>("content/subject-exam-settings.json", {});
    return NextResponse.json(Object.hasOwn(settings, slug) ? settings[slug] : {}, { headers: { "Cache-Control": "no-store" } });
  } catch { return NextResponse.json({}, { status: 503, headers: { "Cache-Control": "no-store" } }); }
}
