// ─────────────────────────────────────────────────────────────────────────────
// Tool contract for the receptionist agent.
//
// These are the actions the backend agent (OpenAI Agents SDK) should expose as
// tools. Kept here as plain types so the frontend and backend agree on shapes.
// With the SDK you'd wrap each one, e.g.:
//
//   import { tool } from "@openai/agents";
//   import { z } from "zod";
//   const checkAvailability = tool({
//     name: "check_availability",
//     description: "Find open slots for a service, provider and date range",
//     parameters: z.object({ ... }),   // mirror CheckAvailabilityInput
//     execute: async (input) => scheduling.findSlots(input),
//   });
//
// Golden rule from the product brief: the agent must only tell the patient a
// booking is confirmed AFTER book/reschedule returns { ok: true } from the
// source system (EHR / practice-management / calendar).
// ─────────────────────────────────────────────────────────────────────────────

export interface CheckAvailabilityInput {
  service: string; // e.g. "annual check-up", "dental cleaning"
  providerId?: string;
  locationId?: string;
  from: string; // ISO date
  to: string; // ISO date
  visitType?: "in_person" | "virtual";
}

export interface Slot {
  slotId: string;
  start: string; // ISO datetime
  end: string;
  providerId: string;
  providerName: string;
  locationId: string;
  roomId?: string; // resource dependencies are checked before offering
}

export interface BookAppointmentInput {
  patientId: string;
  slotId: string;
  service: string;
  notes?: string;
}

export interface RescheduleInput {
  appointmentId: string;
  newSlotId: string;
  reason?: string;
}

export interface CancelInput {
  appointmentId: string;
  reason?: string;
  offerSlotToWaitlist?: boolean;
}

export interface WaitlistInput {
  patientId: string;
  service: string;
  preferences: { providers?: string[]; locations?: string[]; days?: string[]; times?: string[] };
}

export interface HandoffInput {
  reason: "clinical_question" | "urgent" | "billing" | "patient_request" | "unresolved";
  summary: string; // passed to staff so the patient never repeats themselves
}

/** Result every write action must return — the agent confirms only when ok === true */
export type WriteResult = { ok: true; confirmationId: string } | { ok: false; error: string };

export const TOOL_NAMES = [
  "check_availability",
  "book_appointment",
  "reschedule_appointment",
  "cancel_appointment",
  "add_to_waitlist",
  "handoff_to_staff",
] as const;
