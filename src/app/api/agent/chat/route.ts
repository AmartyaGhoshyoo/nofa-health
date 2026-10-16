// POST /api/agent/chat — receptionist chat endpoint (not implemented yet).
//
// TODO(backend): run the receptionist agent with the OpenAI Agents SDK.
// Sketch (npm i @openai/agents zod; set OPENAI_API_KEY in .env.local):
//
//   import { Agent, run } from "@openai/agents";
//   const nofa = new Agent({
//     name: "Nofa",
//     instructions: `You are the front desk for a medical clinic. Book, reschedule
//       and cancel appointments using the tools. Never give medical advice;
//       for anything clinical or urgent, hand off to staff. Only confirm a
//       booking after the tool returns ok: true.`,
//     tools: [checkAvailability, bookAppointment, ...], // see src/lib/agent/tools.ts
//   });
//   const result = await run(nofa, messages);
//   return Response.json({ content: result.finalOutput });
//
// Response shape the widget expects: AgentReply (src/lib/agent/types.ts).

export async function POST() {
  return Response.json(
    { content: "The live agent isn't connected yet. Set AGENT_DEMO = true in src/lib/agent/client.ts to use the demo." },
    { status: 501 }
  );
}
