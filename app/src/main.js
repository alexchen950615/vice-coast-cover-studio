// Vice Coast Cover Studio — editor wiring.
// Owns the state, the preview canvas, the controls and the exports. The cover
// itself is drawn by cover.js; the demo "photos" are painted by scenes.js.

import { LAYOUTS, GRADES, TITLE_STYLES, layoutPanels, renderCover, panelAt, exportCoverCanvas, downloadCanvas } from './cover.js';
import { SCENES, sceneCanvas } from './scenes.js';

const $ = (id) => document.getElementById(id);
const canvas = $('coverCanvas');
const ctx = canvas.getContext('2d');

const SIZES = {
  '1080x1080': [1080, 1080],
  '1080x1350': [1080, 1350],
  '1920x1080': [1920, 1080],
};

const TITLES = ['VICE COAST', 'SUNSET HEIST', 'NEON SHORE', 'PIER PRESSURE', 'NIGHT SHIFT', 'PALM ROYALE', 'GOLDEN HOUR', 'TURBO SUNSET'];
const SUBTITLES = [
  'sunset heist · vice city nights',
  'two friends, one fast car, no plan',
  'neon streets · after midnight',
  'golden hour, every hour',
  'the coast is calling',
  'drive fast · look good',
];

function defaultState() {
  return {
    layout: 'hero3',
    grade: 'sunset',
    gradeStrength: 80,
    warmth: 15,
    title: 'VICE COAST',
    subtitle: 'sunset heist · vice city nights',
    titleStyle: 'sunset',
    titleScale: 100,
    fx: { grain: true, vignette: true, halftone: false, frame: true, badge: true, stars: 4 },
    photos: [],
    panels: [],
    selected: 0,
  };
}

const state = defaultState();
let exportSize = '1080x1350';

function photoCountForLayout() {
  return layoutPanels(state.layout).panels.length;
}

function syncPanels() {
  const n = photoCountForLayout();
  while (state.panels.length < n) {
    const i = state.panels.length;
    state.panels.push({ photo: i % Math.max(1, state.photos.length), zoom: 100, ox: 0, oy: 0 });
  }
  state.panels.length = n;
  if (state.selected >= n) state.selected = 0;
}

function addDemoPhotos() {
  if (state.photos.length > 0) return;
  for (const s of SCENES) {
    state.photos.push({ name: s.name, image: sceneCanvas(s.id, 900, 900) });
  }
  syncPanels();
}

function render() {
  const [w, h] = SIZES[exportSize];
  if (canvas.width !== w || canvas.height !== h) {
    canvas.width = w;
    canvas.height = h;
  }
  syncPanels();
  renderCover(ctx, w, h, state);
  $('layoutName').textContent = (LAYOUTS.find((l) => l.id === state.layout) ?? LAYOUTS[0]).name;
  refreshPanelControls();
}

function thumbFor(photo, i) {
  const b = document.createElement('button');
  b.type = 'button';
  b.className = 'thumb';
  b.dataset.index = i;
  const img = document.createElement('canvas');
  img.width = 96;
  img.height = 64;
  const g = img.getContext('2d');
  const iw = photo.image.width;
  const ih = photo.image.height;
  const s = Math.max(96 / iw, 64 / ih);
  g.drawImage(photo.image, (96 - iw * s) / 2, (64 - ih * s) / 2, iw * s, ih * s);
  b.appendChild(img);
  const label = document.createElement('span');
  label.textContent = photo.name;
  b.appendChild(label);
  const used = state.panels.some((p) => p.photo === i);
  if (used) {
    const tag = document.createElement('span');
    tag.className = 'used';
    tag.textContent = 'in cover';
    b.appendChild(tag);
  }
  b.addEventListener('click', () => {
    state.panels[state.selected].photo = i;
    renderFilmstrip();
    render();
  });
  return b;
}

function renderFilmstrip() {
  const strip = $('filmstrip');
  strip.replaceChildren();
  state.photos.forEach((p, i) => strip.appendChild(thumbFor(p, i)));
}

