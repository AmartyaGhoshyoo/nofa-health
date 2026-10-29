"use client";

import { FormEvent, KeyboardEvent, ReactNode, useCallback, useEffect, useRef, useState } from "react";
import { AnimatePresence, motion } from "motion/react";
import { usePathname } from "next/navigation";
import {
  AGENT_DEMO,
  fetchBookingState,
  getChatChannel,
  sendBookingAction,
  sendChatMessage,
  startVoiceSession,
} from "@/lib/agent/client";
import { DEMO_CLINIC } from "@/lib/agent/demo";
import type {
  AgentReply,
  Appointment,
  BookingAction,
  BookingCard,
  BookingChannel,
  BookingState,
  CallEndReason,
  DoctorOption,
  ChatMessage,
  VoiceSession,
  VoiceState,
  VoiceTranscriptEntry,
} from "@/lib/agent/types";
import { site } from "@/config/site";
import { AssistantMode, OPEN_ASSISTANT_EVENT, OpenAssistantDetail } from "./events";
import VoiceOrb from "./VoiceOrb";

const ease = [0.22, 1, 0.36, 1] as const;

const GREETING: ChatMessage = {
  id: "greeting",
  role: "assistant",
  content: `Hi, I'm ${site.agent}, the front desk for ${DEMO_CLINIC}. Tell me what you need, and I'll find the right doctor and a time that suits you. I can also move or cancel a booking.`,
  quickReplies: ["I need to see a doctor", "What services do you offer?", "Change or cancel my booking"],
};

const VOICE_LABEL: Record<VoiceState, string> = {
  idle: "Tap to start a call",
  connecting: "Connecting…",
  listening: "Listening…",
  thinking: "Checking the schedule…",
  speaking: `${site.agent} is speaking…`,
};

const CALL_ENDED_LABEL: Record<CallEndReason, string> = {
  silence: "Call ended: no response.",
  off_topic: `Call ended: ${site.agent} can only help with appointments.`,
  done: "Call ended. Thanks for calling!",
  misuse: "Call ended: too many changes in one call.",
  no_audio: "Call ended: we couldn't hear you. Check your microphone and connection.",
  noise: "Call ended: no request heard.",
  remote: "Call ended.",
};

let idCounter = 0;
const nextId = () => `m${++idCounter}`;

export default function AssistantWidget() {
  // The patient assistant doesn't belong on the staff portal.
  const onStaffPortal = usePathname()?.startsWith("/staff");
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

  if (onStaffPortal) return null;

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
            className="fixed inset-x-3 bottom-[5.25rem] z-[90] flex h-[min(620px,calc(100dvh-7rem))] flex-col overflow-hidden rounded-3xl border border-line bg-surface shadow-[0_40px_80px_-30px_rgba(6,42,51,0.4)] sm:inset-x-auto sm:right-5 sm:w-[400px] font-widget"
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
      className="fixed bottom-5 right-5 z-[90] flex font-widget h-[52px] cursor-pointer items-center gap-2.5 rounded-full bg-ocean pl-1.5 pr-5 text-[0.92rem] font-bold text-white shadow-[0_16px_40px_-12px_rgba(6,42,51,0.6)]"
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
    <div className="border-b border-line bg-gradient-to-b from-canvas-soft to-surface px-4 pb-3 pt-4">
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

/** Keeps a scroll container pinned to the bottom as content grows, unless the user scrolled up. */
function useStickToBottom<T>(dep: T) {
  const ref = useRef<HTMLDivElement>(null);
  const pinned = useRef(true);
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const onScroll = () => {
      pinned.current = el.scrollHeight - el.scrollTop - el.clientHeight < 80;
    };
    el.addEventListener("scroll", onScroll, { passive: true });
    return () => el.removeEventListener("scroll", onScroll);
  }, []);
  useEffect(() => {
    const el = ref.current;
    if (el && pinned.current) requestAnimationFrame(() => el.scrollTo({ top: el.scrollHeight }));
  }, [dep]);
  return ref;
}

