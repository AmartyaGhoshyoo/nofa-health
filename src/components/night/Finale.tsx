"use client";

import { useRef } from "react";
import { motion, useScroll, useTransform } from "motion/react";
import { Wrap } from "./kit";
import { LogoMark } from "../ui/Logo";
import { openAssistant } from "../assistant/events";
import { site } from "@/config/site";

// The page flips to bright lime for the last word, then a quiet footer.
export default function Finale() {
  const ref = useRef<HTMLElement>(null);
  const { scrollYProgress } = useScroll({ target: ref, offset: ["start end", "center center"] });
  const scale = useTransform(scrollYProgress, [0, 1], [0.86, 1]);
  const radius = useTransform(scrollYProgress, [0, 1], [64, 28]);

  return (
    <>
      <section ref={ref} className="px-3 py-10 sm:px-6">
        <motion.div
          style={{ scale, borderRadius: radius }}
          className="relative mx-auto max-w-[1400px] overflow-hidden bg-th-spark px-6 py-24 text-th-on sm:px-12 sm:py-32"
        >
          <div className="pointer-events-none absolute -right-24 -top-24 h-96 w-96 rounded-full bg-white/40 blur-3xl" />
          <p className="font-mono text-[0.72rem] uppercase tracking-[0.24em] text-th-on/60">Ready when your patients are</p>
          <h2 className="mt-6 max-w-[68rem] font-display text-[clamp(2.5rem,5.6vw,5rem)] leading-[0.98]">
            Pick the call you <em className="font-serif font-normal italic tracking-normal">dread</em> most.
            <br />
            {site.agent} will take it from here.
          </h2>
          <div className="mt-10 flex flex-wrap gap-3">
            <button
              onClick={() => openAssistant("voice")}
              className="cursor-pointer rounded-full bg-th-on px-6 py-3.5 font-bold text-[#C8F169] transition-transform hover:scale-[1.03]"
            >
              Talk to {site.agent} now
            </button>
            <button
              onClick={() => openAssistant("chat", "I need to see a doctor")}
              className="cursor-pointer rounded-full border border-th-on/25 px-6 py-3.5 font-bold transition-colors hover:bg-th-bg/5"
            >
              Book by chat
            </button>
            <a href="/staff" className="rounded-full px-6 py-3.5 font-bold underline-offset-4 hover:underline">
              Open the staff portal →
            </a>
          </div>
        </motion.div>
      </section>

      <footer className="pb-28 pt-16">
        <Wrap className="flex flex-wrap items-center justify-between gap-6 border-t border-th-line pt-8 text-[0.86rem] text-th-fg/45">
          <span className="flex items-center gap-2.5 text-th-fg">
            <LogoMark className="h-7 w-7" />
            <span className="font-display text-[1.15rem]">{site.name}</span>
          </span>
          <span>Not for emergencies. {site.agent} doesn&apos;t give medical advice.</span>
          <span>
            Built by{" "}
            <a href={site.builtBy.url} className="text-th-fg/70 hover:text-th-fg">
              {site.builtBy.name}
            </a>{" "}
            · © {new Date().getFullYear()}
          </span>
        </Wrap>
      </footer>
    </>
  );
}
