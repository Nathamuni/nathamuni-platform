import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { SaveNudge } from './SaveNudge'
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

function renderNudge(show = true) {
  return render(
    <AuthProvider>
      <SaveNudge show={show} />
    </AuthProvider>
  )
}

describe('SaveNudge', () => {
  beforeEach(() => {
    window.localStorage.clear()
  })

  afterEach(() => {
    window.localStorage.clear()
    vi.restoreAllMocks()
  })

  it('appears for a signed-out visitor once earned', async () => {
    mockMe({ authed: false })
    renderNudge()
    expect(await screen.findByTestId('save-nudge')).toBeInTheDocument()
  })

  it('never appears when show is false', async () => {
    mockMe({ authed: false })
    renderNudge(false)
    await waitFor(() => expect(global.fetch).toHaveBeenCalled())
    expect(screen.queryByTestId('save-nudge')).toBeNull()
  })

  it('never appears for a signed-in visitor', async () => {
    mockMe({ authed: true, email: 'me@example.com', progress: {} })
    renderNudge()
    await waitFor(() => expect(global.fetch).toHaveBeenCalled())
    expect(screen.queryByTestId('save-nudge')).toBeNull()
  })

  it('fires nm-open-account when the CTA is clicked', async () => {
    mockMe({ authed: false })
    const user = userEvent.setup()
    const listener = vi.fn()
    window.addEventListener('nm-open-account', listener)
    renderNudge()
    await user.click(await screen.findByRole('button', { name: 'Keep it on any device' }))
    expect(listener).toHaveBeenCalledOnce()
    window.removeEventListener('nm-open-account', listener)
  })

  it('stays dismissed across mounts', async () => {
    mockMe({ authed: false })
    const user = userEvent.setup()
    const { unmount } = renderNudge()
    await user.click(await screen.findByRole('button', { name: 'Dismiss' }))
    expect(screen.queryByTestId('save-nudge')).toBeNull()
    unmount()
    renderNudge()
    await waitFor(() => expect(global.fetch).toHaveBeenCalled())
    expect(screen.queryByTestId('save-nudge')).toBeNull()
  })
})
