// POST /api/agent/chat/stream — the same chat turn as /api/agent/chat, but Nofa's
// reply is passed through piece by piece as ZOVAK's AI writes it (plain text).

import { ZOVAK_TENANT, ZovakUnavailable, zovakFetch } from "@/lib/agent/zovak";

export const maxDuration = 60;

interface ChatBody {
  conversationId?: string;
  messages?: { role: string; content: string }[];
}

const text = (body: string, status: number) =>
  new Response(body, { status, headers: { "Content-Type": "text/plain; charset=utf-8" } });

export async function POST(req: Request) {
  const body = (await req.json().catch(() => ({}))) as ChatBody;
  const conversationId = body.conversationId?.slice(0, 120);
  const message = body.messages?.filter((m) => m.role === "user").at(-1)?.content?.trim();
  if (!conversationId || !message) return text("Missing conversation or message.", 400);

  try {
    const res = await zovakFetch("/api/v1/dev/chat/stream", {
      method: "POST",
      body: JSON.stringify({ tenant_id: ZOVAK_TENANT, conversation_id: conversationId, message: message.slice(0, 5000) }),
    });
    if (!res.ok || !res.body) {
      console.error("ZOVAK chat stream failed", res.status, await res.text().catch(() => ""));
      return text(`The receptionist backend returned an error (${res.status}).`, 502);
    }
    return new Response(res.body, {
      headers: { "Content-Type": "text/plain; charset=utf-8", "Cache-Control": "no-store" },
    });
  } catch (err) {
    if (err instanceof ZovakUnavailable) {
      console.error(err.message);
      return text("The receptionist backend is offline right now.", 503);
    }
    throw err;
  }
}