function ChatView({ initialPrompt, onPromptUsed }: { initialPrompt?: string; onPromptUsed: () => void }) {
  const [messages, setMessages] = useState<ChatMessage[]>([GREETING]);
  const [input, setInput] = useState("");
  const [pending, setPending] = useState(false);
  const [streamingId, setStreamingId] = useState<string | null>(null);
  const [booking, setBooking] = useState<BookingState | null>(null);
  const scrollRef = useStickToBottom([messages, pending, booking]);
  const inputRef = useRef<HTMLTextAreaElement>(null);
  const busy = pending || streamingId !== null;

  const send = useCallback(
    async (text: string) => {
      const content = text.trim();
      if (!content || busy) return;
      const next = [...messages, { id: nextId(), role: "user" as const, content }];
      setMessages(next);
      setInput("");
      setPending(true);
      try {
        const reply = await sendChatMessage(next);
        setPending(false);
        await streamReply(reply);
        if (!AGENT_DEMO) setBooking(await fetchBookingState(getChatChannel()));
      } catch {
        setMessages((prev) => [
          ...prev,
          { id: nextId(), role: "assistant", content: "Sorry — I couldn't reach the scheduling system. Please try again in a moment." },
        ]);
      } finally {
        setPending(false);
      }
    },
    [messages, busy]
  );

  // ZOVAK returns the whole reply at once, so reveal it word by word. The
  // booking card and quick replies appear once the text has finished.
  async function streamReply(reply: AgentReply) {
    const id = nextId();
    const words = reply.content.split(/(\s+)/);
    setStreamingId(id);
    setMessages((prev) => [...prev, { id, role: "assistant", content: "" }]);
    const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const step = reduced ? words.length : 2;
    for (let i = step; i < words.length + step; i += step) {
      const content = words.slice(0, i).join("");
      setMessages((prev) => prev.map((m) => (m.id === id ? { ...m, content } : m)));
      if (!reduced) await new Promise((r) => setTimeout(r, 28));
    }
    setMessages((prev) => prev.map((m) => (m.id === id ? { id, role: "assistant", ...reply } : m)));
    setStreamingId(null);
  }

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
      <div ref={scrollRef} data-lenis-prevent className="min-h-0 flex-1 space-y-3.5 overflow-y-auto bg-canvas/50 px-4 py-5" aria-live="polite">
        <AnimatePresence initial={false}>
          {messages.map((m) => (
            <motion.div
              key={m.id}
              layout="position"
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3, ease }}
              className={m.role === "user" ? "flex justify-end" : "flex items-end gap-2"}
            >
              {m.role === "assistant" && (
                <span className="mb-0.5 shrink-0" aria-hidden="true">
                  <VoiceOrb state="idle" size={24} />
                </span>
              )}
              <div className={m.role === "user" ? "contents" : "flex min-w-0 flex-col items-start gap-2"}>
                <p
                  className={`max-w-[86%] whitespace-pre-wrap rounded-[1.15rem] px-3.5 py-2.5 text-[0.94rem] leading-relaxed shadow-[0_1px_2px_rgba(15,43,51,0.06)] ${
                    m.role === "user"
                      ? "rounded-br-md bg-gradient-to-br from-teal to-teal-bright text-white"
                      : "rounded-bl-md border border-line bg-surface text-ink"
                  }`}
                >
                  {m.content}
                </p>
                {m.booking && <BookingConfirmation booking={m.booking} />}
              </div>
            </motion.div>
          ))}
          {pending && (
            <motion.div key="typing" initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} aria-label={`${site.agent} is typing`}>
              <span className="ml-8 inline-flex gap-1 rounded-[1.15rem] rounded-bl-md border border-line bg-surface px-4 py-3.5">
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

        {booking && !busy && (
          <BookingPanel
            state={booking}
            channel={getChatChannel()}
            onChange={setBooking}
            onChooseDoctor={(d) => send(`I'd like to book with ${d.name} (${d.specialty}).`)}
          />
        )}

        {last?.role === "assistant" && last.quickReplies && !busy && (
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
        <div className="flex items-end gap-2 rounded-3xl border border-line-strong bg-surface py-1.5 pl-4 pr-1.5 shadow-[0_1px_2px_rgba(15,43,51,0.05)] transition-colors focus-within:border-teal focus-within:ring-4 focus-within:ring-teal/10">
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

// ── Live booking card (chat + voice) ────────────────────────────────────────
// Driven by ZOVAK's trusted state. Every button is an explicit tap that ZOVAK
// re-checks; typing an email never books, and nothing moves or cancels until
// the customer confirms it here (or says so clearly on a call).

const whenFormat = new Intl.DateTimeFormat("en-US", {
  timeZone: "Asia/Dhaka",
  weekday: "short",
  month: "short",
  day: "numeric",
  hour: "numeric",
  minute: "2-digit",
});
const timeFormat = new Intl.DateTimeFormat("en-US", { timeZone: "Asia/Dhaka", hour: "numeric", minute: "2-digit" });
const formatWhen = (iso: string) => whenFormat.format(new Date(iso));

function BookingPanel({
  state,
  channel,
  onChange,
  onChooseDoctor,
}: {
  state: BookingState;
  channel: BookingChannel;
  onChange: (state: BookingState) => void;
  /** Chat: tapping a doctor card sends a message. Voice: the patient says the name. */
  onChooseDoctor?: (doctor: DoctorOption) => void;
}) {
  const [busy, setBusy] = useState<BookingAction | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function act(action: BookingAction, id: string, email?: string): Promise<string | null> {
    setBusy(action);
    setError(null);
    const err = await sendBookingAction(channel, action, id, email);
    const next = await fetchBookingState(channel);
    if (next) onChange(next);
    setBusy(null);
    if (err && action !== "email") setError(err);
    return err;
  }

  const { stage, proposal, booking, change, cancelled, chosenDoctor } = state;
  // Choosing a doctor: the cards, then a "selected" card once one is picked. Shown under
  // a booked/cancelled card (e.g. a second appointment) so neither hides the other.
  const choosing = stage === "idle" || stage === "booked" || stage === "cancelled";
  const doctorStep = !choosing ? null : state.doctorOptions.length > 0 ? (
    <DoctorCards doctors={state.doctorOptions} onChoose={onChooseDoctor} />
  ) : chosenDoctor ? (
    <ChosenDoctor doctor={chosenDoctor} voice={!onChooseDoctor} />
  ) : null;
  if (stage === "idle") return doctorStep;

  return (
    <motion.div
      key={stage}
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3, ease }}
      className="w-full shrink-0"
    >
      {stage === "email_required" && proposal && state.emailRequestId && (
        <EmailBox key={state.emailRequestId} onSubmit={(email) => act("email", state.emailRequestId!, email)} />
      )}

      {stage === "ready_to_confirm" && proposal && (
        <CardShell tone="teal" title="Review your appointment">
          <AppointmentLines appointment={proposal} showEmail />
          <div className="mt-3 flex items-center gap-3">
            <CardButton tone="teal" busy={busy === "confirm-booking"} onClick={() => act("confirm-booking", proposal.id)}>
              Confirm booking
            </CardButton>
            <button
              type="button"
              disabled={busy !== null}
              onClick={() => act("reopen-email", proposal.id)}
              className="cursor-pointer text-[0.8rem] font-bold text-teal underline-offset-2 hover:underline disabled:opacity-40"
            >
              Change email
            </button>
          </div>
        </CardShell>
      )}

      {stage === "booked" && booking && (
        <CardShell tone="mint" title="Booked · confirmed by calendar" icon>
          <AppointmentLines appointment={booking} />
          <p className="mt-2 text-[0.76rem] text-ink-faint">Need a different time or to cancel? Just ask {site.agent}.</p>
        </CardShell>
      )}

      {stage === "move_pending" && booking && change?.newStart && (
        <CardShell tone="amber" title="Move this appointment?">
          <p className="font-bold">
            <span className="text-ink-faint line-through">{formatWhen(booking.start)}</span>
            <span className="mx-1.5" aria-hidden="true">→</span>
            <span className="sr-only">to</span>
            {formatWhen(change.newStart)}
            {change.newEnd && ` – ${timeFormat.format(new Date(change.newEnd))}`}
          </p>
          <p className="text-ink-muted">
            {booking.serviceName} · {booking.customerName}
          </p>
          <div className="mt-3 flex flex-wrap gap-2">
            <CardButton tone="teal" busy={busy === "confirm-change"} onClick={() => act("confirm-change", change.id)}>
              Confirm move
            </CardButton>
            <CardButton tone="plain" busy={busy === "keep"} onClick={() => act("keep", change.id)}>
              Keep current time
            </CardButton>
          </div>
        </CardShell>
      )}

      {stage === "cancel_pending" && booking && change && (
        <CardShell tone="rose" title="Cancel this appointment?">
          <AppointmentLines appointment={booking} />
          <div className="mt-3 flex flex-wrap gap-2">
            <CardButton tone="rose" busy={busy === "confirm-change"} onClick={() => act("confirm-change", change.id)}>
              Cancel appointment
            </CardButton>
            <CardButton tone="plain" busy={busy === "keep"} onClick={() => act("keep", change.id)}>
              Keep it
            </CardButton>
          </div>
        </CardShell>
      )}

      {stage === "cancelled" && cancelled && (
        <CardShell tone="plain" title="Appointment cancelled">
          <div className="text-ink-faint line-through">
            <AppointmentLines appointment={cancelled} />
          </div>
        </CardShell>
      )}

      {error && (
        <p className="mt-1.5 text-[0.78rem] text-amber" role="alert">
          {error}
        </p>
      )}

      {doctorStep && <div className="mt-3">{doctorStep}</div>}
    </motion.div>
  );
}

const TONES = {
  teal: { head: "bg-teal-soft text-teal", border: "border-teal/25", button: "bg-teal text-white hover:bg-teal-hover" },
  mint: { head: "bg-mint-soft text-mint", border: "border-mint/25", button: "bg-mint text-white" },
  amber: { head: "bg-amber-soft text-amber", border: "border-amber/25", button: "bg-amber text-white" },
  rose: { head: "bg-rose-soft text-rose", border: "border-rose/25", button: "bg-rose text-white hover:opacity-90" },
  plain: {
    head: "bg-canvas-soft text-ink-muted",
    border: "border-line-strong",
    button: "border border-line-strong bg-surface text-ink hover:bg-canvas-soft",
  },
} as const;

function CardShell({
  tone,
  title,
  icon = false,
  children,
}: {
  tone: keyof typeof TONES;
  title: string;
  icon?: boolean;
  children: ReactNode;
}) {
  return (
    <div className={`overflow-hidden rounded-2xl border bg-surface shadow-sm ${TONES[tone].border}`}>
      <div className={`flex items-center gap-2 px-3.5 py-2 text-[0.8rem] font-bold ${TONES[tone].head}`}>
        {icon && <CheckIcon />}
        {title}
      </div>
      <div className="space-y-0.5 px-3.5 py-3 text-[0.86rem]">{children}</div>
    </div>
  );
}

function CardButton({
  tone,
  busy,
  onClick,
  children,
}: {
  tone: keyof typeof TONES;
  busy: boolean;
  onClick: () => void;
  children: ReactNode;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={busy}
      className={`min-h-[40px] cursor-pointer rounded-xl px-3.5 text-[0.86rem] font-bold transition-colors disabled:cursor-wait disabled:opacity-60 ${TONES[tone].button}`}
    >
      {busy ? "Working…" : children}
    </button>
  );
}

function AppointmentLines({ appointment, showEmail = false }: { appointment: Appointment; showEmail?: boolean }) {
  return (
    <>
      <div className="font-bold">
        {formatWhen(appointment.start)} – {timeFormat.format(new Date(appointment.end))}
      </div>
      <div className="text-ink-muted">
        {appointment.serviceName}
        {appointment.doctorName && ` with ${appointment.doctorName}`} · {appointment.customerName}
      </div>
      {showEmail && appointment.customerEmail && <div className="text-ink-faint">{appointment.customerEmail}</div>}
      <div className="text-[0.76rem] text-ink-faint">Dhaka time</div>
    </>
  );
}

// The doctors Nofa suggested for the patient's need, with their next free time.
function DoctorCards({ doctors, onChoose }: { doctors: DoctorOption[]; onChoose?: (d: DoctorOption) => void }) {
  // On a call (no Choose button) a slim list that scrolls inside itself, so the
  // live transcript below always keeps its room.
  if (!onChoose) {
    return (
      <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.3, ease }} className="w-full shrink-0">
        <p className="px-1 pb-1.5 text-[0.74rem] font-bold uppercase tracking-wider text-ink-faint">
          Say the name of the doctor you&apos;d like
        </p>
        <ul data-lenis-prevent className="max-h-[9.5rem] divide-y divide-line overflow-y-auto rounded-2xl border border-line bg-surface shadow-sm">
          {doctors.map((d) => (
            <li key={d.id} className="flex items-center gap-2.5 px-3 py-2">
              <span
                aria-hidden="true"
                className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-teal-soft text-[0.75rem] font-bold text-teal"
              >
                {d.name.replace("Dr. ", "").split(" ").map((w) => w[0]).join("").slice(0, 2)}
              </span>
              <div className="min-w-0 flex-1">
                <p className="truncate text-[0.86rem] font-bold">
                  {d.name} <span className="font-normal text-ink-muted">· {d.specialty}</span>
                </p>
                <p className="truncate text-[0.74rem] text-ink-faint">
                  {d.nextFree ? `Next free: ${formatWhen(d.nextFree)}` : `Hours ${d.hours}`}
                </p>
              </div>
            </li>
          ))}
        </ul>
      </motion.div>
    );
  }
  return (
    <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.3, ease }} className="w-full shrink-0 space-y-2">
      <p className="px-1 text-[0.74rem] font-bold uppercase tracking-wider text-ink-faint">
        Choose a doctor
      </p>
      {doctors.map((d) => (
        <div key={d.id} className="flex items-center gap-3 rounded-2xl border border-line bg-surface p-3 shadow-sm">
          <span
            aria-hidden="true"
            className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-teal-soft text-[0.95rem] font-bold text-teal"
          >
            {d.name.replace("Dr. ", "").split(" ").map((w) => w[0]).join("").slice(0, 2)}
          </span>
          <div className="min-w-0 flex-1">
            <p className="truncate text-[0.92rem] font-bold">{d.name}</p>
            <p className="truncate text-[0.8rem] text-ink-muted">
              {d.specialty} · {d.services.join(", ")}
            </p>
            <p className="text-[0.76rem] text-ink-faint">
              {d.nextFree ? `Next free: ${formatWhen(d.nextFree)}` : `Hours ${d.hours}`}
            </p>
          </div>
          <button
            type="button"
            onClick={() => onChoose(d)}
            className="min-h-[36px] shrink-0 cursor-pointer rounded-xl bg-teal px-3 text-[0.82rem] font-bold text-white hover:bg-teal-hover"
          >
            Choose
          </button>
        </div>
      ))}
    </motion.div>
  );
}

