export const offlinePolicyKey = 'platform:offline-policy:v1';
export const offlinePlatforms = ['main', 'admin'] as const;
export const offlineModes = ['browser', 'pwa'] as const;
export const offlineDevices = ['desktop', 'mobile'] as const;
export type OfflinePlatform = typeof offlinePlatforms[number];
export type OfflineMode = typeof offlineModes[number];
export type OfflineDevice = typeof offlineDevices[number];
export type OfflinePolicy = Record<OfflinePlatform, Record<OfflineMode, Record<OfflineDevice, boolean>>>;
export function defaultOfflinePolicy(): OfflinePolicy {
  return { main: { browser: { desktop: false, mobile: false }, pwa: { desktop: true, mobile: true } }, admin: { browser: { desktop: true, mobile: true }, pwa: { desktop: true, mobile: true } } };
}
export function parseOfflinePolicy(value: unknown): OfflinePolicy {
  if (!value || typeof value !== 'object') throw new Error('Invalid offline settings.');
  const policy = defaultOfflinePolicy();
  for (const platform of offlinePlatforms) for (const mode of offlineModes) for (const device of offlineDevices) {
    const flag = (value as OfflinePolicy)[platform]?.[mode]?.[device];
    if (typeof flag !== 'boolean') throw new Error('Choose every offline access setting.');
    policy[platform][mode][device] = flag;
  }
  return policy;
}
export function offlineClientKind(userAgent: string, installed: boolean) {
  return { mode: installed ? 'pwa' as const : 'browser' as const, device: /Android|iPhone|iPad|iPod|Mobile/i.test(userAgent) ? 'mobile' as const : 'desktop' as const };
}
