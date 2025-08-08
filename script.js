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

// Desktop Call Panel Toggle
function setupCallPanel(){
  const cta = document.getElementById('nav-call-cta');
  const panel = document.getElementById('nav-call-panel');
  if (!cta || !panel) return;

  const isDesktop = () => window.matchMedia('(min-width: 880px)').matches;

  const positionPanel = () => {
    const rect = cta.getBoundingClientRect();
    const containerRect = document.querySelector('.nav-container').getBoundingClientRect();
    const panelRect = panel.getBoundingClientRect();

    const spaceRight = document.documentElement.clientWidth - rect.right - 12;
    const showBelow = spaceRight < panelRect.width;

    if (showBelow){
      panel.classList.remove('pos-right');
      panel.classList.add('pos-below');
      const offsetTop = rect.bottom - containerRect.top + 8; // unter dem Button
      const offsetLeft = rect.left - containerRect.left;     // linksbündig zum Button
      panel.style.top = `${offsetTop}px`;
      panel.style.left = `${offsetLeft}px`;
    } else {
      panel.classList.remove('pos-below');
      panel.classList.add('pos-right');
      const offsetTop = rect.top + rect.height/2 - containerRect.top; // mittig vertikal
      let offsetLeft = rect.right - containerRect.left + 12; // rechts neben CTA
      const containerWidth = document.documentElement.clientWidth;
      const maxLeft = containerWidth - panelRect.width - 12 - containerRect.left;
      if (offsetLeft > maxLeft) offsetLeft = Math.max(0, maxLeft);
      panel.style.top = `${offsetTop}px`;
      panel.style.left = `${offsetLeft}px`;
    }
  };

  const togglePanel = (e) => {
    if (isDesktop()){
      e.preventDefault();
      positionPanel();
      panel.classList.toggle('is-visible');
      if (panel.classList.contains('is-visible')){
        const num = panel.querySelector('.call-number');
        if (num) num.tabIndex = -1, num.focus?.();
      }
    }
  };

  cta.addEventListener('click', togglePanel);
  window.addEventListener('resize', () => { if (panel.classList.contains('is-visible')) positionPanel(); });
  window.addEventListener('scroll', () => { if (panel.classList.contains('is-visible')) positionPanel(); }, { passive: true });

  // Hide panel on outside click
  document.addEventListener('click', (e) => {
    if (!panel.classList.contains('is-visible')) return;
    if (e.target === cta || cta.contains(e.target)) return;
    if (!panel.contains(e.target)) panel.classList.remove('is-visible');
  });

  // Copy to clipboard
  const copyBtn = document.getElementById('copy-call');
  if (copyBtn){
    copyBtn.addEventListener('click', async () => {
      try { await navigator.clipboard.writeText(document.querySelector('.call-number').textContent.trim());
        copyBtn.textContent = 'Kopiert!'; setTimeout(() => copyBtn.textContent = 'Kopieren', 1200);
      } catch { copyBtn.textContent = 'Fehler'; setTimeout(() => copyBtn.textContent = 'Kopieren', 1200); }
    });
  }
}

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', setupCallPanel);
} else {
  setupCallPanel();
}

