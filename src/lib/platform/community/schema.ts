export const feedbackCategories = ["Found a bug?", "Found a mistake?", "Regarding content improvement", "UI improvement", "Feature request", "Missing study materials", "Performance or loading issue", "Account or sign-in issue", "Appreciation", "Others"] as const;
export interface Supporter { id: string; name: string; amount: number; date: string; message: string; anonymous: boolean }
export interface PaymentMethod {id:string;label:string;accountName:string;accountNumber:string;qrFile:string;enabled:boolean}
export interface SupportSettings { mission: string; paymentLabel: string; accountName: string; accountNumber: string; qrFile: string; supporters: Supporter[]; paymentMethods?:PaymentMethod[] }
export const DEFAULT_SUPPORT: SupportSettings = { mission: "Your support helps keep neoPathshala online, updated, and accessible to students across Nepal.", paymentLabel: "Scan to support", accountName: "", accountNumber: "", qrFile: "", supporters: [] };
export interface FeedbackRecord {
  id: string; userId: string; name: string; email: string; anonymous: boolean;
  title: string; category?: typeof feedbackCategories[number]; body: string; createdAt: string; status: "pending" | "published" | "hidden";
  reply: string; repliedAt: string; replyRole?: string; cloudLink: string;
  attachment?: { file: string; name: string; type: string; size: number };
}
export function text(value: unknown, min: number, max: number): string {
  if (typeof value !== "string" || value.trim().length < min || value.length > max || /[\x00-\x08\x0b\x0c\x0e-\x1f\x7f]/.test(value)) throw new Error(`Use ${min}–${max} characters.`);
  return value.trim();
}
export function cloudURL(value: unknown): string {
  const input = text(value, 0, 1500);
  if (!input) return "";
  let url: URL;
  try { url = new URL(input); } catch { throw new Error("Enter a valid HTTPS cloud storage link."); }
  if (url.protocol !== "https:" || url.username || url.password || /[\s\x00-\x1f]/.test(input) || !url.hostname.includes(".") || url.hostname === "localhost") throw new Error("Enter a valid HTTPS cloud storage link.");
  return url.href;
}
export function parseSupport(value: unknown): SupportSettings {
  if (!value || typeof value !== "object") throw new Error("Invalid support settings.");
  const v = value as SupportSettings;
  if (!Array.isArray(v.supporters) || v.supporters.length > 1000) throw new Error("Use up to 1,000 supporters.");
  const ids = new Set<string>();
  const methodIds=new Set<string>();
  if(v.paymentMethods!==undefined&&(!Array.isArray(v.paymentMethods)||v.paymentMethods.length>10))throw new Error('Use up to 10 payment QR options.');
  const paymentMethods=v.paymentMethods?.map(method=>{if(!method||!/^[a-f0-9-]{36}$/.test(method.id)||methodIds.has(method.id))throw new Error('Invalid payment option.');methodIds.add(method.id);if(!/^[a-f0-9-]{36}\.(png|jpg|webp)$/.test(method.qrFile)||typeof method.enabled!=='boolean')throw new Error('Choose a valid QR image and visibility.');return {id:method.id,label:text(method.label,1,80),accountName:text(method.accountName,0,120),accountNumber:text(method.accountNumber,0,120),qrFile:method.qrFile,enabled:method.enabled};});
  return {...(paymentMethods!==undefined?{paymentMethods}:{}), mission: text(v.mission, 10, 1000), paymentLabel: text(v.paymentLabel, 1, 80), accountName: text(v.accountName, 0, 120), accountNumber: text(v.accountNumber, 0, 120), qrFile: v.qrFile && /^[a-f0-9-]{36}\.(png|jpg|webp)$/.test(v.qrFile) ? v.qrFile : "", supporters: v.supporters.map(s => {
    if (!s || !/^[a-f0-9-]{36}$/.test(s.id) || ids.has(s.id)) throw new Error("Invalid supporter identifier.");
    ids.add(s.id);
    if (!Number.isFinite(s.amount) || s.amount < 0 || s.amount > 10000000 || Math.abs(Math.round(s.amount * 100) - s.amount * 100) > 0.000001) throw new Error("Enter a valid amount with up to two decimals.");
    if (!/^\d{4}-\d{2}-\d{2}$/.test(s.date) || !Number.isFinite(Date.parse(s.date)) || new Date(s.date).toISOString().slice(0, 10) !== s.date) throw new Error("Enter a valid contribution date.");
    return { id: s.id, name: text(s.name, 1, 100), amount: s.amount, date: s.date, message: text(s.message, 0, 500), anonymous: s.anonymous === true };
  }) };
}
export function publicFeedback(record: FeedbackRecord) {
  return { id: record.id, name: record.anonymous ? "Anonymous student" : record.name, title: record.title, category: feedbackCategories.includes(record.category as typeof feedbackCategories[number])?record.category:undefined, body: record.body, createdAt: record.createdAt, reply: record.reply, repliedAt: record.repliedAt, replyRole: ["OWNER","MANAGER","EDITOR","SUPPORT"].includes(record.replyRole||"")?record.replyRole:"", avatarUrl: record.anonymous?"":`/api/feedback/avatar?id=${encodeURIComponent(record.id)}` };
}
export function imageType(bytes: Uint8Array): "png" | "jpg" | "webp" | null {
  if ([137,80,78,71,13,10,26,10].every((v,i) => bytes[i] === v)) return "png";
  if (bytes[0] === 255 && bytes[1] === 216 && bytes[2] === 255) return "jpg";
  if (String.fromCharCode(...bytes.slice(0,4)) === "RIFF" && String.fromCharCode(...bytes.slice(8,12)) === "WEBP") return "webp";
  return null;
}

export interface SupportReceipt {
  id: string; userId: string; name: string; email: string; amount: number; message: string;
  publicConsent: boolean; createdAt: string; status: "pending" | "reviewed" | "hidden";
  transactionCode?: string;
  attachment?: { file: string; name: string; type: string; size: number };
}

export function supportHistory(records: SupportReceipt[], userId: string, requestedPage?: string) {
  const owned = userId ? records.filter(record => record.userId === userId).sort((a,b) => b.createdAt.localeCompare(a.createdAt)) : [];
  const totalPages = Math.max(1,Math.ceil(owned.length/5));
  const parsed = requestedPage && /^[1-9]\d{0,6}$/.test(requestedPage) ? Number(requestedPage) : 1;
  const page = Math.min(totalPages,parsed);
  return { page,totalPages,total:owned.length,submittedTotal:owned.reduce((sum,r) => sum+r.amount,0),reviewedTotal:owned.filter(r => r.status === "reviewed").reduce((sum,r) => sum+r.amount,0),items:owned.slice((page-1)*5,page*5).map(r => ({id:r.id,transactionCode:r.transactionCode||"",hasAttachment:!!r.attachment,amount:r.amount,message:r.message,createdAt:r.createdAt,status:r.status,anonymous:!r.publicConsent})) };
}

export function supportPaymentMethods(settings:SupportSettings):PaymentMethod[]{return settings.paymentMethods!==undefined?settings.paymentMethods:settings.qrFile?[{id:'00000000-0000-4000-8000-000000000001',label:settings.paymentLabel,accountName:settings.accountName,accountNumber:settings.accountNumber,qrFile:settings.qrFile,enabled:true}]:[];}
