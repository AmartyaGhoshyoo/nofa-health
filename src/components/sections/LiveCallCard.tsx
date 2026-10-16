"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { AnimatePresence, motion, useReducedMotion } from "motion/react";
import { site } from "@/config/site";
import demoCall from "@/lib/agent/demo-call.json";
import { createSpeaker, primeDemoAudio, type Speaker, type SpokenLine } from "@/lib/agent/speech";
import { PLAY_DEMO_CALL_EVENT } from "../assistant/events";

// Hero visual: an audible demo call. Idle, it waits on an incoming call with
// a Play button. Played, the patient and Nofa talk (two voices — studio
// recordings if generated, otherwise the browser's own voices) and the card
// animates in sync: who's speaking, word-by-word captions, offered slots, the
// pick, the verified booking, and the SMS confirmation.

const ease = [0.22, 1, 0.36, 1] as const;
const LINES = demoCall.lines as SpokenLine[];

// Moments in the script that drive the on-card visuals
const OFFER_LINE = 2; // Nofa offers Friday 10:00 / Monday 4:15
const PICK_LINE = 3; // patient picks Friday
const CONFIRM_LINE = 4; // Nofa confirms
const SLOTS = ["Fri · 10:00", "Mon · 4:15"];

type Phase = "idle" | "connecting" | "playing" | "ended";