// After a pick the list collapses to the chosen doctor, so it's clear what happens next.
function ChosenDoctor({ doctor, voice }: { doctor: Omit<DoctorOption, "nextFree">; voice: boolean }) {
  return (
    <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.3, ease }} className="w-full shrink-0">
      <CardShell tone="teal" title="Doctor selected" icon>
        <p className="font-bold">{doctor.name}</p>
        <p className="text-ink-muted">
          {doctor.specialty} · {doctor.services.join(", ")}
        </p>
        <p className="text-ink-faint">Hours {doctor.hours} (Dhaka time)</p>
        <p className="mt-2 text-[0.76rem] text-ink-faint">
          Next: tell {site.agent} the day and time you'd like. Want someone else? Just {voice ? "say so" : "ask"}.
        </p>
      </CardShell>
    </motion.div>
  );
}

// Typing the email (instead of spelling it aloud) is accurate, and it never
// books on its own: the details are shown for a separate confirmation.
function EmailBox({ onSubmit }: { onSubmit: (email: string) => Promise<string | null> }) {
  const [email, setEmail] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function submit(e: FormEvent) {
    e.preventDefault();
    const value = email.trim();
    if (!value || busy) return;
    setBusy(true);
    setError(null);
    const err = await onSubmit(value);
    setBusy(false);
    if (err) setError(err);
  }

  return (
    <form onSubmit={submit} className="rounded-2xl border border-teal/30 bg-teal-soft p-3">
      <label htmlFor="booking-email" className="block text-[0.84rem] font-bold text-ink">
        Enter your email for the calendar invite
      </label>
      <div className="mt-2 flex gap-2">
        <input
          id="booking-email"
          type="email"
          inputMode="email"
          autoComplete="email"
          autoCapitalize="none"
          spellCheck={false}
          autoFocus
          required
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="you@example.com"
          disabled={busy}
          className="min-w-0 flex-1 rounded-xl border border-line-strong bg-surface px-3 py-2 text-[0.92rem] placeholder:text-ink-faint focus:border-teal focus:outline-none"
        />
        <button
          type="submit"
          disabled={!email.trim() || busy}
          className="shrink-0 cursor-pointer rounded-xl bg-teal px-3.5 text-[0.86rem] font-bold text-white transition-opacity disabled:cursor-not-allowed disabled:opacity-40"
        >
          {busy ? "Saving…" : "Confirm email"}
        </button>
      </div>
      {error ? (
        <p className="mt-1.5 text-[0.78rem] text-amber" role="alert">
          {error}
        </p>
      ) : (
        <p className="mt-1.5 text-[0.74rem] text-ink-faint">This doesn&apos;t book anything yet — you&apos;ll review the details first.</p>
      )}
    </form>
  );
}

