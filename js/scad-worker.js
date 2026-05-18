// Web Worker: runs openscad-wasm to compile SCAD → STL off the main thread.
const CDN = 'https://cdn.jsdelivr.net/npm/openscad-wasm@0.0.4/';

let instance = null;
const stderrLines = [];

async function getOpenSCAD() {
  if (instance) return instance;

  // openscad-wasm is an ES module — use dynamic import() in a module worker.
  // import.meta.url inside openscad.js will be the CDN URL, so the WASM binary
  // is automatically resolved to CDN + 'openscad.wasm' without extra config.
  const jsUrl = CDN + 'openscad.js';
  self.postMessage({ type: 'log', msg: 'Importing openscad module from: ' + jsUrl });

  let mod;
  try {
    mod = await import(jsUrl);
  } catch (e) {
    throw new Error('Failed to import openscad.js: ' + e.message);
  }

  const factory = mod.default || mod.OpenSCAD || mod.openscad || mod.createOpenSCAD;
  if (typeof factory !== 'function') {
    throw new Error('openscad module exports: [' + Object.keys(mod).join(', ') + ']');
  }

  self.postMessage({ type: 'log', msg: 'Initialising WASM (factory: ' + (factory.name || 'anonymous') + ')…' });
  instance = await factory({
    locateFile: (path) => CDN + path,  // fallback for non-import.meta builds
    print: (msg) => self.postMessage({ type: 'log', msg }),
    printErr: (msg) => {
      stderrLines.push(msg);
      self.postMessage({ type: 'log', msg: '[stderr] ' + msg });
    },
  });

  return instance;
}

function ensureDir(oc, dir) {
  const parts = dir.split('/').filter(Boolean);
  let path = '';
  for (const part of parts) {
    path = path ? path + '/' + part : part;
    try { oc.FS.mkdir(path); } catch (_) { /* exists */ }
  }
}

self.addEventListener('message', async (e) => {
  const { files, entryScad, entryFile, flags } = e.data;
  stderrLines.length = 0;

  self.postMessage({
    type: 'status',
    msg: instance ? 'Rendering…' : 'Loading OpenSCAD engine… (first load, ~20 MB)',
  });

  try {
    const oc = await getOpenSCAD();

    self.postMessage({ type: 'status', msg: 'Setting up virtual filesystem…' });

    // Create all needed subdirectories
    const dirs = new Set();
    for (const p of Object.keys(files)) {
      const segs = p.split('/');
      for (let i = 1; i < segs.length; i++) {
        dirs.add(segs.slice(0, i).join('/'));
      }
    }
    for (const d of dirs) ensureDir(oc, d);

    // Write SCAD source files
    for (const [path, content] of Object.entries(files)) {
      oc.FS.writeFile(path, content);
    }

    // Optionally write a generated wrapper
    if (entryScad) {
      oc.FS.writeFile('main.scad', entryScad);
    }

    // Clear previous output so we can detect failure
    try { oc.FS.unlink('out.stl'); } catch (_) {}

    self.postMessage({ type: 'status', msg: 'Rendering model… (may take a few seconds)' });

    const args = [...(flags || []), '-o', 'out.stl', entryFile];
    self.postMessage({ type: 'log', msg: 'callMain args: ' + JSON.stringify(args) });
    let exitCode = 0;
    try {
      exitCode = oc.callMain(args);
    } catch (ex) {
      // Emscripten sometimes throws ExitStatus on normal exit
      if (ex && ex.name === 'ExitStatus') {
        exitCode = ex.status;
      } else {
        throw ex;
      }
    }

    let stlData;
    try {
      stlData = oc.FS.readFile('out.stl');
    } catch (_) {
      const log = stderrLines.join('\n');
      throw new Error(
        `OpenSCAD produced no output (exit ${exitCode}).` +
        (log ? '\n\nOpenSCAD output:\n' + log : '')
      );
    }

    self.postMessage({ type: 'result', stl: stlData.buffer }, [stlData.buffer]);

  } catch (err) {
    self.postMessage({ type: 'error', msg: err.message });
  }
});
