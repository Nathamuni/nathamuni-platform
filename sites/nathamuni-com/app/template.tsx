/**
 * App Router template: unlike layout.tsx, a template remounts on every
 * navigation, so wrapping children in the existing `.anim-fade-up` entrance
 * animation makes it replay on each route change — a one-shot fade + rise
 * with zero new CSS (the class already has a prefers-reduced-motion
 * override in globals.css that disables it entirely).
 */
export default function Template({ children }: { children: React.ReactNode }) {
  return <div className="anim-fade-up">{children}</div>
}
