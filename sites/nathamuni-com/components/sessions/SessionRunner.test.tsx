import { beforeEach, describe, expect, it, vi } from 'vitest'
import { fireEvent, render, screen } from '@testing-library/react'
import { SessionRunner } from './SessionRunner'
import { localIsoDate, loadStartDate, saveStartDate } from '@/lib/sessionRun'
import type { TimelinePhase } from '@/lib/sessions'

const TL: TimelinePhase[] = [
  { phase: 'Setup', span: 'Day 1', days: [1, 1], focus: 'Get ready', stepIndexes: [0] },
  { phase: 'Run', span: 'Days 2–7', days: [2, 7], focus: 'Do it', stepIndexes: [1] },
]

function renderRunner() {
  return render(
    <SessionRunner slug="test-session" hue={270} durationLabel="1 week" timeline={TL} />
  )
}

beforeEach(() => window.localStorage.clear())

describe('SessionRunner', () => {
  it('offers Start when not started, and no Now chip', () => {
    renderRunner()
    expect(screen.getByRole('button', { name: /start this session/i })).toBeTruthy()
    expect(screen.queryByText('Now')).toBeNull()
  })

  it('starting stores today and shows Day 1 + active phase', () => {
    renderRunner()
    fireEvent.click(screen.getByRole('button', { name: /start this session/i }))
    expect(loadStartDate('test-session')).toBe(localIsoDate())
    const status = screen.getByRole('status')
    expect(status).toHaveTextContent(/day 1/i)
    expect(screen.getByTestId('timeline-now')).toBeInTheDocument()
  })

  it('an existing start date hydrates after mount', () => {
    saveStartDate('test-session', localIsoDate())
    renderRunner()
    const status = screen.getByRole('status')
    expect(status).toHaveTextContent(/day 1/i)
  })

  it('restart clears after confirm', () => {
    saveStartDate('test-session', localIsoDate())
    vi.spyOn(window, 'confirm').mockReturnValue(true)
    renderRunner()
    fireEvent.click(screen.getByRole('button', { name: /restart/i }))
    expect(loadStartDate('test-session')).toBeNull()
    expect(screen.getByRole('button', { name: /start this session/i })).toBeTruthy()
  })
})
