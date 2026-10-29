// POST /api/agent/chat — forwards a chat turn to the ZOVAK receptionist.
//
// ZOVAK's agent can only *propose* bookings, moves and cancellations. The
// widget's booking card (/api/agent/booking) shows them and the customer
// confirms with an explicit tap; the LLM never commits anything on its own.

import { ZOVAK_TENANT, ZovakUnavailable, zovakFetch } from "@/lib/agent/zovak";
import type { AgentReply } from "@/lib/agent/types";

export const maxDuration = 60; // agent turns with tool calls can take a while

interface ChatBody {
  conversationId?: string;
  messages?: { role: string; content: string }[];
}

export async function POST(req: Request) {
  const body = (await req.json().catch(() => ({}))) as ChatBody;
  const conversationId = body.conversationId?.slice(0, 120);
  const message = body.messages?.filter((m) => m.role === "user").at(-1)?.content?.trim();
  if (!conversationId || !message) {
    return Response.json({ content: "Missing conversation or message." }, { status: 400 });
  }

  try {
    const res = await zovakFetch("/api/v1/dev/chat", {
      method: "POST",
      body: JSON.stringify({ tenant_id: ZOVAK_TENANT, conversation_id: conversationId, message: message.slice(0, 5000) }),
    });
    if (!res.ok) {
      const detail = await res.text();
      console.error("ZOVAK chat failed", res.status, detail);
      return Response.json({ content: `The receptionist backend returned an error (${res.status}).` }, { status: 502 });
    }
    const { response } = (await res.json()) as { response: string };
    const reply: AgentReply = { content: response };
    return Response.json(reply);
  } catch (err) {
    if (err instanceof ZovakUnavailable) {
      console.error(err.message);
      return Response.json({ content: "The receptionist backend is offline right now." }, { status: 503 });
    }
    throw err;
  }
}
