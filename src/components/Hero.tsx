import { useEffect, useMemo, useRef, useState } from 'react';
import { ArrowRight, Github, Linkedin } from 'lucide-react';
import { useI18n } from '@/i18n/i18n';
import { useEntrance } from '@/hooks/use-entrance';
import { gsap, ScrollTrigger, useGSAP } from '@/lib/gsap';
import { heroMotion } from '@/components/hero/hero-motion';

const ROLE_HOLD_MS = 3200;

function prefersReduced() {
  return typeof window !== 'undefined' && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
}

export function Hero() {
  const { t, language } = useI18n();
  const ready = useEntrance();
  const reduced = prefersReduced();

  const sectionRef = useRef<HTMLElement>(null);
  const stageRef = useRef<HTMLDivElement>(null);
  const eyebrowRef = useRef<HTMLParagraphElement>(null);
  const titleRef = useRef<HTMLHeadingElement>(null);
  const titleLabelRef = useRef<HTMLSpanElement>(null);
  const roleRef = useRef<HTMLParagraphElement>(null);
  const descRef = useRef<HTMLParagraphElement>(null);
  const actionsRef = useRef<HTMLDivElement>(null);
  const sceneWrapRef = useRef<HTMLDivElement>(null);

  const [roleIndex, setRoleIndex] = useState(0);
  const roleIndexRef = useRef(0);
  const introDoneRef = useRef(false);

  const roles = useMemo(() => {
    const data = t('hero.roles');
    return (Array.isArray(data) ? data : ['Full Stack']) as string[];
  }, [language, t]);

  const name = t('hero.name') as string;
  const description = t('hero.description') as string;
  const badge = t('hero.badge') as string;
  const viewWork = t('hero.viewWork') as string;

  useEffect(() => {
    roleIndexRef.current = 0;
    setRoleIndex(0);
  }, [language]);

  useGSAP(
    () => {
      const section = sectionRef.current;
      const title = titleRef.current;
      if (!section || !title || !ready) return;

      const cleanups: Array<() => void> = [];

      const showFinal = () => {
        heroMotion.intro = 1;
        introDoneRef.current = true;
        document.documentElement.dataset.heroIntro = 'done';
        gsap.set(
          [
            sceneWrapRef.current,
            stageRef.current,
            eyebrowRef.current,
            titleRef.current,
            roleRef.current,
            descRef.current,
            actionsRef.current,
          ],
          { clearProps: 'all', autoAlpha: 1 },
        );
        gsap.set(titleLabelRef.current, {
          clearProps: 'backgroundPosition',
          backgroundPosition: '100% 0%',
        });
      };

      if (reduced) {
        showFinal();
      } else {
        document.documentElement.dataset.heroIntro = 'playing';

        gsap.set(sceneWrapRef.current, { autoAlpha: 1 });
        gsap.set(stageRef.current, { autoAlpha: 1 });
        gsap.set(title, { autoAlpha: 0, scale: 0.985 });
        gsap.set(titleLabelRef.current, { backgroundPosition: '100% 0%' });

        const copyEls = [
          eyebrowRef.current,
          roleRef.current,
          descRef.current,
          actionsRef.current,
        ].filter(Boolean) as HTMLElement[];
        gsap.set(copyEls, {
          opacity: 0,
          y: 28,
          visibility: 'visible',
          force3D: true,
        });

        const introProxy = { v: 0.7 };
        heroMotion.intro = 0.7;
        const tl = gsap.timeline({
          defaults: { ease: 'power3.out', force3D: true },
          onUpdate: () => {
            heroMotion.intro = introProxy.v;
          },
          onComplete: () => {
            heroMotion.intro = 1;
            introDoneRef.current = true;
            document.documentElement.dataset.heroIntro = 'done';
            gsap.set(title, { clearProps: 'transform' });
            gsap.set(copyEls, { clearProps: 'transform' });
            gsap.set(titleLabelRef.current, { backgroundPosition: '100% 0%' });
          },
        });

        // —— Act 1: name + live starfield (no dark void overlay) ——
        tl.to(title, { autoAlpha: 1, scale: 1, duration: 1.4, ease: 'filmOut' }, 0.2);
        tl.to(
          titleLabelRef.current,
          { backgroundPosition: '0% 0%', duration: 1.2, ease: 'power1.inOut' },
          0.95,
        );
        tl.to(introProxy, { v: 1, duration: 1.2, ease: 'power2.inOut' }, 0.25);

        // —— Act 2: supporting copy ——
        tl.fromTo(
          copyEls,
          { opacity: 0, y: 28 },
          {
            opacity: 1,
            y: 0,
            duration: 0.5,
            stagger: 0.08,
            ease: 'power3.out',
            overwrite: 'auto',
          },
          1.45,
        );
      }

      ScrollTrigger.create({
        trigger: section,
        start: 'top top',
        end: 'bottom top',
        scrub: true,
        onUpdate: (self) => {
          heroMotion.scroll = self.progress;
        },
      });

      if (!reduced) {
        gsap.to(stageRef.current, {
          y: 20,
          ease: 'none',
          scrollTrigger: {
            trigger: section,
            start: 'top top',
            end: 'bottom top',
            scrub: true,
          },
        });
      }

      let prevX = 0;
      let prevY = 0;
      let prevT = performance.now();

      const onMove = (e: PointerEvent) => {
        const rect = section.getBoundingClientRect();
        const nx = (e.clientX - rect.left) / rect.width - 0.5;
        const ny = (e.clientY - rect.top) / rect.height - 0.5;
        const now = performance.now();
        const dt = Math.max(16, now - prevT) / 1000;
        const speed = Math.min(2.2, (Math.hypot(nx - prevX, ny - prevY) / dt) * 0.35);
        heroMotion.mouseX = nx;
        heroMotion.mouseY = ny;
        heroMotion.velocity = heroMotion.velocity * 0.7 + speed * 0.3;
        prevX = nx;
        prevY = ny;
        prevT = now;
      };
      const onLeave = () => {
        gsap.to(heroMotion, {
          mouseX: 0,
          mouseY: 0,
          velocity: 0,
          press: 0,
          duration: 0.85,
          ease: 'cinematic',
        });
      };
      const onDown = () => {
        heroMotion.press = 1;
      };
      const onUp = () => {
        gsap.to(heroMotion, { press: 0, duration: 0.45, ease: 'power2.out' });
      };

      section.addEventListener('pointermove', onMove, { passive: true });
      section.addEventListener('pointerleave', onLeave);
      section.addEventListener('pointerdown', onDown);
      window.addEventListener('pointerup', onUp);
      cleanups.push(() => {
        section.removeEventListener('pointermove', onMove);
        section.removeEventListener('pointerleave', onLeave);
        section.removeEventListener('pointerdown', onDown);
        window.removeEventListener('pointerup', onUp);
      });

      const decayId = window.setInterval(() => {
        heroMotion.velocity *= 0.9;
      }, 50);
      cleanups.push(() => window.clearInterval(decayId));

      return () => {
        cleanups.forEach((c) => c());
        ScrollTrigger.getAll().forEach((st) => {
          if (st.trigger === section) st.kill();
        });
      };
    },
    { scope: sectionRef, dependencies: [ready, language, name, description, reduced] },
  );

  useGSAP(
    () => {
      if (!ready || reduced || roles.length < 2) return;
      let cancelled = false;
      let timer = 0;

      const cycle = () => {
        if (cancelled || !roleRef.current) return;
        if (!introDoneRef.current) {
          timer = window.setTimeout(cycle, 200);
          return;
        }
        const next = (roleIndexRef.current + 1) % roles.length;
        const el = roleRef.current;
        gsap
          .timeline({
            onComplete: () => {
              roleIndexRef.current = next;
              setRoleIndex(next);
              timer = window.setTimeout(cycle, ROLE_HOLD_MS);
            },
          })
          .to(el, { autoAlpha: 0, y: -8, duration: 0.35, ease: 'power2.in' })
          .add(() => {
            el.textContent = roles[next];
          })
          .fromTo(
            el,
            { autoAlpha: 0, y: 12 },
            { autoAlpha: 1, y: 0, duration: 0.4, ease: 'power3.out' },
          );
      };

      timer = window.setTimeout(cycle, ROLE_HOLD_MS + 2200);
      return () => {
        cancelled = true;
        window.clearTimeout(timer);
      };
    },
    { scope: sectionRef, dependencies: [ready, language, roles, reduced] },
  );

  return (
    <section
      ref={sectionRef}
      id="hero"
      className="relative flex min-h-[100dvh] items-center justify-center overflow-hidden bg-transparent text-foreground"
    >
      {/* Shared starfield lives in SpaceChapter — keep ref for intro timeline */}
      <div ref={sceneWrapRef} className="pointer-events-none absolute inset-0 z-0" aria-hidden />

      <div
        ref={stageRef}
        className="hero-cinematic relative z-10 flex w-full max-w-4xl flex-col items-center px-5 py-28 text-center sm:px-8 sm:py-32"
      >
        <p
          ref={eyebrowRef}
          className="mb-5 font-sans text-sm font-medium tracking-[0.18em] text-sky-300/80 uppercase sm:mb-6"
        >
          {badge}
        </p>

        <h1
          ref={titleRef}
          aria-label={name}
          className="hero-title font-display relative m-0 inline-block max-w-[14ch] text-[clamp(2.75rem,8vw,5.75rem)] font-bold leading-[1.08] tracking-[-0.045em]"
        >
          <span ref={titleLabelRef} className="hero-title-label">
            {name}
          </span>
        </h1>

        <p
          ref={roleRef}
          className="mt-6 font-display text-xl font-medium tracking-tight text-sky-300 sm:mt-7 sm:text-2xl md:text-3xl"
        >
          {roles[roleIndex]}
        </p>

        <p
          ref={descRef}
          className="mt-4 max-w-lg font-sans text-base leading-relaxed text-white/58 sm:mt-5 sm:text-lg"
        >
          {description}
        </p>

        <div
          ref={actionsRef}
          className="mt-8 flex flex-wrap items-center justify-center gap-3 sm:mt-10 sm:gap-4"
        >
          <a
            href="#projects"
            className="inline-flex items-center gap-2 rounded-full bg-sky-400 px-6 py-3.5 text-sm font-semibold text-slate-950 transition-transform hover:scale-[1.02] active:scale-[0.98]"
          >
            {viewWork}
            <ArrowRight className="h-4 w-4" />
          </a>
          <a
            href="https://github.com/antonio-lanza"
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex h-11 w-11 items-center justify-center rounded-full border border-white/12 text-white/70 transition-colors hover:border-sky-400/40 hover:text-sky-300"
            aria-label="GitHub"
          >
            <Github className="h-4 w-4" />
          </a>
          <a
            href="https://www.linkedin.com/in/antoniopernoncini/"
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex h-11 w-11 items-center justify-center rounded-full border border-white/12 text-white/70 transition-colors hover:border-sky-400/40 hover:text-sky-300"
            aria-label="LinkedIn"
          >
            <Linkedin className="h-4 w-4" />
          </a>
        </div>
      </div>
    </section>
  );
}
