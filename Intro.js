/**
 * ╔══════════════════════════════════════════════════════════════════════╗
 * ║   AUREL DEVSTUDIO — intro.js                                         ║
 * ║   "CODE GENESIS" — Cinematický intro film                            ║
 * ║   Autoři: Jiří Zlatník & Vilém Orálek                                ║
 * ║                                                                      ║
 * ║   Přidejte do index.html PŘED <script src="script.js">:              ║
 * ║   <script src="intro.js"></script>                                   ║
 * ╚══════════════════════════════════════════════════════════════════════╝
 *
 * ╔══════════════════════════════════════════════════════════════════════╗
 * ║  PROMĚNNÉ PRO TESTOVÁNÍ — upravte jen zde:                          ║
 * ║                                                                      ║
 * ║  INTRO_ALWAYS_SHOW = true   → intro se zobrazí VŽDY                 ║
 * ║                               (ignoruje session paměť, pro ladění)  ║
 * ║                                                                      ║
 * ║  INTRO_SPEED = 0.5          → animace 2× rychlejší (testování)      ║
 * ║  INTRO_SPEED = 1.0          → normální tempo (produkce)             ║
 * ║                                                                      ║
 * ║  Celkové trvání intro: ~5.2 s při INTRO_SPEED = 1.0                 ║
 * ║                         ~2.6 s při INTRO_SPEED = 0.5                ║
 * ╚══════════════════════════════════════════════════════════════════════╝
 */

'use strict';

/* ════════════════════════════════════════════════════════════════════
   ██  TESTOVACÍ KONFIGURACE — UPRAVTE ZDE
   ════════════════════════════════════════════════════════════════════ */

const INTRO_ALWAYS_SHOW = false;
//     ↑ Změňte na  TRUE  pokud chcete intro vidět při každém načtení
//       FALSE = intro se zobrazí pouze jednou za browserovou session

const INTRO_SPEED = 1.0;
//     ↑ Zrychlení animací. Doporučené hodnoty:
//       1.0 = produkce  |  0.5 = rychlé testování  |  0.4 = super rychlé

/* ════════════════════════════════════════════════════════════════════
   PRIVÁTNÍ KONSTANTY (neměňte pokud nevíte co děláte)
   ════════════════════════════════════════════════════════════════════ */

const _SESSION_KEY = 'aurel_intro_v2';
const _BG          = '#0a0a0c'; // přesná shoda s --clr-bg stránky
const _ACCENT      = '#7c6fff'; // --clr-accent
const _ACCENT_2    = '#5ef0c0'; // --clr-accent-2
const _TEXT        = '#e8e8f0'; // --clr-text

/* ════════════════════════════════════════════════════════════════════

   DailyIntro MODULE

   Název "DailyIntro" je VYŽADOVÁN existujícím Loader modulem
   v script.js — neměňte název objektu!

   Sekvence animace (při INTRO_SPEED = 1.0):
   ──────────────────────────────────────────
    0.0 s  │ Grid + canvas + rohy se vynoří
    0.4 s  │ Laserový scanner roste do šíře
    0.8 s  │ Scanner sestupuje přes celou stránku
    0.9 s  │ Code comment se vynoří
    1.0 s  │ Písmena A-U-R-E-L padají z výšky (stagger 0.1 s)
    2.0 s  │ Poslední písmeno dosedlo → scramble & glitch #1
    2.3 s  │ Linka + DevStudio + tagline
    3.6 s  │ Glitch #2 (chromatická aberace)
    3.8 s  │ Obsah mizí
    4.1 s  │ 5 panelů se odesouvá nahoru (stagger, expo)
    5.2 s  │ Hero sekvence startuje

   ════════════════════════════════════════════════════════════════════ */

