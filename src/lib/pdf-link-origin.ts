// Keep this module self-contained in each portal so they deploy independently.
const mediaIdPattern = /^[a-f0-9-]{36}$/;
const mediaRoutePattern = /^\/api\/(?:resource-pdfs|resource-videos|question-images|banner-media|site-assets|imported-media)\/([a-f0-9-]{36})$/;
type CanonicalMediaKind = 'resource-pdfs' | 'resource-videos' | 'question-images';

function mediaAppOrigin() {
  try {
    return process.env.NEXT_PUBLIC_MEDIA_APP_ORIGIN
      || process.env.NEXT_PUBLIC_PDF_APP_ORIGIN
      || 'https://admin.neopathshala.com';
  } catch {
    // Unconfigured browser/test runtimes must retain the original links.
    return '';
  }
}

function mediaAliasOrigin() {
  try {
    const url = new URL(process.env.NEXT_PUBLIC_MEDIA_LINK_ORIGIN || process.env.NEXT_PUBLIC_PDF_LINK_ORIGIN || '');
    return url.protocol === 'https:' && url.pathname === '/' && !url.username
      && !url.password && !url.search && !url.hash ? url.origin : '';
  } catch {
    return '';
  }
}

function rewritePublicMediaLink(value: string, appOrigin: string, aliasOrigin: string) {
  try {
    // Local uploads must use the local gateway until the deployed backend has these records.
    if(process.env.NODE_ENV==='development')return value;
    const url = new URL(value, value.startsWith('/api/') ? appOrigin : undefined);
    const id = url.pathname.match(mediaRoutePattern)?.[1];
    // Local preview and third-party hosts must never be routed to the public Worker.
    if (id && aliasOrigin && url.origin === new URL(appOrigin).origin) {
      return `${aliasOrigin}/${id}`;
    }
  } catch {
    // Non-URL text is valid input when walking catalog and presentation content.
  }
  return value;
}

/** Rewrites only known upload routes; unsupported URLs and malformed settings pass through. */
export function publicMediaLink(value: string) {
  return rewritePublicMediaLink(value, mediaAppOrigin(), mediaAliasOrigin());
}

function mediaAliasId(value: string) {
  try {
    const origin = mediaAliasOrigin();
    const url = new URL(value);
    const id = url.pathname.slice(1);
    return origin && url.origin === origin && mediaIdPattern.test(id) ? id : '';
  } catch {
    return '';
  }
}

/** Restores an app-owned reference for storage and private, same-origin previews. */
export function canonicalPDFLink(value: string, appOrigin: string) {
  try {
    const id = mediaAliasId(value);
    return id ? `${new URL(appOrigin).origin}/api/resource-pdfs/${id}` : value;
  } catch {
    return value;
  }
}

// Legacy PDF names remain part of the public API, although aliases support all media.
export function isPDFLinkAlias(value: string) {
  return !!mediaAliasId(value);
}

export const publicPDFLink = publicMediaLink;

export function canonicalMediaLink(value: string, appOrigin: string, kind: CanonicalMediaKind = 'resource-pdfs') {
  const canonical = canonicalPDFLink(value, appOrigin);
  return canonical === value ? value : canonical.replace('/api/resource-pdfs/', `/api/${kind}/`);
}

/**
 * Copies JSON-shaped content while rewriting media strings, leaving the input untouched.
 * Read configuration once per tree, not once per leaf. Do not persist it globally:
 * server configuration and test environments can change between calls.
 * This intentionally retains the existing enumerable-property copy behavior for objects.
 */
export function publicMediaValues<T>(value: T): T {
  const appOrigin = mediaAppOrigin();
  const aliasOrigin = mediaAliasOrigin();
  function rewrite(item: unknown): unknown {
    if (typeof item === 'string') return rewritePublicMediaLink(item, appOrigin, aliasOrigin);
    if (Array.isArray(item)) return item.map(rewrite);
    if (item && typeof item === 'object') {
      return Object.fromEntries(Object.entries(item).map(([key, child]) => [key, rewrite(child)]));
    }
    return item;
  }
  return rewrite(value) as T;
}
