import type { ComponentRef, MutableRefObject, ReactNode } from 'react';
import { Suspense, useCallback, useEffect, useLayoutEffect, useMemo, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { Canvas, useFrame, useThree } from '@react-three/fiber';
import {
  Center,
  Environment,
  Line,
  OrbitControls,
  useGLTF,
  useTexture,
} from '@react-three/drei';
import { Github, Lock } from 'lucide-react';
import * as THREE from 'three';
import type { ProjectItem } from '@/data/projects';
import { getProjectTheme } from '@/components/projects/projectThemes';
import { cn } from '@/lib/utils';
import { gsap } from '@/lib/gsap';
import { getLenisInstance } from '@/lib/lenis-instance';

type ControlsRef = ComponentRef<typeof OrbitControls>;

type ProjectsSatelliteBeltProps = {
  items: ProjectItem[];
  closeLabel: string;
  visitRepoLabel: string;
  privateRepoLabel: string;
  interactHint: string;
  onFocusChange?: (focused: boolean) => void;
  className?: string;
};

type OrbitLayout = {
  radius: number;
  incline: number;
  lan: number;
  speed: number;
  scale: number;
  angle0: number;
};

const ORBITS: Record<string, OrbitLayout> = {
  talentista: { radius: 2.55, incline: 0.48, lan: 0.15, speed: 0.18, scale: 0.055, angle0: 0.3 },
  'saicon-2n250': { radius: 2.85, incline: -0.32, lan: 1.5, speed: 0.13, scale: 0.05, angle0: 1.9 },
  sn800: { radius: 2.7, incline: 0.62, lan: 2.8, speed: 0.16, scale: 0.048, angle0: 3.6 },
  portfolio: { radius: 3.1, incline: -0.2, lan: 4.2, speed: 0.11, scale: 0.045, angle0: 5.1 },
};

const FALLBACK_ORBIT: OrbitLayout = {
  radius: 2.35,
  incline: 0.35,
  lan: 0,
  speed: 0.14,
  scale: 0.045,
  angle0: 0,
};

const EARTH_RADIUS = 1.58;
const SAT_MODEL = '/models/satellite/satellite.glb';

const _lookTarget = new THREE.Vector3(0, 0, 0);
const _up = new THREE.Vector3(0, 1, 0);
const _m = new THREE.Matrix4();
const _q = new THREE.Quaternion();
const _qNadir = new THREE.Quaternion();
const _qOffset = new THREE.Quaternion().setFromEuler(new THREE.Euler(Math.PI / 2, 0, 0));
const _pos = new THREE.Vector3();
const _origin = new THREE.Vector3(0, 0.3, 0);
/** Far enough that full orbits stay inside the canvas (bottom safe margin) */
const CAM = { position: [0, 0.3, 9.7] as [number, number, number], fov: 33 };
const CAM_MOBILE = { position: [0, 0.25, 11.2] as [number, number, number], fov: 35 };
const SCENE_SCALE = 0.98;
const SCENE_SCALE_MOBILE = 0.84;
/** Upright in the focus panel: wings horizontal, bus standing, facing camera */
const SHOWCASE_ROT: [number, number, number] = [Math.PI / 2 + 0.12, Math.PI, 0];
/** Sized for the focus panel with orbit margin so wings don't clip */
const SHOWCASE_SCALE = 0.128;

function prefersReduced() {
  return typeof window !== 'undefined' && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
}

function isMobileLayout(width: number) {
  return width > 0 && width < 768;
}

function getOrbit(id: string) {
  return ORBITS[id] ?? FALLBACK_ORBIT;
}

function orbitPoint(angle: number, o: OrbitLayout, out: THREE.Vector3) {
  const x0 = Math.cos(angle) * o.radius;
  const z0 = Math.sin(angle) * o.radius;
  const y1 = -z0 * Math.sin(o.incline);
  const z1 = z0 * Math.cos(o.incline);
  out.set(
    x0 * Math.cos(o.lan) + z1 * Math.sin(o.lan),
    y1,
    -x0 * Math.sin(o.lan) + z1 * Math.cos(o.lan),
  );
  return out;
}

function RealEarth({
  dimmed,
  onSelectEarth,
}: {
  dimmed: boolean;
  onSelectEarth: () => void;
}) {
  const earth = useRef<THREE.Group>(null);
  const clouds = useRef<THREE.Mesh>(null);
  const pointer = useRef({ x: 0, y: 0, moved: false });
  const [color, bump, night, spec, cloudMap] = useTexture([
    '/models/earth/color.jpg',
    '/models/earth/bump.jpg',
    '/models/earth/night.jpg',
    '/models/earth/spec.jpg',
    '/models/earth/clouds.png',
  ]);

  const specularColor = useMemo(() => new THREE.Color('#666666'), []);
  const emissiveColor = useMemo(() => new THREE.Color('#ffcc88'), []);

  useEffect(() => {
    for (const tex of [color, night, cloudMap]) {
      tex.colorSpace = THREE.SRGBColorSpace;
      tex.anisotropy = 8;
    }
    for (const tex of [bump, spec]) tex.anisotropy = 8;
  }, [color, bump, night, spec, cloudMap]);

  useFrame((_, dt) => {
    if (earth.current) earth.current.rotation.y += dt * (dimmed ? 0.015 : 0.04);
    if (clouds.current) clouds.current.rotation.y += dt * (dimmed ? 0.02 : 0.055);
  });

  return (
    <group
      onPointerDown={(e) => {
        pointer.current = { x: e.clientX, y: e.clientY, moved: false };
      }}
      onPointerMove={(e) => {
        const dx = e.clientX - pointer.current.x;
        const dy = e.clientY - pointer.current.y;
        if (dx * dx + dy * dy > 16) pointer.current.moved = true;
      }}
      onClick={(e) => {
        e.stopPropagation();
        if (!pointer.current.moved) onSelectEarth();
      }}
      onPointerOver={() => {
        document.body.style.cursor = 'grab';
      }}
      onPointerOut={() => {
        document.body.style.cursor = 'default';
      }}
    >
      <group ref={earth}>
        <mesh>
          <sphereGeometry args={[EARTH_RADIUS, 64, 64]} />
          <meshPhongMaterial
            map={color}
            bumpMap={bump}
            bumpScale={2.5}
            specularMap={spec}
            specular={specularColor}
            shininess={14}
            emissiveMap={night}
            emissive={emissiveColor}
            emissiveIntensity={dimmed ? 0.12 : 0.6}
          />
        </mesh>
      </group>

      <mesh ref={clouds} scale={1.015}>
        <sphereGeometry args={[EARTH_RADIUS, 48, 48]} />
        <meshPhongMaterial
          map={cloudMap}
          alphaMap={cloudMap}
          transparent
          opacity={dimmed ? 0.1 : 0.55}
          depthWrite={false}
          side={THREE.DoubleSide}
        />
      </mesh>

      <mesh scale={1.04}>
        <sphereGeometry args={[EARTH_RADIUS, 48, 48]} />
        <meshBasicMaterial
          color="#7ec8ff"
          transparent
          opacity={dimmed ? 0.05 : 0.11}
          side={THREE.BackSide}
          depthWrite={false}
        />
      </mesh>
      <mesh scale={1.09}>
        <sphereGeometry args={[EARTH_RADIUS, 32, 32]} />
        <meshBasicMaterial
          color="#4a9fe0"
          transparent
          opacity={0.05}
          side={THREE.BackSide}
          depthWrite={false}
        />
      </mesh>

      {dimmed ? (
        <mesh scale={1.12}>
          <sphereGeometry args={[EARTH_RADIUS, 32, 24]} />
          <meshBasicMaterial color="#05070c" transparent opacity={0.55} depthWrite={false} />
        </mesh>
      ) : null}
    </group>
  );
}

function SatelliteModel() {
  const { scene } = useGLTF(SAT_MODEL);
  const cloned = useMemo(() => {
    const root = scene.clone(true);
    root.traverse((obj) => {
      const mesh = obj as THREE.Mesh;
      if (mesh.isMesh) {
        mesh.castShadow = false;
        mesh.receiveShadow = false;
        const mats = Array.isArray(mesh.material) ? mesh.material : [mesh.material];
        for (const mat of mats) {
          const std = mat as THREE.MeshStandardMaterial;
          if (std.map) std.map.anisotropy = 4;
          std.envMapIntensity = 1.15;
          std.needsUpdate = true;
        }
      }
    });
    return root;
  }, [scene]);

  return (
    <Center>
      <primitive object={cloned} />
    </Center>
  );
}

function ProjectCard({
  project,
  closeLabel,
  visitRepoLabel,
  privateRepoLabel,
  onClose,
  compact = false,
}: {
  project: ProjectItem;
  closeLabel: string;
  visitRepoLabel: string;
  privateRepoLabel: string;
  onClose: () => void;
  compact?: boolean;
}) {
  const theme = getProjectTheme(project.id);
  const hasRepo = Boolean(project.repoUrl?.trim());
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const el = scrollRef.current;
    if (!el) return;

    let target = el.scrollTop;
    let raf = 0;
    let running = false;

    const tick = () => {
      const cur = el.scrollTop;
      const next = cur + (target - cur) * 0.22;
      if (Math.abs(target - cur) < 0.35) {
        el.scrollTop = target;
        running = false;
        raf = 0;
        return;
      }
      el.scrollTop = next;
      raf = requestAnimationFrame(tick);
    };

    const onWheel = (e: WheelEvent) => {
      e.preventDefault();
      e.stopPropagation();
      const max = Math.max(0, el.scrollHeight - el.clientHeight);
      target = Math.max(0, Math.min(max, target + e.deltaY * 0.72));
      if (!running) {
        running = true;
        raf = requestAnimationFrame(tick);
      }
    };

    const syncTarget = () => {
      if (!running) target = el.scrollTop;
    };

    el.addEventListener('wheel', onWheel, { passive: false });
    el.addEventListener('scroll', syncTarget, { passive: true });
    return () => {
      el.removeEventListener('wheel', onWheel);
      el.removeEventListener('scroll', syncTarget);
      if (raf) cancelAnimationFrame(raf);
    };
  }, []);

  return (
    <div className={cn('relative', compact && 'flex h-full min-h-0 w-full flex-col')}>
      {/* Soft projection cone / bloom — reads as light cast into space */}
      <div
        className={cn(
          'project-holo-glow pointer-events-none absolute rounded-[2.5rem]',
          compact ? '-inset-3' : '-inset-8',
        )}
        style={{
          background: `radial-gradient(ellipse 70% 60% at 50% 45%, ${theme.accent}30 0%, ${theme.accent}10 40%, transparent 70%)`,
        }}
        aria-hidden
      />

      <aside
        role="region"
        aria-label={project.title}
        data-lenis-prevent
        data-lenis-prevent-wheel
        className={cn(
          'project-holo relative flex flex-col overflow-hidden rounded-2xl',
          compact
            ? 'h-full min-h-0 w-full max-w-md'
            : 'h-[min(72vh,560px)] w-[min(90vw,380px)] sm:w-[400px]',
        )}
        style={{
          // Near-transparent cyan glass — key hologram cue from HUD refs
          background: `linear-gradient(180deg, ${theme.accent}18 0%, rgba(0, 20, 40, 0.22) 55%, ${theme.accent}0d 100%)`,
          border: `1px solid ${theme.accent}70`,
          boxShadow: `
            0 0 12px ${theme.accent}40,
            0 0 40px ${theme.accent}22,
            inset 0 0 24px ${theme.accent}20,
            inset 0 0 60px ${theme.accent}0a,
            inset 0 1px 0 rgba(186,230,253,0.35)
          `,
        }}
        onPointerDown={(e) => e.stopPropagation()}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Fresnel rim — brighter edges, dimmer center */}
        <div
          className="pointer-events-none absolute inset-0 rounded-2xl"
          style={{
            background: `
              radial-gradient(ellipse at center, transparent 40%, ${theme.accent}14 100%),
              linear-gradient(90deg, ${theme.accent}22 0%, transparent 12%, transparent 88%, ${theme.accent}22 100%)
            `,
          }}
          aria-hidden
        />

        {/* Soft holographic banding (very light — not CRT film) */}
        <div className="project-holo-bands pointer-events-none absolute inset-0 rounded-2xl" aria-hidden />

        {/* Moving iridescent reflection */}
        <div className="project-holo-sheen pointer-events-none absolute inset-0 rounded-2xl" aria-hidden />

        <div
          className="relative z-[1] flex shrink-0 items-start justify-between gap-3 px-5 pb-3.5 pt-4 sm:px-6 sm:pt-5"
          style={{ borderBottom: `1px solid ${theme.accent}40` }}
        >
          <div className="min-w-0">
            <p
              className="mb-1 font-mono text-[10px] font-light uppercase tracking-[0.28em]"
              style={{ color: theme.accent, textShadow: `0 0 10px ${theme.accent}88` }}
            >
              {project.eyebrow}
            </p>
            <h3
              className="text-xl font-medium tracking-wide text-cyan-50 sm:text-[1.35rem]"
              style={{
                color: '#e0f7ff',
                textShadow: `0 0 12px ${theme.accent}66, 0 0 28px ${theme.accent}33`,
              }}
            >
              {project.title}
            </h3>
            {project.period ? (
              <p className="mt-1 font-mono text-[11px] font-light" style={{ color: `${theme.accent}aa` }}>
                {project.period}
              </p>
            ) : null}
          </div>
          <button
            type="button"
            onClick={onClose}
            className="shrink-0 rounded-full border px-3 py-1 font-mono text-[10px] uppercase tracking-[0.16em] transition-all hover:brightness-125"
            style={{
              borderColor: `${theme.accent}70`,
              color: theme.accent,
              background: `${theme.accent}18`,
              boxShadow: `0 0 14px ${theme.accent}33`,
            }}
          >
            {closeLabel}
          </button>
        </div>

        <div
          ref={scrollRef}
          data-project-card-scroll
          className="project-modal-scroll relative z-[1] min-h-0 flex-1 overflow-y-auto overscroll-contain px-5 py-4 sm:px-6"
          style={{ overscrollBehavior: 'contain', touchAction: 'pan-y' }}
        >
          <p className="mb-4 text-[13px] font-light leading-relaxed text-cyan-50/75 sm:text-sm">
            {project.description}
          </p>

          <ul className="mb-4 space-y-2.5">
            {project.highlights.map((item) => (
              <li
                key={item}
                className="flex gap-2.5 text-[12px] font-light leading-relaxed text-cyan-50/65 sm:text-[13px]"
              >
                <span
                  className="mt-[7px] h-px w-3 shrink-0"
                  style={{
                    background: theme.accent,
                    boxShadow: `0 0 8px ${theme.accent}`,
                  }}
                  aria-hidden
                />
                <span>{item}</span>
              </li>
            ))}
          </ul>

          <div className="mb-1 flex flex-wrap gap-1.5">
            {project.tags.map((tag) => (
              <span
                key={tag}
                className="rounded-full border px-2.5 py-0.5 font-mono text-[10px] font-light uppercase tracking-[0.14em]"
                style={{
                  borderColor: `${theme.accent}55`,
                  background: 'transparent',
                  color: theme.accent,
                  boxShadow: `0 0 10px ${theme.accent}22`,
                }}
              >
                {tag}
              </span>
            ))}
          </div>

          <div className="mt-4">
            {hasRepo ? (
              <a
                href={project.repoUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 font-mono text-[11px] uppercase tracking-[0.16em] transition-opacity hover:opacity-90"
                style={{ color: theme.accent, textShadow: `0 0 10px ${theme.accent}66` }}
              >
                <Github className="h-3.5 w-3.5" />
                {visitRepoLabel}
              </a>
            ) : (
              <span className="inline-flex items-center gap-2 font-mono text-[11px] uppercase tracking-[0.16em] text-cyan-100/30">
                <Lock className="h-3.5 w-3.5" />
                {privateRepoLabel}
              </span>
            )}
          </div>
        </div>
      </aside>
    </div>
  );
}

