import { useEffect, useRef } from 'react';
import type { ElementType } from '../types/genshin';

interface CelestialBackdropProps {
  ambientElement: ElementType | 'Default';
}

const AMBIENT_RGB: Record<ElementType | 'Default', [number, number, number]> = {
  Default: [229, 198, 135],
  Cryo: [127, 212, 252],
  Electro: [179, 159, 242],
  Pyro: [244, 139, 102],
  Geo: [237, 200, 110],
  Dendro: [126, 209, 118],
  Hydro: [90, 180, 235],
  Anemo: [102, 230, 208],
};

interface BgStar {
  x: number;
  y: number;
  r: number;
  depth: number; // 0.25..1 for subtle 3D parallax
  phase: number;
  speed: number;
  isStarShape: boolean;
  tint: 'gold' | 'ivory' | 'ambient';
}

interface CursorMote {
  x: number;
  y: number;
  vx: number;
  vy: number;
  size: number;
  age: number;
  life: number;
  rotation: number;
  vRot: number;
  isStar: boolean;
  rgb: [number, number, number];
  maxAlpha: number;
}

/** Draw a crisp, ultra-delicate 4-point Genshin Primogem star */
function drawFourPointStar(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  radius: number,
  rotation: number
) {
  const inner = radius * 0.24;
  ctx.save();
  ctx.translate(x, y);
  ctx.rotate(rotation);
  ctx.beginPath();
  for (let i = 0; i < 8; i++) {
    const r = i % 2 === 0 ? radius : inner;
    const angle = (i * Math.PI) / 4;
    const px = Math.cos(angle) * r;
    const py = Math.sin(angle) * r;
    if (i === 0) ctx.moveTo(px, py);
    else ctx.lineTo(px, py);
  }
  ctx.closePath();
  ctx.fill();
  ctx.restore();
}

