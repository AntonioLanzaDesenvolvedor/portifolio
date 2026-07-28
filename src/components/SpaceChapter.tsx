import { type ReactNode, useEffect, useRef } from 'react';
import { HeroScene } from '@/components/hero/HeroScene';
import { AboutGalaxy } from '@/components/about/AboutGalaxy';

type SpaceChapterProps = {
  children: ReactNode;
  reduced?: boolean;
};

/**
 * Same fixed Hero starfield through About.
 * clip-path tracks the chapter box so the bg ends with Sobre and
 * never paints over Skills (sticky breaks under overflow-x-clip).
 */
export function SpaceChapter({ children, reduced = false }: SpaceChapterProps) {
  const chapterRef = useRef<HTMLDivElement>(null);
  const bgRef = useRef<HTMLDivElement>(null);

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
      bg.style.visibility = visible ? 'visible' : 'hidden';
      bg.style.opacity = visible ? '1' : '0';
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
        <HeroScene reduced={reduced} className="absolute inset-0 h-full w-full" />
        <div
          className="absolute inset-0"
          style={{ opacity: reduced ? 0.85 : 0.7 }}
        >
          <AboutGalaxy
            transparent
            starCount={1000}
            fieldCount={80}
            armCount={4}
            rotationSpeed={0.045}
            className="absolute inset-0 h-full w-full"
          />
        </div>
      </div>

      <div ref={chapterRef} className="relative z-[1]">
        {children}
      </div>
    </>
  );
}
