"use client";

import { MouseEvent, useEffect, useState } from "react";
import { AnimatePresence, motion, useMotionValue, useReducedMotion, useSpring, useTransform } from "motion/react";
import Container from "../ui/Container";
import Button from "../ui/Button";
import Magnetic from "../ui/Magnetic";
import LiveCallCard from "./LiveCallCard";
import { openAssistant, playDemoCall } from "../assistant/events";
import { MicIcon } from "../assistant/AssistantWidget";
import { site } from "@/config/site";

const ease = [0.22, 1, 0.36, 1] as const;
const LANGUAGES = ["Hello", "Hola", "Bonjour", "नमस्ते", "Xin chào", "Olá", "مرحبا"];

function Words({ text, delay = 0, className = "" }: { text: string; delay?: number; className?: string }) {
  return (
    <>
      {text.split(" ").map((w, i) => (
        <span key={i}>
          <span className="inline-block overflow-hidden pb-[0.12em] align-top">
            <motion.span
              className={`inline-block ${className}`}
              initial={{ y: "110%" }}
              animate={{ y: "0%" }}
              transition={{ duration: 1, delay: delay + i * 0.06, ease }}
            >
              {w}
            </motion.span>
          </span>{" "}
        </span>
      ))}
    </>
  );
}

function CyclingGreeting() {
  const [i, setI] = useState(0);
  useEffect(() => {
    const id = setInterval(() => setI((n) => (n + 1) % LANGUAGES.length), 1800);
    return () => clearInterval(id);
  }, []);
  return (
    <span className="relative inline-flex h-[1.4em] min-w-[5.5rem] overflow-hidden align-bottom font-bold text-teal">
      <AnimatePresence mode="popLayout" initial={false}>
        <motion.span
          key={LANGUAGES[i]}
          initial={{ y: "100%", opacity: 0 }}
          animate={{ y: "0%", opacity: 1 }}
          exit={{ y: "-100%", opacity: 0 }}
          transition={{ duration: 0.45, ease }}
        >
          {LANGUAGES[i]}
        </motion.span>
      </AnimatePresence>
    </span>
  );
}

export default function Hero() {
  const reduce = useReducedMotion();
  const mx = useMotionValue(0);
  const my = useMotionValue(0);
  const smx = useSpring(mx, { stiffness: 40, damping: 20 });
  const smy = useSpring(my, { stiffness: 40, damping: 20 });
  const ax = useTransform(smx, (v) => v * 50);
  const ay = useTransform(smy, (v) => v * 36);
  const bx = useTransform(smx, (v) => v * -40);
  const by = useTransform(smy, (v) => v * -30);

  function onMove(e: MouseEvent<HTMLElement>) {
    if (reduce) return;
    const r = e.currentTarget.getBoundingClientRect();
    mx.set((e.clientX - r.left) / r.width - 0.5);
    my.set((e.clientY - r.top) / r.height - 0.5);
  }

  return (
    <section onMouseMove={onMove} className="relative overflow-hidden">
      {/* Aurora background (inspired by 21st.dev "Aurora voice Hero") */}
      <div aria-hidden="true" className="pointer-events-none absolute inset-0">
        <div className="bg-dots absolute inset-0 [mask-image:radial-gradient(ellipse_70%_60%_at_30%_20%,black,transparent)]" />
        <motion.div style={{ x: ax, y: ay }} className="absolute -right-40 -top-40 h-[640px] w-[640px]">
          <motion.div
            className="h-full w-full rounded-full bg-[conic-gradient(from_120deg,#22D3EE,#A7F3D0,#0891B2,#22D3EE)] opacity-40 blur-[120px]"
            animate={reduce ? undefined : { rotate: 360 }}
            transition={{ duration: 30, repeat: Infinity, ease: "linear" }}
          />
        </motion.div>
        <motion.div style={{ x: bx, y: by }} className="absolute -left-48 top-[45%] h-[460px] w-[460px]">
          <motion.div
            className="h-full w-full rounded-full bg-teal-light/25 blur-[120px]"
            animate={reduce ? undefined : { scale: [1, 1.15, 1] }}
            transition={{ duration: 10, repeat: Infinity, ease: "easeInOut" }}
          />
        </motion.div>
      </div>

      <Container className="relative grid items-center gap-16 pb-24 pt-12 md:pt-16 lg:grid-cols-[1.05fr_0.95fr] lg:gap-12 lg:pb-32">
        <div>
          <motion.p
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, ease }}
            className="mb-7 inline-flex items-center gap-2.5 rounded-full border border-teal/20 bg-surface/70 py-1.5 pl-2 pr-4 text-[0.88rem] text-ink-muted backdrop-blur"
          >
            <span className="relative flex h-2.5 w-2.5">
              <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-mint opacity-60" />
              <span className="relative inline-flex h-2.5 w-2.5 rounded-full bg-mint" />
            </span>
            Answering 24/7 · <CyclingGreeting />
          </motion.p>

          <h1 className="font-display text-[2.9rem] leading-[1.0] sm:text-[3.8rem] md:text-[4.4rem] lg:text-[4.7rem]">
            <span className="sr-only">Every patient answered. Every slot filled.</span>
            <span aria-hidden="true">
              <Words text="Every patient answered." delay={0.1} />
              <br />
              <Words text="Every slot filled." delay={0.35} className="text-gradient" />
            </span>
          </h1>

          <motion.p
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.7, ease }}
            className="mt-7 max-w-[520px] text-[1.12rem] leading-relaxed text-ink-muted"
          >
            {site.name} is the AI front desk for clinics. It picks up every call and message, books against your live
            schedule, and quietly repairs the day when plans change.
          </motion.p>

          <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.85, ease }}
            className="mt-9 flex flex-wrap items-center gap-3"
          >
            <Magnetic>
              <Button as="button" type="button" onClick={playDemoCall}>
                <MicIcon /> Hear a live call
              </Button>
            </Magnetic>
            <Magnetic strength={0.18}>
              <Button as="button" type="button" variant="ghost" onClick={() => openAssistant("chat")}>
                Chat with {site.agent}
              </Button>
            </Magnetic>
          </motion.div>

          <motion.ul
            initial="hidden"
            animate="show"
            variants={{ show: { transition: { staggerChildren: 0.08, delayChildren: 1 } } }}
            className="mt-10 flex flex-wrap gap-x-6 gap-y-3 text-[0.9rem] text-ink-muted"
          >
            {["Keeps your phone number", "Works with your EHR & calendars", "Hands off to staff anytime"].map((t) => (
              <motion.li
                key={t}
                variants={{ hidden: { opacity: 0, y: 8 }, show: { opacity: 1, y: 0 } }}
                className="flex items-center gap-2"
              >
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" aria-hidden="true" className="text-mint">
                  <circle cx="12" cy="12" r="10" fill="currentColor" opacity="0.15" />
                  <path d="M7.5 12.5l3 3 6-6.5" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
                {t}
              </motion.li>
            ))}
          </motion.ul>
        </div>

        <motion.div
          initial={{ opacity: 0, y: 40, rotateX: 10 }}
          animate={{ opacity: 1, y: 0, rotateX: 0 }}
          transition={{ duration: 1.1, delay: 0.4, ease }}
          style={{ transformPerspective: 1200 }}
          className="relative mx-auto w-full max-w-[520px]"
        >
          <TiltStage>
            <LiveCallCard />
          </TiltStage>
          <FloatingChip className="-top-6 left-6" delay={1.6} drift={10}>
            <Dot className="bg-teal-bright" /> Spanish detected
          </FloatingChip>
          <FloatingChip className="-bottom-7 left-4 sm:-left-10" delay={2} drift={12}>
            <Dot className="bg-mint" /> Waitlist slot refilled
          </FloatingChip>
          <FloatingChip className="-top-6 right-4" delay={2.4} drift={8}>
            <Dot className="bg-amber" /> 2 reminders sent
          </FloatingChip>
        </motion.div>
      </Container>
    </section>
  );
}

