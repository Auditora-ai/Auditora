/**
 * Lightweight canvas-based confetti effect.
 * No external dependencies. Creates a temporary full-screen canvas,
 * animates particles with gravity, and removes itself after duration.
 */

interface Particle {
  x: number;
  y: number;
  vx: number;
  vy: number;
  size: number;
  color: string;
  rotation: number;
  rotationSpeed: number;
  opacity: number;
}

const COLORS = ["#3B8FE8", "#FFFFFF", "#2E7FD6", "#F1F5F9"];

export function launchConfetti({
  particleCount = 50,
  duration = 2500,
}: { particleCount?: number; duration?: number } = {}): void {
  if (typeof window === "undefined") return;
  if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;

  const canvas = document.createElement("canvas");
  canvas.style.cssText =
    "position:fixed;inset:0;z-index:9999;pointer-events:none;";
  canvas.width = window.innerWidth;
  canvas.height = window.innerHeight;
  document.body.appendChild(canvas);

  const ctx = canvas.getContext("2d");
  if (!ctx) {
    canvas.remove();
    return;
  }

  const particles: Particle[] = Array.from({ length: particleCount }, () => ({
    x: canvas.width * 0.5 + (Math.random() - 0.5) * canvas.width * 0.4,
    y: canvas.height * 0.4,
    vx: (Math.random() - 0.5) * 8,
    vy: -Math.random() * 10 - 4,
    size: Math.random() * 6 + 3,
    color: COLORS[Math.floor(Math.random() * COLORS.length)]!,
    rotation: Math.random() * Math.PI * 2,
    rotationSpeed: (Math.random() - 0.5) * 0.2,
    opacity: 1,
  }));

  const start = performance.now();

  function animate(now: number) {
    const elapsed = now - start;
    if (elapsed > duration) {
      canvas.remove();
      return;
    }

    ctx!.clearRect(0, 0, canvas.width, canvas.height);

    const fadeStart = duration * 0.6;
    const globalFade =
      elapsed > fadeStart ? 1 - (elapsed - fadeStart) / (duration - fadeStart) : 1;

    for (const p of particles) {
      p.x += p.vx;
      p.vy += 0.15; // gravity
      p.y += p.vy;
      p.rotation += p.rotationSpeed;
      p.opacity = globalFade;

      ctx!.save();
      ctx!.translate(p.x, p.y);
      ctx!.rotate(p.rotation);
      ctx!.globalAlpha = p.opacity;
      ctx!.fillStyle = p.color;
      ctx!.fillRect(-p.size / 2, -p.size / 4, p.size, p.size / 2);
      ctx!.restore();
    }

    requestAnimationFrame(animate);
  }

  requestAnimationFrame(animate);
}
