"use server";
import sharp from "sharp";
import { randomUUID } from "node:crypto";
import { assertSameOrigin, requireSession, rateLimit } from "@/lib/security/auth";
import { feedbackCategories, text, cloudURL, imageType, type FeedbackRecord } from "@/lib/platform/community/schema";
import { writeFeedback, saveCommunityFile, removeCommunityFile } from "@/lib/community-storage";
export async function submitFeedback(data: FormData) {
  let stored = "";
  try {
    await assertSameOrigin();
    const { user } = await requireSession();
    await rateLimit(`feedback:${user.id}`, 5, 3600_000);
    const category=String(data.get("category")||"");
    if(!feedbackCategories.includes(category as typeof feedbackCategories[number]))return {error:"Choose what your feedback is about."};
    const title=category, body=text(data.get("message"),20,5000);
    const cloudLink = cloudURL(data.get("cloudLink") || "");
    if (data.get("consent") !== "on") return { error: "Accept the public feedback guidelines to continue." };
    const record: FeedbackRecord = { id: randomUUID(), userId: user.id, name: user.name || "Student", email: user.email, anonymous: data.get("anonymous") === "on", title, category:category as typeof feedbackCategories[number], body, cloudLink, createdAt: new Date().toISOString(), status: "pending", reply: "", repliedAt: "" };
    const file = data.get("file");
    if (file instanceof File && file.size) {
      if (file.size > 3 * 1024 * 1024) return { error: "Choose a PDF or image up to 3 MB." };
      let bytes: Buffer = Buffer.from(await file.arrayBuffer());
      let extension: string, type: string;
      if (bytes.subarray(0,5).toString() === "%PDF-" && bytes.subarray(Math.max(0,bytes.length-2048)).includes(Buffer.from("%%EOF"))) { extension = "pdf"; type = "application/pdf"; }
      else {
        if (!imageType(bytes)) return { error: "Choose a valid PDF, JPG, PNG, or WebP." };
        bytes = await sharp(bytes, { limitInputPixels: 20_000_000, animated: false }).rotate().resize({ width: 2400, height: 2400, fit: "inside", withoutEnlargement: true }).webp({ quality: 86 }).toBuffer();
        extension = "webp"; type = "image/webp";
      }
      stored = `${record.id}.${extension}`;
      await saveCommunityFile(stored, bytes);
      record.attachment = { file: stored, name: `${file.name.replace(/[\/\\\x00-\x1f\x7f]/g,"_").slice(0,120).replace(/\.[^.]+$/, "") || "attachment"}.${extension}`, type, size: bytes.length };
    } else if (file !== null && !(file instanceof File)) return { error: "Choose a valid attachment." };
    await writeFeedback(record);
    return { id: record.id };
  } catch (error) {
    if (stored) await removeCommunityFile(stored).catch(() => {});
    const message = error instanceof Error ? error.message : "";
    return { error: /^(Use |Enter a valid|Sign in|Too many requests|Request not allowed)/.test(message) ? message : "Your feedback could not be saved. Check your file and try again." };
  }
}
