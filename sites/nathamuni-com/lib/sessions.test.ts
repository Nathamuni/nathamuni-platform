import { describe, expect, it } from 'vitest'
import { getAllSessions, getSessionBySlug, type CredibilityLabel } from './sessions'
import { getAllVideos } from './videos'
import { getAllPosts } from './blog'

const LABELS: CredibilityLabel[] = ['tested', 'research', 'standard']

describe('sessions', () => {
  it('has a non-empty list of sessions', () => {
    expect(getAllSessions().length).toBeGreaterThan(0)
  })

  it('has unique slugs', () => {
    const sessions = getAllSessions()
    const slugs = sessions.map((s) => s.slug)
    expect(new Set(slugs).size).toBe(slugs.length)
  })

  it('every session resolves via getSessionBySlug', () => {
    for (const session of getAllSessions()) {
      expect(getSessionBySlug(session.slug)?.slug).toBe(session.slug)
    }
  })

  it('getSessionBySlug returns undefined for an unknown slug', () => {
    expect(getSessionBySlug('does-not-exist')).toBeUndefined()
  })

  it('every session has non-empty core fields and a numeric hue', () => {
    for (const session of getAllSessions()) {
      expect(session.title.length).toBeGreaterThan(0)
      expect(session.promise.length).toBeGreaterThan(0)
      expect(session.durationLabel.length).toBeGreaterThan(0)
      expect(session.forWhom.length).toBeGreaterThan(0)
      expect(typeof session.hue).toBe('number')
    }
  })

  it('every session has at least 3 metrics with non-empty fields', () => {
    for (const session of getAllSessions()) {
      expect(session.metrics.length).toBeGreaterThanOrEqual(3)
      for (const metric of session.metrics) {
        expect(metric.name.length).toBeGreaterThan(0)
        expect(metric.how.length).toBeGreaterThan(0)
        expect(metric.cadence.length).toBeGreaterThan(0)
      }
    }
  })

  it('every session has at least 4 steps', () => {
    for (const session of getAllSessions()) {
      expect(session.steps.length).toBeGreaterThanOrEqual(4)
    }
  })

  it('every step has a label in the credibility union and non-empty fields', () => {
    for (const session of getAllSessions()) {
      for (const step of session.steps) {
        expect(LABELS).toContain(step.label)
        expect(step.title.length).toBeGreaterThan(0)
        expect(step.detail.length).toBeGreaterThan(0)
        expect(step.checkpoint.length).toBeGreaterThan(0)
      }
    }
  })

  it('every "research" labeled step carries a reference with a label and url', () => {
    for (const session of getAllSessions()) {
      for (const step of session.steps) {
        if (step.label === 'research') {
          expect(step.reference).toBeDefined()
          expect(step.reference?.label.length).toBeGreaterThan(0)
          expect(step.reference?.url.length).toBeGreaterThan(0)
        }
      }
    }
  })

  it('every reference (any label) has a well-formed https url', () => {
    for (const session of getAllSessions()) {
      for (const step of session.steps) {
        if (step.reference) {
          expect(step.reference.url).toMatch(/^https:\/\//)
        }
      }
    }
  })

  it('every relatedVideoId exists in videos.json', () => {
    const videoIds = new Set(getAllVideos().map((v) => v.id))
    for (const session of getAllSessions()) {
      for (const id of session.relatedVideoIds ?? []) {
        expect(videoIds.has(id)).toBe(true)
      }
    }
  })

  it('every relatedBlogSlug exists in posts.json', () => {
    const slugs = new Set(getAllPosts().map((p) => p.slug))
    for (const session of getAllSessions()) {
      for (const slug of session.relatedBlogSlugs ?? []) {
        expect(slugs.has(slug)).toBe(true)
      }
    }
  })

  it('every session has a non-empty timeline with non-empty phase/span/focus', () => {
    for (const session of getAllSessions()) {
      expect(session.timeline.length).toBeGreaterThan(0)
      for (const block of session.timeline) {
        expect(block.phase.length).toBeGreaterThan(0)
        expect(block.span.length).toBeGreaterThan(0)
        expect(block.focus.length).toBeGreaterThan(0)
        expect(block.stepIndexes.length).toBeGreaterThan(0)
      }
    }
  })

  it('every timeline covers each step index exactly once', () => {
    for (const session of getAllSessions()) {
      const covered = session.timeline.flatMap((block) => block.stepIndexes)
      expect(new Set(covered).size).toBe(covered.length) // no step listed twice
      const sorted = covered.slice().sort((a, b) => a - b)
      expect(sorted).toEqual(session.steps.map((_, i) => i)) // and none missing
    }
  })
})
