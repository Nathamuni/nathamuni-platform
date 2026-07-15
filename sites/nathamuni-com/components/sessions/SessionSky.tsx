'use client'

import { useEffect, useState } from 'react'
import { arcPosition, skyPhase, weatherKind, type SkyPhase, type WeatherKind } from '@/lib/sky'

const PHASE_GRADIENTS: Record<SkyPhase, string> = {
  dawn: 'linear-gradient(to top, rgba(251,146,60,0.28), rgba(139,92,246,0.14), transparent)',
  day: 'linear-gradient(to top, rgba(56,189,248,0.22), rgba(34,211,238,0.08), transparent)',
  dusk: 'linear-gradient(to top, rgba(244,114,182,0.24), rgba(139,92,246,0.16), transparent)',
  night: 'linear-gradient(to top, rgba(30,41,59,0.55), rgba(15,23,42,0.25), transparent)',
}

const PHASE_LABEL: Record<SkyPhase, string> = {
  dawn: 'Early light. Good time to move.',
  day: 'Daylight hours. No excuses.',
  dusk: 'Winding down. A short session still counts.',
  night: 'Late. Rest is training too.',
}

interface SkyWeather {
  kind: WeatherKind
  tempC: number | null
}

/** Best-effort ambient weather; any failure just means a clear sky. */
async function fetchWeather(): Promise<SkyWeather | null> {
  try {
    const cached = sessionStorage.getItem('nm-sky')
    if (cached) {
      const parsed = JSON.parse(cached) as SkyWeather & { at: number }
      if (Date.now() - parsed.at < 30 * 60 * 1000) return parsed
    }
  } catch {
    /* sessionStorage unavailable — fetch fresh */
  }
  try {
    const res = await fetch('/api/sky')
    if (!res.ok) return null
    const data = (await res.json()) as { code?: number; tempC?: number }
    const result: SkyWeather = {
      kind: weatherKind(Number(data.code)),
      tempC: Number.isFinite(data.tempC) ? Math.round(data.tempC as number) : null,
    }
    try {
      sessionStorage.setItem('nm-sky', JSON.stringify({ ...result, at: Date.now() }))
    } catch {
      /* fine */
    }
    return result
  } catch {
    return null
  }
}

/**
 * Decorative living horizon for session pages: a half-circle arc with the
 * sun or moon placed by the visitor's real local clock, sky colors by day
 * phase, and (best-effort) their real weather — drifting clouds or rain.
 * Purely ambient: aria-hidden visuals, one small live-status line of text.
 */
