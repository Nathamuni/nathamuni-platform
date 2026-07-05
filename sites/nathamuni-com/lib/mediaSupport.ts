export function supportsAlphaWebm(): boolean {
  if (typeof document === 'undefined') return false
  const testVideo = document.createElement('video')
  if (typeof testVideo.canPlayType !== 'function') return false
  const support = testVideo.canPlayType('video/webm; codecs="vp9"')
  return support === 'probably' || support === 'maybe'
}

export function prefersHoverInteraction(): boolean {
  if (typeof window === 'undefined' || typeof window.matchMedia !== 'function') return false
  return window.matchMedia('(hover: hover) and (pointer: fine)').matches
}