function OrbitingSatellite({
  project,
  selected,
  dimmed,
  hovered,
  onSelect,
  onHover,
}: {
  project: ProjectItem;
  selected: boolean;
  dimmed: boolean;
  hovered: boolean;
  onSelect: (id: string) => void;
  onHover: (id: string | null) => void;
}) {
  const group = useRef<THREE.Group>(null);
  const angle = useRef(getOrbit(project.id).angle0);
  const orbit = getOrbit(project.id);
  const theme = getProjectTheme(project.id);
  const size = useThree((s) => s.size);
  const mobile = isMobileLayout(size.width);
  const active = selected || hovered;
  // Per-instance scratch — shared globals flicker when many sats update in one frame
  const scratch = useMemo(
    () => ({
      pos: new THREE.Vector3(),
      m: new THREE.Matrix4(),
      q: new THREE.Quaternion(),
      qNadir: new THREE.Quaternion(),
    }),
    [],
  );

  useFrame((_, dt) => {
    const g = group.current;
    if (!g) return;
    const capped = Math.min(dt, mobile ? 0.05 : 0.033);

    // Selected sat is rendered sharp on the overlay canvas — hide here
    if (selected) {
      g.visible = false;
      return;
    }
    g.visible = !dimmed;

    angle.current += orbit.speed * capped;
    orbitPoint(angle.current, orbit, scratch.pos);

    // Direct placement on mobile — lerp + variable frame times reads as flicker
    if (mobile) {
      g.position.copy(scratch.pos);
    } else {
      g.position.lerp(scratch.pos, 1 - Math.exp(-6 * capped));
    }

    const targetScale = dimmed
      ? orbit.scale * 0.85
      : hovered
        ? orbit.scale * (mobile ? 1.12 : 1.2)
        : orbit.scale;
    if (mobile && !hovered && !dimmed) {
      g.scale.setScalar(targetScale);
    } else {
      g.scale.setScalar(THREE.MathUtils.damp(g.scale.x, targetScale, mobile ? 4 : 6, capped));
    }

    scratch.m.lookAt(g.position, _lookTarget, _up);
    scratch.qNadir.setFromRotationMatrix(scratch.m);
    scratch.q.copy(scratch.qNadir).multiply(_qOffset);
    if (mobile) {
      g.quaternion.slerp(scratch.q, 1 - Math.exp(-8 * capped));
    } else {
      g.quaternion.slerp(scratch.q, 1 - Math.exp(-4 * capped));
    }
  });

  return (
    <group
      ref={group}
      renderOrder={2}
      onClick={(e) => {
        e.stopPropagation();
        onSelect(project.id);
      }}
      onPointerOver={(e) => {
        e.stopPropagation();
        onHover(project.id);
        document.body.style.cursor = 'pointer';
      }}
      onPointerOut={() => {
        onHover(null);
        document.body.style.cursor = 'default';
      }}
    >
      <Suspense fallback={null}>
        <SatelliteModel />
      </Suspense>

      <mesh visible={false}>
        <sphereGeometry args={[2.8, 10, 10]} />
      </mesh>

      {active && !dimmed && !selected && !mobile ? (
        <pointLight
          position={[0, 2, 4]}
          intensity={0.7}
          color={theme.accent}
          distance={18}
        />
      ) : null}
    </group>
  );
}

