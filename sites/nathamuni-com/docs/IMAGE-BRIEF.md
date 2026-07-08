# Image Brief — AI-generated art for nathamuni.com

You said you'll generate images of yourself with ChatGPT. This is the exact
shopping list: what to generate, the prompt to paste (attach 1–2 clear photos
of your face each time), and where each file lands. Total: **9 images.**

## Ground rules (apply to every prompt)

- Attach 1–2 well-lit photos of your face and add: *"Use this person's exact
  face and hair. Do not alter facial features."*
- The site's palette is deep indigo `#0d0a1f` with violet `#8b5cf6`, magenta
  `#ec4899`, cyan `#22d3ee` accents — every image should sit comfortably on
  that background (ask for dark, moody backgrounds with neon rim-light).
- Export the largest size ChatGPT offers; I'll compress and wire everything.
- Drop finished files in `sites/nathamuni-com/public/images/generated/` with
  the exact filenames below — then tell me, and I do the rest.

## Exact specs at a glance

| # | File name | Aspect ratio | Target size (px) | Face? | Used for |
|---|---|---|---|---|---|
| 1 | `cat-mind.jpg` | 4:5 portrait | 1080 × 1350 | ✅ | Mind & Discipline tile |
| 2 | `cat-fitness.jpg` | 4:5 portrait | 1080 × 1350 | ✅ | Calisthenics & Fitness tile |
| 3 | `cat-ai.jpg` | 4:5 portrait | 1080 × 1350 | ✅ | AI & Builds tile |
| 4 | `cat-humor.jpg` | 4:5 portrait | 1080 × 1350 | ✅ | Humor & Tamil tile |
| 5 | `cat-life.jpg` | 4:5 portrait | 1080 × 1350 | ✅ | Life & Moments tile |
| 6 | `hero-bg.jpg` | 16:9 landscape | 1920 × 1080 | ❌ | Homepage hero background |
| 7 | `about-portrait.jpg` | 4:5 portrait | 1080 × 1350 | ✅ | About page portrait |
| 8 | `og-banner.jpg` | 1.91:1 landscape | 1200 × 630 exactly | ✅ | Link-share card (WhatsApp/LinkedIn) |
| 9 | `books-teaser.jpg` | 3:2 landscape | 1500 × 1000 | ✅ | Books/Blog coming-soon visual |

Delivery: JPEG (or PNG), largest quality ChatGPT offers — I downscale/compress.
Drop all files into `sites/nathamuni-com/public/images/generated/` and say "images are in".
An HTML version of this brief: `docs/image-brief.html` (open in any browser).

## The 9 images

### 1–5. Category hero cards (the clickable tiles you described)

Portrait 4:5. One per pillar. Shared style suffix for ALL five —
append this to each prompt:

> ...cinematic portrait, dark indigo studio background (#0d0a1f), dramatic
> neon rim lighting, ultra-detailed, editorial photography style, subject
> centered with space above the head, moody premium aesthetic, no text.

| File | Category (accent) | Prompt core |
|---|---|---|
| `cat-mind.jpg` | Mind & Discipline (violet) | "This man seated in deep meditation posture, eyes closed, calm intensity, violet-purple neon rim light, faint glowing geometric mandala behind his head..." |
| `cat-fitness.jpg` | Calisthenics & Fitness (emerald) | "This man mid calisthenics move (straddle planche or muscle-up on a bar), athletic physique, emerald-green neon rim light, chalk dust in the air..." |
| `cat-ai.jpg` | AI & Builds (cyan) | "This man as a futuristic engineer, holographic code and circuit diagrams floating around his hands, cyan-blue neon rim light, cyberpunk laboratory..." |
| `cat-humor.jpg` | Humor & Tamil (amber) | "This man laughing with a mischievous wink at camera, playful expression, warm amber-gold neon rim light, film-poster energy, slight caricature vibrance..." |
| `cat-life.jpg` | Life & Moments (rose) | "This man from behind on a scooter/temple street at dusk, warm rose-pink light, South Indian street atmosphere, nostalgic cinematic travel photo..." |

### 6. Hero background texture — `hero-bg.jpg`

Landscape 16:9, **no face needed**:
> Abstract dark background, deep indigo #0d0a1f, flowing aurora ribbons of
> violet, magenta and cyan light, subtle grain, very dark edges suitable for
> white text overlay, premium tech-brand wallpaper, no objects, no text.

### 7. About-page portrait — `about-portrait.jpg`

Portrait 4:5, with face:
> Confident editorial half-body portrait of this man, arms crossed, slight
> smile, dark indigo backdrop with soft violet gradient light from the left,
> shot on 85mm, shallow depth of field, magazine cover quality, no text.

### 8. Social share banner (OG image) — `og-banner.jpg`

Landscape exactly 1200×630, with face:
> Wide banner: this man on the right third looking toward empty space on the
> left (text goes there later), dark indigo background with aurora light
> streaks, cinematic, premium personal-brand website banner, no text.

### 9. Books/Blog teaser — `books-teaser.jpg`

Landscape 3:2, with face:
> This man reading in a dark room lit by a single warm lamp, floating glowing
> book pages and Tamil + English letters dissolving into violet light around
> him, contemplative, magical-realism editorial photo, no text.

## What I'll wire once files arrive

1. Category tiles become full image cards (your face per pillar, gradient
   overlay in the category hue, count badge) — directly clickable as today.
2. Hero gets the aurora texture behind the portrait (replaces pure CSS glow).
3. About page shows the portrait beside the bio.
4. `og-banner.jpg` becomes the default share card sitewide (homepage/links
   pasted in WhatsApp/LinkedIn show it).
5. Books/Blog placeholder pages get the teaser as their coming-soon visual.

## Later batches (don't generate yet)

- Per-book covers once book content exists; blog post headers; a favicon/
  monogram logo (that one deserves a dedicated design pass).
