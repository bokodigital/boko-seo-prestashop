import { NextResponse } from "next/server";
import { getSession } from "@/lib/session";
import { listResource } from "@/lib/prestashop";

export const dynamic = "force-dynamic";
export const maxDuration = 60;

function dec(type, arr) {
  return (arr || []).map((it) => ({ ...it, type, handle: it.slug || "", genTitle: "", genDesc: "", status: "idle", error: "" }));
}

export async function GET(request) {
  const session = getSession(request);
  if (!session) return NextResponse.json({ connected: false }, { status: 401 });
  try {
    const [cms, products, categories] = await Promise.all([
      listResource(session, "content_management_system"),
      listResource(session, "products"),
      listResource(session, "categories"),
    ]);
    return NextResponse.json({
      connected: true,
      site: { name: session.site.replace(/^https?:\/\//, "") },
      pages: cms,
      products,
      categories,
    });
  } catch (e) {
    return NextResponse.json({ error: e.message || String(e) }, { status: 500 });
  }
}
