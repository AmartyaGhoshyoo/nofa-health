// Server-only helpers for talking to the ZOVAK backend (zovak-backend repo).
//
// The browser never calls ZOVAK directly: the Next.js routes in
// src/app/api/agent/* and src/app/api/staff/* forward to it. That avoids CORS and keeps
// the backend URL out of client code. WHERE ZOVAK is: src/config/backend.ts (one line).

import { ZOVAK_API_URL, ZOVAK_SITE_KEY } from "@/config/backend";

export const ZOVAK_TENANT = "demo-business"; // ZOVAK's dev routes only know this tenant

export function zovakUrl(path: string): string | null {
  const base = ZOVAK_API_URL.replace(/\/+$/, "");
  return base ? `${base}${path}` : null;
}

export async function zovakFetch(path: string, init?: RequestInit): Promise<Response> {
  const url = zovakUrl(path);
  if (!url) throw new ZovakUnavailable("ZOVAK_API_URL is not set");
  try {
    return await fetch(url, {
      ...init,
      headers: {
        "Content-Type": "application/json",
        // ngrok's free plan shows a "visit site" page to unknown callers; this skips it.
        "ngrok-skip-browser-warning": "1",
        ...(ZOVAK_SITE_KEY ? { "X-Zovak-Site-Key": ZOVAK_SITE_KEY } : {}),
        ...accessHeaders(),
        ...init?.headers,
      },
      cache: "no-store",
    });
  } catch (err) {
    throw new ZovakUnavailable(`Could not reach ZOVAK at ${url}: ${(err as Error).message}`);
  }
}

export class ZovakUnavailable extends Error {}

// When ZOVAK is reached through a Cloudflare tunnel protected by Cloudflare
// Access, these service-token headers let only this site's server through.
function accessHeaders(): Record<string, string> {
  const id = process.env.ZOVAK_ACCESS_CLIENT_ID;
  const secret = process.env.ZOVAK_ACCESS_CLIENT_SECRET;
  return id && secret ? { "CF-Access-Client-Id": id, "CF-Access-Client-Secret": secret } : {};
}
