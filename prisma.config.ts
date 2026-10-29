import { defineConfig } from "prisma/config";
import {migrationDatabaseURL} from './scripts/database-migration-url.mjs';
for (const file of ['.env.local', '.env']) { try { process.loadEnvFile(file); } catch {} }
const url=migrationDatabaseURL(process.env.DATABASE_URL,process.env.DIRECT_DATABASE_URL);
export default defineConfig({ schema: "prisma/schema.prisma", migrations: { path: "prisma/migrations" }, datasource: { url } });
