/* ─────────────────────────────────────────────────────────────────────────
   Neurovale — Three.js scenes + UI logic
   Apple-style: 3D as centrepiece, not background texture
   Brand palette: #C2275A · #F4A0B8 · #E8B96A · #8B1A40
───────────────────────────────────────────────────────────────────────── */

const { THREE } = window;
const REDUCED = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

function rand(min, max) { return Math.random() * (max - min) + min; }
function lerp(a, b, t)  { return a + (b - a) * t; }

/* ────────────────────────────────────────────────────────────────────────
   1. HERO — Soft breathing particle nebula
      Particles drift gently outward and breathe, like a calm mind
──────────────────────────────────────────────────────────────────────── */
(function initHero() {
  const canvas = document.getElementById('hero-canvas');
  if (!canvas) return;

  const renderer = new THREE.WebGLRenderer({ canvas, antialias: true, alpha: true });
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
  renderer.setClearColor(0x000000, 0);

  const scene  = new THREE.Scene();
  const camera = new THREE.PerspectiveCamera(55, 1, 0.1, 2000);
  camera.position.z = 360;

  const N = REDUCED ? 120 : 600;
  const positions = new Float32Array(N * 3);
  const nodes     = [];

  for (let i = 0; i < N; i++) {
    const theta = rand(0, Math.PI * 2);
    const phi   = Math.acos(rand(-1, 1));
    const r     = rand(20, 200);
    const x = r * Math.sin(phi) * Math.cos(theta);
    const y = r * Math.sin(phi) * Math.sin(theta);
    const z = r * Math.cos(phi);
    positions[i * 3]     = x;
    positions[i * 3 + 1] = y;
    positions[i * 3 + 2] = z;
    nodes.push({ ox: x, oy: y, oz: z, s: rand(0.15, 0.6), p: rand(0, Math.PI * 2), a: rand(0.015, 0.05) });
  }

  const geo = new THREE.BufferGeometry();
  geo.setAttribute('position', new THREE.BufferAttribute(positions, 3));

  const mat = new THREE.PointsMaterial({ size: 2.0, color: 0xC2275A, transparent: true, opacity: 0.65, sizeAttenuation: true });
  const pts = new THREE.Points(geo, mat);
  scene.add(pts);

  /* Faint lines */
  if (!REDUCED) {
    const lm = new THREE.LineBasicMaterial({ color: 0x8B1A40, transparent: true, opacity: 0.05 });
    for (let i = 0; i < N; i++) {
      for (let j = i + 1; j < N; j++) {
        const dx = nodes[i].ox - nodes[j].ox, dy = nodes[i].oy - nodes[j].oy, dz = nodes[i].oz - nodes[j].oz;
        if (dx*dx + dy*dy + dz*dz < 3600) {
          const g = new THREE.BufferGeometry().setFromPoints([
            new THREE.Vector3(nodes[i].ox, nodes[i].oy, nodes[i].oz),
            new THREE.Vector3(nodes[j].ox, nodes[j].oy, nodes[j].oz),
          ]);
          scene.add(new THREE.Line(g, lm));
        }
      }
    }
  }

  const mouse = { x: 0, y: 0, tx: 0, ty: 0 };
  window.addEventListener('mousemove', e => {
    mouse.tx = (e.clientX / window.innerWidth  - 0.5) * 2;
    mouse.ty = (e.clientY / window.innerHeight - 0.5) * 2;
  });

  function resize() {
    const el = canvas.parentElement;
    renderer.setSize(el.clientWidth, el.clientHeight, false);
    camera.aspect = el.clientWidth / el.clientHeight;
    camera.updateProjectionMatrix();
  }
  resize();
  window.addEventListener('resize', resize);

  let t = 0;
  const pos = geo.attributes.position;
  (function animate() {
    requestAnimationFrame(animate);
    if (!REDUCED) {
      t += 0.005;
      mouse.x = lerp(mouse.x, mouse.tx, 0.035);
      mouse.y = lerp(mouse.y, mouse.ty, 0.035);
      for (let i = 0; i < N; i++) {
        const n = nodes[i], w = 1 + n.a * Math.sin(t * n.s + n.p);
        pos.setXYZ(i, n.ox * w, n.oy * w, n.oz * w);
      }
      pos.needsUpdate = true;
      pts.rotation.y = t * 0.035 + mouse.x * 0.08;
      pts.rotation.x = mouse.y * 0.05;
      mat.opacity    = 0.5 + 0.18 * Math.sin(t * 0.35);
    }
    renderer.render(scene, camera);
  })();
})();

