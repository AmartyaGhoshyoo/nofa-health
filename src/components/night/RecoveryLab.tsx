"use client";

import { useMemo, useState } from "react";
import { motion } from "motion/react";
import { Eyebrow, Glass, Rise, RiseWords, Wrap, ease } from "./kit";

// Drag the delay and watch the same ripple ZOVAK computes: each visit starts at
// max(its own time, end of the previous shifted visit), skipping lunch; once a gap
// absorbs the delay, nobody later is touched.
const OPEN = 9 * 60;
const CLOSE = 17 * 60;
const LUNCH: [number, number] = [13 * 60, 14 * 60];
const VISIT = 30;
const PATIENTS = [
  { name: "Ali", at: 9 * 60 },
  { name: "Bina", at: 9 * 60 + 30 },
  { name: "Chandni", at: 10 * 60 },
  { name: "Dipu", at: 11 * 60 },
  { name: "Eshita", at: 11 * 60 + 30 },
  { name: "Farhan", at: 14 * 60 },
  { name: "Gita", at: 15 * 60 + 30 },
];

function ripple(delay: number) {
  let cursor = OPEN + delay;
  let reached = true;
  return PATIENTS.map((p) => {
    if (!reached || p.at >= cursor) {
      reached = false;
      return { ...p, now: p.at, moved: false, newTime: false };
    }
    let start = Math.max(p.at, cursor);
    if (start < LUNCH[1] && start + VISIT > LUNCH[0]) start = LUNCH[1];
    if (start + VISIT > CLOSE) return { ...p, now: null, moved: true, newTime: true };
    cursor = start + VISIT;
    return { ...p, now: start, moved: true, newTime: false };
  });
}

const clock = (m: number) => {
  const h = Math.floor(m / 60);
  return `${((h + 11) % 12) + 1}:${String(m % 60).padStart(2, "0")}`;
};
const pct = (m: number) => `${((m - OPEN) / (CLOSE - OPEN)) * 100}%`;

