import { type ReactNode, useEffect, useRef, useState } from 'react';
import { HeroScene } from '@/components/hero/HeroScene';
import { AboutGalaxy } from '@/components/about/AboutGalaxy';
import { useChapterViewportMask } from '@/hooks/use-chapter-viewport-mask';

type SpaceChapterProps = {
  children: ReactNode;
  reduced?: boolean;
};

function isMobileViewport() {
  return typeof window !== 'undefined'
    && window.matchMedia('(max-width: 768px), (pointer: coarse)').matches;
}

/**
 * Same fixed Hero starfield through About on every viewport.
 * Mask tracks the chapter box so the bg ends with Sobre and never
 * paints over Skills (overflow mask — sticky breaks under overflow-x-clip).
 */
export function SpaceChapter({ children, reduced = false }: SpaceChapterProps) {
  const chapterRef = useRef<HTMLDivElement>(null);
  const maskRef = useRef<HTMLDivElement>(null);
  const stageRef = useRef<HTMLDivElement>(null);
  const [mobile, setMobile] = useState(() => isMobileViewport());

  useEffect(() => {
    const mq = window.matchMedia('(max-width: 768px), (pointer: coarse)');
    const sync = () => setMobile(mq.matches);
    sync();
    mq.addEventListener('change', sync);
    return () => mq.removeEventListener('change', sync);
  }, []);

  useChapterViewportMask(chapterRef, maskRef, stageRef);

  return (
    <>
      <div
        ref={maskRef}
        className="pointer-events-none fixed left-0 right-0 z-0 overflow-hidden"
        style={{ top: 0, height: '100%' }}
        aria-hidden
      >
        <div ref={stageRef} className="relative h-screen w-full will-change-transform">
          <div className="absolute inset-0 bg-[#0a0a0f]" />
          {reduced ? (
            <AboutGalaxy
              transparent={false}
              starCount={700}
              fieldCount={80}
              armCount={4}
              rotationSpeed={0.045}
              className="absolute inset-0 h-full w-full"
            />
          ) : (
            <>
              <HeroScene
                reduced={false}
                count={mobile ? 280 : 400}
                className="absolute inset-0 h-full w-full"
              />
              <div className="absolute inset-0" style={{ opacity: 0.7 }}>
                <AboutGalaxy
                  transparent
                  starCount={mobile ? 700 : 1000}
                  fieldCount={mobile ? 56 : 80}
                  armCount={4}
                  rotationSpeed={mobile ? 0.035 : 0.045}
                  className="absolute inset-0 h-full w-full"
                />
              </div>
            </>
          )}
        </div>
      </div>

      <div ref={chapterRef} className="relative z-[1]">
        {children}
      </div>
    </>
  );
}
