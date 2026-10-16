"use client";

import { MouseEvent, ReactNode, useEffect, useRef, useState } from "react";
import { AnimatePresence, motion, useInView, useMotionTemplate, useMotionValue, useReducedMotion } from "motion/react";
import Container from "../ui/Container";
import SectionHeading from "../ui/SectionHeading";
import { site } from "@/config/site";

const ease = [0.22, 1, 0.36, 1] as const;

/** Advances a step counter on an interval while the element is visible. */
function useTicker(steps: number, ms: number) {
  const ref = useRef<HTMLDivElement>(null);
  const inView = useInView(ref, { amount: 0.4 });
  const reduce = useReducedMotion();
  const [step, setStep] = useState(0);
  useEffect(() => {
    if (reduce) return setStep(steps - 1);
    if (!inView) return;
    const t = setTimeout(() => setStep((s) => (s + 1) % steps), ms);
    return () => clearTimeout(t);
  }, [step, inView, reduce, steps, ms]);
  return { ref, step };
}

// ── Card shell with pointer spotlight ───────────────────────────────────────

function Card({ className = "", index, title, body, children }: { className?: string; index: number; title: string; body: string; children: ReactNode }) {
  const mx = useMotionValue(-400);
  const my = useMotionValue(-400);
  const glow = useMotionTemplate`radial-gradient(360px circle at ${mx}px ${my}px, rgba(34,211,238,0.12), transparent 70%)`;
  function onMove(e: MouseEvent<HTMLElement>) {
    const r = e.currentTarget.getBoundingClientRect();
    mx.set(e.clientX - r.left);
    my.set(e.clientY - r.top);
  }
  return (
    <motion.article
      onMouseMove={onMove}
      onMouseLeave={() => (mx.set(-400), my.set(-400))}
      initial={{ opacity: 0, y: 36, scale: 0.98 }}
      whileInView={{ opacity: 1, y: 0, scale: 1 }}
      viewport={{ once: true, margin: "0px 0px -60px 0px" }}
      transition={{ duration: 0.8, delay: (index % 3) * 0.08, ease }}
      whileHover={{ y: -5 }}
      className={`group relative flex flex-col overflow-hidden rounded-[24px] bg-surface shadow-[0_30px_60px_-45px_rgba(6,42,51,0.4)] ring-1 ring-line transition-shadow hover:ring-teal/25 ${className}`}
    >
      <motion.div aria-hidden="true" className="pointer-events-none absolute inset-0" style={{ background: glow }} />
      <div className="relative m-2 mb-0 h-[230px] overflow-hidden rounded-[18px] bg-[linear-gradient(160deg,#E6F4F6_0%,#F3F8F8_100%)] ring-1 ring-line">
        {children}
      </div>
      <div className="relative p-6">
        <h3 className="text-[1.3rem] font-bold">{title}</h3>
        <p className="mt-2 text-[0.98rem] leading-relaxed text-ink-muted">{body}</p>
      </div>
    </motion.article>
  );
}

// ── Visuals ─────────────────────────────────────────────────────────────────

const LANGS = [
  { code: "EN", text: "I'd like to book a check-up." },
  { code: "ES", text: "Quisiera reservar una cita." },
  { code: "HI", text: "मुझे अपॉइंटमेंट बुक करनी है।" },
  { code: "VI", text: "Tôi muốn đặt lịch khám." },
];

function VoiceVisual() {
  const { ref, step } = useTicker(LANGS.length, 2200);
  const reduce = useReducedMotion();
  const lang = LANGS[step]!;
  return (
    <div ref={ref} className="flex h-full flex-col items-center justify-center gap-5 px-6">
      <div className="flex h-14 items-center gap-1" aria-hidden="true">
        {Array.from({ length: 36 }).map((_, i) => (
          <motion.span
            key={i}
            className="w-1.5 rounded-full bg-teal-bright"
            animate={reduce ? { height: 12 } : { height: [8, 10 + Math.abs(Math.sin(i * 0.9 + step)) * 40, 8] }}
            transition={{ duration: 0.9 + (i % 4) * 0.12, repeat: Infinity, repeatType: "mirror" }}
          />
        ))}
      </div>
      <div className="flex items-center gap-3">
        <AnimatePresence mode="popLayout" initial={false}>
          <motion.span
            key={lang.code}
            initial={{ opacity: 0, scale: 0.7 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.7 }}
            className="rounded-lg bg-teal px-2 py-1 font-mono text-[0.75rem] font-medium text-white"
          >
            {lang.code}
          </motion.span>
          <motion.p
            key={lang.text}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.4, ease }}
            className="rounded-2xl bg-surface px-4 py-2 text-[0.95rem] shadow-sm ring-1 ring-line"
          >
            “{lang.text}”
          </motion.p>
        </AnimatePresence>
      </div>
      <p className="text-[0.8rem] text-ink-faint">Patients can interrupt — {site.agent} listens and adapts mid-sentence.</p>
    </div>
  );
}

