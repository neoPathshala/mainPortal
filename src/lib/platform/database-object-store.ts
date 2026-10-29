/** Small private uploads and JSON records share the existing PostgreSQL database. */
export interface ObjectStoreSQL {
  $queryRaw<T = unknown>(query: TemplateStringsArray, ...values: unknown[]): Promise<T>;
  $executeRaw(query: TemplateStringsArray, ...values: unknown[]): Promise<number>;
}
export function useDatabaseStorage() {
  if(process.env.VERCEL && process.env.STORAGE_DRIVER === 'filesystem') throw new Error('Vercel requires database storage.');
  return process.env.STORAGE_DRIVER === 'database' || Boolean(process.env.VERCEL);
}
export function createDatabaseObjectStore(sql: ObjectStoreSQL) {
  function valid(key: string) {if(!key || key.length>600 || key.includes('..') || !/^[a-zA-Z0-9_./:-]+$/.test(key)) throw new Error('Invalid storage key.');}
  return {
    async read(key: string) {valid(key);const rows=await sql.$queryRaw<{body:Uint8Array}[]>`SELECT "body" FROM "neo"."PlatformObject" WHERE "key"=${key}`;if(!rows[0]) throw Object.assign(new Error('File not found.'),{code:'ENOENT'});return Buffer.from(rows[0].body);},
    async write(key: string,body:Uint8Array,exclusive=false) {valid(key);const bytes=Buffer.from(body);if(bytes.length>4*1024*1024)throw new Error('Stored file is too large.');if(exclusive)await sql.$executeRaw`INSERT INTO "neo"."PlatformObject" ("key","body","updatedAt") VALUES (${key},${bytes},CURRENT_TIMESTAMP)`;else await sql.$executeRaw`INSERT INTO "neo"."PlatformObject" ("key","body","updatedAt") VALUES (${key},${bytes},CURRENT_TIMESTAMP) ON CONFLICT ("key") DO UPDATE SET "body"=EXCLUDED."body","updatedAt"=CURRENT_TIMESTAMP`;},
    async readEntries(prefix:string,suffix:string) {valid(prefix);if(!/^\.[a-z0-9]{1,10}$/.test(suffix))throw new Error('Invalid storage suffix.');const rows=await sql.$queryRaw<{key:string;body:Uint8Array}[]>`SELECT "key","body" FROM "neo"."PlatformObject" WHERE left("key",char_length(${prefix}))=${prefix} AND right("key",char_length(${suffix}))=${suffix} ORDER BY "key"`;return rows.map(row=>({key:row.key,body:Buffer.from(row.body)}));},
    async list(prefix:string) {valid(prefix);const rows=await sql.$queryRaw<{key:string}[]>`SELECT "key" FROM "neo"."PlatformObject" WHERE left("key",char_length(${prefix}))=${prefix} ORDER BY "key"`;return rows.map(r=>r.key);},
    async remove(key:string) {valid(key);await sql.$executeRaw`DELETE FROM "neo"."PlatformObject" WHERE "key"=${key}`;},
    async removePrefix(prefix:string) {valid(prefix);await sql.$executeRaw`DELETE FROM "neo"."PlatformObject" WHERE left("key",char_length(${prefix}))=${prefix}`;},
  };
}
