import { ImageResponse } from "next/og";

export const alt = "Secret Santa";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

export default function Image() {
  return new ImageResponse(
    <div style={{ width: "100%", height: "100%", display: "flex", alignItems: "center", justifyContent: "center", gap: 72, background: "linear-gradient(135deg, #d9f2e6, #f5f3f7 50%, #f8dcd8)" }}>
      <div style={{ display: "flex", flexDirection: "column", alignItems: "center", width: 280 }}>
        <div style={{ width: 280, height: 64, background: "#c8322f", borderRadius: 18, display: "flex", justifyContent: "center" }}>
          <div style={{ width: 44, height: 64, background: "#e9b949" }} />
        </div>
        <div style={{ width: 240, height: 190, background: "#b52a27", borderRadius: "0 0 32px 32px", display: "flex", justifyContent: "center" }}>
          <div style={{ width: 44, height: 190, background: "#e9b949" }} />
        </div>
      </div>
      <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
        <div style={{ fontSize: 92, fontWeight: 700, color: "#1c1c1e" }}>Secret Santa</div>
        <div style={{ fontSize: 40, color: "#636366" }}>Pick your name. Keep the secret.</div>
      </div>
    </div>,
    size,
  );
}
