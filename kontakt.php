<!DOCTYPE html>
<html lang="cs">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <meta name="description" content="Kontaktujte Aurel DevStudio — Jiří Zlatník & Vilém Orálek. Nezávazná konzultace zdarma.">
  <title>Kontakt — Aurel DevStudio</title>

  <link rel="preconnect" href="https://fonts.googleapis.com">
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
  <link href="https://fonts.googleapis.com/css2?family=Space+Grotesk:wght@400;500;600;700&family=DM+Sans:ital,wght@0,400;0,500;0,600;1,400&family=JetBrains+Mono:wght@400;500&display=swap" rel="stylesheet">
    <!-- Lenis smooth scroll -->
    <script src="https://unpkg.com/lenis@1.1.13/dist/lenis.min.js"></script>
  <script src="https://cdnjs.cloudflare.com/ajax/libs/gsap/3.12.5/gsap.min.js" defer></script>
  <script src="https://cdnjs.cloudflare.com/ajax/libs/gsap/3.12.5/ScrollTrigger.min.js" defer></script>

  <link rel="stylesheet" href="style.css">
</head>
<body>

  <div id="loader">
    <div class="loader__logo">Aurel<span style="color:var(--clr-accent)">.</span></div>
    <div class="loader__bar"><div class="loader__fill"></div></div>
    <div class="loader__percent">0%</div>
  </div>

  <div class="noise-overlay" aria-hidden="true"></div>
  <canvas id="matrix-canvas" aria-hidden="true"></canvas>
  <div id="cursor-dot"  aria-hidden="true"></div>
  <div id="cursor-ring" aria-hidden="true"></div>

  <header class="nav" role="banner">
    <div class="container">
      <nav class="nav__inner" aria-label="Hlavní navigace">
        <a href="index.html" class="nav__logo">
          <span class="nav__logo-dot" aria-hidden="true"></span>
          Aurel DevStudio
        </a>
        <ul class="nav__links" role="list">
          <li><a href="index.html"    class="nav__link">Domů</a></li>
          <li><a href="proc-my.html"  class="nav__link">Proč my</a></li>
          <li><a href="portfolio.html" class="nav__link">Portfolio</a></li>
          <li><a href="kontakt.php"   class="nav__link active">Kontakt</a></li>
        </ul>
        <a href="#form" class="nav__cta">Napsat zprávu</a>
        <button class="nav__hamburger" aria-label="Otevřít menu">
          <span></span><span></span><span></span>
        </button>
      </nav>
    </div>
    <nav class="nav__mobile" aria-label="Mobilní navigace">
      <a href="index.html"    class="nav__link">Domů</a>
      <a href="proc-my.html"  class="nav__link">Proč my</a>
      <a href="portfolio.html" class="nav__link">Portfolio</a>
      <a href="kontakt.php"   class="nav__link">Kontakt</a>
      <a href="#form" class="btn btn--primary mt-md" data-magnetic>Napsat zprávu</a>
    </nav>
  </header>

  <main>

    <!-- ════════════════════════════════════════════
         PAGE HEADER
    ════════════════════════════════════════════ -->
    <section class="page-header" aria-labelledby="contact-title">
      <div class="grid-lines" aria-hidden="true"></div>
      <div class="hero__blob hero__blob--1" style="opacity:0.5" aria-hidden="true"></div>

      <div class="container">
        <div class="page-header__tag">
          <span class="hero__badge">
            <span class="hero__badge-dot" aria-hidden="true"></span>
            Pojďme spolupracovat
          </span>
        </div>
        <h1 id="contact-title" class="t-display hero__headline">
          <span class="line"><span class="line-inner">Napište nám.</span></span>
          <span class="line"><span class="line-inner"><span class="highlight">Odpovíme do 48h.</span></span></span>
        </h1>
        <p class="page-header__sub hero__sub">
          Nezávazná konzultace je zdarma. Podíváme se na váš projekt
          a sdělíme vám upřímný odhad nákladů a časového harmonogramu.
        </p>
      </div>
    </section>

    <!-- ════════════════════════════════════════════
         O NÁS + FORMULÁŘ
    ════════════════════════════════════════════ -->
    <section class="section" id="form" aria-labelledby="contact-form-heading">
      <div class="container">
        <div class="contact-split">

          <!-- LEVÝ SLOUPEC — O nás -->
          <div>

            <div class="section-label reveal">
              <span class="section-label__line" aria-hidden="true"></span>
              <span class="t-mono">Kdo jsme</span>
            </div>

            <h2 id="contact-form-heading" class="t-subheading reveal" data-decode style="font-size:1.5rem; margin-bottom: var(--sp-5)">
              Dva vývojáři.<br>Jedna vize.
            </h2>

            <p class="t-body t-muted reveal" style="margin-bottom: var(--sp-7)">
              Jsme Jiří a Vilém — dva vývojáři, kteří věří, že každý podnikatel
              si zaslouží špičkový web bez věčného předplatného.
              Specializujeme se na přepis šablonových webů do čistého,
              blazing-fast kódu.
            </p>

            <!-- Profily -->
            <div class="team-profiles">

              <div class="profile-card reveal" data-delay="0">
                <div class="profile-avatar" aria-label="Jiří Zlatník">JZ</div>
                <div class="profile-info">
                  <div class="profile-info__name">Jiří Zlatník</div>
                  <div class="profile-info__role">Co-founder · Lead Developer</div>
                  <p class="profile-info__bio">
                    Specializuji se na JavaScript, GSAP animace a performance optimalizaci.
                    Věřím, že web má být rychlý jako blesk a krásný jako umělecké dílo.
                  </p>
                </div>
              </div>

              <div class="profile-card reveal" data-delay="0.12">
                <div class="profile-avatar" aria-label="Vilém Orálek" style="background: linear-gradient(135deg, var(--clr-accent-2), #2dcc88)">VL</div>
                <div class="profile-info">
                  <div class="profile-info__name">Vilém Orálek</div>
                  <div class="profile-info__role">Co-founder · UI/UX & Frontend</div>
                  <p class="profile-info__bio">
                    Mám vášeň pro UI/UX design a pixel-perfect implementaci.
                    Každý detail musí sedět — od typografie po hover efekty.
                  </p>
                </div>
              </div>

            </div>

            <!-- Kontaktní info -->
            <div class="glass-card reveal mt-lg" style="padding: var(--sp-6)">
              <div class="t-mono mb-md" style="color:var(--clr-text-3)">Přímý kontakt</div>
              <div style="display:flex; flex-direction:column; gap:var(--sp-4)">
                <div style="display:flex; align-items:center; gap:var(--sp-3)">
                  <span aria-hidden="true" style="font-size:1.1rem">📧</span>
                  <a href="mailto:info@aureldevstudio.cz" style="font-size:0.9rem; color:var(--clr-accent)">
                    info@aureldevstudio.cz
                  </a>
                </div>
                <div style="display:flex; align-items:center; gap:var(--sp-3)">
                  <span aria-hidden="true" style="font-size:1.1rem">⚡</span>
                  <span style="font-size:0.875rem; color:var(--clr-text-2)">Odpovídáme do 48 hodin</span>
                </div>
                <div style="display:flex; align-items:center; gap:var(--sp-3)">
                  <span aria-hidden="true" style="font-size:1.1rem">🇨🇿</span>
                  <span style="font-size:0.875rem; color:var(--clr-text-2)">Česká republika</span>
                </div>
              </div>
            </div>

          </div>

          <!-- PRAVÝ SLOUPEC — Formulář -->
          <div class="reveal-right">
            <div class="contact-form" id="contact-form-wrap">

              <form id="contact-form" novalidate autocomplete="off" aria-label="Kontaktní formulář">

                <h3 class="t-subheading" style="margin-bottom: var(--sp-6); font-size:1.2rem">
                  Popište nám svůj projekt
                </h3>

                <!-- Jméno -->
                <div class="form-group">
                  <label for="name" class="form-label">Jméno a příjmení</label>
                  <input
                    type="text"
                    id="name"
                    name="name"
                    class="form-input"
                    placeholder="Jan Novák"
                    autocomplete="name"
                    required
                    minlength="2"
                    aria-describedby="name-error"
                  >
                  <div class="form-error" id="name-error" role="alert" aria-live="polite"></div>
                </div>

                <!-- Email -->
                <div class="form-group">
                  <label for="email" class="form-label">E-mailová adresa</label>
                  <input
                    type="email"
                    id="email"
                    name="email"
                    class="form-input"
                    placeholder="jan@priklad.cz"
                    autocomplete="email"
                    required
                    aria-describedby="email-error"
                  >
                  <div class="form-error" id="email-error" role="alert" aria-live="polite"></div>
                </div>

                <!-- Typ projektu -->
                <div class="form-group">
                  <label for="project_type" class="form-label">Typ projektu</label>
                  <select
                    id="project_type"
                    name="project_type"
                    class="form-input"
                    style="cursor:none"
                  >
                    <option value="">— Vyberte typ webu —</option>
                    <option value="landing">Digitální vizitka (6&nbsp;000–8&nbsp;000 Kč)</option>
                    <option value="web">Klasický web (10&nbsp;000–15&nbsp;000 Kč)</option>
                    <option value="redesign">Redesign zastaralého webu</option>
                    <option value="other">Jiné / Nejsem si jist/a</option>
                  </select>
                </div>

                <!-- Zpráva -->
                <div class="form-group">
                  <label for="message" class="form-label">Zpráva / popis projektu</label>
                  <textarea
                    id="message"
                    name="message"
                    class="form-textarea"
                    placeholder="Popište svůj projekt — máte stávající web? Jaký typ podnikání? Co očekáváte?"
                    required
                    minlength="10"
                    aria-describedby="message-error"
                  ></textarea>
                  <div class="form-error" id="message-error" role="alert" aria-live="polite"></div>
                </div>

                <!-- Anti-spam honeypot (skrytý pro boty) -->
                <div style="display:none" aria-hidden="true">
                  <input type="text" name="website" tabindex="-1" autocomplete="off">
                </div>

                <button type="submit" class="btn btn--primary form-submit" data-magnetic>
                  Odeslat zprávu
                  <svg class="btn__arrow" viewBox="0 0 16 16" fill="none" aria-hidden="true">
                    <path d="M3 8h10M9 4l4 4-4 4" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/>
                  </svg>
                </button>

                <p class="t-small t-muted mt-md" style="text-align:center">
                  Vaše data jsou v bezpečí. Nikdy je neposkytujeme třetím stranám.
                </p>

              </form>

              <!-- Success state (zobrazí se po odeslání) -->
              <div class="form-success" role="status" aria-live="polite">
                <div class="form-success__icon" aria-hidden="true">✓</div>
                <h3 class="t-subheading mb-md">Zpráva odeslána!</h3>
                <p class="t-body t-muted">
                  Děkujeme za vaši poptávku. Ozveme se vám do 48 hodin
                  s nezávaznou nabídkou.
                </p>
                <a href="portfolio.html" class="btn btn--ghost btn--sm mt-lg" data-magnetic>
                  Prohlédnout portfolio
                </a>
              </div>

            </div>
          </div>

        </div>
      </div>
    </section>

    <!-- ════════════════════════════════════════════
         FAQ
    ════════════════════════════════════════════ -->
    <section class="section" aria-labelledby="faq-heading">
      <div class="container">

        <div class="section-label reveal" style="justify-content:center">
          <span class="section-label__line" aria-hidden="true"></span>
          <span class="t-mono">Časté dotazy</span>
          <span class="section-label__line" aria-hidden="true"></span>
        </div>

        <h2 id="faq-heading" class="t-heading text-center reveal" data-decode>
          Máte otázky?
        </h2>

        <div style="max-width: 720px; margin: var(--sp-8) auto 0" data-stagger data-stagger-delay="0.1">

          <details class="glass-card reveal" style="margin-bottom: var(--sp-4)">
            <summary style="cursor:none; list-style:none; display:flex; justify-content:space-between; align-items:center; font-weight:600; font-family:var(--font-display); font-size:1rem">
              Jak dlouho trvá vytvoření webu?
              <span aria-hidden="true" style="color:var(--clr-accent); font-size:1.2rem; transition:transform 0.3s">+</span>
            </summary>
            <p class="t-body t-muted" style="margin-top:var(--sp-4)">
              Digitální vizitka (landing page) je hotová za 3–5 pracovních dní.
              Klasický vícestránkový web trvá 1–3 týdny v závislosti na rozsahu.
              O průběhu vás průběžně informujeme.
            </p>
          </details>

          <details class="glass-card reveal" style="margin-bottom: var(--sp-4)">
            <summary style="cursor:none; list-style:none; display:flex; justify-content:space-between; align-items:center; font-weight:600; font-family:var(--font-display); font-size:1rem">
              Co dostanu po dokončení projektu?
              <span aria-hidden="true" style="color:var(--clr-accent); font-size:1.2rem; transition:transform 0.3s">+</span>
            </summary>
            <p class="t-body t-muted" style="margin-top:var(--sp-4)">
              Dostanete kompletní zdrojový kód (HTML, CSS, JS, PHP) + nasazení
              na váš hosting + instrukce k použití. Web je 100% váš — bez
              jakékoli závislosti na nás nebo jiné platformě.
            </p>
          </details>

          <details class="glass-card reveal" style="margin-bottom: var(--sp-4)">
            <summary style="cursor:none; list-style:none; display:flex; justify-content:space-between; align-items:center; font-weight:600; font-family:var(--font-display); font-size:1rem">
              Mohu si pak web sám upravovat?
              <span aria-hidden="true" style="color:var(--clr-accent); font-size:1.2rem; transition:transform 0.3s">+</span>
            </summary>
            <p class="t-body t-muted" style="margin-top:var(--sp-4)">
              Ano. Zdrojový kód je čitatelný a dobře okomentovaný.
              Pokud nechcete upravovat kód sami, nabízíme dobrovolný balíček správy
              za 300 Kč/měs. — 1 hodina drobných úprav + správa domény.
            </p>
          </details>

          <details class="glass-card reveal" style="margin-bottom: var(--sp-4)">
            <summary style="cursor:none; list-style:none; display:flex; justify-content:space-between; align-items:center; font-weight:600; font-family:var(--font-display); font-size:1rem">
              Potřebuji mít stávající web na Wixu?
              <span aria-hidden="true" style="color:var(--clr-accent); font-size:1.2rem; transition:transform 0.3s">+</span>
            </summary>
            <p class="t-body t-muted" style="margin-top:var(--sp-4)">
              Vůbec ne. Přepíšeme existující web z libovolné platformy
              (Wix, Webnode, Squarespace, WordPress...) nebo vytvoříme
              nový web od základu podle vašich představ.
            </p>
          </details>

          <details class="glass-card reveal">
            <summary style="cursor:none; list-style:none; display:flex; justify-content:space-between; align-items:center; font-weight:600; font-family:var(--font-display); font-size:1rem">
              Kde bude web hostovaný?
              <span aria-hidden="true" style="color:var(--clr-accent); font-size:1.2rem; transition:transform 0.3s">+</span>
            </summary>
            <p class="t-body t-muted" style="margin-top:var(--sp-4)">
              Kdekoliv chcete. Doporučujeme české poskytovatele jako Wedos nebo
              Forpsi (cca 200–400 Kč/rok). Web nasadíme za vás — stačí si hosting
              předplatit.
            </p>
          </details>

        </div>
      </div>
    </section>

  </main>

  <footer class="footer" role="contentinfo">
    <div class="container">
      <div class="footer__inner">
        <div>
          <div class="footer__logo">
            <span class="nav__logo-dot" aria-hidden="true"></span>
            Aurel DevStudio
          </div>
          <p class="footer__desc">Přepisujeme šablonové weby do čistého kódu. Vlastněte svůj web.</p>
        </div>
        <div>
          <div class="footer__col-title">Navigace</div>
          <ul class="footer__links" role="list">
            <li><a href="index.html"    class="footer__link">Domů</a></li>
            <li><a href="proc-my.html"  class="footer__link">Proč my</a></li>
            <li><a href="portfolio.html" class="footer__link">Portfolio</a></li>
            <li><a href="kontakt.php"   class="footer__link">Kontakt</a></li>
          </ul>
        </div>
        <div>
          <div class="footer__col-title">Kontakt</div>
          <ul class="footer__links" role="list">
            <li><a href="mailto:info@aureldevstudio.cz" class="footer__link">info@aureldevstudio.cz</a></li>
            <li><span class="footer__link">Jiří Zlatník</span></li>
            <li><span class="footer__link">Vilém Orálek</span></li>
          </ul>
        </div>
      </div>
      <div class="footer__bottom">
        <span>© 2025 Aurel DevStudio. Všechna práva vyhrazena.</span>
        <span>Hand-coded with ♥ in Czech Republic</span>
      </div>
    </div>
  </footer>

<script src="script.js"></script>
  <script>
    /* ── FAQ toggle ikona ── */
    document.querySelectorAll('details').forEach(d => {
      d.addEventListener('toggle', () => {
        const icon = d.querySelector('summary span');
        if (icon) icon.textContent = d.open ? '−' : '+';
      });
    });
  </script>
</body>
</html>