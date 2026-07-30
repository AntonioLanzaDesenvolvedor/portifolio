import { type ReactNode, useRef } from 'react';
import { HeroScene } from '@/components/hero/HeroScene';
import { AboutGalaxy } from '@/components/about/AboutGalaxy';
import { useChapterViewportFade } from '@/hooks/use-chapter-viewport-fade';

type SpaceChapterProps = {
  children: ReactNode;
  reduced?: boolean;
};

/**
 * Same fixed Hero starfield through About on every viewport —
 * identical HeroScene + AboutGalaxy stack (desktop look on mobile too).
 * Touch-scroll freezes canvas RAF so the dual layer doesn't flicker.
 */
export function SpaceChapter({ children, reduced = false }: SpaceChapterProps) {
  const chapterRef = useRef<HTMLDivElement>(null);
  const layerRef = useRef<HTMLDivElement>(null);

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
        ) : (
          <>
            <HeroScene reduced={false} count={400} speed={0.5} className="absolute inset-0 h-full w-full" />
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
