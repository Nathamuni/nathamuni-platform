# Tech Backlog — engineering upgrades

Engineering-only backlog: what to build, why, and how it fits the
static-export constraint. Content/growth tactics live in
[GROWTH-IDEAS.md](./GROWTH-IDEAS.md); phased sequencing lives in
[ROADMAP.md](./ROADMAP.md). Ordered by priority, not size.

**Hard constraints for every item:** free-first, no database, no auth, no
API routes — `next.config.ts` sets `output: 'export'` and Cloudflare
Workers serves static assets only. Anything needing server logic is a
separate Cloudflare Worker, not a Next.js route.

## 1. Per-category static pages (`/category/<slug>`)

Real routes per category (`/category/mind-discipline`, etc.) instead of
`/videos?category=Mind+%26+Discipline`. Query params aren't reliably
indexed; five real URLs with their own titles/meta is five more chances to
rank, and it gives GROWTH-IDEAS' "series landing links" a canonical home.

**Sketch:** `app/category/[slug]/page.tsx` with `generateStaticParams()`
over the 5 categories (add a `slug` to `CATEGORY_META` in
`lib/categoryMeta.ts`). Reuse the grid from `app/videos/page.tsx` filtered
by category. Keep `/videos?category=` working for existing links. Add the
5 routes to `app/sitemap.ts`. **Effort: S**

## 2. Transcript ingestion

Pull the `.srt` files Meta's export includes for 30+ reels; render as a
collapsible block on the matching `/videos/[slug]` page. Captions are
short; transcripts are hundreds of words of real Tamil+English spoken
content no competitor can scrape — the highest-leverage SEO move
available given the content already exists.

**Sketch:** One-off script matches `reels.json`'s `subtitles.uri` per reel
to `lib/videos.json` by Instagram URL/shortcode, parses the `.srt`, strips
timestamps, joins cues into paragraph text, writes to a new optional
`transcript` field (or a sibling `lib/transcripts.json` to keep
`videos.json` lean). Render in a `<details>` block — it's in the DOM
either way, so SEO value doesn't depend on it being expanded. Build-time,
one-time transform. **Effort: M**

## 3. Semantic search (v2 of search)

Meaning-based search ("videos about staying consistent") layered on top
of — not replacing — the current keyword search
(`searchAndFilterVideos`). 79 videos is small enough that keyword search
still works; this is a quality upgrade for once the library doubles, not
an urgent gap.

**Sketch, tradeoffs included:** Precompute an embedding per video at
build time into a static `embeddings.json`. The open question is where
the *query* gets embedded — no free path avoids this entirely. Either run
a small model client-side via transformers.js (few-MB download, needs a
web worker to avoid UI jank) for both build and query vectors — fully
static and free — or call a free-tier embedding API at build time only,
which leaves no way to embed a live query without a browser model or a
live API call (and live calls violate "no API routes"). Recommend the
client-side model. Keyword search stays the default and the fallback.
**Effort: L**

## 4. OG image generation

Branded 1200×630 share cards (thumbnail + title + category accent color)
per video, replacing the raw 9:16 thumbnail in link previews. GROWTH-IDEAS
already tracks share-card correctness as a QA bar; a vertical Instagram
frame in a link preview looks unfinished next to a designed landscape card.

**Sketch:** Build-time script using `satori` + a rasterizer (`resvg`/
`sharp`) rendering thumbnail + title + the category's `hue` (from
`lib/categoryMeta.ts`) into `public/og/<id>.png` — 79 static files, zero
runtime cost. Point `generateMetadata`'s `openGraph.images` at the
generated file. Run as a `prebuild` step or manually. **Effort: M**

## 5. RSS/Atom feed

`app/feed.xml/route.ts` — a static feed of all videos, newest first.
Cheap distribution channel and the format most cross-posting/aggregator
tools expect as input; complements, doesn't replace, the newsletter idea.

**Sketch:** Route handler with `export const dynamic = 'force-static'`
(same pattern as `app/sitemap.ts` / `app/robots.ts`), returning
`application/xml` built from `getAllVideos()`. **Effort: S**

## 6. PWA (installable app shell)

Manifest, icon set, minimal offline shell so the site installs to a phone
home screen. Retention polish, not an acquisition lever — lower priority
than anything SEO-facing.

**Sketch:** `public/manifest.json` + icons + `<link rel="manifest">` in
`app/layout.tsx`. Static export generates no service worker for you, so
it'd be a hand-written `public/sw.js` (cache the shell + visited
thumbnails, network-first HTML), registered from a client component. Keep
it minimal — a stale-serving broken service worker is worse than none.
**Effort: M**

## 7. Cloudflare Web Analytics beacon

