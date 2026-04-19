/**
 * ╔══════════════════════════════════════════════════════════════╗
 * ║           AUREL DEVSTUDIO — script.js                       ║
 * ║           Elite WebGL & GSAP Creative Engine                ║
 * ║           Inspirováno: aino.agency                          ║
 * ║           Autoři: Jiří Zlatník & Vilém Orálek               ║
 * ╚══════════════════════════════════════════════════════════════╝
 *
 * Architektura:
 * ─────────────────────────────────────────────────────────────
 *  01. UTILITIES           — lerp, clamp, mapRange, debounce
 *  02. DEVICE DETECTION    — touch, reduced motion, mobile
 *  03. SMOOTH SCROLL       — Lenis + GSAP ticker sync
 *  04. CURSOR ENGINE       — magnetic, blend-mode, morph, label
 *  05. LOADER              — cinematic curtain reveal
 *  06. NAV                 — scroll state, hamburger, active link
 *  07. TEXT SPLITTER       — vlastní split na chars/words/lines
 *  08. HERO SEQUENCE       — masivní timeline, line mask reveal
 *  09. SCROLL DISTORTION   — velocity skew na #skew-root
 *  10. KINETIC TYPOGRAPHY  — scroll-driven scale + opacity
 *  11. STAGGERED REVEALS   — 3D char-by-char odkrývání
 *  12. MARQUEE             — velocity-linked rychlost
 *  13. COUNTER ANIMATION   — eased numeric count-up
 *  14. CARD MAGNETICS      — cursor-driven hover glow + tilt
 *  15. MATRIX CANVAS       — enhanced s barevnými glitchy
 *  16. BEFORE/AFTER SLIDER — drag + touch + hint animace
 *  17. CONTACT FORM        — validace + AJAX + success anim
 *  18. INIT ORCHESTRATOR   — pořadí inicializace
 */

'use strict';


/* ════════════════════════════════════════════════════════════
   01. UTILITIES
   ════════════════════════════════════════════════════════════ */

/** Lineární interpolace */
const lerp = (a, b, t) => a + (b - a) * t;

/** Omezení hodnoty na rozsah */
const clamp = (v, min, max) => Math.min(Math.max(v, min), max);

/** Mapování z jednoho rozsahu do druhého */
const mapRange = (val, inMin, inMax, outMin, outMax) =>
  outMin + ((clamp(val, inMin, inMax) - inMin) / (inMax - inMin)) * (outMax - outMin);

/** Debounce — čeká na konec série volání */
const debounce = (fn, ms) => {
  let t;
  return (...args) => { clearTimeout(t); t = setTimeout(() => fn(...args), ms); };
};

/** Throttle — omezuje frekvenci */
const throttle = (fn, ms) => {
  let last = 0;
  return (...args) => {
    const now = performance.now();
    if (now - last >= ms) { last = now; fn(...args); }
  };
};

/** Vzdálenost dvou bodů */
const dist = (x1, y1, x2, y2) => Math.sqrt((x2 - x1) ** 2 + (y2 - y1) ** 2);

/** Náhodné číslo v rozsahu */
const rand = (min, max) => Math.random() * (max - min) + min;

/* ════════════════════════════════════════════════════════════
   02. DEVICE DETECTION
   ════════════════════════════════════════════════════════════ */

const Device = {
  isTouch:          window.matchMedia('(hover: none)').matches,
  isMobile:         window.innerWidth < 768,
  reducedMotion:    window.matchMedia('(prefers-reduced-motion: reduce)').matches,
  isHighRefresh:    false, // detekce 120fps níže

  init() {
    // Detekce vysoké obnovovací frekvence
    let lastT = 0, frames = 0;
    const check = (t) => {
      if (lastT) {
        frames++;
        if (frames > 10) {
          this.isHighRefresh = (1000 / (t - lastT)) > 90;
          return;
        }
      }
      lastT = t;
      requestAnimationFrame(check);
    };
    requestAnimationFrame(check);

    window.addEventListener('resize', debounce(() => {
      this.isMobile = window.innerWidth < 768;
    }, 200));
  }
};

/* ════════════════════════════════════════════════════════════
   03. SMOOTH SCROLL — Lenis + GSAP ticker sync
   ════════════════════════════════════════════════════════════ */

const SmoothScroll = (() => {
  let lenis = null;
  let scrollY = 0;
  let velocity = 0;

  function init() {
    if (typeof Lenis === 'undefined') {
      console.warn('[SmoothScroll] Lenis not loaded — using native scroll');
      return;
    }

    lenis = new Lenis({
      duration: 0.8,
      easing: (t) => Math.min(1, 1.001 - Math.pow(2, -10 * t)),
      orientation: 'vertical',
      smoothWheel: true,
      wheelMultiplier: 0.7,
      touchMultiplier: 1.2,
      infinite: false,
    });

    // Sledování velocity přímo z Lenisu
    lenis.on('scroll', ({ scroll, velocity: v }) => {
      scrollY = scroll;
      velocity = v;
    });

    // Integrace s GSAP tickerem
    if (typeof gsap !== 'undefined' && typeof ScrollTrigger !== 'undefined') {
      gsap.ticker.add((time) => lenis.raf(time * 1000));
      gsap.ticker.lagSmoothing(0);
    }

    // Spustit Lenis (události kolečka myši)
    lenis.start();
  }

  function getVelocity()  { return velocity; }
  function getScrollY()   { return scrollY; }
  function getLenis()     { return lenis; }

  function scrollTo(target, opts = {}) {
    if (lenis) lenis.scrollTo(target, opts);
    else if (target instanceof HTMLElement) {
      target.scrollIntoView({ behavior: 'smooth' });
    } else {
      window.scrollTo({ top: target, behavior: 'smooth' });
    }
  }

  return { init, getVelocity, getScrollY, getLenis, scrollTo };
})();

/* ════════════════════════════════════════════════════════════
   04. CURSOR ENGINE
   Magnetický kurzor s mix-blend-mode: difference
   Morfuje tvar, reaguje na kontext, zobrazuje labely
   ════════════════════════════════════════════════════════════ */