/* ────────────────────────────────────────────────────────────────────────
   2. SHOWCASE — Large centred icosahedra "mind" scene
      This is the star of the show: full-viewport, large, dramatic
──────────────────────────────────────────────────────────────────────── */
(function initShowcase() {
  const canvas = document.getElementById('mind-canvas');
  if (!canvas) return;

  const renderer = new THREE.WebGLRenderer({ canvas, antialias: true, alpha: true });
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
  renderer.setClearColor(0x000000, 0);

  const scene  = new THREE.Scene();
  const camera = new THREE.PerspectiveCamera(50, 1, 0.1, 1000);
  camera.position.z = 4.2;

  function shell(r, d, color, op) {
    const m = new THREE.MeshBasicMaterial({ color, wireframe: true, transparent: true, opacity: op });
    const mesh = new THREE.Mesh(new THREE.IcosahedronGeometry(r, d), m);
    scene.add(mesh);
    return mesh;
  }

  /* Layered shells — larger than before, more dramatic */
  const outer = shell(1.60, 4, 0xC2275A, 0.10);
  const mid   = shell(1.28, 3, 0x8B1A40, 0.18);
  const inner = shell(0.92, 3, 0xF4A0B8, 0.28);
  const core  = shell(0.44, 2, 0xE8B96A, 0.65);

  /* Surface glow particles */
  const pts = [];
  for (let i = 0; i < 300; i++) {
    const phi = Math.acos(1 - 2 * Math.random()), th = Math.random() * Math.PI * 2;
    const r   = rand(0.88, 1.65);
    pts.push(new THREE.Vector3(r * Math.sin(phi) * Math.cos(th), r * Math.sin(phi) * Math.sin(th), r * Math.cos(phi)));
  }
  const ptGeo = new THREE.BufferGeometry().setFromPoints(pts);
  const ptMat = new THREE.PointsMaterial({ size: 0.028, color: 0xF4A0B8, transparent: true, opacity: 0.75 });
  scene.add(new THREE.Points(ptGeo, ptMat));

  /* Equatorial pulse ring */
  const ringGeo = new THREE.RingGeometry(1.18, 1.24, 80);
  const ringMat = new THREE.MeshBasicMaterial({ color: 0xC2275A, transparent: true, opacity: 0.25, side: THREE.DoubleSide });
  const ring    = new THREE.Mesh(ringGeo, ringMat);
  scene.add(ring);

  /* Second ring offset */
  const ring2Geo = new THREE.RingGeometry(0.88, 0.92, 64);
  const ring2Mat = new THREE.MeshBasicMaterial({ color: 0xE8B96A, transparent: true, opacity: 0.2, side: THREE.DoubleSide });
  const ring2    = new THREE.Mesh(ring2Geo, ring2Mat);
  ring2.rotation.x = Math.PI / 3;
  scene.add(ring2);

  /* Mouse interaction */
  const mouse = { x: 0, y: 0, tx: 0, ty: 0 };
  window.addEventListener('mousemove', e => {
    mouse.tx = (e.clientX / window.innerWidth  - 0.5);
    mouse.ty = (e.clientY / window.innerHeight - 0.5);
  });

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
  (function animate() {
    requestAnimationFrame(animate);
    t += REDUCED ? 0 : 0.008;
    mouse.x = lerp(mouse.x, mouse.tx, 0.04);
    mouse.y = lerp(mouse.y, mouse.ty, 0.04);

    outer.rotation.y = t * 0.12  + mouse.x * 0.4;
    outer.rotation.x = Math.sin(t * 0.16) * 0.22 + mouse.y * 0.3;
    mid.rotation.y   = -t * 0.18 + mouse.x * 0.3;
    mid.rotation.x   = Math.cos(t * 0.14) * 0.18 + mouse.y * 0.2;
    inner.rotation.y = t * 0.28;
    inner.rotation.z = t * 0.10;
    core.rotation.y  = -t * 0.36;
    core.rotation.x  = t * 0.14;

    const pulse = 0.92 + 0.1 * Math.sin(t * 1.6);
    ring.scale.set(pulse, pulse, 1);
    ringMat.opacity  = 0.15 + 0.15 * Math.sin(t * 1.6);
    ring.rotation.x  = t * 0.22;
    ring.rotation.z  = t * 0.08;

    ring2.rotation.y = t * 0.18;
    ring2Mat.opacity = 0.12 + 0.1 * Math.sin(t * 1.2 + 1);

    renderer.render(scene, camera);
  })();
})();

