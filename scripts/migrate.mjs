import { spawn } from "node:child_process";
import { createRequire } from "node:module";
import { fileURLToPath } from "node:url";
import { join } from "node:path";
import pg from "pg";
import {
  migrationDatabaseURL,
  verifiedMigrationConnection,
} from "./database-migration-url.mjs";
import { migrateDatabase, MigrationStateError } from "./migration-plan.mjs";

const root = fileURLToPath(new URL("../", import.meta.url)),
  require = createRequire(import.meta.url);
for (const file of [".env.local", ".env"]) {
  try {
    process.loadEnvFile(fileURLToPath(new URL("../" + file, import.meta.url)));
  } catch {}
}
let client,
  locked = false;
try {
  const url = migrationDatabaseURL(
    process.env.DATABASE_URL,
    process.env.DIRECT_DATABASE_URL,
  );
  if (!url)
    throw new MigrationStateError(
      "MISSING_URL",
      "Set DIRECT_DATABASE_URL for the migration identity or DATABASE_URL before migrating.",
    );
  client = new pg.Client({
    connectionString: verifiedMigrationConnection(url),
    connectionTimeoutMillis: 30000,
    statement_timeout: 10000,
    lock_timeout: 10000,
    keepAlive: true,
    keepAliveInitialDelayMillis: 10000,
  });
  await client.connect();
  await client.query("SELECT pg_advisory_lock(728302002)");
  locked = true;
  async function runPrisma(args) {
    const binary = require("../package.json").devDependencies?.[
      "@prisma/prisma7"
    ]
      ? "prisma7"
      : "prisma";
    return new Promise((resolve, reject) => {
      const child = spawn(
        process.execPath,
        [join(root, "node_modules/.bin", binary), ...args],
        { cwd: root, env: process.env, stdio: "inherit" },
      );
      child.once("error", reject);
      child.once("exit", (code) => resolve(code ?? 1));
    });
  }
  await migrateDatabase(
    client,
    fileURLToPath(new URL("../prisma/migrations/", import.meta.url)),
    runPrisma,
  );
  console.log(
    "Database migrations complete. The application namespace is neo.",
  );
} catch (error) {
  const code =
    typeof error?.code === "string" ? error.code : "MIGRATION_FAILED";
  const reasons = {
    ENOTFOUND:
      "The direct database hostname could not be resolved. Check the current Neon endpoint and local DNS/network access.",
    EAI_AGAIN:
      "DNS lookup is temporarily unavailable. Retry when the network is connected.",
    ECONNREFUSED:
      "The database refused the connection. Check the current direct endpoint and PostgreSQL network access.",
    ETIMEDOUT:
      "Database connection timed out. Check the endpoint, compute status and network access.",
    "28P01":
      "The migration credentials were rejected. Check DIRECT_DATABASE_URL.",
  };
  console.error(
    `Database migration failed (${code}). ${error instanceof MigrationStateError ? error.message : reasons[code] || "Check the direct database connection, credentials, TLS configuration and network access."}`,
  );
  process.exitCode = 1;
} finally {
  if (locked)
    await client.query("SELECT pg_advisory_unlock(728302002)").catch(() => {});
  if (client) await client.end().catch(() => {});
}
