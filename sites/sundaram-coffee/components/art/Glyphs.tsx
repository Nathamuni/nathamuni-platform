/**
 * Small 24px stroke glyphs for the Why-Us section.
 * Consistent style: 1.8 stroke width, round caps, currentColor.
 */

interface GlyphProps {
  className?: string;
}

function GlyphSvg({ className, children }: GlyphProps & { children: React.ReactNode }) {
  return (
    <svg
      className={className}
      viewBox="0 0 24 24"
      width="28"
      height="28"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
      focusable="false"
    >
      {children}
    </svg>
  );
}

/** Single coffee bean — sourcing. */
export function BeanGlyph({ className }: GlyphProps) {
  return (
    <GlyphSvg className={className}>
      <ellipse cx="12" cy="12" rx="6.5" ry="9" transform="rotate(24 12 12)" />
      <path d="M9.5 5.5c3 3.5 3 9.5-1 13" />
    </GlyphSvg>
  );
}

/** Two overlapping cups — pure or blend. */
export function BlendGlyph({ className }: GlyphProps) {
  return (
    <GlyphSvg className={className}>
      <path d="M4 9h9l-1 8.2a2 2 0 0 1-2 1.8H7a2 2 0 0 1-2-1.8L4 9Z" />
      <path d="M13 11h3.5a2.5 2.5 0 0 1 0 5H12.6" />
      <path d="M6.5 5.5c-.8-1 .8-1.6 0-2.8M10.5 5.5c-.8-1 .8-1.6 0-2.8" />
    </GlyphSvg>
  );
}

/** Lidded jar — homemade, hygienic. */
export function JarGlyph({ className }: GlyphProps) {
  return (
    <GlyphSvg className={className}>
      <path d="M8 4h8" />
      <path d="M9 4v2.5c-2.1 1.4-3.4 3.5-3.4 6.1 0 4.3 2.9 7 6.4 7s6.4-2.7 6.4-7c0-2.6-1.3-4.7-3.4-6.1V4" />
      <path d="M6.5 13.5h11" />
    </GlyphSvg>
  );
}

/** Parcel with scale marks — retail to bulk. */
export function PackageGlyph({ className }: GlyphProps) {
  return (
    <GlyphSvg className={className}>
      <path d="M4 8.2 12 4l8 4.2v7.6L12 20l-8-4.2V8.2Z" />
      <path d="M4 8.2 12 12l8-3.8" />
      <path d="M12 12v8" />
    </GlyphSvg>
  );
}

/** Ordered set used by WhyUs — cycled when there are more points than glyphs. */
export const whyUsGlyphs = [BeanGlyph, BlendGlyph, JarGlyph, PackageGlyph];
