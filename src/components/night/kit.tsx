"use client";

// Small shared pieces for the animated "night shift" homepage.
import { ReactNode } from "react";
import { motion } from "motion/react";

export const ease = [0.22, 1, 0.36, 1] as const;

export function Wrap({ children, className = "" }: { children: ReactNode; className?: string }) {
  return <div className={`mx-auto w-full max-w-[1240px] px-4 sm:px-8 ${className}`}>{children}</div>;
}

export function Eyebrow({ children, className = "" }: { children: ReactNode; className?: string }) {
  return (
    <p className={`font-mono text-[0.72rem] uppercase tracking-[0.24em] text-aqua/80 ${className}`}>
      <span className="mr-2 inline-block h-1.5 w-1.5 -translate-y-px rounded-full bg-aqua shadow-[0_0_10px_#5EEAD4]" />
      {children}
    </p>
  );
}

/** Serif italic accent inside a headline, e.g. <Accent>kept.</Accent> */
export function Accent({ children }: { children: ReactNode }) {
  return <em className="font-serif font-normal italic tracking-normal text-aqua">{children}</em>;
}

/**
 * A headline whose words rise into view one after another (once, when scrolled to).
 * Words wrapped in *asterisks* become serif italic accents.
 */
export function RiseWords({ text, className = "", delay = 0 }: { text: string; className?: string; delay?: number }) {
  // The whole line watches the viewport, not each word: a word starts clipped out of
  // sight, so it could never report itself as "in view" and would stay hidden.
  return (
    <motion.span className={className} initial="hidden" whileInView="show" viewport={{ once: true, margin: "-10% 0px" }}>
      {text.split(" ").map((word, i) => {
        const accent = word.startsWith("*") && word.endsWith("*");
        const clean = accent ? word.slice(1, -1) : word;
        return (
          <span key={i}>
            <span className="inline-block overflow-hidden pb-[0.14em] align-top">
              <motion.span
                className={`inline-block ${accent ? "font-serif font-normal italic tracking-normal text-aqua" : ""}`}
                variants={{
                  hidden: { y: "115%" },
                  show: { y: "0%", transition: { duration: 0.95, delay: delay + i * 0.055, ease } },
                }}
              >
                {clean}
              </motion.span>
            </span>{" "}
          </span>
        );
      })}
    </motion.span>
  );
}

/** Fades and lifts its children in when scrolled into view. */
export function Rise({ children, delay = 0, className = "" }: { children: ReactNode; delay?: number; className?: string }) {
  return (
    <motion.div
      className={className}
      initial={{ opacity: 0, y: 28 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "-8% 0px" }}
      transition={{ duration: 0.9, delay, ease }}
    >
      {children}
    </motion.div>
  );
}

/** A frosted dark panel with a faint top highlight. */
export function Glass({ children, className = "" }: { children: ReactNode; className?: string }) {
  return (
    <div
      className={`relative rounded-[1.6rem] border border-night-line bg-white/[0.035] shadow-[inset_0_1px_0_rgba(255,255,255,0.06),0_30px_80px_-30px_rgba(0,0,0,0.8)] backdrop-blur-xl ${className}`}
    >
      {children}
    </div>
  );
}

export const DOCTORS = [
  { id: "rahman", name: "Dr. Ayesha Rahman", short: "AR", specialty: "General Practice", hours: "9 AM – 5 PM" },
  { id: "chowdhury", name: "Dr. Imran Chowdhury", short: "IC", specialty: "General Practice", hours: "10 AM – 6 PM" },
  { id: "sultana", name: "Dr. Nusrat Sultana", short: "NS", specialty: "Pediatrics", hours: "9 AM – 3 PM" },
  { id: "karim", name: "Dr. Farhan Karim", short: "FK", specialty: "Dermatology", hours: "11 AM – 7 PM" },
] as const;
