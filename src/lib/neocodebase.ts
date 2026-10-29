export const neoCodeBaseLinks = {
  home: 'https://code.neopathshala.com',
  courses: 'https://code.neopathshala.com/courses',
  playground: 'https://code.neopathshala.com/playground',
  mysql: 'https://code.neopathshala.com/mysql',
} as const;

/** Match subject identity, not arbitrary note text or unrelated mentions of programming. */
export function codingCompanion(subjectName: string, subjectSlug: string) {
  const identity = `${subjectName} ${subjectSlug}`.toLowerCase().replace(/[-_]+/g, ' ');
  if (/\bmysql\b|\bdbms\b|\bdatabase management(?: systems?)?\b|\bdatabase systems?\b/.test(identity)) {
    return {title: 'Put your database notes into practice.', topic: 'MySQL', courseURL: neoCodeBaseLinks.mysql};
  }
  return null;
}
