import { describe, expect, it, vi, beforeEach } from 'vitest'
import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { AskChat } from './AskChat'

describe('AskChat', () => {
  beforeEach(() => {
    vi.restoreAllMocks()
  })

  it('renders the intro card and starter chips', () => {
    render(<AskChat />)
    expect(screen.getByTestId('ask-intro')).toBeInTheDocument()
    expect(screen.getByText('How do I stay consistent?')).toBeInTheDocument()
    expect(screen.getByText('What is your book about?')).toBeInTheDocument()
  })

  it('sends a question and renders the twin reply', async () => {
    const user = userEvent.setup()
    global.fetch = vi.fn().mockResolvedValue({
      ok: true,
      status: 200,
      json: async () => ({ answer: 'Systems, not motivation.' }),
    }) as unknown as typeof fetch

    render(<AskChat />)
    await user.type(screen.getByTestId('ask-input'), 'How do I stay consistent?')
    await user.click(screen.getByTestId('ask-send'))

    await waitFor(() => expect(screen.getByText('Systems, not motivation.')).toBeInTheDocument())

    expect(global.fetch).toHaveBeenCalledWith(
      '/api/ask',
      expect.objectContaining({
        method: 'POST',
        body: JSON.stringify({ question: 'How do I stay consistent?' }),
      })
    )
  })

  it('sends the question immediately when a starter chip is clicked', async () => {
    const user = userEvent.setup()
    global.fetch = vi.fn().mockResolvedValue({
      ok: true,
      status: 200,
      json: async () => ({ answer: 'It runs on-device.' }),
    }) as unknown as typeof fetch

    render(<AskChat />)
    await user.click(screen.getByText('Why local-first AI?'))

    await waitFor(() => expect(screen.getByText('It runs on-device.')).toBeInTheDocument())
    expect(screen.getByText('Why local-first AI?')).toBeInTheDocument() // echoed as the user message
  })

  it('shows a rate-limit message on 429', async () => {
    const user = userEvent.setup()
    global.fetch = vi.fn().mockResolvedValue({
      ok: false,
      status: 429,
      json: async () => ({ error: 'The twin is resting for today — try again tomorrow.' }),
    }) as unknown as typeof fetch

    render(<AskChat />)
    await user.type(screen.getByTestId('ask-input'), 'One more question')
    await user.click(screen.getByTestId('ask-send'))

    await waitFor(() => expect(screen.getByTestId('ask-error')).toBeInTheDocument())
    expect(screen.getByTestId('ask-error')).toHaveTextContent(/resting for today/i)
  })

  it('shows a generic error state when the request fails', async () => {
    const user = userEvent.setup()
    global.fetch = vi.fn().mockRejectedValue(new Error('network down'))

    render(<AskChat />)
    await user.type(screen.getByTestId('ask-input'), 'Are you there?')
    await user.click(screen.getByTestId('ask-send'))

    await waitFor(() => expect(screen.getByTestId('ask-error')).toBeInTheDocument())
    expect(screen.getByTestId('ask-error')).toHaveTextContent(/couldn't reach the twin/i)
  })
})
