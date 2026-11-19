// Cover engine: draws a GTA-style multi-panel poster onto any 2D canvas.
// Everything is drawn from the state object — photos, layout, grade, caption and
// finish — so the editor preview and the exported PNG are the same drawing, just
// at different pixel sizes. No external assets: photos are the user's uploads or
// the app's own painted demo scenes, lettering is the system heavy sans.

export const LAYOUTS = [
  { id: 'hero3', name: 'Hero + Three' },
  { id: 'mosaic', name: 'Nine-Panel Mosaic' },
  { id: 'fullbleed', name: 'Full-Bleed Hero' },
  { id: 'tilt', name: 'Tilted Snapshots' },
  { id: 'duo', name: 'Split Duo' },
  { id: 'strip', name: 'Comic Strip' },
];

export const GRADES = [
  { id: 'sunset', name: 'Sunset', filter: 'saturate(1.35) contrast(1.08)', stops: ['#ff9a3d', '#ff4d9d', '#7b2ff7'] },
  { id: 'neon', name: 'Neon Night', filter: 'saturate(1.5) contrast(1.15) brightness(0.94)', stops: ['#2ee6c8', '#ff4d9d', '#1b1440'] },
  { id: 'teal', name: 'Teal Heat', filter: 'saturate(1.25) contrast(1.06)', stops: ['#2ee6c8', '#0b5e7a', '#ff9a3d'] },
  { id: 'gold', name: 'Gold Rush', filter: 'saturate(1.2) contrast(1.05) sepia(0.25)', stops: ['#ffe9a8', '#ffc93d', '#c22e7d'] },
  { id: 'noir', name: 'Mono Noir', filter: 'saturate(0.1) contrast(1.25) brightness(1.02)', stops: ['#ffffff', '#8a8aa8', '#000000'] },
];

export const TITLE_STYLES = {
  sunset: { fill: ['#ffe9a8', '#ff9a3d', '#ff4d9d'], stroke: '#1b0b2e', glow: null },
  neon: { fill: ['#ffffff', '#eafcff'], stroke: '#ff4d9d', glow: '#2ee6c8' },
  white: { fill: ['#ffffff', '#f2e9ff'], stroke: '#12081f', glow: null },
  gold: { fill: ['#fff6c9', '#ffc93d', '#b8860b'], stroke: '#2a1503', glow: null },
};

// Panel rectangles for a layout, as fractions of the cover (x, y, w, h, rot?).
// The title zone is left free: hero3/duo/strip reserve a bottom band, mosaic
// reserves its centre cell, fullbleed and tilt draw the title over the art.
export function layoutPanels(layoutId, titleBand = 0.2) {
  switch (layoutId) {
    case 'mosaic': {
      const cells = [];
      for (let r = 0; r < 3; r++) {
        for (let c = 0; c < 3; c++) {
          if (r === 1 && c === 1) continue; // centre cell is the title block
          cells.push({ x: c / 3, y: r / 3, w: 1 / 3, h: 1 / 3 });
        }
      }
      return { panels: cells, title: { x: 1 / 3, y: 1 / 3, w: 1 / 3, h: 1 / 3 }, band: false };
    }
    case 'fullbleed':
      return { panels: [{ x: 0, y: 0, w: 1, h: 1 }], title: { x: 0, y: 1 - titleBand, w: 1, h: titleBand }, band: true };
    case 'tilt':
      return {
        panels: [
          { x: 0.06, y: 0.04, w: 0.55, h: 0.44, rot: -0.09 },
          { x: 0.42, y: 0.26, w: 0.52, h: 0.44, rot: 0.07 },
          { x: 0.14, y: 0.56, w: 0.6, h: 0.24, rot: -0.03 },
        ],
        title: { x: 0, y: 0.82, w: 1, h: 0.18 }, band: true,
      };
    case 'duo':
      return {
        panels: [
          { x: 0, y: 0, w: 0.5, h: 1 - titleBand },
          { x: 0.5, y: 0, w: 0.5, h: 1 - titleBand },
        ],
        title: { x: 0, y: 1 - titleBand, w: 1, h: titleBand }, band: true,
      };
    case 'strip':
      return {
        panels: [0, 1, 2].map((i) => ({ x: 0, y: (i * (1 - titleBand)) / 3, w: 1, h: (1 - titleBand) / 3 })),
        title: { x: 0, y: 1 - titleBand, w: 1, h: titleBand }, band: true,
      };
    case 'hero3':
    default:
      return {
        panels: [
          { x: 0, y: 0, w: 0.64, h: 1 - titleBand },
          { x: 0.64, y: 0, w: 0.36, h: (1 - titleBand) / 3 },
          { x: 0.64, y: (1 - titleBand) / 3, w: 0.36, h: (1 - titleBand) / 3 },
          { x: 0.64, y: (2 * (1 - titleBand)) / 3, w: 0.36, h: (1 - titleBand) / 3 },
        ],
        title: { x: 0, y: 1 - titleBand, w: 1, h: titleBand }, band: true,
      };
  }
}

