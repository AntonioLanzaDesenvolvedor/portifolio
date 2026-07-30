import { type ReactNode, useEffect, useRef, useState } from 'react';
import { HeroScene } from '@/components/hero/HeroScene';
import { AboutGalaxy } from '@/components/about/AboutGalaxy';

type SpaceChapterProps = {
  children: ReactNode;
  reduced?: boolean;
};

function isMobileViewport() {
  return typeof window !== 'undefined'
    && window.matchMedia('(max-width: 768px), (pointer: coarse)').matches;
}

/**
 * Same fixed Hero starfield through About.
 * clip-path tracks the chapter box so the bg ends with Sobre and
 * never paints over Skills (sticky breaks under overflow-x-clip).
 *
 * Mobile: single canvas only — stacking HeroScene + AboutGalaxy causes
 * compositing flicker on phone GPUs.
 */
export function SpaceChapter({ children, reduced = false }: SpaceChapterProps) {
  const chapterRef = useRef<HTMLDivElement>(null);
  const bgRef = useRef<HTMLDivElement>(null);
  const [mobile, setMobile] = useState(() => isMobileViewport());

  useEffect(() => {
    const mq = window.matchMedia('(max-width: 768px), (pointer: coarse)');
    const sync = () => setMobile(mq.matches);
    sync();
    mq.addEventListener('change', sync);
    return () => mq.removeEventListener('change', sync);
  }, []);

  useEffect(() => {
    const chapter = chapterRef.current;
    const bg = bgRef.current;
    if (!chapter || !bg) return;

    let raf = 0;

    const sync = () => {
      raf = 0;
      const rect = chapter.getBoundingClientRect();
      const vh = window.innerHeight;
      const top = Math.max(0, rect.top);
      const bottom = Math.max(0, vh - rect.bottom);
      const visible = rect.bottom > 0 && rect.top < vh;

      bg.style.clipPath = `inset(${top}px 0px ${bottom}px 0px)`;
      // Avoid opacity toggles — they flash on mobile compositors
      bg.style.visibility = visible ? 'visible' : 'hidden';
    };

    const onScrollOrResize = () => {
      if (raf) return;
      raf = requestAnimationFrame(sync);
    };

    sync();
    window.addEventListener('scroll', onScrollOrResize, { passive: true });
    window.addEventListener('resize', onScrollOrResize);
    const ro = new ResizeObserver(onScrollOrResize);
    ro.observe(chapter);

    return () => {
      if (raf) cancelAnimationFrame(raf);
      window.removeEventListener('scroll', onScrollOrResize);
      window.removeEventListener('resize', onScrollOrResize);
      ro.disconnect();
    };
  }, []);

  return (
    <>
      <div
        ref={bgRef}
        className="pointer-events-none fixed inset-0 z-0"
        aria-hidden
      >
        <div className="absolute inset-0 bg-[#0a0a0f]" />
        {mobile || reduced ? (
          <AboutGalaxy
            transparent={false}
            starCount={mobile ? 420 : 700}
            fieldCount={mobile ? 48 : 80}
            armCount={4}
            rotationSpeed={mobile ? 0.028 : 0.045}
            className="absolute inset-0 h-full w-full"
          />
        ) : (
          <>
            <HeroScene reduced={false} className="absolute inset-0 h-full w-full" />
            <div className="absolute inset-0" style={{ opacity: 0.7 }}>
              <AboutGalaxy
                transparent
                starCount={1000}
                fieldCount={80}
                armCount={4}
                rotationSpeed={0.045}
                className="absolute inset-0 h-full w-full"
              />
            </div>
          </>
        )}
      </div>

      <div ref={chapterRef} className="relative z-[1]">
        {children}
      </div>
    </>
  );
}
