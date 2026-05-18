import * as THREE from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
import { STLLoader } from 'three/addons/loaders/STLLoader.js';

let scene, camera, renderer, controls, mesh;

export function initViewer(canvas) {
  scene = new THREE.Scene();
  scene.background = new THREE.Color(0x0d0d1a);
  scene.fog = new THREE.FogExp2(0x0d0d1a, 0.00025);

  const w = canvas.clientWidth || 400;
  const h = canvas.clientHeight || 300;

  camera = new THREE.PerspectiveCamera(45, w / h, 1, 30000);
  camera.position.set(600, 500, 700);
  camera.lookAt(0, 100, 0);

  renderer = new THREE.WebGLRenderer({ canvas, antialias: true });
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
  renderer.setSize(w, h, false);
  renderer.shadowMap.enabled = true;
  renderer.shadowMap.type = THREE.PCFSoftShadowMap;

  // Ambient fill
  scene.add(new THREE.AmbientLight(0x8899bb, 0.6));

  // Key light (top-front-right)
  const key = new THREE.DirectionalLight(0xffffff, 0.9);
  key.position.set(400, 600, 500);
  key.castShadow = true;
  key.shadow.camera.near = 1;
  key.shadow.camera.far = 5000;
  key.shadow.camera.left = -800;
  key.shadow.camera.right = 800;
  key.shadow.camera.top = 800;
  key.shadow.camera.bottom = -800;
  key.shadow.mapSize.set(1024, 1024);
  scene.add(key);

  // Rim light (back-left)
  const rim = new THREE.DirectionalLight(0x4488ff, 0.35);
  rim.position.set(-300, 300, -400);
  scene.add(rim);

  // Ground shadow plane
  const ground = new THREE.Mesh(
    new THREE.PlaneGeometry(3000, 3000),
    new THREE.ShadowMaterial({ opacity: 0.15 })
  );
  ground.rotation.x = -Math.PI / 2;
  ground.receiveShadow = true;
  scene.add(ground);

  // Grid
  const grid = new THREE.GridHelper(1200, 24, 0x1a2a44, 0x111d33);
  scene.add(grid);

  // Controls — touch-friendly
  controls = new OrbitControls(camera, renderer.domElement);
  controls.enableDamping = true;
  controls.dampingFactor = 0.07;
  controls.rotateSpeed = 0.6;
  controls.panSpeed = 0.6;
  controls.zoomSpeed = 1.0;
  controls.minDistance = 5;
  controls.maxDistance = 20000;
  controls.target.set(0, 100, 0);

  // Responsive resize
  new ResizeObserver(() => {
    const w = canvas.clientWidth;
    const h = canvas.clientHeight;
    if (!w || !h) return;
    camera.aspect = w / h;
    camera.updateProjectionMatrix();
    renderer.setSize(w, h, false);
  }).observe(canvas.parentElement);

  (function loop() {
    requestAnimationFrame(loop);
    controls.update();
    renderer.render(scene, camera);
  })();
}

export function loadSTL(buffer) {
  const loader = new STLLoader();
  const geometry = loader.parse(buffer);
  geometry.computeVertexNormals();

  if (mesh) {
    scene.remove(mesh);
    mesh.geometry.dispose();
    mesh.material.dispose();
  }

  const material = new THREE.MeshPhongMaterial({
    color: 0x3a78c8,
    specular: 0x1a3860,
    shininess: 55,
    side: THREE.DoubleSide,
  });

  mesh = new THREE.Mesh(geometry, material);
  mesh.castShadow = true;
  mesh.receiveShadow = true;

  // OpenSCAD is Z-up; Three.js is Y-up → rotate -90° around X
  mesh.rotation.x = -Math.PI / 2;
  scene.add(mesh);

  // Compute world-space bounding box after rotation
  mesh.updateMatrixWorld(true);
  const box = new THREE.Box3().setFromObject(mesh);
  const center = new THREE.Vector3();
  const size = new THREE.Vector3();
  box.getCenter(center);
  box.getSize(size);

  // Shift so model sits on the ground plane (Y = 0)
  mesh.position.y -= box.min.y;

  // Recompute after shift
  box.translate(new THREE.Vector3(0, -box.min.y, 0));
  box.getCenter(center);

  // Fit camera to model
  const maxDim = Math.max(size.x, size.y, size.z);
  const fov = camera.fov * (Math.PI / 180);
  const dist = (maxDim / 2) / Math.tan(fov / 2) * 2.2;

  camera.position.set(
    center.x + dist * 0.7,
    center.y + dist * 0.5,
    center.z + dist * 0.7
  );
  camera.lookAt(center);
  controls.target.copy(center);
  controls.minDistance = maxDim * 0.05;
  controls.maxDistance = maxDim * 20;
  controls.update();
}
