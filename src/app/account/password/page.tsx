import Link from 'next/link';
import {requireSession} from '@/lib/security/auth';
import {getAuthPolicy} from '@/lib/security/auth-settings';
import {PasswordForm} from './password-form';
export const metadata={title:'Set password · neoPathshala',robots:{index:false,follow:false}};
export default async function PasswordPage(){await requireSession();const policy=await getAuthPolicy();return <section className="page-shell max-w-lg"><h1 className="page-title">Set your password</h1><p className="mt-3 text-sm leading-6 text-muted-foreground">Verify your email before setting or resetting a password. The verification is valid for ten minutes.</p>{policy.passwordLogin&&policy.passwordReset?<><Link href="/login?mode=password-setup" className="mt-4 inline-block text-sm text-primary underline">Verify email again</Link><PasswordForm policy={policy}/></>:<p className="mt-6 text-sm">Password setup is currently disabled.</p>}</section>;}
