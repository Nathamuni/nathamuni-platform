'use client'

import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react'
import type { ReactNode } from 'react'
import { applyProgress, collectProgress, setAuthed } from '@/lib/progress'

interface AuthResult {
  ok: boolean
  error?: string
}

interface AuthContextValue {
  /** Signed in right now. */
  authed: boolean
  email: string | null
  /** Still resolving the initial `/api/auth/me` check. */
  loading: boolean
  /** False once the backend has told us accounts are unavailable (503 / KV unbound). */
  available: boolean
  signup: (email: string, password: string) => Promise<AuthResult>
  login: (email: string, password: string) => Promise<AuthResult>
  logout: () => Promise<void>
}

const AuthContext = createContext<AuthContextValue | null>(null)

interface AuthPayload {
  ok?: boolean
  error?: string
  authed?: boolean
  email?: string
  progress?: Record<string, string>
}

async function readJson(res: Response): Promise<AuthPayload | null> {
  try {
    return (await res.json()) as AuthPayload
  } catch {
    return null
  }
}

async function postAuth(path: string, body: unknown): Promise<{ res: Response; data: AuthPayload | null }> {
  const res = await fetch(`/api/auth/${path}`, {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    credentials: 'same-origin',
    body: JSON.stringify(body),
  })
  return { res, data: await readJson(res) }
}

/**
 * Optional accounts so course/session/metric progress can follow a visitor
 * to another device. Local-first always: signed-out visitors keep working
 * entirely off localStorage (see `lib/progress.ts`); this provider only adds
 * a thin sync layer on top once someone opts in.
 */
export function AuthProvider({ children }: { children: ReactNode }) {
  const [authedState, setAuthedState] = useState(false)
  const [email, setEmail] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)
  const [available, setAvailable] = useState(true)

  useEffect(() => {
    let cancelled = false

    async function loadMe() {
      try {
        const res = await fetch('/api/auth/me', { credentials: 'same-origin' })
        if (res.status === 503) {
          if (!cancelled) setAvailable(false)
          return
        }
        const data = await readJson(res)
        if (cancelled || !data) return
        if (data.authed) {
          setAuthed(true)
          setAuthedState(true)
          setEmail(data.email ?? null)
          applyProgress(data.progress ?? {})
        }
      } catch {
        /* network unavailable — treat accounts as unreachable, stay local-only */
        if (!cancelled) setAvailable(false)
      } finally {
        if (!cancelled) setLoading(false)
      }
    }

    void loadMe()
    return () => {
      cancelled = true
    }
  }, [])

  const authenticate = useCallback(async (path: 'signup' | 'login', emailInput: string, password: string) => {
    const { res, data } = await postAuth(path, {
      email: emailInput,
      password,
      progress: collectProgress(),
    })
    if (res.status === 503) {
      setAvailable(false)
      return { ok: false, error: data?.error ?? 'Accounts are unavailable right now.' }
    }
    if (!res.ok || !data?.ok) {
      return { ok: false, error: data?.error ?? 'Something went wrong. Try again.' }
    }
    setAuthed(true)
    setAuthedState(true)
    setEmail(data.email ?? null)
    applyProgress(data.progress ?? {})
    return { ok: true }
  }, [])

  const signup = useCallback((emailInput: string, password: string) => authenticate('signup', emailInput, password), [
    authenticate,
  ])
  const login = useCallback((emailInput: string, password: string) => authenticate('login', emailInput, password), [
    authenticate,
  ])

  const logout = useCallback(async () => {
    try {
      await fetch('/api/auth/logout', { method: 'POST', credentials: 'same-origin' })
    } catch {
      /* ignore — we clear local auth state regardless */
    }
    setAuthed(false)
    setAuthedState(false)
    setEmail(null)
    // Local progress in localStorage is intentionally left untouched.
  }, [])

  const value = useMemo<AuthContextValue>(
    () => ({ authed: authedState, email, loading, available, signup, login, logout }),
    [authedState, email, loading, available, signup, login, logout]
  )

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext)
  if (!ctx) {
    throw new Error('useAuth must be used within an AuthProvider')
  }
  return ctx
}

/** Like useAuth, but null outside an AuthProvider — for optional add-ons. */
export function useOptionalAuth(): AuthContextValue | null {
  return useContext(AuthContext)
}
