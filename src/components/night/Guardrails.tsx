"use client";

import { motion } from "motion/react";
import { Eyebrow, Glass, RiseWords, Wrap, ease } from "./kit";

// The call rules, as small tiles. Each is real behaviour in ZOVAK.
const RULES = [
  { k: "10 s", title: "A gentle check-in", body: "Ten seconds of silence gets “are you still there?”. Ten more and the call ends politely." },
  { k: "bye", title: "A warm goodbye", body: "Say “thanks, bye” and Nofa wraps up by itself — with your doctor, day and time." },
  { k: "yes", title: "A real yes", body: "“Yes, but…” or a sentence cut short never books. Only a clear yes, after a pause." },
  { k: "@", title: "Typed, never spelled", body: "Emails are typed on screen or in the text form — never guessed from speech." },
  { k: "1×", title: "One-time links", body: "Booking forms and delay updates work once, then only show the result." },
  { k: "3", title: "Stays on topic", body: "Appointments only. A third off-topic request ends the call kindly." },
];

export default function Guardrails() {
  return (
    <section className="relative py-28 sm:py-36">
      <Wrap>
        <Eyebrow>Call rules</Eyebrow>
        <h2 className="mt-5 max-w-[46rem] font-display text-[clamp(2.4rem,5vw,4.4rem)] leading-[1.02] text-white">
          <RiseWords text="Polite on the phone. *Strict* with the calendar." />
        </h2>
        <div className="mt-14 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {RULES.map((r, i) => (
            <motion.div
              key={r.title}
              initial={{ opacity: 0, y: 24 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: "-8% 0px" }}
              transition={{ duration: 0.7, delay: (i % 3) * 0.08, ease }}
              whileHover={{ y: -4 }}
              className="group"
            >
              <Glass className="h-full p-6 transition-colors group-hover:border-aqua/30">
                <span className="font-serif text-[2.6rem] italic leading-none text-aqua transition-colors group-hover:text-spark">{r.k}</span>
                <p className="mt-4 font-display text-[1.25rem] text-white">{r.title}</p>
                <p className="mt-2 text-[0.92rem] leading-relaxed text-white/55">{r.body}</p>
              </Glass>
            </motion.div>
          ))}
        </div>
      </Wrap>
    </section>
  );
}