export function SessionSky() {
  const [now, setNow] = useState<Date | null>(null)
  const [weather, setWeather] = useState<SkyWeather | null>(null)

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect -- SSR-safe hydration: the sky renders only client-side, after mount.
    setNow(new Date())
    const tick = setInterval(() => setNow(new Date()), 60_000)
    void fetchWeather().then((w) => setWeather(w))
    return () => clearInterval(tick)
  }, [])

  if (!now) return <div className="sky-wrap" aria-hidden="true" />

  const hour = now.getHours() + now.getMinutes() / 60
  const phase = skyPhase(hour)
  const { x, y, body } = arcPosition(hour)
  const kind = weather?.kind ?? 'clear'
  const showSun = kind !== 'rain'

  // Arc box: 100% wide, 120px tall; the body travels the half-circle.
  const bodyLeft = `${(x * 100).toFixed(1)}%`
  const bodyBottom = `${(y * 96).toFixed(1)}px`

  const statusBits = [PHASE_LABEL[phase]]
  if (kind === 'rain') statusBits.push(weather?.tempC != null ? `Raining, ${weather.tempC}°C — indoors works.` : 'Raining — indoors works.')
  else if (kind === 'cloudy' && weather?.tempC != null) statusBits.push(`Cloudy, ${weather.tempC}°C.`)
  else if (weather?.tempC != null) statusBits.push(`${weather.tempC}°C out.`)

  return (
    <div className="sky-wrap" data-testid="session-sky" data-phase={phase} data-weather={kind}>
      <div className="sky-scene" aria-hidden="true" style={{ background: PHASE_GRADIENTS[phase] }}>
        {phase === 'night' && (
          <div className="sky-stars">
            {[12, 28, 43, 61, 74, 88].map((left, i) => (
              <span key={left} className="sky-star" style={{ left: `${left}%`, top: `${(i * 37) % 55}%` }} />
            ))}
          </div>
        )}
        {showSun && (
          <span
            className={`sky-body sky-body-${body}`}
            style={{ left: bodyLeft, bottom: bodyBottom }}
          />
        )}
        {(kind === 'cloudy' || kind === 'rain') && (
          <>
            <span className="sky-cloud sky-cloud-a" />
            <span className="sky-cloud sky-cloud-b" />
          </>
        )}
        {kind === 'rain' && (
          <div className="sky-rain">
            {Array.from({ length: 14 }, (_, i) => (
              <span key={i} className="sky-drop" style={{ left: `${4 + i * 7}%`, animationDelay: `${(i % 5) * 0.35}s` }} />
            ))}
          </div>
        )}
        <span className="sky-horizon" />
      </div>
      <p className="sky-status">{statusBits.join(' ')}</p>

      <style>{`
        .sky-wrap { margin: 0; }
        .sky-scene {
          position: relative;
          height: 120px;
          border-radius: 16px;
          overflow: hidden;
          border: 1px solid rgba(255, 255, 255, 0.08);
        }
        .sky-horizon {
          position: absolute;
          left: 0; right: 0; bottom: 0;
          height: 1px;
          background: linear-gradient(to right, transparent, rgba(255,255,255,0.35), transparent);
        }
        .sky-body {
          position: absolute;
          width: 26px; height: 26px;
          border-radius: 50%;
          transform: translateX(-50%);
          transition: left 1s linear, bottom 1s linear;
        }
        .sky-body-sun {
          background: radial-gradient(circle, #fde68a 30%, #fb923c 75%, transparent 76%);
          box-shadow: 0 0 24px 6px rgba(251, 191, 36, 0.45);
        }
        .sky-body-moon {
          background: radial-gradient(circle at 35% 35%, #f1f5f9 30%, #94a3b8 90%);
          box-shadow: 0 0 18px 4px rgba(226, 232, 240, 0.25);
        }
        .sky-star {
          position: absolute;
          width: 2px; height: 2px;
          border-radius: 50%;
          background: rgba(255, 255, 255, 0.8);
          animation: sky-twinkle 3s ease-in-out infinite;
        }
        .sky-star:nth-child(2n) { animation-delay: 1.1s; }
        .sky-star:nth-child(3n) { animation-delay: 2.2s; }
        .sky-cloud {
          position: absolute;
          top: 18px;
          width: 88px; height: 24px;
          border-radius: 999px;
          background: rgba(226, 232, 240, 0.22);
          filter: blur(1px);
          animation: sky-drift 46s linear infinite;
        }
        .sky-cloud::before {
          content: '';
          position: absolute;
          top: -12px; left: 22px;
          width: 40px; height: 26px;
          border-radius: 999px;
          background: inherit;
        }
        .sky-cloud-b { top: 52px; transform: scale(0.7); animation-duration: 64s; animation-delay: -30s; }
        .sky-rain { position: absolute; inset: 0; }
        .sky-drop {
          position: absolute;
          top: -14px;
          width: 1.5px; height: 11px;
          border-radius: 999px;
          background: linear-gradient(to bottom, transparent, rgba(125, 211, 252, 0.7));
          animation: sky-fall 1.4s linear infinite;
        }
        .sky-status {
          margin: 0.5rem 0 0;
          font-size: 0.8rem;
          color: rgba(255, 255, 255, 0.5);
        }
        @keyframes sky-drift {
          from { transform: translateX(-120px); }
          to { transform: translateX(calc(100vw)); }
        }
        @keyframes sky-fall {
          to { transform: translateY(134px); }
        }
        @keyframes sky-twinkle {
          0%, 100% { opacity: 0.25; }
          50% { opacity: 1; }
        }
        @media (prefers-reduced-motion: reduce) {
          .sky-cloud, .sky-drop, .sky-star { animation: none; }
          .sky-body { transition: none; }
        }
      `}</style>
    </div>
  )
}
