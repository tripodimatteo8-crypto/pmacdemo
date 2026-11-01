import * as THREE from 'three';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';

const stage = document.getElementById('pmac-planet-stage');
const canvas = document.getElementById('pmac-planet-canvas');
if (stage && canvas && window.customElements) {
  const bgUrl = stage.dataset.bg;
  const modelUrl = stage.dataset.model;

  const scene = new THREE.Scene();
  scene.fog = new THREE.FogExp2(0x060607, 0.045);

  const camera = new THREE.PerspectiveCamera(45, stage.clientWidth / stage.clientHeight, 0.1, 200);
  const renderer = new THREE.WebGLRenderer({ canvas, antialias: true, alpha: false });
  renderer.setSize(stage.clientWidth, stage.clientHeight);
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
  renderer.setClearColor(0x060607, 1);

  // Sfondo: il pianeta come fondale distante
  new THREE.TextureLoader().load(bgUrl, (tex) => {
    tex.colorSpace = THREE.SRGBColorSpace;
    scene.background = tex;
  });

  // Luce
  scene.add(new THREE.AmbientLight(0xffffff, 0.55));
  const key = new THREE.DirectionalLight(0xffffff, 1.4);
  key.position.set(6, 10, 4);
  scene.add(key);
  const rim = new THREE.DirectionalLight(0x9aa0a6, 0.6);
  rim.position.set(-8, 4, -6);
  scene.add(rim);

  // Pavimento: griglia scura stile radar
  const groundGeo = new THREE.CircleGeometry(16, 64);
  const groundMat = new THREE.MeshStandardMaterial({ color: 0x0b0b0c, roughness: 0.85, metalness: 0.2 });
  const ground = new THREE.Mesh(groundGeo, groundMat);
  ground.rotation.x = -Math.PI / 2;
  scene.add(ground);

  const grid = new THREE.GridHelper(32, 32, 0x6e737a, 0x2a2b2d);
  grid.position.y = 0.01;
  scene.add(grid);

  // Coniglio
  let rabbit = null;
  const loader = new GLTFLoader();
  loader.load(modelUrl, (gltf) => {
    rabbit = gltf.scene;
    rabbit.scale.setScalar(1.1);
    rabbit.position.set(0, 0, 0);
    scene.add(rabbit);
  });

  // Controlli: tastiera (WASD/frecce) + pulsanti touch
  const input = { up: false, down: false, left: false, right: false };
  const keyMap = {
    ArrowUp: 'up', KeyW: 'up',
    ArrowDown: 'down', KeyS: 'down',
    ArrowLeft: 'left', KeyA: 'left',
    ArrowRight: 'right', KeyD: 'right',
  };

  window.addEventListener('keydown', (e) => {
    const dir = keyMap[e.code];
    if (dir) { input[dir] = true; e.preventDefault(); }
  });
  window.addEventListener('keyup', (e) => {
    const dir = keyMap[e.code];
    if (dir) { input[dir] = false; }
  });

  stage.querySelectorAll('[data-dir]').forEach((btn) => {
    const dir = btn.dataset.dir;
    const start = (e) => { e.preventDefault(); input[dir] = true; };
    const end = (e) => { e.preventDefault(); input[dir] = false; };
    btn.addEventListener('pointerdown', start);
    btn.addEventListener('pointerup', end);
    btn.addEventListener('pointerleave', end);
    btn.addEventListener('pointercancel', end);
  });

  const velocity = new THREE.Vector3();
  const facing = new THREE.Vector3(0, 0, 1);
  const worldOffset = new THREE.Vector3();
  const BOUNDARY = 60;
  const SPEED = 5;

  const clock = new THREE.Clock();
  let t = 0;

  function animate() {
    requestAnimationFrame(animate);
    const delta = Math.min(clock.getDelta(), 0.05);
    t += delta;

    velocity.set(0, 0, 0);
    if (input.up) velocity.z -= 1;
    if (input.down) velocity.z += 1;
    if (input.left) velocity.x -= 1;
    if (input.right) velocity.x += 1;

    const isMoving = velocity.lengthSq() > 0;

    if (isMoving) {
      velocity.normalize().multiplyScalar(SPEED * delta);

      worldOffset.x = THREE.MathUtils.clamp(worldOffset.x + velocity.x, -BOUNDARY, BOUNDARY);
      worldOffset.z = THREE.MathUtils.clamp(worldOffset.z + velocity.z, -BOUNDARY, BOUNDARY);

      // Il coniglio resta fermo al centro: è il mondo (pavimento + griglia + sfondo)
      // a scorrere sotto di lui, come se stesse camminando sul pianeta.
      ground.position.x = -worldOffset.x;
      ground.position.z = -worldOffset.z;
      grid.position.x = -worldOffset.x;
      grid.position.z = -worldOffset.z;

      facing.set(velocity.x, 0, velocity.z).normalize();
      const targetAngle = Math.atan2(facing.x, facing.z);
      if (rabbit) rabbit.rotation.y = THREE.MathUtils.lerp(rabbit.rotation.y, targetAngle, 0.2);

      // Leggero parallasse sullo sfondo del pianeta, più lento del pavimento.
      scene.backgroundRotation = scene.backgroundRotation || new THREE.Euler();
      scene.backgroundRotation.y -= velocity.x * 0.01;
      scene.backgroundRotation.x -= velocity.z * 0.005;
    }

    if (rabbit) {
      // Piccolo rimbalzo quando cammina, per dare peso al movimento.
      rabbit.position.y = isMoving ? Math.abs(Math.sin(t * 9)) * 0.18 : 0;
    }

    const camOffset = new THREE.Vector3(0, 4.2, 7);
    camera.position.lerp(camOffset, 0.08);
    camera.lookAt(0, 1.2, 0);

    renderer.render(scene, camera);
  }
  animate();

  function onResize() {
    const w = stage.clientWidth;
    const h = stage.clientHeight;
    camera.aspect = w / h;
    camera.updateProjectionMatrix();
    renderer.setSize(w, h);
  }
  window.addEventListener('resize', onResize);
}
