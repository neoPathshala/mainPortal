const entranceURL = new URL(process.env.NEXT_PUBLIC_ENTRANCE_PORTAL_URL || (process.env.NODE_ENV === "production" ? "https://entrance.neopathshala.com" : "http://localhost:3002"));
if (!["http:", "https:"].includes(entranceURL.protocol)) throw new Error("Invalid entrance portal URL.");

export const ENTRANCE_PORTAL_URL = entranceURL.href;
export function entrancePortalHref(path: string) {
  return new URL(path, ENTRANCE_PORTAL_URL).href;
}
