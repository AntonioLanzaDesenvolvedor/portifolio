import { ReactNode, useEffect, useState } from 'react';
import { motion, AnimatePresence, type Variants } from 'framer-motion';
import {
  Github,
  Linkedin,
  Twitter,
  ChevronDown,
  ArrowRight,
} from 'lucide-react';
import { useI18n } from '@/i18n/i18n';

export function Hero() {
  const { t } = useI18n();
  const [roleIndex, setRoleIndex] = useState(0);
  const rolesData = t('hero.roles');
  const roles = Array.isArray(rolesData) ? rolesData : ['Frontend Developer', 'UI Engineer', 'React Specialist', 'Creative Coder'];
  const longestRole = roles.reduce((longest: string, current: string) => (typeof current === 'string' && current.length > longest.length) ? current : longest, 'Frontend Developer');

  useEffect(() => {
    const interval = window.setInterval(() => {
      setRoleIndex((prev) => (prev + 1) % roles.length);
    }, 2200);

    return () => window.clearInterval(interval);
  }, [roles]);

  const containerVariants: Variants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,   
      transition: {
        staggerChildren: 0.18,
      },
    },
  };

  const itemVariants: Variants = {
    hidden: { opacity: 0, y: 18 },
    visible: {
      opacity: 1,
      y: 0,
      transition: {
        duration: 0.6,
        ease: 'easeOut',
      },
    },
  };

  return (
    <section
      id="hero"
      className="relative flex min-h-screen items-center justify-center overflow-hidden pt-20"
    >
      {/* BACKGROUND */}
      <div className="absolute inset-0 z-0">
        <img
          src={`${import.meta.env.BASE_URL}images/hero-bg.png`}
          alt="Abstract tech background"
          className="h-full w-full object-cover opacity-30 mix-blend-screen"
        />
        <div className="absolute inset-0 bg-linear-to-b from-background/20 via-background/60 to-background" />
      </div>

      {/* BLOBS */}
      <div className="absolute -left-32 top-1/4 h-96 w-96 rounded-full bg-primary/20 blur-[120px] mix-blend-screen blob-animation" />
      <div className="absolute -right-32 bottom-1/4 h-96 w-96 rounded-full bg-blue-600/20 blur-[120px] mix-blend-screen blob-animation animation-delay-2000" />

      <div className="relative z-10 mx-auto flex w-full max-w-7xl justify-center px-4 sm:px-6 lg:px-8">
        <motion.div
          variants={containerVariants}
          initial="hidden"
          animate="visible"
          className="flex w-full max-w-5xl flex-col items-center text-center"
        >
          {/* BADGE */}
          <motion.div
            variants={itemVariants}
            className="mb-8 inline-flex items-center justify-center gap-2 rounded-full border border-primary/20 bg-primary/5 px-4 py-2 text-primary shadow-lg shadow-primary/5 backdrop-blur-sm"
          >
            <span className="relative flex h-2 w-2">
              <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-primary opacity-75" />
              <span className="relative inline-flex h-2 w-2 rounded-full bg-primary" />
            </span>
            <span className="text-sm font-medium">
              {t('hero.badge') as string}
            </span>
          </motion.div>

          {/* HERO TEXT */}
          <motion.div
            variants={itemVariants}
            className="flex w-full flex-col items-center justify-center"
          >
            <div className="flex flex-col items-center justify-center text-center">
              {/* NOME */}
              <h1 className="m-0 text-center font-bold tracking-tight leading-[0.95] text-5xl sm:text-6xl md:text-7xl lg:text-8xl">
                <span className="inline-block whitespace-nowrap">
                  {t('hero.name') as string}
                </span>
              </h1>

              {/* TEXTO ANIMADO */}
              <div className="mt-4 flex justify-center">
                <div className="relative grid place-items-center">
                  {/* largura base invisível - usa o texto mais longo para garantir espaço */}
                  <span className="invisible whitespace-nowrap text-center font-bold leading-[1.2] py-[0.1em] text-3xl sm:text-4xl md:text-5xl lg:text-6xl">
                    {longestRole}
                  </span>

                  {/* texto animado */}
                  <div className="absolute inset-0 flex items-center justify-center">
                    <AnimatePresence mode="wait">
                      <motion.span
                        key={roles[roleIndex]}
                        initial={{ opacity: 0, y: 12 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -12 }}
                        transition={{ duration: 0.35, ease: 'easeOut' }}
                        className="whitespace-nowrap text-center font-bold leading-[1.2] py-[0.1em] text-3xl sm:text-4xl md:text-5xl lg:text-6xl text-gradient"
                      >
                        {roles[roleIndex]}
                      </motion.span>
                    </AnimatePresence>
                  </div>
                </div>
              </div>
            </div>
          </motion.div>

          {/* DESCRIÇÃO */}
          <motion.p
            variants={itemVariants}
            className="mx-auto mt-8 max-w-2xl text-center text-lg leading-relaxed text-muted-foreground md:text-xl"
          >
            {t('hero.description') as string}
          </motion.p>

          {/* BOTÕES */}
          <motion.div
            variants={itemVariants}
            className="mt-10 flex flex-wrap items-center justify-center gap-4"
          >


            <div className="glass-card flex items-center justify-center gap-4 rounded-full px-6 py-4">
              <SocialLink
                href="https://github.com/AntonioLanzaDesenvolvedor"
                icon={<Github className="h-5 w-5" />}
              />
              <div className="h-6 w-px bg-border" />
              <SocialLink
                href="https://www.linkedin.com/in/antoniopernoncini/"
                icon={<Linkedin className="h-5 w-5" />}
              />
              
            </div>
          </motion.div>
        </motion.div>
      </div>

    </section>
  );
}

function SocialLink({
  href,
  icon,
}: {
  href: string;
  icon: ReactNode;
}) {
  return (
    <a
      href={href}
      target="_blank"
      rel="noopener noreferrer"
      className="flex items-center justify-center text-muted-foreground transition-colors duration-200 hover:scale-110 hover:text-primary"
    >
      {icon}
    </a>
  );
}