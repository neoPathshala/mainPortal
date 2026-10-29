import { NextRequest, NextResponse } from "next/server";
import { globalSearch } from "@/lib/global-search";
export const dynamic = "force-dynamic";
export async function GET(request: NextRequest) {
  const query = (request.nextUrl.searchParams.get("q") || "").trim();
  if (query.length < 2) return NextResponse.json({ results: [], partial: false });
  if (query.length > 120) return NextResponse.json({ error: "Use 120 characters or fewer." }, { status: 400 });
  try { return NextResponse.json(await globalSearch(query), { headers: { "Cache-Control": "private, no-store" } }); }
  catch { return NextResponse.json({ error: "Search is unavailable. Please try again." }, { status: 503 }); }
}
