"use client";

import { useEffect, useMemo, useState, useCallback } from "react";

const TITLE_MIN = 50, TITLE_MAX = 60, DESC_MIN = 150, DESC_MAX = 160;

const TABS = [
  { key: "pages", label: "CMS pages" },
  { key: "products", label: "Products" },
  { key: "categories", label: "Categories" },
];

function Logo() {
  return (
    <svg viewBox="5750 -2679.9 12500 4447.2" role="img" aria-label="boko">
      <path fill="#111213" d="M7218.1-1163.5h-880.7v-1237.2c0-203.6-103-279.3-230-279.3H5750v1516.3l293.1,0.1H5750V302c0,809.2,657.3,1465.3,1468.1,1465.3s1468.1-656,1468.1-1465.3S8029-1163.5,7218.1-1163.5z M7218.2,1181.3c-486.5,0-880.8-393.6-880.8-879.3v-879.3h880.8c486.5,0,880.8,393.6,880.8,879.3C8099.1,787.5,7704.7,1181.3,7218.2,1181.3z" />
      <path fill="#111213" d="M11286.9,302c0-485.6-394.3-879.3-880.8-879.3c-486.5,0-880.9,393.6-880.9,879.3s394.3,879.3,880.9,879.3C10892.6,1181.1,11286.9,787.5,11286.9,302z M11874.2,302c0,809.3-657.3,1465.3-1468.1,1465.3S8938,1111.2,8938,302c0-809.3,657.3-1465.3,1468.1-1465.3C11216.9-1163.5,11874.2-507.3,11874.2,302z" />
      <path fill="#BFFC00" d="M13174.5,1181.1c-14.8,0-29.6-0.7-44.1-2.1l1927.5-1923.7l-415.3-414.4L12715.2,764.6c-1.4-14.5-2.1-29.2-2.1-44v-1884.1h-587.3V720.6c0,578.1,469.4,1046.7,1048.6,1046.7H15062v-586.2H13174.5L13174.5,1181.1z" />
      <path fill="#111213" d="M17662.7,302c0-485.6-394.3-879.3-880.8-879.3s-880.9,393.6-880.9,879.3s394.5,879.3,880.9,879.3C17268.4,1181.3,17662.7,787.5,17662.7,302z M18250,302c0,809.3-657.3,1465.3-1468.1,1465.3c-810.9,0-1468.1-656.1-1468.1-1465.3c0-809.3,657.3-1465.3,1468.1-1465.3C17592.7-1163.5,18250-507.3,18250,302z" />
    </svg>
  );
}
function Topbar() {
  return (<div className="topbar"><div className="brand"><div className="logo"><Logo /></div></div><span className="navlabel">PrestaShop SEO Studio</span></div>);
}

function auditField(val, min, max, name) {
  const v = (val || "").trim(), n = v.length;
  if (!n) return { state: "missing", msg: `${name} missing` };
  if (n > max) return { state: "long", msg: `${name} too long (${n}/${max})` };
  if (n < min) return { state: "short", msg: `${name} too short (${n}/${min}+)` };
  return { state: "ok", msg: `${name} OK (${n})` };
}
function auditItem(item) {
  const title = auditField(item.curTitle, TITLE_MIN, TITLE_MAX, "Meta title");
  const desc = auditField(item.curDesc, DESC_MIN, DESC_MAX, "Meta description");
  return { title, desc, hasIssue: title.state !== "ok" || desc.state !== "ok" };
}
function counterClass(len, min, max) { return len >= min && len <= max ? "ok" : "warn"; }

