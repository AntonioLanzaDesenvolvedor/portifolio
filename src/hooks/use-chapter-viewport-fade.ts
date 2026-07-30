import { type RefObject, useEffect } from 'react';
import { getLenisInstance } from '@/lib/lenis-instance';
import { isTouchScrolling, subscribeTouchScroll } from '@/lib/touch-scroll';

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
let coarsePointer = false;

function refreshCoarse() {
  coarsePointer = window.matchMedia('(pointer: coarse)').matches;
}

/**
 * Fixed full-viewport chapter backgrounds, faded by on-screen coverage.
 * On touch devices: snap opacity to 0/1 (partial opacity over live canvases
 * flickers during finger scroll). Soft crossfade stays on desktop.
 */
function syncAll() {
  if (entries.length === 0) return;

  const vh = window.innerHeight || 1;
  const touching = isTouchScrolling();

  for (const entry of entries) {
    const rect = entry.chapter.getBoundingClientRect();
    const visible = Math.min(rect.bottom, vh) - Math.max(rect.top, 0);
    let opacity = Math.max(0, Math.min(1, visible / vh));

    if (coarsePointer || touching) {
      // Hard cut — no translucent dual-canvas layers while scrolling with touch
      opacity = opacity >= 0.5 ? 1 : 0;
    } else {
      if (opacity < 0.03) opacity = 0;
      else if (opacity > 0.97) opacity = 1;
    }

    if (opacity === entry.lastOpacity) continue;
    entry.lastOpacity = opacity;
    entry.layer.style.opacity = String(opacity);
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
  refreshCoarse();
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

    const unsubTouch = subscribeTouchScroll(() => {
      // Re-sync when finger lifts so the snap settles on the final section
      syncAll();
    });

    syncAll();

    return () => {
      const idx = entries.indexOf(entry);
      if (idx >= 0) entries.splice(idx, 1);
      ro.disconnect();
      unsubTouch();
      maybeStopListening();
      syncAll();
    };
  }, [chapterRef, layerRef]);
}