function refreshPanelControls() {
  const sel = $('panelPhoto');
  const current = state.panels[state.selected];
  if (!current) return;
  sel.replaceChildren();
  state.photos.forEach((p, i) => {
    const o = document.createElement('option');
    o.value = i;
    o.textContent = p.name;
    sel.appendChild(o);
  });
  sel.value = String(current.photo);
  $('panelZoom').value = current.zoom;
  $('zoomVal').textContent = `${current.zoom}%`;
  $('panelShift').value = current.ox;
}

function buildLayoutButtons() {
  const grid = $('layoutGrid');
  const thumbs = {
    hero3: [[0, 0, 20, 40], [21, 0, 11, 13], [21, 14, 11, 13], [21, 27, 11, 13]],
    mosaic: [[0, 0, 10, 13], [11, 0, 10, 13], [22, 0, 10, 13], [0, 14, 10, 13], [22, 14, 10, 13], [0, 27, 10, 13], [11, 27, 10, 13], [22, 27, 10, 13]],
    fullbleed: [[0, 0, 32, 40]],
    tilt: [[2, 2, 18, 20], [14, 14, 18, 20], [6, 30, 20, 10]],
    duo: [[0, 0, 16, 40], [16, 0, 16, 40]],
    strip: [[0, 0, 32, 13], [0, 14, 32, 13], [0, 27, 32, 13]],
  };
  for (const l of LAYOUTS) {
    const b = document.createElement('button');
    b.type = 'button';
    b.className = 'layout-btn';
    b.dataset.layout = l.id;
    const svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
    svg.setAttribute('viewBox', '0 0 32 40');
    for (const [x, y, w, h] of thumbs[l.id]) {
      const r = document.createElementNS('http://www.w3.org/2000/svg', 'rect');
      r.setAttribute('x', x);
      r.setAttribute('y', y);
      r.setAttribute('width', w);
      r.setAttribute('height', h);
      r.setAttribute('rx', 1.5);
      r.setAttribute('fill', '#ff4d9d');
      r.setAttribute('opacity', '0.85');
      svg.appendChild(r);
    }
    const cap = document.createElement('span');
    cap.textContent = l.name;
    b.append(svg, cap);
    b.addEventListener('click', () => {
      state.layout = l.id;
      document.querySelectorAll('.layout-btn').forEach((el) => el.classList.toggle('active', el.dataset.layout === l.id));
      render();
    });
    grid.appendChild(b);
  }
  grid.querySelector('[data-layout="hero3"]').classList.add('active');
}

function buildGradeSwatches() {
  const wrap = $('gradeSwatches');
  for (const g of GRADES) {
    const b = document.createElement('button');
    b.type = 'button';
    b.className = 'swatch';
    b.dataset.grade = g.id;
    b.title = g.name;
    b.style.background = `linear-gradient(135deg, ${g.stops[0]}, ${g.stops[1]} 55%, ${g.stops[2]})`;
    const label = document.createElement('span');
    label.textContent = g.name;
    b.appendChild(label);
    b.addEventListener('click', () => {
      state.grade = g.id;
      document.querySelectorAll('.swatch').forEach((el) => el.classList.toggle('active', el.dataset.grade === g.id));
      render();
    });
    wrap.appendChild(b);
  }
  wrap.querySelector('[data-grade="sunset"]').classList.add('active');
}