// Counts up from when the call connects; keeps the final value after it ends.
function useCallTimer(state: VoiceState): number {
  const [startedAt, setStartedAt] = useState<number | null>(null);
  const [elapsed, setElapsed] = useState(0);
  const live = state === "listening" || state === "thinking" || state === "speaking";

  useEffect(() => {
    if (state === "connecting") {
      setStartedAt(null);
      setElapsed(0);
    } else if (live && startedAt === null) {
      setStartedAt(Date.now());
    } else if (state === "idle") {
      setStartedAt(null);
    }
  }, [state, live, startedAt]);

  useEffect(() => {
    if (startedAt === null) return;
    const tick = () => setElapsed(Math.floor((Date.now() - startedAt) / 1000));
    tick();
    const id = setInterval(tick, 1000);
    return () => clearInterval(id);
  }, [startedAt]);

  return elapsed;
}

const formatDuration = (s: number) => `${Math.floor(s / 60)}:${String(s % 60).padStart(2, "0")}`;

function CallTimer({ seconds, live }: { seconds: number; live: boolean }) {
  return (
    <span
      className={`mt-1 inline-flex shrink-0 items-center gap-1.5 rounded-full px-2.5 py-1 font-mono text-[0.78rem] tabular-nums ${
        live ? "bg-rose-soft text-rose" : "bg-canvas-soft text-ink-muted"
      }`}
      aria-label={`Call time ${formatDuration(seconds)}`}
    >
      {live && <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-rose" aria-hidden="true" />}
      {formatDuration(seconds)}
    </span>
  );
}

function VoiceView() {
  const [state, setState] = useState<VoiceState>("idle");
  const [muted, setMuted] = useState(false);
  const [transcript, setTranscript] = useState<VoiceTranscriptEntry[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [booking, setBooking] = useState<{ state: BookingState; channel: BookingChannel } | null>(null);
  const [ended, setEnded] = useState<CallEndReason | null>(null);
  const sessionRef = useRef<VoiceSession | null>(null);
  const scrollRef = useStickToBottom(transcript);
  const active = state !== "idle";
  const compact = transcript.length > 0 || (booking !== null && booking.state.stage !== "idle");
  const elapsed = useCallTimer(state);

  useEffect(() => () => sessionRef.current?.stop(), []);

  function start() {
    setTranscript([]);
    setMuted(false);
    setError(null);
    setBooking(null);
    setEnded(null);
    sessionRef.current = startVoiceSession({
      onStateChange: setState,
      onTranscript: (entry) =>
        setTranscript((prev) => {
          const i = entry.id ? prev.findIndex((t) => t.id === entry.id) : -1;
          return i === -1 ? [...prev, entry] : prev.map((t, j) => (j === i ? entry : t));
        }),
      onError: setError,
      onBookingState: (state, channel) => setBooking({ state, channel }),
      onCallEnded: setEnded,
    });
  }

  function stop() {
    sessionRef.current?.stop();
    sessionRef.current = null;
  }

  return (
    <div className={`flex min-h-0 flex-1 flex-col items-center px-5 pb-5 ${compact ? "pt-3" : "pt-6"}`}>
      {compact ? (
        // During a call with content, a slim row keeps room for the card and transcript.
        <div className="flex w-full shrink-0 items-center gap-3 rounded-2xl border border-line bg-canvas-soft/60 px-3 py-2">
          <VoiceOrb state={state} size={40} />
          <div className="min-w-0 flex-1">
            <p role="status" className="truncate text-[0.92rem] font-bold">
              {active ? VOICE_LABEL[state] : "Call ended"}
            </p>
            {error && <p className="truncate text-[0.76rem] text-amber">{error}</p>}
            {ended && !active && <p className="truncate text-[0.76rem] text-ink-muted">{CALL_ENDED_LABEL[ended]}</p>}
          </div>
          <CallTimer seconds={elapsed} live={active} />
        </div>
      ) : (
        <>
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
          {active && <CallTimer seconds={elapsed} live />}
          {error && <p className="mt-1 text-[0.82rem] text-amber">{error}</p>}
          {ended && !active && (
            <p role="status" className="mt-1 text-center text-[0.82rem] text-ink-muted">
              {CALL_ENDED_LABEL[ended]}
              {elapsed > 0 && ` · ${formatDuration(elapsed)}`}
            </p>
          )}
        </>
      )}

      {booking && (booking.state.stage !== "idle" || booking.state.doctorOptions.length > 0 || booking.state.chosenDoctor) && (
        // shrink-0: the card keeps its full height; the transcript below scrolls instead.
        <div className="mt-3 w-full shrink-0">
          <BookingPanel
            state={booking.state}
            channel={booking.channel}
            onChange={(state) => setBooking({ state, channel: booking.channel })}
          />
        </div>
      )}

      {/* Live transcript */}
      <div ref={scrollRef} data-lenis-prevent className="mt-3 min-h-[80px] w-full flex-1 space-y-2 overflow-y-auto">
        {transcript.length === 0 && !active && (
          <p className="px-4 text-center text-[0.86rem] leading-relaxed text-ink-faint">
            {AGENT_DEMO
              ? `Try a short demo call: ${site.agent} will help a patient move an appointment, live.`
              : `Call ${site.agent} to book, move or cancel an appointment.`}
          </p>
        )}
        <AnimatePresence initial={false}>
          {transcript.map((t, i) => (
            <motion.div
              key={i}
              initial={{ opacity: 0, y: 6 }}
              animate={{ opacity: 1, y: 0 }}
              className={t.role === "assistant" ? "mr-8" : "ml-8 text-right"}
            >
              <span className="mb-0.5 block px-1 text-[0.68rem] font-bold uppercase tracking-wider text-ink-faint">
                {t.role === "assistant" ? site.agent : "You"}
              </span>
              <p
                className={`inline-block rounded-[1.1rem] px-3.5 py-2 text-left text-[0.88rem] leading-relaxed ${
                  t.role === "assistant"
                    ? "rounded-tl-md border border-line bg-surface text-ink"
                    : "rounded-tr-md bg-gradient-to-br from-teal to-teal-bright text-white"
                }`}
              >
                {t.text}
              </p>
            </motion.div>
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
