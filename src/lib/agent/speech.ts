// ─────────────────────────────────────────────────────────────────────────────
// Audio for the demo call (patient ↔ Nofa), played only after a visitor clicks.
//
// 1. If studio recordings exist (public/audio/demo/manifest.json, created by
//    `npm run demo:audio` — see scripts/generate-demo-audio.mjs), those play.
// 2. Otherwise the browser's built-in speech engine voices both sides, using
//    two different system voices on the visitor's own device.
// 3. If neither is available, lines are paced silently so captions still flow.
// ─────────────────────────────────────────────────────────────────────────────

import type { ChatRole } from "./types";

export interface SpokenLine {
  id: string;
  role: ChatRole;
  text: string;
}

const MANIFEST_URL = "/audio/demo/manifest.json";

// Preferred system voices, best first (matched by substring of the voice name)
const AGENT_VOICES = ["Google US English", "Microsoft Aria", "Microsoft Jenny", "Samantha", "Ava", "Allison", "Karen", "Zira", "Victoria"];
const PATIENT_VOICES = ["Google UK English Male", "Microsoft Guy", "Microsoft Davis", "Daniel", "Aaron", "Alex", "Tom", "David", "Fred"];

let sharedAudio: HTMLAudioElement | null = null;
const SILENT_WAV = "data:audio/wav;base64,UklGRiQAAABXQVZFZm10IBAAAAABAAEAQB8AAEAfAAABAAgAZGF0YQAAAAA=";

/**
 * Call synchronously inside a click handler. Browsers (Safari especially)
 * only allow audio/speech that starts from a user gesture; this "unlocks"
 * both so the call can start a moment later.
 */
export function primeDemoAudio() {
  if (typeof window === "undefined") return;
  try {
    sharedAudio ??= new Audio();
    sharedAudio.src = SILENT_WAV;
    void sharedAudio.play().catch(() => {});
  } catch {}
  try {
    if ("speechSynthesis" in window) {
      window.speechSynthesis.cancel();
      const u = new SpeechSynthesisUtterance(" ");
      u.volume = 0;
      window.speechSynthesis.speak(u);
    }
  } catch {}
}

function loadVoices(): Promise<SpeechSynthesisVoice[]> {
  if (!("speechSynthesis" in window)) return Promise.resolve([]);
  const now = window.speechSynthesis.getVoices();
  if (now.length) return Promise.resolve(now);
  return new Promise((resolve) => {
    const done = () => resolve(window.speechSynthesis.getVoices());
    window.speechSynthesis.addEventListener("voiceschanged", done, { once: true });
    setTimeout(done, 1200);
  });
}

function pick(voices: SpeechSynthesisVoice[], prefs: string[], avoid?: SpeechSynthesisVoice) {
  const english = voices.filter((v) => v.lang.toLowerCase().startsWith("en"));
  for (const p of prefs) {
    const v = english.find((x) => x.name.includes(p) && x !== avoid);
    if (v) return v;
  }
  return english.find((v) => v !== avoid) ?? english[0];
}

/** Natural reading time for a caption — a floor so lines never flash past if audio fails. */
const minDuration = (text: string) => 700 + text.length * 38;

/** Resolve no earlier than `minMs` after `startedAt` (keeps captions readable). */
function atLeast(startedAt: number, minMs: number, resolve: () => void) {
  const left = minMs - (performance.now() - startedAt);
  if (left > 0) setTimeout(resolve, left);
  else resolve();
}

export interface Speaker {
  ready: () => Promise<void>;
  say: (line: SpokenLine) => Promise<void>;
  cancel: () => void;
  setMuted: (muted: boolean) => void;
  /** "recorded" | "browser" | "silent" — shown as a small label in the UI */
  mode: () => "recorded" | "browser" | "silent";
}

export function createSpeaker(): Speaker {
  let files: Record<string, string> | null = null;
  let agentVoice: SpeechSynthesisVoice | undefined;
  let patientVoice: SpeechSynthesisVoice | undefined;
  let muted = false;
  let cancelled = false;
  let current: { stop: () => void } | null = null;
  let mode: "recorded" | "browser" | "silent" = "silent";

  async function ready() {
    try {
      const res = await fetch(MANIFEST_URL, { cache: "no-store" });
      if (res.ok) files = ((await res.json()) as { files: Record<string, string> }).files;
    } catch {}
    if (files && Object.keys(files).length) {
      mode = "recorded";
      return;
    }
    const voices = await loadVoices();
    if (voices.length) {
      agentVoice = pick(voices, AGENT_VOICES);
      patientVoice = pick(voices, PATIENT_VOICES, agentVoice);
      mode = "browser";
    }
  }

  function playFile(src: string, text: string) {
    return new Promise<void>((resolve) => {
      const audio = sharedAudio ?? new Audio();
      sharedAudio = audio;
      const startedAt = performance.now();
      let settled = false;
      const finish = () => {
        if (settled) return;
        settled = true;
        audio.onended = audio.onerror = null;
        atLeast(startedAt, cancelled ? 0 : minDuration(text) * 0.6, resolve);
      };
      audio.onended = finish;
      audio.onerror = finish;
      audio.src = src;
      audio.volume = muted ? 0 : 1;
      current = { stop: () => (audio.pause(), finish()) };
      audio.play().catch(finish);
    });
  }

  function speak(line: SpokenLine) {
    return new Promise<void>((resolve) => {
      const u = new SpeechSynthesisUtterance(line.text);
      const agent = line.role === "assistant";
      u.voice = (agent ? agentVoice : patientVoice) ?? null;
      u.lang = u.voice?.lang ?? "en-US";
      u.rate = agent ? 1.0 : 1.05;
      // If both sides ended up on the same voice, separate them by pitch
      u.pitch = agentVoice === patientVoice ? (agent ? 1.15 : 0.8) : 1;
      u.volume = muted ? 0 : 1;
      const startedAt = performance.now();
      let settled = false;
      const finish = () => {
        if (settled) return;
        settled = true;
        // Some engines "end" instantly without speaking — keep the pace natural
        atLeast(startedAt, cancelled ? 0 : minDuration(line.text), resolve);
      };
      u.onend = finish;
      u.onerror = finish;
      current = { stop: () => (window.speechSynthesis.cancel(), finish()) };
      window.speechSynthesis.speak(u);
      // Safety net: some engines never fire onend
      setTimeout(finish, 1500 + line.text.length * 90);
    });
  }

  function silent(line: SpokenLine) {
    return new Promise<void>((resolve) => {
      const t = setTimeout(resolve, minDuration(line.text) + 400);
      current = { stop: () => (clearTimeout(t), resolve()) };
    });
  }

  return {
    ready,
    async say(line) {
      if (cancelled) return;
      const file = files?.[line.id];
      if (file) return playFile(`/audio/demo/${file}`, line.text);
      if (mode === "browser") return speak(line);
      return silent(line);
    },
    cancel() {
      cancelled = true;
      current?.stop();
      try {
        window.speechSynthesis?.cancel();
      } catch {}
    },
    setMuted(m) {
      muted = m;
      if (sharedAudio) sharedAudio.volume = m ? 0 : 1;
    },
    mode: () => mode,
  };
}
