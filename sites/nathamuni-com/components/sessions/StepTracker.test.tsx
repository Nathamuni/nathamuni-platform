import { afterEach, beforeEach, describe, expect, it } from 'vitest'
import { render, screen } from '@testing-library/react'
import { StepTracker } from './StepTracker'
import type { Step } from '@/lib/sessions'

const STEPS: Step[] = [0, 1, 2, 3].map((i) => ({
  title: `Step ${i + 1}`,
  detail: `Detail ${i + 1}`,
  checkpoint: `Checkpoint ${i + 1}`,
  label: 'tested',
}))

function seed(done: number) {
  window.localStorage.setItem(
    'session-test-proto',
    JSON.stringify(STEPS.map((_, i) => i < done))
  )
}

describe('StepTracker psychology states', () => {
  beforeEach(() => window.localStorage.clear())
  afterEach(() => window.localStorage.clear())

  it('plain count below halfway, no bar at zero', async () => {
    seed(1)
    render(<StepTracker slug="test-proto" steps={STEPS} />)
    expect(await screen.findByText('1 / 4 steps done')).toBeInTheDocument()
    expect(screen.queryByTestId('protocol-complete')).toBeNull()
  })

  it('reframes around the finish line past halfway', async () => {
    seed(3)
    render(<StepTracker slug="test-proto" steps={STEPS} />)
    expect(await screen.findByText(/only 1 step left/i)).toBeInTheDocument()
  })

  it('celebrates completion', async () => {
    seed(4)
    render(<StepTracker slug="test-proto" steps={STEPS} />)
    expect(await screen.findByTestId('protocol-complete')).toHaveTextContent('Protocol complete.')
    expect(screen.getByText('All steps done')).toBeInTheDocument()
  })
})