/** Sharp upright sat beside the project card — cinematic GSAP intro */
function ShowcaseSatellite({
  accent,
  simple = false,
}: {
  accent: string;
  simple?: boolean;
}) {
  const root = useRef<THREE.Group>(null);
  const { camera } = useThree();
  const look = useMemo(() => new THREE.Vector3(0, -0.05, 0), []);
  const [introDone, setIntroDone] = useState(false);
  const [autoSpin, setAutoSpin] = useState(false);
  const introLock = useRef(true);

  // Keep framing locked on the craft while GSAP moves the camera (prevents end snap)
  useFrame(() => {
    if (introLock.current) camera.lookAt(look);
  });

  useLayoutEffect(() => {
    const g = root.current;
    if (!g) return;

    const reduced =
      typeof window !== 'undefined' &&
      window.matchMedia('(prefers-reduced-motion: reduce)').matches;

    let spinTimer = 0;

    const settle = () => {
      camera.position.set(0, 0.06, simple ? 4.1 : 3.6);
      camera.lookAt(look);
      g.scale.setScalar(SHOWCASE_SCALE);
      g.position.set(0, -0.05, 0);
      g.rotation.set(...SHOWCASE_ROT);
      introLock.current = false;
      setIntroDone(true);
      spinTimer = window.setTimeout(() => setAutoSpin(true), simple ? 200 : 900);
    };

    if (reduced || simple) {
      settle();
      return () => {
        if (spinTimer) window.clearTimeout(spinTimer);
      };
    }

    introLock.current = true;

    // Cold open — far / small / rolled away from hero angle
    g.scale.setScalar(SHOWCASE_SCALE * 0.28);
    g.position.set(0.55, -0.7, 0.1);
    g.rotation.set(SHOWCASE_ROT[0] + 0.2, SHOWCASE_ROT[1] + 1.15, SHOWCASE_ROT[2] - 0.28);
    camera.position.set(1.35, 0.55, 7.1);
    camera.lookAt(look);

    const tl = gsap.timeline({
      defaults: { overwrite: 'auto' },
      onComplete: settle,
    });

    // Dolly + lateral drift into hero frame
    tl.to(
      camera.position,
      { x: 0, y: 0.06, z: 3.6, duration: 1.65, ease: 'cinematic' },
      0,
    );

    // Craft rises into place, scales up, unwinds yaw
    tl.to(
      g.scale,
      {
        x: SHOWCASE_SCALE,
        y: SHOWCASE_SCALE,
        z: SHOWCASE_SCALE,
        duration: 1.45,
        ease: 'filmOut',
      },
      0.12,
    );
    tl.to(
      g.position,
      { x: 0, y: -0.05, z: 0, duration: 1.45, ease: 'filmOut' },
      0.12,
    );
    tl.to(
      g.rotation,
      {
        x: SHOWCASE_ROT[0],
        y: SHOWCASE_ROT[1],
        z: SHOWCASE_ROT[2],
        duration: 1.7,
        ease: 'cinematic',
      },
      0.05,
    );

    return () => {
      tl.kill();
      introLock.current = false;
      if (spinTimer) window.clearTimeout(spinTimer);
    };
  }, [camera, look, simple]);

  return (
    <>
      <ambientLight intensity={0.55} />
      <directionalLight position={[3, 4, 5]} intensity={2.6} color="#fff6ea" />
      <directionalLight position={[-4, 1, -2]} intensity={0.45} color="#7aa0d0" />
      <pointLight position={[1.2, 1, 3]} intensity={1.35} color={accent} distance={12} />

      {/* Mount controls only AFTER intro — avoids OrbitControls.update() snapping the camera */}
      {introDone ? (
        <OrbitControls
          makeDefault
          enableDamping
          dampingFactor={0.08}
          enablePan={false}
          enableZoom={false}
          minPolarAngle={Math.PI * 0.3}
          maxPolarAngle={Math.PI * 0.7}
          autoRotate={autoSpin}
          autoRotateSpeed={0.35}
          target={[0, -0.05, 0]}
          onStart={() => setAutoSpin(false)}
          onEnd={() => {
            window.setTimeout(() => setAutoSpin(true), 2400);
          }}
        />
      ) : null}

      <group
        ref={root}
        scale={SHOWCASE_SCALE * 0.28}
        rotation={[SHOWCASE_ROT[0] + 0.2, SHOWCASE_ROT[1] + 1.15, SHOWCASE_ROT[2] - 0.28]}
        position={[0.55, -0.7, 0.1]}
      >
        <Suspense fallback={null}>
          <SatelliteModel />
        </Suspense>
      </group>
    </>
  );
}

