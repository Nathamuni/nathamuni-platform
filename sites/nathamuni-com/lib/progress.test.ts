import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { applyProgress, collectProgress, loadItem, saveItem, setAuthed } from './progress'

describe('progress', () => {
  beforeEach(() => {
    window.localStorage.clear()
    setAuthed(false)
  })

  afterEach(() => {
    window.localStorage.clear()
    setAuthed(false)
    vi.restoreAllMocks()
  })

  it('round-trips a value through loadItem/saveItem', () => {
    expect(loadItem('course-x-0')).toBeNull()
    saveItem('course-x-0', JSON.stringify([true, false]))
    expect(loadItem('course-x-0')).toBe(JSON.stringify([true, false]))
  })

  it('collectProgress only picks up prefixed keys', () => {
    window.localStorage.setItem('course-abc-0', JSON.stringify([true]))
    window.localStorage.setItem('session-xyz', JSON.stringify([true, true]))
    window.localStorage.setItem('metrics-xyz-0', JSON.stringify([{ date: 'd', value: 1 }]))
    window.localStorage.setItem('companion-choice', 'kitty')
    window.localStorage.setItem('unrelated', 'nope')

    const collected = collectProgress()

    expect(collected).toEqual({
      'course-abc-0': JSON.stringify([true]),
      'session-xyz': JSON.stringify([true, true]),
      'metrics-xyz-0': JSON.stringify([{ date: 'd', value: 1 }]),
    })
  })

  it('applyProgress writes prefixed keys into localStorage and fires the hydration event', () => {
    const handler = vi.fn()
    window.addEventListener('nm-progress-applied', handler)

    applyProgress({
      'course-abc-0': JSON.stringify([true]),
      _updatedAt: '2026-01-01T00:00:00.000Z',
      unrelated: 'nope',
    })

    expect(window.localStorage.getItem('course-abc-0')).toBe(JSON.stringify([true]))
    expect(window.localStorage.getItem('_updatedAt')).toBeNull()
    expect(window.localStorage.getItem('unrelated')).toBeNull()
    expect(handler).toHaveBeenCalledTimes(1)

    window.removeEventListener('nm-progress-applied', handler)
  })

  it('does not let a stale server blob overwrite work done before hydration', () => {
    // Regression: /api/auth/me is deferred to idle, so there is a window where the
    // visitor is signed in but `authed` is still false. A step checked in that window
    // skipped syncUp, then applyProgress landed the server's older copy on top of it
    // and the work vanished.
    setAuthed(false)
    saveItem('session-diet-reset', JSON.stringify([true, true, false]))

    // Hydration arrives carrying an older server value for the same key.
    applyProgress({
      'session-diet-reset': JSON.stringify([false, false, false]),
      'course-other-0': JSON.stringify([true]),
    })

    // The local edit survives...
    expect(loadItem('session-diet-reset')).toBe(JSON.stringify([true, true, false]))
    // ...while untouched keys still hydrate from the server.
    expect(loadItem('course-other-0')).toBe(JSON.stringify([true]))
  })

  it('still applies server values for keys this tab never touched', () => {
    setAuthed(false)
    applyProgress({ 'session-a': JSON.stringify([true]) })
    expect(loadItem('session-a')).toBe(JSON.stringify([true]))
  })
})
