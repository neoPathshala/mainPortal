import { pathToFileURL } from "node:url";
export function deploymentErrors(env) {
  const errors = [];
  if (!env.VERCEL) return errors;
  for (const key of [
    "DATABASE_URL",
    "AUTH_SECRET",
    "SMTP_HOST",
    "SMTP_USER",
    "SMTP_PASS",
    "SMTP_FROM",
    "ENTRANCE_PORTAL_URL",
  ])
    if (!env[key]) errors.push(`Set ${key} in the Vercel environment.`);
  if (env.AUTH_SECRET && env.AUTH_SECRET.length < 32)
    errors.push("AUTH_SECRET must have at least 32 random characters.");
  if (env.DATABASE_URL) {
    try {
      const u = new URL(env.DATABASE_URL);
      if (
        !["postgres:", "postgresql:"].includes(u.protocol) ||
        !u.hostname ||
        ["localhost", "127.0.0.1"].includes(u.hostname)
      )
        throw new Error();
    } catch {
      errors.push("DATABASE_URL must be a hosted PostgreSQL URL.");
    }
  }
  if (
    env.SMTP_PORT &&
    (!/^\d+$/.test(env.SMTP_PORT) ||
      Number(env.SMTP_PORT) < 1 ||
      Number(env.SMTP_PORT) > 65535)
  )
    errors.push("SMTP_PORT must be a valid port.");
  if (env.SMTP_SECURE && !["true", "false"].includes(env.SMTP_SECURE))
    errors.push("SMTP_SECURE must be true or false.");
  const origin =
    env.VERCEL_ENV === "preview" && env.VERCEL_URL
      ? `https://${env.VERCEL_URL}`
      : env.APP_ORIGIN;
  for (const [key, value] of [
    ["APP_ORIGIN", origin],
    ["ENTRANCE_PORTAL_URL", env.ENTRANCE_PORTAL_URL],
  ]) {
    try {
      const u = new URL(value);
      if (
        u.protocol !== "https:" ||
        u.username ||
        u.password ||
        ["localhost", "127.0.0.1"].includes(u.hostname) ||
        (key === "APP_ORIGIN" && u.origin !== value)
      )
        throw new Error();
    } catch {
      errors.push(
        `${key} must be a public HTTPS origin, without a trailing slash for APP_ORIGIN.`,
      );
    }
  }
  if (env.STORAGE_DRIVER && env.STORAGE_DRIVER !== "database")
    errors.push(
      "Vercel requires STORAGE_DRIVER=database (or leave it unset for automatic database storage).",
    );
  return errors;
}
if (
  process.argv[1] &&
  import.meta.url === pathToFileURL(process.argv[1]).href
) {
  const errors = deploymentErrors(process.env);
  if (errors.length) {
    console.error(
      "Deployment configuration is incomplete:\n" +
        errors.map((e) => `- ${e}`).join("\n"),
    );
    process.exitCode = 1;
  }
}
