import { useEffect, useRef } from 'react';
import { isSignificantSizeChange } from '@/lib/stable-size';
import { cn } from '@/lib/utils';

type HeroSceneProps = {
  className?: string;
  reduced?: boolean;
  /** Number of stars */
  count?: number;
  /** Travel speed — must be > 0.3 for hyperspace streaks. Ignored when static. */
  speed?: number;
  /** Star color */
  starColor?: string;
  /** Enable twinkling */
  twinkle?: boolean;
  /** No depth/parallax motion — use on mobile to avoid scroll flicker */
  staticField?: boolean;
};

type Star = {
  x: number;
  y: number;
  z: number;
  twinkleSpeed: number;
  twinkleOffset: number;
};

type FlatStar = {
  x: number;
  y: number;
  size: number;
  opacity: number;
  twinkleSpeed: number;
  twinkleOffset: number;
};

/**
 * Exact Starfield from shadcn.io — always live from mount.
 * https://www.shadcn.io/background/starfield
 * Mobile: pass staticField to disable hyperspace parallax.
 */
export function HeroScene({
  className,
  reduced,
  count = 400,
  speed = 0.5,
  starColor = '#ffffff',
  twinkle = true,
  staticField = false,
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
    let running = document.visibilityState === 'visible';
    const maxDepth = 1500;
    const mobile = window.matchMedia('(max-width: 768px), (pointer: coarse)').matches;
    const flat = staticField || mobile;
    let redrawFlat: ((force?: boolean) => void) | null = null;

    const handleResize = () => {
      const next = container.getBoundingClientRect();
      if (!isSignificantSizeChange(width, height, next.width, next.height)) return;
      width = next.width;
      height = next.height;
      canvas.width = width;
      canvas.height = height;
      ctx.fillStyle = '#0a0a0f';
      ctx.fillRect(0, 0, width, height);
      redrawFlat?.(true);
    };

    const ro = new ResizeObserver(handleResize);
    ro.observe(container);

    // --- Static field (no depth parallax) ---
    if (flat) {
      const flatStars: FlatStar[] = Array.from({ length: count }, () => ({
        x: Math.random(),
        y: Math.random(),
        size: 0.5 + Math.random() * 1.6,
        opacity: 0.25 + Math.random() * 0.65,
        twinkleSpeed: 0.4 + Math.random() * 0.9,
        twinkleOffset: Math.random() * Math.PI * 2,
      }));

      const drawFlat = (force = false) => {
        if (!running && !force) return;
        tick++;
        ctx.fillStyle = '#0a0a0f';
        ctx.fillRect(0, 0, width, height);

        for (const star of flatStars) {
          const tw = twinkle
            ? 0.9 + 0.1 * Math.sin(tick * 0.012 * star.twinkleSpeed + star.twinkleOffset)
            : 1;
          ctx.globalAlpha = star.opacity * tw;
          ctx.fillStyle = starColor;
          ctx.beginPath();
          ctx.arc(star.x * width, star.y * height, star.size, 0, Math.PI * 2);
          ctx.fill();
        }
        ctx.globalAlpha = 1;

        if (twinkle && running) {
          animationId = requestAnimationFrame(() => drawFlat());
        }
      };
      redrawFlat = drawFlat;

      drawFlat(true);
      if (twinkle) animationId = requestAnimationFrame(() => drawFlat());

      const onVis = () => {
        const show = document.visibilityState === 'visible';
        if (show && !running) {
          running = true;
          if (twinkle) animationId = requestAnimationFrame(() => drawFlat());
          else drawFlat(true);
        } else if (!show) {
          running = false;
          cancelAnimationFrame(animationId);
        }
      };
      document.addEventListener('visibilitychange', onVis);

      return () => {
        running = false;
        cancelAnimationFrame(animationId);
        ro.disconnect();
        document.removeEventListener('visibilitychange', onVis);
      };
    }

    // --- Desktop hyperspace field ---
    const createStar = (): Star => ({
      x: (Math.random() - 0.5) * width * 2,
      y: (Math.random() - 0.5) * height * 2,
      z: Math.random() * maxDepth,
      twinkleSpeed: Math.random() * 0.02 + 0.01,
      twinkleOffset: Math.random() * Math.PI * 2,
    });

    const stars: Star[] = Array.from({ length: count }, createStar);

    const animate = () => {
      if (!running) return;
      tick++;

      ctx.fillStyle = 'rgba(10, 10, 15, 0.2)';
      ctx.fillRect(0, 0, width, height);

      const cx = width / 2;
      const cy = height / 2;

      for (const star of stars) {
        star.z -= speed * 2;

        if (star.z <= 0) {
          star.x = (Math.random() - 0.5) * width * 2;
          star.y = (Math.random() - 0.5) * height * 2;
          star.z = maxDepth;
        }

        const scale = 400 / star.z;
        const x = cx + star.x * scale;
        const y = cy + star.y * scale;

        if (x < -10 || x > width + 10 || y < -10 || y > height + 10) continue;

        const size = Math.max(0.5, (1 - star.z / maxDepth) * 3);
        let opacity = (1 - star.z / maxDepth) * 0.9 + 0.1;

        if (twinkle && star.twinkleSpeed > 0.015) {
          opacity *= 0.7 + 0.3 * Math.sin(tick * star.twinkleSpeed + star.twinkleOffset);
        }

        ctx.beginPath();
        ctx.arc(x, y, size, 0, Math.PI * 2);
        ctx.fillStyle = starColor;
        ctx.globalAlpha = opacity;
        ctx.fill();

        if (star.z < maxDepth * 0.3 && speed > 0.3) {
          const streakLength = (1 - star.z / maxDepth) * speed * 8;
          const angle = Math.atan2(star.y, star.x);
          ctx.beginPath();
          ctx.moveTo(x, y);
          ctx.lineTo(x - Math.cos(angle) * streakLength, y - Math.sin(angle) * streakLength);
          ctx.strokeStyle = starColor;
          ctx.globalAlpha = opacity * 0.3;
          ctx.lineWidth = size * 0.5;
          ctx.stroke();
        }
      }

      ctx.globalAlpha = 1;
      animationId = requestAnimationFrame(animate);
    };

    ctx.fillStyle = '#0a0a0f';
    ctx.fillRect(0, 0, width, height);
    animationId = requestAnimationFrame(animate);

    const onVis = () => {
      const show = document.visibilityState === 'visible';
      if (show && !running) {
        running = true;
        animationId = requestAnimationFrame(animate);
      } else if (!show) {
        running = false;
        cancelAnimationFrame(animationId);
      }
    };
    document.addEventListener('visibilitychange', onVis);

    return () => {
      running = false;
      cancelAnimationFrame(animationId);
      ro.disconnect();
      document.removeEventListener('visibilitychange', onVis);
    };
  }, [reduced, count, speed, starColor, twinkle, staticField]);

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
        className="pointer-events-none absolute inset-0 opacity-40 md:opacity-30"
        style={{
          background:
            'radial-gradient(ellipse at 30% 40%, rgba(56, 100, 180, 0.22) 0%, transparent 50%), radial-gradient(ellipse at 70% 60%, rgba(100, 60, 150, 0.16) 0%, transparent 50%)',
        }}
      />
    </div>
  );
}
