// ─────────────────────────────────────────────────────────────────────────────
// Frontend ↔ agent contract
//
// The chat + voice widget only calls the two functions below. They run a
// scripted demo unless NEXT_PUBLIC_AGENT_LIVE=true, in which case they go
// through /api/agent/chat and /api/agent/session, which forward to the ZOVAK
// backend (see src/lib/agent/zovak.ts).
// ─────────────────────────────────────────────────────────────────────────────

import type {
  AgentReply,
  BookingAction,
  BookingChannel,
  BookingState,
  CallEndReason,
  ChatMessage,
  VoiceSession,
  VoiceSessionHandlers,
} from "./types";
import { demoChatReply, startDemoVoiceSession } from "./demo";

/** Shows the "Demo" badge in the widget and uses scripted replies. */
export const AGENT_DEMO = process.env.NEXT_PUBLIC_AGENT_LIVE !== "true";

// One backend conversation per browser tab, so ZOVAK keeps multi-turn memory, and a
// refresh or closing the chat panel continues the same chat (a new tab starts fresh).
const CHAT_ID_KEY = "nofa-chat-id";
let conversationId: string | null = null;
function getConversationId(): string {
  if (conversationId) return conversationId;
  try {
    conversationId = sessionStorage.getItem(CHAT_ID_KEY);
  } catch {
    /* storage blocked: this page load only */
  }
  if (!conversationId) {
    conversationId = `web-${crypto.randomUUID()}`;
    try {
      sessionStorage.setItem(CHAT_ID_KEY, conversationId);
    } catch {
      /* storage blocked */
    }
  }
  return conversationId;
}

export async function sendChatMessage(messages: ChatMessage[]): Promise<AgentReply> {
  if (AGENT_DEMO) return demoChatReply(messages);

  const res = await fetch("/api/agent/chat", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      conversationId: getConversationId(),
      messages: messages.map(({ role, content }) => ({ role, content })),
    }),
  });
  const reply = (await res.json().catch(() => null)) as AgentReply | null;
  if (reply?.content) return reply; // includes friendly backend-offline messages
  throw new Error(`Agent error ${res.status}`);
}

// ── Booking card ─────────────────────────────────────────────────────────────

/** The chat conversation's booking card channel. */
export function getChatChannel(): BookingChannel {
  return { channel: "chat", conversationId: getConversationId() };
}

/** Current booking card state, or null if the backend can't be reached. */
export async function fetchBookingState(ch: BookingChannel): Promise<BookingState | null> {
  const params = new URLSearchParams({ channel: ch.channel, conversationId: ch.conversationId });
  try {
    const res = await fetch(`/api/agent/booking?${params}`, {
      headers: ch.token ? { "x-voice-token": ch.token } : {},
      cache: "no-store",
    });
    if (!res.ok) {
      console.warn("[booking] state check failed", res.status, await res.text());
      return null;
    }
    return (await res.json()) as BookingState;
  } catch {
    return null;
  }
}

/** Runs one card button. Resolves to an error message, or null on success. */
export async function sendBookingAction(
  ch: BookingChannel,
  action: BookingAction,
  id: string,
  email?: string
): Promise<string | null> {
  try {
    const res = await fetch("/api/agent/booking", {
      method: "POST",
      headers: { "Content-Type": "application/json", ...(ch.token ? { "x-voice-token": ch.token } : {}) },
      body: JSON.stringify({ channel: ch.channel, conversationId: ch.conversationId, action, id, email }),
    });
    if (res.ok) return null;
    const data = (await res.json().catch(() => ({}))) as { error?: string };
    return data.error ?? `Something went wrong (error ${res.status}).`;
  } catch {
    return "Couldn't reach the server. Please try again.";
  }
}

export function startVoiceSession(handlers: VoiceSessionHandlers): VoiceSession {
  if (AGENT_DEMO) return startDemoVoiceSession(handlers);
  return startLiveVoiceSession(handlers);
}

