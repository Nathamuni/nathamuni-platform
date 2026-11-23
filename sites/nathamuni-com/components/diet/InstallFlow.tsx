'use client'

import { useEffect, useRef, useState } from 'react'
import type { InstallGuide } from '@/lib/diet'
import { CopyButton } from './CopyButton'
import { Inline } from './Inline'
import { StepGlyph } from './StepGlyph'

/**
 * Pick your AI app, then follow the flow: a left-to-right map of the steps (a light
 * travels along it), and the same steps below in full with screenshots. Arriving at
 * /diet#claude or #other opens that app's tab.
 */
export function InstallFlow({ guides }: { guides: InstallGuide[] }) {
  const [active, setActive] = useState(guides[0].id)
  const tabs = useRef<(HTMLButtonElement | null)[]>([])

  useEffect(() => {
    const fromHash = () => {
      const id = window.location.hash.slice(1)
      if (guides.some((g) => g.id === id)) setActive(id as InstallGuide['id'])
    }
    fromHash()
    window.addEventListener('hashchange', fromHash)
    return () => window.removeEventListener('hashchange', fromHash)
  }, [guides])

  function onKey(e: React.KeyboardEvent, index: number) {
    const step = e.key === 'ArrowRight' ? 1 : e.key === 'ArrowLeft' ? -1 : 0
    if (!step) return
    e.preventDefault()
    const next = (index + step + guides.length) % guides.length
    setActive(guides[next].id)
    tabs.current[next]?.focus()
  }

  return (
    <div className="diet-flow">
      <div className="diet-tabs" role="tablist" aria-label="Your AI app">
        {guides.map((g, i) => (
          <button
            key={g.id}
            ref={(el) => {
              tabs.current[i] = el
            }}
            type="button"
            role="tab"
            id={`tab-${g.id}`}
            aria-selected={active === g.id}
            aria-controls={`panel-${g.id}`}
            tabIndex={active === g.id ? 0 : -1}
            className="diet-tab"
            onClick={() => setActive(g.id)}
            onKeyDown={(e) => onKey(e, i)}
          >
            {g.label}
          </button>
        ))}
      </div>

      {guides.map((guide) => (
        <section
          key={guide.id}
          id={`panel-${guide.id}`}
          role="tabpanel"
          aria-labelledby={`tab-${guide.id}`}
          hidden={active !== guide.id}
          className="diet-panel"
          data-testid={`diet-guide-${guide.id}`}
        >
          <span id={guide.id} className="diet-anchor" aria-hidden />
          <p className="diet-panel-intro">{guide.intro}</p>

          <ol
            className="diet-map"
            aria-hidden
            style={{ '--n': guide.steps.length } as React.CSSProperties}
          >
            {guide.steps.map((step, i) => (
              <li key={step.label} style={{ '--i': i } as React.CSSProperties}>
                <span className="diet-map-node">
                  <StepGlyph icon={step.icon} />
                </span>
                <span className="diet-map-label">{step.label}</span>
              </li>
            ))}
          </ol>

          <ol className="diet-steps">
            {guide.steps.map((step, i) => (
              <li key={step.text} className="diet-step">
                <span className="diet-step-node" aria-hidden>
                  {i + 1}
                </span>
                <div className="diet-step-body">
                  <h3 className="diet-step-label">
                    <StepGlyph icon={step.icon} className="diet-step-icon" />
                    {step.label}
                  </h3>
                  <p>
                    <Inline text={step.text} />
                  </p>
                  {step.copy && (
                    <span className="diet-copyline">
                      <code>{step.copy}</code>
                      <CopyButton text={step.copy} />
                    </span>
                  )}
                  {step.shot && (
                    /* eslint-disable-next-line @next/next/no-img-element */
                    <img
                      src={step.shot.src}
                      alt={step.shot.alt}
                      width={step.shot.width}
                      height={step.shot.height}
                      loading="lazy"
                      className="diet-shot"
                    />
                  )}
                </div>
              </li>
            ))}
          </ol>
        </section>
      ))}
    </div>
  )
}
