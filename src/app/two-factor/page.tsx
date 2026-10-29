import {TwoFactorSettings} from '@/components/two-factor-settings';
export const metadata={title:'Two-factor verification · neoPathshala',robots:{index:false,follow:false}};
export default function TwoFactorPage(){return <main className="mx-auto w-full max-w-lg px-5 py-16"><div className="rounded-2xl border border-border bg-card p-6 sm:p-8"><TwoFactorSettings login/></div></main>;}
