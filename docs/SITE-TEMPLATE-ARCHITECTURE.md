# Nathamuni Platform — Business Site Template Architecture

The development architecture for every business site hosted as
`<business>.nathamuni.com`. First implementation: `sites/sundaram-coffee/`.
Goal: **a new business site = one JSON file + a theme hue + photos.** No
business-specific code, ever.

## 1. Monorepo layout

```
sites/<slug>/                  one directory per business
  CLAUDE.md                    business context for agents (domain, rules)
  content/business.json        ALL business content (single source of truth)
  lib/business.ts              typed loader + TS interfaces for the JSON
  app/                         Next.js App Router, static export
    layout.tsx                 fonts, metadata, theme CSS vars from JSON
    page.tsx                   assembles sections; renders only what has data
    globals.css                design tokens + section styles
  components/sections/         reusable section components (see §4)
  components/art/              inline SVG illustration set (filler imagery)
  public/images/               real photos when the business provides them
  wrangler.jsonc               assets-only Worker + custom-domain route
packages/ui/                   shared components — extract only when the 2nd
                               site proves what is actually reusable
```

## 2. Data model (`content/business.json`)

Every field optional except `name`. Sections render **only when their data
exists** — an empty template renders a valid one-screen site.

```
name, tagline, description, domain, themeHue
features [ string ]              ← which modules this site turns on (§4)
about { heading, body }
contact { phone, email, whatsapp?, address?, mapUrl?, hours? }
whyUs [ { title, detail } ]
categories [ { name, intro, products [ { name, description?,
             variants [ { label, price } ] } ] } ]
gallery [ { src, alt } ]         testimonials [ { quote, author } ]
faq [ { q, a } ]                 social { instagram?, youtube?, ... }
notes [ string ]
```

Rules: prices/contacts live ONLY here (never in components); placeholder
values must be marked `PLACEHOLDER` and never deployed to production DNS.

## 3. Rendering model

- Next.js static export (`output: 'export'`), same pinned versions as
  nathamuni-com. Server components only; a section may opt into client JS
  only for real interactivity (e.g. FAQ accordion).
- Plain CSS with custom properties (no Tailwind in template sites — keeps
  the template portable and the build light).
- Mobile-first, no horizontal scroll, 44px+ touch targets,
  `prefers-reduced-motion` honored on all ambient motion.

## 4. Section registry + feature modules (the modular core)

Everything a site can do is a **module**: a self-contained unit with up to
three parts — a data slice in `business.json`, a section component, and
(rarely) a Worker route. A site enables modules purely through data:

```json
"features": ["catalogue", "why-us", "contact-cta", "enquiry-email"]
```

`page.tsx` iterates a **section registry** — an ordered map of
`feature-name → component` — and renders a module only when it is both
listed in `features` AND its data slice exists. Adding a capability to the
platform = adding one entry to the registry; adding it to a business = one
string in its JSON. No site ever forks template code for a feature.

**v1 modules (built now):** hero · about · catalogue · why-us · contact-cta
(call + email buttons) · notes · footer (always on, platform branding).

**Planned modules (drop-in later, no refactor):**
- `enquiry-email` — cart-less "send us your list" form → Worker route →
  Cloudflare Email Routing to the owner's inbox
- `whatsapp-cta` — wa.me deep link from `contact.whatsapp`
- `gallery` / `testimonials` / `faq` / `hours-map` — pure data sections
- `offers` — announcement strip (festival pricing, seasonal stock)
- `ordering-lite` — pick items → prefilled email/WhatsApp message (still no
  payments, per platform rule)
- `blog` — markdown posts for SEO
- `analytics-lite` — privacy-friendly counter via a Worker, no cookies

Contract for every module: null-safe (missing data = section absent, never
an error), token-styled only (no hardcoded colors), zero client JS unless
the feature is genuinely interactive, and self-contained (deleting a module
never breaks another).

## 5. Theming

`themeHue` (0–360) drives an HSL token scale in `layout.tsx`:
`--brand`, `--brand-soft`, `--brand-deep`, `--surface`, `--ink`, plus a
light/dark-aware neutral ramp. Fonts chosen per business via `next/font`
(display + body pair). Changing hue + fonts = a visually distinct site with
zero component edits.

## 6. Imagery strategy

Until the business provides photos: a designed **inline SVG illustration
set** in `components/art/` (product-category motifs, patterns, textures) —
crisp at any size, zero network requests, looks intentional rather than
stock. Real photos drop into `public/images/` and take over via
`gallery`/product `image` fields.

## 7. SEO

Metadata + OpenGraph from JSON; `LocalBusiness` JSON-LD (with address/hours
when provided); robots + sitemap; canonical to the subdomain.

## 8. Quality gate (per site, before any PR)

`npm run lint && npm run type-check && npm run build` locally — root CI only
covers nathamuni-com today; add a per-site CI job when a site gains tests.
Design review against the ui-ux-pro-max checklist (contrast 4.5:1, focus
states, touch targets, reduced motion).

## 9. Deployment

- **Path A (instant):** `npx wrangler deploy` in the site dir — assets-only
  Worker, `routes: [{ pattern: "<slug>.nathamuni.com", custom_domain: true }]`
  auto-creates DNS. Needs one-time `wrangler login`.
- **Path B (hands-off):** Cloudflare Workers Builds project per site (root
  dir `sites/<slug>/`, build `npm run build`) — auto-deploys on push to main.
- Standard: A to launch, then B so future content edits self-deploy.
- Email: Cloudflare Email Routing gives `orders@<slug>.nathamuni.com` →
  personal inbox, free.

## 10. New-business checklist

1. `cp -r` the newest template site → `sites/<new-slug>/`; delete old content
2. Write `CLAUDE.md` (business context FIRST — platform rule) and
   `content/business.json`
3. Pick `themeHue` + font pair; drop photos into `public/images/`
4. Local quality gate (§8) → PR → merge
5. Deploy Path A; attach Email Routing; hand the owner their URL
