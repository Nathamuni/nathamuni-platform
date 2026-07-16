# Sundaram Coffee Works — site build plan (DOCUMENTED, NOT STARTED)

Status: **BUILD IN PROGRESS (2026-07-16)** — owner approved: full build with
designed SVG filler imagery, subagent implements per
`docs/SITE-TEMPLATE-ARCHITECTURE.md` (modular feature-registry version), main
agent reviews, commits, PRs. Deployment still blocked on owner items below.

## What this is
First demonstration business site of the platform: `sites/sundaram-coffee/` →
`sundaram-coffee.nathamuni.com`. Per the owner's project prompt (see
`sites/sundaram-coffee/docs/initial-message-abt-scw-with-productdetailes.txt`):
static-first, mobile-first, cheap to run, **data-driven** — the site code stays
generic; each future business only supplies its own data file.

## Architecture decided
- Next.js static export (same stack/versions as nathamuni-com: next 16.2.10,
  react 19.2.4), plain CSS (no Tailwind — keeps the template light)
- **All business content in `content/business.json`** — draft already written:
  `sites/sundaram-coffee/docs/business-data-draft.json` (full catalogue: 2
  coffees with pure/80:20 blend prices, 15 pickles, 5 appalam/fryum lines,
  why-us points, notes)
- Components read only from that JSON → future sites = new JSON + new theme hue
- Long-term: extract shared sections to `packages/ui/` once a second business
  site exists (don't abstract from one example)

## Page sections (v1, single page)
1. Hero — misty text on the left per owner's vision; CSS steam/gradient effect
   as stand-in until a coffee video is generated (owner wants a generated video
   eventually, slightly transparent on the right)
2. About the business
3. Products — three category sections from JSON (Coffee / Pickles / Appalam)
4. Why choose us (4 points from JSON)
5. Contact — call + email buttons only, **no payments** (owner requirement);
   checkout-style enquiry can send an email later via Cloudflare Email Routing
6. Footer with platform branding ("A nathamuni.com site")

Deferred until owner provides material: photos/gallery, testimonials, Google
Maps pin, business hours, WhatsApp number, FAQ, social links.

## Deployment (two options, recommended = both)
- **A (instant): direct wrangler deploy** — `wrangler.jsonc` with assets-only
  Worker named `sundaram-coffee` + `routes: [{ pattern:
  "sundaram-coffee.nathamuni.com", custom_domain: true }]`. Needs one-time
  `wrangler login`. Fastest path to live.
- **B (hands-off): Cloudflare Workers Builds** — connect the repo in the
  dashboard as a second project, root dir `sites/sundaram-coffee/`, build
  `npm run build`; auto-deploys on every push to main (same as nathamuni-com).
- Best approach: A now to go live, then B so future edits deploy themselves.

## Blockers needing the owner
1. Real phone number + business email (draft JSON has marked PLACEHOLDERs —
   never publish them). Cloudflare Email Routing can give
   orders@sundaram-coffee.nathamuni.com forwarding to a personal inbox.
2. Product/shop photos (or approval to generate AI imagery).
3. Confirmation of the hero: CSS steam effect now, real video later?

## CI note
`.github/workflows/ci.yml` only builds sites/nathamuni-com — adding this site
won't break CI, but it also isn't protected by it; verify with local
lint/type-check/build before any PR (and later add a second CI job).