/* ────────────────────────────────────────────────────────────────────────
   3. CONTACT — Perspective grid floor + floating orbs
──────────────────────────────────────────────────────────────────────── */
(function initContact() {
  const canvas = document.getElementById('contact-canvas');
  if (!canvas) return;

  const renderer = new THREE.WebGLRenderer({ canvas, antialias: true, alpha: true });
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
  renderer.setClearColor(0x000000, 0);

  const scene  = new THREE.Scene();
  const camera = new THREE.PerspectiveCamera(48, 1, 0.1, 2000);
  camera.position.set(0, 200, 320);
  camera.lookAt(0, 0, 0);

  const GRID = 26, STEP = 34, HALF = (GRID * STEP) / 2;

  for (let i = 0; i <= GRID; i++) {
    const x = i * STEP - HALF;
    const c = i % 5 === 0 ? 0xC2275A : 0x1a0810;
    const o = i % 5 === 0 ? 0.20 : 0.08;
    const g = new THREE.BufferGeometry().setFromPoints([new THREE.Vector3(x,0,-HALF), new THREE.Vector3(x,0,HALF)]);
    scene.add(new THREE.Line(g, new THREE.LineBasicMaterial({ color: c, transparent: true, opacity: o })));
  }
  for (let j = 0; j <= GRID; j++) {
    const z = j * STEP - HALF;
    const c = j % 5 === 0 ? 0x8B1A40 : 0x1a0810;
    const o = j % 5 === 0 ? 0.20 : 0.08;
    const g = new THREE.BufferGeometry().setFromPoints([new THREE.Vector3(-HALF,0,z), new THREE.Vector3(HALF,0,z)]);
    scene.add(new THREE.Line(g, new THREE.LineBasicMaterial({ color: c, transparent: true, opacity: o })));
  }

  const orbs = [];
  const oc = [0xC2275A, 0xF4A0B8, 0xE8B96A];
  for (let k = 0; k < 10; k++) {
    const r = rand(2.5, 5);
    const m = new THREE.Mesh(
      new THREE.SphereGeometry(r, 10, 10),
      new THREE.MeshBasicMaterial({ color: oc[k % 3], transparent: true, opacity: 0.5 })
    );
    m.position.set(rand(-HALF, HALF), rand(10, 50), rand(-HALF, HALF));
    m.userData = { oy: m.position.y, sp: rand(0.5, 1.3), ph: rand(0, Math.PI * 2) };
    scene.add(m);
    orbs.push(m);
  }

  function resize() {
    const w = canvas.parentElement.clientWidth, h = canvas.parentElement.clientHeight;
    renderer.setSize(w, h, false);
    camera.aspect = w / h;
    camera.updateProjectionMatrix();
  }
  resize();
  window.addEventListener('resize', resize);

  let t = 0;
  (function animate() {
    requestAnimationFrame(animate);
    if (!REDUCED) {
      t += 0.01;
      orbs.forEach(o => { o.position.y = o.userData.oy + 10 * Math.sin(t * o.userData.sp + o.userData.ph); });
      camera.position.x = Math.sin(t * 0.055) * 55;
      camera.lookAt(0, 0, 0);
    }
    renderer.render(scene, camera);
  })();
})();

/* ────────────────────────────────────────────────────────────────────────
   Navbar scroll state
──────────────────────────────────────────────────────────────────────── */
const navbar = document.getElementById('navbar');
window.addEventListener('scroll', () => {
  navbar.classList.toggle('scrolled', window.scrollY > 60);
}, { passive: true });

/* ────────────────────────────────────────────────────────────────────────
   Mobile menu
──────────────────────────────────────────────────────────────────────── */
const hamburger  = document.getElementById('hamburger');
const mobileMenu = document.getElementById('mobile-menu');
const mobileClose = document.getElementById('mobile-close');

function openMenu()  { mobileMenu.hidden = false; hamburger.setAttribute('aria-expanded','true');  document.body.style.overflow='hidden'; }
function closeMenu() { mobileMenu.hidden = true;  hamburger.setAttribute('aria-expanded','false'); document.body.style.overflow=''; }

hamburger.addEventListener('click', openMenu);
mobileClose.addEventListener('click', closeMenu);
document.querySelectorAll('.mobile-link').forEach(el => el.addEventListener('click', closeMenu));
document.addEventListener('keydown', e => { if (e.key === 'Escape' && !mobileMenu.hidden) closeMenu(); });

/* ────────────────────────────────────────────────────────────────────────
   Scroll reveal
──────────────────────────────────────────────────────────────────────── */
new IntersectionObserver((entries, obs) => {
  entries.forEach(e => {
    if (!e.isIntersecting) return;
    e.target.classList.add('visible');
    obs.unobserve(e.target);
  });
}, { threshold: 0.1 }).observe.bind(
  new IntersectionObserver((entries, obs) => {
    entries.forEach(e => { if (!e.isIntersecting) return; e.target.classList.add('visible'); obs.unobserve(e.target); });
  }, { threshold: 0.1 })
);

// Clean single observer
const revObs = new IntersectionObserver((entries, obs) => {
  entries.forEach(e => { if (!e.isIntersecting) return; e.target.classList.add('visible'); obs.unobserve(e.target); });
}, { threshold: 0.1 });
document.querySelectorAll('.reveal').forEach(el => revObs.observe(el));

/* ────────────────────────────────────────────────────────────────────────
   Referral form submit
──────────────────────────────────────────────────────────────────────── */
const form = document.getElementById('contact-form');
if (form) {
  form.addEventListener('submit', function(e) {
    e.preventDefault();
    const btn = document.getElementById('submit-btn');
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