function OrbitGuides({
  items,
  hoveredId,
  selectedId,
  onSelect,
  onHover,
}: {
  items: ProjectItem[];
  hoveredId: string | null;
  selectedId: string | null;
  onSelect: (id: string) => void;
  onHover: (id: string | null) => void;
}) {
  const orbits = useMemo(() => {
    const tmp = new THREE.Vector3();
    return items.map((p) => {
      const o = getOrbit(p.id);
      const pts: [number, number, number][] = [];
      for (let i = 0; i <= 96; i++) {
        orbitPoint((i / 96) * Math.PI * 2, o, tmp);
        pts.push([tmp.x, tmp.y, tmp.z]);
      }
      return { id: p.id, points: pts, color: getProjectTheme(p.id).accent };
    });
  }, [items]);

  const focusMode = selectedId != null;
  const size = useThree((s) => s.size);
  const mobile = isMobileLayout(size.width);

  return (
    <>
      {orbits.map(({ id, points, color }) => {
        const active = selectedId === id || hoveredId === id;
        const opacity = focusMode
          ? active
            ? 0.06
            : 0.02
          : active
            ? mobile
              ? 0.35
              : 0.5
            : mobile
              ? 0.12
              : 0.18;
        return (
          <group key={id} renderOrder={0}>
            <Line
              points={points}
              color={color}
              transparent
              opacity={opacity}
              lineWidth={active && !focusMode ? (mobile ? 1.2 : 2) : 1}
              depthWrite={false}
              renderOrder={0}
            />
            {!focusMode ? (
              <Line
                points={points}
                color={color}
                transparent
                opacity={0}
                lineWidth={mobile ? 14 : 8}
                depthWrite={false}
                renderOrder={0}
                onClick={(e) => {
                  e.stopPropagation();
                  onSelect(id);
                }}
                onPointerOver={(e) => {
                  e.stopPropagation();
                  onHover(id);
                  document.body.style.cursor = 'pointer';
                }}
                onPointerOut={() => {
                  onHover(null);
                  document.body.style.cursor = 'default';
                }}
              />
            ) : null}
          </group>
        );
      })}
    </>
  );
}



