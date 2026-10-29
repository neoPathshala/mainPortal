export const SEARCH_HISTORY_KEY = "neopathshala-search-history";
export function cleanSearchHistory(value: unknown): string[] {
  if (!Array.isArray(value)) return [];
  const seen = new Set<string>();
  return value.filter((item): item is string => typeof item === "string").map(item => item.trim()).filter(item => {
    const key = item.toLowerCase();
    if (item.length < 2 || item.length > 120 || seen.has(key)) return false;
    seen.add(key); return true;
  }).slice(0, 5);
}
export function addSearchHistory(history: string[], query: string): string[] {
  return cleanSearchHistory([query, ...history]);
}
