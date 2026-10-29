import {getAuthPolicy} from "@/lib/security/auth-settings";
import { Metadata } from "next";
import { AuthPageClient } from "@/components/auth/AuthPageClient";

export const metadata: Metadata = {
  title: "Sign In | neoPathshala Academic Hub",
  description:
    "Sign in to neoPathshala to access B.Sc. CSIT lecture notes, curated past questions, syllabus guides, and verified lab manuals.",
};

export default async function LoginPage({searchParams}:{searchParams:Promise<{mode?:string}>}) {
 const [policy,query]=await Promise.all([getAuthPolicy().catch(()=>null),searchParams]);
 if(!policy)return <section className="mx-auto flex min-h-[60vh] max-w-md flex-col justify-center gap-4 px-6 py-16" aria-labelledby="sign-in-unavailable">
  <h1 id="sign-in-unavailable" className="text-2xl font-semibold">Sign-in is temporarily unavailable</h1>
  <p className="text-sm leading-6 text-muted-foreground">We couldn’t connect to the account service. Please try again in a moment.</p>
  <a href={query.mode==="password-setup"?"/login?mode=password-setup":"/login"} className="self-start rounded-lg bg-primary px-5 py-2.5 text-sm font-medium text-primary-foreground">Try again</a>
 </section>;
 return <AuthPageClient initialMode={query.mode==="password-setup"?"forgot_password":"login"} authPolicy={policy} portalType="academic" />;
}
