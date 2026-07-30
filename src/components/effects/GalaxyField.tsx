import { useEffect, useRef } from 'react';
import { isSignificantSizeChange } from '@/lib/stable-size';
import { cn } from '@/lib/utils';

type GalaxyFieldProps = {
  className?: string;
};

type Star = {
  x: number;
  y: number;
  s: number;
  a: number;
  tw: number;
  ph: number;
};

type Cloud = {
  x: number;
  y: number;
  r: number;
  vx: number;
  vy: number;
  a: number;
  pulse: number;
  phase: number;
  tone: 0 | 1 | 2;
};

type Meteor = {
  x: number;
  y: number;
  len: number;
  speed: number;
  life: number;
  maxLife: number;
  angle: number;
  width: number;
};

/**
 * Deep galaxy backdrop with drifting nebula, stars, and falling meteors.
 * Intended for Contact + Footer as one continuous field.
 */
export function GalaxyField({ className }: GalaxyFieldProps) {
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
    let dpr = 1;
    let raf = 0;
    let running = false;
    let inView = true;
    let t = 0;
    let last = 0;
    let spawnAcc = 0;

    const stars: Star[] = [];
    const clouds: Cloud[] = [];
    const meteors: Meteor[] = [];

    const seedStars = () => {
      stars.length = 0;
      const n = mobile ? 70 : 140;
      for (let i = 0; i < n; i++) {
        stars.push({
          x: Math.random(),
          y: Math.random(),
          s: 0.35 + Math.random() * 1.35,
          a: 0.18 + Math.random() * 0.6,
          tw: 0.35 + Math.random() * 1.5,
          ph: Math.random() * Math.PI * 2,
        });
      }
    };

    const seedClouds = () => {
      clouds.length = 0;
      const n = mobile ? 5 : 8;
      for (let i = 0; i < n; i++) {
        clouds.push({
          x: Math.random() * Math.max(w, 1),
          y: Math.random() * Math.max(h, 1),
          r: (mobile ? 110 : 150) + Math.random() * (mobile ? 150 : 240),
          vx: (Math.random() - 0.5) * 6,
          vy: (Math.random() - 0.5) * 4,
          a: 0.05 + Math.random() * 0.08,
          pulse: 0.2 + Math.random() * 0.35,
          phase: Math.random() * Math.PI * 2,
          tone: (i % 3) as 0 | 1 | 2,
        });
      }
    };

    const spawnMeteor = () => {
      const fromRight = Math.random() > 0.35;
      const angle = fromRight
        ? Math.PI * 0.55 + Math.random() * 0.25
        : Math.PI * 0.35 + Math.random() * 0.2;
      meteors.push({
        x: fromRight ? w * (0.2 + Math.random() * 0.95) : w * Math.random() * 0.7,
        y: -20 - Math.random() * 80,
        len: 50 + Math.random() * (mobile ? 70 : 110),
        speed: (mobile ? 220 : 320) + Math.random() * (mobile ? 160 : 240),
        life: 0,
        maxLife: 0.9 + Math.random() * 1.1,
        angle,
        width: 1 + Math.random() * 1.4,
      });
    };

    const resize = () => {
      const rect = container.getBoundingClientRect();
      const nextW = Math.max(1, Math.floor(rect.width));
      const nextH = Math.max(1, Math.floor(rect.height));
      if (w > 0 && !isSignificantSizeChange(w, h, nextW, nextH)) return false;
      const needsReseed = w === 0 || Math.abs(nextW - w) >= 1 || Math.abs(nextH - h) >= 64;
      w = nextW;
      h = nextH;
      dpr = mobile ? 1 : Math.min(window.devicePixelRatio || 1, 2);
      canvas.width = Math.floor(w * dpr);
      canvas.height = Math.floor(h * dpr);
      canvas.style.width = `${w}px`;
      canvas.style.height = `${h}px`;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      if (needsReseed) {
        seedStars();
        seedClouds();
      }
      return true;
    };

    const cloudColor = (tone: 0 | 1 | 2, alpha: number) => {
      if (tone === 0) return `rgba(56, 130, 210, ${alpha})`;
      if (tone === 1) return `rgba(90, 150, 210, ${alpha})`;
      return `rgba(40, 100, 180, ${alpha})`;
    };

    const drawStatic = () => {
      ctx.clearRect(0, 0, w, h);

      // Deep void
      const voidGrad = ctx.createLinearGradient(0, 0, 0, h);
      voidGrad.addColorStop(0, 'rgba(4, 10, 24, 0.15)');
      voidGrad.addColorStop(0.35, 'rgba(3, 8, 20, 0.55)');
      voidGrad.addColorStop(1, 'rgba(1, 4, 12, 0.92)');
      ctx.fillStyle = voidGrad;
      ctx.fillRect(0, 0, w, h);

      for (const c of clouds) {
        const g = ctx.createRadialGradient(c.x, c.y, 0, c.x, c.y, c.r);
        g.addColorStop(0, cloudColor(c.tone, c.a));
        g.addColorStop(1, cloudColor(c.tone, 0));
        ctx.fillStyle = g;
        ctx.beginPath();
        ctx.arc(c.x, c.y, c.r, 0, Math.PI * 2);
        ctx.fill();
      }

      for (const s of stars) {
        ctx.fillStyle = `rgba(224, 247, 255, ${s.a})`;
        ctx.beginPath();
        ctx.arc(s.x * w, s.y * h, s.s, 0, Math.PI * 2);
        ctx.fill();
      }
    };

    const draw = (now: number) => {
      if (!running) return;
      const dt = Math.min(0.05, (now - last) / 1000 || 0.016);
      last = now;
      t += dt;

      ctx.clearRect(0, 0, w, h);

      const voidGrad = ctx.createLinearGradient(0, 0, 0, h);
      voidGrad.addColorStop(0, 'rgba(4, 10, 24, 0.12)');
      voidGrad.addColorStop(0.3, 'rgba(3, 8, 20, 0.5)');
      voidGrad.addColorStop(1, 'rgba(1, 4, 12, 0.9)');
      ctx.fillStyle = voidGrad;
      ctx.fillRect(0, 0, w, h);

      for (const c of clouds) {
        c.x += c.vx * dt;
        c.y += c.vy * dt;
        if (c.x < -c.r) c.x = w + c.r;
        if (c.x > w + c.r) c.x = -c.r;
        if (c.y < -c.r) c.y = h + c.r;
        if (c.y > h + c.r) c.y = -c.r;

        const alpha = c.a * (0.75 + Math.sin(t * c.pulse + c.phase) * 0.25);
        const g = ctx.createRadialGradient(c.x, c.y, 0, c.x, c.y, c.r);
        g.addColorStop(0, cloudColor(c.tone, alpha));
        g.addColorStop(1, cloudColor(c.tone, 0));
        ctx.fillStyle = g;
        ctx.beginPath();
        ctx.arc(c.x, c.y, c.r, 0, Math.PI * 2);
        ctx.fill();
      }

      for (const s of stars) {
        const twinkle = mobile
          ? 0.88 + Math.sin(t * s.tw * 0.5 + s.ph) * 0.12
          : 0.55 + Math.sin(t * s.tw + s.ph) * 0.45;
        ctx.fillStyle = `rgba(224, 247, 255, ${s.a * twinkle})`;
        ctx.beginPath();
        ctx.arc(s.x * w, s.y * h, s.s, 0, Math.PI * 2);
        ctx.fill();
      }

      // Falling shooting stars
      spawnAcc += dt;
      const spawnEvery = mobile ? 1.35 : 0.85;
      const maxMeteors = mobile ? 2 : 4;
      while (spawnAcc >= spawnEvery && meteors.length < maxMeteors) {
        spawnAcc -= spawnEvery;
        if (Math.random() > 0.25) spawnMeteor();
      }

      for (let i = meteors.length - 1; i >= 0; i--) {
        const m = meteors[i];
        m.life += dt;
        m.x += Math.cos(m.angle) * m.speed * dt;
        m.y += Math.sin(m.angle) * m.speed * dt;

        const fadeIn = Math.min(1, m.life / 0.12);
        const fadeOut = Math.max(0, 1 - m.life / m.maxLife);
        const alpha = fadeIn * fadeOut;

        const tx = m.x - Math.cos(m.angle) * m.len;
        const ty = m.y - Math.sin(m.angle) * m.len;

        const trail = ctx.createLinearGradient(tx, ty, m.x, m.y);
        trail.addColorStop(0, 'rgba(186, 230, 253, 0)');
        trail.addColorStop(0.55, `rgba(125, 211, 252, ${0.35 * alpha})`);
        trail.addColorStop(1, `rgba(255, 255, 255, ${0.95 * alpha})`);

        ctx.strokeStyle = trail;
        ctx.lineWidth = m.width;
        ctx.lineCap = 'round';
        ctx.beginPath();
        ctx.moveTo(tx, ty);
        ctx.lineTo(m.x, m.y);
        ctx.stroke();

        ctx.fillStyle = `rgba(255, 255, 255, ${alpha})`;
        ctx.beginPath();
        ctx.arc(m.x, m.y, m.width * 1.1, 0, Math.PI * 2);
        ctx.fill();

        if (m.life >= m.maxLife || m.y > h + 40 || m.x < -40 || m.x > w + 40) {
          meteors.splice(i, 1);
        }
      }

      if (inView) raf = requestAnimationFrame(draw);
      else running = false;
    };

    const start = () => {
      if (running || !inView) return;
      running = true;
      last = performance.now();
      if (reduced) {
        drawStatic();
        running = false;
        return;
      }
      raf = requestAnimationFrame(draw);
    };

    const stop = () => {
      running = false;
      if (raf) cancelAnimationFrame(raf);
      raf = 0;
    };

    const ro = new ResizeObserver(() => {
      if (!resize()) return;
      if (reduced) drawStatic();
      else if (!running && inView) start();
    });
    ro.observe(container);

    const io = new IntersectionObserver(
      ([entry]) => {
        inView = entry.isIntersecting;
        if (inView) start();
        else stop();
      },
      { rootMargin: '80px' },
    );
    io.observe(container);

    resize();
    start();

    return () => {
      stop();
      ro.disconnect();
      io.disconnect();
    };
  }, []);

  return (
    <div ref={containerRef} className={cn('pointer-events-none absolute inset-0 overflow-hidden', className)} aria-hidden>
      <canvas ref={canvasRef} className="absolute inset-0 h-full w-full" />
    </div>
  );
}
