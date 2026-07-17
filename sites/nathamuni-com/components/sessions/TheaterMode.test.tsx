import { beforeEach, describe, expect, it, vi } from 'vitest'
import { act, fireEvent, render, screen } from '@testing-library/react'
import type { RenderResult } from '@testing-library/react'
import { TheaterMode } from './TheaterMode'
import type { Step } from '@/lib/sessions'

const STEPS: Step[] = [
  { title: 'First move', label: 'tested', detail: 'Do the first thing.', checkpoint: 'first thing done' },
  { title: 'Second move', label: 'tested', detail: 'Do the second thing.', checkpoint: 'second thing done' },
]

beforeEach(() => {
  window.localStorage.clear()
  vi.useFakeTimers()
})

function open(): RenderResult {
  const result = render(<TheaterMode slug="test-session" hue={270} steps={STEPS} />)
  fireEvent.click(screen.getByRole('button', { name: /focus mode/i }))
  return result
}

describe('TheaterMode', () => {
  it('runs the entry ritual before showing the first unchecked step', () => {
    open()
    expect(screen.getByText(/settle in/i)).toBeTruthy()
    expect(screen.queryByText('First move')).toBeNull()
    act(() => vi.advanceTimersByTime(4000))
    expect(screen.getByText('First move')).toBeTruthy()
  })

  it('marking done persists to the shared session key and advances', () => {
    open()
    act(() => vi.advanceTimersByTime(4000))
    fireEvent.click(screen.getByRole('button', { name: /done/i }))
    expect(JSON.parse(window.localStorage.getItem('session-test-session') ?? '[]')).toEqual([true, false])
    expect(screen.getByText('Second move')).toBeTruthy()
  })

  it('resumes at the first unchecked step', () => {
    window.localStorage.setItem('session-test-session', JSON.stringify([true, false]))
    open()
    act(() => vi.advanceTimersByTime(4000))
    expect(screen.getByText('Second move')).toBeTruthy()
  })

  it('shows completion when every step is done and Escape closes', () => {
    window.localStorage.setItem('session-test-session', JSON.stringify([true, true]))
    open()
    act(() => vi.advanceTimersByTime(4000))
    expect(screen.getByText(/protocol complete/i)).toBeTruthy()
    fireEvent.keyDown(document, { key: 'Escape' })
    expect(screen.queryByRole('dialog')).toBeNull()
  })

  it('restores body scroll on unmount while the overlay is open', () => {
    const { unmount } = open()
    expect(document.body.style.overflow).toBe('hidden')
    unmount()
    expect(document.body.style.overflow).toBe('')
  })
})
