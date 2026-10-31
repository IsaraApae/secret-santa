import type { Metadata, Viewport } from "next";
import { Bree_Serif, Figtree, Sarabun, Sriracha, Yellowtail } from "next/font/google";
import { ConfirmHost } from "@/components/ConfirmHost";
import { TopBar } from "@/components/TopBar";
import { siteUrl } from "@/lib/site";
import "./globals.css";

const hand = Yellowtail({ weight: "400", subsets: ["latin"], variable: "--font-hand" });
const display = Bree_Serif({ weight: "400", subsets: ["latin"], variable: "--font-display" });
const body = Figtree({ subsets: ["latin"], variable: "--font-body" });
const thaiHand = Sriracha({ weight: "400", subsets: ["thai"], variable: "--font-thai-hand", preload: false });
const thai = Sarabun({ weight: ["400", "600"], subsets: ["thai"], variable: "--font-thai", preload: false });

export const metadata: Metadata = {
  metadataBase: new URL(siteUrl()),
  title: { default: "Secret Santa", template: "%s · Secret Santa" },
  description: "Draw names for your gift exchange. Share one link and everyone joins.",
  applicationName: "Secret Santa",
  appleWebApp: { capable: true, title: "Secret Santa", statusBarStyle: "default" },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
  themeColor: "#3a1511",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={`${hand.variable} ${display.variable} ${body.variable} ${thaiHand.variable} ${thai.variable}`}>
      <body className="min-h-dvh font-sans">
        <div className="edge-strip" aria-hidden />
        <div className="night" aria-hidden />
        {/* The rough edge of every paper note. */}
        <svg width="0" height="0" className="absolute" aria-hidden>
          <filter id="torn" x="-3%" y="-3%" width="106%" height="106%">
            <feTurbulence type="fractalNoise" baseFrequency="0.09" numOctaves="4" seed="7" />
            <feDisplacementMap in="SourceGraphic" scale="6" />
          </filter>
        </svg>
        <TopBar />
        <main className="mx-auto w-full max-w-[640px] space-y-6 px-4 pt-2 pb-[max(48px,env(safe-area-inset-bottom))]">{children}</main>
        <ConfirmHost />
      </body>
    </html>
  );
}
