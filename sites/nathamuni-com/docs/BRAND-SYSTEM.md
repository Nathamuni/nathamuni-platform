# Brand System — how nathamuni.com looks, sounds, and behaves

## Positioning (one sentence)

**The organized brain of a generalist**: Instagram is the feed, nathamuni.com
is the searchable library of ideas Nathamuni tested on himself first.

Every design/content decision should serve: *"find the useful thing in 10
seconds."* If a feature adds scroll instead of removing it, it's off-brand.

## Voice

- First person, direct, experience-backed ("tested on myself first").
- Tamil-English code-mix is a feature, not a bug — keep it in captions and
  Humor & Tamil titles; keep navigation/UI chrome in English.
- No guru tone. Claims are grounded: "6 months of trial", "50 thinkers",
  "part 1–3". Numbers over adjectives.

## Category color system (single source: `lib/categoryMeta.ts`)

| Category | Hue | Accent feel | Icon |
|---|---|---|---|
| Mind & Discipline | 262 (violet) | signature/primary | 🧠 |
| Calisthenics & Fitness | 152 (emerald) | energy/health | 💪 |
| AI & Builds | 192 (cyan) | tech/electric | ⚡ |
| Humor & Tamil | 38 (amber) | warm/playful | 😉 |
| Life & Moments | 340 (rose) | personal/human | 🌊 |

The hue drives card glows, chips, and tiles via the `--cat` CSS variable.
Custom thumbnails should echo the same hue (border, label, or wash) so a
category scan is instant.

## Design tokens

- Base: `#07070c` near-black, layered radial ambient glows (violet/cyan/rose)
- Glass: `rgba(255,255,255,0.05)` fill, `0.1` border, `backdrop-blur-xl`,
  `rounded-2xl`
- Primary accent: `#8b5cf6` (violet-500)
- Type: Outfit (display/headings), Inter (body)
- Cards: 9:12 media crop, hover = lift −5px + category-hued glow + 1.06 zoom

## Motion rules

- Entrances: fade-up 0.7s `cubic-bezier(0.16,1,0.3,1)`, stagger ≤0.32s
- Hover: transform + shadow only (compositor-friendly), 300ms
- Hero glow: 9s drift loop
- **Always** honored: `prefers-reduced-motion: reduce` disables everything
- Never animate layout properties (width/height/top) — transform/opacity only

## The kinetic portrait (signature element)

Dual alpha-WebM clips (forward/reverse) with a static PNG fallback. Desktop:
hover in/out. Touch: auto-boomerang. First frame is painted on load via a
0.01s seek so the portrait is never invisible. Treat this as the brand's
"logo motion" — reuse the same clip style if making new ones (green-screen,
VP9 alpha, ~1.6s, 30fps — see the revealIT-Experience encoding guide).
