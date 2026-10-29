import "./patch-perf";
import { PrismaClient } from "@prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";
import { explicitDatabaseSsl } from "./database-url";
import { createHash } from "node:crypto";

const globalForPrisma = globalThis as typeof globalThis & { prisma?: PrismaClient; prismaConfig?: string };
const connectionString = explicitDatabaseSsl(process.env.DATABASE_URL || "");
// Never reuse a development pool created with an old URL or adapter configuration.
const configuration = createHash("sha256").update(`neo:pooled-v4:${connectionString}`).digest("hex");

function createPrismaClient(): PrismaClient {
  const adapter = new PrismaPg({ connectionString, connectionTimeoutMillis: 10000, max: 3, idleTimeoutMillis: 30000, statement_timeout: 5000, lock_timeout: 1000, idle_in_transaction_session_timeout: 10000 }, { schema: "neo" });
  return new PrismaClient({
    adapter,
    log: process.env.NODE_ENV === "development" ? ["warn", "error"] : ["error"],
  });
}

const existing = globalForPrisma.prismaConfig === configuration && globalForPrisma.prisma && "course" in globalForPrisma.prisma ? globalForPrisma.prisma : undefined;
export const db: PrismaClient = existing || createPrismaClient();

if (process.env.NODE_ENV !== "production") {
  if (globalForPrisma.prisma && globalForPrisma.prisma !== db) void globalForPrisma.prisma.$disconnect().catch(() => {});
}
globalForPrisma.prisma = db;
globalForPrisma.prismaConfig = configuration;
