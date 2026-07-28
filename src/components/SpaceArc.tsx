import { type ReactNode, useEffect, useRef } from 'react';
import { SkillsNebula } from '@/components/skills/SkillsNebula';

type SpaceArcProps = {
  children: ReactNode;
};

/**
 * Skills + Projects nebula — fixed + clipped to this chapter,
 * same continuous language as SpaceChapter without overlapping it.
 */
export function SpaceArc({ children }: SpaceArcProps) {
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
      <div ref={bgRef} className="pointer-events-none fixed inset-0 z-0" aria-hidden>
        <SkillsNebula className="absolute inset-0 h-full w-full" />
        <div
          className="absolute inset-0"
          style={{
            background:
              'radial-gradient(ellipse at 30% 35%, rgba(56,100,180,0.12) 0%, transparent 48%), radial-gradient(ellipse at 75% 65%, rgba(100,60,150,0.1) 0%, transparent 50%)',
          }}
        />
      </div>

      <div ref={chapterRef} className="relative z-40 overflow-visible">
        {children}
      </div>
    </>
  );
}
