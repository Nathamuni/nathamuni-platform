# Session "Theater Mode" — immersion & follow-through research (2026-07-16)

Two-agent research pass: (A) deep-read of the current sessions implementation,
(B) web research on how Headspace/Calm/Endel/Forest/Duolingo/YouTube build
immersive guided-session experiences, filtered for what is buildable free and
client-side on our static-export + thin-Worker stack.

## A. Current state (sites/nathamuni-com)

A session (`lib/sessions.ts`) is a hardcoded guided protocol: slug, promise,
duration, hue, steps (with credibility labels + checkpoints), metrics,
timeline phases. Four sessions: diet-reset, unlock-your-body, the-7-day-reset,
ship-local-ai-in-a-weekend.

Interactive today: StepTracker (checkbox list, `session-<slug>`),
MetricTracker (numeric log + sparkline, `metrics-<slug>-<i>`), HealthTools
(BMI/protein, `metrics-health-profile`). All localStorage-first with debounced
sync to `/api/auth/progress` when signed in; strict hydrate-after-mount
pattern; reduced-motion-safe. **SessionSky was removed on owner feedback
(be1fa21) — do not reintroduce ambient sky without asking.**

Experiential gaps: no audio, no timers, no start-date/"Day 4" awareness, no
guided fullscreen mode, no completion moment, no reminders, no cross-session
dashboard, metric input is numbers-only, related videos not embedded in steps.

## B. Buildable patterns (all client-side unless noted)

1. **Theater mode** — Fullscreen API + chrome fade on idle (YouTube/Netflix).
   iOS iPhone: CSS fixed-overlay fallback.
2. **Ambient glow / bias lighting** — soft peripheral color field from session
   hue (YouTube Ambient Mode). CSS radial gradients + blur.
3. **Screen Wake Lock** — `navigator.wakeLock.request('screen')` during a
   running session; re-acquire on visibilitychange.
4. **Slow entry ritual** — 3–5s dim/countdown before the session starts
   (Headspace/Calm; users close eyes right after play).
5. **Generative soundscape** — Web Audio API: filtered brown noise, LFO pads,
   probabilistic pentatonic chimes. Zero audio files (Generative.fm proves
   fully-static works; Endel's time-of-day inputs model). Requires user
   gesture to start AudioContext (the Start button).
6. **Binaural/isochronic focus layer** — two detuned oscillators + stereo
   panner; label honestly, headphones note.
7. **Media Session API + fade-out ending** — lock-screen controls; gain ramp
   over final 20–30s.
8. **Breathing visualizer** — scaling circle synced to box/4-7-8 patterns;
   CSS keyframes or JS state machine.
9. **Haptic phase cues** — `navigator.vibrate` on breath transitions
   (Android only; feature-detect).
10. **Commitment device** — Forest pattern: plant something at start that
    grows with elapsed time, withers on abandonment (loss aversion).
11. **Streaks with forgiveness** — Duolingo: streak + weekly freeze +
    milestone celebrations (wagers alone: +14% D14 retention). localStorage
    date ledger; Worker+KV backup later.
12. **End-of-session ritual** — chime → mood emoji check-in → summary card
    (Calm's mood check-in predicts next-week participation, PMC8105761).
    Share card via canvas.toBlob + Web Share API.
13. **Pre-session personalization question** — Balance pattern: "energy,
    calm, or focus?" → picks soundscape/breath pattern/duration.
14. **Same-time-tomorrow cue** — full push needs a server/PWA (weak on iOS);
    pragmatic fallback: `.ics` calendar download + "you usually practice
    around 7am" banner from localStorage timestamps.

iOS caveats: no Vibration API, limited Fullscreen on iPhone, AudioContext
needs a user gesture.

Key sources: MDN (Fullscreen, Wake Lock, Web Audio, Vibration, Media Session),
endel.io/technology, generative.fm write-up (Alex Bainter), forestapp.cc,
blog.duolingo.com streak posts, PMC8105761 (Calm mood check-in study),
uxplanet.org YouTube Ambient Mode analysis, box-breathing.org.
