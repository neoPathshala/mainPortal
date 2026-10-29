export const chapterTags = ["Hard", "Important", "Slightly hard", "Easy marks", "One shot", "Playlist"] as const;
export const chapterTabs = [
 { type: "notes", label: "Notes", field: "showInNotes" },
 { type: "videos", label: "Videos", field: "showInVideos" },
 { type: "books", label: "Books", field: "showInBooks" },
 { type: "papers", label: "Past papers", field: "showInPapers" },
 { type: "viva", label: "Viva", field: "showInViva" },
 { type: "practical", label: "Practicals", field: "showInPractical" },
 { type: "syllabus", label: "Syllabus", field: "showInSyllabus" },
 { type: "questions", label: "Question resources", field: "showInQuestions" },
] as const;
export type ChapterSettings = { tags: string[] } & Record<typeof chapterTabs[number]["field"], boolean>;
export function contentMetadataKey(entity: "units" | "resources" | "questions" | "notices" | "articles", id: string) { return `catalog-metadata:${entity}:${id}`; }
export function parseContentMetadata(body?: Uint8Array | null): Record<string, unknown> {
 try { const data = JSON.parse(new TextDecoder().decode(body || new Uint8Array())); return data && typeof data === "object" && !Array.isArray(data) ? data : {}; } catch { return {}; }
}
export function chapterSettings(data: Record<string, unknown> = {}): ChapterSettings {
 return { tags: Array.isArray(data.tags) ? data.tags.filter((tag): tag is string => typeof tag === "string" && (chapterTags as readonly string[]).includes(tag)) : [], ...Object.fromEntries(chapterTabs.map(tab => [tab.field, data[tab.field] !== false])) } as ChapterSettings;
}
export function chapterVisible(data: Record<string, unknown>, type: string) {
 const tab = chapterTabs.find(tab => tab.type === type);
 return !tab || data[tab.field] !== false;
}
