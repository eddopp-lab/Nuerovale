/* ─────────────────────────────────────────────────────────────────────────
   Neurovale — Three.js Scenes + UI Logic
   Skill: ui-ux-pro-max
     · transform/opacity animations only (no width/height)
     · prefers-reduced-motion respected
     · 150-300ms micro-interactions
     · Brand palette: #C2275A crimson · #F4A0B8 rose · #E8B96A gold
───────────────────────────────────────────────────────────────────────── */

const { THREE } = window;
const REDUCED = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

function rand(min, max) { return Math.random() * (max - min) + min; }
function lerp(a, b, t)  { return a + (b - a) * t; }

/* ────────────────────────────────────────────────────────────────────────
   1. HERO — Warm organic particle field
      Flowing particles in brand crimson, rose, and gold — calm, breathing
──────────────────────────────────────────────────────────────────────── */
(function initHero() {
  const canvas = document.getElementById('hero-canvas');
  if (!canvas) return;

  const renderer = new THREE.WebGLRenderer({ canvas, antialias: true, alpha: true });
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
  renderer.setClearColor(0x000000, 0);

  const scene  = new THREE.Scene();
  const camera = new THREE.PerspectiveCamera(55, 1, 0.1, 2000);
  camera.position.z = 340;

  const N = REDUCED ? 150 : 700;
  const positions = new Float32Array(N * 3);
  const nodeData  = [];
  const COLOURS   = [0xC2275A, 0xF4A0B8, 0xE8B96A, 0x8B1A40];

  for (let i = 0; i < N; i++) {
    /* Sphere distribution — clusters near centre like a soft mind nebula */
    const theta = rand(0, Math.PI * 2);
    const phi   = Math.acos(rand(-1, 1));
    const r     = rand(30, 190);
    const x = r * Math.sin(phi) * Math.cos(theta);
    const y = r * Math.sin(phi) * Math.sin(theta);
    const z = r * Math.cos(phi);
    positions[i * 3]     = x;
    positions[i * 3 + 1] = y;
    positions[i * 3 + 2] = z;
    nodeData.push({
      ox: x, oy: y, oz: z,
      speed: rand(0.2, 0.8),
      phase: rand(0, Math.PI * 2),
      amp:   rand(0.02, 0.06),
    });
  }

  const geo = new THREE.BufferGeometry();
  geo.setAttribute('position', new THREE.BufferAttribute(positions, 3));

  /* Vary point sizes — warm large orbs + fine dust */
  const sizes = new Float32Array(N);
  for (let i = 0; i < N; i++) sizes[i] = rand(0.8, 3.5);
  geo.setAttribute('size', new THREE.BufferAttribute(sizes, 1));

  const mat = new THREE.PointsMaterial({
    size: 2.2,
    color: 0xC2275A,
    transparent: true,
    opacity: 0.7,
    sizeAttenuation: true,
  });
  const points = new THREE.Points(geo, mat);
  scene.add(points);

  /* Soft connecting lines — brand crimson, very faint */
  if (!REDUCED) {
    const lMat = new THREE.LineBasicMaterial({ color: 0x8B1A40, transparent: true, opacity: 0.055 });
    for (let i = 0; i < N; i++) {
      for (let j = i + 1; j < N; j++) {
        const dx = nodeData[i].ox - nodeData[j].ox;
        const dy = nodeData[i].oy - nodeData[j].oy;
        const dz = nodeData[i].oz - nodeData[j].oz;
        if (dx*dx + dy*dy + dz*dz < 4200) {
          const g = new THREE.BufferGeometry().setFromPoints([
            new THREE.Vector3(nodeData[i].ox, nodeData[i].oy, nodeData[i].oz),
            new THREE.Vector3(nodeData[j].ox, nodeData[j].oy, nodeData[j].oz),
          ]);
          scene.add(new THREE.Line(g, lMat));
        }
      }
    }
  }

  /* Mouse parallax */
  const mouse = { x: 0, y: 0, tx: 0, ty: 0 };
  window.addEventListener('mousemove', e => {
    mouse.tx = (e.clientX / window.innerWidth  - 0.5) * 2;
    mouse.ty = (e.clientY / window.innerHeight - 0.5) * 2;
  });

  function resize() {
    const el = canvas.parentElement;
    const w = el.clientWidth, h = el.clientHeight;
    renderer.setSize(w, h, false);
    camera.aspect = w / h;
    camera.updateProjectionMatrix();
  }
  resize();
  window.addEventListener('resize', resize);

  let t = 0;
  const pos = geo.attributes.position;
  function animate() {
    requestAnimationFrame(animate);
    if (REDUCED) { renderer.render(scene, camera); return; }

    t += 0.006;
    mouse.x = lerp(mouse.x, mouse.tx, 0.04);
    mouse.y = lerp(mouse.y, mouse.ty, 0.04);

    /* Gentle breathing wave */
    for (let i = 0; i < N; i++) {
      const d    = nodeData[i];
      const wave = 1 + d.amp * Math.sin(t * d.speed + d.phase);
      pos.setXYZ(i, d.ox * wave, d.oy * wave, d.oz * wave);
    }
    pos.needsUpdate = true;

    /* Slow rotation + mouse tilt */
    points.rotation.y = t * 0.04 + mouse.x * 0.1;
    points.rotation.x = mouse.y * 0.06;

    /* Cycle opacity gently — like breathing */
    mat.opacity = 0.55 + 0.2 * Math.sin(t * 0.4);

    renderer.render(scene, camera);
  }
  animate();
})();

