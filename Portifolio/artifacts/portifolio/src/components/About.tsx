import { motion } from 'framer-motion';
import { SectionHeading } from './SectionHeading';
import { useI18n } from '@/i18n/i18n';

export function About() {
  const { t } = useI18n();

  const floatingTech = ['React', 'TypeScript', 'Tailwind', 'Motion'];

  return (
    <section id="about" className="py-24 bg-background relative overflow-hidden">
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute top-24 left-1/2 -translate-x-1/2 w-[38rem] h-[38rem] rounded-full bg-primary/8 blur-3xl" />
        <div className="absolute bottom-0 right-0 w-[22rem] h-[22rem] rounded-full bg-blue-500/8 blur-3xl" />
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
        <SectionHeading
          title={t('about.title') as string}
          subtitle={t('about.subtitle') as string}
        />

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 items-stretch">
          
          {/* LEFT - DEV CARD */}
          <motion.div
            initial={{ opacity: 0, x: -50 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
            className="relative flex items-stretch justify-center h-full"
          >
            <div className="relative w-full max-w-xl h-full flex items-stretch justify-center">
              
              <motion.div
                animate={{ y: [0, -8, 0] }}
                transition={{ duration: 6, repeat: Infinity, ease: 'easeInOut' }}
                className="absolute inset-10 rounded-full bg-gradient-to-r from-primary/15 to-blue-500/15 blur-3xl"
              />

              <motion.div
                initial={{ opacity: 0, scale: 0.96 }}
                whileInView={{ opacity: 1, scale: 1 }}
                viewport={{ once: true }}
                transition={{ duration: 0.55, delay: 0.1 }}
                className="relative w-full max-w-lg h-full rounded-[28px] overflow-hidden border border-white/10 bg-card/70 backdrop-blur-xl shadow-[0_20px_80px_rgba(0,0,0,0.35)] flex flex-col"
              >
                <div className="absolute inset-0 bg-gradient-to-br from-primary/10 via-transparent to-blue-500/10 pointer-events-none" />
                <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-primary/60 to-transparent" />

                {/* HEADER */}
                <div className="flex items-center justify-between px-6 py-4 border-b border-border/50 bg-background/40">
                  <div className="flex items-center gap-2">
                    <span className="w-3 h-3 rounded-full bg-red-400/80" />
                    <span className="w-3 h-3 rounded-full bg-yellow-400/80" />
                    <span className="w-3 h-3 rounded-full bg-green-400/80" />
                    <span className="ml-3 text-sm font-mono text-muted-foreground">
                      antonio.profile.tsx
                    </span>
                  </div>

                  <div className="hidden sm:flex items-center gap-2 rounded-full border border-primary/20 bg-primary/10 px-3 py-1 text-xs text-primary font-medium">
                    Frontend Developer
                  </div>
                </div>

                {/* CONTENT */}
                <div className="flex flex-col flex-1 p-6 gap-6">
                  
                  <div className="flex items-center justify-between">
                    <div className="text-xs uppercase tracking-[0.25em] text-muted-foreground">
                      Developer Identity
                    </div>

                    <div className="flex items-center gap-2 text-xs text-emerald-400">
                      <span className="relative flex h-2.5 w-2.5">
                        <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-60"></span>
                        <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-emerald-400"></span>
                      </span>
                      Available
                    </div>
                  </div>

                  {/* CODE BLOCK */}
                  <div className="rounded-2xl border border-white/8 bg-black/30 overflow-hidden">
                    <div className="px-5 py-4 font-mono text-sm leading-7 overflow-x-auto">
                      <div>
                        <span className="text-violet-400">const</span>{' '}
                        <span className="text-sky-300">Antonio</span>{' '}
                        <span className="text-foreground">= {'{'}</span>
                      </div>

                      <div className="pl-4">
                        <div>
                          <span className="text-cyan-300">role</span>
                          <span className="text-foreground">: </span>
                          <span className="text-emerald-400">"Frontend Developer"</span>
                          <span className="text-foreground">,</span>
                        </div>

                        <div>
                          <span className="text-cyan-300">stack</span>
                          <span className="text-foreground">: [</span>
                          <span className="text-emerald-400">"React"</span>
                          <span className="text-foreground">, </span>
                          <span className="text-emerald-400">"TypeScript"</span>
                          <span className="text-foreground">, </span>
                          <span className="text-emerald-400">"Tailwind"</span>
                          <span className="text-foreground">],</span>
                        </div>

                        <div>
                          <span className="text-cyan-300">focus</span>
                          <span className="text-foreground">: </span>
                          <span className="text-emerald-400">"Performance & UX"</span>
                        </div>
                      </div>

                      <div>
                        <span className="text-foreground">{'}'}</span>
                      </div>
                    </div>
                  </div>

                  {/* TECH */}
                  <div className="flex flex-wrap gap-2">
                    {floatingTech.map((item) => (
                      <span
                        key={item}
                        className="px-3 py-1.5 rounded-full text-xs font-medium border border-primary/20 bg-primary/10 text-primary"
                      >
                        {item}
                      </span>
                    ))}
                  </div>
                </div>
              </motion.div>
            </div>
          </motion.div>

          {/* RIGHT - TEXT */}
          <motion.div
            initial={{ opacity: 0, x: 50 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
            className="flex flex-col gap-8 h-full justify-center"
          >
            <h3 className="text-3xl font-bold text-foreground leading-tight">
              {t('about.heading') as string}
            </h3>

            <div className="text-muted-foreground space-y-6 text-xl leading-relaxed max-w-xl">
              <p>
                {t('about.description1') as string}
              </p>

              <p>
                {t('about.description2') as string}
              </p>
            </div>
          </motion.div>

        </div>
      </div>
    </section>
  );
}