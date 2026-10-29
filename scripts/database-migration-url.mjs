export const DATABASE_SCHEMA = "neo";
export function migrationDatabaseURL(databaseURL, directURL) {
  const value = directURL || databaseURL;
  if (!value) return "";
  let url;
  try {
    url = new URL(value);
  } catch {
    throw new Error("Set a valid PostgreSQL migration URL.");
  }
  if (!["postgres:", "postgresql:"].includes(url.protocol))
    throw new Error("Set a valid PostgreSQL migration URL.");
  // Neon migration connections bypass the transaction pooler. Explicit migration
  // credentials/hosts take precedence over the application connection.
  if (
    !directURL &&
    /^ep-[a-z0-9-]+-pooler\.[a-z0-9.-]+\.neon\.tech$/i.test(url.hostname)
  )
    url.hostname = url.hostname.replace(/-pooler(?=\.)/i, "");
  url.searchParams.delete("pgbouncer");
  url.searchParams.delete("pool_timeout");
  const requested = Number(url.searchParams.get("connect_timeout"));
  url.searchParams.set(
    "connect_timeout",
    String(
      Number.isFinite(requested) && requested >= 15 && requested <= 60
        ? Math.ceil(requested)
        : 30,
    ),
  );
  url.searchParams.set("schema", DATABASE_SCHEMA);
  return url.toString();
}

export function verifiedMigrationConnection(url) {
  const value = new URL(url);
  if (
    ["require", "prefer", "verify-ca"].includes(
      value.searchParams.get("sslmode"),
    )
  )
    value.searchParams.set("sslmode", "verify-full");
  return value.toString();
}