/* ────────────────────────────────────────────────────────────────────────
   2. ABOUT BG — slow torus-knot wireframe (brand crimson, very faint)
──────────────────────────────────────────────────────────────────────── */
(function initAboutBg() {
  const canvas = document.getElementById('about-canvas');
  if (!canvas) return;

  const renderer = new THREE.WebGLRenderer({ canvas, antialias: true, alpha: true });
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
  renderer.setClearColor(0x000000, 0);

  const scene  = new THREE.Scene();
  const camera = new THREE.PerspectiveCamera(60, 1, 0.1, 2000);
  camera.position.z = 420;

  const g = new THREE.TorusKnotGeometry(130, 38, 180, 18);
  const m = new THREE.MeshBasicMaterial({ color: 0xC2275A, wireframe: true, transparent: true, opacity: 0.045 });
  const torus = new THREE.Mesh(g, m);
  scene.add(torus);

  function resize() {
    const w = canvas.parentElement.clientWidth;
    const h = canvas.parentElement.clientHeight;
    renderer.setSize(w, h, false);
    camera.aspect = w / h;
    camera.updateProjectionMatrix();
  }
  resize();
  window.addEventListener('resize', resize);

  let t = 0;
  function animate() {
    requestAnimationFrame(animate);
    if (!REDUCED) t += 0.003;
    torus.rotation.x = t * 0.22;
    torus.rotation.y = t * 0.14;
    renderer.render(scene, camera);
  }
  animate();
})();

