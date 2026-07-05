# nathamuni.com v1 — Design Spec

Date: 2026-07-05
Status: Approved by user, pending implementation plan

## Goal

Build v1 of `nathamuni.com`, a personal creator content hub that organizes Nathamuni's
Instagram content into a searchable, categorized library — instead of the endless-scroll
Instagram feed. v1 must be free-first: no database, no auth, no paid hosting, no AI/Instagram
API keys.

## Location & repo

Lives inside the existing `Nathamuni-website` monorepo (no separate repo was ever actually
created — the URL initially given for "the separate repo" pointed at this same monorepo).
New site at `sites/nathamuni-com/`, following the same harness pattern as
`sites/sundaram-coffee/` (own `CLAUDE.md`, own `npm run dev/build/lint/type-check`,
independent Cloudflare Pages project pointed at this directory as build root).

Decision may be revisited later (split into its own repo via git subtree) without losing
work, but is out of scope for v1.

## Stack

- Next.js (App Router) + TypeScript + Tailwind CSS
- Static export (`output: 'export'`) — no server runtime, no API routes, no database, no auth
- Static JSON data file (`lib/videos.json`), typed loader in `lib/videos.ts`
- Search and category filtering run entirely client-side (`useState` + `Array.filter`) —
  dataset is 6 items, no need for a search index or library
- No component library (shadcn, MUI, etc.) — the glassmorphic look is custom Tailwind, and a
  component library's default visual language would need to be fully re-themed anyway
- Deployed to Cloudflare Pages, build root `sites/nathamuni-com/`, output dir `out/`

## Content: `lib/videos.json`

Schema:

```ts
{
  id: string                    // slug, used in /videos/[slug]
  title: string
  instagramUrl: string
  youtubeUrl?: string
  thumbnail: string | null      // null → premium placeholder card art
  category: string
  tags: string[]
  problemSolved: string         // the "why watch this" hook
  shortDescription: string      // card + list view copy
  detailedDescription: string   // detail page copy
  keyLessons?: string[]
  featured: boolean
  publishedDate: string         // ISO date, best-guess where unknown
}
```

Source data: user provided a WhatsApp-style dump of 8 message blocks. Two of them (long
"Separating Action from Reaction" / 50-thinkers-series captions) had no Instagram link
attached and were **dropped from v1** per user decision — not enough info to build a working
video entry from a caption with no link. The remaining 6, each with a working reel link, are
in scope for v1:

| id | title (drafted) | category (drafted) | featured |
|---|---|---|---|
| roast-of-dms | The Roast Of My DMs | Humor | yes |
| generations-and-wisdom | What Each Generation Gets Wrong (And Right) | Personal Growth | yes |
| workout-vibes | My Workout Vibes | Fitness | no |
| shortest-content | The Shortest Video I've Ever Made | Personal Growth | no |
| ready-to-not-quit | Get Yourself Ready To Not Quit | Personal Growth | yes |
| poor-lighting-workout | Even On Poor Lighting, Just With A Purpose | Fitness | no |

Titles, categories, tags, and descriptions are a first-pass draft derived from the raw
captions — user may edit any of them during/after implementation. No thumbnails were
provided; all 6 render with the placeholder card art until real thumbnails are supplied
(no Instagram scraping, per constraint).

## Pages / routes

- `/` — Homepage (see below, highest priority)
- `/videos` — Video Library: full searchable/filterable grid of all videos
- `/videos/[slug]` — Video Detail: larger art, full description, tags, category, key lessons,
  "Watch on Instagram" button
- `/about` — bio, content focus, social links
- `/blog`, `/books`, `/projects` — static "coming soon" placeholder pages, linked from nav and
  from the homepage's future-placeholders row

## Homepage

1. **Hero** — bio copy (below) next to the kinetic portrait video component.
2. **Social buttons** — Instagram, YouTube.
3. **Search bar** + **category filter** — functional, filters the full 6-video set client-side.
4. **Featured video cards** — the 3 rows marked `featured: true` above.
5. **About preview** — 2-3 lines, links to `/about`.
6. **Future placeholders row** — visually distinct "coming soon" cards linking to `/blog`,
   `/books`, `/projects`.

Bio copy (verbatim, user-supplied):
> ☬ Fear lives in one place only... Thats in you Mind🗿
> Distinguished Engr | Author | Calisthenics | Meditation | Memer | AI Architect | Generalist

