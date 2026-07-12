# SEO: Rank nathamuni.com for the branded query "Nathamuni" — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Maximize on-page/technical SEO signals so Google associates the name "Nathamuni" with nathamuni.com (site-name display, knowledge signals, full crawl coverage), plus a documented off-page checklist for the parts only the owner can do.

**Architecture:** All changes live in `sites/nathamuni-com/` (Next.js 16 static export served by a Cloudflare Worker). We enrich the root layout's structured data (add `WebSite` schema + a fuller `Person` schema linked by `@id`), add `ProfilePage` schema to /about, complete the sitemap, and wire optional Google/Bing verification meta tags via env vars. Off-page steps (Search Console, sitemap submission, backlinks) go in `docs/seo.md`.

**Tech Stack:** Next.js App Router Metadata API, schema.org JSON-LD, vitest.

## Global Constraints

- Site is `output: 'export'` — everything must be statically renderable (no request-time code).
- `lib/profile.ts` is the single source of truth for bio copy; don't duplicate strings that exist there.
- No hidden-text/keyword-stuffing tricks; white-hat only.
- Honest scope note: "Nathamuni" also matches the 10th-century Vaishnava acharya (Wikipedia). On-page work secures the site-name/brand panel and top placement for navigational intent; beating Wikipedia outright also requires the off-page checklist (GSC verification, sameAs profile links back, time).

---

### Task 1: Complete the sitemap (/journey, /ask)

**Files:**
- Modify: `sites/nathamuni-com/app/sitemap.ts`

**Interfaces:** none new.

- [ ] **Step 1:** In `staticRoutes`, after the `/about` entry add:

```ts
    { url: `${SITE_URL}/journey`, priority: 0.5 },
    { url: `${SITE_URL}/ask`, priority: 0.4 },
```

- [ ] **Step 2:** Run `npm run type-check` — expect clean.
- [ ] **Step 3:** Commit `FIX: add /journey and /ask to sitemap`.

### Task 2: WebSite + enriched Person JSON-LD in root layout

**Files:**
- Modify: `sites/nathamuni-com/app/layout.tsx`

**Interfaces:** Produces `#person` / `#website` schema `@id`s used by Task 3.

- [ ] **Step 1:** Replace `personJsonLd` with a single `@graph` document:

```ts
const siteJsonLd = {
  '@context': 'https://schema.org',
  '@graph': [
    {
      '@type': 'WebSite',
      '@id': `${SITE_URL}/#website`,
      url: SITE_URL,
      name: PROFILE.name,
      alternateName: ['Nathamuni.com', 'nathamuni'],
      description: PROFILE.metaDescription,
      publisher: { '@id': `${SITE_URL}/#person` },
      inLanguage: 'en',
    },
    {
      '@type': 'Person',
      '@id': `${SITE_URL}/#person`,
      name: PROFILE.name,
      url: SITE_URL,
      image: `${SITE_URL}/images/generated/about-portrait.jpg`,
      jobTitle: PROFILE.jobTitle,
      description: PROFILE.metaDescription,
      knowsAbout: ['Artificial Intelligence', 'Software Engineering', 'Calisthenics', 'Meditation', 'Writing'],
      homeLocation: { '@type': 'Place', name: 'Chennai, Tamil Nadu, India' },
      mainEntityOfPage: { '@id': `${SITE_URL}/#website` },
      sameAs: [SOCIAL_LINKS.instagram, SOCIAL_LINKS.youtube],
    },
  ],
}
```

and render it in the existing `<script type="application/ld+json">`.

- [ ] **Step 2:** `npm run type-check` + `npm run build` — expect clean.
- [ ] **Step 3:** Commit `FEAT: WebSite + enriched Person structured data`.

### Task 3: ProfilePage JSON-LD on /about

**Files:**
- Modify: `sites/nathamuni-com/app/about/page.tsx`

**Interfaces:** Consumes `#person` `@id` from Task 2.

- [ ] **Step 1:** Add before the page's returned markup:

```ts
const profilePageJsonLd = {
  '@context': 'https://schema.org',
  '@type': 'ProfilePage',
  mainEntity: { '@id': `${SITE_URL}/#person` },
  url: `${SITE_URL}/about`,
  name: `About ${PROFILE.name}`,
}
```

and a `<script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(profilePageJsonLd) }} />` at the top of the returned JSX (import `SITE_URL`/`PROFILE` if not already).

- [ ] **Step 2:** `npm run build` — expect clean.
- [ ] **Step 3:** Commit `FEAT: ProfilePage schema on /about`.

### Task 4: Search-engine verification hooks

**Files:**
- Modify: `sites/nathamuni-com/app/layout.tsx` (metadata)

- [ ] **Step 1:** Add to `metadata`:

```ts
  verification: {
    google: process.env.NEXT_PUBLIC_GOOGLE_SITE_VERIFICATION,
    other: process.env.NEXT_PUBLIC_BING_SITE_VERIFICATION
      ? { 'msvalidate.01': process.env.NEXT_PUBLIC_BING_SITE_VERIFICATION }
      : undefined,
  },
```

(undefined values render nothing, so it's safe before tokens exist).

- [ ] **Step 2:** `npm run build` — expect clean.
- [ ] **Step 3:** Commit `FEAT: env-driven Google/Bing verification meta tags`.

### Task 5: Off-page SEO runbook

**Files:**
- Create: `sites/nathamuni-com/docs/seo.md`

- [ ] **Step 1:** Write the runbook: GSC domain-property verification (DNS TXT via Cloudflare — preferred over meta tag), submit `https://nathamuni.com/sitemap.xml`, Bing Webmaster import-from-GSC, put nathamuni.com in the Instagram bio and YouTube channel links (reciprocal `sameAs`), request indexing of `/`, monitor "Nathamuni" query in GSC Performance, realistic expectations vs. Wikipedia acharya page.
- [ ] **Step 2:** Commit `DOCS: SEO runbook for Search Console + off-page`.

### Task 6: Verify, push, PR

- [ ] Run `npm run lint && npm run type-check && npm test && npm run build` in `sites/nathamuni-com/`.
- [ ] Inspect `out/sitemap.xml`, `out/index.html` (JSON-LD present), `out/about/index.html`.
- [ ] Push branch `feat/seo-nathamuni`, open PR to `main`.

## Self-Review

- Coverage: site-name signal (Task 2), entity/knowledge signal (Tasks 2–3), crawl coverage (Task 1), verification (Task 4), owner actions (Task 5). ✔
- No placeholders; all code shown. ✔
- `@id` strings consistent (`${SITE_URL}/#person`, `${SITE_URL}/#website`). ✔
