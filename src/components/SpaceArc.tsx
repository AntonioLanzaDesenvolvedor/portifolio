import { type ReactNode, useRef } from 'react';
import { SkillsNebula } from '@/components/skills/SkillsNebula';
import { useChapterViewportMask } from '@/hooks/use-chapter-viewport-mask';

type SpaceArcProps = {
  children: ReactNode;
};

/**
 * Skills + Projects nebula — fixed + masked to this chapter,
 * same continuous language as SpaceChapter without overlapping it.
 */
export function SpaceArc({ children }: SpaceArcProps) {
  const chapterRef = useRef<HTMLDivElement>(null);
  const maskRef = useRef<HTMLDivElement>(null);
  const stageRef = useRef<HTMLDivElement>(null);

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
          <SkillsNebula className="absolute inset-0 h-full w-full" />
          <div
            className="absolute inset-0"
            style={{
              background:
                'radial-gradient(ellipse at 30% 35%, rgba(56,100,180,0.12) 0%, transparent 48%), radial-gradient(ellipse at 75% 65%, rgba(100,60,150,0.1) 0%, transparent 50%)',
            }}
          />
        </div>
      </div>

      <div ref={chapterRef} className="relative z-40 overflow-visible">
        {children}
      </div>
    </>
  );
}
