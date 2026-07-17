import { beforeEach, describe, expect, it } from 'vitest'
import { act, fireEvent, render, screen } from '@testing-library/react'
import { CompletionRitual } from './CompletionRitual'
import { localIsoDate, saveStartDate } from '@/lib/sessionRun'

beforeEach(() => window.localStorage.clear())

function setSteps(done: boolean[]) {
  window.localStorage.setItem('session-test-session', JSON.stringify(done))
}

describe('CompletionRitual', () => {
  it('renders nothing while steps remain', () => {
    setSteps([true, false])
    render(<CompletionRitual slug="test-session" stepCount={2} />)
    expect(screen.queryByTestId('completion-ritual')).toBeNull()
  })

  it('appears when all steps are done', () => {
    setSteps([true, true])
    render(<CompletionRitual slug="test-session" stepCount={2} />)
    expect(screen.getByTestId('completion-ritual')).toBeTruthy()
  })

  it('appears live when the last step completes elsewhere', () => {
    setSteps([true, false])
    render(<CompletionRitual slug="test-session" stepCount={2} />)
    setSteps([true, true])
    act(() => {
      window.dispatchEvent(new Event('nm-session-steps-changed'))
    })
    expect(screen.getByTestId('completion-ritual')).toBeTruthy()
  })

  it('logs a mood for today, replacing a same-day entry', () => {
    setSteps([true])
    render(<CompletionRitual slug="test-session" stepCount={1} />)
    fireEvent.click(screen.getByRole('button', { name: /great/i }))
    fireEvent.click(screen.getByRole('button', { name: /okay/i }))
    const log = JSON.parse(window.localStorage.getItem('metrics-mood-test-session') ?? '[]')
    expect(log).toEqual([{ date: localIsoDate(), mood: 3 }])
    expect(screen.getByText(/logged/i)).toBeTruthy()
  })

  it('shows days taken when a start date exists', () => {
    saveStartDate('test-session', localIsoDate())
    setSteps([true])
    render(<CompletionRitual slug="test-session" stepCount={1} />)
    expect(screen.getByText(/day 1/i)).toBeTruthy()
  })
})
