export type SearchRecord = { id: string; label: string; href: string; kind: "Subject" | "Resource" | "Question" | "Settings"; detail: string; keywords?: string };
const normalize = (value: string) => value.toLocaleLowerCase().normalize("NFKC").replace(/[^\p{L}\p{N}]+/gu, " ").trim();
export function searchRecords(records: SearchRecord[], query: string, limit = 20): SearchRecord[] {
  const normalized = normalize(query);
  if (normalized.length < 2) return [];
  const words = normalized.split(/\s+/);
  const seen = new Set<string>();
  return records.map(record => {
    const title = normalize(record.label);
    const text = normalize(`${record.label} ${record.detail} ${record.keywords || ""}`);
    const score = words.every(word => text.includes(word)) ? (title === normalized ? 100 : title.startsWith(normalized) ? 70 : title.includes(normalized) ? 50 : 10) + (record.kind === "Question" ? 2 : 0) : 0;
    return { record, score };
  }).filter(item => item.score > 0).sort((a, b) => b.score - a.score || a.record.label.localeCompare(b.record.label)).filter(({ record }) => {
    const key = `${record.kind}:${record.href}:${record.label}`;
    if (seen.has(key)) return false;
    seen.add(key); return true;
  }).slice(0, limit).map(({ record: { keywords: _keywords, ...record } }) => record);
}
