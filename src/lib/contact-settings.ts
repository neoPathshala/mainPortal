import "server-only";
import { cache } from "react";
import fs from "node:fs/promises";
import path from "node:path";
import { tmpdir } from "node:os";
import { randomUUID } from "node:crypto";
import { db } from "./db";
import { CONTACT_SETTINGS_KEY, DEFAULT_CONTACT_SETTINGS, parseContactSettings, type ContactSettings } from "@/lib/platform/contact-settings";

const snapshotPath = path.join(process.env.VERCEL ? tmpdir() : path.join(process.cwd(), ".security"), "contact-settings-cache.json");
let lastKnown: ContactSettings | undefined;
function defaults() {
  const settings = structuredClone(DEFAULT_CONTACT_SETTINGS);
  for (const link of settings.links) {
    const href = process.env[`${link.id.toUpperCase()}_URL`];
    if (!link.enabled && href) { link.href = href; link.value = link.label; link.enabled = true; }
  }
  return parseContactSettings(settings);
}
async function remember(settings: ContactSettings) {
  lastKnown = settings;
  const temporaryPath = `${snapshotPath}.${randomUUID()}.tmp`;
  try {
    await fs.mkdir(path.dirname(snapshotPath), { recursive: true });
    await fs.writeFile(temporaryPath, JSON.stringify(settings), { mode: 0o600 });
    await fs.rename(temporaryPath, snapshotPath);
  } catch { await fs.unlink(temporaryPath).catch(() => {}); }
}
export const getContactSettings = cache(async (): Promise<ContactSettings> => {
  try {
    const row = await db.siteConfig.findUnique({ where: { site: CONTACT_SETTINGS_KEY }, select: { announcement: true } });
    const settings = row?.announcement ? parseContactSettings(JSON.parse(row.announcement)) : defaults();
    await remember(settings);
    return settings;
  } catch {
    if (lastKnown) return lastKnown;
    try {
      lastKnown = parseContactSettings(JSON.parse(await fs.readFile(snapshotPath, "utf8")));
      return lastKnown;
    } catch { return defaults(); }
  }
});