function gradeOf(state) {
  return GRADES.find((g) => g.id === state.grade) ?? GRADES[0];
}

function drawPhotoCover(ctx, photo, rect, zoom, ox, oy, grade, strength, warmth) {
  const iw = photo.width;
  const ih = photo.height;
  const base = Math.max(rect.w / iw, rect.h / ih) * (zoom / 100);
  const dw = iw * base;
  const dh = ih * base;
  const dx = rect.x + (rect.w - dw) / 2 + (ox / 100) * rect.w;
  const dy = rect.y + (rect.h - dh) / 2 + (oy / 100) * rect.h;
  ctx.save();
  ctx.filter = `${grade.filter} hue-rotate(${warmth}deg)`;
  ctx.drawImage(photo, dx, dy, dw, dh);
  ctx.restore();
  if (strength > 0) {
    const g = ctx.createLinearGradient(rect.x, rect.y, rect.x + rect.w, rect.y + rect.h);
    g.addColorStop(0, grade.stops[0]);
    g.addColorStop(0.55, grade.stops[1]);
    g.addColorStop(1, grade.stops[2]);
    ctx.save();
    ctx.globalCompositeOperation = 'overlay';
    ctx.globalAlpha = (strength / 100) * 0.55;
    ctx.fillStyle = g;
    ctx.fillRect(rect.x, rect.y, rect.w, rect.h);
    ctx.restore();
    ctx.save();
    ctx.globalCompositeOperation = 'soft-light';
    ctx.globalAlpha = (strength / 100) * 0.35;
    ctx.fillStyle = grade.stops[1];
    ctx.fillRect(rect.x, rect.y, rect.w, rect.h);
    ctx.restore();
  }
}

function drawHalftone(ctx, x, y, w, h, color) {
  ctx.save();
  ctx.fillStyle = color;
  const step = Math.max(10, w / 46);
  for (let yy = y + step / 2; yy < y + h; yy += step) {
    for (let xx = x + step / 2; xx < x + w; xx += step) {
      const t = (yy - y) / h;
      const r = (step / 2) * (0.25 + 0.75 * t);
      ctx.beginPath();
      ctx.arc(xx, yy, r, 0, Math.PI * 2);
      ctx.fill();
    }
  }
  ctx.restore();
}

let noiseTile = null;
function grainTile() {
  if (noiseTile) return noiseTile;
  const c = document.createElement('canvas');
  c.width = 128;
  c.height = 128;
  const g = c.getContext('2d');
  const img = g.createImageData(128, 128);
  let seed = 1234567;
  for (let i = 0; i < img.data.length; i += 4) {
    seed = (seed * 1103515245 + 12345) & 0x7fffffff;
    const v = seed % 256;
    img.data[i] = v;
    img.data[i + 1] = v;
    img.data[i + 2] = v;
    img.data[i + 3] = 255;
  }
  g.putImageData(img, 0, 0);
  noiseTile = c;
  return c;
}

function fitFont(ctx, text, maxWidth, startPx, family, weight = 900) {
  let px = startPx;
  ctx.font = `${weight} ${px}px ${family}`;
  while (px > 12 && ctx.measureText(text).width > maxWidth) {
    px -= 2;
    ctx.font = `${weight} ${px}px ${family}`;
  }
  return px;
}

