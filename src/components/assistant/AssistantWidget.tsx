"use client";

import { FormEvent, KeyboardEvent, useCallback, useEffect, useRef, useState } from "react";
import { AnimatePresence, motion } from "motion/react";
import { AGENT_DEMO, sendChatMessage, startVoiceSession } from "@/lib/agent/client";
import { DEMO_CLINIC } from "@/lib/agent/demo";
import type { BookingCard, ChatMessage, VoiceSession, VoiceState, VoiceTranscriptEntry } from "@/lib/agent/types";
import { site } from "@/config/site";
import { AssistantMode, OPEN_ASSISTANT_EVENT, OpenAssistantDetail } from "./events";
import VoiceOrb from "./VoiceOrb";

const ease = [0.22, 1, 0.36, 1] as const;

const GREETING: ChatMessage = {
  id: "greeting",
  role: "assistant",
  content: `Hi, I'm ${site.agent}, the front desk for ${DEMO_CLINIC}. I can book, move or cancel appointments — what can I do for you?`,
  quickReplies: ["Book a check-up next week", "Reschedule my appointment", "Do you have evening slots?"],
};

const VOICE_LABEL: Record<VoiceState, string> = {
  idle: "Tap to start a call",
  connecting: "Connecting…",
  listening: "Listening…",
  thinking: "Checking the schedule…",
  speaking: `${site.agent} is speaking…`,
};

let idCounter = 0;
const nextId = () => `m${++idCounter}`;

