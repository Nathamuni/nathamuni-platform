# Narrative architecture

For immersive, campaign and brand surfaces — where the page has to *take someone
somewhere* rather than present a list of facts. Derived from studio practice (Noomo and
peers) but stated structurally, because "cinematic storytelling" as an adjective produces
nothing an agent can build.

## The failure this prevents

An agent asked for a "storytelling site" produces sections in a plausible order with
transitions between them, and calls the transitions the story. That is sequencing, not
narrative. The difference: in a narrative, **each scene changes what the next one means.**
If the sections can be reordered without loss, there is no story — which is fine, but
then do not spend WebGL money pretending otherwise.

## Required output

Before any layout work, produce a scene map. Every scene needs all six fields; a scene
missing `exit` or `communicates` is not a scene.

```yaml
experience_goal:      # what someone understands or does afterwards
audience:
central_idea:         # one sentence. If it needs two, the story is not found yet.

scenes:
  - name:
    communicates:     # the ONE thing. Not three.
    content:          # actual copy/asset, or a placeholder that names what is needed
    visual_state:     # what is on screen
    interaction:      # what the user does. "scrolls" is a valid answer.
    transition_in:    # how it connects to the previous scene's closing state
    exit:             # how a user who does not want this leaves. Every scene needs one.
    fallback:         # what this scene is with no WebGL / reduced motion / no JS

resolution:           # the closing state
primary_action:       # the one thing to do. Reachable from every scene.
sound_role:           # none | optional | required. Default none; required needs an argument.
mobile_interpretation:     # not "responsive" — what the story becomes on a phone
reduced_motion_version:    # a designed still experience, not "animations off"
```

## Form selection

Pick the simplest form that carries the idea. These are genuinely different structures,
not intensity levels:

| Form | Use when | Cost |
|---|---|---|
| **Linear** | The order is fixed and short | Low |
| **Scroll-driven** | Progress maps naturally to reading | Low–medium |
| **Exploratory** | Order genuinely does not matter and exploration *is* the point | Medium |
| **Spatial** | The subject has real spatial structure — a place, an object, a system | High |
| **Branching** | Different audiences need genuinely different paths | High; usually a false need |
| **Data-driven** | The data is the argument | Medium |
| **Product demonstration** | The product is the story and can be shown working | Medium |

Default to scroll-driven. Exploratory and spatial are frequently chosen because they
sound better, and they cost navigation clarity — the user's "where am I, what have I
missed, how do I leave" problem gets strictly harder.

## Non-negotiables

An experimental structure earns its freedom by answering all of these. If any answer is
missing, the structure is not ready to build:

1. How does someone know where they are?
2. How do they go back?
3. How does a keyboard user complete the primary action?
4. How does a touch user complete it?
5. What is on screen at `prefers-reduced-motion: reduce`?
6. What happens with no WebGL context?
7. What happens on a low-end device?
8. Is sound ever unprompted? (It must not be.)
9. Can someone who does not want the experience reach the primary action anyway?

Question 9 is the one most often failed. A story the user cannot opt out of is a
conversion obstacle wearing an art direction.

## Attribution boundary

Studio references teach structure — scene order, pacing, how a transition carries meaning
between chapters. They do not supply material. Never reproduce a specific site's
composition, transitions, typography, copy, 3D assets or branding, and never imply
affiliation with a studio whose work informed a direction.

The usable form of an observation is abstract:

> ✗ "Do the Noomo homepage transition."
> ✓ "Connect the closing object of one scene to the opening composition of the next, so
>    the transition carries meaning instead of just filling time."
