import { useEffect, useRef } from 'react';
import { cn } from '@/lib/utils';

type AboutGalaxyProps = {
  className?: string;
  starCount?: number;
  fieldCount?: number;
  armCount?: number;
  /** Radians per second */
  rotationSpeed?: number;
  background?: string;
  /** When true, no solid clear — blends over shared starfield */
  transparent?: boolean;
};

type SpiralStar = {
  theta: number;
  radius: number;
  size: number;
  brightness: number;
  twinkleSpeed: number;
  twinklePhase: number;
  spinBias: number;
};

type FieldStar = {
  x: number;
  y: number;
  z: number;
  size: number;
  twinkleSpeed: number;
  twinkleOffset: number;
};

type Dust = {
  theta: number;
  radius: number;
  size: number;
  alpha: number;
  pulseSpeed: number;
  pulsePhase: number;
  /** 0 = hero blue, 1 = hero purple */
  hue: number;
};

function mulberry32(seed: number) {
  let s = seed >>> 0;
  return () => {
    s = (s + 0x6d2b79f5) >>> 0;
    let t = Math.imul(s ^ (s >>> 15), 1 | s);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

/** Hero nebula palette — same as HeroScene overlays */
const HERO_BLUE: [number, number, number] = [56, 100, 180];
const HERO_PURPLE: [number, number, number] = [100, 60, 150];
const HERO_STAR = '#ffffff';

/**
 * Galaxy that continues the Hero starfield language:
 * white stars + blue/purple nebula on #0a0a0f, with a soft spiral formation.
 */
export function AboutGalaxy({
  className,
  starCount = 1100,
  fieldCount = 220,
  armCount = 4,
  rotationSpeed = 0.05,
  background = '#0a0a0f',
  transparent = false,
}: AboutGalaxyProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const container = containerRef.current;
    const canvas = canvasRef.current;
    if (!container || !canvas) return;

    const ctx = canvas.getContext('2d', { alpha: true });
    if (!ctx) return;

    const prefersReduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    const mobile = window.matchMedia('(max-width: 768px), (pointer: coarse)').matches;
    const spiralN = mobile ? Math.min(starCount, 420) : starCount;
    const fieldN = mobile ? Math.min(fieldCount, 48) : fieldCount;

    const rand = mulberry32((0x9e3779b1 ^ (131 * armCount) ^ spiralN) >>> 0);
    const spiralTurns = 4 * Math.PI;

    // Ambient field — same white star vocabulary as Hero
    const field: FieldStar[] = [];
    for (let i = 0; i < fieldN; i++) {
      field.push({
        x: (rand() - 0.5) * 2,
        y: (rand() - 0.5) * 2,
        z: 0.35 + rand() * 0.65,
        size: 0.6 + rand() * 1.4,
        twinkleSpeed: 0.4 + rand() * 1.6,
        twinkleOffset: rand() * Math.PI * 2,
      });
    }

    const stars: SpiralStar[] = [];
    for (let i = 0; i < spiralN; i++) {
      const armOffset = ((i % armCount) / armCount) * Math.PI * 2;
      const h = Math.sqrt(rand());
      const spiralTheta = h * spiralTurns + armOffset;
      let radius = (Math.exp(0.25 * h * spiralTurns) - 1) / (Math.exp(0.25 * spiralTurns) - 1);
      const scatter = (rand() - 0.5) * 0.42;
      radius = Math.max(0.02, Math.min(1, radius + (rand() - 0.5) * 0.08));

      const roll = rand();
      const theta = roll < 0.12 ? rand() * Math.PI * 2 : spiralTheta + scatter;
      const r = roll < 0.12 ? rand() : radius;

      stars.push({
        theta,
        radius: r,
        size: 0.5 + 1.45 * rand(),
        brightness: 0.35 + 0.55 * rand(),
        twinkleSpeed: 1.0 + 2.8 * rand(),
        twinklePhase: rand() * Math.PI * 2,
        spinBias: 1.3 - r * 0.5 + (rand() - 0.5) * 0.12,
      });
    }

    const dustCount = mobile ? 8 : 11;
    const dust: Dust[] = [];
    for (let i = 0; i < dustCount; i++) {
      const armOffset = ((i % armCount) / armCount) * Math.PI * 2;
      const theta = (0.25 + 0.65 * rand()) * spiralTurns + armOffset + (rand() - 0.5) * 0.35;
      dust.push({
        theta,
        radius: 0.22 + 0.58 * rand(),
        size: 0.22 + 0.3 * rand(),
        alpha: 0.07 + 0.1 * rand(),
        pulseSpeed: 0.3 + 0.5 * rand(),
        pulsePhase: rand() * Math.PI * 2,
        hue: i % 2 === 0 ? 0 : 1,
      });
    }

    const dustColor = (hue: number, a: number) => {
      const c = hue < 0.5 ? HERO_BLUE : HERO_PURPLE;
      return `rgba(${c[0]}, ${c[1]}, ${c[2]}, ${a})`;
    };

    let width = 0;
    let height = 0;
    let elapsed = 0;
    let lastTs = 0;
    let raf = 0;
    let running = false;
    let inView = true;

    let targetParallaxX = 0;
    let targetParallaxY = 0;
    let parallaxX = 0;
    let parallaxY = 0;

    const resize = () => {
      const rect = container.getBoundingClientRect();
      width = rect.width;
      height = rect.height;
      const dpr = Math.min(window.devicePixelRatio || 1, mobile ? 1 : 1.75);
      canvas.width = Math.max(1, Math.floor(width * dpr));
      canvas.height = Math.max(1, Math.floor(height * dpr));
      canvas.style.width = `${width}px`;
      canvas.style.height = `${height}px`;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    };

    const draw = () => {
      if (!width || !height) return;

      const tSec = elapsed * 0.001;
      const cx = width / 2 + parallaxX;
      const cy = height * 0.48 + parallaxY;
      const minSide = Math.min(width, height);
      const breathe = 1 + (mobile ? 0.012 : 0.028) * Math.sin(tSec * 0.5);
      const scale = 0.58 * minSide * breathe;
      const baseSpin = tSec * rotationSpeed;

      if (transparent) {
        ctx.clearRect(0, 0, width, height);
      } else {
        ctx.fillStyle = background;
        ctx.fillRect(0, 0, width, height);
      }

      // 1) Ambient starfield — Hero vocabulary (white dots in deep space)
      ctx.globalCompositeOperation = 'source-over';
      for (const s of field) {
        const px = cx + s.x * width * 0.55 * s.z;
        const py = cy + s.y * height * 0.55 * s.z;
        // Soft twinkle on mobile — hard blinks read as screen flicker
        const tw = mobile
          ? 0.88 + 0.12 * Math.sin(tSec * s.twinkleSpeed * 0.55 + s.twinkleOffset)
          : 0.65 + 0.35 * Math.sin(tSec * s.twinkleSpeed + s.twinkleOffset);
        const alpha = (0.25 + 0.45 * (1 - s.z)) * tw;
        const size = s.size * (0.7 + 0.4 * (1 - s.z));
        ctx.globalAlpha = alpha;
        ctx.fillStyle = HERO_STAR;
        ctx.beginPath();
        ctx.arc(px, py, size, 0, Math.PI * 2);
        ctx.fill();
      }
      ctx.globalAlpha = 1;

      // 2) Nebula dust — Hero blue / purple
      // Avoid 'lighter' on mobile GPUs (compositing flicker)
      ctx.globalCompositeOperation = mobile ? 'source-over' : 'lighter';
      for (const cloud of dust) {
        const pulse = mobile
          ? 0.9 + 0.1 * Math.sin(tSec * cloud.pulseSpeed + cloud.pulsePhase)
          : 0.75 + 0.25 * Math.sin(tSec * cloud.pulseSpeed + cloud.pulsePhase);
        const theta = cloud.theta + baseSpin * (1.12 - cloud.radius * 0.35);
        const dist = cloud.radius * scale;
        const x = cx + Math.cos(theta) * dist;
        const y = cy + Math.sin(theta) * dist;
        const radius = cloud.size * scale * (0.92 + 0.12 * pulse);
        const grad = ctx.createRadialGradient(x, y, 0, x, y, radius);
        const aMul = mobile ? 0.85 : 1;
        grad.addColorStop(0, dustColor(cloud.hue, cloud.alpha * pulse * aMul));
        grad.addColorStop(0.55, dustColor(cloud.hue, cloud.alpha * pulse * 0.32 * aMul));
        grad.addColorStop(1, dustColor(cloud.hue, 0));
        ctx.fillStyle = grad;
        ctx.beginPath();
        ctx.arc(x, y, radius, 0, Math.PI * 2);
        ctx.fill();
      }

      // 3) Soft cool core — faint, not a spotlight
      ctx.globalCompositeOperation = 'source-over';
      const corePulse = 0.97 + 0.03 * Math.sin(tSec * 0.45);
      const coreR = 0.11 * minSide * corePulse;
      const coreGrad = ctx.createRadialGradient(cx, cy, 0, cx, cy, coreR);
      coreGrad.addColorStop(0, 'rgba(220, 230, 255, 0.22)');
      coreGrad.addColorStop(0.35, 'rgba(56, 100, 180, 0.1)');
      coreGrad.addColorStop(0.7, 'rgba(100, 60, 150, 0.05)');
      coreGrad.addColorStop(1, 'rgba(10, 10, 15, 0)');
      ctx.fillStyle = coreGrad;
      ctx.beginPath();
      ctx.arc(cx, cy, coreR, 0, Math.PI * 2);
      ctx.fill();

      // 4) Spiral stars — white like Hero, slight cool tint
      ctx.globalCompositeOperation = mobile ? 'source-over' : 'lighter';
      for (let i = 0; i < stars.length; i++) {
        const star = stars[i];
        const theta = star.theta + baseSpin * star.spinBias;
        const dist = star.radius * scale;
        const x = cx + Math.cos(theta) * dist;
        const y = cy + Math.sin(theta) * dist;

        if (x < -4 || x > width + 4 || y < -4 || y > height + 4) continue;

        const twinkle = mobile
          ? 0.82 + 0.18 * Math.sin(tSec * star.twinkleSpeed * 0.45 + star.twinklePhase)
          : 0.5 + 0.5 * Math.sin(tSec * star.twinkleSpeed + star.twinklePhase);
        const centerFade = 0.55 + 0.45 * Math.min(1, star.radius * 1.8);
        const alpha = star.brightness * twinkle * centerFade;
        const size = star.size * (mobile ? 0.9 : 0.85 + 0.18 * twinkle);

        // Outer arms cooler/blue-ish, overall still white-forward
        const cool = Math.min(1, star.radius);
        const r = Math.round(255 - cool * 18);
        const g = Math.round(255 - cool * 8);
        const b = 255;

        ctx.fillStyle = `rgba(${r},${g},${b}, ${alpha})`;
        ctx.beginPath();
        ctx.arc(x, y, size * 0.55, 0, Math.PI * 2);
        ctx.fill();
      }
      ctx.globalCompositeOperation = 'source-over';
    };

    const tick = (ts: number) => {
      if (!running) return;
      const dt = lastTs === 0 ? 16 : Math.min(48, ts - lastTs);
      lastTs = ts;
      elapsed += dt;

      parallaxX += (targetParallaxX - parallaxX) * 0.06;
      parallaxY += (targetParallaxY - parallaxY) * 0.06;

      draw();
      raf = requestAnimationFrame(tick);
    };

    const start = () => {
      if (running || prefersReduced || !inView || document.hidden) return;
      running = true;
      lastTs = 0;
      raf = requestAnimationFrame(tick);
    };

    const stop = () => {
      running = false;
      lastTs = 0;
      cancelAnimationFrame(raf);
    };

    const onPointerMove = (e: PointerEvent) => {
      if (mobile || prefersReduced) return;
      const rect = container.getBoundingClientRect();
      const nx = ((e.clientX - rect.left) / Math.max(1, rect.width) - 0.5) * 2;
      const ny = ((e.clientY - rect.top) / Math.max(1, rect.height) - 0.5) * 2;
      targetParallaxX = nx * 24;
      targetParallaxY = ny * 16;
    };

    const onPointerLeave = () => {
      targetParallaxX = 0;
      targetParallaxY = 0;
    };

    resize();
    if (prefersReduced) draw();
    else start();

    const ro = new ResizeObserver(() => {
      stop();
      resize();
      if (prefersReduced) draw();
      else start();
    });
    ro.observe(container);

    const io = new IntersectionObserver(
      ([entry]) => {
        inView = entry.isIntersecting;
        if (inView) start();
        else stop();
      },
      { rootMargin: '120px' },
    );
    io.observe(container);

    const onVis = () => {
      if (document.hidden) stop();
      else start();
    };

    window.addEventListener('pointermove', onPointerMove, { passive: true });
    container.addEventListener('pointerleave', onPointerLeave);
    document.addEventListener('visibilitychange', onVis);

    return () => {
      stop();
      ro.disconnect();
      io.disconnect();
      window.removeEventListener('pointermove', onPointerMove);
      container.removeEventListener('pointerleave', onPointerLeave);
      document.removeEventListener('visibilitychange', onVis);
    };
  }, [starCount, fieldCount, armCount, rotationSpeed, background, transparent]);

  return (
    <div
      ref={containerRef}
      className={cn('absolute inset-0 overflow-hidden', className)}
      style={transparent ? undefined : { background }}
      aria-hidden
    >
      <canvas ref={canvasRef} className="absolute inset-0 h-full w-full" />
      {/* Same nebula wash as HeroScene — only when standalone */}
      {!transparent && (
        <>
          <div
            className="pointer-events-none absolute inset-0 opacity-30"
            style={{
              background:
                'radial-gradient(ellipse at 30% 40%, rgba(56, 100, 180, 0.15) 0%, transparent 50%), radial-gradient(ellipse at 70% 60%, rgba(100, 60, 150, 0.1) 0%, transparent 50%)',
            }}
          />
          <div
            className="pointer-events-none absolute inset-0"
            style={{
              background:
                'radial-gradient(ellipse at center, transparent 0%, transparent 42%, rgba(5,5,10,0.75) 100%)',
            }}
          />
        </>
      )}
    </div>
  );
}
