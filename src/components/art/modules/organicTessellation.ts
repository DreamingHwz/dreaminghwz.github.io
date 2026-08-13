import { Delaunay } from 'd3-delaunay';
import type { ArtModule, ArtModuleInitOptions } from '../ArtModule';

type RGB = [number, number, number];

interface Point {
  anchorX: number;
  anchorY: number;
  currentX: number;
  currentY: number;
  freqX: number;
  freqY: number;
  phaseX: number;
  phaseY: number;
  ampX: number;
  ampY: number;
  currentColor: RGB;
  targetColor: RGB;
  colorT: number;
  colorDuration: number;
}

const FALLBACK_PALETTE_HEX = ['#c1694a', '#7c8a63', '#b98552', '#6e8390', '#5f6e4e'];
const POINT_COUNT = 36;
const REPEL_RADIUS = 110;
const REPEL_STRENGTH = 34;
const CORNER_ROUNDING = 0.28;

function hexToRgb(hex: string): RGB {
  const clean = hex.trim().replace('#', '');
  const n = parseInt(clean, 16);
  return [(n >> 16) & 255, (n >> 8) & 255, n & 255];
}

function readPalette(): RGB[] {
  if (typeof window === 'undefined') return FALLBACK_PALETTE_HEX.map(hexToRgb);
  const styles = getComputedStyle(document.documentElement);
  const varNames = ['--color-terracotta', '--color-sage', '--color-clay', '--color-slate', '--color-moss'];
  const values = varNames.map((name) => styles.getPropertyValue(name).trim());
  return values.every(Boolean) ? values.map(hexToRgb) : FALLBACK_PALETTE_HEX.map(hexToRgb);
}

function lerp(a: number, b: number, t: number) {
  return a + (b - a) * t;
}

function easeInOut(t: number) {
  return t < 0.5 ? 2 * t * t : 1 - Math.pow(-2 * t + 2, 2) / 2;
}

function randomPaletteColor(palette: RGB[], exclude?: RGB): RGB {
  let color = palette[Math.floor(Math.random() * palette.length)];
  if (exclude) {
    let guard = 0;
    while (color === exclude && guard++ < 8) {
      color = palette[Math.floor(Math.random() * palette.length)];
    }
  }
  return color;
}

function roundedPolygonPath(ctx: CanvasRenderingContext2D, ring: Array<[number, number]>) {
  const pts = ring.slice(0, -1);
  if (pts.length < 3) return;

  ctx.beginPath();
  for (let i = 0; i < pts.length; i++) {
    const p0 = pts[(i - 1 + pts.length) % pts.length];
    const p1 = pts[i];
    const p2 = pts[(i + 1) % pts.length];

    const d01 = Math.hypot(p1[0] - p0[0], p1[1] - p0[1]);
    const d12 = Math.hypot(p2[0] - p1[0], p2[1] - p1[1]);
    const r = Math.min(CORNER_ROUNDING * Math.min(d01, d12), Math.min(d01, d12) / 2);

    const start: [number, number] = [
      p1[0] + ((p0[0] - p1[0]) / (d01 || 1)) * r,
      p1[1] + ((p0[1] - p1[1]) / (d01 || 1)) * r,
    ];
    const end: [number, number] = [
      p1[0] + ((p2[0] - p1[0]) / (d12 || 1)) * r,
      p1[1] + ((p2[1] - p1[1]) / (d12 || 1)) * r,
    ];

    if (i === 0) ctx.moveTo(start[0], start[1]);
    else ctx.lineTo(start[0], start[1]);
    ctx.quadraticCurveTo(p1[0], p1[1], end[0], end[1]);
  }
  ctx.closePath();
}

