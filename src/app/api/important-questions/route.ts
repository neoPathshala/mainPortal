import { NextRequest, NextResponse } from "next/server";
import { publicQuestions } from "@/lib/public-questions";
export const dynamic = "force-dynamic";
export async function GET(request: NextRequest) {
  const subject = request.nextUrl.searchParams.get("subject") || "";
  if (!/^[a-z0-9-]{1,120}$/.test(subject)) return NextResponse.json([], { status: 400 });
  try {
    const { questions } = await publicQuestions(subject);
    return NextResponse.json(questions.filter(item => item.subjectSlug === subject), { headers: { "Cache-Control": "no-store" } });
  } catch { return NextResponse.json({ error: "Unable to load questions" }, { status: 503, headers: { "Cache-Control": "no-store" } }); }
}
