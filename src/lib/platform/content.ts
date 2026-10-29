import "server-only";
import { randomUUID } from "node:crypto";
import { db } from "@/lib/db";
import { createDatabaseObjectStore } from "./database-object-store";
const objects = createDatabaseObjectStore(db);
function contentKey(key: string) {
  if (!key.startsWith("content/") || key.length > 600 || key.includes("..") || !/^[a-zA-Z0-9_./:-]+$/.test(key)) throw new Error("Invalid content key.");
  return key;
}
export async function readContent<T>(key: string, fallback: T): Promise<T> {
  try { return JSON.parse((await objects.read(contentKey(key))).toString("utf8")) as T; }
  catch (error) { if ((error as NodeJS.ErrnoException).code === "ENOENT") return fallback; throw error; }
}
export async function listContent<T>(prefix: string, suffix = ""): Promise<{ key: string; value: T }[]> {
  contentKey(prefix);
  if (suffix.length > 100 || !/^[a-zA-Z0-9_.-]*$/.test(suffix)) throw new Error("Invalid content suffix.");
  const rows = suffix
    ? await db.$queryRaw<{ key: string; body: Uint8Array }[]>`SELECT "key", "body" FROM "neo"."PlatformObject" WHERE left("key",char_length(${prefix}))=${prefix} AND right("key",char_length(${suffix}))=${suffix} ORDER BY "key"`
    : await db.$queryRaw<{ key: string; body: Uint8Array }[]>`SELECT "key", "body" FROM "neo"."PlatformObject" WHERE left("key",char_length(${prefix}))=${prefix} ORDER BY "key"`;
  return rows.flatMap(row => { try { return [{ key: row.key, value: JSON.parse(Buffer.from(row.body).toString("utf8")) as T }]; } catch { return []; } });
}
// Content and browser invalidation become visible together across all portals.
export async function writeContent(key: string, value: unknown) {
  contentKey(key);
  await db.$transaction(async tx => {
    await createDatabaseObjectStore(tx).write(key, Buffer.from(JSON.stringify(value)));
    const announcement = JSON.stringify({ version: randomUUID(), publishedAt: new Date().toISOString() });
    await tx.siteConfig.upsert({ where: { site: "browser-cache-version" }, create: { site: "browser-cache-version", siteName: "Browser cache", announcement }, update: { announcement } });
  });
}
export const metadataKey = (subject: string, hash: string) => {
  if (!/^[a-z0-9-]{1,120}$/.test(subject) || !/^[a-f0-9]{64}$/.test(hash)) throw new Error("Invalid study metadata key.");
  return `content/study-metadata/${subject}/${hash}.json`;
};