// Simple i18n toggle (DE/EN)
const I18N = {
  de: {
    brandTag: 'Zuhause in guten Händen',
    nav: ['Leistungen','Über uns','Kontakt','Jetzt anrufen'],
    heroTitle: 'Ambulante Pflege mit Herz',
    heroLead: 'Wir unterstützen Menschen zuverlässig und empathisch im Alltag – professionell, respektvoll und nah am Menschen.',
    heroCTAContact: 'Kontakt aufnehmen',
    heroCTAService: 'Leistungen ansehen',
    heroBullets: [
      'Behandlungspflege nach ärztlicher Verordnung',
      'Grundpflege und Betreuung zu Hause',
      'Hauswirtschaftliche Unterstützung'
    ],
    secServices: 'Unsere Leistungen',
    secServicesSub: 'Individuell, wertschätzend und auf Ihre Situation abgestimmt.',
    cards: {
      treat: {title:'Behandlungspflege', sub:'Medikamente, Wundversorgung, Kontrollen', back:['Medikamentengabe & Injektionen','Verbandswechsel & Wundmanagement','Blutzucker- & Blutdruckkontrollen']},
      basic: {title:'Grundpflege', sub:'Körperpflege, Mobilisation, An-/Auskleiden', back:['Körperpflege & Hygiene','Mobilisation & Lagerung','Unterstützung beim An-/Auskleiden']},
      care: {title:'Betreuung', sub:'Alltag, Demenz, Entlastung Angehörige', back:['Begleitung im Alltag','Demenzbetreuung & Aktivierung','Entlastungsleistungen']},
      house: {title:'Hauswirtschaft', sub:'Einkauf, Reinigung, Wäsche', back:['Einkaufen & Botengänge','Reinigung & Aufräumen','Wäsche & Haushaltstätigkeiten']},
      consult: {title:'Beratung', sub:'Pflegeberatung & Organisation', back:['Pflegegrade & Anträge','Leistungen der Pflegekasse','Hilfsmittel & Versorgungsplanung']}
    },
    aboutTitle: 'Über MiCare', aboutP: 'MiCare steht für professionelle ambulante Pflege, die den Menschen in den Mittelpunkt stellt. Unser Team arbeitet auf Augenhöhe, nimmt sich Zeit und wahrt Ihre Selbstbestimmung – in Ihrem Zuhause.',
    aboutChecklist: ['Verlässlich erreichbar und schnell vor Ort','Qualifiziertes, herzliches Team','Transparente Planung und Dokumentation'],
    stats: ['Erreichbarkeit','Herz & Respekt','für Sie da'],
    contactTitle: 'Kontakt',
    form: {
      name: 'Ihr Name', phone: 'Telefon', email: 'E-Mail', message: 'Ihre Nachricht',
      phName: 'Max Mustermann', phPhone: 'z. B. 0151 23456789', phEmail: 'name@example.com', phMessage: 'Wie können wir helfen?',
      send: 'Nachricht senden', note: 'Mit dem Absenden stimmen Sie der Verarbeitung Ihrer Daten zum Zwecke der Kontaktaufnahme zu.'
    },
    direct: 'Direkt erreichen', addressTitle: 'Adresse', address: 'Musterstraße 1\n12345 Musterstadt', openTitle: 'Öffnungszeiten', open: 'Mo–Fr 08:00–17:00 Uhr\nNotfall: 24/7',
    whatsapp: 'WhatsApp', footerImp: 'Impressum', footerPriv: 'Datenschutz', copy: 'Kopieren', copied: 'Kopiert!'
  },
  en: {
    brandTag: 'At home in good hands',
    nav: ['Services','About us','Contact','Call now'],
    heroTitle: 'Outpatient care with heart',
    heroLead: 'We support people reliably and empathetically in everyday life – professional, respectful and close to people.',
    heroCTAContact: 'Get in touch',
    heroCTAService: 'See services',
    heroBullets: [
      'Treatment care by medical prescription',
      'Basic care and support at home',
      'Household assistance'
    ],
    secServices: 'Our Services',
    secServicesSub: 'Individual, respectful and tailored to your situation.',
    cards: {
      treat: {title:'Treatment care', sub:'Medication, wound care, checks', back:['Medication & injections','Dressing change & wound management','Blood sugar & pressure checks']},
      basic: {title:'Basic care', sub:'Personal care, mobility, dressing', back:['Personal hygiene','Mobilisation & positioning','Help with dressing/undressing']},
      care: {title:'Companionship', sub:'Daily life, dementia, family relief', back:['Everyday companionship','Dementia care & activation','Relief services']},
      house: {title:'Housekeeping', sub:'Shopping, cleaning, laundry', back:['Groceries & errands','Cleaning & tidying','Laundry & household tasks']},
      consult: {title:'Consulting', sub:'Care advice & organisation', back:['Care levels & applications','Benefits from nursing fund','Aids & care planning']}
    },
    aboutTitle: 'About MiCare', aboutP: 'MiCare stands for professional home care that puts people at the center. We work at eye level, take time and respect your autonomy – in your home.',
    aboutChecklist: ['Reliably reachable and quick on site','Qualified, caring team','Transparent planning and documentation'],
    stats: ['Availability','Heart & respect','here for you'],
    contactTitle: 'Contact',
    form: {
      name: 'Your name', phone: 'Phone', email: 'Email', message: 'Your message',
      phName: 'John Doe', phPhone: 'e.g. +49 151 23456789', phEmail: 'name@example.com', phMessage: 'How can we help?',
      send: 'Send message', note: 'By submitting you agree that we process your data for contacting you.'
    },
    direct: 'Reach us directly', addressTitle: 'Address', address: 'Example Street 1\n12345 Sample City', openTitle: 'Opening hours', open: 'Mon–Fri 08:00–17:00\nEmergency: 24/7',
    whatsapp: 'WhatsApp', footerImp: 'Imprint', footerPriv: 'Privacy', copy: 'Copy', copied: 'Copied!'
  }
};

function setText(el, text){ if (el) el.textContent = text; }
function setMultiline(el, text){ if (el) el.innerHTML = text.replace(/\n/g,'<br />'); }

