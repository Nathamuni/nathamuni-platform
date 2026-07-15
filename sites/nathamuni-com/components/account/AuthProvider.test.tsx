import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { AuthProvider, useAuth } from './AuthProvider'
import { isAuthed } from '@/lib/progress'

function Probe() {
  const { authed, email, loading, available, signup, login, logout } = useAuth()
  return (
    <div>
      <span data-testid="loading">{String(loading)}</span>
      <span data-testid="authed">{String(authed)}</span>
      <span data-testid="available">{String(available)}</span>
      <span data-testid="email">{email ?? ''}</span>
      <button onClick={() => void signup('new@example.com', 'password123')}>signup</button>
      <button onClick={() => void login('bad@example.com', 'wrongpass')}>login-fail</button>
      <button onClick={() => void logout()}>logout</button>
    </div>
  )
}

describe('AuthProvider', () => {
  beforeEach(() => {
    window.localStorage.clear()
  })

  afterEach(() => {
    window.localStorage.clear()
    vi.restoreAllMocks()
  })

  it('resolves to signed-out once /api/auth/me says unauthenticated', async () => {
    global.fetch = vi.fn().mockResolvedValue({
      status: 200,
      ok: true,
      json: async () => ({ authed: false }),
    }) as unknown as typeof fetch

    render(
      <AuthProvider>
        <Probe />
      </AuthProvider>
    )

    await waitFor(() => expect(screen.getByTestId('loading')).toHaveTextContent('false'))
    expect(screen.getByTestId('authed')).toHaveTextContent('false')
    expect(screen.getByTestId('available')).toHaveTextContent('true')
    expect(isAuthed()).toBe(false)
  })

  it('marks accounts unavailable on a 503 from /api/auth/me', async () => {
    global.fetch = vi.fn().mockResolvedValue({
      status: 503,
      ok: false,
      json: async () => ({ error: 'Accounts are opening soon.' }),
    }) as unknown as typeof fetch

    render(
      <AuthProvider>
        <Probe />
      </AuthProvider>
    )

    await waitFor(() => expect(screen.getByTestId('available')).toHaveTextContent('false'))
  })

  it('hydrates authed state and progress when /api/auth/me reports a session', async () => {
    global.fetch = vi.fn().mockResolvedValue({
      status: 200,
      ok: true,
      json: async () => ({ authed: true, email: 'me@example.com', progress: { 'session-foo': '[true]' } }),
    }) as unknown as typeof fetch

    render(
      <AuthProvider>
        <Probe />
      </AuthProvider>
    )

    await waitFor(() => expect(screen.getByTestId('authed')).toHaveTextContent('true'))
    expect(screen.getByTestId('email')).toHaveTextContent('me@example.com')
    expect(window.localStorage.getItem('session-foo')).toBe('[true]')
    expect(isAuthed()).toBe(true)
  })

  it('signup success sets authed + email and applies returned progress', async () => {
    const user = userEvent.setup()
    global.fetch = vi.fn().mockImplementation((input: RequestInfo | URL) => {
      const url = String(input)
      if (url.endsWith('/api/auth/me')) {
        return Promise.resolve({ status: 200, ok: true, json: async () => ({ authed: false }) })
      }
      if (url.endsWith('/api/auth/signup')) {
        return Promise.resolve({
          status: 200,
          ok: true,
          json: async () => ({ ok: true, email: 'new@example.com', progress: { 'course-a-0': '[true]' } }),
        })
      }
      throw new Error(`unexpected fetch: ${url}`)
    }) as unknown as typeof fetch

    render(
      <AuthProvider>
        <Probe />
      </AuthProvider>
    )

    await waitFor(() => expect(screen.getByTestId('loading')).toHaveTextContent('false'))
    await user.click(screen.getByText('signup'))

    await waitFor(() => expect(screen.getByTestId('authed')).toHaveTextContent('true'))
    expect(screen.getByTestId('email')).toHaveTextContent('new@example.com')
    expect(window.localStorage.getItem('course-a-0')).toBe('[true]')
  })

  it('login failure surfaces the server error and stays signed out', async () => {
    const user = userEvent.setup()
    global.fetch = vi.fn().mockImplementation((input: RequestInfo | URL) => {
      const url = String(input)
      if (url.endsWith('/api/auth/me')) {
        return Promise.resolve({ status: 200, ok: true, json: async () => ({ authed: false }) })
      }
      if (url.endsWith('/api/auth/login')) {
        return Promise.resolve({
          status: 401,
          ok: false,
          json: async () => ({ error: 'Email or password is wrong.' }),
        })
      }
      throw new Error(`unexpected fetch: ${url}`)
    }) as unknown as typeof fetch

    render(
      <AuthProvider>
        <Probe />
      </AuthProvider>
    )

    await waitFor(() => expect(screen.getByTestId('loading')).toHaveTextContent('false'))
    await user.click(screen.getByText('login-fail'))

    await waitFor(() => expect(screen.getByTestId('authed')).toHaveTextContent('false'))
  })

  it('logout clears authed state and email but keeps localStorage progress', async () => {
    const user = userEvent.setup()
    window.localStorage.setItem('session-keep-me', '[true]')
    global.fetch = vi.fn().mockImplementation((input: RequestInfo | URL) => {
      const url = String(input)
      if (url.endsWith('/api/auth/me')) {
        return Promise.resolve({
          status: 200,
          ok: true,
          json: async () => ({ authed: true, email: 'me@example.com', progress: {} }),
        })
      }
      if (url.endsWith('/api/auth/logout')) {
        return Promise.resolve({ status: 200, ok: true, json: async () => ({ ok: true }) })
      }
      throw new Error(`unexpected fetch: ${url}`)
    }) as unknown as typeof fetch

    render(
      <AuthProvider>
        <Probe />
      </AuthProvider>
    )

    await waitFor(() => expect(screen.getByTestId('authed')).toHaveTextContent('true'))
    await user.click(screen.getByText('logout'))

    await waitFor(() => expect(screen.getByTestId('authed')).toHaveTextContent('false'))
    expect(screen.getByTestId('email')).toHaveTextContent('')
    expect(window.localStorage.getItem('session-keep-me')).toBe('[true]')
    expect(isAuthed()).toBe(false)
  })
})
