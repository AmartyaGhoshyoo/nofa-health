"use client";

import { useEffect, useRef, useState } from "react";
import { AnimatePresence, motion, useInView, useReducedMotion } from "motion/react";
import Container from "../ui/Container";
import SectionHeading from "../ui/SectionHeading";
import { site } from "@/config/site";

// Interactive demo of "advanced schedule recovery": one manager command →
// every affected appointment found, re-planned with the least disruption,
// patients contacted, and anything that needs a human escalated.

const ease = [0.22, 1, 0.36, 1] as const;

type Outcome = "moved" | "virtual" | "waitlist" | "escalated";
type Row = { patient: string; slot: string; outcome: Outcome; result: string; priority?: string };
type Scenario = { id: string; command: string; rows: Row[] };

const SCENARIOS: Scenario[] = [
  {
    id: "absence",
    command: "Dr. Patel is out tomorrow — handle her patients.",
    rows: [
      { patient: "J. Okafor", slot: "9:00 · Annual check-up", outcome: "moved", result: "Dr. Chen · 9:30 same day", priority: "Moved twice before" },
      { patient: "L. Brooks", slot: "9:45 · Follow-up", outcome: "virtual", result: "Virtual visit · 9:45 (kept time)" },
      { patient: "S. Haddad", slot: "10:30 · New patient", outcome: "moved", result: "Dr. Patel · Fri 10:30" },
      { patient: "P. Nguyen", slot: "11:15 · Lab review", outcome: "moved", result: "Dr. Ruiz · 11:15 same day" },
      { patient: "A. Kowalski", slot: "1:30 · Post-op check", outcome: "escalated", result: "Needs Dr. Patel — sent to staff with summary" },
      { patient: "Opened slot", slot: "2:45 · Dr. Chen", outcome: "waitlist", result: "Filled from waitlist · R. Singh" },
    ],
  },
  {
    id: "late",
    command: "Dr. Chen is running 40 minutes late.",
    rows: [
      { patient: "M. Rodriguez", slot: "2:00 · Consult", outcome: "moved", result: "Offered 2:40 — accepted" },
      { patient: "T. Adeyemi", slot: "2:30 · Follow-up", outcome: "moved", result: "Dr. Ruiz · 2:30, no wait", priority: "Waited 35 min last visit" },
      { patient: "K. Larsen", slot: "3:00 · Med review", outcome: "virtual", result: "Switched to video · 3:00" },
      { patient: "E. Moreau", slot: "3:30 · Check-up", outcome: "moved", result: "Offered 4:10 — accepted" },
      { patient: "B. Osei", slot: "4:00 · Procedure", outcome: "escalated", result: "Needs room + nurse — staff notified" },
    ],
  },
  {
    id: "room",
    command: "Room 3 is closed Friday for maintenance.",
    rows: [
      { patient: "H. Tanaka", slot: "9:00 · Minor procedure", outcome: "moved", result: "Room 1 · same time" },
      { patient: "C. Ruiz", slot: "10:15 · Ultrasound", outcome: "moved", result: "North clinic · 10:15", priority: "Prefers mornings" },
      { patient: "N. Ivanova", slot: "11:30 · Dressing change", outcome: "moved", result: "Room 2 · 11:45" },
      { patient: "G. Mensah", slot: "2:00 · Ultrasound", outcome: "moved", result: "Mon 2:00 · Room 3" },
      { patient: "Opened slot", slot: "3:30 · Room 1", outcome: "waitlist", result: "Filled from waitlist · D. Kim" },
    ],
  },
];

// Each row walks through these phases
const PHASES = ["Affected", "Finding options", "Contacting patient", "Done"] as const;

const OUTCOME_STYLE: Record<Outcome, { label: string; className: string }> = {
  moved: { label: "Rebooked", className: "bg-mint/15 text-[#34D399]" },
  virtual: { label: "Switched to virtual", className: "bg-teal-light/15 text-teal-light" },
  waitlist: { label: "Slot refilled", className: "bg-teal-light/15 text-teal-light" },
  escalated: { label: "Needs staff", className: "bg-amber/20 text-[#FBBF24]" },
};

