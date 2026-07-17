# Fix: /moments lightbox invisible (audio plays, no video)

## Root cause
`app/template.tsx` wraps every page in `.anim-fade-up`. Its animation uses
`fill-mode: both`, retaining `transform: translateY(0)` after the entrance
animation. A retained transform creates a containing block for
`position: fixed` descendants, so `.moment-lightbox` (fixed, inset-0)
positions against the page wrapper — rendered ~1425px below the viewport.
Video decodes and plays (verified via headless Chrome: 113 frames, no error)
but is off-screen → "audio but no video", on all devices.

## Fix
- `app/globals.css`: change `@keyframes fade-up` end state to
  `transform: none` so no transform is retained (`none` interpolates as
  identity). Fixes every fixed-position overlay site-wide.
- Belt: portal `.moment-lightbox` to `document.body` in `MomentsWall.tsx`
  via `createPortal` so the dialog is immune to any future ancestor
  transform/filter.

## Acceptance criteria
- Headless Chrome on local build: after clicking a moment card, the
  lightbox rect is at viewport (top ≈ 0), video visible and playing.
- Existing vitest suite passes; lint + type-check pass.

## Failure mode considered
Older browsers not interpolating `transform: none` — spec-defined as
identity; supported in all evergreen browsers. Portal covers the dialog
regardless.

## Test cases
- Normal: click first moment card → lightbox video visible in viewport.
- Edge: keyboard Escape still closes portaled lightbox (listener is on window).
- Failure: story without poster still opens and plays.
