/**
 * Scoped styles for the Courses feature only. Deliberately kept out of
 * globals.css (owned by other work in this branch) — every rule here is
 * `crs-`-prefixed so it can't collide with anything else on the site.
 * Included once per page via <CoursesStyles /> in app/courses/page.tsx and
 * app/courses/[slug]/page.tsx.
 */
const CSS = `
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
.crs-course-card:hover {
  border-color: hsla(var(--cat, 262), 85%, 70%, 0.6);
  box-shadow: 0 16px 44px -14px hsla(var(--cat, 262), 85%, 60%, 0.5);
  transform: translateY(-3px);
}
.crs-course-card-top {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 0.5rem;
}
.crs-level-chip {
  font-size: 0.65rem;
  text-transform: uppercase;
  letter-spacing: 0.12em;
  font-weight: 600;
  color: hsla(var(--cat, 262), 85%, 72%, 1);
}
.crs-module-count {
  font-size: 0.65rem;
  color: rgba(255, 255, 255, 0.35);
  flex-shrink: 0;
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
.crs-course-card:hover .crs-course-card-cta {
  color: #fff;
  gap: 0.55rem;
}

/* ---- Hero (course detail page) ---- */
.crs-hero {
  display: flex;
  flex-direction: column;
  gap: 1rem;
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
  font-size: 0.95rem;
  color: rgba(255, 255, 255, 0.7);
  line-height: 1.6;
}
.crs-hero-outcomes {
  display: flex;
  flex-direction: column;
  gap: 0.4rem;
  padding-left: 1.1rem;
  font-size: 0.88rem;
  color: rgba(255, 255, 255, 0.65);
}
.crs-hero-outcomes li {
  list-style: disc;
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

/* ---- Module sections ---- */
.crs-modules {
  display: flex;
  flex-direction: column;
  gap: 1.5rem;
  margin-top: 1.75rem;
}
.crs-module {
  padding: 1.4rem;
  display: flex;
  flex-direction: column;
  gap: 1.1rem;
}
@media (min-width: 640px) {
  .crs-module {
    padding: 1.75rem;
  }
}
.crs-module-title {
  display: flex;
  align-items: baseline;
  gap: 0.75rem;
  font-family: var(--font-display, inherit);
  font-size: 1.2rem;
  line-height: 1.35;
}
@media (min-width: 640px) {
  .crs-module-title {
    font-size: 1.35rem;
  }
}
.crs-module-num {
  flex-shrink: 0;
  font-size: 0.85rem;
  font-weight: 700;
  color: rgba(255, 255, 255, 0.3);
}
.crs-blocks {
  display: flex;
  flex-direction: column;
  gap: 0.9rem;
}
.crs-block {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
}
.crs-block p {
  font-size: 0.9rem;
  line-height: 1.65;
  color: rgba(255, 255, 255, 0.82);
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

/* ---- Action checklist ---- */
.crs-actions-wrap {
  padding-top: 0.25rem;
  border-top: 1px solid rgba(255, 255, 255, 0.08);
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
.crs-action-label:hover {
  background: rgba(255, 255, 255, 0.05);
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
