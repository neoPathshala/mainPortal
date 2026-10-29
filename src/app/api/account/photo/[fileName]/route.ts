import { getSession } from "@/lib/security/auth";
import { readManagedAvatar } from "@/lib/security/profile-photo";

export async function GET(_request: Request, { params }: { params: Promise<{ fileName: string }> }) {
  const privateHeaders = { "Cache-Control": "private, max-age=31536000, immutable", "X-Content-Type-Options": "nosniff" };
  const errorHeaders = { "Cache-Control": "private, no-store", "X-Content-Type-Options": "nosniff" };
  try {
    const { fileName } = await params;
    if (!/^[a-f0-9]{64}\.webp$/.test(fileName)) return new Response(null, { status: 404, headers: errorHeaders });
    const auth = await getSession();
    if (!auth || auth.user.avatarUrl !== `/api/account/photo/${fileName}`) return new Response(null, { status: 404, headers: errorHeaders });
    const bytes = await readManagedAvatar(fileName);
    return new Response(new Uint8Array(bytes), { headers: { ...privateHeaders, "Content-Type": "image/webp", "Content-Length": String(bytes.length) } });
  } catch { return new Response(null, { status: 404, headers: errorHeaders }); }
}