function FreePageScroll() {
  const gl = useThree((s) => s.gl);

  useEffect(() => {
    const el = gl.domElement;
    el.style.touchAction = 'pan-y';

    // Canvas sits over the page — forward wheel to Lenis (not window.scrollBy),
    // otherwise smooth scroll and native jumps fight each other and feel stuck.
    const onWheel = (e: WheelEvent) => {
      const lenis = getLenisInstance();
      if (lenis) {
        e.preventDefault();
        e.stopPropagation();
        // Use targetScroll so rapid wheel ticks accumulate instead of fighting the lerp
        lenis.scrollTo(lenis.targetScroll + e.deltaY);
        return;
      }
      // No Lenis (reduced motion): let the browser scroll normally
    };

    el.addEventListener('wheel', onWheel, { passive: false });
    return () => el.removeEventListener('wheel', onWheel);
  }, [gl]);

  return null;
}

function CameraRig({
  controlsRef,
  mobile,
}: {
  controlsRef: MutableRefObject<ControlsRef | null>;
  mobile: boolean;
}) {
  useFrame((_, dt) => {
    const controls = controlsRef.current;
    if (!controls) return;
    const targetY = mobile ? 0.18 : 0.3;
    _origin.set(0, targetY, 0);
    controls.target.lerp(_origin, 1 - Math.exp(-2.2 * Math.min(dt, 0.033)));
    controls.update();
  });
  return null;
}

/** Pull camera back + shrink system on narrow canvases so orbits stay in frame. */
function AdaptiveBeltFrame({ children }: { children: ReactNode }) {
  const { camera, size } = useThree();
  const mobile = isMobileLayout(size.width);

  useLayoutEffect(() => {
    const cam = camera as THREE.PerspectiveCamera;
    const cfg = mobile ? CAM_MOBILE : CAM;
    cam.position.set(cfg.position[0], cfg.position[1], cfg.position[2]);
    cam.fov = cfg.fov;
    cam.updateProjectionMatrix();
  }, [camera, mobile]);

  return (
    <group position={[0, mobile ? 0.12 : 0.3, 0]} scale={mobile ? SCENE_SCALE_MOBILE : SCENE_SCALE}>
      {children}
    </group>
  );
}

function BeltScene({
  items,
  selectedId,
  hoveredId,
  onSelect,
  onHover,
  onClear,
}: {
  items: ProjectItem[];
  selectedId: string | null;
  hoveredId: string | null;
  onSelect: (id: string) => void;
  onHover: (id: string | null) => void;
  onClear: () => void;
}) {
  const controlsRef = useRef<ControlsRef | null>(null);
  const [spinEnabled, setSpinEnabled] = useState(true);
  const size = useThree((s) => s.size);
  const mobile = isMobileLayout(size.width);
  const focusMode = selectedId != null;

  return (
    <>
      <FreePageScroll />
      <ambientLight intensity={focusMode ? 0.2 : 0.18} />
      <directionalLight position={[5, 2.5, 3]} intensity={focusMode ? 2.2 : 2.4} color="#fff4e0" />
      <directionalLight position={[-3, -1, -2]} intensity={0.28} color="#4a6fa5" />
      <Environment preset="night" environmentIntensity={focusMode ? 0.35 : 0.3} />

      <OrbitControls
        ref={controlsRef}
        makeDefault
        enableDamping
        dampingFactor={0.08}
        enablePan={false}
        enableZoom={false}
        minDistance={mobile ? 10.2 : 8.8}
        maxDistance={mobile ? 13 : 12}
        maxPolarAngle={Math.PI * (mobile ? 0.68 : 0.72)}
        minPolarAngle={Math.PI * (mobile ? 0.32 : 0.28)}
        autoRotate={spinEnabled && !selectedId && !hoveredId}
        autoRotateSpeed={mobile ? 0.32 : 0.4}
        enabled={!focusMode}
        onStart={() => setSpinEnabled(false)}
        onEnd={() => {
          window.setTimeout(() => setSpinEnabled(true), 2500);
        }}
      />

      <CameraRig controlsRef={controlsRef} mobile={mobile} />

      <AdaptiveBeltFrame>
        <Suspense fallback={null}>
          <RealEarth dimmed={focusMode} onSelectEarth={onClear} />
        </Suspense>

        <OrbitGuides
          items={items}
          hoveredId={hoveredId}
          selectedId={selectedId}
          onSelect={onSelect}
          onHover={onHover}
        />

        {items.map((project) => (
          <OrbitingSatellite
            key={project.id}
            project={project}
            selected={selectedId === project.id}
            dimmed={focusMode && selectedId !== project.id}
            hovered={hoveredId === project.id}
            onSelect={onSelect}
            onHover={onHover}
          />
        ))}
      </AdaptiveBeltFrame>
    </>
  );
}

