"use client";
import { useRef, useState } from "react";
import {SignInCard} from "@/components/auth/SignInCard";
import { CheckCircle2, Loader2, Send } from "lucide-react";
import { Select } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { submitContactMessage } from "./actions";
export function ContactForm({ authenticated, initialEmail = "", initialPhone = "", feedback = false }: { authenticated:boolean; initialEmail?:string; initialPhone?:string; feedback?:boolean }) {
  const [topic,setTopic] = useState(feedback ? "Feedback" : "Account support");
  const [pending,setPending] = useState(false);
  const [error,setError] = useState("");
  const [receipt,setReceipt] = useState("");
  const lock = useRef(false);
  async function submit(event:React.FormEvent<HTMLFormElement>) {
    event.preventDefault(); if (lock.current || !authenticated) return;
    lock.current = true; setPending(true); setError("");
    const data = new FormData(event.currentTarget);data.set("topic",topic);
    try { const result = await submitContactMessage(data); if(result.id) setReceipt(result.id); else setError(result.error || "Unable to save message."); }
    catch { setError("Check your connection and try again."); }
    finally { setPending(false);lock.current=false; }
  }
  if(receipt) return <div className="rounded-2xl border border-border bg-card p-8" role="status"><CheckCircle2 size={30} className="mb-5 text-primary" /><h2 className="text-xl font-semibold">{feedback ? "Your feedback is saved." : "Your message is saved."}</h2><p className="mt-3 text-sm leading-7 text-muted-foreground">It has been received privately. Email notifications and support replies are not connected yet.</p><p className="mt-5 break-all rounded-lg bg-muted p-3 font-mono text-xs">Reference: {receipt}</p><Button className="mt-5" onClick={() => setReceipt("")}>{feedback ? "Share more feedback" : "Send another message"}</Button></div>;
  const field="mt-2 w-full rounded-lg border border-input bg-background px-3 py-3 text-sm";
  return <div className="flex h-full min-h-0 min-w-0 flex-col">{!authenticated&&<SignInCard title={feedback?"Sign in to share feedback":"Sign in to contact us"} description={feedback?"Sign in to send private feedback.":"Sign in to send a private support message."}/>}<form onSubmit={submit} className="flex min-h-0 flex-1 flex-col rounded-2xl border border-border bg-card p-6 sm:p-8"><h2 className="mb-2 text-base font-semibold">{feedback ? "Share your feedback" : "Send us a message"}</h2><p className="mb-6 text-xs leading-6 text-muted-foreground">{feedback ? "What worked well? What could we improve?" : "Tell us what happened and how we can help."}</p><fieldset disabled={!authenticated || pending} className="flex min-h-0 flex-1 flex-col gap-5 disabled:opacity-60">{!feedback && <div className="flex flex-col gap-2 pb-1"><label htmlFor="contact-topic" className="text-xs font-medium">Topic</label><Select id="contact-topic" aria-label="Message topic" value={topic} onChange={e => setTopic(e.target.value)}>{["Account support","Resources & content","Support & contributions","Feedback","Other"].map(item=><option key={item}>{item}</option>)}</Select></div>}<div className="grid gap-5 sm:grid-cols-2"><label className="block text-xs font-medium">Email<input type="email" name="email" autoComplete="email" defaultValue={initialEmail} required maxLength={254} placeholder="you@example.com" className={field} /></label><label className="block text-xs font-medium">Phone number <span className="font-normal text-muted-foreground">(optional)</span><input type="tel" name="phone" autoComplete="tel" defaultValue={initialPhone} maxLength={25} placeholder="+977 98XXXXXXXX" className={field} /></label></div><label className="block text-xs font-medium">Subject<input name="title" required minLength={5} maxLength={140} placeholder="A short summary" className={field} /></label><label className="flex min-h-0 flex-1 flex-col text-xs font-medium">Message<textarea name="message" rows={5} required minLength={20} maxLength={5000} placeholder="Include the page and any error you encountered. Please leave out passwords and payment details." className={`${field} h-56 min-h-56 flex-1 resize-none overflow-y-auto overscroll-auto leading-6 [scrollbar-width:thin] lg:h-0`} /></label><Button type="submit" className="shrink-0 self-start gap-2">{pending ? <Loader2 size={15} className="animate-spin" /> : <Send size={15} />}{pending ? "Saving…" : feedback ? "Send feedback" : "Send message"}</Button></fieldset>{error && <p role="alert" className="mt-4 text-sm text-destructive">{error}</p>}</form></div>;
}
