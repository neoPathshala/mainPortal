// Shared by the rendered profile and its loading UI to prevent layout drift.
export const profileWorkspaceLayout = {
  root: "bg-muted/25 py-3 sm:py-4 lg:h-full lg:min-h-0 lg:overflow-hidden",
  grid: "mx-auto grid max-w-7xl gap-4 px-4 sm:px-6 lg:h-full lg:min-h-0 lg:grid-cols-[230px_minmax(0,1fr)] lg:px-8",
  sidebar: "overflow-hidden rounded-2xl border border-border bg-card shadow-sm lg:flex lg:h-full lg:min-h-0 lg:flex-col",
  panel: "flex min-h-0 min-w-0 flex-col rounded-2xl border border-border bg-card px-4 py-5 shadow-sm sm:px-6 lg:h-full",
  scroll: "min-h-0 flex-1 space-y-5 outline-none lg:overflow-y-auto lg:overscroll-contain lg:-mr-6 lg:pr-6 lg:pb-2 [scrollbar-width:thin]",
};
