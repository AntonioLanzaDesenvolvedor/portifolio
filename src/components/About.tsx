import { useRef } from 'react';
import { useI18n } from '@/i18n/i18n';
import { gsap, useGSAP } from '@/lib/gsap';

const CODE_LINES = [
  { indent: 0, parts: [{ t: 'const', c: 'text-violet-400' }, { t: ' Antonio', c: 'text-sky-300' }, { t: ' = {', c: 'text-foreground' }] },
  { indent: 1, parts: [{ t: 'role', c: 'text-cyan-300' }, { t: ': ', c: 'text-foreground' }, { t: '"Full Stack Developer"', c: 'text-emerald-400' }, { t: ',', c: 'text-foreground' }] },
  { indent: 1, parts: [{ t: 'stack', c: 'text-cyan-300' }, { t: ': [', c: 'text-foreground' }, { t: '"React"', c: 'text-emerald-400' }, { t: ', ', c: 'text-foreground' }, { t: '"Next.js"', c: 'text-emerald-400' }, { t: ', ', c: 'text-foreground' }, { t: '"Python"', c: 'text-emerald-400' }, { t: '],', c: 'text-foreground' }] },
  { indent: 1, parts: [{ t: 'focus', c: 'text-cyan-300' }, { t: ': ', c: 'text-foreground' }, { t: '"Building production-ready software"', c: 'text-emerald-400' }] },
  { indent: 0, parts: [{ t: '}', c: 'text-foreground' }] },
];

function prefersReduced() {
  return typeof window !== 'undefined' && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
}

