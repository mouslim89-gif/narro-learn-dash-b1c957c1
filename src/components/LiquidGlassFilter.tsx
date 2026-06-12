import { useEffect, useRef, useState } from 'react';

/**
 * Procedural lens-edge displacement map.
 * - Interior (≈80% of the shape) is neutral gray rgb(128,128,128) → 0 displacement.
 * - Edge ring (~15-20% from the rounded-rect border) carries a radial vector pointing
 *   AWAY from the shape center (so feDisplacementMap samples from OUTSIDE the edge,
 *   visually compressing the background toward the center — classic lens refraction).
 * - Falloff is ease-in (t²) from interior boundary → outer edge.
 * - No animation, no turbulence.
 */
function buildDisplacementMap(w: number, h: number, radius: number, edgePx: number) {
  const canvas = document.createElement('canvas');
  canvas.width = Math.max(1, Math.round(w));
  canvas.height = Math.max(1, Math.round(h));
  const ctx = canvas.getContext('2d')!;
  const img = ctx.createImageData(canvas.width, canvas.height);
  const data = img.data;

  const W = canvas.width;
  const H = canvas.height;
  const cx = W / 2;
  const cy = H / 2;
  const r = Math.min(radius, Math.min(W, H) / 2);
  const edge = Math.max(1, edgePx);

  // Signed distance to rounded rectangle (interior is negative).
  const halfW = W / 2;
  const halfH = H / 2;
  for (let y = 0; y < H; y++) {
    for (let x = 0; x < W; x++) {
      const px = x + 0.5 - cx;
      const py = y + 0.5 - cy;
      const qx = Math.abs(px) - (halfW - r);
      const qy = Math.abs(py) - (halfH - r);
      const ax = Math.max(qx, 0);
      const ay = Math.max(qy, 0);
      const sd = Math.sqrt(ax * ax + ay * ay) + Math.min(Math.max(qx, qy), 0) - r;
      const distFromEdge = -sd; // positive inside

      let R = 128, G = 128;
      if (distFromEdge >= 0 && distFromEdge < edge) {
        let t = 1 - distFromEdge / edge; // 0 at interior boundary → 1 at outer edge
        t = t * t; // ease-in
        // Radial unit vector from pixel → center (axis), but displacement points OUTWARD
        // so the sampled background comes from beyond the edge.
        const len = Math.hypot(px, py) || 1;
        const dirX = px / len; // outward
        const dirY = py / len;
        R = 128 + dirX * t * 127;
        G = 128 + dirY * t * 127;
      }
      const i = (y * W + x) * 4;
      data[i] = Math.max(0, Math.min(255, Math.round(R)));
      data[i + 1] = Math.max(0, Math.min(255, Math.round(G)));
      data[i + 2] = 128;
      data[i + 3] = 255;
    }
  }
  ctx.putImageData(img, 0, 0);
  return canvas.toDataURL('image/png');
}

interface Props {
  targetRef: React.RefObject<HTMLElement>;
  filterId?: string;
  /** Corner radius of the glass surface in px. */
  radius?: number;
  /** Width of the refractive edge ring in px. */
  edge?: number;
  /** Max displacement amplitude in px. */
  scale?: number;
}

export function LiquidGlassFilter({
  targetRef,
  filterId = 'liquid-glass',
  radius = 0,
  edge = 18,
  scale = 22,
}: Props) {
  const [map, setMap] = useState<{ href: string; w: number; h: number } | null>(null);
  const rafRef = useRef<number | null>(null);

  useEffect(() => {
    const el = targetRef.current;
    if (!el) return;

    const regenerate = () => {
      const rect = el.getBoundingClientRect();
      const w = Math.round(rect.width);
      const h = Math.round(rect.height);
      if (w < 4 || h < 4) return;
      const href = buildDisplacementMap(w, h, radius, edge);
      setMap({ href, w, h });
    };

    const schedule = () => {
      if (rafRef.current != null) cancelAnimationFrame(rafRef.current);
      rafRef.current = requestAnimationFrame(regenerate);
    };

    schedule();
    const ro = new ResizeObserver(schedule);
    ro.observe(el);
    return () => {
      ro.disconnect();
      if (rafRef.current != null) cancelAnimationFrame(rafRef.current);
    };
  }, [targetRef, radius, edge]);

  return (
    <svg
      width="0"
      height="0"
      style={{ position: 'absolute', pointerEvents: 'none' }}
      aria-hidden
    >
      <defs>
        <filter
          id={filterId}
          x="0%"
          y="0%"
          width="100%"
          height="100%"
          filterUnits="objectBoundingBox"
          primitiveUnits="userSpaceOnUse"
        >
          {map && (
            <feImage
              href={map.href}
              x="0"
              y="0"
              width={map.w}
              height={map.h}
              preserveAspectRatio="none"
              result="dispMap"
            />
          )}
          <feDisplacementMap
            in="SourceGraphic"
            in2="dispMap"
            scale={scale}
            xChannelSelector="R"
            yChannelSelector="G"
          />
        </filter>
      </defs>
    </svg>
  );
}
