// Enable these when the planned sections are ready to release.
export const RELEASE_FEATURES = { subscriptions: false, blogs: false };

export function isReleasedLink(href: string): boolean {
  const pathname = href.split(/[?#]/)[0];
  if (!RELEASE_FEATURES.blogs && /^\/(articles|blog|blogs|blogpost|blogposts)(\/|$)/.test(pathname)) return false;
  if (!RELEASE_FEATURES.subscriptions && (/^\/(subscriptions|pro|checkout|order)(\/|$)/.test(pathname) || (pathname === "/student/profile" && /[?&]tab=orders(?:&|$)/.test(href)))) return false;
  return true;
}
