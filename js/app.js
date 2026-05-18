import { initViewer, loadSTL } from './viewer.js';

// ── Defaults matching dog_bowl_platform.scad ─────────────────────────────────
const DEFAULTS = {
  bowl_diameter: 200,
  num_bowls: 2,
  bowl_rim: 25,
  stand_height: 200,
  frame_w: 20,
  wall_t: 3,
  chamfer_r: 2,
  tab_len: 15,
  snap_bump: 1.2,
  snap_clearance: 0.25,
  foot_dia: 35,
  foot_h: 8,
  explode: 0,
};

let params = { ...DEFAULTS };
let scadFiles = {};
let worker = null;
let lastSTL = null;
let rendering = false;

// Resolve SCAD file URLs relative to this script's location (works on GitHub Pages)
const BASE = new URL('..', import.meta.url).href;

const SCAD_ENTRIES = [
  ['dog_bowl_platform.scad', 'openscad/dog_bowl_platform.scad'],
  ['parts/corner_post.scad', 'openscad/parts/corner_post.scad'],
  ['parts/horizontal_rail.scad', 'openscad/parts/horizontal_rail.scad'],
  ['parts/bowl_cradle.scad', 'openscad/parts/bowl_cradle.scad'],
  ['lib/frame.scad', 'openscad/lib/frame.scad'],
  ['lib/joints.scad', 'openscad/lib/joints.scad'],
];

// ── Initialisation ────────────────────────────────────────────────────────────

async function init() {
  initViewer(document.getElementById('canvas'));
  setupUI();

  setStatus('Loading SCAD files…', true);
  try {
    const entries = await Promise.all(
      SCAD_ENTRIES.map(async ([vPath, relPath]) => {
        const res = await fetch(BASE + relPath);
        if (!res.ok) throw new Error(`${relPath}: HTTP ${res.status}`);
        return [vPath, await res.text()];
      })
    );
    scadFiles = Object.fromEntries(entries);
  } catch (e) {
    setStatus('Failed to load SCAD files: ' + e.message, true);
    return;
  }

  const workerUrl = new URL('./scad-worker.js', import.meta.url).href;
  worker = new Worker(workerUrl);
  worker.addEventListener('message', onWorkerMessage);

  setStatus('', false);
  triggerRender();
}

// ── UI bindings ───────────────────────────────────────────────────────────────

function setupUI() {
  // Range sliders
  for (const id of ['bowl_diameter', 'stand_height', 'snap_clearance', 'explode']) {
    const input = document.getElementById(id);
    const valEl = document.getElementById(id + '-val');
    input.value = params[id];
    valEl.textContent = params[id];
    input.addEventListener('input', () => {
      params[id] = parseFloat(input.value);
      valEl.textContent = params[id];
    });
  }

  // Sync bowl button highlight
  syncNumBowlsUI();
}

function syncNumBowlsUI() {
  document.getElementById('nb-1').classList.toggle('active', params.num_bowls === 1);
  document.getElementById('nb-2').classList.toggle('active', params.num_bowls === 2);
}

window.setNumBowls = (n) => {
  params.num_bowls = n;
  syncNumBowlsUI();
};

window.toggleParams = () => {
  const overlay = document.getElementById('params-overlay');
  const drawer = document.getElementById('params-drawer');
  const opening = !overlay.classList.contains('visible');
  overlay.classList.toggle('visible', opening);
  drawer.classList.toggle('open', opening);
};

window.resetParams = () => {
  params = { ...DEFAULTS };
  setupUI();
};

window.triggerRender = triggerRender;

