// Encrypted session cookie holding { site, key } for the connected PrestaShop store.
import crypto from "crypto";

export const SESSION_COOKIE = "boko_ps_session";

function aesKey() { return crypto.createHash("sha256").update(process.env.SESSION_SECRET || "").digest(); }

export function encryptSession(obj) {
  const iv = crypto.randomBytes(12);
  const c = crypto.createCipheriv("aes-256-gcm", aesKey(), iv);
  const data = Buffer.concat([c.update(JSON.stringify(obj), "utf8"), c.final()]);
  return Buffer.concat([iv, c.getAuthTag(), data]).toString("base64url");
}
export function decryptSession(str) {
  try {
    const buf = Buffer.from(str, "base64url");
    const d = crypto.createDecipheriv("aes-256-gcm", aesKey(), buf.subarray(0, 12));
    d.setAuthTag(buf.subarray(12, 28));
    return JSON.parse(Buffer.concat([d.update(buf.subarray(28)), d.final()]).toString("utf8"));
  } catch (e) { return null; }
}
export function getSession(request) {
  const raw = request.cookies.get(SESSION_COOKIE)?.value;
  if (!raw) return null;
  const s = decryptSession(raw);
  if (!s || !s.site || !s.key) return null;
  return s;
}
