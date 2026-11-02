import type { Metadata, Viewport } from "next";
import { Allura, Fraunces, Salsa, Sarabun, Source_Serif_4, Sriracha } from "next/font/google";
import { preload } from "react-dom";
import { ConfirmHost } from "@/components/ConfirmHost";
import { TopBar } from "@/components/TopBar";
import { siteUrl } from "@/lib/site";
import "./globals.css";

// Free stand-ins for the Cultural Fest CI faces: Allura for Vintage Goods, soft Fraunces for
// Roca One, Source Serif 4 for Times New Roman MT Condensed. Salsa is the CI's own calendar face.
const hand = Allura({ weight: "400", subsets: ["latin"], variable: "--font-hand" });
// Only the axes the page uses: each extra axis roughly doubles a variable font's file.
const display = Fraunces({ subsets: ["latin"], axes: ["SOFT"], variable: "--font-display" });
const body = Source_Serif_4({ subsets: ["latin"], variable: "--font-body" });
// Only calendars use it, and they draw after the page has loaded.
const calendar = Salsa({ weight: "400", subsets: ["latin"], variable: "--font-cal", preload: false });
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
  themeColor: "#2c2825",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  // The lights fill the screen, so they're the largest paint. Start the download
  // with the HTML instead of waiting for the stylesheet to name it.
  preload("/lights.webp", { as: "image", fetchPriority: "high" });
  return (
    <html lang="en" className={`${hand.variable} ${display.variable} ${body.variable} ${calendar.variable} ${thaiHand.variable} ${thai.variable}`}>
      <body className="min-h-dvh font-sans">
        <div className="edge-strip" aria-hidden />
        <div className="night" aria-hidden />
        <TopBar />
        <main className="mx-auto w-full max-w-[640px] space-y-6 px-4 pt-2 pb-[max(48px,env(safe-area-inset-bottom))]">{children}</main>
        <ConfirmHost />
      </body>
    </html>
  );
}
