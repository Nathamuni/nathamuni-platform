import { describe, expect, it } from 'vitest'
import { render, screen } from '@testing-library/react'
import { CursorAurora } from './CursorAurora'

describe('CursorAurora', () => {
  it('renders without crashing as an aria-hidden overlay', () => {
    render(<CursorAurora />)
    const el = screen.getByTestId('cursor-aurora')
    expect(el).toBeInTheDocument()
    expect(el).toHaveAttribute('aria-hidden', 'true')
  })

  it('does not activate (stays invisible) when matchMedia reports no fine pointer', () => {
    // vitest.setup.ts stubs matchMedia to always report matches: false,
    // which is the same signal touch devices and reduced-motion users send.
    render(<CursorAurora />)
    const el = screen.getByTestId('cursor-aurora')
    expect(el.style.opacity).not.toBe('1')
  })
})
