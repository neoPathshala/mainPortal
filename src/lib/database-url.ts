/** Preserve pg's existing certificate and hostname verification explicitly. */
export function explicitDatabaseSsl(connectionString: string): string {
  if (!connectionString) return connectionString;
  try {
    const url = new URL(connectionString);
    if (!["postgres:", "postgresql:"].includes(url.protocol)) return connectionString;
    // An explicitly selected libpq compatibility mode has its own semantics.
    if (url.searchParams.get("uselibpqcompat") === "true") return connectionString;
    const mode = url.searchParams.get("sslmode");
    if (mode && ["prefer", "require", "verify-ca"].includes(mode)) {
      url.searchParams.set("sslmode", "verify-full");
      return url.toString();
    }
  } catch { /* Let the database driver report invalid configuration without logging secrets. */ }
  return connectionString;
}
