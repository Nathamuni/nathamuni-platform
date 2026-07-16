import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { AccountWidget } from './AccountWidget'
import { AuthProvider } from './AuthProvider'

function mockMe(response: unknown, status = 200) {
  global.fetch = vi.fn().mockImplementation((input: RequestInfo | URL, init?: RequestInit) => {
    const url = String(input)
    if (url.endsWith('/api/auth/me')) {
      return Promise.resolve({ status, ok: status < 400, json: async () => response })
    }
    if (url.endsWith('/api/auth/login')) {
      return Promise.resolve({
        status: 200,
        ok: true,
        json: async () => ({ ok: true, email: 'me@example.com', progress: {} }),
      })
    }
    throw new Error(`unexpected fetch in test: ${url} ${JSON.stringify(init)}`)
  }) as unknown as typeof fetch
}

// The widget only renders on progress pages (/courses, /sessions).
let mockPathname = '/sessions/diet-reset'
vi.mock('next/navigation', () => ({
  usePathname: () => mockPathname,
}))

describe('AccountWidget', () => {
  beforeEach(() => {
    window.localStorage.clear()
    mockPathname = '/sessions/diet-reset'
  })

  afterEach(() => {
    window.localStorage.clear()
    vi.restoreAllMocks()
  })

  it('renders the signed-out pill once auth state resolves', async () => {
    mockMe({ authed: false })
    render(
      <AuthProvider>
        <AccountWidget />
      </AuthProvider>
    )

    expect(await screen.findByTestId('account-widget-toggle')).toHaveTextContent('Save my progress')
  })

  it('stays hidden outside the progress sections', async () => {
    mockPathname = '/blog'
    mockMe({ authed: false })
    render(
      <AuthProvider>
        <AccountWidget />
      </AuthProvider>
    )

    await waitFor(() => expect(global.fetch).toHaveBeenCalled())
    expect(screen.queryByTestId('account-widget')).toBeNull()
  })

  it('opening the pill shows the why-line and both tabs', async () => {
    const user = userEvent.setup()
    mockMe({ authed: false })
    render(
      <AuthProvider>
        <AccountWidget />
      </AuthProvider>
    )

    await user.click(await screen.findByTestId('account-widget-toggle'))

    expect(
      screen.getByText(
        'Email + password only, so your course and session progress follows you to any device. No newsletters, no tracking, nothing shared.'
      )
    ).toBeInTheDocument()
    expect(screen.getByRole('tab', { name: 'Login' })).toBeInTheDocument()
    expect(screen.getByRole('tab', { name: 'Create account' })).toBeInTheDocument()
    expect(screen.getByText(/already saved in this browser/i)).toBeInTheDocument()
  })

  it('a successful login shows the signed-in email pill', async () => {
    const user = userEvent.setup()
    mockMe({ authed: false })
    render(
      <AuthProvider>
        <AccountWidget />
      </AuthProvider>
    )

    await user.click(await screen.findByTestId('account-widget-toggle'))
    await user.type(screen.getByLabelText('Email'), 'me@example.com')
    await user.type(screen.getByLabelText('Password'), 'password123')
    await user.click(screen.getByRole('button', { name: 'Log in' }))

    await waitFor(() => expect(screen.getByTestId('account-widget-signed-in')).toBeInTheDocument())
    expect(screen.getByText('me@example.com')).toBeInTheDocument()
  })

  it('closes the card when Escape is pressed', async () => {
    const user = userEvent.setup()
    mockMe({ authed: false })
    render(
      <AuthProvider>
        <AccountWidget />
      </AuthProvider>
    )

    await user.click(await screen.findByTestId('account-widget-toggle'))
    expect(screen.getByTestId('account-widget-card')).toBeInTheDocument()

    await user.keyboard('{Escape}')

    await waitFor(() => expect(screen.queryByTestId('account-widget-card')).not.toBeInTheDocument())
  })

  it('shows a disabled state instead of a broken form when accounts are unavailable', async () => {
    mockMe({ error: 'Accounts are opening soon.' }, 503)
    render(
      <AuthProvider>
        <AccountWidget />
      </AuthProvider>
    )

    expect(await screen.findByTestId('account-widget-unavailable')).toHaveTextContent('Saved in this browser')
    expect(screen.queryByTestId('account-widget-toggle')).not.toBeInTheDocument()
  })
})
