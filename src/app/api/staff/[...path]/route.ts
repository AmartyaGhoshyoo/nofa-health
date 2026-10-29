// /api/staff/* — forwards the staff portal's requests to ZOVAK's /api/v1/staff/*.
// The browser keeps the staff session token and sends it as x-staff-token.

import { ZovakUnavailable, zovakFetch } from "@/lib/agent/zovak";

export const maxDuration = 60; // the staff assistant can take a while

async function forward(req: Request, path: string[]) {
  const url = new URL(req.url);
  const token = req.headers.get("x-staff-token");
  const body = req.method === "GET" || req.method === "DELETE" ? undefined : await req.text();
  try {
    const res = await zovakFetch(`/api/v1/staff/${path.map(encodeURIComponent).join("/")}${url.search}`, {
      method: req.method,
      headers: token ? { "x-staff-token": token } : {},
      body,
    });
    const data = await res.json().catch(() => ({}));
    if (!res.ok) {
      const detail = typeof data.detail === "string" ? data.detail : "Something went wrong.";
      return Response.json({ error: detail }, { status: res.status });
    }
    return Response.json(data);
  } catch (err) {
    if (err instanceof ZovakUnavailable) {
      return Response.json({ error: "The clinic system is offline right now." }, { status: 503 });
    }
    throw err;
  }
}

type Ctx = { params: { path: string[] } };
export const GET = (req: Request, { params }: Ctx) => forward(req, params.path);
export const POST = (req: Request, { params }: Ctx) => forward(req, params.path);
export const DELETE = (req: Request, { params }: Ctx) => forward(req, params.path);
