# v24 — Real-value tools + contextual save nudge + living sky

## Added mid-session (owner directive): SessionSky
Ambient horizon on every session page — sun/moon on a half-circle arc from the
visitor's real local clock, dawn/day/dusk/night themes, real weather
(clear/cloudy/rain with drifting clouds + falling rain) via `/api/sky`:
Cloudflare request geo (city-level, never echoed precisely) → Open-Meteo
(free, keyless), 30-min edge cache per ~10km. Fails → clear sky. Files:
`lib/sky.ts` (+test), `components/sessions/SessionSky.tsx`, worker handler.

## Goal
Owner directive (2026-07-15, "do whatever you can, no questions"):
1. When a visitor logs real data (session metrics / step checks), invite them at that
   moment to add an email so the data is kept — contextual, not just the corner pill.
2. Add genuinely useful interactive tools — BMI + daily protein-target calculator —
   so sessions give immediate value, not just text.

## Files
- `sites/nathamuni-com/lib/health.ts` (+ test) — pure `computeBmi`, `proteinRange`
- `sites/nathamuni-com/components/sessions/HealthTools.tsx` (+ test) — calculator card,
  persists inputs under `metrics-health-profile` (existing `metrics-` prefix → syncs to
  account when signed in, localStorage otherwise)
- `sites/nathamuni-com/components/account/SaveNudge.tsx` (+ test) — inline one-liner
  shown after real data exists: signed-out only, dismissible (localStorage
  `nm-nudge-dismissed`), button fires `nm-open-account`
- `sites/nathamuni-com/components/account/AccountWidget.tsx` — listen for
  `nm-open-account` → open the dialog
- `sites/nathamuni-com/components/sessions/StepTracker.tsx` — show nudge at ≥2 checked
- `sites/nathamuni-com/components/sessions/MetricTracker.tsx` — show nudge after a log
- `sites/nathamuni-com/lib/sessions.ts` — optional `healthTools?: boolean` on Session;
  true for `diet-reset` and `the-7-day-reset`
- `sites/nathamuni-com/app/sessions/[slug]/page.tsx` — render `<HealthTools />` when set

## Acceptance criteria
- BMI: correct value + WHO category; rejects nonsense inputs (no NaN UI)
- Protein: 1.6–2.2 g/kg training / 0.8–1.2 g/kg otherwise, whole grams
- Calculator inputs survive reload (localStorage) and sync for signed-in users
- Nudge: never for signed-in users, never after dismissal, opens account dialog on click
- Framing: "standard practice" credibility label + screening-not-diagnosis note
- `npm test`, lint, type-check, build all green; PR → CI → merge → verify live

## Test cases
- normal: 70kg/175cm → BMI 22.9 "Healthy range"; protein 112–154g training
- edge: height 0 / negative / blank → null result, UI shows nothing broken
- failure: localStorage unavailable (privacy mode) → calculator still works in-memory

## Failure mode watched
Hydration mismatch: calculator/nudge read localStorage only after mount (same
pattern as StepTracker) so SSR/static HTML always matches first client paint.
