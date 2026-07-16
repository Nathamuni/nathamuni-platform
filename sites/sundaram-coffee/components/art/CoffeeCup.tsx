/**
 * South-Indian davara–tumbler set with rising steam.
 * Stroke-based, themed via CSS custom properties; the steam paths are
 * animated in globals.css inside @media (prefers-reduced-motion: no-preference).
 */
export default function CoffeeCup({ className }: { className?: string }) {
  return (
    <svg
      className={className}
      viewBox="0 0 260 300"
      fill="none"
      role="img"
      aria-hidden="true"
      focusable="false"
    >
      {/* steam */}
      <g
        className="steam"
        stroke="var(--art-steam, var(--brand))"
        strokeWidth="4"
        strokeLinecap="round"
        opacity="0.55"
      >
        <path d="M104 96c-8-12 8-20 0-32-7-10 4-18 0-28" />
        <path d="M132 90c-9-13 9-22 0-35-7-11 5-19 0-30" />
        <path d="M160 96c-8-12 8-20 0-32-7-10 4-18 0-28" />
      </g>

      {/* tumbler */}
      <g stroke="var(--art-stroke, var(--brand-deep))" strokeWidth="5" strokeLinejoin="round">
        {/* lip ring */}
        <path
          d="M78 118h108c4 0 7 3 7 7v6c0 4-3 7-7 7H78c-4 0-7-3-7-7v-6c0-4 3-7 7-7Z"
          fill="var(--art-fill, var(--brand-soft))"
        />
        {/* body */}
        <path
          d="M82 138h100l-8 66c-.6 5-4.8 8-9.8 8H99.8c-5 0-9.2-3-9.8-8l-8-66Z"
          fill="var(--art-fill, var(--brand-soft))"
        />
        {/* coffee line inside the tumbler */}
        <path d="M92 158h80" strokeWidth="4" opacity="0.6" />
      </g>

      {/* davara (the wide saucer-bowl) */}
      <g stroke="var(--art-stroke, var(--brand-deep))" strokeWidth="5" strokeLinejoin="round">
        <path
          d="M64 234h136c0 4-2 8-6 10l-10 5c-3 1.6-6 2.4-9.5 2.4h-85c-3.5 0-6.5-.8-9.5-2.4l-10-5c-4-2-6-6-6-10Z"
          fill="var(--art-fill, var(--brand-soft))"
        />
        <path
          d="M74 224c0-6 5-10 10-10h96c5 0 10 4 10 10v10H74v-10Z"
          fill="var(--art-fill-2, var(--surface-raised))"
        />
        {/* coffee swirl in the davara */}
        <path d="M96 224c10-5 62-5 72 0" strokeWidth="4" opacity="0.6" />
      </g>

      {/* base line */}
      <path
        d="M46 268h168"
        stroke="var(--art-stroke, var(--brand-deep))"
        strokeWidth="4"
        strokeLinecap="round"
        opacity="0.35"
      />
    </svg>
  );
}
