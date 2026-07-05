# nathamuni.com v1 Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Ship v1 of `nathamuni.com` — a static, mobile-first, glassmorphic personal video-hub site with a homepage, searchable video library, video detail pages, an about page, and coming-soon placeholders for blog/books/projects.

**Architecture:** Next.js App Router site at `sites/nathamuni-com/`, static export (`output: 'export'`, no server runtime). Video data lives in a static `lib/videos.json`, read by pure TypeScript accessor functions in `lib/videos.ts`. Search/filter is a client component (`VideoExplorer`) driving those pure functions. Pages are thin server components that fetch data and render presentational/client components from `components/`; almost all real logic and markup lives in the tested components, not the page files, because Next.js server-component page files are impractical to unit-test directly.

**Tech Stack:** Next.js (App Router) + TypeScript + Tailwind CSS + Vitest + @testing-library/react + jsdom.

## Global Constraints

- Static export only (`output: 'export'`) — no database, no auth, no API routes, no server runtime.
- No Instagram API and no scraping of any kind — all video data is hand-authored in `lib/videos.json`.
- No AI/embeddings API key in v1 (data model must not preclude adding semantic search later, but nothing is built now).
- No component library (shadcn/MUI/etc.) — custom Tailwind only.
- Mobile-first layout is mandatory; all interactive affordances must work without a hover-capable pointer.
- Social links are single-sourced in `lib/social.ts`: Instagram is `https://www.instagram.com/nathamuni_/` (primary CTA), YouTube is `https://www.youtube.com/@LogicAndLaunch` (secondary/future-priority CTA, styled less prominently).
- Video detail pages link out to Instagram only — no oEmbed/embed.js script in v1.
- `/blog`, `/books`, `/projects` are placeholder-only pages (heading, one line of copy, link home) — no listing UI, no CMS hooks.
- Hero video assets are copied from `~/Projects/Antigravity/revealIT-Experience/asserts/profilepic/` (source folder name `asserts` kept as-is, since it's someone else's — well, the same person's — existing repo); destination inside this project uses standard spelling: `public/video/`, `public/images/`.
- The hero must fall back to a static portrait image when alpha-channel WebM isn't supported/fails to play — it must never render a broken or black box.
- Full spec: `docs/superpowers/specs/2026-07-05-nathamuni-com-v1-design.md`.

---

## Task 1: Scaffold the Next.js app

**Files:**
- Create: `sites/nathamuni-com/` (via `create-next-app`)
- Modify: `sites/nathamuni-com/next.config.ts`
- Create: `sites/nathamuni-com/CLAUDE.md`

**Interfaces:**
- Produces: a runnable Next.js App Router project at `sites/nathamuni-com/` with `npm run dev`, `npm run build`, `npm run lint` scripts, TypeScript, and Tailwind already wired by the scaffold.

- [ ] **Step 1: Scaffold the app**

Run from the repo root:

```bash
cd "sites" && npx create-next-app@latest nathamuni-com --typescript --tailwind --eslint --app --no-src-dir --import-alias "@/*" --use-npm
```

If prompted for anything not covered by these flags (e.g. Turbopack), accept the default (press Enter).

- [ ] **Step 2: Verify the scaffold**

```bash
cd "sites/nathamuni-com" && cat package.json
```

Expected: `dependencies` includes `next`, `react`, `react-dom`; `devDependencies` includes `typescript`, `tailwindcss`.

- [ ] **Step 3: Configure static export**

Replace the contents of `sites/nathamuni-com/next.config.ts` with:

```ts
import type { NextConfig } from 'next'

const nextConfig: NextConfig = {
  output: 'export',
  images: {
    unoptimized: true,
  },
}

export default nextConfig
```

- [ ] **Step 4: Add the site's `CLAUDE.md`**

Create `sites/nathamuni-com/CLAUDE.md`:

```markdown
# CLAUDE.md — nathamuni.com

## Business

- **Name:** Nathamuni — personal creator content hub
- **Domain:** nathamuni.com (apex domain)
- **Category:** Personal brand / content library
- **Cloudflare Pages project:** nathamuni-com
- **Platform:** Nathamuni Digital Presence Platform

## Site Commands

Run from this directory (`sites/nathamuni-com/`):

\`\`\`bash
npm run dev        # localhost:3000
npm run build      # static export to out/
npm run lint
npm run type-check
npm test           # vitest
\`\`\`

## Content & Assets

- **Video data:** `lib/videos.json` — edit directly to add/update/remove videos
- **Hero video assets:** `public/video/portrait-forward.webm`, `public/video/portrait-reverse.webm`
  (sourced from `~/Projects/Antigravity/revealIT-Experience/asserts/profilepic/`)
- **Fallback portrait:** `public/images/portrait-fallback.png`

## Business-Specific Rules

- No Instagram API, no scraping, no AI API keys in v1 — search/filter is plain client-side
  string matching over `lib/videos.json`
- No database, no auth, no API routes — this is a fully static export site
- Social links live in `lib/social.ts`, not hardcoded per-component
- Instagram is the primary social CTA; YouTube is secondary until that channel is prioritized
- Mobile-first is mandatory

## Deployment

- Cloudflare Pages build root: `sites/nathamuni-com/`
- Build command: `npm run build`
- Output directory: `out/`
- Subdomain/apex DNS: managed in Cloudflare dashboard for `nathamuni.com`
```

- [ ] **Step 5: Add `type-check` script**

In `sites/nathamuni-com/package.json`, add to `"scripts"`:

```json
"type-check": "tsc --noEmit"
```

- [ ] **Step 6: Verify build**

```bash
cd "sites/nathamuni-com" && npm run build
```

Expected: build succeeds and produces `sites/nathamuni-com/out/index.html`.

- [ ] **Step 7: Commit**

```bash
git add "sites/nathamuni-com"
git commit -m "FEAT: scaffold nathamuni-com Next.js app with static export"
```

---

## Task 2: Test tooling (Vitest + Testing Library)

**Files:**
- Modify: `sites/nathamuni-com/package.json`
- Create: `sites/nathamuni-com/vitest.config.ts`
- Create: `sites/nathamuni-com/vitest.setup.ts`
- Create: `sites/nathamuni-com/lib/sanity.test.ts`

**Interfaces:**
- Produces: `npm test` runs Vitest with jsdom + Testing Library available to every later task.

- [ ] **Step 1: Install test dependencies**

```bash
cd "sites/nathamuni-com" && npm install -D vitest @vitejs/plugin-react jsdom @testing-library/react @testing-library/jest-dom @testing-library/user-event
```

- [ ] **Step 2: Add the `test` script**

In `sites/nathamuni-com/package.json`, add to `"scripts"`:

```json
"test": "vitest run"
```

- [ ] **Step 3: Add Vitest config**

Create `sites/nathamuni-com/vitest.config.ts`:

```ts
import { defineConfig } from 'vitest/config'
import react from '@vitejs/plugin-react'
import path from 'path'

export default defineConfig({
  plugins: [react()],
  test: {
    environment: 'jsdom',
    setupFiles: ['./vitest.setup.ts'],
    globals: true,
  },
  resolve: {
    alias: {
      '@': path.resolve(__dirname, '.'),
    },
  },
})
```

- [ ] **Step 4: Add Vitest setup file**

Create `sites/nathamuni-com/vitest.setup.ts`:

```ts
import '@testing-library/jest-dom/vitest'

if (typeof window !== 'undefined') {
  window.HTMLMediaElement.prototype.play = () => Promise.resolve()
  window.HTMLMediaElement.prototype.pause = () => {}
}
```

- [ ] **Step 5: Write a failing sanity test**

Create `sites/nathamuni-com/lib/sanity.test.ts`:

```ts
import { describe, expect, it } from 'vitest'
import { add } from './sanity'

describe('sanity', () => {
  it('adds two numbers', () => {
    expect(add(2, 3)).toBe(5)
  })
})
```

- [ ] **Step 6: Run test to verify it fails**

```bash
cd "sites/nathamuni-com" && npm test
```

Expected: FAIL — `Cannot find module './sanity'`.

- [ ] **Step 7: Make it pass**

Create `sites/nathamuni-com/lib/sanity.ts`:

```ts
export function add(a: number, b: number): number {
  return a + b
}
```

- [ ] **Step 8: Run test to verify it passes**

```bash
cd "sites/nathamuni-com" && npm test
```

Expected: PASS.

- [ ] **Step 9: Delete the sanity files**

```bash
cd "sites/nathamuni-com" && rm lib/sanity.ts lib/sanity.test.ts
```

(They only existed to prove the harness works — the real first test suite is Task 3.)

- [ ] **Step 10: Commit**

```bash
git add sites/nathamuni-com/package.json sites/nathamuni-com/package-lock.json sites/nathamuni-com/vitest.config.ts sites/nathamuni-com/vitest.setup.ts
git commit -m "TEST: add Vitest + Testing Library harness"
```

---

## Task 3: Video data and typed accessors

**Files:**
- Create: `sites/nathamuni-com/lib/videos.json`
- Create: `sites/nathamuni-com/lib/videos.ts`
- Test: `sites/nathamuni-com/lib/videos.test.ts`

**Interfaces:**
- Produces:
  - `export interface Video { id, title, instagramUrl, youtubeUrl?, thumbnail, category, tags, problemSolved, shortDescription, detailedDescription, keyLessons?, featured, publishedDate }`
  - `getAllVideos(): Video[]`
  - `getFeaturedVideos(): Video[]`
  - `getVideoBySlug(slug: string): Video | undefined`
  - `getAllCategories(): string[]`
  - `searchAndFilterVideos(videos: Video[], query: string, category: string | null): Video[]`
- Consumed by: Tasks 6, 8, 10, 12, 13, 14 (every component/page that touches video data).

- [ ] **Step 1: Create the data file**

Create `sites/nathamuni-com/lib/videos.json`:

```json
[
  {
    "id": "roast-of-dms",
    "title": "The Roast Of My DMs",
    "instagramUrl": "https://www.instagram.com/reel/DaS3P-Qxdkg/",
    "thumbnail": null,
    "category": "Humor",
    "tags": ["comedy", "relatable", "instagram-dms"],
    "problemSolved": "Turns the cringe, awkward DMs creators get into a lighthearted roast instead of ignoring them.",
    "shortDescription": "A roast of the individual DMs that come my way — presented in a pretty unique way.",
    "detailedDescription": "This is the roast of my individual DMs that come to me in a unique way. If you've ever wondered what creators actually get in their inbox, this is a lighthearted look at it.",
    "featured": true,
    "publishedDate": "2026-06-20"
  },
  {
    "id": "generations-and-wisdom",
    "title": "What Each Generation Gets Wrong (And Right)",
    "instagramUrl": "https://www.instagram.com/reel/DaP6a3GxRRJ/",
    "thumbnail": null,
    "category": "Personal Growth",
    "tags": ["wisdom", "parenting", "mindset", "generations"],
    "problemSolved": "Helps you decide which lessons from your parents' generation to keep, and which fears not to carry forward.",
    "shortDescription": "Every generation is shaped by its circumstances — understand the fears that shaped the last so wisdom can shape the next.",
    "detailedDescription": "Every generation is shaped by its circumstances. Understand the fears that shaped the last, and let wisdom shape the next. The content here is built from my parents' words and what really matters to us — what to take from it, and what not to, based on my own experience.",
    "keyLessons": [
      "Fears passed down from your parents' generation aren't automatically your fears.",
      "Take the wisdom, leave the fear that no longer applies to your circumstances."
    ],
    "featured": true,
    "publishedDate": "2026-06-10"
  },
  {
    "id": "workout-vibes",
    "title": "My Workout Vibes",
    "instagramUrl": "https://www.instagram.com/reel/DaMNoRESMGY/",
    "thumbnail": null,
    "category": "Fitness",
    "tags": ["calisthenics", "workout", "motivation"],
    "problemSolved": "A quick hit of training motivation and energy for anyone who needs a reason to move today.",
    "shortDescription": "A glimpse into my workout energy and training vibe.",
    "detailedDescription": "My workout vibes — a short glimpse into the energy and mindset I bring to training.",
    "featured": false,
    "publishedDate": "2026-05-28"
  },
  {
    "id": "shortest-content",
    "title": "The Shortest Video I've Ever Made",
    "instagramUrl": "https://www.instagram.com/reel/DZ5boEOTCuW/",
    "thumbnail": null,
    "category": "Personal Growth",
    "tags": ["short-form", "reflection"],
    "problemSolved": "Proves a big idea doesn't need a long video to land — useful when you only have a few seconds to spare.",
    "shortDescription": "My shortest piece of content yet — still packs a punch.",
    "detailedDescription": "The shortest content I had ever made. Proof that an idea doesn't need three minutes to change how you think about something.",
    "featured": false,
    "publishedDate": "2026-05-15"
  },
  {
    "id": "ready-to-not-quit",
    "title": "Get Yourself Ready To Not Quit",
    "instagramUrl": "https://www.instagram.com/reel/DZ26CClzpZx/",
    "thumbnail": null,
    "category": "Personal Growth",
    "tags": ["discipline", "mindset", "consistency"],
    "problemSolved": "Reframes how to mentally prepare for a goal so quitting halfway is never on the table.",
    "shortDescription": "The core idea: get yourself ready mentally so quitting is never on the table.",
    "detailedDescription": "Core concept: make yourself ready so that quitting isn't an option. Preparation isn't just physical — it's deciding, before you start, that you're not stopping halfway.",
    "keyLessons": [
      "Decide you won't quit before you start, not in the middle of the struggle."
    ],
    "featured": true,
    "publishedDate": "2026-05-01"
  },
  {
    "id": "poor-lighting-workout",
    "title": "Even On Poor Lighting, Just With A Purpose",
    "instagramUrl": "https://www.instagram.com/reel/DXirR2aETQO/",
    "thumbnail": null,
    "category": "Fitness",
    "tags": ["workoutmotivation", "calisthenics", "instagood", "workout", "fitness"],
    "problemSolved": "Shows that consistency matters more than perfect conditions, equipment, or lighting.",
    "shortDescription": "Training with purpose even when the lighting — and everything else — isn't ideal.",
    "detailedDescription": "Even on poor lighting, just with a purpose. The setup doesn't have to be perfect for the work to count.",
    "featured": false,
    "publishedDate": "2026-04-20"
  }
]
```

- [ ] **Step 2: Write the failing test**

Create `sites/nathamuni-com/lib/videos.test.ts`:

```ts
import { describe, expect, it } from 'vitest'
import {
  getAllVideos,
  getFeaturedVideos,
  getVideoBySlug,
  getAllCategories,
  searchAndFilterVideos,
} from './videos'

describe('videos data accessors', () => {
  it('returns all 6 videos', () => {
    expect(getAllVideos()).toHaveLength(6)
  })

  it('returns only featured videos', () => {
    const featured = getFeaturedVideos()
    expect(featured.length).toBeGreaterThan(0)
    expect(featured.every((video) => video.featured)).toBe(true)
  })

  it('finds a video by its slug', () => {
    const video = getVideoBySlug('roast-of-dms')
    expect(video?.title).toBe('The Roast Of My DMs')
  })

  it('returns undefined for an unknown slug', () => {
    expect(getVideoBySlug('does-not-exist')).toBeUndefined()
  })

  it('returns deduplicated, sorted categories', () => {
    const categories = getAllCategories()
    expect(categories).toEqual([...categories].sort())
    expect(new Set(categories).size).toBe(categories.length)
  })
})

describe('searchAndFilterVideos', () => {
  const videos = getAllVideos()

  it('returns all videos when query and category are empty', () => {
    expect(searchAndFilterVideos(videos, '', null)).toHaveLength(videos.length)
  })

  it('matches by title, case-insensitively', () => {
    const results = searchAndFilterVideos(videos, 'ROAST', null)
    expect(results.map((v) => v.id)).toContain('roast-of-dms')
  })

  it('matches by tag', () => {
    const results = searchAndFilterVideos(videos, 'calisthenics', null)
    expect(results.map((v) => v.id)).toContain('poor-lighting-workout')
  })

  it('filters by category', () => {
    const results = searchAndFilterVideos(videos, '', 'Fitness')
    expect(results.every((v) => v.category === 'Fitness')).toBe(true)
    expect(results.length).toBeGreaterThan(0)
  })

  it('combines query and category filters', () => {
    const results = searchAndFilterVideos(videos, 'workout', 'Fitness')
    expect(results.every((v) => v.category === 'Fitness')).toBe(true)
  })

  it('returns an empty array when nothing matches', () => {
    expect(searchAndFilterVideos(videos, 'zzzznomatch', null)).toEqual([])
  })
})
```

- [ ] **Step 3: Run test to verify it fails**

```bash
cd "sites/nathamuni-com" && npm test -- videos.test.ts
```

Expected: FAIL — `Cannot find module './videos'`.

- [ ] **Step 4: Implement the accessors**

Create `sites/nathamuni-com/lib/videos.ts`:

```ts
import videosData from './videos.json'

export interface Video {
  id: string
  title: string
  instagramUrl: string
  youtubeUrl?: string
  thumbnail: string | null
  category: string
  tags: string[]
  problemSolved: string
  shortDescription: string
  detailedDescription: string
  keyLessons?: string[]
  featured: boolean
  publishedDate: string
}

export function getAllVideos(): Video[] {
  return videosData as Video[]
}

export function getFeaturedVideos(): Video[] {
  return getAllVideos().filter((video) => video.featured)
}

export function getVideoBySlug(slug: string): Video | undefined {
  return getAllVideos().find((video) => video.id === slug)
}

export function getAllCategories(): string[] {
  const categories = getAllVideos().map((video) => video.category)
  return Array.from(new Set(categories)).sort()
}

export function searchAndFilterVideos(
  videos: Video[],
  query: string,
  category: string | null
): Video[] {
  const normalizedQuery = query.trim().toLowerCase()
  return videos.filter((video) => {
    if (category && video.category !== category) return false
    if (!normalizedQuery) return true
    const haystack = [video.title, video.shortDescription, video.category, ...video.tags]
      .join(' ')
      .toLowerCase()
    return haystack.includes(normalizedQuery)
  })
}
```

- [ ] **Step 5: Run test to verify it passes**

```bash
cd "sites/nathamuni-com" && npm test -- videos.test.ts
```

Expected: PASS (11 tests).

- [ ] **Step 6: Commit**

```bash
git add sites/nathamuni-com/lib/videos.json sites/nathamuni-com/lib/videos.ts sites/nathamuni-com/lib/videos.test.ts
git commit -m "FEAT: add video data and typed search/filter accessors"
```

---

## Task 4: Social links and `SocialButtons` component

**Files:**
- Create: `sites/nathamuni-com/lib/social.ts`
- Test: `sites/nathamuni-com/lib/social.test.ts`
- Create: `sites/nathamuni-com/components/layout/SocialButtons.tsx`
- Test: `sites/nathamuni-com/components/layout/SocialButtons.test.tsx`

**Interfaces:**
- Produces: `SOCIAL_LINKS: { instagram: string; youtube: string }`, `<SocialButtons />`.
- Consumed by: Task 9 (Footer), Task 10 (Homepage hero), Task 11 (About page).

- [ ] **Step 1: Write the failing test for the constants**

Create `sites/nathamuni-com/lib/social.test.ts`:

```ts
import { describe, expect, it } from 'vitest'
import { SOCIAL_LINKS } from './social'

describe('SOCIAL_LINKS', () => {
  it('has the exact Instagram profile URL', () => {
    expect(SOCIAL_LINKS.instagram).toBe('https://www.instagram.com/nathamuni_/')
  })

  it('has the exact YouTube channel URL', () => {
    expect(SOCIAL_LINKS.youtube).toBe('https://www.youtube.com/@LogicAndLaunch')
  })
})
```

- [ ] **Step 2: Run test to verify it fails**

```bash
cd "sites/nathamuni-com" && npm test -- social.test.ts
```

Expected: FAIL — `Cannot find module './social'`.

- [ ] **Step 3: Implement the constants**

Create `sites/nathamuni-com/lib/social.ts`:

```ts
export const SOCIAL_LINKS = {
  instagram: 'https://www.instagram.com/nathamuni_/',
  youtube: 'https://www.youtube.com/@LogicAndLaunch',
} as const
```

- [ ] **Step 4: Run test to verify it passes**

```bash
cd "sites/nathamuni-com" && npm test -- social.test.ts
```

Expected: PASS.

- [ ] **Step 5: Write the failing component test**

Create `sites/nathamuni-com/components/layout/SocialButtons.test.tsx`:

```tsx
import { describe, expect, it } from 'vitest'
import { render, screen } from '@testing-library/react'
import { SocialButtons } from './SocialButtons'
import { SOCIAL_LINKS } from '@/lib/social'

describe('SocialButtons', () => {
  it('renders Instagram as the primary CTA', () => {
    render(<SocialButtons />)
    const instagram = screen.getByTestId('social-button-instagram')
    expect(instagram).toHaveAttribute('href', SOCIAL_LINKS.instagram)
    expect(instagram.className).toContain('social-button-primary')
  })

  it('renders YouTube as a secondary CTA', () => {
    render(<SocialButtons />)
    const youtube = screen.getByTestId('social-button-youtube')
    expect(youtube).toHaveAttribute('href', SOCIAL_LINKS.youtube)
    expect(youtube.className).toContain('social-button-secondary')
  })
})
```

- [ ] **Step 6: Run test to verify it fails**

```bash
cd "sites/nathamuni-com" && npm test -- SocialButtons.test.tsx
```

Expected: FAIL — `Cannot find module './SocialButtons'`.

- [ ] **Step 7: Implement the component**

Create `sites/nathamuni-com/components/layout/SocialButtons.tsx`:

```tsx
import { SOCIAL_LINKS } from '@/lib/social'

export function SocialButtons() {
  return (
    <div className="social-buttons" data-testid="social-buttons">
      <a
        href={SOCIAL_LINKS.instagram}
        target="_blank"
        rel="noreferrer"
        className="social-button social-button-primary"
        data-testid="social-button-instagram"
      >
        Follow on Instagram
      </a>
      <a
        href={SOCIAL_LINKS.youtube}
        target="_blank"
        rel="noreferrer"
        className="social-button social-button-secondary"
        data-testid="social-button-youtube"
      >
        YouTube
      </a>
    </div>
  )
}
```

- [ ] **Step 8: Run test to verify it passes**

```bash
cd "sites/nathamuni-com" && npm test -- SocialButtons.test.tsx
```

Expected: PASS.

- [ ] **Step 9: Commit**

```bash
git add sites/nathamuni-com/lib/social.ts sites/nathamuni-com/lib/social.test.ts sites/nathamuni-com/components/layout/SocialButtons.tsx sites/nathamuni-com/components/layout/SocialButtons.test.tsx
git commit -m "FEAT: add social links source of truth and SocialButtons component"
```

---

## Task 5: Media support-detection utilities

**Files:**
- Create: `sites/nathamuni-com/lib/mediaSupport.ts`
- Test: `sites/nathamuni-com/lib/mediaSupport.test.ts`

**Interfaces:**
- Produces: `supportsAlphaWebm(): boolean`, `prefersHoverInteraction(): boolean`.
- Consumed by: Task 6 (`KineticPortrait`).

- [ ] **Step 1: Write the failing test**

Create `sites/nathamuni-com/lib/mediaSupport.test.ts`:

```ts
import { afterEach, describe, expect, it, vi } from 'vitest'
import { supportsAlphaWebm, prefersHoverInteraction } from './mediaSupport'

describe('supportsAlphaWebm', () => {
  afterEach(() => {
    vi.restoreAllMocks()
  })

  it('returns true when canPlayType reports "probably"', () => {
    vi.spyOn(document, 'createElement').mockReturnValue({
      canPlayType: () => 'probably',
    } as unknown as HTMLVideoElement)
    expect(supportsAlphaWebm()).toBe(true)
  })

  it('returns false when canPlayType reports empty string', () => {
    vi.spyOn(document, 'createElement').mockReturnValue({
      canPlayType: () => '',
    } as unknown as HTMLVideoElement)
    expect(supportsAlphaWebm()).toBe(false)
  })
})

describe('prefersHoverInteraction', () => {
  afterEach(() => {
    vi.restoreAllMocks()
  })

  it('returns true when the hover media query matches', () => {
    vi.spyOn(window, 'matchMedia').mockReturnValue({
      matches: true,
    } as MediaQueryList)
    expect(prefersHoverInteraction()).toBe(true)
  })

  it('returns false when the hover media query does not match', () => {
    vi.spyOn(window, 'matchMedia').mockReturnValue({
      matches: false,
    } as MediaQueryList)
    expect(prefersHoverInteraction()).toBe(false)
  })
})
```

- [ ] **Step 2: Run test to verify it fails**

```bash
cd "sites/nathamuni-com" && npm test -- mediaSupport.test.ts
```

Expected: FAIL — `Cannot find module './mediaSupport'`.

- [ ] **Step 3: Implement the utilities**

Create `sites/nathamuni-com/lib/mediaSupport.ts`:

```ts
export function supportsAlphaWebm(): boolean {
  if (typeof document === 'undefined') return false
  const testVideo = document.createElement('video')
  if (typeof testVideo.canPlayType !== 'function') return false
  const support = testVideo.canPlayType('video/webm; codecs="vp9"')
  return support === 'probably' || support === 'maybe'
}

export function prefersHoverInteraction(): boolean {
  if (typeof window === 'undefined' || typeof window.matchMedia !== 'function') return false
  return window.matchMedia('(hover: hover) and (pointer: fine)').matches
}
```

- [ ] **Step 4: Run test to verify it passes**

```bash
cd "sites/nathamuni-com" && npm test -- mediaSupport.test.ts
```

Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add sites/nathamuni-com/lib/mediaSupport.ts sites/nathamuni-com/lib/mediaSupport.test.ts
git commit -m "FEAT: add alpha-WebM and hover-capability detection utilities"
```

---

## Task 6: `KineticPortrait` hero component

**Files:**
- Create: `sites/nathamuni-com/components/hero/KineticPortrait.tsx`
- Test: `sites/nathamuni-com/components/hero/KineticPortrait.test.tsx`

**Interfaces:**
- Consumes: `supportsAlphaWebm`, `prefersHoverInteraction` from `@/lib/mediaSupport`.
- Produces: `<KineticPortrait />` (no props).
- Consumed by: Task 10 (Homepage).

- [ ] **Step 1: Write the failing test**

Create `sites/nathamuni-com/components/hero/KineticPortrait.test.tsx`:

```tsx
import { afterEach, describe, expect, it, vi } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import { KineticPortrait } from './KineticPortrait'
import * as mediaSupport from '@/lib/mediaSupport'

describe('KineticPortrait', () => {
  afterEach(() => {
    vi.restoreAllMocks()
  })

  it('renders the fallback image when alpha WebM is not supported', () => {
    vi.spyOn(mediaSupport, 'supportsAlphaWebm').mockReturnValue(false)
    vi.spyOn(mediaSupport, 'prefersHoverInteraction').mockReturnValue(true)
    render(<KineticPortrait />)
    expect(screen.getByTestId('portrait-fallback')).toBeInTheDocument()
    expect(screen.queryByTestId('kinetic-portrait')).not.toBeInTheDocument()
  })

  it('renders both videos when alpha WebM is supported', () => {
    vi.spyOn(mediaSupport, 'supportsAlphaWebm').mockReturnValue(true)
    vi.spyOn(mediaSupport, 'prefersHoverInteraction').mockReturnValue(true)
    render(<KineticPortrait />)
    expect(screen.getByTestId('portrait-forward')).toBeInTheDocument()
    expect(screen.getByTestId('portrait-reverse')).toBeInTheDocument()
  })

  it('plays the forward video on mouse enter when hover-capable', () => {
    vi.spyOn(mediaSupport, 'supportsAlphaWebm').mockReturnValue(true)
    vi.spyOn(mediaSupport, 'prefersHoverInteraction').mockReturnValue(true)
    const playSpy = vi.spyOn(window.HTMLMediaElement.prototype, 'play')
    render(<KineticPortrait />)
    fireEvent.mouseEnter(screen.getByTestId('kinetic-portrait'))
    expect(playSpy).toHaveBeenCalled()
  })
})
```

- [ ] **Step 2: Run test to verify it fails**

```bash
cd "sites/nathamuni-com" && npm test -- KineticPortrait.test.tsx
```

Expected: FAIL — `Cannot find module './KineticPortrait'`.

- [ ] **Step 3: Implement the component**

Create `sites/nathamuni-com/components/hero/KineticPortrait.tsx`:

```tsx
'use client'

import { useEffect, useRef, useState } from 'react'
import { prefersHoverInteraction, supportsAlphaWebm } from '@/lib/mediaSupport'

const FORWARD_SRC = '/video/portrait-forward.webm'
const REVERSE_SRC = '/video/portrait-reverse.webm'
const FALLBACK_SRC = '/images/portrait-fallback.png'

export function KineticPortrait() {
  const forwardRef = useRef<HTMLVideoElement>(null)
  const reverseRef = useRef<HTMLVideoElement>(null)
  const [canPlayAlpha, setCanPlayAlpha] = useState(true)
  const [hoverCapable, setHoverCapable] = useState(true)

  useEffect(() => {
    setCanPlayAlpha(supportsAlphaWebm())
    setHoverCapable(prefersHoverInteraction())
  }, [])

  useEffect(() => {
    if (!canPlayAlpha || hoverCapable) return
    const forward = forwardRef.current
    const reverse = reverseRef.current
    if (!forward || !reverse) return

    let cancelled = false

    const playForward = () => {
      reverse.style.opacity = '0'
      forward.style.opacity = '1'
      forward.currentTime = 0
      forward.play().catch(() => {})
    }
    const playReverse = () => {
      forward.style.opacity = '0'
      reverse.style.opacity = '1'
      reverse.currentTime = 0
      reverse.play().catch(() => {})
    }
    const onForwardEnded = () => {
      if (!cancelled) playReverse()
    }
    const onReverseEnded = () => {
      if (!cancelled) playForward()
    }

    forward.addEventListener('ended', onForwardEnded)
    reverse.addEventListener('ended', onReverseEnded)
    playForward()

    return () => {
      cancelled = true
      forward.removeEventListener('ended', onForwardEnded)
      reverse.removeEventListener('ended', onReverseEnded)
    }
  }, [canPlayAlpha, hoverCapable])

  if (!canPlayAlpha) {
    return (
      // eslint-disable-next-line @next/next/no-img-element
      <img
        src={FALLBACK_SRC}
        alt="Nathamuni portrait"
        className="kinetic-portrait-fallback"
        data-testid="portrait-fallback"
      />
    )
  }

  const handleMouseEnter = () => {
    if (!hoverCapable) return
    const forward = forwardRef.current
    const reverse = reverseRef.current
    if (!forward || !reverse) return
    reverse.pause()
    reverse.style.opacity = '0'
    forward.style.opacity = '1'
    forward.currentTime = 0
    forward.play().catch(() => {})
  }

  const handleMouseLeave = () => {
    if (!hoverCapable) return
    const forward = forwardRef.current
    const reverse = reverseRef.current
    if (!forward || !reverse) return
    forward.pause()
    forward.style.opacity = '0'
    reverse.style.opacity = '1'
    reverse.currentTime = 0
    reverse.play().catch(() => {})
  }

  return (
    <div
      className="kinetic-portrait"
      data-testid="kinetic-portrait"
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
    >
      <video
        ref={forwardRef}
        src={FORWARD_SRC}
        muted
        playsInline
        preload="auto"
        className="kinetic-portrait-video"
        data-testid="portrait-forward"
      />
      <video
        ref={reverseRef}
        src={REVERSE_SRC}
        muted
        playsInline
        preload="auto"
        className="kinetic-portrait-video kinetic-portrait-video-reverse"
        data-testid="portrait-reverse"
      />
    </div>
  )
}
```

Note: this is a simplified version of the reference project's "mirrored timestamp" resume logic — it always restarts from frame 0 on each trigger rather than resuming from the exact mirrored point mid-transition. That satisfies the acceptance criteria (working hover/reverse on desktop, working auto-loop on touch) without building the extra precision-seeking logic the spec doesn't require.

- [ ] **Step 4: Run test to verify it passes**

```bash
cd "sites/nathamuni-com" && npm test -- KineticPortrait.test.tsx
```

Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add sites/nathamuni-com/components/hero/KineticPortrait.tsx sites/nathamuni-com/components/hero/KineticPortrait.test.tsx
git commit -m "FEAT: add KineticPortrait hero component with hover/auto-loop/fallback behavior"
```

---

## Task 7: Placeholder art, `VideoCard`, `VideoGrid`

**Files:**
- Create: `sites/nathamuni-com/lib/placeholderHue.ts`
- Test: `sites/nathamuni-com/lib/placeholderHue.test.ts`
- Create: `sites/nathamuni-com/components/video/PlaceholderArt.tsx`
- Create: `sites/nathamuni-com/components/video/VideoCard.tsx`
- Create: `sites/nathamuni-com/components/video/VideoGrid.tsx`
- Test: `sites/nathamuni-com/components/video/VideoCard.test.tsx`
- Test: `sites/nathamuni-com/components/video/VideoGrid.test.tsx`

**Interfaces:**
- Consumes: `Video` type from `@/lib/videos`.
- Produces: `hueForCategory(category: string): number`, `<PlaceholderArt category={string} />`, `<VideoCard video={Video} />`, `<VideoGrid videos={Video[]} />`.
- Consumed by: Task 8 (`VideoExplorer`), Task 13 (`VideoDetail`).

- [ ] **Step 1: Write the failing test for the hue function**

Create `sites/nathamuni-com/lib/placeholderHue.test.ts`:

```ts
import { describe, expect, it } from 'vitest'
import { hueForCategory } from './placeholderHue'

describe('hueForCategory', () => {
  it('is deterministic for the same category', () => {
    expect(hueForCategory('Fitness')).toBe(hueForCategory('Fitness'))
  })

  it('returns a value between 0 and 359', () => {
    const hue = hueForCategory('Personal Growth')
    expect(hue).toBeGreaterThanOrEqual(0)
    expect(hue).toBeLessThan(360)
  })
})
```

- [ ] **Step 2: Run test to verify it fails**

```bash
cd "sites/nathamuni-com" && npm test -- placeholderHue.test.ts
```

Expected: FAIL — `Cannot find module './placeholderHue'`.

- [ ] **Step 3: Implement the hue function**

Create `sites/nathamuni-com/lib/placeholderHue.ts`:

```ts
export function hueForCategory(category: string): number {
  let hash = 0
  for (let i = 0; i < category.length; i += 1) {
    hash = (hash * 31 + category.charCodeAt(i)) % 360
  }
  return Math.abs(hash)
}
```

- [ ] **Step 4: Run test to verify it passes**

```bash
cd "sites/nathamuni-com" && npm test -- placeholderHue.test.ts
```

Expected: PASS.

- [ ] **Step 5: Implement `PlaceholderArt`**

Create `sites/nathamuni-com/components/video/PlaceholderArt.tsx`:

```tsx
import { hueForCategory } from '@/lib/placeholderHue'

export function PlaceholderArt({ category }: { category: string }) {
  const hue = hueForCategory(category)
  return (
    <div
      data-testid="placeholder-art"
      className="placeholder-art"
      style={{
        background: `linear-gradient(135deg, hsl(${hue}, 70%, 25%), hsl(${(hue + 40) % 360}, 70%, 15%))`,
      }}
    >
      <span className="placeholder-art-label">{category}</span>
    </div>
  )
}
```

- [ ] **Step 6: Write the failing test for `VideoCard`**

Create `sites/nathamuni-com/components/video/VideoCard.test.tsx`:

```tsx
import { describe, expect, it } from 'vitest'
import { render, screen } from '@testing-library/react'
import { VideoCard } from './VideoCard'
import { getAllVideos } from '@/lib/videos'

describe('VideoCard', () => {
  const video = getAllVideos()[0]

  it('renders the title, category, and description', () => {
    render(<VideoCard video={video} />)
    expect(screen.getByText(video.title)).toBeInTheDocument()
    expect(screen.getByText(video.category)).toBeInTheDocument()
    expect(screen.getByText(video.shortDescription)).toBeInTheDocument()
  })

  it('links to the video detail page', () => {
    render(<VideoCard video={video} />)
    const links = screen.getAllByRole('link')
    expect(links.some((link) => link.getAttribute('href') === `/videos/${video.id}`)).toBe(true)
  })

  it('renders placeholder art when there is no thumbnail', () => {
    render(<VideoCard video={video} />)
    expect(screen.getByTestId('placeholder-art')).toBeInTheDocument()
  })

  it('renders an image when a thumbnail is present', () => {
    render(<VideoCard video={{ ...video, thumbnail: '/images/thumbnails/example.jpg' }} />)
    expect(screen.queryByTestId('placeholder-art')).not.toBeInTheDocument()
    expect(screen.getByAltText(video.title)).toBeInTheDocument()
  })
})
```

- [ ] **Step 7: Run test to verify it fails**

```bash
cd "sites/nathamuni-com" && npm test -- VideoCard.test.tsx
```

Expected: FAIL — `Cannot find module './VideoCard'`.

- [ ] **Step 8: Implement `VideoCard`**

Create `sites/nathamuni-com/components/video/VideoCard.tsx`:

```tsx
import Link from 'next/link'
import type { Video } from '@/lib/videos'
import { PlaceholderArt } from './PlaceholderArt'

export function VideoCard({ video }: { video: Video }) {
  return (
    <article className="video-card" data-testid="video-card">
      <Link href={`/videos/${video.id}`} className="video-card-media">
        {video.thumbnail ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={video.thumbnail} alt={video.title} className="video-card-thumbnail" />
        ) : (
          <PlaceholderArt category={video.category} />
        )}
      </Link>
      <div className="video-card-body">
        <span className="video-card-category">{video.category}</span>
        <h3 className="video-card-title">
          <Link href={`/videos/${video.id}`}>{video.title}</Link>
        </h3>
        <p className="video-card-description">{video.shortDescription}</p>
        <ul className="video-card-tags">
          {video.tags.map((tag) => (
            <li key={tag} className="video-card-tag">
              #{tag}
            </li>
          ))}
        </ul>
      </div>
    </article>
  )
}
```

- [ ] **Step 9: Run test to verify it passes**

```bash
cd "sites/nathamuni-com" && npm test -- VideoCard.test.tsx
```

Expected: PASS.

- [ ] **Step 10: Write the failing test for `VideoGrid`**

Create `sites/nathamuni-com/components/video/VideoGrid.test.tsx`:

```tsx
import { describe, expect, it } from 'vitest'
import { render, screen } from '@testing-library/react'
import { VideoGrid } from './VideoGrid'
import { getAllVideos } from '@/lib/videos'

describe('VideoGrid', () => {
  it('renders a card for each video', () => {
    const videos = getAllVideos()
    render(<VideoGrid videos={videos} />)
    expect(screen.getAllByTestId('video-card')).toHaveLength(videos.length)
  })

  it('shows an empty-state message when there are no videos', () => {
    render(<VideoGrid videos={[]} />)
    expect(screen.getByTestId('video-grid-empty')).toBeInTheDocument()
    expect(screen.queryByTestId('video-card')).not.toBeInTheDocument()
  })
})
```

- [ ] **Step 11: Run test to verify it fails**

```bash
cd "sites/nathamuni-com" && npm test -- VideoGrid.test.tsx
```

Expected: FAIL — `Cannot find module './VideoGrid'`.

- [ ] **Step 12: Implement `VideoGrid`**

Create `sites/nathamuni-com/components/video/VideoGrid.tsx`:

```tsx
import type { Video } from '@/lib/videos'
import { VideoCard } from './VideoCard'

export function VideoGrid({ videos }: { videos: Video[] }) {
  if (videos.length === 0) {
    return (
      <p className="video-grid-empty" data-testid="video-grid-empty">
        No videos match your search yet — try a different keyword or category.
      </p>
    )
  }
  return (
    <div className="video-grid" data-testid="video-grid">
      {videos.map((video) => (
        <VideoCard key={video.id} video={video} />
      ))}
    </div>
  )
}
```

- [ ] **Step 13: Run test to verify it passes**

```bash
cd "sites/nathamuni-com" && npm test -- VideoGrid.test.tsx
```

Expected: PASS.

- [ ] **Step 14: Commit**

```bash
git add sites/nathamuni-com/lib/placeholderHue.ts sites/nathamuni-com/lib/placeholderHue.test.ts sites/nathamuni-com/components/video/PlaceholderArt.tsx sites/nathamuni-com/components/video/VideoCard.tsx sites/nathamuni-com/components/video/VideoGrid.tsx sites/nathamuni-com/components/video/VideoCard.test.tsx sites/nathamuni-com/components/video/VideoGrid.test.tsx
git commit -m "FEAT: add placeholder art, VideoCard, and VideoGrid components"
```

---

## Task 8: `SearchBar`, `CategoryFilter`, `VideoExplorer`

**Files:**
- Create: `sites/nathamuni-com/components/video/SearchBar.tsx`
- Create: `sites/nathamuni-com/components/video/CategoryFilter.tsx`
- Create: `sites/nathamuni-com/components/video/VideoExplorer.tsx`
- Test: `sites/nathamuni-com/components/video/VideoExplorer.test.tsx`

**Interfaces:**
- Consumes: `getAllCategories`, `searchAndFilterVideos`, `Video` from `@/lib/videos`; `VideoGrid` from Task 7.
- Produces: `<VideoExplorer videos={Video[]} featuredIds?={string[]} />`.
- Consumed by: Task 10 (Homepage), Task 12 (Video Library page).

- [ ] **Step 1: Implement `SearchBar`** (presentational, covered by the `VideoExplorer` interaction test below — not tested in isolation since it has no logic of its own beyond forwarding `onChange`)

Create `sites/nathamuni-com/components/video/SearchBar.tsx`:

```tsx
'use client'

export function SearchBar({
  value,
  onChange,
}: {
  value: string
  onChange: (value: string) => void
}) {
  return (
    <input
      type="search"
      value={value}
      onChange={(event) => onChange(event.target.value)}
      placeholder="Search videos by title, topic, or tag..."
      aria-label="Search videos"
      className="search-bar"
      data-testid="search-bar"
    />
  )
}
```

- [ ] **Step 2: Implement `CategoryFilter`** (same rationale as Step 1)

Create `sites/nathamuni-com/components/video/CategoryFilter.tsx`:

```tsx
'use client'

export function CategoryFilter({
  categories,
  selected,
  onSelect,
}: {
  categories: string[]
  selected: string | null
  onSelect: (category: string | null) => void
}) {
  return (
    <div
      className="category-filter"
      role="group"
      aria-label="Filter by category"
      data-testid="category-filter"
    >
      <button
        type="button"
        className={selected === null ? 'category-filter-btn is-active' : 'category-filter-btn'}
        onClick={() => onSelect(null)}
      >
        All
      </button>
      {categories.map((category) => (
        <button
          key={category}
          type="button"
          className={selected === category ? 'category-filter-btn is-active' : 'category-filter-btn'}
          onClick={() => onSelect(selected === category ? null : category)}
        >
          {category}
        </button>
      ))}
    </div>
  )
}
```

- [ ] **Step 3: Write the failing test for `VideoExplorer`**

Create `sites/nathamuni-com/components/video/VideoExplorer.test.tsx`:

```tsx
import { describe, expect, it } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { VideoExplorer } from './VideoExplorer'
import { getAllVideos } from '@/lib/videos'

describe('VideoExplorer', () => {
  const videos = getAllVideos()

  it('shows only featured videos by default when featuredIds is passed', () => {
    const featuredIds = videos.filter((v) => v.featured).map((v) => v.id)
    render(<VideoExplorer videos={videos} featuredIds={featuredIds} />)
    expect(screen.getAllByTestId('video-card')).toHaveLength(featuredIds.length)
  })

  it('shows all videos by default when featuredIds is not passed', () => {
    render(<VideoExplorer videos={videos} />)
    expect(screen.getAllByTestId('video-card')).toHaveLength(videos.length)
  })

  it('searches across the full set, including non-featured videos', async () => {
    const user = userEvent.setup()
    const featuredIds = videos.filter((v) => v.featured).map((v) => v.id)
    const nonFeatured = videos.find((v) => !v.featured)!
    render(<VideoExplorer videos={videos} featuredIds={featuredIds} />)

    await user.type(screen.getByTestId('search-bar'), nonFeatured.title.split(' ')[0])

    expect(screen.getByText(nonFeatured.title)).toBeInTheDocument()
  })

  it('filters by category', async () => {
    const user = userEvent.setup()
    render(<VideoExplorer videos={videos} />)
    await user.click(screen.getByRole('button', { name: 'Fitness' }))
    const cards = screen.getAllByTestId('video-card')
    const fitnessCount = videos.filter((v) => v.category === 'Fitness').length
    expect(cards).toHaveLength(fitnessCount)
  })

  it('shows the empty state when nothing matches', async () => {
    const user = userEvent.setup()
    render(<VideoExplorer videos={videos} />)
    await user.type(screen.getByTestId('search-bar'), 'zzzznomatch')
    expect(screen.getByTestId('video-grid-empty')).toBeInTheDocument()
  })
})
```

- [ ] **Step 4: Run test to verify it fails**

```bash
cd "sites/nathamuni-com" && npm test -- VideoExplorer.test.tsx
```

Expected: FAIL — `Cannot find module './VideoExplorer'`.

- [ ] **Step 5: Implement `VideoExplorer`**

Create `sites/nathamuni-com/components/video/VideoExplorer.tsx`:

```tsx
'use client'

import { useMemo, useState } from 'react'
import { getAllCategories, searchAndFilterVideos, type Video } from '@/lib/videos'
import { SearchBar } from './SearchBar'
import { CategoryFilter } from './CategoryFilter'
import { VideoGrid } from './VideoGrid'

export function VideoExplorer({
  videos,
  featuredIds,
}: {
  videos: Video[]
  featuredIds?: string[]
}) {
  const [query, setQuery] = useState('')
  const [category, setCategory] = useState<string | null>(null)
  const categories = useMemo(() => getAllCategories(), [])
  const isBrowsing = query.trim().length > 0 || category !== null

  const results = useMemo(() => {
    if (!isBrowsing && featuredIds) {
      return videos.filter((video) => featuredIds.includes(video.id))
    }
    return searchAndFilterVideos(videos, query, category)
  }, [videos, query, category, isBrowsing, featuredIds])

  return (
    <div className="video-explorer" data-testid="video-explorer">
      <div className="video-explorer-controls">
        <SearchBar value={query} onChange={setQuery} />
        <CategoryFilter categories={categories} selected={category} onSelect={setCategory} />
      </div>
      <VideoGrid videos={results} />
    </div>
  )
}
```

- [ ] **Step 6: Run test to verify it passes**

```bash
cd "sites/nathamuni-com" && npm test -- VideoExplorer.test.tsx
```

Expected: PASS.

- [ ] **Step 7: Commit**

```bash
git add sites/nathamuni-com/components/video/SearchBar.tsx sites/nathamuni-com/components/video/CategoryFilter.tsx sites/nathamuni-com/components/video/VideoExplorer.tsx sites/nathamuni-com/components/video/VideoExplorer.test.tsx
git commit -m "FEAT: add SearchBar, CategoryFilter, and VideoExplorer"
```

---

## Task 9: Layout shell — `Nav`, `Footer`, root layout, global styles

**Files:**
- Create: `sites/nathamuni-com/components/layout/Nav.tsx`
- Create: `sites/nathamuni-com/components/layout/Footer.tsx`
- Test: `sites/nathamuni-com/components/layout/Nav.test.tsx`
- Test: `sites/nathamuni-com/components/layout/Footer.test.tsx`
- Modify: `sites/nathamuni-com/app/layout.tsx`
- Modify: `sites/nathamuni-com/app/globals.css`
- Modify: `sites/nathamuni-com/tailwind.config.ts`

**Interfaces:**
- Consumes: `SOCIAL_LINKS` from `@/lib/social` (Footer).
- Produces: `<Nav />`, `<Footer />`, page shell in `app/layout.tsx`, CSS classes used by every component built so far (`.site-nav`, `.site-footer`, `.hero`, `.section`, `.video-card`, `.placeholder-art`, `.category-filter-btn`, `.social-button`, etc.)

- [ ] **Step 1: Write the failing test for `Nav`**

Create `sites/nathamuni-com/components/layout/Nav.test.tsx`:

```tsx
import { describe, expect, it } from 'vitest'
import { render, screen } from '@testing-library/react'
import { Nav } from './Nav'

describe('Nav', () => {
  it('links to every top-level route', () => {
    render(<Nav />)
    const expectedHrefs = ['/', '/videos', '/about', '/blog', '/books', '/projects']
    const links = screen.getAllByRole('link')
    expectedHrefs.forEach((href) => {
      expect(links.some((link) => link.getAttribute('href') === href)).toBe(true)
    })
  })
})
```

- [ ] **Step 2: Run test to verify it fails**

```bash
cd "sites/nathamuni-com" && npm test -- Nav.test.tsx
```

Expected: FAIL — `Cannot find module './Nav'`.

- [ ] **Step 3: Implement `Nav`**

Create `sites/nathamuni-com/components/layout/Nav.tsx`:

```tsx
import Link from 'next/link'

const NAV_LINKS = [
  { href: '/', label: 'Home' },
  { href: '/videos', label: 'Videos' },
  { href: '/about', label: 'About' },
  { href: '/blog', label: 'Blog' },
  { href: '/books', label: 'Books' },
  { href: '/projects', label: 'Projects' },
]

export function Nav() {
  return (
    <nav className="site-nav" data-testid="site-nav">
      <Link href="/" className="site-nav-brand">
        Nathamuni
      </Link>
      <ul className="site-nav-links">
        {NAV_LINKS.map((link) => (
          <li key={link.href}>
            <Link href={link.href}>{link.label}</Link>
          </li>
        ))}
      </ul>
    </nav>
  )
}
```

- [ ] **Step 4: Run test to verify it passes**

```bash
cd "sites/nathamuni-com" && npm test -- Nav.test.tsx
```

Expected: PASS.

- [ ] **Step 5: Write the failing test for `Footer`**

Create `sites/nathamuni-com/components/layout/Footer.test.tsx`:

```tsx
import { describe, expect, it } from 'vitest'
import { render, screen } from '@testing-library/react'
import { Footer } from './Footer'
import { SOCIAL_LINKS } from '@/lib/social'

describe('Footer', () => {
  it('links to Instagram and YouTube', () => {
    render(<Footer />)
    expect(screen.getByTestId('footer-instagram')).toHaveAttribute('href', SOCIAL_LINKS.instagram)
    expect(screen.getByTestId('footer-youtube')).toHaveAttribute('href', SOCIAL_LINKS.youtube)
  })
})
```

- [ ] **Step 6: Run test to verify it fails**

```bash
cd "sites/nathamuni-com" && npm test -- Footer.test.tsx
```

Expected: FAIL — `Cannot find module './Footer'`.

- [ ] **Step 7: Implement `Footer`**

Create `sites/nathamuni-com/components/layout/Footer.tsx`:

```tsx
import { SOCIAL_LINKS } from '@/lib/social'

export function Footer() {
  return (
    <footer className="site-footer" data-testid="site-footer">
      <p>Nathamuni. All rights reserved.</p>
      <div className="site-footer-social">
        <a
          href={SOCIAL_LINKS.instagram}
          target="_blank"
          rel="noreferrer"
          data-testid="footer-instagram"
        >
          Instagram
        </a>
        <a
          href={SOCIAL_LINKS.youtube}
          target="_blank"
          rel="noreferrer"
          data-testid="footer-youtube"
        >
          YouTube
        </a>
      </div>
    </footer>
  )
}
```

(No dynamic year — keeps the component free of non-deterministic output and avoids a static-export page showing a build-time year that looks "wrong" a year after the last deploy.)

- [ ] **Step 8: Run test to verify it passes**

```bash
cd "sites/nathamuni-com" && npm test -- Footer.test.tsx
```

Expected: PASS.

- [ ] **Step 9: Add design tokens to Tailwind config**

Replace the contents of `sites/nathamuni-com/tailwind.config.ts` with:

```ts
import type { Config } from 'tailwindcss'

const config: Config = {
  content: ['./app/**/*.{ts,tsx}', './components/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        base: '#0a0a0f',
        glass: 'rgba(255, 255, 255, 0.06)',
        'glass-border': 'rgba(255, 255, 255, 0.12)',
        accent: '#8b5cf6',
      },
      fontFamily: {
        display: ['var(--font-outfit)', 'sans-serif'],
        body: ['var(--font-inter)', 'sans-serif'],
      },
    },
  },
  plugins: [],
}

export default config
```

- [ ] **Step 10: Write global styles**

Replace the contents of `sites/nathamuni-com/app/globals.css` with:

```css
@tailwind base;
@tailwind components;
@tailwind utilities;

@layer base {
  body {
    @apply bg-base text-white font-body min-h-screen;
  }
  h1,
  h2,
  h3 {
    @apply font-display;
  }
}

@layer components {
  .glass-card {
    @apply bg-glass border border-glass-border backdrop-blur-xl rounded-2xl;
  }

  .site-nav {
    @apply glass-card sticky top-0 z-10 flex items-center justify-between px-4 py-3 mx-4 mt-4 sm:mx-8;
  }
  .site-nav-brand {
    @apply font-display text-lg tracking-wide;
  }
  .site-nav-links {
    @apply flex gap-4 text-sm overflow-x-auto;
  }

  .site-footer {
    @apply mt-16 px-4 py-8 sm:px-8 flex flex-col sm:flex-row items-center justify-between gap-4 text-sm text-white/60;
  }
  .site-footer-social {
    @apply flex gap-4;
  }

  .hero {
    @apply flex flex-col-reverse sm:flex-row items-center gap-8 px-4 sm:px-8 py-12 max-w-5xl mx-auto;
  }
  .hero-copy {
    @apply flex-1 flex flex-col gap-6 text-center sm:text-left;
  }
  .hero-bio {
    @apply text-lg sm:text-xl leading-relaxed;
  }
  .hero-portrait {
    @apply flex-shrink-0 w-64 h-64 sm:w-80 sm:h-80;
  }

  .kinetic-portrait {
    @apply relative w-full h-full;
  }
  .kinetic-portrait-video {
    @apply absolute inset-0 w-full h-full object-contain transition-opacity duration-150;
  }
  .kinetic-portrait-video-reverse {
    @apply opacity-0 pointer-events-none;
  }
  .kinetic-portrait-fallback {
    @apply w-full h-full object-contain rounded-full;
  }

  .section {
    @apply px-4 sm:px-8 py-10 max-w-5xl mx-auto;
  }
  .section-title {
    @apply text-2xl mb-6;
  }

  .video-explorer-controls {
    @apply flex flex-col sm:flex-row gap-4 mb-8;
  }
  .search-bar {
    @apply glass-card flex-1 px-4 py-2 bg-transparent outline-none placeholder-white/40;
  }
  .category-filter {
    @apply flex flex-wrap gap-2;
  }
  .category-filter-btn {
    @apply glass-card px-3 py-1 text-sm text-white/70 hover:text-white transition-colors;
  }
  .category-filter-btn.is-active {
    @apply text-white border-accent;
  }

  .video-grid {
    @apply grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6;
  }
  .video-grid-empty {
    @apply text-white/60 text-center py-12;
  }

  .video-card {
    @apply glass-card overflow-hidden flex flex-col;
  }
  .video-card-media {
    @apply block aspect-video;
  }
  .video-card-thumbnail {
    @apply w-full h-full object-cover;
  }
  .video-card-body {
    @apply p-4 flex flex-col gap-2;
  }
  .video-card-category {
    @apply text-xs uppercase tracking-wide text-accent;
  }
  .video-card-title {
    @apply text-lg;
  }
  .video-card-description {
    @apply text-sm text-white/70;
  }
  .video-card-tags {
    @apply flex flex-wrap gap-2 mt-2;
  }
  .video-card-tag {
    @apply text-xs text-white/50;
  }

  .placeholder-art {
    @apply w-full h-full flex items-center justify-center;
  }
  .placeholder-art-label {
    @apply text-white/80 font-display text-sm uppercase tracking-widest;
  }

  .social-buttons {
    @apply flex flex-wrap gap-4 justify-center sm:justify-start;
  }
  .social-button {
    @apply glass-card px-5 py-2 text-sm transition-colors;
  }
  .social-button-primary {
    @apply border-accent text-white;
  }
  .social-button-secondary {
    @apply text-white/60;
  }

  .about-preview,
  .about-content,
  .coming-soon,
  .video-detail {
    @apply glass-card p-6 sm:p-10;
  }

  .placeholders-grid {
    @apply grid grid-cols-1 sm:grid-cols-3 gap-4;
  }
  .placeholder-card {
    @apply glass-card p-6 text-center text-white/70 hover:text-white transition-colors;
  }

  .link-more {
    @apply inline-block mt-4 text-accent;
  }

  .video-detail {
    @apply flex flex-col sm:flex-row gap-8;
  }
  .video-detail-media {
    @apply w-full sm:w-1/3 aspect-video rounded-xl overflow-hidden flex-shrink-0;
  }
  .video-detail-thumbnail {
    @apply w-full h-full object-cover;
  }
  .video-detail-body {
    @apply flex-1 flex flex-col gap-3;
  }
  .video-detail-title {
    @apply text-2xl;
  }
  .video-detail-description {
    @apply text-white/80 leading-relaxed;
  }
  .video-detail-lessons ul {
    @apply list-disc list-inside text-white/70 mt-2;
  }
}
```

- [ ] **Step 11: Wire the root layout**

Replace the contents of `sites/nathamuni-com/app/layout.tsx` with:

```tsx
import type { Metadata } from 'next'
import { Outfit, Inter } from 'next/font/google'
import { Nav } from '@/components/layout/Nav'
import { Footer } from '@/components/layout/Footer'
import './globals.css'

const outfit = Outfit({
  subsets: ['latin'],
  weight: ['300', '400', '600', '800'],
  variable: '--font-outfit',
})
const inter = Inter({
  subsets: ['latin'],
  weight: ['400', '500', '700'],
  variable: '--font-inter',
})

export const metadata: Metadata = {
  title: 'Nathamuni — Distinguished Engineer, Author, AI Architect',
  description:
    "A searchable home for Nathamuni's videos on personal growth, calisthenics, and AI — organized by topic instead of an endless scroll.",
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={`${outfit.variable} ${inter.variable}`}>
      <body>
        <Nav />
        <main>{children}</main>
        <Footer />
      </body>
    </html>
  )
}
```

- [ ] **Step 12: Commit**

```bash
git add sites/nathamuni-com/components/layout/Nav.tsx sites/nathamuni-com/components/layout/Footer.tsx sites/nathamuni-com/components/layout/Nav.test.tsx sites/nathamuni-com/components/layout/Footer.test.tsx sites/nathamuni-com/app/layout.tsx sites/nathamuni-com/app/globals.css sites/nathamuni-com/tailwind.config.ts
git commit -m "FEAT: add Nav, Footer, root layout, and glassmorphic design tokens"
```

---

## Task 10: `AboutPreview` and `PlaceholdersRow` components

**Files:**
- Create: `sites/nathamuni-com/components/about/AboutPreview.tsx`
- Create: `sites/nathamuni-com/components/layout/PlaceholdersRow.tsx`
- Test: `sites/nathamuni-com/components/about/AboutPreview.test.tsx`
- Test: `sites/nathamuni-com/components/layout/PlaceholdersRow.test.tsx`

**Interfaces:**
- Produces: `<AboutPreview />`, `<PlaceholdersRow />` (no props).
- Consumed by: Task 11 (Homepage assembly).

- [ ] **Step 1: Write the failing test for `AboutPreview`**

Create `sites/nathamuni-com/components/about/AboutPreview.test.tsx`:

```tsx
import { describe, expect, it } from 'vitest'
import { render, screen } from '@testing-library/react'
import { AboutPreview } from './AboutPreview'

describe('AboutPreview', () => {
  it('links to the full about page', () => {
    render(<AboutPreview />)
    expect(screen.getByTestId('about-preview-link')).toHaveAttribute('href', '/about')
  })
})
```

- [ ] **Step 2: Run test to verify it fails**

```bash
cd "sites/nathamuni-com" && npm test -- AboutPreview.test.tsx
```

Expected: FAIL — `Cannot find module './AboutPreview'`.

- [ ] **Step 3: Implement `AboutPreview`**

Create `sites/nathamuni-com/components/about/AboutPreview.tsx`:

```tsx
import Link from 'next/link'

export function AboutPreview() {
  return (
    <section className="section about-preview" data-testid="about-preview">
      <h2 className="section-title">About</h2>
      <p>
        I turn six months of testing 50 thinkers&apos; life philosophies, calisthenics
        training, and AI architecture work into short, useful videos — so you don&apos;t have
        to scroll to find the one that matters to you right now.
      </p>
      <Link href="/about" className="link-more" data-testid="about-preview-link">
        Read more →
      </Link>
    </section>
  )
}
```

- [ ] **Step 4: Run test to verify it passes**

```bash
cd "sites/nathamuni-com" && npm test -- AboutPreview.test.tsx
```

Expected: PASS.

- [ ] **Step 5: Write the failing test for `PlaceholdersRow`**

Create `sites/nathamuni-com/components/layout/PlaceholdersRow.test.tsx`:

```tsx
import { describe, expect, it } from 'vitest'
import { render, screen } from '@testing-library/react'
import { PlaceholdersRow } from './PlaceholdersRow'

describe('PlaceholdersRow', () => {
  it('links to blog, books, and projects', () => {
    render(<PlaceholdersRow />)
    const links = screen.getAllByRole('link')
    expect(links.some((link) => link.getAttribute('href') === '/blog')).toBe(true)
    expect(links.some((link) => link.getAttribute('href') === '/books')).toBe(true)
    expect(links.some((link) => link.getAttribute('href') === '/projects')).toBe(true)
  })
})
```

- [ ] **Step 6: Run test to verify it fails**

```bash
cd "sites/nathamuni-com" && npm test -- PlaceholdersRow.test.tsx
```

Expected: FAIL — `Cannot find module './PlaceholdersRow'`.

- [ ] **Step 7: Implement `PlaceholdersRow`**

Create `sites/nathamuni-com/components/layout/PlaceholdersRow.tsx`:

```tsx
import Link from 'next/link'

const PLACEHOLDERS = [
  { href: '/blog', label: 'Blog' },
  { href: '/books', label: 'Books & Writings' },
  { href: '/projects', label: 'Projects' },
]

export function PlaceholdersRow() {
  return (
    <section className="section placeholders-row" data-testid="placeholders-row">
      <h2 className="section-title">More coming soon</h2>
      <div className="placeholders-grid">
        {PLACEHOLDERS.map((item) => (
          <Link key={item.href} href={item.href} className="placeholder-card">
            {item.label}
          </Link>
        ))}
      </div>
    </section>
  )
}
```

- [ ] **Step 8: Run test to verify it passes**

```bash
cd "sites/nathamuni-com" && npm test -- PlaceholdersRow.test.tsx
```

Expected: PASS.

- [ ] **Step 9: Commit**

```bash
git add sites/nathamuni-com/components/about/AboutPreview.tsx sites/nathamuni-com/components/about/AboutPreview.test.tsx sites/nathamuni-com/components/layout/PlaceholdersRow.tsx sites/nathamuni-com/components/layout/PlaceholdersRow.test.tsx
git commit -m "FEAT: add AboutPreview and PlaceholdersRow components"
```

---

## Task 11: Homepage assembly

**Files:**
- Modify: `sites/nathamuni-com/app/page.tsx`

**Interfaces:**
- Consumes: `getAllVideos`, `getFeaturedVideos` from `@/lib/videos`; `KineticPortrait` (Task 6); `SocialButtons` (Task 4); `VideoExplorer` (Task 8); `AboutPreview` (Task 10); `PlaceholdersRow` (Task 10).
- Produces: the `/` route.

This task assembles already-tested components into the homepage. `app/page.tsx` is a server component with no logic of its own, so it is verified by build + manual check rather than a unit test (Next.js App Router server-component page files are not practical to render in Vitest/jsdom the way plain components are — every real piece of content on this page already has its own test from Tasks 4, 6, 8, and 10).

- [ ] **Step 1: Replace the homepage**

Replace the contents of `sites/nathamuni-com/app/page.tsx` with:

```tsx
import { getAllVideos, getFeaturedVideos } from '@/lib/videos'
import { KineticPortrait } from '@/components/hero/KineticPortrait'
import { SocialButtons } from '@/components/layout/SocialButtons'
import { VideoExplorer } from '@/components/video/VideoExplorer'
import { AboutPreview } from '@/components/about/AboutPreview'
import { PlaceholdersRow } from '@/components/layout/PlaceholdersRow'

export default function HomePage() {
  const videos = getAllVideos()
  const featuredIds = getFeaturedVideos().map((video) => video.id)

  return (
    <>
      <section className="hero" data-testid="hero-section">
        <div className="hero-portrait">
          <KineticPortrait />
        </div>
        <div className="hero-copy">
          <p className="hero-bio">
            ☬ Fear lives in one place only... Thats in you Mind🗿
            <br />
            Distinguished Engr | Author | Calisthenics | Meditation | Memer | AI Architect |
            Generalist
          </p>
          <SocialButtons />
        </div>
      </section>

      <section className="section" aria-labelledby="explore-heading">
        <h2 id="explore-heading" className="section-title">
          Explore the library
        </h2>
        <VideoExplorer videos={videos} featuredIds={featuredIds} />
      </section>

      <AboutPreview />
      <PlaceholdersRow />
    </>
  )
}
```

- [ ] **Step 2: Verify manually**

```bash
cd "sites/nathamuni-com" && npm run dev
```

Open `http://localhost:3000` and confirm: hero renders with bio and portrait, search bar filters the grid, category buttons filter the grid, default grid shows exactly the 3 featured videos, about preview and placeholders row render below.

- [ ] **Step 3: Run the full test suite and build**

```bash
cd "sites/nathamuni-com" && npm test && npm run build
```

Expected: all tests PASS, build succeeds.

- [ ] **Step 4: Commit**

```bash
git add sites/nathamuni-com/app/page.tsx
git commit -m "FEAT: assemble homepage from hero, video explorer, about preview, and placeholders"
```

---

## Task 12: About page, Video Library page, coming-soon pages

**Files:**
- Create: `sites/nathamuni-com/components/about/AboutContent.tsx`
- Create: `sites/nathamuni-com/components/layout/ComingSoon.tsx`
- Test: `sites/nathamuni-com/components/about/AboutContent.test.tsx`
- Test: `sites/nathamuni-com/components/layout/ComingSoon.test.tsx`
- Modify: `sites/nathamuni-com/app/about/page.tsx`
- Modify: `sites/nathamuni-com/app/videos/page.tsx`
- Create: `sites/nathamuni-com/app/blog/page.tsx`
- Create: `sites/nathamuni-com/app/books/page.tsx`
- Create: `sites/nathamuni-com/app/projects/page.tsx`

**Interfaces:**
- Consumes: `SocialButtons` (Task 4), `VideoExplorer` (Task 8), `getAllVideos` (Task 3).
- Produces: `/about`, `/videos`, `/blog`, `/books`, `/projects` routes.

- [ ] **Step 1: Write the failing test for `AboutContent`**

Create `sites/nathamuni-com/components/about/AboutContent.test.tsx`:

```tsx
import { describe, expect, it } from 'vitest'
import { render, screen } from '@testing-library/react'
import { AboutContent } from './AboutContent'

describe('AboutContent', () => {
  it('renders the bio and social buttons', () => {
    render(<AboutContent />)
    expect(screen.getByRole('heading', { name: 'About' })).toBeInTheDocument()
    expect(screen.getByTestId('social-buttons')).toBeInTheDocument()
  })
})
```

- [ ] **Step 2: Run test to verify it fails**

```bash
cd "sites/nathamuni-com" && npm test -- AboutContent.test.tsx
```

Expected: FAIL — `Cannot find module './AboutContent'`.

- [ ] **Step 3: Implement `AboutContent`**

Create `sites/nathamuni-com/components/about/AboutContent.tsx`:

```tsx
import { SocialButtons } from '@/components/layout/SocialButtons'

export function AboutContent() {
  return (
    <section className="section about-content" data-testid="about-content">
      <h1 className="section-title">About</h1>
      <p>☬ Fear lives in one place only... Thats in you Mind🗿</p>
      <p>
        Distinguished Engr | Author | Calisthenics | Meditation | Memer | AI Architect |
        Generalist
      </p>
      <p>
        I spent six months putting the core ideas of 50 different thinkers to the test in my
        own life, and now I share what actually holds up — personal growth, calisthenics
        training, and the occasional roast of my own DMs — in short videos instead of long
        threads. This site exists so you can search and find the one that&apos;s useful to you
        right now, instead of scrolling for it.
      </p>
      <SocialButtons />
    </section>
  )
}
```

- [ ] **Step 4: Run test to verify it passes**

```bash
cd "sites/nathamuni-com" && npm test -- AboutContent.test.tsx
```

Expected: PASS.

- [ ] **Step 5: Wire the about page**

Replace the contents of `sites/nathamuni-com/app/about/page.tsx` with:

```tsx
import { AboutContent } from '@/components/about/AboutContent'

export default function AboutPage() {
  return <AboutContent />
}
```

- [ ] **Step 6: Write the failing test for `ComingSoon`**

Create `sites/nathamuni-com/components/layout/ComingSoon.test.tsx`:

```tsx
import { describe, expect, it } from 'vitest'
import { render, screen } from '@testing-library/react'
import { ComingSoon } from './ComingSoon'

describe('ComingSoon', () => {
  it('renders the given title and description, and a link home', () => {
    render(<ComingSoon title="Blog" description="Coming soon." />)
    expect(screen.getByRole('heading', { name: 'Blog' })).toBeInTheDocument()
    expect(screen.getByText('Coming soon.')).toBeInTheDocument()
    expect(screen.getByRole('link', { name: /back home/i })).toHaveAttribute('href', '/')
  })
})
```

- [ ] **Step 7: Run test to verify it fails**

```bash
cd "sites/nathamuni-com" && npm test -- ComingSoon.test.tsx
```

Expected: FAIL — `Cannot find module './ComingSoon'`.

- [ ] **Step 8: Implement `ComingSoon`**

Create `sites/nathamuni-com/components/layout/ComingSoon.tsx`:

```tsx
import Link from 'next/link'

export function ComingSoon({ title, description }: { title: string; description: string }) {
  return (
    <section className="section coming-soon" data-testid="coming-soon">
      <h1 className="section-title">{title}</h1>
      <p>{description}</p>
      <Link href="/" className="link-more">
        ← Back home
      </Link>
    </section>
  )
}
```

- [ ] **Step 9: Run test to verify it passes**

```bash
cd "sites/nathamuni-com" && npm test -- ComingSoon.test.tsx
```

Expected: PASS.

- [ ] **Step 10: Wire the three placeholder pages**

Create `sites/nathamuni-com/app/blog/page.tsx`:

```tsx
import { ComingSoon } from '@/components/layout/ComingSoon'

export default function BlogPage() {
  return (
    <ComingSoon
      title="Blog"
      description="Long-form writing is coming soon. For now, catch the short-form breakdowns in the video library."
    />
  )
}
```

Create `sites/nathamuni-com/app/books/page.tsx`:

```tsx
import { ComingSoon } from '@/components/layout/ComingSoon'

export default function BooksPage() {
  return (
    <ComingSoon
      title="Books & Writings"
      description="Book notes and longer writings are coming soon."
    />
  )
}
```

Create `sites/nathamuni-com/app/projects/page.tsx`:

```tsx
import { ComingSoon } from '@/components/layout/ComingSoon'

export default function ProjectsPage() {
  return (
    <ComingSoon
      title="Projects"
      description="Project write-ups and case studies are coming soon."
    />
  )
}
```

- [ ] **Step 11: Wire the video library page**

Replace the contents of `sites/nathamuni-com/app/videos/page.tsx` with:

```tsx
import { getAllVideos } from '@/lib/videos'
import { VideoExplorer } from '@/components/video/VideoExplorer'

export default function VideosPage() {
  const videos = getAllVideos()
  return (
    <section className="section">
      <h1 className="section-title">Video Library</h1>
      <VideoExplorer videos={videos} />
    </section>
  )
}
```

- [ ] **Step 12: Run the full test suite and build**

```bash
cd "sites/nathamuni-com" && npm test && npm run build
```

Expected: all tests PASS, build succeeds, `out/about/index.html`, `out/videos/index.html`, `out/blog/index.html`, `out/books/index.html`, `out/projects/index.html` all exist.

- [ ] **Step 13: Commit**

```bash
git add sites/nathamuni-com/components/about/AboutContent.tsx sites/nathamuni-com/components/about/AboutContent.test.tsx sites/nathamuni-com/components/layout/ComingSoon.tsx sites/nathamuni-com/components/layout/ComingSoon.test.tsx sites/nathamuni-com/app/about/page.tsx sites/nathamuni-com/app/videos/page.tsx sites/nathamuni-com/app/blog/page.tsx sites/nathamuni-com/app/books/page.tsx sites/nathamuni-com/app/projects/page.tsx
git commit -m "FEAT: add about page, video library page, and coming-soon placeholder pages"
```

---

## Task 13: Video detail page

**Files:**
- Create: `sites/nathamuni-com/components/video/VideoDetail.tsx`
- Test: `sites/nathamuni-com/components/video/VideoDetail.test.tsx`
- Modify: `sites/nathamuni-com/app/videos/[slug]/page.tsx`

**Interfaces:**
- Consumes: `Video`, `getAllVideos`, `getVideoBySlug` from `@/lib/videos`; `PlaceholderArt` (Task 7).
- Produces: the `/videos/[slug]` route for all 6 videos.

- [ ] **Step 1: Write the failing test**

Create `sites/nathamuni-com/components/video/VideoDetail.test.tsx`:

```tsx
import { describe, expect, it } from 'vitest'
import { render, screen } from '@testing-library/react'
import { VideoDetail } from './VideoDetail'
import { getAllVideos, getVideoBySlug } from '@/lib/videos'

describe('VideoDetail', () => {
  it('renders the title, description, category, and tags', () => {
    const video = getVideoBySlug('generations-and-wisdom')!
    render(<VideoDetail video={video} />)
    expect(screen.getByRole('heading', { name: video.title })).toBeInTheDocument()
    expect(screen.getByText(video.detailedDescription)).toBeInTheDocument()
    expect(screen.getByText(video.category)).toBeInTheDocument()
    video.tags.forEach((tag) => {
      expect(screen.getByText(`#${tag}`)).toBeInTheDocument()
    })
  })

  it('links to Instagram', () => {
    const video = getVideoBySlug('generations-and-wisdom')!
    render(<VideoDetail video={video} />)
    expect(screen.getByTestId('watch-on-instagram')).toHaveAttribute('href', video.instagramUrl)
  })

  it('renders key lessons when present', () => {
    const video = getVideoBySlug('generations-and-wisdom')!
    render(<VideoDetail video={video} />)
    expect(screen.getByTestId('video-detail-lessons')).toBeInTheDocument()
  })

  it('omits the key lessons block when absent', () => {
    const video = getAllVideos().find((v) => !v.keyLessons)!
    render(<VideoDetail video={video} />)
    expect(screen.queryByTestId('video-detail-lessons')).not.toBeInTheDocument()
  })
})
```

- [ ] **Step 2: Run test to verify it fails**

```bash
cd "sites/nathamuni-com" && npm test -- VideoDetail.test.tsx
```

Expected: FAIL — `Cannot find module './VideoDetail'`.

- [ ] **Step 3: Implement `VideoDetail`**

Create `sites/nathamuni-com/components/video/VideoDetail.tsx`:

```tsx
import type { Video } from '@/lib/videos'
import { PlaceholderArt } from './PlaceholderArt'

