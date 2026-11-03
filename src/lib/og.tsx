import type { CSSProperties } from "react";

/** The link-preview cards: the image chat apps show when someone sends a link. */
export const OG_SIZE = { width: 1200, height: 630 };

/** The Cultural Fest CI palette, as plain values: the renderer can't read CSS variables. */
export const CI = {
  night: "#2c2825",
  gold: "#e2c75c",
  paper: "#e2d3bc",
  paperLight: "#f3ebdd",
  sticker: "#faf9f6",
  santa: "#ab2828",
  green: "#126e29",
  ink: "#2c2825",
  ink2: "#554a42",
};

/** Google Fonts serves a .ttf to a client with no browser user agent, which is what this renderer needs. */
async function font(family: string) {
  const css = await (await fetch(`https://fonts.googleapis.com/css2?family=${family.replace(/ /g, "+")}`)).text();
  const url = css.match(/src: url\((.+?)\) format/)?.[1];
  if (!url) throw new Error(`No font file for ${family}`);
  return (await fetch(url)).arrayBuffer();
}

let loading: Promise<{ name: string; data: ArrayBuffer; weight: 400 | 600 }[]> | undefined;

/** The page's faces as static files: Allura, soft Fraunces, Source Serif 4, and their Thai partners Charm and Noto Serif Thai. */
export function ogFonts() {
  loading ??= Promise.all([
    font("Allura").then((data) => ({ name: "Allura", data, weight: 400 as const })),
    font("Fraunces:opsz,wght,SOFT@72,600,100").then((data) => ({ name: "Fraunces", data, weight: 600 as const })),
    font("Source Serif 4:opsz,wght@20,400").then((data) => ({ name: "Source Serif", data, weight: 400 as const })),
    font("Charm").then((data) => ({ name: "Charm", data, weight: 400 as const })),
    font("Noto Serif Thai:wght@600").then((data) => ({ name: "Noto Serif Thai", data, weight: 600 as const })),
  ]).catch((e) => {
    loading = undefined;
    throw e;
  });
  return loading;
}

const svg = (body: string, w: number, h: number) => `data:image/svg+xml;utf8,${encodeURIComponent(`<svg xmlns="http://www.w3.org/2000/svg" width="${w}" height="${h}" viewBox="0 0 ${w} ${h}">${body}</svg>`)}`;

/** A card with perforated stamp edges, evenly spaced along each side. */
export function Stamp({ width, height, color = CI.paper, style, children }: { width: number; height: number; color?: string; style?: CSSProperties; children?: React.ReactNode }) {
  const r = 8;
  const holes = (length: number, at: (c: number) => string) => {
    const n = Math.round(length / 26);
    return Array.from({ length: n }, (_, i) => at(((i + 0.5) * length) / n)).join("");
  };
  const mask =
    holes(width, (x) => `<circle cx="${x}" cy="0" r="${r}"/><circle cx="${x}" cy="${height}" r="${r}"/>`) +
    holes(height, (y) => `<circle cx="0" cy="${y}" r="${r}"/><circle cx="${width}" cy="${y}" r="${r}"/>`);
  const shape = svg(`<mask id="m"><rect width="${width}" height="${height}" fill="#fff"/><g fill="#000">${mask}</g></mask><rect width="${width}" height="${height}" fill="${color}" mask="url(#m)"/>`, width, height);
  return (
    <div style={{ position: "absolute", width, height, display: "flex", ...style }}>
      {/* A shadow under the solid middle, so it shows below the bites without filling them. */}
      <div style={{ position: "absolute", left: r, top: r, width: width - 2 * r, height: height - 2 * r, boxShadow: "0 18px 40px rgba(0,0,0,0.5)", display: "flex" }} />
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img src={shape} width={width} height={height} alt="" style={{ position: "absolute", left: 0, top: 0 }} />
      {children}
    </div>
  );
}

/** Blurred fairy lights on the CI's warm dark, drawn as soft circles. */
export function Lights() {
  const lights: [number, number, number, string][] = [
    [80, 90, 150, "rgba(171,40,40,0.55)"],
    [330, 560, 190, "rgba(226,199,92,0.28)"],
    [620, 40, 120, "rgba(226,199,92,0.3)"],
    [900, 120, 210, "rgba(171,40,40,0.5)"],
    [1130, 470, 170, "rgba(18,110,41,0.5)"],
    [760, 600, 130, "rgba(226,199,92,0.22)"],
    [40, 520, 120, "rgba(18,110,41,0.45)"],
    [1080, 40, 90, "rgba(250,249,246,0.18)"],
    [470, 300, 80, "rgba(250,249,246,0.08)"],
  ];
  return (
    <div style={{ position: "absolute", left: 0, top: 0, width: OG_SIZE.width, height: OG_SIZE.height, display: "flex", background: CI.night }}>
      {lights.map(([x, y, size, colour]) => (
        <div
          key={`${x}-${y}`}
          style={{ position: "absolute", left: x - size, top: y - size, width: size * 2, height: size * 2, borderRadius: size, backgroundImage: `radial-gradient(circle, ${colour}, rgba(0,0,0,0) 70%)`, display: "flex" }}
        />
      ))}
    </div>
  );
}

/** The four-point star used wherever the page sparkles. */
export function Sparkle({ size, x, y }: { size: number; x: number; y: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" style={{ position: "absolute", left: x, top: y }}>
      <path d="M12 0c1 7.300 3.700 10 12 12-8.300 2-11 4.700-12 12-1-7.300-3.700-10-12-12 8.300-2 11-4.700 12-12z" fill={CI.gold} />
    </svg>
  );
}

/** The site's wrapped present, as a die-cut sticker. */
export function Gift({ size, style }: { size: number; style?: CSSProperties }) {
  return (
    <svg width={size} height={size} viewBox="0 0 200 200" style={style}>
      <rect x="26" y="84" width="148" height="104" rx="10" fill={CI.sticker} stroke={CI.sticker} strokeWidth="12" />
      <rect x="26" y="84" width="148" height="104" rx="8" fill={CI.santa} />
      <rect x="87" y="84" width="26" height="104" fill={CI.gold} />
      <rect x="14" y="56" width="172" height="36" rx="8" fill={CI.sticker} stroke={CI.sticker} strokeWidth="12" />
      <rect x="14" y="56" width="172" height="36" rx="7" fill="#bf3330" />
      <rect x="87" y="56" width="26" height="36" fill={CI.gold} />
      <path d="M100 56C84 18 40 12 46 36c3 13 30 20 54 20zm0 0c16-38 60-44 54-20-3 13-30 20-54 20z" fill={CI.gold} stroke={CI.sticker} strokeWidth="5" />
      <rect x="89" y="46" width="22" height="16" rx="5" fill="#c9ab45" />
    </svg>
  );
}
