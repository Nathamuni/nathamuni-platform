import { beforeEach, describe, expect, it, vi } from 'vitest'
import { fireEvent, render, screen } from '@testing-library/react'
import { StepTracker } from './StepTracker'
import type { Step } from '@/lib/sessions'

beforeEach(() => window.localStorage.clear())

const testSteps: Step[] = [
  {
    title: 'Test Step',
    detail: 'Do this',
    checkpoint: 'When you finish',
    label: 'tested',
  },
]

describe('StepTracker', () => {
  it('renders all steps', () => {
    render(<StepTracker slug="test-session" steps={testSteps} />)
    expect(screen.getByText(/test step/i)).toBeTruthy()
  })

  it('dispatches nm-session-steps-changed when a step checkbox is clicked', () => {
    const eventSpy = vi.fn()
    window.addEventListener('nm-session-steps-changed', eventSpy)

    render(<StepTracker slug="test-session" steps={testSteps} />)

    const checkbox = screen.getByRole('checkbox')
    fireEvent.click(checkbox)

    expect(eventSpy).toHaveBeenCalled()

    window.removeEventListener('nm-session-steps-changed', eventSpy)
  })
})
