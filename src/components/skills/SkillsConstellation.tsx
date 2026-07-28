import { useCallback, useEffect, useMemo, useRef, useState, type PointerEvent as ReactPointerEvent } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import type { IconType } from 'react-icons';
import { cn } from '@/lib/utils';

export type SkillCategoryId = 'frontend' | 'backend' | 'platform';

export type SkillNode = {
  id: string;
  name: string;
  description: string;
  category: SkillCategoryId;
  categoryLabel: string;
  Icon: IconType;
  color: string;
  orbit: number;
  angle: number;
  orbitSpeed: number;
  z: number;
};

type SkillsConstellationProps = {
  skills: SkillNode[];
  activeCategory: SkillCategoryId | 'all';
  closeLabel: string;
  interactHint?: string;
  className?: string;
};

type Runtime = {
  angle: number;
};

const ORBIT_RX = [0.26, 0.46, 0.66];
const ORBIT_RY = [0.18, 0.34, 0.48];
const ORBIT_CY = 0.5;
const ORBIT_COLORS = [
  'rgba(56, 100, 180, 0.4)',
  'rgba(100, 60, 150, 0.36)',
  'rgba(56, 189, 248, 0.32)',
];

/**
 * Scale rings to stay mostly on-screen on narrow viewports,
 * without crushing the system too hard.
 */
function orbitFitScale(w: number, h: number) {
  const minSide = Math.min(w, h);
  if (!minSide) return 1;

  const narrow = w < 640;
  const pad = narrow ? 22 : 36;
  const maxRx = w * 0.5 - pad;
  const maxRy = h * 0.5 - pad * 0.7;
  if (maxRx <= 0 || maxRy <= 0) return narrow ? 0.8 : 1;

  const fit = Math.min(1, maxRx / (ORBIT_RX[2] * minSide), maxRy / (ORBIT_RY[2] * minSide));
  if (!narrow) return fit;
  return Math.min(1, Math.max(0.74, fit * 0.98));
}

function prefersReducedMotion() {
  return typeof window !== 'undefined' && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
}

function isCoarsePointer() {
  return typeof window !== 'undefined' && window.matchMedia('(pointer: coarse)').matches;
}

function darkenHex(hex: string, amount = 0.55): string {
  const h = hex.replace('#', '');
  const full = h.length === 3 ? h.split('').map((c) => c + c).join('') : h;
  const n = Number.parseInt(full, 16);
  const r = Math.round(((n >> 16) & 255) * (1 - amount));
  const g = Math.round(((n >> 8) & 255) * (1 - amount));
  const b = Math.round((n & 255) * (1 - amount));
  return `rgb(${r},${g},${b})`;
}

function SkillPlanet({
  skill,
  size,
  isActive,
  dimmed,
  hovered,
}: {
  skill: SkillNode;
  size: number;
  isActive: boolean;
  dimmed: boolean;
  hovered: boolean;
}) {
  const Icon = skill.Icon;
  const deep = darkenHex(skill.color, 0.58);
  const mid = darkenHex(skill.color, 0.28);
  const lit = isActive || hovered;

  return (
    <>
      <span
        className="pointer-events-none absolute rounded-full transition-opacity duration-250"
        style={{
          inset: '-48%',
          background: `radial-gradient(circle, ${skill.color}50 0%, ${skill.color}14 40%, transparent 70%)`,
          opacity: lit ? 1 : dimmed ? 0.2 : 0.75,
          filter: 'blur(3px)',
        }}
        aria-hidden
      />

      <span
        className="absolute inset-0 overflow-hidden rounded-full transition-transform duration-250"
        style={{
          transform: lit ? 'scale(1.06)' : undefined,
          background: `
            radial-gradient(circle at 30% 26%, rgba(255,255,255,0.65) 0%, transparent 26%),
            radial-gradient(circle at 62% 68%, ${mid} 0%, transparent 45%),
            radial-gradient(circle at 50% 50%, ${skill.color} 0%, ${deep} 58%, #03040a 100%)
          `,
          boxShadow: lit
            ? `inset -8px -10px 18px rgba(0,0,0,0.5), 0 0 32px ${skill.color}50`
            : `inset -6px -8px 16px rgba(0,0,0,0.55), 0 0 20px ${skill.color}30`,
        }}
        aria-hidden
      >
        <span
          className="absolute inset-0 rounded-full opacity-50"
          style={{
            background: `linear-gradient(105deg, transparent 30%, ${skill.color}33 48%, transparent 62%)`,
          }}
        />
        <span
          className="absolute inset-0 rounded-full"
          style={{
            background: 'linear-gradient(130deg, transparent 38%, rgba(0,0,0,0.4) 100%)',
          }}
        />
      </span>

      <Icon
        className="relative z-[2] drop-shadow-[0_1px_3px_rgba(0,0,0,0.75)] transition-[opacity,transform,filter] duration-250"
        style={{
          color: '#ffffff',
          width: size * 0.4,
          height: size * 0.4,
          opacity: dimmed && !lit ? 0.45 : 0.95,
          filter: lit ? `drop-shadow(0 0 6px ${skill.color})` : undefined,
          transform: lit ? 'scale(1.06)' : undefined,
        }}
        aria-hidden
      />
    </>
  );
}

