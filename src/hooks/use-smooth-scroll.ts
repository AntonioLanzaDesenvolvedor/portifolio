import { useEffect, useRef } from 'react';
import Lenis from 'lenis';
import { ScrollTrigger } from '@/lib/gsap';
import { setLenisInstance } from '@/lib/lenis-instance';

function heroIntroAllowsScroll() {
  const root = document.documentElement;
  return (
    root.dataset.heroIntro === 'done' ||
    root.dataset.entranceReduced === 'true' ||
    window.matchMedia('(prefers-reduced-motion: reduce)').matches
  );
}

/** Smooth scroll (Lenis) wired to ScrollTrigger. No-op under reduced motion. */
export function useSmoothScroll(enabled = true) {
  const lenisRef = useRef<Lenis | null>(null);

  useEffect(() => {
    if (!enabled) return;
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;

    const lenis = new Lenis({
      duration: 0.85,
      easing: (t) => Math.min(1, 1.001 - Math.pow(2, -10 * t)),
      smoothWheel: true,
      touchMultiplier: 1.3,
    });
    lenisRef.current = lenis;
    setLenisInstance(lenis);

    const blockIntroScroll = (event: WheelEvent | TouchEvent) => {
      if (heroIntroAllowsScroll()) return;
      event.preventDefault();
    };

    if (!heroIntroAllowsScroll()) {
      lenis.stop();
      window.scrollTo(0, 0);
      window.addEventListener('wheel', blockIntroScroll, { passive: false });
      window.addEventListener('touchmove', blockIntroScroll, { passive: false });
    }

    const syncIntroLock = () => {
      if (heroIntroAllowsScroll()) {
        lenis.start();
        window.removeEventListener('wheel', blockIntroScroll);
        window.removeEventListener('touchmove', blockIntroScroll);
      } else {
        lenis.stop();
        window.scrollTo(0, 0);
        window.addEventListener('wheel', blockIntroScroll, { passive: false });
        window.addEventListener('touchmove', blockIntroScroll, { passive: false });
      }
    };
    const mo = new MutationObserver(syncIntroLock);
    mo.observe(document.documentElement, {
      attributes: true,
      attributeFilter: ['data-hero-intro', 'data-entrance-reduced'],
    });

    lenis.on('scroll', ScrollTrigger.update);

    // Dedicated rAF so Lenis isn't stuck behind heavy canvas paints on the GSAP ticker
    let rafId = 0;
    const raf = (time: number) => {
      lenis.raf(time);
      rafId = requestAnimationFrame(raf);
    };
    rafId = requestAnimationFrame(raf);

    return () => {
      mo.disconnect();
      window.removeEventListener('wheel', blockIntroScroll);
      window.removeEventListener('touchmove', blockIntroScroll);
      cancelAnimationFrame(rafId);
      lenis.destroy();
      lenisRef.current = null;
      setLenisInstance(null);
    };
  }, [enabled]);

  return lenisRef;
}
