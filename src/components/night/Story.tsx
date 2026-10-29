"use client";

import { useRef, useState } from "react";
import { AnimatePresence, motion, useMotionValueEvent, useScroll, useSpring } from "motion/react";
import { DOCTORS, Eyebrow, Glass, RiseWords, Wrap, ease } from "./kit";

// One booking, pinned to the screen while the page scrolls through four chapters.
// The same steps ZOVAK runs: listen → match the doctor → find a free time → confirm.
const CHAPTERS = [
  {
    title: "Tell me *what's* wrong.",
    body: "Nofa starts with the patient, not a menu. It asks what's going on — and never diagnoses or gives medical advice.",
  },
  {
    title: "Only the *right* doctor.",
    body: "It matches the need to a specialty and shows just those doctors. Never the whole list; and if the clinic doesn't offer it, it says so.",
  },
  {
    title: "A time that's *really* free.",
    body: "Each doctor has their own hours, lunch and bookings. Nofa only offers slots that are truly open — and holds one while the patient decides.",
  },
  {
    title: "Yes means *yes.*",
    body: "Nothing is booked until the patient taps confirm or clearly says so. Then the calendar invite goes out, and Nofa says a warm goodbye.",
  },
];

export default function Story() {
  const ref = useRef<HTMLElement>(null);
  const { scrollYProgress } = useScroll({ target: ref, offset: ["start start", "end end"] });
  const progress = useSpring(scrollYProgress, { stiffness: 120, damping: 30 });
  const [step, setStep] = useState(0);
  useMotionValueEvent(scrollYProgress, "change", (p) => setStep(Math.min(3, Math.floor(p * 4.0001))));
  const chapter = CHAPTERS[step]!;

  return (
    <section ref={ref} id="story" className="relative lg:h-[420vh]">
      {/* Desktop: pinned and scroll-driven */}
      <div className="sticky top-0 hidden h-screen items-center lg:flex">
        <Wrap className="grid grid-cols-[1fr_1.05fr] items-center gap-16">
          <div>
            <Eyebrow>How Nofa books · one conversation</Eyebrow>
            <div className="relative mt-8 h-[19rem]">
              <AnimatePresence mode="wait">
                <motion.div
                  key={step}
                  initial={{ opacity: 0, y: 30 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -24 }}
                  transition={{ duration: 0.55, ease }}
                  className="absolute inset-0"
                >
                  <span className="font-display text-[5.5rem] leading-none text-transparent [-webkit-text-stroke:1px_rgba(94,234,212,0.45)]">
                    0{step + 1}
                  </span>
                  <h2 className="mt-3 font-display text-[clamp(2.4rem,4vw,3.6rem)] leading-[1.02] text-white">
                    <Title text={chapter.title} />
                  </h2>
                  <p className="mt-5 max-w-[30rem] text-[1.04rem] leading-relaxed text-white/60">{chapter.body}</p>
                </motion.div>
              </AnimatePresence>
            </div>
            <div className="mt-10 flex items-center gap-3">
              {CHAPTERS.map((_, i) => (
                <span key={i} className="relative h-1 w-14 overflow-hidden rounded-full bg-white/10">
                  <motion.span
                    className="absolute inset-y-0 left-0 rounded-full bg-aqua"
                    animate={{ width: i < step ? "100%" : i === step ? "60%" : "0%" }}
                    transition={{ duration: 0.5 }}
                  />
                </span>
              ))}
              <motion.span className="ml-2 font-mono text-[0.72rem] text-white/40">
                {step + 1} / 4
              </motion.span>
            </div>
          </div>
          <Stage step={step} progress={progress} />
        </Wrap>
      </div>

      {/* Phones and tablets: the same four chapters, stacked */}
      <Wrap className="space-y-20 py-24 lg:hidden">
        <Eyebrow>How Nofa books · one conversation</Eyebrow>
        {CHAPTERS.map((c, i) => (
          <div key={i}>
            <span className="font-display text-[3.5rem] leading-none text-transparent [-webkit-text-stroke:1px_rgba(94,234,212,0.45)]">
              0{i + 1}
            </span>
            <h2 className="mt-2 font-display text-[2.3rem] leading-[1.05] text-white">
              <RiseWords text={c.title} />
            </h2>
            <p className="mt-4 text-white/60">{c.body}</p>
            <div className="mt-8">
              <Stage step={i} />
            </div>
          </div>
        ))}
      </Wrap>
    </section>
  );
}

function Title({ text }: { text: string }) {
  return (
    <>
      {text.split(" ").map((w, i) => {
        const accent = w.startsWith("*") && w.endsWith("*");
        return (
          <span key={i} className={accent ? "font-serif font-normal italic tracking-normal text-aqua" : ""}>
            {accent ? w.slice(1, -1) : w}{" "}
          </span>
        );
      })}
    </>
  );
}