const CursorEngine = (() => {
  const dot   = document.getElementById('cursor-dot');
  const ring  = document.getElementById('cursor-ring');
  const label = document.getElementById('cursor-label');

  // Aktuální + cílová poloha (RAFem lerpovaná)
  let mx = 0, my = 0;          // mouse
  let dx = 0, dy = 0;          // dot (přesné sledování)
  let rx = 0, ry = 0;          // ring (zpožděné)
  let lx = 0, ly = 0;          // label
  let raf;

  // Stav kurzoru
  let state = 'default';        // 'default' | 'hover' | 'text' | 'drag' | 'hidden'

  // Magnetický pull
  let magnetTarget = null;
  let magnetStrength = 0.35;

  function lerp2(cx, cy, tx, ty, t) {
    return { x: lerp(cx, tx, t), y: lerp(cy, ty, t) };
  }

  function tick() {
    let targetRX = mx, targetRY = my;

    // Magnetic pull — přitáhne ring k nejbližšímu magnetickému prvku
    if (magnetTarget) {
      const rect   = magnetTarget.getBoundingClientRect();
      const cx     = rect.left + rect.width  / 2;
      const cy     = rect.top  + rect.height / 2;
      const d      = dist(mx, my, cx, cy);
      const radius = Math.max(rect.width, rect.height) * 0.8;

      if (d < radius) {
        const pull = 1 - (d / radius);
        targetRX = lerp(mx, cx, pull * magnetStrength);
        targetRY = lerp(my, cy, pull * magnetStrength);
      }
    }

    // Interpolace pozic
    dx = lerp(dx, mx, 0.85);          // dot — téměř přesné
    dy = lerp(dy, my, 0.85);
    rx = lerp(rx, targetRX, 0.10);    // ring — výrazné zpoždění (fluid)
    ry = lerp(ry, targetRY, 0.10);
    lx = lerp(lx, mx, 0.12);
    ly = lerp(ly, my, 0.12);

    // Aplikace transformací (GPU pouze transform)
    if (dot)   dot.style.transform   = `translate3d(${dx}px,${dy}px,0) translate(-50%,-50%)`;
    if (ring)  ring.style.transform  = `translate3d(${rx}px,${ry}px,0) translate(-50%,-50%)`;
    if (label) label.style.transform = `translate3d(${lx}px,${ly}px,0) translate(-50%,24px)`;
  }

  function setState(newState, labelText = '') {
    if (state === newState) return;
    state = newState;

    if (!dot || !ring) return;

    // Resetujeme GSAP tweeny na kurzoru
    gsap.killTweensOf([dot, ring]);

    switch (newState) {
      case 'default':
        gsap.to(dot,  { width: 8,  height: 8,  opacity: 1, duration: 0.3, ease: 'power2.out' });
        gsap.to(ring, { width: 36, height: 36, opacity: 1, borderWidth: 1.5, duration: 0.4, ease: 'power2.out' });
        if (label) { label.textContent = ''; label.style.opacity = '0'; }
        break;

      case 'hover':
        gsap.to(dot,  { width: 0, height: 0, opacity: 0, duration: 0.25 });
        gsap.to(ring, { width: 60, height: 60, opacity: 0.7, borderWidth: 1, duration: 0.4, ease: 'back.out(1.5)' });
        if (label && labelText) {
          label.textContent = labelText;
          label.style.opacity = '1';
        }
        break;

      case 'text':
        // Mění se na tenký svislý kurzor (jako textový)
        gsap.to(dot,  { width: 2, height: 24, opacity: 1, borderRadius: 1, duration: 0.2 });
        gsap.to(ring, { width: 24, height: 24, opacity: 0.5, duration: 0.3 });
        break;

      case 'drag':
        gsap.to(dot,  { width: 12, height: 12, opacity: 1, duration: 0.2 });
        gsap.to(ring, { width: 80, height: 80, opacity: 0.4, duration: 0.4 });
        if (label) { label.textContent = 'DRAG'; label.style.opacity = '1'; }
        break;

      case 'hidden':
        gsap.to(dot,  { opacity: 0, duration: 0.2 });
        gsap.to(ring, { opacity: 0, duration: 0.2 });
        break;
    }
  }

  function bindElements() {
    // Magnetic hover na [data-magnetic] prvcích
    document.querySelectorAll('[data-magnetic], .btn, .nav__link, .nav__cta').forEach(el => {
      el.addEventListener('mouseenter', () => {
        magnetTarget = el;
        const labelText = el.dataset.cursorLabel || '';
        setState('hover', labelText);
      });
      el.addEventListener('mouseleave', () => {
        magnetTarget = null;
        setState('default');
      });
    });

    // Text kurzor na odstavcích
    document.querySelectorAll('p, .t-body, .t-muted').forEach(el => {
      el.addEventListener('mouseenter', () => setState('text'));
      el.addEventListener('mouseleave', () => setState('default'));
    });

    // Drag cursor na BA slideru
    const baHandle = document.querySelector('.ba-handle');
    if (baHandle) {
      baHandle.addEventListener('mouseenter', () => setState('drag'));
      baHandle.addEventListener('mouseleave', () => setState('default'));
    }
  }

  function init() {
    if (!dot || !ring) return;

    // Skryjeme na dotykových zařízeních
    if (Device.isTouch) {
      if (dot) dot.style.display = 'none';
      if (ring) ring.style.display = 'none';
      if (label) label.style.display = 'none';
      document.body.style.cursor = 'auto';
      return;
    }

    // Sledování pohybu myši
    document.addEventListener('mousemove', e => { mx = e.clientX; my = e.clientY; });
    document.addEventListener('mousedown', () => {
      gsap.to(dot,  { scale: 0.6, duration: 0.1 });
      gsap.to(ring, { scale: 0.85, duration: 0.15 });
    });
    document.addEventListener('mouseup', () => {
      gsap.to(dot,  { scale: 1, duration: 0.3, ease: 'elastic.out(1.2, 0.5)' });
      gsap.to(ring, { scale: 1, duration: 0.4, ease: 'elastic.out(1, 0.4)' });
    });

    // Inicializace pozice
    dx = rx = mx = window.innerWidth  / 2;
    dy = ry = my = window.innerHeight / 2;

    // Bind hover efektů
    bindElements();
    gsap.ticker.add(tick);
  }

  // Re-bind (voláno po DOM změnách)
  function refresh() { bindElements(); }

  return { init, setState, refresh };
})();

/* ════════════════════════════════════════════════════════════
   05. LOADER — Kinematický úvodní loader s curtain reveal
   ════════════════════════════════════════════════════════════ */

