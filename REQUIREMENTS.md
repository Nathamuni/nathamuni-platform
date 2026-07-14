# nathamuni.com — Consolidated Requirements

Everything Nathamuni has asked for across the whole project, in one place.
Status marks: ✅ shipped & verified live · 🔨 in progress · ⏳ waiting on owner input · 🗓️ planned.

## 1. Purpose & positioning

- ✅ nathamuni.com is the **organized, searchable home** for all content — Instagram is
  where content is posted; the site is where people *find* it without endless scrolling.
- ✅ Personal brand hub for: Distinguished Engr | Author | Calisthenics | Meditation |
  Memer | AI Architect | Generalist ("☬ Fear lives in one place only... Thats in you Mind🗿").
- ✅ Free-first: no paid hosting, no database, no auth. Cloudflare (Workers static assets)
  on the apex domain, deployed automatically from `main`.
- Future: platform monorepo also hosts business sites (sundaram-coffee etc.) on subdomains.

## 2. Content & data

- ✅ **Complete Instagram library on the site**: all reels AND photo posts (161+ items),
  each with thumbnail, title, category, tags, description, date, link to Instagram.
- ✅ **Zero manual URL work**: owner never supplies per-video URLs again — the Instagram
  API (Meta developer app, Development mode) is the source of truth.
- ✅ **Auto-sync**: new posts/reels appear on the site automatically (daily GitHub Action
  + manual Run-workflow button). Draft titles/categories derived from captions.
- ✅ **Stories/“highlights”**: Instagram deletes stories in 24h and has no highlights API →
  the site keeps its own permanent archive (41 backfilled from Meta export; daily sync
  captures new ones). Shown on the homepage strip + /moments page.
- ✅ 5 curated categories with accent colors: Mind & Discipline, Calisthenics & Fitness,
  AI & Builds, Humor & Tamil, Life & Moments.
- ⏳ **Owner refinement loop**: review Excel (`~/Downloads/nathamuni-video-review-v2.xlsx`,
  all 161 rows, clickable links + empty description column). Owner fills after watching;
  agent bulk-imports. Extra detail (better titles, key lessons, categorization) welcome
  any time — the more provided, the richer detail pages become.
- 🗓️ Future sections the site must keep room for: **Blog, Books/Writings, Projects**
  (placeholder pages exist; owner will supply book content later).

## 3. Search

- ✅ Instant keyword search across title/description/category/tags, with synonym
  expansion (e.g. “exercise” → workout/calisthenics/fitness), word matching, ranking.
- ✅ **Natural-language semantic search** on Cloudflare Workers AI (`bge-m3`,
  multilingual — English AND Tamil queries), zero API keys, zero visitor download,
  blended into results after keyword hits. Clickable tags/categories deep-link
  (`/videos?category=…&tag=…&q=…`).

## 4. Design & UX (the standing bar)

- **Mobile responsiveness is non-negotiable — “no compromising that.”** Every change is
  judged from a real phone user's perspective first.
- ✅ Vibrant, colorful identity (owner rejected flat black): deep indigo base + aurora
  gradients (violet/magenta/cyan), per-category accent colors, gradient hero text.
- ✅ Premium glassmorphism, hover-lift cards with category-hued glows, 3D pointer tilt +
  glare (desktop), parallax hero orbs, entrance animations — all `prefers-reduced-motion` safe.
- ✅ Hero video portrait ("kinetic portrait"): dual alpha-WebM hover effect on desktop;
  **mobile gets a 24KB static image** (owner flagged video too heavy — resolved).
- 🔨 **v6 (current)**: mobile is still “fully jammed” → decongest layout; moments strip
  must be **cards (square-ish, flowing), not circles**; animation quality raised;
  colors/gradients “picture perfect”; everything fast, easy to look at, easy to follow.
- ✅ SEO/go-public layer: per-item share cards (real thumbnails), sitemap, robots,
  canonical URLs, Person + VideoObject structured data; lightweight loading
  (lazy images, content-visibility, KB-scale hero).

## 5. Automation & operations

