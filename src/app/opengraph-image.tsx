import { ImageResponse } from "next/og";
import { site } from "@/config/site";

// Link-preview image (WhatsApp, LinkedIn, X, iMessage, Slack…), rendered at build time to
// a static 1200×630 PNG, in the homepage's "night shift" look: near-black, flowing light
// ribbons, the serif-italic accent, and a small live booking on the right.
export const alt = `${site.name} — ${site.tagline}. Every patient answered. Every slot, kept.`;
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

const NIGHT = "#04080A";
const AQUA = "#5EEAD4";
const SKY = "#67E8F9";
const SPARK = "#C8F169";
const WHITE = "#FFFFFF";

async function loadFont(family: string, axis: string): Promise<ArrayBuffer | null> {
  try {
    const css = await (await fetch(`https://fonts.googleapis.com/css2?family=${family}:${axis}`)).text();
    const url = css.match(/src: url\((.+?)\) format\('(opentype|truetype)'\)/)?.[1];
    return url ? await (await fetch(url)).arrayBuffer() : null;
  } catch {
    return null;
  }
}

// The homepage's light ribbons, frozen: bundles of thin sine strands sweeping up to the right.
function ribbons(): { d: string; color: string; opacity: number; width: number }[] {
  const bundles = [
    { y: 560, slope: 0.36, amp: 46, freq: 0.0062, phase: 0.4, color: AQUA },
    { y: 640, slope: 0.46, amp: 64, freq: 0.0044, phase: 2.2, color: SKY },
    { y: 500, slope: 0.26, amp: 36, freq: 0.0078, phase: 4.1, color: SPARK },
  ];
  const strands: { d: string; color: string; opacity: number; width: number }[] = [];
  for (const b of bundles) {
    for (let k = 0; k < 16; k++) {
      let d = "";
      for (let x = -20; x <= 1220; x += 20) {
        const y =
          b.y - x * b.slope + Math.sin(x * b.freq + b.phase + k * 0.06) * b.amp +
          Math.cos(x * b.freq * 0.5 + k * 0.09) * b.amp * 0.4 + (k - 8) * 2.6;
        d += `${x === -20 ? "M" : "L"}${x},${y.toFixed(1)} `;
      }
      strands.push({ d, color: b.color, opacity: 0.12 + 0.28 * Math.sin((k / 16) * Math.PI), width: k % 5 === 0 ? 1.6 : 1 });
    }
  }
  return strands;
}

