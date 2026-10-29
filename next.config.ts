import {assetCDNOrigin} from './src/lib/asset-cdn';
import type { NextConfig } from "next";
const nextConfig: NextConfig = {
 assetPrefix:assetCDNOrigin(process.env.NEXT_PUBLIC_STATIC_CDN_ORIGIN),
  distDir: process.env.NEOPATHSHALA_BUILD_DIR || (process.env.NODE_ENV === "development" ? ".next-webpack" : ".next"),
  env: { NEXT_PUBLIC_ENTRANCE_PORTAL_URL: process.env.NEXT_PUBLIC_ENTRANCE_PORTAL_URL || process.env.ENTRANCE_PORTAL_URL || (process.env.NODE_ENV === "production" ? "https://entrance.neopathshala.com" : "http://localhost:3002") },
  turbopack: { root: __dirname },
  poweredByHeader: false,
  outputFileTracingRoot: __dirname,
  outputFileTracingExcludes: { "/*": ["./.security/**"] },
  experimental: { authInterrupts: true, serverActions: { bodySizeLimit: "4mb" } },
  images: {
    formats: ["image/avif", "image/webp"],
    minimumCacheTTL: 86400,
    dangerouslyAllowSVG: false,
    dangerouslyAllowLocalIP: false,
    remotePatterns: [
      { protocol: "https", hostname: "images.unsplash.com" },
      { protocol: "https", hostname: "i.ytimg.com" },
      { protocol: "https", hostname: "img.youtube.com" },
    ],
  },
  async redirects() {
    return [
      { source: "/courses/bsc-csit/:path*", destination: "/csit/:path*", permanent: true },
      { source: "/bsc-csit/:path*", destination: "/csit/:path*", permanent: true },
      { source: "/courses/:courseSlug/:semesterSlug/:subjectSlug/:section", destination: "/:courseSlug/:semesterSlug/:subjectSlug/:section", permanent: true },
      { source: "/courses/:courseSlug/:semesterSlug/:subjectSlug", destination: "/:courseSlug/:semesterSlug/:subjectSlug", permanent: true },
      { source: "/courses/:courseSlug/:semesterSlug", destination: "/:courseSlug/:semesterSlug", permanent: true },
      { source: "/courses/:courseSlug", destination: "/:courseSlug", permanent: true },
    ];
  },
  async headers() {
    return [{ source: "/:path*", headers: [
      { key: "X-Content-Type-Options", value: "nosniff" },
      { key: "X-Frame-Options", value: "DENY" },
      { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
      { key: "Permissions-Policy", value: "camera=(), microphone=(), geolocation=(), payment=(), usb=()" },
      ...(process.env.NODE_ENV === "production" ? [{ key: "Strict-Transport-Security", value: "max-age=31536000" }] : []),
    ] },
    // Mutable public artwork is fresh for a day; hashed Next.js icon bundles
    // already receive a one-year immutable cache from the framework.
    { source: "/:asset(logo\\.webp|logo\\.png|favicon\\.ico)", headers: [{ key: "Cache-Control", value: "public, max-age=31536000" }] },
    { source: "/icons/:path*", headers: [{ key: "Cache-Control", value: "public, max-age=31536000" }] },
    { source: "/:icon([^/]+\\.svg)", headers: [{ key: "Cache-Control", value: "public, max-age=31536000" }] },
    { source: "/uploads/:image([^/]+\\.(?:webp|png|jpe?g))", headers: [{ key: "Cache-Control", value: "public, max-age=31536000" }] },
    { source: "/sw.js", headers: [{ key: "Cache-Control", value: "no-cache" }] },
    { source: "/resources", headers: [{ key: "Cache-Control", value: "private, no-store" }] },
    { source: "/uploads/:document([^/]+\\.pdf)", headers: [{ key: "Cache-Control", value: "public, max-age=31536000" }] },
    { source: "/uploads/:path*", headers: [{ key: "Content-Security-Policy", value: "default-src 'none'; sandbox" }, { key: "X-Content-Type-Options", value: "nosniff" }] }];
  },
};
export default nextConfig;
