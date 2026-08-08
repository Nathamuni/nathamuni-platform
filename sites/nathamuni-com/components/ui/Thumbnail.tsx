/**
 * Renders a video thumbnail, preferring the build-generated WebP.
 *
 * lib/videos.json records thumbnails as `/images/thumbnails/<shortcode>.jpg`, and
 * that JPEG path is also used for openGraph/JSON-LD, so it stays authoritative.
 * scripts/optimize-thumbnails.mjs emits a matching `.webp` beside every `.jpg`,
 * and this picks it up without any data migration.
 *
 * Story posters under /stories/ get the same treatment — the optimiser writes
 * WebP siblings in place there. Any other path is passed through untouched, since
 * a .webp that was never generated would 404.
 */
const OPTIMISED_PREFIXES = ['/images/thumbnails/', '/stories/']

export function toWebp(src: string): string | null {
  if (!OPTIMISED_PREFIXES.some((p) => src.startsWith(p))) return null
  if (!/\.jpe?g$/i.test(src)) return null
  return src.replace(/\.jpe?g$/i, '.webp')
}

export function Thumbnail({
  src,
  alt,
  className,
  loading = 'lazy',
  fetchPriority,
  width,
  height,
}: {
  src: string
  alt: string
  className?: string
  loading?: 'lazy' | 'eager'
  fetchPriority?: 'high' | 'low' | 'auto'
  width?: number
  height?: number
}) {
  const webp = toWebp(src)
  return (
    <picture>
      {webp && <source srcSet={webp} type="image/webp" />}
      <img
        src={src}
        alt={alt}
        loading={loading}
        decoding="async"
        fetchPriority={fetchPriority}
        width={width}
        height={height}
        className={className}
      />
    </picture>
  )
}
