type TouchScrollListener = (active: boolean) => void;

const listeners = new Set<TouchScrollListener>();
let active = false;
let touches = 0;
let armed = false;

function emit(next: boolean) {
  if (active === next) return;
  active = next;
  listeners.forEach((fn) => fn(active));
}

function ensureArmed() {
  if (armed || typeof window === 'undefined') return;
  armed = true;

  window.addEventListener(
    'touchstart',
    () => {
      touches += 1;
      emit(true);
    },
    { passive: true, capture: true },
  );

  const onEnd = () => {
    touches = Math.max(0, touches - 1);
    if (touches === 0) emit(false);
  };

  window.addEventListener('touchend', onEnd, { passive: true, capture: true });
  window.addEventListener('touchcancel', onEnd, { passive: true, capture: true });
}

/** True while at least one finger is down (mobile touch-scroll). */
export function isTouchScrolling() {
  return active;
}

/** Subscribe to touch-scroll active state. Returns unsubscribe. */
export function subscribeTouchScroll(listener: TouchScrollListener) {
  ensureArmed();
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
  };
}
