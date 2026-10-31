import { ImageResponse } from "next/og";

export const alt = "Secret Santa: draw names, keep the secret";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

/** Google Fonts serves a .ttf to a client with no browser user agent, which is what this renderer needs. */
async function font(family: string) {
  const css = await (await fetch(`https://fonts.googleapis.com/css2?family=${family.replace(/ /g, "+")}`)).text();
  const url = css.match(/src: url\((.+?)\) format/)?.[1];
  if (!url) throw new Error(`No font file for ${family}`);
  return (await fetch(url)).arrayBuffer();
}

const TITLE = "Secret Santa";
const PROMISE = "Draw names. Keep the secret.";

export default async function Image() {
  return new ImageResponse(
    <div style={{ width: "100%", height: "100%", display: "flex", alignItems: "center", justifyContent: "center", gap: 56, padding: 40, background: "linear-gradient(135deg, #4a1512, #1c0d0b 55%, #0d2318)" }}>
      <div style={{ position: "absolute", inset: 24, borderRadius: 28, border: "3px solid #f4cb6c", display: "flex" }} />
      <svg width="330" height="330" viewBox="0 0 200 200">
        <rect x="26" y="84" width="148" height="104" rx="10" fill="#fff" stroke="#fff" strokeWidth="12" />
        <rect x="26" y="84" width="148" height="104" rx="8" fill="#b52a2a" />
        <rect x="87" y="84" width="26" height="104" fill="#f0c75e" />
        <rect x="14" y="56" width="172" height="36" rx="8" fill="#fff" stroke="#fff" strokeWidth="12" />
        <rect x="14" y="56" width="172" height="36" rx="7" fill="#c8322f" />
        <rect x="87" y="56" width="26" height="36" fill="#f0c75e" />
        <path d="M100 56C84 18 40 12 46 36c3 13 30 20 54 20zm0 0c16-38 60-44 54-20-3 13-30 20-54 20z" fill="#f0c75e" stroke="#fff" strokeWidth="5" />
        <rect x="89" y="46" width="22" height="16" rx="5" fill="#d9a93f" />
      </svg>
      <div style={{ display: "flex", flexDirection: "column", alignItems: "flex-start", gap: 26 }}>
        <div style={{ fontFamily: "Yellowtail", fontSize: 148, lineHeight: 1, color: "#f4cb6c" }}>{TITLE}</div>
        <div style={{ fontFamily: "Bree Serif", fontSize: 42, color: "#fbf5e7", background: "#b52a2a", borderRadius: 12, padding: "14px 34px", border: "3px dashed rgba(251,245,231,0.5)" }}>{PROMISE}</div>
      </div>
      {/* The renderer leaves a stray dot under the "c" of this script font, so cover it. */}
      <div style={{ position: "absolute", left: 594, top: 309, width: 11, height: 11, background: "#1f0e0b", display: "flex" }} />
    </div>,
    {
      ...size,
      fonts: [
        { name: "Yellowtail", data: await font("Yellowtail"), weight: 400 },
        { name: "Bree Serif", data: await font("Bree Serif"), weight: 400 },
      ],
    },
  );
}
