import "server-only";
import { db } from './db';
import { createDatabaseObjectStore } from "@/lib/platform/database-object-store";
export const persistentStorage=createDatabaseObjectStore(db);
