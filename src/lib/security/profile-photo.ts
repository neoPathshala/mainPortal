import "server-only";
import { persistentStorage } from "@/lib/persistent-storage";
import fs from "node:fs/promises";
import path from "node:path";
import { db } from "@/lib/db";

const directory = path.join(process.cwd(), ".security", "avatars");
export function avatarDirectory() { return directory; }
export async function writeManagedAvatar(name:string,bytes:Buffer) {
  if(!/^[a-f0-9]{64}\.webp$/.test(name))throw new Error("Invalid photo.");
  if(persistentStorage){await persistentStorage.write(`avatars/${name}`,bytes,true);return;}
  await fs.mkdir(directory,{recursive:true,mode:0o700});await fs.writeFile(path.join(directory,name),bytes,{flag:"wx",mode:0o600});
}
export async function readManagedAvatar(name:string) {
  if(!/^[a-f0-9]{64}\.webp$/.test(name))throw new Error("Invalid photo.");
  return persistentStorage?persistentStorage.read(`avatars/${name}`):fs.readFile(path.join(directory,name));
}
export async function deleteManagedAvatar(url: string | null) {
  if (!url || !/^\/api\/account\/photo\/[a-f0-9]{64}\.webp$/.test(url)) return;
  if(persistentStorage){await persistentStorage.remove(`avatars/${path.basename(url)}`);return;}
  await fs.unlink(path.join(directory, path.basename(url))).catch(() => {});
}
export async function saveAvatarReference(userId: string, url: string | null) {
  const old = await db.user.findUniqueOrThrow({ where: { id: userId }, select: { avatarUrl: true } });
  await db.$transaction(async (tx) => {
    const result = await tx.user.updateMany({ where: { id: userId, avatarUrl: old.avatarUrl }, data: { avatarUrl: url } });
    if (result.count !== 1) throw new Error("Profile photo changed. Please try again.");
    await tx.superAdminAuditLog.create({ data: { userId, action: url ? "academic.photo_updated" : "academic.photo_removed", details: url ? "Profile photo updated" : "Profile photo removed", ipAddress: "Not collected" } });
  });
  await deleteManagedAvatar(old.avatarUrl);
}
