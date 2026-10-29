// POST /api/agent/session — starts a ZOVAK GPT-Live voice call.
//
// The browser sends its WebRTC SDP offer; ZOVAK creates the GPT-Live session
// (its OpenAI key stays on the backend), attaches its server-side sideband
// for booking tools, and returns the SDP answer. Audio then flows directly
// between the browser and OpenAI.

import { ZovakUnavailable, zovakFetch } from "@/lib/agent/zovak";

export const maxDuration = 30;

export async function POST(req: Request) {
  const { sdp } = (await req.json().catch(() => ({}))) as { sdp?: string };
  if (!sdp) return Response.json({ error: "Missing SDP offer." }, { status: 400 });

  try {
    const res = await zovakFetch("/api/v1/dev/voice/session", {
      method: "POST",
      body: JSON.stringify({ sdp }),
    });
    const data = await res.json().catch(() => ({}));
    if (!res.ok) {
      console.error("ZOVAK voice session failed", res.status, data);
      return Response.json({ error: data.detail ?? `Voice backend error ${res.status}` }, { status: 502 });
    }
    // ui_token (from ZOVAK's typed-email patch) authorizes the on-screen email box for this call only.
    return Response.json({ sdp: data.transport.sdp, conversationId: data.conversation_id, uiToken: data.ui_token ?? null });
  } catch (err) {
    if (err instanceof ZovakUnavailable) {
      console.error(err.message);
      return Response.json({ error: "The voice backend is offline right now." }, { status: 503 });
    }
    throw err;
  }
}