const Loader = (() => {
  const el       = document.getElementById('loader');
  const fill     = el?.querySelector('.loader__fill');
  const pctEl    = el?.querySelector('.loader__percent');
  const logoEl   = el?.querySelector('.loader__logo');

  let progress = 0;
  let targetProgress = 0;
  let raf;

  function setProgress(val) {
    targetProgress = clamp(val, 0, 100);
  }

  function animateProgress() {
    // Plynulé dohánění target hodnoty
    progress = lerp(progress, targetProgress, 0.06);
    const rounded = Math.round(progress);

    if (fill)  fill.style.width = progress + '%';
    if (pctEl) pctEl.textContent = rounded + '%';

    if (progress < 99.5) raf = requestAnimationFrame(animateProgress);
  }

  function reveal() {
    // Zastav progress animaci
    cancelAnimationFrame(raf);
    setProgress(100);

    if (!el) { document.body.style.overflow = ''; return; }

    const tl = gsap.timeline({
        onComplete: () => {
  el.style.display = 'none';
  document.body.style.overflow = ''; 
  if (typeof DailyIntro !== 'undefined') {
    DailyIntro.init();
  } else {
    if (typeof HeroSequence !== 'undefined') HeroSequence.play();
  }
}
    });

    // Logo se rozpadne na znaky pak odletí
    if (logoEl) {
      const chars = logoEl.querySelectorAll('.char') || [];
      if (chars.length) {
        tl.to(chars, {
          y: -40, opacity: 0, stagger: 0.04,
          duration: 0.5, ease: 'power3.in'
        }, 0);
      } else {
        tl.to(logoEl, { y: -30, opacity: 0, duration: 0.4, ease: 'power2.in' }, 0);
      }
    }

    // Progress bar zmizí
    tl.to(el.querySelector('.loader__bar'), {
      scaleX: 0, transformOrigin: 'right', duration: 0.4, ease: 'power2.in'
    }, 0);

    // Loader curtain — odjetí nahoru
    tl.to(el, {
      yPercent: -100,
      duration: 1.0,
      ease: 'power4.inOut'
    }, 0.3);
  }

  function init() {
    if (!el) return;
    document.body.style.overflow = 'hidden';

    // Rychle na 30%
    setProgress(30);
    animateProgress();

    // Po 400ms na 70%
    setTimeout(() => setProgress(70), 400);

    // Po window.load na 100% + reveal
    const doReveal = () => {
      setProgress(100);
      setTimeout(reveal, 600);
    };

    if (document.readyState === 'complete') {
      doReveal();
    } else {
      window.addEventListener('load', doReveal, { once: true });
      // Fallback timeout
      setTimeout(doReveal, 4000);
    }
  }

  return { init };
})();

/* ════════════════════════════════════════════════════════════
   06. NAV
   ════════════════════════════════════════════════════════════ */

const Nav = (() => {
  const nav       = document.querySelector('.nav');
  const hamburger = document.querySelector('.nav__hamburger');
  const mobile    = document.querySelector('.nav__mobile');

  function init() {
    if (!nav) return;

    // Active link
    const path = location.pathname.split('/').pop() || 'index.html';
    document.querySelectorAll('.nav__link').forEach(a => {
      a.classList.toggle('active', a.getAttribute('href') === path);
    });

    // Scroll stav
    // Scroll stav – napojeno na Lenis
  const lenis = SmoothScroll.getLenis();
  if (lenis) {
    let prevY = 0;
    lenis.on('scroll', ({ scroll }) => {
      nav.classList.toggle('scrolled', scroll > 60);
      if (scroll > 120 && scroll > prevY + 5) {
        gsap.to(nav, { yPercent: -100, duration: 0.4, ease: 'power2.in' });
      } else if (scroll < prevY - 5) {
        gsap.to(nav, { yPercent: 0, duration: 0.5, ease: 'power3.out' });
      }
      prevY = scroll;
    });
  }

    // Hamburger
    if (hamburger && mobile) {
      hamburger.addEventListener('click', () => {
        const isOpen = mobile.classList.toggle('open');
        hamburger.classList.toggle('open', isOpen);
        hamburger.setAttribute('aria-expanded', String(isOpen));
        document.body.style.overflow = isOpen ? 'hidden' : '';
      });

      mobile.querySelectorAll('a').forEach(a => {
        a.addEventListener('click', () => {
          mobile.classList.remove('open');
          hamburger.classList.remove('open');
          document.body.style.overflow = '';
        });
      });
    }

    // Smooth scroll na anchor linky
    document.querySelectorAll('a[href^="#"]').forEach(a => {
      a.addEventListener('click', e => {
        const target = document.querySelector(a.getAttribute('href'));
        if (!target) return;
        e.preventDefault();
        SmoothScroll.scrollTo(target, { duration: 1.6, easing: t => Math.min(1, 1.001 - Math.pow(2, -10 * t)) });
      });
    });
  }

  return { init };
})();

/* ════════════════════════════════════════════════════════════
   07. TEXT SPLITTER
   Vlastní implementace — rozbitím textu na chars/words/lines
   ════════════════════════════════════════════════════════════ */

const TextSplitter = (() => {

  /**
   * Rozbitím textu elementu na obalené znaky
   * Každý znak: <span class="char"><span class="char-inner">X</span></span>
   * Zachovává mezery a speciální znaky
   */
  function splitChars(el, opts = {}) {
    const { preserveHTML = false } = opts;
    const original = el.innerHTML;
    el.dataset.splitOriginal = original;

    // Rozdělíme na slova zachovávajíce tagy
    const text = preserveHTML ? el.textContent : el.textContent;
    const words = text.split(' ');
    let html = '';

    words.forEach((word, wi) => {
      html += `<span class="word" aria-hidden="true">`;
      [...word].forEach((char, ci) => {
        const safe = char
          .replace(/&/g, '&amp;')
          .replace(/</g, '&lt;')
          .replace(/>/g, '&gt;');
        html += `<span class="char" data-char="${safe}" data-word="${wi}" data-idx="${ci}"><span class="char-inner">${safe}</span></span>`;
      });
      html += `</span>`;
      if (wi < words.length - 1) html += ' ';
    });

    el.innerHTML = html;
    el.setAttribute('aria-label', text); // Zachování accessibility

    return {
      chars: Array.from(el.querySelectorAll('.char')),
      words: Array.from(el.querySelectorAll('.word')),
    };
  }

  /**
   * Rozdělení na řádky (pro maskovací reveal)
   * Detekuje konce řádků porovnáváním offsetTop
   */
  function splitLines(el) {
    const original = el.textContent;
    // Wrap each word
    const words = original.split(/\s+/).filter(Boolean);
    el.innerHTML = words.map(w =>
      `<span class="word-probe" style="display:inline-block">${w} </span>`
    ).join('');

    const probes = el.querySelectorAll('.word-probe');
    const lines  = [];
    let   curLine = [], curTop = -1;

    probes.forEach(probe => {
      const top = probe.offsetTop;
      if (top !== curTop) {
        if (curLine.length) lines.push(curLine);
        curLine = [];
        curTop  = top;
      }
      curLine.push(probe.textContent.trim());
    });
    if (curLine.length) lines.push(curLine);

    // Rebuild with line wrappers
    el.innerHTML = lines.map(words =>
      `<span class="line" style="display:block;overflow:hidden"><span class="line-inner" style="display:block">${words.join(' ')}</span></span>`
    ).join('');

    return Array.from(el.querySelectorAll('.line-inner'));
  }

  return { splitChars, splitLines };
})();

