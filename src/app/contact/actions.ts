"use server";
import { assertSameOrigin, requireSession, rateLimit } from "@/lib/security/auth";
import { saveStudentSubmission } from "@/lib/security/student-submissions";
export async function submitContactMessage(data: FormData) {
  try {
    await assertSameOrigin();
    const { user } = await requireSession();
    const topic = data.get("topic");
    const title = data.get("title");
    const body = data.get("message");
    const emailInput = data.get("email");
    const phoneInput = data.get("phone");
    if (typeof emailInput !== "string" || emailInput.length > 254 || !/^[^\s@<>]+@[^\s@<>]+\.[^\s@<>]+$/.test(emailInput.trim()) || /[\r\n\x00-\x1f]/.test(emailInput)) return { error: "Enter a valid email address." };
    if (phoneInput !== null && typeof phoneInput !== "string") return { error: "Enter a valid phone number or leave it blank." };
    const phone = typeof phoneInput === "string" ? phoneInput.trim() : "";
    if (phone && (phone.length > 25 || !/^\+?[0-9 ()-]+$/.test(phone) || phone.replace(/\D/g, "").length < 7 || phone.replace(/\D/g, "").length > 15)) return { error: "Enter a valid phone number or leave it blank." };
    const contact = { email: emailInput.trim().toLowerCase(), ...(phone ? { phone } : {}) };
    if (typeof topic !== "string" || !["Account support","Resources & content","Support & contributions","Feedback","Other"].includes(topic)) return { error:"Choose a valid topic." };
    if (typeof title !== "string" || title.trim().length < 5 || title.length > 140 || typeof body !== "string" || body.trim().length < 20 || body.length > 5000 || /[\x00-\x08\x0b\x0c\x0e-\x1f\x7f]/.test(title + body)) return { error:"Add a subject (5–140 characters) and message (20–5,000 characters)." };
    await rateLimit(`contact:${user.id}`,5,3600_000);
    const receipt = await saveStudentSubmission(user.id,{ kind:"contact",title:title.trim(),body:body.trim(),course:"",semester:0,subject:topic,contact });
    return { id:receipt.id };
  } catch (error) {
    const message = error instanceof Error ? error.message : "";
    return { error:/^(Sign in|Too many requests|Request not allowed)/.test(message) ? message : "Your message could not be saved. Please try again later." };
  }
}
