/**
 * Procedural displacement map for the Reader header "liquid glass" effect.
 *
 * Physical model: a flat glass lens with no distortion across its interior,
 * and refraction concentrated on a narrow band along the bottom edge only
 * (the top/left/right edges sit at the screen edge and don't refract).
 *
 * The map encodes a displacement vector per pixel:
 *   R = 128 + dx   (here always 128 → no horizontal shift)
 *   G = 128 + dy   (positive → sample from further below → content gets
 *                   pulled UP toward the interior of the bar)
 *
 * Combined with feDisplacementMap scale=20, max vertical displacement is
 * ~10px, ramped via pow(t, 2.5) over the bottom 14px of a ~64px header.
 *
 * Map is 1D (vertical gradient stretched horizontally via preserveAspectRatio="none").
 */

const MAP_WIDTH = 8;
const MAP_HEIGHT = 64;      // assumed header height in CSS px
const EDGE_ZONE = 14;       // bottom band where refraction happens (px)
const EASE_POWER = 2.5;

let cachedDataUrl: string | null = null;

function buildDataUrl(): string {
  if (cachedDataUrl) return cachedDataUrl;

  const canvas = document.createElement("canvas");
  canvas.width = MAP_WIDTH;
  canvas.height = MAP_HEIGHT;
  const ctx = canvas.getContext("2d");
  if (!ctx) return "";

  const img = ctx.createImageData(MAP_WIDTH, MAP_HEIGHT);
  for (let y = 0; y < MAP_HEIGHT; y++) {
    // distance from the bottom edge in px (0 = bottom row)
    const dFromBottom = MAP_HEIGHT - 1 - y;
    let g = 128;
    if (dFromBottom < EDGE_ZONE) {
      // t: 0 at the top of the edge zone → 1 at the very bottom
      const t = 1 - dFromBottom / EDGE_ZONE;
      const falloff = Math.pow(t, EASE_POWER);
      // G > 128 → sample below → visually content is dragged upward
      g = 128 + Math.round(falloff * 127);
    }
    for (let x = 0; x < MAP_WIDTH; x++) {
      const i = (y * MAP_WIDTH + x) * 4;
      img.data[i] = 128;     // R: no horizontal displacement
      img.data[i + 1] = g;   // G: vertical displacement
      img.data[i + 2] = 128; // B: unused
      img.data[i + 3] = 255;
    }
  }
  ctx.putImageData(img, 0, 0);
  cachedDataUrl = canvas.toDataURL("image/png");
  return cachedDataUrl;
}

export function installLiquidGlassMap() {
  if (typeof document === "undefined") return;
  const apply = () => {
    const el = document.getElementById("liquid-glass-map");
    if (!el) return;
    const url = buildDataUrl();
    if (!url) return;
    // Set both href and the legacy xlink:href for broader support.
    el.setAttribute("href", url);
    el.setAttributeNS("http://www.w3.org/1999/xlink", "xlink:href", url);
  };
  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", apply, { once: true });
  } else {
    apply();
  }
}
