import type { MetadataRoute } from "next";
import { sitemapPaths } from "@/lib/site-map";
export const dynamic = "force-dynamic";
export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const configured = process.env.APP_ORIGIN;
  if (!configured) return [];
  const origin = new URL(configured);
  if (!["http:", "https:"].includes(origin.protocol)) return [];
  return (await sitemapPaths()).map(path => ({ url: new URL(path, origin.origin).href }));
}
