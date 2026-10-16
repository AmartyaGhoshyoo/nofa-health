// ─────────────────────────────────────────────────────────────────────────────
// Frontend ↔ agent contract
//
// The chat + voice widget only calls the two functions below. With
// AGENT_DEMO = true they run a scripted demo so the UI works without a
// backend. To go live:
//
// 1. Chat  → implement POST /api/agent/chat (src/app/api/agent/chat/route.ts)
//            with the OpenAI Agents SDK, then set AGENT_DEMO = false.
// 2. Voice → implement POST /api/agent/session to mint an ephemeral Realtime
//            key, then fill in startLiveVoiceSession() below with the SDK's
//            RealtimeSession (it handles mic, WebRTC audio and interruptions).
// ─────────────────────────────────────────────────────────────────────────────

import type { AgentReply, ChatMessage, VoiceSession, VoiceSessionHandlers } from "./types";
import { demoChatReply, startDemoVoiceSession } from "./demo";

/** Shows the "Demo" badge in the widget and uses scripted replies. */
export const AGENT_DEMO = true;

export async function sendChatMessage(messages: ChatMessage[]): Promise<AgentReply> {
  if (AGENT_DEMO) return demoChatReply(messages);

  const res = await fetch("/api/agent/chat", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ messages: messages.map(({ role, content }) => ({ role, content })) }),
  });
  if (!res.ok) throw new Error(`Agent error ${res.status}`);
  return (await res.json()) as AgentReply;
}

export function startVoiceSession(handlers: VoiceSessionHandlers): VoiceSession {
  if (AGENT_DEMO) return startDemoVoiceSession(handlers);
  return startLiveVoiceSession(handlers);
}

function startLiveVoiceSession(handlers: VoiceSessionHandlers): VoiceSession {
  let stopped = false;
  handlers.onStateChange("connecting");

  // TODO(backend): sketch with the OpenAI Agents SDK (check the current docs
  // for exact names — the realtime API surface evolves):
  //
  //   import { RealtimeAgent, RealtimeSession } from "@openai/agents/realtime";
  //   const { apiKey } = await (await fetch("/api/agent/session", { method: "POST" })).json();
  //   const agent = new RealtimeAgent({ name: "Nofa", instructions: "...", tools: [...] });
  //   const session = new RealtimeSession(agent);
  //   await session.connect({ apiKey });
  //   // map session events → handlers.onStateChange / handlers.onTranscript
  //   return { stop: () => session.close(), setMuted: (m) => session.mute(m) };

  queueMicrotask(() => {
    if (stopped) return;
    handlers.onError?.("Live voice isn't connected yet.");
    handlers.onStateChange("idle");
  });

  return {
    stop() {
      stopped = true;
      handlers.onStateChange("idle");
    },
    setMuted() {},
  };
}
