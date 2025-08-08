// Mobile Navigation
const navToggle = document.querySelector('.nav-toggle');
const siteNav = document.getElementById('site-nav');
if (navToggle && siteNav) {
  navToggle.addEventListener('click', () => {
    const isOpen = siteNav.classList.toggle('open');
    navToggle.setAttribute('aria-expanded', String(isOpen));
  });

  // Close menu on link click (mobile)
  siteNav.querySelectorAll('a').forEach(a => {
    a.addEventListener('click', () => siteNav.classList.remove('open'));
  });
}

// Lenis Smooth Scrolling
let lenis = null;
window.addEventListener('load', () => {
  if (window.Lenis) {
    lenis = new Lenis({
      duration: 1.15,
      easing: t => 1 - Math.pow(1 - t, 3),
      smoothWheel: true,
      smoothTouch: true,      // aktiv für Mobile
      touchMultiplier: 2      // etwas mehr Trägheit
    });

    function raf(time) {
      lenis.raf(time);
      requestAnimationFrame(raf);
    }
    requestAnimationFrame(raf);
  }
});

// Smooth scroll for same-page links using Lenis if available
for (const link of document.querySelectorAll('a[href^="#"]')) {
  link.addEventListener('click', evt => {
    const targetId = link.getAttribute('href');
    if (!targetId || targetId === '#' || targetId.length < 2) return;
    const target = document.querySelector(targetId);
    if (!target) return;

    evt.preventDefault();
    const isTouch = window.matchMedia('(hover: none)').matches;
    const isMobileNavOpen = isTouch && siteNav && siteNav.classList.contains('open');

    const scrollToTarget = () => {
      const header = document.querySelector('.site-header');
      const offset = header ? -(header.getBoundingClientRect().height + 6) : -10;
      const duration = isTouch ? 0.9 : 1.15;
      if (lenis) {
        lenis.scrollTo(target, { offset, duration });
      } else {
        target.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }
      // Hash in URL aktualisieren (ohne Sprung)
      if (history.replaceState) history.replaceState(null, '', targetId);
    };

    if (isMobileNavOpen) {
      // Menü schließen und zwei RAFs warten, damit das Layout stabil ist
      siteNav.classList.remove('open');
      requestAnimationFrame(() => requestAnimationFrame(scrollToTarget));
    } else {
      scrollToTarget();
    }
  });
}

// Reveal on scroll
const revealEls = document.querySelectorAll('.reveal');
const io = new IntersectionObserver(entries => {
  for (const entry of entries) {
    if (entry.isIntersecting) {
      entry.target.classList.add('reveal-visible');
      io.unobserve(entry.target);
    }
  }
}, { threshold: 0.15 });
revealEls.forEach(el => io.observe(el));

// Parallax for hero background
const heroBgMedia = document.querySelector('.hero-bg-media');
function updateParallax(scrollY){
  // Hero
  if (heroBgMedia) {
    const isSmall = window.matchMedia('(max-width: 425px)').matches;
    const isShort = window.matchMedia('(max-height: 640px)').matches;
    const factor = isSmall ? 0.28 : 0.4; // näher an Tablet-Feeling
    const y = Math.round(scrollY * factor);
    const scale = isSmall && !isShort ? 1.02 : 1.05;
    heroBgMedia.style.transform = `translate3d(0, ${y}px, 0) scale(${scale})`;
  }

  // Generic parallax elements
  document.querySelectorAll('[data-parallax]')
    .forEach(el => {
      const speed = Number(el.getAttribute('data-parallax')) || 0.2;
      const rect = el.getBoundingClientRect();
      const elementTop = rect.top + (lenis ? lenis.scroll : window.scrollY);
      const offsetY = (scrollY - elementTop) * speed + (Number(el.getAttribute('data-parallax-offset')) || 0);
      el.style.transform = `translate3d(0, ${offsetY}px, 0)`;
    });
}

if (lenis) {
  lenis.on('scroll', ({ scroll }) => updateParallax(scroll));
} else {
  window.addEventListener('scroll', () => updateParallax(window.scrollY), { passive: true });
  updateParallax(window.scrollY);
}

window.addEventListener('resize', () => updateParallax(lenis ? lenis.scroll : window.scrollY));

// Contact form handler (mailto fallback)
const form = document.getElementById('contact-form');
if (form) {
  form.addEventListener('submit', evt => {
    evt.preventDefault();
    const data = new FormData(form);
    const name = String(data.get('name') || '').trim();
    const phone = String(data.get('phone') || '').trim();
    const email = String(data.get('email') || '').trim();
    const message = String(data.get('message') || '').trim();

    if (!name || !phone || !message) {
      alert('Bitte füllen Sie Name, Telefon und Nachricht aus.');
      return;
    }

    const lines = [
      `Name: ${name}`,
      `Telefon: ${phone}`,
      email ? `E-Mail: ${email}` : null,
      '',
      'Nachricht:',
      message
    ].filter(Boolean);

    const subject = encodeURIComponent('Neue Anfrage über die MiCare Webseite');
    const body = encodeURIComponent(lines.join('\n'));
    const mailto = `mailto:kontakt@micare.de?subject=${subject}&body=${body}`;

    window.location.href = mailto;

    form.reset();
  });
}

// Year in footer
const yearEl = document.getElementById('year');
if (yearEl) yearEl.textContent = String(new Date().getFullYear());

// Flip cards touch support
function setupFlipCards(){
  const cards = document.querySelectorAll('.flip-card');
  const isHoverCapable = window.matchMedia('(hover: hover) and (pointer: fine)').matches;
  cards.forEach(card => {
    // Desktop (Hover-fähig): Flip nur per Hover (CSS). Kein Klick-Handler.
    if (!isHoverCapable) {
      const toggle = () => card.classList.toggle('is-flipped');
      // Mobil/Touch: Flip per Pointer-Up, um Doppelauslösung (touch + click) zu vermeiden
      card.addEventListener('pointerup', toggle, { passive: true });
    }
    // Keyboard accessibility (beide Welten)
    card.addEventListener('keydown', (e) => {
      if (e.key === 'Enter' || e.key === ' ') {
        e.preventDefault();
        card.classList.toggle('is-flipped');
      }
    });
  });
}

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', setupFlipCards);
} else {
  setupFlipCards();
}

// Mark visible sections on mobile to show animated underline
function setupActiveSections(){
  const sections = document.querySelectorAll('section.section, section.hero');
  if (!sections.length) return;

  const ioSections = new IntersectionObserver(entries => {
    entries.forEach(entry => {
      const section = entry.target;
      section.classList.toggle('is-active', entry.isIntersecting && entry.intersectionRatio > 0.55);
    });
  }, { threshold: [0.55] });

  sections.forEach(s => ioSections.observe(s));
}

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', setupActiveSections);
} else {
  setupActiveSections();
} 