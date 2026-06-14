/* ─────────────────────────────────────────────────────────────────────────
   Neurovale — UI Logic
   Skill: ui-ux-pro-max
     · transform/opacity animations only
     · prefers-reduced-motion respected
     · 150-300ms micro-interactions
     · No emoji icons (SVG only)
───────────────────────────────────────────────────────────────────────── */

const REDUCED = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

/* ────────────────────────────────────────────────────────────────────────
   1. Hero — gentle warm organic particles (Canvas 2D, lightweight)
      Simulates soft floating elements over the warm gradient background
──────────────────────────────────────────────────────────────────────── */
(function initHeroParticles() {
  const canvas = document.getElementById('hero-canvas');
  if (!canvas || REDUCED) return;

  const ctx = canvas.getContext('2d');
  const particles = [];

  /* Warm brand colours for particles */
  const COLOURS = [
    'rgba(244,160,184,',  /* rose */
    'rgba(232,185,106,',  /* gold */
    'rgba(194,39,90,',    /* brand */
    'rgba(255,220,200,',  /* warm white */
  ];

  function resize() {
    canvas.width  = canvas.offsetWidth;
    canvas.height = canvas.offsetHeight;
  }

  function spawn() {
    return {
      x:     Math.random() * canvas.width,
      y:     canvas.height + Math.random() * 40,
      r:     Math.random() * 2.5 + 0.8,
      vx:    (Math.random() - 0.5) * 0.35,
      vy:    -(Math.random() * 0.6 + 0.25),
      alpha: Math.random() * 0.45 + 0.1,
      col:   COLOURS[Math.floor(Math.random() * COLOURS.length)],
      life:  0,
      maxL:  Math.random() * 400 + 300,
    };
  }

  resize();
  window.addEventListener('resize', resize);

  const COUNT = 90;
  for (let i = 0; i < COUNT; i++) {
    const p = spawn();
    p.y    = Math.random() * canvas.height;  /* seed vertically */
    p.life = Math.random() * p.maxL;
    particles.push(p);
  }

  function animate() {
    requestAnimationFrame(animate);
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    for (let i = 0; i < particles.length; i++) {
      const p = particles[i];
      p.x    += p.vx;
      p.y    += p.vy;
      p.life += 1;

      /* Fade in / out */
      const t  = p.life / p.maxL;
      const a  = t < 0.15 ? t / 0.15 : t > 0.8 ? (1 - t) / 0.2 : 1;
      const op = p.alpha * a;

      ctx.beginPath();
      ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2);
      ctx.fillStyle = p.col + op + ')';
      ctx.fill();

      if (p.life >= p.maxL || p.y < -10) {
        particles[i] = spawn();
      }
    }
  }
  animate();
})();

/* ────────────────────────────────────────────────────────────────────────
   2. Navbar — scroll state
──────────────────────────────────────────────────────────────────────── */
const navbar = document.getElementById('navbar');
window.addEventListener('scroll', () => {
  navbar.classList.toggle('scrolled', window.scrollY > 60);
}, { passive: true });

/* ────────────────────────────────────────────────────────────────────────
   3. Mobile hamburger
──────────────────────────────────────────────────────────────────────── */
const hamburger  = document.getElementById('hamburger');
const mobileMenu = document.getElementById('mobile-menu');
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

document.querySelectorAll('.mobile-link').forEach(el => {
  el.addEventListener('click', closeMenu);
});

/* Close on outside click */
mobileMenu.addEventListener('click', e => {
  if (e.target === mobileMenu) closeMenu();
});

/* Close on Escape */
document.addEventListener('keydown', e => {
  if (e.key === 'Escape' && !mobileMenu.hidden) closeMenu();
});

/* ────────────────────────────────────────────────────────────────────────
   4. Scroll reveal — IntersectionObserver
──────────────────────────────────────────────────────────────────────── */
const revealObserver = new IntersectionObserver((entries, obs) => {
  entries.forEach(entry => {
    if (!entry.isIntersecting) return;
    entry.target.classList.add('visible');
    obs.unobserve(entry.target);
  });
}, { threshold: 0.12 });

document.querySelectorAll('.reveal').forEach(el => revealObserver.observe(el));

/* ────────────────────────────────────────────────────────────────────────
   5. Contact form — demo submit
──────────────────────────────────────────────────────────────────────── */
const form = document.getElementById('contact-form');
if (form) {
  form.addEventListener('submit', function(e) {
    e.preventDefault();
    const btn = this.querySelector('button[type="submit"]');
    const orig = btn.innerHTML;

    btn.innerHTML = 'Sending…';
    btn.disabled = true;
    btn.setAttribute('aria-busy', 'true');

    setTimeout(() => {
      btn.innerHTML = 'Referral submitted — we\'ll be in touch!';
      btn.style.background = '#9B1A3F';
      btn.removeAttribute('aria-busy');
    }, 1400);
  });
}
