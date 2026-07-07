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
              className={`category-tile anim-fade-up anim-delay-${Math.min(i, 4)}`}
              style={{ '--cat': meta.hue } as React.CSSProperties}
              data-testid="category-tile"
            >
              <span className="category-tile-icon" aria-hidden>
                {meta.icon}
              </span>
              <span className="category-tile-name">{category}</span>
              <span className="category-tile-count">{count} videos</span>
            </Link>
          </TiltCard>
        )
      })}
    </div>
  )
}