- ✅ Meta developer app (Development mode — correct permanent state; **never** submit
  App Review / advanced access / Live mode: that's what caused the API block).
- ✅ Instagram token: 60-day expiry defeated — weekly workflow refreshes and re-stores
  it using the owner's GitHub PAT. Verified end-to-end. PAT renewal due ~Jul 2027.
- ✅ Repo/scripts: `instagram-sync.mjs` (media+stories), `import-export-stories.mjs`
  (export backfill), CI (lint/type-check/test/build) gating every merge.
- ⏳ **/admin panel** (edit titles/categories/featured/thumbnails from phone): planned
  via Sveltia CMS; needs owner to create a GitHub OAuth app (2-min, guided) first.
- Owner-facing rule of thumb: GitHub mobile app = current admin (Run workflow, edit files).

## 6. Owner-generated imagery (planned integration)

- ⏳ Owner will generate 9 AI images (with own face) per `sites/nathamuni-com/docs/IMAGE-BRIEF.md`
  (exact prompts, aspect ratios, filenames; also viewable as HTML). Drop into
  `sites/nathamuni-com/public/images/generated/` → agent wires: category tiles become
  clickable image cards, hero background, about portrait, OG share banner, books teaser.
- Custom per-video thumbnails may replace auto-extracted frames later (same filename swap).

## 7. Explicit owner questions — answered

- **“Will I need to fix things on the Meta site again?”** No — recurring visits are NOT
  needed. Development mode + the self-refreshing token is the permanent steady state.
  Only two ways it breaks, both self-inflicted and now documented: clicking into App
  Review/Live/advanced-access flows (don't), or revoking the app. One exception:
  ~July 2027 the GitHub PAT needs one regeneration.
- **“How long after I post does it appear?”** Automatically: within 24h (daily sync,
  ~08:00 IST). Instantly on demand: GitHub app → Actions → Instagram Sync → Run
  workflow (~3 min to live). No extra information required per post — caption is enough;
  richer captions ⇒ better auto-titles/categories.
- **“Do reels/stories/highlights have proper detail & categorization?”** Reels/posts:
  yes — auto-drafted from captions (category guess + tags + title), owner-refinable via
  the Excel loop. Stories: date + poster + playable clip (Instagram provides no captions
  for stories; owner can add titles later if desired).

## 8. v8 — accuracy & visibility round (2026-07-09)

- 🔨 **Thumbnail peek**: hover (desktop) / press-and-hold (mobile) any video card or
  moment shows the poster slightly bigger and FULLY visible (uncropped) — video grid,
  homepage moments strip, /moments wall.
- 🔨 **Owner imagery live**: 3 of 9 generated images integrated as category tile art
  (cat-mind, cat-fitness, cat-ai); tiles are uniform 4:5 art cards with gradient/icon
  fallback so the remaining 6 drop in with a one-line change.
- 🔨 **Card crop relaxed**: media aspect 9/12 → 9/14 so 9:16 posters lose far less.
- ⏳ **Genuine-data pipeline**: About/bios are rewritten ONLY from the owner's real
  data. Owner runs the master data-retrieval prompt (docs/creator-hub.html) in
  ChatGPT + Gemini, returns the dossier files → agent rebuilds `lib/profile.ts`,
  /about, metadata bios with zero invented facts.
- ✅ **Captions vs transcripts (answered)**: captions suffice for baseline browse +
  search; richer per-video descriptions/transcripts (via the review Excel) upgrade
  search and detail pages; auto-transcription is a possible future feature.
- 📄 **Referable requirements doc**: `sites/nathamuni-com/docs/creator-hub.html` —
  self-contained HTML (requirements, status, all copyable prompts), lives in the repo.

## 9. v9 — hero & motion round (2026-07-09, same day)

- 🔨 **Moments lightbox navigation**: ‹ › arrows + keyboard arrows to move between
  stories; when a clip ends it auto-advances to the next (closes after the last).
- 🔨 **Hero v2 — no video**: kinetic video portrait removed entirely (~8.4 MB);
  static portrait presented with aurora ring + float + 3D pointer tilt. Text
  reordered — roles eyebrow first, "Nathamuni" as the headline, the fear quote as
  a styled accent line (owner: quote must NOT be the first thing).
- 🔨 **More 3D + auto motion on home**: self-drifting orbs, 3D scroll entrances for
  home sections; tasteful, reduced-motion-safe, cheap on mobile ("don't make this
  site slopey").
- 🔨 **Gradient-glass polish**: glass plates behind category-tile labels (text was
  unreadable over tile art); shiver press animation on tiles/cards; hover peek
  opens after 0.6s with a smooth pop.
- ✅ **Prompt log**: every owner directive is appended to `memory/prompt-log.md`
  (standing rule, also stored in agent memory).

## 10. v10 — the experience overhaul (2026-07-10)

- 🔨 All 9 owner images live (6 new: humor/life tiles, hero-bg, about-portrait,
  og-banner, books-teaser).
- 🔨 Hero v3: scroll-stopping full-bleed aurora + real portrait, cursor-following
  color glow (desktop), 3D everywhere tasteful, fluid; mobile pristine.
- 🔨 Tiles/cards: label-art mismatch fixed, bigger, elegant "Start here" grid.
- 🔨 Moments poster bug fixed (ffmpeg silent failure) + sync hardened + UI fallback.
- 🔨 About page complete rework from verified data (docs/content-source.md).
- 🔨 Projects page: real case studies (BrainBox, research pipeline, Android
  automation, meeting intelligence, instauser-understanding, Synergy, SMILES…).
- 🔨 Blog: researched long-form posts with references (honest framing, his voice).
- 🔨 /stats: public library statistics page; sync extended to pull like/comment
  counts (graceful if unavailable).
- ✅ Owner data pipeline complete: dossiers + resume + about-me delivered and
  distilled into docs/content-source.md (sanitized; hard exclusions listed).
- Standing: mobile must never break; no invented facts; sensitive facts excluded.

## 11. v11–v12 — polish + journey + AI twin (2026-07-11)

- 🔨 v11 polish: cursor effect behind content (was hiding details), vibrant
  bottom-lane kitty, premium /stats redesign, tile label contrast, moments strip
  uniformity, books banner crop, blog text hardening, moments thought-cards +
  end-cap, mobile humor-tile crop. About: current = software developer in
  Chennai; book date confirmed November 2025.
- 🔨 v12 /journey: animated decision-map page (ideology, policies, dated
  decisions) + dreams/goals/milestones tracker (lib/journey.ts, owner-editable).
- 🔨 v12 /ask: "Ask Nathamuni" AI twin on Cloudflare Workers AI (free tier, no
  paid key) — persona in his voice, grounded ONLY in sanitized verified facts +
  site content, per-IP rate limiting, refusal on private topics.
- ⏳ GitHub public-stats feed (weekly action) — pending owner's GitHub username
  confirmation. Rejected for now: Meta insights (API-block risk), Play scraping
  (fragile), fitness OAuth (infrastructure).

## 12. v21 — courses, sessions, nav regroup (2026-07-14)

- 🔨 **/courses**: 5 structured paths assembled from existing verified content
  (Consistency System, Full-Body Flexibility, Calisthenics Foundations,
  Diet Tested, Local-First AI Starter) — theory blocks labeled by credibility
  ("☬ Tested on myself" / "Research-backed" w/ live-verified refs / "Standard
  practice"), his real videos embedded, action checklists (localStorage),
  health disclaimers.
- 🔨 **/sessions**: 4 runnable protocols (Diet Reset w/ blood-panel baseline,
  Unlock Your Body, The 7-Day Reset from the book, Ship Local AI in a
  Weekend) — steps + checkpoints + metrics tables + step tracker.
- 🔨 **Nav regrouped** (owner agreed 11 flat links = janky): 8 primary visible
  + About ▾ dropdown (About/Journey/Projects/Stats/Books); tab bar unchanged;
  footer + sitemap wired (sitemap also gained missing /journey, /ask).
- Distinction (owner asked): Course = become (learn), Session = run (bounded
  protocol with metrics). Cross-linked.

## 13. Standing working agreements

- Ship via feature branch → tests → PR → CI green → merge → verify LIVE on nathamuni.com.
- Never expand Meta permissions; never scrape; visitor traffic never touches the
  Instagram API. Secrets only in GitHub encrypted secrets.
- Documentation lives in `sites/nathamuni-com/docs/` (roadmap, playbooks, brand system,
  growth ideas, tech backlog, image brief); progress ledger in `.superpowers/sdd/`.
