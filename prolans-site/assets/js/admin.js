/* ============================================================
   PROLANS — Painel Administrativo
   Acesso restrito a usuários com role: "admin".
   Mock localStorage — em produção: backend com JWT + RBAC.
   ============================================================ */
(function () {
  "use strict";

  // ===== Storage keys
  const K_USERS = "prolans:users";
  const K_SESS  = "prolans:session";
  const K_LEADS = "prolans:leads";
  const dataKey = (email) => `prolans:clientdata:${email}`;

  const getUsers = () => JSON.parse(localStorage.getItem(K_USERS) || "[]");
  const setUsers = (u) => localStorage.setItem(K_USERS, JSON.stringify(u));
  const getLeads = () => JSON.parse(localStorage.getItem(K_LEADS) || "[]");
  const setLeads = (l) => localStorage.setItem(K_LEADS, JSON.stringify(l));
  const getClientData = (email) => JSON.parse(localStorage.getItem(dataKey(email)) || "null");
  const setClientData = (email, d) => localStorage.setItem(dataKey(email), JSON.stringify(d));

  // ===== Hash + sal (mesmo esquema da auth)
  const SALT_PREFIX = "prolans-v2:";
  async function hashAsync(senha, salt) {
    const enc = new TextEncoder().encode(SALT_PREFIX + salt + ":" + senha);
    if (window.crypto && window.crypto.subtle) {
      const buf = await crypto.subtle.digest("SHA-256", enc);
      return Array.from(new Uint8Array(buf)).map(b => b.toString(16).padStart(2, "0")).join("");
    }
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

  // ===== Util
  const escMap = { "&":"&amp;", "<":"&lt;", ">":"&gt;", '"':"&quot;", "'":"&#39;", "`":"&#96;", "/":"&#47;" };
  const esc = (v) => String(v == null ? "" : v).replace(/[&<>"'`/]/g, c => escMap[c]);
  const fmtBRL = v => Number(v||0).toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
  const fmtDate = s => s ? new Date(s).toLocaleDateString("pt-BR") : "—";
  const newId = (prefix) => prefix + "-" + Date.now().toString(36).toUpperCase().slice(-6) + Math.floor(Math.random()*99);

  function defaultClientData() {
    return { propostas: [], servicos: [], contratos: [], boletos: [], notasFiscais: [], notificacoes: [], chat: [] };
  }
  function ensureClientData(email) {
    let d = getClientData(email);
    if (!d) { d = defaultClientData(); setClientData(email, d); }
    if (!d.notasFiscais) d.notasFiscais = [];
    return d;
  }

  // ===== Guard
  const sessEmail = localStorage.getItem(K_SESS);
  const users = getUsers();
  const me = users.find(u => u.email === sessEmail);
  if (!me || me.role !== "admin") {
    location.href = "area-cliente.html";
    return;
  }
  document.getElementById("adminShell").hidden = false;
  document.getElementById("adminEmail").textContent = me.email;

  // ===== Logout
  document.querySelectorAll("[data-logout]").forEach(b => b.addEventListener("click", () => {
    localStorage.removeItem(K_SESS);
    location.href = "area-cliente.html";
  }));

  // ===== Navegação
  const sections = document.querySelectorAll("[data-panel]");
  const navLinks = document.querySelectorAll(".admin-side nav a[data-go]");
  const titleEl = document.getElementById("panelTitle");
  function showPanel(name) {
    sections.forEach(s => s.hidden = (s.dataset.panel !== name));
    navLinks.forEach(a => a.classList.toggle("active", a.dataset.go === name));
    const active = Array.from(navLinks).find(a => a.dataset.go === name);
    if (active) titleEl.textContent = active.textContent.trim();
    history.replaceState(null, "", "#" + name);
    refreshPanel(name);
  }
  document.querySelectorAll("[data-go]").forEach(a => a.addEventListener("click", (e) => {
    e.preventDefault();
    showPanel(a.dataset.go);
  }));

  // ===== Modal
  const modal = document.getElementById("modal");
  const modalTitle = document.getElementById("modalTitle");
  const modalBody = document.getElementById("modalBody");
  document.getElementById("modalClose").addEventListener("click", closeModal);
  modal.addEventListener("click", (e) => { if (e.target === modal) closeModal(); });
  function openModal(title, html) {
    modalTitle.textContent = title;
    modalBody.innerHTML = html;
    modal.classList.add("open");
  }
  function closeModal() { modal.classList.remove("open"); modalBody.innerHTML = ""; }

  // ===== Clientes (CRUD)
  function clientsList() { return getUsers().filter(u => u.role !== "admin"); }
  function fillClientSelects() {
    const opts = `<option value="">Todos os clientes</option>` +
      clientsList().map(c => `<option value="${esc(c.email)}">${esc(c.nome)} — ${esc(c.email)}</option>`).join("");
    ["filterOSClient","filterBolClient","filterNFClient","filterPropClient","filterCtrClient"]
      .forEach(id => { const el = document.getElementById(id); if (el) el.innerHTML = opts; });
  }

  function renderClients() {
    const q = (document.getElementById("searchClients").value || "").toLowerCase().trim();
    const all = getUsers();
    const filtered = all.filter(u => !q || (u.nome||"").toLowerCase().includes(q) || (u.email||"").toLowerCase().includes(q));
    document.getElementById("cntClients").textContent = `(${filtered.length} de ${all.length})`;
    document.getElementById("kpiClients").textContent = clientsList().length;
    const html = filtered.map(u => `
      <tr>
        <td><strong>${esc(u.nome)}</strong></td>
        <td>${esc(u.email)}</td>
        <td><span class="pill ${u.role === "admin" ? "pill-admin" : "pill-client"}">${u.role === "admin" ? "Admin" : "Cliente"}</span></td>
        <td>${esc(fmtDate(u.criado))}</td>
        <td>
          <div class="row-actions">
            <button class="btn btn-ghost btn-xs" data-edit-user="${esc(u.email)}">Editar</button>
            <button class="btn btn-ghost btn-xs" data-reset-pass="${esc(u.email)}">Reset senha</button>
            <button class="btn btn-ghost btn-xs" data-view-data="${esc(u.email)}">Dados</button>
            ${u.role !== "admin" ? `<button class="btn btn-ghost btn-xs" data-del-user="${esc(u.email)}" style="color:#ff7a7a;border-color:#ff7a7a">Excluir</button>` : ""}
          </div>
        </td>
      </tr>
    `).join("");
    document.getElementById("tblClients").innerHTML = html || `<tr><td colspan="5" class="empty">Nenhum cliente encontrado.</td></tr>`;

    document.querySelectorAll("[data-edit-user]").forEach(b => b.addEventListener("click", () => editClient(b.dataset.editUser)));
    document.querySelectorAll("[data-reset-pass]").forEach(b => b.addEventListener("click", () => resetPassword(b.dataset.resetPass)));
    document.querySelectorAll("[data-view-data]").forEach(b => b.addEventListener("click", () => viewClientData(b.dataset.viewData)));
    document.querySelectorAll("[data-del-user]").forEach(b => b.addEventListener("click", () => deleteUser(b.dataset.delUser)));
  }
  document.getElementById("searchClients").addEventListener("input", renderClients);
  document.getElementById("btnNewClient").addEventListener("click", () => editClient(null));

  function editClient(email) {
    const u = email ? getUsers().find(x => x.email === email) : { nome:"", email:"", role:"client" };
    const isNew = !email;
    openModal(isNew ? "Novo Cliente" : "Editar Cliente", `
      <div class="admin-form-grid">
        <div class="full"><label>Nome completo</label><input type="text" id="f_nome" value="${esc(u.nome)}" /></div>
        <div class="full"><label>E-mail</label><input type="email" id="f_email" value="${esc(u.email)}" ${isNew?"":"disabled"} /></div>
        ${isNew ? `<div class="full"><label>Senha inicial</label><input type="password" id="f_senha" placeholder="mín. 8 caracteres" /></div>` : ""}
        <div class="full"><label>Papel</label>
          <select id="f_role"><option value="client" ${u.role!=="admin"?"selected":""}>Cliente</option><option value="admin" ${u.role==="admin"?"selected":""}>Admin</option></select>
        </div>
        <div class="full" style="display:flex;gap:8px;justify-content:flex-end;margin-top:8px">
          <button class="btn btn-ghost btn-sm" id="modalCancel">Cancelar</button>
          <button class="btn btn-primary btn-sm" id="modalSave">${isNew ? "Criar Cliente" : "Salvar"}</button>
        </div>
      </div>
    `);
    document.getElementById("modalCancel").addEventListener("click", closeModal);
    document.getElementById("modalSave").addEventListener("click", async () => {
      const nome = document.getElementById("f_nome").value.trim().slice(0, 80);
      const emailNovo = (document.getElementById("f_email").value || u.email).trim().toLowerCase().slice(0, 120);
      const role = document.getElementById("f_role").value;
      if (!nome || !emailNovo) { window.toast("Preencha nome e e-mail.", "error"); return; }
      if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(emailNovo)) { window.toast("E-mail inválido.", "error"); return; }
      const list = getUsers();
      if (isNew) {
        if (list.find(x => x.email === emailNovo)) { window.toast("E-mail já cadastrado.", "error"); return; }
        const senha = document.getElementById("f_senha").value;
        if (!senha || senha.length < 8) { window.toast("Senha deve ter ao menos 8 caracteres.", "error"); return; }
        const salt = randomSalt();
        list.push({ nome, email: emailNovo, role, salt, senha: await hashAsync(senha, salt), criado: new Date().toISOString() });
        ensureClientData(emailNovo);
      } else {
        const x = list.find(x => x.email === email);
        if (x) { x.nome = nome; x.role = role; }
      }
      setUsers(list); fillClientSelects(); renderClients(); closeModal();
      window.toast(isNew ? "Cliente criado." : "Cliente atualizado.", "success");
    });
  }

  function resetPassword(email) {
    openModal("Redefinir senha de " + email, `
      <p style="color:var(--text-dim);font-size:.88rem;line-height:1.5">A senha atual será substituída. Comunique a nova senha ao cliente por canal seguro.</p>
      <div class="admin-form-grid" style="margin-top:14px">
        <div class="full"><label>Nova senha</label><input type="password" id="f_npass" placeholder="mín. 8 caracteres" /></div>
        <div class="full" style="display:flex;gap:8px;justify-content:flex-end">
          <button class="btn btn-ghost btn-sm" id="modalCancel">Cancelar</button>
          <button class="btn btn-primary btn-sm" id="modalSave">Atualizar senha</button>
        </div>
      </div>
    `);
    document.getElementById("modalCancel").addEventListener("click", closeModal);
    document.getElementById("modalSave").addEventListener("click", async () => {
      const np = document.getElementById("f_npass").value;
      if (!np || np.length < 8) { window.toast("Mínimo 8 caracteres.", "error"); return; }
      const list = getUsers();
      const x = list.find(x => x.email === email);
      if (!x) return;
      x.salt = randomSalt();
      x.senha = await hashAsync(np, x.salt);
      setUsers(list);
      closeModal();
      window.toast(`Senha de ${email} redefinida.`, "success");
    });
  }

  function viewClientData(email) {
    const d = ensureClientData(email);
    openModal("Dados de " + email, `
      <div style="display:grid;gap:10px;font-size:.88rem">
        <div><strong>Propostas:</strong> ${d.propostas.length}</div>
        <div><strong>Ordens de Serviço:</strong> ${d.servicos.length}</div>
        <div><strong>Contratos:</strong> ${d.contratos.length}</div>
        <div><strong>Boletos:</strong> ${d.boletos.length}</div>
        <div><strong>Notas Fiscais:</strong> ${(d.notasFiscais||[]).length}</div>
        <div><strong>Notificações:</strong> ${d.notificacoes.length}</div>
        <div><strong>Mensagens (chat):</strong> ${d.chat.length}</div>
      </div>
      <p class="muted" style="font-size:.8rem;margin-top:14px">Use os menus laterais para gerenciar cada categoria filtrando por este cliente.</p>
      <div style="margin-top:14px;display:flex;gap:8px;flex-wrap:wrap">
        <button class="btn btn-ghost btn-sm" id="goOS">Ver OS</button>
        <button class="btn btn-ghost btn-sm" id="goBol">Ver Boletos</button>
        <button class="btn btn-ghost btn-sm" id="goNF">Ver NFs</button>
      </div>
    `);
    document.getElementById("goOS").addEventListener("click", () => { closeModal(); document.getElementById("filterOSClient").value = email; showPanel("servicos"); });
    document.getElementById("goBol").addEventListener("click", () => { closeModal(); document.getElementById("filterBolClient").value = email; showPanel("boletos"); });
    document.getElementById("goNF").addEventListener("click", () => { closeModal(); document.getElementById("filterNFClient").value = email; showPanel("notas"); });
  }

  function deleteUser(email) {
    if (!confirm(`Excluir ${email} e TODOS os dados vinculados? Não há como desfazer.`)) return;
    setUsers(getUsers().filter(u => u.email !== email));
    localStorage.removeItem(dataKey(email));
    fillClientSelects(); renderClients();
    window.toast("Cliente excluído.", "success");
  }

  // ===== LEADS
  function renderLeads() {
    const q = (document.getElementById("searchLeads").value || "").toLowerCase().trim();
    const all = getLeads();
    const filtered = all.filter(l => !q || (l.cliente?.nome||"").toLowerCase().includes(q) || (l.id||"").toLowerCase().includes(q) || (l.cliente?.telefone||"").includes(q));
    document.getElementById("cntLeads").textContent = `(${filtered.length})`;
    document.getElementById("kpiLeads").textContent = all.filter(l => l.status === "novo").length;
    const html = filtered.map(l => `
      <tr>
        <td><strong>${esc(l.id)}</strong><br><small style="color:var(--text-dim)">${esc(fmtDate(l.criado))}</small></td>
        <td>${esc(l.cliente?.nome || "—")}</td>
        <td>${esc(l.cliente?.telefone || "—")}</td>
        <td>${esc(l.detalhes || l.servico || "—")}</td>
        <td>${l.valorEstimado ? esc(fmtBRL(l.valorEstimado)) : "Sob consulta"}</td>
        <td><span class="pill ${l.status === "novo" ? "pill-pending" : "pill-done"}">${esc(l.status)}</span></td>
        <td>
          <div class="row-actions">
            <button class="btn btn-ghost btn-xs" data-lead-convert="${esc(l.id)}">Vincular cliente</button>
            <button class="btn btn-ghost btn-xs" data-lead-mark="${esc(l.id)}">Marcar visto</button>
            <button class="btn btn-ghost btn-xs" data-lead-del="${esc(l.id)}" style="color:#ff7a7a;border-color:#ff7a7a">Excluir</button>
          </div>
        </td>
      </tr>
    `).join("");
    document.getElementById("tblLeads").innerHTML = html || `<tr><td colspan="7" class="empty">Nenhum orçamento recebido.</td></tr>`;

    document.querySelectorAll("[data-lead-mark]").forEach(b => b.addEventListener("click", () => {
      const list = getLeads(); const x = list.find(l => l.id === b.dataset.leadMark);
      if (x) { x.status = "atendido"; setLeads(list); renderLeads(); window.toast("Lead marcado como atendido.", "success"); }
    }));
    document.querySelectorAll("[data-lead-del]").forEach(b => b.addEventListener("click", () => {
      if (!confirm("Excluir este lead?")) return;
      setLeads(getLeads().filter(l => l.id !== b.dataset.leadDel));
      renderLeads(); window.toast("Lead excluído.", "success");
    }));
    document.querySelectorAll("[data-lead-convert]").forEach(b => b.addEventListener("click", () => convertLead(b.dataset.leadConvert)));
  }
  document.getElementById("searchLeads").addEventListener("input", renderLeads);
  document.getElementById("btnExportLeads").addEventListener("click", () => exportFile("prolans-leads.json", getLeads()));

  function convertLead(leadId) {
    const lead = getLeads().find(l => l.id === leadId);
    if (!lead) return;
    const opts = clientsList().map(c => `<option value="${esc(c.email)}">${esc(c.nome)} — ${esc(c.email)}</option>`).join("");
    openModal("Vincular Lead a Cliente", `
      <p style="color:var(--text-dim);font-size:.88rem">Lead: <strong>${esc(lead.id)}</strong> · ${esc(lead.cliente?.nome || "—")} · ${esc(lead.detalhes || lead.servico || "—")}</p>
      <div class="admin-form-grid" style="margin-top:14px">
        <div class="full"><label>Selecionar cliente existente</label>
          <select id="f_client"><option value="">— escolher —</option>${opts}</select>
        </div>
        <div class="full" style="text-align:center;color:var(--text-dim);font-size:.85rem">— ou —</div>
        <div class="full"><label>Criar conta para este lead</label>
          <input type="email" id="f_newemail" placeholder="email@cliente.com" />
        </div>
        <div class="full"><label>Senha inicial (se criar conta nova)</label>
          <input type="password" id="f_newpass" placeholder="mín. 8" />
        </div>
        <div class="full"><label><input type="checkbox" id="f_genprop" checked /> Já criar uma proposta a partir deste lead</label></div>
        <div class="full" style="display:flex;gap:8px;justify-content:flex-end">
          <button class="btn btn-ghost btn-sm" id="modalCancel">Cancelar</button>
          <button class="btn btn-primary btn-sm" id="modalSave">Vincular</button>
        </div>
      </div>
    `);
    document.getElementById("modalCancel").addEventListener("click", closeModal);
    document.getElementById("modalSave").addEventListener("click", async () => {
      let target = document.getElementById("f_client").value;
      const newEmail = (document.getElementById("f_newemail").value || "").trim().toLowerCase();
      const newPass = document.getElementById("f_newpass").value;
      if (!target && newEmail) {
        if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(newEmail)) { window.toast("E-mail inválido.", "error"); return; }
        if (!newPass || newPass.length < 8) { window.toast("Senha mínimo 8 chars.", "error"); return; }
        const list = getUsers();
        if (list.find(u => u.email === newEmail)) { window.toast("E-mail já cadastrado.", "error"); return; }
        const salt = randomSalt();
        list.push({ nome: lead.cliente?.nome || newEmail, email: newEmail, role: "client", salt, senha: await hashAsync(newPass, salt), criado: new Date().toISOString() });
        setUsers(list); ensureClientData(newEmail);
        target = newEmail;
      }
      if (!target) { window.toast("Escolha um cliente ou cadastre novo.", "error"); return; }
      const d = ensureClientData(target);
      if (document.getElementById("f_genprop").checked) {
        d.propostas.unshift({
          id: newId("ORC"), servico: lead.detalhes || lead.servico || "Proposta",
          valor: Number(lead.valorEstimado || 0), status: "pending",
          data: new Date().toISOString().slice(0,10), origemLead: lead.id
        });
        setClientData(target, d);
      }
      const leads = getLeads(); const ld = leads.find(l => l.id === leadId);
      if (ld) { ld.status = "vinculado"; ld.vinculadoA = target; setLeads(leads); }
      fillClientSelects(); renderLeads(); closeModal();
      window.toast(`Lead vinculado a ${target}.`, "success");
    });
  }

  // ===== Genérico: tabelas vinculadas a cliente
  function getEntries(type) {
    const out = [];
    const us = clientsList();
    for (const u of us) {
      const d = ensureClientData(u.email);
      const arr = (d[type] || []);
      for (const it of arr) out.push({ ...it, _email: u.email, _nome: u.nome });
    }
    return out;
  }
  function pillFor(status) {
    const map = {
      pending: "pill-pending", approved: "pill-approved", "in-progress": "pill-progress",
      done: "pill-done", active: "pill-active", emitida: "pill-approved", cancelada: "pill-pending"
    };
    return `<span class="pill ${map[status] || "pill-progress"}">${esc(status || "—")}</span>`;
  }

  // ===== ORDENS DE SERVIÇO
  function renderOS() {
    const filter = document.getElementById("filterOSClient").value;
    let items = getEntries("servicos");
    if (filter) items = items.filter(s => s._email === filter);
    document.getElementById("cntOS").textContent = `(${items.length})`;
    document.getElementById("kpiOS").textContent = getEntries("servicos").filter(s => s.status === "in-progress").length;
    const html = items.map(s => `
      <tr>
        <td><strong>${esc(s.id)}</strong></td>
        <td>${esc(s._nome)}<br><small style="color:var(--text-dim)">${esc(s._email)}</small></td>
        <td>${esc(s.titulo)}</td>
        <td>${esc(s.tecnico || "—")}</td>
        <td>${esc(fmtDate(s.inicio))}</td>
        <td>${pillFor(s.status)}</td>
        <td>
          <div class="row-actions">
            <button class="btn btn-ghost btn-xs" data-edit-os="${esc(s._email)}|${esc(s.id)}">Editar</button>
            <button class="btn btn-ghost btn-xs" data-del-os="${esc(s._email)}|${esc(s.id)}" style="color:#ff7a7a;border-color:#ff7a7a">Excluir</button>
          </div>
        </td>
      </tr>
    `).join("");
    document.getElementById("tblOS").innerHTML = html || `<tr><td colspan="7" class="empty">Nenhuma OS.</td></tr>`;

    document.querySelectorAll("[data-edit-os]").forEach(b => b.addEventListener("click", () => editOS(...b.dataset.editOs.split("|"))));
    document.querySelectorAll("[data-del-os]").forEach(b => b.addEventListener("click", () => deleteEntry("servicos", ...b.dataset.delOs.split("|"))));
  }
  document.getElementById("filterOSClient").addEventListener("change", renderOS);
  document.getElementById("btnNewOS").addEventListener("click", () => editOS(null, null));

  function editOS(email, id) {
    const isNew = !id;
    let item = { titulo:"", tecnico:"", status:"pending", inicio: new Date().toISOString().slice(0,10) };
    if (!isNew) {
      const d = ensureClientData(email); item = d.servicos.find(x => x.id === id) || item;
    }
    const opts = clientsList().map(c => `<option value="${esc(c.email)}" ${c.email===email?"selected":""}>${esc(c.nome)} — ${esc(c.email)}</option>`).join("");
    openModal(isNew ? "Nova Ordem de Serviço" : "Editar OS " + id, `
      <div class="admin-form-grid">
        <div class="full"><label>Cliente</label><select id="f_email" ${isNew?"":"disabled"}><option value="">—</option>${opts}</select></div>
        <div class="full"><label>Título / serviço</label><input type="text" id="f_titulo" value="${esc(item.titulo)}" maxlength="200" /></div>
        <div><label>Técnico responsável</label><input type="text" id="f_tecnico" value="${esc(item.tecnico)}" /></div>
        <div><label>Status</label>
          <select id="f_status">
            ${["pending","in-progress","done"].map(s => `<option value="${s}" ${s===item.status?"selected":""}>${s}</option>`).join("")}
          </select>
        </div>
        <div><label>Início</label><input type="date" id="f_inicio" value="${esc(item.inicio)}" /></div>
        <div class="full" style="display:flex;gap:8px;justify-content:flex-end">
          <button class="btn btn-ghost btn-sm" id="modalCancel">Cancelar</button>
          <button class="btn btn-primary btn-sm" id="modalSave">${isNew?"Criar":"Salvar"}</button>
        </div>
      </div>
    `);
    document.getElementById("modalCancel").addEventListener("click", closeModal);
    document.getElementById("modalSave").addEventListener("click", () => {
      const targetEmail = isNew ? document.getElementById("f_email").value : email;
      if (!targetEmail) { window.toast("Selecione o cliente.", "error"); return; }
      const titulo = document.getElementById("f_titulo").value.trim().slice(0,200);
      if (!titulo) { window.toast("Informe o título.", "error"); return; }
      const d = ensureClientData(targetEmail);
      if (isNew) {
        d.servicos.unshift({
          id: newId("OS"), titulo,
          tecnico: document.getElementById("f_tecnico").value.trim().slice(0,80),
          status: document.getElementById("f_status").value,
          inicio: document.getElementById("f_inicio").value
        });
      } else {
        const x = d.servicos.find(s => s.id === id);
        if (x) {
          x.titulo = titulo;
          x.tecnico = document.getElementById("f_tecnico").value.trim().slice(0,80);
          x.status = document.getElementById("f_status").value;
          x.inicio = document.getElementById("f_inicio").value;
        }
      }
      setClientData(targetEmail, d); closeModal(); renderOS();
      window.toast(isNew?"OS criada.":"OS atualizada.","success");
    });
  }

  // ===== BOLETOS
  function renderBol() {
    const filter = document.getElementById("filterBolClient").value;
    let items = getEntries("boletos");
    if (filter) items = items.filter(s => s._email === filter);
    document.getElementById("cntBol").textContent = `(${items.length})`;
    document.getElementById("kpiBoletos").textContent = getEntries("boletos").filter(b => b.status === "pending").length;
    const html = items.map(b => `
      <tr>
        <td><strong>${esc(b.id)}</strong></td>
        <td>${esc(b._nome)}<br><small style="color:var(--text-dim)">${esc(b._email)}</small></td>
        <td>${esc(b.desc)}</td>
        <td>${esc(fmtBRL(b.valor))}</td>
        <td>${esc(fmtDate(b.vencimento))}</td>
        <td>${pillFor(b.status)}</td>
        <td>
          <div class="row-actions">
            <button class="btn btn-ghost btn-xs" data-edit-bol="${esc(b._email)}|${esc(b.id)}">Editar</button>
            <button class="btn btn-ghost btn-xs" data-del-bol="${esc(b._email)}|${esc(b.id)}" style="color:#ff7a7a;border-color:#ff7a7a">Excluir</button>
          </div>
        </td>
      </tr>
    `).join("");
    document.getElementById("tblBol").innerHTML = html || `<tr><td colspan="7" class="empty">Nenhum boleto.</td></tr>`;
    document.querySelectorAll("[data-edit-bol]").forEach(b => b.addEventListener("click", () => editBol(...b.dataset.editBol.split("|"))));
    document.querySelectorAll("[data-del-bol]").forEach(b => b.addEventListener("click", () => deleteEntry("boletos", ...b.dataset.delBol.split("|"))));
  }
  document.getElementById("filterBolClient").addEventListener("change", renderBol);
  document.getElementById("btnNewBol").addEventListener("click", () => editBol(null, null));

  function editBol(email, id) {
    const isNew = !id;
    let item = { desc:"", valor:0, vencimento: new Date().toISOString().slice(0,10), status:"pending" };
    if (!isNew) { const d = ensureClientData(email); item = d.boletos.find(x => x.id === id) || item; }
    const opts = clientsList().map(c => `<option value="${esc(c.email)}" ${c.email===email?"selected":""}>${esc(c.nome)} — ${esc(c.email)}</option>`).join("");
    openModal(isNew ? "Novo Boleto" : "Editar Boleto " + id, `
      <div class="admin-form-grid">
        <div class="full"><label>Cliente</label><select id="f_email" ${isNew?"":"disabled"}><option value="">—</option>${opts}</select></div>
        <div class="full"><label>Descrição</label><input type="text" id="f_desc" value="${esc(item.desc)}" maxlength="200" /></div>
        <div><label>Valor (R$)</label><input type="number" step="0.01" id="f_valor" value="${esc(item.valor)}" /></div>
        <div><label>Vencimento</label><input type="date" id="f_venc" value="${esc(item.vencimento)}" /></div>
        <div><label>Status</label>
          <select id="f_status">
            <option value="pending" ${item.status==="pending"?"selected":""}>A pagar</option>
            <option value="done" ${item.status==="done"?"selected":""}>Pago</option>
          </select>
        </div>
        <div class="full" style="display:flex;gap:8px;justify-content:flex-end">
          <button class="btn btn-ghost btn-sm" id="modalCancel">Cancelar</button>
          <button class="btn btn-primary btn-sm" id="modalSave">${isNew?"Criar":"Salvar"}</button>
        </div>
      </div>
    `);
    document.getElementById("modalCancel").addEventListener("click", closeModal);
    document.getElementById("modalSave").addEventListener("click", () => {
      const targetEmail = isNew ? document.getElementById("f_email").value : email;
      if (!targetEmail) { window.toast("Selecione o cliente.", "error"); return; }
      const d = ensureClientData(targetEmail);
      if (isNew) {
        d.boletos.unshift({
          id: newId("B"),
          desc: document.getElementById("f_desc").value.trim().slice(0,200),
          valor: parseFloat(document.getElementById("f_valor").value) || 0,
          vencimento: document.getElementById("f_venc").value,
          status: document.getElementById("f_status").value
        });
      } else {
        const x = d.boletos.find(s => s.id === id);
        if (x) {
          x.desc = document.getElementById("f_desc").value.trim().slice(0,200);
          x.valor = parseFloat(document.getElementById("f_valor").value) || 0;
          x.vencimento = document.getElementById("f_venc").value;
          x.status = document.getElementById("f_status").value;
        }
      }
      setClientData(targetEmail, d); closeModal(); renderBol();
      window.toast(isNew?"Boleto criado.":"Boleto atualizado.","success");
    });
  }

  // ===== NOTAS FISCAIS
  function renderNF() {
    const filter = document.getElementById("filterNFClient").value;
    let items = getEntries("notasFiscais");
    if (filter) items = items.filter(s => s._email === filter);
    document.getElementById("cntNF").textContent = `(${items.length})`;
    document.getElementById("kpiNFs").textContent = getEntries("notasFiscais").length;
    const html = items.map(n => `
      <tr>
        <td><strong>${esc(n.numero)}</strong></td>
        <td>${esc(n._nome)}<br><small style="color:var(--text-dim)">${esc(n._email)}</small></td>
        <td>${esc(n.descricao)}</td>
        <td>${esc(fmtBRL(n.valor))}</td>
        <td>${esc(fmtDate(n.emissao))}</td>
        <td>${pillFor(n.status)}</td>
        <td>
          <div class="row-actions">
            <button class="btn btn-ghost btn-xs" data-edit-nf="${esc(n._email)}|${esc(n.numero)}">Editar</button>
            <button class="btn btn-ghost btn-xs" data-del-nf="${esc(n._email)}|${esc(n.numero)}" style="color:#ff7a7a;border-color:#ff7a7a">Excluir</button>
          </div>
        </td>
      </tr>
    `).join("");
    document.getElementById("tblNF").innerHTML = html || `<tr><td colspan="7" class="empty">Nenhuma nota emitida.</td></tr>`;
    document.querySelectorAll("[data-edit-nf]").forEach(b => b.addEventListener("click", () => editNF(...b.dataset.editNf.split("|"))));
    document.querySelectorAll("[data-del-nf]").forEach(b => b.addEventListener("click", () => deleteNF(...b.dataset.delNf.split("|"))));
  }
  document.getElementById("filterNFClient").addEventListener("change", renderNF);
  document.getElementById("btnNewNF").addEventListener("click", () => editNF(null, null));

  function editNF(email, numero) {
    const isNew = !numero;
    let item = { numero: "", descricao: "", valor: 0, emissao: new Date().toISOString().slice(0,10), status: "emitida", linkPDF: "" };
    if (!isNew) { const d = ensureClientData(email); item = (d.notasFiscais||[]).find(x => x.numero === numero) || item; }
    const opts = clientsList().map(c => `<option value="${esc(c.email)}" ${c.email===email?"selected":""}>${esc(c.nome)} — ${esc(c.email)}</option>`).join("");
    openModal(isNew ? "Nova Nota Fiscal" : "Editar NF " + numero, `
      <div class="admin-form-grid">
        <div class="full"><label>Cliente</label><select id="f_email" ${isNew?"":"disabled"}><option value="">—</option>${opts}</select></div>
        <div><label>Número da NF</label><input type="text" id="f_num" value="${esc(item.numero)}" /></div>
        <div><label>Emissão</label><input type="date" id="f_em" value="${esc(item.emissao)}" /></div>
        <div class="full"><label>Descrição</label><input type="text" id="f_desc" value="${esc(item.descricao)}" maxlength="300" /></div>
        <div><label>Valor (R$)</label><input type="number" step="0.01" id="f_valor" value="${esc(item.valor)}" /></div>
        <div><label>Status</label>
          <select id="f_status">
            <option value="emitida" ${item.status==="emitida"?"selected":""}>Emitida</option>
            <option value="cancelada" ${item.status==="cancelada"?"selected":""}>Cancelada</option>
          </select>
        </div>
        <div class="full"><label>Link do PDF (opcional)</label><input type="text" id="f_pdf" value="${esc(item.linkPDF)}" placeholder="https://…" /></div>
        <div class="full" style="display:flex;gap:8px;justify-content:flex-end">
          <button class="btn btn-ghost btn-sm" id="modalCancel">Cancelar</button>
          <button class="btn btn-primary btn-sm" id="modalSave">${isNew?"Emitir":"Salvar"}</button>
        </div>
      </div>
    `);
    document.getElementById("modalCancel").addEventListener("click", closeModal);
    document.getElementById("modalSave").addEventListener("click", () => {
      const targetEmail = isNew ? document.getElementById("f_email").value : email;
      if (!targetEmail) { window.toast("Selecione o cliente.", "error"); return; }
      const num = document.getElementById("f_num").value.trim();
      if (!num) { window.toast("Informe o número da NF.", "error"); return; }
      const d = ensureClientData(targetEmail);
      d.notasFiscais = d.notasFiscais || [];
      const payload = {
        numero: num,
        descricao: document.getElementById("f_desc").value.trim().slice(0,300),
        valor: parseFloat(document.getElementById("f_valor").value) || 0,
        emissao: document.getElementById("f_em").value,
        status: document.getElementById("f_status").value,
        linkPDF: document.getElementById("f_pdf").value.trim()
      };
      if (isNew) {
        if (d.notasFiscais.find(x => x.numero === num)) { window.toast("Já existe NF com esse número para esse cliente.", "error"); return; }
        d.notasFiscais.unshift(payload);
      } else {
        const x = d.notasFiscais.find(s => s.numero === numero);
        if (x) Object.assign(x, payload);
      }
      setClientData(targetEmail, d); closeModal(); renderNF();
      window.toast(isNew?"NF emitida.":"NF atualizada.","success");
    });
  }
  function deleteNF(email, numero) {
    if (!confirm(`Excluir NF ${numero}?`)) return;
    const d = ensureClientData(email);
    d.notasFiscais = (d.notasFiscais||[]).filter(x => x.numero !== numero);
    setClientData(email, d); renderNF();
    window.toast("NF excluída.", "success");
  }

  // ===== PROPOSTAS
  function renderProp() {
    const filter = document.getElementById("filterPropClient").value;
    let items = getEntries("propostas");
    if (filter) items = items.filter(s => s._email === filter);
    document.getElementById("cntProp").textContent = `(${items.length})`;
    const html = items.map(p => `
      <tr>
        <td><strong>${esc(p.id)}</strong></td>
        <td>${esc(p._nome)}<br><small style="color:var(--text-dim)">${esc(p._email)}</small></td>
        <td>${esc(p.servico)}</td>
        <td>${esc(fmtBRL(p.valor))}</td>
        <td>${esc(fmtDate(p.data))}</td>
        <td>${pillFor(p.status)}</td>
        <td>
          <div class="row-actions">
            <button class="btn btn-ghost btn-xs" data-edit-prop="${esc(p._email)}|${esc(p.id)}">Editar</button>
            <button class="btn btn-ghost btn-xs" data-del-prop="${esc(p._email)}|${esc(p.id)}" style="color:#ff7a7a;border-color:#ff7a7a">Excluir</button>
          </div>
        </td>
      </tr>
    `).join("");
    document.getElementById("tblProp").innerHTML = html || `<tr><td colspan="7" class="empty">Nenhuma proposta.</td></tr>`;
    document.querySelectorAll("[data-edit-prop]").forEach(b => b.addEventListener("click", () => editProp(...b.dataset.editProp.split("|"))));
    document.querySelectorAll("[data-del-prop]").forEach(b => b.addEventListener("click", () => deleteEntry("propostas", ...b.dataset.delProp.split("|"))));
  }
  document.getElementById("filterPropClient").addEventListener("change", renderProp);
  document.getElementById("btnNewProp").addEventListener("click", () => editProp(null, null));

  function editProp(email, id) {
    const isNew = !id;
    let item = { servico:"", valor:0, status:"pending", data: new Date().toISOString().slice(0,10) };
    if (!isNew) { const d = ensureClientData(email); item = d.propostas.find(x => x.id === id) || item; }
    const opts = clientsList().map(c => `<option value="${esc(c.email)}" ${c.email===email?"selected":""}>${esc(c.nome)} — ${esc(c.email)}</option>`).join("");
    openModal(isNew ? "Nova Proposta" : "Editar Proposta " + id, `
      <div class="admin-form-grid">
        <div class="full"><label>Cliente</label><select id="f_email" ${isNew?"":"disabled"}><option value="">—</option>${opts}</select></div>
        <div class="full"><label>Serviço</label><input type="text" id="f_serv" value="${esc(item.servico)}" /></div>
        <div><label>Valor (R$)</label><input type="number" step="0.01" id="f_valor" value="${esc(item.valor)}" /></div>
        <div><label>Status</label>
          <select id="f_status">
            <option value="pending" ${item.status==="pending"?"selected":""}>Aguardando</option>
            <option value="approved" ${item.status==="approved"?"selected":""}>Aprovado</option>
          </select>
        </div>
        <div class="full"><label>Data</label><input type="date" id="f_data" value="${esc(item.data)}" /></div>
        <div class="full" style="display:flex;gap:8px;justify-content:flex-end">
          <button class="btn btn-ghost btn-sm" id="modalCancel">Cancelar</button>
          <button class="btn btn-primary btn-sm" id="modalSave">${isNew?"Criar":"Salvar"}</button>
        </div>
      </div>
    `);
    document.getElementById("modalCancel").addEventListener("click", closeModal);
    document.getElementById("modalSave").addEventListener("click", () => {
      const targetEmail = isNew ? document.getElementById("f_email").value : email;
      if (!targetEmail) { window.toast("Selecione o cliente.", "error"); return; }
      const d = ensureClientData(targetEmail);
      const payload = {
        servico: document.getElementById("f_serv").value.trim().slice(0,200),
        valor: parseFloat(document.getElementById("f_valor").value) || 0,
        status: document.getElementById("f_status").value,
        data: document.getElementById("f_data").value
      };
      if (isNew) { d.propostas.unshift({ id: newId("ORC"), ...payload }); }
      else { const x = d.propostas.find(s => s.id === id); if (x) Object.assign(x, payload); }
      setClientData(targetEmail, d); closeModal(); renderProp();
      window.toast(isNew?"Proposta criada.":"Proposta atualizada.","success");
    });
  }

  // ===== CONTRATOS
  function renderCtr() {
    const filter = document.getElementById("filterCtrClient").value;
    let items = getEntries("contratos");
    if (filter) items = items.filter(s => s._email === filter);
    document.getElementById("cntCtr").textContent = `(${items.length})`;
    let revenue = 0;
    items.forEach(c => { if (c.status === "approved" || c.status === "active") revenue += Number(c.valor || 0); });
    document.getElementById("kpiRevenue").textContent = fmtBRL(revenue);
    const html = items.map(c => `
      <tr>
        <td><strong>${esc(c.id)}</strong></td>
        <td>${esc(c._nome)}<br><small style="color:var(--text-dim)">${esc(c._email)}</small></td>
        <td>${esc(c.titulo)}</td>
        <td>${esc(fmtBRL(c.valor))}</td>
        <td>${esc(fmtDate(c.inicio))}</td>
        <td>${pillFor(c.status)}</td>
        <td>
          <div class="row-actions">
            <button class="btn btn-ghost btn-xs" data-edit-ctr="${esc(c._email)}|${esc(c.id)}">Editar</button>
            <button class="btn btn-ghost btn-xs" data-del-ctr="${esc(c._email)}|${esc(c.id)}" style="color:#ff7a7a;border-color:#ff7a7a">Excluir</button>
          </div>
        </td>
      </tr>
    `).join("");
    document.getElementById("tblCtr").innerHTML = html || `<tr><td colspan="7" class="empty">Nenhum contrato.</td></tr>`;
    document.querySelectorAll("[data-edit-ctr]").forEach(b => b.addEventListener("click", () => editCtr(...b.dataset.editCtr.split("|"))));
    document.querySelectorAll("[data-del-ctr]").forEach(b => b.addEventListener("click", () => deleteEntry("contratos", ...b.dataset.delCtr.split("|"))));
  }
  document.getElementById("filterCtrClient").addEventListener("change", renderCtr);
  document.getElementById("btnNewCtr").addEventListener("click", () => editCtr(null, null));

  function editCtr(email, id) {
    const isNew = !id;
    let item = { titulo:"", valor:0, status:"approved", inicio: new Date().toISOString().slice(0,10) };
    if (!isNew) { const d = ensureClientData(email); item = d.contratos.find(x => x.id === id) || item; }
    const opts = clientsList().map(c => `<option value="${esc(c.email)}" ${c.email===email?"selected":""}>${esc(c.nome)} — ${esc(c.email)}</option>`).join("");
    openModal(isNew ? "Novo Contrato" : "Editar " + id, `
      <div class="admin-form-grid">
        <div class="full"><label>Cliente</label><select id="f_email" ${isNew?"":"disabled"}><option value="">—</option>${opts}</select></div>
        <div class="full"><label>Título do contrato</label><input type="text" id="f_tit" value="${esc(item.titulo)}" placeholder="Ex.: Prolans Signature+" /></div>
        <div><label>Valor mensal (R$)</label><input type="number" step="0.01" id="f_valor" value="${esc(item.valor)}" /></div>
        <div><label>Status</label>
          <select id="f_status">
            <option value="approved" ${item.status==="approved"?"selected":""}>Ativo</option>
            <option value="pending" ${item.status==="pending"?"selected":""}>Pendente</option>
            <option value="done" ${item.status==="done"?"selected":""}>Encerrado</option>
          </select>
        </div>
        <div class="full"><label>Início</label><input type="date" id="f_ini" value="${esc(item.inicio)}" /></div>
        <div class="full" style="display:flex;gap:8px;justify-content:flex-end">
          <button class="btn btn-ghost btn-sm" id="modalCancel">Cancelar</button>
          <button class="btn btn-primary btn-sm" id="modalSave">${isNew?"Criar":"Salvar"}</button>
        </div>
      </div>
    `);
    document.getElementById("modalCancel").addEventListener("click", closeModal);
    document.getElementById("modalSave").addEventListener("click", () => {
      const targetEmail = isNew ? document.getElementById("f_email").value : email;
      if (!targetEmail) { window.toast("Selecione o cliente.", "error"); return; }
      const d = ensureClientData(targetEmail);
      const payload = {
        titulo: document.getElementById("f_tit").value.trim().slice(0,200),
        valor: parseFloat(document.getElementById("f_valor").value) || 0,
        status: document.getElementById("f_status").value,
        inicio: document.getElementById("f_ini").value
      };
      if (isNew) { d.contratos.unshift({ id: newId("CTR"), ...payload }); }
      else { const x = d.contratos.find(s => s.id === id); if (x) Object.assign(x, payload); }
      setClientData(targetEmail, d); closeModal(); renderCtr();
      window.toast(isNew?"Contrato criado.":"Contrato atualizado.","success");
    });
  }

  // ===== Excluir item genérico
  function deleteEntry(type, email, id) {
    if (!confirm("Excluir este registro?")) return;
    const d = ensureClientData(email);
    const idField = (type === "notasFiscais") ? "numero" : "id";
    d[type] = (d[type] || []).filter(x => x[idField] !== id);
    setClientData(email, d);
    refreshAll();
    window.toast("Registro excluído.", "success");
  }

  // ===== CONFIGURAÇÕES
  document.getElementById("btnChangeAdminPass").addEventListener("click", async () => {
    const np = document.getElementById("newAdminPass").value;
    if (!np || np.length < 8) { window.toast("Mínimo 8 caracteres.", "error"); return; }
    const list = getUsers();
    const x = list.find(u => u.email === me.email);
    x.salt = randomSalt();
    x.senha = await hashAsync(np, x.salt);
    setUsers(list);
    document.getElementById("newAdminPass").value = "";
    window.toast("Senha admin atualizada.", "success");
  });

  function exportFile(name, obj) {
    const blob = new Blob([JSON.stringify(obj, null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url; a.download = name; a.click();
    setTimeout(() => URL.revokeObjectURL(url), 500);
  }
  document.getElementById("btnExportAll").addEventListener("click", () => {
    const dump = { users: getUsers(), leads: getLeads(), clientes: {} };
    for (const u of clientsList()) dump.clientes[u.email] = ensureClientData(u.email);
    exportFile(`prolans-backup-${new Date().toISOString().slice(0,10)}.json`, dump);
    window.toast("Backup gerado.", "success");
  });
  document.getElementById("btnImportAll").addEventListener("click", () => document.getElementById("fileImport").click());
  document.getElementById("fileImport").addEventListener("change", (e) => {
    const f = e.target.files[0]; if (!f) return;
    if (!confirm("Importar este arquivo? Os dados atuais serão substituídos.")) return;
    const r = new FileReader();
    r.onload = () => {
      try {
        const dump = JSON.parse(r.result);
        if (dump.users) setUsers(dump.users);
        if (dump.leads) setLeads(dump.leads);
        if (dump.clientes) for (const [email, d] of Object.entries(dump.clientes)) setClientData(email, d);
        window.toast("Backup restaurado.", "success");
        refreshAll();
      } catch (err) { window.toast("Arquivo inválido.", "error"); }
    };
    r.readAsText(f);
  });
  document.getElementById("btnClearLeads").addEventListener("click", () => {
    if (!confirm("Apagar TODOS os leads de orçamento?")) return;
    setLeads([]); renderLeads(); window.toast("Leads apagados.", "success");
  });
  document.getElementById("btnResetAll").addEventListener("click", () => {
    if (!confirm("Reset total: apaga clientes (exceto admin), leads e dados. Confirmar?")) return;
    if (!confirm("Tem CERTEZA? Esta ação é irreversível.")) return;
    const adminUsers = getUsers().filter(u => u.role === "admin");
    setUsers(adminUsers);
    setLeads([]);
    Object.keys(localStorage).filter(k => k.startsWith("prolans:clientdata:")).forEach(k => localStorage.removeItem(k));
    refreshAll();
    window.toast("Sistema resetado.", "success");
  });

  // ===== Refresh
  function refreshPanel(name) {
    if (name === "overview" || name === "clientes") renderClients();
    if (name === "leads") renderLeads();
    if (name === "servicos") renderOS();
    if (name === "boletos") renderBol();
    if (name === "notas") renderNF();
    if (name === "propostas") renderProp();
    if (name === "contratos") renderCtr();
    if (name === "overview") {
      renderOS(); renderBol(); renderNF(); renderCtr(); renderLeads();
    }
  }
  function refreshAll() {
    fillClientSelects();
    renderClients(); renderLeads(); renderOS(); renderBol(); renderNF(); renderProp(); renderCtr();
  }

  // Init
  fillClientSelects();
  refreshAll();
  showPanel(location.hash.replace("#","") || "overview");
})();
