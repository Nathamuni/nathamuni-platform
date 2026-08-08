# Complexity budget

Replaces the "technology ladder" (CSS → Motion → GSAP → canvas/shader → WebGL).

## Why the ladder was wrong

It looked like ascending cost, but it mixed three unrelated things: techniques (CSS
transitions), libraries (GSAP, Motion), and rendering substrates (canvas, WebGL). Those
do not order cleanly. A twelve-line fragment shader is often *simpler* to reason about,
cheaper to run, and easier to delete than a 200-line GSAP ScrollTrigger timeline with
pinning and scrubbing. Ranking the shader as "level 4" and the timeline as "level 3"
would have pushed toward the more expensive option.

## The rule

**Use the least powerful mechanism that produces the effect.** Power, not category.

Then: an implementation that creates meaningful **runtime or maintenance risk** must ship
with four things before it is written.

| Requirement | What it means concretely |
|---|---|
| Performance target | A number decided in advance. "60fps on a mid-range Android", "< 40KB added to first load", "LCP stays under 2.5s". |
| Fallback | What renders when the substrate is unavailable — no WebGL context, blocked canvas, JS disabled. A static composition is a valid answer. A blank div is not. |
| Reduced-motion behaviour | What `prefers-reduced-motion: reduce` gets. Not "animation disabled" — a designed still state. |
| A reason tied to user experience | See below. |

## What counts as a reason

**Not a reason.** These are adjectives, not arguments, and they must be rejected explicitly:

> innovative · premium · futuristic · cutting-edge · immersive · wow-factor · modern ·
> "it should feel expensive" · "make it stand out"

**A reason.** These tie the mechanism to something the user does or understands:

> "The product is a physical object and rotation is how buyers evaluate it; a static
> gallery cannot show the hinge mechanism."
>
> "Spatial navigation is the organising metaphor of the site and cannot be expressed
> accessibly in DOM/CSS at this scale."
>
> "The data has three meaningful dimensions and flattening it to 2D loses the comparison
> the page exists to make."

The test: could the same sentence be written about any other product? If yes, it is
decoration wearing an argument's clothes.

## Escalation triggers

Ask for the four requirements when the work involves any of:

- a new rendering substrate (canvas, WebGL, WebGPU)
- a scroll-hijacking or scroll-driven library
- continuous animation (anything running when the user is idle)
- a dependency over ~30KB gzipped added for a single visual effect
- animation coupled to layout (things that can cause CLS)
- audio

Below those, just build it. Requiring a written justification for a CSS transition is
ceremony, and ceremony is what gets skipped — which then trains the habit of skipping.

## Deletion test

Before shipping any effect that triggered the escalation list, answer:

> If this effect were removed entirely, what would the user no longer be able to
> understand or do?

"It would look worse" means it is decoration. Decoration is allowed — but it must be
cheap, and it must be the first thing cut when the performance target is missed.

## Note on the escape hatch

If an effect ships without one of the four requirements, record *which one* is missing
and why, in the implementation notes. A recorded gap is a known debt. An unrecorded gap
is a bug nobody has found yet.