function CalendarVisual() {
  const { ref, step } = useTicker(9, 700);
  // [day, rowStart, rowSpan]
  const blocks: [number, number, number][] = [
    [0, 0, 2],
    [1, 1, 1],
    [2, 0, 1],
    [3, 2, 2],
    [4, 1, 2],
    [0, 3, 1],
    [2, 2, 2],
    [1, 3, 1],
  ];
  return (
    <div ref={ref} className="flex h-full flex-col p-5">
      <div className="grid grid-cols-5 gap-1.5 pb-2 text-center font-mono text-[0.68rem] text-ink-faint">
        {["Mon", "Tue", "Wed", "Thu", "Fri"].map((d) => (
          <span key={d}>{d}</span>
        ))}
      </div>
      <div className="relative flex-1">
        <div className="absolute inset-0 grid grid-cols-5 grid-rows-4 gap-1.5">
          {Array.from({ length: 20 }).map((_, i) => (
            <span key={i} className="rounded-md bg-surface/70 ring-1 ring-line" />
          ))}
        </div>
        <div className="absolute inset-0 grid grid-cols-5 grid-rows-4 gap-1.5">
          {blocks.map(([d, r, s], i) => (
            <motion.span
              key={i}
              className="rounded-md bg-teal-bright shadow-sm"
              style={{ gridColumn: d + 1, gridRow: `${r + 1} / span ${s}` }}
              initial={false}
              animate={{ scale: i < step ? 1 : 0, opacity: i < step ? 0.9 - (i % 3) * 0.18 : 0 }}
              transition={{ type: "spring", stiffness: 300, damping: 22 }}
            />
          ))}
        </div>
      </div>
    </div>
  );
}

const QUEUE = [
  { name: "R. Singh", match: "Dr. Chen · afternoons", score: 96 },
  { name: "D. Kim", match: "Any provider · Tue", score: 81 },
  { name: "F. Ali", match: "Mornings only", score: 54 },
];

function WaitlistVisual() {
  const { ref, step } = useTicker(4, 1500);
  const filled = step >= 2;
  const queue = filled ? QUEUE.slice(1) : QUEUE;
  return (
    <div ref={ref} className="flex h-full flex-col gap-3 p-5">
      <motion.div
        animate={{ borderColor: step >= 1 ? (filled ? "#059669" : "#0891B2") : "rgba(15,43,51,0.16)" }}
        className="flex items-center justify-between rounded-xl border-2 border-dashed bg-surface px-3.5 py-2.5"
      >
        <span className="text-[0.85rem] font-bold">Tue 2:45 · Dr. Chen</span>
        <span className={`text-[0.75rem] font-bold ${filled ? "text-mint" : step >= 1 ? "text-teal" : "text-ink-faint"}`}>
          {filled ? "✓ Filled · R. Singh" : step >= 1 ? "Just opened" : "Booked"}
        </span>
      </motion.div>
      <p className="text-[0.72rem] font-bold uppercase tracking-wider text-ink-faint">Standby queue · best match first</p>
      <ul className="space-y-1.5">
        <AnimatePresence initial={false}>
          {queue.map((q) => (
            <motion.li
              key={q.name}
              layout
              exit={{ opacity: 0, y: -30, scale: 0.9 }}
              transition={{ duration: 0.5, ease }}
              className="flex items-center gap-3 rounded-lg bg-surface px-3 py-2 text-[0.82rem] ring-1 ring-line"
            >
              <span className="font-bold">{q.name}</span>
              <span className="text-ink-faint">{q.match}</span>
              <span className="ml-auto font-mono text-teal">{q.score}%</span>
            </motion.li>
          ))}
        </AnimatePresence>
      </ul>
    </div>
  );
}

const CHECKS = ["Provider available", "Room & equipment free", "Policy & eligibility", "Written to EHR"];