export default function AssistantWidget() {
  const [open, setOpen] = useState(false);
  const [mode, setMode] = useState<AssistantMode>("chat");
  const [pendingPrompt, setPendingPrompt] = useState<string | undefined>();

  // Other components open the widget via openAssistant(mode, prompt?)
  useEffect(() => {
    function onOpen(e: Event) {
      const { mode: m, prompt } = (e as CustomEvent<OpenAssistantDetail>).detail ?? {};
      setMode(m === "voice" ? "voice" : "chat");
      setPendingPrompt(prompt);
      setOpen(true);
    }
    window.addEventListener(OPEN_ASSISTANT_EVENT, onOpen);
    return () => window.removeEventListener(OPEN_ASSISTANT_EVENT, onOpen);
  }, []);

  useEffect(() => {
    if (!open) return;
    const onKey = (e: globalThis.KeyboardEvent) => e.key === "Escape" && setOpen(false);
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open]);

  return (
    <>
      <AnimatePresence>
        {open && (
          <motion.div
            key="panel"
            role="dialog"
            aria-label={`${site.agent} assistant`}
            data-lenis-prevent
            initial={{ opacity: 0, y: 16, scale: 0.96 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 12, scale: 0.97 }}
            transition={{ duration: 0.35, ease }}
            style={{ transformOrigin: "bottom right" }}
            className="fixed inset-x-3 bottom-[5.25rem] z-[90] flex h-[min(620px,calc(100dvh-7rem))] flex-col overflow-hidden rounded-3xl border border-line bg-surface shadow-[0_40px_80px_-30px_rgba(6,42,51,0.4)] sm:inset-x-auto sm:right-5 sm:w-[400px]"
          >
            <PanelHeader mode={mode} onModeChange={setMode} onClose={() => setOpen(false)} />
            <div className="relative min-h-0 flex-1">
              <AnimatePresence mode="wait" initial={false}>
                {mode === "chat" ? (
                  <motion.div
                    key="chat"
                    className="absolute inset-0 flex flex-col"
                    initial={{ opacity: 0, x: -12 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: -12 }}
                    transition={{ duration: 0.22 }}
                  >
                    <ChatView initialPrompt={pendingPrompt} onPromptUsed={() => setPendingPrompt(undefined)} />
                  </motion.div>
                ) : (
                  <motion.div
                    key="voice"
                    className="absolute inset-0 flex flex-col"
                    initial={{ opacity: 0, x: 12 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: 12 }}
                    transition={{ duration: 0.22 }}
                  >
                    <VoiceView />
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <Launcher open={open} onToggle={() => setOpen((v) => !v)} />
    </>
  );
}

// ── Launcher ─────────────────────────────────────────────────────────────────

function Launcher({ open, onToggle }: { open: boolean; onToggle: () => void }) {
  return (
    <motion.button
      type="button"
      onClick={onToggle}
      aria-label={open ? "Close assistant" : `Talk to ${site.agent}`}
      aria-expanded={open}
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 1.4, duration: 0.6, ease }}
      whileHover={{ y: -2 }}
      whileTap={{ scale: 0.96 }}
      className="fixed bottom-5 right-5 z-[90] flex h-[52px] cursor-pointer items-center gap-2.5 rounded-full bg-ocean pl-1.5 pr-5 text-[0.92rem] font-bold text-white shadow-[0_16px_40px_-12px_rgba(6,42,51,0.6)]"
    >
      <span className="relative flex h-10 w-10 items-center justify-center">
        <AnimatePresence mode="wait" initial={false}>
          {open ? (
            <motion.span
              key="x"
              initial={{ opacity: 0, rotate: -90 }}
              animate={{ opacity: 1, rotate: 0 }}
              exit={{ opacity: 0, rotate: 90 }}
              transition={{ duration: 0.2 }}
              className="flex h-10 w-10 items-center justify-center rounded-full bg-white/10"
            >
              <CloseIcon />
            </motion.span>
          ) : (
            <motion.span key="orb" initial={{ opacity: 0, scale: 0.6 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.6 }}>
              <VoiceOrb state="idle" size={38} />
            </motion.span>
          )}
        </AnimatePresence>
      </span>
      {open ? "Close" : `Talk to ${site.agent}`}
    </motion.button>
  );
}

// ── Header ───────────────────────────────────────────────────────────────────

function PanelHeader({
  mode,
  onModeChange,
  onClose,
}: {
  mode: AssistantMode;
  onModeChange: (m: AssistantMode) => void;
  onClose: () => void;
}) {
  return (
    <div className="border-b border-line bg-canvas/60 px-4 pb-3 pt-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <VoiceOrb state="idle" size={34} />
          <div>
            <p className="flex items-center gap-2 text-[0.95rem] font-bold">
              {site.agent}
              {AGENT_DEMO && (
                <span className="rounded-full bg-teal-soft px-2 py-px text-[0.66rem] font-bold uppercase tracking-wider text-teal">
                  Demo
                </span>
              )}
            </p>
            <p className="flex items-center gap-1.5 text-[0.78rem] text-ink-faint">
              <span className="h-1.5 w-1.5 rounded-full bg-mint" /> {DEMO_CLINIC}
            </p>
          </div>
        </div>
        <button
          type="button"
          onClick={onClose}
          aria-label="Close assistant"
          className="flex h-11 w-11 cursor-pointer items-center justify-center rounded-full text-ink-faint transition-colors hover:bg-canvas-soft hover:text-ink"
        >
          <CloseIcon />
        </button>
      </div>

      <div role="tablist" aria-label="Assistant mode" className="mt-3 grid grid-cols-2 gap-1 rounded-full bg-canvas-soft p-1">
        {(["chat", "voice"] as const).map((m) => (
          <button
            key={m}
            type="button"
            role="tab"
            aria-selected={mode === m}
            onClick={() => onModeChange(m)}
            className={`relative flex h-10 cursor-pointer items-center justify-center gap-1.5 rounded-full text-[0.86rem] font-bold transition-colors ${
              mode === m ? "text-ink" : "text-ink-faint hover:text-ink-muted"
            }`}
          >
            {mode === m && (
              <motion.span
                layoutId="assistant-tab"
                className="absolute inset-0 rounded-full bg-surface shadow-sm ring-1 ring-line"
                transition={{ type: "spring", stiffness: 420, damping: 34 }}
              />
            )}
            <span className="relative">{m === "chat" ? <ChatIcon /> : <MicIcon />}</span>
            <span className="relative">{m === "chat" ? "Chat" : "Voice call"}</span>
          </button>
        ))}
      </div>
    </div>
  );
}

// ── Chat ─────────────────────────────────────────────────────────────────────

function ChatView({ initialPrompt, onPromptUsed }: { initialPrompt?: string; onPromptUsed: () => void }) {
  const [messages, setMessages] = useState<ChatMessage[]>([GREETING]);
  const [input, setInput] = useState("");
  const [pending, setPending] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: "smooth" });
  }, [messages, pending]);

  const send = useCallback(
    async (text: string) => {
      const content = text.trim();
      if (!content || pending) return;
      const next = [...messages, { id: nextId(), role: "user" as const, content }];
      setMessages(next);
      setInput("");
      setPending(true);
      try {
        const reply = await sendChatMessage(next);
        setMessages((prev) => [...prev, { id: nextId(), role: "assistant", ...reply }]);
      } catch {
        setMessages((prev) => [
          ...prev,
          { id: nextId(), role: "assistant", content: "Sorry — I couldn't reach the scheduling system. Please try again in a moment." },
        ]);
      } finally {
        setPending(false);
      }
    },
    [messages, pending]
  );

  // A CTA elsewhere on the page can open chat with a first message
  useEffect(() => {
    if (initialPrompt) {
      send(initialPrompt);
      onPromptUsed();
    } else {
      inputRef.current?.focus();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const last = messages[messages.length - 1];

  return (
    <>
      <div ref={scrollRef} className="flex-1 space-y-4 overflow-y-auto px-4 py-5" aria-live="polite">
        <AnimatePresence initial={false}>
          {messages.map((m) => (
            <motion.div
              key={m.id}
              layout="position"
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3, ease }}
              className={m.role === "user" ? "flex justify-end" : "flex flex-col items-start gap-2"}
            >
              <p
                className={`max-w-[86%] whitespace-pre-wrap rounded-2xl px-3.5 py-2.5 text-[0.93rem] leading-relaxed ${
                  m.role === "user" ? "rounded-br-md bg-teal text-white" : "rounded-bl-md bg-canvas-soft text-ink"
                }`}
              >
                {m.content}
              </p>
              {m.booking && <BookingConfirmation booking={m.booking} />}
            </motion.div>
          ))}
          {pending && (
            <motion.div key="typing" initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} aria-label={`${site.agent} is typing`}>
              <span className="inline-flex gap-1 rounded-2xl rounded-bl-md bg-canvas-soft px-4 py-3.5">
                {[0, 1, 2].map((i) => (
                  <motion.span
                    key={i}
                    className="h-1.5 w-1.5 rounded-full bg-ink-faint"
                    animate={{ opacity: [0.3, 1, 0.3], y: [0, -2, 0] }}
                    transition={{ duration: 1, repeat: Infinity, delay: i * 0.15 }}
                  />
                ))}
              </span>
            </motion.div>
          )}
        </AnimatePresence>

        {last?.role === "assistant" && last.quickReplies && !pending && (
          <motion.div key={last.id + "-qr"} initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.2 }} className="flex flex-wrap gap-2">
            {last.quickReplies.map((q) => (
              <button
                key={q}
                type="button"
                onClick={() => send(q)}
                className="min-h-[40px] cursor-pointer rounded-full border border-teal/25 bg-surface px-3.5 py-1.5 text-[0.84rem] font-bold text-teal transition-colors hover:bg-teal hover:text-white"
              >
                {q}
              </button>
            ))}
          </motion.div>
        )}
      </div>

      <form
        onSubmit={(e: FormEvent) => {
          e.preventDefault();
          send(input);
        }}
        className="border-t border-line p-3"
      >
        <div className="flex items-end gap-2 rounded-2xl border border-line-strong bg-canvas px-3 py-2 transition-colors focus-within:border-teal">
          <label htmlFor="assistant-input" className="sr-only">
            Message
          </label>
          <textarea
            id="assistant-input"
            ref={inputRef}
            rows={1}
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e: KeyboardEvent<HTMLTextAreaElement>) => {
              if (e.key === "Enter" && !e.shiftKey) {
                e.preventDefault();
                send(input);
              }
            }}
            placeholder="Type a message…"
            className="max-h-28 flex-1 resize-none bg-transparent py-1.5 text-[0.95rem] placeholder:text-ink-faint focus:outline-none focus-visible:outline-none"
          />
          <motion.button
            type="submit"
            aria-label="Send message"
            disabled={!input.trim() || pending}
            whileTap={{ scale: 0.92 }}
            className="flex h-9 w-9 shrink-0 cursor-pointer items-center justify-center rounded-full bg-teal text-white transition-opacity disabled:cursor-not-allowed disabled:opacity-30"
          >
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" aria-hidden="true">
              <path d="M12 19V5M5 12l7-7 7 7" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </motion.button>
        </div>
        <p className="mt-2 text-center text-[0.72rem] text-ink-faint">
          Not for emergencies. {site.agent} doesn&apos;t give medical advice.
        </p>
      </form>
    </>
  );
}

