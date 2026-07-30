import { getLenisInstance } from '@/lib/lenis-instance';

type ScrollPauseListener = (paused: boolean) => void;

const listeners = new Set<ScrollPauseListener>();
let paused = false;
let touches = 0;
let settleTimer = 0;
let armed = false;
let lenisBound: { off: (e: 'scroll', cb: () => void) => void } | null = null;
let lenisRetry = 0;

const SETTLE_MS = 220;

function isCoarse() {
  return typeof window !== 'undefined'
    && window.matchMedia('(pointer: coarse)').matches;
}

function emit(next: boolean) {
  if (paused === next) return;
  paused = next;
  listeners.forEach((fn) => fn(paused));
}

/** Mark scroll activity — stay paused through Lenis/touch inertia. */
function bumpScrollActivity() {
  if (!isCoarse()) return;
  emit(true);
  window.clearTimeout(settleTimer);
  settleTimer = window.setTimeout(() => {
    if (touches === 0) emit(false);
  }, SETTLE_MS);
}

function bindLenis() {
  const lenis = getLenisInstance();
  if (!lenis || lenisBound) return;
  lenis.on('scroll', bumpScrollActivity);
  lenisBound = lenis;
}

function ensureArmed() {
  if (armed || typeof window === 'undefined') return;
  armed = true;

  window.addEventListener(
    'touchstart',
    () => {
      if (!isCoarse()) return;
      touches += 1;
      emit(true);
      window.clearTimeout(settleTimer);
    },
    { passive: true, capture: true },
  );

  const onTouchEnd = () => {
    if (!isCoarse()) return;
    touches = Math.max(0, touches - 1);
    // Finger up — keep paused until momentum scroll settles
    bumpScrollActivity();
  };

  window.addEventListener('touchend', onTouchEnd, { passive: true, capture: true });
  window.addEventListener('touchcancel', onTouchEnd, { passive: true, capture: true });
  window.addEventListener('scroll', bumpScrollActivity, { passive: true });

  bindLenis();
  lenisRetry = window.setInterval(() => {
    bindLenis();
    if (lenisBound) window.clearInterval(lenisRetry);
  }, 50);
  window.setTimeout(() => window.clearInterval(lenisRetry), 2000);
}

/** True on mobile while finger is down or scroll momentum is still running. */
export function isScrollPaused() {
  return paused;
}

/** @deprecated use isScrollPaused */
export function isTouchScrolling() {
  return paused;
}

/**
 * Subscribe to mobile scroll-pause state.
 * Canvases should freeze RAF while paused so dual layers don't flicker.
 */
export function subscribeScrollPause(listener: ScrollPauseListener) {
  ensureArmed();
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
  };
}

/** @deprecated use subscribeScrollPause */
export function subscribeTouchScroll(listener: ScrollPauseListener) {
  return subscribeScrollPause(listener);
}