export default function Recovery() {
  const ref = useRef<HTMLDivElement>(null);
  const inView = useInView(ref, { amount: 0.35, once: true });
  const reduce = useReducedMotion();
  const [scenario, setScenario] = useState(SCENARIOS[0]!);
  const [typed, setTyped] = useState("");
  const [tick, setTick] = useState(-1); // -1 = not started; increases as the plan executes
  const [runId, setRunId] = useState(0);

  const rows = scenario.rows;
  const totalTicks = rows.length + PHASES.length; // rows start staggered, each takes PHASES.length ticks

  // Type the command, then run
  useEffect(() => {
    if (!inView) return;
    if (reduce) {
      setTyped(scenario.command);
      setTick(totalTicks);
      return;
    }
    setTyped("");
    setTick(-1);
    let i = 0;
    const id = setInterval(() => {
      i++;
      setTyped(scenario.command.slice(0, i));
      if (i >= scenario.command.length) {
        clearInterval(id);
        setTimeout(() => setTick(0), 400);
      }
    }, 28);
    return () => clearInterval(id);
  }, [scenario, inView, reduce, runId, totalTicks]);

  useEffect(() => {
    if (tick < 0 || tick >= totalTicks) return;
    const t = setTimeout(() => setTick((n) => n + 1), 650);
    return () => clearTimeout(t);
  }, [tick, totalTicks]);

  const phaseOf = (i: number) => Math.max(-1, Math.min(PHASES.length - 1, tick - i));
  const done = rows.filter((_, i) => phaseOf(i) === PHASES.length - 1);
  const finished = tick >= totalTicks;

  const stats = [
    { label: "Affected", value: tick >= 0 ? rows.length : 0 },
    { label: "Resolved", value: done.filter((r) => r.outcome !== "escalated").length },
    { label: "To staff", value: done.filter((r) => r.outcome === "escalated").length },
    { label: "Double-bookings", value: 0 },
  ];

  return (
    <section id="recovery" className="relative scroll-mt-20 overflow-hidden bg-ocean py-24 text-white md:py-32">
      <div aria-hidden="true" className="pointer-events-none absolute inset-0">
        <div className="absolute -right-40 -top-40 h-[560px] w-[560px] rounded-full bg-teal-bright/30 blur-[140px]" />
        <div className="absolute -bottom-40 -left-40 h-[460px] w-[460px] rounded-full bg-mint/20 blur-[140px]" />
      </div>

      <Container className="relative">
        <SectionHeading
          tone="dark"
          eyebrow="Schedule recovery"
          title={
            <>
              When the day breaks, <em className="text-gradient-light">{site.agent} fixes it.</em>
            </>
          }
          description="One sentence from a manager. Every affected appointment found, re-planned with the least disruption, patients contacted — and anything tricky handed to your team."
          className="mb-14"
        />

        <div ref={ref} className="grid gap-6 lg:grid-cols-[0.85fr_1.15fr]">
          {/* Command panel */}
          <div className="flex flex-col gap-5">
            <div className="rounded-3xl bg-white/[0.06] p-6 ring-1 ring-ocean-line backdrop-blur">
              <p className="text-[0.78rem] font-bold uppercase tracking-[0.14em] text-white/50">Manager · voice or text</p>
              <p className="mt-3 min-h-[4.2em] font-display text-[1.55rem] font-medium leading-snug">
                “{typed}
                {!finished && tick < 0 && <span className="animate-blink text-teal-light">|</span>}
                {typed === scenario.command && "”"}
              </p>
              <div className="mt-5 flex flex-wrap gap-2">
                {SCENARIOS.map((s) => (
                  <button
                    key={s.id}
                    type="button"
                    onClick={() => {
                      setScenario(s);
                      setRunId((n) => n + 1);
                    }}
                    aria-pressed={scenario.id === s.id}
                    className={`min-h-[40px] cursor-pointer rounded-full px-4 py-2 text-[0.85rem] font-bold transition-colors ${
                      scenario.id === s.id ? "bg-white text-ocean" : "bg-white/10 text-white/80 hover:bg-white/20"
                    }`}
                  >
                    {s.id === "absence" ? "Doctor out" : s.id === "late" ? "Running late" : "Room closed"}
                  </button>
                ))}
                <button
                  type="button"
                  onClick={() => setRunId((n) => n + 1)}
                  className="min-h-[40px] cursor-pointer rounded-full px-4 py-2 text-[0.85rem] font-bold text-teal-light hover:bg-white/10"
                >
                  ↻ Replay
                </button>
              </div>
            </div>

            <dl className="grid grid-cols-2 gap-3">
              {stats.map((s) => (
                <div key={s.label} className="rounded-2xl bg-white/[0.06] p-4 ring-1 ring-ocean-line">
                  <dt className="text-[0.8rem] text-white/55">{s.label}</dt>
                  <dd className="mt-1 font-display text-[2.4rem] leading-none">
                    <AnimatePresence mode="popLayout" initial={false}>
                      <motion.span
                        key={s.value}
                        initial={{ y: 16, opacity: 0 }}
                        animate={{ y: 0, opacity: 1 }}
                        exit={{ y: -16, opacity: 0 }}
                        transition={{ duration: 0.3 }}
                        className="inline-block"
                      >
                        {s.value}
                      </motion.span>
                    </AnimatePresence>
                  </dd>
                </div>
              ))}
            </dl>

            <p className="text-[0.88rem] leading-relaxed text-white/55">
              Priority goes to patients who&apos;ve already been inconvenienced — prior reschedules, long waits and
              preferences all count. Nothing is confirmed until your system says so.
            </p>
          </div>

          {/* Plan execution */}
          <div className="rounded-3xl bg-white/[0.04] p-3 ring-1 ring-ocean-line sm:p-4">
            <div className="flex items-center justify-between px-3 pb-3 pt-1 text-[0.8rem] text-white/50">
              <span>Recovery plan</span>
              <span className={finished ? "text-[#34D399]" : "text-teal-light"}>
                {tick < 0 ? "Waiting for command" : finished ? "Plan complete" : "Executing…"}
              </span>
            </div>
            <ul className="space-y-2">
              {rows.map((r, i) => {
                const phase = phaseOf(i);
                const isDone = phase === PHASES.length - 1;
                const outcome = OUTCOME_STYLE[r.outcome];
                return (
                  <motion.li
                    key={`${scenario.id}-${runId}-${i}`}
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: tick < 0 ? 0.35 : 1, x: 0 }}
                    transition={{ duration: 0.5, delay: i * 0.05, ease }}
                    className={`relative overflow-hidden rounded-2xl px-4 py-3.5 ring-1 transition-colors duration-500 ${
                      isDone ? "bg-white/[0.07] ring-white/10" : phase >= 0 ? "bg-rose/10 ring-rose/30" : "bg-white/[0.03] ring-ocean-line"
                    }`}
                  >
                    {/* progress sweep */}
                    {phase >= 0 && !isDone && (
                      <motion.span
                        aria-hidden="true"
                        className="absolute inset-y-0 left-0 w-1/3 bg-gradient-to-r from-transparent via-white/10 to-transparent"
                        animate={{ x: ["-100%", "300%"] }}
                        transition={{ duration: 1.2, repeat: Infinity, ease: "linear" }}
                      />
                    )}
                    <div className="relative flex flex-wrap items-center gap-x-4 gap-y-1.5">
                      <span className="min-w-[7.5rem] font-bold">{r.patient}</span>
                      <span className={`text-[0.88rem] ${isDone ? "text-white/40 line-through" : "text-white/70"}`}>{r.slot}</span>
                      <span className="ml-auto">
                        <AnimatePresence mode="wait" initial={false}>
                          <motion.span
                            key={isDone ? "done" : phase}
                            initial={{ opacity: 0, y: 6 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: -6 }}
                            transition={{ duration: 0.25 }}
                            className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[0.75rem] font-bold ${
                              isDone ? outcome.className : phase >= 0 ? "bg-white/10 text-white/80" : "bg-white/5 text-white/40"
                            }`}
                          >
                            {isDone ? (r.outcome === "escalated" ? "⚑ " : "✓ ") + outcome.label : phase >= 0 ? PHASES[phase] : "Scheduled"}
                          </motion.span>
                        </AnimatePresence>
                      </span>
                    </div>
                    <AnimatePresence>
                      {isDone && (
                        <motion.div
                          initial={{ height: 0, opacity: 0 }}
                          animate={{ height: "auto", opacity: 1 }}
                          transition={{ duration: 0.35, ease }}
                          className="relative overflow-hidden"
                        >
                          <p className="pt-1.5 text-[0.9rem] text-white">
                            → {r.result}
                            {r.priority && (
                              <span className="ml-2 rounded-full bg-teal-light/15 px-2 py-0.5 text-[0.72rem] font-bold text-teal-light">
                                Priority · {r.priority}
                              </span>
                            )}
                          </p>
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </motion.li>
                );
              })}
            </ul>
          </div>
        </div>
      </Container>
    </section>
  );
}