export default function Page() {
  const [data, setData] = useState({ pages: [], products: [], categories: [] });
  const [site, setSite] = useState({ name: "" });
  const [activeTab, setActiveTab] = useState("pages");
  const [connected, setConnected] = useState(null);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState("");
  const [toast, setToast] = useState("");
  const [busyAll, setBusyAll] = useState(false);

  const [fSite, setFSite] = useState("");
  const [fKey, setFKey] = useState("");
  const [connecting, setConnecting] = useState(false);
  const [connectError, setConnectError] = useState("");

  const showToast = useCallback((m) => { setToast(m); clearTimeout(window.__t); window.__t = setTimeout(() => setToast(""), 3200); }, []);

  const load = useCallback(async () => {
    setLoading(true); setLoadError("");
    try {
      const res = await fetch("/api/items");
      if (res.status === 401) { setConnected(false); setLoading(false); return; }
      const d = await res.json();
      if (!res.ok) throw new Error(d.error || "Failed to load");
      const dec = (arr) => (arr || []).map((it) => ({ ...it, genTitle: "", genDesc: "", status: "idle", error: "" }));
      setData({ pages: dec(d.pages), products: dec(d.products), categories: dec(d.categories) });
      setSite(d.site || { name: "" });
      setConnected(true);
    } catch (e) { setConnected(true); setLoadError(e.message || String(e)); } finally { setLoading(false); }
  }, []);

  useEffect(() => { load(); /* eslint-disable-next-line */ }, []);

  const connect = useCallback(async () => {
    if (!fSite.trim() || !fKey.trim()) { setConnectError("Enter both the store URL and the Webservice key."); return; }
    setConnecting(true); setConnectError("");
    try {
      const res = await fetch("/api/auth/connect", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ site: fSite, key: fKey }) });
      const d = await res.json();
      if (!res.ok) throw new Error(d.error || "Could not connect.");
      await load();
    } catch (e) { setConnectError(e.message || String(e)); } finally { setConnecting(false); }
  }, [fSite, fKey, load]);

  const patchItem = useCallback((type, id, patch) => {
    setData((prev) => ({ ...prev, [type]: prev[type].map((it) => (it.id === id ? { ...it, ...patch } : it)) }));
  }, []);

  const generate = useCallback(async (item) => {
    patchItem(item.type, item.id, { status: "working", error: "" });
    try {
      const res = await fetch("/api/generate", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ type: item.type, title: item.title, handle: item.handle, context: item.context, store: site.name }) });
      const d = await res.json();
      if (!res.ok) throw new Error(d.error || "Generation failed");
      patchItem(item.type, item.id, { genTitle: d.metaTitle || "", genDesc: d.metaDescription || "", status: "ready", error: "" });
      return true;
    } catch (e) { patchItem(item.type, item.id, { status: "error", error: e.message || String(e) }); return false; }
  }, [patchItem, site.name]);

  const importItem = useCallback(async (item) => {
    if (!item.genTitle) { showToast("Generate a suggestion first."); return false; }
    patchItem(item.type, item.id, { status: "working", error: "" });
    try {
      const res = await fetch("/api/import", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ type: item.type, id: item.id, metaTitle: item.genTitle, metaDescription: item.genDesc }) });
      const d = await res.json();
      if (!res.ok) throw new Error(d.error || "Import failed");
      patchItem(item.type, item.id, { status: "imported", curTitle: item.genTitle, curDesc: item.genDesc, error: "" });
      return true;
    } catch (e) { patchItem(item.type, item.id, { status: "error", error: e.message || String(e) }); return false; }
  }, [patchItem, showToast]);

  const items = data[activeTab] || [];

  const fixIssues = useCallback(async () => {
    const list = items.filter((i) => auditItem(i).hasIssue && (i.status === "idle" || i.status === "error"));
    if (!list.length) { showToast("No SEO issues to fix on this tab."); return; }
    setBusyAll(true); for (const it of list) await generate(it); setBusyAll(false);
    showToast(`Drafted fixes for ${list.length} item${list.length > 1 ? "s" : ""}. Review and import.`);
  }, [items, generate, showToast]);

  const generateAll = useCallback(async () => {
    const list = items.filter((i) => i.status === "idle" || i.status === "error");
    if (!list.length) { showToast("Nothing left to generate on this tab."); return; }
    setBusyAll(true); for (const it of list) await generate(it); setBusyAll(false);
    showToast(`Generated ${list.length} suggestion${list.length > 1 ? "s" : ""}.`);
  }, [items, generate, showToast]);

  const importAll = useCallback(async () => {
    const list = items.filter((i) => i.status === "ready");
    if (!list.length) { showToast("No reviewed suggestions ready to import."); return; }
    setBusyAll(true); let ok = 0; for (const it of list) if (await importItem(it)) ok++; setBusyAll(false);
    showToast(`Imported ${ok} of ${list.length} to PrestaShop.`);
  }, [items, importItem, showToast]);

  const counts = useMemo(() => ({
    ready: items.filter((i) => i.status === "ready").length,
    pending: items.filter((i) => i.status === "idle" || i.status === "error").length,
    issues: items.filter((i) => auditItem(i).hasIssue && (i.status === "idle" || i.status === "error")).length,
    withIssues: items.filter((i) => auditItem(i).hasIssue).length,
  }), [items]);

  const activeLabel = (TABS.find((t) => t.key === activeTab) || { label: "items" }).label.toLowerCase();

  if (connected === false) {
    return (<>
      <Topbar />
      <div className="gate">
        <span className="badge">PrestaShop SEO</span>
        <h2>Connect your PrestaShop store</h2>
        <p>Enter your store URL and a <b>Webservice key</b> (Advanced Parameters → Webservice → Add new key, with permissions for products, categories and CMS).</p>
        {connectError && <div className="gate-error">⚠ {connectError}</div>}
        <input type="text" value={fSite} placeholder="https://yourstore.com" onChange={(e) => setFSite(e.target.value)} />
        <input type="password" value={fKey} placeholder="Webservice API key" onChange={(e) => setFKey(e.target.value)} onKeyDown={(e) => { if (e.key === "Enter") connect(); }} />
        <button className="btn primary" style={{ width: "100%" }} onClick={connect} disabled={connecting}>{connecting ? "Connecting…" : "Connect store ▸"}</button>
        <p className="gate-hint">Your key is stored only in an encrypted, http-only cookie — never exposed to the browser.</p>
      </div>
    </>);
  }

  return (<>
    <Topbar />
    <div className="wrap">
      <div className="panel">
        <div className="intro">
          <span className="badge">PrestaShop SEO</span>
          <div className="intro-top">
            <div>
              <h1>Where does your store sit on SEO?</h1>
              <p>Generate Google best-practice meta titles &amp; descriptions for your PrestaShop CMS pages, products and categories. Review, edit, then import straight to your store.</p>
            </div>
            <div className="store-box">
              <div className="store-chip"><span className="dotg" style={{ background: site.name ? "#BFFC00" : "#9aa1ad" }} />{site.name || "Connected"}</div>
              <a className="btn ghost sm" href="/api/auth/logout">⇄ Disconnect store</a>
            </div>
          </div>
        </div>

        <div className="tabs">
          {TABS.map((t) => (
            <button key={t.key} className={"tab" + (t.key === activeTab ? " active" : "")} onClick={() => setActiveTab(t.key)}>
              {t.label} <span className="count">{(data[t.key] || []).length}</span>
            </button>
          ))}
        </div>

        {!loading && !loadError && items.length > 0 && (
          <div className="toolbar">
            <button className="btn primary" onClick={fixIssues} disabled={busyAll || !counts.issues}>⚡ Fix issues{counts.issues ? ` (${counts.issues})` : ""}</button>
            <button className="btn" onClick={generateAll} disabled={busyAll || !counts.pending}>Generate all{counts.pending ? ` (${counts.pending})` : ""}</button>
            <div className="spacer" />
            <button className="btn dark" onClick={importAll} disabled={busyAll || !counts.ready}>Import all ready{counts.ready ? ` (${counts.ready})` : ""} ▸</button>
          </div>
        )}

        {!loading && !loadError && items.length > 0 && (
          <div className={"summary " + (counts.withIssues ? "issues" : "clean")}>
            {counts.withIssues ? "⚠ " : "✓ "}
            <span>{counts.withIssues ? (<><b>{counts.withIssues}</b> of {items.length} {activeLabel} have SEO meta issues to fix.</>) : (<>All {items.length} {activeLabel} have healthy meta titles &amp; descriptions.</>)}</span>
          </div>
        )}

        {loading && <div className="loading"><div>Loading your store content</div><div style={{ marginTop: 10 }}><span className="dot" /><span className="dot" /><span className="dot" /></div></div>}
        {loadError && <div className="empty">Couldn&apos;t load store content.<br /><small>{loadError}</small><div style={{ marginTop: 14 }}><button className="btn" onClick={load}>Retry</button></div></div>}
        {!loading && !loadError && items.length === 0 && <div className="empty">No {activeLabel} found (or the key lacks permission for this resource).</div>}

        {!loading && !loadError && items.map((item) => (
          <ItemCard key={item.id} item={item} onGenerate={() => generate(item)} onImport={() => importItem(item)} onEdit={(f, v) => patchItem(item.type, item.id, { [f]: v })} />
        ))}

        <div className="foot">Boko Digital · Strategize. Execute. Deliver. — meta written clear, concise, active voice.</div>
      </div>
    </div>
    {toast && <div className="toast">{toast}</div>}
  </>);
}

