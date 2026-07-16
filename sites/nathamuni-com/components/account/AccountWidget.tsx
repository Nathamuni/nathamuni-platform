'use client'

import { usePathname } from 'next/navigation'
import { useEffect, useRef, useState, type FormEvent } from 'react'
import { useAuth } from './AuthProvider'

/** Only these sections have progress worth saving — the pill stays out of the way everywhere else. */
function isProgressPage(pathname: string | null): boolean {
  if (!pathname) return false
  return pathname.startsWith('/courses') || pathname.startsWith('/sessions')
}

const WHY_LINE =
  'Email + password only, so your course and session progress follows you to any device. No newsletters, no tracking, nothing shared.'

type Tab = 'login' | 'signup'

const ACCT_CSS = `
.acct-wrap {
  position: fixed;
  top: calc(12px + env(safe-area-inset-top, 0px));
  left: 12px;
  z-index: 35;
}
@media (max-width: 639px) {
  .acct-wrap {
    /* Sits below the mobile header pill instead of on top of it; the bottom
       tab bar is untouched since we never anchor to the bottom on mobile. */
    top: calc(72px + env(safe-area-inset-top, 0px));
  }
}
.acct-pill {
  display: inline-flex;
  align-items: center;
  gap: 0.5rem;
  min-height: 44px;
  padding: 0 1rem;
  border-radius: 9999px;
  background: rgba(13, 10, 31, 0.6);
  border: 1px solid rgba(178, 148, 255, 0.22);
  backdrop-filter: blur(16px);
  -webkit-backdrop-filter: blur(16px);
  color: #f5f3ff;
  font-size: 0.78rem;
  font-weight: 500;
  cursor: pointer;
  transition: border-color 0.2s ease, background 0.2s ease;
}
.acct-pill:hover {
  border-color: rgba(178, 148, 255, 0.4);
}
.acct-pill-disabled {
  cursor: default;
  color: rgba(245, 243, 255, 0.55);
}
.acct-pill-signed-in {
  cursor: default;
  padding-right: 0.5rem;
}
.acct-email {
  max-width: 9rem;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}
.acct-signout-btn {
  min-height: 36px;
  padding: 0 0.75rem;
  border-radius: 9999px;
  border: 1px solid rgba(178, 148, 255, 0.22);
  background: rgba(255, 255, 255, 0.06);
  color: #f5f3ff;
  font-size: 0.72rem;
  cursor: pointer;
}
.acct-signout-btn:hover {
  background: rgba(178, 148, 255, 0.16);
}
.acct-card {
  margin-top: 0.6rem;
  width: min(19rem, calc(100vw - 24px));
  padding: 1.1rem;
  display: flex;
  flex-direction: column;
  gap: 0.85rem;
  border-radius: 1.1rem;
  background: rgba(13, 10, 31, 0.88);
  border: 1px solid rgba(178, 148, 255, 0.25);
  backdrop-filter: blur(20px);
  -webkit-backdrop-filter: blur(20px);
  box-shadow: 0 12px 40px rgba(5, 3, 15, 0.55);
}
.acct-tabs {
  display: flex;
  gap: 0.4rem;
}
.acct-tab {
  flex: 1 1 auto;
  min-height: 40px;
  border-radius: 9999px;
  border: 1px solid transparent;
  background: rgba(255, 255, 255, 0.05);
  color: rgba(245, 243, 255, 0.65);
  font-size: 0.78rem;
  font-weight: 600;
  cursor: pointer;
  transition: background 0.2s ease, color 0.2s ease, border-color 0.2s ease;
}
.acct-tab.is-active {
  color: #fff;
  background: linear-gradient(120deg, rgba(139, 92, 246, 0.4), rgba(236, 72, 153, 0.3));
  border-color: rgba(178, 148, 255, 0.4);
}
.acct-why {
  margin: 0;
  font-size: 0.72rem;
  line-height: 1.55;
  color: rgba(245, 243, 255, 0.6);
}
.acct-form {
  display: flex;
  flex-direction: column;
  gap: 0.7rem;
}
.acct-field {
  display: flex;
  flex-direction: column;
  gap: 0.3rem;
  font-size: 0.72rem;
  color: rgba(245, 243, 255, 0.7);
}
.acct-field input {
  min-height: 44px;
  padding: 0 0.8rem;
  border-radius: 0.6rem;
  background: rgba(13, 10, 31, 0.5);
  border: 1px solid rgba(255, 255, 255, 0.14);
  color: #fff;
  font-size: 0.9rem;
}
.acct-field input:focus-visible {
  outline: 2px solid rgba(34, 211, 238, 0.6);
  outline-offset: 1px;
}
.acct-error {
  margin: 0;
  font-size: 0.75rem;
  color: #fca5a5;
}
.acct-submit {
  min-height: 44px;
  border-radius: 0.7rem;
  border: 1px solid rgba(34, 211, 238, 0.45);
  background: rgba(34, 211, 238, 0.18);
  color: #67e8f9;
  font-size: 0.85rem;
  font-weight: 600;
  cursor: pointer;
  transition: background 0.2s ease;
}
.acct-submit:hover:not(:disabled) {
  background: rgba(34, 211, 238, 0.3);
}
.acct-submit:disabled {
  opacity: 0.6;
  cursor: default;
}
.acct-note {
  margin: 0;
  font-size: 0.68rem;
  color: rgba(245, 243, 255, 0.4);
}
@media (prefers-reduced-motion: reduce) {
  .acct-pill,
  .acct-tab,
  .acct-submit {
    transition: none;
  }
}
`

