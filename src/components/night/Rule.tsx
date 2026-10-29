"use client";

import { useRef } from "react";
import { MotionValue, motion, useScroll, useTransform } from "motion/react";
import { Wrap } from "./kit";

// Each word lights up as the sentence scrolls through the screen.
const WORDS =
  "The AI proposes. The patient confirms. Nothing is booked, moved or cancelled until they say yes — and Nofa never says “booked” before the calendar does.".split(
    " "
  );
const BRIGHT = new Set(["proposes.", "confirms.", "yes", "“booked”", "calendar"]);

export default function Rule() {
  const ref = useRef<HTMLParagraphElement>(null);
  const { scrollYProgress } = useScroll({ target: ref, offset: ["start 0.85", "end 0.45"] });

  return (
    <section className="relative py-24 sm:py-32">
      <Wrap>
        <p className="mb-8 font-mono text-[0.72rem] uppercase tracking-[0.24em] text-th-fg/35">The one rule</p>
        <p ref={ref} className="max-w-[62rem] font-display text-[clamp(2rem,4.6vw,4rem)] leading-[1.08] text-th-fg">
          {WORDS.map((w, i) => (
            <Word key={i} word={w} range={[i / WORDS.length, (i + 1) / WORDS.length]} progress={scrollYProgress} />
          ))}
        </p>
      </Wrap>
    </section>
  );
}

function Word({ word, range, progress }: { word: string; range: [number, number]; progress: MotionValue<number> }) {
  const opacity = useTransform(progress, range, [0.12, 1]);
  const bright = BRIGHT.has(word);
  return (
    <motion.span
      style={{ opacity }}
      className={bright ? "font-serif font-normal italic tracking-normal text-th-aqua-ink" : ""}
    >
      {word}{" "}
    </motion.span>
  );
}
