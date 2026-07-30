import { useEffect, useRef } from 'react';
import { isSignificantSizeChange } from '@/lib/stable-size';
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
 * Exact Starfield from shadcn.io — always live from mount.
 * https://www.shadcn.io/background/starfield
 */
export function HeroScene({
  className,
  reduced,
  count = 400,
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

    const ctx = canvas.getContext('2d');
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

    const createStar = (): Star => ({
      x: (Math.random() - 0.5) * width * 2,
      y: (Math.random() - 0.5) * height * 2,
      z: Math.random() * maxDepth,
      twinkleSpeed: Math.random() * 0.02 + 0.01,
      twinkleOffset: Math.random() * Math.PI * 2,
    });

    const stars: Star[] = Array.from({ length: count }, createStar);

    const handleResize = () => {
      const next = container.getBoundingClientRect();
      if (!isSignificantSizeChange(width, height, next.width, next.height)) return;
      width = next.width;
      height = next.height;
      canvas.width = width;
      canvas.height = height;
      ctx.fillStyle = '#0a0a0f';
      ctx.fillRect(0, 0, width, height);
    };

    const ro = new ResizeObserver(handleResize);
    ro.observe(container);

    const animate = () => {
      if (!running) return;
      tick++;

      // Fade for trails — exact shadcn.io
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