## Hero video effect ("kinetic portrait")

Ported from the reference project `~/Projects/Antigravity/revealIT-Experience`
(same person's existing portfolio site). Source assets, used as-is including the project's
existing folder name/typo:

- `asserts/profilepic/smooth-transparent.webm` (forward clip)
- `asserts/profilepic/smooth-reverse-transparent.webm` (reverse clip)

Both are WebM/VP9 with an alpha channel (green-screen chroma-keyed to transparent via ffmpeg),
so the video renders with no background box — just the person floating over the page
background. Copied into this project at `public/video/portrait-forward.webm` and
`public/video/portrait-reverse.webm` (destination naming is `assets`/`video`, standard
spelling — only the source repo's folder is named `asserts`).

Behavior:

- **Desktop**: on `mouseenter`, play the forward clip from the mirrored timestamp of wherever
  the reverse clip currently is; on `mouseleave`, play the reverse clip from the mirrored
  timestamp of wherever the forward clip currently is. This is the "dual-video hardware sync"
  approach from the reference project — ported into a React component
  (`components/hero/KineticPortrait.tsx`) using the same two-video-element technique.
- **Mobile / touch** (no hover event available): auto-loop forward → reverse → forward
  continuously, detected via a touch-capability check (not just viewport width, since some
  desktops have touchscreens) so the effect is always alive without requiring interaction.
- Decorative concentric glow rings are ported; smoke particle effect is **not** ported for v1
  (flagged as optional, not requested).

## Visual system

- Dark glassmorphic base: near-black background (`#0a0a0f`), frosted `backdrop-blur` cards
  with subtle translucent white borders
- One accent color (swatch options to be shown during implementation, not locked here)
- Typography: `Outfit` (display) + `Inter` (body) — matches the reference portfolio project
  for visual continuity across the user's properties
- Mobile-first layout throughout; all interactive affordances must work without hover

## Instagram integration

Link-out only for v1 — a prominent "Watch on Instagram" button/thumbnail on card and detail
views. No oEmbed / embed.js script, to avoid a dependency on Instagram's client-side embed
behavior (which can change or be throttled without notice) and to keep the "no Instagram API"
constraint unambiguous. Detail page layout should leave room for an embed to be added later
without a structural rework, but no embed code ships in v1.

## Explicitly out of scope for v1

- Instagram API / scraping of any kind
- Any AI/semantic search or embeddings (data model should not preclude adding this later, but
  nothing is built now)
- Database, authentication, server-side rendering, API routes
- Real thumbnails (placeholder art until supplied)
- Smoke-particle decoration on the hero
- Splitting into a separate git repo

## Acceptance criteria

- `sites/nathamuni-com/` builds and runs via `npm run dev` and produces a static `out/` via
  `npm run build`
- Homepage renders hero (with working hover-reverse on desktop and auto-loop on touch),
  bio, social buttons, functional search + category filter, 3 featured cards, about preview,
  and the coming-soon placeholders row
- `/videos` lists all 6 videos with working search and filter
- `/videos/[slug]` renders for all 6 ids with correct data and a working "Watch on Instagram"
  link
- `/about`, `/blog`, `/books`, `/projects` render
- Lighthouse mobile score is reasonable (no specific number gated for v1, but no obvious
  performance regressions from the hero video — e.g. it must not block first paint)
- `npm run lint` and `npm run type-check` pass

## Known risks / failure modes to watch for

- WebM alpha-channel video is only reliably supported in Chromium/WebKit-based browsers per
  the reference project's own encoding guide — Firefox support for alpha WebM is inconsistent.
  Need a fallback (e.g. a static portrait image) for browsers that can't play it, so the hero
  never renders as a broken/black box.
- Touch-capability detection needs to handle hybrid devices (touchscreen laptops) — should not
  assume "has touch" means "no hover ever happens" if a mouse is also present; simplest safe
  approach is to feature-detect `hover: hover` via `matchMedia`, not just touch support.
- Two `<video>` elements per hero adds real page weight — must confirm `preload` behavior
  keeps initial load fast on mobile networks.
- Category/tag values are currently free-text drafts; if they don't stay consistent, category
  filtering degrades. Should be finalized/reviewed by the user before or shortly after launch.
