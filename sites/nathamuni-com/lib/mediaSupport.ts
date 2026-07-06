// There is no MIME parameter for alpha-channel transparency, so this only
// checks VP9 decode support as a proxy — it cannot detect alpha support on
// its own. Browsers that decode VP9 but fail to render the alpha channel are
// caught at runtime by the <video> onError handler in KineticPortrait.
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
