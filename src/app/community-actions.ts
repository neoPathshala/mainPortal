"use server";
import { getNavigationCatalog } from "@/lib/catalog.server";

import sharp from "sharp";
import { assertSameOrigin, requireSession, rateLimit } from "@/lib/security/auth";
import { saveStudentSubmission } from "@/lib/security/student-submissions";



function field(data: FormData, name: string, min: number, max: number) {
  const raw = data.get(name);
  if (typeof raw !== "string") throw new Error(`Please check ${name}.`);
  const value = raw.trim();
  if (value.length < min || value.length > max || /[\x00-\x08\x0b\x0c\x0e-\x1f\x7f]/.test(value)) throw new Error(`Please check ${name} (${min}–${max} characters).`);
  return value;
}
export async function submitStudentCommunity(data: FormData) {
  try {
    await assertSameOrigin();
    const { user } = await requireSession();
    const { ACADEMIC_COURSES, getCurriculumSubjects } = await getNavigationCatalog();
    const kind = data.get("kind");
    if (kind !== "question" && kind !== "asset") return { error: "Choose a valid submission type." };
    const course = field(data,"course",1,40);
    if (!Object.hasOwn(ACADEMIC_COURSES, course)) return { error: "Choose a supported course." };
    const semester = Number(data.get("semester"));
    if (!Number.isInteger(semester) || semester < 1 || semester > ACADEMIC_COURSES[course].totalSemesters) return { error: "Choose a valid semester." };
    const subject = field(data,"subject",0,150);
    if (subject && !getCurriculumSubjects(course, semester).some(item => item.name === subject)) return { error: "Choose a subject from this semester." };
    const title = field(data,"title",8,140);
    const body = field(data,"description",20,5000);
    if (data.get("consent") !== "on") return { error: "Please accept the submission guidelines." };
    await rateLimit(`community:${user.id}`, 10, 3600_000);
    let file;
    if (kind === "asset") {
      const upload = data.get("file");
      if (!(upload instanceof File) || !upload.size || upload.size > 3 * 1024 * 1024) return { error: "Choose a PDF or image up to 3 MB." };
      let bytes: Buffer = Buffer.from(await upload.arrayBuffer());
      let extension: string;
      if (bytes.subarray(0,5).toString() === "%PDF-") {
        if (!bytes.subarray(Math.max(0,bytes.length - 2048)).includes(Buffer.from("%%EOF"))) return { error: "This PDF appears incomplete. Choose another file." };
        extension = "pdf";
      } else {
        try {
          const image = sharp(bytes, { limitInputPixels: 20_000_000, animated: false });
          const metadata = await image.metadata();
          if (!metadata.format || !["jpeg", "png", "webp"].includes(metadata.format)) return { error: "Only PDF, JPG, PNG, and WebP are accepted." };
          bytes = await image.rotate().resize({ width: 2400, height: 2400, fit: "inside", withoutEnlargement: true }).webp({ quality: 86 }).toBuffer();
          extension = "webp";
        } catch { return { error: "We couldn’t read this image. Try a JPG, PNG, or WebP." }; }
      }
      file = { bytes, extension, name: upload.name.replace(/[\/\\\x00-\x1f]/g,"_").slice(0,160) };
    }
    const result = await saveStudentSubmission(user.id, { kind, title, body, course, semester, subject }, file);
    return { success: true, id: result.id };
  } catch (error) {
    const message = error instanceof Error ? error.message : "";
    return { error: /^(Sign in|Too many requests|Please check|Request not allowed)/.test(message) ? message : "We couldn’t save your submission. Please try again later." };
  }
}
