'use client'

import { useEffect, useState } from 'react'
import { computeBmi, proteinRange } from '@/lib/health'
import { loadItem, saveItem } from '@/lib/progress'
import { CredibilityBadge } from './CredibilityBadge'

const STORAGE_KEY = 'metrics-health-profile'

interface Profile {
  weight: string
  height: string
  training: boolean
}

const EMPTY: Profile = { weight: '', height: '', training: true }

function loadProfile(): Profile {
  try {
    const raw = loadItem(STORAGE_KEY)
    if (!raw) return EMPTY
    const parsed = JSON.parse(raw) as Partial<Profile>
    return {
      weight: typeof parsed.weight === 'string' ? parsed.weight : '',
      height: typeof parsed.height === 'string' ? parsed.height : '',
      training: parsed.training !== false,
    }
  } catch {
    return EMPTY
  }
}

/**
 * Your-numbers card: BMI + daily protein target from weight/height. Inputs
 * persist under a `metrics-` key, so like every other tracker they live in
 * localStorage and follow signed-in visitors across devices. Screening
 * numbers only — the copy says so explicitly.
 */
export function HealthTools() {
  const [profile, setProfile] = useState<Profile>(EMPTY)

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect -- SSR-safe hydration: reads localStorage only after mount.
    setProfile(loadProfile())
    const rehydrate = () => setProfile(loadProfile())
    window.addEventListener('nm-progress-applied', rehydrate)
    return () => window.removeEventListener('nm-progress-applied', rehydrate)
  }, [])

  function update(next: Profile) {
    setProfile(next)
    saveItem(STORAGE_KEY, JSON.stringify(next))
  }

  const weightKg = Number(profile.weight)
  const heightCm = Number(profile.height)
  const bmi = profile.weight && profile.height ? computeBmi(weightKg, heightCm) : null
  const protein = profile.weight ? proteinRange(weightKg, profile.training) : null

  return (
    <section className="ht-card" data-testid="health-tools">
      <div className="ht-head">
        <h2 className="section-title">Your numbers</h2>
        <CredibilityBadge label="standard" />
      </div>
      <p className="ht-sub">
        Two numbers worth knowing before week one. Saved with your progress, never shared.
      </p>

      <div className="ht-inputs">
        <label className="ht-field">
          <span className="ht-label">Weight (kg)</span>
          <input
            type="number"
            inputMode="decimal"
            min={20}
            max={400}
            value={profile.weight}
            onChange={(e) => update({ ...profile, weight: e.target.value })}
            placeholder="70"
            className="ht-input"
          />
        </label>
        <label className="ht-field">
          <span className="ht-label">Height (cm)</span>
          <input
            type="number"
            inputMode="decimal"
            min={100}
            max={250}
            value={profile.height}
            onChange={(e) => update({ ...profile, height: e.target.value })}
            placeholder="175"
            className="ht-input"
          />
        </label>
        <label className="ht-toggle">
          <input
            type="checkbox"
            checked={profile.training}
            onChange={(e) => update({ ...profile, training: e.target.checked })}
          />
          <span>I train regularly</span>
        </label>
      </div>

      {(bmi || protein) && (
        <div className="ht-results">
          {bmi && (
            <div className="ht-result" data-testid="bmi-result">
              <span className="ht-result-value tabular-nums">{bmi.value}</span>
              <span className="ht-result-label">BMI · {bmi.category}</span>
            </div>
          )}
          {protein && (
            <div className="ht-result" data-testid="protein-result">
              <span className="ht-result-value tabular-nums">
                {protein.minG}–{protein.maxG}g
              </span>
              <span className="ht-result-label">protein/day · {protein.perKgLabel}</span>
            </div>
          )}
        </div>
      )}

      <p className="ht-note">
        BMI is a screening number, not a diagnosis — it can misread muscular or very tall/short
        builds. Anything surprising here goes to a professional, not a search bar.
      </p>

      <style>{`
        .ht-card {
          border: 1px solid rgba(255, 255, 255, 0.09);
          border-radius: 16px;
          padding: 1.25rem;
          background: rgba(255, 255, 255, 0.03);
          display: flex;
          flex-direction: column;
          gap: 0.9rem;
        }
        .ht-head { display: flex; align-items: center; gap: 0.75rem; flex-wrap: wrap; }
        .ht-head .section-title { margin: 0; }
        .ht-sub { margin: -0.35rem 0 0; font-size: 0.85rem; color: rgba(255,255,255,0.5); }
        .ht-inputs { display: flex; gap: 0.75rem; flex-wrap: wrap; align-items: flex-end; }
        .ht-field { display: flex; flex-direction: column; gap: 0.3rem; }
        .ht-label { font-size: 0.72rem; letter-spacing: 0.04em; text-transform: uppercase; color: rgba(255,255,255,0.45); }
        .ht-input {
          width: 6.5rem;
          padding: 0.5rem 0.65rem;
          border-radius: 10px;
          border: 1px solid rgba(255, 255, 255, 0.14);
          background: rgba(0, 0, 0, 0.25);
          color: #fff;
          font-size: 0.95rem;
        }
        .ht-input:focus { outline: none; border-color: rgba(139, 92, 246, 0.6); }
        .ht-toggle { display: flex; align-items: center; gap: 0.45rem; font-size: 0.85rem; color: rgba(255,255,255,0.7); padding-bottom: 0.55rem; cursor: pointer; }
        .ht-results { display: flex; gap: 1.5rem; flex-wrap: wrap; }
        .ht-result { display: flex; flex-direction: column; gap: 0.15rem; }
        .ht-result-value { font-size: 1.5rem; font-weight: 700; background: linear-gradient(90deg, #8b5cf6, #22d3ee); -webkit-background-clip: text; background-clip: text; color: transparent; }
        .ht-result-label { font-size: 0.78rem; color: rgba(255,255,255,0.5); }
        .ht-note { margin: 0; font-size: 0.75rem; line-height: 1.5; color: rgba(255,255,255,0.4); }
      `}</style>
    </section>
  )
}
