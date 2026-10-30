"use client";

// The private demo: a team access code, then Amartya's note (bright paper, whatever the
// theme), then the assistant. Once in, a test-script "paper" floats next to the widget.

import { FormEvent, ReactNode, useEffect, useState } from "react";
import { AnimatePresence, motion } from "motion/react";

const ease = [0.22, 1, 0.36, 1] as const;

export type Access = "checking" | "locked" | "unlocked";

/** Is this browser unlocked? (The server checks the HttpOnly cookie.) */
export function useDemoAccess(): [Access, (a: Access) => void] {
  const [access, setAccess] = useState<Access>("checking");
  useEffect(() => {
    fetch("/api/demo-access", { cache: "no-store" })
      .then((r) => r.json())
      .then((d: { unlocked?: boolean }) => setAccess(d.unlocked ? "unlocked" : "locked"))
      .catch(() => setAccess("locked"));
  }, []);
  return [access, setAccess];
}

// ── Gate: code → note → accept ───────────────────────────────────────────────

export function DemoGate({ onUnlocked, onClose }: { onUnlocked: () => void; onClose?: () => void }) {
  const [step, setStep] = useState<"code" | "note">("code");
  const [code, setCode] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function send(accepted: boolean) {
    setBusy(true);
    setError(null);
    try {
      const res = await fetch("/api/demo-access", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ code, accepted }),
      });
      const data = (await res.json().catch(() => ({}))) as { error?: string; unlocked?: boolean };
      if (!res.ok) return setError(data.error ?? "Something went wrong. Please try again.");
      if (data.unlocked) onUnlocked();
      else setStep("note");
    } catch {
      setError("Couldn't reach the website. Please try again.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <motion.div
      className="fixed inset-0 z-[120] flex items-center justify-center bg-[#04080A]/70 p-4 backdrop-blur-sm"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      role="dialog"
      aria-modal="true"
      aria-label="Private demo"
    >
      <AnimatePresence mode="wait">
        {step === "code" ? (
          <motion.form
            key="code"
            onSubmit={(e: FormEvent) => {
              e.preventDefault();
              if (code.trim()) send(false);
            }}
            initial={{ opacity: 0, y: 20, scale: 0.97 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -12 }}
            transition={{ duration: 0.4, ease }}
            className="relative w-full max-w-md rounded-3xl bg-white p-7 font-widget text-[#0C2127] shadow-[0_40px_120px_-30px_rgba(0,0,0,0.8)]"
          >
            {onClose && <CloseX onClick={onClose} />}
            <p className="text-[0.74rem] font-bold uppercase tracking-[0.2em] text-[#0F766E]">Private demo</p>
            <h2 className="mt-2 text-[1.5rem] font-bold leading-tight">Nofa is open to the Zovak team only.</h2>
            <p className="mt-2 text-[0.92rem] leading-relaxed text-[#46606A]">
              The live chat and voice demo isn&apos;t public yet. If you&apos;re on the team, enter your access code.
            </p>
            <input
              type="password"
              value={code}
              onChange={(e) => setCode(e.target.value)}
              autoFocus
              autoComplete="off"
              placeholder="Team access code"
              aria-label="Team access code"
              className="mt-5 w-full rounded-xl border border-[#0C2127]/15 bg-[#F4F7F5] px-4 py-3 text-[0.95rem] outline-none focus:border-[#0F766E]"
            />
            {error && (
              <p role="alert" className="mt-2 text-[0.84rem] text-[#B45309]">
                {error}
              </p>
            )}
            <button
              disabled={busy || !code.trim()}
              className="mt-4 w-full cursor-pointer rounded-xl bg-[#0C2127] py-3 font-bold text-white transition-opacity disabled:opacity-40"
            >
              {busy ? "Checking…" : "Continue"}
            </button>
          </motion.form>
        ) : (
          <WelcomeNote key="note" busy={busy} error={error} onAccept={() => send(true)} onClose={onClose} />
        )}
      </AnimatePresence>
    </motion.div>
  );
}

function CloseX({ onClick }: { onClick: () => void }) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-label="Close"
      className="absolute right-4 top-4 flex h-8 w-8 cursor-pointer items-center justify-center rounded-full text-[#46606A] hover:bg-[#0C2127]/5"
    >
      ✕
    </button>
  );
}

