// Demo scenes: four original "photos" painted in code, so the studio works with
// no upload at all. Each scene is drawn with plain 2D canvas shapes — gradients,
// silhouettes and glow — and is fully deterministic (seeded random), so the same
// scene paints the same pixels on every machine. No real people, no borrowed art.

export const SCENES = [
  { id: 'beach', name: 'Boulevard Sunset' },
  { id: 'neon', name: 'Neon Diner Night' },
  { id: 'pier', name: 'Pier Morning' },
  { id: 'rooftop', name: 'Rooftop Dusk' },
];

function mulberry32(seed) {
  let a = seed >>> 0;
  return () => {
    a |= 0; a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

function skyGradient(ctx, w, h, stops) {
  const g = ctx.createLinearGradient(0, 0, 0, h);
  for (const [at, color] of stops) g.addColorStop(at, color);
  ctx.fillStyle = g;
  ctx.fillRect(0, 0, w, h);
}

function sunDisc(ctx, x, y, r, core, halo) {
  const g = ctx.createRadialGradient(x, y, r * 0.1, x, y, r * 2.4);
  g.addColorStop(0, halo);
  g.addColorStop(1, 'rgba(255,120,80,0)');
  ctx.fillStyle = g;
  ctx.fillRect(x - r * 2.4, y - r * 2.4, r * 4.8, r * 4.8);
  ctx.fillStyle = core;
  ctx.beginPath();
  ctx.arc(x, y, r, 0, Math.PI * 2);
  ctx.fill();
}

function palmTree(ctx, x, y, s, lean, color) {
  ctx.save();
  ctx.translate(x, y);
  ctx.rotate(lean);
  ctx.scale(s, s);
  ctx.strokeStyle = color;
  ctx.fillStyle = color;
  ctx.lineWidth = 7;
  ctx.lineCap = 'round';
  ctx.beginPath();
  ctx.moveTo(0, 0);
  ctx.quadraticCurveTo(14, -70, 4, -150);
  ctx.stroke();
  for (let i = 0; i < 7; i++) {
    const a = -Math.PI * (0.08 + i * 0.13);
    const len = 62 - Math.abs(i - 3) * 7;
    ctx.beginPath();
    ctx.moveTo(4, -150);
    ctx.quadraticCurveTo(
      4 + Math.cos(a) * len * 0.6, -150 + Math.sin(a) * len * 0.6 - 12,
      4 + Math.cos(a) * len, -150 + Math.sin(a) * len + 26,
    );
    ctx.lineWidth = 5;
    ctx.stroke();
  }
  ctx.restore();
}

function personSilhouette(ctx, x, y, s, color, pose) {
  // Simple stylised figure: head, torso, legs — a silhouette, never a real person.
  ctx.save();
  ctx.translate(x, y);
  ctx.scale(s, s);
  ctx.fillStyle = color;
  ctx.beginPath();
  ctx.arc(0, -118, 13, 0, Math.PI * 2);
  ctx.fill();
  ctx.beginPath();
  ctx.moveTo(-16, -102);
  ctx.quadraticCurveTo(0, -112, 16, -102);
  ctx.lineTo(12, -38);
  ctx.lineTo(-12, -38);
  ctx.closePath();
  ctx.fill();
  if (pose === 'lean') {
    ctx.beginPath();
    ctx.moveTo(-10, -38);
    ctx.lineTo(-26, 0);
    ctx.lineTo(-16, 0);
    ctx.lineTo(-2, -36);
    ctx.closePath();
    ctx.fill();
    ctx.beginPath();
    ctx.moveTo(10, -38);
    ctx.lineTo(20, 0);
    ctx.lineTo(30, 0);
    ctx.lineTo(16, -36);
    ctx.closePath();
    ctx.fill();
  } else {
    ctx.fillRect(-14, -38, 10, 40);
    ctx.fillRect(4, -38, 10, 40);
  }
  ctx.restore();
}

function paintBeach(ctx, w, h) {
  skyGradient(ctx, w, h, [
    [0, '#2b1a5e'], [0.35, '#c22e7d'], [0.62, '#ff7a3d'], [0.8, '#ffc93d'], [1, '#ffe9a8'],
  ]);
  sunDisc(ctx, w * 0.62, h * 0.42, h * 0.085, '#fff3c4', 'rgba(255,170,80,.55)');
  // Sea band with sun glitter.
  const sea = ctx.createLinearGradient(0, h * 0.58, 0, h * 0.78);
  sea.addColorStop(0, '#e2607a');
  sea.addColorStop(1, '#3d1a5e');
  ctx.fillStyle = sea;
  ctx.fillRect(0, h * 0.58, w, h * 0.2);
  const rnd = mulberry32(7);
  ctx.fillStyle = 'rgba(255,240,190,.5)';
  for (let i = 0; i < 26; i++) {
    const x = w * (0.45 + rnd() * 0.35);
    const y = h * (0.6 + rnd() * 0.15);
    ctx.fillRect(x, y, 20 + rnd() * 60, 2);
  }
  // Sand.
  ctx.fillStyle = '#e8a06a';
  ctx.fillRect(0, h * 0.78, w, h * 0.22);
  ctx.fillStyle = 'rgba(120,60,20,.25)';
  for (let i = 0; i < 40; i++) ctx.fillRect(rnd() * w, h * (0.8 + rnd() * 0.18), 3 + rnd() * 8, 2);
  // Boulevard + vintage convertible silhouette, smaller so the sunset owns
  // the frame; a figure leans on its door, standing on the sand beside it.
  ctx.fillStyle = '#241533';
  ctx.fillRect(0, h * 0.72, w, h * 0.06);
  ctx.fillStyle = '#12081f';
  ctx.beginPath();
  ctx.moveTo(w * 0.12, h * 0.74);
  ctx.lineTo(w * 0.16, h * 0.68);
  ctx.lineTo(w * 0.5, h * 0.68);
  ctx.quadraticCurveTo(w * 0.62, h * 0.68, w * 0.64, h * 0.74);
  ctx.lineTo(w * 0.64, h * 0.77);
  ctx.lineTo(w * 0.12, h * 0.77);
  ctx.closePath();
  ctx.fill();
  ctx.fillStyle = '#ff5d8f';
  ctx.fillRect(w * 0.18, h * 0.685, w * 0.28, h * 0.012);
  ctx.fillStyle = '#0a0512';
  for (const cx of [0.22, 0.55]) {
    ctx.beginPath();
    ctx.arc(w * cx, h * 0.77, h * 0.026, 0, Math.PI * 2);
    ctx.fill();
  }
  personSilhouette(ctx, w * 0.74, h * 0.78, h / 900, '#12081f', 'lean');
  palmTree(ctx, w * 0.07, h * 0.8, h / 700, -0.08, '#160a24');
  palmTree(ctx, w * 0.93, h * 0.8, h / 760, 0.1, '#160a24');
}

function paintNeon(ctx, w, h) {
  skyGradient(ctx, w, h, [[0, '#070312'], [0.6, '#160a2e'], [1, '#2a0f45']]);
  const rnd = mulberry32(21);
  // Buildings with lit windows.
  for (let bx = 0; bx < w; bx += w * 0.16) {
    const bh = h * (0.35 + rnd() * 0.35);
    ctx.fillStyle = '#0d0618';
    ctx.fillRect(bx + 4, h * 0.72 - bh, w * 0.14, bh);
    for (let wy = h * 0.72 - bh + 12; wy < h * 0.68; wy += 26) {
      for (let wx = bx + 12; wx < bx + w * 0.13; wx += 22) {
        if (rnd() > 0.45) {
          ctx.fillStyle = rnd() > 0.5 ? 'rgba(255,210,90,.9)' : 'rgba(80,230,220,.85)';
          ctx.fillRect(wx, wy, 10, 14);
        }
      }
    }
  }
  // Neon diner sign.
  ctx.save();
  ctx.shadowBlur = 34;
  ctx.shadowColor = '#ff4d9d';
  ctx.fillStyle = '#ff4d9d';
  ctx.fillRect(w * 0.3, h * 0.3, w * 0.4, h * 0.075);
  ctx.shadowColor = '#2ee6c8';
  ctx.fillStyle = '#2ee6c8';
  ctx.fillRect(w * 0.34, h * 0.42, w * 0.32, h * 0.02);
  ctx.restore();
  ctx.fillStyle = '#fff';
  ctx.font = `900 ${Math.round(h * 0.045)}px Arial, sans-serif`;
  ctx.textAlign = 'center';
  ctx.fillText('DINER', w * 0.5, h * 0.355);
  // Wet pavement with reflections.
  const wet = ctx.createLinearGradient(0, h * 0.72, 0, h);
  wet.addColorStop(0, '#1c0b33');
  wet.addColorStop(1, '#05020a');
  ctx.fillStyle = wet;
  ctx.fillRect(0, h * 0.72, w, h * 0.28);
  ctx.save();
  ctx.globalAlpha = 0.35;
  ctx.fillStyle = '#ff4d9d';
  ctx.fillRect(w * 0.3, h * 0.74, w * 0.4, h * 0.1);
  ctx.fillStyle = '#2ee6c8';
  ctx.fillRect(w * 0.34, h * 0.86, w * 0.32, h * 0.05);
  ctx.restore();
  ctx.fillStyle = 'rgba(255,255,255,.14)';
  for (let i = 0; i < 24; i++) ctx.fillRect(rnd() * w, h * (0.74 + rnd() * 0.24), 2 + rnd() * 10, 1.5);
  personSilhouette(ctx, w * 0.38, h * 0.72, h / 950, '#05020a', 'stand');
  personSilhouette(ctx, w * 0.58, h * 0.72, h / 950, '#05020a', 'stand');
}

function paintPier(ctx, w, h) {
  skyGradient(ctx, w, h, [[0, '#8fd8ef'], [0.45, '#c9ecf5'], [0.62, '#ffd9a0'], [1, '#ff9a5c']]);
  sunDisc(ctx, w * 0.24, h * 0.3, h * 0.07, '#fff8d8', 'rgba(255,220,140,.5)');
  // Turquoise water.
  const sea = ctx.createLinearGradient(0, h * 0.5, 0, h);
  sea.addColorStop(0, '#2fb3c9');
  sea.addColorStop(1, '#0b5e7a');
  ctx.fillStyle = sea;
  ctx.fillRect(0, h * 0.5, w, h * 0.5);
  const rnd = mulberry32(33);
  ctx.strokeStyle = 'rgba(255,255,255,.35)';
  ctx.lineWidth = 2;
  for (let i = 0; i < 30; i++) {
    const y = h * (0.52 + rnd() * 0.44);
    ctx.beginPath();
    ctx.moveTo(rnd() * w, y);
    ctx.lineTo(rnd() * w + 30 + rnd() * 70, y);
    ctx.stroke();
  }
  // Wooden pier in perspective.
  ctx.fillStyle = '#7a5230';
  ctx.beginPath();
  ctx.moveTo(w * 0.42, h);
  ctx.lineTo(w * 0.47, h * 0.55);
  ctx.lineTo(w * 0.62, h * 0.55);
  ctx.lineTo(w * 0.78, h);
  ctx.closePath();
  ctx.fill();
  ctx.strokeStyle = 'rgba(40,20,8,.5)';
  ctx.lineWidth = 2;
  for (let i = 0; i <= 10; i++) {
    const t = i / 10;
    const y = h * (0.55 + 0.45 * t);
    const x0 = w * (0.47 - 0.05 * t);
    const x1 = w * (0.62 + 0.16 * t);
    ctx.beginPath();
    ctx.moveTo(x0, y);
    ctx.lineTo(x1, y);
    ctx.stroke();
  }
  ctx.fillStyle = '#5a3a20';
  ctx.fillRect(w * 0.44, h * 0.52, w * 0.03, h * 0.05);
  ctx.fillRect(w * 0.6, h * 0.52, w * 0.03, h * 0.05);
  // Angler with a rod.
  personSilhouette(ctx, w * 0.545, h * 0.56, h / 1000, '#241408', 'stand');
  ctx.strokeStyle = '#241408';
  ctx.lineWidth = 3;
  ctx.beginPath();
  ctx.moveTo(w * 0.56, h * 0.48);
  ctx.quadraticCurveTo(w * 0.72, h * 0.4, w * 0.86, h * 0.46);
  ctx.stroke();
  ctx.strokeStyle = 'rgba(36,20,8,.6)';
  ctx.lineWidth = 1;
  ctx.beginPath();
  ctx.moveTo(w * 0.86, h * 0.46);
  ctx.lineTo(w * 0.86, h * 0.62);
  ctx.stroke();
  // Bucket hat brim.
  ctx.fillStyle = '#241408';
  ctx.beginPath();
  ctx.ellipse(w * 0.545, h * 0.435, h * 0.02, h * 0.006, 0, 0, Math.PI * 2);
  ctx.fill();
}

function paintRooftop(ctx, w, h) {
  skyGradient(ctx, w, h, [[0, '#1b1440'], [0.5, '#7a2d6d'], [0.75, '#ff7a3d'], [1, '#ffc93d']]);
  sunDisc(ctx, w * 0.7, h * 0.55, h * 0.06, '#ffe9a8', 'rgba(255,150,70,.5)');
  const rnd = mulberry32(55);
  // Hazy skyline.
  for (let i = 0; i < 14; i++) {
    const bw = w * (0.05 + rnd() * 0.07);
    const bh = h * (0.2 + rnd() * 0.3);
    const bx = (i / 14) * w;
    ctx.fillStyle = i % 2 ? 'rgba(30,16,52,.85)' : 'rgba(46,22,72,.9)';
    ctx.fillRect(bx, h * 0.68 - bh, bw, bh);
    ctx.fillStyle = 'rgba(255,210,120,.75)';
    for (let wy = h * 0.68 - bh + 10; wy < h * 0.64; wy += 22) {
      for (let wx = bx + 8; wx < bx + bw - 8; wx += 18) {
        if (rnd() > 0.6) ctx.fillRect(wx, wy, 6, 9);
      }
    }
  }
  // Rooftop floor + parapet.
  ctx.fillStyle = '#150b26';
  ctx.fillRect(0, h * 0.68, w, h * 0.32);
  ctx.fillStyle = '#1e1233';
  ctx.fillRect(0, h * 0.68, w, h * 0.03);
  ctx.fillStyle = 'rgba(255,150,80,.25)';
  ctx.fillRect(0, h * 0.71, w, 3);
  palmTree(ctx, w * 0.86, h * 0.7, h / 800, 0.06, '#0d0618');
  personSilhouette(ctx, w * 0.42, h * 0.68, h / 950, '#0d0618', 'stand');
  // Gold chain glint.
  ctx.strokeStyle = 'rgba(255,210,90,.9)';
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.arc(w * 0.42, h * 0.6, h * 0.012, 0.3, Math.PI - 0.3);
  ctx.stroke();
}

// Paint one scene onto ctx (already sized). Returns the scene id.
export function paintScene(ctx, w, h, id) {
  ctx.save();
  ctx.clearRect(0, 0, w, h);
  if (id === 'neon') paintNeon(ctx, w, h);
  else if (id === 'pier') paintPier(ctx, w, h);
  else if (id === 'rooftop') paintRooftop(ctx, w, h);
  else paintBeach(ctx, w, h);
  ctx.restore();
  return id;
}

// Render a scene to a fresh canvas and return it (used as a photo source).
export function sceneCanvas(id, w = 900, h = 900) {
  const c = document.createElement('canvas');
  c.width = w;
  c.height = h;
  paintScene(c.getContext('2d'), w, h, id);
  return c;
}