function FocusOverlay({
  project,
  closeLabel,
  visitRepoLabel,
  privateRepoLabel,
  onClose,
  onBackdropClose,
  onSatEmptyClose,
  markKeepOpen,
  interactRef,
}: {
  project: ProjectItem;
  closeLabel: string;
  visitRepoLabel: string;
  privateRepoLabel: string;
  onClose: () => void;
  onBackdropClose: () => void;
  onSatEmptyClose: () => void;
  markKeepOpen: () => void;
  interactRef: MutableRefObject<{
    suppressClose: boolean;
    pointerStartX: number;
    pointerStartY: number;
    moved: boolean;
    satMoved: boolean;
  }>;
}) {
  const rootRef = useRef<HTMLDivElement>(null);
  const backdropRef = useRef<HTMLDivElement>(null);
  const satRef = useRef<HTMLDivElement>(null);
  const cardRef = useRef<HTMLDivElement>(null);
  const closingRef = useRef(false);
  const theme = getProjectTheme(project.id);
  const [mobile, setMobile] = useState(() =>
    typeof window !== 'undefined' ? window.matchMedia('(max-width: 768px)').matches : false,
  );

  useEffect(() => {
    const mq = window.matchMedia('(max-width: 768px)');
    const sync = () => setMobile(mq.matches);
    sync();
    mq.addEventListener('change', sync);
    return () => mq.removeEventListener('change', sync);
  }, []);

  const playExit = useCallback(
    (then: () => void) => {
      if (closingRef.current) return;
      closingRef.current = true;
      const root = rootRef.current;
      if (!root) {
        then();
        return;
      }
      gsap.to(root, {
        autoAlpha: 0,
        duration: mobile ? 0.18 : 0.28,
        ease: 'power2.in',
        overwrite: true,
        onComplete: then,
      });
    },
    [mobile],
  );

  const requestClose = useCallback(() => {
    playExit(onClose);
  }, [onClose, playExit]);

  useLayoutEffect(() => {
    closingRef.current = false;
    const backdrop = backdropRef.current;
    const sat = satRef.current;
    const card = cardRef.current;
    if (!backdrop || !card) return;

    const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    const targets = sat ? [backdrop, sat, card] : [backdrop, card];
    gsap.killTweensOf(targets);

    if (reduced) {
      gsap.set(targets, { autoAlpha: 1, clearProps: 'transform' });
      return;
    }

    // Mobile: card-only — no satellite WebGL
    if (mobile) {
      gsap.set(backdrop, { autoAlpha: 0 });
      gsap.set(card, { autoAlpha: 0, y: 20, force3D: true });
      const tl = gsap.timeline({ defaults: { ease: 'power2.out', force3D: true } });
      tl.to(backdrop, { autoAlpha: 1, duration: 0.2 }, 0);
      tl.to(card, { autoAlpha: 1, y: 0, duration: 0.3 }, 0.03);
      return () => {
        tl.kill();
      };
    }

    if (!sat) return;

    gsap.set(backdrop, { autoAlpha: 0 });
    gsap.set(sat, { autoAlpha: 0 });
    gsap.set(card, {
      autoAlpha: 0,
      y: 18,
      force3D: true,
    });

    const tl = gsap.timeline({ defaults: { ease: 'filmOut', force3D: true } });
    tl.to(backdrop, { autoAlpha: 1, duration: 0.55, ease: 'power2.out' }, 0);
    tl.to(sat, { autoAlpha: 1, duration: 0.65, ease: 'power2.out' }, 0.08);
    tl.to(
      card,
      {
        autoAlpha: 1,
        y: 0,
        duration: 0.65,
        ease: 'cinematic',
      },
      0.78,
    );

    return () => {
      tl.kill();
    };
  }, [project.id, mobile]);

  return (
    <div
      ref={rootRef}
      data-project-focus
      data-lenis-prevent
      data-lenis-prevent-wheel
      className={cn(
        'fixed inset-0 z-[60] flex items-center justify-center',
        mobile
          ? 'px-3 pb-[max(0.75rem,env(safe-area-inset-bottom))] pt-[calc(3.5rem+env(safe-area-inset-top,0px))]'
          : 'p-4 pt-[calc(3.5rem+0.5rem)] sm:p-6 sm:pt-[calc(4rem+0.5rem)]',
      )}
      onPointerDown={(e) => {
        if ((e.target as Element).closest?.('[data-project-satellite], [data-project-modal]')) {
          return;
        }
        interactRef.current.pointerStartX = e.clientX;
        interactRef.current.pointerStartY = e.clientY;
        interactRef.current.moved = false;
      }}
      onPointerMove={(e) => {
        if (e.buttons === 0) return;
        const dx = e.clientX - interactRef.current.pointerStartX;
        const dy = e.clientY - interactRef.current.pointerStartY;
        if (Math.hypot(dx, dy) > 10) interactRef.current.moved = true;
      }}
      onClick={(e) => {
        if ((e.target as Element).closest?.('[data-project-satellite], [data-project-modal]')) {
          return;
        }
        if (interactRef.current.suppressClose) {
          interactRef.current.suppressClose = false;
          return;
        }
        if (interactRef.current.moved) {
          interactRef.current.moved = false;
          return;
        }
        playExit(onBackdropClose);
      }}
    >
      <div
        ref={backdropRef}
        className={cn(
          'absolute inset-0 bg-black/70',
          mobile ? 'backdrop-blur-sm' : 'backdrop-blur-md bg-black/60',
        )}
        aria-hidden
      />

      {mobile ? (
        <div
          ref={cardRef}
          className="relative z-10 flex h-[min(78dvh,640px)] w-full max-w-md justify-center pointer-events-auto"
          data-project-modal
          onPointerDown={(e) => {
            e.stopPropagation();
            markKeepOpen();
          }}
          onClick={(e) => e.stopPropagation()}
        >
          <ProjectCard
            project={project}
            closeLabel={closeLabel}
            visitRepoLabel={visitRepoLabel}
            privateRepoLabel={privateRepoLabel}
            onClose={requestClose}
            compact
          />
        </div>
      ) : (
        <div className="relative z-10 flex w-full max-w-6xl flex-col items-center justify-center gap-5 pointer-events-none sm:flex-row sm:items-center sm:gap-7 lg:gap-10">
          <div
            ref={satRef}
            className="relative aspect-square h-auto w-[min(50vw,540px)] shrink-0 overflow-visible pointer-events-auto"
            data-project-satellite
            onPointerDown={(e) => {
              e.stopPropagation();
              interactRef.current.satMoved = false;
              interactRef.current.pointerStartX = e.clientX;
              interactRef.current.pointerStartY = e.clientY;
            }}
            onPointerMove={(e) => {
              if (e.buttons === 0) return;
              const dx = e.clientX - interactRef.current.pointerStartX;
              const dy = e.clientY - interactRef.current.pointerStartY;
              if (Math.hypot(dx, dy) > 8) {
                interactRef.current.satMoved = true;
                markKeepOpen();
              }
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <div
              className="pointer-events-none absolute left-1/2 top-[58%] h-[28%] w-[55%] -translate-x-1/2 rounded-full opacity-70 blur-2xl"
              style={{
                background: `radial-gradient(ellipse at center, ${theme.glow} 0%, transparent 70%)`,
              }}
              aria-hidden
            />
            <Canvas
              dpr={[1, 1.5]}
              gl={{
                antialias: true,
                alpha: true,
                powerPreference: 'high-performance',
                stencil: false,
              }}
              camera={{ position: [1.35, 0.55, 7.1], fov: 34, near: 0.2, far: 60 }}
              frameloop="always"
              onCreated={({ gl }) => {
                gl.setClearColor(0x000000, 0);
                gl.toneMapping = THREE.ACESFilmicToneMapping;
                gl.toneMappingExposure = 1.2;
                gl.domElement.style.outline = 'none';
                gl.domElement.style.touchAction = 'none';
              }}
              onPointerMissed={() => {
                if (interactRef.current.satMoved) {
                  interactRef.current.satMoved = false;
                  return;
                }
                playExit(onSatEmptyClose);
              }}
              className="relative h-full w-full cursor-grab active:cursor-grabbing"
            >
              <ShowcaseSatellite accent={theme.accent} />
            </Canvas>
          </div>

          <div
            ref={cardRef}
            className="w-auto shrink-0 self-center pointer-events-auto will-change-transform"
            data-project-modal
            onPointerDown={(e) => {
              e.stopPropagation();
              markKeepOpen();
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <ProjectCard
              project={project}
              closeLabel={closeLabel}
              visitRepoLabel={visitRepoLabel}
              privateRepoLabel={privateRepoLabel}
              onClose={requestClose}
            />
          </div>
        </div>
      )}
    </div>
  );
}

export function ProjectsSatelliteBelt({
  items,
  closeLabel,
  visitRepoLabel,
  privateRepoLabel,
  interactHint,
  onFocusChange,
  className,
}: ProjectsSatelliteBeltProps) {
  const wrapRef = useRef<HTMLDivElement>(null);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [hoveredId, setHoveredId] = useState<string | null>(null);
  const [inView, setInView] = useState(true);
  const [reduced, setReduced] = useState(false);
  const [ready, setReady] = useState(false);

  const selected = useMemo(
    () => items.find((p) => p.id === selectedId) ?? null,
    [items, selectedId],
  );

  const close = useCallback(() => setSelectedId(null), []);
  const interactRef = useRef({
    suppressClose: false,
    pointerStartX: 0,
    pointerStartY: 0,
    moved: false,
    satMoved: false,
  });

  const markKeepOpen = useCallback(() => {
    interactRef.current.suppressClose = true;
  }, []);

  const onSelect = useCallback((id: string) => {
    setSelectedId((prev) => (prev === id ? null : id));
  }, []);

  useEffect(() => {
    setReduced(prefersReduced());
    setReady(true);
  }, []);

  useEffect(() => {
    onFocusChange?.(selectedId != null);
    return () => onFocusChange?.(false);
  }, [selectedId, onFocusChange]);

  // Lock page/Lenis scroll while focus overlay is open
  useEffect(() => {
    if (!selectedId) return;

    const onWheel = (e: WheelEvent) => {
      const path = e.composedPath();
      const inFocus = path.some(
        (n) => n instanceof HTMLElement && n.hasAttribute('data-project-focus'),
      );
      if (!inFocus) return;

      const scrollEl = path.find(
        (n) => n instanceof HTMLElement && n.hasAttribute('data-project-card-scroll'),
      ) as HTMLElement | undefined;

      if (scrollEl) {
        // Card owns smooth scroll — only block Lenis/page here
        e.preventDefault();
        return;
      }

      // Backdrop / satellite: block page scroll (OrbitControls still receives the event)
      e.preventDefault();
    };

    window.addEventListener('wheel', onWheel, { passive: false, capture: true });
    const prevHtmlOverflow = document.documentElement.style.overflow;
    const prevBodyOverflow = document.body.style.overflow;
    document.documentElement.style.overflow = 'hidden';
    document.body.style.overflow = 'hidden';

    return () => {
      window.removeEventListener('wheel', onWheel, { capture: true });
      document.documentElement.style.overflow = prevHtmlOverflow;
      document.body.style.overflow = prevBodyOverflow;
    };
  }, [selectedId]);

  useEffect(() => {
    const el = wrapRef.current;
    if (!el) return;
    const io = new IntersectionObserver(
      ([entry]) => setInView(entry.isIntersecting),
      { rootMargin: '100px', threshold: 0.05 },
    );
    io.observe(el);
    return () => io.disconnect();
  }, []);

  useEffect(() => {
    if (!selectedId) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') close();
    };
    const onPointerUp = () => {
      // After a sat/modal drag, clear suppress once the click cycle finishes
      window.setTimeout(() => {
        interactRef.current.suppressClose = false;
      }, 0);
    };
    document.addEventListener('keydown', onKey);
    window.addEventListener('pointerup', onPointerUp);
    return () => {
      document.removeEventListener('keydown', onKey);
      window.removeEventListener('pointerup', onPointerUp);
    };
  }, [selectedId, close]);

  if (!ready) {
    return <div ref={wrapRef} className={cn('h-[420px]', className)} />;
  }

  if (reduced) {
    return (
      <div ref={wrapRef} className={cn('mx-auto max-w-3xl space-y-4', className)}>
        {items.map((project) => {
          const theme = getProjectTheme(project.id);
          return (
            <article
              key={project.id}
              className="rounded-2xl border border-white/10 bg-white/[0.03] p-5"
            >
              <p className="mb-1 text-[10px] uppercase tracking-[0.2em] text-sky-300/60">{project.eyebrow}</p>
              <h3 className="text-xl font-semibold text-white">{project.title}</h3>
              <p className="mt-2 text-sm text-white/55">{project.description}</p>
              {project.repoUrl ? (
                <a
                  href={project.repoUrl}
                  className="mt-3 inline-flex items-center gap-2 text-sm text-sky-300"
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  <Github className="h-3.5 w-3.5" style={{ color: theme.accent }} />
                  {visitRepoLabel}
                </a>
              ) : (
                <span className="mt-3 inline-flex items-center gap-2 text-sm text-white/30">
                  <Lock className="h-3.5 w-3.5" />
                  {privateRepoLabel}
                </span>
              )}
            </article>
          );
        })}
      </div>
    );
  }

  return (
    <div ref={wrapRef} className={cn('absolute inset-0 z-30', className)}>
      {!selectedId ? (
        <p className="pointer-events-none absolute inset-x-0 top-[5.25rem] z-20 px-4 text-center text-[11px] tracking-wide text-white/35 sm:top-[6.5rem] sm:text-xs md:top-28">
          {interactHint}
        </p>
      ) : null}

      <div
        className={cn(
          'absolute inset-0 z-30 overflow-visible',
          selected && 'pointer-events-none',
        )}
      >
        <Canvas
          dpr={[1, 1.5]}
          gl={{
            antialias: true,
            alpha: true,
            powerPreference: 'high-performance',
            stencil: false,
          }}
          camera={{ position: CAM.position, fov: CAM.fov, near: 0.05, far: 120 }}
          frameloop={inView && !selectedId ? 'always' : 'never'}
          onCreated={({ gl }) => {
            gl.setClearColor(0x000000, 0);
            gl.toneMapping = THREE.ACESFilmicToneMapping;
            gl.toneMappingExposure = 1.12;
            gl.domElement.style.touchAction = 'pan-y';
          }}
          onPointerMissed={() => close()}
          className="h-full w-full cursor-grab active:cursor-grabbing"
          style={{ touchAction: 'pan-y' }}
        >
          <BeltScene
            items={items}
            selectedId={selectedId}
            hoveredId={hoveredId}
            onSelect={onSelect}
            onHover={setHoveredId}
            onClear={close}
          />
        </Canvas>

        {!selectedId ? (
          <div className="pointer-events-none absolute inset-x-0 bottom-6 z-40 flex flex-wrap justify-center gap-1.5 px-2 sm:bottom-12 sm:gap-3">
            {items.map((p) => {
              const theme = getProjectTheme(p.id);
              const active = hoveredId === p.id;
              return (
                <button
                  key={p.id}
                  type="button"
                  className={cn(
                    'pointer-events-auto rounded-full border px-2.5 py-1 text-[10px] font-medium tracking-wide transition-all sm:px-3 sm:text-[11px]',
                    active
                      ? 'border-white/30 bg-white/10 text-white'
                      : 'border-white/10 bg-black/30 text-white/45 hover:border-white/25 hover:text-white/80',
                  )}
                  style={active ? { boxShadow: `0 0 14px ${theme.glow}` } : undefined}
                  onMouseEnter={() => setHoveredId(p.id)}
                  onMouseLeave={() => setHoveredId(null)}
                  onClick={() => onSelect(p.id)}
                >
                  {p.title}
                </button>
              );
            })}
          </div>
        ) : null}
      </div>

      {selected
        ? createPortal(
            <FocusOverlay
              key={selected.id}
              project={selected}
              closeLabel={closeLabel}
              visitRepoLabel={visitRepoLabel}
              privateRepoLabel={privateRepoLabel}
              onClose={close}
              onBackdropClose={close}
              onSatEmptyClose={close}
              markKeepOpen={markKeepOpen}
              interactRef={interactRef}
            />,
            document.body,
          )
        : null}
    </div>
  );
}

useGLTF.preload(SAT_MODEL);
