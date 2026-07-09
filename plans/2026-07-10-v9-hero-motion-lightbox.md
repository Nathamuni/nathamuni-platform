# Plan record — v9: hero v2, lightbox nav, motion & glass polish

Date: 2026-07-10 · Branch: `feat/v9-hero-motion-lightbox` · (written at execution time;
requirements captured live in `memory/prompt-log.md` v9 section)

## Goal

Owner's same-day feedback on v8: remove the hero video for a designed static-image
hero with reordered text (quote not first), add lightbox prev/next + auto-advance,
more 3D/auto motion on home, glass plates for tile labels, shiver press feedback,
0.6s smooth hover peek. Executed with cost-effective subagents (2× Sonnet
implementation, Haiku for ship pipeline) per owner instruction.

## What shipped

- Hero v2: `HeroPortrait` (static webp, aurora conic ring, float, 3D pointer tilt);
  KineticPortrait + mediaSupport + 8.8 MB of video/png deleted; OG/JSON-LD image
  repointed to portrait-static.webp; copy order = eyebrow roles → Nathamuni →
  quote → promise → search.
- MomentsWall lightbox: ‹ › arrows (2+ stories), ArrowLeft/Right/Escape, onEnded
  auto-advance (closes after last), wrap-around; 13 new tests.
- Home motion: orbs self-drift (composable `translate` property), `data-reveal-3d`
  scroll entrances on the three home sections; reduced-motion zeroes everything.
- Glass polish: `.category-tile-plate` gradient-glass label plate; `press-shiver`
  on tiles/cards; ThumbPeek 0.6s hover-intent delay + smooth pop (peek-fade/peek-pop).

## Acceptance evidence (pre-PR)

77/77 tests, lint 0/0, tsc clean, build 177 pages; out/index.html contains
hero-eyebrow ×2, hero-portrait-frame ×4, category-tile-plate ×10; grep confirms
zero references to KineticPortrait/mediaSupport/portrait-forward/portrait-fallback.

## Failure mode watched

Hover-delay regression breaking peek tests → rewrote with fake timers; long-press
suppression unchanged and still covered.
