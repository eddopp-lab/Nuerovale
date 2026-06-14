/* ─────────────────────────────────────────────────────────────────────────
   Neurovale — Three.js Scenes + UI Logic
   Skill applied: ui-ux-pro-max
     · transform/opacity animations only (no width/height)
     · prefers-reduced-motion respected
     · 150-300ms micro-interactions
     · No emoji icons (SVG only)
───────────────────────────────────────────────────────────────────────── */

const { THREE } = window;

const REDUCED = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

function rand(min, max) { return Math.random() * (max - min) + min; }
function lerp(a, b, t)  { return a + (b - a) * t; }

/* ────────────────────────────────────────────────────────────────────────
   1. HERO — 3D Neural Network (OLED palette: #00e5ff nodes, #7c3aed lines)
──────────────────────────────────────────────────────────────────────── */
(function initHero() {
  const canvas = document.getElementById('hero-canvas');
  if (!canvas) return;

  const renderer = new THREE.WebGLRenderer({ canvas, antialias: true, alpha: true });
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
  renderer.setClearColor(0x000000, 0);

  const scene  = new THREE.Scene();
  const camera = new THREE.PerspectiveCamera(60, 1, 0.1, 2000);
  camera.position.z = 360;

  /* Nodes */
  const N = REDUCED ? 200 : 900;
  const positions = new Float32Array(N * 3);
  const nodeData  = [];

  for (let i = 0; i < N; i++) {
    const theta = rand(0, Math.PI * 2);
    const phi   = Math.acos(rand(-1, 1));
    const r     = rand(60, 210);
    const x = r * Math.sin(phi) * Math.cos(theta);
    const y = r * Math.sin(phi) * Math.sin(theta);
    const z = r * Math.cos(phi);
    positions[i * 3]     = x;
    positions[i * 3 + 1] = y;
    positions[i * 3 + 2] = z;
    nodeData.push({ ox: x, oy: y, oz: z, speed: rand(0.3, 1.2), phase: rand(0, Math.PI * 2) });
  }

  const ptGeo = new THREE.BufferGeometry();
  ptGeo.setAttribute('position', new THREE.BufferAttribute(positions, 3));
  const ptMat = new THREE.PointsMaterial({ size: 2.0, color: 0xC2275A, transparent: true, opacity: 0.8, sizeAttenuation: true });
  const points = new THREE.Points(ptGeo, ptMat);
  scene.add(points);

  /* Edges */
  const lineGrp = new THREE.Group();
  scene.add(lineGrp);

  if (!REDUCED) {
    const lMat = new THREE.LineBasicMaterial({ color: 0x8B1A40, transparent: true, opacity: 0.07 });
    for (let i = 0; i < N; i++) {
      for (let j = i + 1; j < N; j++) {
        const dx = nodeData[i].ox - nodeData[j].ox;
        const dy = nodeData[i].oy - nodeData[j].oy;
        const dz = nodeData[i].oz - nodeData[j].oz;
        if (dx*dx + dy*dy + dz*dz < 5000) {
          const g = new THREE.BufferGeometry().setFromPoints([
            new THREE.Vector3(nodeData[i].ox, nodeData[i].oy, nodeData[i].oz),
            new THREE.Vector3(nodeData[j].ox, nodeData[j].oy, nodeData[j].oz),
          ]);
          lineGrp.add(new THREE.Line(g, lMat));
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
  const pos = ptGeo.attributes.position;
  function animate() {
    requestAnimationFrame(animate);
    if (REDUCED) { renderer.render(scene, camera); return; }

    t += 0.007;
    mouse.x = lerp(mouse.x, mouse.tx, 0.05);
    mouse.y = lerp(mouse.y, mouse.ty, 0.05);

    for (let i = 0; i < N; i++) {
      const d    = nodeData[i];
      const wave = 1 + 0.035 * Math.sin(t * d.speed + d.phase);
      pos.setXYZ(i, d.ox * wave, d.oy * wave, d.oz * wave);
    }
    pos.needsUpdate = true;

    points.rotation.y   = t * 0.055 + mouse.x * 0.12;
    points.rotation.x   = mouse.y * 0.07;
    lineGrp.rotation.y  = points.rotation.y;
    lineGrp.rotation.x  = points.rotation.x;

    renderer.render(scene, camera);
  }
  animate();
})();

/* ────────────────────────────────────────────────────────────────────────
   2. ABOUT BG — slow torus-knot wireframe (cyan, very faint)
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
  const m = new THREE.MeshBasicMaterial({ color: 0xC2275A, wireframe: true, transparent: true, opacity: 0.055 });
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
    if (!REDUCED) { t += 0.004; }
    torus.rotation.x = t * 0.28;
    torus.rotation.y = t * 0.18;
    renderer.render(scene, camera);
  }
  animate();
})();

/* ────────────────────────────────────────────────────────────────────────
   3. BRAIN CARD — layered wireframe icosahedra + pulse ring
──────────────────────────────────────────────────────────────────────── */
(function initBrain() {
  const canvas = document.getElementById('brain-canvas');
  if (!canvas) return;

  const renderer = new THREE.WebGLRenderer({ canvas, antialias: true, alpha: true });
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
  renderer.setClearColor(0x000000, 0);

  const scene  = new THREE.Scene();
  const camera = new THREE.PerspectiveCamera(55, 1, 0.1, 1000);
  camera.position.z = 3.6;

  function shell(r, d, color, op) {
    const m = new THREE.MeshBasicMaterial({ color, wireframe: true, transparent: true, opacity: op });
    const mesh = new THREE.Mesh(new THREE.IcosahedronGeometry(r, d), m);
    scene.add(mesh);
    return mesh;
  }

  const outer = shell(1.32, 3, 0xC2275A, 0.1);
  const mid   = shell(1.06, 3, 0x8B1A40, 0.16);
  const inner = shell(0.76, 2, 0xF4A0B8, 0.25);
  const core  = shell(0.38, 1, 0xE8B96A, 0.55);

  /* Surface nodes */
  const nodePts = [];
  for (let i = 0; i < 200; i++) {
    const phi   = Math.acos(1 - 2 * Math.random());
    const theta = Math.random() * Math.PI * 2;
    const r = rand(0.72, 1.36);
    nodePts.push(new THREE.Vector3(
      r * Math.sin(phi) * Math.cos(theta),
      r * Math.sin(phi) * Math.sin(theta),
      r * Math.cos(phi)
    ));
  }
  const ptsGeo = new THREE.BufferGeometry().setFromPoints(nodePts);
  const ptsMat = new THREE.PointsMaterial({ size: 0.032, color: 0xC2275A, transparent: true, opacity: 0.85 });
  const pts    = new THREE.Points(ptsGeo, ptsMat);
  scene.add(pts);

  /* Pulse ring — green (CTA color) */
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
    t += REDUCED ? 0 : 0.011;

    outer.rotation.y = t * 0.16;
    outer.rotation.x = Math.sin(t * 0.2) * 0.28;
    mid.rotation.y   = -t * 0.24;
    mid.rotation.x   = Math.cos(t * 0.18) * 0.22;
    inner.rotation.y = t * 0.36;
    inner.rotation.z = t * 0.14;
    core.rotation.y  = -t * 0.48;
    pts.rotation.y   = t * 0.18;

    const p = 0.9 + 0.14 * Math.sin(t * 2.0);
    ring.scale.set(p, p, 1);
    ringMat.opacity = 0.15 + 0.15 * Math.sin(t * 2.0);
    ring.rotation.x = t * 0.28;
    ring.rotation.z = t * 0.14;

    renderer.render(scene, camera);
  }
  animate();
})();

/* ────────────────────────────────────────────────────────────────────────
   4. RESEARCH — violet flowing particles
──────────────────────────────────────────────────────────────────────── */
(function initResearch() {
  const canvas = document.getElementById('research-canvas');
  if (!canvas) return;

  const renderer = new THREE.WebGLRenderer({ canvas, antialias: true, alpha: true });
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
  renderer.setClearColor(0x000000, 0);

  const scene  = new THREE.Scene();
  const camera = new THREE.PerspectiveCamera(70, 1, 0.1, 2000);
  camera.position.z = 300;

  const C  = 500;
  const pa = new Float32Array(C * 3);
  const va = [];

  for (let i = 0; i < C; i++) {
    pa[i*3]   = rand(-300, 300);
    pa[i*3+1] = rand(-300, 300);
    pa[i*3+2] = rand(-150, 150);
    va.push({ vx: rand(-0.35, 0.35), vy: rand(-0.35, 0.35), vz: rand(-0.15, 0.15) });
  }

  const geo = new THREE.BufferGeometry();
  geo.setAttribute('position', new THREE.BufferAttribute(pa, 3));
  scene.add(new THREE.Points(geo, new THREE.PointsMaterial({ size: 1.6, color: 0xF4A0B8, transparent: true, opacity: 0.6 })));

  function resize() {
    const w = canvas.parentElement.clientWidth;
    const h = canvas.parentElement.clientHeight;
    renderer.setSize(w, h, false);
    camera.aspect = w / h;
    camera.updateProjectionMatrix();
  }
  resize();
  window.addEventListener('resize', resize);

  const pos = geo.attributes.position;
  function animate() {
    requestAnimationFrame(animate);
    if (!REDUCED) {
      for (let i = 0; i < C; i++) {
        pos.array[i*3]   += va[i].vx;
        pos.array[i*3+1] += va[i].vy;
        pos.array[i*3+2] += va[i].vz;
        if (pos.array[i*3]   >  300) pos.array[i*3]   = -300;
        if (pos.array[i*3]   < -300) pos.array[i*3]   =  300;
        if (pos.array[i*3+1] >  300) pos.array[i*3+1] = -300;
        if (pos.array[i*3+1] < -300) pos.array[i*3+1] =  300;
        if (pos.array[i*3+2] >  150) pos.array[i*3+2] = -150;
        if (pos.array[i*3+2] < -150) pos.array[i*3+2] =  150;
      }
      pos.needsUpdate = true;
    }
    renderer.render(scene, camera);
  }
  animate();
})();

/* ────────────────────────────────────────────────────────────────────────
   5. CONTACT — perspective grid + floating orbs
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
  const accent = [0xC2275A, 0x8B1A40];

  for (let i = 0; i <= GRID; i++) {
    const x  = i * STEP - HALF;
    const c  = i % 5 === 0 ? accent[0] : 0x180810;
    const op = i % 5 === 0 ? 0.28 : 0.1;
    const g  = new THREE.BufferGeometry().setFromPoints([new THREE.Vector3(x,0,-HALF), new THREE.Vector3(x,0,HALF)]);
    scene.add(new THREE.Line(g, new THREE.LineBasicMaterial({ color: c, transparent: true, opacity: op })));
  }
  for (let j = 0; j <= GRID; j++) {
    const z  = j * STEP - HALF;
    const c  = j % 5 === 0 ? 0x8B1A40 : 0x180810;
    const op = j % 5 === 0 ? 0.28 : 0.1;
    const g  = new THREE.BufferGeometry().setFromPoints([new THREE.Vector3(-HALF,0,z), new THREE.Vector3(HALF,0,z)]);
    scene.add(new THREE.Line(g, new THREE.LineBasicMaterial({ color: c, transparent: true, opacity: op })));
  }

  /* Floating orbs — use skill accent colors */
  const orbs = [];
  const orbColors = [0xC2275A, 0xF4A0B8, 0xE8B96A];
  for (let k = 0; k < 12; k++) {
    const r    = rand(2, 5);
    const mesh = new THREE.Mesh(
      new THREE.SphereGeometry(r, 8, 8),
      new THREE.MeshBasicMaterial({ color: orbColors[k % 3], transparent: true, opacity: 0.55 })
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
      t += 0.011;
      orbs.forEach(o => {
        o.position.y = o.userData.oy + 9 * Math.sin(t * o.userData.speed + o.userData.phase);
      });
      camera.position.x = Math.sin(t * 0.07) * 70;
      camera.lookAt(0, 0, 0);
    }
    renderer.render(scene, camera);
  }
  animate();
})();

/* ────────────────────────────────────────────────────────────────────────
   6. Navbar — floating + scroll state
──────────────────────────────────────────────────────────────────────── */
const navbar = document.getElementById('navbar');
window.addEventListener('scroll', () => {
  navbar.classList.toggle('scrolled', window.scrollY > 60);
}, { passive: true });

/* ────────────────────────────────────────────────────────────────────────
   7. Mobile hamburger — a11y aware
──────────────────────────────────────────────────────────────────────── */
const hamburger  = document.getElementById('hamburger');
const mobileMenu = document.getElementById('mobile-menu');

hamburger.addEventListener('click', () => {
  const open = !mobileMenu.hidden;
  mobileMenu.hidden = open;
  hamburger.setAttribute('aria-expanded', String(!open));
});

document.querySelectorAll('.mobile-link, .mobile-cta').forEach(el => {
  el.addEventListener('click', () => {
    mobileMenu.hidden = true;
    hamburger.setAttribute('aria-expanded', 'false');
  });
});

/* ────────────────────────────────────────────────────────────────────────
   8. Animated counters — ease-out cubic per skill
──────────────────────────────────────────────────────────────────────── */
function animCounter(el, target, ms = 1800) {
  if (REDUCED) { el.textContent = target; return; }
  const t0 = performance.now();
  function tick(now) {
    const p = Math.min((now - t0) / ms, 1);
    const e = 1 - Math.pow(1 - p, 3);   /* ease-out cubic */
    el.textContent = Math.round(e * target);
    if (p < 1) requestAnimationFrame(tick);
  }
  requestAnimationFrame(tick);
}

new IntersectionObserver((entries, obs) => {
  entries.forEach(entry => {
    if (!entry.isIntersecting) return;
    entry.target.querySelectorAll('.counter').forEach(el => {
      animCounter(el, +el.dataset.target);
    });
    obs.unobserve(entry.target);
  });
}, { threshold: 0.3 }).observe(document.querySelector('.hero-stats'));

/* ────────────────────────────────────────────────────────────────────────
   9. Scroll reveal — IntersectionObserver
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
   10. Contact form — demo submit with disabled state per skill
──────────────────────────────────────────────────────────────────────── */
document.getElementById('contact-form').addEventListener('submit', function(e) {
  e.preventDefault();
  const btn = this.querySelector('button[type="submit"]');
  btn.textContent = 'Sending…';
  btn.disabled = true;           /* disable during async per skill */
  btn.setAttribute('aria-busy', 'true');

  setTimeout(() => {
    btn.textContent = 'Message sent — we\'ll be in touch!';
    btn.style.background = '#C2275A';
    btn.style.color = '#fff';
    btn.removeAttribute('aria-busy');
  }, 1400);
});
