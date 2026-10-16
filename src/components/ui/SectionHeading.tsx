"use client";

import { motion } from "motion/react";

interface Props {
  eyebrow: string;
  title: React.ReactNode;
  description?: string;
  className?: string;
  tone?: "light" | "dark";
  align?: "left" | "center";
}

const ease = [0.22, 1, 0.36, 1] as const;

// Eyebrow pops in, the title wipes up into view, the description blurs in.
export default function SectionHeading({ eyebrow, title, description, className = "", tone = "light", align = "left" }: Props) {
  const dark = tone === "dark";
  const center = align === "center";
  return (
    <motion.div
      initial="hidden"
      whileInView="show"
      viewport={{ once: true, margin: "0px 0px -80px 0px" }}
      className={`max-w-[700px] ${center ? "mx-auto text-center" : ""} ${className}`}
    >
      <motion.p
        variants={{ hidden: { opacity: 0, scale: 0.85, y: 8 }, show: { opacity: 1, scale: 1, y: 0, transition: { duration: 0.6, ease } } }}
        className={`mb-5 inline-flex items-center gap-2 rounded-full px-3.5 py-1.5 text-[0.76rem] font-semibold uppercase tracking-[0.16em] ${
          dark ? "bg-white/10 text-teal-light ring-1 ring-white/10" : "bg-surface text-teal ring-1 ring-teal/15"
        }`}
      >
        <span className={`h-1.5 w-1.5 rounded-full ${dark ? "bg-teal-light" : "bg-teal"}`} />
        {eyebrow}
      </motion.p>
      {/* Wipe reveal: the title is uncovered bottom-to-top while it rises */}
      <motion.h2
        initial={{ clipPath: "inset(0% 0% 100% 0%)", y: 28 }}
        whileInView={{ clipPath: "inset(0% 0% -10% 0%)", y: 0 }}
        viewport={{ once: true, margin: "0px 0px -80px 0px" }}
        transition={{ duration: 1, delay: 0.08, ease }}
        className={`font-display text-[2.3rem] leading-[1.06] md:text-[3.15rem] ${dark ? "text-white" : ""}`}
      >
        {title}
      </motion.h2>
      {description && (
        <motion.p
          variants={{
            hidden: { opacity: 0, y: 14, filter: "blur(8px)" },
            show: { opacity: 1, y: 0, filter: "blur(0px)", transition: { duration: 0.9, delay: 0.2, ease } },
          }}
          className={`mt-5 max-w-[560px] text-[1.06rem] leading-relaxed ${center ? "mx-auto" : ""} ${dark ? "text-white/70" : "text-ink-muted"}`}
        >
          {description}
        </motion.p>
      )}
    </motion.div>
  );
}