export function CelestialBackdrop({ ambientElement }: CelestialBackdropProps) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const ambientRef = useRef<[number, number, number]>(
    AMBIENT_RGB[ambientElement] ?? AMBIENT_RGB.Default
  );

  useEffect(() => {
    ambientRef.current = AMBIENT_RGB[ambientElement] ?? AMBIENT_RGB.Default;
  }, [ambientElement]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const reducedMotion = window.matchMedia(
      '(prefers-reduced-motion: reduce)'
    ).matches;
    const isCoarsePointer = window.matchMedia('(pointer: coarse)').matches;

    let width = window.innerWidth;
    let height = window.innerHeight;
    let dpr = Math.min(window.devicePixelRatio || 1, 2);

    const resize = () => {
      width = window.innerWidth;
      height = window.innerHeight;
      dpr = Math.min(window.devicePixelRatio || 1, 2);
      canvas.width = Math.floor(width * dpr);
      canvas.height = Math.floor(height * dpr);
      canvas.style.width = `${width}px`;
      canvas.style.height = `${height}px`;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    };
    resize();

    // Seed atmospheric starfield with layered depth & crisp shimmer
    const starCount = Math.min(78, Math.max(44, Math.floor((width * height) / 19500)));
    const stars: BgStar[] = Array.from({ length: starCount }, (_, i) => ({
      x: Math.random() * width,
      y: Math.random() * height,
      r: i % 7 === 0 ? 2.1 + Math.random() * 1.3 : 0.75 + Math.random() * 1.05,
      depth: 0.3 + Math.random() * 0.7,
      phase: Math.random() * Math.PI * 2,
      speed: 0.7 + Math.random() * 1.15,
      isStarShape: i % 7 === 0,
      tint: i % 4 === 0 ? 'ambient' : i % 2 === 0 ? 'gold' : 'ivory',
    }));

    const motes: CursorMote[] = [];
    const pointer = {
      x: width * 0.5,
      y: height * 0.5,
      smoothX: width * 0.5,
      smoothY: height * 0.5,
      active: false,
      lastSpawnX: -999,
      lastSpawnY: -999,
      lastSpawnTime: 0,
    };

    // Smoothly interpolated RGB for subtle ambient transitions
    const currentRgb: [number, number, number] = [...ambientRef.current];

    const spawnMote = (
      x: number,
      y: number,
      isClickBurst = false
    ) => {
      if (reducedMotion || isCoarsePointer) return;
      // Keep particle budget restrained so it stays refined and airy
      if (motes.length >= 26) motes.shift();

      const useAmbient = Math.random() < 0.38;
      const rgb: [number, number, number] = useAmbient
        ? [
            Math.round(currentRgb[0]),
            Math.round(currentRgb[1]),
            Math.round(currentRgb[2]),
          ]
        : Math.random() < 0.65
          ? [246, 224, 174]
          : [246, 240, 228];

      const angle = Math.random() * Math.PI * 2;
      const speed = isClickBurst
        ? 0.5 + Math.random() * 0.75
        : 0.1 + Math.random() * 0.2;

      motes.push({
        x: x + (Math.random() - 0.5) * (isClickBurst ? 4 : 8),
        y: y + (Math.random() - 0.5) * (isClickBurst ? 4 : 8),
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed - (isClickBurst ? 0.18 : 0.24),
        size: isClickBurst
          ? 3.1 + Math.random() * 2.4
          : 1.9 + Math.random() * 2.7,
        age: 0,
        life: isClickBurst
          ? 520 + Math.random() * 260
          : 680 + Math.random() * 360,
        rotation: Math.random() * Math.PI,
        vRot: (Math.random() - 0.5) * 0.02,
        isStar: isClickBurst ? true : Math.random() < 0.55,
        rgb,
        maxAlpha: isClickBurst ? 0.7 : 0.48 + Math.random() * 0.18,
      });
    };

    const handlePointerMove = (e: PointerEvent) => {
      if (e.pointerType !== 'mouse' && e.pointerType !== 'pen') return;
      pointer.x = e.clientX;
      pointer.y = e.clientY;
      pointer.active = true;

      const dx = e.clientX - pointer.lastSpawnX;
      const dy = e.clientY - pointer.lastSpawnY;
      const dist = Math.hypot(dx, dy);
      const now = performance.now();

      // Distance + cooldown gating keeps the sparkle airy, sparse, and luxury
      if (dist >= 24 && now - pointer.lastSpawnTime >= 36) {
        pointer.lastSpawnX = e.clientX;
        pointer.lastSpawnY = e.clientY;
        pointer.lastSpawnTime = now;
        spawnMote(e.clientX, e.clientY, false);
      }
    };

    const handlePointerDown = (e: PointerEvent) => {
      if (e.pointerType !== 'mouse' && e.pointerType !== 'pen') return;
      for (let i = 0; i < 4; i++) {
        spawnMote(e.clientX, e.clientY, true);
      }
    };

    const handlePointerLeave = () => {
      pointer.active = false;
    };

    window.addEventListener('resize', resize);
    window.addEventListener('pointermove', handlePointerMove, { passive: true });
    window.addEventListener('pointerdown', handlePointerDown, { passive: true });
    document.addEventListener('mouseleave', handlePointerLeave);

    let rafId = 0;
    let lastTime = performance.now();

    const renderFrame = (now: number) => {
      const dt = Math.min(40, now - lastTime);
      lastTime = now;

      // Gently lerp ambient RGB so element shifts glide like twilight clouds
      const target = ambientRef.current;
      for (let i = 0; i < 3; i++) {
        currentRgb[i] += (target[i] - currentRgb[i]) * 0.03;
      }

      // Smooth pointer tracking for parallax & lantern glow
      pointer.smoothX += (pointer.x - pointer.smoothX) * 0.09;
      pointer.smoothY += (pointer.y - pointer.smoothY) * 0.09;

      ctx.clearRect(0, 0, width, height);

      // 1. Soft cursor lantern aura
      if (pointer.active && !isCoarsePointer && !reducedMotion) {
        const lantern = ctx.createRadialGradient(
          pointer.smoothX,
          pointer.smoothY,
          0,
          pointer.smoothX,
          pointer.smoothY,
          175
        );
        lantern.addColorStop(
          0,
          `rgba(${Math.round(currentRgb[0])}, ${Math.round(currentRgb[1])}, ${Math.round(currentRgb[2])}, 0.1)`
        );
        lantern.addColorStop(0.45, 'rgba(246, 224, 174, 0.04)');
        lantern.addColorStop(1, 'rgba(246, 224, 174, 0)');
        ctx.fillStyle = lantern;
        ctx.beginPath();
        ctx.arc(pointer.smoothX, pointer.smoothY, 175, 0, Math.PI * 2);
        ctx.fill();
      }

      // 2. Dimensional twinkling starfield with soft mouse parallax
      const parallaxX = ((pointer.smoothX / Math.max(width, 1)) - 0.5) * -16;
      const parallaxY = ((pointer.smoothY / Math.max(height, 1)) - 0.5) * -12;
      const tSec = now * 0.001;

      for (const s of stars) {
        if (!reducedMotion) {
          // Gentle upward celestial drift
          s.y -= 0.05 * s.depth * (dt / 16.6);
          if (s.y < -10) {
            s.y = height + 10;
            s.x = Math.random() * width;
          }
        }

        const twinkle = reducedMotion
          ? 0.65
          : 0.22 + 0.78 * (0.5 + 0.5 * Math.sin(tSec * s.speed + s.phase));
        const alpha = twinkle * (s.isStarShape ? 0.66 : 0.62) * s.depth;

        const drawX = s.x + parallaxX * s.depth;
        const drawY = s.y + parallaxY * s.depth;

        const rgbStr =
          s.tint === 'ambient'
            ? `${Math.round(currentRgb[0])}, ${Math.round(currentRgb[1])}, ${Math.round(currentRgb[2])}`
            : s.tint === 'gold'
              ? '246, 224, 174'
              : '246, 240, 228';

        if (s.isStarShape) {
          // Soft luminous halo behind larger 4-point shimmering stars
          const halo = ctx.createRadialGradient(
            drawX,
            drawY,
            0,
            drawX,
            drawY,
            s.r * 5.2
          );
          halo.addColorStop(0, `rgba(${rgbStr}, ${alpha * 0.42})`);
          halo.addColorStop(1, `rgba(${rgbStr}, 0)`);
          ctx.fillStyle = halo;
          ctx.beginPath();
          ctx.arc(drawX, drawY, s.r * 5.2, 0, Math.PI * 2);
          ctx.fill();

          ctx.fillStyle = `rgba(${rgbStr}, ${alpha})`;
          drawFourPointStar(ctx, drawX, drawY, s.r * 2.4, tSec * 0.16 + s.phase);
        } else {
          ctx.fillStyle = `rgba(${rgbStr}, ${alpha})`;
          ctx.beginPath();
          ctx.arc(drawX, drawY, s.r, 0, Math.PI * 2);
          ctx.fill();
        }
      }

      // 3. Delicate cursor Primogem motes
      for (let i = motes.length - 1; i >= 0; i--) {
        const m = motes[i];
        m.age += dt;
        if (m.age >= m.life) {
          motes.splice(i, 1);
          continue;
        }

        const p = m.age / m.life;
        // Soft quick fade-in, smooth long fade-out
        const fade = p < 0.16 ? p / 0.16 : Math.pow(1 - (p - 0.16) / 0.84, 1.7);
        const alpha = m.maxAlpha * fade;

        m.x += m.vx * (dt / 16.6);
        m.y += m.vy * (dt / 16.6);
        m.vx *= 0.985;
        m.vy *= 0.985;
        m.rotation += m.vRot * (dt / 16.6);

        const scale = 0.72 + 0.38 * Math.sin(Math.min(1, p * 1.4) * Math.PI * 0.5);
        ctx.fillStyle = `rgba(${m.rgb[0]}, ${m.rgb[1]}, ${m.rgb[2]}, ${alpha})`;

        if (m.isStar) {
          drawFourPointStar(ctx, m.x, m.y, m.size * scale, m.rotation);
        } else {
          ctx.beginPath();
          ctx.arc(m.x, m.y, m.size * 0.42 * scale, 0, Math.PI * 2);
          ctx.fill();
        }
      }

      if (!reducedMotion) {
        rafId = window.requestAnimationFrame(renderFrame);
      }
    };

    const handleVisibility = () => {
      if (document.hidden) {
        window.cancelAnimationFrame(rafId);
      } else if (!reducedMotion) {
        lastTime = performance.now();
        rafId = window.requestAnimationFrame(renderFrame);
      }
    };
    document.addEventListener('visibilitychange', handleVisibility);

    rafId = window.requestAnimationFrame(renderFrame);

    return () => {
      window.cancelAnimationFrame(rafId);
      window.removeEventListener('resize', resize);
      window.removeEventListener('pointermove', handlePointerMove);
      window.removeEventListener('pointerdown', handlePointerDown);
      document.removeEventListener('mouseleave', handlePointerLeave);
      document.removeEventListener('visibilitychange', handleVisibility);
    };
  }, []);

  return (
    <canvas
      ref={canvasRef}
      className="celestial-backdrop-canvas"
      aria-hidden="true"
    />
  );
}