export default function RecoveryLab() {
  const [delay, setDelay] = useState(45);
  const rows = useMemo(() => ripple(delay), [delay]);
  const told = rows.filter((r) => r.moved);
  const first = told[0];

  return (
    <section id="recovery" className="relative py-28 sm:py-36">
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(50%_40%_at_20%_50%,rgba(200,241,105,0.06),transparent_70%)]" />
      <Wrap className="relative">
        <Eyebrow>Running late · try it</Eyebrow>
        <h2 className="mt-5 max-w-[52rem] font-display text-[clamp(2.4rem,5vw,4.4rem)] leading-[1.02] text-white">
          <RiseWords text="When a doctor runs late, only the *right* patients hear about it." />
        </h2>

        <Rise className="mt-12">
          <Glass className="p-5 sm:p-8">
            <div className="flex flex-wrap items-end justify-between gap-6">
              <div>
                <p className="text-[0.85rem] text-white/50">Dr. Ayesha Rahman · 9 AM – 5 PM · lunch 1–2</p>
                <p className="mt-1 font-display text-[2rem] text-white">
                  Running <span className="font-serif italic text-spark">{delay}</span> minutes late
                </p>
              </div>
              <label className="w-full max-w-[22rem]">
                <span className="sr-only">Delay in minutes</span>
                <input
                  type="range"
                  min={0}
                  max={120}
                  step={5}
                  value={delay}
                  onChange={(e) => setDelay(Number(e.target.value))}
                  className="w-full cursor-pointer accent-[#C8F169]"
                />
                <span className="mt-1 flex justify-between font-mono text-[0.68rem] text-white/35">
                  <span>on time</span>
                  <span>1 h</span>
                  <span>2 h</span>
                </span>
              </label>
            </div>

            {/* Timeline */}
            <div className="mt-8 overflow-x-auto pb-2 lg:overflow-visible">
              <div className="relative mr-8 h-[13.5rem] min-w-[640px]">
                {[9, 10, 11, 12, 13, 14, 15, 16, 17].map((h) => (
                  <span key={h} className="absolute top-0 h-full border-l border-white/[0.06]" style={{ left: pct(h * 60) }}>
                    <span className="absolute -top-0.5 left-1 font-mono text-[0.64rem] text-white/35">{clock(h * 60)}</span>
                  </span>
                ))}
                <span
                  className="absolute top-6 h-[calc(100%-1.5rem)] [background:repeating-linear-gradient(135deg,transparent_0_6px,rgba(255,255,255,0.05)_6px_12px)]"
                  style={{ left: pct(LUNCH[0]), width: `${(60 / (CLOSE - OPEN)) * 100}%` }}
                >
                  <span className="absolute bottom-1 left-1.5 font-mono text-[0.6rem] uppercase text-white/30">lunch</span>
                </span>
                {delay > 0 && (
                  <motion.span
                    className="absolute top-6 z-10 h-[calc(100%-1.5rem)] w-px bg-spark shadow-[0_0_14px_#C8F169]"
                    animate={{ left: pct(OPEN + delay) }}
                    transition={{ duration: 0.5, ease }}
                  >
                    <span className="absolute -top-1 left-1.5 whitespace-nowrap rounded bg-spark px-1.5 py-0.5 text-[0.62rem] font-bold text-night">
                      arrives {clock(OPEN + delay)}
                    </span>
                  </motion.span>
                )}
                {rows.map((r, i) => {
                  const top = `${2.5 + (i % 4) * 2.6}rem`;
                  return (
                    <div key={r.name}>
                      {r.moved && (
                        <span
                          className="absolute h-9 rounded-lg border border-dashed border-white/20"
                          style={{ left: pct(r.at), width: `${(VISIT / (CLOSE - OPEN)) * 100}%`, top }}
                        />
                      )}
                      <motion.span
                        className={`absolute flex h-9 items-center justify-center rounded-lg px-1 text-[0.72rem] font-bold ${
                          r.newTime
                            ? "bg-rose-500/80 text-white"
                            : r.moved
                              ? "bg-spark text-night shadow-[0_0_24px_-4px_rgba(200,241,105,0.7)]"
                              : "bg-aqua/15 text-aqua"
                        }`}
                        style={{ width: `${(VISIT / (CLOSE - OPEN)) * 100}%`, top }}
                        animate={{ left: pct(r.now ?? CLOSE - VISIT) }}
                        transition={{ duration: 0.55, ease }}
                        title={`${r.name}: ${clock(r.at)}${r.moved ? ` → ${r.now ? clock(r.now) : "needs a new time"}` : " (untouched)"}`}
                      >
                        {r.name}
                      </motion.span>
                    </div>
                  );
                })}
              </div>
            </div>

            <div className="mt-6 grid gap-6 lg:grid-cols-[1fr_20rem]">
              <div className="flex flex-wrap gap-3">
                <Stat value={told.length} label="patients told" tone="spark" />
                <Stat value={rows.length - told.length} label="untouched" tone="aqua" />
                <Stat value={told.filter((r) => r.newTime).length} label="need a new time" tone="rose" />
                <p className="w-full text-[0.9rem] leading-relaxed text-white/50">
                  Staff see this preview first — nobody is notified until they press send. Each patient gets a one-time link
                  to keep the new time, see another free doctor at the original time, pick another slot, or cancel.
                </p>
              </div>
              <Sms name={first?.name} at={first?.at} now={first?.now} delay={delay} />
            </div>
          </Glass>
        </Rise>
      </Wrap>
    </section>
  );
}

function Stat({ value, label, tone }: { value: number; label: string; tone: "spark" | "aqua" | "rose" }) {
  const color = tone === "spark" ? "text-spark" : tone === "aqua" ? "text-aqua" : "text-rose-400";
  return (
    <div className="min-w-[8.5rem] rounded-2xl border border-white/10 px-4 py-3">
      <motion.p key={value} initial={{ y: 8, opacity: 0 }} animate={{ y: 0, opacity: 1 }} className={`font-display text-[2rem] leading-none ${color}`}>
        {value}
      </motion.p>
      <p className="mt-1 text-[0.78rem] text-white/50">{label}</p>
    </div>
  );
}

function Sms({ name, at, now, delay }: { name?: string; at?: number; now?: number | null; delay: number }) {
  return (
    <div className="rounded-[1.4rem] border border-white/10 bg-night-900 p-4">
      <p className="text-center font-mono text-[0.64rem] uppercase tracking-wider text-white/35">Text message · Brightside</p>
      {name && at !== undefined ? (
        <motion.p
          key={`${name}-${delay}`}
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          className="mt-3 rounded-2xl rounded-tl-md bg-white/10 px-3.5 py-2.5 text-[0.82rem] leading-relaxed text-white/90"
        >
          Hi {name}, Dr. Ayesha Rahman is running about {delay} minutes late.{" "}
          {now ? `Your ${clock(at)} appointment is now at ${clock(now)}.` : "We need to find you a new time."} Choose another
          option: <span className="text-aqua underline">nofa.link/update/x7k2</span>
        </motion.p>
      ) : (
        <p className="mt-3 text-center text-[0.84rem] text-white/45">On time — nobody needs a message.</p>
      )}
    </div>
  );
}
