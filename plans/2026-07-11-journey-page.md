# Journey page — operating system, decision map, dreams tracker

## Goal
New `/journey` page: principles constellation, an animated self-drawing
vertical decision-map (the centerpiece), and a goals/dreams tracker. Desktop
Nav gets a "Journey" link after Stats. Mobile-first, reduced-motion safe,
premium glass aesthetic using existing utility classes only.

## Files (exclusively owned per parent-agent brief)
- `lib/journey.ts` — typed data (PRINCIPLES, DECISIONS, GOALS) + accessors
- `lib/journey.test.ts` — shape/date/union/non-empty-string tests
- `components/journey/PrinciplesGrid.tsx` — Act I, staggered card constellation
- `components/journey/DecisionMap.tsx` — Act II, client component, self-drawing
  SVG spine (stroke-dashoffset via IntersectionObserver), alternating desktop
  nodes / left-spine mobile column
- `components/journey/GoalsTracker.tsx` — Act III, grouped by state with
  filled/animated/hollow markers
- `app/journey/page.tsx` — assembles the three acts, metadata export
- `components/layout/Nav.tsx` — one-line addition to NAV_LINKS (after Stats)
- `components/layout/Nav.test.tsx` — add `/journey` to expected hrefs

## Data source
Only verified facts from `sites/nathamuni-com/docs/content-source.md` and the
exact node text supplied in the task brief. No invented specifics.

## Acceptance criteria
- `npm test`, `npm run lint`, `npm run type-check` all clean (no build run)
- No touch to `app/globals.css` — only existing utility classes + inline
  Tailwind arbitrary values + a scoped `<style jny->` block in DecisionMap
- No horizontal scroll / broken layout logically at 360px width
- Nav desktop list includes Journey; mobile tab bar untouched (still 4 items)
- No emoji anywhere in new content

## Failure mode to guard against
`data-reveal` elements must actually get observed — `ScrollReveal` is global
and re-scans on route change, so plain `data-reveal` attributes are enough;
no need to reimplement observation, only the spine's own draw progress needs
a dedicated observer in DecisionMap.

## Test cases (lib/journey.test.ts)
- Normal: PRINCIPLES/DECISIONS/GOALS non-empty, every field non-empty string
- Edge: GOALS states restricted to the 'achieved'|'in-progress'|'dream' union;
  DECISIONS periods parseable as dates or date-range strings
- Failure: no duplicate decision ids/slugs; no empty-string fields anywhere
