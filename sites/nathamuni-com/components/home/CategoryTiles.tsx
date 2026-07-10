import Link from 'next/link'
import { getCategoryCounts } from '@/lib/videos'
import { getCategoryMeta } from '@/lib/categoryMeta'
import { TiltCard } from '@/components/fx/TiltCard'

export function CategoryTiles() {
  const counts = getCategoryCounts()
  return (
    <div className="category-tiles" data-testid="category-tiles">
      {counts.map(({ category, count }, i) => {
        const meta = getCategoryMeta(category)
        return (
          <TiltCard key={category}>
            <Link
              href={`/videos?category=${encodeURIComponent(category)}`}
              className={`category-tile ${meta.image ? 'has-art' : ''} anim-fade-up anim-delay-${Math.min(i, 4)}`}
              style={{ '--cat': meta.hue } as React.CSSProperties}
              data-testid="category-tile"
            >
              {/* Media area only — the label plate below is fused to the
                  bottom edge so text never sits over the subject's face. */}
              <span className="category-tile-media">
                {meta.image ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={meta.image} alt="" loading="lazy" className="category-tile-art" />
                ) : (
                  <span className="category-tile-icon" aria-hidden>
                    {meta.icon}
                  </span>
                )}
              </span>
              <span className="category-tile-plate">
                <span className="category-tile-name">{category}</span>
                <span className="category-tile-count">{count} videos</span>
              </span>
            </Link>
          </TiltCard>
        )
      })}
    </div>
  )
}
