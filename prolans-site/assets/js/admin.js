/* ============================================================
   PROLANS — Painel Administrativo (Supabase)
   Acesso restrito a profiles.role = 'admin'.
   ============================================================ */
(async function () {
  "use strict";

  if (!window.prolansDB) { console.error("prolansDB não carregado."); return; }
  const DB = window.prolansDB;

  const escMap = { "&":"&amp;", "<":"&lt;", ">":"&gt;", '"':"&quot;", "'":"&#39;", "`":"&#96;", "/":"&#47;" };
  const esc = (v) => String(v == null ? "" : v).replace(/[&<>"'`/]/g, c => escMap[c]);
  const fmtBRL = v => Number(v||0).toLocaleString("pt-BR", { style:"currency", currency:"BRL" });
  const fmtDate = s => s ? new Date(s).toLocaleDateString("pt-BR") : "—";

  // Guard
  const session = await DB.getSession();
  if (!session) { location.href = "area-cliente.html"; return; }
  const me = await DB.getProfile(session.user.id);
  if (!me || me.role !== "admin") { location.href = "area-cliente.html"; return; }

  document.getElementById("adminShell").hidden = false;
  document.getElementById("adminEmail").textContent = session.user.email;

  // Logout
  document.querySelectorAll("[data-logout]").forEach(b => b.addEventListener("click", async () => {
    await DB.signOut();
    location.href = "area-cliente.html";
  }));

  // Panels
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
    e.preventDefault(); showPanel(a.dataset.go);
  }));

  // Modal
  const modal = document.getElementById("modal");
  const modalTitle = document.getElementById("modalTitle");
  const modalBody = document.getElementById("modalBody");
  document.getElementById("modalClose").addEventListener("click", closeModal);
  modal.addEventListener("click", (e) => { if (e.target === modal) closeModal(); });
  function openModal(t, h) { modalTitle.textContent = t; modalBody.innerHTML = h; modal.classList.add("open"); }
  function closeModal() { modal.classList.remove("open"); modalBody.innerHTML = ""; }

  // ===== Cache de dados
  let allProfiles = [];
  let allLeads = [];
  let allOS = [], allBol = [], allNF = [], allProp = [], allCtr = [];

  function clientsList() { return allProfiles.filter(u => u.role !== "admin"); }
  function clientByEmail(email) { return allProfiles.find(u => u.email === email); }
  function clientByUserId(id) { return allProfiles.find(u => u.id === id); }
  function clientNameById(id) { const c = clientByUserId(id); return c ? c.nome : id; }

  function fillClientSelects() {
    const opts = `<option value="">Todos os clientes</option>` +
      clientsList().map(c => `<option value="${esc(c.id)}">${esc(c.nome)} — ${esc(c.email||"sem email")}</option>`).join("");
    ["filterOSClient","filterBolClient","filterNFClient","filterPropClient","filterCtrClient"]
      .forEach(id => { const el = document.getElementById(id); if (el) el.innerHTML = opts; });
  }

  // ===== Carga via RPC do auth.admin (não disponível com anon key) — então pegamos profiles e mostramos email do session
  async function loadProfiles() {
    const { data, error } = await DB.listAllProfiles();
    if (error) { console.error(error); return; }
    // Note: RLS já filtra; admin enxerga todos. profiles não tem 'email' por padrão — vamos puxar via auth.users? Não acessível.
    // Solução: armazenamos email no profile no signUp. Vamos garantir patch:
    // (assume coluna 'email' no profile como string opcional — adicionada no SQL ou via update do próprio cliente)
    allProfiles = (data || []).map(p => ({ ...p, email: p.email || "" }));
  }

  async function loadAll() {
    await loadProfiles();
    const [leads, os, bol, nf, prop, ctr] = await Promise.all([
      DB.leads.list(),
      DB.table("servicos").list(),
      DB.table("boletos").list(),
      DB.table("notas_fiscais").list(),
      DB.table("propostas").list(),
      DB.table("contratos").list()
    ]);
    allLeads = leads.data || [];
    allOS    = os.data    || [];
    allBol   = bol.data   || [];
    allNF    = nf.data    || [];
    allProp  = prop.data  || [];
    allCtr   = ctr.data   || [];
  }

  // ===== KPI
  function renderKPI() {
    const g = (id, v) => { const e = document.getElementById(id); if (e) e.textContent = v; };
    g("kpiClients",  clientsList().length);
    g("kpiLeads",    allLeads.filter(l => l.status === "novo").length);
    g("kpiOS",       allOS.filter(s => s.status === "in-progress").length);
    g("kpiBoletos",  allBol.filter(b => b.status === "pending").length);
    g("kpiNFs",      allNF.length);
    let receita = 0;
    allCtr.forEach(c => { if (c.status === "approved") receita += Number(c.valor||0); });
    g("kpiRevenue",  fmtBRL(receita));
  }

  function pillFor(s) {
    const map = { pending:"pill-pending", approved:"pill-approved", "in-progress":"pill-progress",
                  done:"pill-done", emitida:"pill-approved", cancelada:"pill-pending" };
    return `<span class="pill ${map[s]||"pill-progress"}">${esc(s||"—")}</span>`;
  }

  // ===== CLIENTES
  function renderClients() {
    const q = (document.getElementById("searchClients").value || "").toLowerCase().trim();
    const all = allProfiles;
    const f = all.filter(u => !q || (u.nome||"").toLowerCase().includes(q) || (u.email||"").toLowerCase().includes(q));
    document.getElementById("cntClients").textContent = `(${f.length} de ${all.length})`;
    const html = f.map(u => `
      <tr>
        <td><strong>${esc(u.nome)}</strong></td>
        <td>${esc(u.email || "—")}</td>
        <td><span class="pill ${u.role==="admin"?"pill-admin":"pill-client"}">${u.role==="admin"?"Admin":"Cliente"}</span></td>
        <td>${esc(fmtDate(u.created_at))}</td>
        <td>
          <div class="row-actions">
            <button class="btn btn-ghost btn-xs" data-edit-user="${esc(u.id)}">Editar</button>
            ${u.role !== "admin" ? `<button class="btn btn-ghost btn-xs" data-view-data="${esc(u.id)}">Dados</button>` : ""}
          </div>
        </td>
      </tr>
    `).join("");
    document.getElementById("tblClients").innerHTML = html || `<tr><td colspan="5" class="empty">Nenhum cliente cadastrado.</td></tr>`;
    document.querySelectorAll("[data-edit-user]").forEach(b => b.addEventListener("click", () => editClient(b.dataset.editUser)));
    document.querySelectorAll("[data-view-data]").forEach(b => b.addEventListener("click", () => viewClientData(b.dataset.viewData)));
  }
  document.getElementById("searchClients").addEventListener("input", renderClients);
  document.getElementById("btnNewClient").addEventListener("click", () => alert("Para criar cliente: o cliente deve cadastrar conta em area-cliente.html. Você pode então editar nome/papel aqui."));

  function editClient(userId) {
    const u = allProfiles.find(x => x.id === userId);
    if (!u) return;
    openModal("Editar Cliente", `
      <div class="admin-form-grid">
        <div class="full"><label>Nome</label><input type="text" id="f_nome" value="${esc(u.nome)}" /></div>
        <div class="full"><label>E-mail (informativo)</label><input type="text" id="f_email" value="${esc(u.email)}" /></div>
        <div class="full"><label>Telefone</label><input type="text" id="f_tel" value="${esc(u.telefone||"")}" /></div>
        <div class="full"><label>Papel</label>
          <select id="f_role">
            <option value="client" ${u.role!=="admin"?"selected":""}>Cliente</option>
            <option value="admin"  ${u.role==="admin"?"selected":""}>Admin</option>
          </select>
        </div>
        <div class="full" style="display:flex;gap:8px;justify-content:flex-end">
          <button class="btn btn-ghost btn-sm" id="modalCancel">Cancelar</button>
          <button class="btn btn-primary btn-sm" id="modalSave">Salvar</button>
        </div>
      </div>
    `);
    document.getElementById("modalCancel").addEventListener("click", closeModal);
    document.getElementById("modalSave").addEventListener("click", async () => {
      const patch = {
        nome: document.getElementById("f_nome").value.trim().slice(0,80),
        email: document.getElementById("f_email").value.trim().slice(0,120),
        telefone: document.getElementById("f_tel").value.trim().slice(0,30),
        role: document.getElementById("f_role").value
      };
      const { error } = await DB.sb.from("profiles").update(patch).eq("id", userId);
      if (error) { window.toast(error.message, "error"); return; }
      await loadProfiles(); fillClientSelects(); renderClients(); closeModal();
      window.toast("Cliente atualizado.", "success");
    });
  }

  function viewClientData(userId) {
    const u = clientByUserId(userId);
    if (!u) return;
    const c = (arr) => arr.filter(x => x.user_id === userId).length;
    openModal("Dados de " + esc(u.nome), `
      <div style="display:grid;gap:10px;font-size:.88rem">
        <div><strong>Propostas:</strong> ${c(allProp)}</div>
        <div><strong>Ordens de Serviço:</strong> ${c(allOS)}</div>
        <div><strong>Contratos:</strong> ${c(allCtr)}</div>
        <div><strong>Boletos:</strong> ${c(allBol)}</div>
        <div><strong>Notas Fiscais:</strong> ${c(allNF)}</div>
      </div>
      <div style="margin-top:14px;display:flex;gap:8px;flex-wrap:wrap">
        <button class="btn btn-ghost btn-sm" id="goOS">Ver OS</button>
        <button class="btn btn-ghost btn-sm" id="goBol">Ver Boletos</button>
        <button class="btn btn-ghost btn-sm" id="goNF">Ver NFs</button>
      </div>
    `);
    document.getElementById("goOS").addEventListener("click", () => { closeModal(); document.getElementById("filterOSClient").value = userId; showPanel("servicos"); });
    document.getElementById("goBol").addEventListener("click", () => { closeModal(); document.getElementById("filterBolClient").value = userId; showPanel("boletos"); });
    document.getElementById("goNF").addEventListener("click", () => { closeModal(); document.getElementById("filterNFClient").value = userId; showPanel("notas"); });
  }

  // ===== LEADS
  function renderLeads() {
    const q = (document.getElementById("searchLeads").value || "").toLowerCase().trim();
    const f = allLeads.filter(l => !q || (l.nome||"").toLowerCase().includes(q) || (l.protocolo||"").toLowerCase().includes(q));
    document.getElementById("cntLeads").textContent = `(${f.length})`;
    const html = f.map(l => `
      <tr>
        <td><strong>${esc(l.protocolo)}</strong><br><small style="color:var(--text-dim)">${esc(fmtDate(l.created_at))}</small></td>
        <td>${esc(l.nome)}</td>
        <td>${esc(l.telefone||"—")}</td>
        <td>${esc(l.detalhes || l.servico || "—")}</td>
        <td>${l.valor_estimado ? esc(fmtBRL(l.valor_estimado)) : "Sob consulta"}</td>
        <td>${pillFor(l.status)}</td>
        <td>
          <div class="row-actions">
            <button class="btn btn-ghost btn-xs" data-lead-mark="${esc(l.id)}">Marcar atendido</button>
            <button class="btn btn-ghost btn-xs" data-lead-del="${esc(l.id)}" style="color:#ff7a7a;border-color:#ff7a7a">Excluir</button>
          </div>
        </td>
      </tr>
    `).join("");
    document.getElementById("tblLeads").innerHTML = html || `<tr><td colspan="7" class="empty">Nenhum orçamento recebido.</td></tr>`;
    document.querySelectorAll("[data-lead-mark]").forEach(b => b.addEventListener("click", async () => {
      await DB.leads.update(b.dataset.leadMark, { status: "atendido" });
      await loadAll(); renderLeads(); window.toast("Lead atualizado.", "success");
    }));
    document.querySelectorAll("[data-lead-del]").forEach(b => b.addEventListener("click", async () => {
      if (!confirm("Excluir este lead?")) return;
      await DB.leads.remove(b.dataset.leadDel);
      await loadAll(); renderLeads(); window.toast("Lead excluído.", "success");
    }));
  }
  document.getElementById("searchLeads").addEventListener("input", renderLeads);
  document.getElementById("btnExportLeads").addEventListener("click", () => exportFile("prolans-leads.json", allLeads));

  // ===== Genérico — gerador de tabela CRUD vinculada a cliente
  function makeTable({ panel, listVar, tableName, columns, idField, filterId, btnId, formFields, makePayload }) {
    const cntId = ({servicos:"cntOS", boletos:"cntBol", notas_fiscais:"cntNF", propostas:"cntProp", contratos:"cntCtr"})[tableName];
    const tblId = ({servicos:"tblOS", boletos:"tblBol", notas_fiscais:"tblNF", propostas:"tblProp", contratos:"tblCtr"})[tableName];
    const filter = document.getElementById(filterId);

    function render() {
      const items = (listVar()).filter(x => !filter.value || x.user_id === filter.value);
      document.getElementById(cntId).textContent = `(${items.length})`;
      const html = items.map(it => `
        <tr>
          ${columns(it).map(c => `<td>${c}</td>`).join("")}
          <td>
            <div class="row-actions">
              <button class="btn btn-ghost btn-xs" data-edit-row="${esc(it[idField])}">Editar</button>
              <button class="btn btn-ghost btn-xs" data-del-row="${esc(it[idField])}" style="color:#ff7a7a;border-color:#ff7a7a">Excluir</button>
            </div>
          </td>
        </tr>
      `).join("");
      document.getElementById(tblId).innerHTML = html || `<tr><td colspan="${columns({}).length+1}" class="empty">Nenhum registro.</td></tr>`;
      document.querySelectorAll(`#${tblId} [data-edit-row]`).forEach(b => b.addEventListener("click", () => edit(b.dataset.editRow)));
      document.querySelectorAll(`#${tblId} [data-del-row]`).forEach(b => b.addEventListener("click", async () => {
        if (!confirm("Excluir este registro?")) return;
        await DB.table(tableName).remove(b.dataset.delRow);
        await loadAll(); render(); renderKPI(); window.toast("Excluído.", "success");
      }));
    }
    function edit(id) {
      const item = id ? (listVar()).find(x => x[idField] === id) : null;
      const isNew = !item;
      const opts = clientsList().map(c => `<option value="${esc(c.id)}" ${item && c.id===item.user_id?"selected":""}>${esc(c.nome)}</option>`).join("");
      openModal(isNew ? `Novo registro` : `Editar ${id.slice(0,8)}`, `
        <div class="admin-form-grid">
          <div class="full"><label>Cliente</label><select id="f_user_id" ${isNew?"":"disabled"}>${opts}</select></div>
          ${formFields(item || {})}
          <div class="full" style="display:flex;gap:8px;justify-content:flex-end">
            <button class="btn btn-ghost btn-sm" id="modalCancel">Cancelar</button>
            <button class="btn btn-primary btn-sm" id="modalSave">${isNew?"Criar":"Salvar"}</button>
          </div>
        </div>
      `);
      document.getElementById("modalCancel").addEventListener("click", closeModal);
      document.getElementById("modalSave").addEventListener("click", async () => {
        const userId = isNew ? document.getElementById("f_user_id").value : item.user_id;
        if (!userId) { window.toast("Selecione cliente.", "error"); return; }
        const payload = makePayload(userId);
        const r = isNew ? await DB.table(tableName).insert(payload) : await DB.table(tableName).update(item[idField], payload);
        if (r.error) { window.toast(r.error.message, "error"); return; }
        await loadAll(); render(); renderKPI(); closeModal(); window.toast("Salvo.", "success");
      });
    }
    filter.addEventListener("change", render);
    document.getElementById(btnId).addEventListener("click", () => edit(null));
    return { render, edit };
  }

  // ===== ORDENS DE SERVIÇO
  const tblOS = makeTable({
    listVar: () => allOS, tableName: "servicos", idField: "id",
    filterId: "filterOSClient", btnId: "btnNewOS",
    columns: (s) => Object.keys(s).length ? [
      `<strong>${esc(s.id.slice(0,8))}</strong>`,
      `${esc(clientNameById(s.user_id))}`,
      `${esc(s.titulo)}`,
      `${esc(s.tecnico||"—")}`,
      `${esc(fmtDate(s.inicio))}`,
      pillFor(s.status)
    ] : ["","","","","",""],
    formFields: (it) => `
      <div class="full"><label>Título / serviço</label><input type="text" id="f_titulo" value="${esc(it.titulo||"")}" /></div>
      <div><label>Técnico</label><input type="text" id="f_tecnico" value="${esc(it.tecnico||"")}" /></div>
      <div><label>Status</label><select id="f_status">
        ${["pending","in-progress","done"].map(s => `<option value="${s}" ${s===it.status?"selected":""}>${s}</option>`).join("")}
      </select></div>
      <div><label>Início</label><input type="date" id="f_inicio" value="${esc(it.inicio || new Date().toISOString().slice(0,10))}" /></div>
    `,
    makePayload: (userId) => ({
      user_id: userId,
      titulo: document.getElementById("f_titulo").value.trim().slice(0,200),
      tecnico: document.getElementById("f_tecnico").value.trim().slice(0,80),
      status: document.getElementById("f_status").value,
      inicio: document.getElementById("f_inicio").value
    })
  });

  // ===== BOLETOS
  const tblBol = makeTable({
    listVar: () => allBol, tableName: "boletos", idField: "id",
    filterId: "filterBolClient", btnId: "btnNewBol",
    columns: (b) => Object.keys(b).length ? [
      `<strong>${esc(b.id.slice(0,8))}</strong>`,
      `${esc(clientNameById(b.user_id))}`,
      `${esc(b.descricao)}`,
      `${esc(fmtBRL(b.valor))}`,
      `${esc(fmtDate(b.vencimento))}`,
      pillFor(b.status)
    ] : ["","","","","",""],
    formFields: (it) => `
      <div class="full"><label>Descrição</label><input type="text" id="f_desc" value="${esc(it.descricao||"")}" /></div>
      <div><label>Valor (R$)</label><input type="number" step="0.01" id="f_valor" value="${esc(it.valor||0)}" /></div>
      <div><label>Vencimento</label><input type="date" id="f_venc" value="${esc(it.vencimento || new Date().toISOString().slice(0,10))}" /></div>
      <div><label>Status</label><select id="f_status">
        <option value="pending" ${it.status==="pending"?"selected":""}>A pagar</option>
        <option value="done" ${it.status==="done"?"selected":""}>Pago</option>
      </select></div>
    `,
    makePayload: (userId) => ({
      user_id: userId,
      descricao: document.getElementById("f_desc").value.trim().slice(0,200),
      valor: parseFloat(document.getElementById("f_valor").value) || 0,
      vencimento: document.getElementById("f_venc").value,
      status: document.getElementById("f_status").value
    })
  });

  // ===== NOTAS FISCAIS
  const tblNF = makeTable({
    listVar: () => allNF, tableName: "notas_fiscais", idField: "id",
    filterId: "filterNFClient", btnId: "btnNewNF",
    columns: (n) => Object.keys(n).length ? [
      `<strong>${esc(n.numero)}</strong>`,
      `${esc(clientNameById(n.user_id))}`,
      `${esc(n.descricao)}`,
      `${esc(fmtBRL(n.valor))}`,
      `${esc(fmtDate(n.emissao))}`,
      pillFor(n.status)
    ] : ["","","","","",""],
    formFields: (it) => `
      <div><label>Número da NF</label><input type="text" id="f_num" value="${esc(it.numero||"")}" /></div>
      <div><label>Emissão</label><input type="date" id="f_em" value="${esc(it.emissao || new Date().toISOString().slice(0,10))}" /></div>
      <div class="full"><label>Descrição</label><input type="text" id="f_desc" value="${esc(it.descricao||"")}" /></div>
      <div><label>Valor (R$)</label><input type="number" step="0.01" id="f_valor" value="${esc(it.valor||0)}" /></div>
      <div><label>Status</label><select id="f_status">
        <option value="emitida" ${it.status==="emitida"?"selected":""}>Emitida</option>
        <option value="cancelada" ${it.status==="cancelada"?"selected":""}>Cancelada</option>
      </select></div>
      <div class="full"><label>Link do PDF (opcional)</label><input type="text" id="f_pdf" value="${esc(it.link_pdf||"")}" placeholder="https://..." /></div>
    `,
    makePayload: (userId) => ({
      user_id: userId,
      numero: document.getElementById("f_num").value.trim(),
      descricao: document.getElementById("f_desc").value.trim().slice(0,300),
      valor: parseFloat(document.getElementById("f_valor").value) || 0,
      emissao: document.getElementById("f_em").value,
      status: document.getElementById("f_status").value,
      link_pdf: document.getElementById("f_pdf").value.trim() || null
    })
  });

  // ===== PROPOSTAS
  const tblProp = makeTable({
    listVar: () => allProp, tableName: "propostas", idField: "id",
    filterId: "filterPropClient", btnId: "btnNewProp",
    columns: (p) => Object.keys(p).length ? [
      `<strong>${esc(p.id.slice(0,8))}</strong>`,
      `${esc(clientNameById(p.user_id))}`,
      `${esc(p.servico)}`,
      `${esc(fmtBRL(p.valor))}`,
      `${esc(fmtDate(p.data))}`,
      pillFor(p.status)
    ] : ["","","","","",""],
    formFields: (it) => `
      <div class="full"><label>Serviço</label><input type="text" id="f_serv" value="${esc(it.servico||"")}" /></div>
      <div><label>Valor (R$)</label><input type="number" step="0.01" id="f_valor" value="${esc(it.valor||0)}" /></div>
      <div><label>Status</label><select id="f_status">
        <option value="pending" ${it.status==="pending"?"selected":""}>Aguardando</option>
        <option value="approved" ${it.status==="approved"?"selected":""}>Aprovado</option>
      </select></div>
      <div class="full"><label>Data</label><input type="date" id="f_data" value="${esc(it.data || new Date().toISOString().slice(0,10))}" /></div>
    `,
    makePayload: (userId) => ({
      user_id: userId,
      servico: document.getElementById("f_serv").value.trim().slice(0,200),
      valor: parseFloat(document.getElementById("f_valor").value) || 0,
      status: document.getElementById("f_status").value,
      data: document.getElementById("f_data").value
    })
  });

  // ===== CONTRATOS
  const tblCtr = makeTable({
    listVar: () => allCtr, tableName: "contratos", idField: "id",
    filterId: "filterCtrClient", btnId: "btnNewCtr",
    columns: (c) => Object.keys(c).length ? [
      `<strong>${esc(c.id.slice(0,8))}</strong>`,
      `${esc(clientNameById(c.user_id))}`,
      `${esc(c.titulo)}`,
      `${esc(fmtBRL(c.valor))}`,
      `${esc(fmtDate(c.inicio))}`,
      pillFor(c.status)
    ] : ["","","","","",""],
    formFields: (it) => `
      <div class="full"><label>Título</label><input type="text" id="f_tit" value="${esc(it.titulo||"")}" /></div>
      <div><label>Valor mensal (R$)</label><input type="number" step="0.01" id="f_valor" value="${esc(it.valor||0)}" /></div>
      <div><label>Status</label><select id="f_status">
        <option value="approved" ${it.status==="approved"?"selected":""}>Ativo</option>
        <option value="pending" ${it.status==="pending"?"selected":""}>Pendente</option>
        <option value="done" ${it.status==="done"?"selected":""}>Encerrado</option>
      </select></div>
      <div class="full"><label>Início</label><input type="date" id="f_ini" value="${esc(it.inicio || new Date().toISOString().slice(0,10))}" /></div>
    `,
    makePayload: (userId) => ({
      user_id: userId,
      titulo: document.getElementById("f_tit").value.trim().slice(0,200),
      valor: parseFloat(document.getElementById("f_valor").value) || 0,
      status: document.getElementById("f_status").value,
      inicio: document.getElementById("f_ini").value
    })
  });

  // ===== Configurações
  document.getElementById("btnChangeAdminPass").addEventListener("click", async () => {
    const np = document.getElementById("newAdminPass").value;
    if (!np || np.length < 8) { window.toast("Mínimo 8 caracteres.", "error"); return; }
    const { error } = await DB.sb.auth.updateUser({ password: np });
    if (error) { window.toast(error.message, "error"); return; }
    document.getElementById("newAdminPass").value = "";
    window.toast("Senha admin atualizada.", "success");
  });
  function exportFile(name, obj) {
    const blob = new Blob([JSON.stringify(obj, null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a"); a.href = url; a.download = name; a.click();
    setTimeout(() => URL.revokeObjectURL(url), 500);
  }
  document.getElementById("btnExportAll").addEventListener("click", () => {
    exportFile(`prolans-backup-${new Date().toISOString().slice(0,10)}.json`, {
      profiles: allProfiles, leads: allLeads,
      propostas: allProp, servicos: allOS, contratos: allCtr,
      boletos: allBol, notas_fiscais: allNF
    });
    window.toast("Backup exportado.", "success");
  });
  document.getElementById("btnImportAll").addEventListener("click", () => alert("Import deve ser feito pelo SQL editor do Supabase para garantir consistência."));
  document.getElementById("btnClearLeads").addEventListener("click", async () => {
    if (!confirm("Apagar TODOS os leads?")) return;
    for (const l of allLeads) await DB.leads.remove(l.id);
    await loadAll(); renderLeads(); renderKPI();
    window.toast("Leads apagados.", "success");
  });
  document.getElementById("btnResetAll").addEventListener("click", () => alert("Reset destrutivo deve ser feito via SQL Editor do Supabase para evitar acidentes."));

  // ===== Refresh
  function refreshPanel(name) {
    if (name === "overview") { renderKPI(); renderClients(); renderLeads(); }
    if (name === "clientes") renderClients();
    if (name === "leads") renderLeads();
    if (name === "servicos") tblOS.render();
    if (name === "boletos") tblBol.render();
    if (name === "notas") tblNF.render();
    if (name === "propostas") tblProp.render();
    if (name === "contratos") tblCtr.render();
  }
  function renderAll() {
    renderKPI(); renderClients(); renderLeads();
    tblOS.render(); tblBol.render(); tblNF.render(); tblProp.render(); tblCtr.render();
  }

  // Init
  await loadAll();
  fillClientSelects();
  renderAll();
  showPanel(location.hash.replace("#","") || "overview");
})();
