"use client";
import {periodName} from "@/lib/academic-structure";
import {passwordSignIn} from "@/app/password-actions";
import {defaultAuthPolicy,type AuthPolicy} from "@/lib/security/auth-policy";
import { useCatalog } from "@/components/catalog-provider";
import { detectSessionClient } from "@/lib/session-device";



import { semesterLabel } from "@/lib/semester-label";
import { Select } from "@/components/ui/select";
import { useEffect, useRef, useState, useTransition } from "react";

import { useRouter } from "next/navigation";
import { ArrowLeft, ArrowRight, Mail } from "lucide-react";
import { dispatchOtpEmailAction, verifyOtpAction } from "@/app/actions";
import { Button } from "@/components/ui/button";
import { SignupProgress } from "./SignupProgress";


export function AuthPageClient({ initialMode = "login",authPolicy=defaultAuthPolicy() }: {authPolicy?:AuthPolicy; initialMode?: "login" | "register" | "forgot_password"; portalType?: "academic" | "entrance" | "admin" }) {
  const { electiveSubjects, registrationAcademics, resolveStudentCourse, ACADEMIC_COURSES } = useCatalog();
  const router = useRouter();
  const [reset,setReset]=useState(initialMode==="forgot_password");
  const [method,setMethod]=useState<"otp"|"password">(authPolicy.otpLogin?"otp":"password");
  const [password,setPassword]=useState("");
  const [signupStep,setSignupStep]=useState(0);
  const [register, setRegister] = useState(initialMode === "register");
  const [email, setEmail] = useState("");
  const [name, setName] = useState("");
  const [course, setCourse] = useState("");
  const [semester, setSemester] = useState<number | null>(null);
  const [electives, setElectives] = useState<string[]>([]);
  const availableElectives = course && semester ? electiveSubjects(course, semester) : [];
  const [code, setCode] = useState("");
  const [sent, setSent] = useState(false);
  const [error, setError] = useState("");
  const [pending, startTransition] = useTransition();
  const requestLock = useRef(false);
  const formRef = useRef<HTMLFormElement>(null);
  const errorField = error ? (sent ? "auth-code" : method==="password"&&!register&&!reset ? "auth-password" : /name/i.test(error) ? "auth-name" : /elective/i.test(error) ? "auth-electives" : /semester/i.test(error) ? "auth-semester" : /course/i.test(error) ? "auth-course" : "auth-email") : undefined;
  useEffect(() => {
    if (!errorField || pending) return;
    if(register&&!sent)setSignupStep(errorField==="auth-name"||errorField==="auth-email"?0:1);
    const field = formRef.current?.querySelector<HTMLElement>(`#${errorField}`);
    field?.focus();
    if (field instanceof HTMLInputElement) field.select();
  }, [error, errorField, pending, signupStep, register, sent]);
  const [notice, setNotice] = useState("");
  useEffect(() => {
    if(new URLSearchParams(window.location.search).get("reason")==="notices"){
      setNotice("Sign in or create an account to view notices for your course.");
    }
    if (new URLSearchParams(window.location.search).get("reason") === "session-ended") {
      setNotice("Your session has ended. This can happen when you sign in on another device. Sign in again to continue.");
    }
  }, []);
  const [retryAt, setRetryAt] = useState(0);
  const [now, setNow] = useState(0);
  const [otpLockedUntil,setOtpLockedUntil] = useState(0);
  const otpLockSeconds = Math.max(0,Math.ceil((otpLockedUntil-now)/1000));
  const retrySeconds = Math.max(0, Math.ceil((retryAt - now) / 1000));
  useEffect(() => {
    if (!retryAt) return;
    setNow(Date.now());
    const timer = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(timer);
  }, [retryAt]);
  const purpose = register ? "register" : reset?"reset":"login";
  function sendCode() {
    // A synchronous lock stops double clicks and queued Server Actions before React renders pending.
    if (requestLock.current || retrySeconds > 0) return;
    if (register) {
      if(ACADEMIC_COURSES[course]?.comingSoon){setError("This course is coming soon. Choose an available course.");return;}
      const academic = registrationAcademics(course, semester, electives);
      if (!academic.valid) { setError(academic.message); return; }
    }
    requestLock.current = true;
    setError(""); setNotice("");
    startTransition(async () => {
      try {
        const result = await dispatchOtpEmailAction({ email, name: register ? name : "Student", course, semester, electives, purpose });
        if ("retryAfterSeconds" in result && typeof result.retryAfterSeconds === "number") {
          const current = Date.now(); setNow(current); setRetryAt(current + result.retryAfterSeconds * 1000);
        }
        if ("status" in result && result.status === "otp_locked" && "retryAfterSeconds" in result && typeof result.retryAfterSeconds === "number") {
          setOtpLockedUntil(Date.now()+result.retryAfterSeconds*1000);
        }
        if (result.success) { setOtpLockedUntil(0); setSent(true); setCode(""); setNotice(result.message); }
        else if ("status" in result && result.status === "rate_limited") {
          if ("canVerifyExisting" in result && result.canVerifyExisting) setSent(true);
          setNotice(`${result.message} A previously requested email may still arrive.`);
        } else setError(result.message);
      } catch { setError("Unable to send a code. Please try again later."); }
      finally { requestLock.current = false; }
    });
  }
  function requestCode(event: React.FormEvent) { event.preventDefault();if(register&&signupStep===0){if(!name.trim()){setError("Enter your full name.");return;}setError("");setSignupStep(1);return;}sendCode(); }
  function verify(event: React.FormEvent) {
    event.preventDefault();
    if (requestLock.current || otpLockSeconds > 0) return;
    requestLock.current = true; setError("");
    startTransition(async () => {
      try {
        const result = await verifyOtpAction({ email, code, purpose, clientType: detectSessionClient() });
        if (result.success) { router.replace(result.needsSecondFactor?"/two-factor":reset?"/account/password":"/student/profile"); router.refresh(); }
        else {
          if ("retryAfterSeconds" in result && typeof result.retryAfterSeconds === "number") {
            const current=Date.now(),until=current+result.retryAfterSeconds*1000;
            setNow(current);setOtpLockedUntil(until);setRetryAt(previous => Math.max(previous,until));
          }
          setError(result.error || "Unable to verify code.");
        }
      } catch { setError("Unable to verify code. Please try again."); }
      finally { requestLock.current = false; }
    });
  }
  function signInWithPassword(event:React.FormEvent){event.preventDefault();if(requestLock.current)return;requestLock.current=true;setError("");startTransition(async()=>{try{const result=await passwordSignIn({email,password,clientType:detectSessionClient()});if(result.success){setPassword("");router.replace(result.needsSecondFactor?"/two-factor":"/student/profile");router.refresh();}else setError(result.error||"Unable to sign in.");}catch{setError("Unable to sign in. Try again.");}finally{requestLock.current=false;}});}
  const passwordMode=!register&&!reset&&method==="password";const loginPreview = !register;
  const input = "h-12 w-full rounded-xl border border-input bg-background px-3.5 text-sm transition-colors placeholder:text-muted-foreground/70 hover:border-primary/40 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary aria-invalid:border-destructive aria-invalid:focus-visible:ring-destructive";
  return <div className="mx-auto flex min-h-[calc(100dvh-73px)] w-full max-w-lg flex-col justify-center px-4 py-12 sm:px-6 sm:py-16"><div className="overflow-hidden rounded-3xl border border-border bg-card"><section className="mx-auto w-full max-w-lg px-6 py-8 sm:px-10 sm:py-10 lg:py-12"><span className="mb-5 inline-flex size-11 items-center justify-center rounded-xl border border-primary/15 bg-primary/5 text-primary"><Mail size={22} /></span><h2 className="text-2xl font-semibold tracking-tight">{sent ? "Check your inbox" : register ? "Create your account" : reset?"Reset your password":"Welcome back"}</h2><p className="mb-7 mt-2 text-sm leading-6 text-muted-foreground">{sent ? `Enter the six-digit code sent to ${email}. It expires in ${authPolicy.otpExpiryMinutes} minutes.` : register ? signupStep===0?"Start with your name and email address.":"Choose your course and study period. You can update these later." : passwordMode?"Enter your email address and password.":reset?"Verify your email to set or reset your password.":"Enter your email. We’ll send you a sign-in code."}</p>{!register&&!reset&&!sent&&authPolicy.otpLogin&&authPolicy.passwordLogin&&<div className="mb-6 flex gap-1 rounded-xl bg-muted/60 p-1" role="group" aria-label="Sign-in method">{(["otp","password"] as const).map(value=><button key={value} type="button" aria-pressed={method===value} onClick={()=>{setMethod(value);setError("");setPassword("");}} className={`flex-1 rounded-lg px-3 py-2 text-xs font-medium transition-colors ${method===value?"bg-background text-foreground":"text-muted-foreground hover:text-foreground"}`}>{value==="otp"?"Email code":"Password"}</button>)}</div>}{register&&<SignupProgress currentStep={sent?2:signupStep}/>}<form ref={formRef} onSubmit={sent ? verify : passwordMode?signInWithPassword:requestCode} className="flex flex-col gap-5">{!sent && <>{register && <><fieldset disabled={pending||signupStep!==0} className={signupStep!==0?"hidden":"contents"}><div><label htmlFor="auth-name" className="mb-3 block text-xs font-medium">Full name</label><input id="auth-name" aria-invalid={errorField === "auth-name"} aria-describedby={errorField === "auth-name" ? "auth-error" : undefined} autoComplete="name" required maxLength={100} value={name} onChange={(event) => { setName(event.target.value); setError(""); }} className={input} /></div></fieldset><fieldset disabled={pending||signupStep!==1} className={signupStep!==1?"hidden":"contents"}><div><label htmlFor="auth-course" className="mb-3 block text-xs font-medium">Your course</label><Select id="auth-course" aria-invalid={errorField === "auth-course"} aria-describedby={errorField === "auth-course" ? "auth-error" : undefined} required value={course} onChange={(event) => { if(ACADEMIC_COURSES[event.target.value]?.comingSoon)return;setCourse(event.target.value); setSemester(null); setElectives([]); setError(""); }} className={input}><option value="">Choose your course</option>{Object.values(ACADEMIC_COURSES).map((item) => <option key={item.slug} value={item.slug} disabled={item.comingSoon===true}>{item.shortName}{item.comingSoon?" · Coming soon":""}</option>)}</Select></div><div><label htmlFor="auth-semester" className="mb-3 block text-xs font-medium">Current {periodName(ACADEMIC_COURSES[course])}</label><Select id="auth-semester" required disabled={!course || pending} value={semester === null ? "" : String(semester)} aria-invalid={errorField === "auth-semester"} aria-describedby={errorField === "auth-semester" ? "auth-error" : undefined} onChange={event => { setSemester(event.target.value ? Number(event.target.value) : null); setElectives([]); setError(""); }} className={input}><option value="">Choose your semester</option>{Array.from({ length: resolveStudentCourse(course)?.totalSemesters || 0 }, (_, index) => index + 1).map(number => <option key={number} value={String(number)}>{semesterLabel(number,ACADEMIC_COURSES[course])}</option>)}</Select></div>{availableElectives.length > 0 && <fieldset id="auth-electives" tabIndex={-1} className="space-y-3"><legend className="mb-2 text-xs font-medium">Elective subjects <span className="font-normal text-muted-foreground">(optional)</span></legend><p className="text-xs leading-5 text-muted-foreground">You can choose electives later in profile settings.</p>{Array.from(new Set(availableElectives.map(subject => subject.electiveGroup || "Elective"))).map(group => <div key={group}><label htmlFor={`auth-${group}`} className="mb-2 block text-xs text-muted-foreground">{group}</label><Select id={`auth-${group}`} value={electives.find(slug => availableElectives.some(subject => subject.slug === slug && (subject.electiveGroup || "Elective") === group)) || ""} onChange={event => { const removed = availableElectives.filter(subject => (subject.electiveGroup || "Elective") === group).map(subject => subject.slug); setElectives(current => [...current.filter(slug => !removed.includes(slug)), ...(event.target.value ? [event.target.value] : [])]); setError(""); }}><option value="">Choose later</option>{availableElectives.filter(subject => (subject.electiveGroup || "Elective") === group).map(subject => <option key={subject.slug} value={subject.slug}>{subject.name}</option>)}</Select></div>)}</fieldset>}</fieldset></>}<fieldset disabled={pending||register&&signupStep!==0} className={register&&signupStep!==0?"hidden":"contents"}><div><label htmlFor="auth-email" className="mb-3 block text-xs font-medium">Email address</label><input id="auth-email" aria-invalid={errorField === "auth-email"} aria-describedby={errorField === "auth-email" ? "auth-error" : undefined} type="email" autoComplete="email" required maxLength={254} value={email} disabled={pending} onChange={(event) => { setEmail(event.target.value); setOtpLockedUntil(0); setRetryAt(0); setNow(0); setError(""); setNotice(""); }} placeholder="you@example.com" className={input} /></div></fieldset></>}{passwordMode&&!sent&&<div><label htmlFor="auth-password" className="mb-3 block text-xs font-medium">Password</label><input id="auth-password" type="password" autoComplete="current-password" required maxLength={256} value={password} onChange={event=>{setPassword(event.target.value);setError("");}} className={input}/></div>}{sent && <div><label htmlFor="auth-code" className="mb-3 block text-xs font-medium">Verification code</label><input id="auth-code" aria-invalid={errorField === "auth-code"} aria-describedby={errorField === "auth-code" ? "auth-error" : undefined} autoFocus inputMode="numeric" autoComplete="one-time-code" pattern="[0-9]{6}" maxLength={6} required value={code} onChange={(event) => { setCode(event.target.value.replace(/\D/g, "")); setError(""); }} className={`${input} text-center font-mono text-xl tracking-[0.5em]`} /></div>}{notice && <p role="status" className="rounded-lg border border-primary/15 bg-primary/5 px-3 py-2 text-xs leading-6 text-primary">{notice}</p>}{error && <p id="auth-error" role="alert" className="text-xs leading-5 text-destructive">{error}</p>}{register&&!sent&&signupStep===1&&<button type="button" disabled={pending} onClick={()=>{setSignupStep(0);setError("");}} className="flex items-center gap-1 text-xs text-muted-foreground"><ArrowLeft size={13}/>Back to your details</button>}<Button disabled={pending || (sent ? otpLockSeconds > 0 : retrySeconds > 0)} className={`h-12 w-full rounded-xl ${loginPreview ? "dark:bg-primary dark:text-primary-foreground dark:hover:bg-primary/90" : ""}`} type="submit">{pending ? "Please wait…" : sent && otpLockSeconds > 0 ? `Try again in ${otpLockSeconds}s` : sent ? "Verify & continue" : retrySeconds > 0 ? `Try again in ${retrySeconds}s` : register&&signupStep===0?"Continue":passwordMode?"Sign in":"Send verification code"}<ArrowRight size={16} className="ml-auto" /></Button></form>{!sent&&!register&&authPolicy.passwordLogin&&authPolicy.passwordReset&&<button type="button" onClick={()=>{setReset(!reset);setError("");setPassword("");}} className="mt-4 text-xs text-primary">{reset?"Back to sign in":"Set or reset password"}</button>}{sent ? <div className="mt-5 flex justify-between text-xs"><button disabled={pending} onClick={() => { setSent(false);setSignupStep(0); setError(""); setNotice(""); }} className="flex items-center gap-1 text-muted-foreground"><ArrowLeft size={13} />Change email</button><button type="button" disabled={pending || retrySeconds > 0} onClick={sendCode} className="text-primary disabled:cursor-not-allowed disabled:text-muted-foreground">{retrySeconds > 0 ? `Resend in ${retrySeconds}s` : "Resend code"}</button></div> : <p className="mt-6 text-center text-xs text-muted-foreground">{register ? "Already have an account?" : "New to neoPathshala?"} <button className="font-medium text-primary" disabled={pending} onClick={() => { setRegister(!register);setSignupStep(0);setReset(false);setPassword(""); setError(""); setNotice(""); }}>{register ? "Sign in" : "Create an account"}</button></p>}<p className="mt-7 border-t border-border pt-5 text-center text-xs leading-5 text-muted-foreground">Keep your code private. neoPathshala will never ask you to share it in a message.</p></section></div></div>;
}
