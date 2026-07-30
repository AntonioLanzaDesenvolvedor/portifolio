import { type RefObject, useEffect } from 'react';
import { getLenisInstance } from '@/lib/lenis-instance';

type FadeEntry = {
  id: symbol;
  chapter: HTMLElement;
  layer: HTMLElement;
  lastOpacity: number;
};

const entries: FadeEntry[] = [];
let listening = false;
let lenisBound: { off: (e: 'scroll', cb: () => void) => void } | null = null;
let lenisRetry = 0;

/**
 * Fixed full-viewport chapter backgrounds, faded by on-screen coverage.
 * No top/height/clip geometry — those slip against mobile scroll and make
 * section seams flicker. Soft crossfade at boundaries instead.
 */
function syncAll() {
  if (entries.length === 0) return;

  const vh = window.innerHeight || 1;

  for (const entry of entries) {
    const rect = entry.chapter.getBoundingClientRect();
    const visible = Math.min(rect.bottom, vh) - Math.max(rect.top, 0);
    let opacity = Math.max(0, Math.min(1, visible / vh));
    if (opacity < 0.03) opacity = 0;
    else if (opacity > 0.97) opacity = 1;

    if (opacity === entry.lastOpacity) continue;
    entry.lastOpacity = opacity;
    entry.layer.style.opacity = String(opacity);
    // Fully off: drop from compositor so sibling canvases don't fight
    entry.layer.style.visibility = opacity === 0 ? 'hidden' : 'visible';
  }
}

function bindLenis() {
  const lenis = getLenisInstance();
  if (!lenis || lenisBound) return;
  lenis.on('scroll', syncAll);
  lenisBound = lenis;
}

function ensureListening() {
  if (listening) return;
  listening = true;
  window.addEventListener('scroll', syncAll, { passive: true });
  window.addEventListener('resize', syncAll);
  bindLenis();
  lenisRetry = window.setInterval(() => {
    bindLenis();
    if (lenisBound) window.clearInterval(lenisRetry);
  }, 50);
  window.setTimeout(() => window.clearInterval(lenisRetry), 2000);
}

function maybeStopListening() {
  if (entries.length > 0) return;
  listening = false;
  window.clearInterval(lenisRetry);
  window.removeEventListener('scroll', syncAll);
  window.removeEventListener('resize', syncAll);
  lenisBound?.off('scroll', syncAll);
  lenisBound = null;
}

export function useChapterViewportFade(
  chapterRef: RefObject<HTMLElement | null>,
  layerRef: RefObject<HTMLElement | null>,
) {
  useEffect(() => {
    const chapter = chapterRef.current;
    const layer = layerRef.current;
    if (!chapter || !layer) return;

    const entry: FadeEntry = {
      id: Symbol('chapter-fade'),
      chapter,
      layer,
      lastOpacity: Number.NaN,
    };
    entries.push(entry);
    ensureListening();

    const ro = new ResizeObserver(syncAll);
    ro.observe(chapter);
    syncAll();

    return () => {
      const idx = entries.indexOf(entry);
      if (idx >= 0) entries.splice(idx, 1);
      ro.disconnect();
      maybeStopListening();
      syncAll();
    };
  }, [chapterRef, layerRef]);
}
