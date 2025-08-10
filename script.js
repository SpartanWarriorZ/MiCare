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

  // Stats shimmer re-triggers whenever the card crosses a centered band (analog zu Titeln)
  const stats = document.querySelectorAll('.stats .stat');
  if (stats.length){
    const LOCK_MS = 4000;       // Cooldown: ca. 4 Sekunden
    const ANIM_MS = 1250;       // CSS-Animdauer ~1.25s

    const trigger = (el) => {
      const now = Date.now();
      const lockUntil = Number(el.dataset.shimmerLockUntil || '0');
      if (now < lockUntil) return; // noch gesperrt → nicht erneut starten

      // Setze neuen Lock, damit während der Animation + Cooldown kein Neustart erfolgt
      el.dataset.shimmerLockUntil = String(now + LOCK_MS);
      el.dataset.shimmerRunning = '1';

      el.classList.add('reveal-visible');
      // toggle class to (re)start CSS animation zuverlässig
      el.classList.remove('is-center');
      void el.offsetWidth; // reflow
      el.classList.add('is-center');

      // Nach Animationsende Running-Flag entfernen
      setTimeout(() => { delete el.dataset.shimmerRunning; }, ANIM_MS + 100);
    };

    const ioCenter = new IntersectionObserver(entries => {
      entries.forEach(entry => {
        const el = entry.target;
        if (entry.isIntersecting){
          const delayIndex = Number(el.getAttribute('data-stat-index') || '0');
          const start = 120 * delayIndex;
          setTimeout(() => trigger(el), start);
        }
        // Wenn sie das Band verlassen, entferne reveal-visible, damit beim erneuten Eintritt sicher neu animiert wird
        if (!entry.isIntersecting){
          // Animation nicht abbrechen, wenn gerade aktiv
          if (el.dataset.shimmerRunning !== '1'){
            el.classList.remove('reveal-visible');
            el.classList.remove('is-center');
          }
        }
      });
    }, { root: null, rootMargin: "-45% 0% -45% 0%", threshold: 0 });

    stats.forEach((el, idx) => { el.setAttribute('data-stat-index', String(idx)); ioCenter.observe(el); });
  }
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

    // Immer unter dem Button anzeigen
    panel.classList.remove('pos-right');
    panel.classList.add('pos-below');
    const offsetTop = rect.bottom - containerRect.top + 8; // unter dem Button
    let offsetLeft = rect.left - containerRect.left;       // linksbündig zum Button

    // Clamp innerhalb des Viewports
    const viewportW = document.documentElement.clientWidth;
    const maxLeft = viewportW - panelRect.width - 12 - containerRect.left;
    if (offsetLeft > maxLeft) offsetLeft = Math.max(0, maxLeft);

    panel.style.top = `${offsetTop}px`;
    panel.style.left = `${offsetLeft}px`;
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
    booking: {
      cta: 'Pflege buchen',
      title: 'Pflege buchen',
      selectionTitle: 'Ihre Auswahl',
      meta: {
        frequency: 'Häufigkeit',
        start: 'Startdatum',
        times: 'Bevorzugte Zeiten',
        timesPh: 'z. B. morgens, abends',
        notes: 'Notizen',
        name: 'Ihr Name',
        phone: 'Telefon',
        email: 'E-Mail (optional)',
        submit: 'Anfrage senden'
      },
      frequencyOptions: ['Einmalig','Täglich','Mehrmals wöchentlich','Wöchentlich'],
      options: {
        treat: ['Medikamentengabe','Injektionen','Verbandswechsel','Wundmanagement','Blutzucker- & Blutdruckkontrollen'],
        basic: ['Körperpflege & Hygiene','Mobilisation & Lagerung','Unterstützung beim An-/Auskleiden'],
        care: ['Begleitung im Alltag','Demenzbetreuung & Aktivierung','Entlastungsleistungen'],
        house: ['Einkaufen & Botengänge','Reinigung & Aufräumen','Wäsche & Haushaltstätigkeiten','Kochen & Zubereitung'],
        consult: ['Pflegegrade & Anträge','Leistungen der Pflegekasse','Hilfsmittel & Versorgungsplanung']
      }
    },
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
    booking: {
      cta: 'Book care',
      title: 'Book care',
      selectionTitle: 'Your selection',
      meta: {
        frequency: 'Frequency',
        start: 'Start date',
        times: 'Preferred times',
        timesPh: 'e.g. mornings, evenings',
        notes: 'Notes',
        name: 'Your name',
        phone: 'Phone',
        email: 'Email (optional)',
        submit: 'Send request'
      },
      frequencyOptions: ['One-time','Daily','Several times a week','Weekly'],
      options: {
        treat: ['Medication administration','Injections','Dressing change','Wound management','Blood sugar & pressure checks'],
        basic: ['Personal hygiene','Mobilisation & positioning','Help with dressing/undressing'],
        care: ['Everyday companionship','Dementia care & activation','Relief services'],
        house: ['Groceries & errands','Cleaning & tidying','Laundry & household tasks','Cooking & preparation'],
        consult: ['Care levels & applications','Benefits from nursing fund','Aids & care planning']
      }
    },
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

  // Booking CTA label
  const bookingCta = document.getElementById('open-booking');
  if (bookingCta) setText(bookingCta, (t.booking && t.booking.cta) || bookingCta.textContent);

  // Booking modal texts
  const bookingTitle = document.getElementById('booking-title');
  if (bookingTitle && t.booking) setText(bookingTitle, t.booking.title);

  if (t.booking){
    // Selection title
    const selTitle = document.querySelector('.booking-summary h4');
    if (selTitle) setText(selTitle, t.booking.selectionTitle);

    // Frequency select options
    const freq = document.getElementById('bk-frequency');
    if (freq && t.booking.frequencyOptions){
      const values = t.booking.frequencyOptions;
      freq.innerHTML = values.map(v => `<option>${v}</option>`).join('');
    }
    // Labels & placeholders
    setText(document.querySelector('label[for="bk-frequency"]'), t.booking.meta.frequency);
    setText(document.querySelector('label[for="bk-start"]'), t.booking.meta.start);
    setText(document.querySelector('label[for="bk-times"]'), t.booking.meta.times);
    setText(document.querySelector('label[for="bk-notes"]'), t.booking.meta.notes);
    setText(document.querySelector('label[for="bk-name"]'), t.booking.meta.name);
    setText(document.querySelector('label[for="bk-phone"]'), t.booking.meta.phone);
    setText(document.querySelector('label[for="bk-email"]'), t.booking.meta.email);
    const timesI = document.getElementById('bk-times'); if (timesI) timesI.setAttribute('placeholder', t.booking.meta.timesPh);
    const submitI = document.getElementById('bk-submit'); if (submitI) setText(submitI, t.booking.meta.submit);

    // Options within details
    const detailEls = document.querySelectorAll('.booking-options details');
    const groups = ['treat','basic','care','house','consult'];
    detailEls.forEach((d, idx) => {
      // Summary (category title)
      const sum = d.querySelector('summary');
      const cardTitle = t.cards && t.cards[groups[idx]] ? t.cards[groups[idx]].title : null;
      if (sum && cardTitle) setText(sum, cardTitle);

      // Options (checkbox labels)
      const labels = d.querySelectorAll('.option-list li label');
      const translated = (t.booking.options[groups[idx]] || []);
      labels.forEach((lab, i) => {
        if (!translated[i]) return;
        const input = lab.querySelector('input');
        if (!input) return;
        // Rebuild label content: keep input, set text after it
        input.remove();
        lab.textContent = translated[i];
        lab.prepend(document.createTextNode(' '));
        lab.prepend(input);
      });
    });
  }

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
  const btnM = document.getElementById('lang-toggle-mobile');
  if (!btn && !btnM) return;
  let current = localStorage.getItem('micare_lang') || 'de';
  const setBtn = () => {
    const htmlDe = '<span class="flag-icon flag-de" aria-hidden="true"></span>';
    const htmlUk = '<span class="flag-uk" aria-hidden="true"><svg viewBox="0 0 60 36" xmlns="http://www.w3.org/2000/svg"><clipPath id="u"><rect width="60" height="36" rx="3"/></clipPath><g clip-path="url(#u)"><rect width="60" height="36" fill="#012169"/><g stroke="#fff" stroke-width="6"><path d="M0,0 L60,36 M60,0 L0,36"/></g><g stroke="#C8102E" stroke-width="4"><path d="M0,-2 L62,36 M62,0 L-2,36"/></g><g fill="#fff"><rect x="26" width="8" height="36"/><rect y="14" width="60" height="8"/></g><g fill="#C8102E"><rect x="28" width="4" height="36"/><rect y="16" width="60" height="4"/></g></g></svg></span>';
    if (btn) btn.innerHTML = current === 'de' ? htmlDe : htmlUk;
    if (btnM) btnM.innerHTML = current === 'de' ? htmlDe : htmlUk;
  };
  setBtn();
  applyI18n(current);

  function toggle(){
    current = current === 'de' ? 'en' : 'de';
    localStorage.setItem('micare_lang', current);
    setBtn();
    applyI18n(current);
  }
  if (btn) btn.addEventListener('click', toggle);
  if (btnM) btnM.addEventListener('click', toggle);
}

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', setupLangToggle);
} else {
  setupLangToggle();
} 

