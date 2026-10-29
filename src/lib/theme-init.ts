// Run synchronously in <head>, before streamed page content can paint.
// Keep the storage key and system default aligned with next-themes.
export const themeInitScript = `(() => {
  let theme = "system";
  try { theme = localStorage.getItem("theme") || "system"; } catch {}
  const dark = theme === "dark" || (theme !== "light" && window.matchMedia("(prefers-color-scheme: dark)").matches);
  const root = document.documentElement;
  root.classList.remove("light", "dark");
  root.classList.add(dark ? "dark" : "light");
  root.style.colorScheme = dark ? "dark" : "light";
})();`;
