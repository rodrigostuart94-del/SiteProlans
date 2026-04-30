/* ============================================================
   PROLANS — Área do Cliente
   Mock de auth + dashboard via localStorage.
   Em produção: substituir por chamadas a /api/auth (JWT) e /api/...
   ============================================================ */
(function () {
  "use strict";

  const STORAGE_USERS = "prolans:users";
  const STORAGE_SESSION = "prolans:session";

  // ----- Helpers de storage
  const getUsers = () => JSON.parse(localStorage.getItem(STORAGE_USERS) || "[]");
  const setUsers = (u) => localStorage.setItem(STORAGE_USERS, JSON.stringify(u));
  const setSession = (email) => localStorage.setItem(STORAGE_SESSION, email);
  const getSession = () => localStorage.getItem(STORAGE_SESSION);
  const clearSession = () => localStorage.removeItem(STORAGE_SESSION);

  // ----- Hash com SubtleCrypto (SHA-256) + sal por usuário.
  //  ATENÇÃO: client-side é apenas para evitar senhas em texto plano no localStorage.
  //  Em produção real, autenticação SEMPRE deve passar por backend com bcrypt/argon2 + HTTPS.
  const SALT_PREFIX = "prolans-v2:";
  async function hashAsync(senha, salt) {
    const enc = new TextEncoder().encode(SALT_PREFIX + salt + ":" + senha);
    if (window.crypto && window.crypto.subtle) {
      const buf = await crypto.subtle.digest("SHA-256", enc);
      return Array.from(new Uint8Array(buf)).map(b => b.toString(16).padStart(2, "0")).join("");
    }
    // Fallback determinístico se SubtleCrypto não disponível (HTTP local sem secure context)
    let h = 0; const s = SALT_PREFIX + salt + ":" + senha;
    for (let i = 0; i < s.length; i++) { h = (h << 5) - h + s.charCodeAt(i); h |= 0; }
    return "f_" + Math.abs(h).toString(36);
  }
  const randomSalt = () => {
    if (window.crypto && crypto.getRandomValues) {
      const a = new Uint8Array(12); crypto.getRandomValues(a);
      return Array.from(a).map(b => b.toString(16).padStart(2, "0")).join("");
    }
    return Math.random().toString(36).slice(2) + Date.now().toString(36);
  };

  // Constant-time string compare (mitiga timing attacks no fallback)
  function safeEq(a, b) {
    if (typeof a !== "string" || typeof b !== "string" || a.length !== b.length) return false;
    let r = 0; for (let i = 0; i < a.length; i++) r |= a.charCodeAt(i) ^ b.charCodeAt(i);
    return r === 0;
  }

  // Throttle de tentativas (anti brute-force local)
  const LOCK_KEY = "prolans:authlock";
  function getLock() { return JSON.parse(sessionStorage.getItem(LOCK_KEY) || '{"fails":0,"until":0}'); }
  function bumpFail() {
    const l = getLock(); l.fails += 1;
    if (l.fails >= 5) { l.until = Date.now() + 60_000; l.fails = 0; }
    sessionStorage.setItem(LOCK_KEY, JSON.stringify(l));
  }
  function clearLock() { sessionStorage.removeItem(LOCK_KEY); }
  function isLocked() {
    const l = getLock();
    return l.until > Date.now() ? Math.ceil((l.until - Date.now()) / 1000) : 0;
  }

  // ----- Seed: usuário admin (não exposto na UI)
  async function seed() {
    const users = getUsers();
    let mutated = false;
    if (!users.find(u => u.email === "adm@prolans.com.br")) {
      const salt = randomSalt();
      users.push({
        nome: "Administrador Prolans",
        email: "adm@prolans.com.br",
        salt,
        senha: await hashAsync("Audi*0123", salt),
        role: "admin",
        criado: new Date().toISOString()
      });
      mutated = true;
    }
    if (mutated) setUsers(users);
  }
  // seed sempre roda antes da UI consumir users (await na inicialização do form)
  const seedReady = seed();

  // ============================================================
  //  AUTH PAGE (login/cadastro)
  // ============================================================
  const authForm = document.getElementById("authForm");
  if (authForm) {
    // Já logado? roteia conforme papel
    if (getSession()) {
      const u = getUsers().find(x => x.email === getSession());
      location.href = (u && u.role === "admin") ? "admin.html" : "dashboard.html";
      return;
    }

    const tabs = document.querySelectorAll(".auth-tabs button");
    const nameField = document.getElementById("nameField");
    const submitBtn = document.getElementById("authSubmit");
    const subtitle = document.getElementById("authSubtitle");
    let mode = "login";

    tabs.forEach(t => t.addEventListener("click", () => {
      tabs.forEach(x => x.classList.remove("active"));
      t.classList.add("active");
      mode = t.dataset.mode;
      if (mode === "register") {
        nameField.style.display = "flex";
        submitBtn.textContent = "Criar conta";
        subtitle.textContent = "Crie sua conta para acompanhar serviços, propostas e contratos.";
      } else {
        nameField.style.display = "none";
        submitBtn.textContent = "Entrar";
        subtitle.textContent = "Acesse a sua área para acompanhar tudo da Prolans em um só lugar.";
      }
    }));

    authForm.addEventListener("submit", async (e) => {
      e.preventDefault();
      const lockedFor = isLocked();
      if (lockedFor > 0) { window.toast(`Muitas tentativas. Aguarde ${lockedFor}s.`, "error"); return; }
      await seedReady;

      const data = Object.fromEntries(new FormData(authForm).entries());
      // Sanitização básica de input
      data.email = String(data.email || "").trim().toLowerCase().slice(0, 120);
      data.nome  = String(data.nome  || "").trim().slice(0, 80);
      data.senha = String(data.senha || "");

      const emailOk = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(data.email);
      if (!emailOk) { window.toast("E-mail inválido.", "error"); return; }

      const users = getUsers();

      if (mode === "register") {
        if (!data.nome || !data.email || !data.senha) { window.toast("Preencha todos os campos.", "error"); return; }
        if (data.senha.length < 8) { window.toast("A senha deve ter ao menos 8 caracteres.", "error"); return; }
        if (users.find(u => u.email === data.email)) { window.toast("E-mail já cadastrado.", "error"); return; }
        const salt = randomSalt();
        users.push({
          nome: data.nome, email: data.email, salt,
          senha: await hashAsync(data.senha, salt),
          role: "client", criado: new Date().toISOString()
        });
        setUsers(users);
        setSession(data.email);
        clearLock();
        window.toast("Conta criada! Bem-vindo(a) à Prolans.", "success");
        setTimeout(() => location.href = "dashboard.html", 700); // novos cadastros vão sempre para a área do cliente
      } else {
        const u = users.find(x => x.email === data.email);
        // Sempre executa hash mesmo se usuário não existe (mitiga user-enumeration via timing)
        const tentativa = u ? await hashAsync(data.senha, u.salt || "") : await hashAsync(data.senha, "decoy");
        if (!u || !safeEq(u.senha, tentativa)) {
          bumpFail();
          window.toast("E-mail ou senha inválidos.", "error");
          return;
        }
        setSession(data.email);
        clearLock();
        window.toast("Login efetuado.", "success");
        const dest = (u.role === "admin") ? "admin.html" : "dashboard.html";
        setTimeout(() => location.href = dest, 600);
      }
    });
  }

  // ============================================================
  //  DASHBOARD
  // ============================================================
  const dash = document.querySelector(".dash");
  if (!dash) return;

  // Guard
  const session = getSession();
  if (!session) { location.href = "area-cliente.html"; return; }

  const users = getUsers();
  const user = users.find(u => u.email === session) || { nome: "Cliente", email: session };

  // Sidebar mobile toggle
  const sb = document.querySelector(".dash-sidebar");
  const sbBtn = document.querySelector(".dash-mobile-toggle");
  if (sbBtn) sbBtn.addEventListener("click", () => sb.classList.toggle("open"));

  // User pill
  const namePill = document.querySelector(".user-pill .name");
  const avPill = document.querySelector(".user-pill .av");
  if (namePill) namePill.textContent = user.nome;
  if (avPill) avPill.textContent = (user.nome || "C").split(" ").map(s => s[0]).slice(0, 2).join("").toUpperCase();

  // Logout
  document.querySelectorAll("[data-logout]").forEach(b => b.addEventListener("click", (e) => {
    e.preventDefault();
    clearSession();
    location.href = "area-cliente.html";
  }));

  // Switching panels by hash
  const sections = document.querySelectorAll("[data-panel]");
  const navLinks = document.querySelectorAll(".dash-nav a[data-go]");
  const titleEl = document.getElementById("dashTitle");
  function showPanel(name) {
    sections.forEach(s => s.style.display = s.dataset.panel === name ? "block" : "none");
    navLinks.forEach(a => a.classList.toggle("active", a.dataset.go === name));
    const active = Array.from(navLinks).find(a => a.dataset.go === name);
    if (titleEl && active) titleEl.textContent = active.textContent.trim();
    sb && sb.classList.remove("open");
  }
  navLinks.forEach(a => a.addEventListener("click", (e) => {
    e.preventDefault();
    const name = a.dataset.go;
    history.replaceState(null, "", "#" + name);
    showPanel(name);
  }));
  showPanel(location.hash.replace("#", "") || "overview");

  // ----- DADOS do cliente — começam vazios. Apenas o admin pode preencher.
  const KEY = `prolans:clientdata:${session}`;
  function ensureClientData() {
    let d = JSON.parse(localStorage.getItem(KEY) || "null");
    if (!d) {
      d = {
        propostas: [],
        servicos: [],
        contratos: [],
        boletos: [],
        notasFiscais: [],
        notificacoes: [],
        chat: []
      };
      localStorage.setItem(KEY, JSON.stringify(d));
    }
    // Garante chaves novas em contas antigas
    if (!d.notasFiscais) d.notasFiscais = [];
    return d;
  }
  function saveClientData(d) { localStorage.setItem(KEY, JSON.stringify(d)); }
  let data = ensureClientData();

  const fmtBRL = v => v.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
  const fmtDate = s => new Date(s).toLocaleDateString("pt-BR");
  const TAG = { pending: "Aguardando", approved: "Aprovado", "in-progress": "Em andamento", done: "Concluído" };

  // Escape de strings interpoladas em innerHTML — barreira contra XSS
  const escMap = { "&":"&amp;", "<":"&lt;", ">":"&gt;", '"':"&quot;", "'":"&#39;", "`":"&#96;", "/":"&#47;" };
  const esc = (v) => String(v == null ? "" : v).replace(/[&<>"'`/]/g, c => escMap[c]);

  // Empty state — exibido quando o admin ainda não preencheu dados
  function emptyState(msg) {
    return `
      <div style="text-align:center;padding:48px 24px;color:var(--text-dim);background:rgba(255,255,255,.02);border:1px dashed rgba(255,255,255,.10);border-radius:12px">
        <svg width="42" height="42" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.4" style="margin:0 auto 12px;opacity:.55"><circle cx="12" cy="12" r="9"/><path d="M12 8v4M12 16h.01"/></svg>
        <p style="margin:0;font-size:.92rem">${esc(msg)}</p>
        <p style="margin:6px 0 0;font-size:.78rem;color:var(--text-dim)">As informações ficarão disponíveis aqui assim que a Prolans cadastrar.</p>
      </div>
    `;
  }

  // ----- KPI
  const kpiPropostas = document.getElementById("kpiPropostas");
  const kpiAtivos = document.getElementById("kpiAtivos");
  const kpiBoletos = document.getElementById("kpiBoletos");
  const kpiContratos = document.getElementById("kpiContratos");
  if (kpiPropostas) kpiPropostas.textContent = data.propostas.filter(p => p.status === "pending").length;
  if (kpiAtivos) kpiAtivos.textContent = data.servicos.filter(s => s.status === "in-progress").length;
  if (kpiBoletos) kpiBoletos.textContent = data.boletos.filter(b => b.status === "pending").length;
  if (kpiContratos) kpiContratos.textContent = data.contratos.length;

  // ----- Helpers de render: aceita IDs duplicados em múltiplos painéis (overview + detalhe)
  function renderInto(idOrSelector, html) {
    document.querySelectorAll(`[id="${idOrSelector}"]`).forEach(el => { el.innerHTML = html; });
  }
  function bindClicks(idOrSelector, attr, handler) {
    document.querySelectorAll(`[id="${idOrSelector}"] [data-${attr}]`).forEach(b => {
      b.addEventListener("click", () => handler(b.dataset[attr]));
    });
  }

  function renderPropostas() {
    if (!data.propostas.length) { renderInto("listPropostas", emptyState("Nenhuma proposta disponível ainda.")); return; }
    const html = data.propostas.map(p => `
      <div class="list-row">
        <div>
          <div class="title">${esc(p.servico)}</div>
          <div class="meta">${esc(p.id)} · ${esc(fmtDate(p.data))}</div>
        </div>
        <div style="color:#fff;font-weight:700">${esc(fmtBRL(p.valor))}</div>
        <span class="tag ${esc(p.status)}">${esc(TAG[p.status] || p.status)}</span>
        ${p.status === "pending"
          ? `<button class="btn btn-primary btn-sm" data-approve="${esc(p.id)}">Aprovar</button>`
          : `<span class="muted" style="font-size:.85rem">—</span>`}
      </div>
    `).join("");
    renderInto("listPropostas", html);
    bindClicks("listPropostas", "approve", (id) => {
      const p = data.propostas.find(x => x.id === id);
      if (p) { p.status = "approved"; saveClientData(data); renderPropostas(); window.toast(`Proposta ${id} aprovada!`, "success"); }
    });
  }
  function renderServicos() {
    if (!data.servicos.length) { renderInto("listServicos", emptyState("Nenhuma ordem de serviço aberta.")); return; }
    const html = data.servicos.map(s => `
      <div class="list-row">
        <div>
          <div class="title">${esc(s.titulo)}</div>
          <div class="meta">${esc(s.id)} · Técnico ${esc(s.tecnico)} · início ${esc(fmtDate(s.inicio))}</div>
        </div>
        <span></span>
        <span class="tag ${esc(s.status)}">${esc(TAG[s.status] || s.status)}</span>
        <button class="btn btn-ghost btn-sm">Detalhes</button>
      </div>
    `).join("");
    renderInto("listServicos", html);
  }
  function renderContratos() {
    if (!data.contratos.length) { renderInto("listContratos", emptyState("Nenhum contrato ativo no momento.")); return; }
    const html = data.contratos.map(c => `
      <div class="list-row">
        <div>
          <div class="title">${esc(c.titulo)}</div>
          <div class="meta">${esc(c.id)} · ativo desde ${esc(fmtDate(c.inicio))}</div>
        </div>
        <div style="color:#fff;font-weight:700">${esc(fmtBRL(c.valor))}<span class="muted" style="font-size:.8rem">/mês</span></div>
        <span class="tag approved">Ativo</span>
        <button class="btn btn-ghost btn-sm">Contrato</button>
      </div>
    `).join("");
    renderInto("listContratos", html);
  }
  function renderBoletos() {
    if (!data.boletos.length) { renderInto("listBoletos", emptyState("Nenhum boleto disponível.")); return; }
    const html = data.boletos.map(b => `
      <div class="list-row">
        <div>
          <div class="title">${esc(b.desc)}</div>
          <div class="meta">${esc(b.id)} · vence ${esc(fmtDate(b.vencimento))}</div>
        </div>
        <div style="color:#fff;font-weight:700">${esc(fmtBRL(b.valor))}</div>
        <span class="tag ${esc(b.status)}">${b.status === "pending" ? "A pagar" : "Pago"}</span>
        ${b.status === "pending"
          ? `<button class="btn btn-primary btn-sm" data-pay="${esc(b.id)}">Pagar</button>`
          : `<button class="btn btn-ghost btn-sm">Comprovante</button>`}
      </div>
    `).join("");
    renderInto("listBoletos", html);
    bindClicks("listBoletos", "pay", (id) => {
      const b = data.boletos.find(x => x.id === id);
      if (b) { b.status = "done"; saveClientData(data); renderBoletos(); window.toast(`Pagamento de ${id} simulado.`, "success"); }
    });
  }
  function renderNotas() {
    const notas = data.notasFiscais || [];
    if (!notas.length) { renderInto("listNotas", emptyState("Nenhuma nota fiscal emitida ainda.")); return; }
    const html = notas.map(n => `
      <div class="list-row">
        <div>
          <div class="title">NF ${esc(n.numero)} — ${esc(n.descricao)}</div>
          <div class="meta">Emissão ${esc(fmtDate(n.emissao))}</div>
        </div>
        <div style="color:#fff;font-weight:700">${esc(fmtBRL(n.valor))}</div>
        <span class="tag ${n.status === "emitida" ? "approved" : "pending"}">${esc(n.status)}</span>
        ${n.linkPDF ? `<a class="btn btn-ghost btn-sm" href="${esc(n.linkPDF)}" target="_blank" rel="noopener noreferrer">Baixar PDF</a>` : `<span class="muted" style="font-size:.85rem">—</span>`}
      </div>
    `).join("");
    renderInto("listNotas", html);
  }
  function renderNotificacoes() {
    if (!data.notificacoes.length) { renderInto("listNotif", emptyState("Sem notificações no momento.")); return; }
    const html = data.notificacoes.map(n => `
      <div class="list-row">
        <div>
          <div class="title">${esc(n.txt)}</div>
          <div class="meta">${esc(n.quando)}</div>
        </div>
        <span></span>
        <span class="tag ${n.tipo === "alerta" ? "pending" : "in-progress"}">${esc(n.tipo)}</span>
        <button class="btn btn-ghost btn-sm">Ver</button>
      </div>
    `).join("");
    renderInto("listNotif", html);
  }
  function renderChat() {
    const log = document.getElementById("chatLog");
    if (!log) return;
    if (!data.chat.length) {
      log.innerHTML = `<div style="text-align:center;color:var(--text-dim);padding:30px 16px;font-size:.88rem">Inicie uma conversa com a equipe Prolans.</div>`;
      return;
    }
    log.innerHTML = data.chat.map(m => `
      <div class="chat-msg ${m.from === "me" ? "me" : "them"}">${esc(m.txt)}<span class="time">${esc(m.t)}</span></div>
    `).join("");
    log.scrollTop = log.scrollHeight;
  }

  renderPropostas(); renderServicos(); renderContratos(); renderBoletos(); renderNotas(); renderNotificacoes(); renderChat();

  // Chat send
  const chatForm = document.getElementById("chatForm");
  if (chatForm) {
    chatForm.addEventListener("submit", (e) => {
      e.preventDefault();
      const input = chatForm.querySelector("input");
      const txt = String(input.value || "").trim().slice(0, 1000);
      if (!txt) return;
      const t = new Date().toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" });
      data.chat.push({ from: "me", txt, t });
      // Limita histórico para evitar storage bloat
      if (data.chat.length > 200) data.chat = data.chat.slice(-200);
      input.value = "";
      saveClientData(data); renderChat();
      // Confirmação automática (sem simular atendente)
      setTimeout(() => {
        data.chat.push({
          from: "them",
          txt: "Mensagem recebida. Um atendente Prolans entrará em contato em breve.",
          t: new Date().toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" })
        });
        saveClientData(data); renderChat();
      }, 1100);
    });
  }

  // Suporte: novo chamado
  const ticketForm = document.getElementById("ticketForm");
  if (ticketForm) {
    ticketForm.addEventListener("submit", (e) => {
      e.preventDefault();
      const f = new FormData(ticketForm);
      const titulo = String(f.get("titulo") || "").trim().slice(0, 200);
      if (!titulo) { window.toast("Descreva o chamado.", "error"); return; }
      const id = "OS-" + Math.floor(Math.random() * 900 + 100);
      data.servicos.unshift({
        id, titulo, status: "pending",
        tecnico: "A definir", inicio: new Date().toISOString().slice(0, 10)
      });
      saveClientData(data); renderServicos();
      ticketForm.reset();
      window.toast(`Chamado ${id} aberto. Em breve entraremos em contato.`, "success");
      showPanel("servicos");
    });
  }
})();