function bindControls() {
  $('panelPhoto').addEventListener('change', (e) => {
    state.panels[state.selected].photo = Number(e.target.value);
    renderFilmstrip();
    render();
  });
  $('panelZoom').addEventListener('input', (e) => {
    state.panels[state.selected].zoom = Number(e.target.value);
    $('zoomVal').textContent = `${e.target.value}%`;
    render();
  });
  $('panelShift').addEventListener('input', (e) => {
    state.panels[state.selected].ox = Number(e.target.value);
    render();
  });
  $('gradeStrength').addEventListener('input', (e) => {
    state.gradeStrength = Number(e.target.value);
    $('gradeVal').textContent = `${e.target.value}%`;
    render();
  });
  $('warmth').addEventListener('input', (e) => {
    state.warmth = Number(e.target.value);
    $('warmthVal').textContent = `${e.target.value > 0 ? '+' : ''}${e.target.value}`;
    render();
  });
  $('titleInput').addEventListener('input', (e) => {
    state.title = e.target.value.trim() || 'VICE COAST';
    render();
  });
  $('subtitleInput').addEventListener('input', (e) => {
    state.subtitle = e.target.value.trim() || 'vice city nights';
    render();
  });
  $('titleStyle').addEventListener('change', (e) => {
    state.titleStyle = e.target.value;
    render();
  });
  $('titleSize').addEventListener('input', (e) => {
    state.titleScale = Number(e.target.value);
    $('titleSizeVal').textContent = `${e.target.value}%`;
    render();
  });
  for (const key of ['grain', 'vignette', 'halftone', 'frame', 'badge']) {
    $(`fx${key[0].toUpperCase()}${key.slice(1)}`).addEventListener('change', (e) => {
      state.fx[key] = e.target.checked;
      render();
    });
  }
  $('fxStars').addEventListener('input', (e) => {
    state.fx.stars = Number(e.target.value);
    $('starsVal').textContent = '★'.repeat(state.fx.stars) + '☆'.repeat(5 - state.fx.stars);
    render();
  });
  $('exportSize').addEventListener('change', (e) => {
    exportSize = e.target.value;
    render();
  });
  $('exportBtn').addEventListener('click', exportCurrent);
  $('exportAllBtn').addEventListener('click', exportAllSizes);
  $('demoBtn').addEventListener('click', () => {
    addDemoPhotos();
    renderFilmstrip();
    render();
  });
  $('shuffleBtn').addEventListener('click', () => {
    state.panels.forEach((p) => {
      p.photo = Math.floor(Math.random() * state.photos.length);
    });
    renderFilmstrip();
    render();
  });
  $('randomBtn').addEventListener('click', randomCover);
  $('photoInput').addEventListener('change', async (e) => {
    const files = [...e.target.files];
    for (const f of files) {
      const img = await loadImageFile(f);
      if (img) state.photos.push({ name: f.name.replace(/\.[^.]+$/, ''), image: img });
    }
    e.target.value = '';
    syncPanels();
    renderFilmstrip();
    render();
  });
}

function loadImageFile(file) {
  return new Promise((resolve) => {
    const url = URL.createObjectURL(file);
    const img = new Image();
    img.onload = () => {
      URL.revokeObjectURL(url);
      resolve(img);
    };
    img.onerror = () => resolve(null);
    img.src = url;
  });
}

function exportCurrent() {
  const [w, h] = SIZES[exportSize];
  const c = exportCoverCanvas(state, w, h);
  downloadCanvas(c, `vice-coast-${state.title.toLowerCase().replace(/[^a-z0-9]+/g, '-')}-${w}x${h}.png`);
}

function exportAllSizes() {
  Object.entries(SIZES).forEach(([key, [w, h]], i) => {
    setTimeout(() => {
      downloadCanvas(exportCoverCanvas(state, w, h), `vice-coast-${key}.png`);
    }, i * 350);
  });
}

function randomCover() {
  state.layout = LAYOUTS[Math.floor(Math.random() * LAYOUTS.length)].id;
  state.grade = GRADES[Math.floor(Math.random() * GRADES.length)].id;
  state.title = TITLES[Math.floor(Math.random() * TITLES.length)];
  state.subtitle = SUBTITLES[Math.floor(Math.random() * SUBTITLES.length)];
  state.titleStyle = Object.keys(TITLE_STYLES)[Math.floor(Math.random() * Object.keys(TITLE_STYLES).length)];
  $('titleInput').value = state.title;
  $('subtitleInput').value = state.subtitle;
  $('titleStyle').value = state.titleStyle;
  document.querySelectorAll('.layout-btn').forEach((el) => el.classList.toggle('active', el.dataset.layout === state.layout));
  document.querySelectorAll('.swatch').forEach((el) => el.classList.toggle('active', el.dataset.grade === state.grade));
  state.panels.forEach((p) => {
    p.photo = Math.floor(Math.random() * state.photos.length);
    p.zoom = 100 + Math.floor(Math.random() * 60);
  });
  render();
}

