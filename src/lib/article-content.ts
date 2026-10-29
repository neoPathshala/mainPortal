export function articleHeadings(content: string) {
 const counts = new Map<string, number>(); let fenced = false;
 return content.split('\n').flatMap(line => {
  if (/^\s*(```|~~~)/.test(line)) { fenced = !fenced; return []; }
  const match = !fenced && /^(#{2,3})\s+(.+?)\s*#*\s*$/.exec(line);
  if (!match) return [];
  const text = match[2].replace(/!?(?:\[([^\]]*)\])\([^)]*\)/g, '$1').replace(/[*_`~]/g, '');
  const base = text.toLowerCase().trim().replace(/[^\p{L}\p{N}]+/gu, '-').replace(/^-|-$/g, '') || 'section';
  const count = (counts.get(base) || 0) + 1; counts.set(base, count);
  return [{level: match[1].length, text, id: count === 1 ? base : `${base}-${count}`}];
 });
}
export function articleReadMinutes(content: string) { return Math.max(1, Math.ceil(content.trim().split(/\s+/).filter(Boolean).length / 200)); }
export function jsonLdString(data: unknown) { return JSON.stringify(data).replace(/</g, '\\u003c'); }
