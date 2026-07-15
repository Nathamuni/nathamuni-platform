import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { fireEvent, render, screen } from '@testing-library/react'
import { MetricTracker } from './MetricTracker'
import type { Metric } from '@/lib/sessions'

const SLUG = 'test-session'

const METRICS: Metric[] = [
  { name: 'Bodyweight', how: 'Same scale, same time.', cadence: 'Daily' },
  { name: 'Sleep hours', how: 'Time asleep.', cadence: 'Daily' },
]

describe('MetricTracker', () => {
  beforeEach(() => {
    window.localStorage.clear()
  })

  afterEach(() => {
    window.localStorage.clear()
    vi.restoreAllMocks()
  })

  it('renders every metric name and the privacy line', () => {
    render(<MetricTracker slug={SLUG} metrics={METRICS} />)
    for (const metric of METRICS) {
      expect(screen.getByText(metric.name)).toBeInTheDocument()
    }
    expect(screen.getByText(/logged in your browser/i)).toBeInTheDocument()
  })

  it('logging a value adds an entry and persists it to localStorage', () => {
    render(<MetricTracker slug={SLUG} metrics={METRICS} />)
    const input = screen.getByLabelText(`Log a value for ${METRICS[0].name}`)
    fireEvent.change(input, { target: { value: '72' } })
    fireEvent.click(screen.getAllByRole('button', { name: 'Log' })[0])

    const raw = window.localStorage.getItem(`metrics-${SLUG}-0`)
    expect(raw).not.toBeNull()
    const parsed = JSON.parse(raw as string)
    expect(parsed).toHaveLength(1)
    expect(parsed[0].value).toBe(72)
    expect(typeof parsed[0].date).toBe('string')
    expect(screen.getByText('72')).toBeInTheDocument()
    expect(screen.getByText('1')).toBeInTheDocument()
  })

  it('pressing Enter in the input logs the value too', () => {
    render(<MetricTracker slug={SLUG} metrics={METRICS} />)
    const input = screen.getByLabelText(`Log a value for ${METRICS[1].name}`)
    fireEvent.change(input, { target: { value: '8' } })
    fireEvent.keyDown(input, { key: 'Enter' })

    const raw = window.localStorage.getItem(`metrics-${SLUG}-1`)
    expect(JSON.parse(raw as string)).toHaveLength(1)
  })

  it('clear empties the entries after confirm', () => {
    vi.spyOn(window, 'confirm').mockReturnValue(true)
    render(<MetricTracker slug={SLUG} metrics={METRICS} />)
    const input = screen.getByLabelText(`Log a value for ${METRICS[0].name}`)
    fireEvent.change(input, { target: { value: '72' } })
    fireEvent.click(screen.getAllByRole('button', { name: 'Log' })[0])

    fireEvent.click(screen.getByRole('button', { name: 'clear' }))

    expect(window.confirm).toHaveBeenCalled()
    const raw = window.localStorage.getItem(`metrics-${SLUG}-0`)
    expect(JSON.parse(raw as string)).toHaveLength(0)
    expect(screen.queryByRole('button', { name: 'clear' })).not.toBeInTheDocument()
  })

  it('does not clear when confirm is dismissed', () => {
    vi.spyOn(window, 'confirm').mockReturnValue(false)
    render(<MetricTracker slug={SLUG} metrics={METRICS} />)
    const input = screen.getByLabelText(`Log a value for ${METRICS[0].name}`)
    fireEvent.change(input, { target: { value: '72' } })
    fireEvent.click(screen.getAllByRole('button', { name: 'Log' })[0])

    fireEvent.click(screen.getByRole('button', { name: 'clear' }))

    const raw = window.localStorage.getItem(`metrics-${SLUG}-0`)
    expect(JSON.parse(raw as string)).toHaveLength(1)
  })
})
