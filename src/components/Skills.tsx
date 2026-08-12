import { useMemo, useRef, useState } from 'react';
import type { IconType } from 'react-icons';
import {
  SiReact,
  SiNextdotjs,
  SiMui,
  SiTailwindcss,
  SiFlask,
  SiFastapi,
  SiPostgresql,
  SiSupabase,
  SiTypescript,
  SiPython,
  SiDocker,
  SiRedis,
} from 'react-icons/si';
import { useI18n } from '@/i18n/i18n';
import { gsap, useGSAP } from '@/lib/gsap';
import {
  SkillsConstellation,
  type SkillCategoryId,
  type SkillNode,
} from '@/components/skills/SkillsConstellation';
import { cn } from '@/lib/utils';

type LayoutSeed = {
  id: string;
  category: SkillCategoryId;
  Icon: IconType;
  color: string;
  orbit: number;
  angle: number;
  orbitSpeed: number;
  z: number;
  nameKey: string;
  descKey: string;
};

/** Planetary system — same speed on all rings so relative spacing never collapses */
const LAYOUT: LayoutSeed[] = [
  // Inner — Frontend (even spacing)
  { id: 'react', category: 'frontend', Icon: SiReact, color: '#22D3EE', orbit: 0, angle: 0, orbitSpeed: 0.06, z: 0.9, nameKey: 'skills.frontend.react', descKey: 'skills.frontend.reactDesc' },
  { id: 'next', category: 'frontend', Icon: SiNextdotjs, color: '#E2E8F0', orbit: 0, angle: Math.PI / 2, orbitSpeed: 0.06, z: 0.75, nameKey: 'skills.frontend.next', descKey: 'skills.frontend.nextDesc' },
  { id: 'mui', category: 'frontend', Icon: SiMui, color: '#007FFF', orbit: 0, angle: Math.PI, orbitSpeed: 0.06, z: 0.65, nameKey: 'skills.frontend.mui', descKey: 'skills.frontend.muiDesc' },
  { id: 'tailwind', category: 'frontend', Icon: SiTailwindcss, color: '#38BDF8', orbit: 0, angle: (3 * Math.PI) / 2, orbitSpeed: 0.06, z: 0.8, nameKey: 'skills.frontend.tailwind', descKey: 'skills.frontend.tailwindDesc' },

  // Mid — Backend (offset by 45° so it never lines up with inner)
  { id: 'flask', category: 'backend', Icon: SiFlask, color: '#F8FAFC', orbit: 1, angle: Math.PI / 4, orbitSpeed: 0.06, z: 0.7, nameKey: 'skills.backend.flask', descKey: 'skills.backend.flaskDesc' },
  { id: 'fastapi', category: 'backend', Icon: SiFastapi, color: '#009688', orbit: 1, angle: (3 * Math.PI) / 4, orbitSpeed: 0.06, z: 0.85, nameKey: 'skills.backend.fastapi', descKey: 'skills.backend.fastapiDesc' },
  { id: 'postgres', category: 'backend', Icon: SiPostgresql, color: '#3B82F6', orbit: 1, angle: (5 * Math.PI) / 4, orbitSpeed: 0.06, z: 0.8, nameKey: 'skills.backend.postgres', descKey: 'skills.backend.postgresDesc' },
  { id: 'supabase', category: 'backend', Icon: SiSupabase, color: '#3ECF8E', orbit: 1, angle: (7 * Math.PI) / 4, orbitSpeed: 0.06, z: 0.7, nameKey: 'skills.backend.supabase', descKey: 'skills.backend.supabaseDesc' },

  // Outer — Platform (offset by 22.5° so it never lines up with either ring)
  { id: 'typescript', category: 'platform', Icon: SiTypescript, color: '#3178C6', orbit: 2, angle: Math.PI / 8, orbitSpeed: 0.06, z: 0.8, nameKey: 'skills.platform.typescript', descKey: 'skills.platform.typescriptDesc' },
  { id: 'python', category: 'platform', Icon: SiPython, color: '#FFD43B', orbit: 2, angle: (5 * Math.PI) / 8, orbitSpeed: 0.06, z: 0.7, nameKey: 'skills.platform.python', descKey: 'skills.platform.pythonDesc' },
  { id: 'docker', category: 'platform', Icon: SiDocker, color: '#2496ED', orbit: 2, angle: (9 * Math.PI) / 8, orbitSpeed: 0.06, z: 0.75, nameKey: 'skills.platform.docker', descKey: 'skills.platform.dockerDesc' },
  { id: 'redis', category: 'platform', Icon: SiRedis, color: '#DC382D', orbit: 2, angle: (13 * Math.PI) / 8, orbitSpeed: 0.06, z: 0.65, nameKey: 'skills.platform.redis', descKey: 'skills.platform.redisDesc' },
];

