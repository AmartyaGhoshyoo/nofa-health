"use client";

import { useEffect, useRef, useState } from "react";
import { AnimatePresence, motion, useScroll, useTransform } from "motion/react";
import LightRibbons from "./LightRibbons";
import { Eyebrow, Glass, Wrap, ease } from "./kit";
import { openAssistant } from "../assistant/events";
import { site } from "@/config/site";

// A real booking, told in five beats: what the patient says, what Nofa does.
const BEATS = [
  { who: "patient", text: "Hi, I've had an itchy rash on my arm for a week." },
  { who: "nofa", text: "Sorry to hear that. Our skin doctor is Dr. Farhan Karim — shall I find you a time?" },
  { who: "chip", text: "Doctor selected · Dr. Farhan Karim", tone: "aqua" },
  { who: "patient", text: "Tomorrow morning, please. I'm Rahim." },
  { who: "chip", text: "Booked · Fri 11:30 AM · confirmed by calendar", tone: "spark" },
] as const;

function LiveTicker() {
  const [shown, setShown] = useState(1);
  useEffect(() => {
    const id = setInterval(() => setShown((n) => (n >= BEATS.length + 2 ? 1 : n + 1)), 1700);
    return () => clearInterval(id);
  }, []);
  const visible = BEATS.slice(0, Math.min(shown, BEATS.length));

  return (
    <Glass className="w-full max-w-[25rem] p-4">
      <div className="mb-3 flex items-center justify-between">
        <span className="flex items-center gap-2 text-[0.8rem] font-semibold text-white/80">
          <span className="relative flex h-2.5 w-2.5">
            <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-spark opacity-60" />
            <span className="relative inline-flex h-2.5 w-2.5 rounded-full bg-spark" />
          </span>
          Live · {site.agent} on a call
        </span>
        <Waveform />
      </div>
      <div className="flex min-h-[17.5rem] flex-col justify-end gap-2">
        <AnimatePresence initial={false}>
          {visible.map((b, i) => (
            <motion.div
              key={`${i}-${b.text}`}
              layout
              initial={{ opacity: 0, y: 14, scale: 0.97 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.5, ease }}
              className={
                b.who === "patient"
                  ? "ml-auto max-w-[85%] rounded-2xl rounded-br-md bg-white/10 px-3.5 py-2 text-[0.88rem] text-white"
                  : b.who === "nofa"
                    ? "max-w-[88%] rounded-2xl rounded-bl-md border border-aqua/20 bg-aqua/[0.07] px-3.5 py-2 text-[0.88rem] text-white/90"
                    : `mx-auto rounded-full px-3 py-1.5 font-mono text-[0.72rem] uppercase tracking-wider ${
                        "tone" in b && b.tone === "spark" ? "bg-spark text-night" : "border border-aqua/40 text-aqua"
                      }`
              }
            >
              {b.text}
            </motion.div>
          ))}
        </AnimatePresence>
      </div>
    </Glass>
  );
}

export function Waveform({ bars = 18, className = "" }: { bars?: number; className?: string }) {
  return (
    <span className={`flex h-5 items-center gap-[3px] ${className}`} aria-hidden="true">
      {Array.from({ length: bars }, (_, i) => (
        <motion.span
          key={i}
          className="w-[3px] rounded-full bg-aqua"
          animate={{ height: ["20%", `${35 + ((i * 37) % 60)}%`, "25%"] }}
          transition={{ duration: 0.9 + (i % 4) * 0.15, repeat: Infinity, ease: "easeInOut", delay: i * 0.05 }}
        />
      ))}
    </span>
  );
}

const HEAD = [
  { text: "Every patient", accent: false },
  { text: "answered.", accent: false },
  { text: "Every slot, kept.", accent: true },
];

export default function Hero() {
  const ref = useRef<HTMLElement>(null);
  const { scrollYProgress } = useScroll({ target: ref, offset: ["start start", "end start"] });
  const energy = useTransform(scrollYProgress, [0, 1], [0, 1]);
  const lift = useTransform(scrollYProgress, [0, 1], [0, -120]);
  const fade = useTransform(scrollYProgress, [0, 0.7], [1, 0]);

  return (
    <section ref={ref} id="top" className="relative min-h-[100svh] overflow-hidden pb-16 pt-28 sm:pt-32">
      <div className="absolute inset-0">
        <LightRibbons energy={energy} />
        <div className="absolute inset-0 bg-[radial-gradient(60%_50%_at_70%_40%,rgba(94,234,212,0.12),transparent_70%)]" />
        <div className="absolute inset-x-0 bottom-0 h-40 bg-gradient-to-b from-transparent to-night" />
      </div>

      <motion.div style={{ y: lift, opacity: fade }} className="relative">
        <Wrap className="grid items-center gap-12 lg:grid-cols-[1.25fr_1fr]">
          <div>
            <Eyebrow>AI receptionist for clinics · chat · voice · phone</Eyebrow>
            <h1 className="mt-6 font-display text-[clamp(2.9rem,7.6vw,6.4rem)] leading-[0.95] text-white">
              {HEAD.map((line, li) => (
                <span key={li} className="block overflow-hidden pb-[0.08em]">
                  <motion.span
                    className={`block ${line.accent ? "font-serif font-normal italic tracking-normal text-aqua" : ""}`}
                    initial={{ y: "105%" }}
                    animate={{ y: "0%" }}
                    transition={{ duration: 1.1, delay: 0.25 + li * 0.14, ease }}
                  >
                    {line.text}
                  </motion.span>
                </span>
              ))}
            </h1>
            <motion.p
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.9, delay: 0.75, ease }}
              className="mt-7 max-w-[34rem] text-[1.08rem] leading-relaxed text-white/65"
            >
              {site.agent} listens to what&apos;s wrong, finds the right doctor and books a time that&apos;s really free — in chat, on a
              website call or over the phone. And when a doctor runs late, it quietly fixes the day.
            </motion.p>
            <motion.div
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.9, delay: 0.9, ease }}
              className="mt-9 flex flex-wrap items-center gap-3"
            >
              <button
                onClick={() => openAssistant("voice")}
                className="group flex cursor-pointer items-center gap-2.5 rounded-full bg-spark py-3.5 pl-5 pr-6 font-bold text-night shadow-[0_0_40px_-6px_rgba(200,241,105,0.6)] transition-transform hover:scale-[1.03]"
              >
                <span className="flex h-7 w-7 items-center justify-center rounded-full bg-night text-spark">●</span>
                Talk to {site.agent}
              </button>
              <button
                onClick={() => openAssistant("chat")}
                className="cursor-pointer rounded-full border border-white/15 px-6 py-3.5 font-semibold text-white transition-colors hover:bg-white/5"
              >
                Chat instead
              </button>
            </motion.div>
          </div>

          <motion.div
            initial={{ opacity: 0, y: 30, rotate: 1.5 }}
            animate={{ opacity: 1, y: 0, rotate: 0 }}
            transition={{ duration: 1.2, delay: 0.5, ease }}
            className="flex justify-center lg:justify-end"
          >
            <LiveTicker />
          </motion.div>
        </Wrap>

        <Wrap className="mt-16">
          <div className="flex flex-wrap gap-x-8 gap-y-2 border-t border-night-line pt-5 font-mono text-[0.72rem] uppercase tracking-[0.18em] text-white/40">
            <span>Website chat</span>
            <span>Website voice call</span>
            <span>Phone + SMS form</span>
            <span>Staff portal</span>
            <span className="text-white/25">WhatsApp · in testing</span>
          </div>
        </Wrap>
      </motion.div>
    </section>
  );
}