/**
 * Small glass pill offering optional accounts so progress can follow a
 * visitor to another device. Local-first: signed out, everything already
 * works off localStorage; this widget is purely an opt-in sync layer.
 */
export function AccountWidget() {
  const { authed, email, loading, available, signup, login, logout } = useAuth()
  const pathname = usePathname()
  const [open, setOpen] = useState(false)
  const [tab, setTab] = useState<Tab>('login')
  const [emailInput, setEmailInput] = useState('')
  const [passwordInput, setPasswordInput] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [submitting, setSubmitting] = useState(false)
  const cardRef = useRef<HTMLDivElement | null>(null)

  // A SaveNudge anywhere on the page can pop this dialog open.
  useEffect(() => {
    function onOpenRequest() {
      setOpen(true)
      setTab('signup')
    }
    window.addEventListener('nm-open-account', onOpenRequest)
    return () => window.removeEventListener('nm-open-account', onOpenRequest)
  }, [])

  useEffect(() => {
    if (!open) return
    function onKey(event: KeyboardEvent) {
      if (event.key === 'Escape') setOpen(false)
    }
    function onOutside(event: MouseEvent) {
      if (cardRef.current && !cardRef.current.contains(event.target as Node)) setOpen(false)
    }
    document.addEventListener('keydown', onKey)
    document.addEventListener('mousedown', onOutside)
    return () => {
      document.removeEventListener('keydown', onKey)
      document.removeEventListener('mousedown', onOutside)
    }
  }, [open])

  if (loading) return null
  if (!isProgressPage(pathname)) return null

  if (!available) {
    return (
      <div className="acct-wrap" data-testid="account-widget-unavailable">
        <style>{ACCT_CSS}</style>
        <div className="acct-pill acct-pill-disabled" aria-live="polite">
          Saved in this browser
        </div>
      </div>
    )
  }

  function switchTab(next: Tab) {
    setTab(next)
    setError(null)
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setError(null)
    setSubmitting(true)
    const action = tab === 'login' ? login : signup
    const result = await action(emailInput.trim(), passwordInput)
    setSubmitting(false)
    if (!result.ok) {
      setError(result.error ?? 'Something went wrong.')
      return
    }
    setOpen(false)
    setEmailInput('')
    setPasswordInput('')
  }

  async function handleLogout() {
    await logout()
  }

  if (authed) {
    return (
      <div className="acct-wrap" data-testid="account-widget-signed-in">
        <style>{ACCT_CSS}</style>
        <div className="acct-pill acct-pill-signed-in">
          <span className="acct-email" title={email ?? undefined}>
            {email}
          </span>
          <button type="button" className="acct-signout-btn" onClick={handleLogout}>
            Sign out
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="acct-wrap" data-testid="account-widget">
      <style>{ACCT_CSS}</style>
      <button
        type="button"
        className="acct-pill"
        aria-expanded={open}
        aria-haspopup="dialog"
        aria-label="Save my progress"
        onClick={() => setOpen((value) => !value)}
        data-testid="account-widget-toggle"
      >
        Save my progress
      </button>

      {open && (
        <div
          className="acct-card"
          role="dialog"
          aria-label="Save your progress"
          ref={cardRef}
          data-testid="account-widget-card"
        >
          <div className="acct-tabs" role="tablist">
            <button
              type="button"
              role="tab"
              aria-selected={tab === 'login'}
              className={tab === 'login' ? 'acct-tab is-active' : 'acct-tab'}
              onClick={() => switchTab('login')}
            >
              Login
            </button>
            <button
              type="button"
              role="tab"
              aria-selected={tab === 'signup'}
              className={tab === 'signup' ? 'acct-tab is-active' : 'acct-tab'}
              onClick={() => switchTab('signup')}
            >
              Create account
            </button>
          </div>

          <p className="acct-why">{WHY_LINE}</p>

          <form className="acct-form" onSubmit={handleSubmit}>
            <label className="acct-field">
              <span>Email</span>
              <input
                type="email"
                required
                autoComplete="email"
                value={emailInput}
                onChange={(event) => setEmailInput(event.target.value)}
                aria-label="Email"
              />
            </label>
            <label className="acct-field">
              <span>Password</span>
              <input
                type="password"
                required
                minLength={8}
                autoComplete={tab === 'login' ? 'current-password' : 'new-password'}
                value={passwordInput}
                onChange={(event) => setPasswordInput(event.target.value)}
                aria-label="Password"
              />
            </label>

            {error && (
              <p className="acct-error" role="alert">
                {error}
              </p>
            )}

            <button type="submit" className="acct-submit" disabled={submitting}>
              {submitting ? 'Please wait…' : tab === 'login' ? 'Log in' : 'Create account'}
            </button>
          </form>

          <p className="acct-note">Prefer not to? Your progress is already saved in this browser.</p>
        </div>
      )}
    </div>
  )
}
