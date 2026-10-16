export type ChatRole = "user" | "assistant";

export interface BookingCard {
  service: string;
  provider: string;
  when: string; // human-readable, e.g. "Fri, Oct 18 · 10:00 AM"
  location: string;
  verified: boolean; // true only after the scheduling system confirmed the write
}

export interface ChatMessage {
  id: string;
  role: ChatRole;
  content: string;
  /** Optional quick replies rendered as chips under an assistant message */
  quickReplies?: string[];
  /** Optional confirmed-booking card rendered under an assistant message */
  booking?: BookingCard;
}

export interface AgentReply {
  content: string;
  quickReplies?: string[];
  booking?: BookingCard;
}

export type VoiceState = "idle" | "connecting" | "listening" | "thinking" | "speaking";

export interface VoiceTranscriptEntry {
  role: ChatRole;
  text: string;
}

export interface VoiceSessionHandlers {
  onStateChange: (state: VoiceState) => void;
  onTranscript: (entry: VoiceTranscriptEntry) => void;
  onError?: (message: string) => void;
}

export interface VoiceSession {
  stop: () => void;
  setMuted: (muted: boolean) => void;
}