const DailyIntro = (() => {

  /* ── Privátní stav ─────────────────────────────────────────────────── */
  let overlay    = null;
  let bgCanvas   = null;
  let bgCtx      = null;
  let rainRAF    = null;
  let mainTL     = null;
  let exiting    = false;

  const IS_MOBILE = window.innerWidth < 768 ||
                    window.matchMedia('(hover: none)').matches;

  /* ── Code rain tokeny — webdev flavour ───────────────────────────────
     Záměrně mícháme HTML, CSS, JS a dev-ops terminologii             */
  const TOKENS = [
    // JS / TS
    'const', 'let ⇒', 'async/await', 'Promise', 'fetch()',
    '.then()', 'import {', 'export', 'class', '() => {}',
    'useState()', 'useEffect()', 'querySelector', 'classList',
    'addEventListener', 'requestAnimationFrame', 'JSON.parse',
    'Array.from', '?.', '??', '...spread', 'typeof',
    // HTML
    '<!DOCTYPE>', '<html>', '<head>', '<body>', '<main>',
    '<div>', '<section>', '<article>', '<nav>', '<footer>',
    '<a href>', '<img />', '<link />', '<meta />', '<script>',
    // CSS
    'display: flex', 'grid-template', 'position: absolute',
    'transform:', 'transition:', 'z-index:', 'opacity:',
    ':root {', '@media', 'clamp()', 'var(--)', 'rem', 'vw',
    // Dev/Build
    'git commit', 'npm run build', 'localhost:3000',
    'webpack', 'vite.config', '.gitignore', '200 OK',
    'GET /', 'POST /', 'HEAD /', '304 Not Modified',
    // GSAP / specifické pro Aurel
    'gsap.to()', 'ScrollTrigger', 'lerp()', 'ease: power4',
    'index.html', 'style.css', 'script.js', '// Aurel',
    '/* vlastní kód */', '// žádné šablony', '// freedom',
  ];

  /* ════════════════════════════════════════════════════════════════════
     CSS INJEKCE
     Vkládáme styly přímo — žádný extra soubor není potřeba
     ════════════════════════════════════════════════════════════════════ */

  function injectCSS() {
    if (document.getElementById('aurel-intro-css')) return;

    const styleEl = document.createElement('style');
    styleEl.id = 'aurel-intro-css';
    styleEl.textContent = `

/* ══ Overlay wrapper ═══════════════════════════════════════════════ */
#site-intro {
  position: fixed; inset: 0; z-index: 99999;
  overflow: hidden; pointer-events: all;
  font-family: 'Space Grotesk', sans-serif;
  -webkit-font-smoothing: antialiased;
}

/* ══ 5 exit panels — tmavé pozadí, odesouvají se ═══════════════════ */
.ip-panels {
  position: absolute; inset: 0; display: flex; z-index: 1;
}
.ip-panel {
  flex: 1; height: 100%; background: ${_BG}; will-change: transform;
}

/* ══ Code rain canvas ═══════════════════════════════════════════════ */
#intro-bg-canvas {
  position: absolute; inset: 0; z-index: 2; opacity: 0;
}

/* ══ Grid overlay ═══════════════════════════════════════════════════ */
.ip-grid {
  position: absolute; inset: 0; z-index: 3; pointer-events: none;
  background-image:
    linear-gradient(rgba(124,111,255,.045) 1px, transparent 1px),
    linear-gradient(90deg, rgba(124,111,255,.045) 1px, transparent 1px);
  background-size: 80px 80px; opacity: 0;
}

/* ══ Vignette — tmavý rám ═══════════════════════════════════════════ */
.ip-vignette {
  position: absolute; inset: 0; z-index: 3; pointer-events: none;
  background: radial-gradient(ellipse 80% 80% at 50% 50%,
    transparent 40%, rgba(0,0,0,.55) 100%);
}

/* ══ CRT scanlines ══════════════════════════════════════════════════ */
.ip-scanlines {
  position: absolute; inset: 0; z-index: 18; pointer-events: none;
  background: repeating-linear-gradient(
    0deg, transparent, transparent 2px,
    rgba(0,0,0,.02) 2px, rgba(0,0,0,.02) 4px
  );
}

/* ══ Noise texture ══════════════════════════════════════════════════ */
.ip-noise {
  position: absolute; inset: 0; z-index: 19; pointer-events: none;
  opacity: .022;
  background-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='200' height='200'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='.85' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='200' height='200' filter='url(%23n)'/%3E%3C/svg%3E");
}

/* ══ Laser scanner line ═════════════════════════════════════════════ */
.ip-scanner {
  position: absolute; top: 0; left: 0; right: 0; height: 1px;
  z-index: 15; transform-origin: left; opacity: 0;
  background: linear-gradient(90deg,
    transparent 0%,
    rgba(124,111,255,.2) 10%,
    ${_ACCENT} 40%,
    rgba(200,185,255,1) 50%,
    ${_ACCENT} 60%,
    rgba(124,111,255,.2) 90%,
    transparent 100%
  );
  box-shadow:
    0 0 18px 4px rgba(124,111,255,.6),
    0 0 55px 10px rgba(124,111,255,.15),
    0 0 100px 20px rgba(124,111,255,.05);
}

/* ══ Corner dekorace ════════════════════════════════════════════════ */
.ip-corner {
  position: absolute; z-index: 9;
  font-family: 'JetBrains Mono', monospace;
  font-size: clamp(.65rem, 1.4vw, .95rem);
  color: rgba(124,111,255,.32); opacity: 0;
  line-height: 1.4; pointer-events: none; user-select: none;
}
.ip-corner span {
  display: block; font-size: .65em;
  color: rgba(124,111,255,.15); margin-top: 2px;
}
.ip-corner--tl { top: clamp(.8rem,2.5vw,1.8rem); left: clamp(.8rem,2.5vw,1.8rem); }
.ip-corner--tr { top: clamp(.8rem,2.5vw,1.8rem); right: clamp(.8rem,2.5vw,1.8rem); text-align: right; }
.ip-corner--bl { bottom: clamp(2.5rem,5vw,4rem); left: clamp(.8rem,2.5vw,1.8rem); }
.ip-corner--br { bottom: clamp(2.5rem,5vw,4rem); right: clamp(.8rem,2.5vw,1.8rem); text-align: right; }

/* ══ Horizontální měřítko (top + bottom) ═══════════════════════════ */
.ip-ruler {
  position: absolute; left: 0; right: 0; height: 1px;
  background: rgba(124,111,255,.08); z-index: 6;
  pointer-events: none; opacity: 0;
}
.ip-ruler--top    { top: clamp(3rem,6vw,5rem); }
.ip-ruler--bottom { bottom: clamp(3rem,6vw,5rem); }
.ip-ruler::before, .ip-ruler::after {
  content: ''; position: absolute; top: -3px;
  width: 7px; height: 7px;
  border: 1px solid rgba(124,111,255,.25);
  border-radius: 50%;
}
.ip-ruler::before { left: clamp(.8rem,2.5vw,1.8rem); }
.ip-ruler::after  { right: clamp(.8rem,2.5vw,1.8rem); }

/* ══ Hlavní obsah ═══════════════════════════════════════════════════ */
.ip-content {
  position: absolute; inset: 0; z-index: 8;
  display: flex; flex-direction: column;
  align-items: center; justify-content: center;
  pointer-events: none; user-select: none;
  padding: 1rem;
}

/* ══ Code comment nad headline ══════════════════════════════════════ */
.ip-code-label {
  font-family: 'JetBrains Mono', monospace;
  font-size: clamp(.48rem, 1.05vw, .72rem);
  color: rgba(124,111,255,.48);
  letter-spacing: .07em;
  margin-bottom: clamp(.5rem,1.6vw,1rem);
  /* počáteční stav nastavuje GSAP */
}

/* ══ AUREL — mega headline ══════════════════════════════════════════ */
.ip-headline {
  display: flex; align-items: baseline;
  line-height: .87;
  /* overflow: visible — písmena startují nad viewport */
}
.ip-letter {
  display: inline-block;
  font-family: 'Space Grotesk', sans-serif;
  font-size: clamp(5.5rem, 19.5vw, 17.5rem);
  font-weight: 700;
  letter-spacing: -.04em;
  color: ${_TEXT};
  line-height: .87;
  will-change: transform, opacity, filter;
  /* počáteční stav (y, opacity, filter) nastavuje GSAP */
}
.ip-letter:last-child { color: ${_ACCENT}; }

/* ══ Horizontální linka pod headline ════════════════════════════════ */
.ip-divider {
  height: 1px;
  background: linear-gradient(90deg,
    transparent, rgba(124,111,255,.5), rgba(94,240,192,.25), transparent
  );
  margin: clamp(.55rem,1.6vw,1.1rem) 0;
  /* width + opacity řídí GSAP */
}

/* ══ DevStudio podtexst ═════════════════════════════════════════════ */
.ip-sub {
  font-family: 'Space Grotesk', sans-serif;
  font-size: clamp(.68rem, 2vw, 1.15rem);
  font-weight: 600;
  letter-spacing: .34em;
  text-transform: uppercase;
  color: rgba(232,232,240,.55);
  /* opacity + y řídí GSAP */
}

/* ══ Tagline ════════════════════════════════════════════════════════ */
.ip-tagline {
  font-family: 'DM Sans', sans-serif;
  font-size: clamp(.55rem, 1.25vw, .82rem);
  color: rgba(232,232,240,.22);
  margin-top: clamp(.35rem,1vw,.7rem);
  letter-spacing: .055em;
  /* opacity řídí GSAP */
}

/* ══ Stavový řádek (dole uprostřed) ════════════════════════════════ */
.ip-status {
  position: absolute;
  bottom: clamp(.7rem,2.2vw,1.5rem); left: 50%;
  transform: translateX(-50%);
  z-index: 9;
  display: flex; align-items: center; gap: .5rem;
  font-family: 'JetBrains Mono', monospace;
  font-size: clamp(.45rem,.85vw,.62rem);
  color: rgba(232,232,240,.25);
  letter-spacing: .12em; white-space: nowrap;
  /* opacity řídí GSAP */
}
.ip-status-dot {
  width: 5px; height: 5px; border-radius: 50%;
  background: ${_ACCENT}; flex-shrink: 0;
  animation: ip-pulse 1.5s ease-in-out infinite;
}
@keyframes ip-pulse {
  0%,100% { opacity: 1; box-shadow: 0 0 0 0 rgba(124,111,255,.4); }
  50%      { opacity: .3; box-shadow: 0 0 0 4px transparent; }
}

/* ══ Skip tlačítko ══════════════════════════════════════════════════ */
.ip-skip {
  position: absolute;
  bottom: clamp(.7rem,2.2vw,1.5rem); right: clamp(.7rem,2.2vw,2rem);
  z-index: 25; pointer-events: all;
  font-family: 'JetBrains Mono', monospace;
  font-size: .58rem; letter-spacing: .11em;
  color: rgba(232,232,240,.18);
  background: none;
  border: 1px solid rgba(255,255,255,.05);
  border-radius: 3px; padding: .32rem .75rem;
  cursor: pointer;
  transition: color .22s, border-color .22s, background .22s;
  /* opacity řídí GSAP */
}
.ip-skip:hover {
  color: rgba(232,232,240,.6);
  border-color: rgba(124,111,255,.35);
  background: rgba(124,111,255,.06);
}
.ip-skip:focus-visible {
  outline: 2px solid ${_ACCENT}; outline-offset: 3px;
}

/* ══ Přechod panelů — světelná linka na hraně ═══════════════════════ */
.ip-panel::after {
  content: '';
  position: absolute; top: 0; right: 0;
  width: 1px; height: 100%;
  background: linear-gradient(180deg,
    transparent, rgba(124,111,255,.06) 30%,
    rgba(124,111,255,.06) 70%, transparent
  );
}

    `;
    document.head.appendChild(styleEl);
  }

  /* ════════════════════════════════════════════════════════════════════
     BUILD DOM
     ════════════════════════════════════════════════════════════════════ */

  function buildDOM() {
    overlay = document.createElement('div');
    overlay.id = 'site-intro';
    overlay.setAttribute('aria-hidden', 'true');
    overlay.setAttribute('role', 'presentation');

    overlay.innerHTML = `
      <!-- 5 tmavých panelů — kolektivně tvoří pozadí, odesouvají se nahoru při exitu -->
      <div class="ip-panels">
        <div class="ip-panel"></div>
        <div class="ip-panel"></div>
        <div class="ip-panel"></div>
        <div class="ip-panel"></div>
        <div class="ip-panel"></div>
      </div>

      <!-- Code rain canvas -->
      <canvas id="intro-bg-canvas"></canvas>

      <!-- Grid mřížka -->
      <div class="ip-grid"></div>

      <!-- Vignette -->
      <div class="ip-vignette"></div>

      <!-- CRT efekty -->
      <div class="ip-scanlines"></div>
      <div class="ip-noise"></div>

      <!-- Laserový scanner -->
      <div class="ip-scanner"></div>

      <!-- Horizontální měřítka -->
      <div class="ip-ruler ip-ruler--top"></div>
      <div class="ip-ruler ip-ruler--bottom"></div>

      <!-- Rohy: < html > / { } -->
      <div class="ip-corner ip-corner--tl">&lt;html&gt;<span>Aurel DevStudio</span></div>
      <div class="ip-corner ip-corner--tr">&lt;/html&gt;<span>v2025</span></div>
      <div class="ip-corner ip-corner--bl">{<span>vlastní kód</span></div>
      <div class="ip-corner ip-corner--br">}<span>zero subscriptions</span></div>

      <!-- Hlavní obsah (centrovano) -->
      <div class="ip-content">
        <div class="ip-code-label">&lt;!-- building something great... --&gt;</div>

        <div class="ip-headline" aria-label="Aurel">
          <span class="ip-letter">A</span>
          <span class="ip-letter">U</span>
          <span class="ip-letter">R</span>
          <span class="ip-letter">E</span>
          <span class="ip-letter">L</span>
        </div>

        <div class="ip-divider"></div>
        <div class="ip-sub">DevStudio</div>
        <div class="ip-tagline">Vlastní kód &nbsp;·&nbsp; Žádné šablony &nbsp;·&nbsp; Žádné předplatné</div>
      </div>

      <!-- Stavový řádek -->
      <div class="ip-status">
        <span class="ip-status-dot"></span>
        <span>aureldevstudio.cz</span>
      </div>

      <!-- Skip tlačítko -->
      <button class="ip-skip" type="button" aria-label="Přeskočit úvodní animaci">přeskočit →</button>
    `;

    // Vložit jako první dítě <body>
    document.body.insertBefore(overlay, document.body.firstChild);

    // Reference na canvas
    bgCanvas = document.getElementById('intro-bg-canvas');
    bgCtx    = bgCanvas.getContext('2d');

    // Skip button binding
    overlay.querySelector('.ip-skip')
      .addEventListener('click', skipIntro);
  }

  /* ════════════════════════════════════════════════════════════════════
     CODE RAIN CANVAS
     Webdev tokeny padají svisle — subtilní fialová tóna
     ════════════════════════════════════════════════════════════════════ */

  function initCodeRain() {
    const FONT_SIZE  = IS_MOBILE ? 9 : 11;
    const COL_STRIDE = IS_MOBILE ? 65 : 75;
    let cols = [];

    function resize() {
      bgCanvas.width  = window.innerWidth;
      bgCanvas.height = window.innerHeight;

      const count = Math.ceil(bgCanvas.width / COL_STRIDE);
      cols = Array.from({ length: count }, (_, i) => ({
        x:     i * COL_STRIDE + Math.random() * 18,
        y:     Math.random() * -bgCanvas.height * 1.5,
        speed: IS_MOBILE
               ? (.25 + Math.random() * .4)
               : (.35 + Math.random() * .65),
        token: TOKENS[Math.floor(Math.random() * TOKENS.length)],
        alpha: .035 + Math.random() * (IS_MOBILE ? .055 : .085),
        // Občasný "jasný" token pro hloubku
        bright: Math.random() < .08,
      }));
    }

    resize();
    window.addEventListener('resize', resize);

    function frame() {
      if (!bgCanvas.isConnected) return;
      bgCtx.clearRect(0, 0, bgCanvas.width, bgCanvas.height);
      bgCtx.font = `${FONT_SIZE}px 'JetBrains Mono', monospace`;

      cols.forEach(col => {
        const a = col.bright
          ? Math.min(col.alpha * 2.5, .22)
          : col.alpha;
        bgCtx.fillStyle = `rgba(124,111,255,${a})`;
        bgCtx.fillText(col.token, col.x, col.y);
        col.y += col.speed;

        if (col.y > bgCanvas.height + 50) {
          col.y     = -50;
          col.token  = TOKENS[Math.floor(Math.random() * TOKENS.length)];
          col.alpha  = .03 + Math.random() * .075;
          col.speed  = .35 + Math.random() * .65;
          col.bright = Math.random() < .08;
        }
      });

      rainRAF = requestAnimationFrame(frame);
    }
    frame();
  }

  /* ════════════════════════════════════════════════════════════════════
     LETTER SCRAMBLE
     Každé písmeno při "přistání" rychle proklikne náhodné znaky
     než se usadí na správném znaku — efekt digitální materializace
     ════════════════════════════════════════════════════════════════════ */

  function scrambleLetter(el, finalChar) {
    const SCRAMBLE_CHARS = '!@#$%<>/\\|&*{}[]0123456789?≈∑∆∏Ω';
    const ITERATIONS = IS_MOBILE ? 4 : 8;
    let count = 0;

    const iv = setInterval(() => {
      el.textContent = SCRAMBLE_CHARS[
        Math.floor(Math.random() * SCRAMBLE_CHARS.length)
      ];
      count++;
      if (count >= ITERATIONS) {
        el.textContent = finalChar;
        clearInterval(iv);
      }
    }, 30);
  }

  /* ════════════════════════════════════════════════════════════════════
     HLAVNÍ GSAP TIMELINE
     ════════════════════════════════════════════════════════════════════ */

  function buildTimeline() {
    const sp = INTRO_SPEED; // multiplikátor rychlosti

    /* ── Počáteční stavy (okamžité, před play()) ───────────────── */
    gsap.set('.ip-letter', {
      y: -(window.innerHeight * 1.2), // definitivně nad viewport
      opacity: 0,
      filter: 'blur(12px)',
    });
    gsap.set('.ip-code-label', { y: -10, opacity: 0 });
    gsap.set('.ip-sub',        { y: 16, opacity: 0 });
    gsap.set('.ip-tagline',    { opacity: 0 });
    gsap.set('.ip-divider',    { width: 0, opacity: 0 });
    gsap.set('.ip-skip',       { opacity: 0 });
    gsap.set([
      '.ip-grid', '#intro-bg-canvas', '.ip-corner',
      '.ip-status', '.ip-scanner',
      '.ip-ruler--top', '.ip-ruler--bottom',
    ], { opacity: 0 });

    /* ── Timeline ──────────────────────────────────────────────── */
    const tl = gsap.timeline({ paused: true });

    /* ─────────────────────────────────────────────────────────────
       FÁZE 1 — Prostředí se probudí (0s)
       Grid, canvas, rohy, měřítka
       ───────────────────────────────────────────────────────────── */

    // Grid mřížka
    tl.to('.ip-grid', {
      opacity: 1, duration: .8 * sp, ease: 'power2.out'
    }, 0);

    // Code rain canvas (pozvolné vynoření)
    tl.to('#intro-bg-canvas', {
      opacity: 1, duration: 1.6 * sp, ease: 'power2.out'
    }, .1 * sp);

    // Horizontální měřítka
    tl.to(['.ip-ruler--top', '.ip-ruler--bottom'], {
      opacity: 1, duration: .5 * sp, stagger: .08 * sp
    }, .1 * sp);

    // Rohy — TL, TR, BL, BR s kaskádou
    tl.to('.ip-corner', {
      opacity: 1, duration: .4 * sp,
      stagger: { each: .1 * sp, from: 'start' }
    }, .2 * sp);

    // Stavový řádek
    tl.to('.ip-status', { opacity: 1, duration: .4 * sp }, .35 * sp);

    /* ─────────────────────────────────────────────────────────────
       FÁZE 2 — Laserový scanner (0.4s)
       Nejdříve roste do šíře, pak sestupuje přes stránku
       ───────────────────────────────────────────────────────────── */

    tl.set('.ip-scanner', { opacity: 1, scaleX: 0, top: '0%' }, .4 * sp);

    // Scanner roste (scaleX 0 → 1)
    tl.to('.ip-scanner', {
      scaleX: 1, duration: .5 * sp, ease: 'power2.inOut'
    }, .4 * sp);

    // Scanner sestupuje (top 0% → 100%)
    tl.to('.ip-scanner', {
      top: '100%', duration: .72 * sp, ease: 'power1.inOut'
    }, .88 * sp);

    // Scanner zhasne
    tl.to('.ip-scanner', {
      opacity: 0, duration: .25 * sp
    }, 1.55 * sp);

    /* ─────────────────────────────────────────────────────────────
       FÁZE 3 — Code comment (0.85s)
       ───────────────────────────────────────────────────────────── */

    tl.to('.ip-code-label', {
      y: 0, opacity: 1, duration: .5 * sp, ease: 'power3.out'
    }, .85 * sp);

    /* ─────────────────────────────────────────────────────────────
       FÁZE 4 — AUREL písmena padají z výšky (1.0s)
       Stagger 0.1s, každé s rozostřením → ostrost
       Scramble se spouští těsně před dopádem
       ───────────────────────────────────────────────────────────── */

    tl.to('.ip-letter', {
      y: 0,
      opacity: 1,
      filter: 'blur(0px)',
      duration: .72 * sp,
      stagger: { each: .1 * sp, ease: 'power1.inOut' },
      ease: 'power4.out',
    }, 1.0 * sp);

    // Scramble efekt — každé písmeno zvlášť
    const FINALS = ['A', 'U', 'R', 'E', 'L'];
    const letterEls = overlay.querySelectorAll('.ip-letter');
    letterEls.forEach((el, i) => {
      // spustíme 0.18s před tím, než písmeno dosedne
      const landTime = (1.0 + i * .1 + .72 - .22) * sp;
      tl.call(() => scrambleLetter(el, FINALS[i]), null, landTime);
    });

    /* ─────────────────────────────────────────────────────────────
       FÁZE 4b — Glitch #1 (po dopadu posledního písmene)
       Pozicový posun + chromatická aberace (textShadow)
       ───────────────────────────────────────────────────────────── */

    // Čas dopadu posledního písmene: (1.0 + 0.4 + 0.72) * sp = 2.12 * sp
    const g1Start = 2.12 * sp + .15;

    tl.to('.ip-letter', {
      textShadow: '-4px 0 rgba(255,45,100,.8), 4px 0 rgba(0,225,255,.8)',
      x: () => (Math.random() - .5) * 9,
      duration: .05, stagger: .014, ease: 'none',
    }, g1Start);

    tl.to('.ip-letter', {
      textShadow: '0 0 transparent', x: 0,
      duration: .09, ease: 'power2.out',
    }, g1Start + .1);

    /* ─────────────────────────────────────────────────────────────
       FÁZE 5 — DevStudio + tagline + skip (po glitch #1)
       ───────────────────────────────────────────────────────────── */

    const afterG1 = g1Start + .22;

    // Linka se rozrůstá
    tl.to('.ip-divider', {
      width: IS_MOBILE ? 'min(70vw, 280px)' : 'min(52vw, 400px)',
      opacity: 1,
      duration: .65 * sp, ease: 'power3.out'
    }, afterG1);

    // DevStudio
    tl.to('.ip-sub', {
      y: 0, opacity: 1,
      duration: .6 * sp, ease: 'power3.out'
    }, afterG1 + .08 * sp);

    // Tagline
    tl.to('.ip-tagline', {
      opacity: 1, duration: .5 * sp
    }, afterG1 + .28 * sp);

    // Skip button
    tl.to('.ip-skip', { opacity: 1, duration: .4 * sp }, afterG1 + .15 * sp);

    /* ─────────────────────────────────────────────────────────────
       PAUZA — divák si může přečíst
       holdDur: min 0.7s (i při high-speed testování)
       ───────────────────────────────────────────────────────────── */

    const holdDuration = Math.max(.7, .95 * sp);
    const holdEnd      = afterG1 + .65 * sp + holdDuration;

    /* ─────────────────────────────────────────────────────────────
       FÁZE 6 — Glitch #2 těsně před exitem (dramatičtější)
       ───────────────────────────────────────────────────────────── */

    const g2Start = holdEnd - .28;

    tl.to('.ip-letter', {
      textShadow: '-7px 0 rgba(255,45,100,.95), 7px 0 rgba(0,225,255,.95)',
      x:     () => (Math.random() - .5) * 16,
      skewX: () => (Math.random() - .5) * 5,
      duration: .04, stagger: .01, ease: 'none',
    }, g2Start);

    tl.to('.ip-letter', {
      textShadow: '0 0 transparent', x: 0, skewX: 0,
      duration: .07, ease: 'power2.out'
    }, g2Start + .09);

    /* ─────────────────────────────────────────────────────────────
       FÁZE 7 — Exit obsahu (holdEnd)
       ───────────────────────────────────────────────────────────── */

    tl.to([
      '.ip-content', '.ip-status', '.ip-skip',
      '.ip-corner', '.ip-grid', '.ip-ruler--top', '.ip-ruler--bottom',
    ], {
      opacity: 0, duration: .38 * sp, ease: 'power2.in'
    }, holdEnd);

    tl.to('#intro-bg-canvas', {
      opacity: 0, duration: .38 * sp, ease: 'power2.in'
    }, holdEnd);

    /* ─────────────────────────────────────────────────────────────
       FÁZE 8 — Panelovitý wipe nahoru (holdEnd + 0.22s)
       5 panelů se odsune nahoru se stagger → diagonální odhalení
       Panely panely pod panely → hero page se odhaluje zprava doleva
       ───────────────────────────────────────────────────────────── */

    const wipeStart = holdEnd + .22 * sp;
    const wipeDur   = .92 * sp;
    const wipeEnd   = wipeStart + wipeDur + (.07 * sp * 4); // posl. panel

    tl.fromTo('.ip-panel',
      { yPercent: 0 },
      {
        yPercent: -106,
        stagger: { each: .07 * sp, from: 'start' },
        duration: wipeDur,
        ease: 'expo.inOut',
      },
      wipeStart
    );

    /* ─────────────────────────────────────────────────────────────
       FÁZE 9 — Finalizace
       ───────────────────────────────────────────────────────────── */

    tl.call(finalize, null, wipeEnd + .04);

    return tl;
  }

  /* ════════════════════════════════════════════════════════════════════
     FINALIZACE — uklidíme a spustíme hero
     ════════════════════════════════════════════════════════════════════ */

  function finalize() {
    cancelAnimationFrame(rainRAF);
    if (overlay) overlay.style.display = 'none';
    document.body.style.overflow = '';

    if (typeof HeroSequence !== 'undefined') {
      HeroSequence.play();
    }
  }

  /* ════════════════════════════════════════════════════════════════════
     SKIP INTRO — pro netrpělivé
     ════════════════════════════════════════════════════════════════════ */

  function skipIntro() {
    if (exiting) return;
    exiting = true;

    if (mainTL) mainTL.kill();
    cancelAnimationFrame(rainRAF);

    // Rychlý panel exit
    gsap.fromTo('.ip-panel',
      { yPercent: 0 },
      {
        yPercent: -106,
        stagger: .04,
        duration: .55,
        ease: 'expo.inOut',
        onComplete: finalize,
      }
    );
  }

  /* ════════════════════════════════════════════════════════════════════
     INIT — vstupní bod
     Voláno z Loader.reveal() v script.js — neměňte signaturu!
     ════════════════════════════════════════════════════════════════════ */

  function init() {

    /* ── Session check ─────────────────────────────────────────── */
    if (!INTRO_ALWAYS_SHOW) {
      if (sessionStorage.getItem(_SESSION_KEY)) {
        // Intro už bylo zobrazeno v této session → přeskočíme rovnou na hero
        document.body.style.overflow = '';
        if (typeof HeroSequence !== 'undefined') HeroSequence.play();
        return;
      }
    }

    // Zapíšeme do session (i před přehráním, pro případ rychlé navigace)
    sessionStorage.setItem(_SESSION_KEY, '1');

    // Uzamkneme scroll na dobu intro
    document.body.style.overflow = 'hidden';

    // Sestavíme DOM + CSS
    injectCSS();
    buildDOM();

    // Spustíme code rain hned
    initCodeRain();

    // Počkáme 2 framy — GSAP pluginy musí být zaregistrovány
    requestAnimationFrame(() => requestAnimationFrame(() => {
      if (typeof gsap === 'undefined') {
        // GSAP ještě není → fallback (nemělo by nastat za normálních okolností)
        finalize();
        return;
      }
      mainTL = buildTimeline();
      mainTL.play();
    }));
  }

  /* Veřejné API */
  return { init };

})();