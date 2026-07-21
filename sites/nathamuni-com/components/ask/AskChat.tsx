'use client'

import { useState } from 'react'
import { PROFILE } from '@/lib/profile'
import { SOCIAL_LINKS } from '@/lib/social'

const STARTERS = [
  'How do I stay consistent?',
  'Why local-first AI?',
  'How did you start calisthenics?',
  'What is your book about?',
]

/** Must match ASK_MAX_QUESTION_LEN in worker/index.mjs. */
const MAX_QUESTION_LEN = 300

interface Message {
  id: string
  role: 'user' | 'twin'
  content: string
}

interface AskError {
  kind: 'rate-limit' | 'generic'
  message: string
}

let uid = 0
function nextId(): string {
  uid += 1
  return `ask-${uid}`
}

export function AskChat() {
  const [messages, setMessages] = useState<Message[]>([])
  const [input, setInput] = useState('')
  const [pending, setPending] = useState(false)
  const [error, setError] = useState<AskError | null>(null)

  async function ask(question: string) {
    const trimmed = question.trim()
    if (!trimmed || pending) return

    setMessages((prev) => [...prev, { id: nextId(), role: 'user', content: trimmed }])
    setInput('')
    setError(null)
    setPending(true)

    try {
      const res = await fetch('/api/ask', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ question: trimmed }),
      })
      const data = await res.json().catch(() => ({}) as { answer?: string; error?: string })

      if (res.status === 429) {
        setError({
          kind: 'rate-limit',
          message: data.error ?? 'Too many questions for now — try again later.',
        })
        return
      }
      if (!res.ok || !data.answer) {
        setError({ kind: 'generic', message: data.error ?? 'Something went wrong. Try again.' })
        return
      }
      setMessages((prev) => [...prev, { id: nextId(), role: 'twin', content: data.answer as string }])
    } catch {
      setError({
        kind: 'generic',
        message: "Couldn't reach the twin — check your connection and try again.",
      })
    } finally {
      setPending(false)
    }
  }

  function handleSubmit(event: React.FormEvent) {
    event.preventDefault()
    void ask(input)
  }

  return (
    <div className="flex flex-col gap-5 max-w-2xl mx-auto pb-24 sm:pb-0">
      {messages.length === 0 && (
        <div className="glass-card p-6 sm:p-8 flex flex-col gap-4" data-testid="ask-intro">
          <p className="text-white/85 leading-relaxed">
            Ask me anything — an AI twin trained on what I&apos;ve published. It only knows what
            I&apos;ve shared.
          </p>
          <div className="flex flex-wrap gap-2" data-testid="ask-starters">
            {STARTERS.map((starter) => (
              <button
                key={starter}
                type="button"
                className="category-filter-btn"
                onClick={() => void ask(starter)}
              >
                {starter}
              </button>
            ))}
          </div>
        </div>
      )}

      {messages.length > 0 && (
        <div className="flex flex-col gap-3" role="log" aria-live="polite" data-testid="ask-messages">
          {messages.map((message) =>
            message.role === 'user' ? (
              <div key={message.id} className="flex justify-end">
                <div
                  className="glass-card px-4 py-2.5 max-w-[85%] sm:max-w-[70%]"
                  style={{
                    background:
                      'linear-gradient(120deg, rgba(139, 92, 246, 0.28), rgba(236, 72, 153, 0.18))',
                  }}
                >
                  <p className="text-sm sm:text-base text-white/90 whitespace-pre-wrap leading-relaxed">
                    {message.content}
                  </p>
                </div>
              </div>
            ) : (
              <div key={message.id} className="flex justify-start gap-2 items-start">
                <span aria-hidden className="text-lg leading-none mt-2.5 flex-shrink-0">
                  {PROFILE.mark}
                </span>
                <div className="glass-card px-4 py-2.5 max-w-[85%] sm:max-w-[70%]">
                  <p className="text-sm sm:text-base text-white/85 whitespace-pre-wrap leading-relaxed">
                    {message.content}
                  </p>
                </div>
              </div>
            )
          )}
          {pending && (
            <div className="flex justify-start gap-2 items-start" data-testid="ask-typing">
              <span aria-hidden className="text-lg leading-none mt-2.5 flex-shrink-0">
                {PROFILE.mark}
              </span>
              <div className="glass-card px-4 py-2.5 text-white/50 text-sm">thinking…</div>
            </div>
          )}
        </div>
      )}

      {error && (
        <div
          className="glass-card px-4 py-3 text-sm"
          style={{ color: error.kind === 'rate-limit' ? '#fcd9a8' : '#fca5b0' }}
          role="alert"
          data-testid="ask-error"
        >
          {error.message}
        </div>
      )}

      {input.length > MAX_QUESTION_LEN - 60 && (
        <p className="text-xs text-white/45 text-right -mb-3" data-testid="ask-counter">
          {input.length}/{MAX_QUESTION_LEN} characters
        </p>
      )}

      <form onSubmit={handleSubmit} className="flex gap-2 items-center">
        <input
          type="text"
          value={input}
          onChange={(event) => setInput(event.target.value)}
          placeholder="Ask about discipline, AI, calisthenics..."
          className="search-bar flex-1"
          maxLength={MAX_QUESTION_LEN}
          disabled={pending}
          aria-label="Ask a question"
          data-testid="ask-input"
        />
        <button
          type="submit"
          className="category-filter-btn is-active flex-shrink-0"
          disabled={pending || !input.trim()}
          aria-label="Send question"
          data-testid="ask-send"
        >
          {pending ? '…' : 'Send'}
        </button>
      </form>

      <p className="text-xs text-white/35 text-center">
        Answers come from published content only — for anything else,{' '}
        <a
          href={SOCIAL_LINKS.instagram}
          target="_blank"
          rel="noreferrer"
          className="underline hover:text-white/60 transition-colors"
        >
          DM the real one
        </a>
        .
      </p>
    </div>
  )
}
