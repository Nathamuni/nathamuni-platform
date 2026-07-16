/**
 * Scoped styles for the Courses feature only. Deliberately kept out of
 * globals.css (owned by other work in this branch) — every rule here is
 * `crs-`-prefixed so it can't collide with anything else on the site.
 * Included once per page via <CoursesStyles /> in app/courses/page.tsx and
 * app/courses/[slug]/page.tsx.
 */
const CSS = `
/* Registered so the conic ring's fill can animate smoothly when ticking. */
@property --pct {
  syntax: '<number>';
  inherits: false;
  initial-value: 0;
}
.crs-header {
  max-width: 48rem;
}
.crs-header p {
  margin-top: 0.75rem;
}

.crs-index-grid {
  display: grid;
  grid-template-columns: 1fr;
  gap: 1.25rem;
  margin-top: 2rem;
}
@media (min-width: 640px) {
  .crs-index-grid {
    grid-template-columns: repeat(2, 1fr);
  }
}

.crs-course-card {
  display: flex;
  flex-direction: column;
  gap: 0.6rem;
  padding: 1.4rem;
  height: 100%;
  transition: border-color 0.25s ease, box-shadow 0.25s ease, transform 0.25s ease;
}
@media (prefers-reduced-motion: reduce) {
  .crs-course-card {
    transition: none;
  }
}
.crs-course-card:hover {
  border-color: hsla(var(--cat, 262), 85%, 70%, 0.6);
  box-shadow: 0 16px 44px -14px hsla(var(--cat, 262), 85%, 60%, 0.5);
  transform: translateY(-3px);
}
.crs-course-card-top {
  display: flex;
  align-items: center;
  gap: 0.5rem;
}
.crs-level-chip {
  font-size: 0.65rem;
  text-transform: uppercase;
  letter-spacing: 0.12em;
  font-weight: 600;
  color: hsla(var(--cat, 262), 85%, 72%, 1);
}
.crs-course-card-title {
  font-family: var(--font-display, inherit);
  font-size: 1.15rem;
  line-height: 1.3;
  letter-spacing: -0.01em;
}
.crs-course-card-tagline {
  font-size: 0.85rem;
  color: rgba(255, 255, 255, 0.7);
  line-height: 1.5;
}
.crs-course-card-forwhom {
  font-size: 0.78rem;
  color: rgba(255, 255, 255, 0.5);
  line-height: 1.5;
}
.crs-course-card-outcomes {
  display: flex;
  flex-direction: column;
  gap: 0.3rem;
  margin-top: 0.2rem;
  padding-left: 1rem;
  font-size: 0.78rem;
  color: rgba(255, 255, 255, 0.55);
}
.crs-course-card-outcomes li {
  list-style: disc;
}
.crs-course-card-cta {
  margin-top: auto;
  padding-top: 0.5rem;
  font-size: 0.8rem;
  color: rgba(255, 255, 255, 0.4);
  display: inline-flex;
  align-items: center;
  gap: 0.35rem;
  transition: color 0.2s ease, gap 0.2s ease;
}
@media (prefers-reduced-motion: reduce) {
  .crs-course-card-cta {
    transition: none;
  }
}
.crs-course-card:hover .crs-course-card-cta {
  color: #fff;
  gap: 0.55rem;
}

/* ---- Meta row (index cards + hero): "N modules · M actions · ~X min read" ---- */
.crs-meta-row {
  font-size: 0.72rem;
  letter-spacing: 0.02em;
  color: rgba(255, 255, 255, 0.42);
  white-space: normal;
}

/* ---- Hero (course detail page) ---- */
.crs-hero {
  display: flex;
  flex-direction: column;
  gap: 0.65rem;
  padding: 1.5rem;
  margin-top: 1.25rem;
}
@media (min-width: 640px) {
  .crs-hero {
    padding: 2rem;
  }
}
.crs-hero-top {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 0.6rem;
}
.crs-hero-forwhom {
  font-size: 0.92rem;
  color: rgba(255, 255, 255, 0.65);
  line-height: 1.55;
}
.crs-hero-forwhom em {
  font-style: italic;
}
.crs-hero-outcomes-chips {
  display: flex;
  flex-wrap: wrap;
  gap: 0.5rem;
  margin-top: 0.3rem;
}
.crs-outcome-chip {
  list-style: none;
  font-size: 0.78rem;
  line-height: 1.4;
  color: rgba(255, 255, 255, 0.75);
  padding: 0.4rem 0.75rem;
  border-radius: 999px;
  background: hsla(var(--cat, 262), 70%, 55%, 0.1);
  border: 1px solid hsla(var(--cat, 262), 85%, 70%, 0.25);
}
.crs-hero-outcomes-heading,
.crs-refs-heading,
.crs-actions-heading {
  font-size: 0.7rem;
  text-transform: uppercase;
  letter-spacing: 0.12em;
  color: rgba(255, 255, 255, 0.45);
  font-weight: 600;
  margin-bottom: 0.4rem;
}

/* ---- Disclaimer card ---- */
.crs-disclaimer {
  margin-top: 1.25rem;
  padding: 1rem 1.25rem;
  border-left: 3px solid rgba(245, 158, 11, 0.75);
}
.crs-disclaimer p {
  font-size: 0.85rem;
  color: rgba(255, 255, 255, 0.75);
  line-height: 1.6;
  margin: 0;
}

/* ---- Credibility badges ---- */
.crs-badge {
  display: inline-flex;
  align-items: center;
  width: fit-content;
  padding: 0.2rem 0.65rem;
  border-radius: 999px;
  font-size: 0.65rem;
  font-weight: 600;
  letter-spacing: 0.02em;
  white-space: nowrap;
}
.crs-badge-tested {
  color: #d8ccff;
  background: rgba(139, 92, 246, 0.18);
  border: 1px solid rgba(178, 148, 255, 0.4);
}
.crs-badge-research {
  color: #a5f3fc;
  background: rgba(34, 211, 238, 0.14);
  border: 1px solid rgba(34, 211, 238, 0.4);
}
.crs-badge-standard {
  color: #fde68a;
  background: rgba(245, 158, 11, 0.14);
  border: 1px solid rgba(245, 158, 11, 0.4);
}

/* Compact label dots shown in a module's collapsed summary row */
.crs-badge-dot {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 1.15rem;
  height: 1.15rem;
  border-radius: 999px;
  font-size: 0.6rem;
  font-weight: 700;
  flex-shrink: 0;
}
.crs-badge-dot-tested {
  color: #d8ccff;
  background: rgba(139, 92, 246, 0.22);
  border: 1px solid rgba(178, 148, 255, 0.45);
}
.crs-badge-dot-research {
  color: #a5f3fc;
  background: rgba(34, 211, 238, 0.18);
  border: 1px solid rgba(34, 211, 238, 0.45);
}
.crs-badge-dot-standard {
  color: #fde68a;
  background: rgba(245, 158, 11, 0.18);
  border: 1px solid rgba(245, 158, 11, 0.45);
}

/* ---- Module cards (native <details> accordion) ---- */
.crs-modules {
  display: flex;
  flex-direction: column;
  gap: 1.25rem;
  margin-top: 1.75rem;
}
.crs-module {
  padding: 0;
  overflow: hidden;
}
.crs-module-summary {
  display: flex;
  align-items: center;
  gap: 0.9rem;
  list-style: none;
  cursor: pointer;
  padding: 1.1rem 1.4rem;
  min-height: 44px;
  -webkit-tap-highlight-color: transparent;
}
.crs-module-summary::-webkit-details-marker {
  display: none;
}
.crs-module-summary::marker {
  content: '';
}
@media (min-width: 640px) {
  .crs-module-summary {
    padding: 1.3rem 1.75rem;
  }
}
.crs-module-num {
  flex-shrink: 0;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 2.25rem;
  height: 2.25rem;
  border-radius: 999px;
  font-size: 0.85rem;
  font-weight: 700;
  color: hsla(var(--cat, 262), 90%, 82%, 1);
  background: hsla(var(--cat, 262), 75%, 55%, 0.16);
  border: 1px solid hsla(var(--cat, 262), 85%, 70%, 0.35);
}
.crs-module-summary-text {
  display: flex;
  flex-direction: column;
  gap: 0.25rem;
  min-width: 0;
  flex: 1;
}
.crs-module-title {
  font-family: var(--font-display, inherit);
  font-size: 1.05rem;
  line-height: 1.35;
  color: #fff;
}
@media (min-width: 640px) {
  .crs-module-title {
    font-size: 1.2rem;
  }
}
.crs-module-summary-meta {
  display: flex;
  align-items: center;
  gap: 0.6rem;
  flex-wrap: wrap;
}
.crs-module-summary-chips {
  display: inline-flex;
  align-items: center;
  gap: 0.3rem;
}
.crs-module-summary-count {
  font-size: 0.72rem;
  color: rgba(255, 255, 255, 0.4);
}
.crs-module-chevron {
  flex-shrink: 0;
  width: 0.6rem;
  height: 0.6rem;
  border-right: 2px solid rgba(255, 255, 255, 0.5);
  border-bottom: 2px solid rgba(255, 255, 255, 0.5);
  transform: rotate(45deg);
  margin-right: 0.2rem;
  transition: transform 0.2s ease;
}
@media (prefers-reduced-motion: reduce) {
  .crs-module-chevron {
    transition: none;
  }
}
.crs-module[open] > .crs-module-summary .crs-module-chevron {
  transform: rotate(-135deg);
}

.crs-module-body {
  display: flex;
  flex-direction: column;
  gap: 1.1rem;
  padding: 0 1.4rem 1.4rem;
}
@media (min-width: 640px) {
  .crs-module-body {
    padding: 0 1.75rem 1.75rem;
  }
}

.crs-blocks {
  display: flex;
  flex-direction: column;
  gap: 1.1rem;
}
.crs-block {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
  padding-top: 0.9rem;
  border-top: 1px solid rgba(255, 255, 255, 0.06);
}
.crs-block:first-child {
  padding-top: 0;
  border-top: none;
}
.crs-block-lead {
  font-family: var(--font-display, inherit);
  font-size: 1rem;
  line-height: 1.45;
  color: #fff;
  font-weight: 600;
}
.crs-block-para {
  font-size: 0.9rem;
  line-height: 1.7;
  color: rgba(255, 255, 255, 0.7);
  max-width: 65ch;
}
.crs-block-bullets {
  display: flex;
  flex-direction: column;
  gap: 0.45rem;
  margin-top: 0.15rem;
  max-width: 65ch;
}
.crs-block-bullets li {
  position: relative;
  padding-left: 1.15rem;
  font-size: 0.88rem;
  line-height: 1.5;
  color: rgba(255, 255, 255, 0.75);
}
.crs-block-bullets li::before {
  content: '';
  position: absolute;
  left: 0;
  top: 0.55em;
  width: 6px;
  height: 6px;
  border-radius: 999px;
  background: hsla(var(--cat, 262), 85%, 65%, 0.9);
}

.crs-module-videos {
  margin-top: 0.25rem;
}

.crs-blog-links {
  display: flex;
  flex-direction: column;
  gap: 0.6rem;
}
.crs-blog-card {
  display: flex;
  flex-direction: column;
  gap: 0.15rem;
  padding: 0.85rem 1rem;
  border-radius: 0.9rem;
  border: 1px solid rgba(178, 148, 255, 0.18);
  background: rgba(148, 112, 255, 0.06);
  transition: border-color 0.2s ease, background 0.2s ease;
}
@media (prefers-reduced-motion: reduce) {
  .crs-blog-card {
    transition: none;
  }
}
.crs-blog-card:hover {
  border-color: rgba(178, 148, 255, 0.45);
  background: rgba(148, 112, 255, 0.12);
}
.crs-blog-card-label {
  font-size: 0.65rem;
  text-transform: uppercase;
  letter-spacing: 0.1em;
  color: rgba(255, 255, 255, 0.4);
}
.crs-blog-card-title {
  font-size: 0.92rem;
  color: rgba(255, 255, 255, 0.9);
}

/* ---- Action checklist: a titled panel, visually distinct from theory ---- */
.crs-actions-wrap {
  padding: 0.9rem 1rem 1rem;
  border-radius: 0.9rem;
  border-left: 3px solid hsla(var(--cat, 262), 85%, 65%, 0.85);
  background: hsla(var(--cat, 262), 70%, 55%, 0.09);
}
.crs-actions {
  display: flex;
  flex-direction: column;
  gap: 0.4rem;
  margin-top: 0.5rem;
}
.crs-action-item {
  width: 100%;
}
.crs-action-label {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  min-height: 44px;
  padding: 0.4rem 0.6rem;
  border-radius: 0.7rem;
  font-size: 0.85rem;
  line-height: 1.4;
  color: rgba(255, 255, 255, 0.75);
  cursor: pointer;
  transition: background 0.15s ease, color 0.15s ease;
}
@media (prefers-reduced-motion: reduce) {
  .crs-action-label {
    transition: none;
  }
}
.crs-action-label:hover {
  background: rgba(255, 255, 255, 0.06);
}
.crs-action-label[data-checked='true'] {
  color: rgba(255, 255, 255, 0.4);
  text-decoration: line-through;
}
.crs-action-checkbox {
  flex-shrink: 0;
  width: 20px;
  height: 20px;
  accent-color: #8b5cf6;
  cursor: pointer;
}
@media (prefers-reduced-motion: no-preference) {
  .crs-action-checkbox:checked {
    animation: crs-tick-pop 0.3s cubic-bezier(0.34, 1.56, 0.64, 1);
  }
}
@keyframes crs-tick-pop {
  0% { transform: scale(0.8); }
  60% { transform: scale(1.25); }
  100% { transform: scale(1); }
}

/* ---- Live checklist progress bar ---- */
.crs-actions-progress {
  height: 4px;
  border-radius: 999px;
  background: rgba(255, 255, 255, 0.1);
  overflow: hidden;
  margin-bottom: 0.6rem;
}
.crs-actions-progress-fill {
  display: block;
  height: 100%;
  border-radius: 999px;
  background: linear-gradient(90deg, hsla(var(--cat, 262), 85%, 65%, 1), #22d3ee);
  transition: width 0.5s cubic-bezier(0.16, 1, 0.3, 1);
}

/* ---- Course progress ring (detail hero) ---- */
.crs-ring-wrap {
  display: flex;
  align-items: center;
  gap: 0.8rem;
  margin-top: 0.2rem;
}
.crs-ring {
  --pct: 0;
  width: 58px;
  height: 58px;
  border-radius: 50%;
  flex-shrink: 0;
  display: grid;
  place-items: center;
  background:
    radial-gradient(closest-side, #17103a 82%, transparent 83%),
    conic-gradient(
      hsla(var(--cat, 262), 85%, 65%, 1) calc(var(--pct) * 1%),
      rgba(255, 255, 255, 0.1) 0
    );
  transition: --pct 0.6s ease-out;
}
.crs-ring-value {
  font-size: 0.8rem;
  font-weight: 700;
  color: hsla(var(--cat, 262), 90%, 80%, 1);
}
/* Peak-end: the finished ring turns gold. */
.crs-ring-done {
  background:
    radial-gradient(closest-side, #17103a 82%, transparent 83%),
    conic-gradient(#fbbf24, #f59e0b);
  box-shadow: 0 0 24px -4px rgba(251, 191, 36, 0.5);
}
.crs-ring-done .crs-ring-value {
  color: #fbbf24;
}
.crs-ring-label {
  font-size: 0.8rem;
  color: rgba(255, 255, 255, 0.6);
}

/* ---- Course card progress line ---- */
.crs-card-progress {
  display: flex;
  flex-direction: column;
  gap: 0.3rem;
}
.crs-card-progress-bar {
  display: block;
  height: 4px;
  border-radius: 999px;
  background: rgba(255, 255, 255, 0.1);
  overflow: hidden;
}
.crs-card-progress-fill {
  display: block;
  height: 100%;
  border-radius: 999px;
  background: linear-gradient(90deg, hsla(var(--cat, 262), 85%, 65%, 1), #22d3ee);
  transition: width 0.6s cubic-bezier(0.16, 1, 0.3, 1);
}
.crs-card-progress-pct {
  font-size: 0.7rem;
  font-weight: 600;
  color: hsla(var(--cat, 262), 90%, 78%, 1);
}

/* ---- References footer ---- */
.crs-refs {
  padding-top: 0.9rem;
  border-top: 1px solid rgba(255, 255, 255, 0.08);
  display: flex;
  flex-direction: column;
  gap: 0.4rem;
}
.crs-refs ul {
  display: flex;
  flex-direction: column;
  gap: 0.3rem;
}
.crs-refs a {
  font-size: 0.8rem;
  color: #a5b4fc;
  word-break: break-word;
}
.crs-refs a:hover {
  color: #ffffff;
}
`

export function CoursesStyles() {
  return <style>{CSS}</style>
}
