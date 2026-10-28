'use client'

export function SearchBar({
  value,
  onChange,
}: {
  value: string
  onChange: (value: string) => void
}) {
  return (
    <input
      type="search"
      id="video-search"
      name="q"
      value={value}
      onChange={(event) => onChange(event.target.value)}
      placeholder="Search videos by title, topic, or tag..."
      aria-label="Search videos"
      className="search-bar"
      data-testid="search-bar"
    />
  )
}
