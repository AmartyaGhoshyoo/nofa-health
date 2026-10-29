"use client";

import { ReactNode, useEffect, useState } from "react";
import { AnimatePresence, motion } from "motion/react";
import { Eyebrow, Glass, Rise, RiseWords, Wrap, ease } from "./kit";
import { Waveform } from "./Hero";

// Same brain, every door: each card runs a tiny live loop of that channel.
export default function Channels() {
  return (
    <section id="channels" className="relative py-28 sm:py-36">
      <Wrap>
        <Eyebrow>Channels</Eyebrow>
        <h2 className="mt-5 max-w-[48rem] font-display text-[clamp(2.4rem,5vw,4.4rem)] leading-[1.02] text-white">
          <RiseWords text="One receptionist. *Every* door patients knock on." />
        </h2>
        <div className="mt-14 grid gap-4 md:grid-cols-2">
          <Rise>
            <Card label="Website chat" note="Doctor cards, tap to choose, a booking card to confirm.">
              <ChatLoop />
            </Card>
          </Rise>
          <Rise delay={0.08}>
            <Card label="Website voice call" note="Talk in the browser. Email is typed, never spelled. It ends with a warm goodbye.">
              <VoiceLoop />
            </Card>
          </Rise>
          <Rise delay={0.12}>
            <Card label="Phone call + SMS form" note="Call the clinic number. Say “confirm” and a 2-minute form arrives by text.">
              <PhoneLoop />
            </Card>
          </Rise>
          <Rise delay={0.16}>
            <Card label="WhatsApp" note="Chat with tap buttons and calls through an audio bridge — in testing." muted>
              <WhatsAppLoop />
            </Card>
          </Rise>
        </div>
      </Wrap>
    </section>
  );
}

function Card({ label, note, muted = false, children }: { label: string; note: string; muted?: boolean; children: ReactNode }) {
  return (
    <motion.div whileHover={{ y: -6 }} transition={{ duration: 0.4, ease }} className="group h-full">
      <Glass className={`h-full overflow-hidden p-6 transition-colors group-hover:border-aqua/30 ${muted ? "opacity-70" : ""}`}>
        <div className="flex h-44 items-center justify-center overflow-hidden rounded-2xl bg-night-900/70">{children}</div>
        <p className="mt-5 font-display text-[1.35rem] text-white">{label}</p>
        <p className="mt-1.5 text-[0.92rem] leading-relaxed text-white/55">{note}</p>
      </Glass>
    </motion.div>
  );
}

function useTicker(length: number, ms: number) {
  const [i, setI] = useState(0);
  useEffect(() => {
    const id = setInterval(() => setI((n) => (n + 1) % length), ms);
    return () => clearInterval(id);
  }, [length, ms]);
  return i;
}

function ChatLoop() {
  const i = useTicker(4, 1500);
  return (
    <div className="w-[82%] space-y-2">
      <AnimatePresence>
        {i >= 0 && (
          <motion.p key="a" initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} className="ml-auto w-fit rounded-xl bg-white/10 px-3 py-1.5 text-[0.78rem] text-white">
            I need a skin doctor
          </motion.p>
        )}
        {i >= 1 && (
          <motion.div key="b" initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} className="flex items-center gap-2 rounded-xl border border-aqua/30 bg-aqua/10 px-3 py-2">
            <span className="flex h-6 w-6 items-center justify-center rounded-full bg-aqua text-[0.6rem] font-bold text-night">FK</span>
            <span className="flex-1 text-[0.78rem] text-white">Dr. Farhan Karim</span>
            <span className={`rounded-md px-2 py-0.5 text-[0.66rem] font-bold ${i >= 2 ? "bg-spark text-night" : "bg-aqua/30 text-aqua"}`}>
              {i >= 2 ? "✓ Selected" : "Choose"}
            </span>
          </motion.div>
        )}
        {i >= 3 && (
          <motion.p key="c" initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} className="w-fit rounded-xl border border-white/10 px-3 py-1.5 text-[0.78rem] text-white/80">
            Booked · Fri 11:30 ✓
          </motion.p>
        )}
      </AnimatePresence>
    </div>
  );
}

function VoiceLoop() {
  const [seconds, setSeconds] = useState(42);
  useEffect(() => {
    const id = setInterval(() => setSeconds((s) => (s >= 99 ? 42 : s + 1)), 1000);
    return () => clearInterval(id);
  }, []);
  return (
    <div className="flex flex-col items-center gap-4">
      <motion.span
        className="h-16 w-16 rounded-full bg-[radial-gradient(circle_at_35%_30%,#A7F3D0,#0E7490_70%)]"
        animate={{ scale: [1, 1.08, 1], boxShadow: ["0 0 20px rgba(94,234,212,0.3)", "0 0 50px rgba(94,234,212,0.6)", "0 0 20px rgba(94,234,212,0.3)"] }}
        transition={{ duration: 2, repeat: Infinity }}
      />
      <div className="flex items-center gap-3">
        <Waveform bars={14} />
        <span className="rounded-full bg-rose/20 px-2 py-0.5 font-mono text-[0.7rem] text-rose-300">● 0:{seconds}</span>
      </div>
    </div>
  );
}

function PhoneLoop() {
  const [left, setLeft] = useState(120);
  useEffect(() => {
    const id = setInterval(() => setLeft((s) => (s <= 0 ? 120 : s - 1)), 1000);
    return () => clearInterval(id);
  }, []);
  return (
    <div className="flex items-center gap-5">
      <motion.span
        animate={{ rotate: [0, -12, 12, -12, 0] }}
        transition={{ duration: 0.8, repeat: Infinity, repeatDelay: 1.6 }}
        className="flex h-12 w-12 items-center justify-center rounded-full bg-white/10 text-xl"
      >
        📞
      </motion.span>
      <span className="text-white/30">→</span>
      <div className="w-40 rounded-2xl border border-white/15 bg-white p-3 text-night">
        <p className="text-[0.62rem] font-bold uppercase tracking-wider text-night/50">Confirm your visit</p>
        <p className="mt-1 text-[0.76rem] font-bold">Dr. Karim · Fri 11:30</p>
        <p className="mt-1.5 rounded bg-night/5 px-1.5 py-1 text-[0.66rem] text-night/50">you@email.com</p>
        <div className="mt-2 flex items-center justify-between">
          <span className="rounded bg-night px-1.5 py-0.5 text-[0.62rem] font-bold text-spark">Confirm</span>
          <span className="font-mono text-[0.7rem] font-bold">
            {Math.floor(left / 60)}:{String(left % 60).padStart(2, "0")}
          </span>
        </div>
      </div>
    </div>
  );
}

function WhatsAppLoop() {
  return (
    <div className="w-[78%] space-y-2">
      <p className="ml-auto w-fit rounded-xl bg-[#005C4B] px-3 py-1.5 text-[0.78rem] text-white">Can I move my visit to 4pm?</p>
      <p className="w-fit rounded-xl bg-white/10 px-3 py-1.5 text-[0.78rem] text-white/85">Move Fri 11:30 → 4:00 PM?</p>
      <div className="flex gap-2">
        <span className="flex-1 rounded-lg border border-white/15 py-1.5 text-center text-[0.72rem] text-sky-300">Confirm move</span>
        <span className="flex-1 rounded-lg border border-white/15 py-1.5 text-center text-[0.72rem] text-sky-300">Keep time</span>
      </div>
    </div>
  );
}