function TechCard({
  skill,
  closeLabel,
  onClose,
}: {
  skill: SkillNode;
  closeLabel: string;
  onClose: () => void;
}) {
  const Icon = skill.Icon;
  return (
    <motion.aside
      role="region"
      aria-label={skill.name}
      initial={{ opacity: 0, scale: 0.97, x: '-50%', y: '-50%' }}
      animate={{ opacity: 1, scale: 1, x: '-50%', y: '-50%' }}
      exit={{ opacity: 0, scale: 0.98, x: '-50%', y: '-50%' }}
      transition={{ duration: 0.28, ease: [0.22, 1, 0.36, 1] }}
      className="pointer-events-auto absolute left-1/2 top-[50%] z-40 w-[min(calc(100%-2rem),22rem)] overflow-hidden rounded-2xl border border-white/10 bg-[#0a0a0f]/88 p-4 shadow-[0_12px_40px_rgba(0,0,0,0.35)] backdrop-blur-md sm:w-[26rem] sm:p-5"
      data-skill-card
      onClick={(e) => e.stopPropagation()}
      onPointerDown={(e) => e.stopPropagation()}
      style={{
        boxShadow: `0 0 0 1px ${skill.color}22, 0 0 48px ${skill.color}12, 0 12px 40px rgba(0,0,0,0.35)`,
        willChange: 'transform, opacity',
      }}
    >
      <span
        className="pointer-events-none absolute inset-x-0 top-0 h-px"
        style={{
          background: `linear-gradient(90deg, transparent, ${skill.color}66, transparent)`,
        }}
        aria-hidden
      />
      <div className="mb-3 flex items-start justify-between gap-3">
        <div className="flex items-center gap-3">
          <span
            className="flex h-10 w-10 items-center justify-center rounded-full border border-white/10 bg-white/[0.04]"
            style={{ boxShadow: `0 0 18px ${skill.color}28` }}
          >
            <Icon className="h-5 w-5" style={{ color: skill.color }} aria-hidden />
          </span>
          <div>
            <h3 className="text-base font-semibold tracking-tight text-foreground">{skill.name}</h3>
            <p className="text-[0.65rem] font-medium uppercase tracking-[0.2em] text-sky-300/70">
              {skill.categoryLabel}
            </p>
          </div>
        </div>
        <button
          type="button"
          onClick={onClose}
          className="rounded-full border border-white/10 px-2.5 py-1 text-xs text-muted-foreground transition-colors hover:border-white/20 hover:text-foreground"
        >
          {closeLabel}
        </button>
      </div>
      <p className="text-sm leading-relaxed text-muted-foreground">{skill.description}</p>
    </motion.aside>
  );
}

