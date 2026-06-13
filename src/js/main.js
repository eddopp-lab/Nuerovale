/* ─── Neurovale — Main 3D Scene Script ──────────────────────────────────── */

const { THREE } = window;

function rand(min, max) { return Math.random() * (max - min) + min; }
function lerp(a, b, t)  { return a + (b - a) * t; }

/* ────────────────────────────────────────────────────────────────────────── */
/*  1. HERO — Neural Network Particle Field                                   */
/* ────────────────────────────────────────────────────────────────────────── */
(function initHero() {
  const canvas   = document.getElementById('hero-canvas');
  const renderer = new THREE.WebGLRenderer({ canvas, antialias: true, alpha: true });
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
  renderer.setClearColor(0x000000, 0);

  const scene  = new THREE.Scene();
  const camera = new THREE.PerspectiveCamera(60, 1, 0.1, 2000);
  camera.position.z = 350;

  const NODE_COUNT = 900;
  const positions  = new Float32Array(NODE_COUNT * 3);
  const nodeData   = [];

  for (let i = 0; i < NODE_COUNT; i++) {
    const theta = rand(0, Math.PI * 2);
    const phi   = Math.acos(rand(-1, 1));
    const r     = rand(60, 200);
    const x = r * Math.sin(phi) * Math.cos(theta);
    const y = r * Math.sin(phi) * Math.sin(theta);
    const z = r * Math.cos(phi);
    positions[i * 3]     = x;
    positions[i * 3 + 1] = y;
    positions[i * 3 + 2] = z;
    nodeData.push({ ox: x, oy: y, oz: z, speed: rand(0.3, 1.2), phase: rand(0, Math.PI * 2) });
  }

  const geo = new THREE.BufferGeometry();
  geo.setAttribute('position', new THREE.BufferAttribute(positions, 3));
  const mat = new THREE.PointsMaterial({ size: 2.2, color: 0x00e5ff, transparent: true, opacity: 0.75, sizeAttenuation: true });
  const points = new THREE.Points(geo, mat);
  scene.add(points);

  const lineMat   = new THREE.LineBasicMaterial({ color: 0x00e5ff, transparent: true, opacity: 0.06 });
  const lineGroup = new THREE.Group();
  scene.add(lineGroup);

  const CONNECT_DIST = 70;
  for (let i = 0; i < NODE_COUNT; i++) {
    for (let j = i + 1; j < NODE_COUNT; j++) {
      const dx = nodeData[i].ox - nodeData[j].ox;
      const dy = nodeData[i].oy - nodeData[j].oy;
      const dz = nodeData[i].oz - nodeData[j].oz;
      if (Math.sqrt(dx*dx + dy*dy + dz*dz) < CONNECT_DIST) {
        const lg = new THREE.BufferGeometry().setFromPoints([
          new THREE.Vector3(nodeData[i].ox, nodeData[i].oy, nodeData[i].oz),
          new THREE.Vector3(nodeData[j].ox, nodeData[j].oy, nodeData[j].oz),
        ]);
        lineGroup.add(new THREE.Line(lg, lineMat));
      }
    }
  }

  const mouse = { x: 0, y: 0 };
  document.addEventListener('mousemove', e => {
    mouse.x = (e.clientX / window.innerWidth  - 0.5) * 2;
    mouse.y = (e.clientY / window.innerHeight - 0.5) * 2;
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
  function animate() {
    requestAnimationFrame(animate);
    t += 0.008;
    const pos = geo.attributes.position;
    for (let i = 0; i < NODE_COUNT; i++) {
      const nd   = nodeData[i];
      const wave = 1 + 0.04 * Math.sin(t * nd.speed + nd.phase);
      pos.setXYZ(i, nd.ox * wave, nd.oy * wave, nd.oz * wave);
    }
    pos.needsUpdate = true;
    points.rotation.y = t * 0.06 + mouse.x * 0.15;
    points.rotation.x = mouse.y * 0.08;
    lineGroup.rotation.y = points.rotation.y;
    lineGroup.rotation.x = points.rotation.x;
    renderer.render(scene, camera);
  }
  animate();
})();

/* ────────────────────────────────────────────────────────────────────────── */
/*  2. ABOUT BG — Torus Knot Wireframe                                        */
/* ────────────────────────────────────────────────────────────────────────── */
(function initAboutBg() {
  const canvas   = document.getElementById('about-canvas');
  const renderer = new THREE.WebGLRenderer({ canvas, antialias: true, alpha: true });
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
  renderer.setClearColor(0x000000, 0);

  const scene  = new THREE.Scene();
  const camera = new THREE.PerspectiveCamera(60, 1, 0.1, 2000);
  camera.position.z = 400;

  const g = new THREE.TorusKnotGeometry(120, 36, 200, 20);
  const m = new THREE.MeshBasicMaterial({ color: 0x00e5ff, wireframe: true, transparent: true, opacity: 0.07 });
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
    t += 0.005;
    torus.rotation.x = t * 0.3;
    torus.rotation.y = t * 0.2;
    renderer.render(scene, camera);
  }
  animate();
})();

/* ────────────────────────────────────────────────────────────────────────── */
/*  3. BRAIN CARD — Layered Wireframe Icosahedra                              */
/* ────────────────────────────────────────────────────────────────────────── */
(function initBrain() {
  const canvas   = document.getElementById('brain-canvas');
  const renderer = new THREE.WebGLRenderer({ canvas, antialias: true, alpha: true });
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
  renderer.setClearColor(0x000000, 0);

  const scene  = new THREE.Scene();
  const camera = new THREE.PerspectiveCamera(55, 1, 0.1, 1000);
  camera.position.z = 3.5;

  function addShell(radius, detail, color, opacity) {
    const g = new THREE.IcosahedronGeometry(radius, detail);
    const m = new THREE.MeshBasicMaterial({ color, wireframe: true, transparent: true, opacity });
    const mesh = new THREE.Mesh(g, m);
    scene.add(mesh);
    return mesh;
  }

  const outer = addShell(1.3,  3, 0x00e5ff, 0.12);
  const mid   = addShell(1.05, 3, 0x7c3aed, 0.18);
  const inner = addShell(0.75, 2, 0x00e5ff, 0.28);
  const core  = addShell(0.38, 1, 0xe040fb, 0.5);

  const nodePts = [];
  for (let i = 0; i < 200; i++) {
    const phi   = Math.acos(1 - 2 * Math.random());
    const theta = Math.random() * Math.PI * 2;
    const r = rand(0.7, 1.35);
    nodePts.push(new THREE.Vector3(
      r * Math.sin(phi) * Math.cos(theta),
      r * Math.sin(phi) * Math.sin(theta),
      r * Math.cos(phi)
    ));
  }
  const ptGeo = new THREE.BufferGeometry().setFromPoints(nodePts);
  const ptMat = new THREE.PointsMaterial({ size: 0.035, color: 0x00e5ff, transparent: true, opacity: 0.9 });
  const pts   = new THREE.Points(ptGeo, ptMat);
  scene.add(pts);

  const ringGeo = new THREE.RingGeometry(1.0, 1.05, 64);
  const ringMat = new THREE.MeshBasicMaterial({ color: 0x00e5ff, transparent: true, opacity: 0.3, side: THREE.DoubleSide });
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
    t += 0.012;
    outer.rotation.y = t * 0.18;
    outer.rotation.x = Math.sin(t * 0.22) * 0.3;
    mid.rotation.y   = -t * 0.26;
    mid.rotation.x   = Math.cos(t * 0.2) * 0.25;
    inner.rotation.y = t * 0.38;
    inner.rotation.z = t * 0.15;
    core.rotation.y  = -t * 0.5;
    pts.rotation.y   = t * 0.2;
    const pulse = 0.9 + 0.15 * Math.sin(t * 2.2);
    ring.scale.set(pulse, pulse, 1);
    ringMat.opacity  = 0.15 + 0.15 * Math.sin(t * 2.2);
    ring.rotation.x  = t * 0.3;
    ring.rotation.z  = t * 0.15;
    renderer.render(scene, camera);
  }
  animate();
})();

