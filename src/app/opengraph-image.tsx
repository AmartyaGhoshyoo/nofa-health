import { ImageResponse } from "next/og";
import { site } from "@/config/site";

// Link-preview image (WhatsApp, LinkedIn, X, iMessage…), rendered at build time.
export const alt = `${site.name} — ${site.tagline}`;
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

async function loadFont(family: string, axis: string): Promise<ArrayBuffer | null> {
  try {
    const css = await (await fetch(`https://fonts.googleapis.com/css2?family=${family}:${axis}`)).text();
    const url = css.match(/src: url\((.+?)\) format\('(opentype|truetype)'\)/)?.[1];
    return url ? await (await fetch(url)).arrayBuffer() : null;
  } catch {
    return null;
  }
}

export default async function Image() {
  const [display, sans] = await Promise.all([loadFont("Bricolage+Grotesque", "wght@600"), loadFont("Plus+Jakarta+Sans", "wght@600")]);
  const fonts = [
    display && { name: "Display", data: display, style: "normal" as const, weight: 600 as const },
    sans && { name: "Sans", data: sans, style: "normal" as const, weight: 600 as const },
  ].filter((f): f is NonNullable<typeof f> => Boolean(f));

  return new ImageResponse(
    (
      <div style={{ width: "100%", height: "100%", display: "flex", position: "relative", background: "#F5F9F9", overflow: "hidden" }}>
        <div style={{ position: "absolute", right: -180, top: -220, width: 700, height: 700, borderRadius: 9999, background: "radial-gradient(circle, rgba(34,211,238,0.45), rgba(34,211,238,0) 70%)" }} />
        <div style={{ position: "absolute", left: -200, bottom: -300, width: 640, height: 640, borderRadius: 9999, background: "radial-gradient(circle, rgba(5,150,105,0.2), rgba(5,150,105,0) 70%)" }} />

        <div style={{ display: "flex", flexDirection: "column", padding: "64px 0 60px 72px", width: 760 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
            <div style={{ width: 52, height: 52, borderRadius: 14, background: "#0E7490", display: "flex", alignItems: "center", justifyContent: "center", position: "relative" }}>
              <div style={{ position: "absolute", width: 8, height: 30, borderRadius: 4, background: "#fff" }} />
              <div style={{ position: "absolute", width: 30, height: 8, borderRadius: 4, background: "#22D3EE" }} />
            </div>
            <div style={{ fontFamily: "Display", fontSize: 40, color: "#0F2B33", letterSpacing: -1 }}>{site.name}</div>
          </div>
          <div style={{ display: "flex", flexDirection: "column", marginTop: 56, fontFamily: "Display", fontSize: 72, lineHeight: 1.04, color: "#0F2B33", letterSpacing: -2.5 }}>
            <div>Every patient answered.</div>
            <div style={{ color: "#0E7490" }}>Every slot filled.</div>
          </div>
          <div style={{ display: "flex", marginTop: 30, fontFamily: "Sans", fontSize: 26, color: "#46606A" }}>{site.tagline} · 24/7 voice & chat</div>
        </div>

        <div style={{ position: "absolute", right: 60, top: 170, width: 330, display: "flex", flexDirection: "column", gap: 12, padding: 22, borderRadius: 26, background: "#fff", boxShadow: "0 40px 80px -30px rgba(6,42,51,0.35)", fontFamily: "Sans", transform: "rotate(2deg)" }}>
          <div style={{ display: "flex", fontSize: 18, color: "#5B737C" }}>Incoming call · Maya R.</div>
          <div style={{ display: "flex", alignItems: "flex-end", gap: 4, height: 40 }}>
            {[10, 22, 30, 16, 34, 24, 12, 28, 36, 18, 26, 14, 30, 20, 10, 24].map((h, i) => (
              <div key={i} style={{ width: 10, height: h, borderRadius: 5, background: "#0891B2" }} />
            ))}
          </div>
          <div style={{ display: "flex", padding: "10px 14px", borderRadius: 14, background: "#0E7490", color: "#fff", fontSize: 18 }}>I have Friday at 10 — shall I book it?</div>
          <div style={{ display: "flex", padding: "10px 14px", borderRadius: 14, background: "rgba(5,150,105,0.12)", color: "#047857", fontSize: 18 }}>Booked · confirmed by EHR</div>
        </div>
      </div>
    ),
    { ...size, fonts }
  );
}
