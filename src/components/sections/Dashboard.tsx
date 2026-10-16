"use client";

import { useEffect, useRef, useState } from "react";
import { AnimatePresence, animate, motion, useInView, useReducedMotion } from "motion/react";
import Container from "../ui/Container";
import SectionHeading from "../ui/SectionHeading";
import { site } from "@/config/site";

// Admin dashboard preview. All numbers are illustrative sample data.

const ease = [0.22, 1, 0.36, 1] as const;

const KPIS = [
  { label: "Calls answered", value: 1284, suffix: "", spark: [8, 12, 10, 15, 14, 18, 22] },
  { label: "Appointments booked", value: 412, suffix: "", spark: [5, 7, 6, 9, 11, 10, 13] },
  { label: "Slots recovered", value: 63, suffix: "", spark: [1, 2, 4, 3, 6, 7, 9] },
  { label: "Handed to staff", value: 7, suffix: "%", spark: [9, 8, 9, 7, 8, 7, 7] },
];

const HOURS = [
  { h: "8a", v: 14 },
  { h: "9a", v: 31 },
  { h: "10a", v: 42 },
  { h: "11a", v: 38 },
  { h: "12p", v: 22 },
  { h: "1p", v: 27 },
  { h: "2p", v: 35 },
  { h: "3p", v: 33 },
  { h: "4p", v: 29 },
  { h: "5p", v: 18 },
  { h: "6p", v: 24 },
  { h: "7p", v: 16 },
  { h: "After", v: 21 },
];
const MAX = 45;

const FEED = [
  "Booked · annual check-up · Dr. Chen · Tue 9:00",
  "Rescheduled · follow-up → Fri 10:00",
  "Waitlist filled · Room 2 · 2:45",
  "Handed to staff · billing question",
  "Reminder confirmed · 3 patients",
  "After-hours call · booked Mon 8:30",
];

function CountUp({ to, run }: { to: number; run: boolean }) {
  const ref = useRef<HTMLSpanElement>(null);
  const reduce = useReducedMotion();
  useEffect(() => {
    if (!run || !ref.current) return;
    if (reduce) {
      ref.current.textContent = to.toLocaleString();
      return;
    }
    const c = animate(0, to, {
      duration: 1.6,
      ease: [0.22, 1, 0.36, 1],
      onUpdate: (v) => ref.current && (ref.current.textContent = Math.round(v).toLocaleString()),
    });
    return () => c.stop();
  }, [run, to, reduce]);
  return <span ref={ref}>0</span>;
}

function Sparkline({ data, run }: { data: number[]; run: boolean }) {
  const max = Math.max(...data);
  const pts = data.map((v, i) => `${(i / (data.length - 1)) * 100},${30 - (v / max) * 26}`).join(" ");
  return (
    <svg viewBox="0 0 100 32" className="h-8 w-full" preserveAspectRatio="none" aria-hidden="true">
      <motion.polyline
        points={pts}
        fill="none"
        stroke="#0891B2"
        strokeWidth="2"
        vectorEffect="non-scaling-stroke"
        strokeLinecap="round"
        strokeLinejoin="round"
        initial={{ pathLength: 0 }}
        animate={{ pathLength: run ? 1 : 0 }}
        transition={{ duration: 1.4, ease }}
      />
    </svg>
  );
}

