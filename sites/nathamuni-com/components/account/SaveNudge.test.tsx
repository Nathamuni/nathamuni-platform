import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { act, render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { SaveNudgeHost, earnSaveNudge } from './SaveNudge'
import { AuthProvider } from './AuthProvider'

function mockMe(response: unknown, status = 200) {
  global.fetch = vi.fn().mockImplementation((input: RequestInfo | URL) => {
    const url = String(input)
    if (url.endsWith('/api/auth/me')) {
      return Promise.resolve({ status, ok: status < 400, json: async () => response })
    }
    throw new Error(`unexpected fetch in test: ${url}`)
  }) as unknown as typeof fetch
}

function renderHost() {
  return render(
    <AuthProvider>
      <SaveNudgeHost />
    </AuthProvider>
  )
}

describe('SaveNudgeHost', () => {
  beforeEach(() => {
    window.localStorage.clear()
    window.sessionStorage.clear()
  })

  afterEach(() => {
    window.localStorage.clear()
    window.sessionStorage.clear()
    vi.restoreAllMocks()
  })

  it('stays hidden until progress is earned', async () => {
    mockMe({ authed: false })
    renderHost()
    await waitFor(() => expect(global.fetch).toHaveBeenCalled())
    expect(screen.queryByTestId('save-nudge')).toBeNull()
  })

  it('slides in once earned, for a signed-out visitor', async () => {
    mockMe({ authed: false })
    renderHost()
    await waitFor(() => expect(global.fetch).toHaveBeenCalled())
    act(() => earnSaveNudge())
    expect(await screen.findByTestId('save-nudge')).toBeInTheDocument()
  })

  it('shows exactly one toast even when earned repeatedly', async () => {
    mockMe({ authed: false })
    renderHost()
    await waitFor(() => expect(global.fetch).toHaveBeenCalled())
    act(() => {
      earnSaveNudge()
      earnSaveNudge()
      earnSaveNudge()
    })
    expect(await screen.findAllByTestId('save-nudge')).toHaveLength(1)
  })

  it('never appears for a signed-in visitor', async () => {
    mockMe({ authed: true, email: 'me@example.com', progress: {} })
    renderHost()
    await waitFor(() => expect(global.fetch).toHaveBeenCalled())
    act(() => earnSaveNudge())
    expect(screen.queryByTestId('save-nudge')).toBeNull()
  })

  it('CTA fires nm-open-account', async () => {
    mockMe({ authed: false })
    const user = userEvent.setup()
    const listener = vi.fn()
    window.addEventListener('nm-open-account', listener)
    renderHost()
    await waitFor(() => expect(global.fetch).toHaveBeenCalled())
    act(() => earnSaveNudge())
    await user.click(await screen.findByRole('button', { name: 'Keep it on any device' }))
    expect(listener).toHaveBeenCalledOnce()
    window.removeEventListener('nm-open-account', listener)
  })

  it('the × dismisses forever', async () => {
    mockMe({ authed: false })
    const user = userEvent.setup()
    renderHost()
    await waitFor(() => expect(global.fetch).toHaveBeenCalled())
    act(() => earnSaveNudge())
    await user.click(await screen.findByRole('button', { name: "Don't show this again" }))
    await waitFor(() => expect(screen.queryByTestId('save-nudge')).toBeNull())
    expect(window.localStorage.getItem('nm-nudge-dismissed')).toBe('1')

    // A later earn stays silent — even in a fresh session.
    window.sessionStorage.clear()
    act(() => earnSaveNudge())
    expect(screen.queryByTestId('save-nudge')).toBeNull()
  })

  it('shows only once per browser session', async () => {
    mockMe({ authed: false })
    window.sessionStorage.setItem('nm-nudge-shown', '1')
    renderHost()
    await waitFor(() => expect(global.fetch).toHaveBeenCalled())
    act(() => earnSaveNudge())
    expect(screen.queryByTestId('save-nudge')).toBeNull()
  })
})