function BookingConfirmation({ booking }: { booking: BookingCard }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 10, scale: 0.97 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      transition={{ duration: 0.45, delay: 0.1, ease }}
      className="w-[86%] overflow-hidden rounded-2xl border border-mint/25 bg-surface shadow-sm"
    >
      <div className="flex items-center gap-2 bg-mint-soft px-3.5 py-2 text-[0.8rem] font-bold text-mint">
        <CheckIcon />
        {booking.verified ? "Booked · confirmed by clinic system" : "Pending confirmation"}
      </div>
      <dl className="space-y-1 px-3.5 py-3 text-[0.86rem]">
        <div className="font-bold">{booking.when}</div>
        <div className="text-ink-muted">
          {booking.service} with {booking.provider}
        </div>
        <div className="text-ink-faint">{booking.location}</div>
      </dl>
    </motion.div>
  );
}

// ── Voice ────────────────────────────────────────────────────────────────────

function VoiceView() {
  const [state, setState] = useState<VoiceState>("idle");
  const [muted, setMuted] = useState(false);
  const [transcript, setTranscript] = useState<VoiceTranscriptEntry[]>([]);
  const [error, setError] = useState<string | null>(null);
  const sessionRef = useRef<VoiceSession | null>(null);
  const scrollRef = useRef<HTMLDivElement>(null);
  const active = state !== "idle";

  useEffect(() => () => sessionRef.current?.stop(), []);
  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: "smooth" });
  }, [transcript]);

  function start() {
    setTranscript([]);
    setMuted(false);
    setError(null);
    sessionRef.current = startVoiceSession({
      onStateChange: setState,
      onTranscript: (entry) => setTranscript((prev) => [...prev, entry]),
      onError: setError,
    });
  }

  function stop() {
    sessionRef.current?.stop();
    sessionRef.current = null;
  }

  return (
    <div className="flex flex-1 flex-col items-center px-5 pb-5 pt-6">
      <button
        type="button"
        onClick={active ? undefined : start}
        aria-label={active ? "Call in progress" : "Start voice call"}
        tabIndex={active ? -1 : 0}
        className={active ? "cursor-default" : "cursor-pointer"}
      >
        <VoiceOrb state={state} size={136} />
      </button>

      <AnimatePresence mode="wait">
        <motion.p
          key={state}
          role="status"
          initial={{ opacity: 0, y: 4 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -4 }}
          transition={{ duration: 0.2 }}
          className="mt-6 text-[0.98rem] font-bold"
        >
          {VOICE_LABEL[state]}
        </motion.p>
      </AnimatePresence>
      {error && <p className="mt-1 text-[0.82rem] text-amber">{error}</p>}

      {/* Live transcript */}
      <div ref={scrollRef} className="mt-4 min-h-0 w-full flex-1 space-y-2 overflow-y-auto">
        {transcript.length === 0 && !active && (
          <p className="px-4 text-center text-[0.86rem] leading-relaxed text-ink-faint">
            Try a short demo call: {site.agent} will help a patient move an appointment, live.
          </p>
        )}
        <AnimatePresence initial={false}>
          {transcript.map((t, i) => (
            <motion.p
              key={i}
              initial={{ opacity: 0, y: 6 }}
              animate={{ opacity: 1, y: 0 }}
              className={`rounded-xl px-3 py-2 text-[0.85rem] leading-relaxed ${
                t.role === "assistant" ? "bg-canvas-soft text-ink" : "ml-8 bg-teal-soft text-ink"
              }`}
            >
              <span className="mr-1.5 text-[0.7rem] font-bold uppercase tracking-wider text-ink-faint">
                {t.role === "assistant" ? site.agent : "Patient"}
              </span>
              {t.text}
            </motion.p>
          ))}
        </AnimatePresence>
      </div>

      <div className="mt-4 flex items-center gap-3">
        <AnimatePresence>
          {active && (
            <motion.button
              type="button"
              onClick={() => {
                setMuted(!muted);
                sessionRef.current?.setMuted(!muted);
              }}
              aria-pressed={muted}
              aria-label={muted ? "Unmute microphone" : "Mute microphone"}
              initial={{ opacity: 0, scale: 0.8, width: 0 }}
              animate={{ opacity: 1, scale: 1, width: 48 }}
              exit={{ opacity: 0, scale: 0.8, width: 0 }}
              className={`flex h-12 cursor-pointer items-center justify-center rounded-full border transition-colors ${
                muted ? "border-ink bg-ink text-white" : "border-line-strong text-ink hover:bg-canvas-soft"
              }`}
            >
              <MicIcon off={muted} />
            </motion.button>
          )}
        </AnimatePresence>
        <motion.button
          type="button"
          layout
          onClick={active ? stop : start}
          whileTap={{ scale: 0.96 }}
          className={`flex h-12 cursor-pointer items-center gap-2 rounded-full px-6 text-[0.95rem] font-bold text-white transition-colors ${
            active ? "bg-rose hover:bg-[#9F1239]" : "bg-teal hover:bg-teal-hover"
          }`}
        >
          {active ? (
            <>
              <PhoneIcon /> End call
            </>
          ) : (
            <>
              <MicIcon /> Start call
            </>
          )}
        </motion.button>
      </div>
    </div>
  );
}

