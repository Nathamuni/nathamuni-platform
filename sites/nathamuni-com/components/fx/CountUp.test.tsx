import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { act, render, screen } from '@testing-library/react'
import { CountUp } from './CountUp'

type IOCallback = (entries: Array<{ isIntersecting: boolean }>) => void

class MockIntersectionObserver {
  static instances: MockIntersectionObserver[] = []
  callback: IOCallback
  observe = vi.fn()
  unobserve = vi.fn()
  disconnect = vi.fn()
  constructor(callback: IOCallback) {
    this.callback = callback
    MockIntersectionObserver.instances.push(this)
  }
  trigger(isIntersecting: boolean) {
    this.callback([{ isIntersecting }])
  }
}

function stubMatchMedia(reducedMotion: boolean) {
  window.matchMedia = ((query: string) => ({
    matches: query.includes('reduced-motion') ? reducedMotion : false,
    media: query,
    onchange: null,
    addListener: () => {},
    removeListener: () => {},
    addEventListener: () => {},
    removeEventListener: () => {},
    dispatchEvent: () => false,
  })) as unknown as typeof window.matchMedia
}

describe('CountUp', () => {
  let rafCallbacks: FrameRequestCallback[]
  let mockNow = 0
  let originalIO: typeof window.IntersectionObserver | undefined

  beforeEach(() => {
    rafCallbacks = []
    mockNow = 0
    vi.spyOn(performance, 'now').mockImplementation(() => mockNow)
    window.requestAnimationFrame = ((cb: FrameRequestCallback) => {
      rafCallbacks.push(cb)
      return rafCallbacks.length
    }) as typeof requestAnimationFrame
    originalIO = window.IntersectionObserver
    window.IntersectionObserver = MockIntersectionObserver as unknown as typeof IntersectionObserver
    MockIntersectionObserver.instances = []
    stubMatchMedia(false)
  })

  afterEach(() => {
    vi.restoreAllMocks()
    window.IntersectionObserver = originalIO as typeof IntersectionObserver
    stubMatchMedia(false)
  })

  function flushRaf() {
    const cbs = rafCallbacks.splice(0, rafCallbacks.length)
    cbs.forEach((cb) => cb(performance.now()))
  }

  it('renders the final value immediately (SSR / no-op before intersecting)', () => {
    render(<CountUp value={1234} />)
    expect(screen.getByTestId('count-up').textContent).toBe('1,234')
  })

  it('tweens from 0 up to the final value once it intersects', () => {
    render(<CountUp value={100} duration={100} />)
    const observer = MockIntersectionObserver.instances[0]

    act(() => {
      observer.trigger(true)
    })
    expect(screen.getByTestId('count-up').textContent).toBe('0')

    mockNow = 50
    act(() => {
      flushRaf()
    })
    const midValue = Number(screen.getByTestId('count-up').textContent!.replace(/,/g, ''))
    expect(midValue).toBeGreaterThan(0)
    expect(midValue).toBeLessThan(100)

    mockNow = 200
    act(() => {
      flushRaf()
    })
    expect(screen.getByTestId('count-up').textContent).toBe('100')
  })

  it('only unobserves once and does not restart after reaching the final value', () => {
    render(<CountUp value={10} duration={10} />)
    const observer = MockIntersectionObserver.instances[0]
    act(() => {
      observer.trigger(true)
    })
    expect(observer.unobserve).toHaveBeenCalledTimes(1)
    mockNow = 100
    act(() => {
      flushRaf()
    })
    expect(screen.getByTestId('count-up').textContent).toBe('10')
    expect(rafCallbacks.length).toBe(0)
  })

  it('shows the final value without tweening when prefers-reduced-motion is set', () => {
    stubMatchMedia(true)
    render(<CountUp value={55} />)
    const observer = MockIntersectionObserver.instances[0]
    act(() => {
      observer?.trigger(true)
    })
    expect(screen.getByTestId('count-up').textContent).toBe('55')
    expect(rafCallbacks.length).toBe(0)
  })

  it('shows the final value when IntersectionObserver is unsupported', () => {
    // @ts-expect-error simulating an old browser
    delete window.IntersectionObserver
    render(<CountUp value={7} />)
    expect(screen.getByTestId('count-up').textContent).toBe('7')
  })
})