function ItemCard({ item, onGenerate, onImport, onEdit }) {
  const a = auditItem(item);
  const tLen = (item.genTitle || "").length;
  const dLen = (item.genDesc || "").length;
  const showFields = item.status === "ready" || item.status === "imported" || (item.status === "working" && item.genTitle);
  const stMap = { idle: ["st-idle", "Not generated"], working: ["st-working", "Working…"], ready: ["st-ready", "Ready to review"], imported: ["st-imported", "Imported ✓"], error: ["st-error", "Error"] };
  const st = stMap[item.status] || stMap.idle;
  let idleLabel = "⚡ Generate";
  if (item.curTitle || item.curDesc) idleLabel = a.hasIssue ? "⚡ Fix meta" : "⚡ Suggest improvement";
  const chip = (o) => (<span className={"audit-chip " + (o.state === "ok" ? "good" : "bad")}>{o.state === "ok" ? "✓" : "⚠"} {o.msg}</span>);

  return (
    <div className={"card" + (item.status === "imported" ? " imported" : "")}>
      <div className="card-head"><div><p className="card-title">{item.title}</p><div className="card-handle">/{item.handle}</div></div><span className={"status-pill " + st[0]}>{st[1]}</span></div>
      <div className="audit">{chip(a.title)}{chip(a.desc)}</div>
      {item.curTitle || item.curDesc ? (
        <div className="current"><b>Current meta title:</b> {item.curTitle || <i>none</i>}<br /><b>Current meta description:</b> {item.curDesc || <i>none</i>}</div>
      ) : (<div className="current">No meta title or description set yet.</div>)}
      {showFields && (<>
        <div className="field"><label>Meta title <span className={"counter " + counterClass(tLen, TITLE_MIN, TITLE_MAX)}>{tLen} / {TITLE_MAX}</span></label>
          <textarea className="title" value={item.genTitle} onChange={(e) => onEdit("genTitle", e.target.value)} /></div>
        <div className="field"><label>Meta description <span className={"counter " + counterClass(dLen, DESC_MIN, DESC_MAX)}>{dLen} / {DESC_MAX}</span></label>
          <textarea className="desc" value={item.genDesc} onChange={(e) => onEdit("genDesc", e.target.value)} /></div>
      </>)}
      {item.status === "error" && item.error && <div className="err">⚠ {item.error}</div>}
      <div className="card-actions">
        {item.status === "idle" && <button className="btn primary sm" onClick={onGenerate}>{idleLabel}</button>}
        {item.status === "ready" && (<><button className="btn dark sm" onClick={onImport}>Import ▸</button><button className="btn ghost sm" onClick={onGenerate}>↻ Regenerate</button></>)}
        {item.status === "imported" && (<><button className="btn ghost sm" onClick={onGenerate}>↻ Regenerate</button><button className="btn dark sm" onClick={onImport}>Re-import ▸</button></>)}
        {item.status === "error" && (<><button className="btn primary sm" onClick={onGenerate}>↻ Try again</button>{item.genTitle && <button className="btn dark sm" onClick={onImport}>Import ▸</button>}</>)}
        {item.status === "working" && <button className="btn sm" disabled>Working…</button>}
      </div>
    </div>
  );
}
