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
  /** Live sessions resend an entry with the same id as more words arrive; the widget updates it in place. */
  id?: string;
}

// ── Live booking card (ZOVAK backend) ───────────────────────────────────────

export interface Appointment {
  id: string;
  serviceName: string;
  doctorName: string | null;
  doctorSpecialty: string | null;
  start: string; // ISO
  end: string; // ISO
  customerName: string;
  customerEmail: string | null;
}

export type BookingStage =
  | "idle"
  | "email_required"
  | "ready_to_confirm"
  | "booked"
  | "move_pending"
  | "cancel_pending"
  | "cancelled";

/** A doctor Nofa suggested for what the patient needs. */
export interface DoctorOption {
  id: string;
  name: string;
  specialty: string;
  services: string[];
  hours: string;
  about: string;
  nextFree: string | null; // ISO
}

/** What the booking card should show, from the backend's trusted state. */
export interface BookingState {
  stage: BookingStage;
  doctorOptions: DoctorOption[];
  /** The doctor the patient picked, with their free times, until the booking details are ready. */
  chosenDoctor: ChosenDoctor | null;
  proposal: Appointment | null;
  booking: Appointment | null;
  change: { id: string; kind: "move" | "cancel"; newStart: string | null; newEnd: string | null } | null;
  cancelled: Appointment | null;
  emailRequestId: string | null;
  /** Voice only: the backend ended the call (silence, off-topic, done, misuse). */
  callEnded?: CallEndReason | null;
  /** Voice only: Nofa is saying goodbye; nothing the caller says counts any more. */
  ending?: boolean;
}

export type CallEndReason = "silence" | "off_topic" | "done" | "misuse" | "no_audio" | "noise" | "remote";

/** Card buttons. None of them books from typed text alone: each is an explicit tap. */
export type BookingAction = "email" | "reopen-email" | "confirm-booking" | "confirm-change" | "keep" | "pick-slot";

/** The chosen doctor plus their next days with free times (tap-to-pick buttons). */
export interface ChosenDoctor extends Omit<DoctorOption, "nextFree"> {
  slots: { date: string; times: string[] }[]; // date YYYY-MM-DD, times ISO
  picked: string | null; // the time the patient tapped (ISO): the card collapses to it
}

/** Which conversation the card belongs to. Voice calls also carry the call's token. */
export interface BookingChannel {
  channel: "voice" | "chat";
  conversationId: string;
  token?: string;
}

export interface VoiceSessionHandlers {
  onStateChange: (state: VoiceState) => void;
  onTranscript: (entry: VoiceTranscriptEntry) => void;
  onError?: (message: string) => void;
  /** Latest booking card state for this call (live sessions only). */
  onBookingState?: (state: BookingState, channel: BookingChannel) => void;
  /** The call was ended by the other side, not by the End call button. */
  onCallEnded?: (reason: CallEndReason) => void;
}

export interface VoiceSession {
  stop: () => void;
  setMuted: (muted: boolean) => void;
}
