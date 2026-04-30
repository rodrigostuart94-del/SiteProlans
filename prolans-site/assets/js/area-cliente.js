/* ============================================================
   PROLANS — Área do Cliente (Supabase)
   Auth + Dashboard via Supabase. Sem mocks.
   ============================================================ */
(async function () {
  "use strict";

  if (!window.prolansDB) {
    console.error("prolansDB não carregado.");
    return;
  }
  const DB = window.prolansDB;

  // Anti brute-force local (sessionStorage)
  const LOCK_KEY = "prolans:authlock";
  function getLock() { return JSON.parse(sessionStorage.getItem(LOCK_KEY) || '{"fails":0,"until":0}'); }
  function bumpFail() {
    const l = getLock(); l.fails += 1;
    if (l.fails >= 5) { l.until = Date.now() + 60000; l.fails = 0; }
    sessionStorage.setItem(LOCK_KEY, JSON.stringify(l));
  }
  function clearLock() { sessionStorage.removeItem(LOCK_KEY); }
  function isLocked() {
    const l = getLock();
    return l.until > Date.now() ? Math.ceil((l.until - Date.now())/1000) : 0;
  }

  // Escape XSS
  const escMap = { "&":"&amp;", "<":"&lt;", ">":"&gt;", '"':"&quot;", "'":"&#39;", "`":"&#96;", "/":"&#47;" };
  const esc = (v) => String(v == null ? "" : v).replace(/[&<>"'`/]/g, c => escMap[c]);
  const fmtBRL = v => Number(v||0).toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
  const fmtDate = s => s ? new Date(s).toLocaleDateString("pt-BR") : "—";
  const TAG = { pending:"Aguardando", pending_confirm:"Aguardando confirmação", approved:"Aprovado", "in-progress":"Em andamento", done:"Concluído", emitida:"Emitida", cancelada:"Cancelada" };

  function emptyState(msg) {
    return `
      <div style="text-align:center;padding:48px 24px;color:var(--text-dim);background:rgba(255,255,255,.02);border:1px dashed rgba(255,255,255,.10);border-radius:12px">
        <svg width="42" height="42" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.4" style="margin:0 auto 12px;opacity:.55"><circle cx="12" cy="12" r="9"/><path d="M12 8v4M12 16h.01"/></svg>
        <p style="margin:0;font-size:.92rem">${esc(msg)}</p>
        <p style="margin:6px 0 0;font-size:.78rem;color:var(--text-dim)">As informações ficarão disponíveis aqui assim que a Prolans cadastrar.</p>
      </div>`;
  }

  // Botão de download/visualização — gera signed URL on-demand
  function fileBtn(path, label) {
    if (!path) return `<span class="muted" style="font-size:.85rem">—</span>`;
    return `<button class="btn btn-ghost btn-sm" data-file="${esc(path)}">
      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" style="vertical-align:-2px;margin-right:4px"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4M7 10l5 5 5-5M12 15V3"/></svg>
      ${esc(label || "Baixar")}
    </button>`;
  }
  function bindFileButtons() {
    document.querySelectorAll('[data-file]').forEach(b => {
      if (b.dataset.bound) return;
      b.dataset.bound = "1";
      b.addEventListener("click", async () => {
        b.disabled = true;
        const old = b.innerHTML;
        b.textContent = "Abrindo...";
        const { data, error } = await DB.getDocUrl(b.dataset.file);
        b.disabled = false;
        b.innerHTML = old;
        if (error) { window.toast("Falha ao gerar link de download.", "error"); return; }
        window.open(data.signedUrl, "_blank", "noopener,noreferrer");
      });
    });
  }

  // ============================================================
  //  AUTH PAGE (login/cadastro)
  // ============================================================
  const authForm = document.getElementById("authForm");
  if (authForm) {
    // Já logado? roteia
    const session = await DB.getSession();
    if (session) {
      const profile = await DB.getProfile(session.user.id);
      location.href = (profile && profile.role === "admin") ? "/admin/" : "/dashboard/";
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

      const data = Object.fromEntries(new FormData(authForm).entries());
      data.email = String(data.email || "").trim().toLowerCase().slice(0,120);
      data.nome  = String(data.nome  || "").trim().slice(0,80);
      data.senha = String(data.senha || "");

      if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(data.email)) { window.toast("E-mail inválido.", "error"); return; }

      submitBtn.disabled = true;
      submitBtn.textContent = mode === "register" ? "Criando..." : "Entrando...";

      try {
        if (mode === "register") {
          if (!data.nome || data.senha.length < 8) { window.toast("Nome obrigatório e senha mínima de 8 caracteres.", "error"); return; }
          const { error } = await DB.signUp(data.email, data.senha, data.nome);
          if (error) { window.toast(error.message || "Erro no cadastro.", "error"); return; }
          window.toast("Conta criada! Verifique seu e-mail se necessário.", "success");
          // Tenta logar automaticamente (se confirmação por e-mail estiver desligada)
          const login = await DB.signIn(data.email, data.senha);
          if (!login.error) {
            setTimeout(() => location.href = "/dashboard/", 600);
          } else {
            window.toast("Confirme seu e-mail antes de entrar.", "info");
          }
        } else {
          const { error } = await DB.signIn(data.email, data.senha);
          if (error) {
            bumpFail();
            window.toast("E-mail ou senha inválidos.", "error");
            return;
          }
          clearLock();
          window.toast("Login efetuado.", "success");
          const profile = await DB.getProfile();
          const dest = (profile && profile.role === "admin") ? "/admin/" : "/dashboard/";
          setTimeout(() => location.href = dest, 500);
        }
      } finally {
        submitBtn.disabled = false;
        submitBtn.textContent = mode === "register" ? "Criar conta" : "Entrar";
      }
    });
    return;
  }

  // ============================================================
  //  DASHBOARD
  // ============================================================
  const dash = document.querySelector(".dash");
  if (!dash) return;

  // Guard
  const session = await DB.getSession();
  if (!session) { location.href = "/area-cliente/"; return; }

  const user = session.user;
  const profile = await DB.getProfile(user.id);
  if (profile && profile.role === "admin") { location.href = "/admin/"; return; }

  const userName = (profile && profile.nome) || user.email;

  // Sidebar mobile toggle
  const sb = document.querySelector(".dash-sidebar");
  const sbBtn = document.querySelector(".dash-mobile-toggle");
  if (sbBtn) sbBtn.addEventListener("click", () => sb.classList.toggle("open"));

  const namePill = document.querySelector(".user-pill .name");
  const avPill = document.querySelector(".user-pill .av");
  if (namePill) namePill.textContent = userName;
  if (avPill) avPill.textContent = (userName || "C").split(" ").map(s => s[0]).slice(0,2).join("").toUpperCase();

  // Logout
  document.querySelectorAll("[data-logout]").forEach(b => b.addEventListener("click", async (e) => {
    e.preventDefault();
    await DB.signOut();
    location.href = "/area-cliente/";
  }));

  // Switching panels
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
  showPanel(location.hash.replace("#","") || "overview");

  // Helpers de render
  function renderInto(idOrSelector, html) {
    document.querySelectorAll(`[id="${idOrSelector}"]`).forEach(el => { el.innerHTML = html; });
  }

  // Carrega dados
  let store = { propostas: [], servicos: [], contratos: [], boletos: [], notasFiscais: [], notificacoes: [] };

  async function loadAll() {
    const tables = ["propostas","servicos","contratos","boletos","notas_fiscais","notificacoes"];
    const results = await Promise.all(tables.map(t => DB.myData(t)));
    store.propostas     = results[0].data || [];
    store.servicos      = results[1].data || [];
    store.contratos     = results[2].data || [];
    store.boletos       = results[3].data || [];
    store.notasFiscais  = results[4].data || [];
    store.notificacoes  = results[5].data || [];
  }

  function renderKPIs() {
    const g = (id, v) => { const e = document.getElementById(id); if (e) e.textContent = v; };
    g("kpiPropostas", store.propostas.filter(p => p.status === "pending").length);
    g("kpiAtivos",    store.servicos.filter(s => s.status === "in-progress").length);
    g("kpiBoletos",   store.boletos.filter(b => b.status === "pending").length);
    g("kpiContratos", store.contratos.length);
  }

  function renderPropostas() {
    if (!store.propostas.length) { renderInto("listPropostas", emptyState("Nenhuma proposta disponível ainda.")); return; }
    const html = store.propostas.map(p => `
      <div class="list-row">
        <div>
          <div class="title">${esc(p.servico)}</div>
          <div class="meta">${esc(fmtDate(p.data))}</div>
        </div>
        <div style="color:#fff;font-weight:700">${esc(fmtBRL(p.valor))}</div>
        <span class="tag ${esc(p.status)}">${esc(TAG[p.status] || p.status)}</span>
        ${fileBtn(p.arquivo_path, "Ver proposta")}
        ${p.status === "pending"
          ? `<button class="btn btn-primary btn-sm" data-approve="${esc(p.id)}">Aprovar</button>`
          : ``}
      </div>
    `).join("");
    renderInto("listPropostas", html);
    bindFileButtons();
    document.querySelectorAll('[data-approve]').forEach(b => b.addEventListener("click", async () => {
      const r = await DB.table("propostas").update(b.dataset.approve, { status: "approved" });
      if (!r.error) { await loadAll(); renderPropostas(); renderKPIs(); window.toast("Proposta aprovada!", "success"); }
    }));
  }

  function renderServicos() {
    if (!store.servicos.length) { renderInto("listServicos", emptyState("Nenhuma ordem de serviço aberta.")); return; }
    renderInto("listServicos", store.servicos.map(s => `
      <div class="list-row">
        <div>
          <div class="title">${esc(s.titulo)}</div>
          <div class="meta">Técnico ${esc(s.tecnico || "—")} · início ${esc(fmtDate(s.inicio))}</div>
        </div>
        <span></span>
        <span class="tag ${esc(s.status)}">${esc(TAG[s.status] || s.status)}</span>
        ${fileBtn(s.arquivo_path, "Ver OS")}
      </div>
    `).join(""));
    bindFileButtons();
  }

  function renderContratos() {
    if (!store.contratos.length) { renderInto("listContratos", emptyState("Nenhum contrato ativo no momento.")); return; }
    renderInto("listContratos", store.contratos.map(c => `
      <div class="list-row">
        <div>
          <div class="title">${esc(c.titulo)}</div>
          <div class="meta">Ativo desde ${esc(fmtDate(c.inicio))}</div>
        </div>
        <div style="color:#fff;font-weight:700">${esc(fmtBRL(c.valor))}<span class="muted" style="font-size:.8rem">/mês</span></div>
        <span class="tag approved">${esc(TAG[c.status] || c.status)}</span>
        ${fileBtn(c.arquivo_path, "Ver contrato")}
      </div>
    `).join(""));
    bindFileButtons();
  }

  function renderBoletos() {
    if (!store.boletos.length) { renderInto("listBoletos", emptyState("Nenhum boleto disponível.")); return; }
    const statusLabel = (s) => s === "pending" ? "A pagar"
                              : s === "pending_confirm" ? "Aguardando confirmação"
                              : "Pago";
    renderInto("listBoletos", store.boletos.map(b => `
      <div class="list-row">
        <div>
          <div class="title">${esc(b.descricao)}</div>
          <div class="meta">Vence ${esc(fmtDate(b.vencimento))}</div>
        </div>
        <div style="color:#fff;font-weight:700">${esc(fmtBRL(b.valor))}</div>
        <span class="tag ${esc(b.status)}">${esc(statusLabel(b.status))}</span>
        ${fileBtn(b.arquivo_path, "Boleto PDF")}
        ${b.status === "pending"
          ? `<button class="btn btn-primary btn-sm" data-pay="${esc(b.id)}">Marcar pago</button>`
          : b.status === "pending_confirm"
            ? `<span class="muted" style="font-size:.82rem;color:#9ee9ff">Aguardando Prolans confirmar</span>`
            : ``}
      </div>
    `).join(""));
    bindFileButtons();
    document.querySelectorAll('[data-pay]').forEach(btn => btn.addEventListener("click", async () => {
      if (!confirm("Confirmar que você pagou este boleto? A Prolans irá conferir e dar baixa.")) return;
      const id = btn.dataset.pay;
      // Atualização otimista: muda UI antes do round-trip
      const target = store.boletos.find(x => x.id === id);
      const prevStatus = target ? target.status : null;
      if (target) target.status = "pending_confirm";
      renderBoletos(); renderKPIs();

      const r = await DB.table("boletos").update(id, { status: "pending_confirm" });
      if (r.error) {
        // Reverte se falhar
        if (target) target.status = prevStatus;
        renderBoletos(); renderKPIs();
        window.toast(r.error.message || "Falha ao atualizar.", "error");
        return;
      }
      window.toast("Marcado como pago. Aguarde a confirmação da Prolans.", "success", 4500);
    }));
  }

  function renderNotas() {
    if (!store.notasFiscais.length) { renderInto("listNotas", emptyState("Nenhuma nota fiscal emitida ainda.")); return; }
    renderInto("listNotas", store.notasFiscais.map(n => `
      <div class="list-row">
        <div>
          <div class="title">NF ${esc(n.numero)} — ${esc(n.descricao)}</div>
          <div class="meta">Emissão ${esc(fmtDate(n.emissao))}</div>
        </div>
        <div style="color:#fff;font-weight:700">${esc(fmtBRL(n.valor))}</div>
        <span class="tag ${n.status === "emitida" ? "approved" : "pending"}">${esc(TAG[n.status] || n.status)}</span>
        ${fileBtn(n.arquivo_path, "Baixar NF")}
        ${n.link_pdf ? `<a class="btn btn-ghost btn-sm" href="${esc(n.link_pdf)}" target="_blank" rel="noopener noreferrer">Link externo</a>` : ``}
      </div>
    `).join(""));
    bindFileButtons();
  }

  function renderNotif() {
    if (!store.notificacoes.length) { renderInto("listNotif", emptyState("Sem notificações no momento.")); return; }
    renderInto("listNotif", store.notificacoes.map(n => `
      <div class="list-row">
        <div>
          <div class="title">${esc(n.txt)}</div>
          <div class="meta">${esc(fmtDate(n.created_at))}</div>
        </div>
        <span></span>
        <span class="tag ${n.tipo === "alerta" ? "pending" : "in-progress"}">${esc(n.tipo)}</span>
        <button class="btn btn-ghost btn-sm">Ver</button>
      </div>
    `).join(""));
  }

  function renderChat() {
    const log = document.getElementById("chatLog");
    if (!log) return;
    log.innerHTML = `<div style="text-align:center;color:var(--text-dim);padding:30px 16px;font-size:.88rem">Use o WhatsApp para suporte direto.</div>`;
  }

  // Renderiza tudo
  await loadAll();
  renderKPIs(); renderPropostas(); renderServicos(); renderContratos(); renderBoletos(); renderNotas(); renderNotif(); renderChat();

  // Ticket → cria notificacao tipo "ticket" (será visto pelo admin futuramente)
  const ticketForm = document.getElementById("ticketForm");
  if (ticketForm) {
    ticketForm.addEventListener("submit", async (e) => {
      e.preventDefault();
      const f = new FormData(ticketForm);
      const titulo = String(f.get("titulo") || "").trim().slice(0,200);
      if (!titulo) { window.toast("Descreva o chamado.", "error"); return; }
      // Cria como ordem de serviço pending para o cliente atual
      const r = await DB.table("servicos").insert({
        user_id: user.id, titulo, status: "pending",
        tecnico: "A definir", inicio: new Date().toISOString().slice(0,10)
      });
      if (r.error) { window.toast("Falha ao abrir chamado.", "error"); return; }
      await loadAll(); renderServicos();
      ticketForm.reset();
      window.toast("Chamado registrado.", "success");
      showPanel("servicos");
    });
  }

  // Chat: redireciona para WhatsApp (usuário escolhe canal real)
  const chatForm = document.getElementById("chatForm");
  if (chatForm) {
    chatForm.addEventListener("submit", (e) => {
      e.preventDefault();
      const input = chatForm.querySelector("input");
      const txt = String(input.value || "").trim().slice(0,500);
      if (!txt) return;
      const url = "https://wa.me/prolans?text=" + encodeURIComponent(`[${userName}] ${txt}`);
      window.open(url, "_blank", "noopener,noreferrer");
      input.value = "";
      window.toast("Abrindo WhatsApp...", "info");
    });
  }
})();
