import { ImageResponse } from "next/og";
import { CI, Gift, Lights, OG_SIZE, ogFonts, Sparkle, Stamp } from "@/lib/og";

export const alt = "Secret Santa: draw names, keep the secret";
export const size = OG_SIZE;
export const contentType = "image/png";

export default async function Image() {
  return new ImageResponse(
    <div style={{ width: "100%", height: "100%", display: "flex", position: "relative" }}>
      <Lights />
      <Sparkle size={30} x={40} y={36} />
      <Sparkle size={20} x={1110} y={60} />
      <Sparkle size={24} x={812} y={560} />

      <Stamp width={760} height={470} style={{ left: 70, top: 80, transform: "rotate(-1.6deg)" }}>
        <div style={{ position: "absolute", left: 0, top: 0, width: 760, height: 470, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: 18 }}>
          <div style={{ fontFamily: "Satisfy", fontSize: 150, lineHeight: 1, color: CI.santa, display: "flex" }}>Secret Santa</div>
          <div style={{ display: "flex", fontFamily: "Fraunces Label", fontSize: 32, color: CI.sticker, background: CI.santa, borderRadius: 10, padding: "12px 34px", border: "2px dashed rgba(250,249,246,0.5)" }}>
            Draw names. Keep the secret.
          </div>
          <div style={{ fontFamily: "Fraunces", fontSize: 28, color: CI.ink2, marginTop: 10, display: "flex" }}>One link for the whole group. No sign-up.</div>
        </div>
      </Stamp>

      <Gift size={300} style={{ position: "absolute", left: 860, top: 160, transform: "rotate(7deg)" }} />
    </div>,
    { ...size, fonts: await ogFonts() },
  );
}
