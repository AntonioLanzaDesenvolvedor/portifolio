import { useEffect } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { ChevronLeft, ChevronRight, X } from 'lucide-react';

type ProjectImage = {
  src: string;
  alt: string;
};

interface ProjectGalleryModalProps {
  open: boolean;
  images: ProjectImage[];
  activeIndex: number;
  onClose: () => void;
  onPrev: () => void;
  onNext: () => void;
}

const shellTransition = {
  duration: 0.28,
  ease: [0.22, 1, 0.36, 1] as const,
};

const controlsTransition = {
  duration: 0.2,
  delay: 0.1,
  ease: [0.22, 1, 0.36, 1] as const,
};

export function ProjectGalleryModal({
  open,
  images,
  activeIndex,
  onClose,
  onPrev,
  onNext,
}: ProjectGalleryModalProps) {
  const activeImage = images[activeIndex] ?? null;
  const hasMultipleImages = images.length > 1;

  useEffect(() => {
    if (!open) return;

    const previousBodyOverflow = document.body.style.overflow;
    const previousBodyPaddingRight = document.body.style.paddingRight;

    const scrollbarWidth = window.innerWidth - document.documentElement.clientWidth;

    document.body.style.overflow = 'hidden';
    if (scrollbarWidth > 0) {
      document.body.style.paddingRight = `${scrollbarWidth}px`;
    }

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') onClose();
      if (event.key === 'ArrowLeft' && hasMultipleImages) onPrev();
      if (event.key === 'ArrowRight' && hasMultipleImages) onNext();
    };

    window.addEventListener('keydown', handleKeyDown);

    return () => {
      document.body.style.overflow = previousBodyOverflow;
      document.body.style.paddingRight = previousBodyPaddingRight;
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [open, onClose, onPrev, onNext, hasMultipleImages]);

  return (
    <AnimatePresence mode="wait">
      {open ? (
        <motion.div
          key="gallery-overlay"
          className="fixed inset-0 z-[120] bg-black/80 backdrop-blur-sm"
          initial={{ opacity: 0, backdropFilter: 'blur(0px)' }}
          animate={{ opacity: 1, backdropFilter: 'blur(4px)' }}
          exit={{ opacity: 0, backdropFilter: 'blur(0px)' }}
          transition={shellTransition}
        >
          <button
            type="button"
            onClick={onClose}
            aria-label="Fechar modal"
            className="absolute inset-0 h-full w-full cursor-pointer"
          />

          <div className="relative z-10 flex h-full w-full items-center justify-center px-4 py-6 sm:px-6 lg:px-10">
            {activeImage ? (
              <motion.div
                key={`gallery-shell-${activeImage.src}`}
                initial={{ opacity: 0, y: 28, scale: 0.965 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: 18, scale: 0.975 }}
                transition={shellTransition}
                className="relative flex w-full max-w-[96vw] items-center justify-center"
              >
                {hasMultipleImages ? (
                  <motion.button
                    type="button"
                    onClick={onPrev}
                    aria-label="Imagem anterior"
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: -6 }}
                    transition={controlsTransition}
                    className="mr-3 hidden h-12 w-12 flex-shrink-0 cursor-pointer items-center justify-center rounded-full border border-white/20 bg-black/55 text-white shadow-[0_10px_30px_rgba(0,0,0,0.28)] backdrop-blur transition-[background-color,border-color,box-shadow,color,filter] duration-200 hover:border-white/40 hover:bg-white hover:text-black hover:shadow-[0_16px_36px_rgba(255,255,255,0.16)] sm:inline-flex lg:mr-5 lg:h-14 lg:w-14"
                    style={{
                      WebkitFontSmoothing: 'antialiased',
                      backfaceVisibility: 'hidden',
                      transform: 'translateZ(0)',
                    }}
                  >
                    <ChevronLeft className="h-5 w-5 lg:h-6 lg:w-6" />
                  </motion.button>
                ) : (
                  <div className="hidden w-12 flex-shrink-0 sm:block lg:w-14" />
                )}

                <div className="relative flex max-h-[88vh] max-w-[88vw] flex-col items-center">
                    <motion.button
                    type="button"
                    onClick={onClose}
                    aria-label="Fechar"
                    initial={{ opacity: 0, y: -8 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -6 }}
                    transition={controlsTransition}
                    className="mb-3 inline-flex h-11 w-11 min-h-11 min-w-11 flex-shrink-0 cursor-pointer items-center justify-center self-end rounded-full border border-white/20 bg-black/55 text-white shadow-[0_10px_30px_rgba(0,0,0,0.28)] backdrop-blur transition-[background-color,border-color,box-shadow,color,filter] duration-200 hover:border-white/40 hover:bg-white hover:text-black hover:shadow-[0_16px_36px_rgba(255,255,255,0.16)]"
                    style={{
                        WebkitFontSmoothing: 'antialiased',
                        backfaceVisibility: 'hidden',
                        transform: 'translateZ(0)',
                        aspectRatio: '1 / 1',
                    }}
                    >
                    <X className="h-5 w-5 flex-shrink-0" />
                    </motion.button>

                  <AnimatePresence mode="wait">
                    <motion.img
                      key={activeImage.src}
                      src={activeImage.src}
                      alt={activeImage.alt}
                      loading="eager"
                      decoding="async"
                      draggable={false}
                      initial={{ opacity: 0, scale: 0.985, y: 8 }}
                      animate={{ opacity: 1, scale: 1, y: 0 }}
                      exit={{ opacity: 0, scale: 1.01, y: -4 }}
                      transition={{ duration: 0.22, ease: [0.22, 1, 0.36, 1] }}
                      className="block max-h-[77vh] max-w-[88vw] rounded-2xl border border-white/10 bg-[#0b1120] object-contain shadow-[0_30px_100px_rgba(0,0,0,0.45)]"
                      style={{
                        imageRendering: 'auto',
                        transform: 'translateZ(0)',
                        WebkitBackfaceVisibility: 'hidden',
                      }}
                    />
                  </AnimatePresence>

                  {hasMultipleImages ? (
                    <motion.div
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: 6 }}
                      transition={{ ...controlsTransition, delay: 0.12 }}
                      className="mt-4 flex items-center gap-2 rounded-full border border-white/10 bg-black/45 px-3 py-2 backdrop-blur"
                    >
                      {images.map((_, index) => {
                        const isActive = index === activeIndex;

                        return (
                          <span
                            key={index}
                            className={[
                              'h-2 rounded-full transition-all duration-300',
                              isActive ? 'w-6 bg-white' : 'w-2 bg-white/40',
                            ].join(' ')}
                          />
                        );
                      })}
                    </motion.div>
                  ) : null}
                </div>

                {hasMultipleImages ? (
                  <motion.button
                    type="button"
                    onClick={onNext}
                    aria-label="Próxima imagem"
                    initial={{ opacity: 0, x: 10 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: 6 }}
                    transition={controlsTransition}
                    className="ml-3 hidden h-12 w-12 flex-shrink-0 cursor-pointer items-center justify-center rounded-full border border-white/20 bg-black/55 text-white shadow-[0_10px_30px_rgba(0,0,0,0.28)] backdrop-blur transition-[background-color,border-color,box-shadow,color,filter] duration-200 hover:border-white/40 hover:bg-white hover:text-black hover:shadow-[0_16px_36px_rgba(255,255,255,0.16)] sm:inline-flex lg:ml-5 lg:h-14 lg:w-14"
                    style={{
                      WebkitFontSmoothing: 'antialiased',
                      backfaceVisibility: 'hidden',
                      transform: 'translateZ(0)',
                    }}
                  >
                    <ChevronRight className="h-5 w-5 lg:h-6 lg:w-6" />
                  </motion.button>
                ) : (
                  <div className="hidden w-12 flex-shrink-0 sm:block lg:w-14" />
                )}

                {hasMultipleImages ? (
                  <>
                    <motion.button
                      type="button"
                      onClick={onPrev}
                      aria-label="Imagem anterior"
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      exit={{ opacity: 0 }}
                      transition={{ ...controlsTransition, delay: 0.1 }}
                      className="absolute left-0 top-1/2 inline-flex h-11 w-11 -translate-y-1/2 cursor-pointer items-center justify-center rounded-full border border-white/20 bg-black/55 text-white shadow-[0_10px_30px_rgba(0,0,0,0.28)] backdrop-blur transition-[background-color,border-color,box-shadow,color] duration-200 hover:border-white/40 hover:bg-white hover:text-black sm:hidden"
                    >
                      <ChevronLeft className="h-5 w-5" />
                    </motion.button>

                    <motion.button
                      type="button"
                      onClick={onNext}
                      aria-label="Próxima imagem"
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      exit={{ opacity: 0 }}
                      transition={{ ...controlsTransition, delay: 0.1 }}
                      className="absolute right-0 top-1/2 inline-flex h-11 w-11 -translate-y-1/2 cursor-pointer items-center justify-center rounded-full border border-white/20 bg-black/55 text-white shadow-[0_10px_30px_rgba(0,0,0,0.28)] backdrop-blur transition-[background-color,border-color,box-shadow,color] duration-200 hover:border-white/40 hover:bg-white hover:text-black sm:hidden"
                    >
                      <ChevronRight className="h-5 w-5" />
                    </motion.button>
                  </>
                ) : null}
              </motion.div>
            ) : null}
          </div>
        </motion.div>
      ) : null}
    </AnimatePresence>
  );
}