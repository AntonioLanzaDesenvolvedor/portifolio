import { motion } from 'framer-motion';
import { SectionHeading } from './SectionHeading';
import { useI18n } from '@/i18n/i18n';

export function Skills() {
  const { t } = useI18n();

  const SKILL_CATEGORIES = [
    {
      title: t('skills.categories.frontend') as string,
      skills: [
        { name: 'React / Next.js', level: 95 },
        { name: 'TypeScript', level: 90 },
        { name: 'Tailwind CSS', level: 98 },
        { name: 'Framer Motion', level: 85 }
      ]
    },
    {
      title: t('skills.categories.ui') as string,
      skills: [
        { name: t('skills.ui.responsive') as string, level: 95 },
        { name: t('skills.ui.accessibility') as string, level: 80 },
        { name: t('skills.ui.architecture') as string, level: 90 },
        { name: t('skills.ui.performance') as string, level: 85 }
      ]
    },
    {
      title: t('skills.categories.tools') as string,
      skills: [
        { name: 'Git & GitHub', level: 90 },
        { name: 'Vite / Webpack', level: 85 },
        { name: 'Figma', level: 80 },
        { name: t('skills.tools.api') as string, level: 90 }
      ]
    }
  ];

  return (
    <section id="skills" className="py-24 bg-secondary/30 relative border-y border-border/50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <SectionHeading
          title={t('skills.title') as string}
          subtitle={t('skills.subtitle') as string}
        />

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 md:gap-12 mt-16">
          {SKILL_CATEGORIES.map((category, catIdx) => (
            <motion.div
              key={category.title}
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5, delay: catIdx * 0.2 }}
              className="glass-card p-8 rounded-3xl"
            >
              <h3 className="text-xl font-bold mb-8 text-foreground pb-4 border-b border-border/50">
                {category.title}
              </h3>

              <div className="space-y-6">
                {category.skills.map((skill, skillIdx) => (
                  <div key={skill.name} className="group">
                    <div className="flex justify-between mb-2">
                      <span className="font-medium text-muted-foreground group-hover:text-primary transition-colors">
                        {skill.name}
                      </span>
                      <span className="text-sm font-mono text-muted-foreground">
                        {skill.level}%
                      </span>
                    </div>

                    <div className="h-2 w-full bg-background/50 rounded-full overflow-hidden">
                      <motion.div
                        initial={{ width: 0 }}
                        whileInView={{ width: `${skill.level}%` }}
                        viewport={{ once: true }}
                        transition={{
                          duration: 1,
                          delay: 0.3 + (skillIdx * 0.1),
                          ease: 'easeOut'
                        }}
                        className="h-full bg-gradient-to-r from-primary to-blue-500 rounded-full relative"
                      >
                        <div className="absolute inset-0 bg-white/20 w-full h-full animate-[shimmer_2s_infinite]"></div>
                      </motion.div>
                    </div>
                  </div>
                ))}
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}