const CATEGORY_IDS: SkillCategoryId[] = ['frontend', 'backend', 'platform'];

function prefersReduced() {
  return typeof window !== 'undefined' && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
}

export function Skills() {
  const { t, language } = useI18n();
  const sectionRef = useRef<HTMLElement>(null);
  const headingRef = useRef<HTMLHeadingElement>(null);
  const chipsRef = useRef<HTMLDivElement>(null);
  const [activeCategory, setActiveCategory] = useState<SkillCategoryId | 'all'>('all');

  const categoryLabels = useMemo(
    () => ({
      frontend: t('skills.categories.frontend') as string,
      backend: t('skills.categories.backend') as string,
      platform: t('skills.categories.platform') as string,
    }),
    [t, language],
  );

  const skills: SkillNode[] = useMemo(
    () =>
      LAYOUT.map((item) => ({
        id: item.id,
        name: t(item.nameKey) as string,
        description: t(item.descKey) as string,
        category: item.category,
        categoryLabel: categoryLabels[item.category],
        Icon: item.Icon,
        color: item.color,
        orbit: item.orbit,
        angle: item.angle,
        orbitSpeed: item.orbitSpeed,
        z: item.z,
      })),
    [t, language, categoryLabels],
  );

  useGSAP(
    () => {
      const section = sectionRef.current;
      if (!section || prefersReduced()) return;

      const heading = headingRef.current;
      const chips = chipsRef.current ? Array.from(chipsRef.current.children) : [];

      gsap.set([heading, ...chips], { autoAlpha: 0, y: 22 });

      const tl = gsap.timeline({
        defaults: { ease: 'filmOut', force3D: true },
        scrollTrigger: {
          trigger: section,
          start: 'top 75%',
          once: true,
        },
      });

      tl.to(heading, { autoAlpha: 1, y: 0, duration: 0.8 }, 0);
      tl.to(chips, { autoAlpha: 1, y: 0, duration: 0.45, stagger: 0.06, ease: 'power3.out' }, 0.15);
    },
    { scope: sectionRef, dependencies: [language] },
  );

  return (
    <section
      ref={sectionRef}
      id="skills"
      className="relative z-[5] overflow-hidden bg-transparent pt-10 pb-16 sm:pt-12 sm:pb-20 lg:pt-14 lg:pb-24"
    >
      <div
        className="pointer-events-none absolute inset-0 z-[1]"
        style={{
            background:
              'linear-gradient(to bottom, rgba(10,10,15,0.18) 0%, transparent 28%, transparent 72%, rgba(10,10,15,0.16) 100%)',
        }}
      />

      <div className="relative z-10 mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="relative z-20 mb-4 flex flex-col items-center text-center sm:mb-5">
          <h2 ref={headingRef} className="text-2xl font-bold sm:text-3xl md:text-5xl">
            {t('skills.title') as string}
          </h2>
        </div>

        <div
          ref={chipsRef}
          className="relative z-20 mb-12 flex flex-wrap items-center justify-center gap-2 sm:mb-14 sm:gap-2.5"
          role="group"
          aria-label={t('skills.title') as string}
        >
          {CATEGORY_IDS.map((id) => (
            <button
              key={id}
              type="button"
              onClick={() => setActiveCategory((prev) => (prev === id ? 'all' : id))}
              aria-pressed={activeCategory === id}
              className={cn(
                'rounded-full border px-3.5 py-1.5 text-xs font-medium tracking-wide transition-colors sm:px-4 sm:text-sm',
                activeCategory === id
                  ? 'border-sky-400/40 bg-sky-400/15 text-sky-200'
                  : 'border-white/10 bg-white/[0.03] text-muted-foreground hover:border-white/20 hover:text-foreground',
              )}
            >
              {categoryLabels[id]}
            </button>
          ))}
        </div>

        <SkillsConstellation
          skills={skills}
          activeCategory={activeCategory}
          closeLabel={t('skills.close') as string}
          interactHint={t('skills.interactHint') as string}
          className="relative z-0"
        />
      </div>
    </section>
  );
}
