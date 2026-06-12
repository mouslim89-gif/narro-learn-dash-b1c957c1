/**
 * Procedural displacement map for the Reader header "liquid glass" effect.
 *
 * Physical model: a flat glass lens — no geometric distortion across the
 * interior, refraction concentrated in a narrow band along the bottom edge
 * (top/left/right edges sit on the screen edge and don't refract).
 *
 * Map encoding (read by feDisplacementMap, color-interpolation sRGB):
 *   R = 128 + dx → horizontal shift (always 128 here: vertical-only)
 *   G = 128 + dy → vertical shift (G > 128 samples from below → content
 *                  is pulled up toward the interior of the bar)
 *
 * Chromium only resolves backdrop-filter url() filters reliably when the
 * filter uses filterUnits="userSpaceOnUse" with explicit pixel geometry,
 * so the filter region, the feImage and the canvas map are all kept in
 * sync with the header element's real size at runtime.
 */

const EDGE_ZONE = 14; // bottom band where refraction happens (CSS px)
const EASE_POWER = 2.5; // falloff: 0 at band top → 1 at the very bottom
const SCALE = 20; // feDisplacementMap scale → max ~10px displacement

let lastW = 0;
let lastH = 0;

function buildDataUrl(w: number, h: number): string {
  const canvas = document.createElement("canvas");
  canvas.width = w;
  canvas.height = h;
  const ctx = canvas.getContext("2d");
  if (!ctx) return "";

  const img = ctx.createImageData(w, h);
  for (let y = 0; y < h; y++) {
    const dFromBottom = h - 1 - y;
    let g = 128;
    if (dFromBottom < EDGE_ZONE) {
      const t = 1 - dFromBottom / EDGE_ZONE;
      g = 128 + Math.round(Math.pow(t, EASE_POWER) * 127);
    }
    for (let x = 0; x < w; x++) {
      const i = (y * w + x) * 4;
      img.data[i] = 128; // R: no horizontal displacement
      img.data[i + 1] = g; // G: vertical displacement
      img.data[i + 2] = 128; // B: unused
      img.data[i + 3] = 255;
    }
  }
  ctx.putImageData(img, 0, 0);
  return canvas.toDataURL("image/png");
}

function syncFilter(el: Element) {
  const rect = el.getBoundingClientRect();
  const w = Math.round(rect.width);
  const h = Math.round(rect.height);
  if (!w || !h || (w === lastW && h === lastH)) return;

  const filter = document.getElementById("liquid-glass");
  const map = document.getElementById("liquid-glass-map");
  if (!filter || !map) return;

  const url = buildDataUrl(w, h);
  if (!url) return;

  lastW = w;
  lastH = h;

  filter.setAttribute("x", "0");
  filter.setAttribute("y", "0");
  filter.setAttribute("width", String(w));
  filter.setAttribute("height", String(h));
  map.setAttribute("x", "0");
  map.setAttribute("y", "0");
  map.setAttribute("width", String(w));
  map.setAttribute("height", String(h));
  map.setAttribute("href", url);
  map.setAttributeNS("http://www.w3.org/1999/xlink", "xlink:href", url);
}

/**
 * Watches for the `.glass-subtle` header (mounted/unmounted with the Reader
 * route) and keeps the SVG filter geometry + displacement map in sync with
 * its actual size.
 */
export function installLiquidGlassMap() {
  if (typeof document === "undefined" || typeof ResizeObserver === "undefined") return;

  let current: Element | null = null;

  const ro = new ResizeObserver((entries) => {
    for (const entry of entries) syncFilter(entry.target);
  });

  const attach = () => {
    if (current && current.isConnected) return;
    if (current) {
      ro.unobserve(current);
      current = null;
    }
    const el = document.querySelector(".glass-subtle");
    if (el) {
      current = el;
      ro.observe(el);
      syncFilter(el);
    }
  };

  const start = () => {
    const mo = new MutationObserver(attach);
    mo.observe(document.body, { childList: true, subtree: true });
    attach();
  };

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", start, { once: true });
  } else {
    start();
  }
}