/* ────────────────────────────────────────────────────────────────────────
   3. MIND CARD — layered wireframe icosahedra (calm mind / wholeness)
──────────────────────────────────────────────────────────────────────── */
(function initMind() {
  const canvas = document.getElementById('mind-canvas');
  if (!canvas) return;

  const renderer = new THREE.WebGLRenderer({ canvas, antialias: true, alpha: true });
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
  renderer.setClearColor(0x000000, 0);

  const scene  = new THREE.Scene();
  const camera = new THREE.PerspectiveCamera(55, 1, 0.1, 1000);
  camera.position.z = 3.6;

  function shell(r, d, color, op) {
    const m    = new THREE.MeshBasicMaterial({ color, wireframe: true, transparent: true, opacity: op });
    const mesh = new THREE.Mesh(new THREE.IcosahedronGeometry(r, d), m);
    scene.add(mesh);
    return mesh;
  }

  const outer = shell(1.32, 3, 0xC2275A, 0.10);
  const mid   = shell(1.06, 3, 0x8B1A40, 0.16);
  const inner = shell(0.76, 2, 0xF4A0B8, 0.26);
  const core  = shell(0.38, 1, 0xE8B96A, 0.55);

  /* Surface particles */
  const nodePts = [];
  for (let i = 0; i < 200; i++) {
    const phi   = Math.acos(1 - 2 * Math.random());
    const theta = Math.random() * Math.PI * 2;
    const r     = rand(0.72, 1.36);
    nodePts.push(new THREE.Vector3(
      r * Math.sin(phi) * Math.cos(theta),
      r * Math.sin(phi) * Math.sin(theta),
      r * Math.cos(phi)
    ));
  }
  const ptGeo = new THREE.BufferGeometry().setFromPoints(nodePts);
  const ptMat = new THREE.PointsMaterial({ size: 0.030, color: 0xF4A0B8, transparent: true, opacity: 0.8 });
  scene.add(new THREE.Points(ptGeo, ptMat));

  /* Pulse ring — brand crimson */
  const ringGeo = new THREE.RingGeometry(1.0, 1.04, 64);
  const ringMat = new THREE.MeshBasicMaterial({ color: 0xC2275A, transparent: true, opacity: 0.3, side: THREE.DoubleSide });
  const ring    = new THREE.Mesh(ringGeo, ringMat);
  scene.add(ring);

  function resize() {
    const w = canvas.parentElement.clientWidth;
    const h = canvas.parentElement.clientHeight;
    renderer.setSize(w, h, false);
    camera.aspect = w / h;
    camera.updateProjectionMatrix();
  }
  resize();
  window.addEventListener('resize', resize);

  let t = 0;
  function animate() {
    requestAnimationFrame(animate);
    t += REDUCED ? 0 : 0.009;

    outer.rotation.y = t * 0.14;
    outer.rotation.x = Math.sin(t * 0.18) * 0.25;
    mid.rotation.y   = -t * 0.20;
    mid.rotation.x   = Math.cos(t * 0.16) * 0.20;
    inner.rotation.y = t * 0.30;
    inner.rotation.z = t * 0.12;
    core.rotation.y  = -t * 0.40;

    const p = 0.9 + 0.12 * Math.sin(t * 1.8);
    ring.scale.set(p, p, 1);
    ringMat.opacity = 0.15 + 0.18 * Math.sin(t * 1.8);
    ring.rotation.x = t * 0.24;
    ring.rotation.z = t * 0.12;

    renderer.render(scene, camera);
  }
  animate();
})();

/* ────────────────────────────────────────────────────────────────────────
   4. CONTACT — perspective grid + floating orbs (warm palette)
──────────────────────────────────────────────────────────────────────── */
(function initContact() {
  const canvas = document.getElementById('contact-canvas');
  if (!canvas) return;

  const renderer = new THREE.WebGLRenderer({ canvas, antialias: true, alpha: true });
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
  renderer.setClearColor(0x000000, 0);

  const scene  = new THREE.Scene();
  const camera = new THREE.PerspectiveCamera(50, 1, 0.1, 2000);
  camera.position.set(0, 190, 310);
  camera.lookAt(0, 0, 0);

  const GRID = 28, STEP = 32, HALF = (GRID * STEP) / 2;

  for (let i = 0; i <= GRID; i++) {
    const x  = i * STEP - HALF;
    const c  = i % 5 === 0 ? 0xC2275A : 0x180810;
    const op = i % 5 === 0 ? 0.22 : 0.09;
    const g  = new THREE.BufferGeometry().setFromPoints([
      new THREE.Vector3(x, 0, -HALF),
      new THREE.Vector3(x, 0,  HALF),
    ]);
    scene.add(new THREE.Line(g, new THREE.LineBasicMaterial({ color: c, transparent: true, opacity: op })));
  }
  for (let j = 0; j <= GRID; j++) {
    const z  = j * STEP - HALF;
    const c  = j % 5 === 0 ? 0x8B1A40 : 0x180810;
    const op = j % 5 === 0 ? 0.22 : 0.09;
    const g  = new THREE.BufferGeometry().setFromPoints([
      new THREE.Vector3(-HALF, 0, z),
      new THREE.Vector3( HALF, 0, z),
    ]);
    scene.add(new THREE.Line(g, new THREE.LineBasicMaterial({ color: c, transparent: true, opacity: op })));
  }

  /* Floating orbs — brand palette */
  const orbs = [];
  const orbColors = [0xC2275A, 0xF4A0B8, 0xE8B96A];
  for (let k = 0; k < 12; k++) {
    const r    = rand(2, 5);
    const mesh = new THREE.Mesh(
      new THREE.SphereGeometry(r, 8, 8),
      new THREE.MeshBasicMaterial({ color: orbColors[k % 3], transparent: true, opacity: 0.5 })
    );
    mesh.position.set(rand(-HALF, HALF), rand(8, 45), rand(-HALF, HALF));
    mesh.userData = { oy: mesh.position.y, speed: rand(0.5, 1.4), phase: rand(0, Math.PI * 2) };
    scene.add(mesh);
    orbs.push(mesh);
  }

  function resize() {
    const w = canvas.parentElement.clientWidth;
    const h = canvas.parentElement.clientHeight;
    renderer.setSize(w, h, false);
    camera.aspect = w / h;
    camera.updateProjectionMatrix();
  }
  resize();
  window.addEventListener('resize', resize);

  let t = 0;
  function animate() {
    requestAnimationFrame(animate);
    if (!REDUCED) {
      t += 0.01;
      orbs.forEach(o => {
        o.position.y = o.userData.oy + 9 * Math.sin(t * o.userData.speed + o.userData.phase);
      });
      camera.position.x = Math.sin(t * 0.06) * 60;
      camera.lookAt(0, 0, 0);
    }
    renderer.render(scene, camera);
  }
  animate();
})();

