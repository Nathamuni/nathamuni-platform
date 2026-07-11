import { describe, expect, it } from 'vitest'
import { getPrinciples, getDecisions, getGoals } from './journey'

const GOAL_STATES = ['achieved', 'in-progress', 'dream']
const HUES = ['violet', 'magenta', 'cyan']

describe('journey principles', () => {
  it('returns a non-empty list with unique ids and non-empty fields', () => {
    const principles = getPrinciples()
    expect(principles.length).toBeGreaterThan(0)
    expect(new Set(principles.map((p) => p.id)).size).toBe(principles.length)
    for (const p of principles) {
      expect(p.title.length).toBeGreaterThan(0)
      expect(p.meaning.length).toBeGreaterThan(0)
      if (p.origin !== undefined) {
        expect(p.origin.length).toBeGreaterThan(0)
      }
    }
  })

  it('includes the sovereignty-over-convenience and Tamil ethos principles', () => {
    const principles = getPrinciples()
    expect(principles.some((p) => p.id === 'sovereignty-over-convenience')).toBe(true)
    expect(principles.some((p) => p.id === 'yaadhum-oore')).toBe(true)
  })
})

describe('journey decisions', () => {
  it('returns a non-empty list with unique ids, valid hues, and non-empty fields', () => {
    const decisions = getDecisions()
    expect(decisions.length).toBeGreaterThan(0)
    expect(new Set(decisions.map((d) => d.id)).size).toBe(decisions.length)
    for (const d of decisions) {
      expect(d.period.length).toBeGreaterThan(0)
      expect(d.trigger.length).toBeGreaterThan(0)
      expect(d.decision.length).toBeGreaterThan(0)
      expect(d.outcome.length).toBeGreaterThan(0)
      expect(HUES).toContain(d.hue)
      expect(Number.isInteger(d.seq)).toBe(true)
    }
  })

  it('orders decisions chronologically via strictly increasing seq', () => {
    const decisions = getDecisions()
    const seqs = decisions.map((d) => d.seq)
    for (let i = 1; i < seqs.length; i++) {
      expect(seqs[i]).toBeGreaterThan(seqs[i - 1])
    }
    expect(new Set(seqs).size).toBe(seqs.length)
  })
})

describe('journey goals', () => {
  it('returns a non-empty list with valid states and non-empty titles', () => {
    const goals = getGoals()
    expect(goals.length).toBeGreaterThan(0)
    expect(new Set(goals.map((g) => g.id)).size).toBe(goals.length)
    for (const g of goals) {
      expect(g.title.length).toBeGreaterThan(0)
      expect(GOAL_STATES).toContain(g.state)
      if (g.detail !== undefined) {
        expect(g.detail.length).toBeGreaterThan(0)
      }
      if (g.dateLabel !== undefined) {
        expect(g.dateLabel.length).toBeGreaterThan(0)
      }
      if (g.year !== undefined) {
        expect(Number.isInteger(g.year)).toBe(true)
        expect(g.year).toBeGreaterThanOrEqual(2000)
        expect(g.year).toBeLessThanOrEqual(2100)
      }
    }
  })

  it('includes at least one achieved, one in-progress, and one dream goal', () => {
    const goals = getGoals()
    expect(goals.some((g) => g.state === 'achieved')).toBe(true)
    expect(goals.some((g) => g.state === 'in-progress')).toBe(true)
    expect(goals.some((g) => g.state === 'dream')).toBe(true)
  })

  it('marks the book and BrainBox as achieved with parseable years', () => {
    const goals = getGoals()
    const book = goals.find((g) => g.id === 'book-published')
    const brainbox = goals.find((g) => g.id === 'brainbox-live')
    expect(book?.state).toBe('achieved')
    expect(book?.year).toBe(2025)
    expect(brainbox?.state).toBe('achieved')
    expect(brainbox?.year).toBe(2026)
  })
})
