// Scripted demo for the widget — a fictional clinic so visitors can feel the
// product before the real agent is connected. Not used when AGENT_DEMO = false.

import type { AgentReply, ChatMessage, VoiceSession, VoiceSessionHandlers } from "./types";
import demoCall from "./demo-call.json";

export const DEMO_CLINIC = demoCall.clinic;

const wait = (ms: number) => new Promise((r) => setTimeout(r, ms));

export async function demoChatReply(messages: ChatMessage[]): Promise<AgentReply> {
  const q = messages[messages.length - 1]?.content.toLowerCase() ?? "";
  await wait(800 + Math.random() * 600);

  // Patient picked one of the offered slots → confirm (verified) booking
  const picked = q.match(/(mon|tue|wed|thu|fri)[a-z]*,? .*?(\d{1,2}:\d{2} ?(am|pm))/i);
  if (picked) {
    return {
      content: "Done — I've booked it and the clinic system confirmed the slot. A confirmation text is on its way.",
      booking: {
        service: "Annual check-up",
        provider: "Dr. Amelia Chen",
        when: messages[messages.length - 1]!.content,
        location: `${DEMO_CLINIC} · Main St`,
        verified: true,
      },
      quickReplies: ["Add a reminder the day before", "That's all, thanks"],
    };
  }
  if (/(resched|move|change|push)/.test(q)) {
    return {
      content:
        "No problem. I found your appointment on Thursday at 2:30 PM with Dr. Chen. Here are the closest openings with the same doctor:",
      quickReplies: ["Fri, Oct 18 · 10:00 AM", "Mon, Oct 21 · 4:15 PM", "Tue, Oct 22 · 8:30 AM"],
    };
  }
  if (/(book|check-?up|appointment|see a doctor|visit)/.test(q)) {
    return {
      content: "Happy to help you book. Dr. Chen has these openings for an annual check-up next week:",
      quickReplies: ["Tue, Oct 15 · 9:00 AM", "Wed, Oct 16 · 1:30 PM", "Fri, Oct 18 · 4:00 PM"],
    };
  }
  if (/(evening|late|after work|weekend|saturday)/.test(q)) {
    return {
      content: "We have evening hours on Tuesdays and Thursdays until 7 PM. Want me to look for an evening slot?",
      quickReplies: ["Book a check-up next week", "Yes, find an evening slot"],
    };
  }
  if (/(cancel)/.test(q)) {
    return {
      content:
        "I can cancel that for you. Before I do — would a different time work instead? If not, I'll release the slot to patients on the waitlist.",
      quickReplies: ["Reschedule instead", "Please cancel"],
    };
  }
  if (/(pain|bleeding|emergency|chest|urgent|can'?t breathe)/.test(q)) {
    return {
      content:
        "I'm not able to give medical advice. If this is an emergency, please call your local emergency number now. I can also connect you to a member of our clinical team right away.",
      quickReplies: ["Connect me to staff"],
    };
  }
  if (/(staff|human|person|someone)/.test(q)) {
    return {
      content: "Connecting you to the front-desk team now. I've shared a summary of our conversation so you won't need to repeat yourself.",
    };
  }
  if (/(remind)/.test(q)) {
    return { content: "Reminder set — you'll get a text the day before, with an easy link to reschedule if plans change." };
  }
  if (/(thanks|thank you|that's all)/.test(q)) {
    return { content: "You're all set. Have a great day!" };
  }
  return {
    content: `I can book, reschedule or cancel appointments at ${DEMO_CLINIC}, answer questions about hours and services, or connect you to the team.`,
    quickReplies: ["Book a check-up next week", "Reschedule my appointment", "Do you have evening slots?"],
  };
}

// Silent scripted call for the widget's voice tab (captions + orb only).
// The audible demo lives in the hero call card (see LiveCallCard).
export function startDemoVoiceSession(handlers: VoiceSessionHandlers): VoiceSession {
  const timers: ReturnType<typeof setTimeout>[] = [];
  let stopped = false;
  const at = (ms: number, fn: () => void) => timers.push(setTimeout(() => !stopped && fn(), ms));

  let t = 1200;
  handlers.onStateChange("connecting");
  for (const line of demoCall.lines) {
    const role = line.role as "user" | "assistant";
    if (role === "assistant") {
      at(t, () => {
        handlers.onStateChange("speaking");
        handlers.onTranscript({ role, text: line.text });
      });
      t += 3200;
    } else {
      at(t, () => handlers.onStateChange("listening"));
      t += 1400;
      at(t, () => handlers.onTranscript({ role, text: line.text }));
      t += 1200;
      at(t, () => handlers.onStateChange("thinking"));
      t += 900;
    }
  }
  at(t, () => handlers.onStateChange("idle"));

  return {
    stop() {
      stopped = true;
      timers.forEach(clearTimeout);
      handlers.onStateChange("idle");
    },
    setMuted() {},
  };
}
