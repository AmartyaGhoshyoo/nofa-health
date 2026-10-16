"use client";

import { useRef } from "react";
import { MotionValue, motion, useScroll, useTransform } from "motion/react";
import Container from "../ui/Container";
import { site } from "@/config/site";

// Scroll-linked statement: each word brightens as it passes through the
// viewport, then two marquees of real-world requests and outcomes drift by.

const STATEMENT = `Phones ring during check-in. Patients cancel at 7 a.m. A doctor runs late and the whole afternoon slides. ${site.agent} takes the calls and fixes the schedule — so your team can focus on the patients in front of them.`;
const HIGHLIGHT = new Set([site.agent, "fixes", "schedule", "patients", "them."]);

const REQUESTS = [
  "Can I move my Thursday cleaning?",
  "Do you take new patients?",
  "¿Tienen citas el sábado?",
  "Running 10 minutes late, sorry!",
  "Is Dr. Chen free on Friday?",
  "Please cancel my 3 PM",
  "Do you have evening hours?",
  "I need a follow-up after my labs",
];

const OUTCOMES = [
  "Rebooked · Fri 10:00",
  "Added to waitlist",
  "Intake forms sent",
  "Transferred to nurse line",
  "Reminder confirmed",
  "Switched to video visit",
  "Cancelled slot refilled",
  "Identity verified",
];

function Word({ word, range, progress }: { word: string; range: [number, number]; progress: MotionValue<number> }) {
  const opacity = useTransform(progress, range, [0.14, 1]);
  const blur = useTransform(progress, range, [4, 0]);
  const filter = useTransform(blur, (b) => `blur(${b}px)`);
  const accent = HIGHLIGHT.has(word);
  return (
    <motion.span style={{ opacity, filter }} className={`mr-[0.25em] inline-block ${accent ? "text-gradient" : ""}`}>
      {word}
    </motion.span>
  );
}

function Marquee({ items, reverse = false, tone }: { items: string[]; reverse?: boolean; tone: "ask" | "done" }) {
  const loop = [...items, ...items];
  return (
    <div className="relative overflow-hidden [mask-image:linear-gradient(to_right,transparent,black_10%,black_90%,transparent)]">
      <ul
        className={`flex w-max gap-3 py-1.5 pr-3 hover:[animation-play-state:paused] motion-reduce:animate-none ${
          reverse ? "animate-marquee-reverse" : "animate-marquee"
        }`}
      >
        {loop.map((t, i) => (
          <li
            key={i}
            aria-hidden={i >= items.length}
            className={`flex items-center gap-2 whitespace-nowrap rounded-full px-4 py-2.5 text-[0.92rem] font-medium ${
              tone === "ask" ? "bg-surface text-ink ring-1 ring-line" : "bg-teal-soft text-teal ring-1 ring-teal/15"
            }`}
          >
            {tone === "ask" ? (
              <span className="text-ink-faint">“</span>
            ) : (
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" aria-hidden="true">
                <path d="M6 12.5l4 4 8-9" stroke="currentColor" strokeWidth="2.6" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            )}
            {t}
            {tone === "ask" && <span className="text-ink-faint">”</span>}
          </li>
        ))}
      </ul>
    </div>
  );
}

export default function Statement() {
  const ref = useRef<HTMLParagraphElement>(null);
  const { scrollYProgress } = useScroll({ target: ref, offset: ["start 85%", "end 45%"] });
  const words = STATEMENT.split(" ");

  return (
    <section className="relative overflow-hidden py-24 md:py-32">
      <Container>
        <p ref={ref} className="mx-auto max-w-[980px] text-center font-display text-[1.9rem] font-medium leading-[1.2] md:text-[2.9rem]">
          {words.map((w, i) => {
            const start = i / words.length;
            return <Word key={i} word={w} progress={scrollYProgress} range={[start, Math.min(1, start + 1.5 / words.length)]} />;
          })}
        </p>
      </Container>

      <div className="mt-16 space-y-3 md:mt-20">
        <Marquee items={REQUESTS} tone="ask" />
        <Marquee items={OUTCOMES} tone="done" reverse />
      </div>
    </section>
  );
}