function drawTitleBlock(ctx, state, zone, W, H) {
  const style = TITLE_STYLES[state.titleStyle] ?? TITLE_STYLES.sunset;
  const grade = gradeOf(state);
  const cx = zone.x + zone.w / 2;
  const pad = Math.min(zone.w, zone.h) * 0.06;
  if (state.fx.halftone) {
    ctx.save();
    ctx.globalAlpha = 0.16;
    drawHalftone(ctx, zone.x + pad, zone.y + pad * 0.4, zone.w - pad * 2, zone.h - pad, '#ffffff');
    ctx.restore();
  }
  // Title: heavy skewed sans, gradient fill, hard outline, optional neon glow.
  const family = '"Arial Black", "Archivo Black", Impact, "Helvetica Neue", sans-serif';
  // Fill the title zone: start from a height-driven size and shrink only until
  // the text fits the zone's width, so the caption reads big and bold.
  const titlePx = fitFont(ctx, state.title, zone.w - pad * 2, Math.round(zone.h * 0.52 * (state.titleScale / 100)), family);
  const grad = ctx.createLinearGradient(zone.x, zone.y, zone.x + zone.w, zone.y + zone.h * 0.5);
  style.fill.forEach((c, i) => grad.addColorStop(i / (style.fill.length - 1), c));
  ctx.save();
  ctx.translate(cx, zone.y + zone.h * 0.52);
  ctx.transform(1, 0, -0.12, 1, 0, 0);
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.font = `900 ${titlePx}px ${family}`;
  if (style.glow) {
    ctx.shadowColor = style.glow;
    ctx.shadowBlur = titlePx * 0.35;
  }
  ctx.lineJoin = 'round';
  ctx.strokeStyle = style.stroke;
  ctx.lineWidth = Math.max(2, titlePx / 14);
  ctx.strokeText(state.title, 0, 0);
  ctx.fillStyle = grad;
  ctx.fillText(state.title, 0, 0);
  ctx.restore();
  // Subtitle: spaced italic, tracked out by hand.
  const sub = state.subtitle.toUpperCase();
  const subPx = Math.round(Math.min(zone.h * 0.16, zone.w / Math.max(10, sub.length) * 1.15));
  ctx.save();
  ctx.font = `italic 700 ${subPx}px Georgia, "Times New Roman", serif`;
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  const tracking = subPx * 0.22;
  const widths = [...sub].map((ch) => ctx.measureText(ch).width + tracking);
  const total = widths.reduce((a, b) => a + b, 0) - tracking;
  let sx = cx - total / 2;
  const sy = zone.y + zone.h * 0.86;
  ctx.fillStyle = 'rgba(255,255,255,.92)';
  ctx.shadowColor = 'rgba(0,0,0,.55)';
  ctx.shadowBlur = subPx * 0.3;
  for (let i = 0; i < sub.length; i++) {
    ctx.fillText(sub[i], sx + ctx.measureText(sub[i]).width / 2, sy);
    sx += widths[i];
  }
  ctx.restore();
  // Heat meter: stars bottom-right of the title zone.
  if (state.fx.stars > 0) {
    const starPx = Math.round(zone.h * 0.16);
    const label = 'HEAT';
    ctx.save();
    ctx.font = `800 ${Math.round(starPx * 0.7)}px ${family}`;
    ctx.textAlign = 'right';
    ctx.textBaseline = 'middle';
    ctx.fillStyle = 'rgba(255,255,255,.75)';
    const stars = '★'.repeat(state.fx.stars) + '☆'.repeat(5 - state.fx.stars);
    ctx.fillText(`${label} ${stars}`, zone.x + zone.w - pad, zone.y + zone.h * 0.14);
    ctx.restore();
  }
  void grade;
}

function drawBadge(ctx, W, H, margin) {
  const bw = W * 0.16;
  const bh = H * 0.032;
  const x = margin + W * 0.012;
  const y = margin + H * 0.012;
  ctx.save();
  ctx.fillStyle = 'rgba(10,5,18,.72)';
  ctx.beginPath();
  ctx.roundRect(x, y, bw, bh, bh / 2);
  ctx.fill();
  ctx.strokeStyle = '#ffc93d';
  ctx.lineWidth = Math.max(1, H * 0.0012);
  ctx.stroke();
  ctx.fillStyle = '#ffc93d';
  ctx.font = `800 ${Math.round(bh * 0.52)}px "Arial Black", Impact, sans-serif`;
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText('★ VICE COAST', x + bw / 2, y + bh / 2 + 1);
  ctx.restore();
}

// The last drawn panel rectangles in pixels, for hit-testing in the editor.
export let lastPanelsPx = [];