export function VideoDetail({ video }: { video: Video }) {
  return (
    <article className="section video-detail" data-testid="video-detail">
      <div className="video-detail-media">
        {video.thumbnail ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={video.thumbnail} alt={video.title} className="video-detail-thumbnail" />
        ) : (
          <PlaceholderArt category={video.category} />
        )}
      </div>
      <div className="video-detail-body">
        <span className="video-card-category">{video.category}</span>
        <h1 className="video-detail-title">{video.title}</h1>
        <p className="video-detail-description">{video.detailedDescription}</p>
        <ul className="video-card-tags">
          {video.tags.map((tag) => (
            <li key={tag} className="video-card-tag">
              #{tag}
            </li>
          ))}
        </ul>
        {video.keyLessons && video.keyLessons.length > 0 && (
          <div className="video-detail-lessons" data-testid="video-detail-lessons">
            <h2>Key lessons</h2>
            <ul>
              {video.keyLessons.map((lesson) => (
                <li key={lesson}>{lesson}</li>
              ))}
            </ul>
          </div>
        )}
        <a
          href={video.instagramUrl}
          target="_blank"
          rel="noreferrer"
          className="social-button social-button-primary"
          data-testid="watch-on-instagram"
        >
          Watch on Instagram
        </a>
      </div>
    </article>
  )
}
```

- [ ] **Step 4: Run test to verify it passes**

```bash
cd "sites/nathamuni-com" && npm test -- VideoDetail.test.tsx
```

Expected: PASS.

- [ ] **Step 5: Wire the dynamic route**

Replace the contents of `sites/nathamuni-com/app/videos/[slug]/page.tsx` with:

```tsx
import { notFound } from 'next/navigation'
import { getAllVideos, getVideoBySlug } from '@/lib/videos'
import { VideoDetail } from '@/components/video/VideoDetail'

