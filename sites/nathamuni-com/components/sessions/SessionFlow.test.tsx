import { describe, expect, it } from 'vitest'
import { render, screen } from '@testing-library/react'
import { SessionFlow } from './SessionFlow'
import { stepAnchorId, type Step } from '@/lib/sessions'

const SLUG = 'test-session'

const STEPS: Step[] = [
  { title: 'First Step', label: 'standard', detail: 'Do the first thing.', checkpoint: 'Done one.' },
  { title: 'Second Step', label: 'tested', detail: 'Do the second thing.', checkpoint: 'Done two.' },
  { title: 'Third Step', label: 'research', detail: 'Do the third thing.', checkpoint: 'Done three.' },
]

describe('SessionFlow', () => {
  it('renders one node per step plus a terminal node with the promise', () => {
    render(<SessionFlow slug={SLUG} steps={STEPS} promise="You get there." />)
    for (const step of STEPS) {
      expect(screen.getByText(step.title)).toBeInTheDocument()
    }
    expect(screen.getByText('You get there.')).toBeInTheDocument()
  })

  it('links each node to its step anchor id', () => {
    render(<SessionFlow slug={SLUG} steps={STEPS} promise="You get there." />)
    STEPS.forEach((step, index) => {
      const link = screen.getByText(step.title).closest('a')
      expect(link).toHaveAttribute('href', `#${stepAnchorId(SLUG, index)}`)
    })
  })

  it('numbers nodes in order starting at 1', () => {
    render(<SessionFlow slug={SLUG} steps={STEPS} promise="You get there." />)
    expect(screen.getByText('1')).toBeInTheDocument()
    expect(screen.getByText('2')).toBeInTheDocument()
    expect(screen.getByText('3')).toBeInTheDocument()
  })
})
