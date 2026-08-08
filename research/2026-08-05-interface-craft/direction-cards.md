# Design direction cards

## When to produce them

Not always. Always-on ceremony is ceremony, and it gets skipped.

| Work | Cards |
|---|---|
| Greenfield landing page, brand surface, immersive experience, full redesign | 3 |
| Ordinary product page, new section in an established system | 1–2 |
| Bugfix, accessibility fix, copy change, single component swap | 0 — skip entirely |

## The rule that makes them worth anything

**The agent produces the cards and then recommends one, with reasons.** It does not hand
the user three equally weighted options and wait.

Three unranked options transfers the work to the user and dresses indecision up as
thoroughness. The cards exist to force the agent to consider structurally different
solutions *before* defaulting to the familiar one — a gradient hero, three feature cards,
a testimonial row. Once that thinking has happened, its value is captured. The
recommendation is the deliverable; the other two cards are the evidence it was a choice.

## Card format

Short. A card that runs past ~150 words is a plan pretending to be an option.

```
NAME            a handle, not a slogan

THESIS          one sentence: what structural idea organises this page

DIFFERENT       what makes this genuinely not the other two

LAYOUT          grid or its absence, density, section order, navigation model

TYPE            scale, contrast, what carries the hierarchy

MOTION          the one motion idea, and what it communicates

TECH            mechanism + whether it trips the complexity budget

FAILS IF        the condition under which this is the wrong choice
```

`FAILS IF` is the field that does the most work. A direction with no stated failure mode
has not been thought about — every real design choice trades something away.

## The differentiation test

Three cards are three *directions* only if they differ in at least two of:

- **layout model** — grid / broken grid / editorial columns / spatial / single-column narrative
- **navigation model** — persistent nav / progressive reveal / scroll-only / sectioned / spatial
- **interaction model** — static / hover-led / scroll-linked / drag or direct manipulation
- **information density** — sparse and sequential vs dense and simultaneous

If all three share layout, navigation and interaction and differ only in palette,
typeface and corner radius, **they are one direction with three skins.** Say so and
produce actual alternatives.

## Anti-slop check

Reject a card that is the default in disguise. The current defaults, which arrive
unbidden and should be chosen only deliberately:

- purple-to-blue gradient hero, oversized centred headline, three-card feature grid
- glassmorphism panels over a blurred gradient blob field
- glowing rounded cards on near-black with a low-contrast body text
- animated particles or floating blobs with no relationship to the content
- a decorative fake terminal window on a non-developer product
- infinite marquee logo row
- scroll hijacking on a page whose content is text

None are forbidden. Each is forbidden *by default* — using one requires the same kind of
reason the complexity budget demands.

## Recording the choice

The selected direction gets written down before implementation starts, as a short
artifact: the chosen card, why it beat the others, and what was traded away. Without
that record, "does the built page match the direction?" is unanswerable at QA time —
which is the point where the question matters most.
