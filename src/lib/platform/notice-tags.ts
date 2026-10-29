export function normalizeNoticeTags(value: unknown): string[] {
  if (value === undefined || value === null || value === "") return [];
  const values = typeof value === "string" ? value.split(",") : value;
  if (!Array.isArray(values) || values.some(tag => typeof tag !== "string")) throw new Error("Enter tags separated by commas.");
  const unique = new Map<string, string>();
  for (const value of values) {
    const tag = value.trim().replace(/\s+/g, " ");
    if (!tag) continue;
    if (tag.length > 40 || /[\u0000-\u001f\u007f]/.test(tag)) throw new Error("Each tag must be 40 characters or fewer.");
    if (!unique.has(tag.toLowerCase())) unique.set(tag.toLowerCase(), tag);
  }
  if (unique.size > 10) throw new Error("Add up to 10 tags per notice.");
  return [...unique.values()];
}

// Existing notice categories remain available as filters for older notices.
export function noticeTags(notice: { category?: string; tags?: unknown }): string[] {
  let tags: string[] = [];
  try { tags = normalizeNoticeTags(notice.tags); } catch { /* Ignore malformed legacy tags. */ }
  const values = [notice.category, ...tags].filter((tag): tag is string => typeof tag === "string" && !!tag.trim());
  return values.filter((tag, index) => values.findIndex(value => value.toLowerCase() === tag.toLowerCase()) === index);
}
