import { type RefObject, useEffect } from 'react';
import { getLenisInstance } from '@/lib/lenis-instance';

/**
 * Masks a fixed full-viewport background to a chapter's on-screen box.
 * Uses overflow + translate (not clip-path) so mobile GPUs don't flash at
 * section seams. Expands the mask by 1px so adjacent chapters overlap.
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

    let raf = 0;
    let lastTop = Number.NaN;
    let lastHeight = Number.NaN;
    let lenisBound: { off: (e: 'scroll', cb: () => void) => void } | null = null;

    const sync = () => {
      raf = 0;
      const rect = chapter.getBoundingClientRect();
      const vh = window.innerHeight;

      // Floor/ceil + 1px seal → no 1px gaps between chapters while scrolling
      let top = Math.max(0, Math.floor(rect.top));
      let bottom = Math.min(vh, Math.ceil(rect.bottom));
      if (top > 0) top = Math.max(0, top - 1);
      if (bottom < vh) bottom = Math.min(vh, bottom + 1);
      const height = Math.max(0, bottom - top);

      if (top === lastTop && height === lastHeight) return;
      lastTop = top;
      lastHeight = height;

      mask.style.top = `${top}px`;
      mask.style.height = `${height}px`;
      stage.style.transform = `translate3d(0, ${-top}px, 0)`;
    };

    const schedule = () => {
      if (raf) return;
      raf = requestAnimationFrame(sync);
    };

    const bindLenis = () => {
      const lenis = getLenisInstance();
      if (!lenis || lenisBound) return;
      lenis.on('scroll', schedule);
      lenisBound = lenis;
    };

    sync();
    window.addEventListener('scroll', schedule, { passive: true });
    window.addEventListener('resize', schedule);
    const ro = new ResizeObserver(schedule);
    ro.observe(chapter);

    // Lenis mounts after children — retry a few frames
    bindLenis();
    const lenisRetry = window.setInterval(() => {
      bindLenis();
      if (lenisBound) window.clearInterval(lenisRetry);
    }, 50);
    window.setTimeout(() => window.clearInterval(lenisRetry), 2000);

    return () => {
      if (raf) cancelAnimationFrame(raf);
      window.clearInterval(lenisRetry);
      window.removeEventListener('scroll', schedule);
      window.removeEventListener('resize', schedule);
      ro.disconnect();
      lenisBound?.off('scroll', schedule);
    };
  }, [chapterRef, maskRef, stageRef]);
}