export default function Dashboard() {
  const ref = useRef<HTMLDivElement>(null);
  const run = useInView(ref, { amount: 0.3, once: true });
  const live = useInView(ref, { amount: 0.3 });
  const reduce = useReducedMotion();
  const [hover, setHover] = useState<number | null>(null);
  const [feed, setFeed] = useState(FEED.slice(0, 4).map((text, id) => ({ id, text })));
  const feedIdx = useRef(4);

  // Activity feed keeps ticking while visible
  useEffect(() => {
    if (!live || reduce) return;
    const id = setInterval(() => {
      const id = feedIdx.current++;
      const text = FEED[id % FEED.length]!;
      setFeed((f) => [{ id, text }, ...f].slice(0, 4));
    }, 2600);
    return () => clearInterval(id);
  }, [live, reduce]);

  return (
    <section className="relative bg-canvas-soft py-24 md:py-32">
      <Container>
        <SectionHeading
          eyebrow="Visibility"
          title={
            <>
              See every call, booking and <em className="text-gradient">recovered slot.</em>
            </>
          }
          description="Call volume, bookings, cancellations, recovered slots, handoffs and service performance — in one place, with a full audit trail."
          className="mb-14"
        />

        <motion.div
          ref={ref}
          initial={{ opacity: 0, y: 40 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.9, ease }}
          className="overflow-hidden rounded-[28px] bg-surface shadow-[0_50px_100px_-50px_rgba(6,42,51,0.45)] ring-1 ring-line"
        >
          {/* Window bar */}
          <div className="flex items-center gap-3 border-b border-line px-5 py-3">
            <div className="flex gap-1.5">
              {[0, 1, 2].map((i) => (
                <span key={i} className="h-2.5 w-2.5 rounded-full bg-ink/15" />
              ))}
            </div>
            <span className="text-[0.85rem] font-bold">{site.name} · Today</span>
            <span className="ml-auto rounded-full bg-canvas-soft px-2.5 py-1 text-[0.72rem] text-ink-faint">Illustrative data</span>
          </div>

          <div className="grid gap-px bg-line lg:grid-cols-[1.6fr_1fr]">
            <div className="bg-surface p-5 sm:p-6">
              {/* KPI tiles */}
              <dl className="grid grid-cols-2 gap-3 md:grid-cols-4">
                {KPIS.map((k) => (
                  <div key={k.label} className="rounded-2xl bg-canvas p-4">
                    <dt className="text-[0.8rem] text-ink-faint">{k.label}</dt>
                    <dd className="mt-1 font-display text-[2.2rem] leading-none">
                      <CountUp to={k.value} run={run} />
                      {k.suffix}
                    </dd>
                    <dd className="mt-2">
                      <Sparkline data={k.spark} run={run} />
                    </dd>
                  </div>
                ))}
              </dl>

              {/* Bar chart: single series → no legend; title names it */}
              <figure className="mt-6">
                <figcaption className="flex items-baseline justify-between">
                  <span className="font-bold">Calls by hour</span>
                  <span className="text-[0.8rem] text-ink-faint">“After” = after-hours calls</span>
                </figcaption>
                <div className="relative mt-4 h-[200px]">
                  {/* recessive gridlines */}
                  {[0, 15, 30, 45].map((g) => (
                    <div key={g} className="absolute inset-x-0 border-t border-dashed border-line" style={{ bottom: `${(g / MAX) * 100}%` }}>
                      <span className="absolute -top-2.5 left-0 bg-surface pr-1 font-mono text-[0.65rem] text-ink-faint">{g}</span>
                    </div>
                  ))}
                  <div className="absolute inset-0 left-6 flex items-end gap-[2px]" onMouseLeave={() => setHover(null)}>
                    {HOURS.map((d, i) => (
                      <div
                        key={d.h}
                        className="relative flex h-full flex-1 items-end"
                        onMouseEnter={() => setHover(i)}
                        onFocus={() => setHover(i)}
                        tabIndex={0}
                        aria-label={`${d.h}: ${d.v} calls`}
                      >
                        <motion.div
                          className={`w-full rounded-t-[4px] transition-colors ${hover === i ? "bg-teal" : "bg-teal-bright"} ${
                            d.h === "After" ? "opacity-70" : ""
                          }`}
                          initial={{ height: 0 }}
                          animate={{ height: run ? `${(d.v / MAX) * 100}%` : 0 }}
                          transition={{ duration: 0.9, delay: i * 0.04, ease }}
                        />
                        <AnimatePresence>
                          {hover === i && (
                            <motion.div
                              initial={{ opacity: 0, y: 4 }}
                              animate={{ opacity: 1, y: 0 }}
                              exit={{ opacity: 0 }}
                              className="pointer-events-none absolute left-1/2 z-10 -translate-x-1/2 whitespace-nowrap rounded-lg bg-ink px-2.5 py-1.5 text-[0.75rem] text-white shadow-lg"
                              style={{ bottom: `calc(${(d.v / MAX) * 100}% + 8px)` }}
                            >
                              <span className="font-bold">{d.v}</span> calls · {d.h}
                            </motion.div>
                          )}
                        </AnimatePresence>
                      </div>
                    ))}
                  </div>
                </div>
                <div className="ml-6 mt-2 flex gap-[2px] font-mono text-[0.65rem] text-ink-faint">
                  {HOURS.map((d, i) => (
                    <span key={d.h} className="flex-1 text-center">
                      {i % 2 === 0 ? d.h : ""}
                    </span>
                  ))}
                </div>
                {/* Table view for screen readers */}
                <table className="sr-only">
                  <caption>Calls by hour (illustrative)</caption>
                  <tbody>
                    {HOURS.map((d) => (
                      <tr key={d.h}>
                        <th scope="row">{d.h}</th>
                        <td>{d.v}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </figure>
            </div>

            {/* Activity feed */}
            <div className="bg-surface p-5 sm:p-6">
              <p className="flex items-center gap-2 font-bold">
                <span className="relative flex h-2 w-2">
                  <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-mint opacity-60" />
                  <span className="relative inline-flex h-2 w-2 rounded-full bg-mint" />
                </span>
                Live activity
              </p>
              <ul className="mt-4 space-y-2.5" aria-live="off">
                <AnimatePresence initial={false}>
                  {feed.map((f) => (
                    <motion.li
                      key={f.id}
                      layout
                      initial={{ opacity: 0, y: -14 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0 }}
                      transition={{ duration: 0.4, ease }}
                      className="rounded-xl bg-canvas px-3.5 py-3 text-[0.88rem]"
                    >
                      {f.text}
                    </motion.li>
                  ))}
                </AnimatePresence>
              </ul>
              <p className="mt-5 text-[0.82rem] text-ink-faint">Every action is logged with who, what and when — exportable for audits.</p>
            </div>
          </div>
        </motion.div>
      </Container>
    </section>
  );
}
