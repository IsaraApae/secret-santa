import { ImageResponse } from "next/og";
import { baht, formatDate } from "@/lib/format";
import { CI, Gift, Lights, OG_SIZE, ogFonts, Sparkle, Stamp } from "@/lib/og";
import { getPublicGroup } from "@/lib/server/groups";

export const alt = "An invitation to join a Secret Santa group";
export const size = OG_SIZE;
export const contentType = "image/png";

/** Long names step down so they stay on the card. */
const nameSize = (name: string) => (name.length <= 10 ? 124 : name.length <= 16 ? 100 : name.length <= 26 ? 80 : 62);

/** The card a chat app shows when someone sends a group's invite link. */
export default async function Image({ params }: { params: Promise<{ id: string }> }) {
  const [group, fonts] = await Promise.all([params.then((p) => getPublicGroup(p.id)), ogFonts()]);
  const name = group?.name ?? "Secret Santa";
  const joined = group?.members.length ?? 0;
  const foot = !group
    ? "Draw names. Keep the secret."
    : group.drawn
      ? "Names are drawn. Open the link to unwrap yours."
      : joined
        ? `${joined} ${joined === 1 ? "person has" : "people have"} joined. Add your name too.`
        : "Open the link to add your name.";

  return new ImageResponse(
    <div style={{ width: "100%", height: "100%", display: "flex", position: "relative" }}>
      <Lights />
      <Sparkle size={30} x={40} y={36} />
      <Sparkle size={18} x={1120} y={300} />
      <Sparkle size={24} x={812} y={560} />

      <Stamp width={790} height={500} style={{ left: 56, top: 62, transform: "rotate(-1.6deg)" }}>
        <div style={{ position: "absolute", left: 62, top: 54, width: 666, height: 392, display: "flex", flexDirection: "column", justifyContent: "center", gap: 48 }}>
          <div style={{ display: "flex", flexDirection: "column" }}>
            <div style={{ fontFamily: "Fraunces", fontSize: 30, color: CI.ink2, display: "flex" }}>You're invited to</div>
            <div style={{ fontFamily: "Allura, Sriracha", fontSize: nameSize(name), lineHeight: 1.08, color: CI.santa, marginTop: 6, display: "flex" }}>{name}</div>
          </div>
          <div style={{ display: "flex", flexDirection: "column", gap: 22 }}>
            {group && (group.budget !== null || group.date) && (
              <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
                {group.budget !== null && (
                  <div style={{ display: "flex", fontFamily: "Fraunces, Sriracha", fontSize: 32, color: CI.sticker, background: CI.santa, borderRadius: 10, padding: "10px 28px", border: "2px dashed rgba(250,249,246,0.5)" }}>
                    Budget {baht(group.budget)}
                  </div>
                )}
                {group.date && (
                  <div style={{ display: "flex", fontFamily: "Fraunces", fontSize: 30, color: CI.ink, background: CI.paperLight, borderRadius: 10, padding: "10px 24px", border: "2px solid rgba(44,40,37,0.3)" }}>
                    {formatDate(group.date)}
                  </div>
                )}
              </div>
            )}
            <div style={{ fontFamily: "Source Serif", fontSize: 30, color: CI.ink2, display: "flex" }}>{foot}</div>
          </div>
        </div>
      </Stamp>

      <div style={{ position: "absolute", left: 862, top: 70, width: 300, display: "flex", flexDirection: "column", alignItems: "center" }}>
        <div style={{ fontFamily: "Allura", fontSize: 96, lineHeight: 0.95, color: CI.gold, display: "flex", flexDirection: "column", alignItems: "center" }}>
          <span>Secret</span>
          <span>Santa</span>
        </div>
        <Gift size={250} style={{ marginTop: 26, transform: "rotate(7deg)" }} />
      </div>
    </div>,
    {
      ...size,
      fonts,
      // Chat apps and the organiser's page fetch it often, and it only changes when people join.
      headers: { "Cache-Control": "public, max-age=60, s-maxage=300, stale-while-revalidate=86400" },
    },
  );
}
