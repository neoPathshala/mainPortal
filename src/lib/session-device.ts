export type SessionClientType = "web" | "pwa";
export const PWA_DEVICE_PREFIX = "PWA · ";

export function detectSessionClient(): SessionClientType {
  // PWA support is deferred; all launches use browser sessions for this release.
  return "web";
}

export function sessionCookieName(browserCookie:string,client:SessionClientType){return client==='pwa'?`${browserCookie}_pwa`:browserCookie;}
