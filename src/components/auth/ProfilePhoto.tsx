"use client";

import { useEffect, useRef, useState, useTransition } from "react";
import { Camera, CircleCheck, CircleAlert, Loader2, Trash2, Upload, X } from "lucide-react";
import { compressImageToWebP } from "@/lib/image-compressor";
import { ProfileAvatar } from "./ProfileAvatar";
import { Button } from "@/components/ui/button";
import { updateProfilePhotoAction, removeProfilePhotoAction } from "@/app/actions";

export { ProfileAvatar } from "./ProfileAvatar";

export function ProfilePhotoEditor({ url, name, onSaved }: { url: string | null; name: string; onSaved: (url: string | null) => void }) {
  const input = useRef<HTMLInputElement>(null);
  const [file, setFile] = useState<File | null>(null);
  const [compressing, setCompressing] = useState(false);
  const [preview, setPreview] = useState<string | null>(null);
  const [message, setMessage] = useState("");
  const [error, setError] = useState(false);
  const [pending, startTransition] = useTransition();
  useEffect(() => {
    if (!file) { setPreview(null); return; }
    const objectUrl = URL.createObjectURL(file);
    setPreview(objectUrl);
    return () => URL.revokeObjectURL(objectUrl);
  }, [file]);
  async function pick(selected: File | undefined) {
    setMessage("");
    if (!selected) return;
    if (!["image/jpeg", "image/png", "image/webp"].includes(selected.type) || selected.size < 1 || selected.size > 3 * 1024 * 1024) {
      setError(true); setMessage("Choose a JPG, PNG, or WebP photo up to 3 MB."); return;
    }
    setCompressing(true); setFile(null); setError(false);
    try {
      const compressed = await compressImageToWebP(selected, { maxWidth: 960, maxHeight: 960, quality: 0.82, preserveSvg: false });
      // Keep the smaller representation; the server always validates and re-encodes it.
      const upload = compressed.file.size < selected.size ? compressed.file : selected;
      setFile(upload);
    } catch { setError(true); setMessage("We couldn’t read this photo. Please choose another image."); }
    finally { setCompressing(false); }
  }
  function save() {
    if (!file || pending) return;
    setMessage("");
    const data = new FormData(); data.set("file", file);
    startTransition(async () => {
      try {
        const result = await updateProfilePhotoAction(data);
        if (result.success && result.url) { onSaved(result.url); setFile(null); setError(false); setMessage("Profile photo updated."); }
        else { setError(true); setMessage(result.error || "Unable to update your photo."); }
      } catch { setError(true); setMessage("Unable to update your photo. Please try again."); }
    });
  }
  function remove() {
    if (pending) return;
    setMessage("");
    startTransition(async () => {
      try {
        const result = await removeProfilePhotoAction();
        if (result.success) { onSaved(null); setFile(null); setError(false); setMessage("Profile photo removed."); }
        else { setError(true); setMessage(result.error || "Unable to remove your photo."); }
      } catch { setError(true); setMessage("Unable to remove your photo. Please try again."); }
    });
  }
  return <section aria-labelledby="profile-photo-heading" className="mb-7 border-b border-border pb-7">
    <h3 id="profile-photo-heading" className="mb-4 text-sm font-medium">Profile photo</h3>
    <div className="flex flex-col gap-5 sm:flex-row sm:items-center">
      <div className="relative w-fit"><ProfileAvatar url={preview || url} name={name} size="large" /><span className="absolute -bottom-1 -right-1 rounded-full border-4 border-card bg-muted p-1.5 text-muted-foreground"><Camera size={14} /></span></div>
      <div className="min-w-0"><div className="flex flex-wrap gap-2">
        <Button variant="outline" type="button" disabled={pending || compressing} onClick={() => input.current?.click()}><Upload size={14} className="mr-2" />{file ? "Choose another" : url ? "Change photo" : "Upload photo"}</Button>
        {url && !file && <Button variant="ghost" type="button" disabled={pending || compressing} onClick={remove}><Trash2 size={14} className="mr-2" />Remove</Button>}
        {file && <><Button type="button" disabled={pending || compressing} onClick={save}>{pending && <Loader2 size={14} className="mr-2 animate-spin" />}{pending ? "Saving…" : "Save photo"}</Button><Button variant="ghost" type="button" disabled={pending || compressing} onClick={() => { setFile(null); setMessage(""); }}>Cancel</Button></>}
      </div><p className="mt-3 text-xs leading-5 text-muted-foreground">JPG, PNG, or WebP · Up to 3 MB</p>{compressing && <p role="status" className="mt-2 text-xs text-muted-foreground">Optimizing your photo…</p>}</div>
    </div>
    <input ref={input} type="file" accept="image/jpeg,image/png,image/webp" aria-label="Choose profile photo" className="hidden" disabled={pending || compressing} onChange={(event) => { pick(event.target.files?.[0]); event.target.value = ""; }} />
    {message && <div role={error ? "alert" : "status"} className={`mt-4 flex items-center gap-3 rounded-lg border px-4 py-3 ${error ? "border-destructive/20 bg-destructive/5 text-destructive" : "border-primary/20 bg-primary/5 text-primary"}`}>
      {error ? <CircleAlert size={18} className="shrink-0" aria-hidden="true" /> : <CircleCheck size={18} className="shrink-0" aria-hidden="true" />}
      <p className="min-w-0 flex-1 text-sm font-medium leading-5">{message}</p>
      <button type="button" aria-label="Dismiss photo update message" onClick={() => setMessage("")} className="shrink-0 rounded-md p-1 opacity-70 transition-opacity hover:opacity-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-current"><X size={15} aria-hidden="true" /></button>
    </div>}
  </section>;
}
