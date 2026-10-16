import { ImageResponse } from "next/og";
import { site } from "@/config/site";

// Link-preview image (WhatsApp, LinkedIn, X, iMessage, Slack…), rendered at
// build time to a static 1200×630 PNG. Dark "ocean" card so it stands out
// against the white chat backgrounds most apps use.
export const alt = `${site.name} — ${site.tagline}. Every patient answered. Every slot filled.`;
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

const OCEAN = "#062A33";
const TEAL = "#0E7490";
const CYAN = "#22D3EE";
const MINT = "#6EE7B7";
const INK = "#0F2B33";

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
  const [display, sans, sansBold] = await Promise.all([
    loadFont("Bricolage+Grotesque", "wght@700"),
    loadFont("Plus+Jakarta+Sans", "wght@500"),
    loadFont("Plus+Jakarta+Sans", "wght@700"),
  ]);
  const fonts = [
    display && { name: "Display", data: display, style: "normal" as const, weight: 700 as const },
    sans && { name: "Sans", data: sans, style: "normal" as const, weight: 500 as const },
    sansBold && { name: "Sans", data: sansBold, style: "normal" as const, weight: 700 as const },
  ].filter((f): f is NonNullable<typeof f> => Boolean(f));

  const host = site.url.replace(/^https?:\/\//, "");

  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          position: "relative",
          overflow: "hidden",
          background: `linear-gradient(135deg, ${OCEAN} 0%, #0A3A46 55%, #0B4A4F 100%)`,
          fontFamily: "Sans",
        }}
      >
        {/* Glows */}
        <div style={{ position: "absolute", right: -160, top: -220, width: 720, height: 720, borderRadius: 9999, background: "radial-gradient(circle, rgba(34,211,238,0.42), rgba(34,211,238,0) 65%)" }} />
        <div style={{ position: "absolute", left: -240, bottom: -320, width: 720, height: 720, borderRadius: 9999, background: "radial-gradient(circle, rgba(16,185,129,0.32), rgba(16,185,129,0) 65%)" }} />
        {/* Dot grid */}
        <div
          style={{
            position: "absolute",
            inset: 0,
            backgroundImage: "radial-gradient(rgba(255,255,255,0.09) 1.5px, transparent 1.5px)",
            backgroundSize: "28px 28px",
          }}
        />

        {/* Left: brand + headline */}
        <div style={{ display: "flex", flexDirection: "column", padding: "58px 0 0 70px", width: 700 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
            <div style={{ width: 56, height: 56, borderRadius: 16, background: TEAL, display: "flex", alignItems: "center", justifyContent: "center", position: "relative", boxShadow: "0 10px 30px rgba(34,211,238,0.35)" }}>
              <div style={{ position: "absolute", width: 9, height: 32, borderRadius: 5, background: "#fff" }} />
              <div style={{ position: "absolute", width: 32, height: 9, borderRadius: 5, background: CYAN }} />
            </div>
            <div style={{ fontFamily: "Display", fontSize: 40, color: "#fff", letterSpacing: -1 }}>{site.name}</div>
          </div>

          <div style={{ display: "flex", flexDirection: "column", marginTop: 46, fontFamily: "Display", fontSize: 64, lineHeight: 1.04, letterSpacing: -2.5 }}>
            <div style={{ color: "#fff" }}>Every patient answered.</div>
            <div
              style={{
                backgroundImage: `linear-gradient(90deg, ${CYAN}, ${MINT})`,
                backgroundClip: "text",
                color: "transparent",
              }}
            >
              Every slot filled.
            </div>
          </div>

          <div style={{ display: "flex", marginTop: 22, fontSize: 25, color: "rgba(255,255,255,0.72)" }}>
            The AI front desk for clinics — voice & chat, 24/7.
          </div>

          <div style={{ display: "flex", gap: 10, marginTop: 30 }}>
            {["Answers every call", "Books in real time", "Fixes the schedule"].map((t) => (
              <div
                key={t}
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: 10,
                  padding: "9px 16px",
                  borderRadius: 9999,
                  background: "rgba(255,255,255,0.08)",
                  border: "1.5px solid rgba(255,255,255,0.14)",
                  color: "#fff",
                  fontSize: 17,
                  fontWeight: 700,
                  whiteSpace: "nowrap",
                }}
              >
                <div style={{ width: 9, height: 9, borderRadius: 9999, background: MINT }} />
                {t}
              </div>
            ))}
          </div>
        </div>

        {/* Right: live call card */}
        <div
          style={{
            position: "absolute",
            right: 70,
            top: 112,
            width: 360,
            display: "flex",
            flexDirection: "column",
            gap: 14,
            padding: 24,
            borderRadius: 30,
            background: "#fff",
            boxShadow: "0 40px 90px rgba(0,0,0,0.45)",
            transform: "rotate(3deg)",
          }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
            <div style={{ width: 46, height: 46, borderRadius: 9999, background: "rgba(14,116,144,0.1)", color: TEAL, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 18, fontWeight: 700 }}>MR</div>
            <div style={{ display: "flex", flexDirection: "column" }}>
              <div style={{ fontSize: 20, fontWeight: 700, color: INK }}>Maya Rodriguez</div>
              <div style={{ fontSize: 15, color: "#5B737C" }}>On call · 0:24</div>
            </div>
            <div style={{ display: "flex", marginLeft: "auto", padding: "5px 12px", borderRadius: 9999, background: "rgba(190,18,60,0.08)", color: "#BE123C", fontSize: 14, fontWeight: 700, alignItems: "center", gap: 6 }}>
              <div style={{ width: 8, height: 8, borderRadius: 9999, background: "#BE123C" }} />
              Live
            </div>
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: 4, height: 44 }}>
            {[10, 22, 34, 18, 38, 26, 12, 30, 40, 20, 28, 14, 34, 24, 10, 26, 36, 16, 22, 12].map((h, i) => (
              <div key={i} style={{ width: 11, height: h, borderRadius: 6, background: "#0891B2" }} />
            ))}
          </div>
          <div style={{ display: "flex", alignSelf: "flex-end", padding: "10px 14px", borderRadius: 16, background: "#EAF3F3", color: INK, fontSize: 17 }}>
            Can I move my Thursday visit?
          </div>
          <div style={{ display: "flex", padding: "10px 14px", borderRadius: 16, background: TEAL, color: "#fff", fontSize: 17 }}>
            I have Friday at 10 — shall I book it?
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: 10, padding: "12px 14px", borderRadius: 16, background: "rgba(5,150,105,0.1)", border: "1.5px solid rgba(5,150,105,0.25)" }}>
            <div style={{ width: 28, height: 28, borderRadius: 9999, background: "#059669", display: "flex", alignItems: "center", justifyContent: "center" }}>
              <svg width="16" height="16" viewBox="0 0 24 24">
                <path d="M6 12.5l4 4 8-9" stroke="#fff" strokeWidth="3" fill="none" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            </div>
            <div style={{ display: "flex", flexDirection: "column" }}>
              <div style={{ fontSize: 17, fontWeight: 700, color: INK }}>Booked · Fri 10:00</div>
              <div style={{ fontSize: 14, color: "#047857" }}>Confirmed by EHR</div>
            </div>
          </div>
        </div>

        {/* Play badge */}
        <div
          style={{
            position: "absolute",
            right: 236,
            top: 46,
            display: "flex",
            alignItems: "center",
            gap: 10,
            padding: "10px 18px 10px 10px",
            borderRadius: 9999,
            background: "rgba(255,255,255,0.12)",
            border: "1.5px solid rgba(255,255,255,0.2)",
            color: "#fff",
            fontSize: 17,
            fontWeight: 700,
          }}
        >
          <div style={{ width: 34, height: 34, borderRadius: 9999, background: CYAN, display: "flex", alignItems: "center", justifyContent: "center" }}>
            <svg width="16" height="16" viewBox="0 0 24 24" style={{ marginLeft: 3 }}>
              <path d="M7 4.5v15a1 1 0 0 0 1.5.86l12.4-7.5a1 1 0 0 0 0-1.72L8.5 3.64A1 1 0 0 0 7 4.5z" fill={OCEAN} />
            </svg>
          </div>
          Hear a live demo call
        </div>

        {/* SMS toast */}
        <div
          style={{
            position: "absolute",
            right: 40,
            bottom: 76,
            width: 260,
            display: "flex",
            flexDirection: "column",
            gap: 4,
            padding: "14px 16px",
            borderRadius: 18,
            background: "#04222A",
            border: "1.5px solid rgba(34,211,238,0.3)",
            boxShadow: "0 20px 40px rgba(0,0,0,0.4)",
            transform: "rotate(-2deg)",
          }}
        >
          <div style={{ fontSize: 13, fontWeight: 700, color: CYAN, letterSpacing: 1 }}>SMS · JUST NOW</div>
          <div style={{ display: "flex", fontSize: 16, color: "rgba(255,255,255,0.9)" }}>{"You're booked with Dr. Chen, Fri 10:00 AM."}</div>
        </div>

        {/* Footer */}
        <div style={{ position: "absolute", left: 70, bottom: 36, display: "flex", alignItems: "center", gap: 14, fontSize: 20, color: "rgba(255,255,255,0.6)" }}>
          <div style={{ color: "#fff", fontWeight: 700 }}>{host}</div>
          <div>·</div>
          <div style={{ display: "flex" }}>{`A product by ${site.builtBy.name}`}</div>
        </div>
      </div>
    ),
    { ...size, fonts }
  );
}
