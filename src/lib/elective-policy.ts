export function electiveSelectionError(course: string, semester: number | null, selected: string[], available: { slug: string; electiveGroup?: string }[]): string | null {
  if (!Array.isArray(selected) || selected.some(slug => typeof slug !== "string" || !available.some(subject => subject.slug === slug)) || new Set(selected).size !== selected.length) return "Choose valid elective subjects.";
  if (course !== "csit" || !semester || semester < 5 || semester > 8) return null;
  if (semester < 8) return selected.length === 1 ? null : "Choose exactly one elective subject for this semester.";
  const groups = selected.map(slug => available.find(subject => subject.slug === slug)?.electiveGroup);
  return selected.length === 2 && groups.includes("Elective IV") && groups.includes("Elective V") ? null : "Choose one subject from Elective IV and one from Elective V.";
}

// A single-card selection replaces only its own group, preserving other groups.
export function replaceElectiveSelection(selected: string[], slug: string, available: { slug: string; electiveGroup?: string }[]): string[] {
  const choice = available.find(subject => subject.slug === slug);
  if (!choice) throw new Error("Choose a valid elective subject.");
  const group = choice.electiveGroup || "Elective";
  return [...new Set(selected.filter(current => {
    const subject = available.find(item => item.slug === current);
    return subject && (subject.electiveGroup || "Elective") !== group;
  })), slug];
}
