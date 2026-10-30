// Every route that costs money (chat, voice, booking card, staff portal) refuses to work
// until this browser has unlocked the private demo (see src/lib/access.ts).

import { NextResponse, type NextRequest } from "next/server";
import { ACCESS_COOKIE, hasAccess } from "@/lib/access";

export async function middleware(req: NextRequest) {
  if (await hasAccess(req.cookies.get(ACCESS_COOKIE)?.value)) return NextResponse.next();
  return NextResponse.json({ error: "Demo access required.", content: "This demo is private." }, { status: 401 });
}

export const config = { matcher: ["/api/agent/:path*", "/api/staff/:path*"] };
