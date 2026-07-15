/**
 * Pure health-number helpers for the session calculators. Standard-practice
 * formulas only (WHO BMI bands, mainstream protein guidance) — every result
 * is a screening number, not a diagnosis, and the UI must say so.
 */

export interface BmiResult {
  /** Rounded to one decimal, e.g. 22.9 */
  value: number
  category: 'Underweight' | 'Healthy range' | 'Overweight' | 'Obese'
}

export interface ProteinRange {
  /** Grams per day, whole numbers. */
  minG: number
  maxG: number
  perKgLabel: string
}

/** Sanity bounds — outside these the inputs are typos, not humans. */
const WEIGHT_KG_MIN = 20
const WEIGHT_KG_MAX = 400
const HEIGHT_CM_MIN = 100
const HEIGHT_CM_MAX = 250

export function isPlausibleWeight(weightKg: number): boolean {
  return Number.isFinite(weightKg) && weightKg >= WEIGHT_KG_MIN && weightKg <= WEIGHT_KG_MAX
}

export function isPlausibleHeight(heightCm: number): boolean {
  return Number.isFinite(heightCm) && heightCm >= HEIGHT_CM_MIN && heightCm <= HEIGHT_CM_MAX
}

/** WHO adult bands. Returns null when either input is missing or implausible. */
export function computeBmi(weightKg: number, heightCm: number): BmiResult | null {
  if (!isPlausibleWeight(weightKg) || !isPlausibleHeight(heightCm)) return null
  const heightM = heightCm / 100
  const raw = weightKg / (heightM * heightM)
  const value = Math.round(raw * 10) / 10
  let category: BmiResult['category']
  if (value < 18.5) category = 'Underweight'
  else if (value < 25) category = 'Healthy range'
  else if (value < 30) category = 'Overweight'
  else category = 'Obese'
  return { value, category }
}

/**
 * Daily protein target. Training: 1.6–2.2 g/kg (matches the diet-reset step
 * copy). Not training: 0.8–1.2 g/kg (RDA floor to moderate-active ceiling).
 */
export function proteinRange(weightKg: number, training: boolean): ProteinRange | null {
  if (!isPlausibleWeight(weightKg)) return null
  const [minPerKg, maxPerKg] = training ? [1.6, 2.2] : [0.8, 1.2]
  return {
    minG: Math.round(weightKg * minPerKg),
    maxG: Math.round(weightKg * maxPerKg),
    perKgLabel: training ? '1.6–2.2 g/kg' : '0.8–1.2 g/kg',
  }
}