// Drag to pan the selected panel, wheel to zoom it, click to select a panel.
function bindCanvas() {
  let drag = null;
  const toCover = (e) => {
    const r = canvas.getBoundingClientRect();
    return [
      ((e.clientX - r.left) / r.width) * canvas.width,
      ((e.clientY - r.top) / r.height) * canvas.height,
    ];
  };
  canvas.addEventListener('pointerdown', (e) => {
    const [x, y] = toCover(e);
    const hit = panelAt(state, x, y, canvas.width, canvas.height);
    if (hit >= 0) {
      state.selected = hit;
      render();
      const p = state.panels[hit];
      drag = { x, y, ox: p.ox, oy: p.oy };
      canvas.setPointerCapture(e.pointerId);
    }
  });
  canvas.addEventListener('pointermove', (e) => {
    if (!drag) return;
    const [x, y] = toCover(e);
    const p = state.panels[state.selected];
    const rect = { w: canvas.width, h: canvas.height };
    p.ox = drag.ox + ((x - drag.x) / rect.w) * 100;
    p.oy = drag.oy + ((y - drag.y) / rect.h) * 100;
    p.ox = Math.max(-60, Math.min(60, p.ox));
    p.oy = Math.max(-60, Math.min(60, p.oy));
    render();
  });
  canvas.addEventListener('pointerup', () => { drag = null; });
  canvas.addEventListener('wheel', (e) => {
    e.preventDefault();
    const p = state.panels[state.selected];
    p.zoom = Math.max(100, Math.min(300, p.zoom + (e.deltaY < 0 ? 10 : -10)));
    render();
  }, { passive: false });
}

// Screenshot mode: ?shot=cover renders one cover full-window (the app's own
// drawing of an exported cover); ?shot=editor shows the editor with demo photos.
// Query params: layout, grade, title, subtitle, size, scene (first photo).
function runShotMode(params) {
  const mode = params.get('shot');
  if (!mode) return false;
  addDemoPhotos();
  if (params.get('layout')) state.layout = params.get('layout');
  if (params.get('grade')) state.grade = params.get('grade');
  if (params.get('title')) {
    state.title = params.get('title');
    $('titleInput').value = state.title;
  }
  if (params.get('subtitle')) {
    state.subtitle = params.get('subtitle');
    $('subtitleInput').value = state.subtitle;
  }
  if (params.get('style')) {
    state.titleStyle = params.get('style');
    $('titleStyle').value = state.titleStyle;
  }
  const scene = params.get('scene');
  if (scene) {
    const idx = SCENES.findIndex((s) => s.id === scene);
    if (idx >= 0) state.panels.forEach((p) => { p.photo = idx; });
  }
  // Keep the control highlights honest about the state the URL asked for.
  document.querySelectorAll('.layout-btn').forEach((el) => el.classList.toggle('active', el.dataset.layout === state.layout));
  document.querySelectorAll('.swatch').forEach((el) => el.classList.toggle('active', el.dataset.grade === state.grade));
  if (mode === 'cover') {
    document.body.classList.add('shot-cover');
    const size = params.get('size') ?? exportSize;
    const [w, h] = SIZES[size] ?? SIZES['1080x1350'];
    canvas.width = w;
    canvas.height = h;
    syncPanels();
    renderCover(ctx, w, h, state);
    document.title = `Vice Coast cover ${w}x${h}`;
    return true;
  }
  if (params.get('size')) {
    exportSize = params.get('size');
    $('exportSize').value = exportSize;
  }
  renderFilmstrip();
  render();
  return true;
}

// Boot.
buildLayoutButtons();
buildGradeSwatches();
bindControls();
bindCanvas();
addDemoPhotos();
const params = new URLSearchParams(location.search);
if (!runShotMode(params)) {
  renderFilmstrip();
  render();
}
window.__viceCoast = { state, render, exportCoverCanvas, SIZES };