function applyI18n(lang){
  const t = I18N[lang] || I18N.de;
  // Header brand tag + nav links
  setText(document.querySelector('.brand-tag'), t.brandTag);
  const navLinks = document.querySelectorAll('#site-nav a');
  if (navLinks.length >= 4){
    setText(navLinks[0], t.nav[0]);
    setText(navLinks[1], t.nav[1]);
    setText(navLinks[2], t.nav[2]);
    setText(navLinks[3], t.nav[3]);
  }

  // Hero
  setText(document.querySelector('.hero-content h1'), t.heroTitle);
  setText(document.querySelector('.hero-content .lead'), t.heroLead);
  const heroBtns = document.querySelectorAll('.hero-actions .btn');
  if (heroBtns.length >= 2){ setText(heroBtns[0], t.heroCTAContact); setText(heroBtns[1], t.heroCTAService); }
  const bullets = document.querySelectorAll('.hero-bullets li');
  bullets.forEach((li,i)=> setText(li, t.heroBullets[i] || li.textContent));

  // Services section
  setText(document.querySelector('#leistungen .section-title'), t.secServices);
  setText(document.querySelector('#leistungen .section-subtitle'), t.secServicesSub);
  const cardsFront = document.querySelectorAll('#leistungen .flip-card .flip-front');
  const cardsBack = document.querySelectorAll('#leistungen .flip-card .flip-back');
  const order = ['treat','basic','care','house','consult'];
  order.forEach((key, idx) => {
    const front = cardsFront[idx]; const back = cardsBack[idx];
    if (front){
      setText(front.querySelector('h3'), t.cards[key].title);
      setText(front.querySelector('p'), t.cards[key].sub);
    }
    if (back){
      setText(back.querySelector('h3'), t.cards[key].title);
      const items = back.querySelectorAll('li');
      items.forEach((li,i)=> setText(li, t.cards[key].back[i] || li.textContent));
    }
  });

  // About
  setText(document.querySelector('#ueber-uns .section-title'), t.aboutTitle);
  setText(document.querySelector('#ueber-uns .about-text p'), t.aboutP);
  const aboutItems = document.querySelectorAll('#ueber-uns .checklist li');
  aboutItems.forEach((li,i)=> setText(li, t.aboutChecklist[i] || li.textContent));

  // Stats
  const statLabels = document.querySelectorAll('.stats .stat span:last-child');
  statLabels.forEach((el,i)=> setText(el, t.stats[i] || el.textContent));

  // Contact section
  setText(document.querySelector('#kontakt .section-title'), t.contactTitle);
  // Labels
  const labels = document.querySelectorAll('#contact-form label');
  const labelKeys = [t.form.name, t.form.phone, t.form.email, t.form.message];
  labels.forEach((lab,i)=> setText(lab, labelKeys[i] || lab.textContent));
  // Placeholders
  const nameI = document.getElementById('name'); if (nameI) nameI.setAttribute('placeholder', t.form.phName);
  const phoneI = document.getElementById('phone'); if (phoneI) phoneI.setAttribute('placeholder', t.form.phPhone);
  const emailI = document.getElementById('email'); if (emailI) emailI.setAttribute('placeholder', t.form.phEmail);
  const msgI = document.getElementById('message'); if (msgI) msgI.setAttribute('placeholder', t.form.phMessage);
  setText(document.querySelector('#contact-form button[type="submit"]'), t.form.send);
  setText(document.querySelector('#contact-form .btn-whatsapp'), t.whatsapp);
  setText(document.getElementById('copy-call'), t.copy);
  setText(document.querySelector('#contact-form .form-note'), t.form.note);

  // Contact info blocks
  const infoHeads = document.querySelectorAll('.contact-info .info-block h3');
  if (infoHeads.length >= 3){
    setText(infoHeads[0], t.direct);
    setText(infoHeads[1], t.addressTitle);
    setText(infoHeads[2], t.openTitle);
  }
  const infoParas = document.querySelectorAll('.contact-info .info-block p');
  if (infoParas.length >= 3){
    // 0: phone+mail bleibt gleich, 1: address, 2: opening
    setMultiline(infoParas[1], t.address);
    setMultiline(infoParas[2], t.open);
  }

  // Footer
  const footerLinks = document.querySelectorAll('.site-footer .footer-nav a');
  if (footerLinks.length >= 2){
    setText(footerLinks[0], t.footerImp);
    setText(footerLinks[1], t.footerPriv);
  }
}

function setupLangToggle(){
  const btn = document.getElementById('lang-toggle');
  if (!btn) return;
  let current = localStorage.getItem('micare_lang') || 'de';
  const setBtn = () => btn.textContent = current === 'de' ? '🇩🇪' : '🇬🇧';
  setBtn();
  applyI18n(current);

  btn.addEventListener('click', () => {
    current = current === 'de' ? 'en' : 'de';
    localStorage.setItem('micare_lang', current);
    setBtn();
    applyI18n(current);
  });
}

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', setupLangToggle);
} else {
  setupLangToggle();
} 