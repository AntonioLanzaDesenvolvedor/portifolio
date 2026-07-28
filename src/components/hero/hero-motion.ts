/** Shared motion between DOM/GSAP and the shader atmosphere (no React re-renders for tracking). */
export const heroMotion = {
  mouseX: 0,
  mouseY: 0,
  /** Smoothed pointer velocity (0–1+) — drives distortion / energy */
  velocity: 0,
  /** 1 while pointer is down inside the hero */
  press: 0,
  scroll: 0,
  intro: 0,
};
