// ── The ONE place that says where the ZOVAK backend is ─────────────────────────
//
// Every call from this website to ZOVAK (chat, voice, booking card, staff portal) goes
// through src/lib/agent/zovak.ts, which reads this. Server-side only: browsers never see it.
//
//   Local laptop:        "http://127.0.0.1:8000"
//   Deployed on Vercel:  "https://stapling-delete-stunner.ngrok-free.dev"
//
// Change the line below (or set ZOVAK_API_URL in .env.local / Vercel, which wins).
export const ZOVAK_API_URL = process.env.ZOVAK_API_URL || "http://127.0.0.1:8000";

// Through the tunnel, ZOVAK only answers this website if it sends the shared site key
// (same value as SITE_API_KEY in zovak-backend/.env). Set ZOVAK_SITE_KEY in .env.local
// and in Vercel; never put the key itself in code.
export const ZOVAK_SITE_KEY = process.env.ZOVAK_SITE_KEY || "";
