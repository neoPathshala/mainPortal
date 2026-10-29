import 'server-only';
import { db } from './db';
import { defaultOfflinePolicy, offlinePolicyKey, parseOfflinePolicy } from './offline-policy';
export async function readOfflineSettings() {
  const record = await db.platformObject.findUnique({ where: { key: offlinePolicyKey } });
  return { policy: record ? parseOfflinePolicy(JSON.parse(Buffer.from(record.body).toString())) : defaultOfflinePolicy(), revision: record?.updatedAt.toISOString() || '' };
}
