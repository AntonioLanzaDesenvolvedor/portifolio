import { useState } from 'react';
import { motion } from 'framer-motion';
import { ArrowUpRight, Images, Lock } from 'lucide-react';
import { ProjectGalleryModal } from './ProjectGalleryModal';

type ProjectImage = {
  src: string;
  alt: string;
};

interface ProjectCardProps {
  title: string;
  eyebrow?: string;
  description: string;
  highlights: string[];
  tags?: string[];
  images?: ProjectImage[];
  projectUrl?: string;
}

export function ProjectCard({
  title,
  eyebrow = 'Projeto em destaque',
  description,
  highlights,
  tags = [],
  images = [],
  projectUrl,
}: ProjectCardProps) {
  const [isGalleryOpen, setIsGalleryOpen] = useState(false);
  const [activeIndex, setActiveIndex] = useState(0);

  const openUrl = (url?: string) => {
    if (!url) return;
    window.open(url, '_blank', 'noopener,noreferrer');
  };

  const openGallery = () => {
    if (!images.length) return;
    setActiveIndex(0);
    setIsGalleryOpen(true);
  };

  const closeGallery = () => {
    setIsGalleryOpen(false);
  };

  const goPrev = () => {
    if (images.length <= 1) return;
    setActiveIndex((prev) => (prev === 0 ? images.length - 1 : prev - 1));
  };

  const goNext = () => {
    if (images.length <= 1) return;
    setActiveIndex((prev) => (prev === images.length - 1 ? 0 : prev + 1));
  };

  return (
    <>
      <motion.article
        initial={{ opacity: 0, y: 24, scale: 0.985 }}
        whileInView={{ opacity: 1, y: 0, scale: 1 }}
        viewport={{ once: true, margin: '-60px' }}
        transition={{ duration: 0.45, ease: 'easeOut' }}
        className="group overflow-hidden rounded-[28px] border border-border/70 bg-card shadow-[0_12px_40px_rgba(15,23,42,0.08)]"
      >
        <div className="relative overflow-hidden bg-gradient-to-br from-primary/10 via-background to-background">
          <div className="absolute inset-0 pointer-events-none bg-[radial-gradient(circle_at_top_left,rgba(59,130,246,0.14),transparent_42%),radial-gradient(circle_at_bottom_right,rgba(99,102,241,0.10),transparent_40%)]" />

          <div className="relative p-6 sm:p-8 lg:p-10">
            <div className="mb-5 flex flex-wrap items-center gap-2">
              <span className="rounded-full border border-primary/20 bg-primary/10 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.18em] text-primary">
                {eyebrow}
              </span>

              {tags.map((tag) => (
                <span
                  key={tag}
                  className="rounded-full border border-border/70 bg-background/90 px-3 py-1.5 text-xs font-medium text-muted-foreground"
                >
                  {tag}
                </span>
              ))}
            </div>

            <div className="max-w-6xl">
              <h3 className="text-[2.2rem] font-bold tracking-tight text-foreground sm:text-[2.7rem] lg:text-[3.1rem]">
                {title}
              </h3>

              <p className="mt-6 text-[1.06rem] leading-9 text-muted-foreground sm:text-[1.14rem] lg:text-[1.22rem] lg:leading-10">
                {description}
              </p>
            </div>

            <div className="mt-9 grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
              {highlights.map((item) => (
                <div
                  key={item}
                  className="rounded-2xl border border-border/60 bg-background/85 p-5 backdrop-blur-sm transition-[background-color,border-color,box-shadow] duration-200 hover:border-primary/25 hover:bg-background hover:shadow-[0_12px_24px_rgba(15,23,42,0.05)]"
                >
                  <p className="text-[15px] font-semibold leading-7 text-foreground sm:text-[1rem] lg:text-[1.04rem]">
                    {item}
                  </p>
                </div>
              ))}
            </div>

            <div className="mt-9 flex flex-wrap items-center gap-3">
              {images.length > 0 ? (
                <button
                  type="button"
                  onClick={openGallery}
                  className="inline-flex cursor-pointer items-center gap-2 rounded-2xl bg-primary px-6 py-3.5 text-sm font-semibold text-primary-foreground shadow-[0_10px_20px_rgba(59,130,246,0.16)] transition-[background-color,border-color,box-shadow,filter] duration-200 hover:bg-primary/92 hover:shadow-[0_16px_30px_rgba(59,130,246,0.26)] focus:outline-none focus:ring-2 focus:ring-primary/30 active:brightness-[0.98]"
                  style={{
                    WebkitFontSmoothing: 'antialiased',
                    backfaceVisibility: 'hidden',
                    transform: 'translateZ(0)',
                  }}
                >
                  <span>Ver imagens</span>
                  <Images className="h-4 w-4 flex-shrink-0" />
                </button>
              ) : null}

              <div
                className="inline-flex items-center gap-2 rounded-full border border-border/60 bg-background/80 px-4 py-2 text-xs font-medium text-muted-foreground backdrop-blur-sm transition-all duration-200 hover:border-primary/25 hover:bg-background"
                style={{
                  WebkitFontSmoothing: 'antialiased',
                  backfaceVisibility: 'hidden',
                }}
              >
                <Lock className="h-3.5 w-3.5 flex-shrink-0" />
                <span>Repositório privado</span>
              </div>
            </div>
          </div>
        </div>
      </motion.article>

      <ProjectGalleryModal
        open={isGalleryOpen}
        images={images}
        activeIndex={activeIndex}
        onClose={closeGallery}
        onPrev={goPrev}
        onNext={goNext}
      />
    </>
  );
}