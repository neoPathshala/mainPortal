export const ACTIVITY_PAGE_SIZE = 5;

export function activityPagination(rawPage: string | undefined, total: number) {
  const totalPages = Math.max(1, Math.ceil(total / ACTIVITY_PAGE_SIZE));
  const requested = rawPage && /^[1-9]\d*$/.test(rawPage) ? Number(rawPage) : 1;
  const page = Math.min(Number.isSafeInteger(requested) ? requested : 1, totalPages);
  return { page, totalPages, total, skip: (page - 1) * ACTIVITY_PAGE_SIZE, take: ACTIVITY_PAGE_SIZE };
}
