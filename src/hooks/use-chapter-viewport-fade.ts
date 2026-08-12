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
let raf = 0;

/**
 * Fixed full-viewport chapter backgrounds, faded by on-screen coverage.
 * Opacity only — never visibility:hidden (that made layers vanish on mobile).
 * Soft crossfade on all devices; no scroll-pause (pausing wiped canvases blank).
 */
function syncAllNow() {
  if (entries.length === 0) return;

  const vh = window.innerHeight || 1;

  for (const entry of entries) {
    const rect = entry.chapter.getBoundingClientRect();
    // Fully off-screen → hard zero (never leave Hero stars under Projects)
    if (rect.bottom <= 0 || rect.top >= vh) {
      if (entry.lastOpacity !== 0) {
        entry.lastOpacity = 0;
        entry.layer.style.opacity = '0';
      }
      continue;
    }

    const visible = Math.min(rect.bottom, vh) - Math.max(rect.top, 0);
    let opacity = Math.max(0, Math.min(1, visible / vh));
    if (opacity < 0.03) opacity = 0;
    else if (opacity > 0.97) opacity = 1;

    if (opacity === entry.lastOpacity) continue;
    entry.lastOpacity = opacity;
    entry.layer.style.opacity = String(opacity);
  }
}

/** One sync per frame — Lenis + native scroll must not double-fire layout thrash */
function syncAll() {
  if (raf) return;
  raf = requestAnimationFrame(() => {
    raf = 0;
    syncAllNow();
  });
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
  if (raf) {
    cancelAnimationFrame(raf);
    raf = 0;
  }
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
