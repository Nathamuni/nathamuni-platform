# QA — 39122eb

Browser-rendered verification of `feat/foundations-upgrade`, run with the
`agent-browser` CLI against the built `out/` served locally. Stale the moment code
changes — re-run before merging anything on top.

```
viewports  360 ✓  414 ✓  768 ✓  1280 ✓  1920 ✓   (no horizontal overflow)
keyboard   ✓ 22 tab stops, all with a visible focus ring
motion     ✓ reduced-motion leaves all revealed content visible
axe        ✓ clean on 18 routes (was: 1 serious, 4 moderate)
console    ✓ 0 errors / 0 warnings, 0 failed requests
perf       NOT MEASURED (cloudflare:web-perf not installed)
not run    dark/light themes (project is single-theme), real touch devices,
           screen-reader pass, /ask + auth flows behind the Worker API
```

## Viewports

Overflow measured as `documentElement.scrollWidth > innerWidth` at each width, on
`/`, `/videos`, `/pulse`, `/moments`, `/sessions/[slug]`, `/courses/[slug]`, `/feed`.
No overflow anywhere.

**Each viewport change was asserted**, not assumed — `window.innerWidth` was read back
and compared to the requested width before any measurement was recorded. The skill warns
that `agent-browser viewport …` silently does nothing (the real command is
`set viewport`); the assertion is what makes the row trustworthy.

## Accessibility — what axe actually found

Clean now, but only after fixes. The pre-existing state, which the earlier phases had
claimed as done:

| Violation | Impact | Where |
|---|---|---|
| `aria-prohibited-attr` | **serious**, 4 nodes | `SessionTimeline` put `aria-label` on a bare `<span>`; a generic role cannot be named, so the step cluster had **no accessible name at all** |
| `landmark-complementary-is-top-level` | moderate | two `<aside>` inside `<main>` on session pages |
| `heading-order` | moderate | `/videos`, `/pulse`, `/moments`, `/courses/[slug]` all jumped h1 → h3 |

The heading fixes were made at the structural cause — footer column titles, the
dashboard section title, and the course module title — rather than patched per page.

Routes verified clean: `/`, `/videos`, `/pulse`, `/moments`, `/feed`, `/blog`, `/stats`,
`/about`, `/ask`, `/journey`, `/courses`, `/sessions`, `/books`, `/projects`, `/privacy`,
`/sessions/diet-reset`, `/courses/the-consistency-system`, `/videos/just-goat`.

## Keyboard

22 tab stops from the top of `/`, every one with a visible indicator.

**One false positive worth recording.** The skill's suggested focus check calls
`el.focus()` then reads `getComputedStyle`. That reported three nav links as having
`outline: none`. It is wrong: programmatic `.focus()` does not trigger `:focus-visible`,
and the site styles focus via `a:focus-visible`. Driving real `Tab` keypresses instead
shows `outline: solid 3px` with `el.matches(':focus-visible') === true`. Measured by
keypress, not by `.focus()`.

## Reduced motion

Emulated via `set media reduced-motion reduce` and confirmed with
`matchMedia(...).matches === true`. All 5 `[data-reveal]` elements render at full
opacity and all 9 homepage cards are present — the page is not empty for these users,
which is the failure mode that matters here.

## Console and network

0 errors, 0 warnings, 0 failed requests on `/`, `/videos`, `/pulse`,
`/sessions/diet-reset`. Capture was proven functional first by emitting a probe
`console.log` / `console.warn` and confirming both appeared — otherwise "0 errors" is
indistinguishable from "not capturing".

## Note on the MCP-vs-CLI warning

The skill states the `agent-browser` MCP wrapper is broken as of 2026-08-05. That was
**not** true in this session — MCP calls (`open`, `eval`, `close`) all succeeded and
produced the contrast measurements recorded in `RESULTS.md`. The CLI was used here as the
skill prescribes, and also worked. Recording the discrepancy rather than repeating the
claim.