/* ════════════════════════════════════════════════════════════
   08. HERO SEQUENCE — Masivní kinematická úvodní animace
   ════════════════════════════════════════════════════════════ */

const HeroSequence = (() => {
  let played = false;

  function play() {
    if (played) return;
    played = true;

    if (typeof gsap === 'undefined') return;

    const tl = gsap.timeline({ defaults: { ease: 'power4.out' } });

    // ── Eyebrow badge — slide in from left
    const eyebrow = document.querySelector('.hero__eyebrow');
    if (eyebrow) {
      tl.fromTo(eyebrow,
        { x: -40, opacity: 0 },
        { x: 0, opacity: 1, duration: 0.9 },
        0
      );
    }

    // ── Headline — každý .line-inner vyletí zespodu z maskovacího .line
    const lineInners = document.querySelectorAll('.hero__headline .line-inner');
    if (lineInners.length) {
      tl.fromTo(lineInners,
        { y: '105%', rotateX: 12, opacity: 0 },
        { y: '0%',   rotateX: 0,  opacity: 1,
          duration: 1.1,
          stagger: 0.14,
          ease: 'power4.out'
        },
        0.2
      );
    }

    // ── Sub text — fade up s mírnou expanzí
    const sub = document.querySelector('.hero__sub');
    if (sub) {
      tl.fromTo(sub,
        { y: 30, opacity: 0},
        { y: 0,  opacity: 1, duration: 0.9 },
        0.7
      );
    }

    // ── CTAs — stagger, každé tlačítko skočí z pod
    const ctas = document.querySelectorAll('.hero__ctas .btn');
    if (ctas.length) {
      tl.fromTo(ctas,
        { y: 24, opacity: 0, scale: 0.94 },
        { y: 0,  opacity: 1, scale: 1,
          stagger: 0.1,
          duration: 0.7,
          ease: 'back.out(1.4)'
        },
        0.85
      );
    }

    // ── Scroll hint
    const hint = document.querySelector('.hero__scroll-hint');
    if (hint) {
      tl.fromTo(hint,
        { opacity: 0, y: 16 },
        { opacity: 1, y: 0, duration: 0.7 },
        1.4
      );
    }

    // ── Nav reveal (animate-in)
    tl.fromTo('.nav',
      { y: -20, opacity: 0 },
      { y: 0,   opacity: 1, duration: 0.6, ease: 'power3.out' },
      0.1
    );

    return tl;
  }

  return { play };
})();

/* ════════════════════════════════════════════════════════════
   09. SCROLL DISTORTION ENGINE
   Velocity-based skewY na #skew-root — Aino signature efekt
   ════════════════════════════════════════════════════════════ */

const ScrollDistortion = (() => {
  const root = document.getElementById('skew-root');
  
  let currentSkew   = 0;
  let targetSkew    = 0;
  let raf;

  // Citlivost: jak moc se velocity promítne do skew
  const SKEW_FACTOR  = 0.0008;
  const MAX_SKEW     = 4;       // maximální úhel stupňů
  const LERP_SPEED   = 0.07;    // jak rychle se vrací

  function tick() {
    const vel = SmoothScroll.getVelocity();

    // Cílový skew je úměrný rychlosti scrollu
    targetSkew = clamp(vel * SKEW_FACTOR, -MAX_SKEW, MAX_SKEW);

    // Plynulý return k nule
    currentSkew = lerp(currentSkew, targetSkew, LERP_SPEED);

    // Aplikujeme pouze pokud je hodnota dostatečně velká
    if (root && Math.abs(currentSkew) > 0.001) {
      root.style.transform = `skewY(${currentSkew.toFixed(4)}deg)`;
    }

  }

  function init() {
    if (!root || Device.reducedMotion || Device.isMobile) return;
    gsap.ticker.add(tick);
  }

  return { init };
})();

/* ════════════════════════════════════════════════════════════
   10. KINETIC TYPOGRAPHY
   Texty které se organicky transformují při scrollu
   ════════════════════════════════════════════════════════════ */

const KineticType = (() => {

  function init() {
    if (typeof gsap === 'undefined' || typeof ScrollTrigger === 'undefined') return;
    if (Device.reducedMotion) return;

    // ── Hero headline — scale down + fade při odscrollování
    const heroHL = document.querySelector('.hero__headline');
    if (heroHL) {
      gsap.fromTo(heroHL,
  { scale: 1, opacity: 1, y: 0 },
  {
    scale: 0.88, opacity: 0, y: -60,
    ease: 'none',
    scrollTrigger: {
      trigger: '.hero',
      start: 'top top',
      end: 'bottom top',
      scrub: 1.5,
    }
  }
);
    }

    // ── Velké nadpisy sekcí — scale in z menšího při vstupu do viewportu
    document.querySelectorAll('.t-heading[data-decode], .t-heading.reveal').forEach(el => {
      // Nejprve splitneme na chars (pokud ještě ne)
      if (!el.dataset.splitDone) {
        const { chars } = TextSplitter.splitChars(el);
        el.dataset.splitDone = '1';

        // Nastavíme počáteční stav
        gsap.set(chars, {
          rotateY:  90,
          opacity:  0,
          transformOrigin: '50% 50%',
        });

        // ScrollTrigger reveal — 3D char-by-char rotace
        ScrollTrigger.create({
          trigger: el,
          start:   'top 82%',
          once:    true,
          onEnter: () => {
            gsap.to(chars, {
              rotateY: 0,
              opacity: 1,
              duration: 0.65,
              stagger: {
                each:   0.025,
                from:   'start',
                ease:   'power2.out'
              },
              ease: 'power3.out',
              clearProps: 'transform,opacity'
            });
          }
        });
      }
    });

    // ── Velké číselné zobrazení — scale efekt na stats
    document.querySelectorAll('.stat__number').forEach(el => {
      gsap.fromTo(el,
        { scale: 0.5, opacity: 0 },
        {
          scale: 1, opacity: 1, duration: 0.9,
          ease: 'elastic.out(1.1, 0.6)',
          scrollTrigger: {
            trigger: el,
            start: 'top 88%',
            once:  true
          }
        }
      );
    });
  }

  return { init };
})();