export default function LiveCallCard() {
  const reduce = useReducedMotion();
  const [phase, setPhase] = useState<Phase>("idle");
  const [line, setLine] = useState(-1); // index of the line being spoken
  const [speaking, setSpeaking] = useState<"assistant" | "user" | null>(null);
  const [verified, setVerified] = useState(false);
  const [muted, setMuted] = useState(false);
  const [seconds, setSeconds] = useState(0);
  const speakerRef = useRef<Speaker | null>(null);
  const runRef = useRef(0); // invalidates an older run when stopped/replayed
  const cardRef = useRef<HTMLDivElement>(null);

  const stop = useCallback(() => {
    runRef.current++;
    speakerRef.current?.cancel();
    speakerRef.current = null;
    setSpeaking(null);
  }, []);

  // Must be called synchronously from a click (audio unlock)
  const play = useCallback(() => {
    stop();
    primeDemoAudio();
    const run = ++runRef.current;
    const speaker = createSpeaker();
    speaker.setMuted(muted);
    speakerRef.current = speaker;
    setPhase("connecting");
    setLine(-1);
    setVerified(false);
    setSeconds(0);

    (async () => {
      await Promise.all([speaker.ready(), new Promise((r) => setTimeout(r, 1100))]);
      for (let i = 0; i < LINES.length; i++) {
        if (run !== runRef.current) return;
        const l = LINES[i]!;
        setPhase("playing");
        setLine(i);
        setSpeaking(l.role === "assistant" ? "assistant" : "user");
        if (i === CONFIRM_LINE) setTimeout(() => run === runRef.current && setVerified(true), 1400);
        await speaker.say(l);
        if (run !== runRef.current) return;
        setSpeaking(null);
        await new Promise((r) => setTimeout(r, LINES[i + 1]?.role === "assistant" ? 450 : 250));
      }
      if (run === runRef.current) setPhase("ended");
    })();
  }, [muted, stop]);

  // "Hear a live call" buttons elsewhere on the page trigger this card
  useEffect(() => {
    function onPlay() {
      play();
      cardRef.current?.scrollIntoView({ behavior: "smooth", block: "center" });
    }
    window.addEventListener(PLAY_DEMO_CALL_EVENT, onPlay);
    return () => window.removeEventListener(PLAY_DEMO_CALL_EVENT, onPlay);
  }, [play]);

  useEffect(() => () => stop(), [stop]);

  // Call timer
  useEffect(() => {
    if (phase !== "playing" && phase !== "connecting") return;
    const t = setInterval(() => setSeconds((s) => s + 1), 1000);
    return () => clearInterval(t);
  }, [phase]);

  function toggleMute() {
    const next = !muted;
    setMuted(next);
    speakerRef.current?.setMuted(next);
  }

  const active = phase === "connecting" || phase === "playing";
  const visible = LINES.slice(0, line + 1).map((l, i) => ({ ...l, i })).slice(-2);
  const showSlots = line >= OFFER_LINE && line < CONFIRM_LINE;
  const showConfirm = line >= CONFIRM_LINE;
  const time = `${Math.floor(seconds / 60)}:${String(seconds % 60).padStart(2, "0")}`;

  return (
    <div ref={cardRef} className="relative">
      <div className="relative overflow-hidden rounded-[28px] bg-surface p-5 shadow-[0_50px_100px_-40px_rgba(6,42,51,0.35)] sm:p-6">
        {/* Header */}
        <div className="flex items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="relative flex h-11 w-11 items-center justify-center rounded-full bg-teal-soft font-bold text-teal">
              MR
              {(phase === "idle" || speaking === "user") && !reduce && (
                <motion.span
                  className="absolute inset-0 rounded-full ring-2 ring-teal"
                  animate={{ scale: [1, 1.45], opacity: [0.6, 0] }}
                  transition={{ duration: 1.2, repeat: Infinity }}
                />
              )}
            </div>
            <div>
              <p className="font-bold">Maya Rodriguez</p>
              <p className="text-[0.82rem] text-ink-faint">
                {phase === "idle"
                  ? "Incoming call…"
                  : phase === "connecting"
                    ? "Connecting…"
                    : phase === "ended"
                      ? `Call ended · ${time}`
                      : `On call · ${time}`}
              </p>
            </div>
          </div>
          <span
            className={`flex items-center gap-1.5 rounded-full px-3 py-1 text-[0.75rem] font-bold ${
              active ? "bg-rose-soft text-rose" : "bg-mint-soft text-mint"
            }`}
          >
            <span className={`h-1.5 w-1.5 rounded-full ${active ? "animate-pulse bg-rose" : "bg-mint"}`} />
            {active ? "Live demo" : `${site.agent} answering`}
          </span>
        </div>

        {/* Waveform — teal when Nofa speaks, grey when the patient speaks */}
        <div className="mt-5 flex h-10 items-center gap-[3px]" aria-hidden="true">
          {Array.from({ length: 42 }).map((_, i) => (
            <motion.span
              key={i}
              className={`w-full rounded-full transition-colors duration-300 ${speaking === "user" ? "bg-ink/35" : "bg-teal-bright"}`}
              animate={{
                height: speaking && !reduce ? [6, 6 + Math.abs(Math.sin(i * 1.7)) * 30, 8] : phase === "idle" && !reduce ? [4, 8, 4] : 4,
                opacity: speaking ? 1 : 0.35,
              }}
              transition={{
                duration: speaking ? 0.45 + (i % 5) * 0.08 : 1.6,
                repeat: Infinity,
                repeatType: "mirror",
                delay: phase === "idle" ? i * 0.03 : 0,
              }}
            />
          ))}
        </div>

        {/* Body */}
        <div className="relative mt-5 min-h-[236px]">
          <AnimatePresence mode="wait">
            {phase === "idle" ? (
              <motion.div
                key="idle"
                initial={{ opacity: 0, scale: 0.96 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.96 }}
                transition={{ duration: 0.4, ease }}
                className="absolute inset-0 flex flex-col items-center justify-center text-center"
              >
                <PlayButton onClick={play} />
                <p className="mt-9 text-[1.05rem] font-bold">Hear {site.agent} handle a real call</p>
                <p className="mt-1 text-[0.86rem] text-ink-faint">A patient reschedules · about 40 seconds · sound on</p>
              </motion.div>
            ) : phase === "connecting" ? (
              <motion.div
                key="connecting"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="absolute inset-0 flex flex-col items-center justify-center gap-3 text-ink-faint"
              >
                <span className="flex gap-1.5">
                  {[0, 1, 2].map((i) => (
                    <motion.span
                      key={i}
                      className="h-2 w-2 rounded-full bg-teal-bright"
                      animate={{ opacity: [0.25, 1, 0.25], y: [0, -4, 0] }}
                      transition={{ duration: 0.9, repeat: Infinity, delay: i * 0.15 }}
                    />
                  ))}
                </span>
                <span className="text-[0.92rem]">{site.agent} is picking up…</span>
              </motion.div>
            ) : (
              <motion.div key="call" initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-3">
                <AnimatePresence initial={false} mode="popLayout">
                  {visible.map((l) => (
                    <motion.div
                      key={l.i}
                      layout
                      initial={{ opacity: 0, y: 14, scale: 0.98 }}
                      animate={{ opacity: l.i === line ? 1 : 0.55, y: 0, scale: 1 }}
                      exit={{ opacity: 0, y: -10 }}
                      transition={{ duration: 0.4, ease }}
                      className={`flex ${l.role === "user" ? "justify-end" : "justify-start"}`}
                    >
                      <p
                        className={`max-w-[88%] rounded-2xl px-4 py-2.5 text-[0.9rem] leading-snug ${
                          l.role === "user" ? "rounded-br-md bg-canvas-soft" : "rounded-bl-md bg-teal text-white"
                        }`}
                      >
                        <Caption text={l.text} live={l.i === line && !!speaking} />
                      </p>
                    </motion.div>
                  ))}
                </AnimatePresence>

                <AnimatePresence mode="wait">
                  {showSlots && (
                    <motion.div key="slots" exit={{ opacity: 0, y: -6 }} className="flex flex-wrap gap-2">
                      {SLOTS.map((s, i) => {
                        const picked = line >= PICK_LINE && i === 0;
                        const faded = line >= PICK_LINE && i !== 0;
                        return (
                          <motion.span
                            key={s}
                            initial={{ opacity: 0, y: 8, scale: 0.9 }}
                            animate={{ opacity: faded ? 0.35 : 1, y: 0, scale: picked ? 1.06 : 1 }}
                            // Slots pop in as Nofa mentions them; the pick reacts immediately
                            transition={{ duration: 0.4, delay: line >= PICK_LINE ? 0 : 1.2 + i * 0.6, ease }}
                            className={`rounded-full border px-3.5 py-1.5 text-[0.85rem] font-bold transition-colors duration-300 ${
                              picked ? "border-teal bg-teal text-white" : "border-teal/25 text-teal"
                            }`}
                          >
                            {s}
                          </motion.span>
                        );
                      })}
                    </motion.div>
                  )}
                  {showConfirm && (
                    <motion.div
                      key="confirm"
                      initial={{ opacity: 0, y: 12 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ duration: 0.45, ease }}
                      className={`flex items-center gap-3 rounded-2xl border px-4 py-3 transition-colors duration-500 ${
                        verified ? "border-mint/30 bg-mint-soft" : "border-line bg-canvas"
                      }`}
                    >
                      {verified ? (
                        <motion.span
                          initial={{ scale: 0 }}
                          animate={{ scale: 1 }}
                          transition={{ type: "spring", stiffness: 400, damping: 18 }}
                          className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-mint text-white"
                        >
                          <svg width="15" height="15" viewBox="0 0 24 24" fill="none" aria-hidden="true">
                            <path d="M6 12.5l4 4 8-9" stroke="currentColor" strokeWidth="2.6" strokeLinecap="round" strokeLinejoin="round" />
                          </svg>
                        </motion.span>
                      ) : (
                        <motion.span
                          className="h-8 w-8 shrink-0 rounded-full border-2 border-teal/25 border-t-teal"
                          animate={{ rotate: 360 }}
                          transition={{ duration: 0.8, repeat: Infinity, ease: "linear" }}
                        />
                      )}
                      <div className="text-[0.88rem]">
                        <p className="font-bold">{verified ? "Booked · Fri, Oct 18 at 10:00" : "Writing to the clinic schedule…"}</p>
                        <p className="text-ink-faint">{verified ? "Confirmed by EHR · Dr. Chen · Room 2" : "Checking provider, room and policy"}</p>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Controls */}
        <AnimatePresence>
          {phase !== "idle" && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: "auto" }}
              exit={{ opacity: 0, height: 0 }}
              className="overflow-hidden"
            >
              <div className="mt-4 flex items-center gap-3 border-t border-line pt-4">
                <div className="flex flex-1 gap-1" aria-hidden="true">
                  {LINES.map((l, i) => (
                    <span key={i} className="h-1.5 flex-1 overflow-hidden rounded-full bg-line-strong">
                      <motion.span
                        className={`block h-full origin-left rounded-full ${l.role === "assistant" ? "bg-teal" : "bg-ink/40"}`}
                        initial={false}
                        animate={{ scaleX: i < line || phase === "ended" ? 1 : i === line ? 1 : 0 }}
                        transition={{ duration: i === line && phase === "playing" ? 3 : 0.3, ease: "easeOut" }}
                      />
                    </span>
                  ))}
                </div>
                <IconButton label={muted ? "Unmute" : "Mute"} onClick={toggleMute}>
                  <SpeakerIcon off={muted} />
                </IconButton>
                {phase === "ended" ? (
                  <IconButton label="Replay" onClick={play} primary>
                    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" aria-hidden="true">
                      <path d="M4 12a8 8 0 1 0 2.4-5.7M4 4v4h4" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" />
                    </svg>
                  </IconButton>
                ) : (
                  <IconButton
                    label="Stop"
                    onClick={() => {
                      stop();
                      setPhase("idle");
                      setLine(-1);
                      setVerified(false);
                    }}
                  >
                    <svg width="13" height="13" viewBox="0 0 24 24" aria-hidden="true">
                      <rect x="5" y="5" width="14" height="14" rx="3" fill="currentColor" />
                    </svg>
                  </IconButton>
                )}
              </div>
              <p className="mt-2 text-[0.72rem] text-ink-faint">Demo call · AI-generated voices</p>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* SMS toast once the booking is confirmed */}
      <AnimatePresence>
        {verified && (
          <motion.div
            initial={{ opacity: 0, x: 30, y: 10, rotate: 4 }}
            animate={{ opacity: 1, x: 0, y: 0, rotate: 2 }}
            exit={{ opacity: 0, y: 10 }}
            transition={{ duration: 0.5, ease }}
            className="absolute -bottom-16 -right-3 z-10 w-[240px] rounded-2xl bg-ocean p-3.5 text-white shadow-2xl sm:-right-8"
          >
            <p className="text-[0.7rem] font-bold uppercase tracking-wider text-teal-light">SMS · just now</p>
            <p className="mt-1 text-[0.84rem] leading-snug text-white/90">
              You&apos;re booked with Dr. Chen, Fri 10:00 AM. Reply C to change.
            </p>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

// Big circular play button with expanding sound-wave rings
function PlayButton({ onClick }: { onClick: () => void }) {
  const reduce = useReducedMotion();
  return (
    <motion.button
      type="button"
      onClick={onClick}
      aria-label="Play the demo call with sound"
      whileHover={{ scale: 1.06 }}
      whileTap={{ scale: 0.95 }}
      className="relative flex h-24 w-24 cursor-pointer items-center justify-center rounded-full bg-gradient-to-br from-teal to-teal-bright text-white shadow-[0_20px_50px_-15px_rgba(14,116,144,0.8)]"
    >
      {!reduce &&
        [0, 1, 2].map((i) => (
          <motion.span
            key={i}
            aria-hidden="true"
            className="absolute inset-0 rounded-full border-2 border-teal-bright/60"
            animate={{ scale: [1, 1.9], opacity: [0.6, 0] }}
            transition={{ duration: 2.4, repeat: Infinity, delay: i * 0.8, ease: "easeOut" }}
          />
        ))}
      <svg width="34" height="34" viewBox="0 0 24 24" aria-hidden="true" className="ml-1">
        <path d="M8 5.5v13a1 1 0 0 0 1.5.86l10.4-6.5a1 1 0 0 0 0-1.72L9.5 4.64A1 1 0 0 0 8 5.5z" fill="currentColor" />
      </svg>
    </motion.button>
  );
}

// Reveals the caption word by word while the line is being spoken
function Caption({ text, live }: { text: string; live: boolean }) {
  if (!live) return <>{text}</>;
  return (
    <>
      {text.split(" ").map((w, i) => (
        <motion.span
          key={i}
          initial={{ opacity: 0, filter: "blur(4px)" }}
          animate={{ opacity: 1, filter: "blur(0px)" }}
          transition={{ duration: 0.3, delay: i * 0.2 }}
        >
          {w}{" "}
        </motion.span>
      ))}
    </>
  );
}

function IconButton({
  label,
  onClick,
  primary = false,
  children,
}: {
  label: string;
  onClick: () => void;
  primary?: boolean;
  children: React.ReactNode;
}) {
  return (
    <motion.button
      type="button"
      onClick={onClick}
      aria-label={label}
      title={label}
      whileTap={{ scale: 0.92 }}
      className={`flex h-10 w-10 shrink-0 cursor-pointer items-center justify-center rounded-full transition-colors ${
        primary ? "bg-teal text-white hover:bg-teal-hover" : "bg-canvas-soft text-ink hover:bg-line-strong"
      }`}
    >
      {children}
    </motion.button>
  );
}

function SpeakerIcon({ off = false }: { off?: boolean }) {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <path d="M4 9h4l5-4v14l-5-4H4z" stroke="currentColor" strokeWidth="1.9" strokeLinejoin="round" />
      {off ? (
        <path d="M17 9l4 6M21 9l-4 6" stroke="currentColor" strokeWidth="1.9" strokeLinecap="round" />
      ) : (
        <path d="M16.5 8.5a5 5 0 0 1 0 7M19 6a8.5 8.5 0 0 1 0 12" stroke="currentColor" strokeWidth="1.9" strokeLinecap="round" />
      )}
    </svg>
  );
}
