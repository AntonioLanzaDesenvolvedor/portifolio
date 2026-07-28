import { useEffect, useRef } from 'react';
import { cn } from '@/lib/utils';

type SkillsNebulaProps = {
  className?: string;
};

/**
 * Soft drifting nebula for the Skills section — matches Hero/About space palette.
 */
export function SkillsNebula({ className }: SkillsNebulaProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const container = containerRef.current;
    const canvas = canvasRef.current;
    if (!container || !canvas) return;

    const ctx = canvas.getContext('2d', { alpha: true });
    if (!ctx) return;

    const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    const mobile = window.matchMedia('(max-width: 768px), (pointer: coarse)').matches;

    let w = 0;
    let h = 0;
    let raf = 0;
    let running = false;
    let inView = true;
    let t = 0;
    let last = 0;

    type Cloud = {
      x: number;
      y: number;
      r: number;
      vx: number;
      vy: number;
      hue: 0 | 1;
      a: number;
      pulse: number;
      phase: number;
    };

    type Star = { x: number; y: number; s: number; a: number; tw: number; ph: number };

    const clouds: Cloud[] = [];
    const stars: Star[] = [];

    const seedClouds = () => {
      clouds.length = 0;
      const n = mobile ? 5 : 8;
      for (let i = 0; i < n; i++) {
        clouds.push({
          x: Math.random() * Math.max(w, 1),
          y: Math.random() * Math.max(h, 1),
          r: (mobile ? 120 : 160) + Math.random() * (mobile ? 140 : 220),
          vx: (Math.random() - 0.5) * 8,
          vy: (Math.random() - 0.5) * 5,
          hue: i % 2 === 0 ? 0 : 1,
          a: 0.06 + Math.random() * 0.08,
          pulse: 0.25 + Math.random() * 0.35,
          phase: Math.random() * Math.PI * 2,
        });
      }
    };

    const seedStars = () => {
      stars.length = 0;
      const n = mobile ? 60 : 110;
      for (let i = 0; i < n; i++) {
        stars.push({
          x: Math.random(),
          y: Math.random(),
          s: 0.4 + Math.random() * 1.2,
          a: 0.2 + Math.random() * 0.55,
          tw: 0.4 + Math.random() * 1.4,
          ph: Math.random() * Math.PI * 2,
        });
      }
    };

    const resize = () => {
      const rect = container.getBoundingClientRect();
      w = rect.width;
      h = rect.height;
      const dpr = Math.min(window.devicePixelRatio || 1, mobile ? 1.25 : 1.5);
      canvas.width = Math.max(1, Math.floor(w * dpr));
      canvas.height = Math.max(1, Math.floor(h * dpr));
      canvas.style.width = `${w}px`;
      canvas.style.height = `${h}px`;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      if (clouds.length === 0) seedClouds();
      if (stars.length === 0) seedStars();
    };

    const color = (hue: 0 | 1, a: number) =>
      hue === 0 ? `rgba(56,100,180,${a})` : `rgba(100,60,150,${a})`;

    const draw = () => {
      if (!w || !h) return;
      ctx.clearRect(0, 0, w, h);
      ctx.fillStyle = '#0a0a0f';
      ctx.fillRect(0, 0, w, h);

      ctx.globalCompositeOperation = 'lighter';
      for (const c of clouds) {
        const pulse = 0.75 + 0.25 * Math.sin(t * c.pulse + c.phase);
        const r = c.r * (0.92 + 0.08 * pulse);
        const g = ctx.createRadialGradient(c.x, c.y, 0, c.x, c.y, r);
        g.addColorStop(0, color(c.hue, c.a * pulse));
        g.addColorStop(0.45, color(c.hue, c.a * pulse * 0.35));
        g.addColorStop(1, color(c.hue, 0));
        ctx.fillStyle = g;
        ctx.beginPath();
        ctx.arc(c.x, c.y, r, 0, Math.PI * 2);
        ctx.fill();
      }

      ctx.globalCompositeOperation = 'source-over';
      for (const s of stars) {
        const tw = 0.55 + 0.45 * Math.sin(t * s.tw + s.ph);
        ctx.globalAlpha = s.a * tw;
        ctx.fillStyle = '#ffffff';
        ctx.beginPath();
        ctx.arc(s.x * w, s.y * h, s.s, 0, Math.PI * 2);
        ctx.fill();
      }
      ctx.globalAlpha = 1;

      // Soft core wash
      const core = ctx.createRadialGradient(w * 0.5, h * 0.42, 0, w * 0.5, h * 0.42, Math.min(w, h) * 0.35);
      core.addColorStop(0, 'rgba(220,230,255,0.06)');
      core.addColorStop(0.4, 'rgba(56,100,180,0.05)');
      core.addColorStop(1, 'rgba(10,10,15,0)');
      ctx.fillStyle = core;
      ctx.fillRect(0, 0, w, h);
    };

    const tick = (now: number) => {
      if (!running) return;
      const dt = last === 0 ? 0.016 : Math.min(0.05, (now - last) / 1000);
      last = now;
      t += dt;

      for (const c of clouds) {
        c.x += c.vx * dt;
        c.y += c.vy * dt;
        if (c.x < -c.r) c.x = w + c.r;
        if (c.x > w + c.r) c.x = -c.r;
        if (c.y < -c.r) c.y = h + c.r;
        if (c.y > h + c.r) c.y = -c.r;
      }

      draw();
      raf = requestAnimationFrame(tick);
    };

    const start = () => {
      if (running || reduced || !inView || document.hidden) return;
      running = true;
      last = 0;
      raf = requestAnimationFrame(tick);
    };

    const stop = () => {
      running = false;
      last = 0;
      cancelAnimationFrame(raf);
    };

    resize();
    if (reduced) draw();
    else start();

    const ro = new ResizeObserver(() => {
      stop();
      resize();
      if (reduced) draw();
      else start();
    });
    ro.observe(container);

    const io = new IntersectionObserver(
      ([e]) => {
        inView = e.isIntersecting;
        if (inView) start();
        else stop();
      },
      { rootMargin: '100px' },
    );
    io.observe(container);

    const onVis = () => {
      if (document.hidden) stop();
      else start();
    };
    document.addEventListener('visibilitychange', onVis);

    return () => {
      stop();
      ro.disconnect();
      io.disconnect();
      document.removeEventListener('visibilitychange', onVis);
    };
  }, []);

  return (
    <div ref={containerRef} className={cn('absolute inset-0 overflow-hidden', className)} aria-hidden>
      <canvas ref={canvasRef} className="absolute inset-0 h-full w-full" />
    </div>
  );
}
