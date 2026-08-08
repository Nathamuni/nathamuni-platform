'use client'

export function CategoryFilter({
  categories,
  selected,
  onSelect,
}: {
  categories: string[]
  selected: string | null
  onSelect: (category: string | null) => void
}) {
  return (
    <div
      className="category-filter"
      role="group"
      aria-label="Filter by category"
      data-testid="category-filter"
    >
      {/* aria-pressed, not just a class: the active filter was conveyed by styling
          alone, so screen readers could not tell which one was applied. */}
      <button
        type="button"
        aria-pressed={selected === null}
        className={selected === null ? 'category-filter-btn is-active' : 'category-filter-btn'}
        onClick={() => onSelect(null)}
      >
        All
      </button>
      {categories.map((category) => (
        <button
          key={category}
          type="button"
          aria-pressed={selected === category}
          className={selected === category ? 'category-filter-btn is-active' : 'category-filter-btn'}
          onClick={() => onSelect(selected === category ? null : category)}
        >
          {category}
        </button>
      ))}
    </div>
  )
}
