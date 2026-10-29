// Server-only helpers for talking to the ZOVAK backend (zovak-backend repo).
//
// The browser never calls ZOVAK directly: the Next.js routes in
// src/app/api/agent/* forward to it. That avoids CORS and keeps the backend
// URL out of client code. Set ZOVAK_API_URL in .env.local (local backend) or
// in Vercel's env settings (a tunnel URL that reaches your laptop).

export const ZOVAK_TENANT = "demo-business"; // ZOVAK's dev routes only know this tenant

export function zovakUrl(path: string): string | null {
  const base = process.env.ZOVAK_API_URL?.replace(/\/+$/, "");
  return base ? `${base}${path}` : null;
}

export async function zovakFetch(path: string, init?: RequestInit): Promise<Response> {
  const url = zovakUrl(path);
  if (!url) throw new ZovakUnavailable("ZOVAK_API_URL is not set");
  try {
    return await fetch(url, {
      ...init,
      headers: { "Content-Type": "application/json", ...accessHeaders(), ...init?.headers },
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
