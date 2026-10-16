// Generates studio-quality recordings for the demo call with OpenAI text-to-speech.
//
//   1. Put OPENAI_API_KEY=sk-... in .env.local
//   2. npm run demo:audio
//
// Reads src/lib/agent/demo-call.json and writes one MP3 per line plus a
// manifest to public/audio/demo/. The website then plays these instead of the
// browser's built-in voices. Re-run after editing the script lines.
//
// Optional env overrides: TTS_MODEL, AGENT_VOICE, PATIENT_VOICE.
// Note: OpenAI's usage policies require telling listeners the voices are
// AI-generated — the voice panel shows an "AI voices" label for this.

import { mkdir, readFile, writeFile } from "node:fs/promises";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const outDir = join(root, "public/audio/demo");
const key = process.env.OPENAI_API_KEY;
if (!key) {
  console.error("Missing OPENAI_API_KEY (add it to .env.local).");
  process.exit(1);
}

const MODEL = process.env.TTS_MODEL ?? "gpt-4o-mini-tts";
const VOICES = {
  assistant: process.env.AGENT_VOICE ?? "coral",
  user: process.env.PATIENT_VOICE ?? "ash",
};
const STYLE = {
  assistant: "Warm, calm and professional clinic receptionist. Friendly, unhurried, reassuring.",
  user: "A busy but polite patient calling their clinic. Natural, conversational, slightly relieved at the end.",
};

const call = JSON.parse(await readFile(join(root, "src/lib/agent/demo-call.json"), "utf8"));
await mkdir(outDir, { recursive: true });

const files = {};
for (const line of call.lines) {
  process.stdout.write(`• ${line.id} (${line.role}) … `);
  const res = await fetch("https://api.openai.com/v1/audio/speech", {
    method: "POST",
    headers: { Authorization: `Bearer ${key}`, "Content-Type": "application/json" },
    body: JSON.stringify({
      model: MODEL,
      voice: VOICES[line.role],
      input: line.text,
      instructions: STYLE[line.role],
      response_format: "mp3",
    }),
  });
  if (!res.ok) {
    console.error(`failed: ${res.status} ${await res.text()}`);
    process.exit(1);
  }
  const file = `${line.id}.mp3`;
  await writeFile(join(outDir, file), Buffer.from(await res.arrayBuffer()));
  files[line.id] = file;
  console.log("ok");
}

await writeFile(join(outDir, "manifest.json"), JSON.stringify({ model: MODEL, voices: VOICES, files }, null, 2) + "\n");
console.log(`\nDone — ${Object.keys(files).length} clips in public/audio/demo/. Reload the site to hear them.`);