/* ════════════════════════════════════════════════════════════
   11. STAGGERED REVEALS
   Sekce se odkrývají s plynulými maskovacími animacemi
   ════════════════════════════════════════════════════════════ */

const Reveals = (() => {

  function init() {
    if (typeof gsap === 'undefined') return;

    const defaults = { duration: 0.85, ease: 'power3.out' };

    // ── Základní reveal (zdola)
    gsap.utils.toArray('.reveal').forEach(el => {
      const delay = parseFloat(el.dataset.delay || 0);
      gsap.fromTo(el,
        { y: 50, opacity: 0},
        { y: 0,  opacity: 1,
          delay, ...defaults,
          scrollTrigger: { trigger: el, start: 'top 87%', once: true }
        }
      );
    });

    // ── Reveal zleva
    gsap.utils.toArray('.reveal-left').forEach(el => {
      const delay = parseFloat(el.dataset.delay || 0);
      gsap.fromTo(el,
        { x: -60, opacity: 0 },
        { x: 0,   opacity: 1,
          delay, duration: 1.0, ease: 'power3.out',
          scrollTrigger: { trigger: el, start: 'top 87%', once: true }
        }
      );
    });

    // ── Reveal zprava
    gsap.utils.toArray('.reveal-right').forEach(el => {
      const delay = parseFloat(el.dataset.delay || 0);
      gsap.fromTo(el,
        { x: 60, opacity: 0 },
        { x: 0,  opacity: 1,
          delay, duration: 1.0, ease: 'power3.out',
          scrollTrigger: { trigger: el, start: 'top 87%', once: true }
        }
      );
    });

    // ── Scale reveal
    gsap.utils.toArray('.reveal-scale').forEach(el => {
      gsap.fromTo(el,
        { scale: 0.88, opacity: 0, y: 24 },
        { scale: 1,    opacity: 1, y: 0,
          duration: 0.95, ease: 'back.out(1.3)',
          scrollTrigger: { trigger: el, start: 'top 85%', once: true }
        }
      );
    });

    // ── Stagger children — animace skupin prvků
    document.querySelectorAll('[data-stagger]').forEach(parent => {
      const children  = Array.from(parent.children);
      const staggerAmt = parseFloat(parent.dataset.staggerDelay || 0.1);

      gsap.fromTo(children,
        { y: 40, opacity: 0, scale: 0.96 },
        {
          y: 0, opacity: 1, scale: 1,
          stagger: staggerAmt,
          duration: 0.75,
          ease: 'power3.out',
          scrollTrigger: { trigger: parent, start: 'top 85%', once: true }
        }
      );
    });

    // ── Section label line — roztažení zleva
    document.querySelectorAll('.section-label__line').forEach(line => {
      gsap.fromTo(line,
        { scaleX: 0, transformOrigin: 'left' },
        {
          scaleX: 1,
          duration: 0.7,
          ease: 'power3.out',
          scrollTrigger: { trigger: line, start: 'top 88%', once: true }
        }
      );
    });

    // ── Process steps — stagger s linkou
    gsap.utils.toArray('.process-step').forEach((step, i) => {
      gsap.fromTo(step,
        { x: -30, opacity: 0 },
        {
          x: 0, opacity: 1,
          delay: i * 0.15,
          duration: 0.8,
          ease: 'power3.out',
          scrollTrigger: { trigger: step, start: 'top 88%', once: true }
        }
      );
    });

    // ── Compare rows — slide in ze strany s delay
    gsap.utils.toArray('.compare-row').forEach((row, i) => {
      gsap.fromTo(row,
        { x: -20, opacity: 0 },
        {
          x: 0, opacity: 1,
          delay: i * 0.1,
          duration: 0.6,
          ease: 'power2.out',
          scrollTrigger: { trigger: row, start: 'top 90%', once: true }
        }
      );
    });
  }

  return { init };
})();

/* ════════════════════════════════════════════════════════════
   12. MARQUEE — velocity-linked rychlost
   ════════════════════════════════════════════════════════════ */

const Marquee = (() => {

  function init() {
    const track = document.querySelector('.marquee-track');
    if (!track) return;

    let baseSpeed    = 0.4;    // px za frame
    let currentSpeed = baseSpeed;

    // Měříme celkovou šířku tracku
    const totalWidth = track.scrollWidth / 2; // /2 protože máme duplikát
    let posX = 0;

    function tick() {
      const vel = SmoothScroll.getVelocity();

      // Speed se zvyšuje s velocity scrollu
      const targetSpeed = baseSpeed + Math.abs(vel) * 0.006;
      currentSpeed = lerp(currentSpeed, targetSpeed, 0.05);

      posX -= currentSpeed;

      // Reset pro nekonečnou smyčku
      if (Math.abs(posX) >= totalWidth) posX = 0;

      track.style.transform = `translateX(${posX}px)`;
      gsap.ticker.add(tick);
    }

    // Zastav CSS animaci (máme vlastní RAF)
    track.style.animation = 'none';
    
  }

  return { init };
})();

/* ════════════════════════════════════════════════════════════
   13. COUNTER ANIMATION — eased počítání číslic
   ════════════════════════════════════════════════════════════ */

const Counter = (() => {

  function animateValue(el, target, duration, suffix, prefix) {
    const start     = performance.now();
    const isFloat   = !Number.isInteger(target);

    // Cubic ease out
    const ease = (t) => 1 - Math.pow(1 - t, 3);

    function step(now) {
      const elapsed  = now - start;
      const progress = Math.min(elapsed / duration, 1);
      const value    = target * ease(progress);

      el.textContent = prefix + (isFloat ? value.toFixed(1) : Math.round(value)) + suffix;

      if (progress < 1) requestAnimationFrame(step);
      else {
        el.textContent = prefix + target + suffix;
        // Mikro bounce po dokončení
        if (typeof gsap !== 'undefined') {
          gsap.fromTo(el, { scale: 1.15 }, { scale: 1, duration: 0.4, ease: 'elastic.out(1.2, 0.5)' });
        }
      }
    }

    requestAnimationFrame(step);
  }

  function init() {
    if (typeof ScrollTrigger === 'undefined') return;

    document.querySelectorAll('[data-count]').forEach(el => {
      const target = parseFloat(el.dataset.count);
      const suffix = el.dataset.suffix || '';
      const prefix = el.dataset.prefix || '';

      ScrollTrigger.create({
        trigger: el,
        start:   'top 88%',
        once:    true,
        onEnter: () => animateValue(el, target, 1800, suffix, prefix)
      });
    });
  }

  return { init };
})();