/* ────────────────────────────────────────────────────────────────────────
   5. Navbar — scroll state
──────────────────────────────────────────────────────────────────────── */
const navbar = document.getElementById('navbar');
window.addEventListener('scroll', () => {
  navbar.classList.toggle('scrolled', window.scrollY > 60);
}, { passive: true });

/* ────────────────────────────────────────────────────────────────────────
   6. Mobile hamburger
──────────────────────────────────────────────────────────────────────── */
const hamburger   = document.getElementById('hamburger');
const mobileMenu  = document.getElementById('mobile-menu');
const mobileClose = document.getElementById('mobile-close');

function openMenu() {
  mobileMenu.hidden = false;
  hamburger.setAttribute('aria-expanded', 'true');
  document.body.style.overflow = 'hidden';
}
function closeMenu() {
  mobileMenu.hidden = true;
  hamburger.setAttribute('aria-expanded', 'false');
  document.body.style.overflow = '';
}

hamburger.addEventListener('click', openMenu);
mobileClose.addEventListener('click', closeMenu);
document.querySelectorAll('.mobile-link').forEach(el => el.addEventListener('click', closeMenu));
document.addEventListener('keydown', e => { if (e.key === 'Escape' && !mobileMenu.hidden) closeMenu(); });

/* ────────────────────────────────────────────────────────────────────────
   7. Scroll reveal
──────────────────────────────────────────────────────────────────────── */
const revealObserver = new IntersectionObserver((entries, obs) => {
  entries.forEach(entry => {
    if (!entry.isIntersecting) return;
    entry.target.classList.add('visible');
    obs.unobserve(entry.target);
  });
}, { threshold: 0.1 });

document.querySelectorAll('.reveal').forEach(el => revealObserver.observe(el));

/* ────────────────────────────────────────────────────────────────────────
   8. Referral form submit
──────────────────────────────────────────────────────────────────────── */
const form = document.getElementById('contact-form');
if (form) {
  form.addEventListener('submit', function(e) {
    e.preventDefault();
    const btn  = this.querySelector('#submit-btn');
    const orig = btn.innerHTML;

    btn.innerHTML = 'Sending…';
    btn.disabled  = true;
    btn.setAttribute('aria-busy', 'true');

    setTimeout(() => {
      btn.innerHTML = 'Referral submitted — we\'ll be in touch!';
      btn.style.background = '#8B1A40';
      btn.removeAttribute('aria-busy');
    }, 1400);
  });
}