export default async function Image() {
  const [display, serif, sans, sansBold] = await Promise.all([
    loadFont("Bricolage+Grotesque", "wght@700"),
    loadFont("Instrument+Serif", "ital@1"),
    loadFont("Plus+Jakarta+Sans", "wght@500"),
    loadFont("Plus+Jakarta+Sans", "wght@700"),
  ]);
  const fonts = [
    display && { name: "Display", data: display, style: "normal" as const, weight: 700 as const },
    serif && { name: "Serif", data: serif, style: "italic" as const, weight: 400 as const },
    sans && { name: "Sans", data: sans, style: "normal" as const, weight: 500 as const },
    sansBold && { name: "Sans", data: sansBold, style: "normal" as const, weight: 700 as const },
  ].filter((f): f is NonNullable<typeof f> => Boolean(f));

  const host = site.url.replace(/^https?:\/\//, "");
  const bubble = { display: "flex", padding: "10px 14px", borderRadius: 16, fontSize: 17, lineHeight: 1.35 } as const;

  return new ImageResponse(
    (
      <div style={{ width: "100%", height: "100%", display: "flex", position: "relative", overflow: "hidden", background: NIGHT, fontFamily: "Sans" }}>
        {/* Light ribbons + glow */}
        <svg width="1200" height="630" viewBox="0 0 1200 630" style={{ position: "absolute", left: 0, top: 0 }}>
          {ribbons().map((s, i) => (
            <path key={i} d={s.d} fill="none" stroke={s.color} strokeOpacity={s.opacity} strokeWidth={s.width} />
          ))}
        </svg>
        <div style={{ position: "absolute", right: -120, top: -180, width: 680, height: 680, borderRadius: 9999, background: "radial-gradient(circle, rgba(94,234,212,0.22), rgba(94,234,212,0) 65%)" }} />

        {/* Left: brand + headline */}
        <div style={{ display: "flex", flexDirection: "column", justifyContent: "space-between", padding: "56px 0 52px 64px", width: 680 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
            <div style={{ width: 44, height: 44, borderRadius: 12, background: "#0E7490", display: "flex", alignItems: "center", justifyContent: "center", position: "relative" }}>
              <div style={{ position: "absolute", width: 7, height: 26, borderRadius: 4, background: WHITE }} />
              <div style={{ position: "absolute", width: 26, height: 7, borderRadius: 4, background: "#22D3EE" }} />
            </div>
            <div style={{ display: "flex", fontFamily: "Display", fontSize: 30, color: WHITE }}>{site.name}</div>
          </div>

          <div style={{ display: "flex", flexDirection: "column" }}>
            <div style={{ display: "flex", fontSize: 15, letterSpacing: 4, color: AQUA, fontWeight: 700 }}>AI RECEPTIONIST FOR CLINICS · CHAT · VOICE · PHONE</div>
            <div style={{ display: "flex", flexDirection: "column", marginTop: 18, fontFamily: "Display", fontSize: 76, lineHeight: 1.0, color: WHITE, letterSpacing: -2.5 }}>
              <span>Every patient</span>
              <span>answered.</span>
            </div>
            <div style={{ display: "flex", fontFamily: "Serif", fontStyle: "italic", fontSize: 80, lineHeight: 1.05, color: AQUA }}>Every slot, kept.</div>
          </div>

          <div style={{ display: "flex", alignItems: "center", gap: 14, fontSize: 18, color: "rgba(255,255,255,0.6)" }}>
            <span style={{ color: WHITE, fontWeight: 700 }}>{host}</span>
            <span>·</span>
            <span>A product by {site.builtBy.name}</span>
          </div>
        </div>

        {/* Right: a small live booking */}
        <div style={{ position: "absolute", right: 56, top: 92, width: 400, display: "flex", flexDirection: "column", gap: 10, padding: 20, borderRadius: 26, background: "rgba(7,13,16,0.82)", border: "1px solid rgba(255,255,255,0.12)", boxShadow: "0 30px 80px rgba(0,0,0,0.6)" }}>
          <div style={{ display: "flex", alignItems: "center", gap: 10, fontSize: 15, color: "rgba(255,255,255,0.85)", fontWeight: 700 }}>
            <div style={{ width: 11, height: 11, borderRadius: 9999, background: SPARK }} />
            Live · Nofa on a call
          </div>
          <div style={{ ...bubble, alignSelf: "flex-end", maxWidth: 300, background: "rgba(255,255,255,0.1)", color: WHITE }}>I&apos;ve had an itchy rash for a week.</div>
          <div style={{ ...bubble, maxWidth: 330, background: "rgba(94,234,212,0.08)", border: "1px solid rgba(94,234,212,0.25)", color: "rgba(255,255,255,0.9)" }}>
            Our skin doctor is Dr. Farhan Karim. Pick a time below.
          </div>
          <div style={{ display: "flex", alignSelf: "center", padding: "7px 14px", borderRadius: 9999, border: `1px solid ${AQUA}`, color: AQUA, fontSize: 13, letterSpacing: 1.5, fontWeight: 700 }}>
            DOCTOR SELECTED · DR. FARHAN KARIM
          </div>
          <div style={{ display: "flex", gap: 8, justifyContent: "center" }}>
            {["11:00", "11:30", "12:00"].map((t, i) => (
              <div key={t} style={{ display: "flex", padding: "7px 14px", borderRadius: 10, fontSize: 15, fontWeight: 700, background: i === 1 ? AQUA : "transparent", color: i === 1 ? NIGHT : AQUA, border: `1px solid ${i === 1 ? AQUA : "rgba(94,234,212,0.35)"}` }}>
                {t}
              </div>
            ))}
          </div>
          <div style={{ display: "flex", alignSelf: "center", padding: "9px 16px", borderRadius: 9999, background: SPARK, color: NIGHT, fontSize: 14, letterSpacing: 1.5, fontWeight: 700 }}>
            BOOKED · FRI 11:30 AM
          </div>
        </div>
      </div>
    ),
    { ...size, fonts }
  );
}
