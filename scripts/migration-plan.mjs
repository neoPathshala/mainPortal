import { readFile, readdir } from "node:fs/promises";
import { createHash } from "node:crypto";
import { join } from "node:path";

export class MigrationStateError extends Error {
  constructor(code, message) {
    super(message);
    this.code = code;
  }
}

/** Baseline a matching, existing neo schema without replaying CREATE statements. */
export async function migrateDatabase(client, directory, runPrisma) {
  const names = (await readdir(directory, { withFileTypes: true }))
    .filter((entry) => entry.isDirectory())
    .map((entry) => entry.name)
    .sort();
  if (
    names[0] !== "neo" ||
    names.some((name) => !/^neo(?:_\d{4}_[a-z0-9_]+)?$/.test(name))
  ) {
    throw new MigrationStateError(
      "INVALID_HISTORY",
      "Use neo for the baseline and neo_0001_description for subsequent migrations.",
    );
  }
  const checksum = createHash("sha256")
    .update(await readFile(join(directory, "neo/migration.sql")))
    .digest("hex");
  const {
    rows: [state],
  } =
    await client.query(`SELECT to_regclass('neo."_prisma_migrations"') AS ledger,
  EXISTS(SELECT 1 FROM pg_class c JOIN pg_namespace n ON n.oid=c.relnamespace
   WHERE n.nspname='neo' AND c.relkind IN ('r','p','v','m','f') AND c.relname<>'_prisma_migrations') AS populated`);
  let baseline = false;
  if (state.ledger) {
    const { rows } = await client.query(
      'SELECT migration_name,checksum,finished_at,rolled_back_at FROM "neo"."_prisma_migrations"',
    );
    if (rows.some((row) => !row.finished_at && !row.rolled_back_at)) {
      throw new MigrationStateError(
        "FAILED_MIGRATION",
        "Resolve the unfinished database migration before continuing.",
      );
    }
    const applied = rows.find(
      (row) =>
        row.migration_name === "neo" && row.finished_at && !row.rolled_back_at,
    );
    if (applied && applied.checksum !== checksum) {
      throw new MigrationStateError(
        "CHECKSUM_MISMATCH",
        "The applied neo baseline differs from the repository. Restore its original SQL before migrating.",
      );
    }
    baseline = Boolean(applied);
  }
  if (!baseline && state.populated) {
    const result = await runPrisma([
      "migrate",
      "diff",
      "--from-config-datasource",
      "--to-schema",
      "prisma/schema.prisma",
      "--exit-code",
    ]);
    if (result !== 0) {
      throw new MigrationStateError(
        result === 2 ? "BASELINE_DRIFT" : "BASELINE_CHECK_FAILED",
        "The existing neo structure could not be verified against the schema. No baseline was marked as applied. Review the preceding comparison.",
      );
    }
    if ((await runPrisma(["migrate", "resolve", "--applied", "neo"])) !== 0) {
      throw new MigrationStateError(
        "BASELINE_FAILED",
        "Prisma could not record the verified neo baseline.",
      );
    }
  }
  if ((await runPrisma(["migrate", "deploy"])) !== 0) {
    throw new MigrationStateError(
      "PRISMA_DEPLOY_FAILED",
      "Prisma migration deployment failed. Review the preceding Prisma output.",
    );
  }
  return "neo";
}
