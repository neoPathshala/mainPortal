import {readSitePresentation} from '@/lib/site-presentation.server';
import { persistentStorage } from "@/lib/persistent-storage";
import { NextRequest, NextResponse } from "next/server";
import { mkdir, readFile, readdir, writeFile } from "node:fs/promises";
import path from "node:path";
import { randomUUID } from "node:crypto";
import sharp from "sharp";
import { assertSameOrigin, requireSession, rateLimit } from "@/lib/security/auth";
import { db } from "@/lib/db";
import { readManagedAvatar } from "@/lib/security/profile-photo";
import { boundedFormData } from "@/lib/security/bounded-form-data";

const root = path.join(process.cwd(), ".security", "discussions");
async function readDiscussion(subject:string,name:string){return persistentStorage?persistentStorage.read(`discussions/${subject}/${name}`):readFile(path.join(root,subject,name));}
const validSubject = (value: string) => /^[a-z0-9-]{1,120}$/.test(value);
const validId = (value: string) => /^[a-f0-9-]{36}$/.test(value);
export async function GET(request: NextRequest) {
  const subject = request.nextUrl.searchParams.get("subject") || "";
  if (!validSubject(subject)) return NextResponse.json({ error: "Invalid subject" }, { status: 400 });
  try {
    const avatar = request.nextUrl.searchParams.get("avatar");
    if (avatar) {
      if (!validId(avatar)) return new Response(null, { status: 404 });
      await requireSession();
      const comment = JSON.parse((await readDiscussion(subject,`${avatar}.json`)).toString("utf8"));
      const author = await db.user.findUnique({ where: { id: comment.userId }, select: { avatarUrl: true } });
      const photo = author?.avatarUrl?.match(/^\/api\/account\/photo\/([a-f0-9]{64}\.webp)$/)?.[1];
      if (!photo) return new Response(null, { status: 404 });
      return new Response(new Uint8Array(await readManagedAvatar(photo)), { headers: { "Content-Type": "image/webp", "Cache-Control": "private, max-age=300", "X-Content-Type-Options": "nosniff" } });
    }
    const image = request.nextUrl.searchParams.get("image");
    if (image) {
      if (!validId(image)) return new Response(null, { status: 400 });
      return new Response(new Uint8Array(await readDiscussion(subject,`${image}.webp`)), { headers: { "Content-Type": "image/webp", "X-Content-Type-Options": "nosniff", "Cache-Control": "public, max-age=86400" } });
    }
    const [entries,{settings:presentation}]=await Promise.all([
      (async()=>{
        if(persistentStorage?.readEntries)return persistentStorage.readEntries(`discussions/${subject}/`,'.json');
        let names:string[];try{names=persistentStorage?(await persistentStorage.list(`discussions/${subject}/`)).map(key=>key.split('/').pop()!):await readdir(path.join(root,subject));}catch(error){if((error as NodeJS.ErrnoException).code==='ENOENT')return [];throw error;}
        return Promise.all(names.filter(name=>/^[a-f0-9-]{36}\.json$/.test(name)).map(async name=>({key:name,body:await readDiscussion(subject,name)})));
      })(),readSitePresentation()
    ]);
    const [loveRows,viewer]=await Promise.all([db.platformObject.findMany({where:{key:{startsWith:`discussion-loves:${subject}:`}},select:{key:true,body:true}}),requireSession().catch(()=>null)]);
    const loves=new Map(loveRows.map(row=>{let ids:string[]=[];try{const data=JSON.parse(Buffer.from(row.body).toString());if(Array.isArray(data))ids=data.filter((id:unknown)=>typeof id==='string');}catch{}return [row.key.slice(`discussion-loves:${subject}:`.length),ids] as const;}));
    const comments=entries.filter(entry=>/^[a-f0-9-]{36}\.json$/.test(entry.key.split('/').pop()!)).map(entry=>{
      const item=JSON.parse(entry.body.toString('utf8'));
      return {loveCount:loves.get(item.id)?.length||0,loved:!!viewer&&!!loves.get(item.id)?.includes(viewer.user.id),replyToName:typeof item.replyToName==='string'?item.replyToName:undefined,anonymousAvatar:presentation.brand.anonymousAvatar,id:item.id,name:item.name,text:item.text,parentId:item.parentId,createdAt:item.createdAt,image:item.image,avatarUrl:item.userId?`/api/discussions?subject=${subject}&avatar=${item.id}`:null};
    });
    return NextResponse.json(comments.sort((a, b) => a.createdAt.localeCompare(b.createdAt)), { headers: { "Cache-Control": "private, no-store" } });
  } catch { return NextResponse.json({ error: "Unable to load discussions" }, { status: 500 }); }
}

