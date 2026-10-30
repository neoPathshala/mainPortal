import {coursesComingSoon,isCourseStudyAPI} from '@/lib/course-availability';
import {hasEncodedRequestBody} from '@/lib/request-encoding';
import {configuredCDNOrigins} from '@/lib/cdn-settings';
import {assetCDNOrigin} from '@/lib/asset-cdn';
import {publicDirectMediaOrigin,publicMediaOrigin} from '@/lib/pdf-link-origin';
import { NextRequest, NextResponse } from "next/server";

export function proxy(request: NextRequest) {

 if(coursesComingSoon && isCourseStudyAPI(request.nextUrl.pathname))return NextResponse.json({error:"Courses are coming soon."},{status:403,headers:{"Cache-Control":"private, no-store"}});
 if(hasEncodedRequestBody(request.headers))return NextResponse.json({error:'Compressed request bodies are not supported.'},{status:415,headers:{'Cache-Control':'private, no-store','X-Content-Type-Options':'nosniff'}});
 const legacy=/^\/(?:courses\/)?[^/]+\/semester-([1-8])(?=\/|$)/.exec(request.nextUrl.pathname);
 if(legacy){const destination=request.nextUrl.clone();destination.pathname=destination.pathname.replace(/\/semester-([1-8])(?=\/|$)/,'/sem-$1');return NextResponse.redirect(destination,308);}

  if (request.nextUrl.pathname === "/api/pdf") {
    const response = NextResponse.next();
    response.headers.set("X-Frame-Options", "SAMEORIGIN");
    response.headers.set("Content-Security-Policy", "default-src 'none'; frame-ancestors 'self'");
    return response;
  }
  const nonce = Buffer.from(crypto.randomUUID()).toString("base64");
  const dev = process.env.NODE_ENV !== "production";
  const staticCDN=assetCDNOrigin(process.env.NEXT_PUBLIC_STATIC_CDN_ORIGIN)||'';
  const mediaAlias=publicMediaOrigin();
  const mediaDirect=publicDirectMediaOrigin();
  const csp = [
    "default-src 'self'", `script-src 'self' 'wasm-unsafe-eval' 'nonce-${nonce}' 'strict-dynamic'${dev ? " 'unsafe-eval'" : ""}`,
    `style-src 'self' 'unsafe-inline' ${staticCDN}`, // Motion and theme components need inline styles; scripts require a nonce.
    "img-src 'self' data: blob: https:" + (dev ? " http://localhost:3000" : ""), `font-src 'self' ${staticCDN}`, `connect-src 'self' ${staticCDN} ${mediaAlias} ${mediaDirect} ${configuredCDNOrigins(process.env.MEDIA_CDN_ORIGIN,process.env.MEDIA_CDN_FALLBACK_ORIGINS).join(' ')} https://admin.neopathshala.com https://*.r2.cloudflarestorage.com` + (dev ? " ws: wss: http://localhost:3000" : ""),
    "frame-src 'self' blob: https://www.youtube.com https://www.youtube-nocookie.com https://drive.google.com https://docs.google.com https://admin.neopathshala.com https://*.r2.cloudflarestorage.com https://portal.tu.edu.np https://iost.tu.edu.np" + (dev ? " http://localhost:3000" : ""),
    "media-src 'self' blob: https:" + (dev ? " http://localhost:3000" : ""), "worker-src 'self' blob:", "object-src 'none'", "base-uri 'self'", "form-action 'self'", "frame-ancestors 'none'",
    ...(dev ? [] : ["upgrade-insecure-requests"]),
  ].join("; ");
  const requestHeaders = new Headers(request.headers);
  requestHeaders.set("x-nonce", nonce);
  requestHeaders.set("x-session-client","web");
  requestHeaders.set('x-request-path',request.nextUrl.pathname);
  const device=request.headers.get('x-session-device');
  requestHeaders.set('x-session-device',device==='mobile'||device!=='desktop'&&/Android|iPhone|iPad|iPod|Mobile/i.test(request.headers.get('user-agent')||'')?'mobile':'desktop');
  requestHeaders.set("Content-Security-Policy", csp);
  const response = NextResponse.next({ request: { headers: requestHeaders } });
  response.headers.set("Content-Security-Policy", csp);
  if (/^\/(notices|student|checkout|order|contribute-assets|ask-question|contact|feedback|support-us|api\/account)(\/|$)/.test(request.nextUrl.pathname)||request.nextUrl.pathname==="/resources") response.headers.set("Cache-Control", "private, no-store");
  return response;
}
export const config = { matcher: ["/api/:path*","/resources/:path*","/uploads/:path*","/((?!_next/static|_next/image|favicon.ico|uploads/|resources/.*\\.|.*\\.(?:png|jpg|jpeg|webp|svg|ico|woff2?|js|css)$).*)"] };
