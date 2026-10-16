"use client";

import { useState } from "react";
import { AnimatePresence, motion } from "motion/react";
import Container from "../ui/Container";
import SectionHeading from "../ui/SectionHeading";
import { site } from "@/config/site";

const FAQS = [
  {
    q: `Does ${site.name} replace my front-desk team?`,
    a: `No — it takes the repetitive calls, bookings and reschedules off their plate, and works around the clock. Anything clinical, sensitive or unusual is handed to your staff with a summary.`,
  },
  {
    q: "What happens if a patient describes an emergency?",
    a: `${site.name} never gives medical advice. It tells the caller to contact emergency services right away and can transfer them to your clinical team immediately.`,
  },
  {
    q: "Which systems does it work with?",
    a: "Your existing phone number, Google or Outlook calendars, Calendly, and your EHR or practice-management system through integrations. No system replacement needed.",
  },
  {
    q: "How do you avoid “confirmed” bookings that didn't actually save?",
    a: `${site.name} only tells a patient they're booked after your scheduling system returns a successful transaction — and every action is written to an audit trail.`,
  },
  {
    q: "Which channels and languages are supported?",
    a: "Phone calls, SMS, WhatsApp (including voice notes), web chat and email — all sharing one patient context. Conversations can run in multiple languages.",
  },
  {
    q: "How does rollout work?",
    a: "Most clinics start with reception and booking on their existing number and website, then switch on schedule recovery, smart waitlists and analytics once the basics are running smoothly.",
  },
];

export default function FAQ() {
  const [open, setOpen] = useState<number | null>(0);
  return (
    <section id="faq" className="relative scroll-mt-20 bg-canvas-soft py-24 md:py-32">
      <Container className="grid gap-12 lg:grid-cols-[0.8fr_1.2fr]">
        <SectionHeading eyebrow="FAQ" title="Questions clinics ask us" description={`Can't find what you need? Ask ${site.agent} directly — it's right there in the corner.`} />
        <ul className="divide-y divide-line rounded-[24px] bg-surface px-2 ring-1 ring-line">
          {FAQS.map((f, i) => {
            const isOpen = open === i;
            return (
              <li key={f.q}>
                <button
                  type="button"
                  onClick={() => setOpen(isOpen ? null : i)}
                  aria-expanded={isOpen}
                  className="flex min-h-[64px] w-full cursor-pointer items-center justify-between gap-4 px-4 py-4 text-left text-[1.05rem] font-bold"
                >
                  {f.q}
                  <motion.span
                    animate={{ rotate: isOpen ? 45 : 0 }}
                    className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-full transition-colors ${
                      isOpen ? "bg-teal text-white" : "bg-teal-soft text-teal"
                    }`}
                    aria-hidden="true"
                  >
                    +
                  </motion.span>
                </button>
                <AnimatePresence initial={false}>
                  {isOpen && (
                    <motion.div
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: "auto", opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      transition={{ duration: 0.35, ease: [0.22, 1, 0.36, 1] }}
                      className="overflow-hidden"
                    >
                      <p className="px-4 pb-5 text-[1rem] leading-relaxed text-ink-muted">{f.a}</p>
                    </motion.div>
                  )}
                </AnimatePresence>
              </li>
            );
          })}
        </ul>
      </Container>
    </section>
  );
}
