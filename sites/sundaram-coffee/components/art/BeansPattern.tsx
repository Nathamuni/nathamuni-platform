/**
 * Hand-scattered coffee beans — decorative texture used behind sections.
 * Stroke-based, follows the theme via CSS variables.
 */

function Bean({
  x,
  y,
  r = 0,
  s = 1,
  o = 1,
}: {
  x: number;
  y: number;
  r?: number;
  s?: number;
  o?: number;
}) {
  return (
    <g transform={`translate(${x} ${y}) rotate(${r}) scale(${s})`} opacity={o}>
      <ellipse cx="0" cy="0" rx="11" ry="15" />
      <path d="M0 -13c4 5 4 21 0 26" />
    </g>
  );
}

export default function BeansPattern({ className }: { className?: string }) {
  return (
    <svg
      className={className}
      viewBox="0 0 420 180"
      fill="none"
      stroke="var(--art-stroke, var(--brand))"
      strokeWidth="3"
      strokeLinecap="round"
      aria-hidden="true"
      focusable="false"
    >
      <Bean x={40} y={60} r={-24} o={0.5} />
      <Bean x={110} y={130} r={18} s={0.8} o={0.35} />
      <Bean x={185} y={50} r={52} s={0.9} o={0.45} />
      <Bean x={255} y={125} r={-40} s={0.7} o={0.3} />
      <Bean x={330} y={55} r={10} s={0.85} o={0.4} />
      <Bean x={390} y={130} r={-15} s={0.6} o={0.3} />
    </svg>
  );
}
