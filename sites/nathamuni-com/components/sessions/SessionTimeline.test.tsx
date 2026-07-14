import { describe, expect, it } from 'vitest'
import { render, screen } from '@testing-library/react'
import { SessionTimeline } from './SessionTimeline'
import type { TimelinePhase } from '@/lib/sessions'

const TIMELINE: TimelinePhase[] = [
  { phase: 'Getting started', span: 'Day 1', focus: 'Do the thing.', stepIndexes: [0] },
  { phase: 'The rest of the week', span: 'Days 2–7', focus: 'Keep doing the thing.', stepIndexes: [1, 2] },
]

describe('SessionTimeline', () => {
  it('renders every phase name, span, and focus line', () => {
    render(<SessionTimeline hue={38} timeline={TIMELINE} />)
    for (const block of TIMELINE) {
      expect(screen.getByText(block.phase)).toBeInTheDocument()
      expect(screen.getByText(block.span)).toBeInTheDocument()
      expect(screen.getByText(block.focus)).toBeInTheDocument()
    }
  })

  it('renders a numbered dot for every step index across all phases', () => {
    render(<SessionTimeline hue={38} timeline={TIMELINE} />)
    // stepIndexes [0], [1, 2] -> displayed as 1, 2, 3
    expect(screen.getByText('1')).toBeInTheDocument()
    expect(screen.getByText('2')).toBeInTheDocument()
    expect(screen.getByText('3')).toBeInTheDocument()
  })
})
