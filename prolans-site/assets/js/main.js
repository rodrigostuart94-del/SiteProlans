/* ============================================================
   PROLANS — main.js
   Header scroll, mobile menu, reveal-on-scroll, micro animações
   ============================================================ */
(function () {
  "use strict";

  // ----- Header scroll
  const header = document.querySelector(".header");
  if (header) {
    const onScroll = () => header.classList.toggle("scrolled", window.scrollY > 8);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
  }

  // ----- Mobile menu
  const toggle = document.querySelector(".mobile-toggle");
  const nav = document.querySelector(".nav");
  if (toggle && nav) {
    toggle.addEventListener("click", () => nav.classList.toggle("open"));
    nav.querySelectorAll("a").forEach(a => a.addEventListener("click", () => nav.classList.remove("open")));
  }

  // ----- Highlight active nav link
  const path = location.pathname.split("/").pop() || "index.html";
  document.querySelectorAll(".nav a").forEach(a => {
    const href = a.getAttribute("href");
    if (href === path) a.classList.add("active");
  });

  // ----- Reveal on scroll
  const reveals = document.querySelectorAll(".reveal");
  if ("IntersectionObserver" in window && reveals.length) {
    const io = new IntersectionObserver((entries) => {
      entries.forEach(e => {
        if (e.isIntersecting) {
          e.target.classList.add("in");
          io.unobserve(e.target);
        }
      });
    }, { threshold: 0.12, rootMargin: "0px 0px -60px 0px" });
    reveals.forEach(el => io.observe(el));
  } else {
    reveals.forEach(el => el.classList.add("in"));
  }

  // ----- Card spotlight (mouse-tracking glow)
  document.querySelectorAll(".card").forEach(card => {
    card.addEventListener("mousemove", (e) => {
      const r = card.getBoundingClientRect();
      card.style.setProperty("--mx", `${e.clientX - r.left}px`);
      card.style.setProperty("--my", `${e.clientY - r.top}px`);
    });
  });

  // ----- FAQ accordion
  document.querySelectorAll(".faq-item .faq-q").forEach(btn => {
    btn.addEventListener("click", () => {
      const item = btn.closest(".faq-item");
      item.classList.toggle("open");
    });
  });

  // ----- Stat counter animation
  const counters = document.querySelectorAll("[data-count]");
  if (counters.length) {
    const animate = (el) => {
      const target = parseFloat(el.dataset.count);
      const dur = 1400;
      const start = performance.now();
      const suffix = el.dataset.suffix || "";
      const fmt = (n) => Number.isInteger(target) ? Math.round(n).toLocaleString("pt-BR") : n.toFixed(1).replace(".", ",");
      const tick = (now) => {
        const t = Math.min(1, (now - start) / dur);
        const eased = 1 - Math.pow(1 - t, 3);
        el.textContent = fmt(target * eased) + suffix;
        if (t < 1) requestAnimationFrame(tick);
      };
      requestAnimationFrame(tick);
    };
    const io = new IntersectionObserver((entries) => {
      entries.forEach(e => {
        if (e.isIntersecting) { animate(e.target); io.unobserve(e.target); }
      });
    }, { threshold: 0.4 });
    counters.forEach(el => io.observe(el));
  }

  // ----- Toast helper (global)
  window.toast = function (message, type = "success", duration = 3200) {
    let t = document.querySelector(".toast");
    if (!t) {
      t = document.createElement("div");
      t.className = "toast";
      document.body.appendChild(t);
    }
    t.className = `toast ${type}`;
    t.textContent = message;
    requestAnimationFrame(() => t.classList.add("show"));
    clearTimeout(t._timer);
    t._timer = setTimeout(() => t.classList.remove("show"), duration);
  };

  // ----- Telefone mask (BR)
  document.querySelectorAll('input[data-mask="phone"]').forEach(input => {
    input.addEventListener("input", (e) => {
      let v = e.target.value.replace(/\D/g, "").slice(0, 11);
      if (v.length > 10) v = v.replace(/^(\d{2})(\d{5})(\d{0,4}).*/, "($1) $2-$3");
      else if (v.length > 6) v = v.replace(/^(\d{2})(\d{4})(\d{0,4}).*/, "($1) $2-$3");
      else if (v.length > 2) v = v.replace(/^(\d{2})(\d{0,5}).*/, "($1) $2");
      else if (v.length > 0) v = v.replace(/^(\d{0,2}).*/, "($1");
      e.target.value = v;
    });
  });

  // ----- CEP auto-fill (ViaCEP)
  document.querySelectorAll('input[data-mask="cep"]').forEach(input => {
    input.addEventListener("input", (e) => {
      let v = e.target.value.replace(/\D/g, "").slice(0, 8);
      if (v.length > 5) v = v.replace(/^(\d{5})(\d{0,3}).*/, "$1-$2");
      e.target.value = v;
    });
    input.addEventListener("blur", async (e) => {
      const cep = e.target.value.replace(/\D/g, "");
      if (cep.length !== 8) return;
      try {
        const r = await fetch(`https://viacep.com.br/ws/${cep}/json/`);
        const data = await r.json();
        if (data.erro) return;
        const fill = (n, v) => { const f = document.querySelector(`[name="${n}"]`); if (f && !f.value) f.value = v; };
        fill("rua", data.logradouro);
        fill("bairro", data.bairro);
        fill("cidade", data.localidade);
        fill("uf", data.uf);
      } catch { /* silencioso */ }
    });
  });

  // ----- Smooth scroll para âncoras internas
  document.querySelectorAll('a[href^="#"]').forEach(a => {
    a.addEventListener("click", (e) => {
      const id = a.getAttribute("href");
      if (id.length > 1) {
        const tgt = document.querySelector(id);
        if (tgt) { e.preventDefault(); tgt.scrollIntoView({ behavior: "smooth", block: "start" }); }
      }
    });
  });

  // ----- Year on footer
  const y = document.getElementById("year");
  if (y) y.textContent = new Date().getFullYear();
})();
