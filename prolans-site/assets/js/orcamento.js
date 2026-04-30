/* ============================================================
   PROLANS — Calculadora de Orçamento + Captura de Lead
   Tabela de preços oficial Prolans (mão de obra)
   ============================================================ */
(function () {
  "use strict";

  /* Tabela de preços REAL (mão de obra de instalação)
     Valores fornecidos pela Prolans. */
  const PRICING = {
    cftv: {
      label: "Câmeras de Segurança (CFTV)",
      kits: {
        wifi: {
          label: "Sistema Wi-Fi (residencial / pequenos ambientes)",
          tiers: [
            { qty: "Kit 02 câmeras", value: 360 },
            { qty: "Kit 04 câmeras", value: 700 },
            { qty: "Kit 06 câmeras", value: 1020 },
            { qty: "Kit 08 câmeras", value: 1320 }
          ]
        },
        analogico: {
          label: "Sistema Analógico (cabeado, mais estável)",
          tiers: [
            { qty: "Kit 04 câmeras", value: 800 },
            { qty: "Kit 08 câmeras", value: 1600 },
            { qty: "Kit 16 câmeras", value: 3000 },
            { qty: "Kit 32 câmeras", value: 5800 }
          ]
        },
        ip: {
          label: "Sistema IP (alta performance / empresas)",
          tiers: [
            { qty: "Kit 04 câmeras", value: 1000 },
            { qty: "Kit 08 câmeras", value: 2000 },
            { qty: "Kit 16 câmeras", value: 3800 },
            { qty: "Kit 32 câmeras", value: 7200 }
          ]
        }
      }
    },
    acesso: {
      label: "Controle de Acesso",
      simples: [
        { qty: "Controle simples", value: 350 },
        { qty: "Com biometria", value: 500 },
        { qty: "Reconhecimento facial", value: 800 }
      ]
    },
    fechadura: {
      label: "Fechaduras Digitais",
      simples: [
        { qty: "Instalação sobrepor", value: 300 },
        { qty: "Instalação embutir", value: 500 }
      ]
    },
    portao: {
      label: "Portão Eletrônico",
      simples: [{ qty: "Automatização de portão", value: 550, from: true }]
    },
    rede: {
      label: "Rede e Internet",
      simples: [
        { qty: "Ponto de rede (cada)", value: 200 },
        { qty: "Organização de rede / rack", value: 300, from: true },
        { qty: "Configuração de roteador", value: 150 },
        { qty: "Rede Mesh", value: 300, from: true }
      ]
    },
    automacao: {
      label: "Automação Residencial / Comercial",
      simples: [
        { qty: "Automação de interruptor (por ponto)", value: 150, from: true },
        { qty: "Automação de tomada (por ponto)", value: 150, from: true },
        { qty: "Integração com Alexa", value: 200, from: true },
        { qty: "Automação completa (sob consulta)", value: 0, custom: true }
      ]
    },
    interfone: {
      label: "Interfone",
      simples: [
        { qty: "Instalação de interfone", value: 250, from: true },
        { qty: "Interfone com fechadura elétrica", value: 400, from: true }
      ]
    },
    alarme: {
      label: "Alarmes",
      simples: [{ qty: "Sistema de alarme completo", value: 500, from: true }]
    },
    manutencao: {
      label: "Manutenção",
      simples: [
        { qty: "Manutenção corretiva", value: 180, from: true },
        { qty: "Plano Signature+ (mensal)", value: 300, from: true }
      ]
    }
  };

  const PROPERTY_LABEL = { casa: "Residência", condominio: "Condomínio", empresa: "Empresa" };

  const form = document.getElementById("orcamentoForm");
  if (!form) return;

  const result = document.getElementById("orcResult");
  const empty = document.getElementById("orcEmpty");
  const fmt = v => v.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });

  /* Render dinâmico das opções secundárias */
  const subWrap = document.getElementById("subOptions");
  function renderSub() {
    const servico = form.querySelector('select[name="servico"]').value;
    if (!servico || !PRICING[servico]) {
      subWrap.innerHTML = "";
      return;
    }
    const cfg = PRICING[servico];

    if (cfg.kits) {
      // CFTV — escolhe tipo de sistema, depois kit
      subWrap.innerHTML = `
        <div class="field full">
          <label>Tipo de sistema</label>
          <div class="radio-group">
            ${Object.entries(cfg.kits).map(([k, v], i) => `
              <label><input type="radio" name="sistema" value="${k}" ${i === 0 ? "checked" : ""} /><span>${k.toUpperCase()}</span><small>${v.label.split("(")[1] ? "(" + v.label.split("(")[1] : ""}</small></label>
            `).join("")}
          </div>
        </div>
        <div class="field full">
          <label>Tamanho do kit</label>
          <select name="kit">
            <option value="">Selecione…</option>
          </select>
        </div>
      `;
      const sysRadios = subWrap.querySelectorAll('input[name="sistema"]');
      const kitSel = subWrap.querySelector('select[name="kit"]');
      function fillKits() {
        const sys = subWrap.querySelector('input[name="sistema"]:checked').value;
        const tiers = cfg.kits[sys].tiers;
        kitSel.innerHTML = '<option value="">Selecione…</option>' +
          tiers.map(t => `<option value="${t.value}">${t.qty} — a partir de ${fmt(t.value)}</option>`).join("");
      }
      sysRadios.forEach(r => r.addEventListener("change", () => { fillKits(); render(); }));
      kitSel.addEventListener("change", render);
      fillKits();
    } else {
      subWrap.innerHTML = "";
    }
  }

  function getSelected() {
    const data = new FormData(form);
    const servico = data.get("servico");
    if (!servico || !PRICING[servico]) return null;
    const cfg = PRICING[servico];
    let valor = 0, descricao = "", isCustom = false;

    if (cfg.kits) {
      const sys = data.get("sistema");
      const kit = data.get("kit");
      if (sys && kit) {
        valor = parseFloat(kit);
        const tier = cfg.kits[sys].tiers.find(t => t.value === valor);
        descricao = `${cfg.label} · ${cfg.kits[sys].label} · ${tier ? tier.qty : ""}`;
      } else {
        descricao = cfg.label;
        isCustom = true;
      }
    } else {
      descricao = cfg.label;
      isCustom = true;
    }
    return { servico: cfg.label, descricao, valor, isCustom, imovel: PROPERTY_LABEL[data.get("imovel")] || "Casa" };
  }

  function render() {
    if (!result) return;
    const c = getSelected();
    if (!c) { result.style.display = "none"; if (empty) empty.style.display = "block"; return; }
    result.style.display = "block";
    if (empty) empty.style.display = "none";

    const set = (id, text) => { const el = document.getElementById(id); if (el) el.textContent = text; };
    set("resService", c.servico);
    set("resVar", c.descricao.split(" · ").slice(1).join(" · ") || "—");
    set("resImovel", c.imovel);
    set("resTotal", c.isCustom ? "Sob consulta" : `a partir de ${fmt(c.valor)}`);
    set("resObs", c.isCustom
      ? "Esse serviço requer visita técnica para orçamento personalizado."
      : "Valor referente à mão de obra. Equipamentos cotados separadamente conforme projeto.");
  }

  form.querySelector('select[name="servico"]').addEventListener("change", () => { renderSub(); render(); });
  form.addEventListener("input", render);
  form.addEventListener("change", render);

  /* SUBMIT — gera LEAD */
  form.addEventListener("submit", async (e) => {
    e.preventDefault();
    const data = Object.fromEntries(new FormData(form).entries());
    const c = getSelected();
    if (!c) { window.toast("Selecione a categoria do serviço.", "error"); return; }

    const protocolo = "LEAD-" + Date.now().toString(36).toUpperCase();
    const valorEst = c.isCustom ? null : c.valor;

    // Grava no Supabase (RLS permite insert público em leads)
    if (window.prolansDB) {
      const payload = {
        protocolo,
        nome: data.nome || "",
        telefone: data.telefone || "",
        email: data.email || "",
        servico: c.servico,
        detalhes: c.descricao,
        valor_estimado: valorEst,
        observacoes: data.observacoes || "",
        imovel: c.imovel,
        status: "novo"
      };
      try {
        await window.prolansDB.leads.create(payload);
      } catch (err) {
        console.error("Falha ao gravar lead:", err);
      }
    }

    if (window.prolansTrack) {
      window.prolansTrack("generate_lead", {
        currency: "BRL",
        value: c.isCustom ? 0 : c.valor,
        servico: c.servico
      });
    }

    const valorTxt = c.isCustom ? "sob consulta" : `a partir de ${fmt(c.valor)}`;
    const msg = encodeURIComponent(
      `Olá, Prolans!\n` +
      `Acabei de solicitar um orçamento online.\n\n` +
      `Protocolo: ${protocolo}\n` +
      `Nome: ${data.nome}\n` +
      `Tipo de imóvel: ${c.imovel}\n` +
      `Serviço: ${c.descricao}\n` +
      `Estimativa: ${valorTxt}\n` +
      (data.observacoes ? `\nObservações: ${data.observacoes}\n` : "")
    );

    window.toast(`Solicitação ${protocolo} enviada!`, "success", 4500);
    form.reset();
    renderSub();
    render();

    setTimeout(() => {
      window.open(`https://wa.me/prolans?text=${msg}`, "_blank");
    }, 700);
  });

  // Pré-seleção via querystring (?s=cftv)
  const params = new URLSearchParams(location.search);
  const s = params.get("s");
  if (s && PRICING[s]) {
    const sel = form.querySelector('select[name="servico"]');
    sel.value = s;
    sel.dispatchEvent(new Event("change"));
  }
})();
