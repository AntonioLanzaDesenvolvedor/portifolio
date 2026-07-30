/** Ignore mobile URL-bar height jitter that fires resize on almost every scroll. */
export const VIEWPORT_JITTER_PX = 64;

export function isSignificantSizeChange(
  prevW: number,
  prevH: number,
  nextW: number,
  nextH: number,
  threshold = VIEWPORT_JITTER_PX,
) {
  if (prevW === 0 && prevH === 0) return true;
  return Math.abs(nextW - prevW) >= 1 || Math.abs(nextH - prevH) >= threshold;
}
