// /api/agent/booking — the booking card for chat and voice.
//
// GET returns what the card should show (email box, confirm, booked, move or
// cancel). POST runs one card button. Every action is re-checked by ZOVAK
// against its own state; voice calls also need the call's ui_token.

import { ZOVAK_TENANT, ZovakUnavailable, zovakFetch } from "@/lib/agent/zovak";
import type { Appointment, BookingAction, BookingState, DoctorOption } from "@/lib/agent/types";

type Channel = "voice" | "chat";

interface ZovakAppointment {
  id: string;
  service_name: string;
  doctor_name: string | null;
  doctor_specialty: string | null;
  start: string;
  end: string;
  customer_name: string;
  customer_email: string | null;
}

interface ZovakDoctor {
  id: string;
  name: string;
  specialty: string;
  services: string[];
  hours: string;
  about: string;
  next_free: string | null;
}

interface ZovakState {
  stage: BookingState["stage"];
  doctor_options?: ZovakDoctor[];
  chosen_doctor?: Omit<ZovakDoctor, "next_free"> | null;
  proposal: ZovakAppointment | null;
  booking: ZovakAppointment | null;
  change: { id: string; kind: "move" | "cancel"; new_start: string | null; new_end: string | null } | null;
  cancelled: ZovakAppointment | null;
  email_request_id: string | null;
  call_ended?: BookingState["callEnded"];
  ending?: boolean;
}

const appointment = (a: ZovakAppointment | null): Appointment | null =>
  a && {
    id: a.id,
    serviceName: a.service_name,
    doctorName: a.doctor_name,
    doctorSpecialty: a.doctor_specialty,
    start: a.start,
    end: a.end,
    customerName: a.customer_name,
    customerEmail: a.customer_email,
  };

function voiceAuth(req: Request): Record<string, string> | null {
  const token = req.headers.get("x-voice-token");
  return token ? { Authorization: `Bearer ${token}` } : null;
}

export async function GET(req: Request) {
  const params = new URL(req.url).searchParams;
  const channel = params.get("channel");
  const conversationId = params.get("conversationId");
  if (!conversationId || (channel !== "voice" && channel !== "chat")) {
    return Response.json({ error: "Missing conversation." }, { status: 400 });
  }
  const query = `conversation_id=${encodeURIComponent(conversationId)}`;
  let path = `/api/v1/dev/booking-state?${query}`;
  let init: RequestInit | undefined;
  if (channel === "voice") {
    const headers = voiceAuth(req);
    if (!headers) return Response.json({ error: "Missing call token." }, { status: 400 });
    path = `/api/v1/dev/voice/booking-state?${query}`;
    init = { headers };
  }
  return forward(path, init, (data: ZovakState): BookingState => ({
    stage: data.stage,
    doctorOptions: (data.doctor_options ?? []).map(
      (d): DoctorOption => ({
        id: d.id,
        name: d.name,
        specialty: d.specialty,
        services: d.services,
        hours: d.hours,
        about: d.about,
        nextFree: d.next_free,
      })
    ),
    chosenDoctor: data.chosen_doctor
      ? {
          id: data.chosen_doctor.id,
          name: data.chosen_doctor.name,
          specialty: data.chosen_doctor.specialty,
          services: data.chosen_doctor.services,
          hours: data.chosen_doctor.hours,
          about: data.chosen_doctor.about,
        }
      : null,
    proposal: appointment(data.proposal),
    booking: appointment(data.booking),
    change: data.change && {
      id: data.change.id,
      kind: data.change.kind,
      newStart: data.change.new_start,
      newEnd: data.change.new_end,
    },
    cancelled: appointment(data.cancelled),
    emailRequestId: data.email_request_id,
    callEnded: data.call_ended ?? null,
    ending: data.ending ?? false,
  }));
}

// ZOVAK route + body for each card button, per channel.
type Target = (id: string, conversationId: string, email?: string) => [path: string, body: object];

const ACTIONS: Record<BookingAction, Record<Channel, Target>> = {
  email: {
    voice: (id, c, email) => ["/api/v1/dev/voice/email-input", { conversation_id: c, request_id: id, email }],
    chat: (id, c, email) => ["/api/v1/dev/proposal-email", { conversation_id: c, proposal_id: id, email }],
  },
  "reopen-email": {
    voice: (id, c) => ["/api/v1/dev/voice/reopen-email", { conversation_id: c, proposal_id: id }],
    chat: (id, c) => ["/api/v1/dev/proposal-email/clear", { conversation_id: c, proposal_id: id }],
  },
  "confirm-booking": {
    voice: (id, c) => ["/api/v1/dev/voice/confirm-booking", { conversation_id: c, proposal_id: id }],
    chat: (id, c) => ["/api/v1/dev/confirm", { tenant_id: ZOVAK_TENANT, conversation_id: c, proposal_id: id }],
  },
  "confirm-change": {
    voice: (id, c) => ["/api/v1/dev/voice/change/confirm", { conversation_id: c, change_id: id }],
    chat: (id, c) => ["/api/v1/dev/change/confirm", { conversation_id: c, change_id: id }],
  },
  keep: {
    voice: (id, c) => ["/api/v1/dev/voice/change/discard", { conversation_id: c, change_id: id }],
    chat: (id, c) => ["/api/v1/dev/change/discard", { conversation_id: c, change_id: id }],
  },
};

export async function POST(req: Request) {
  const { channel, conversationId, action, id, email } = (await req.json().catch(() => ({}))) as {
    channel?: Channel;
    conversationId?: string;
    action?: BookingAction;
    id?: string;
    email?: string;
  };
  const target = channel && action ? ACTIONS[action]?.[channel] : undefined;
  if (!target || !conversationId || !id) {
    return Response.json({ error: "Missing booking details." }, { status: 400 });
  }
  const headers = channel === "voice" ? voiceAuth(req) : {};
  if (!headers) return Response.json({ error: "Missing call token." }, { status: 400 });
  const [path, body] = target(id, conversationId.slice(0, 120), email?.trim());
  return forward(path, { method: "POST", headers, body: JSON.stringify(body) }, () => ({ ok: true }));
}

async function forward<T, R>(path: string, init: RequestInit | undefined, shape: (data: T) => R) {
  try {
    const res = await zovakFetch(path, init);
    const data = await res.json().catch(() => ({}));
    if (!res.ok) {
      // FastAPI validation errors put a list in `detail`; ZOVAK's own errors use a string.
      const detail = typeof data.detail === "string" ? data.detail : "Please check the details and try again.";
      return Response.json({ error: detail }, { status: res.status });
    }
    return Response.json(shape(data as T));
  } catch (err) {
    if (err instanceof ZovakUnavailable) {
      console.error(err.message);
      return Response.json({ error: "The booking system is offline right now." }, { status: 503 });
    }
    throw err;
  }
}
