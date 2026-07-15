/**
 * Pure helpers for the ambient session sky: local-clock day phases and the
 * sun/moon position along the horizon arc. Approximate on purpose — this is
 * scenery, not an almanac (fixed 6:00 sunrise / 18:00 sunset day window).
 */

export type SkyPhase = 'dawn' | 'day' | 'dusk' | 'night'

/** hour: 0–23.99 local. Dawn 5–7, day 7–17, dusk 17–19, night otherwise. */
export function skyPhase(hour: number): SkyPhase {
  if (!Number.isFinite(hour)) return 'day'
  const h = ((hour % 24) + 24) % 24
  if (h >= 5 && h < 7) return 'dawn'
  if (h >= 7 && h < 17) return 'day'
  if (h >= 17 && h < 19) return 'dusk'
  return 'night'
}

/**
 * Position along the half-circle arc for the current hour, as fractions of
 * the arc box: x 0→1 left-to-right, y 0 (horizon) → 1 (top of arc).
 * Sun travels 6:00→18:00; the moon travels the same arc 18:00→6:00.
 */
export function arcPosition(hour: number): { x: number; y: number; body: 'sun' | 'moon' } {
  const h = Number.isFinite(hour) ? (((hour % 24) + 24) % 24) : 12
  const daytime = h >= 6 && h < 18
  const t = daytime ? (h - 6) / 12 : h >= 18 ? (h - 18) / 12 : (h + 6) / 12
  return { x: t, y: Math.sin(t * Math.PI), body: daytime ? 'sun' : 'moon' }
}

export type WeatherKind = 'clear' | 'cloudy' | 'rain'

/** Collapse WMO weather codes (Open-Meteo) into the three themes we draw. */
export function weatherKind(wmoCode: number): WeatherKind {
  if (!Number.isFinite(wmoCode)) return 'clear'
  if (wmoCode >= 51) return 'rain' // drizzle, rain, snow, showers, storms
  if (wmoCode >= 1) return 'cloudy' // partly cloudy, overcast, fog
  return 'clear'
}
