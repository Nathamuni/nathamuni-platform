'use client'

import { useState } from 'react'

type JoinState = 'idle' | 'pending' | 'done' | 'error'

/**
 * "Join the lab" — email + optional ambition, stored via /api/join (KV).
 * Privacy-honest by design: one purpose, no trackers, honeypot for bots.
 */
export function JoinBlock() {
  const [state, setState] = useState<JoinState>('idle')
  const [message, setMessage] = useState('')

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    if (state === 'pending') return
    const form = e.currentTarget
    const data = new FormData(form)
    setState('pending')
    try {
      const res = await fetch('/api/join', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: data.get('email'),
          ambition: data.get('ambition'),
          website: data.get('website'),
        }),
      })
      const body = await res.json().catch(() => ({}))
      if (res.ok && body.ok) {
        setState('done')
        form.reset()
      } else {
        setState('error')
        setMessage(body.error ?? 'Could not save that just now — try again.')
      }
    } catch {
      setState('error')
      setMessage('Network hiccup — try again in a moment.')
    }
  }

  return (
    <section className="section" aria-labelledby="join-heading" data-reveal data-testid="join-block">
      <div className="glass-card px-5 py-6 sm:px-8 sm:py-8 max-w-2xl mx-auto">
        <h2 id="join-heading" className="section-title">
          One tested idea, weekly
        </h2>
        <p className="section-sub">
          When the newsletter opens, you&apos;ll get exactly one idea a week that survived testing
          on me first. Tell me what you&apos;re chasing — the first issues will be built from your
          answers.
        </p>
        {state === 'done' ? (
          <p className="text-emerald-300 text-sm mt-4" data-testid="join-done">
            You&apos;re in. When the first issue ships, it lands in your inbox — nothing else will.
          </p>
        ) : (
          <form onSubmit={onSubmit} className="mt-4 flex flex-col gap-3">
            <input
              type="email"
              name="email"
              required
              placeholder="your@email.com"
              aria-label="Email address"
              className="search-bar text-sm"
              autoComplete="email"
            />
            <input
              type="text"
              name="ambition"
              maxLength={200}
              placeholder="What are you chasing right now? (optional)"
              aria-label="What are you chasing right now"
              className="search-bar text-sm"
            />
            {/* Honeypot — humans never see or fill this. */}
            <input
              type="text"
              name="website"
              tabIndex={-1}
              autoComplete="off"
              aria-hidden="true"
              className="absolute opacity-0 pointer-events-none h-0 w-0"
            />
            <button
              type="submit"
              disabled={state === 'pending'}
              className="glass-card px-5 py-3 text-sm text-white font-medium cursor-pointer hover:border-violet-400/60 transition-all disabled:opacity-50 w-fit"
              data-testid="join-submit"
            >
              {state === 'pending' ? 'Saving…' : 'Count me in'}
            </button>
            {state === 'error' && (
              <p className="text-amber-300/90 text-xs" data-testid="join-error">
                {message}
              </p>
            )}
            <p className="text-white/35 text-xs">
              Stored for one purpose: sending you one tested idea a week. No trackers, nothing else.
            </p>
          </form>
        )}
      </div>
    </section>
  )
}
