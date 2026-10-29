export type SubjectCardStats = { chapters: number; difficulty?: "Easy" | "Medium" | "Hard"; preparation?: string };
export type SubjectCardStatsIndex = Record<string, SubjectCardStats>;
export const EMPTY_SUBJECT_STATS: SubjectCardStats = { chapters: 0 };
export function validStudyGuidance(value: unknown): Pick<SubjectCardStats,"difficulty" | "preparation"> {
  if(!value || typeof value !== "object") return {};
  const input=value as Record<string,unknown>;
  const difficulty=input.difficulty === "Easy" || input.difficulty === "Medium" || input.difficulty === "Hard" ? input.difficulty : undefined;
  const preparation=typeof input.preparation === "string" && input.preparation.length <= 60 && !/[\x00-\x1f\x7f]/.test(input.preparation) ? input.preparation.trim() || undefined : undefined;
  return {...(difficulty ? {difficulty} : {}),...(preparation ? {preparation} : {})};
}
