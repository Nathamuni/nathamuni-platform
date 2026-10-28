import { ALT_THEME_IDS } from '@/lib/themes'

/**
 * An image with a recoloured twin per theme (`<base>-<theme>.<ext>`).
 *
 * All twins are in the markup, but only the one matching <html data-theme> is displayed
 * (see .themed-img in globals.css). The variants are loading="lazy", and browsers do not
 * fetch a lazy image that is display:none, so a visitor only ever downloads the art for
 * the theme they are on. CSS does the switch, so there is no JS and no flash on load.
 * The default image keeps the alt text and test id; the twins are decorative duplicates.
 */
export function ThemedImage({
  base,
  ext = 'jpg',
  alt,
  className,
  testId,
  loading,
  fetchPriority,
  ariaHidden,
}: {
  base: string
  ext?: string
  alt: string
  className?: string
  testId?: string
  loading?: 'eager' | 'lazy'
  fetchPriority?: 'high' | 'low' | 'auto'
  ariaHidden?: boolean
}) {
  return (
    <>
      {/* eslint-disable @next/next/no-img-element */}
      <img
        src={`${base}.${ext}`}
        alt={alt}
        aria-hidden={ariaHidden || undefined}
        className={`${className ?? ''} themed-img themed-img-default`}
        loading={loading}
        fetchPriority={fetchPriority}
        data-testid={testId}
      />
      {ALT_THEME_IDS.map((id) => (
        <img
          key={id}
          src={`${base}-${id}.${ext}`}
          alt=""
          aria-hidden="true"
          className={`${className ?? ''} themed-img themed-img-${id}`}
          loading="lazy"
          decoding="async"
        />
      ))}
      {/* eslint-enable @next/next/no-img-element */}
    </>
  )
}
