"use client";
import { formatBSDateTime } from "@/lib/nepali-date";
import { DiscussionsSkeleton } from "@/components/loading/StudySkeletons";
import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { Heart, ImagePlus, Reply, Send, X } from "lucide-react";
import { ProfileAvatar } from "@/components/auth/ProfileAvatar";
type Comment = { loveCount?:number;loved?:boolean;replyToName?:string; id: string; name: string; text: string; parentId: string | null; createdAt: string; image: string | null; anonymousAvatar?:string; avatarUrl?: string | null };

export function SubjectDiscussions({ subject }: { subject: string }) {
  const [comments, setComments] = useState<Comment[]>([]);
  const [reply, setReply] = useState<Comment | null>(null);
  const [message, setMessage] = useState("");
  const [reacting,setReacting]=useState<string|null>(null);
  const [busy, setBusy] = useState(false);
  const [loading, setLoading] = useState(true);
  const [fileName, setFileName] = useState("");
  const [authenticated, setAuthenticated] = useState<boolean | null>(null);
  const form = useRef<HTMLFormElement>(null);
  const submitting=useRef(false);
  const text = useRef<HTMLTextAreaElement>(null);
  async function refresh() {
    const response = await fetch(`/api/discussions?subject=${encodeURIComponent(subject)}`, { cache: "no-store" });
    if (!response.ok) throw new Error("Unable to load discussions");
    setComments(await response.json());
  }
  useEffect(() => { refresh().catch(() => setMessage("Unable to load discussions. Please refresh.")).finally(() => setLoading(false)); }, [subject]);
  useEffect(() => {
    const controller = new AbortController();
    const checkSession = () => fetch("/api/account/session", { cache: "no-store", credentials: "same-origin", signal: controller.signal }).then(async response => {
      if (response.ok) setAuthenticated((await response.json()).authenticated === true);
    }).catch(() => {});
    void checkSession();
    window.addEventListener("focus", checkSession);
    return () => { controller.abort(); window.removeEventListener("focus", checkSession); };
  }, []);
  const renderComment = (comment: Comment) => <div className="flex gap-3">
    <span className="block h-8 w-8 shrink-0 overflow-hidden rounded-full [&>div]:h-8 [&>div]:w-8 [&>div]:text-xs"><ProfileAvatar name={comment.name} url={authenticated&&comment.avatarUrl?comment.avatarUrl:comment.anonymousAvatar||null} /></span>
    <div className="min-w-0 flex-1"><div className="flex flex-wrap items-baseline gap-2"><span className="text-sm font-medium">{comment.name}</span><time className="text-[10px] text-muted-foreground" dateTime={comment.createdAt}>{formatBSDateTime(comment.createdAt)}</time></div>
      {comment.replyToName&&<p className="mt-1 text-[10px] text-muted-foreground">Replying to {comment.replyToName}</p>}{comment.text && <p className="mt-2 whitespace-pre-wrap break-words text-sm leading-7">{comment.text}</p>}
      {comment.image && <a href={comment.image} target="_blank" rel="noopener noreferrer" className="mt-3 block w-fit"><img src={comment.image} alt="Discussion attachment" loading="lazy" className="max-h-72 max-w-full rounded-lg border border-border object-contain" /></a>}
      <div className="mt-2 flex items-center gap-4"><button type="button" aria-label={`Love comment by ${comment.name}`} aria-pressed={comment.loved===true} disabled={reacting!==null} onClick={async()=>{if(reacting)return;setReacting(comment.id);setMessage('');try{const data=new FormData();data.set('intent','love');data.set('subject',subject);data.set('id',comment.id);const response=await fetch('/api/discussions',{method:'POST',body:data});const result=await response.json();if(!response.ok){if(response.status===401)setAuthenticated(false);throw new Error(result.error||'Unable to react');}setComments(items=>items.map(item=>item.id===comment.id?{...item,loved:result.loved,loveCount:result.loveCount}:item));}catch(error){setMessage(error instanceof Error?error.message:'Unable to react');}finally{setReacting(null);}}} className={`inline-flex items-center gap-1.5 text-xs disabled:opacity-50 ${comment.loved?'text-rose-500':'text-muted-foreground hover:text-rose-500'}`}><Heart className={`size-3.5 ${comment.loved?'fill-current':''}`}/>{comment.loveCount||0}</button><button type="button" onClick={() => { setReply(comment); text.current?.focus(); form.current?.scrollIntoView({ behavior: "smooth", block: "center" }); }} className="mt-2 flex items-center gap-1.5 py-1 text-xs text-muted-foreground hover:text-primary"><Reply className="h-3.5 w-3.5" />Reply</button></div>
    </div>
  </div>;
  return <section className="w-full min-w-0 space-y-6">
    <div><h2 className="text-lg font-semibold">Discussions</h2><p className="mt-1 text-sm text-muted-foreground">Ask a question, share an image, or help a classmate.</p></div>
    <form ref={form} onSubmit={async event => {
      event.preventDefault();if(submitting.current)return;setMessage("");
      const data = new FormData(event.currentTarget); data.set("subject", subject); if (reply) data.set("parentId", reply.id);
      const image=data.get('image');
      if(image instanceof File&&image.size>3*1024*1024){setMessage('Choose an image up to 3 MB.');return;}
      if(!String(data.get('text')||'').trim()&&!(image instanceof File&&image.size)){setMessage('Write a message or attach an image.');return;}
      submitting.current=true;setBusy(true);
      try {
        const response = await fetch("/api/discussions", { method: "POST", body: data });
        const result = await response.json(); if (response.status === 401) setAuthenticated(false); if (!response.ok) throw new Error(result.error);
        setAuthenticated(true);
        form.current?.reset(); setFileName(""); setReply(null); await refresh();
      } catch (error) { setMessage(error instanceof Error ? error.message : "Unable to post"); }
      finally { submitting.current=false;setBusy(false); }
    }} className="overflow-hidden rounded-xl border border-border bg-card">
      {reply && <div className="flex items-center justify-between gap-3 bg-muted/50 px-4 py-2 text-xs text-muted-foreground">Replying to {reply.name}<button type="button" onClick={() => setReply(null)} aria-label="Cancel reply"><X className="h-4 w-4" /></button></div>}
      <textarea ref={text} name="text" maxLength={5000} aria-label="Discussion message" placeholder={reply ? "Write a reply…" : "Ask a question or start a discussion…"} className="min-h-28 w-full resize-y bg-transparent p-4 text-sm outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-primary" />
      <div className="flex flex-wrap items-center justify-between gap-3 border-t border-border px-4 py-3"><label className="flex cursor-pointer items-center gap-2 text-xs text-muted-foreground hover:text-foreground"><ImagePlus className="h-4 w-4" /><span>{fileName || "Attach image · up to 3 MB"}</span><input type="file" name="image" accept="image/jpeg,image/png,image/webp" className="sr-only" onChange={event => setFileName(event.target.files?.[0]?.name || "")} /></label><button disabled={busy} className="flex items-center gap-2 rounded-lg bg-primary px-4 py-2 text-xs font-medium text-primary-foreground disabled:opacity-50"><Send className="h-3.5 w-3.5" />{busy ? "Posting…" : reply ? "Post reply" : "Post comment"}</button></div>
    </form>
    <p className="text-xs text-muted-foreground">{authenticated === false && <><Link href="/login" className="text-primary hover:underline">Sign in</Link> to comment or reply. </>}Comments and attached images are public.</p>
    {message && <p role="alert" className="text-sm text-destructive">{message}</p>}
    {loading && <DiscussionsSkeleton />}
    {!loading && !comments.length && <p className="py-8 text-center text-sm text-muted-foreground">No discussions yet. Start the first one.</p>}
    <div className="divide-y divide-border">{comments.filter(item => !item.parentId).map(comment => <article key={comment.id} className="py-6">{renderComment(comment)}<div className="ml-4 mt-4 space-y-5 border-l border-border pl-6 sm:ml-10">{comments.filter(item => item.parentId === comment.id).map(item => <div key={item.id}>{renderComment(item)}</div>)}</div></article>)}</div>
  </section>;
}
