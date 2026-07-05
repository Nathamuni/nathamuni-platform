import { hueForCategory } from '@/lib/placeholderHue'

export function PlaceholderArt({ category }: { category: string }) {
  const hue = hueForCategory(category)
  return (
    <div
      data-testid="placeholder-art"
      className="placeholder-art"
      style={{
        background: `linear-gradient(135deg, hsl(${hue}, 70%, 25%), hsl(${(hue + 40) % 360}, 70%, 15%))`,
      }}
    />
  )
}