export function renderCover(ctx, W, H, state) {
  const margin = state.fx.frame ? Math.round(Math.min(W, H) * 0.022) : 0;
  const gutter = Math.round(Math.min(W, H) * 0.012);
  const inner = { x: margin, y: margin, w: W - margin * 2, h: H - margin * 2 };
  const spec = layoutPanels(state.layout);
  const grade = gradeOf(state);

  // Poster paper: white gutters show between panels.
  ctx.save();
  ctx.clearRect(0, 0, W, H);
  ctx.fillStyle = state.fx.frame ? '#f8f2ea' : '#12081f';
  ctx.fillRect(0, 0, W, H);
  if (spec.band) {
    const tz = spec.title;
    const bandGrad = ctx.createLinearGradient(0, inner.y + tz.y * inner.h, 0, inner.y + inner.h);
    bandGrad.addColorStop(0, '#1b0b2e');
    bandGrad.addColorStop(1, '#0a0512');
    ctx.fillStyle = bandGrad;
    ctx.fillRect(inner.x, inner.y + tz.y * inner.h, inner.w, tz.h * inner.h);
  } else {
    const tz = spec.title;
    const tg = ctx.createLinearGradient(inner.x + tz.x * inner.w, inner.y, inner.x + (tz.x + tz.w) * inner.w, inner.y + inner.h);
    tg.addColorStop(0, grade.stops[0]);
    tg.addColorStop(0.6, grade.stops[1]);
    tg.addColorStop(1, grade.stops[2]);
    ctx.fillStyle = tg;
    ctx.fillRect(inner.x + tz.x * inner.w, inner.y + tz.y * inner.h, tz.w * inner.w, tz.h * inner.h);
  }

  lastPanelsPx = [];
  spec.panels.forEach((p, i) => {
    const rect = {
      x: inner.x + p.x * inner.w + gutter / 2,
      y: inner.y + p.y * inner.h + gutter / 2,
      w: p.w * inner.w - gutter,
      h: p.h * inner.h - gutter,
    };
    const panel = state.panels[i] ?? { photo: 0, zoom: 100, ox: 0, oy: 0 };
    const photo = state.photos[panel.photo] ?? state.photos[0];
    lastPanelsPx.push({ ...rect, rot: p.rot ?? 0, index: i });
    ctx.save();
    ctx.beginPath();
    if (p.rot) {
      const cxp = rect.x + rect.w / 2;
      const cyp = rect.y + rect.h / 2;
      ctx.translate(cxp, cyp);
      ctx.rotate(p.rot);
      ctx.rect(-rect.w / 2, -rect.h / 2, rect.w, rect.h);
    } else {
      ctx.rect(rect.x, rect.y, rect.w, rect.h);
    }
    ctx.clip();
    if (photo) {
      const r = p.rot
        ? { x: -rect.w / 2, y: -rect.h / 2, w: rect.w, h: rect.h }
        : rect;
      drawPhotoCover(ctx, photo.image, r, panel.zoom, panel.ox, panel.oy, grade, state.gradeStrength, state.warmth);
    } else {
      ctx.fillStyle = '#241631';
      ctx.fillRect(rect.x, rect.y, rect.w, rect.h);
    }
    ctx.restore();
    // Keyline around each panel, poster style.
    ctx.save();
    ctx.strokeStyle = 'rgba(255,255,255,.85)';
    ctx.lineWidth = Math.max(1, Math.min(W, H) * 0.004);
    ctx.beginPath();
    if (p.rot) {
      const cxp = rect.x + rect.w / 2;
      const cyp = rect.y + rect.h / 2;
      ctx.translate(cxp, cyp);
      ctx.rotate(p.rot);
      ctx.strokeRect(-rect.w / 2, -rect.h / 2, rect.w, rect.h);
    } else {
      ctx.strokeRect(rect.x, rect.y, rect.w, rect.h);
    }
    ctx.restore();
  });

  // Title block (band or mosaic centre cell).
  const tz = spec.title;
  const titleZone = {
    x: inner.x + tz.x * inner.w,
    y: inner.y + tz.y * inner.h,
    w: tz.w * inner.w,
    h: tz.h * inner.h,
  };
  drawTitleBlock(ctx, state, titleZone, W, H);

  if (state.fx.badge) drawBadge(ctx, W, H, margin);

  // Finish: grain then vignette.
  if (state.fx.grain) {
    ctx.save();
    ctx.globalAlpha = 0.07;
    ctx.globalCompositeOperation = 'overlay';
    const tile = grainTile();
    ctx.fillStyle = ctx.createPattern(tile, 'repeat');
    ctx.fillRect(0, 0, W, H);
    ctx.restore();
  }
  if (state.fx.vignette) {
    const vg = ctx.createRadialGradient(
      W / 2, H / 2, Math.min(W, H) * 0.42,
      W / 2, H / 2, Math.max(W, H) * 0.75,
    );
    vg.addColorStop(0, 'rgba(0,0,0,0)');
    vg.addColorStop(1, 'rgba(10,4,20,.42)');
    ctx.fillStyle = vg;
    ctx.fillRect(0, 0, W, H);
  }
  ctx.restore();
  return lastPanelsPx;
}

export function panelAt(state, px, py, W, H) {
  for (const p of lastPanelsPx) {
    if (px >= p.x && px <= p.x + p.w && py >= p.y && py <= p.y + p.h) return p.index;
  }
  return -1;
}

// Render the cover at export size and return the canvas.
export function exportCoverCanvas(state, w, h) {
  const c = document.createElement('canvas');
  c.width = w;
  c.height = h;
  renderCover(c.getContext('2d'), w, h, state);
  return c;
}

export function downloadCanvas(canvas, filename) {
  canvas.toBlob((blob) => {
    if (!blob) return;
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    a.click();
    setTimeout(() => URL.revokeObjectURL(url), 4000);
  }, 'image/png');
}