/* ────────────────────────────────────────────────────────────────────────── */
/*  4. RESEARCH — Flowing Particle Field                                       */
/* ────────────────────────────────────────────────────────────────────────── */
(function initResearch() {
  const canvas   = document.getElementById('research-canvas');
  const renderer = new THREE.WebGLRenderer({ canvas, antialias: true, alpha: true });
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
  renderer.setClearColor(0x000000, 0);

  const scene  = new THREE.Scene();
  const camera = new THREE.PerspectiveCamera(70, 1, 0.1, 2000);
  camera.position.z = 300;

  const COUNT = 600;
  const positions  = new Float32Array(COUNT * 3);
  const velocities = [];

  for (let i = 0; i < COUNT; i++) {
    positions[i*3]   = rand(-300, 300);
    positions[i*3+1] = rand(-300, 300);
    positions[i*3+2] = rand(-200, 200);
    velocities.push({ vx: rand(-0.4, 0.4), vy: rand(-0.4, 0.4), vz: rand(-0.2, 0.2) });
  }

  const geo = new THREE.BufferGeometry();
  geo.setAttribute('position', new THREE.BufferAttribute(positions, 3));
  const mat = new THREE.PointsMaterial({ size: 1.8, color: 0x7c3aed, transparent: true, opacity: 0.65 });
  scene.add(new THREE.Points(geo, mat));

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
    for (let i = 0; i < COUNT; i++) {
      pos.array[i*3]   += velocities[i].vx;
      pos.array[i*3+1] += velocities[i].vy;
      pos.array[i*3+2] += velocities[i].vz;
      if (pos.array[i*3]   >  300) pos.array[i*3]   = -300;
      if (pos.array[i*3]   < -300) pos.array[i*3]   =  300;
      if (pos.array[i*3+1] >  300) pos.array[i*3+1] = -300;
      if (pos.array[i*3+1] < -300) pos.array[i*3+1] =  300;
      if (pos.array[i*3+2] >  200) pos.array[i*3+2] = -200;
      if (pos.array[i*3+2] < -200) pos.array[i*3+2] =  200;
    }
    pos.needsUpdate = true;
    renderer.render(scene, camera);
  }
  animate();
})();

