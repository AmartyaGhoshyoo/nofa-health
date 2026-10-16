"use client";

import { ReactNode, useEffect, useRef, useState } from "react";
import { AnimatePresence, motion, useInView, useReducedMotion } from "motion/react";
import Container from "../ui/Container";
import SectionHeading from "../ui/SectionHeading";
import { site } from "@/config/site";

const ease = [0.22, 1, 0.36, 1] as const;

type Channel = { id: string; label: string; icon: ReactNode; message: string };

const I = {
  phone: <path d="M5 4h4l2 5-2.5 1.5a11 11 0 0 0 5 5L15 13l5 2v4a2 2 0 0 1-2 2A16 16 0 0 1 3 6a2 2 0 0 1 2-2z" />,
  sms: <path d="M4 5h16v11H8l-4 4V5z" />,
  wa: <path d="M12 3a9 9 0 0 0-7.8 13.5L3 21l4.6-1.2A9 9 0 1 0 12 3z" />,
  web: (
    <>
      <rect x="3" y="4" width="18" height="16" rx="2" />
      <path d="M3 9h18" />
    </>
  ),
  voice: (
    <>
      <rect x="9" y="3" width="6" height="12" rx="3" />
      <path d="M5 11a7 7 0 0 0 14 0M12 18v3" />
    </>
  ),
  mail: (
    <>
      <rect x="3" y="5" width="18" height="14" rx="2" />
      <path d="M3 7l9 6 9-6" />
    </>
  ),
};

function Icon({ children }: { children: ReactNode }) {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      {children}
    </svg>
  );
}

const CHANNELS: Channel[] = [
  { id: "phone", label: "Phone", icon: I.phone, message: "Called to ask about evening hours" },
  { id: "sms", label: "SMS", icon: I.sms, message: "“Can I bring my daughter too?”" },
  { id: "wa", label: "WhatsApp", icon: I.wa, message: "Sent insurance card photo" },
  { id: "web", label: "Web chat", icon: I.web, message: "Booked Tue 5:30 PM — family visit" },
  { id: "voice", label: "Voice note", icon: I.voice, message: "“Running 10 min late, sorry!”" },
  { id: "mail", label: "Email", icon: I.mail, message: "Received intake forms, signed" },
];

export default function Channels() {
  const ref = useRef<HTMLDivElement>(null);
  const inView = useInView(ref, { amount: 0.35 });
  const reduce = useReducedMotion();
  const [count, setCount] = useState(0);

  // Messages from different channels land in one shared timeline, one by one
  useEffect(() => {
    if (reduce) return setCount(CHANNELS.length);
    if (!inView) return;
    const t = setTimeout(() => setCount((c) => (c >= CHANNELS.length + 2 ? 0 : c + 1)), count === 0 ? 500 : 1500);
    return () => clearTimeout(t);
  }, [count, inView, reduce]);

  const shown = Math.min(count, CHANNELS.length);
  const activeId = CHANNELS[count - 1]?.id;

  return (
    <section className="relative py-24 md:py-32">
      <Container>
        <SectionHeading
          eyebrow="Omnichannel"
          title={
            <>
              Every channel. <em className="text-gradient">One conversation.</em>
            </>
          }
          description={`Patients reach out however they like. ${site.name} keeps one identity and shared context across all of them — nobody repeats themselves.`}
          align="center"
          className="mb-16"
        />

        <div ref={ref} className="grid items-center gap-10 lg:grid-cols-[1fr_auto_1.1fr] lg:gap-6">
          {/* Channels */}
          <ul className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-2">
            {CHANNELS.map((c, i) => {
              const lit = activeId === c.id;
              return (
                <motion.li
                  key={c.id}
                  initial={{ opacity: 0, y: 16 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ duration: 0.6, delay: i * 0.06, ease }}
                  animate={{ scale: lit ? 1.04 : 1 }}
                  className={`flex items-center gap-3 rounded-2xl border bg-surface p-4 transition-colors duration-300 ${
                    lit ? "border-teal shadow-[0_16px_40px_-20px_rgba(14,116,144,0.6)]" : "border-line"
                  }`}
                >
                  <span
                    className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl transition-colors duration-300 ${
                      lit ? "bg-teal text-white" : "bg-teal-soft text-teal"
                    }`}
                  >
                    <Icon>{c.icon}</Icon>
                  </span>
                  <span className="font-bold">{c.label}</span>
                </motion.li>
              );
            })}
          </ul>

          {/* Connector */}
          <div className="relative hidden h-[300px] w-28 lg:block" aria-hidden="true">
            <svg viewBox="0 0 112 300" className="h-full w-full" preserveAspectRatio="none">
              {[40, 100, 150, 200, 260].map((y, i) => (
                <motion.path
                  key={y}
                  d={`M0 ${y} C 60 ${y}, 50 150, 112 150`}
                  fill="none"
                  stroke="#0891B2"
                  strokeWidth="1.5"
                  strokeDasharray="5 6"
                  initial={{ opacity: 0.25 }}
                  animate={inView && !reduce ? { strokeDashoffset: [0, -44], opacity: 0.6 } : { opacity: 0.3 }}
                  transition={{ duration: 1.4, repeat: Infinity, ease: "linear", delay: i * 0.1 }}
                />
              ))}
            </svg>
          </div>

          {/* Unified patient profile */}
          <motion.div
            initial={{ opacity: 0, x: 30 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.8, ease }}
            className="rounded-[26px] bg-surface p-6 shadow-[0_40px_80px_-45px_rgba(6,42,51,0.45)] ring-1 ring-line"
          >
            <div className="flex items-center gap-3 border-b border-line pb-4">
              <span className="flex h-12 w-12 items-center justify-center rounded-full bg-gradient-to-br from-teal to-teal-light font-bold text-white">
                DK
              </span>
              <div>
                <p className="font-bold">Daniel Kim</p>
                <p className="text-[0.84rem] text-ink-faint">One patient · 6 channels · full history</p>
              </div>
              <span className="ml-auto rounded-full bg-teal-soft px-3 py-1 text-[0.75rem] font-bold text-teal">Shared context</span>
            </div>
            <ol className="mt-4 min-h-[300px] space-y-2.5">
              <AnimatePresence initial={false} mode="popLayout">
                {CHANNELS.slice(0, shown)
                  .map((c, i) => ({ c, i }))
                  .reverse()
                  .map(({ c, i }) => (
                    <motion.li
                      key={c.id}
                      layout
                      initial={{ opacity: 0, scale: 0.94 }}
                      animate={{ opacity: 1, scale: 1 }}
                      exit={{ opacity: 0 }}
                      transition={{ duration: 0.45, ease }}
                      className="flex items-start gap-3 rounded-xl bg-canvas px-3.5 py-2.5"
                    >
                      <span className="mt-0.5 text-teal">
                        <Icon>{c.icon}</Icon>
                      </span>
                      <span className="flex-1 text-[0.9rem]">{c.message}</span>
                      <span className="whitespace-nowrap font-mono text-[0.7rem] text-ink-faint">{c.label}</span>
                      <span className="sr-only">message {i + 1}</span>
                    </motion.li>
                  ))}
              </AnimatePresence>
            </ol>
          </motion.div>
        </div>
      </Container>
    </section>
  );
}