// ── The screen that morphs with each chapter ──────────────────────────────────

function Stage({ step, progress }: { step: number; progress?: ReturnType<typeof useSpring> }) {
  return (
    <Glass className="relative overflow-hidden p-5 sm:p-6">
      <div className="mb-4 flex items-center justify-between border-b border-night-line pb-3">
        <span className="flex items-center gap-2.5">
          <span className="h-8 w-8 rounded-full bg-[radial-gradient(circle_at_35%_30%,#A7F3D0,#0E7490_70%)] shadow-[0_0_20px_rgba(94,234,212,0.5)]" />
          <span>
            <span className="block text-[0.9rem] font-bold text-white">Nofa</span>
            <span className="block text-[0.72rem] text-white/45">Brightside Family Clinic</span>
          </span>
        </span>
        {progress && (
          <span className="h-1 w-24 overflow-hidden rounded-full bg-white/10">
            <motion.span className="block h-full origin-left bg-aqua" style={{ scaleX: progress }} />
          </span>
        )}
      </div>
      <div className="relative min-h-[23rem]">
        <AnimatePresence mode="wait">
          <motion.div
            key={step}
            initial={{ opacity: 0, scale: 0.98, filter: "blur(6px)" }}
            animate={{ opacity: 1, scale: 1, filter: "blur(0px)" }}
            exit={{ opacity: 0, scale: 1.01, filter: "blur(6px)" }}
            transition={{ duration: 0.5, ease }}
          >
            {step === 0 && <Listen />}
            {step === 1 && <Match />}
            {step === 2 && <FindTime />}
            {step === 3 && <Confirm />}
          </motion.div>
        </AnimatePresence>
      </div>
    </Glass>
  );
}

function Bubble({ who, children, delay = 0 }: { who: "patient" | "nofa"; children: React.ReactNode; delay?: number }) {
  return (
    <motion.p
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.45, delay, ease }}
      className={
        who === "patient"
          ? "ml-auto w-fit max-w-[80%] rounded-2xl rounded-br-md bg-white/10 px-4 py-2.5 text-[0.92rem] text-white"
          : "w-fit max-w-[85%] rounded-2xl rounded-bl-md border border-aqua/20 bg-aqua/[0.07] px-4 py-2.5 text-[0.92rem] text-white/90"
      }
    >
      {children}
    </motion.p>
  );
}

function Listen() {
  return (
    <div className="space-y-3">
      <Bubble who="nofa">Hi, I&apos;m Nofa. Tell me what you need, and I&apos;ll find the right doctor.</Bubble>
      <Bubble who="patient" delay={0.35}>
        My son has had a fever since last night.
      </Bubble>
      <Bubble who="nofa" delay={0.75}>
        I&apos;m sorry he&apos;s unwell. For children, our pediatrician can see him — shall I check her times?
      </Bubble>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 1.2 }}
        className="flex flex-wrap gap-2 pt-3"
      >
        {["No diagnosis", "No medical advice", "Emergency? Call emergency services"].map((t) => (
          <span key={t} className="rounded-full border border-white/10 px-3 py-1 font-mono text-[0.68rem] uppercase tracking-wider text-white/50">
            {t}
          </span>
        ))}
      </motion.div>
    </div>
  );
}

function Match() {
  return (
    <div>
      <p className="mb-3 font-mono text-[0.7rem] uppercase tracking-[0.2em] text-white/40">Matching the need → Pediatrics</p>
      <div className="grid grid-cols-2 gap-3">
        {DOCTORS.map((d, i) => {
          const match = d.id === "sultana";
          return (
            <motion.div
              key={d.id}
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: match ? 1 : 0.22, y: 0, scale: match ? 1.04 : 0.96 }}
              transition={{ duration: 0.6, delay: 0.1 + i * 0.08, ease }}
              className={`rounded-2xl border p-3.5 ${match ? "border-aqua/60 bg-aqua/10 shadow-[0_0_40px_-10px_rgba(94,234,212,0.6)]" : "border-white/10"}`}
            >
              <span className={`flex h-9 w-9 items-center justify-center rounded-full text-[0.78rem] font-bold ${match ? "bg-aqua text-night" : "bg-white/10 text-white/60"}`}>
                {d.short}
              </span>
              <p className="mt-2.5 text-[0.9rem] font-bold text-white">{d.name}</p>
              <p className="text-[0.76rem] text-white/50">{d.specialty}</p>
              {match && (
                <motion.p
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: 0.7 }}
                  className="mt-2 inline-block rounded-full bg-spark px-2.5 py-0.5 text-[0.7rem] font-bold text-night"
                >
                  ✓ Doctor selected
                </motion.p>
              )}
            </motion.div>
          );
        })}
      </div>
      <div className="mt-5">
        <Bubble who="nofa" delay={0.9}>
          Dr. Nusrat Sultana sees children. Her next free time is tomorrow at 9:30.
        </Bubble>
      </div>
    </div>
  );
}