/* ════════════════════════════════════════════════════════════
   14. CARD INTERACTIONS
   Magnetic tilt + cursor-tracked glow
   ════════════════════════════════════════════════════════════ */

const CardInteractions = (() => {

  function initCard(card) {
    const glowEl = card.querySelector('.service-card__glow, .glass-card__glow');

    card.addEventListener('mousemove', e => {
      const rect = card.getBoundingClientRect();
      const x    = e.clientX - rect.left;
      const y    = e.clientY - rect.top;
      const cx   = rect.width  / 2;
      const cy   = rect.height / 2;

      // Normalizace -1 až 1
      const nx = (x - cx) / cx;
      const ny = (y - cy) / cy;

      // Jemný tilt (max 4°)
      const tiltX = -ny * 4;
      const tiltY =  nx * 4;

      gsap.to(card, {
        rotateX:  tiltX,
        rotateY:  tiltY,
        transformPerspective: 1000,
        duration: 0.4,
        ease:     'power2.out'
      });

      // Glow sleduje kurzor
      if (glowEl) {
        gsap.set(glowEl, {
          background: `radial-gradient(circle at ${(x/rect.width*100).toFixed(1)}% ${(y/rect.height*100).toFixed(1)}%, rgba(124,111,255,0.18), transparent 70%)`,
          opacity: 1
        });
      }
    });

    card.addEventListener('mouseleave', () => {
      gsap.to(card, {
        rotateX: 0, rotateY: 0,
        duration: 0.7,
        ease:     'elastic.out(1, 0.5)'
      });
      if (glowEl) gsap.to(glowEl, { opacity: 0, duration: 0.4 });
    });
  }

  function init() {
    if (Device.isTouch) return;

    document.querySelectorAll('.service-card, .glass-card, .problem-card, .profile-card, .target-card').forEach(initCard);
  }

  return { init };
})();

/* ════════════════════════════════════════════════════════════
   15. MATRIX CANVAS
   Vylepšená verze s barevnými glitchy a variabilitou
   ════════════════════════════════════════════════════════════ */

const MatrixCanvas = (() => {
  const canvas = document.getElementById('matrix-canvas');
  if (!canvas) return { init: () => {} };

  const ctx      = canvas.getContext('2d');
  const fontSize = 12;

  // Znaky — mix kódu, japonštiny a symbolů
  const sets = [
    '01010110100110',
    'アイウエオカキクケコサシスセ',
    '{}[]<>#%@$&*!?',
    'ABCDEF0123456789',
  ];
  const allChars = sets.join('');

  // Barvy kapek — mixujeme accent barvy
  const colors = [
    'rgba(124,111,255,',  // accent purple
    'rgba(94,240,192,',   // accent green
    'rgba(255,111,145,',  // accent pink (vzácně)
    'rgba(200,200,220,',  // white-ish
  ];

  let cols, drops, colorIdx, raf;
  let frame = 0;

  function getChar() {
    return allChars[Math.floor(Math.random() * allChars.length)];
  }

  function resize() {
    canvas.width  = window.innerWidth;
    canvas.height = window.innerHeight;
    cols     = Math.floor(canvas.width / fontSize);
    drops    = new Array(cols).fill(0).map(() => Math.random() * -50);
    colorIdx = new Array(cols).fill(0).map(() => Math.floor(Math.random() * (colors.length - 1)));
  }

  function draw() {
     if (document.hidden) {
    raf = requestAnimationFrame(draw);
    return;
  }
    frame++;
    if (frame % 4 !== 0) return;
    // Fade overlay — tmavší = pomalejší mizení = delší ocasy
    ctx.fillStyle = 'rgba(10,10,12,0.055)';
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    ctx.font = `${fontSize}px JetBrains Mono, monospace`;

    for (let i = 0; i < drops.length; i++) {
      // Glitch — občas změní barvu kapky
      if (Math.random() > 0.998) {
        colorIdx[i] = Math.floor(Math.random() * colors.length);
      }

      const char = getChar();
      const y    = drops[i] * fontSize;

      // Hlava kapky — jasná
      ctx.fillStyle = colors[colorIdx[i]] + '0.9)';
      ctx.fillText(char, i * fontSize, y);

      // Glitch char — občas duplikát o pixel vedle
      if (Math.random() > 0.996) {
        ctx.fillStyle = 'rgba(255,111,145,0.3)';
        ctx.fillText(getChar(), i * fontSize + rand(-2, 2), y + rand(-2, 2));
      }

      // Reset
      if (y > canvas.height && Math.random() > 0.972) {
        drops[i] = 0;
        colorIdx[i] = Math.floor(Math.random() * (colors.length - 1));
      }

      drops[i] += 0.5;
    }

    raf = requestAnimationFrame(draw);
  }

  function init() {
    resize();
    window.addEventListener('resize', debounce(resize, 300));
    draw();
    document.addEventListener('visibilitychange', () => {
  if (document.hidden) {
    cancelAnimationFrame(raf);
  } else {
    raf = requestAnimationFrame(draw);
  }
});
  }

  return { init };
})();

/* ════════════════════════════════════════════════════════════
   16. BEFORE/AFTER SLIDER
   Vylepšená verze s hint animací a GSAP
   ════════════════════════════════════════════════════════════ */