function VerifiedVisual() {
  const { ref, step } = useTicker(CHECKS.length + 3, 800);
  return (
    <div ref={ref} className="flex h-full flex-col justify-center gap-2 p-5">
      {CHECKS.map((c, i) => {
        const done = step > i;
        const busy = step === i;
        return (
          <div key={c} className="flex items-center gap-3 rounded-lg bg-surface px-3 py-2 text-[0.85rem] ring-1 ring-line">
            <span className="flex h-5 w-5 items-center justify-center">
              {done ? (
                <motion.svg initial={{ scale: 0 }} animate={{ scale: 1 }} width="18" height="18" viewBox="0 0 24 24" fill="none" aria-hidden="true">
                  <circle cx="12" cy="12" r="10" fill="#059669" />
                  <path d="M7.5 12.5l3 3 6-6.5" stroke="#fff" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round" />
                </motion.svg>
              ) : busy ? (
                <motion.span
                  className="h-4 w-4 rounded-full border-2 border-teal/25 border-t-teal"
                  animate={{ rotate: 360 }}
                  transition={{ duration: 0.7, repeat: Infinity, ease: "linear" }}
                />
              ) : (
                <span className="h-4 w-4 rounded-full border-2 border-line-strong" />
              )}
            </span>
            <span className={done ? "font-bold" : "text-ink-faint"}>{c}</span>
          </div>
        );
      })}
      <motion.p
        animate={{ opacity: step >= CHECKS.length ? 1 : 0, y: step >= CHECKS.length ? 0 : 6 }}
        className="mt-1 text-center text-[0.85rem] font-bold text-mint"
      >
        ✓ Only now: “You&apos;re booked.”
      </motion.p>
    </div>
  );
}

function HandoffVisual() {
  const { ref, step } = useTicker(4, 1600);
  return (
    <div ref={ref} className="flex h-full flex-col items-center justify-center gap-5 p-5">
      <div className="flex items-center gap-4">
        <div className="flex flex-col items-center gap-2">
          <span className="flex h-14 w-14 items-center justify-center rounded-full bg-gradient-to-br from-teal to-teal-light text-[0.8rem] font-bold text-white">
            AI
          </span>
          <span className="text-[0.75rem] text-ink-faint">{site.agent}</span>
        </div>
        <div className="relative h-[2px] w-24 bg-line-strong">
          <motion.span
            className="absolute -top-[5px] h-3 w-3 rounded-full bg-teal-bright"
            animate={{ left: step >= 1 ? "100%" : "0%", opacity: step >= 1 && step < 3 ? 1 : 0 }}
            transition={{ duration: 1, ease }}
          />
        </div>
        <div className="flex flex-col items-center gap-2">
          <span className="flex h-14 w-14 items-center justify-center rounded-full bg-ocean text-[0.8rem] font-bold text-white">Staff</span>
          <span className="text-[0.75rem] text-ink-faint">Front desk</span>
        </div>
      </div>
      <AnimatePresence>
        {step >= 2 && (
          <motion.div
            initial={{ opacity: 0, y: 14 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
            className="w-full rounded-xl bg-surface p-3 text-[0.8rem] shadow-md ring-1 ring-line"
          >
            <span className="font-bold text-teal">Summary passed:</span> billing question about last visit · patient verified · prefers SMS
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

// ── Section ─────────────────────────────────────────────────────────────────

export default function Features() {
  return (
    <section id="features" className="relative scroll-mt-20 py-24 md:py-32">
      <Container>
        <SectionHeading
          eyebrow="Features"
          title={
            <>
              A front desk that <em className="text-gradient">never drops the ball.</em>
            </>
          }
          description="Everything a great receptionist does — and the operations work nobody has time for."
          className="mb-14"
        />
        <div className="grid grid-cols-1 gap-5 md:grid-cols-2 lg:grid-cols-6">
          <Card
            index={0}
            className="md:col-span-2 lg:col-span-4"
            title="Natural, multilingual phone calls"
            body="Answers every call in seconds, handles interruptions, intake and FAQs, and speaks your patients' language."
          >
            <VoiceVisual />
          </Card>
          <Card
            index={1}
            className="lg:col-span-2"
            title="Real-time scheduling"
            body="Books, moves and cancels against live calendars across providers, locations and visit types."
          >
            <CalendarVisual />
          </Card>
          <Card
            index={2}
            className="lg:col-span-2"
            title="Smart waitlist"
            body="A cancelled slot is offered to the best-matching patient automatically — not just whoever's first."
          >
            <WaitlistVisual />
          </Card>
          <Card
            index={3}
            className="lg:col-span-2"
            title="Verified bookings"
            body="Checks provider, room and policy, and only confirms after your system returns success."
          >
            <VerifiedVisual />
          </Card>
          <Card
            index={4}
            className="md:col-span-2 lg:col-span-2"
            title="Warm handoff to staff"
            body="Clinical questions or anything sensitive goes to your team — with a summary, so patients never repeat themselves."
          >
            <HandoffVisual />
          </Card>
        </div>
      </Container>
    </section>
  );
}
