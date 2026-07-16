/**
 * A stack of sun-dried appalam discs with gently wavy edges.
 * Stroke-based, themed via CSS custom properties.
 */
export default function AppalamStack({ className }: { className?: string }) {
  return (
    <svg
      className={className}
      viewBox="0 0 220 200"
      fill="none"
      stroke="var(--art-stroke, var(--brand-deep))"
      strokeWidth="5"
      strokeLinejoin="round"
      strokeLinecap="round"
      aria-hidden="true"
      focusable="false"
    >
      {/* bottom disc */}
      <path
        d="M30 150c0-6 10-11 20-13 16-3 44-4 60-4s44 1 60 4c10 2 20 7 20 13s-10 11-20 13c-16 3-44 4-60 4s-44-1-60-4c-10-2-20-7-20-13Z"
        fill="var(--art-fill, var(--brand-soft))"
      />
      {/* middle disc */}
      <path
        d="M42 122c0-6 9-10 18-12 14-3 36-4 50-4s36 1 50 4c9 2 18 6 18 12s-9 10-18 12c-14 3-36 4-50 4s-36-1-50-4c-9-2-18-6-18-12Z"
        fill="var(--art-fill-2, var(--surface-raised))"
      />
      {/* top disc, tilted */}
      <path
        d="M60 84c3-6 12-9 21-10 13-2 32-1 45 1 9 1 17 5 19 11 2 5-5 10-14 12-13 3-33 3-46 1-9-1-17-4-21-8-3-3-5-5-4-7Z"
        fill="var(--art-fill, var(--brand-soft))"
      />
      {/* texture dots on the top disc */}
      <g strokeWidth="4" opacity="0.55">
        <path d="M92 90h.1" />
        <path d="M112 86h.1" />
        <path d="M128 92h.1" />
        <path d="M104 96h.1" />
      </g>
      {/* a few pepper flecks falling */}
      <g strokeWidth="4" opacity="0.45">
        <path d="M52 56h.1" />
        <path d="M74 44h.1" />
        <path d="M158 52h.1" />
      </g>
    </svg>
  );
}
