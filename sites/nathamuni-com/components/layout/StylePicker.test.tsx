import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { StylePicker } from './StylePicker'
import { AUTO_INTERVAL_MS, THEMES } from '@/lib/themes'

const root = () => document.documentElement
const ATTRS = ['data-theme', 'data-motion', 'data-bg']

async function openPanel(user: { click: (el: Element) => Promise<void> } = userEvent) {
  await user.click(screen.getByRole('button', { name: 'Change site style' }))
}

describe('StylePicker', () => {
  beforeEach(() => {
    ATTRS.forEach((a) => root().removeAttribute(a))
    localStorage.clear()
  })
  afterEach(() => {
    vi.useRealTimers()
    ATTRS.forEach((a) => root().removeAttribute(a))
  })

  it('starts closed and opens from the Style button', async () => {
    render(<StylePicker />)
    expect(screen.queryByRole('group', { name: 'Site style' })).toBeNull()
    await openPanel()
    expect(screen.getByRole('group', { name: 'Site style' })).toBeInTheDocument()
  })

  it('offers every theme as a swatch', async () => {
    render(<StylePicker />)
    await openPanel()
    for (const t of THEMES) {
      expect(screen.getByRole('button', { name: `${t.label} theme` })).toBeInTheDocument()
    }
    expect(THEMES.length).toBeGreaterThanOrEqual(12)
  })

  it('applies a colour theme to <html> and remembers it', async () => {
    render(<StylePicker />)
    await openPanel()
    await userEvent.click(screen.getByRole('button', { name: 'Ocean theme' }))
    expect(root().getAttribute('data-theme')).toBe('ocean')
    expect(localStorage.getItem('nm-theme')).toBe('ocean')
    expect(screen.getByRole('button', { name: 'Ocean theme' })).toHaveAttribute('aria-pressed', 'true')
  })

  it('applies motion and background independently, and the defaults clear everything', async () => {
    render(<StylePicker />)
    await openPanel()
    await userEvent.click(screen.getByRole('button', { name: 'Orbit' }))
    await userEvent.click(screen.getByRole('button', { name: 'Grid' }))
    await userEvent.click(screen.getByRole('button', { name: 'Sunset theme' }))
    expect(root().getAttribute('data-motion')).toBe('orbit')
    expect(root().getAttribute('data-bg')).toBe('grid')
    expect(root().getAttribute('data-theme')).toBe('sunset')

    await userEvent.click(screen.getByRole('button', { name: 'Drift' }))
    await userEvent.click(screen.getByRole('button', { name: 'Art' }))
    await userEvent.click(screen.getByRole('button', { name: 'Violet theme' }))
    ATTRS.forEach((a) => expect(root().hasAttribute(a)).toBe(false))
    for (const k of ['nm-theme', 'nm-motion', 'nm-bg']) expect(localStorage.getItem(k)).toBeNull()
  })

  it('reads choices already applied before hydration', async () => {
    root().setAttribute('data-theme', 'forest')
    root().setAttribute('data-motion', 'glint')
    root().setAttribute('data-bg', 'dots')
    render(<StylePicker />)
    await openPanel()
    expect(screen.getByRole('button', { name: 'Forest theme' })).toHaveAttribute('aria-pressed', 'true')
    expect(screen.getByRole('button', { name: 'Glint' })).toHaveAttribute('aria-pressed', 'true')
    expect(screen.getByRole('button', { name: 'Dots' })).toHaveAttribute('aria-pressed', 'true')
  })

  it('closes on Escape', async () => {
    render(<StylePicker />)
    await openPanel()
    await userEvent.keyboard('{Escape}')
    expect(screen.queryByRole('group', { name: 'Site style' })).toBeNull()
  })

  describe('auto-change', () => {
    const reducedMotion = (matches: boolean) =>
      vi.spyOn(window, 'matchMedia').mockImplementation(
        (q: string) =>
          ({
            matches: matches && q.includes('prefers-reduced-motion'),
            media: q,
            addEventListener: () => {},
            removeEventListener: () => {},
          }) as unknown as MediaQueryList
      )

    afterEach(() => vi.restoreAllMocks())

    it('is on by default', async () => {
      reducedMotion(false)
      render(<StylePicker />)
      await openPanel()
      expect(screen.getByRole('switch', { name: /every 30 seconds/i })).toHaveAttribute('aria-checked', 'true')
    })

    it('is off by default for visitors who prefer reduced motion', async () => {
      reducedMotion(true)
      render(<StylePicker />)
      await openPanel()
      expect(screen.getByRole('switch', { name: /every 30 seconds/i })).toHaveAttribute('aria-checked', 'false')
    })

    it('a reduced-motion visitor can still switch it on, and that is remembered', async () => {
      reducedMotion(true)
      render(<StylePicker />)
      await openPanel()
      await userEvent.click(screen.getByRole('switch', { name: /every 30 seconds/i }))
      expect(localStorage.getItem('nm-auto')).toBe('1')
    })

    it('switching it off is remembered as off, not as the default', async () => {
      reducedMotion(false)
      render(<StylePicker />)
      await openPanel()
      await userEvent.click(screen.getByRole('switch', { name: /every 30 seconds/i }))
      expect(screen.getByRole('switch', { name: /every 30 seconds/i })).toHaveAttribute('aria-checked', 'false')
      expect(localStorage.getItem('nm-auto')).toBe('0')
    })

    it('moves to the next colour every interval, wrapping through the list', async () => {
      reducedMotion(false)
      vi.useFakeTimers({ shouldAdvanceTime: true })
      render(<StylePicker />)

      // violet -> second theme; the 2s allowance covers art preloading, which never
      // completes in jsdom.
      await vi.advanceTimersByTimeAsync(AUTO_INTERVAL_MS + 2500)
      expect(root().getAttribute('data-theme')).toBe(THEMES[1].id)
      await vi.advanceTimersByTimeAsync(AUTO_INTERVAL_MS + 100)
      expect(root().getAttribute('data-theme')).toBe(THEMES[2].id)
    })

    it('does not change anything when the visitor has turned it off', async () => {
      reducedMotion(false)
      localStorage.setItem('nm-auto', '0')
      vi.useFakeTimers({ shouldAdvanceTime: true })
      render(<StylePicker />)
      await vi.advanceTimersByTimeAsync(AUTO_INTERVAL_MS * 3)
      expect(root().hasAttribute('data-theme')).toBe(false)
    })

    it('picking a colour by hand turns it off and keeps it off', async () => {
      reducedMotion(false)
      render(<StylePicker />)
      await openPanel()
      await userEvent.click(screen.getByRole('button', { name: 'Gold theme' }))
      expect(screen.getByRole('switch', { name: /every 30 seconds/i })).toHaveAttribute('aria-checked', 'false')
      expect(localStorage.getItem('nm-auto')).toBe('0')
      expect(root().getAttribute('data-theme')).toBe('gold')
    })
  })
})