/* ────────────────────────────────────────────────────────────────────────── */
/*  5. CONTACT — Perspective Grid Plane with Floating Orbs                    */
/* ────────────────────────────────────────────────────────────────────────── */
(function initContact() {
  const canvas   = document.getElementById('contact-canvas');
  const renderer = new THREE.WebGLRenderer({ canvas, antialias: true, alpha: true });
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
  renderer.setClearColor(0x000000, 0);

  const scene  = new THREE.Scene();
  const camera = new THREE.PerspectiveCamera(50, 1, 0.1, 2000);
  camera.position.set(0, 180, 300);
  camera.lookAt(0, 0, 0);

  const GRID = 30, STEP = 30, HALF = (GRID * STEP) / 2;

  for (let i = 0; i <= GRID; i++) {
    const x = i * STEP - HALF;
    const c = i % 5 === 0 ? 0x00e5ff : 0x1a2540;
    const op = i % 5 === 0 ? 0.3 : 0.12;
    const g = new THREE.BufferGeometry().setFromPoints([
      new THREE.Vector3(x, 0, -HALF), new THREE.Vector3(x, 0, HALF),
    ]);
    scene.add(new THREE.Line(g, new THREE.LineBasicMaterial({ color: c, transparent: true, opacity: op })));
  }
  for (let j = 0; j <= GRID; j++) {
    const z = j * STEP - HALF;
    const c = j % 5 === 0 ? 0x7c3aed : 0x1a2540;
    const op = j % 5 === 0 ? 0.3 : 0.12;
    const g = new THREE.BufferGeometry().setFromPoints([
      new THREE.Vector3(-HALF, 0, z), new THREE.Vector3(HALF, 0, z),
    ]);
    scene.add(new THREE.Line(g, new THREE.LineBasicMaterial({ color: c, transparent: true, opacity: op })));
  }

  for (let k = 0; k < 10; k++) {
    const g    = new THREE.SphereGeometry(rand(2, 5), 8, 8);
    const m    = new THREE.MeshBasicMaterial({ color: k % 2 === 0 ? 0x00e5ff : 0x7c3aed, transparent: true, opacity: 0.6 });
    const mesh = new THREE.Mesh(g, m);
    mesh.position.set(rand(-HALF, HALF), rand(5, 40), rand(-HALF, HALF));
    mesh.userData = { oy: mesh.position.y, speed: rand(0.5, 1.5), phase: rand(0, Math.PI * 2) };
    scene.add(mesh);
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
    t += 0.012;
    scene.children.forEach(obj => {
      if (obj.userData.speed) {
        obj.position.y = obj.userData.oy + 8 * Math.sin(t * obj.userData.speed + obj.userData.phase);
      }
    });
    camera.position.x = Math.sin(t * 0.08) * 80;
    camera.lookAt(0, 0, 0);
    renderer.render(scene, camera);
  }
  animate();
})();

