// Private demo access. Every chat message and call costs money, so the assistant and
// the staff portal only work after the team access code is entered and the note accepted.
//
// The code lives in DEMO_ACCESS_CODE (.env.local and Vercel), never in code or the
// browser. A successful unlock is remembered in an HttpOnly cookie holding a hash of
// the code; changing the code locks everyone out again.

export const ACCESS_COOKIE = "nofa_demo_access";
export const ACCESS_DAYS = 7;

async function sha256(text: string): Promise<string> {
  const bytes = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(text));
  return Array.from(new Uint8Array(bytes), (b) => b.toString(16).padStart(2, "0")).join("");
}

/** The cookie value for the configured code, or null when no code is set (demo closed). */
export async function accessToken(): Promise<string | null> {
  const code = process.env.DEMO_ACCESS_CODE;
  return code ? sha256(`nofa-demo:${code}`) : null;
}

/** Constant-time comparison, so a wrong guess takes as long as a right one. */
export function sameText(a: string, b: string): boolean {
  if (a.length !== b.length) return false;
  let diff = 0;
  for (let i = 0; i < a.length; i++) diff |= a.charCodeAt(i) ^ b.charCodeAt(i);
  return diff === 0;
}

export async function hasAccess(cookieValue: string | undefined): Promise<boolean> {
  const token = await accessToken();
  return Boolean(token && cookieValue && sameText(cookieValue, token));
}
