# v26 — Overlay nudge + interactive courses + living motion (owner: "think and act, don't ask")

## Goal
1. Save-progress ask becomes a gentle overlay toast (slide-up, bottom), never an
   inline layout shift. Auto-hides in ~12s, shows once per session, × dismisses
   forever. One global host — trackers just emit an "earned" event.
2. Courses become interactive: animated conic progress ring on the course hero,
   compact "continue" progress line on course cards, live per-checklist progress
   bar, springy checkbox pop.
3. Home + courses get ambient "alive" motion: floating gradient blobs behind the
   hero, gentle icon float/wiggle on hover, all inside
   prefers-reduced-motion: no-preference.
4. Consistency fix while in there: hero 🔍 emoji → SVG (v25 rule).

## Files
- components/account/SaveNudge.tsx → SaveNudgeHost + earnSaveNudge() (+tests)
- app/layout.tsx — mount SaveNudgeHost
- StepTracker / MetricTracker / ActionChecklist — emit earn event, no inline UI
- components/courses/CourseProgress.tsx (+test) — ring & card variants, reads
  course-<slug>-<i> localStorage, live via nm-progress-applied + tick events
- app/courses/[slug]/page.tsx + CourseCard.tsx — mount progress
- components/courses/CoursesStyles.tsx — ring, bar, pop styles
- components/fx/AmbientBlobs.tsx — decorative drift blobs (home hero)
- app/page.tsx — blobs + SVG search icon
- app/globals.css — float/wiggle keyframes, tile hover life

## Acceptance
- No inline nudge anywhere; toast appears once after 2+ ticks/log, dismisses
- Ring animates to the right % and updates when ticking actions
- Reduced-motion users get zero ambient animation
- All tests, lint, type-check, build green; PR → CI → merge → verify live

## Failure mode watched
Multiple trackers earning at once must yield ONE toast (host dedupes);
localStorage math must ignore malformed arrays.
