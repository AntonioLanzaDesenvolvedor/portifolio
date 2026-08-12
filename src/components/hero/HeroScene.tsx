import { useEffect, useRef } from 'react';
import { isSignificantSizeChange } from '@/lib/stable-size';
import { getLenisInstance } from '@/lib/lenis-instance';
import { cn } from '@/lib/utils';

type HeroSceneProps = {
  className?: string;
  reduced?: boolean;
  /** Number of stars */
  count?: number;
  /** Travel speed — must be > 0.3 for hyperspace streaks */
  speed?: number;
  /** Star color */
  starColor?: string;
  /** Enable twinkling */
  twinkle?: boolean;
};

type Star = {
  x: number;
  y: number;
  z: number;
  twinkleSpeed: number;
  twinkleOffset: number;
};

/**
 * Starfield from shadcn.io — same look on mobile and desktop.
 * Keeps animating during scroll (pausing looked frozen/broken).
 * https://www.shadcn.io/background/starfield
 */
export function HeroScene({
  className,
  reduced,
  count = 280,
  speed = 0.5,
  starColor = '#ffffff',
  twinkle = true,
}: HeroSceneProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (reduced) return;
    const canvas = canvasRef.current;
    const container = containerRef.current;
    if (!canvas || !container) return;

    const ctx = canvas.getContext('2d', { alpha: false });
    if (!ctx) return;

    const rect = container.getBoundingClientRect();
    let width = rect.width;
    let height = rect.height;
    canvas.width = width;
    canvas.height = height;

    let animationId = 0;
    let tick = 0;
    let running = false;
    const maxDepth = 1500;
    // Ignore URL-bar height jumps on mobile — resizing clears the bitmap
    const sizeThreshold = window.matchMedia('(pointer: coarse)').matches ? 140 : 64;

    const createStar = (): Star => ({
      x: (Math.random() - 0.5) * width * 2,
      y: (Math.random() - 0.5) * height * 2,
      z: Math.random() * maxDepth,
      twinkleSpeed: Math.random() * 0.02 + 0.01,
      twinkleOffset: Math.random() * Math.PI * 2,
    });

    const stars: Star[] = Array.from({ length: count }, createStar);

    const respawn = (star: Star) => {
      star.x = (Math.random() - 0.5) * width * 2;
      star.y = (Math.random() - 0.5) * height * 2;
      star.z = maxDepth;
    };

    const paint = () => {
      // Ghost trail kept — clear a bit harder so old bright tips don't stack into beads
      ctx.fillStyle = 'rgba(10, 10, 15, 0.28)';
      ctx.fillRect(0, 0, width, height);

      const cx = width / 2;
      const cy = height / 2;
      const edgePad = 48;
      const step = speed * 4;

      ctx.strokeStyle = starColor;
      ctx.fillStyle = starColor;
      ctx.lineCap = 'round';
      ctx.lineJoin = 'round';

      for (const star of stars) {
        star.z -= step;

        if (star.z <= 0) {
          respawn(star);
          continue;
        }

        const scale = 400 / star.z;
        const x = cx + star.x * scale;
        const y = cy + star.y * scale;

        let edgeFade = 1;
        if (x < edgePad) edgeFade = Math.min(edgeFade, x / edgePad);
        else if (x > width - edgePad) edgeFade = Math.min(edgeFade, (width - x) / edgePad);
        if (y < edgePad) edgeFade = Math.min(edgeFade, y / edgePad);
        else if (y > height - edgePad) edgeFade = Math.min(edgeFade, (height - y) / edgePad);

        if (edgeFade <= 0) {
          respawn(star);
          continue;
        }

        const near = 1 - star.z / maxDepth;
        const size = Math.max(0.5, near * 3);
        let opacity = (near * 0.9 + 0.1) * edgeFade;

        if (twinkle && star.twinkleSpeed > 0.015) {
          opacity *= 0.7 + 0.3 * Math.sin(tick * star.twinkleSpeed + star.twinkleOffset);
        }

        // Ribbon only when close — far stars stay as soft dots
        const trailStart = 0.58;
        if (near > trailStart && speed > 0.12) {
          const trailT = Math.min(1, (near - trailStart) / (1 - trailStart));
          const ribbon = Math.max(size * 2, 1);
          const lookback = 2 + Math.round(trailT * 5);

          ctx.beginPath();
          let started = false;
          for (let i = lookback; i >= 0; i--) {
            const z = star.z + step * i;
            if (z <= 0 || z > maxDepth) continue;
            const s = 400 / z;
            const sx = cx + star.x * s;
            const sy = cy + star.y * s;
            if (!started) {
              ctx.moveTo(sx, sy);
              started = true;
            } else {
              ctx.lineTo(sx, sy);
            }
          }
          if (started) {
            ctx.globalAlpha = opacity * (0.28 + trailT * 0.28);
            ctx.lineWidth = ribbon;
            ctx.stroke();
          }
        }

        ctx.beginPath();
        ctx.arc(x, y, size, 0, Math.PI * 2);
        ctx.globalAlpha = opacity;
        ctx.fill();
      }

      ctx.globalAlpha = 1;
    };

    const handleResize = () => {
      const next = container.getBoundingClientRect();
      // Width-only matters for layout; height jitter from the URL bar must not wipe the canvas
      if (!isSignificantSizeChange(width, height, next.width, next.height, sizeThreshold)) return;
      if (Math.abs(next.width - width) < 1 && Math.abs(next.height - height) < sizeThreshold) return;
      width = next.width;
      height = next.height;
      canvas.width = width;
      canvas.height = height;
      ctx.fillStyle = '#0a0a0f';
      ctx.fillRect(0, 0, width, height);
      // Immediate redraw so a resize never leaves a blank field
      tick++;
      paint();
    };

    const ro = new ResizeObserver(handleResize);
    ro.observe(container);

    const animate = () => {
      if (!running) return;
      tick++;
      // Half-rate while still plenty smooth — leaves headroom for Lenis on section transitions
      if (tick % 2 === 0) paint();
      animationId = requestAnimationFrame(animate);
    };

    const start = () => {
      if (running || document.hidden) return;
      running = true;
      animationId = requestAnimationFrame(animate);
    };

    const stop = () => {
      running = false;
      cancelAnimationFrame(animationId);
    };

    // Fixed chapter layer fades via opacity — stop RAF when fully hidden (frees GPU for Projects)
    const chapterLayer = () => {
      let n: HTMLElement | null = container;
      while (n) {
        if (n.classList.contains('fixed')) return n;
        n = n.parentElement;
      }
      return null;
    };
    const syncChapterFade = () => {
      const layer = chapterLayer();
      if (!layer) return;
      const op = parseFloat(layer.style.opacity || getComputedStyle(layer).opacity || '1');
      // Hysteresis — stop Hero early so Skills galaxy doesn't share the GPU mid-scroll
      if (op < 0.22) stop();
      else if (op >= 0.4 && !document.hidden) start();
    };

    ctx.fillStyle = '#0a0a0f';
    ctx.fillRect(0, 0, width, height);
    start();

    const onVis = () => {
      if (document.hidden) stop();
      else syncChapterFade();
    };
    document.addEventListener('visibilitychange', onVis);
    window.addEventListener('scroll', syncChapterFade, { passive: true });

    let lenisOff: (() => void) | null = null;
    const bindLenisFade = () => {
      const lenis = getLenisInstance();
      if (!lenis || lenisOff) return;
      lenis.on('scroll', syncChapterFade);
      lenisOff = () => lenis.off('scroll', syncChapterFade);
    };
    bindLenisFade();
    const lenisRetry = window.setInterval(() => {
      bindLenisFade();
      if (lenisOff) window.clearInterval(lenisRetry);
    }, 50);
    window.setTimeout(() => window.clearInterval(lenisRetry), 2000);

    syncChapterFade();
    const fadePoll = window.setInterval(syncChapterFade, 500);

    return () => {
      stop();
      ro.disconnect();
      window.clearInterval(lenisRetry);
      window.clearInterval(fadePoll);
      lenisOff?.();
      document.removeEventListener('visibilitychange', onVis);
      window.removeEventListener('scroll', syncChapterFade);
    };
  }, [reduced, count, speed, starColor, twinkle]);

  if (reduced) {
    return (
      <div
        className={cn('absolute inset-0 overflow-hidden bg-[#0a0a0f]', className)}
        style={{
          background:
            'radial-gradient(ellipse at 30% 40%, rgba(56,100,180,0.15) 0%, transparent 50%), radial-gradient(ellipse at 70% 60%, rgba(100,60,150,0.1) 0%, transparent 50%), #0a0a0f',
        }}
        aria-hidden
      />
    );
  }

  return (
    <div
      ref={containerRef}
      className={cn('absolute inset-0 overflow-hidden bg-[#0a0a0f]', className)}
      aria-hidden
    >
      <canvas ref={canvasRef} className="absolute inset-0 h-full w-full" />
      <div
        className="pointer-events-none absolute inset-0 opacity-30"
        style={{
          background:
            'radial-gradient(ellipse at 30% 40%, rgba(56, 100, 180, 0.15) 0%, transparent 50%), radial-gradient(ellipse at 70% 60%, rgba(100, 60, 150, 0.1) 0%, transparent 50%)',
        }}
      />
    </div>
  );
}
