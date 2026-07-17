# UX psychology principles (owner directive: "keep this in mind")

Source: owner-shared summary of "The UX Psychology Behind Apps People Can't
Stop Using" (youtube.com/watch?v=2TlIg3VokY8). Standing guidance for all
nathamuni-platform UI work.

## The principles
1. **Smart defaults** — prefill the common case; users scan-and-adjust
   instead of starting blank (90% never change defaults). Related: Hick's law
   — fewer visible options, faster decisions.
2. **Goal gradient** — people accelerate near a finish line; never present
   progress as a cold 0%. Related: Zeigarnik effect — unfinished tasks nag,
   visible "continue" states pull users back.
3. **Reciprocity** — give real value before asking for anything (no signup
   walls before utility).
4. **IKEA/endowment effect** — let users build/customize before the account
   ask; leaving then feels like abandoning something they own.
5. **Loss aversion** — losing is ~2× as motivating as gaining; frame asks
   around what would be lost, not gained.
6. **Anchoring/contrast** — value is judged relatively; anchor prices/effort
   against something bigger.
Also: **Peak-end rule** — engineer a delightful peak ("aha") and a
celebratory end; those two moments define the remembered experience.

## Already true on nathamuni.com (v23–v26)
- Reciprocity + IKEA: all trackers work signed-out; account is offered only
  AFTER real progress exists (overlay nudge).
- Zeigarnik: "n% — continue" lines on course/session cards.
- Smart defaults: optional accounts, health tools with placeholder examples.

## Applied in v27
- Loss-framed nudge copy (principle 5).
- Peak-end: celebration state when a protocol/course hits 100%.
- Goal gradient: "only N left" framing once past halfway.

## Held back deliberately
- Artificial head-start progress (fake pre-filled stamps) — manipulative for
  a trust-first personal brand; use honest momentum framing instead.
