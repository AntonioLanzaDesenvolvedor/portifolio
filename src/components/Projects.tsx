import { lazy, Suspense, useMemo, useState } from 'react';
import { motion } from 'framer-motion';
import { useI18n } from '@/i18n/i18n';
import { fadeUp } from '@/lib/motion';
import { isProjectItem, type ProjectItem } from '@/data/projects';
import { cn } from '@/lib/utils';

const ProjectsSatelliteBelt = lazy(() =>
  import('@/components/projects/ProjectsSatelliteBelt').then((m) => ({
    default: m.ProjectsSatelliteBelt,
  })),
);

export function Projects() {
  const { t } = useI18n();
  const [focusOpen, setFocusOpen] = useState(false);

  const raw = t('projects.items');
  const items = useMemo(
    () => (Array.isArray(raw) ? raw : []).filter(isProjectItem) as ProjectItem[],
    [raw],
  );

  return (
    <section
      id="projects"
      className="relative z-50 overflow-visible bg-transparent pb-8 pt-10 sm:pb-12 sm:pt-14 lg:pb-16 lg:pt-16"
    >
      <div
        className="pointer-events-none absolute inset-0 z-0"
        style={{
          background:
            'linear-gradient(to bottom, rgba(10,10,15,0.15) 0%, transparent 18%, transparent 85%, rgba(10,10,15,0.35) 100%)',
        }}
      />

      {/*
        One stacked stage: title UNDER the WebGL layer.
        Extra height + bottom padding so orbits aren't clipped at the canvas edge.
      */}
      <div
        className={cn(
          'relative mx-auto h-[min(125vw,640px)] w-full max-w-7xl sm:h-[960px]',
          focusOpen && 'pointer-events-none',
        )}
      >
        <div className="pointer-events-none absolute inset-x-0 top-6 z-10 px-4 text-center sm:top-8 sm:px-6">
          <motion.h2
            variants={fadeUp}
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, margin: '-60px' }}
            className="mb-2 text-2xl font-bold text-white sm:mb-3 sm:text-3xl md:text-5xl"
          >
            {t('projects.title') as string}
          </motion.h2>
          <motion.p
            initial={{ opacity: 0, y: 8 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: '-60px' }}
            transition={{ duration: 0.4, delay: 0.08 }}
            className="mx-auto max-w-2xl text-sm text-muted-foreground sm:text-base"
          >
            {t('projects.subtitle') as string}
          </motion.p>
        </div>

        <div className="absolute inset-0 z-30">
          <Suspense fallback={<div className="h-full w-full" />}>
            <ProjectsSatelliteBelt
              items={items}
              closeLabel={t('projects.close') as string}
              visitRepoLabel={t('projects.visitRepo') as string}
              privateRepoLabel={t('projects.privateRepo') as string}
              interactHint={t('projects.interactHint') as string}
              onFocusChange={setFocusOpen}
            />
          </Suspense>
        </div>
      </div>
    </section>
  );
}
