/* ============================================================
   PROLANS — Efeitos Tecnológicos
   Partículas conectadas + cursor glow + parallax 3D + scan lines
   ============================================================ */
(function () {
  "use strict";

  const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  // Detecta dispositivo SEM mouse (true touch device). Em laptops Windows
  // com touchscreen + mouse, isso volta false (porque o sistema reporta hover).
  const noHover = window.matchMedia("(hover: none) and (pointer: coarse)").matches;
  const isTouch = noHover;

  /* ----------------------------------------------------------
     1) PARTÍCULAS CONECTADAS (canvas)
     ---------------------------------------------------------- */
  function initParticles() {
    if (reduceMotion) return;
    // Desativa em telas muito pequenas/touch — economiza bateria e CPU
    if (isTouch && window.innerWidth < 600) return;
    const canvas = document.getElementById("fx-particles");
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    let w, h, particles, raf;
    const DPR = Math.min(window.devicePixelRatio || 1, isTouch ? 1.5 : 2);

    const COUNT = window.innerWidth < 768 ? (isTouch ? 22 : 35) : 70;
    const LINK_DIST = 140;
    const SPEED = 0.35;

    function resize() {
      w = canvas.width = window.innerWidth * DPR;
      h = canvas.height = window.innerHeight * DPR;
      canvas.style.width = window.innerWidth + "px";
      canvas.style.height = window.innerHeight + "px";
    }
    function spawn() {
      particles = Array.from({ length: COUNT }, () => ({
        x: Math.random() * w,
        y: Math.random() * h,
        vx: (Math.random() - 0.5) * SPEED * DPR,
        vy: (Math.random() - 0.5) * SPEED * DPR,
        r: (Math.random() * 1.6 + 0.6) * DPR
      }));
    }
    function step() {
      ctx.clearRect(0, 0, w, h);

      // Movimento + draw
      for (const p of particles) {
        p.x += p.vx; p.y += p.vy;
        if (p.x < 0 || p.x > w) p.vx *= -1;
        if (p.y < 0 || p.y > h) p.vy *= -1;
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2);
        ctx.fillStyle = "rgba(0, 212, 255, 0.55)";
        ctx.fill();
      }
      // Conexões
      const linkPx = LINK_DIST * DPR;
      for (let i = 0; i < particles.length; i++) {
        for (let j = i + 1; j < particles.length; j++) {
          const a = particles[i], b = particles[j];
          const dx = a.x - b.x, dy = a.y - b.y;
          const d = Math.sqrt(dx * dx + dy * dy);
          if (d < linkPx) {
            const alpha = (1 - d / linkPx) * 0.22;
            ctx.strokeStyle = `rgba(0, 212, 255, ${alpha})`;
            ctx.lineWidth = DPR;
            ctx.beginPath();
            ctx.moveTo(a.x, a.y); ctx.lineTo(b.x, b.y); ctx.stroke();
          }
        }
      }
      raf = requestAnimationFrame(step);
    }

    resize(); spawn(); step();
    window.addEventListener("resize", () => { cancelAnimationFrame(raf); resize(); spawn(); step(); });
  }

  /* ----------------------------------------------------------
     2) CURSOR TECNOLÓGICO (mira / crosshair / HUD)
     ---------------------------------------------------------- */
  /* O cursor nativo do Windows continua sempre visível.
     Esta função só desenha um overlay decorativo (crosshair) que segue
     o ponteiro com lag suave — nunca escondemos o cursor do sistema. */
  function initCursor() {
    if (noHover) return;  // Só sai em dispositivos REALMENTE sem mouse (touch-only)

    const cursor = document.createElement("div");
    cursor.className = "fx-cursor";
    cursor.innerHTML = `
      <svg viewBox="0 0 56 56" aria-hidden="true">
        <circle class="cx-glow" cx="28" cy="28" r="24" />
        <circle class="cx-ring" cx="28" cy="28" r="20" />
        <path class="cx-bracket tl" d="M6 14 L6 6 L14 6" />
        <path class="cx-bracket tr" d="M42 6 L50 6 L50 14" />
        <path class="cx-bracket bl" d="M6 42 L6 50 L14 50" />
        <path class="cx-bracket br" d="M42 50 L50 50 L50 42" />
        <line class="cx-h" x1="20" y1="28" x2="24" y2="28" />
        <line class="cx-h" x1="32" y1="28" x2="36" y2="28" />
        <line class="cx-v" x1="28" y1="20" x2="28" y2="24" />
        <line class="cx-v" x1="28" y1="32" x2="28" y2="36" />
      </svg>
    `;
    const trail = document.createElement("div");
    trail.className = "fx-cursor-trail";
    document.body.appendChild(cursor);
    document.body.appendChild(trail);

    let mx = window.innerWidth / 2, my = window.innerHeight / 2;
    let cx = mx, cy = my, tx = mx, ty = my;
    cursor.style.transform = `translate(${cx}px, ${cy}px)`;
    trail.style.transform = `translate(${tx}px, ${ty}px)`;

    const onMove = (e) => { mx = e.clientX; my = e.clientY; };
    window.addEventListener("pointermove", onMove, { passive: true });
    window.addEventListener("mousemove", onMove, { passive: true });
    window.addEventListener("mouseover", onMove, { passive: true });

    window.addEventListener("mousedown", () => cursor.classList.add("press"));
    window.addEventListener("mouseup", () => cursor.classList.remove("press"));

    function loop() {
      cx += (mx - cx) * 0.35;
      cy += (my - cy) * 0.35;
      tx += (mx - tx) * 0.15;
      ty += (my - ty) * 0.15;
      cursor.style.transform = `translate(${cx}px, ${cy}px)`;
      trail.style.transform = `translate(${tx}px, ${ty}px)`;
      requestAnimationFrame(loop);
    }
    loop();

    const HOVER_SEL = "a, button, .card, input, select, textarea, .filter-chip, .btn, label, .faq-q";
    document.addEventListener("mouseover", (e) => {
      if (e.target.closest && e.target.closest(HOVER_SEL)) cursor.classList.add("hover");
    });
    document.addEventListener("mouseout", (e) => {
      if (e.target.closest && e.target.closest(HOVER_SEL)) cursor.classList.remove("hover");
    });
  }

  /* ----------------------------------------------------------
     3) PARALLAX 3D no HERO (cards flutuantes seguem o mouse)
     ---------------------------------------------------------- */
  function initParallax() {
    if (reduceMotion || isTouch) return;
    const stage = document.querySelector(".hero-visual");
    if (!stage) return;
    const layers = stage.querySelectorAll("[data-depth]");
    let tx = 0, ty = 0, cx = 0, cy = 0;

    stage.addEventListener("mousemove", (e) => {
      const r = stage.getBoundingClientRect();
      tx = ((e.clientX - r.left) / r.width - 0.5) * 2;
      ty = ((e.clientY - r.top) / r.height - 0.5) * 2;
    });
    stage.addEventListener("mouseleave", () => { tx = 0; ty = 0; });

    function tick() {
      cx += (tx - cx) * 0.08;
      cy += (ty - cy) * 0.08;
      layers.forEach(el => {
        const d = parseFloat(el.dataset.depth) || 10;
        el.style.transform = `translate3d(${cx * d}px, ${cy * d}px, 0)`;
      });
      requestAnimationFrame(tick);
    }
    tick();
  }

  /* ----------------------------------------------------------
     4) TILT 3D em qualquer .tilt
     ---------------------------------------------------------- */
  function initTilt() {
    if (reduceMotion || isTouch) return;
    document.querySelectorAll(".tilt").forEach(el => {
      el.addEventListener("mousemove", (e) => {
        const r = el.getBoundingClientRect();
        const px = (e.clientX - r.left) / r.width;
        const py = (e.clientY - r.top) / r.height;
        const rx = (0.5 - py) * 8;
        const ry = (px - 0.5) * 10;
        el.style.transform = `perspective(900px) rotateX(${rx}deg) rotateY(${ry}deg) translateZ(0)`;
      });
      el.addEventListener("mouseleave", () => { el.style.transform = ""; });
    });
  }

  /* ----------------------------------------------------------
     5) TERMINAL TYPING (sequência de comandos animada)
     ---------------------------------------------------------- */
  function initTerminal() {
    const term = document.getElementById("fx-terminal");
    if (!term) return;
    const lines = JSON.parse(term.dataset.lines || "[]");
    const out = term.querySelector(".term-out");
    let i = 0, j = 0, currentSpan;

    function nextLine() {
      if (i >= lines.length) { setTimeout(restart, 6000); return; }
      const line = lines[i];
      currentSpan = document.createElement("div");
      currentSpan.className = "term-line " + (line.t || "");
      if (line.prefix !== false) {
        const pf = document.createElement("span");
        pf.className = "term-pf";
        pf.textContent = line.prefix || "$";
        currentSpan.appendChild(pf);
      }
      const txt = document.createElement("span");
      txt.className = "term-txt";
      currentSpan.appendChild(txt);
      out.appendChild(currentSpan);
      out.scrollTop = out.scrollHeight;
      j = 0; typeChar(txt, line.text || "", () => {
        i++; setTimeout(nextLine, line.pause || 350);
      });
    }
    function typeChar(el, txt, done) {
      if (j >= txt.length) { done(); return; }
      el.textContent += txt[j++];
      setTimeout(() => typeChar(el, txt, done), 18 + Math.random() * 24);
    }
    function restart() {
      out.innerHTML = ""; i = 0; nextLine();
    }
    nextLine();
  }

  /* ----------------------------------------------------------
     6) MAGNETIC BUTTONS (botões "atraídos" pelo mouse)
     ---------------------------------------------------------- */
  function initMagnetic() {
    if (reduceMotion || isTouch) return;
    document.querySelectorAll(".magnetic").forEach(btn => {
      btn.addEventListener("mousemove", (e) => {
        const r = btn.getBoundingClientRect();
        const x = (e.clientX - r.left - r.width / 2) * 0.25;
        const y = (e.clientY - r.top - r.height / 2) * 0.4;
        btn.style.transform = `translate(${x}px, ${y}px)`;
      });
      btn.addEventListener("mouseleave", () => { btn.style.transform = ""; });
    });
  }

  /* ----------------------------------------------------------
     7) SCROLL PROGRESS BAR
     ---------------------------------------------------------- */
  function initScrollProgress() {
    const bar = document.getElementById("fx-progress");
    if (!bar) return;
    function update() {
      const h = document.documentElement;
      const max = h.scrollHeight - h.clientHeight;
      const p = max > 0 ? (window.scrollY / max) * 100 : 0;
      bar.style.width = p + "%";
    }
    update();
    window.addEventListener("scroll", update, { passive: true });
  }

  /* ----------------------------------------------------------
     8) GOOGLE ADS / PIXEL HOOK
     ---------------------------------------------------------- */
  window.prolansTrack = function (event, params) {
    if (typeof window.gtag === "function") {
      window.gtag("event", event, params || {});
    }
    // Fallback log no console (apenas em DEV)
    if (location.hostname === "localhost") console.log("[track]", event, params);
  };

  /* ----------------------------------------------------------
     9) PATTERN DE ÍCONES TECNOLÓGICOS NO BACKGROUND
        Câmeras, alarmes, escudos, fechaduras se desenhando
     ---------------------------------------------------------- */
  function initSecurityPattern() {
    if (document.querySelector(".fx-pattern")) return;

    // Biblioteca de ícones (24x24 viewBox) — só os pedidos
    const ICONS = {
      // 1. Câmera de segurança
      camera:  '<rect x="2" y="6" width="14" height="12" rx="2"/><path d="M22 8l-6 4 6 4z"/><circle cx="9" cy="12" r="2"/>',
      // 2. Sirene de alarme
      siren:   '<path d="M3 18a9 9 0 0 1 18 0"/><rect x="2" y="18" width="20" height="3" rx="1"/><line x1="5" y1="6" x2="3" y2="4"/><line x1="19" y1="6" x2="21" y2="4"/><line x1="12" y1="3" x2="12" y2="6"/><circle cx="12" cy="13" r="2"/>',
      // 3. Frente de uma casa desenhada
      house:   '<path d="M3 12 L12 3 L21 12"/><path d="M5 11v10h14V11"/><rect x="10" y="14" width="4" height="7"/><line x1="12" y1="14" x2="12" y2="21"/><rect x="6.5" y="13" width="2.5" height="3"/><rect x="15" y="13" width="2.5" height="3"/>',
      // 4. Pessoas
      person:  '<circle cx="12" cy="7" r="3"/><path d="M5 21v-2a7 7 0 0 1 14 0v2"/>',
      // 5. Sinal de Wi-Fi
      wifi:    '<path d="M5 12.55a11 11 0 0 1 14 0"/><path d="M1.4 9a16 16 0 0 1 21.2 0"/><path d="M8.5 16.1a6 6 0 0 1 7 0"/><circle cx="12" cy="20" r="0.8"/>',
      // 6. Fechadura digital (com teclado)
      digital: '<rect x="3" y="11" width="18" height="11" rx="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/><circle cx="9" cy="15" r="0.6"/><circle cx="12" cy="15" r="0.6"/><circle cx="15" cy="15" r="0.6"/><circle cx="9" cy="18" r="0.6"/><circle cx="12" cy="18" r="0.6"/><circle cx="15" cy="18" r="0.6"/>',
      // 7. Roteador
      router:  '<rect x="3" y="13" width="18" height="6" rx="1.5"/><circle cx="7" cy="16" r="0.7"/><circle cx="10" cy="16" r="0.7"/><path d="M5 11a7 7 0 0 1 14 0"/><path d="M8.5 11a3.5 3.5 0 0 1 7 0"/>',
      // 8. Escudo de proteção (com check)
      shield:  '<path d="M12 2l8 4v6c0 5-3.5 9-8 10-4.5-1-8-5-8-10V6z"/><path d="M9 12l2 2 4-4"/>',
      // 9. Cadeado
      padlock: '<rect x="5" y="11" width="14" height="10" rx="2"/><path d="M8 11V7a4 4 0 0 1 8 0v4"/><circle cx="12" cy="16" r="1"/>',
      // 10. Joia/dedo (digital biométrica em superfície bombada)
      finger:  '<path d="M5 11C5 7.13 8.13 4 12 4s7 3.13 7 7v4"/><path d="M8 13c0-2 2-4 4-4s4 2 4 4"/><path d="M10 15c0-1 1-2 2-2s2 1 2 2"/><path d="M12 17v4"/><path d="M5 14c0 3 1 5 2 7"/><path d="M19 14c0 3-1 5-2 7"/>'
    };
    const KEYS = Object.keys(ICONS);

    const wrap = document.createElement("div");
    wrap.className = "fx-pattern";
    wrap.setAttribute("aria-hidden", "true");
    document.body.appendChild(wrap);

    const scan = document.createElement("div");
    scan.className = "fx-scanline";
    document.body.appendChild(scan);

    if (reduceMotion) return;

    // Quantidade de ícones simultâneos: respeitando largura para evitar aperto
    const COUNT = window.innerWidth < 768 ? 5 : 8;
    const CYCLE_MIN = 6500;
    const CYCLE_MAX = 9500;
    const PAUSE_MIN = 200;
    const PAUSE_MAX = 1200;
    const PAD_PCT   = 3;       // espaçamento mínimo entre ícones (%)

    function rand(min, max) { return min + Math.random() * (max - min); }
    function pickKey(prev) {
      let k = KEYS[Math.floor(Math.random() * KEYS.length)];
      if (k === prev && KEYS.length > 1) return pickKey(prev);
      return k;
    }

    /* ----- Reserva espacial: impede sobreposição ----- */
    const liveBoxes = new Map(); // el -> { x, y, w, h }  (em %)

    function intersects(a, b, pad) {
      return !(a.x + a.w + pad < b.x ||
               b.x + b.w + pad < a.x ||
               a.y + a.h + pad < b.y ||
               b.y + b.h + pad < a.y);
    }
    function findFreeSpot(sizePx) {
      const W = window.innerWidth, H = window.innerHeight;
      const wPct = (sizePx / W) * 100;
      const hPct = (sizePx / H) * 100;
      const margin = 1.5;
      for (let i = 0; i < 120; i++) {
        const x = rand(margin, 100 - margin - wPct);
        const y = rand(margin, 100 - margin - hPct);
        const box = { x, y, w: wPct, h: hPct };
        let hit = false;
        for (const b of liveBoxes.values()) {
          if (intersects(box, b, PAD_PCT)) { hit = true; break; }
        }
        if (!hit) return box;
      }
      return null; // sem espaço disponível
    }

    function cycleIcon(el, prevKey) {
      // Libera o espaço anterior antes de procurar novo
      liveBoxes.delete(el);

      const cycle = Math.round(rand(CYCLE_MIN, CYCLE_MAX));
      const sizePx = Math.round(rand(58, 100));
      const spot = findFreeSpot(sizePx);

      if (!spot) {
        // Não achou local livre — tenta de novo logo em breve
        setTimeout(() => cycleIcon(el, prevKey), 700);
        return;
      }

      liveBoxes.set(el, spot);

      const rot = Math.round(rand(-12, 12));
      const key = pickKey(prevKey);

      el.classList.remove("drawing");
      void el.offsetWidth; // força reflow

      el.style.left = spot.x + "%";
      el.style.top = spot.y + "%";
      el.style.width = sizePx + "px";
      el.style.height = sizePx + "px";
      el.style.setProperty("--rot", rot + "deg");
      el.style.setProperty("--cycle", cycle + "ms");
      el.innerHTML = `<svg viewBox="0 0 24 24" aria-hidden="true">${ICONS[key]}</svg>`;

      requestAnimationFrame(() => el.classList.add("drawing"));

      setTimeout(() => {
        setTimeout(() => cycleIcon(el, key), Math.round(rand(PAUSE_MIN, PAUSE_MAX)));
      }, cycle);
    }

    // Inicia os ícones com delay escalonado
    for (let i = 0; i < COUNT; i++) {
      const el = document.createElement("div");
      el.className = "fx-icon";
      wrap.appendChild(el);
      setTimeout(() => cycleIcon(el, null), i * 700 + rand(0, 400));
    }

    // Ao redimensionar a janela, recalcula caixas em %
    let resizeTimer;
    window.addEventListener("resize", () => {
      clearTimeout(resizeTimer);
      resizeTimer = setTimeout(() => {
        // Recalcula bboxes já vivos a partir do tamanho atual
        liveBoxes.forEach((box, el) => {
          const W = window.innerWidth, H = window.innerHeight;
          const sizePx = el.offsetWidth || 80;
          box.w = (sizePx / W) * 100;
          box.h = (sizePx / H) * 100;
        });
      }, 250);
    });
  }

  /* ---------------------------------------------------------- */
  document.addEventListener("DOMContentLoaded", () => {
    initSecurityPattern();
    initParticles();
    initCursor();
    initParallax();
    initTilt();
    initTerminal();
    initMagnetic();
    initScrollProgress();
  });
})();