/* ────────────────────────────────────────────────────────────────────────── */
/*  6. Navbar scroll effect                                                    */
/* ────────────────────────────────────────────────────────────────────────── */
const navbar = document.getElementById('navbar');
window.addEventListener('scroll', () => {
  navbar.classList.toggle('scrolled', window.scrollY > 40);
}, { passive: true });

/* ────────────────────────────────────────────────────────────────────────── */
/*  7. Animated stat counters                                                  */
/* ────────────────────────────────────────────────────────────────────────── */
function animateCounter(el, target, duration = 1800) {
  const start = performance.now();
  function tick(now) {
    const progress = Math.min((now - start) / duration, 1);
    const ease = 1 - Math.pow(1 - progress, 3);
    el.textContent = Math.round(lerp(0, target, ease));
    if (progress < 1) requestAnimationFrame(tick);
  }
  requestAnimationFrame(tick);
}

const heroObserver = new IntersectionObserver(entries => {
  entries.forEach(entry => {
    if (entry.isIntersecting) {
      entry.target.querySelectorAll('.stat-number').forEach(el => {
        animateCounter(el, +el.dataset.target);
      });
      heroObserver.unobserve(entry.target);
    }
  });
}, { threshold: 0.3 });

const heroStats = document.querySelector('.hero-stats');
if (heroStats) heroObserver.observe(heroStats);

/* ────────────────────────────────────────────────────────────────────────── */
/*  8. Reveal on scroll                                                        */
/* ────────────────────────────────────────────────────────────────────────── */
['.service-card', '.research-card', '.testimonial-card',
 '.metric-item', '.about-text', '.about-visual', '.contact-text', '.contact-form'
].forEach(selector => {
  document.querySelectorAll(selector).forEach((el, i) => {
    el.classList.add('reveal');
    if (i % 3 === 1) el.classList.add('reveal-delay-1');
    if (i % 3 === 2) el.classList.add('reveal-delay-2');
  });
});

const revealObserver = new IntersectionObserver(entries => {
  entries.forEach(entry => {
    if (entry.isIntersecting) {
      entry.target.classList.add('visible');
      revealObserver.unobserve(entry.target);
    }
  });
}, { threshold: 0.12 });

document.querySelectorAll('.reveal').forEach(el => revealObserver.observe(el));

/* ────────────────────────────────────────────────────────────────────────── */
/*  9. Mobile hamburger                                                        */
/* ────────────────────────────────────────────────────────────────────────── */
document.getElementById('hamburger').addEventListener('click', () => {
  const navLinks = document.querySelector('.nav-links');
  const open = navLinks.style.display === 'flex';
  Object.assign(navLinks.style, {
    display:       open ? 'none' : 'flex',
    flexDirection: 'column',
    position:      'absolute',
    top:           '70px',
    left:          '0',
    right:         '0',
    background:    'rgba(5,8,16,0.97)',
    padding:       '1rem 2rem',
    borderBottom:  '1px solid rgba(255,255,255,0.07)',
  });
});

/* ────────────────────────────────────────────────────────────────────────── */
/*  10. Contact form (demo)                                                    */
/* ────────────────────────────────────────────────────────────────────────── */
document.getElementById('contact-form').addEventListener('submit', function(e) {
  e.preventDefault();
  const btn = this.querySelector('button[type="submit"]');
  btn.textContent = 'Sending…';
  btn.disabled = true;
  setTimeout(() => {
    btn.textContent = 'Message sent! We\'ll be in touch.';
    btn.style.background = 'linear-gradient(135deg,#059669,#10b981)';
  }, 1400);
});
