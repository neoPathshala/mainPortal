// Keep this module self-contained in each portal so they deploy independently.
const mediaIdPattern = /^[a-f0-9-]{36}$/;
const mediaRoutePattern = /^\/api\/(resource-pdfs|resource-videos|question-images|banner-media|site-assets|imported-media)\/([a-f0-9-]{36})$/;
type CanonicalMediaKind = 'resource-pdfs' | 'resource-videos' | 'question-images';

function configuredMediaAppOrigin() {
  try {
    return process.env.NEXT_PUBLIC_MEDIA_APP_ORIGIN
      || process.env.NEXT_PUBLIC_PDF_APP_ORIGIN
      || '';
  } catch {
    // Unconfigured browser/test runtimes must retain the original links.
    return '';
  }
}

function mediaAppOrigin() {
  return configuredMediaAppOrigin() || 'https://admin.neopathshala.com';
}

function isLocalAppOrigin(origin: string) {
  try {
    const url = new URL(origin);
    return (url.protocol === 'http:' || url.protocol === 'https:')
      && ['localhost', '127.0.0.1', '[::1]'].includes(url.hostname);
  } catch {
    return false;
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

function directMediaOrigin() {
  try {
    const url = new URL(process.env.NEXT_PUBLIC_MEDIA_DIRECT_ORIGIN || '');
    return url.protocol === 'https:' && url.pathname === '/' && !url.username
      && !url.password && !url.search && !url.hash ? url.origin : '';
  } catch {
    return '';
  }
}

function rewritePublicMediaLink(value: string, appOrigin: string, aliasOrigin: string) {
  try {
    const url = new URL(value, value.startsWith('/api/') ? appOrigin : undefined);
    const [, kind, id] = url.pathname.match(mediaRoutePattern) || [];
    // Localhost links can be saved by an admin working against the shared database.
    // They must resolve through public delivery when it is configured.
    if (id && (url.origin === new URL(appOrigin).origin || isLocalAppOrigin(url.origin))) {
      if (kind === 'resource-pdfs' && directMediaOrigin()) return directPDFLink(id);
      if (aliasOrigin) return `${aliasOrigin}/${id}`;
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

/** Public alias origin used for uploaded media, when configured. */
export function publicMediaOrigin() {
  return mediaAliasOrigin();
}

/** Direct public R2 origin used while the admin app is not deployed. */
export function publicDirectMediaOrigin() {
  return directMediaOrigin();
}

/** Direct public R2 URL for an uploaded PDF. */
export function directPDFLink(id: string) {
  const origin = directMediaOrigin();
  return origin && mediaIdPattern.test(id) ? `${origin}/resources/pdfs/${id}.pdf` : '';
}

/**
 * Internal records keep a canonical app URL. When the app runs on localhost but a
 * public media app origin is configured, store the public origin instead so records
 * written against the shared database remain reachable after deployment.
 */
export function canonicalMediaAppOrigin(fallbackOrigin: string) {
  try {
    const fallback = new URL(fallbackOrigin).origin;
    if (!isLocalAppOrigin(fallback)) return fallback;
  } catch {
    // Fall through to the configured public origin.
  }
  try {
    const url = new URL(configuredMediaAppOrigin());
    if (url.protocol === 'https:' && url.pathname === '/' && !url.username
      && !url.password && !url.search && !url.hash) return url.origin;
  } catch {
    // Unconfigured runtimes keep the caller-provided origin.
  }
  return fallbackOrigin;
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