const SLOTS = ["9:00", "9:30", "10:00", "10:30", "11:00", "11:30", "12:00", "12:30", "1:00", "1:30", "2:00", "2:30"];
const TAKEN = new Set(["9:00", "10:00", "10:30", "1:30"]);
const LUNCH = new Set(["12:00", "12:30"]);

function FindTime() {
  return (
    <div>
      <p className="mb-3 font-mono text-[0.7rem] uppercase tracking-[0.2em] text-white/40">Dr. Sultana · tomorrow · Dhaka time</p>
      <div className="grid grid-cols-4 gap-2">
        {SLOTS.map((s, i) => {
          const chosen = s === "11:00";
          const off = TAKEN.has(s) || LUNCH.has(s);
          return (
            <motion.span
              key={s}
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: off ? 0.3 : 1, scale: 1 }}
              transition={{ duration: 0.35, delay: i * 0.04 }}
              className={`relative rounded-xl border py-2.5 text-center font-mono text-[0.82rem] ${
                chosen
                  ? "border-spark bg-spark font-bold text-night"
                  : LUNCH.has(s)
                    ? "border-dashed border-white/15 text-white/40 [background:repeating-linear-gradient(135deg,transparent_0_6px,rgba(255,255,255,0.05)_6px_12px)]"
                    : TAKEN.has(s)
                      ? "border-white/10 text-white/40 line-through"
                      : "border-white/15 text-white/80"
              }`}
            >
              {s}
              {chosen && (
                <motion.span
                  className="absolute inset-0 rounded-xl border-2 border-spark"
                  animate={{ scale: [1, 1.18], opacity: [0.8, 0] }}
                  transition={{ duration: 1.4, repeat: Infinity }}
                />
              )}
            </motion.span>
          );
        })}
      </div>
      <div className="mt-3 flex gap-4 font-mono text-[0.66rem] uppercase tracking-wider text-white/40">
        <span>▨ lunch</span>
        <span className="line-through">booked</span>
        <span className="text-spark">● held for you · 2:00</span>
      </div>
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.7, ease }}
        className="mt-5 rounded-2xl border border-white/10 p-3.5"
      >
        <p className="text-[0.78rem] text-white/50">Type your email (never spelled out loud)</p>
        <p className="mt-1.5 rounded-lg bg-white/5 px-3 py-2 font-mono text-[0.86rem] text-white">
          <Typed text="rahim.parent@mail.com" />
        </p>
      </motion.div>
    </div>
  );
}

function Typed({ text }: { text: string }) {
  return (
    <>
      {text.split("").map((ch, i) => (
        <motion.span key={i} initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.9 + i * 0.04 }}>
          {ch}
        </motion.span>
      ))}
      <span className="ml-0.5 inline-block h-4 w-[2px] translate-y-0.5 animate-blink bg-aqua" />
    </>
  );
}

function Confirm() {
  return (
    <div className="space-y-3">
      <motion.div
        initial={{ opacity: 0, y: 14 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, ease }}
        className="overflow-hidden rounded-2xl border border-spark/40"
      >
        <motion.div
          initial={{ backgroundColor: "rgba(94,234,212,0.12)" }}
          animate={{ backgroundColor: "rgba(200,241,105,1)" }}
          transition={{ delay: 1, duration: 0.5 }}
          className="flex items-center gap-2 px-4 py-2 text-[0.8rem] font-bold text-night"
        >
          <motion.span initial={{ scale: 0 }} animate={{ scale: 1 }} transition={{ delay: 1.1, type: "spring" }}>
            ✓
          </motion.span>
          Booked · confirmed by calendar
        </motion.div>
        <div className="px-4 py-3">
          <p className="font-bold text-white">Fri, Oct 30 · 11:00 – 11:30 AM</p>
          <p className="text-[0.86rem] text-white/60">Child check-up with Dr. Nusrat Sultana · Rahim</p>
        </div>
      </motion.div>
      <Bubble who="patient" delay={0.4}>
        Yes, confirm it.
      </Bubble>
      <motion.div
        initial={{ opacity: 0, x: 40, rotate: 6 }}
        animate={{ opacity: 1, x: 0, rotate: -2 }}
        transition={{ delay: 1.5, duration: 0.7, ease }}
        className="ml-auto w-fit rounded-xl bg-white px-3.5 py-2.5 text-[0.78rem] text-night shadow-xl"
      >
        <p className="font-bold">📅 Invitation: Child check-up</p>
        <p className="text-night/60">Google Calendar · sent to rahim.parent@mail.com</p>
      </motion.div>
      <Bubble who="nofa" delay={1.9}>
        You&apos;re all set with Dr. Nusrat Sultana tomorrow at 11:00 AM. Thanks for calling — take care, goodbye!
      </Bubble>
    </div>
  );
}