export function generateStaticParams() {
  return getAllVideos().map((video) => ({ slug: video.id }))
}

export default function VideoDetailPage({ params }: { params: { slug: string } }) {
  const video = getVideoBySlug(params.slug)
  if (!video) {
    notFound()
  }
  return <VideoDetail video={video} />
}
```

- [ ] **Step 6: Run the full test suite and build**

```bash
cd "sites/nathamuni-com" && npm test && npm run build
```

Expected: all tests PASS, build succeeds, and `out/videos/roast-of-dms/index.html` (and the other 5 slugs) exist.

- [ ] **Step 7: Commit**

```bash
git add "sites/nathamuni-com/components/video/VideoDetail.tsx" "sites/nathamuni-com/components/video/VideoDetail.test.tsx" "sites/nathamuni-com/app/videos/[slug]/page.tsx"
git commit -m "FEAT: add video detail page with generateStaticParams for static export"
```

---

## Task 14: Real hero assets, fallback image, final verification

**Files:**
- Create: `sites/nathamuni-com/public/video/portrait-forward.webm`
- Create: `sites/nathamuni-com/public/video/portrait-reverse.webm`
- Create: `sites/nathamuni-com/public/images/portrait-fallback.png`

**Interfaces:**
- Consumed by: `KineticPortrait` (Task 6), which already references these exact paths.

- [ ] **Step 1: Copy the hero video assets from the reference project**

```bash
mkdir -p "sites/nathamuni-com/public/video" "sites/nathamuni-com/public/images"
cp "/home/nathamuni/ Projects/Antigravity/revealIT-Experience/asserts/profilepic/smooth-transparent.webm" \
   "sites/nathamuni-com/public/video/portrait-forward.webm"
