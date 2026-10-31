import type { Metadata, Viewport } from "next";
import { cookies, headers } from "next/headers";
import { ConfirmHost } from "@/components/ConfirmHost";
import { TopBar } from "@/components/TopBar";
import { LangProvider, type Lang } from "@/lib/i18n";
import { siteUrl } from "@/lib/site";
import "./globals.css";

export const metadata: Metadata = {
  metadataBase: new URL(siteUrl()),
  title: { default: "Secret Santa", template: "%s · Secret Santa" },
  description: "Draw names for your gift exchange. Share one link. Nobody sees who drew whom, not even the organiser.",
  applicationName: "Secret Santa",
  appleWebApp: { capable: true, title: "Secret Santa", statusBarStyle: "default" },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
};

// Runs before paint so there's no light/dark flash, and follows the system
// setting unless the person picked one. Same approach as Bill Splitter.
const themeScript = `(function(){try{
var d=document.documentElement,mq=matchMedia('(prefers-color-scheme: dark)');
function pref(){try{return localStorage.getItem('ss:theme')}catch(e){return null}}
function apply(){var t=pref();d.classList.toggle('dark',t==='dark'||(t!=='light'&&mq.matches));
var c=getComputedStyle(d).getPropertyValue('--edge-solid').trim();var m=document.querySelector('meta[name="theme-color"]');if(m&&c)m.setAttribute('content',c)}
apply();
mq.addEventListener('change',apply);
addEventListener('ss-theme',apply);
addEventListener('storage',function(e){if(e.key==='ss:theme')apply()});
}catch(e){}})()`;

async function pickLang(): Promise<Lang> {
  const saved = (await cookies()).get("ss-lang")?.value;
  if (saved === "th" || saved === "en") return saved;
  return /^th\b/i.test((await headers()).get("accept-language") ?? "") ? "th" : "en";
}

export default async function RootLayout({ children }: { children: React.ReactNode }) {
  const lang = await pickLang();
  return (
    <html lang={lang} suppressHydrationWarning>
      <head>
        <meta name="theme-color" content="#f1eff0" />
        <script dangerouslySetInnerHTML={{ __html: themeScript }} />
      </head>
      <body className="min-h-dvh font-sans">
        <div id="strip" aria-hidden />
        <div className="app-bg" aria-hidden />
        <LangProvider initial={lang}>
          <TopBar />
          <main className="mx-auto w-full max-w-[640px] space-y-5 px-4 pt-4 pb-[max(40px,env(safe-area-inset-bottom))]">{children}</main>
          <ConfirmHost />
        </LangProvider>
      </body>
    </html>
  );
}
