import { AboutGalaxy } from '@/components/about/AboutGalaxy';
import { cn } from '@/lib/utils';

type SkillsNebulaProps = {
  className?: string;
};

/**
 * Skills backdrop — same spiral galaxy as About, lighter so About→Skills scroll stays fluid.
 */
export function SkillsNebula({ className }: SkillsNebulaProps) {
  return (
    <AboutGalaxy
      starCount={520}
      fieldCount={48}
      armCount={4}
      rotationSpeed={0.038}
      className={cn('absolute inset-0 h-full w-full', className)}
    />
  );
}
