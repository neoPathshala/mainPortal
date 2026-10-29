import {migratePlatformStorageScript} from '@/lib/platform-site';
import {NoticeReadProvider} from "@/components/notice-read-provider";
import {sessionClientBootstrap} from "@/lib/session-client-bootstrap";
import {FormValidation} from "@/components/form-validation";
import {SmoothScrolling} from "@/components/smooth-scrolling";
import {ScrollbarVisibility} from "@/components/scrollbar-visibility";
import {PlatformErrorMonitor} from '@/components/platform-error-monitor';
import {googleVerification} from '@/lib/google-verification.server';
import {SiteActivityTracker} from '@/components/site/SiteActivityTracker';
import {VisitPopups} from '@/components/site/VisitPopups';
import {readSitePresentation} from '@/lib/site-presentation.server';
import { CatalogProvider } from "@/components/catalog-provider";
import { getNavigationCatalogSnapshot } from "@/lib/catalog.server";
import { EMPTY_CATALOG } from "@/lib/catalog";
import { StudentPreferencesProvider } from "@/components/student-preferences-provider";
import { getStudentDefaults } from "@/lib/security/student-defaults";
import { getSession } from "@/lib/security/auth";
import { preload } from "react-dom";
import localFont from "next/font/local";
import { headers } from "next/headers";
import type { Metadata, Viewport } from "next";
import "./globals.css";
import { extensionErrorGuardScript } from "@/lib/extension-error-guard";
import { deviceResetScript } from "@/lib/device-reset";
import { themeInitScript } from "@/lib/theme-init";
import { SessionGuard } from "@/components/auth/SessionGuard";
import { Navbar } from "@/components/layout/Navbar";
import { Footer } from "@/components/layout/Footer";
import { ThemeProvider } from "@/components/theme-provider";


const sans = localFont({ src: "../../node_modules/next/dist/next-devtools/server/font/geist-latin.woff2", variable: "--font-geist-sans", display: "swap", weight: "100 900" });
const mono = localFont({ src: "../../node_modules/next/dist/next-devtools/server/font/geist-mono-latin.woff2", variable: "--font-geist-mono", display: "swap", weight: "100 900" });

export const maxDuration = 60;

const defaultViewport: Viewport = {
  themeColor: "#063b2c",
  width: "device-width",
  initialScale: 1,
  maximumScale: 5,
};

const defaultMetadata: Metadata = {
  metadataBase: process.env.APP_ORIGIN ? new URL(process.env.APP_ORIGIN) : undefined,
  title: "neoPathshala — Notes, Courses & Student Workspace",
  description:
    "Study resources and a student workspace for Tribhuvan University courses. Complete syllabus, chapter notes, TU past board question papers, and laboratory manuals.",
  icons: {
    icon: "/logo.webp",
    apple: "/logo.png",
  },
};

export function generateViewport():Viewport{return defaultViewport;}
export async function generateMetadata():Promise<Metadata>{const [{settings},google]=await Promise.all([readSitePresentation(),googleVerification()]);return {...defaultMetadata,...google?{verification:{google}}:{},title:settings.brand.title,description:settings.brand.description,icons:{icon:settings.brand.logo||'/logo.webp'},appleWebApp:{capable:false}};}

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const presentationTask=readSitePresentation();
  const preferencesTask=getStudentDefaults().catch(()=>({authenticated:false,courseSlug:null,semester:null}));
  const catalogTask=getNavigationCatalogSnapshot().catch(()=>EMPTY_CATALOG);
  const {settings:presentation}=await presentationTask;
  const publicPresentation={brand:presentation.brand,menus:presentation.menus};
  const nonce = (await headers()).get("x-nonce") || undefined;
  let account = null;
  let sessionId: string | null = null;
  let offlineScope = "public";
  try {
    const auth = await getSession();
    if (auth) { account = { name: auth.user.name, email: auth.user.email, avatarUrl: auth.user.avatarUrl }; sessionId = auth.session.id; offlineScope = `student-${auth.user.id}`; }
  } catch { /* Public pages remain usable when the account service is unavailable. */ }
  const mobileApp=false;
  // Use the exact, stable URL rendered by the avatar so the preload and img
  // share one request and reuse the browser’s private HTTP cache on refresh.
  if (account?.avatarUrl) preload(account.avatarUrl, { as: "image", fetchPriority: "high" });
  const preferences = await preferencesTask;
  const catalog = await catalogTask;
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <script nonce={nonce} dangerouslySetInnerHTML={{__html:migratePlatformStorageScript}}/>
        <script nonce={nonce} dangerouslySetInnerHTML={{__html:sessionClientBootstrap()}}/>
        <meta name="offline-account-scope" content={offlineScope} />
        {process.env.NODE_ENV === "development" && <script nonce={nonce} dangerouslySetInnerHTML={{ __html: extensionErrorGuardScript }} />}
        <script nonce={nonce} dangerouslySetInnerHTML={{ __html: deviceResetScript }} />
        <script nonce={nonce} dangerouslySetInnerHTML={{ __html: themeInitScript }} />

      </head>
      <body className={`${sans.variable} ${mono.variable} font-sans min-h-screen bg-background text-foreground flex flex-col antialiased`}>
        <ThemeProvider nonce={nonce} attribute="class" defaultTheme="system" enableSystem disableTransitionOnChange>

            <CatalogProvider snapshot={catalog}><StudentPreferencesProvider preferences={preferences}>
            <NoticeReadProvider key={offlineScope}><SessionGuard sessionId={sessionId} initialMobileApp={mobileApp}>
            <SiteActivityTracker/><VisitPopups/>
            <Navbar account={account} presentation={publicPresentation} initialMobileApp={mobileApp}/>
            <a href="#main-content" className="sr-only focus:not-sr-only focus:fixed focus:left-4 focus:top-4 focus:z-50 focus:rounded-lg focus:bg-card focus:p-3">Skip to content</a>
            <main id="main-content" className="site-main flex-1">{children}</main>
            <Footer initialMobileApp={mobileApp} presentation={publicPresentation} pwaEnabled={false}/>
            </SessionGuard></NoticeReadProvider>
            </StudentPreferencesProvider></CatalogProvider>
        </ThemeProvider>
      <ScrollbarVisibility/><SmoothScrolling/><FormValidation/><PlatformErrorMonitor/></body>
    </html>
  );
}
