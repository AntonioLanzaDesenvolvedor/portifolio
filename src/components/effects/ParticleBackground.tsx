import { useEffect, useRef } from 'react';
import { useEntrance } from '@/hooks/use-entrance';
import { isSignificantSizeChange } from '@/lib/stable-size';

type Particle = {
  x: number;
  y: number;
  vx: number;
  vy: number;
  size: number;
  opacity: number;
};

const CONNECTION_DISTANCE = 130;
const PARTICLE_DENSITY_DESKTOP = 11000;
const PARTICLE_DENSITY_MOBILE = 18000;

function createParticle(width: number, height: number): Particle {
  const speed = Math.random() * 0.22 + 0.06;
  const angle = Math.random() * Math.PI * 2;
  return {
    x: Math.random() * width,
    y: Math.random() * height,
    vx: Math.cos(angle) * speed,
    vy: Math.sin(angle) * speed,
    size: Math.random() * 1.3 + 0.5,
    opacity: Math.random() * 0.4 + 0.12,
  };
}

function getContactIntensity() {
  const el = document.getElementById('contact');
  if (!el) return 0;

  const rect = el.getBoundingClientRect();
  const vh = window.innerHeight;
  const visible = Math.min(rect.bottom, vh) - Math.max(rect.top, 0);
  if (visible <= 0) return 0;

  const ratio = visible / vh;
  return Math.min(1, Math.max(0, (ratio - 0.12) / 0.45));
}

function lerp(a: number, b: number, t: number) {
  return a + (b - a) * t;
}

function isMobileViewport() {
  return window.matchMedia('(max-width: 768px), (pointer: coarse)').matches;
}

export function ParticleBackground() {
  const ready = useEntrance();
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    if (!ready) return;

    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d', { alpha: true });
    if (!ctx) return;

    const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    let animationId = 0;
    let particles: Particle[] = [];
    let intensity = 0;
    let targetIntensity = 0;
    let mobile = isMobileViewport();
    let layoutW = 0;
    let layoutH = 0;

    const resize = () => {
      mobile = isMobileViewport();
      const nextW = window.innerWidth;
      const nextH = window.innerHeight;
      // Mobile URL bar toggles resize every scroll — don't wipe particles
      if (!isSignificantSizeChange(layoutW, layoutH, nextW, nextH)) return;
      layoutW = nextW;
      layoutH = nextH;

      const dpr = mobile ? 1 : Math.min(window.devicePixelRatio || 1, 2);
      canvas.width = Math.max(1, Math.floor(layoutW * dpr));
      canvas.height = Math.max(1, Math.floor(layoutH * dpr));
      canvas.style.width = `${layoutW}px`;
      canvas.style.height = `${layoutH}px`;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);

      const density = mobile ? PARTICLE_DENSITY_MOBILE : PARTICLE_DENSITY_DESKTOP;
      const count = Math.floor((layoutW * layoutH) / density);
      const minCount = mobile ? 22 : 45;
      const maxCount = mobile ? 36 : 100;
      particles = Array.from({ length: Math.min(Math.max(count, minCount), maxCount) }, () =>
        createParticle(layoutW, layoutH),
      );

      if (mobile) {
        targetIntensity = 0;
        intensity = 0;
      }
    };

    const updateTarget = () => {
      // Contact boost is desktop-only — on mobile it tanks scroll.
      targetIntensity = mobile ? 0 : getContactIntensity();
      if (prefersReducedMotion) {
        intensity = targetIntensity;
        draw();
      }
    };

    const draw = () => {
      const w = layoutW || window.innerWidth;
      const h = layoutH || window.innerHeight;

      if (!prefersReducedMotion && !mobile) {
        intensity += (targetIntensity - intensity) * 0.08;
        if (Math.abs(targetIntensity - intensity) < 0.002) intensity = targetIntensity;
      } else if (mobile) {
        intensity = 0;
      } else {
        intensity = targetIntensity;
      }

      const t = intensity;
      const connectionDistance = mobile ? 90 : lerp(CONNECTION_DISTANCE, 148, t);
      const lineAlphaMax = mobile ? 0.07 : lerp(0.1, 0.2, t);
      const lineWidth = mobile ? 0.5 : lerp(0.5, 0.7, t);
      const sizeBoost = mobile ? 1 : lerp(1, 1.2, t);
      const opacityBoost = mobile ? 1 : lerp(1, 1.65, t);
      const glowStrength = mobile ? 0 : t * 0.14;

      ctx.clearRect(0, 0, w, h);

      for (const p of particles) {
        if (!prefersReducedMotion) {
          p.x += p.vx;
          p.y += p.vy;
          if (p.x < 0) p.x = w;
          if (p.x > w) p.x = 0;
          if (p.y < 0) p.y = h;
          if (p.y > h) p.y = 0;
        }

        const size = p.size * sizeBoost;
        const alpha = Math.min(1, p.opacity * opacityBoost);

        // Soft glow only on desktop contact boost — never on mobile.
        if (glowStrength > 0.01) {
          ctx.beginPath();
          ctx.arc(p.x, p.y, size * 2.4, 0, Math.PI * 2);
          ctx.fillStyle = `rgba(56, 189, 248, ${alpha * glowStrength})`;
          ctx.fill();
        }

        ctx.beginPath();
        ctx.arc(p.x, p.y, size, 0, Math.PI * 2);
        ctx.fillStyle =
          !mobile && t > 0.05
            ? `rgba(186, 230, 253, ${alpha})`
            : `rgba(125, 211, 252, ${alpha})`;
        ctx.fill();
      }

      // Skip every other pair check on mobile to cut O(n²) cost.
      const step = mobile ? 2 : 1;
      for (let i = 0; i < particles.length; i += step) {
        for (let j = i + 1; j < particles.length; j += step) {
          const a = particles[i];
          const b = particles[j];
          const dx = a.x - b.x;
          const dy = a.y - b.y;
          const dist = Math.sqrt(dx * dx + dy * dy);

          if (dist < connectionDistance) {
            const alpha = (1 - dist / connectionDistance) * lineAlphaMax;
            ctx.beginPath();
            ctx.moveTo(a.x, a.y);
            ctx.lineTo(b.x, b.y);
            ctx.strokeStyle = `rgba(56, 189, 248, ${alpha})`;
            ctx.lineWidth = lineWidth;
            ctx.stroke();
          }
        }
      }

      if (!prefersReducedMotion) {
        animationId = requestAnimationFrame(draw);
      }
    };

    resize();
    updateTarget();
    draw();

    window.addEventListener('resize', resize);
    window.addEventListener('scroll', updateTarget, { passive: true });
    return () => {
      window.removeEventListener('resize', resize);
      window.removeEventListener('scroll', updateTarget);
      cancelAnimationFrame(animationId);
    };
  }, [ready]);

  return (
    <div className="pointer-events-none fixed inset-0 z-0 bg-[#0a0a0f]" aria-hidden>
      <canvas ref={canvasRef} className="h-full w-full" />
    </div>
  );
}
