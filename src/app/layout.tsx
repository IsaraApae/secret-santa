import type { Metadata, Viewport } from "next";
import { Charm, Fraunces, Instrument_Serif, Noto_Serif_Thai, Salsa, Satisfy } from "next/font/google";
import { preload } from "react-dom";
import { ConfirmHost } from "@/components/ConfirmHost";
import { Fall } from "@/components/Festive";
import { TopBar } from "@/components/TopBar";
import { OPEN_GRAPH, siteUrl } from "@/lib/site";
import "./globals.css";

// The Cultural Fest CI's faces in its own roles, as the closest free fonts side by side with the CI's
// samples: Satisfy for Vintage Goods (headers), soft Fraunces for Roca One (body text), Instrument Serif
// for Times New Roman MT Condensed (small headers, labels and buttons). Salsa is the CI's own calendar face.
const hand = Satisfy({ weight: "400", subsets: ["latin"], variable: "--font-hand" });
const display = Instrument_Serif({ weight: "400", subsets: ["latin"], variable: "--font-display" });
// Only the axis the page uses: each extra axis roughly doubles a variable font's file.
const body = Fraunces({ subsets: ["latin"], axes: ["SOFT"], variable: "--font-body" });
// Only calendars use it, and they draw after the page has loaded.
const calendar = Salsa({ weight: "400", subsets: ["latin"], variable: "--font-cal", preload: false });
// Thai partners in the same spirit: Charm's calligraphy beside Satisfy, and Noto Serif Thai's looped
// letters beside the serifs. Only Thai names and wishes load them.
const thaiHand = Charm({ weight: "400", subsets: ["thai"], variable: "--font-thai-hand", preload: false });
const thai = Noto_Serif_Thai({ subsets: ["thai"], variable: "--font-thai", preload: false });

export const metadata: Metadata = {
  metadataBase: new URL(siteUrl()),
  // The home page's title, in search results and link previews. Other pages put their own name first.
  title: { default: "Secret Santa: draw names online with one link", template: "%s · Secret Santa" },
  description: "Draw names for your gift exchange. Share one link and everyone joins.",
  openGraph: OPEN_GRAPH,
  applicationName: "Secret Santa",
  appleWebApp: { capable: true, title: "Secret Santa", statusBarStyle: "default" },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
  themeColor: "#451f19",
};

const ROOM_ENTRANCE = `try{var p=location.pathname,h=document.documentElement;if(/^\\/[go]\\/[\\w-]{12}$/.test(p)){if(!localStorage.getItem("ss:seen:"+p))h.classList.add("first-room");if(!localStorage.getItem("ss:results:"+p))h.classList.add("new-results")}}catch(e){}`;

export default function RootLayout({ children }: { children: React.ReactNode }) {
  // The lights fill the screen, so they're the largest paint. Start the download
  // with the HTML instead of waiting for the stylesheet to name it.
  preload("/lights.webp", { as: "image", fetchPriority: "high" });
  return (
    <html lang="en" suppressHydrationWarning className={`${hand.variable} ${display.variable} ${body.variable} ${calendar.variable} ${thaiHand.variable} ${thai.variable}`}>
      <body className="min-h-dvh font-sans">
        {/* Starts a room's first-visit entrance, and the guess results' first flip, before the first
            paint (see useRoomEntrance and useResultsReveal), so the page doesn't show and then vanish into them. */}
        <script dangerouslySetInnerHTML={{ __html: ROOM_ENTRANCE }} />
        <div className="edge-strip" aria-hidden />
        <div className="night" aria-hidden />
        {/* Snow falls on every page. */}
        <Fall kind="snow" />
        <TopBar />
        <main className="mx-auto w-full max-w-[640px] space-y-6 px-4 pt-2 pb-[max(48px,env(safe-area-inset-bottom))]">{children}</main>
        <ConfirmHost />
      </body>
    </html>
  );
}
