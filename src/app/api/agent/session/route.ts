// POST /api/agent/session — mints a short-lived key for browser voice (not implemented yet).
//
// TODO(backend): the browser must never see OPENAI_API_KEY. Create an
// ephemeral Realtime client secret server-side and return it, e.g. by calling
// OpenAI's Realtime client-secrets endpoint with your server key, then return
// { apiKey: <ephemeral value> }. The client (src/lib/agent/client.ts) passes it
// to RealtimeSession.connect(). Check the current OpenAI Realtime docs for the
// exact endpoint and response field names.

export async function POST() {
  return Response.json({ error: "Voice session endpoint not implemented yet." }, { status: 501 });
}
