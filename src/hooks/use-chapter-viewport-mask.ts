import { type RefObject, useEffect } from 'react';
import { getLenisInstance } from '@/lib/lenis-instance';

type MaskEntry = {
  id: symbol;
  chapter: HTMLElement;
  mask: HTMLElement;
  stage: HTMLElement;
  lastTop: number;
  lastHeight: number;
};

const entries: MaskEntry[] = [];
let listening = false;
let lenisBound: { off: (e: 'scroll', cb: () => void) => void } | null = null;
let lenisRetry = 0;

function applyMask(entry: MaskEntry, top: number, height: number) {
  if (entry.lastTop === top && entry.lastHeight === height) return;
  entry.lastTop = top;
  entry.lastHeight = height;
  entry.mask.style.top = `${top}px`;
  entry.mask.style.height = `${height}px`;
  entry.stage.style.transform = `translate3d(0, ${-top}px, 0)`;
}

/**
 * Update every registered chapter mask in the same turn.
 * One shared seam between neighbors — no independent rounding gaps,
 * no rAF lag behind Lenis scroll (that slip reads as section-edge flicker).
 */
function syncAll() {
  if (entries.length === 0) return;

  const vh = window.innerHeight;
  const ordered = entries
    .map((entry) => ({ entry, rect: entry.chapter.getBoundingClientRect() }))
    .sort((a, b) => a.rect.top - b.rect.top || a.rect.bottom - b.rect.bottom);

  for (let i = 0; i < ordered.length; i++) {
    const { entry, rect } = ordered[i];
    let top = Math.max(0, rect.top);
    let bottom = Math.min(vh, rect.bottom);

    // Shared seam with the next chapter — identical cut, 2px overlap seal
    if (i < ordered.length - 1) {
      const nextTop = ordered[i + 1].rect.top;
      const seam = Math.round((rect.bottom + nextTop) / 2);
      bottom = Math.min(bottom, seam + 2);
    }
    if (i > 0) {
      const prevBottom = ordered[i - 1].rect.bottom;
      const seam = Math.round((prevBottom + rect.top) / 2);
      top = Math.max(top, seam - 2);
    }

    top = Math.max(0, Math.round(top));
    bottom = Math.min(vh, Math.round(bottom));
    const height = Math.max(0, bottom - top);
    applyMask(entry, top, height);
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

/**
 * Registers a fixed viewport stage masked to a chapter box.
 * All chapters share one sync pass so section divisions stay sealed.
 */
export function useChapterViewportMask(
  chapterRef: RefObject<HTMLElement | null>,
  maskRef: RefObject<HTMLElement | null>,
  stageRef: RefObject<HTMLElement | null>,
) {
  useEffect(() => {
    const chapter = chapterRef.current;
    const mask = maskRef.current;
    const stage = stageRef.current;
    if (!chapter || !mask || !stage) return;

    const entry: MaskEntry = {
      id: Symbol('chapter-mask'),
      chapter,
      mask,
      stage,
      lastTop: Number.NaN,
      lastHeight: Number.NaN,
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
  }, [chapterRef, maskRef, stageRef]);
}