// ── Icons ────────────────────────────────────────────────────────────────────

function CloseIcon() {
  return (
    <svg width="12" height="12" viewBox="0 0 18 18" fill="none" aria-hidden="true">
      <path d="M1 1L17 17M17 1L1 17" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
    </svg>
  );
}

function CheckIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <circle cx="12" cy="12" r="10" fill="currentColor" opacity="0.15" />
      <path d="M7.5 12.5l3 3 6-6.5" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

function ChatIcon() {
  return (
    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <path d="M4 5h16v11H8l-4 4V5z" stroke="currentColor" strokeWidth="1.9" strokeLinejoin="round" />
    </svg>
  );
}

export function MicIcon({ off = false }: { off?: boolean }) {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <rect x="9" y="3" width="6" height="12" rx="3" stroke="currentColor" strokeWidth="1.9" />
      <path d="M5 11a7 7 0 0 0 14 0M12 18v3" stroke="currentColor" strokeWidth="1.9" strokeLinecap="round" />
      {off && <path d="M4 4l16 16" stroke="currentColor" strokeWidth="1.9" strokeLinecap="round" />}
    </svg>
  );
}

function PhoneIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" aria-hidden="true" className="rotate-[135deg]">
      <path
        d="M5 4h4l2 5-2.5 1.5a11 11 0 0 0 5 5L15 13l5 2v4a2 2 0 0 1-2 2A16 16 0 0 1 3 6a2 2 0 0 1 2-2z"
        stroke="currentColor"
        strokeWidth="1.9"
        strokeLinejoin="round"
      />
    </svg>
  );
}
