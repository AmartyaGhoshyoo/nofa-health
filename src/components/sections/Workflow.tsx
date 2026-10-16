"use client";

import { useEffect, useRef, useState } from "react";
import { AnimatePresence, motion, useInView, useReducedMotion } from "motion/react";
import Container from "../ui/Container";
import SectionHeading from "../ui/SectionHeading";
import { site } from "@/config/site";

// The five-stage loop from the product brief, shown as a pipeline a request
// travels through (inspired by 21st.dev "AI Agent Pipeline"), with a live log.

const ease = [0.22, 1, 0.36, 1] as const;
const STEP_MS = 2400;

const STEPS = [
  {
    title: "Receive",
    body: "Phone, web chat, SMS, WhatsApp, voice note or email.",
    log: ["inbound call · +1 (555) 014-2290", "language detected: English"],
  },
  {
    title: "Understand",
    body: "Who's calling, why, how urgent, what's missing.",
    log: ["patient matched · Maya Rodriguez (DOB verified)", "intent: reschedule · urgency: routine"],
  },
  {
    title: "Check",
    body: "Rules, provider calendars, rooms, duration, eligibility.",
    log: ["Dr. Chen · Fri 10:00 free", "Room 2 free · visit type eligible"],
  },
  {
    title: "Act",
    body: "Book, move, cancel, route, transfer or waitlist.",
    log: ["reschedule_appointment → ok", "old slot released to waitlist"],
  },
  {
    title: "Confirm",
    body: "Update systems, notify everyone, log the interaction.",
    log: ["SMS confirmation sent", "EHR updated · audit entry #A81F"],
  },
];

export default function Workflow() {
  const ref = useRef<HTMLDivElement>(null);
  const inView = useInView(ref, { amount: 0.4 });
  const reduce = useReducedMotion();
  const [active, setActive] = useState(0);

  useEffect(() => {
    if (!inView || reduce) return;
    const t = setTimeout(() => setActive((a) => (a + 1) % STEPS.length), STEP_MS);
    return () => clearTimeout(t);
  }, [active, inView, reduce]);

  const logLines = STEPS.slice(0, active + 1).flatMap((s, i) => s.log.map((l) => ({ step: i, text: l })));

  return (
    <section id="how-it-works" className="relative scroll-mt-20 bg-canvas-soft py-24 md:py-32">
      <Container>
        <SectionHeading
          eyebrow="How it works"
          title={
            <>
              From first ring to <em className="text-gradient">confirmed</em>, end to end.
            </>
          }
          description={`${site.name} doesn't just answer — it closes the loop, and only says "booked" after your system confirms it.`}
          className="mb-16"
        />

        <div ref={ref}>
          {/* Pipeline */}
          <div className="relative">
            <div className="absolute left-[8%] right-[8%] top-7 hidden h-[2px] bg-line-strong md:block" aria-hidden="true">
              <motion.div
                className="h-full origin-left bg-gradient-to-r from-teal to-teal-light"
                animate={{ scaleX: active / (STEPS.length - 1) }}
                transition={{ duration: 0.8, ease }}
              />
              <motion.span
                className="absolute top-1/2 h-3 w-3 -translate-x-1/2 -translate-y-1/2 rounded-full bg-teal-light shadow-[0_0_18px_4px_rgba(34,211,238,0.7)]"
                animate={{ left: `${(active / (STEPS.length - 1)) * 100}%` }}
                transition={{ duration: 0.8, ease }}
              />
            </div>

            <ol className="grid grid-cols-1 gap-4 md:grid-cols-5 md:gap-3">
              {STEPS.map((s, i) => {
                const on = i <= active;
                const current = i === active;
                return (
                  <li key={s.title}>
                    <button
                      type="button"
                      onClick={() => setActive(i)}
                      aria-current={current ? "step" : undefined}
                      className="group flex w-full cursor-pointer items-start gap-4 text-left md:flex-col md:items-center md:text-center"
                    >
                      <motion.span
                        animate={{ scale: current ? 1.12 : 1 }}
                        className={`relative z-10 flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl font-mono text-[0.9rem] font-medium transition-colors duration-500 ${
                          on ? "bg-teal text-white shadow-[0_14px_30px_-12px_rgba(14,116,144,0.7)]" : "bg-surface text-ink-faint ring-1 ring-line-strong"
                        }`}
                      >
                        0{i + 1}
                        {current && !reduce && (
                          <motion.span
                            className="absolute inset-0 rounded-2xl ring-2 ring-teal-light"
                            animate={{ scale: [1, 1.35], opacity: [0.8, 0] }}
                            transition={{ duration: 1.2, repeat: Infinity }}
                          />
                        )}
                      </motion.span>
                      <span>
                        <span className={`block text-[1.15rem] font-bold transition-colors ${current ? "text-teal" : ""}`}>{s.title}</span>
                        <span className="mt-1 block text-[0.92rem] leading-snug text-ink-muted">{s.body}</span>
                      </span>
                    </button>
                  </li>
                );
              })}
            </ol>
          </div>

          {/* Execution log */}
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.8, ease }}
            className="mx-auto mt-14 max-w-[760px] overflow-hidden rounded-2xl bg-ocean font-mono text-[0.84rem] shadow-[0_40px_80px_-40px_rgba(6,42,51,0.6)]"
          >
            <div className="flex items-center justify-between border-b border-ocean-line px-5 py-3 text-white/50">
              <span>{site.agent.toLowerCase()} · live run</span>
              <span className="flex items-center gap-2 text-teal-light">
                <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-teal-light" /> running
              </span>
            </div>
            <ul className="flex h-[200px] flex-col justify-end overflow-hidden px-5 py-4">
              <AnimatePresence initial={false}>
                {logLines.slice(-7).map((l) => (
                  <motion.li
                    key={`${l.step}-${l.text}`}
                    layout
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0 }}
                    transition={{ duration: 0.35 }}
                    className="flex gap-3 py-0.5"
                  >
                    <span className="text-teal-light">{STEPS[l.step]!.title.toLowerCase().padEnd(10, " ")}</span>
                    <span className={l.step === active ? "text-white" : "text-white/45"}>{l.text}</span>
                  </motion.li>
                ))}
              </AnimatePresence>
            </ul>
          </motion.div>
        </div>
      </Container>
    </section>
  );
}