// Amartya's note to the team: the first page after the code, bright on purpose.
function WelcomeNote({ busy, error, onAccept, onClose }: { busy: boolean; error: string | null; onAccept: () => void; onClose?: () => void }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 24, rotate: -1 }}
      animate={{ opacity: 1, y: 0, rotate: 0 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.5, ease }}
      className="relative max-h-[calc(100dvh-2rem)] w-full max-w-xl overflow-y-auto rounded-3xl bg-[#FFFDF6] p-7 font-widget text-[#0C2127] shadow-[0_0_0_1px_rgba(12,33,39,0.06),0_40px_140px_-20px_rgba(200,241,105,0.45)] sm:p-9"
      data-lenis-prevent
    >
      {onClose && <CloseX onClick={onClose} />}
      <p className="text-[0.74rem] font-bold uppercase tracking-[0.2em] text-[#0F766E]">A note before you start</p>
      <h2 className="mt-2 font-serif text-[2rem] italic leading-tight">Hi team, Amartya here.</h2>
      <div className="mt-4 space-y-3 text-[0.98rem] leading-relaxed text-[#2B4148]">
        <p>
          Please remember: <b>this demo is only for marketing.</b> It shows what we&apos;re capable of building. It isn&apos;t
          something we&apos;re selling, it isn&apos;t for a paying client, and it isn&apos;t a product we&apos;re making for
          ourselves, so please don&apos;t expect it to behave like a finished product.
        </p>
        <p>
          We&apos;re just starting out and our resources are limited. <b>Every chat message and every voice call costs us
          real money.</b> It&apos;s a demonstration, nothing more.
        </p>
        <p>
          I&apos;ve already tested everything from my side, including how it would behave with real users, so there&apos;s
          no need to explore beyond the plan. The only reason I&apos;m asking you to follow the test scripts is to{" "}
          <b>save money</b>.
        </p>
        <p>
          The scripts float next to the chat once you&apos;re in: Chat, Voice, Phone, WhatsApp and the Staff side. Short
          steps, one run each. Thank you!
        </p>
        <p className="font-serif text-[1.25rem] italic">Amartya Ghosh</p>
      </div>
      {error && (
        <p role="alert" className="mt-3 text-[0.84rem] text-[#B45309]">
          {error}
        </p>
      )}
      <button
        onClick={onAccept}
        disabled={busy}
        className="mt-6 w-full cursor-pointer rounded-xl bg-[#C8F169] py-3.5 font-bold text-[#04080A] shadow-[0_10px_30px_-10px_rgba(163,214,58,0.9)] transition-transform hover:scale-[1.01] disabled:opacity-50"
      >
        {busy ? "Opening…" : "I understand — I'll follow the test scripts"}
      </button>
    </motion.div>
  );
}

// ── Test scripts: a paper floating next to the open widget ───────────────────

type Script = { id: string; label: string; intro: string; steps: ReactNode[]; note?: string };

const SCRIPTS: Script[] = [
  {
    id: "chat",
    label: "Chat",
    intro: "About 6 messages. Tap buttons instead of typing where you can.",
    steps: [
      <>Type: <i>“I have an itchy rash.”</i> Nofa suggests the skin doctor.</>,
      <>Tap <b>Choose</b> on Dr. Farhan Karim. His free times appear.</>,
      <>Tap a time. The card shows <b>Time selected</b>.</>,
      <>Type your first name.</>,
      <>Type your email in the email box → <b>Confirm email</b> → <b>Confirm booking</b>.</>,
      <>Optional, once: <b>Change time</b> on the booked card → tap a new time → <b>Confirm move</b>.</>,
    ],
    note: "Then stop. No small talk: each message costs money.",
  },
  {
    id: "voice",
    label: "Voice",
    intro: "One short call, under 2 minutes. Use headphones if you can.",
    steps: [
      <>Open <b>Voice call</b> → <b>Start call</b> and allow the microphone.</>,
      <>Say: <i>“I'd like a general check-up with Dr. Ayesha Rahman.”</i></>,
      <>Tap a time on screen, then say your first name.</>,
      <>Type your email in the box on screen (don&apos;t spell it out loud).</>,
      <>Say: <i>“Yes, confirm it.”</i> The green booked card appears.</>,
      <>Say: <i>“Thanks, bye.”</i> Nofa says goodbye and ends the call herself.</>,
    ],
    note: "Calls cost the most. One call per person, please.",
  },
  {
    id: "phone",
    label: "Phone",
    intro: "Only if Amartya gives you the demo number. Phone minutes cost extra.",
    steps: [
      <>Call the demo number from your phone.</>,
      <>Say: <i>“I need a skin doctor, tomorrow afternoon.”</i></>,
      <>Agree on a time and give your first name.</>,
      <>Say: <i>“Confirm.”</i> Nofa sends a text with a short form and hangs up.</>,
      <>Open the form, add your email and confirm within 2 minutes.</>,
    ],
    note: "One call per person. Hang up if anything goes wrong; don't retry.",
  },
  {
    id: "whatsapp",
    label: "WhatsApp",
    intro: "Paused for now: Meta is reviewing our WhatsApp business account.",
    steps: [
      <>Skip this one until Amartya says it's back.</>,
      <>When it is: message the demo number <i>“I need a skin doctor”</i>, tap the buttons Nofa sends, confirm.</>,
    ],
  },
  {
    id: "staff",
    label: "Staff",
    intro: "The clinic's side, at /staff. Please don't press Notify (it sends messages).",
    steps: [
      <>Open <b>Staff portal</b> and sign in as <b>Dr. Farhan Karim</b>, PIN <b>4444</b>.</>,
      <><b>Schedule</b>: switch to Tomorrow and use ‹ › to look at other days.</>,
      <><b>Running late</b>: choose 30 min → <b>See who is affected</b> → read the preview → <b>Discard</b>.</>,
      <><b>Assistant</b>: ask once, <i>“What's my schedule tomorrow?”</i></>,
      <>Reception (PIN 5555) or the manager (PIN 9999) can see every doctor.</>,
    ],
    note: "One assistant question is enough: it costs money like the chat.",
  },
];

