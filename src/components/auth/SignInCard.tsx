import Link from 'next/link';
import {LockKeyhole,ArrowUpRight} from 'lucide-react';
import {Button} from '@/components/ui/button';
export function SignInCard({title='Sign in to continue',description,href='/login'}:{title?:string;description:string;href?:string}){
 return <section className="mb-6 flex flex-wrap items-center justify-between gap-4 rounded-xl border border-border bg-card p-5"><div className="flex min-w-0 flex-1 items-center gap-3"><span className="flex size-11 shrink-0 items-center justify-center rounded-xl bg-primary/8 text-primary"><LockKeyhole size={21} aria-hidden="true"/></span><div className="min-w-0"><h2 className="text-sm font-semibold">{title}</h2><p className="mt-2 text-xs leading-6 text-muted-foreground">{description}</p></div></div><Button asChild size="sm" className="shrink-0"><Link href={href}>Sign in<ArrowUpRight size={14} className="ml-2" aria-hidden="true"/></Link></Button></section>;
}