cp "/home/nathamuni/ Projects/Antigravity/revealIT-Experience/asserts/profilepic/smooth-reverse-transparent.webm" \
   "sites/nathamuni-com/public/video/portrait-reverse.webm"
cp "/home/nathamuni/ Projects/Antigravity/revealIT-Experience/asserts/profilepic/pic.png" \
   "sites/nathamuni-com/public/images/portrait-fallback.png"
```

- [ ] **Step 2: Verify the files landed**

```bash
ls -la "sites/nathamuni-com/public/video" "sites/nathamuni-com/public/images"
```

Expected: `portrait-forward.webm`, `portrait-reverse.webm`, `portrait-fallback.png` all present and non-zero size.

- [ ] **Step 3: Manually verify the hero in a browser**

```bash
cd "sites/nathamuni-com" && npm run dev
```

Open `http://localhost:3000` in a desktop browser: hover over the portrait and confirm the forward clip plays, move the mouse away and confirm the reverse clip plays. Then open the same URL in a mobile emulation view (browser dev tools → toggle device toolbar) and confirm the portrait loops forward/reverse automatically without needing interaction.

- [ ] **Step 4: Full verification pass**

```bash
cd "sites/nathamuni-com" && npm run lint && npm run type-check && npm test && npm run build
```

Expected: all four commands succeed with no errors.

- [ ] **Step 5: Commit**

```bash
git add "sites/nathamuni-com/public/video" "sites/nathamuni-com/public/images"
git commit -m "FEAT: add real kinetic-portrait hero assets and fallback image"
```

---

## Post-plan follow-ups (not part of this plan's acceptance criteria)

- Real thumbnails for the 6 videos, once supplied.
- Category/tag review pass by the user (all values in `lib/videos.json` are first-pass drafts).
- Cloudflare Pages project setup pointing at `sites/nathamuni-com/`, build command `npm run build`, output directory `out/`, DNS for the apex `nathamuni.com`.
