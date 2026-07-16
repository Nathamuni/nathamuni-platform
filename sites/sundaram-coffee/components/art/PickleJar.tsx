/**
 * Traditional pickle jar (bharani-style) with a cloth-tied lid.
 * Stroke-based, themed via CSS custom properties.
 */
export default function PickleJar({ className }: { className?: string }) {
  return (
    <svg
      className={className}
      viewBox="0 0 200 220"
      fill="none"
      stroke="var(--art-stroke, var(--brand-deep))"
      strokeWidth="5"
      strokeLinejoin="round"
      strokeLinecap="round"
      aria-hidden="true"
      focusable="false"
    >
      {/* cloth cover, tied over the mouth */}
      <path
        d="M64 52c8-12 64-12 72 0l-6 14H70l-6-14Z"
        fill="var(--art-fill-2, var(--surface-raised))"
      />
      <path d="M62 62c-8 4-12 12-8 18" strokeWidth="4" />
      <path d="M138 62c8 4 12 12 8 18" strokeWidth="4" />
      {/* tie string */}
      <path d="M66 66h68" strokeWidth="4" opacity="0.7" />

      {/* jar body */}
      <path
        d="M70 66c-22 14-34 36-34 62 0 40 28 64 64 64s64-24 64-64c0-26-12-48-34-62"
        fill="var(--art-fill, var(--brand-soft))"
      />

      {/* belly band + speckle of spice */}
      <path d="M44 118c16 8 96 8 112 0" strokeWidth="4" opacity="0.55" />
      <g strokeWidth="4" opacity="0.6">
        <path d="M78 150h.1" />
        <path d="M100 162h.1" />
        <path d="M124 148h.1" />
        <path d="M90 172h.1" />
        <path d="M114 174h.1" />
      </g>
    </svg>
  );
}