const BASlider = (() => {

  function init() {
    const container = document.querySelector('.ba-container');
    if (!container) return;

    const handle   = container.querySelector('.ba-handle');
    const before   = container.querySelector('.ba-before');
    if (!handle || !before) return;

    let isDragging = false;
    let pct = 50;

    function setPercent(x) {
      const rect = container.getBoundingClientRect();
      pct = clamp(((x - rect.left) / rect.width) * 100, 5, 95);
      before.style.width = pct + '%';
      handle.style.left  = pct + '%';
    }

    // Mouse
    handle.addEventListener('mousedown', e => {
      isDragging = true;
      e.preventDefault();
      document.body.style.userSelect = 'none';
    });
    document.addEventListener('mousemove', e => { if (isDragging) setPercent(e.clientX); });
    document.addEventListener('mouseup',   () => {
      isDragging = false;
      document.body.style.userSelect = '';
    });

    // Touch
    handle.addEventListener('touchstart', e => { isDragging = true; e.preventDefault(); }, { passive: false });
    document.addEventListener('touchmove', e => { if (isDragging) setPercent(e.touches[0].clientX); }, { passive: true });
    document.addEventListener('touchend',  () => { isDragging = false; });

    // GSAP reveal + hint sekvence
    if (typeof gsap !== 'undefined' && typeof ScrollTrigger !== 'undefined') {
      // Entrance
      gsap.fromTo(container,
        { opacity: 0, y: 60, scale: 0.95 },
        {
          opacity: 1, y: 0, scale: 1,
          duration: 1.1, ease: 'power3.out',
          scrollTrigger: { trigger: container, start: 'top 80%', once: true }
        }
      );

      // Hint: slider se pohne sám, aby ukázal interaktivitu
      ScrollTrigger.create({
        trigger: container,
        start:   'top 65%',
        once:    true,
        onEnter: () => {
          const proxy = { val: 50 };
          // Rychlý hint doleva
          gsap.timeline({ delay: 0.8 })
            .to(proxy, {
              val: 25, duration: 1.2, ease: 'power2.inOut',
              onUpdate() {
                before.style.width = proxy.val + '%';
                handle.style.left  = proxy.val + '%';
              }
            })
            // Zpět doprava
            .to(proxy, {
              val: 70, duration: 1.0, ease: 'power2.inOut',
              onUpdate() {
                before.style.width = proxy.val + '%';
                handle.style.left  = proxy.val + '%';
              }
            })
            // Zpět na střed
            .to(proxy, {
              val: 50, duration: 0.8, ease: 'power2.out',
              onUpdate() {
                before.style.width = proxy.val + '%';
                handle.style.left  = proxy.val + '%';
              }
            });
        }
      });
    }
  }

  return { init };
})();

/* ════════════════════════════════════════════════════════════
   17. CONTACT FORM
   Real-time validace + AJAX + animovaný success
   ════════════════════════════════════════════════════════════ */

const ContactForm = (() => {

  function init() {
    const form    = document.getElementById('contact-form');
    if (!form) return;

    const nameIn  = form.querySelector('#name');
    const emailIn = form.querySelector('#email');
    const msgIn   = form.querySelector('#message');
    const submit  = form.querySelector('.form-submit');
    const success = document.querySelector('.form-success');

    function getError(input) {
      return input?.parentElement?.querySelector('.form-error');
    }

    function showError(input, msg) {
      if (!input) return;
      input.classList.add('error');
      const err = getError(input);
      if (!err) return;
      err.textContent = msg;
      err.classList.add('show');
      if (typeof gsap !== 'undefined') {
        gsap.fromTo(input, { x: -6 }, { x: 0, duration: 0.4, ease: 'elastic.out(4,0.5)' });
      }
    }

    function clearError(input) {
      if (!input) return;
      input.classList.remove('error');
      const err = getError(input);
      if (err) err.classList.remove('show');
    }

    function validate() {
      let ok = true;
      if (!nameIn?.value?.trim() || nameIn.value.trim().length < 2) {
        showError(nameIn, 'Zadejte jméno (min. 2 znaky).'); ok = false;
      } else clearError(nameIn);
      if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(emailIn?.value?.trim() || '')) {
        showError(emailIn, 'Neplatná e-mailová adresa.'); ok = false;
      } else clearError(emailIn);
      if (!msgIn?.value?.trim() || msgIn.value.trim().length < 10) {
        showError(msgIn, 'Zpráva musí mít alespoň 10 znaků.'); ok = false;
      } else clearError(msgIn);
      return ok;
    }

    // Animated focus glow
    [nameIn, emailIn, msgIn].forEach(inp => {
      if (!inp) return;
      inp.addEventListener('blur',  () => validate());
      inp.addEventListener('input', () => clearError(inp));
      inp.addEventListener('focus', () => {
        if (typeof gsap !== 'undefined') {
          gsap.to(inp, { boxShadow: '0 0 0 3px rgba(124,111,255,0.18)', duration: 0.3 });
        }
      });
      inp.addEventListener('blur', () => {
        if (typeof gsap !== 'undefined') {
          if (!inp.classList.contains('error')) {
            gsap.to(inp, { boxShadow: '0 0 0 0px rgba(124,111,255,0)', duration: 0.3 });
          }
        }
      });
    });

    // Submit
    form.addEventListener('submit', async e => {
      e.preventDefault();
      if (!validate()) return;

      if (submit) { submit.textContent = 'Odesílám…'; submit.disabled = true; }

      try {
        const res  = await fetch('process.php', {
          method: 'POST',
          body:   new FormData(form),
          headers: { 'X-Requested-With': 'XMLHttpRequest' }
        });
        const data = await res.json();

        if (data.success) {
          showSuccess();
        } else {
          if (submit) { submit.textContent = 'Odeslat zprávu'; submit.disabled = false; }
          alert('Chyba: ' + (data.message || 'Zkuste to znovu.'));
        }
      } catch {
        // Demo fallback
        showSuccess();
      }
    });

    function showSuccess() {
      if (typeof gsap === 'undefined' || !success) return;
      gsap.to(form, {
        opacity: 0, y: -24, duration: 0.4, ease: 'power2.in',
        onComplete: () => {
          form.style.display    = 'none';
          success.style.display = 'block';
          // Animujeme ikonu checkmarku
          const icon = success.querySelector('.form-success__icon');
          gsap.timeline()
            .fromTo(success, { opacity: 0, y: 24 }, { opacity: 1, y: 0, duration: 0.6 })
            .fromTo(icon, { scale: 0, rotate: -30 }, {
              scale: 1, rotate: 0, duration: 0.6, ease: 'elastic.out(1.2, 0.5)'
            }, 0.2);
        }
      });
    }
  }

  return { init };
})();

/* ════════════════════════════════════════════════════════════
   PŘÍDAVNÉ EFEKTY — věci co dělají ten magic
   ════════════════════════════════════════════════════════════ */

/**
 * Parallax vrstvy na hero blobech
 */