// Booking modal logic
function setupBooking(){
  const openBtn = document.getElementById('open-booking');
  const modal = document.getElementById('booking-modal');
  if (!openBtn || !modal) return;

  const dialog = modal.querySelector('.modal-dialog');
  const backdrop = modal.querySelector('.modal-backdrop');
  const closeBtn = modal.querySelector('.modal-close');
  const form = document.getElementById('booking-form');
  const selectedList = document.getElementById('booking-selected');
  const submitBtn = document.getElementById('bk-submit');
  // Desktop: kompletter Dialog ist die Scrollfläche
  const scrollArea = dialog;
  let lastScrollY = 0;

  const toggle = (show) => {
    // add closing class for reverse animations
    if (show){
      modal.classList.remove('is-closing');
      modal.classList.add('is-open');
    } else {
      // add closing state while still open so transitions can play
      modal.classList.add('is-closing');
      modal.classList.add('is-open');
      // after transitions, remove open state
      setTimeout(() => { modal.classList.remove('is-open'); modal.classList.remove('is-closing'); }, 320);
    }
    modal.setAttribute('aria-hidden', String(!show));
    document.body.classList.toggle('is-modal-open', show);
    if (show){
      // Scroll lock (Desktop) + Lenis pausieren
      try { lastScrollY = window.scrollY; } catch {}
      document.body.style.position = 'fixed';
      document.body.style.top = `-${lastScrollY}px`;
      document.body.style.width = '100%';
      if (typeof lenis?.stop === 'function') lenis.stop();
      // focus first focusable element
      const first = dialog.querySelector('input, select, textarea, button');
      first && first.focus();
      updateSelected();
    }
    else {
      // Scroll unlock + Lenis fortsetzen
      document.body.classList.remove('is-modal-open');
      document.body.style.position = '';
      document.body.style.top = '';
      document.body.style.width = '';
      if (typeof lenis?.start === 'function') lenis.start();
      if (!isNaN(lastScrollY)) window.scrollTo(0, lastScrollY);
      // Any open popovers (calendar/time) must be closed when modal closes
      try { if (typeof closePopover === 'function') closePopover(); } catch {}
    }
  };

  const updateSelected = () => {
    const checked = [...form.querySelectorAll('input[name="services"]:checked')]
      .map(i => i.value);
    selectedList.innerHTML = checked.map(v => `<li>${v}</li>`).join('');
    submitBtn.disabled = checked.length === 0;
  };

  openBtn.addEventListener('click', () => toggle(true));
  backdrop.addEventListener('click', () => toggle(false));
  if (closeBtn){
    closeBtn.addEventListener('click', (e) => { e.preventDefault(); e.stopPropagation(); toggle(false); });
    // Fallback: key support on close button
    closeBtn.addEventListener('keydown', (e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); toggle(false); } });
  }
  document.addEventListener('keydown', (e) => { if (e.key === 'Escape' && modal.classList.contains('is-open')) toggle(false); });

  // Prevent background scroll on touch by capturing wheel/touchmove and allowing only inside scroll area
  const preventBgScroll = (e) => {
    if (!modal.classList.contains('is-open')) return;
    if (!scrollArea) { e.preventDefault(); return; }
    const target = e.target;
    // find if event happened inside scroll area
    if (scrollArea.contains(target)) { e.stopPropagation(); return; } // allow default inside content
    e.preventDefault();
  };
  // Desktop: Smooth Wheel-Scrolling für den Dialog
  const isDesktopPointer = window.matchMedia('(hover: hover) and (pointer: fine)');
  let wheelTarget = 0;
  let wheelAnimating = false;
  const animateWheel = () => {
    if (!wheelAnimating) return;
    const current = scrollArea.scrollTop;
    const diff = wheelTarget - current;
    if (Math.abs(diff) < 0.6) {
      scrollArea.scrollTop = wheelTarget;
      wheelAnimating = false;
      return;
    }
    // sanfte Annäherung
    scrollArea.scrollTop = current + diff * 0.18;
    requestAnimationFrame(animateWheel);
  };
  const onWheel = (e) => {
    if (!modal.classList.contains('is-open')) return;
    if (!isDesktopPointer.matches) return; // Mobile unberührt lassen
    e.preventDefault();
    const maxTop = scrollArea.scrollHeight - scrollArea.clientHeight;
    // Ziel erhöhen/verringern, Trackpad/Mousewheel kompatibel
    wheelTarget = Math.max(0, Math.min(maxTop, wheelTarget + e.deltaY));
    if (!wheelAnimating) {
      wheelAnimating = true;
      requestAnimationFrame(animateWheel);
    }
  };
  modal.addEventListener('wheel', onWheel, { passive: false });
  dialog.addEventListener('wheel', onWheel, { passive: false });
  if (scrollArea) scrollArea.addEventListener('wheel', onWheel, { passive: false });
  // Keyboard scrolling for accessibility
  if (scrollArea) {
    scrollArea.setAttribute('tabindex', '-1');
    const keyScroll = (e) => {
      if (!modal.classList.contains('is-open')) return;
      const line = 50; // px per arrow key
      if (['ArrowDown','ArrowUp','PageDown','PageUp','Home','End'].includes(e.key)){
        e.preventDefault();
      }
      switch(e.key){
        case 'ArrowDown': wheelTarget = Math.min(scrollArea.scrollHeight - scrollArea.clientHeight, (wheelTarget || scrollArea.scrollTop) + line); if (!wheelAnimating) { wheelAnimating = true; requestAnimationFrame(animateWheel); } break;
        case 'ArrowUp': wheelTarget = Math.max(0, (wheelTarget || scrollArea.scrollTop) - line); if (!wheelAnimating) { wheelAnimating = true; requestAnimationFrame(animateWheel); } break;
        case 'PageDown': wheelTarget = Math.min(scrollArea.scrollHeight - scrollArea.clientHeight, (wheelTarget || scrollArea.scrollTop) + scrollArea.clientHeight * 0.9); if (!wheelAnimating) { wheelAnimating = true; requestAnimationFrame(animateWheel); } break;
        case 'PageUp': wheelTarget = Math.max(0, (wheelTarget || scrollArea.scrollTop) - scrollArea.clientHeight * 0.9); if (!wheelAnimating) { wheelAnimating = true; requestAnimationFrame(animateWheel); } break;
        case 'Home': wheelTarget = 0; if (!wheelAnimating) { wheelAnimating = true; requestAnimationFrame(animateWheel); } break;
        case 'End': wheelTarget = scrollArea.scrollHeight; if (!wheelAnimating) { wheelAnimating = true; requestAnimationFrame(animateWheel); } break;
      }
    };
    dialog.addEventListener('keydown', keyScroll);
  }
  // Mobile touch
  modal.addEventListener('touchmove', preventBgScroll, { passive: false });

  form.addEventListener('change', (e) => {
    if (e.target.matches('input[name="services"]')) updateSelected();
  });

  form.addEventListener('submit', (evt) => {
    evt.preventDefault();
    const data = new FormData(form);
    const services = data.getAll('services');
    const lines = [];
    lines.push('Ausgewählte Dienstleistungen:');
    services.forEach(s => lines.push(`- ${s}`));
    lines.push('');
    const freq = data.get('frequency') || '';
    const start = data.get('startDate') || '';
    const times = data.get('times') || '';
    const notes = data.get('notes') || '';
    lines.push(`Häufigkeit: ${freq}`);
    if (start) lines.push(`Startdatum: ${start}`);
    if (times) lines.push(`Bevorzugte Zeiten: ${times}`);
    if (notes) { lines.push(''); lines.push('Notizen:'); lines.push(String(notes)); }
    lines.push('');
    const name = String(data.get('name') || '').trim();
    const phone = String(data.get('phone') || '').trim();
    const email = String(data.get('email') || '').trim();
    if (!name || !phone){
      alert('Bitte füllen Sie Name und Telefon aus.');
      return;
    }
    lines.push(`Name: ${name}`);
    lines.push(`Telefon: ${phone}`);
    if (email) lines.push(`E-Mail: ${email}`);

    const subject = encodeURIComponent('Buchungsanfrage – MiCare');
    const body = encodeURIComponent(lines.join('\n'));
    const mailto = `mailto:kontakt@micare.de?subject=${subject}&body=${body}`;
    window.location.href = mailto;

    form.reset();
    updateSelected();
    toggle(false);
  });

  // Smooth accordion animation for details groups (always animated open/close)
  const groups = modal.querySelectorAll('.booking-options details');
  groups.forEach(details => {
    const summary = details.querySelector('summary');
    const content = details.querySelector('.option-list');
    if (!summary || !content) return;

    let isAnimating = false;
    const durationOpenMs = 260;
    const durationCloseMs = 220;
    const timing = 'cubic-bezier(.22,.61,.36,1)';

    const setTransition = (ms) => { content.style.transition = `height ${ms}ms ${timing}`; };
    const clearTransition = () => { content.style.transition = ''; };

    // Initial state without jumps
    if (details.open) {
      content.style.height = 'auto';
      content.style.overflow = '';
    } else {
      content.style.height = '0px';
      content.style.overflow = 'hidden';
    }

    const openAnimated = () => {
      if (isAnimating) return; isAnimating = true;
      details.open = true;
      content.style.overflow = 'hidden';
      content.style.height = '0px';
      // reflow
      void content.offsetHeight;
      setTransition(durationOpenMs);
      content.style.height = `${content.scrollHeight}px`;
      content.addEventListener('transitionend', () => {
        clearTransition();
        content.style.height = 'auto';
        content.style.overflow = '';
        isAnimating = false;
      }, { once: true });
    };

    const closeAnimated = () => {
      if (isAnimating) return; isAnimating = true;
      const start = content.scrollHeight;
      content.style.overflow = 'hidden';
      content.style.height = `${start}px`;
      // reflow
      void content.offsetHeight;
      setTransition(durationCloseMs);
      content.style.height = '0px';
      content.addEventListener('transitionend', () => {
        clearTransition();
        details.open = false;
        isAnimating = false;
      }, { once: true });
    };

    // Intercept clicks to always animate
    // Desktop: nutze Click
    summary.addEventListener('click', (e) => {
      const isTouch = window.matchMedia('(hover: none)').matches;
      if (isTouch) return; // Mobile handled via pointerup
      e.preventDefault();
      if (details.open) closeAnimated(); else openAnimated();
    });

    // Keyboard accessibility
    summary.addEventListener('keydown', (e) => {
      if (e.key === 'Enter' || e.key === ' ') {
        e.preventDefault();
        if (details.open) closeAnimated(); else openAnimated();
      }
    });

    // Touch support: pointerup auf Mobile, um Doppeltrigger zu verhindern
    summary.addEventListener('pointerup', (e) => {
      const isTouch = window.matchMedia('(hover: none)').matches;
      if (!isTouch) return;
      e.preventDefault();
      if (details.open) closeAnimated(); else openAnimated();
    }, { passive: false });
  });

  // --- Date & Time pickers (lightweight popovers) ---
  const dateInput = document.getElementById('bk-start');
  const timeInput = document.getElementById('bk-times');
  let popover = null;
  let popAnchor = null;

  function closePopover(){
    if (popover) { popover.remove(); popover = null; popAnchor = null; }
  }

  function positionPopover(anchor, el){
    const r = anchor.getBoundingClientRect();
    const vw = document.documentElement.clientWidth;
    const vh = document.documentElement.clientHeight;
    let top = r.bottom + 8;
    let left = r.left;
    // Horizontal clamp
    const maxLeft = vw - el.offsetWidth - 12;
    if (left > maxLeft) left = Math.max(8, maxLeft);
    if (left < 8) left = 8;
    // If below viewport, flip above
    if (top + el.offsetHeight > vh - 8) top = Math.max(8, r.top - 8 - el.offsetHeight);
    el.style.position = 'fixed';
    el.style.top = `${Math.round(top)}px`;
    el.style.left = `${Math.round(left)}px`;
  }

  function buildCalendar(year, month){
    const wrapper = document.createElement('div');
    wrapper.className = 'booking-popover';
    const head = document.createElement('div'); head.className = 'pop-head';
    const title = document.createElement('div'); title.className = 'title';
    const prev = document.createElement('button'); prev.className = 'icon-btn'; prev.type = 'button';
    prev.innerHTML = '<svg viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path d="M15 6l-6 6 6 6" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/></svg>';
    const next = document.createElement('button'); next.className = 'icon-btn'; next.type = 'button';
    next.innerHTML = '<svg viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path d="M9 6l6 6-6 6" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/></svg>';
    head.append(prev, title, next);
    const cal = document.createElement('div'); cal.className = 'calendar';
    const grid = document.createElement('div'); grid.className = 'cal-grid';
    const lang = (localStorage.getItem('micare_lang') || 'de');
    const locale = lang === 'en' ? 'en-US' : 'de-DE';
    const weekdays = lang === 'en' ? ['Mon','Tue','Wed','Thu','Fri','Sat','Sun'] : ['Mo','Di','Mi','Do','Fr','Sa','So'];
    weekdays.forEach(w => { const el = document.createElement('div'); el.className = 'cal-weekday'; el.textContent = w; grid.appendChild(el); });

    function render(y, m){
      grid.querySelectorAll('.cal-day').forEach(n => n.remove());
      const first = new Date(y, m, 1);
      const startIdx = (first.getDay() + 6) % 7; // Montag=0
      const daysInMonth = new Date(y, m + 1, 0).getDate();
      const monthName = new Intl.DateTimeFormat(locale, { month: 'long' }).format(new Date(y, m, 1));
      const cap = monthName.charAt(0).toUpperCase() + monthName.slice(1);
      title.textContent = `${cap} ${y}`;
      const today = new Date();
      // leading blanks from previous month
      for (let i=0;i<startIdx;i++){ const d = document.createElement('div'); d.className='cal-day is-out'; d.textContent=''; grid.appendChild(d); }
      for (let d=1; d<=daysInMonth; d++){
        const el = document.createElement('div'); el.className='cal-day'; el.textContent = String(d);
        const isToday = (y===today.getFullYear() && m===today.getMonth() && d===today.getDate());
        if (isToday) el.classList.add('is-today');
        el.addEventListener('click', () => {
          const val = `${y}-${String(m+1).padStart(2,'0')}-${String(d).padStart(2,'0')}`;
          dateInput.value = val;
          closePopover();
        });
        grid.appendChild(el);
      }
    }

    prev.addEventListener('click', () => { month--; if (month<0){ month=11; year--; } render(year, month); });
    next.addEventListener('click', () => { month++; if (month>11){ month=0; year++; } render(year, month); });

    render(year, month);
    cal.appendChild(grid);
    wrapper.append(head, cal);
    return wrapper;
  }

  // Time popover removed per request – users can type freely

  if (dateInput){
    const isTouch = window.matchMedia('(hover: none)').matches;
    const openDate = () => {
      closePopover();
      popover = buildCalendar(new Date().getFullYear(), new Date().getMonth());
      document.body.appendChild(popover);
      popAnchor = dateInput; positionPopover(dateInput, popover);
    };
    if (!isTouch){
      dateInput.addEventListener('focus', openDate);
      dateInput.addEventListener('click', openDate);
      // Desktop: nativen Datepicker unterdrücken, damit unser Popover sichtbar ist
      dateInput.addEventListener('mousedown', (e) => {
        const isDesktop = window.matchMedia('(hover: hover) and (pointer: fine)').matches;
        if (isDesktop){ e.preventDefault(); openDate(); dateInput.blur(); }
      });
    }
  }
  // No time popover bindings; keep input free-text

  // Close popover on outside click or escape
  document.addEventListener('click', (e) => {
    if (!popover) return;
    if (e.target === popover || popover.contains(e.target)) return;
    if (e.target === dateInput || e.target === timeInput) return;
    closePopover();
  });
  document.addEventListener('keydown', (e) => { if (e.key==='Escape') closePopover(); });
  window.addEventListener('resize', () => { if (popover && popAnchor) positionPopover(popAnchor, popover); });
  window.addEventListener('scroll', () => { if (popover && popAnchor) positionPopover(popAnchor, popover); }, { passive:true });
}

if (document.readyState === 'loading'){
  document.addEventListener('DOMContentLoaded', setupBooking);
} else {
  setupBooking();
}