window.downloadSTL = () => {
  if (!lastSTL) return;
  const blob = new Blob([lastSTL], { type: 'model/stl' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `bowl-stand-${document.getElementById('part-select').value}.stl`;
  a.click();
  URL.revokeObjectURL(url);
};

// ── Render orchestration ──────────────────────────────────────────────────────

function triggerRender() {
  if (rendering || !worker || !Object.keys(scadFiles).length) return;
  rendering = true;
  document.getElementById('render-btn').disabled = true;

  const partKey = document.getElementById('part-select').value;
  const msg = buildWorkerMessage(partKey);
  worker.postMessage(msg);
}

function onWorkerMessage(e) {
  const { type, msg, stl } = e.data;

  switch (type) {
    case 'status':
      setStatus(msg, true);
      break;

    case 'log':
      console.log('[openscad]', msg);
      break;

    case 'result':
      lastSTL = stl;
      loadSTL(stl);
      setStatus('', false);
      rendering = false;
      document.getElementById('render-btn').disabled = false;
      document.getElementById('dl-btn').disabled = false;
      break;

    case 'error':
      setStatus('Render error — see console for details', true);
      console.error('[openscad error]\n', msg);
      rendering = false;
      document.getElementById('render-btn').disabled = false;
      break;
  }
}

// ── SCAD message builder ──────────────────────────────────────────────────────

function derived() {
  const p = params;
  const cradle_w = p.num_bowls === 2
    ? 2 * p.bowl_diameter + 3 * p.bowl_rim
    : p.bowl_diameter + 2 * p.bowl_rim;
  const cradle_d = p.bowl_diameter + 2 * p.bowl_rim;
  const rail_len_x = cradle_w - p.snap_clearance * 2;
  const rail_len_y = cradle_d - p.snap_clearance * 2;
  const cradle_cl = p.snap_clearance * 2;
  return { cradle_w, cradle_d, rail_len_x, rail_len_y, cradle_cl };
}

function buildWorkerMessage(partKey) {
  const p = params;
  const d = derived();

  // Assembly and print layout: use master file with -D overrides (cleanest approach)
  if (partKey === 'assembly' || partKey === 'print_layout') {
    return {
      files: scadFiles,
      entryScad: null,
      entryFile: 'dog_bowl_platform.scad',
      flags: [
        '-D', `bowl_diameter=${p.bowl_diameter}`,
        '-D', `num_bowls=${p.num_bowls}`,
        '-D', `bowl_rim=${p.bowl_rim}`,
        '-D', `stand_height=${p.stand_height}`,
        '-D', `snap_clearance=${p.snap_clearance}`,
        '-D', `explode=${p.explode}`,
        '-D', `print_mode=${partKey === 'print_layout' ? 'true' : 'false'}`,
      ],
    };
  }

  // Individual parts: generate a self-contained wrapper SCAD
  let entryScad;
  const fn64 = '$fn = 64;\n';

  if (partKey === 'corner_post') {
    entryScad = fn64 +
      'use <lib/frame.scad>\nuse <lib/joints.scad>\nuse <parts/corner_post.scad>\n' +
      `corner_post(height=${p.stand_height}, frame_w=${p.frame_w}, wall_t=${p.wall_t},` +
      ` chamfer=${p.chamfer_r}, tab_len=${p.tab_len}, snap_bump=${p.snap_bump},` +
      ` tab_taper=1.5, snap_cl=${p.snap_clearance}, foot_dia=${p.foot_dia}, foot_h=${p.foot_h});`;

  } else if (partKey === 'horizontal_rail') {
    entryScad = fn64 +
      'use <lib/frame.scad>\nuse <lib/joints.scad>\nuse <parts/horizontal_rail.scad>\n' +
      `horizontal_rail(len=${d.rail_len_x}, frame_w=${p.frame_w}, wall_t=${p.wall_t},` +
      ` chamfer=${p.chamfer_r}, tab_len=${p.tab_len}, snap_bump=${p.snap_bump}, tab_taper=1.5);`;

  } else if (partKey === 'bowl_cradle') {
    entryScad = fn64 +
      'use <parts/bowl_cradle.scad>\n' +
      `bowl_cradle(num_bowls=${p.num_bowls}, bowl_d=${p.bowl_diameter}, bowl_rim=${p.bowl_rim},` +
      ` bowl_depth=60, cradle_w=${d.cradle_w - d.cradle_cl}, cradle_d=${d.cradle_d - d.cradle_cl},` +
      ` wall_t=${p.wall_t});`;
  }

  return {
    files: scadFiles,
    entryScad,
    entryFile: 'main.scad',
    flags: [],
  };
}

// ── Helpers ───────────────────────────────────────────────────────────────────

function setStatus(msg, visible) {
  const el = document.getElementById('status');
  el.textContent = msg;
  el.classList.toggle('visible', visible && !!msg);
}

init().catch((e) => {
  console.error(e);
  setStatus('Startup error: ' + e.message, true);
});
