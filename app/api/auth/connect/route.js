import { NextResponse } from "next/server";
import { encryptSession, SESSION_COOKIE } from "@/lib/session";
import { ping, normalizeSite } from "@/lib/prestashop";

export const dynamic = "force-dynamic";

// POST { site, key } -> validate against the Webservice, set session cookie.
export async function POST(request) {
  let body;
  try { body = await request.json(); } catch (e) { return NextResponse.json({ error: "Invalid request." }, { status: 400 }); }
  const site = normalizeSite(body.site);
  const key = (body.key || "").trim();
  if (!site || !key) return NextResponse.json({ error: "Store URL and Webservice key are required." }, { status: 400 });
  const session = { site, key };
  try {
    await ping(session);
    const res = NextResponse.json({ connected: true, site });
    res.cookies.set(SESSION_COOKIE, encryptSession(session), { httpOnly: true, secure: true, sameSite: "lax", path: "/", maxAge: 60 * 60 * 24 * 30 });
    return res;
  } catch (e) {
    return NextResponse.json({ error: e.message || String(e) }, { status: 400 });
  }
}
