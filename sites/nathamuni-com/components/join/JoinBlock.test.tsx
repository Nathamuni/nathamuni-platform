import { afterEach, describe, expect, it, vi } from 'vitest'
import { fireEvent, render, screen, waitFor } from '@testing-library/react'
import { JoinBlock } from './JoinBlock'

function fillAndSubmit() {
  fireEvent.change(screen.getByLabelText('Email address'), {
    target: { value: 'test@example.com' },
  })
  fireEvent.click(screen.getByTestId('join-submit'))
}

describe('JoinBlock', () => {
  afterEach(() => {
    vi.restoreAllMocks()
  })

  it('renders the form with email, ambition, and privacy note', () => {
    render(<JoinBlock />)
    expect(screen.getByLabelText('Email address')).toBeInTheDocument()
    expect(screen.getByLabelText('What are you chasing right now')).toBeInTheDocument()
    expect(screen.getByText(/No trackers, nothing else/)).toBeInTheDocument()
  })

  it('shows the success state after a successful join', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn().mockResolvedValue({ ok: true, json: async () => ({ ok: true }) })
    )
    render(<JoinBlock />)
    fillAndSubmit()
    await waitFor(() => expect(screen.getByTestId('join-done')).toBeInTheDocument())
  })

  it('surfaces the server error message on failure', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn().mockResolvedValue({
        ok: false,
        json: async () => ({ error: 'The lab list opens very soon — until then, DM me on Instagram.' }),
      })
    )
    render(<JoinBlock />)
    fillAndSubmit()
    await waitFor(() => expect(screen.getByTestId('join-error')).toBeInTheDocument())
    expect(screen.getByTestId('join-error').textContent).toContain('opens very soon')
  })
})
