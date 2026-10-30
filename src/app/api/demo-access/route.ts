// GET    /api/demo-access → { unlocked } for this browser
// POST   /api/demo-access { code, accepted } → checks the team code; only when the note
//        was accepted too does it set the access cookie (so nobody skips the note)
// DELETE /api/demo-access → locks this browser again

import { cookies } from "next/headers";
import { ACCESS_COOKIE, ACCESS_DAYS, accessToken, hasAccess, sameText } from "@/lib/access";

export async function GET() {
  return Response.json({ unlocked: await hasAccess(cookies().get(ACCESS_COOKIE)?.value) });
}

export async function POST(req: Request) {
  const { code, accepted } = (await req.json().catch(() => ({}))) as { code?: string; accepted?: boolean };
  const expected = process.env.DEMO_ACCESS_CODE;
  // A small pause makes guessing the code slow.
  await new Promise((r) => setTimeout(r, 400));
  if (!expected) {
    return Response.json({ error: "The demo isn't open right now." }, { status: 503 });
  }
  if (typeof code !== "string" || !sameText(code.trim(), expected)) {
    return Response.json({ error: "That code isn't right. This demo is for the Zovak team only." }, { status: 401 });
  }
  if (!accepted) return Response.json({ valid: true, unlocked: false });
  cookies().set(ACCESS_COOKIE, (await accessToken())!, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: ACCESS_DAYS * 24 * 60 * 60,
  });
  return Response.json({ valid: true, unlocked: true });
}

export async function DELETE() {
  cookies().delete(ACCESS_COOKIE);
  return Response.json({ unlocked: false });
}
