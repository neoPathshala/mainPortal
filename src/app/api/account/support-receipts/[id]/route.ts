import { getSession } from "@/lib/security/auth";
import { readSupportReceipt, readCommunityFile } from "@/lib/community-storage";
export async function GET(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const auth=await getSession();
    if(!auth) return new Response(null,{status:404,headers:{"Cache-Control":"private, no-store"}});
    const record=await readSupportReceipt((await params).id);
    if(!record.userId || record.userId !== auth.user.id || !record.attachment) return new Response(null,{status:404,headers:{"Cache-Control":"private, no-store"}});
    const bytes=await readCommunityFile(record.attachment.file);
    return new Response(new Uint8Array(bytes),{headers:{"Content-Type":record.attachment.type,"Content-Disposition":`attachment; filename="receipt.${record.attachment.file.split('.').pop()}"`,"Cache-Control":"private, no-store","X-Content-Type-Options":"nosniff","Content-Security-Policy":"default-src 'none'; sandbox"}});
  }catch{return new Response(null,{status:404,headers:{"Cache-Control":"private, no-store"}});}
}
