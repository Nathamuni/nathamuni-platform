/**
 * Colour themes and hero motion styles the visitor can pick. The palette values live in
 * globals.css (html[data-theme]); the hero art for each lives in
 * public/images/generated/{hero-bg,about-portrait}-<id>.jpg (scripts/make-theme-art.sh).
 * Violet is the default and is the absence of the attribute, not a value of it.
 */
export const THEMES = [
  { id: 'violet', label: 'Violet', swatch: 'linear-gradient(135deg, #8b5cf6, #ec4899)' },
  { id: 'ocean', label: 'Ocean', swatch: 'linear-gradient(135deg, #0ea5e9, #2dd4bf)' },
  { id: 'ember', label: 'Ember', swatch: 'linear-gradient(135deg, #f97316, #f43f5e)' },
  { id: 'forest', label: 'Forest', swatch: 'linear-gradient(135deg, #10b981, #a3e635)' },
  { id: 'rose', label: 'Rose', swatch: 'linear-gradient(135deg, #f43f78, #c026d3)' },
  { id: 'gold', label: 'Gold', swatch: 'linear-gradient(135deg, #eab308, #f97316)' },
  { id: 'crimson', label: 'Crimson', swatch: 'linear-gradient(135deg, #dc2626, #be185d)' },
  { id: 'teal', label: 'Teal', swatch: 'linear-gradient(135deg, #14b8a6, #38bdf8)' },
  { id: 'berry', label: 'Berry', swatch: 'linear-gradient(135deg, #c026d3, #f472b6)' },
  { id: 'sunset', label: 'Sunset', swatch: 'linear-gradient(135deg, #fb7141, #ec4899)' },
  { id: 'slate', label: 'Slate', swatch: 'linear-gradient(135deg, #94a3b8, #e2e8f0)' },
  { id: 'sapphire', label: 'Sapphire', swatch: 'linear-gradient(135deg, #2563eb, #6366f1)' },
] as const

export type ThemeId = (typeof THEMES)[number]['id']

/** Every theme except the default: the ones that carry their own art and an attribute. */
export const ALT_THEME_IDS = THEMES.filter((t) => t.id !== 'violet').map((t) => t.id) as Exclude<
  ThemeId,
  'violet'
>[]

export const MOTIONS = [
  { id: 'drift', label: 'Drift', hint: 'Soft floating glow (default)' },
  { id: 'aurora', label: 'Aurora', hint: 'The backdrop slowly pans and breathes' },
  { id: 'pulse', label: 'Pulse', hint: 'A heartbeat glow behind the portrait' },
  { id: 'orbit', label: 'Orbit', hint: 'Light orbs circle the portrait' },
  { id: 'glint', label: 'Glint', hint: 'A light sweep across the portrait' },
  { id: 'still', label: 'Still', hint: 'No hero animation' },
] as const

export type MotionId = (typeof MOTIONS)[number]['id']

export const ALT_MOTION_IDS = MOTIONS.filter((m) => m.id !== 'drift').map((m) => m.id) as Exclude<
  MotionId,
  'drift'
>[]

/** Background designs. "aurora" is the default: the themed art image. The rest are
 *  drawn in CSS from the palette, so they recolour with every theme for free. */
export const BACKGROUNDS = [
  { id: 'aurora', label: 'Art', hint: 'The glowing artwork (default)' },
  { id: 'mesh', label: 'Mesh', hint: 'Large soft colour blobs' },
  { id: 'grid', label: 'Grid', hint: 'A faint drifting grid' },
  { id: 'dots', label: 'Dots', hint: 'A faint drifting dot matrix' },
  { id: 'lines', label: 'Lines', hint: 'Fine diagonal lines' },
  { id: 'plain', label: 'Plain', hint: 'Flat colour, nothing behind' },
] as const

export type BackgroundId = (typeof BACKGROUNDS)[number]['id']

export const ALT_BG_IDS = BACKGROUNDS.filter((b) => b.id !== 'aurora').map((b) => b.id) as Exclude<
  BackgroundId,
  'aurora'
>[]

/** How often "auto-change" moves to the next colour. */
export const AUTO_INTERVAL_MS = 30_000

export const THEME_STORAGE_KEY = 'nm-theme'
export const MOTION_STORAGE_KEY = 'nm-motion'
export const BG_STORAGE_KEY = 'nm-bg'
export const AUTO_STORAGE_KEY = 'nm-auto'