// Card tilts toward the cursor, wrapped in a slowly rotating light beam border.
function TiltStage({ children }: { children: React.ReactNode }) {
  const reduce = useReducedMotion();
  const px = useMotionValue(0);
  const py = useMotionValue(0);
  const rx = useSpring(useTransform(py, [-0.5, 0.5], [7, -7]), { stiffness: 150, damping: 18 });
  const ry = useSpring(useTransform(px, [-0.5, 0.5], [-9, 9]), { stiffness: 150, damping: 18 });

  function onMove(e: MouseEvent<HTMLDivElement>) {
    if (reduce) return;
    const r = e.currentTarget.getBoundingClientRect();
    px.set((e.clientX - r.left) / r.width - 0.5);
    py.set((e.clientY - r.top) / r.height - 0.5);
  }

  return (
    <motion.div
      onMouseMove={onMove}
      onMouseLeave={() => (px.set(0), py.set(0))}
      style={{ rotateX: rx, rotateY: ry, transformPerspective: 1100 }}
      className="relative rounded-[30px] p-[2px]"
    >
      {/* Beam border: a conic gradient spinning behind a 2px gap */}
      <div aria-hidden="true" className="absolute inset-0 overflow-hidden rounded-[30px]">
        <div className="absolute left-1/2 top-1/2 aspect-square w-[160%] -translate-x-1/2 -translate-y-1/2 animate-spin-slow bg-[conic-gradient(from_0deg,transparent_0deg,#22D3EE_40deg,#10B981_80deg,transparent_140deg,transparent_360deg)] motion-reduce:animate-none" />
      </div>
      <div className="relative">{children}</div>
    </motion.div>
  );
}

function FloatingChip({
  children,
  className,
  delay,
  drift,
}: {
  children: React.ReactNode;
  className: string;
  delay: number;
  drift: number;
}) {
  const reduce = useReducedMotion();
  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.8, y: 12 }}
      animate={{ opacity: 1, scale: 1, y: 0 }}
      transition={{ duration: 0.7, delay, ease }}
      className={`pointer-events-none absolute z-20 hidden sm:block ${className}`}
    >
      <motion.div
        animate={reduce ? undefined : { y: [0, -drift, 0] }}
        transition={{ duration: 4 + drift / 4, repeat: Infinity, ease: "easeInOut" }}
        className="flex items-center gap-2 whitespace-nowrap rounded-full bg-surface/90 px-4 py-2 text-[0.82rem] font-semibold shadow-[0_18px_40px_-16px_rgba(6,42,51,0.35)] ring-1 ring-line backdrop-blur"
      >
        {children}
      </motion.div>
    </motion.div>
  );
}

function Dot({ className }: { className: string }) {
  return <span className={`h-2 w-2 rounded-full ${className}`} />;
}
