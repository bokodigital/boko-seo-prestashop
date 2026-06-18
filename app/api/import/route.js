import { NextResponse } from "next/server";
import { getSession } from "@/lib/session";
import { updateMeta } from "@/lib/prestashop";

export const dynamic = "force-dynamic";

const RESOURCE = { pages: "content_management_system", products: "products", categories: "categories" };

export async function POST(request) {
  const session = getSession(request);
  if (!session) return NextResponse.json({ error: "Not connected." }, { status: 401 });
  let body;
  try { body = await request.json(); } catch (e) { return NextResponse.json({ error: "Invalid body" }, { status: 400 }); }
  const { type, id, metaTitle, metaDescription } = body || {};
  const resource = RESOURCE[type];
  if (!resource || !id || !metaTitle) return NextResponse.json({ error: "type, id and metaTitle are required." }, { status: 400 });
  try {
    await updateMeta(session, resource, id, metaTitle, metaDescription || "");
    return NextResponse.json({ ok: true });
  } catch (e) {
    return NextResponse.json({ error: e.message || String(e) }, { status: 502 });
  }
}
