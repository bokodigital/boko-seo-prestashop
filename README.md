# Boko - PrestaShop SEO Meta Studio

A Next.js app that generates **Google best-practice meta titles & descriptions** for your PrestaShop
**CMS pages, products and categories**, lets you review/edit them, and writes them back to your store.
Same Boko design as the Shopify and WordPress versions. Meta is generated with **free, rule-based
logic** (no AI key).

It connects through PrestaShop's native **Webservice API** with a Webservice key - no module to install.

## Setup

### 1. Enable the Webservice + create a key
1. PrestaShop admin → **Advanced Parameters → Webservice** → set **Enable PrestaShop Webservice = Yes**.
2. **Add new Webservice key** → Generate a key. Under **Permissions**, grant at least **View (GET)** and
   **Modify (PUT)** for: `products`, `categories`, `content_management_system`.
3. Copy the key.

### 2. Deploy (GitHub + Vercel)
1. Push this folder to GitHub → import in Vercel (Next.js auto-detected).
2. Add one env var: `SESSION_SECRET` = a long random string (`openssl rand -hex 32`).
3. Deploy.

### 3. Connect
Open the app → enter your **store URL** + **Webservice key** → Connect. Your CMS pages, products and
categories load in, with current meta and health flags.

## What it covers
- **CMS pages**, **Products**, **Categories** — read current `meta_title` / `meta_description`,
  generate + review, and write back.
- Per-item health flags (missing / too long / too short by Google lengths), Fix-issues, Generate-all,
  Import-all.

## Notes & limits
- **No blog/posts:** PrestaShop core has no blog. Posts come from third-party modules (PrestaBlog,
  Simple Blog, etc.) that don't share a standard Webservice resource, so they aren't included.
- **Multi-language:** reads/writes the **first (default) language** value of each meta field.
- **Writes:** PrestaShop requires sending the full resource on PUT. The app fetches the resource as XML,
  edits the meta fields, strips a few read-only product nodes, and PUTs it back. If your PrestaShop
  version rejects a specific field, the error is surfaced in the card - tell us and we'll adjust the
  read-only strip list.
- Reads up to 100 items per type (raise the limit in `lib/prestashop.js`).
- The Webservice must be reachable over HTTPS and the key needs GET+PUT on those resources.

## Tech
Next.js 14 (App Router) · React 18 · PrestaShop Webservice API (JSON read / XML write) · Poppins via `next/font`.
