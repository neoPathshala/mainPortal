"use server";
import sharp from "sharp";
import { randomUUID, createHmac } from "node:crypto";
import { headers } from "next/headers";
import { assertSameOrigin, getSession, rateLimit, authSecret } from "@/lib/security/auth";
import { text, imageType, type SupportReceipt } from "@/lib/platform/community/schema";
import { writeSupportReceipt, saveCommunityFile, removeCommunityFile } from "@/lib/community-storage";
export async function submitSupportReceipt(data: FormData) {
  let stored = "";
  try {
    await assertSameOrigin();
    const session = await getSession();
    const name = session ? text(session.user.name,1,100) : text(data.get("name"),1,100);
    const message = text(data.get("message") || "",0,500);
    const amountText = data.get("amount");
    if (typeof amountText !== "string" || !/^\d{1,8}(?:\.\d{1,2})?$/.test(amountText) || Number(amountText) <= 0 || Number(amountText) > 10000000) return { error: "Enter a valid contribution amount in NPR." };
    const code=data.get("transactionCode");
    if(typeof code!=="string"||!code.trim()||code.length>100||/[\x00-\x1f\x7f]/.test(code))return {error:"Enter a valid transaction code (up to 100 characters)."};
    const transactionCode=code.trim();
    const upload=data.get("receipt");
    if(upload&&!(upload instanceof File))return {error:"Choose a valid receipt file."};
    if(upload instanceof File&&upload.size>3*1024*1024)return {error:"Upload a receipt or screenshot up to 3 MB."};
    // The proxy must overwrite forwarded IP headers. A global quota also bounds spoofed guest identities.
    const request = await headers();
    const address = (request.get("x-real-ip") || request.get("x-forwarded-for")?.split(",")[0]?.trim() || "unknown").slice(0,150);
    const identity = session ? `user:${session.user.id}` : `guest:${createHmac("sha256",authSecret()).update(address).digest("hex")}`;
    await rateLimit(`support-receipt:${identity}`,5,3600_000);
    await rateLimit("support-receipt:global",60,3600_000);
    let attachment:SupportReceipt["attachment"];
    if(upload instanceof File&&upload.size){
    let bytes: Buffer = Buffer.from(await upload.arrayBuffer());
    let extension: string, type: string;
    if (bytes.subarray(0,5).toString() === "%PDF-" && bytes.subarray(Math.max(0,bytes.length-2048)).includes(Buffer.from("%%EOF"))) { extension="pdf";type="application/pdf"; }
    else {
      if (!imageType(bytes)) return { error: "Choose a valid PDF, JPG, PNG, or WebP receipt." };
      bytes = await sharp(bytes,{limitInputPixels:20_000_000,animated:false}).rotate().resize({width:2400,height:2400,fit:"inside",withoutEnlargement:true}).webp({quality:86}).toBuffer();
      extension="webp";type="image/webp";
    }
    stored = `${randomUUID()}.${extension}`;
    await saveCommunityFile(stored,bytes);
    attachment={file:stored,name:`receipt.${extension}`,type,size:bytes.length};
    }
    const id=randomUUID();
    const record: SupportReceipt = { id,transactionCode,userId:session?.user.id || "",name,email:session?.user.email || "",amount:Number(amountText),message,publicConsent:data.get("publicConsent") === "on",createdAt:new Date().toISOString(),status:"pending",...(attachment?{attachment}:{}) };
    await writeSupportReceipt(record);
    return { id };
  } catch(error) {
    if(stored) await removeCommunityFile(stored).catch(() => {});
    const message = error instanceof Error ? error.message : "";
    return { error:/^(Use |Too many requests|Request not allowed)/.test(message) ? message : "Your contribution details could not be saved. Please try again." };
  }
}
