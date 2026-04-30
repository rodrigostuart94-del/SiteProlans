/* ============================================================
   PROLANS · Portfólio em PDF
   Layout limpo, fundo único azul sombreado, fitment validado.
   ============================================================ */
(function () {
  const A4_W = 210;
  const A4_H = 297;
  const M = 18;             // margem externa generosa
  const CW = A4_W - 2*M;    // largura útil
  const TOP = 26;           // início do conteúdo (após cabeçalho)
  const BOTTOM = A4_H - 22; // limite inferior (antes do rodapé)

  // Paleta — fundo azul sombreado único + acentos discretos
  const C = {
    bgTop:        [14, 26, 53],      // navy royal mais claro (topo)
    bgMid:        [10, 20, 40],      // intermediário
    bgBottom:     [5, 10, 24],       // quase preto-azulado (base)
    surface:      [19, 30, 61],      // card
    surfaceAlt:   [24, 38, 76],
    border:       [38, 54, 92],      // borda discreta
    borderStrong: [0, 110, 158],     // borda destaque ciano
    primary:      [77, 217, 255],    // ciano suave
    primaryDeep:  [0, 145, 220],
    accent:       [148, 124, 255],
    success:      [76, 235, 180],
    warning:      [255, 196, 100],
    text:         [240, 244, 255],
    textMuted:    [152, 163, 196],
    textDim:      [93, 105, 133],
    white:        [255, 255, 255]
  };

  const F = doc => ({
    fill:   c => doc.setFillColor(c[0], c[1], c[2]),
    stroke: c => doc.setDrawColor(c[0], c[1], c[2]),
    text:   c => doc.setTextColor(c[0], c[1], c[2])
  });

  /* ---------- Imagem ---------- */
  async function loadImage(src) {
    try {
      const r = await fetch(src);
      const b = await r.blob();
      return await new Promise(res => {
        const fr = new FileReader();
        fr.onloadend = () => res(fr.result);
        fr.onerror = () => res(null);
        fr.readAsDataURL(b);
      });
    } catch (e) { return null; }
  }

  /* ---------- Background único sombreado (gradiente vertical) ---------- */
  function background(doc) {
    const f = F(doc);
    // Gradiente em duas fases: topo→meio (mais claro) e meio→base (mais escuro)
    const steps = 60;
    for (let i = 0; i < steps; i++) {
      const t = i / (steps - 1);
      let r, g, bb;
      if (t < 0.5) {
        const k = t / 0.5;
        r = C.bgTop[0] + (C.bgMid[0] - C.bgTop[0]) * k;
        g = C.bgTop[1] + (C.bgMid[1] - C.bgTop[1]) * k;
        bb = C.bgTop[2] + (C.bgMid[2] - C.bgTop[2]) * k;
      } else {
        const k = (t - 0.5) / 0.5;
        r = C.bgMid[0] + (C.bgBottom[0] - C.bgMid[0]) * k;
        g = C.bgMid[1] + (C.bgBottom[1] - C.bgMid[1]) * k;
        bb = C.bgMid[2] + (C.bgBottom[2] - C.bgMid[2]) * k;
      }
      f.fill([Math.round(r), Math.round(g), Math.round(bb)]);
      doc.rect(0, (A4_H * i) / steps, A4_W, A4_H / steps + 0.5, 'F');
    }
  }

  /* ---------- Cabeçalho/Rodapé sutis ---------- */
  function header(doc) {
    const f = F(doc);
    f.text(C.primary);
    doc.setFontSize(7.5);
    doc.setFont('helvetica', 'bold');
    doc.setCharSpace(1.2);
    doc.text('PROLANS', M, 14);
    doc.setCharSpace(0);
    f.text(C.textMuted);
    doc.setFont('helvetica', 'normal');
    doc.text('Portfólio Oficial · 2026', A4_W - M, 14, { align: 'right' });

    f.stroke(C.border);
    doc.setLineWidth(0.15);
    doc.line(M, 18, A4_W - M, 18);
  }

  function footer(doc, n, total) {
    const f = F(doc);
    f.stroke(C.border);
    doc.setLineWidth(0.15);
    doc.line(M, A4_H - 18, A4_W - M, A4_H - 18);

    f.text(C.textDim);
    doc.setFontSize(7);
    doc.setFont('helvetica', 'normal');
    doc.text('contato@prolans.com.br  ·  (21) 99711-2008', M, A4_H - 12);

    f.text(C.primary);
    doc.setFont('helvetica', 'bold');
    doc.text(String(n).padStart(2,'0') + ' / ' + String(total).padStart(2,'0'),
      A4_W - M, A4_H - 12, { align: 'right' });
  }

  /* ---------- Elementos básicos ---------- */
  function eyebrow(doc, x, y, label, color) {
    const f = F(doc);
    f.text(color || C.primary);
    doc.setFontSize(7.5);
    doc.setFont('helvetica', 'bold');
    doc.setCharSpace(1.4);
    doc.text(label, x, y);
    doc.setCharSpace(0);
  }

  // Título de seção limpo (eyebrow + título + descrição + linha sutil)
  function sectionTitle(doc, num, eyebrowLabel, title, subtitle, y) {
    const f = F(doc);
    eyebrow(doc, M, y, num + ' · ' + eyebrowLabel);
    y += 9;

    f.text(C.white);
    doc.setFontSize(22);
    doc.setFont('helvetica', 'bold');
    const tLines = doc.splitTextToSize(title, CW * 0.9);
    doc.text(tLines, M, y);
    y += tLines.length * 8;

    if (subtitle) {
      y += 2;
      f.text(C.textMuted);
      doc.setFontSize(10);
      doc.setFont('helvetica', 'normal');
      const sLines = doc.splitTextToSize(subtitle, CW * 0.88);
      doc.text(sLines, M, y);
      y += sLines.length * 5;
    }

    y += 6;
    f.stroke(C.borderStrong);
    doc.setLineWidth(0.6);
    doc.line(M, y, M + 22, y);
    return y + 8;
  }

  function card(doc, x, y, w, h, opts) {
    opts = opts || {};
    const f = F(doc);
    f.fill(opts.fill || C.surface);
    f.stroke(opts.stroke || C.border);
    doc.setLineWidth(opts.lineWidth || 0.25);
    doc.roundedRect(x, y, w, h, 2.5, 2.5, 'FD');
  }

  // Quadradinho com glyph (contorno fino, alinhado)
  function iconBadge(doc, x, y, size, glyph, color) {
    const f = F(doc);
    f.fill(C.surfaceAlt);
    f.stroke(color || C.borderStrong);
    doc.setLineWidth(0.3);
    doc.roundedRect(x, y, size, size, 1.6, 1.6, 'FD');
    if (glyph) {
      f.text(color || C.primary);
      doc.setFontSize(size * 1.2);
      doc.setFont('helvetica', 'bold');
      doc.text(glyph, x + size/2, y + size * 0.74, { align: 'center' });
    }
  }

  // Bullet ponto ciano
  function bullet(doc, x, y, color) {
    const f = F(doc);
    f.fill(color || C.primary);
    doc.circle(x, y, 0.7, 'F');
  }

  // Quote / frase de impacto centralizada
  function impactLine(doc, y, text) {
    const f = F(doc);
    f.text(C.primary);
    doc.setFontSize(11);
    doc.setFont('helvetica', 'italic');
    doc.text(text, A4_W/2, y, { align: 'center' });
  }

  // Hairline sutil para dividir blocos
  function hairline(doc, y) {
    F(doc).stroke(C.border);
    doc.setLineWidth(0.15);
    doc.line(M, y, A4_W - M, y);
  }

  /* ============================================================
     PÁGINA 1 · CAPA
     ============================================================ */
  async function pageCover(doc, logo) {
    background(doc);
    const f = F(doc);

    // Logo no centro
    const logoSize = 32;
    const logoX = (A4_W - logoSize) / 2;
    const logoY = 80;

    // Moldura sutil em volta do logo
    f.fill(C.surface);
    f.stroke(C.borderStrong);
    doc.setLineWidth(0.4);
    doc.roundedRect(logoX - 6, logoY - 6, logoSize + 12, logoSize + 12, 4, 4, 'FD');
    if (logo) {
      try { doc.addImage(logo, 'PNG', logoX, logoY, logoSize, logoSize); } catch(e) {}
    }

    let y = logoY + logoSize + 22;

    // Eyebrow
    f.text(C.primary);
    doc.setFontSize(8);
    doc.setFont('helvetica', 'bold');
    doc.setCharSpace(1.8);
    doc.text('PORTFÓLIO OFICIAL · 2026', A4_W/2, y, { align: 'center' });
    doc.setCharSpace(0);
    y += 14;

    // Título
    f.text(C.white);
    doc.setFontSize(38);
    doc.setFont('helvetica', 'bold');
    doc.text('Prolans', A4_W/2, y, { align: 'center' });
    y += 11;

    f.text(C.text);
    doc.setFontSize(14);
    doc.setFont('helvetica', 'normal');
    doc.text('Soluções em Tecnologia e Serviços', A4_W/2, y, { align: 'center' });
    y += 14;

    // Linha decorativa
    f.stroke(C.borderStrong);
    doc.setLineWidth(0.5);
    doc.line(A4_W/2 - 14, y, A4_W/2 + 14, y);
    y += 12;

    // Slogan
    f.text(C.textMuted);
    doc.setFontSize(11);
    doc.setFont('helvetica', 'italic');
    doc.text('Protegendo o presente, garantindo o futuro.', A4_W/2, y, { align: 'center' });

    // Meta info no rodapé
    y = A4_H - 60;
    const cardW = 130;
    f.fill(C.surface);
    f.stroke(C.border);
    doc.setLineWidth(0.25);
    doc.roundedRect((A4_W - cardW)/2, y, cardW, 30, 3, 3, 'FD');

    f.text(C.textMuted);
    doc.setFontSize(8);
    doc.setFont('helvetica', 'bold');
    doc.setCharSpace(1.2);
    doc.text('FUNDADA', (A4_W - cardW)/2 + cardW * 0.18, y + 11, { align: 'center' });
    doc.text('SEDE',     (A4_W - cardW)/2 + cardW * 0.50, y + 11, { align: 'center' });
    doc.text('CNPJ',     (A4_W - cardW)/2 + cardW * 0.82, y + 11, { align: 'center' });
    doc.setCharSpace(0);

    f.text(C.white);
    doc.setFontSize(9.5);
    doc.setFont('helvetica', 'bold');
    doc.text('Ago/2020',     (A4_W - cardW)/2 + cardW * 0.18, y + 20, { align: 'center' });
    doc.text('Teresópolis · RJ', (A4_W - cardW)/2 + cardW * 0.50, y + 20, { align: 'center' });
    doc.text('38.408.286/0001-11', (A4_W - cardW)/2 + cardW * 0.82, y + 20, { align: 'center' });

    y = A4_H - 22;
    f.text(C.textDim);
    doc.setFontSize(7.5);
    doc.setFont('helvetica', 'normal');
    doc.setCharSpace(1.5);
    doc.text('SEGURANÇA   ·   AUTOMAÇÃO   ·   REDES   ·   MANUTENÇÃO', A4_W/2, y, { align: 'center' });
    doc.setCharSpace(0);
  }

  /* ============================================================
     PÁGINA 2 · QUEM SOMOS
     ============================================================ */
  function pageQuemSomos(doc) {
    background(doc); header(doc);
    const f = F(doc);

    let y = TOP + 4;
    y = sectionTitle(doc, '01', 'QUEM SOMOS',
      'Tecnologia que protege, conecta\ne simplifica a sua rotina.',
      'Atendendo Teresópolis e a Região Serrana desde 2020 com soluções integradas em segurança e tecnologia.', y);

    // Texto histórico
    f.text(C.text);
    doc.setFontSize(9.5);
    doc.setFont('helvetica', 'normal');
    const historia = [
      'A Prolans nasceu de um sonho simples e poderoso: o sonho da liberdade financeira e de construir algo verdadeiro, com propósito. Em 01 de março de 2020, ainda com outro nome e visão em formação, demos o primeiro passo dessa jornada.',
      'Em agosto de 2020, a empresa nasceu oficialmente como Prolans, agora com identidade, metas claras e missão definida: levar segurança e tecnologia de qualidade para pessoas e empresas, com atendimento humano e suporte de verdade.',
      'Por trás de tudo está Rodrigo Machado, fundador, técnico e o sonhador que acreditou no projeto desde o primeiro dia. Hoje, somos uma solução completa em segurança eletrônica, automação, redes e manutenção.'
    ];
    historia.forEach(p => {
      const lines = doc.splitTextToSize(p, CW);
      lines.forEach(l => { doc.text(l, M, y); y += 5.2; });
      y += 4;
    });

    y += 4;
    hairline(doc, y);
    y += 10;

    // Mini-eyebrow para timeline
    eyebrow(doc, M, y, 'NOSSA TRAJETÓRIA');
    y += 9;

    const events = [
      { d: '01·MAR·2020', t: 'O sonho começou',
        s: 'Primeira semente, ainda em formação, movida pelo desejo de construir algo de verdade.' },
      { d: 'AGO·2020',    t: 'Nasce a Prolans',
        s: 'Identidade, propósito e direção. Empresa pronta para entregar valor.' },
      { d: '2021—2025',   t: 'Crescimento sólido',
        s: 'Parcerias com clientes referência da região e portfólio em expansão.' },
      { d: 'HOJE',        t: 'Solução completa',
        s: 'Da câmera ao plano de manutenção. Atendimento direto e humano.' }
    ];
    events.forEach(ev => {
      const isToday = ev.d === 'HOJE';
      const h = 16;
      card(doc, M, y, CW, h, {
        fill: C.surface,
        stroke: isToday ? C.borderStrong : C.border,
        lineWidth: isToday ? 0.5 : 0.25
      });

      f.text(isToday ? C.success : C.primary);
      doc.setFontSize(7.5);
      doc.setFont('helvetica', 'bold');
      doc.setCharSpace(1);
      doc.text(ev.d, M + 6, y + 6.5);
      doc.setCharSpace(0);

      f.text(C.white);
      doc.setFontSize(10);
      doc.setFont('helvetica', 'bold');
      doc.text(ev.t, M + 42, y + 6.5);

      f.text(C.textMuted);
      doc.setFontSize(8.5);
      doc.setFont('helvetica', 'normal');
      doc.text(ev.s, M + 42, y + 12);

      y += h + 3;
    });

    footer(doc, 2, 10);
  }

  /* ============================================================
     PÁGINA 3 · IDENTIDADE (Missão, Visão, Valores + Diferenciais)
     ============================================================ */
  function pageIdentidade(doc) {
    background(doc); header(doc);
    const f = F(doc);

    let y = TOP + 4;
    y = sectionTitle(doc, '02', 'IDENTIDADE',
      'Missão, Visão e Valores',
      'Os pilares que sustentam tudo o que fazemos.', y);

    const mvv = [
      { glyph: '◎', t: 'Missão',
        s: 'Garantir que nossos clientes se sintam seguros, conectados e tranquilos em todos os momentos, com soluções confiáveis e suporte de excelência.' },
      { glyph: '◉', t: 'Visão',
        s: 'Ser referência em segurança e tecnologia na Região Serrana, reconhecida pela confiança, pela entrega e pelo compromisso real com cada cliente.' },
      { glyph: '♦', t: 'Valores',
        s: 'Fé, gratidão, compromisso, transparência, qualidade e inovação. Fazer mais do que o esperado e entregar tranquilidade, sempre.' }
    ];
    mvv.forEach(it => {
      const h = 28;
      card(doc, M, y, CW, h);
      iconBadge(doc, M + 6, y + 6, 10, it.glyph, C.primary);

      f.text(C.white);
      doc.setFontSize(12);
      doc.setFont('helvetica', 'bold');
      doc.text(it.t, M + 22, y + 11);

      f.text(C.textMuted);
      doc.setFontSize(9);
      doc.setFont('helvetica', 'normal');
      const lines = doc.splitTextToSize(it.s, CW - 28);
      doc.text(lines, M + 22, y + 17);

      y += h + 4;
    });

    y += 4;
    hairline(doc, y);
    y += 10;

    eyebrow(doc, M, y, 'POR QUE A PROLANS');
    y += 9;

    f.text(C.white);
    doc.setFontSize(14);
    doc.setFont('helvetica', 'bold');
    doc.text('O que nos torna diferentes', M, y);
    y += 8;

    const diffs = [
      { num: '6+',   l: 'anos de mercado e clientes referência' },
      { num: '13+',  l: 'anos de experiência técnica do fundador' },
      { num: '40+',  l: 'cursos e capacitações na área' },
      { num: '100%', l: 'atendimento humano via WhatsApp' }
    ];
    const dW = (CW - 12) / 4;
    diffs.forEach((d, i) => {
      const x = M + i * (dW + 4);
      card(doc, x, y, dW, 26);
      f.text(C.primary);
      doc.setFontSize(20);
      doc.setFont('helvetica', 'bold');
      doc.text(d.num, x + dW/2, y + 12, { align: 'center' });
      f.text(C.textMuted);
      doc.setFontSize(7.5);
      doc.setFont('helvetica', 'normal');
      const lines = doc.splitTextToSize(d.l, dW - 6);
      doc.text(lines, x + dW/2, y + 18, { align: 'center' });
    });

    footer(doc, 3, 10);
  }

  /* ============================================================
     PÁGINAS 4 e 5 · SOLUÇÕES (3 + 3, em coluna única arejada)
     ============================================================ */
  const SOLUTIONS = [
    { t: 'Segurança Eletrônica', g: '◊',
      lead: 'Olhos atentos 24h em cada canto do seu espaço. Veja tudo de qualquer lugar, em tempo real.',
      items: ['Câmeras CFTV (Full HD, 4K, Wi-Fi)','Sistemas de alarme com sensores e sirenes','Monitoramento remoto pelo celular','Visão noturna e detecção de movimento'] },
    { t: 'Controle de Acesso', g: '⊙',
      lead: 'Quem entra, quando entra e por onde passa — você no comando, sem chaves perdidas.',
      items: ['Fechaduras digitais (senha, biometria, tag)','Interfones e vídeoporteiros inteligentes','Reconhecimento facial corporativo','Gestão de visitantes e horários'] },
    { t: 'Redes e Conectividade', g: '≋',
      lead: 'Internet rápida, estável e com cobertura em cada cantinho — pronta para trabalho e lazer.',
      items: ['Wi-Fi profissional (Mesh e Wi-Fi 6)','Cabeamento estruturado','Redes corporativas com segurança','Diagnóstico de pontos cegos'] },
    { t: 'Automação Inteligente', g: '⌂',
      lead: 'Sua casa respondendo à sua voz, ao seu toque ou sozinha — do jeito que você quiser.',
      items: ['Integração com Alexa e Google Assistente','Iluminação inteligente e cenas programadas','Tomadas, cortinas e portões via app','Cenários automáticos (chegar, dormir)'] },
    { t: 'Infraestrutura e Elétrica', g: '⚡',
      lead: 'A base bem feita evita dor de cabeça lá na frente. Cada cabo no lugar certo.',
      items: ['Instalações elétricas residenciais e comerciais','Quadros e proteção contra surtos','Organização e melhoria de redes','Adequações para automação'] },
    { t: 'Manutenção', g: '⚙',
      lead: 'Seu sistema sempre funcionando — sem surpresas, sem stress, sem falha quando precisar.',
      items: ['Manutenção preventiva periódica','Manutenção corretiva ágil','Planos mensais com prioridade','Limpeza, calibragem e firmware'] }
  ];

  function pageSolucoes(doc, slice, pageNum, isFirst) {
    background(doc); header(doc);
    const f = F(doc);

    let y = TOP + 4;
    if (isFirst) {
      y = sectionTitle(doc, '03', 'NOSSAS SOLUÇÕES',
        'Tudo que você precisa\nem um só lugar.',
        'Seis frentes integradas para proteger, automatizar e conectar a sua casa, comércio ou empresa.', y);
    } else {
      y = sectionTitle(doc, '03', 'NOSSAS SOLUÇÕES (CONTINUAÇÃO)',
        'Mais soluções para o seu dia a dia.', '', y);
    }

    slice.forEach(s => {
      // Calcula altura dinâmica do card
      const leadLines = doc.splitTextToSize(s.lead, CW - 16);
      const itemLines = s.items.map(it => doc.splitTextToSize(it, CW - 30));
      const itemsHeight = itemLines.reduce((acc, ll) => acc + ll.length * 4 + 2, 0);
      const h = 14 + leadLines.length * 4 + 4 + itemsHeight + 4;

      card(doc, M, y, CW, h);

      // Cabeçalho do card
      iconBadge(doc, M + 6, y + 6, 10, s.g, C.primary);
      f.text(C.white);
      doc.setFontSize(13);
      doc.setFont('helvetica', 'bold');
      doc.text(s.t, M + 22, y + 12);

      // Lead
      f.text(C.textMuted);
      doc.setFontSize(9);
      doc.setFont('helvetica', 'italic');
      doc.text(leadLines, M + 6, y + 20);

      // Items em 2 colunas
      let ly = y + 20 + leadLines.length * 4 + 4;
      const colItem = Math.ceil(s.items.length / 2);
      const colW = (CW - 24) / 2;
      f.text(C.text);
      doc.setFontSize(8.5);
      doc.setFont('helvetica', 'normal');
      itemLines.forEach((lines, idx) => {
        const col = Math.floor(idx / colItem);
        const row = idx % colItem;
        const cx = M + 10 + col * (colW + 8);
        const cy = ly + row * 7;
        bullet(doc, cx, cy - 1.4, C.primary);
        doc.text(lines, cx + 3.5, cy);
      });

      y += h + 6;
    });

    footer(doc, pageNum, 10);
  }

  /* ============================================================
     PÁGINA 6 · BENEFÍCIOS
     ============================================================ */
  function pageBeneficios(doc) {
    background(doc); header(doc);
    const f = F(doc);

    let y = TOP + 4;
    y = sectionTitle(doc, '04', 'BENEFÍCIOS',
      'Por que contratar a Prolans',
      'Mais que instalar equipamentos, entregamos tranquilidade.', y);

    const items = [
      { t: 'Segurança real', d: 'Equipamentos de qualidade e cobertura sem pontos cegos.' },
      { t: 'Atendimento humano', d: 'Você fala direto com quem entende. Sem robôs, sem fila.' },
      { t: '100% personalizado', d: 'Cada projeto sob medida. Nada de pacote pronto.' },
      { t: 'Equipamentos confiáveis', d: 'Marcas reconhecidas e com garantia de fábrica.' },
      { t: 'Suporte especializado', d: 'Mais de 13 anos de experiência prática e 40+ capacitações.' },
      { t: 'Economia a longo prazo', d: 'Instalação correta na primeira vez evita retrabalho.' },
      { t: 'Empresa de referência', d: 'Confiada por Rio Sul, Zimbrão, Burrata, Unifeso e outros.' },
      { t: 'Transparência total', d: 'Orçamento detalhado, prazos claros, sem surpresas.' }
    ];
    const colW = (CW - 6) / 2;
    const h = 24;
    items.forEach((b, i) => {
      const col = i % 2, row = Math.floor(i / 2);
      const x = M + col * (colW + 6);
      const yy = y + row * (h + 5);

      card(doc, x, yy, colW, h);

      // Check verde
      f.fill([18, 50, 38]);
      f.stroke(C.success);
      doc.setLineWidth(0.35);
      doc.roundedRect(x + 6, yy + 6, 8, 8, 1.6, 1.6, 'FD');
      f.text(C.success);
      doc.setFontSize(9);
      doc.setFont('helvetica', 'bold');
      doc.text('✓', x + 10, yy + 11.6, { align: 'center' });

      f.text(C.white);
      doc.setFontSize(10);
      doc.setFont('helvetica', 'bold');
      doc.text(b.t, x + 18, yy + 9);

      f.text(C.textMuted);
      doc.setFontSize(8);
      doc.setFont('helvetica', 'normal');
      const lines = doc.splitTextToSize(b.d, colW - 22);
      doc.text(lines, x + 18, yy + 14.5);
    });

    footer(doc, 6, 10);
  }

  /* ============================================================
     PÁGINA 7 · PROCESSO
     ============================================================ */
  function pageProcesso(doc) {
    background(doc); header(doc);
    const f = F(doc);

    let y = TOP + 4;
    y = sectionTitle(doc, '05', 'PROCESSO',
      'Como funciona, do primeiro\ncontato à entrega.',
      'Um caminho simples, transparente e sem mistério. Você sabe sempre o próximo passo.', y);

    const steps = [
      { t: 'Atendimento inicial', d: 'Você fala com a gente pelo WhatsApp, e-mail ou formulário. Resposta rápida e humana.' },
      { t: 'Levantamento de necessidade', d: 'Entendemos seu cenário, suas dores e o que você quer resolver.' },
      { t: 'Visita técnica', d: 'Avaliação no local da estrutura, ângulos, distâncias e pontos críticos.' },
      { t: 'Proposta personalizada', d: 'Orçamento detalhado, com escopo, prazo e cada item bem explicado.' },
      { t: 'Instalação profissional', d: 'Equipe qualificada com cuidado, organização e respeito ao seu espaço.' },
      { t: 'Suporte contínuo', d: 'Treinamento, acompanhamento e canal direto sempre que precisar.' }
    ];
    const colW = (CW - 6) / 2;
    const h = 30;
    steps.forEach((s, i) => {
      const col = i % 2, row = Math.floor(i / 2);
      const x = M + col * (colW + 6);
      const yy = y + row * (h + 6);

      card(doc, x, yy, colW, h);

      // Numerador (badge sutil)
      f.fill(C.primary);
      doc.roundedRect(x + 6, yy - 4, 14, 9, 1.8, 1.8, 'F');
      f.text([5, 16, 35]);
      doc.setFontSize(10);
      doc.setFont('helvetica', 'bold');
      doc.text(String(i+1).padStart(2,'0'), x + 13, yy + 2.4, { align: 'center' });

      f.text(C.white);
      doc.setFontSize(11);
      doc.setFont('helvetica', 'bold');
      doc.text(s.t, x + 6, yy + 13);

      f.text(C.textMuted);
      doc.setFontSize(8.5);
      doc.setFont('helvetica', 'normal');
      const lines = doc.splitTextToSize(s.d, colW - 12);
      doc.text(lines, x + 6, yy + 19);
    });

    footer(doc, 7, 10);
  }

  /* ============================================================
     PÁGINA 8 · PLANOS
     ============================================================ */
  function pagePlanos(doc) {
    background(doc); header(doc);
    const f = F(doc);

    let y = TOP + 4;
    y = sectionTitle(doc, '06', 'MODELOS DE CONTRATAÇÃO',
      'Planos que cabem no\nseu jeito de contratar.',
      'Projeto pontual, manutenção mensal ou plano de assinatura premium.', y);

    const plans = [
      { tag: 'MODELO 01', t: 'Projeto Personalizado',
        d: 'Instalação sob medida com escopo definido e entrega completa.',
        items: ['Visita técnica e orçamento','Equipamentos de qualidade','Mão de obra certificada','Garantia na execução','Treinamento pós-instalação'] },
      { tag: 'MODELO 02', t: 'Manutenção Mensal',
        d: 'Mensalidade que cuida do seu sistema todo mês.',
        items: ['Visitas preventivas periódicas','Limpeza e checagem','Atendimento prioritário','Atualização de firmware','Pequenos reparos sem custo'] },
      { tag: '★ PREMIUM', t: 'Signature+',
        d: 'Plano completo com benefícios exclusivos.',
        items: ['Tudo da Manutenção Mensal','Desconto em mão de obra','Vantagens em novos projetos','SLA prioritário','Atendimento dedicado'],
        featured: true }
    ];
    const colW = (CW - 12) / 3;
    const h = 130;
    plans.forEach((p, i) => {
      const x = M + i * (colW + 6);
      card(doc, x, y, colW, h, {
        fill: p.featured ? C.surfaceAlt : C.surface,
        stroke: p.featured ? C.borderStrong : C.border,
        lineWidth: p.featured ? 0.6 : 0.25
      });

      f.text(p.featured ? C.accent : C.primary);
      doc.setFontSize(7.5);
      doc.setFont('helvetica', 'bold');
      doc.setCharSpace(1.4);
      doc.text(p.tag, x + 6, y + 8);
      doc.setCharSpace(0);

      f.text(C.white);
      doc.setFontSize(13);
      doc.setFont('helvetica', 'bold');
      const tLines = doc.splitTextToSize(p.t, colW - 12);
      doc.text(tLines, x + 6, y + 18);
      let cy = y + 18 + tLines.length * 5;

      f.text(C.textMuted);
      doc.setFontSize(8.5);
      doc.setFont('helvetica', 'italic');
      const dLines = doc.splitTextToSize(p.d, colW - 12);
      doc.text(dLines, x + 6, cy + 4);
      cy += dLines.length * 4 + 8;

      // Items
      f.text(C.text);
      doc.setFontSize(8.5);
      doc.setFont('helvetica', 'normal');
      p.items.forEach(it => {
        bullet(doc, x + 7, cy - 1.2, p.featured ? C.accent : C.primary);
        const lines = doc.splitTextToSize(it, colW - 14);
        doc.text(lines, x + 11, cy);
        cy += lines.length * 4 + 1.5;
      });
    });

    // Faixa "cliente recorrente"
    y += h + 8;
    f.fill(C.surface);
    f.stroke(C.borderStrong);
    doc.setLineWidth(0.4);
    doc.roundedRect(M, y, CW, 18, 2.5, 2.5, 'FD');
    f.text(C.white);
    doc.setFontSize(9.5);
    doc.setFont('helvetica', 'bold');
    doc.text('Cliente recorrente sai ganhando.', M + 6, y + 8);
    f.text(C.textMuted);
    doc.setFontSize(8.5);
    doc.setFont('helvetica', 'normal');
    doc.text('Desconto em mão de obra, prioridade no atendimento e vantagens em novos projetos.', M + 6, y + 13.5);

    footer(doc, 8, 10);
  }

  /* ============================================================
     PÁGINA 9 · PAGAMENTO + GARANTIAS
     ============================================================ */
  function pagePagamentoGarantia(doc) {
    background(doc); header(doc);
    const f = F(doc);

    let y = TOP + 4;
    y = sectionTitle(doc, '07', 'PAGAMENTO',
      'Formas de pagamento flexíveis',
      'Escolha a opção que funciona melhor para você.', y);

    const pays = [
      { g: '$', t: 'À vista', d: 'PIX ou dinheiro com desconto.' },
      { g: '▣', t: 'Cartão',  d: 'Parcelamento facilitado.' },
      { g: '▤', t: 'Boleto',  d: 'Para empresas, com prazos.' },
      { g: '↻', t: 'Mensal',  d: 'Para planos de manutenção.' }
    ];
    const pW = (CW - 12) / 4;
    pays.forEach((p, i) => {
      const x = M + i * (pW + 4);
      card(doc, x, y, pW, 36);
      iconBadge(doc, x + (pW - 11)/2, y + 5, 11, p.g, C.primary);
      f.text(C.white);
      doc.setFontSize(10);
      doc.setFont('helvetica', 'bold');
      doc.text(p.t, x + pW/2, y + 23, { align: 'center' });
      f.text(C.textMuted);
      doc.setFontSize(7.5);
      doc.setFont('helvetica', 'normal');
      const lines = doc.splitTextToSize(p.d, pW - 4);
      doc.text(lines, x + pW/2, y + 28, { align: 'center' });
    });

    y += 50;
    hairline(doc, y - 8);

    y = sectionTitle(doc, '08', 'GARANTIAS',
      'Nossos compromissos com você',
      'Estamos com você antes, durante e depois.', y);

    const seals = [
      { g: '✓', t: 'Qualidade na execução', d: 'Cada projeto entregue com cuidado, organização e padrão técnico.' },
      { g: '◉', t: 'Transparência total',   d: 'Orçamento aberto, escopo claro, prazos realistas, sem cobrança surpresa.' },
      { g: '☎', t: 'Suporte pós-venda',     d: 'Canal direto pelo WhatsApp. Atendimento de quem entende do produto.' },
      { g: '★', t: 'Compromisso com resultado', d: 'Trabalhamos até o sistema funcionar como você espera.' }
    ];
    const sCol = (CW - 6) / 2;
    seals.forEach((s, i) => {
      const col = i % 2, row = Math.floor(i / 2);
      const x = M + col * (sCol + 6);
      const yy = y + row * 28;
      card(doc, x, yy, sCol, 24);
      iconBadge(doc, x + 6, yy + 6, 10, s.g, C.warning);
      f.text(C.white);
      doc.setFontSize(10);
      doc.setFont('helvetica', 'bold');
      doc.text(s.t, x + 22, yy + 9);
      f.text(C.textMuted);
      doc.setFontSize(8);
      doc.setFont('helvetica', 'normal');
      const lines = doc.splitTextToSize(s.d, sCol - 26);
      doc.text(lines, x + 22, yy + 14.5);
    });

    footer(doc, 9, 10);
  }

  /* ============================================================
     PÁGINA 10 · FECHAMENTO + CONTATO
     ============================================================ */
  function pageFechamento(doc) {
    background(doc); header(doc);
    const f = F(doc);

    let y = TOP + 4;

    // CTA Banner
    const bannerH = 60;
    f.fill(C.surfaceAlt);
    f.stroke(C.borderStrong);
    doc.setLineWidth(0.5);
    doc.roundedRect(M, y, CW, bannerH, 4, 4, 'FD');

    eyebrow(doc, M + 8, y + 10, 'VAMOS COMEÇAR');

    f.text(C.white);
    doc.setFontSize(18);
    doc.setFont('helvetica', 'bold');
    const ttl = doc.splitTextToSize('Pronto para elevar a segurança e a tecnologia do seu espaço?', CW - 16);
    doc.text(ttl, M + 8, y + 22);

    f.text(C.textMuted);
    doc.setFontSize(9.5);
    doc.setFont('helvetica', 'normal');
    const sub = doc.splitTextToSize('O melhor momento para proteger e modernizar é antes de precisar. A gente faz isso por você, do jeito que precisa ser feito.', CW - 16);
    doc.text(sub, M + 8, y + 22 + ttl.length * 6 + 3);

    f.text(C.primary);
    doc.setFontSize(7.5);
    doc.setFont('helvetica', 'bold');
    doc.setCharSpace(1);
    doc.text('✓ RESPOSTA RÁPIDA      ✓ VISITA SEM COMPROMISSO      ✓ ATENDIMENTO HUMANO',
      M + 8, y + bannerH - 6);
    doc.setCharSpace(0);

    y += bannerH + 14;

    // CONTATO
    y = sectionTitle(doc, '09', 'CONTATO',
      'Fale com a Prolans',
      'Escolha o canal que preferir, respondemos rapidinho.', y);

    const contacts = [
      { g: '☎', l: 'WHATSAPP / TEL', v: '(21) 99711-2008' },
      { g: '✉', l: 'E-MAIL',         v: 'contato@prolans.com.br' },
      { g: '@', l: 'INSTAGRAM',      v: '@contato.prolans' },
      { g: '⊕', l: 'SITE',           v: 'www.prolans.com.br' }
    ];
    const cW = (CW - 12) / 4;
    contacts.forEach((c, i) => {
      const x = M + i * (cW + 4);
      card(doc, x, y, cW, 28);
      iconBadge(doc, x + 4, y + 5, 8, c.g, C.primary);

      f.text(C.textMuted);
      doc.setFontSize(6.5);
      doc.setFont('helvetica', 'bold');
      doc.setCharSpace(1);
      doc.text(c.l, x + 14, y + 9);
      doc.setCharSpace(0);

      f.text(C.white);
      doc.setFontSize(8.8);
      doc.setFont('helvetica', 'bold');
      doc.text(c.v, x + 14, y + 16);
    });

    y += 34;

    // Endereço (linha cheia)
    card(doc, M, y, CW, 22);
    iconBadge(doc, M + 6, y + 6, 10, '◉', C.primary);
    f.text(C.textMuted);
    doc.setFontSize(7);
    doc.setFont('helvetica', 'bold');
    doc.setCharSpace(1.2);
    doc.text('ENDEREÇO', M + 22, y + 9);
    doc.setCharSpace(0);
    f.text(C.white);
    doc.setFontSize(10);
    doc.setFont('helvetica', 'bold');
    doc.text('Praça Baltazar da Silveira, 90 · Várzea, Teresópolis/RJ', M + 22, y + 16);

    // Assinatura
    y = A4_H - 36;
    hairline(doc, y);
    y += 7;
    f.text(C.primary);
    doc.setFontSize(8);
    doc.setFont('helvetica', 'bold');
    doc.setCharSpace(1.2);
    doc.text('PROLANS · CNPJ 38.408.286/0001-11', A4_W/2, y, { align: 'center' });
    doc.setCharSpace(0);
    y += 5;
    f.text(C.textMuted);
    doc.setFontSize(8.5);
    doc.setFont('helvetica', 'italic');
    doc.text('© ' + new Date().getFullYear() + ' Prolans · Protegendo o presente, garantindo o futuro.',
      A4_W/2, y, { align: 'center' });

    footer(doc, 10, 10);
  }

  /* ============================================================
     ENTRADA — gera o PDF completo
     ============================================================ */
  async function generatePortfolioPDF() {
    if (!window.jspdf || !window.jspdf.jsPDF) throw new Error('jsPDF não carregado');
    const { jsPDF } = window.jspdf;
    const doc = new jsPDF({ unit: 'mm', format: 'a4', orientation: 'portrait', compress: true });

    const logo = await Promise.race([
      loadImage('assets/img/logo-prolans.png'),
      new Promise(r => setTimeout(() => r(null), 4000))
    ]);

    await pageCover(doc, logo);
    doc.addPage(); pageQuemSomos(doc);
    doc.addPage(); pageIdentidade(doc);
    doc.addPage(); pageSolucoes(doc, SOLUTIONS.slice(0, 3), 4, true);
    doc.addPage(); pageSolucoes(doc, SOLUTIONS.slice(3, 6), 5, false);
    doc.addPage(); pageBeneficios(doc);
    doc.addPage(); pageProcesso(doc);
    doc.addPage(); pagePlanos(doc);
    doc.addPage(); pagePagamentoGarantia(doc);
    doc.addPage(); pageFechamento(doc);

    doc.save('Portfolio-Prolans-2026.pdf');
  }

  window.ProlansPDF = { generate: generatePortfolioPDF };
})();