export function SkillsConstellation({
  skills,
  activeCategory,
  closeLabel,
  interactHint,
  className,
}: SkillsConstellationProps) {
  const stageRef = useRef<HTMLDivElement>(null);
  const nodeRefs = useRef<Map<string, HTMLButtonElement>>(new Map());
  const runtimeRef = useRef<Map<string, Runtime>>(new Map());
  const rafRef = useRef(0);
  const inViewRef = useRef(true);
  const enteredRef = useRef(false);
  const sizeRef = useRef({ w: 0, h: 0 });
  const dragRef = useRef({
    active: false,
    lastX: 0,
    pointerId: -1,
    moved: false,
    orbit: 0 as number,
    skillId: null as string | null,
  });
  const spinVelRef = useRef<[number, number, number]>([0, 0, 0]);
  const [stageSize, setStageSize] = useState({ w: 0, h: 0 });

  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [hoveredId, setHoveredId] = useState<string | null>(null);
  const [dragging, setDragging] = useState(false);
  const [activeOrbit, setActiveOrbit] = useState<number | null>(null);
  const [reduced, setReduced] = useState(false);
  const [coarse, setCoarse] = useState(false);

  const selectedSkill = useMemo(
    () => skills.find((s) => s.id === selectedId) ?? null,
    [skills, selectedId],
  );

  const categoryOrbit: Record<SkillCategoryId, number> = {
    frontend: 0,
    backend: 1,
    platform: 2,
  };

  const closeCard = useCallback(() => {
    setSelectedId(null);
  }, []);

  const openCard = useCallback((id: string) => {
    setSelectedId(id);
  }, []);

  const setNodeRef = useCallback((id: string, el: HTMLButtonElement | null) => {
    if (el) nodeRefs.current.set(id, el);
    else nodeRefs.current.delete(id);
  }, []);

  useEffect(() => {
    setReduced(prefersReducedMotion());
    setCoarse(isCoarsePointer());

    const map = new Map<string, Runtime>();
    skills.forEach((s) => {
      map.set(s.id, { angle: s.angle });
    });
    runtimeRef.current = map;
  }, [skills]);

  useEffect(() => {
    if (reduced) return;
    const stage = stageRef.current;
    if (!stage) return;

    const measure = () => {
      const box = stage.getBoundingClientRect();
      sizeRef.current = { w: box.width, h: box.height };
      setStageSize({ w: box.width, h: box.height });
    };
    measure();

    const io = new IntersectionObserver(
      ([entry]) => {
        inViewRef.current = entry.isIntersecting;
      },
      { rootMargin: '80px' },
    );
    io.observe(stage);

    const ro = new ResizeObserver(measure);
    ro.observe(stage);

    let t0 = performance.now();

    const tick = (now: number) => {
      rafRef.current = requestAnimationFrame(tick);
      if (!inViewRef.current || document.hidden) return;

      const dt = Math.min(0.033, (now - t0) / 1000);
      t0 = now;
      const { w, h } = sizeRef.current;
      if (!w || !h) return;

      const cx = w * 0.5;
      const cy = h * ORBIT_CY;
      const minSide = Math.min(w, h);
      const fit = orbitFitScale(w, h);
      const speedScale = coarse ? 0.7 : 1;
      // Keep system alive while card is open — slightly slower
      const selectSlow = selectedId != null ? 0.4 : 1;
      if (!dragRef.current.active) {
        for (let i = 0; i < 3; i++) {
          spinVelRef.current[i] *= 0.9;
          if (Math.abs(spinVelRef.current[i]) < 0.002) spinVelRef.current[i] = 0;
        }
      }

      for (const skill of skills) {
        const rt = runtimeRef.current.get(skill.id);
        const el = nodeRefs.current.get(skill.id);
        if (!rt || !el) continue;

        const orbitBusy =
          dragRef.current.active && dragRef.current.orbit === skill.orbit;
        if (!orbitBusy) {
          rt.angle +=
            skill.orbitSpeed * dt * speedScale * selectSlow + spinVelRef.current[skill.orbit];
        }

        const rx = ORBIT_RX[skill.orbit] * minSide * fit;
        const ry = ORBIT_RY[skill.orbit] * minSide * fit;
        const x = cx + Math.cos(rt.angle) * rx;
        const y = cy + Math.sin(rt.angle) * ry;
        const depth = Math.round(2 + (y / h) * 20);
        if (el.getAttribute('aria-pressed') !== 'true') {
          el.style.zIndex = String(depth);
        }
        el.style.transform = `translate3d(${x}px, ${y}px, 0) translate(-50%, -50%)`;
      }
    };

    rafRef.current = requestAnimationFrame(tick);

    return () => {
      cancelAnimationFrame(rafRef.current);
      io.disconnect();
      ro.disconnect();
    };
  }, [skills, reduced, coarse, selectedId]);

  useEffect(() => {
    if (!selectedId) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') closeCard();
    };
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, [selectedId, closeCard]);

  useEffect(() => {
    if (reduced || enteredRef.current) return;
    const stage = stageRef.current;
    if (!stage) return;

    const nodes = Array.from(nodeRefs.current.values());
    nodes.forEach((el) => {
      el.style.opacity = '0';
      el.style.scale = '0.6';
    });

    const io = new IntersectionObserver(
      ([entry]) => {
        if (!entry.isIntersecting || enteredRef.current) return;
        enteredRef.current = true;
        nodes.forEach((el, i) => {
          el.style.transition = `opacity 0.65s cubic-bezier(0.22,1,0.36,1) ${0.05 + i * 0.04}s, scale 0.65s cubic-bezier(0.22,1,0.36,1) ${0.05 + i * 0.04}s`;
          el.style.opacity = '';
          el.style.scale = '';
        });
        io.disconnect();
      },
      { threshold: 0.2 },
    );
    io.observe(stage);
    return () => io.disconnect();
  }, [reduced, skills]);

  const nearestOrbit = useCallback((clientX: number, clientY: number) => {
    const stage = stageRef.current;
    if (!stage) return { index: 0, dist: Infinity };
    const rect = stage.getBoundingClientRect();
    const w = rect.width;
    const h = rect.height;
    const lx = clientX - rect.left;
    const ly = clientY - rect.top;
    const cx = w * 0.5;
    const cy = h * ORBIT_CY;
    const minSide = Math.min(w, h);
    const fit = orbitFitScale(w, h);

    let best = 0;
    let bestDist = Infinity;
    for (let i = 0; i < ORBIT_RX.length; i++) {
      const rx = Math.max(1, ORBIT_RX[i] * minSide * fit);
      const ry = Math.max(1, ORBIT_RY[i] * minSide * fit);
      const d = Math.abs(Math.hypot((lx - cx) / rx, (ly - cy) / ry) - 1);
      if (d < bestDist) {
        bestDist = d;
        best = i;
      }
    }
    return { index: best, dist: bestDist };
  }, []);

  const applyOrbitDelta = useCallback(
    (orbit: number, delta: number) => {
      for (const skill of skills) {
        if (skill.orbit !== orbit) continue;
        const rt = runtimeRef.current.get(skill.id);
        if (rt) rt.angle += delta;
      }
      spinVelRef.current[orbit] = delta * 0.55;
    },
    [skills],
  );

  const onStagePointerDown = useCallback(
    (e: ReactPointerEvent<HTMLDivElement>) => {
      if (e.button !== 0) return;
      const target = e.target as HTMLElement;
      if (target.closest('[data-skill-card]')) return;

      const planet = target.closest('[data-skill-planet]') as HTMLElement | null;
      const { index: orbit } = planet
        ? { index: Number(planet.dataset.orbit ?? 0) }
        : nearestOrbit(e.clientX, e.clientY);

      dragRef.current = {
        active: true,
        lastX: e.clientX,
        pointerId: e.pointerId,
        moved: false,
        orbit,
        skillId: planet?.dataset.skillId ?? null,
      };
      e.currentTarget.setPointerCapture(e.pointerId);
    },
    [nearestOrbit],
  );

  const onStagePointerMove = useCallback(
    (e: ReactPointerEvent<HTMLDivElement>) => {
      if (!dragRef.current.active || e.pointerId !== dragRef.current.pointerId) return;
      const dx = e.clientX - dragRef.current.lastX;
      dragRef.current.lastX = e.clientX;
      if (Math.abs(dx) < 0.5) return;

      if (!dragRef.current.moved && Math.abs(dx) > 3) {
        dragRef.current.moved = true;
        setDragging(true);
        setActiveOrbit(dragRef.current.orbit);
      }
      if (!dragRef.current.moved) return;

      applyOrbitDelta(dragRef.current.orbit, -dx * 0.01);
    },
    [applyOrbitDelta],
  );

  const endDrag = useCallback(
    (e: ReactPointerEvent<HTMLDivElement>) => {
      if (e.pointerId !== dragRef.current.pointerId) return;

      const { moved, skillId } = dragRef.current;
      dragRef.current.active = false;
      dragRef.current.pointerId = -1;
      setDragging(false);
      setActiveOrbit(null);

      try {
        e.currentTarget.releasePointerCapture(e.pointerId);
      } catch {
        /* already released */
      }

      // Capture steals button clicks — resolve tap here
      if (!moved) {
        if (skillId) {
          setSelectedId((prev) => (prev === skillId ? null : skillId));
        } else if (selectedId) {
          closeCard();
        }
      }

      dragRef.current.moved = false;
      dragRef.current.skillId = null;
    },
    [closeCard, selectedId],
  );

  if (reduced) {
    return (
      <div className={cn('relative', className)}>
        <ul className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4">
          {skills.map((skill) => {
            const Icon = skill.Icon;
            const open = selectedId === skill.id;
            return (
              <li key={skill.id}>
                <button
                  type="button"
                  onClick={() => (open ? closeCard() : openCard(skill.id))}
                  className="flex w-full items-center gap-3 rounded-2xl border border-white/10 bg-white/[0.03] px-3 py-3 text-left transition-opacity"
                  aria-label={skill.name}
                  aria-expanded={open}
                >
                  <span
                    className="h-9 w-9 shrink-0 rounded-full"
                    style={{
                      background: `radial-gradient(circle at 30% 28%, rgba(255,255,255,0.45), ${skill.color} 50%, ${darkenHex(skill.color)} 100%)`,
                      boxShadow: `0 0 12px ${skill.color}44`,
                    }}
                  />
                  <span className="flex min-w-0 flex-col">
                    <span className="truncate text-sm font-medium text-foreground">{skill.name}</span>
                    <span className="truncate text-[0.65rem] uppercase tracking-wider text-muted-foreground">
                      {skill.categoryLabel}
                    </span>
                  </span>
                  <Icon className="ml-auto h-4 w-4 shrink-0 opacity-40" style={{ color: skill.color }} aria-hidden />
                </button>
                {open && (
                  <p className="mt-2 rounded-xl border border-white/10 bg-[#0a0a0f]/70 px-3 py-2 text-sm text-muted-foreground">
                    {skill.description}
                  </p>
                )}
              </li>
            );
          })}
        </ul>
      </div>
    );
  }

  return (
    <div className={cn('relative', className)}>
      {interactHint ? (
        <p className="mb-3 text-center text-[11px] tracking-wide text-white/35 sm:text-xs">
          {interactHint}
        </p>
      ) : null}
      <div
        ref={stageRef}
        className={cn(
          'relative mx-auto h-[min(82vw,620px)] min-h-[400px] w-full max-w-6xl touch-none overflow-visible sm:min-h-[540px]',
          dragging ? 'cursor-grabbing' : 'cursor-grab',
        )}
        onPointerDown={onStagePointerDown}
        onPointerMove={onStagePointerMove}
        onPointerUp={endDrag}
        onPointerCancel={endDrag}
      >
        <svg className="absolute inset-0 h-full w-full overflow-visible" aria-hidden>
          {stageSize.w > 0 &&
            ORBIT_RX.map((rxNorm, i) => {
              const cat = (['frontend', 'backend', 'platform'] as SkillCategoryId[])[i];
              const lit =
                activeCategory === cat ||
                (selectedSkill != null && categoryOrbit[selectedSkill.category] === i) ||
                activeOrbit === i;
              const minSide = Math.min(stageSize.w, stageSize.h);
              const fit = orbitFitScale(stageSize.w, stageSize.h);
              return (
                <ellipse
                  key={i}
                  cx={stageSize.w * 0.5}
                  cy={stageSize.h * ORBIT_CY}
                  rx={rxNorm * minSide * fit}
                  ry={ORBIT_RY[i] * minSide * fit}
                  fill="none"
                  stroke={ORBIT_COLORS[i]}
                  strokeWidth={lit ? 12 : 8}
                  strokeOpacity={0}
                  className="cursor-grab"
                  style={{ pointerEvents: 'stroke' }}
                />
              );
            })}
          {stageSize.w > 0 &&
            ORBIT_RX.map((rxNorm, i) => {
              const cat = (['frontend', 'backend', 'platform'] as SkillCategoryId[])[i];
              const lit =
                activeCategory === cat ||
                (selectedSkill != null && categoryOrbit[selectedSkill.category] === i) ||
                activeOrbit === i;
              const minSide = Math.min(stageSize.w, stageSize.h);
              const fit = orbitFitScale(stageSize.w, stageSize.h);
              return (
                <ellipse
                  key={`vis-${i}`}
                  cx={stageSize.w * 0.5}
                  cy={stageSize.h * ORBIT_CY}
                  rx={rxNorm * minSide * fit}
                  ry={ORBIT_RY[i] * minSide * fit}
                  fill="none"
                  stroke={ORBIT_COLORS[i]}
                  strokeWidth={lit ? 1.55 : 1.1}
                  strokeOpacity={lit ? 0.85 : 0.48}
                  className="pointer-events-none transition-[stroke-opacity,stroke-width] duration-200"
                />
              );
            })}
        </svg>

        <div
          className="pointer-events-none absolute left-1/2 top-[50%] z-0 h-[14%] w-[14%] -translate-x-1/2 -translate-y-1/2 rounded-full"
          style={{
            background:
              'radial-gradient(circle, rgba(254,243,199,0.45) 0%, rgba(56,100,180,0.2) 40%, transparent 70%)',
            filter: 'blur(6px)',
          }}
          aria-hidden
        />
        <div
          className="pointer-events-none absolute left-1/2 top-[50%] z-0 h-2.5 w-2.5 -translate-x-1/2 -translate-y-1/2 rounded-full bg-[#fef3c7]/90 shadow-[0_0_20px_rgba(254,243,199,0.75)]"
          aria-hidden
        />

        {skills.map((skill) => {
          const isSelected = selectedId === skill.id;
          const isHovered = hoveredId === skill.id;
          const pausedDim = selectedId != null && !isSelected;
          const size = coarse ? 26 + skill.z * 12 : 28 + skill.z * 15;

          return (
            <button
              key={skill.id}
              ref={(el) => setNodeRef(skill.id, el)}
              type="button"
              data-skill-planet
              data-orbit={skill.orbit}
              data-skill-id={skill.id}
              aria-label={`${skill.name}, ${skill.categoryLabel}`}
              aria-pressed={isSelected}
              onKeyDown={(e) => {
                if (e.key !== 'Enter' && e.key !== ' ') return;
                e.preventDefault();
                setSelectedId((prev) => (prev === skill.id ? null : skill.id));
              }}
              onPointerEnter={() => setHoveredId(skill.id)}
              onPointerLeave={() => setHoveredId((id) => (id === skill.id ? null : id))}
              className={cn(
                'absolute left-0 top-0 z-[2] flex cursor-grab items-center justify-center rounded-full will-change-transform',
                dragging && activeOrbit === skill.orbit && 'cursor-grabbing',
                'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sky-400/50',
                isSelected && 'z-30',
              )}
              style={{
                width: size,
                height: size,
                opacity: pausedDim && !isHovered ? 0.32 : 1,
                transition: 'opacity 0.35s ease',
                zIndex: isSelected ? 30 : isHovered ? 24 : undefined,
              }}
            >
              <SkillPlanet
                skill={skill}
                size={size}
                isActive={isSelected}
                dimmed={pausedDim}
                hovered={isHovered}
              />
              {(isHovered || isSelected) && (
                <span
                  className="pointer-events-none absolute left-1/2 top-[calc(100%+6px)] z-10 -translate-x-1/2 whitespace-nowrap rounded-full border border-white/10 bg-black/55 px-2 py-0.5 text-[10px] font-medium tracking-wide text-white/85 backdrop-blur-sm"
                  style={{ boxShadow: `0 0 12px ${skill.color}22` }}
                >
                  {skill.name}
                </span>
              )}
              <span className="sr-only">{skill.name}</span>
            </button>
          );
        })}

        <AnimatePresence mode="wait">
          {selectedSkill ? (
            <div data-skill-card key={selectedSkill.id}>
              <TechCard
                skill={selectedSkill}
                closeLabel={closeLabel}
                onClose={closeCard}
              />
            </div>
          ) : null}
        </AnimatePresence>
      </div>
    </div>
  );
}
