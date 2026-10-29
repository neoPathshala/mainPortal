import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { getSession, getSessionCookie, cookieOptions } from "@/lib/security/auth";
import { SESSION_SECONDS } from "@/lib/security/core";

export const dynamic = "force-dynamic";
export async function GET() {
  try {
    const auth = await getSession();
    const response = NextResponse.json({ authenticated: !!auth, sessionId: auth?.session.id || null }, { headers: { "Cache-Control": "private, no-store" } });
    if (auth) {
      const cookieName=await getSessionCookie();
      const token = (await cookies()).get(cookieName)?.value;
      if (token) response.cookies.set(cookieName, token, { ...cookieOptions, maxAge: SESSION_SECONDS });
    }
    return response;
  } catch {
    return NextResponse.json({ error: "Unable to check session" }, { status: 503, headers: { "Cache-Control": "private, no-store" } });
  }
}
