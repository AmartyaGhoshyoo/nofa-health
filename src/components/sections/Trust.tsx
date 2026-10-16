"use client";

import { motion, useReducedMotion } from "motion/react";
import Container from "../ui/Container";
import SectionHeading from "../ui/SectionHeading";
import { LogoMark } from "../ui/Logo";
import { site } from "@/config/site";

const ease = [0.22, 1, 0.36, 1] as const;

const INNER = ["Google Calendar", "Outlook", "Calendly", "Your EHR"];
const OUTER = ["Phone line", "SMS", "WhatsApp", "Web chat", "Email", "Practice mgmt", "CRM"];

const CONTROLS = [
  { title: "Identity checks", body: "Optional phone, email or date-of-birth verification before anything changes." },
  { title: "Policy-aware booking", body: "Visit rules, durations, deposits and eligibility enforced on every booking." },
  { title: "Spam & duplicate screening", body: "Filters robocalls and catches duplicate bookings before they happen." },
  { title: "Verified transactions", body: "Confirms only after the source system returns success — no false “you're booked”." },
  { title: "Full audit trail", body: "Every call, message and change is logged with a transcript and summary." },
  { title: "No medical advice", body: "Clinical or urgent questions go straight to your team, with context." },
];

function Orbit({ items, radius, duration, reverse = false }: { items: string[]; radius: number; duration: number; reverse?: boolean }) {
  const reduce = useReducedMotion();
  return (
    <motion.div
      className="absolute left-1/2 top-1/2"
      style={{ width: radius * 2, height: radius * 2, marginLeft: -radius, marginTop: -radius }}
      animate={reduce ? undefined : { rotate: reverse ? -360 : 360 }}
      transition={{ duration, repeat: Infinity, ease: "linear" }}
    >
      <div className="absolute inset-0 rounded-full border border-dashed border-teal/25" />
      {items.map((label, i) => {
        const angle = (i / items.length) * Math.PI * 2;
        return (
          <motion.span
            key={label}
            className="absolute whitespace-nowrap rounded-full bg-surface px-3 py-1.5 text-[0.78rem] font-bold shadow-sm ring-1 ring-line"
            style={{ left: radius + Math.cos(angle) * radius, top: radius + Math.sin(angle) * radius, x: "-50%", y: "-50%" }}
            animate={reduce ? undefined : { rotate: reverse ? 360 : -360 }}
            transition={{ duration, repeat: Infinity, ease: "linear" }}
          >
            {label}
          </motion.span>
        );
      })}
    </motion.div>
  );
}

export default function Trust() {
  return (
    <section className="relative overflow-hidden py-24 md:py-32">
      <Container className="grid items-center gap-14 lg:grid-cols-2">
        {/* Integrations orbit */}
        <div className="relative order-2 mx-auto aspect-square w-full max-w-[460px] lg:order-1" aria-hidden="true">
          <div className="absolute inset-[20%] rounded-full bg-teal-light/20 blur-3xl" />
          <div className="absolute inset-0 max-sm:scale-[0.72]">
            <Orbit items={OUTER} radius={210} duration={70} />
            <Orbit items={INNER} radius={125} duration={45} reverse />
          </div>
          <motion.div
            className="absolute left-1/2 top-1/2 -ml-12 -mt-12 flex h-24 w-24 items-center justify-center rounded-[28px] bg-surface shadow-[0_20px_50px_-20px_rgba(14,116,144,0.6)] ring-1 ring-line"
            animate={{ scale: [1, 1.05, 1] }}
            transition={{ duration: 3, repeat: Infinity, ease: "easeInOut" }}
          >
            <LogoMark className="h-14 w-14" />
          </motion.div>
        </div>

        <div className="order-1 lg:order-2">
          <SectionHeading
            eyebrow="Fits your clinic"
            title={
              <>
                Plugs into what you <em className="text-gradient">already run.</em>
              </>
            }
            description={`Keep your phone number, calendars and clinical systems. ${site.name} works on top of them — start with reception and booking, then add recovery, waitlists and analytics.`}
          />
          <ul className="mt-10 grid gap-x-8 gap-y-6 sm:grid-cols-2">
            {CONTROLS.map((c, i) => (
              <motion.li
                key={c.title}
                initial={{ opacity: 0, y: 16 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.6, delay: i * 0.06, ease }}
                className="flex gap-3"
              >
                <span className="mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-teal-soft text-teal">
                  <svg width="15" height="15" viewBox="0 0 24 24" fill="none" aria-hidden="true">
                    <path d="M12 3l7 3v5c0 4.5-3 8.3-7 10-4-1.7-7-5.5-7-10V6l7-3z" stroke="currentColor" strokeWidth="1.9" strokeLinejoin="round" />
                    <path d="M9 12l2 2 4-4.5" stroke="currentColor" strokeWidth="1.9" strokeLinecap="round" strokeLinejoin="round" />
                  </svg>
                </span>
                <span>
                  <span className="block font-bold">{c.title}</span>
                  <span className="mt-1 block text-[0.94rem] leading-relaxed text-ink-muted">{c.body}</span>
                </span>
              </motion.li>
            ))}
          </ul>
        </div>
      </Container>
    </section>
  );
}
