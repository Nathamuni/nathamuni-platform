export function hueForCategory(category: string): number {
  let hash = 0
  for (let i = 0; i < category.length; i += 1) {
    hash = (hash * 31 + category.charCodeAt(i)) % 360
  }
  return Math.abs(hash)
}