export async function POST(request: NextRequest) {
  try {
    await assertSameOrigin();
    const { user } = await requireSession();

    if (Number(request.headers.get("content-length")) > 4 * 1024 * 1024) return NextResponse.json({ error: "Image must be under 3 MB" }, { status: 413 });
    const data = await boundedFormData(request, 4 * 1024 * 1024);
    const subject = String(data.get("subject") || "");
    if(data.get('intent')==='love'){
      await rateLimit(`discussion-love:${user.id}`,60,60000);
      const id=String(data.get('id')||'');if(!validSubject(subject)||!validId(id))return NextResponse.json({error:'Invalid comment'},{status:400});
      await readDiscussion(subject,`${id}.json`);
      const key=`discussion-loves:${subject}:${id}`;
      const result=await db.$transaction(async tx=>{
        await tx.$executeRaw`SELECT pg_advisory_xact_lock(hashtext(${key}))`;
        const row=await tx.platformObject.findUnique({where:{key}});const stored=row?JSON.parse(Buffer.from(row.body).toString()):[];
        const ids=new Set<string>(Array.isArray(stored)?stored.filter((id:unknown)=>typeof id==='string'):[]);
        const loved=!ids.has(user.id);if(loved)ids.add(user.id);else ids.delete(user.id);
        const body=Buffer.from(JSON.stringify([...ids]));await tx.platformObject.upsert({where:{key},create:{key,body},update:{body}});return {loved,loveCount:ids.size};
      });return NextResponse.json(result,{headers:{'Cache-Control':'private, no-store'}});
    }
    await rateLimit(`discussion:${user.id}`,20,3600000);
    const rawText=data.get("text");if(rawText!==null&&typeof rawText!=="string")return NextResponse.json({error:"Check your message"},{status:400});
    const text = (typeof rawText==="string"?rawText:"").trim();
    let parentId = String(data.get("parentId") || "");
    if (!validSubject(subject) || text.length > 5000 || /[\x00-\x08\x0b\x0c\x0e-\x1f\x7f]/.test(text)) return NextResponse.json({ error: "Check your message" }, { status: 400 });
    let replyToName:string|undefined;
    if (parentId) {
      if (!validId(parentId)) return NextResponse.json({ error: "Invalid reply" }, { status: 400 });
      const parent = JSON.parse((await readDiscussion(subject,`${parentId}.json`)).toString("utf8"));
      replyToName=String(parent.name||"Student").slice(0,100);if(parent.parentId){if(!validId(parent.parentId))return NextResponse.json({error:"Invalid reply"},{status:400});await readDiscussion(subject,`${parent.parentId}.json`);parentId=parent.parentId;}
    }
    const upload = data.get("image");
    if(upload!==null&&!(upload instanceof File))return NextResponse.json({error:"Choose a valid image attachment"},{status:400});
    let imageBytes: Buffer | undefined;
    if (upload instanceof File && upload.size) {
      if (upload.size > 3 * 1024 * 1024) return NextResponse.json({ error: "Image must be under 3 MB" }, { status: 400 });
      try {
        const processor = sharp(Buffer.from(await upload.arrayBuffer()), { limitInputPixels: 20000000, animated: false });
        const metadata = await processor.metadata();
        if (!["jpeg", "png", "webp"].includes(metadata.format || "")) throw new Error();
        imageBytes = await processor.rotate().resize({ width: 1800, height: 1800, fit: "inside", withoutEnlargement: true }).webp({ quality: 82 }).toBuffer();
      } catch { return NextResponse.json({ error: "Choose a JPG, PNG, or WebP image" }, { status: 400 }); }
    }
    if (!text && !imageBytes) return NextResponse.json({ error: "Write a message or attach an image" }, { status: 400 });
    const id = randomUUID();
    const directory = path.join(root, subject);
    const comment = { replyToName, id, name: user.name, userId: user.id, text, parentId: parentId || null, createdAt: new Date().toISOString(), image: imageBytes ? `/api/discussions?subject=${subject}&image=${id}` : null };
    if(persistentStorage) {
      const prefix=`discussions/${subject}/`;
      if(imageBytes)await persistentStorage.write(prefix+`${id}.webp`,imageBytes,true);
      try{await persistentStorage.write(prefix+`${id}.json`,Buffer.from(JSON.stringify(comment)),true);}catch(error){if(imageBytes)await persistentStorage.remove(prefix+`${id}.webp`).catch(()=>{});throw error;}
    } else {
      await mkdir(directory, { recursive: true, mode: 0o700 });
      if (imageBytes) await writeFile(path.join(directory, `${id}.webp`), imageBytes, { flag: "wx", mode: 0o600 });
      await writeFile(path.join(directory, `${id}.json`), JSON.stringify(comment), { flag: "wx", mode: 0o600 });
    }
    return NextResponse.json({ success: true }, { status: 201 });
  } catch (error) {
    const message = error instanceof Error ? error.message : "";
    return NextResponse.json({ error: /^(Sign in|Too many requests|Request not allowed|Upload is too large)/.test(message) ? message : "Unable to post. Please try again." }, { status: /Sign in/.test(message) ? 401 : /Upload is too large/.test(message) ? 413 : /Too many requests/.test(message) ? 429 : 400 });
  }
}
