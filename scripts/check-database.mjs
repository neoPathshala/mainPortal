import { lookup } from "node:dns/promises";
import pg from "pg";
import { explicitDatabaseSsl } from "../src/lib/database-url.ts";

// Next.js gives .env.local precedence over .env; existing environment values win.
for (const file of [".env.local", ".env"]) {
  try {
    process.loadEnvFile(file);
  } catch {}
}
let client;
try {
  if (!process.env.DATABASE_URL)
    throw Object.assign(new Error("Missing DATABASE_URL"), {
      code: "MISSING_URL",
    });
  const url = new URL(process.env.DATABASE_URL);
  if (!["postgres:", "postgresql:"].includes(url.protocol))
    throw Object.assign(new Error("Invalid database URL"), {
      code: "INVALID_URL",
    });
  await lookup(url.hostname);
  client = new pg.Client({
    connectionString: explicitDatabaseSsl(url.toString()),
    connectionTimeoutMillis: 15000,
  });
  await client.connect();
  const { rows } = await client.query(
    `SELECT to_regclass('neo."User"') IS NOT NULL AS accounts, to_regclass('neo."AcademicOtp"') IS NOT NULL AS otp, to_regclass('neo."AcademicRateLimit"') IS NOT NULL AS limits, to_regclass('neo."PlatformObject"') IS NOT NULL AS content, to_regclass('neo."Course"') IS NOT NULL AS courses, to_regclass('neo."Subject"') IS NOT NULL AS subjects, to_regclass('neo."University"') IS NOT NULL AS universities`,
  );
  if (!Object.values(rows[0]).every(Boolean)) {
    console.error(
      "Connected, but neo is missing required tables. Run npm run db:setup before starting mainPanel.",
    );
    process.exitCode = 1;
  } else
    console.log(
      "Database reachable; mainPanel account, OTP, rate-limit, content, and catalogue tables exist.",
    );
} catch (error) {
  const code = error?.code || "CONNECTION_FAILED";
  const messages = {
    ENOTFOUND:
      "Database hostname could not be resolved. Check DNS/network access and the current Neon connection URL.",
    EAI_AGAIN:
      "DNS is temporarily unavailable. Check your network and try again.",
    ECONNREFUSED:
      "Database connection refused. Check the database endpoint and network access.",
    ETIMEDOUT:
      "Database connection timed out. Check database availability and network access.",
    "28P01":
      "Database credentials were rejected. Update DATABASE_URL from your Neon dashboard.",
    MISSING_URL: "Set DATABASE_URL before starting mainPanel.",
    INVALID_URL: "DATABASE_URL must be a PostgreSQL connection URL.",
  };
  // Do not print URLs, usernames, passwords, or driver error objects.
  console.error(
    `Database check failed (${code}). ${messages[code] || "Check database availability, TLS settings, and credentials."}`,
  );
  process.exitCode = 1;
} finally {
  if (client) await client.end().catch(() => {});
}