function initParallax() {
  if (Device.reducedMotion || Device.isMobile) return;
  if (typeof gsap === 'undefined') return;

  document.querySelectorAll('[data-parallax]').forEach(el => {
    const speed = parseFloat(el.dataset.parallax || 0.2);
    gsap.to(el, {
      y: () => -100 * speed,
      ease: 'none',
      scrollTrigger: {
        trigger: el,
        start: 'top bottom',
        end:   'bottom top',
        scrub: true
      }
    });
  });

  // Hero bloby — mouse parallax (jemný)
  const blobs = document.querySelectorAll('.hero__blob');
  if (blobs.length) {
    document.addEventListener('mousemove', throttle(e => {
      const cx = window.innerWidth  / 2;
      const cy = window.innerHeight / 2;
      const nx = (e.clientX - cx) / cx; // -1 až 1
      const ny = (e.clientY - cy) / cy;

      blobs.forEach((blob, i) => {
        const factor = (i + 1) * 15;
        gsap.to(blob, {
          x: nx * factor,
          y: ny * factor,
          duration: 1.5,
          ease: 'power2.out'
        });
      });
    }, 50));
  }
}

/**
 * Animated grid lines — pulsování border-color
 */
function initGridLines() {
  if (typeof gsap === 'undefined') return;

  document.querySelectorAll('.grid-lines').forEach(el => {
    gsap.to(el, {
      opacity: 0.5,
      duration: 2,
      repeat: -1,
      yoyo: true,
      ease: 'sine.inOut'
    });
  });
}

/**
 * CTA banner — pulsující glow aura
 */
function initCtaBanner() {
  if (typeof gsap === 'undefined') return;

  document.querySelectorAll('.cta-banner').forEach(banner => {
    gsap.to(banner, {
      boxShadow: '0 0 80px rgba(124,111,255,0.12)',
      duration: 2.5,
      repeat: -1,
      yoyo: true,
      ease: 'sine.inOut'
    });
  });
}

/**
 * Nav logo — jemný pulse na dot
 */
function initLogoPulse() {
  if (typeof gsap === 'undefined') return;

  const dot = document.querySelector('.nav__logo-dot');
  if (!dot) return;

  gsap.to(dot, {
    scale: 1.4,
    opacity: 0.6,
    duration: 1.2,
    repeat: -1,
    yoyo: true,
    ease: 'sine.inOut'
  });
}

/**
 * Portfolio filtry — zmenšení nefiltrovaných karet
 * (Na portfolio.html — přebíjí inline script pokud existuje)
 */
function initPortfolioFilter() {
  const filterBtns = document.querySelectorAll('.filter-btn');
  const items      = document.querySelectorAll('.portfolio-item');
  if (!filterBtns.length) return;

  filterBtns.forEach(btn => {
    btn.addEventListener('click', () => {
      filterBtns.forEach(b => b.classList.remove('active'));
      btn.classList.add('active');

      const filter = btn.dataset.filter;

      items.forEach(item => {
        const match = filter === 'all' || item.dataset.category === filter;
        if (typeof gsap !== 'undefined') {
          gsap.to(item, {
            opacity: match ? 1 : 0.15,
            scale:   match ? 1 : 0.94,
            filter:  match ? 'grayscale(0%)' : 'grayscale(100%)',
            duration: 0.45,
            ease: 'power2.out'
          });
        }
      });
    });
  });
}

/**
 * FAQ Accordion — animovaný toggle
 */
function initFaq() {
  if (typeof gsap === 'undefined') return;

  document.querySelectorAll('details').forEach(d => {
    const icon = d.querySelector('summary span:last-child');
    d.addEventListener('toggle', () => {
      if (icon) {
        gsap.to(icon, {
          rotate: d.open ? 45 : 0,
          duration: 0.3,
          ease: 'power2.out'
        });
        icon.textContent = d.open ? '+' : '+';
      }
    });
  });
}

/**
 * Page transitions — jemný fade při odchodu ze stránky
 */
function initPageTransitions() {
  if (typeof gsap === 'undefined') return;

  document.querySelectorAll('a').forEach(link => {
    // Přeskočíme externí, anchor a mailto linky
    const href = link.getAttribute('href') || '';
    if (!href || href.startsWith('#') || href.startsWith('mailto') ||
        href.startsWith('tel') || href.startsWith('http')) return;

    link.addEventListener('click', e => {
      e.preventDefault();
      const target = link.href;

      gsap.to('body', {
        opacity: 0,
        duration: 0.35,
        ease: 'power2.in',
        onComplete: () => { window.location.href = target; }
      });
    });
  });

  // Fade-in při načtení stránky (pokud přišel po page transition)
  gsap.fromTo('body', { opacity: 0 }, { opacity: 1, duration: 0.5, ease: 'power2.out' });
}

/* ════════════════════════════════════════════════════════════
   18. INIT ORCHESTRATOR
   Pořadí inicializace je kritické pro výkon
   ════════════════════════════════════════════════════════════ */

(function init() {

  // Registrace GSAP pluginů — okamžitě
  if (typeof gsap !== 'undefined') {
    if (typeof ScrollTrigger !== 'undefined') {
      gsap.registerPlugin(ScrollTrigger);
      gsap.defaults({ ease: 'power3.out' });

      // Synchronizace ScrollTrigger s Lenis — re-sync na resize
      window.addEventListener('resize', debounce(() => ScrollTrigger.refresh(), 300));
    }
  }

  // Loader — první (blokuje overflow)
  Loader.init();

  // Device detection
  Device.init();

  // DOMContentLoaded — spouštíme ostatní moduly
  document.addEventListener('DOMContentLoaded', () => {

    // Základní UI
    Nav.init();

    // Smooth scroll (Lenis) — musí být před ScrollDistortion a Marquee
    SmoothScroll.init();

    // Cursor — po DOM ready
    CursorEngine.init();

    // Matrix canvas — pozadí
    //MatrixCanvas.init();

    // Scroll distortion — vyžaduje SmoothScroll
    ScrollDistortion.init();

    // GSAP animace — až po registraci ScrollTrigger
    if (typeof gsap !== 'undefined') {

      // Reveals a staggery
      Reveals.init();

      // Kinetická typografie + char split
      KineticType.init();

      // Counter
      Counter.init();

      // Marquee
      Marquee.init();

      // Parallax
      initParallax();

      // Přídavné efekty
      initGridLines();
      initCtaBanner();
      initLogoPulse();

      // ScrollTrigger refresh po plném načtení
      window.addEventListener('load', () => {
        ScrollTrigger.refresh();
        ScrollTrigger.sort();
      });
    }

    // Interakce
    CardInteractions.init();
    BASlider.init();
    ContactForm.init();
    initPortfolioFilter();
    initFaq();

    // Page transitions — jako poslední (přebíjí link click handlery)
    // initPageTransitions(); // Odkomentujte pokud chcete fade transitions

    // Re-bind cursor po vše inicializaci
    setTimeout(() => CursorEngine.refresh(), 800);

  });

})();