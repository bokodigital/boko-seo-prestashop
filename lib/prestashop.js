// PrestaShop Webservice API client (Basic auth with the Webservice key).
// Reads as JSON; writes via GET-XML -> edit -> PUT-XML (PrestaShop's required pattern).

export function normalizeSite(site) {
  let s = String(site || "").trim().replace(/\/+$/, "");
  if (!/^https?:\/\//i.test(s)) s = "https://" + s;
  return s;
}
function authHeader(key) {
  return "Basic " + Buffer.from(`${key}:`).toString("base64");
}

async function psFetch(session, path, opts = {}) {
  const url = normalizeSite(session.site) + "/api" + path;
  return fetch(url, {
    ...opts,
    headers: { Authorization: authHeader(session.key), ...(opts.headers || {}) },
    cache: "no-store",
  });
}

export async function ping(session) {
  const r = await psFetch(session, "/?output_format=JSON");
  if (r.status === 401) throw new Error("Authentication failed - check the Webservice key.");
  if (r.status === 404) throw new Error("Webservice not found - enable it in PrestaShop (Advanced Parameters - Webservice).");
  if (!r.ok) throw new Error(`PrestaShop returned HTTP ${r.status}.`);
  return true;
}

// Pick the first language value out of PrestaShop's many multilang shapes.
export function ml(field) {
  if (field == null) return { value: "", langId: null };
  if (typeof field === "string" || typeof field === "number") return { value: String(field), langId: null };
  if (Array.isArray(field)) {
    const f = field[0] || {};
    if (typeof f === "string") return { value: f, langId: null };
    return { value: f.value != null ? String(f.value) : "", langId: f.id != null ? String(f.id) : null };
  }
  if (typeof field === "object") {
    if (field.language) {
      const L = Array.isArray(field.language) ? field.language : [field.language];
      const f = L[0] || {};
      if (typeof f === "string") return { value: f, langId: null };
      return { value: f.value != null ? String(f.value) : "", langId: (f.attrs && f.attrs.id) || f.id || null };
    }
    if (field.value != null) return { value: String(field.value), langId: field.id != null ? String(field.id) : null };
  }
  return { value: "", langId: null };
}

const FIELDS = {
  products: ["id", "name", "link_rewrite", "meta_title", "meta_description"],
  categories: ["id", "name", "link_rewrite", "meta_title", "meta_description"],
  content_management_system: ["id", "link_rewrite", "meta_title", "meta_description"],
};

export async function listResource(session, resource, limit = 100) {
  const fields = FIELDS[resource];
  const r = await psFetch(session, `/${resource}?output_format=JSON&display=[${fields.join(",")}]&limit=0,${limit}`);
  if (r.status === 401 || r.status === 403) return []; // resource not permitted for this key
  if (!r.ok) return [];
  let json;
  try { json = await r.json(); } catch (e) { return []; }
  const arr = json[resource] || [];
  return arr.map((it) => {
    const title = ml(it.meta_title);
    const desc = ml(it.meta_description);
    const name = it.name != null ? ml(it.name).value : title.value;
    const slug = it.link_rewrite != null ? ml(it.link_rewrite).value : "";
    return {
      id: String(it.id),
      title: name || `#${it.id}`,
      slug,
      curTitle: title.value,
      curDesc: desc.value,
      context: name || "",
    };
  });
}

const READONLY_NODES = ["manufacturer_name", "quantity", "position_in_category"];

function setMetaField(xml, tag, value) {
  const safe = String(value || "");
  const reLang = new RegExp(`(<${tag}>\\s*<language[^>]*>)([\\s\\S]*?)(</language>)`, "i");
  if (reLang.test(xml)) return xml.replace(reLang, `$1<![CDATA[${safe}]]>$3`);
  const reFlat = new RegExp(`<${tag}>[\\s\\S]*?</${tag}>`, "i");
  if (reFlat.test(xml)) return xml.replace(reFlat, `<${tag}><![CDATA[${safe}]]></${tag}>`);
  return xml;
}
function stripReadonly(xml) {
  let out = xml;
  for (const tag of READONLY_NODES) out = out.replace(new RegExp(`<${tag}>[\\s\\S]*?</${tag}>\\s*`, "gi"), "");
  return out;
}

export async function updateMeta(session, resource, id, title, desc) {
  const getRes = await psFetch(session, `/${resource}/${id}`); // XML
  if (!getRes.ok) throw new Error(`Could not read ${resource}/${id} (HTTP ${getRes.status}).`);
  let xml = await getRes.text();
  xml = setMetaField(xml, "meta_title", title);
  xml = setMetaField(xml, "meta_description", desc);
  xml = stripReadonly(xml);
  const putRes = await psFetch(session, `/${resource}/${id}`, {
    method: "PUT",
    headers: { "Content-Type": "text/xml" },
    body: xml,
  });
  const body = await putRes.text();
  if (!putRes.ok || /<errors>/i.test(body)) {
    const m = body.match(/<message><!\[CDATA\[([\s\S]*?)\]\]><\/message>/i) || body.match(/<message>([\s\S]*?)<\/message>/i);
    throw new Error("PrestaShop write failed: " + (m ? m[1] : `HTTP ${putRes.status}`));
  }
  return true;
}