One `<script>` tag in `app/layout.tsx` for Cloudflare's free, cookieless
Web Analytics — the only way to know which videos/categories people
actually open. Already flagged in ROADMAP.md and GROWTH-IDEAS.md as a
Phase 2 action.

**Sketch:** User enables Web Analytics for the zone in the dashboard,
which issues a beacon token. Store as `NEXT_PUBLIC_CF_BEACON_TOKEN`,
render the beacon only when set. Blocked on the user generating the
token. **Effort: S**

## 8. Newsletter form

Email capture for GROWTH-IDEAS' "idea of the week" newsletter. Static
export has no API routes, so a form can't post anywhere on this domain —
needs an external service or a sibling Worker.

**Sketch, two options:** (a) Buttondown/Substack embed — hosted form
posts to their service, no code here beyond the snippet, free tier fits
current scale. (b) A standalone Cloudflare Worker + KV (own
`wrangler.toml`, deployed separately from the Next app) exposing `POST
/subscribe`, called cross-origin via `fetch()` — still free, but a second
deployable to maintain plus manual export of KV data. Recommend (a)
first; move to (b) only with a real reason to own the list directly.
**Effort: S (embed) / M (Worker+KV)**

## 9. Instagram embed on detail pages

Render the actual post via Meta's public `embed.js` on `/videos/[slug]`,
instead of (or alongside) the local thumbnail + link. **Why deferred in
v1:** no API key needed, but it's still an external, unversioned
third-party script Meta can change without notice — a reliability/ToS
risk on pages meant to be permanent, the same reasoning behind the v1
"no API, no scraping" rule.

**Sketch if revisited:** Lazy-load `embed.js`, render the oEmbed
`<blockquote>` per `instagramUrl`, keep the local thumbnail as a fallback
for load failures. **Revisit only if** traffic justifies it and analytics
(#7) show the current pattern underperforming. **Effort: S to build,
ongoing maintenance risk is the real cost**

## 10. Video hosting upgrade path (self-hosted via R2)

Upload clips to Cloudflare R2 and play them in-page with a native
`<video>`, so visitors watch without leaving the site. Every click-out to
Instagram hands a visitor to a competing feed; copyright is a non-issue
since it's the user's own content.

**Sketch:** R2's free tier (10 GB, no egress fee) comfortably covers 79
short clips. Upload to a bucket, serve via R2.dev or a bound custom
domain. Detail page gets a `<video>` (poster = existing thumbnail),
Instagram link kept as secondary CTA. Bandwidth, not storage, is what to
watch — put Cloudflare's edge cache in front of the bucket. **Effort: M**

## 11. E2E smoke tests (Playwright against `out/`)

Playwright suite that builds, serves `out/`, and asserts the critical
paths: homepage renders, `/videos` lists all videos, search/filter
works, a detail page renders correctly. The existing Vitest suite covers
unit logic (`videos.test.ts`, `social.test.ts`) but nothing proves the
*built, exported* site — the artifact that's actually deployed — works.

**Sketch:** `playwright.config.ts` with a `webServer` running `npx serve
out`. Assert hero renders on `/`, `/videos` shows
`getAllVideos().length` cards, search changes result count, a detail page
has its title and JSON-LD tag. Add as a CI step after `npm run build`.
**Effort: M**

## 12. Lighthouse CI budget

CI check that fails the build if mobile Lighthouse performance drops
below 90 — ROADMAP.md's recurring bar, currently checked manually. As
thumbnails, transcripts, and OG images pile on, image weight can regress
silently.

**Sketch:** `@lhci/cli` with `lighthouserc.json` asserting `performance`
≥ 0.9 on mobile preset against 3–4 URLs (homepage, `/videos`, one detail
page), served from `out/` — can share the serve step with item 11. Add as
a CI job after build. **Effort: S**

## Sequencing suggestion

Do **#1 and #2 together first** — both are pure SEO surface area on data
that already exists (category names, `.srt` files), both are
static-export-native, and they compound: more indexed pages plus more
indexed text per page is the biggest lever available. Do **#4 (OG
images)** right after, since it makes every link shared from the newly-
indexed pages look correct. **#5 (RSS)** and **#12 (Lighthouse CI)** are
small and low-risk — slot them in opportunistically. **#11 (E2E tests)**
should land before #3, #6, or #10, since those touch routing/rendering/
media in ways that regress silently with no safety net today. **#7
(analytics)** is a one-line change gated only on the user generating a
token — ship it whenever the token shows up. Hold **#3, #6, #9, and #10**
— the heaviest, most speculative items — until #7's data justifies them;
#10 is the highest-value retention lever here but also the most work,
worth it once traffic justifies not sending visitors to Instagram. **#8
(newsletter)** is cheap and independent — ship the embed whenever there's
bandwidth to write the first issue.