// GPT-Live over WebRTC, brokered by ZOVAK (same flow as ZOVAK's own
// /api/v1/dev/voice test page). Booking tools run on ZOVAK's sideband.
function startLiveVoiceSession(handlers: VoiceSessionHandlers): VoiceSession {
  let stopped = false;
  let pc: RTCPeerConnection | null = null;
  let mic: MediaStream | null = null;
  let channel: RTCDataChannel | null = null;
  let call: BookingChannel | null = null;
  let lastState = "";
  let pollTimer: ReturnType<typeof setTimeout> | null = null;
  const audio = new Audio();
  audio.autoplay = true;

  // Transcript deltas arrive word by word. Stream them into one entry per
  // speaker turn; a new turn starts when the other side starts talking.
  let turn = 0;
  // UI updates are batched to one per animation frame so a fast stream of
  // words doesn't re-render the panel dozens of times a second.
  let buffer: { id: string; role: "user" | "assistant"; text: string } | null = null;
  let frame: number | null = null;
  const emit = () => {
    frame = null;
    if (buffer?.text.trim()) handlers.onTranscript({ id: buffer.id, role: buffer.role, text: buffer.text.trim() });
  };
  const flush = () => {
    if (frame !== null) cancelAnimationFrame(frame);
    emit();
    buffer = null;
  };
  const append = (role: "user" | "assistant", delta: string) => {
    if (buffer && buffer.role !== role) flush();
    buffer ??= { id: `turn-${++turn}`, role, text: "" };
    buffer.text += delta;
    frame ??= requestAnimationFrame(emit);
  };

  // The backend said goodbye (silence or off-topic) or GPT-Live closed: hang up.
  const endedRemotely = (reason: CallEndReason) => {
    if (stopped) return;
    stopped = true;
    if (channel?.readyState === "open") channel.send(JSON.stringify({ type: "session.close" }));
    cleanup();
    handlers.onCallEnded?.(reason);
    handlers.onStateChange("idle");
  };

  // Keep the booking card in step with ZOVAK while the call is live.
  const pollBooking = async () => {
    if (stopped || !call) return;
    const state = await fetchBookingState(call);
    if (state?.callEnded) return endedRemotely(state.callEnded);
    // Nofa is saying goodbye: mute the mic so nothing more is heard.
    if (state?.ending) mic?.getAudioTracks().forEach((t) => (t.enabled = false));
    if (state && !stopped) {
      const key = JSON.stringify(state);
      if (key !== lastState) {
        lastState = key;
        handlers.onBookingState?.(state, call);
      }
    }
    if (!stopped) pollTimer = setTimeout(pollBooking, 1500);
  };

  const cleanup = () => {
    flush();
    if (pollTimer) clearTimeout(pollTimer);
    pollTimer = null;
    channel?.close();
    pc?.close();
    mic?.getTracks().forEach((t) => t.stop());
    audio.srcObject = null;
    pc = null;
    mic = null;
    channel = null;
  };

  const fail = (message: string) => {
    if (stopped) return;
    stopped = true;
    cleanup();
    handlers.onError?.(message);
    handlers.onStateChange("idle");
  };

  handlers.onStateChange("connecting");

  (async () => {
    try {
      pc = new RTCPeerConnection();
      pc.addEventListener("track", (e) => {
        audio.srcObject = new MediaStream([e.track]);
        audio.play().catch(() => {});
      });
      // Echo cancellation matters most: without it Nofa hears its own voice
      // through the speakers, treats it as the caller talking, and cuts itself off.
      mic = await navigator.mediaDevices.getUserMedia({
        audio: { echoCancellation: true, noiseSuppression: true, autoGainControl: true },
      });
      if (stopped) return cleanup();
      mic.getAudioTracks().forEach((t) => pc!.addTrack(t, mic!));

      channel = pc.createDataChannel("oai-events");
      channel.addEventListener("message", ({ data }) => {
        let ev: { type?: string; delta?: string };
        try {
          ev = JSON.parse(data);
        } catch {
          return;
        }
        switch (ev.type) {
          case "session.started":
            handlers.onStateChange("listening");
            break;
          case "session.input_transcript.delta":
            append("user", ev.delta ?? "");
            handlers.onStateChange("listening");
            break;
          case "session.delegation.created":
            flush();
            handlers.onStateChange("thinking");
            break;
          case "session.output_transcript.delta":
            append("assistant", ev.delta ?? "");
            handlers.onStateChange("speaking");
            break;
          case "session.closed":
            endedRemotely("remote");
            break;
          case "error":
          case "session.error":
            console.error("GPT-Live event error", ev);
        }
      });
      channel.addEventListener("close", () => {
        if (!stopped) fail("The call disconnected.");
      });

      await pc.setLocalDescription(await pc.createOffer());
      await waitForIce(pc);
      if (stopped) return cleanup();

      const res = await fetch("/api/agent/session", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ sdp: pc.localDescription!.sdp }),
      });
      const data = (await res.json().catch(() => ({}))) as {
        sdp?: string;
        error?: string;
        conversationId?: string;
        uiToken?: string | null;
      };
      if (!res.ok || !data.sdp) throw new Error(data.error ?? `Voice session error ${res.status}`);
      if (stopped || !pc) return cleanup();
      await pc.setRemoteDescription({ type: "answer", sdp: data.sdp });
      if (data.conversationId && data.uiToken) {
        call = { channel: "voice", conversationId: data.conversationId, token: data.uiToken };
        pollBooking();
      } else {
        console.warn("[voice] backend didn't return a ui_token; the booking card can't be shown");
      }
    } catch (err) {
      console.error(err);
      fail(err instanceof Error ? err.message : "Couldn't start the call.");
    }
  })();

  return {
    stop() {
      if (stopped) return;
      stopped = true;
      // Let GPT-Live close cleanly (the backend logs final usage), then tear down.
      if (channel?.readyState === "open") channel.send(JSON.stringify({ type: "session.close" }));
      setTimeout(cleanup, 500);
      handlers.onStateChange("idle");
    },
    setMuted(muted) {
      mic?.getAudioTracks().forEach((t) => (t.enabled = !muted));
    },
  };
}

function waitForIce(pc: RTCPeerConnection): Promise<void> {
  if (pc.iceGatheringState === "complete") return Promise.resolve();
  return new Promise((resolve, reject) => {
    const timer = setTimeout(() => {
      pc.removeEventListener("icegatheringstatechange", check);
      reject(new Error("ICE gathering timed out"));
    }, 12000);
    function check() {
      if (pc.iceGatheringState === "complete") {
        clearTimeout(timer);
        pc.removeEventListener("icegatheringstatechange", check);
        resolve();
      }
    }
    pc.addEventListener("icegatheringstatechange", check);
  });
}