export function createOrganicTessellationModule(): ArtModule {
  let ctx: CanvasRenderingContext2D | null = null;
  let width = 0;
  let height = 0;
  let points: Point[] = [];
  let palette: RGB[] = [];
  let rafId = 0;
  let lastTime = 0;
  let pointerX = -9999;
  let pointerY = -9999;
  let pointerActive = false;
  let boundCanvas: HTMLCanvasElement | null = null;
  let staticMode = false;

  function seedPoints(w: number, h: number) {
    const cols = Math.ceil(Math.sqrt((POINT_COUNT * w) / h));
    const rows = Math.ceil(POINT_COUNT / cols);
    const cellW = w / cols;
    const cellH = h / rows;
    const next: Point[] = [];

    for (let r = 0; r < rows; r++) {
      for (let c = 0; c < cols; c++) {
        if (next.length >= POINT_COUNT) break;
        const anchorX = c * cellW + cellW / 2 + (Math.random() - 0.5) * cellW * 0.7;
        const anchorY = r * cellH + cellH / 2 + (Math.random() - 0.5) * cellH * 0.7;
        const base = randomPaletteColor(palette);
        next.push({
          anchorX,
          anchorY,
          currentX: anchorX,
          currentY: anchorY,
          freqX: 0.05 + Math.random() * 0.08,
          freqY: 0.05 + Math.random() * 0.08,
          phaseX: Math.random() * Math.PI * 2,
          phaseY: Math.random() * Math.PI * 2,
          ampX: 10 + Math.random() * 16,
          ampY: 10 + Math.random() * 16,
          currentColor: base,
          targetColor: randomPaletteColor(palette, base),
          colorT: Math.random(),
          colorDuration: 6 + Math.random() * 8,
        });
      }
    }
    points = next;
  }

  function updatePoints(dt: number, t: number) {
    for (const p of points) {
      let x = p.anchorX + Math.sin(t * p.freqX + p.phaseX) * p.ampX;
      let y = p.anchorY + Math.cos(t * p.freqY + p.phaseY) * p.ampY;

      if (pointerActive) {
        const dx = x - pointerX;
        const dy = y - pointerY;
        const dist = Math.hypot(dx, dy);
        if (dist < REPEL_RADIUS && dist > 0.001) {
          const push = (1 - dist / REPEL_RADIUS) * REPEL_STRENGTH;
          x += (dx / dist) * push;
          y += (dy / dist) * push;
        }
      }

      p.currentX = Math.min(Math.max(x, 0), width);
      p.currentY = Math.min(Math.max(y, 0), height);

      if (dt > 0) {
        p.colorT += dt / p.colorDuration;
        if (p.colorT >= 1) {
          p.currentColor = p.targetColor;
          p.targetColor = randomPaletteColor(palette, p.currentColor);
          p.colorT = 0;
        }
      }
    }
  }

  function currentRgb(p: Point): RGB {
    const t = easeInOut(Math.min(p.colorT, 1));
    return [
      lerp(p.currentColor[0], p.targetColor[0], t),
      lerp(p.currentColor[1], p.targetColor[1], t),
      lerp(p.currentColor[2], p.targetColor[2], t),
    ];
  }

  function draw() {
    if (!ctx || points.length < 2) return;
    ctx.clearRect(0, 0, width, height);

    const delaunay = Delaunay.from(points.map((p) => [p.currentX, p.currentY] as [number, number]));
    const voronoi = delaunay.voronoi([0, 0, width, height]);

    points.forEach((p, i) => {
      const ring = voronoi.cellPolygon(i);
      if (!ring) return;
      const [r, g, b] = currentRgb(p);
      roundedPolygonPath(ctx!, ring as Array<[number, number]>);
      ctx!.fillStyle = `rgb(${r | 0}, ${g | 0}, ${b | 0})`;
      ctx!.fill();
      ctx!.strokeStyle = 'rgba(246, 241, 231, 0.55)';
      ctx!.lineWidth = 2;
      ctx!.stroke();
    });
  }

  function frame(now: number) {
    const t = now / 1000;
    const dt = lastTime ? (now - lastTime) / 1000 : 0;
    lastTime = now;
    updatePoints(dt, t);
    draw();
    rafId = requestAnimationFrame(frame);
  }

  function handlePointerMove(e: PointerEvent) {
    if (!boundCanvas) return;
    const rect = boundCanvas.getBoundingClientRect();
    pointerX = e.clientX - rect.left;
    pointerY = e.clientY - rect.top;
    pointerActive = true;
  }

  function handlePointerLeave() {
    pointerActive = false;
  }

  return {
    id: 'organic-tessellation',
    label: 'Organic tessellation',

    init(canvas: HTMLCanvasElement, opts: ArtModuleInitOptions) {
      ctx = canvas.getContext('2d');
      width = opts.width;
      height = opts.height;
      staticMode = opts.reducedMotion;
      boundCanvas = canvas;
      palette = readPalette();

      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      canvas.width = Math.floor(width * dpr);
      canvas.height = Math.floor(height * dpr);
      ctx?.scale(dpr, dpr);

      seedPoints(width, height);
      updatePoints(0, 0);
      draw();

      if (!staticMode) {
        canvas.addEventListener('pointermove', handlePointerMove);
        canvas.addEventListener('pointerleave', handlePointerLeave);
        rafId = requestAnimationFrame(frame);
      }
    },

    resize(newWidth: number, newHeight: number) {
      if (!ctx || !boundCanvas) return;
      const scaleX = newWidth / (width || newWidth);
      const scaleY = newHeight / (height || newHeight);
      points.forEach((p) => {
        p.anchorX *= scaleX;
        p.anchorY *= scaleY;
      });
      width = newWidth;
      height = newHeight;

      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      boundCanvas.width = Math.floor(width * dpr);
      boundCanvas.height = Math.floor(height * dpr);
      ctx.setTransform(1, 0, 0, 1, 0, 0);
      ctx.scale(dpr, dpr);

      if (staticMode) {
        updatePoints(0, 0);
        draw();
      }
    },

    destroy() {
      if (rafId) cancelAnimationFrame(rafId);
      boundCanvas?.removeEventListener('pointermove', handlePointerMove);
      boundCanvas?.removeEventListener('pointerleave', handlePointerLeave);
      ctx = null;
      boundCanvas = null;
      points = [];
    },
  };
}