export function TestScripts({ placement = "widget" }: { placement?: "widget" | "page" }) {
  const [tab, setTab] = useState(placement === "page" ? "staff" : "chat");
  // Phones: start folded at the top so the chat stays usable; tap to unfold.
  const [folded, setFolded] = useState(() => typeof window !== "undefined" && window.innerWidth < 640);
  const script = SCRIPTS.find((s) => s.id === tab) ?? SCRIPTS[0]!;
  const position =
    placement === "widget"
      ? "top-3 left-3 right-3 sm:top-auto sm:bottom-[5.25rem] sm:left-auto sm:right-[430px] sm:w-[340px]"
      : "bottom-4 right-4 left-4 sm:left-auto sm:w-[340px]";

  return (
    <motion.aside
      aria-label="Test scripts"
      initial={{ opacity: 0, x: 30, rotate: 3 }}
      animate={{ opacity: 1, x: 0, rotate: folded ? 0 : -1.2, y: [0, -4, 0] }}
      exit={{ opacity: 0, x: 30 }}
      transition={{ duration: 0.5, ease, y: { duration: 6, repeat: Infinity, ease: "easeInOut" } }}
      className={`fixed z-[95] font-widget text-[#0C2127] ${position}`}
    >
      <div className="overflow-hidden rounded-2xl bg-[#FFFDF6] shadow-[0_0_0_1px_rgba(12,33,39,0.08),0_30px_70px_-20px_rgba(0,0,0,0.55)]">
        <button
          type="button"
          onClick={() => setFolded((f) => !f)}
          className="flex w-full cursor-pointer items-center justify-between bg-[#C8F169] px-4 py-2.5 text-left text-[0.82rem] font-bold text-[#04080A]"
          aria-expanded={!folded}
        >
          <span>📄 Test scripts — follow these to save money</span>
          <span aria-hidden="true">{folded ? "▴" : "▾"}</span>
        </button>
        {!folded && (
          <div
            data-lenis-prevent
            className="max-h-[min(460px,calc(100dvh-12rem))] overflow-y-auto px-4 pb-4 pt-3 [background:repeating-linear-gradient(transparent_0_27px,rgba(15,118,110,0.08)_27px_28px)]"
          >
            <div role="tablist" className="flex flex-wrap gap-1.5">
              {SCRIPTS.map((s) => (
                <button
                  key={s.id}
                  role="tab"
                  aria-selected={s.id === tab}
                  onClick={() => setTab(s.id)}
                  className={`cursor-pointer rounded-full px-3 py-1 text-[0.76rem] font-bold ${
                    s.id === tab ? "bg-[#0C2127] text-white" : "border border-[#0C2127]/15 text-[#46606A] hover:bg-[#0C2127]/5"
                  }`}
                >
                  {s.label}
                </button>
              ))}
            </div>
            <p className="mt-3 text-[0.84rem] font-semibold text-[#0F766E]">{script.intro}</p>
            <ol className="mt-2 space-y-2">
              {script.steps.map((step, i) => (
                <li key={i} className="flex gap-2.5 text-[0.86rem] leading-snug">
                  <span className="mt-px flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-[#0C2127] text-[0.68rem] font-bold text-white">
                    {i + 1}
                  </span>
                  <span>{step}</span>
                </li>
              ))}
            </ol>
            {script.note && <p className="mt-3 rounded-lg bg-[#B45309]/10 px-3 py-2 text-[0.8rem] text-[#92400E]">{script.note}</p>}
          </div>
        )}
      </div>
    </motion.aside>
  );
}
