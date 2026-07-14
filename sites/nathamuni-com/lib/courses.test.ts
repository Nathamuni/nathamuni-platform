import { describe, expect, it } from 'vitest'
import { getAllCourses, getCourseBySlug } from './courses'
import { getVideoBySlug } from './videos'
import { getPostBySlug } from './blog'

const VALID_LABELS = new Set(['tested', 'research', 'standard'])
const VALID_LEVELS = new Set(['beginner', 'intermediate'])
const HEALTH_SLUGS = new Set(['full-body-flexibility', 'calisthenics-foundations', 'diet-tested'])

describe('courses data', () => {
  it('has five courses with unique slugs', () => {
    const courses = getAllCourses()
    expect(courses.length).toBe(5)
    expect(new Set(courses.map((c) => c.slug)).size).toBe(courses.length)
  })

  it('every course has non-empty required fields and a valid level/hue', () => {
    for (const course of getAllCourses()) {
      expect(course.title.length, `${course.slug} title`).toBeGreaterThan(0)
      expect(course.tagline.length, `${course.slug} tagline`).toBeGreaterThan(0)
      expect(course.forWhom.length, `${course.slug} forWhom`).toBeGreaterThan(0)
      expect(VALID_LEVELS.has(course.level), `${course.slug} level`).toBe(true)
      expect(Number.isFinite(course.hue), `${course.slug} hue`).toBe(true)
      expect(course.outcomes.length, `${course.slug} outcomes`).toBeGreaterThan(0)
      for (const outcome of course.outcomes) {
        expect(outcome.length, `${course.slug} outcome text`).toBeGreaterThan(0)
      }
    }
  })

  it('every course has 3-5 modules', () => {
    for (const course of getAllCourses()) {
      expect(course.modules.length, `${course.slug} module count`).toBeGreaterThanOrEqual(3)
      expect(course.modules.length, `${course.slug} module count`).toBeLessThanOrEqual(5)
    }
  })

  it('marks the three health-related courses (and only those) with disclaimer:true', () => {
    for (const course of getAllCourses()) {
      expect(Boolean(course.disclaimer), `${course.slug} disclaimer`).toBe(HEALTH_SLUGS.has(course.slug))
    }
  })

  it('every block label is within the valid union', () => {
    for (const course of getAllCourses()) {
      for (const mod of course.modules) {
        expect(mod.title.length, `${course.slug} module title`).toBeGreaterThan(0)
        expect(mod.blocks.length, `${course.slug} / ${mod.title} blocks`).toBeGreaterThan(0)
        for (const block of mod.blocks) {
          expect(VALID_LABELS.has(block.label), `${course.slug} / ${mod.title} label "${block.label}"`).toBe(true)
        }
      }
    }
  })

  it('every block has substantial theory text (80-160 words)', () => {
    for (const course of getAllCourses()) {
      for (const mod of course.modules) {
        for (const block of mod.blocks) {
          const wordCount = block.text.trim().split(/\s+/).length
          expect(wordCount, `${course.slug} / ${mod.title} (${block.label}) word count`).toBeGreaterThanOrEqual(80)
          expect(wordCount, `${course.slug} / ${mod.title} (${block.label}) word count`).toBeLessThanOrEqual(160)
        }
      }
    }
  })

  it('every "research" block carries a reference with a non-empty label and url', () => {
    for (const course of getAllCourses()) {
      for (const mod of course.modules) {
        for (const block of mod.blocks) {
          if (block.label !== 'research') continue
          expect(block.reference, `${course.slug} / ${mod.title} missing reference`).toBeDefined()
          expect(block.reference!.label.length, `${course.slug} / ${mod.title} reference label`).toBeGreaterThan(0)
          expect(block.reference!.url.length, `${course.slug} / ${mod.title} reference url`).toBeGreaterThan(0)
          expect(() => new URL(block.reference!.url), `${course.slug} / ${mod.title} reference url is a valid URL`).not.toThrow()
        }
      }
    }
  })

  it('non-research blocks do not carry a reference', () => {
    for (const course of getAllCourses()) {
      for (const mod of course.modules) {
        for (const block of mod.blocks) {
          if (block.label === 'research') continue
          expect(block.reference, `${course.slug} / ${mod.title} unexpected reference on a ${block.label} block`).toBeUndefined()
        }
      }
    }
  })

  it('every module has at least one action, and every action is non-empty', () => {
    for (const course of getAllCourses()) {
      for (const mod of course.modules) {
        expect(mod.actions.length, `${course.slug} / ${mod.title} actions`).toBeGreaterThan(0)
        for (const action of mod.actions) {
          expect(action.length, `${course.slug} / ${mod.title} action text`).toBeGreaterThan(0)
        }
      }
    }
  })

  it('every referenced videoId actually exists in videos.json', () => {
    for (const course of getAllCourses()) {
      for (const mod of course.modules) {
        for (const videoId of mod.videoIds ?? []) {
          expect(getVideoBySlug(videoId), `${course.slug} / ${mod.title} videoId "${videoId}"`).toBeDefined()
        }
      }
    }
  })

  it('every referenced blogSlug actually exists in posts.json', () => {
    for (const course of getAllCourses()) {
      for (const mod of course.modules) {
        for (const blogSlug of mod.blogSlugs ?? []) {
          expect(getPostBySlug(blogSlug), `${course.slug} / ${mod.title} blogSlug "${blogSlug}"`).toBeDefined()
        }
      }
    }
  })

  it('finds a course by slug and returns undefined for unknown slugs', () => {
    const course = getCourseBySlug('the-consistency-system')
    expect(course?.title).toBe('The Consistency System')
    expect(getCourseBySlug('does-not-exist')).toBeUndefined()
  })

  it('every course has at least one video and one module with a block referencing real content', () => {
    for (const course of getAllCourses()) {
      const hasVideo = course.modules.some((m) => (m.videoIds ?? []).length > 0)
      const hasTestedBlock = course.modules.some((m) => m.blocks.some((b) => b.label === 'tested'))
      expect(hasVideo, `${course.slug} should link at least one real video`).toBe(true)
      expect(hasTestedBlock, `${course.slug} should have at least one tested block`).toBe(true)
    }
  })
})
