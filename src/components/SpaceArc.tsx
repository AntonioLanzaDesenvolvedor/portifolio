import { type ReactNode, useRef } from 'react';
import { SkillsNebula } from '@/components/skills/SkillsNebula';
import { useChapterViewportFade } from '@/hooks/use-chapter-viewport-fade';

type SpaceArcProps = {
  children: ReactNode;
};

/**
 * Skills + Projects galaxy — fixed full-viewport, fades with chapter coverage.
 */
export function SpaceArc({ children }: SpaceArcProps) {
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
        <SkillsNebula className="absolute inset-0 h-full w-full" />
        <div
          className="absolute inset-0"
          style={{
            background:
              'radial-gradient(ellipse at 50% 45%, rgba(220,230,255,0.04) 0%, transparent 42%), radial-gradient(ellipse at 28% 60%, rgba(56,100,180,0.08) 0%, transparent 50%), radial-gradient(ellipse at 72% 40%, rgba(100,60,150,0.07) 0%, transparent 48%)',
          }}
        />
      </div>

      <div ref={chapterRef} className="relative z-40 overflow-visible">
        {children}
      </div>
    </>
  );
}
