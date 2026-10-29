import "server-only";
import { persistentStorage } from "@/lib/persistent-storage";
import { mkdir, readFile, readdir, writeFile, unlink, rm } from "node:fs/promises";
import path from "node:path";
import { createHash, randomUUID } from "node:crypto";

export interface StudentSubmission {
  id: string;
  kind: "question" | "asset" | "contact";
  title: string;
  body: string;
  course: string;
  semester: number;
  subject: string;
  createdAt: string;
  status: "Received";
  contact?: { email: string; phone?: string };
  file?: { name: string; bytes: number; storedName: string };
}
// Private queue: PostgreSQL on Vercel; SUBMISSIONS_DIR is for filesystem development.
// Nothing in this queue is publicly served or automatically published.
const root = process.env.SUBMISSIONS_DIR || path.join(process.cwd(), ".security", "submissions");
function ownerDirectory(userId: string) { return path.join(root, createHash("sha256").update(userId).digest("hex")); }
export async function saveStudentSubmission(userId: string, input: Omit<StudentSubmission, "id" | "createdAt" | "status" | "file">, file?: { bytes: Buffer; name: string; extension: string }) {
  const directory = ownerDirectory(userId);
  if(persistentStorage) {
    const id=randomUUID(),prefix=`submissions/${createHash('sha256').update(userId).digest('hex')}/`;
    const storedName=file?`${id}.${file.extension}`:null;
    const record:StudentSubmission={...input,id,createdAt:new Date().toISOString(),status:"Received",...(file&&storedName?{file:{name:file.name,bytes:file.bytes.length,storedName}}:{})};
    if(file&&storedName)await persistentStorage.write(prefix+storedName,file.bytes,true);
    try{await persistentStorage.write(prefix+`${id}.json`,Buffer.from(JSON.stringify(record)),true);}catch(error){if(storedName)await persistentStorage.remove(prefix+storedName).catch(()=>{});throw error;}
    return record;
  }
  await mkdir(directory, { recursive: true, mode: 0o700 });
  const id = randomUUID();
  const storedName = file ? `${id}.${file.extension}` : null;
  const record: StudentSubmission = { ...input, id, createdAt: new Date().toISOString(), status: "Received", ...(file && storedName ? { file: { name: file.name, bytes: file.bytes.length, storedName } } : {}) };
  if (file && storedName) await writeFile(path.join(directory, storedName), file.bytes, { flag: "wx", mode: 0o600 });
  try { await writeFile(path.join(directory, `${id}.json`), JSON.stringify(record), { flag: "wx", mode: 0o600 }); }
  catch (error) { if (storedName) await unlink(path.join(directory, storedName)).catch(() => {}); throw error; }
  return record;
}
export async function listStudentSubmissions(userId: string, kind: StudentSubmission["kind"]) {
  const directory = ownerDirectory(userId);
  if(persistentStorage){
    const store=persistentStorage;
    const prefix=`submissions/${createHash('sha256').update(userId).digest('hex')}/`;
    const keys=(await persistentStorage.list(prefix)).filter(key=>/\/[a-f0-9-]{36}\.json$/.test(key));
    const rows:StudentSubmission[]=[];
    for(let i=0;i<keys.length;i+=16)rows.push(...await Promise.all(keys.slice(i,i+16).map(async key=>JSON.parse((await store.read(key)).toString('utf8')) as StudentSubmission)));
    return rows.filter(r=>r.kind===kind).sort((a,b)=>b.createdAt.localeCompare(a.createdAt)).slice(0,20).map(({id,title,createdAt,status})=>({id,title,createdAt,status}));
  }
  let names: string[];
  try { names = await readdir(directory); } catch (error) { if ((error as NodeJS.ErrnoException).code === "ENOENT") return []; throw error; }
  const files = names.filter(name => /^[a-f0-9-]{36}\.json$/.test(name));
  const records: (StudentSubmission | null)[] = [];
  // Bound concurrent file reads as a student's history grows.
  for (let offset = 0; offset < files.length; offset += 24) {
    records.push(...await Promise.all(files.slice(offset, offset + 24).map(async name => {
      try { return JSON.parse(await readFile(path.join(directory, name), "utf8")) as StudentSubmission; } catch { return null; }
    })));
  }
  return records.filter((item): item is StudentSubmission => !!item && item.kind === kind).sort((a,b) => b.createdAt.localeCompare(a.createdAt)).slice(0,20).map(({ id, title, createdAt, status }) => ({ id, title, createdAt, status }));
}

export async function deleteStudentSubmissions(userId: string) {
  if(persistentStorage){await persistentStorage.removePrefix(`submissions/${createHash("sha256").update(userId).digest("hex")}/`);return;}
  await rm(ownerDirectory(userId), { recursive: true, force: true });
}