export function About() {
  const { t, language } = useI18n();
  const sectionRef = useRef<HTMLElement>(null);
  const headingRef = useRef<HTMLHeadingElement>(null);
  const subtitleRef = useRef<HTMLParagraphElement>(null);
  const cardRef = useRef<HTMLDivElement>(null);
  const codeLinesRef = useRef<HTMLDivElement>(null);
  const tagsRef = useRef<HTMLDivElement>(null);
  const copyRef = useRef<HTMLDivElement>(null);

  const techTagsData = t('about.techTags');
  const floatingTech = (
    Array.isArray(techTagsData) ? techTagsData : ['React', 'Next.js', 'Python', 'PostgreSQL']
  ) as string[];

  useGSAP(
    () => {
      const section = sectionRef.current;
      if (!section) return;

      const reduced = prefersReduced();
      const heading = headingRef.current;
      const subtitle = subtitleRef.current;
      const card = cardRef.current;
      const codeRoot = codeLinesRef.current;
      const tags = tagsRef.current;
      const copy = copyRef.current;
      const codeLines = codeRoot ? Array.from(codeRoot.children) : [];
      const tagEls = tags ? Array.from(tags.children) : [];
      const copyEls = copy ? Array.from(copy.children) : [];

      if (reduced) {
        gsap.set([heading, subtitle, card, ...codeLines, ...tagEls, ...copyEls], {
          clearProps: 'all',
          autoAlpha: 1,
        });
        return;
      }

      gsap.set([heading, subtitle], { autoAlpha: 0, y: 28 });
      gsap.set(card, { autoAlpha: 0, y: 40, scale: 0.97 });
      gsap.set(codeLines, { autoAlpha: 0, x: -12 });
      gsap.set(tagEls, { autoAlpha: 0, y: 10, scale: 0.94 });
      gsap.set(copyEls, { autoAlpha: 0, y: 24 });

      const tl = gsap.timeline({
        defaults: { ease: 'filmOut', force3D: true },
        scrollTrigger: {
          trigger: section,
          start: 'top 72%',
          once: true,
        },
      });

      tl.to(heading, { autoAlpha: 1, y: 0, duration: 0.85 }, 0);
      tl.to(subtitle, { autoAlpha: 1, y: 0, duration: 0.7 }, 0.12);
      tl.to(card, { autoAlpha: 1, y: 0, scale: 1, duration: 0.95 }, 0.18);
      tl.to(
        codeLines,
        { autoAlpha: 1, x: 0, duration: 0.45, stagger: 0.07, ease: 'power3.out' },
        0.42,
      );
      tl.to(
        tagEls,
        { autoAlpha: 1, y: 0, scale: 1, duration: 0.4, stagger: 0.06, ease: 'power3.out' },
        0.72,
      );
      tl.to(
        copyEls,
        { autoAlpha: 1, y: 0, duration: 0.65, stagger: 0.1, ease: 'power3.out' },
        0.38,
      );
    },
    { scope: sectionRef, dependencies: [language] },
  );

  return (
    <section
      ref={sectionRef}
      id="about"
      className="relative overflow-hidden bg-transparent py-16 sm:py-20 lg:py-24"
    >
      <div className="relative z-10 mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="mb-10 flex flex-col items-center text-center sm:mb-16">
          <h2 ref={headingRef} className="mb-3 text-2xl font-bold sm:mb-4 sm:text-3xl md:text-5xl">
            {t('about.title') as string}
          </h2>
          <p
            ref={subtitleRef}
            className="max-w-2xl px-1 text-base text-muted-foreground sm:text-lg"
          >
            {t('about.subtitle') as string}
          </p>
        </div>

        <div className="grid grid-cols-1 items-stretch gap-10 lg:grid-cols-2 lg:gap-16">
          <div className="relative flex h-full items-stretch justify-center">
            <div className="relative flex h-full w-full max-w-xl items-stretch justify-center">
              <div className="absolute inset-10 rounded-full bg-gradient-to-r from-sky-500/12 to-violet-500/10 blur-3xl" />

              <div
                ref={cardRef}
                className="relative flex h-full w-full max-w-lg flex-col overflow-hidden rounded-2xl border border-white/10 bg-[#0a0a0f]/55 shadow-[0_20px_80px_rgba(0,0,0,0.35)] backdrop-blur-xl sm:rounded-[28px]"
              >
                <div className="pointer-events-none absolute inset-0 bg-gradient-to-br from-sky-500/10 via-transparent to-violet-500/10" />
                <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-sky-400/50 to-transparent" />

                <div className="flex items-center justify-between gap-3 border-b border-white/8 bg-white/[0.03] px-4 py-3 sm:px-6 sm:py-4">
                  <div className="flex min-w-0 items-center gap-2">
                    <span className="h-2.5 w-2.5 shrink-0 rounded-full bg-red-400/80 sm:h-3 sm:w-3" />
                    <span className="h-2.5 w-2.5 shrink-0 rounded-full bg-yellow-400/80 sm:h-3 sm:w-3" />
                    <span className="h-2.5 w-2.5 shrink-0 rounded-full bg-green-400/80 sm:h-3 sm:w-3" />
                    <span className="ml-1 truncate font-mono text-xs text-muted-foreground sm:ml-3 sm:text-sm">
                      {t('about.card.filename') as string}
                    </span>
                  </div>
                  <div className="hidden items-center gap-2 rounded-full border border-sky-400/25 bg-sky-400/10 px-3 py-1 text-xs font-medium text-sky-300 sm:flex">
                    {t('about.card.badge') as string}
                  </div>
                </div>

                <div className="flex flex-1 flex-col gap-5 p-4 sm:gap-6 sm:p-6">
                  <div className="flex items-center justify-between">
                    <div className="text-xs uppercase tracking-[0.25em] text-muted-foreground">
                      {t('about.card.identity') as string}
                    </div>
                    <div className="flex items-center gap-2 text-xs text-emerald-400">
                      <span className="relative flex h-2.5 w-2.5">
                        <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400 opacity-60" />
                        <span className="relative inline-flex h-2.5 w-2.5 rounded-full bg-emerald-400" />
                      </span>
                      {t('about.card.available') as string}
                    </div>
                  </div>

                  <div className="overflow-hidden rounded-2xl border border-white/8 bg-black/35">
                    <div
                      ref={codeLinesRef}
                      className="overflow-x-auto px-4 py-3 font-mono text-xs leading-6 sm:px-5 sm:py-4 sm:text-sm sm:leading-7"
                    >
                      {CODE_LINES.map((line, lineIdx) => (
                        <div key={lineIdx} style={{ paddingLeft: line.indent * 16 }}>
                          {line.parts.map((part, i) => (
                            <span key={i} className={part.c}>
                              {part.t}
                            </span>
                          ))}
                        </div>
                      ))}
                    </div>
                  </div>

                  <div ref={tagsRef} className="flex flex-wrap gap-2">
                    {floatingTech.map((item) => (
                      <span
                        key={item}
                        className="rounded-full border border-sky-400/20 bg-sky-400/10 px-3 py-1.5 text-xs font-medium text-sky-300"
                      >
                        {item}
                      </span>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div
            ref={copyRef}
            className="flex h-full flex-col items-center justify-center gap-6 text-center sm:gap-8"
          >
            <h3 className="max-w-2xl text-2xl font-bold leading-tight text-foreground sm:text-3xl">
              {t('about.heading') as string}
            </h3>
            <p className="max-w-2xl text-base leading-relaxed text-muted-foreground sm:text-lg lg:text-xl">
              {t('about.description1') as string}
            </p>
            <p className="max-w-2xl text-base leading-relaxed text-muted-foreground sm:text-lg lg:text-xl">
              {t('about.description2') as string}
            </p>
          </div>
        </div>
      </div>
    </section>
  );
}
