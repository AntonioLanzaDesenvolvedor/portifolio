import { type ReactNode, useEffect, useRef, useState } from 'react';
import { HeroScene } from '@/components/hero/HeroScene';
import { AboutGalaxy } from '@/components/about/AboutGalaxy';
import { useChapterViewportFade } from '@/hooks/use-chapter-viewport-fade';

type SpaceChapterProps = {
  children: ReactNode;
  reduced?: boolean;
};

function isMobileViewport() {
  return typeof window !== 'undefined'
    && window.matchMedia('(max-width: 768px), (pointer: coarse)').matches;
}

/**
 * Fixed Hero starfield through About.
 * Desktop: HeroScene + AboutGalaxy stack.
 * Mobile: HeroScene only — stacking two live canvases under opacity
 * fades flickers hard on phone GPUs; nebula stays as CSS overlays.
 */
export function SpaceChapter({ children, reduced = false }: SpaceChapterProps) {
  const chapterRef = useRef<HTMLDivElement>(null);
  const layerRef = useRef<HTMLDivElement>(null);
  const [mobile, setMobile] = useState(() => isMobileViewport());

  useEffect(() => {
    const mq = window.matchMedia('(max-width: 768px), (pointer: coarse)');
    const sync = () => setMobile(mq.matches);
    sync();
    mq.addEventListener('change', sync);
    return () => mq.removeEventListener('change', sync);
  }, []);

  useChapterViewportFade(chapterRef, layerRef);

  return (
    <>
      <div
        ref={layerRef}
        className="pointer-events-none fixed inset-0 z-0"
        aria-hidden
      >
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
        ) : mobile ? (
          <HeroScene
            reduced={false}
            count={180}
            staticField
            className="absolute inset-0 h-full w-full"
          />
        ) : (
          <>
            <HeroScene
              reduced={false}
              count={400}
              className="absolute inset-0 h-full w-full"
            />
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
