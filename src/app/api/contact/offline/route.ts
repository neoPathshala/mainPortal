import { getContactSettings } from "@/lib/contact-settings";
import { contactOfflineHTML } from "@/lib/contact-offline";

export async function GET() {
  return new Response(contactOfflineHTML(await getContactSettings()), {
    headers: {
      "Content-Type": "text/html; charset=utf-8",
      "Cache-Control": "public, max-age=300, stale-while-revalidate=86400",
      "X-Content-Type-Options": "nosniff",
    },
  });
}
