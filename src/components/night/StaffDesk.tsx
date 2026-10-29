"use client";

import { useEffect, useState } from "react";
import { AnimatePresence, motion, useInView } from "motion/react";
import { useRef } from "react";
import { DOCTORS, Eyebrow, Glass, Rise, RiseWords, Wrap, ease } from "./kit";

// The clinic's side: every booking from chat, voice and phone lands in the right
// doctor's schedule, and the staff assistant handles "I'm running late".
const DAY: Record<string, { t: string; who: string; moved?: string }[]> = {
  rahman: [
    { t: "9:00", who: "Ali Hasan" },
    { t: "9:30", who: "Bina Das" },
    { t: "11:00", who: "Dipu Roy" },
  ],
  chowdhury: [
    { t: "10:00", who: "Mitu Sen" },
    { t: "12:30", who: "Rafiq Ali" },
  ],
  sultana: [
    { t: "9:30", who: "Arif (child)" },
    { t: "11:00", who: "Rahim (child)" },
  ],
  karim: [
    { t: "11:30", who: "Chandni Akter" },
    { t: "12:30", who: "Eshita Khan" },
    { t: "1:00", who: "Amartya Ghosh", moved: "1:30" },
  ],
};

const SCRIPT = [
  { who: "you", text: "I'll be 30 minutes late for my 1:00" },
  { who: "nofa", text: "Only Amartya Ghosh's 1:00 PM moves, to 1:30. Everyone earlier is untouched. Shall I send the notice?" },
  { who: "you", text: "Yes, send it" },
  { who: "nofa", text: "Sent. Amartya has a link to keep 1:30, pick another time or cancel." },
] as const;

export default function StaffDesk() {
  const ref = useRef<HTMLDivElement>(null);
  const inView = useInView(ref, { margin: "-20% 0px" });
  const [beat, setBeat] = useState(0);
  useEffect(() => {
    if (!inView) return;
    const id = setInterval(() => setBeat((b) => (b >= SCRIPT.length + 2 ? 0 : b + 1)), 1800);
    return () => clearInterval(id);
  }, [inView]);
  const sent = beat >= 4;

  return (
    <section id="staff" className="relative py-28 sm:py-36">
      <Wrap>
        <Eyebrow>Staff desk</Eyebrow>
        <h2 className="mt-5 max-w-[50rem] font-display text-[clamp(2.4rem,5vw,4.4rem)] leading-[1.02] text-th-fg">
          <RiseWords text="Every booking lands on the *right* doctor's day." />
        </h2>
        <p className="mt-5 max-w-[38rem] text-[1.04rem] leading-relaxed text-th-fg/55">
          Chat, website calls and phone bookings all go into one schedule. Doctors sign in and see only their own patients — any
          day — and reception sees everyone. It refreshes on its own.
        </p>

        <Rise className="mt-12">
          <div ref={ref}>
            <Glass className="overflow-hidden">
              <div className="flex flex-wrap items-center gap-2 border-b border-th-line px-5 py-3.5">
                {["Schedule", "Running late", "Patient updates", "Assistant"].map((t, i) => (
                  <span
                    key={t}
                    className={`rounded-full px-3.5 py-1.5 text-[0.8rem] font-semibold ${i === 0 ? "bg-th-fg text-th-bg" : "text-th-fg/50"}`}
                  >
                    {t}
                  </span>
                ))}
                <span className="ml-auto font-mono text-[0.7rem] text-th-fg/35">Friday, Oct 30 · Dhaka</span>
              </div>
              <div className="grid gap-px bg-th-line lg:grid-cols-[1fr_22rem]">
                <div className="grid grid-cols-2 gap-px bg-th-line xl:grid-cols-4">
                  {DOCTORS.map((d, di) => (
                    <div key={d.id} className="bg-th-panel/95 p-4">
                      <p className="text-[0.86rem] font-bold text-th-fg">{d.name}</p>
                      <p className="text-[0.72rem] text-th-fg/40">
                        {d.specialty} · {d.hours}
                      </p>
                      <ul className="mt-3 space-y-2">
                        {(DAY[d.id] ?? []).map((b, bi) => (
                          <motion.li
                            key={b.who}
                            initial={{ opacity: 0, x: -10 }}
                            whileInView={{ opacity: 1, x: 0 }}
                            viewport={{ once: true }}
                            transition={{ delay: 0.2 + di * 0.1 + bi * 0.08, ease }}
                            className={`rounded-xl px-3 py-2 ${b.moved && sent ? "bg-th-spark/15 ring-1 ring-th-spark/50" : "bg-th-fg/[0.04]"}`}
                          >
                            <span className="flex items-center justify-between font-mono text-[0.76rem] text-th-fg">
                              <AnimatePresence mode="wait">
                                <motion.span key={b.moved && sent ? "m" : "o"} initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }}>
                                  {b.moved && sent ? b.moved : b.t}
                                </motion.span>
                              </AnimatePresence>
                              {b.moved && sent && <span className="rounded-full bg-th-spark px-1.5 text-[0.6rem] font-bold text-th-on">moved</span>}
                            </span>
                            <span className="text-[0.74rem] text-th-fg/55">{b.who}</span>
                          </motion.li>
                        ))}
                      </ul>
                    </div>
                  ))}
                </div>
                <div className="flex flex-col bg-th-panel/95 p-4">
                  <p className="font-mono text-[0.68rem] uppercase tracking-[0.2em] text-th-fg/40">Assistant · Dr. Karim</p>
                  <div className="mt-3 flex min-h-[15rem] flex-1 flex-col justify-end gap-2">
                    <AnimatePresence initial={false}>
                      {SCRIPT.slice(0, Math.min(beat, SCRIPT.length)).map((m, i) => (
                        <motion.p
                          key={i}
                          layout
                          initial={{ opacity: 0, y: 10 }}
                          animate={{ opacity: 1, y: 0 }}
                          exit={{ opacity: 0 }}
                          transition={{ duration: 0.4, ease }}
                          className={
                            m.who === "you"
                              ? "ml-auto max-w-[85%] rounded-2xl rounded-br-md bg-th-aqua/80 px-3 py-2 text-[0.8rem] text-th-on"
                              : "max-w-[90%] rounded-2xl rounded-bl-md border border-th-fg/10 bg-th-fg/5 px-3 py-2 text-[0.8rem] text-th-fg/85"
                          }
                        >
                          {m.text}
                        </motion.p>
                      ))}
                    </AnimatePresence>
                  </div>
                </div>
              </div>
            </Glass>
          </div>
        </Rise>
      </Wrap>
    </section>
  );
}
