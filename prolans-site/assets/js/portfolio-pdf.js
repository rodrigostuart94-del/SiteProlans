/* ============================================================
   PROLANS · Gerador de PDF do Portfólio
   Desenha um PDF A4 página a página com o design escuro
   azul/ciano do site, usando jsPDF diretamente.
   ============================================================ */
(function () {
  const A4_W = 210;
  const A4_H = 297;
  const M = 14;          // margem padrão
  const CW = A4_W - 2*M; // largura útil

  const C = {
    bg:           [6, 9, 18],
    bg2:          [10, 15, 28],
    surface:      [15, 21, 37],
    surface2:     [20, 27, 48],
    border:       [28, 38, 64],
    borderStrong: [0, 90, 130],
    primary:      [0, 212, 255],
    primaryDark:  [0, 110, 200],
    accent:       [124, 92, 255],
    success:      [0, 230, 168],
    warning:      [255, 181, 71],
    text:         [230, 236, 255],
    textMuted:    [138, 150, 179],
    textDim:      [90, 101, 132],
    white:        [255, 255, 255]
  };

  const F = doc => ({ fill: c => doc.setFillColor(c[0],c[1],c[2]),
                      stroke: c => doc.setDrawColor(c[0],c[1],c[2]),
                      text: c => doc.setTextColor(c[0],c[1],c[2]) });

  /* ---------- Helpers de imagem ---------- */
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

  /* ---------- Background tecnológico ---------- */
  function drawBackground(doc) {
    const f = F(doc);

    // Base
    f.fill(C.bg);
    doc.rect(0, 0, A4_W, A4_H, 'F');

    // Vinheta superior ciano (simula glow radial)
    for (let i = 18; i >= 0; i--) {
      const a = (18 - i) / 18 * 0.9 + 0.1;
      const r = 4 + (1 - a) * 14;
      const g = 8 + (1 - a) * 18;
      const bb = 18 + (1 - a) * 20;
      f.fill([r, g, bb]);
      doc.rect(0, i * 4, A4_W, 4, 'F');
    }

    // Grid de circuito (linhas finas ciano muito sutis)
    doc.setLineWidth(0.06);
    f.stroke([0, 60, 80]);
    for (let x = 0; x <= A4_W; x += 14) doc.line(x, 0, x, A4_H);
    for (let y = 16; y <= A4_H; y += 14) doc.line(0, y, A4_W, y);

    // Glow inferior roxo discreto
    for (let i = 0; i < 12; i++) {
      const a = i / 12;
      f.fill([6 + a * 4, 9 + a * 6, 18 + a * 8]);
      doc.rect(0, A4_H - 50 + i * 4, A4_W, 4, 'F');
    }
  }

  /* ---------- Componentes de layout ---------- */
  function header(doc) {
    const f = F(doc);
    // Faixa superior
    f.fill([10, 16, 32]);
    doc.rect(0, 0, A4_W, 12, 'F');
    f.stroke(C.borderStrong);
    doc.setLineWidth(0.3);
    doc.line(0, 12, A4_W, 12);

    f.text(C.primary);
    doc.setFontSize(7.2);
    doc.setFont('helvetica', 'bold');
    doc.text('PROLANS · PORTFÓLIO 2026', M, 7.8);

    f.text(C.textMuted);
    doc.setFont('helvetica', 'normal');
    doc.text('Soluções em Tecnologia e Serviços', A4_W - M, 7.8, { align: 'right' });
  }

  function footer(doc, pageNum, totalPages) {
    const f = F(doc);
    f.stroke(C.border);
    doc.setLineWidth(0.2);
    doc.line(M, A4_H - 14, A4_W - M, A4_H - 14);

    f.text(C.textDim);
    doc.setFontSize(7);
    doc.setFont('helvetica', 'normal');
    doc.text('(21) 99711-2008  ·  contato@prolans.com.br  ·  www.prolans.com.br',
      M, A4_H - 8);

    f.text(C.primary);
    doc.setFont('helvetica', 'bold');
    doc.text(String(pageNum).padStart(2,'0') + ' / ' + String(totalPages).padStart(2,'0'),
      A4_W - M, A4_H - 8, { align: 'right' });
  }

  // Eyebrow tag (estilo pill ciano)
  function eyebrow(doc, x, y, label) {
    const f = F(doc);
    doc.setFontSize(7);
    doc.setFont('courier', 'bold');
    const w = doc.getTextWidth(label) + 8;
    f.fill([0, 30, 50]);
    f.stroke(C.borderStrong);
    doc.setLineWidth(0.3);
    doc.roundedRect(x, y - 3.5, w, 5.5, 2.5, 2.5, 'FD');
    f.text(C.primary);
    doc.text(label, x + 4, y);
    return w;
  }

  // Título da seção (com tag # antes)
  function sectionTitle(doc, num, eyebrowLabel, title, subtitle, y) {
    const f = F(doc);
    // Numero
    f.text(C.textDim);
    doc.setFontSize(9);
    doc.setFont('courier', 'normal');
    doc.text('// ' + num, M, y);

    // Eyebrow
    eyebrow(doc, M + 14, y, eyebrowLabel);

    // Title
    y += 10;
    f.text(C.white);
    doc.setFontSize(20);
    doc.setFont('helvetica', 'bold');
    const tLines = doc.splitTextToSize(title, CW);
    doc.text(tLines, M, y);
    y += tLines.length * 7.5;

    // Subtitle
    if (subtitle) {
      y += 1;
      f.text(C.textMuted);
      doc.setFontSize(10);
      doc.setFont('helvetica', 'normal');
      const sLines = doc.splitTextToSize(subtitle, CW * 0.85);
      doc.text(sLines, M, y);
      y += sLines.length * 4.5;
    }

    // Linha decorativa
    y += 4;
    f.stroke(C.borderStrong);
    doc.setLineWidth(0.4);
    doc.line(M, y, M + 30, y);

    return y + 6;
  }

  // Card retangular com borda
  function card(doc, x, y, w, h, opts = {}) {
    const f = F(doc);
    f.fill(opts.fill || C.surface);
    f.stroke(opts.stroke || C.border);
    doc.setLineWidth(opts.lineWidth || 0.3);
    doc.roundedRect(x, y, w, h, 3, 3, 'FD');
  }

  // Quadradinho com ícone (placeholder em forma)
  function iconBox(doc, x, y, size, color, glyph) {
    const f = F(doc);
    f.fill([0, 30, 50]);
    f.stroke(color || C.primary);
    doc.setLineWidth(0.4);
    doc.roundedRect(x, y, size, size, 2, 2, 'FD');
    if (glyph) {
      f.text(color || C.primary);
      doc.setFontSize(size * 1.4);
      doc.setFont('helvetica', 'bold');
      doc.text(glyph, x + size/2, y + size * 0.78, { align: 'center' });
    }
  }

  // Bullet (check estilizado)
  function bulletCheck(doc, x, y, color) {
    const f = F(doc);
    f.fill([0, 60, 90]);
    f.stroke(color || C.primary);
    doc.setLineWidth(0.3);
    doc.circle(x, y, 1.6, 'FD');
    f.stroke(color || C.primary);
    doc.setLineWidth(0.5);
    doc.line(x - 0.7, y, x - 0.1, y + 0.7);
    doc.line(x - 0.1, y + 0.7, x + 0.9, y - 0.7);
  }

  /* ============================================================
     PÁGINA 1 — CAPA
     ============================================================ */
  async function pageCover(doc, logo) {
    drawBackground(doc);
    const f = F(doc);

    // Brilho central
    for (let i = 0; i < 30; i++) {
      const a = i / 30;
      f.fill([6 + a*4, 9 + a*8, 18 + a*16]);
      doc.rect(0, 60 + i, A4_W, 1, 'F');
    }

    // Logo grande centralizado
    const logoSize = 38;
    const logoX = (A4_W - logoSize) / 2;
    const logoY = 60;

    // Caixa decorativa em volta do logo
    f.fill([10, 20, 38]);
    f.stroke(C.borderStrong);
    doc.setLineWidth(0.4);
    doc.roundedRect(logoX - 4, logoY - 4, logoSize + 8, logoSize + 8, 6, 6, 'FD');
    if (logo) {
      try { doc.addImage(logo, 'PNG', logoX, logoY, logoSize, logoSize); } catch(e) {}
    } else {
      // Fallback: letras PR
      f.text(C.primary);
      doc.setFontSize(24);
      doc.setFont('helvetica', 'bold');
      doc.text('PR', A4_W/2, logoY + logoSize/2 + 4, { align: 'center' });
    }

    // Eyebrow "PORTFÓLIO OFICIAL · 2026"
    let y = logoY + logoSize + 18;
    const ebW = 56;
    f.fill([0, 30, 50]);
    f.stroke(C.borderStrong);
    doc.setLineWidth(0.3);
    doc.roundedRect((A4_W - ebW)/2, y - 4, ebW, 6, 3, 3, 'FD');
    f.text(C.primary);
    doc.setFontSize(7.5);
    doc.setFont('courier', 'bold');
    doc.text('PORTFÓLIO OFICIAL · 2026', A4_W/2, y, { align: 'center' });

    // Título
    y += 16;
    f.text(C.white);
    doc.setFontSize(34);
    doc.setFont('helvetica', 'bold');
    doc.text('PROLANS', A4_W/2, y, { align: 'center' });

    y += 11;
    f.text(C.primary);
    doc.setFontSize(16);
    doc.setFont('helvetica', 'normal');
    doc.text('Soluções em Tecnologia e Serviços', A4_W/2, y, { align: 'center' });

    // Slogan
    y += 16;
    f.text(C.textMuted);
    doc.setFontSize(11);
    doc.setFont('helvetica', 'italic');
    doc.text('"Protegendo o presente, garantindo o futuro."', A4_W/2, y, { align: 'center' });

    // Linha
    y += 10;
    f.stroke(C.borderStrong);
    doc.setLineWidth(0.4);
    doc.line(A4_W/2 - 18, y, A4_W/2 + 18, y);

    // Meta info pill
    y += 12;
    const metaLines = [
      'Fundada em Agosto de 2020',
      'Teresópolis · RJ',
      'CNPJ 38.408.286/0001-11'
    ];
    f.fill([10, 18, 36]);
    f.stroke(C.border);
    doc.setLineWidth(0.3);
    const metaW = 130;
    doc.roundedRect((A4_W - metaW)/2, y - 5, metaW, 22, 3, 3, 'FD');
    f.text(C.text);
    doc.setFontSize(9.5);
    doc.setFont('helvetica', 'normal');
    metaLines.forEach((line, i) => {
      doc.text(line, A4_W/2, y + i * 5.5, { align: 'center' });
    });

    // Tagline final
    y = A4_H - 38;
    f.text(C.primary);
    doc.setFontSize(7.5);
    doc.setFont('courier', 'bold');
    doc.text('SEGURANÇA  ·  AUTOMAÇÃO  ·  REDES  ·  MANUTENÇÃO', A4_W/2, y, { align: 'center' });

    y += 6;
    f.text(C.textDim);
    doc.setFontSize(7);
    doc.setFont('helvetica', 'normal');
    doc.text('Documento gerado em ' + new Date().toLocaleDateString('pt-BR'),
      A4_W/2, y, { align: 'center' });
  }

  /* ============================================================
     PÁGINA 2 — APRESENTAÇÃO
     ============================================================ */
  function pageApresentacao(doc) {
    drawBackground(doc);
    header(doc);
    const f = F(doc);

    let y = 24;
    y = sectionTitle(doc, '02', 'QUEM SOMOS',
      'Tecnologia que protege, conecta\ne simplifica a sua rotina.',
      'A Prolans nasceu em 2020 com um propósito claro: proteger o que importa e levar tecnologia inteligente para casas e empresas.',
      y);

    // Texto da história
    f.text(C.text);
    doc.setFontSize(9.5);
    doc.setFont('helvetica', 'normal');
    const historia = [
      'A Prolans nasceu de um sonho simples e poderoso: o sonho da liberdade financeira e de construir algo verdadeiro, com propósito. Em 01 de março de 2020, ainda com outro nome e visão em formação, demos o primeiro passo dessa jornada.',
      'Em agosto de 2020, a empresa nasceu oficialmente como Prolans, agora com identidade, metas claras e missão definida: levar segurança e tecnologia de qualidade para pessoas e empresas, com atendimento humano e suporte de verdade.',
      'Por trás de tudo está Rodrigo Machado, fundador, técnico e o sonhador que acreditou no projeto desde o primeiro dia. Hoje, somos uma solução completa em segurança eletrônica, automação, redes e manutenção, sempre com gratidão pela caminhada.'
    ];
    historia.forEach(p => {
      const lines = doc.splitTextToSize(p, CW);
      lines.forEach(l => { doc.text(l, M, y); y += 4.6; });
      y += 2;
    });

    // Timeline
    y += 4;
    eyebrow(doc, M, y, 'LINHA DO TEMPO');
    y += 8;

    const events = [
      { date: '01·MAR·2020', title: 'O sonho começou',
        desc: 'Primeira semente, ainda em formação, movida pelo desejo de liberdade.' },
      { date: 'AGO·2020', title: 'Nasce a Prolans',
        desc: 'Identidade, propósito e direção. Uma empresa pronta para entregar valor.' },
      { date: '2021—2025', title: 'Crescimento sólido',
        desc: 'Parcerias com clientes referência da região e portfólio em expansão.' },
      { date: 'HOJE', title: 'Solução completa em tecnologia',
        desc: 'Da câmera ao plano de manutenção. Atendimento direto e humano.' }
    ];
    events.forEach(ev => {
      const cardH = 14;
      card(doc, M, y, CW, cardH, { fill: C.surface, stroke: ev.date === 'HOJE' ? C.borderStrong : C.border });
      f.text(ev.date === 'HOJE' ? C.success : C.primary);
      doc.setFontSize(8);
      doc.setFont('courier', 'bold');
      doc.text(ev.date, M + 4, y + 5);
      f.text(C.white);
      doc.setFontSize(10);
      doc.setFont('helvetica', 'bold');
      doc.text(ev.title, M + 36, y + 5);
      f.text(C.textMuted);
      doc.setFontSize(8.5);
      doc.setFont('helvetica', 'normal');
      const dLines = doc.splitTextToSize(ev.desc, CW - 40);
      doc.text(dLines, M + 36, y + 10);
      y += cardH + 2.5;
    });

    footer(doc, 2, 10);
  }

  /* ============================================================
     PÁGINA 3 — IDENTIDADE (MVV + Diferenciais)
     ============================================================ */
  function pageIdentidade(doc) {
    drawBackground(doc);
    header(doc);
    const f = F(doc);

    let y = 24;
    y = sectionTitle(doc, '02', 'IDENTIDADE',
      'Missão, visão e valores',
      'Os pilares que sustentam tudo o que fazemos.',
      y);

    const items = [
      { glyph: '◎', title: 'Missão',
        text: 'Garantir que nossos clientes se sintam seguros, conectados e tranquilos em todos os momentos, com soluções confiáveis, sob medida e suporte de excelência.' },
      { glyph: '◉', title: 'Visão',
        text: 'Ser referência em segurança e tecnologia na Região Serrana, reconhecida pela confiança, pela entrega e pelo compromisso real com cada cliente.' },
      { glyph: '♥', title: 'Valores',
        text: 'Fé, gratidão, compromisso, transparência, qualidade e inovação contínua. Fazer mais do que o esperado e entregar tranquilidade, sempre.' }
    ];
    items.forEach(it => {
      const cardH = 26;
      card(doc, M, y, CW, cardH);
      iconBox(doc, M + 4, y + 4, 8, C.primary, it.glyph);
      f.text(C.white);
      doc.setFontSize(12);
      doc.setFont('helvetica', 'bold');
      doc.text(it.title, M + 16, y + 8);
      f.text(C.textMuted);
      doc.setFontSize(9);
      doc.setFont('helvetica', 'normal');
      const txt = doc.splitTextToSize(it.text, CW - 22);
      doc.text(txt, M + 16, y + 14);
      y += cardH + 3;
    });

    // Diferenciais
    y += 6;
    eyebrow(doc, M, y, 'POR QUE A PROLANS');
    y += 8;
    f.text(C.white);
    doc.setFontSize(15);
    doc.setFont('helvetica', 'bold');
    doc.text('O que nos torna diferentes', M, y);
    y += 8;

    const diffs = [
      { num: '6+',   label: 'anos de mercado e clientes referência' },
      { num: '13+',  label: 'anos de experiência técnica do fundador' },
      { num: '40+',  label: 'cursos e capacitações na área' },
      { num: '100%', label: 'atendimento humano via WhatsApp' }
    ];
    const dW = (CW - 9) / 4;
    diffs.forEach((d, i) => {
      const x = M + i * (dW + 3);
      card(doc, x, y, dW, 24);
      f.text(C.primary);
      doc.setFontSize(18);
      doc.setFont('helvetica', 'bold');
      doc.text(d.num, x + dW/2, y + 10, { align: 'center' });
      f.text(C.textMuted);
      doc.setFontSize(7);
      doc.setFont('helvetica', 'normal');
      const lines = doc.splitTextToSize(d.label, dW - 4);
      doc.text(lines, x + dW/2, y + 16, { align: 'center' });
    });

    footer(doc, 3, 10);
  }

  /* ============================================================
     PÁGINAS 4 e 5 — SOLUÇÕES (3 + 3)
     ============================================================ */
  const SOLUTIONS = [
    { num: '01', title: 'Segurança Eletrônica', glyph: '◊',
      lead: 'Olhos atentos 24h em cada canto do seu espaço. Veja tudo, de qualquer lugar, em tempo real.',
      items: ['Câmeras de segurança CFTV (Full HD, 4K e Wi-Fi)','Sistemas de alarme com sensores e sirenes','Monitoramento remoto pelo celular','Gravadores DVR/NVR seguros','Visão noturna e detecção de movimento'] },
    { num: '02', title: 'Controle de Acesso', glyph: '⊙',
      lead: 'Quem entra, quando entra e por onde passa. Você no comando, sem chaves perdidas.',
      items: ['Fechaduras digitais (senha, biometria, tag)','Interfones e vídeoporteiros inteligentes','Reconhecimento facial corporativo','Controle por aplicativo no celular','Gestão de visitantes e horários'] },
    { num: '03', title: 'Redes e Conectividade', glyph: '≋',
      lead: 'Internet rápida, estável e com cobertura em cada cantinho, pronta para trabalho e lazer.',
      items: ['Wi-Fi profissional (Mesh e Wi-Fi 6)','Cabeamento estruturado','Redes corporativas com segurança','Diagnóstico de pontos cegos','Integração com câmeras e automação'] },
    { num: '04', title: 'Automação Inteligente', glyph: '⌂',
      lead: 'Sua casa respondendo à sua voz, ao seu toque ou sozinha, do jeito que você quiser.',
      items: ['Integração com Alexa e Google Assistente','Iluminação inteligente e cenas programadas','Tomadas, cortinas e portões via app','Sensores de presença e abertura','Cenários automáticos (chegar, dormir)'] },
    { num: '05', title: 'Infraestrutura e Elétrica', glyph: '⚡',
      lead: 'A base bem feita evita dor de cabeça lá na frente. Cada cabo no lugar certo.',
      items: ['Instalações elétricas residenciais e comerciais','Quadros, disjuntores e proteção contra surtos','Organização e melhoria de redes existentes','Adequações para automação','Avaliação técnica e laudo de segurança'] },
    { num: '06', title: 'Manutenção', glyph: '⚙',
      lead: 'Seu sistema sempre funcionando, sem surpresas, sem stress, sem falha quando precisar.',
      items: ['Manutenção preventiva periódica','Manutenção corretiva ágil','Planos mensais com prioridade','Limpeza e calibragem','Substituição de peças e firmware'] }
  ];

  function pageSolucoes(doc, slice, pageNum, isFirst) {
    drawBackground(doc);
    header(doc);
    const f = F(doc);

    let y = 24;
    if (isFirst) {
      y = sectionTitle(doc, '03', 'NOSSAS SOLUÇÕES',
        'Tudo que você precisa\nem um só lugar.',
        'Seis frentes integradas para proteger, automatizar e conectar a sua casa, comércio ou empresa.',
        y);
    } else {
      y = sectionTitle(doc, '03', 'NOSSAS SOLUÇÕES (CONTINUAÇÃO)',
        'Mais soluções para o seu dia a dia',
        '',
        y);
    }

    const cardW = (CW - 6) / 2;
    const cardH = 78;

    slice.forEach((s, i) => {
      const col = i % 2;
      const row = Math.floor(i / 2);
      const x = M + col * (cardW + 6);
      const yy = y + row * (cardH + 6);

      card(doc, x, yy, cardW, cardH);

      // Header do card
      iconBox(doc, x + 4, yy + 4, 9, C.primary, s.glyph);
      f.text(C.textDim);
      doc.setFontSize(7);
      doc.setFont('courier', 'bold');
      doc.text('CATEGORIA ' + s.num, x + 16, yy + 7);
      f.text(C.white);
      doc.setFontSize(11);
      doc.setFont('helvetica', 'bold');
      doc.text(s.title, x + 16, yy + 12);

      // Lead
      f.text(C.textMuted);
      doc.setFontSize(8);
      doc.setFont('helvetica', 'italic');
      const leadLines = doc.splitTextToSize(s.lead, cardW - 8);
      doc.text(leadLines, x + 4, yy + 22);
      let cy = yy + 22 + leadLines.length * 3.6 + 3;

      // Lista
      f.text(C.text);
      doc.setFontSize(8);
      doc.setFont('helvetica', 'normal');
      s.items.forEach(item => {
        bulletCheck(doc, x + 5, cy - 1.2, C.primary);
        const lines = doc.splitTextToSize(item, cardW - 12);
        doc.text(lines, x + 9, cy);
        cy += lines.length * 3.4 + 1;
      });
    });

    footer(doc, pageNum, 10);
  }

  /* ============================================================
     PÁGINA 6 — BENEFÍCIOS
     ============================================================ */
  function pageBeneficios(doc) {
    drawBackground(doc);
    header(doc);
    const f = F(doc);

    let y = 24;
    y = sectionTitle(doc, '04', 'BENEFÍCIOS',
      'Por que contratar a Prolans',
      'Mais que instalar equipamentos, entregamos tranquilidade.',
      y);

    const benefits = [
      { t: 'Segurança real', d: 'Equipamentos de qualidade, projeto bem dimensionado, cobertura sem pontos cegos.' },
      { t: 'Atendimento rápido e humano', d: 'Você fala direto com quem entende. Sem robôs, sem fila.' },
      { t: '100% personalizadas', d: 'Cada projeto é feito sob medida. Nada de pacote pronto.' },
      { t: 'Equipamentos confiáveis', d: 'Marcas reconhecidas e com garantia. Nada de produto duvidoso.' },
      { t: 'Suporte especializado', d: 'Mais de uma década de experiência prática e 40+ capacitações.' },
      { t: 'Economia a longo prazo', d: 'Instalação correta na primeira vez evita retrabalho.' },
      { t: 'Empresa de referência', d: 'Confiada por Rio Sul, Zimbrão, Burrata, Unifeso, Empada Mix.' },
      { t: 'Transparência total', d: 'Orçamento detalhado, prazos claros, sem surpresas.' }
    ];

    const colW = (CW - 5) / 2;
    const cardH = 28;
    benefits.forEach((b, i) => {
      const col = i % 2;
      const row = Math.floor(i / 2);
      const x = M + col * (colW + 5);
      const yy = y + row * (cardH + 4);
      card(doc, x, yy, colW, cardH);

      // Check verde
      f.fill([0, 50, 36]);
      f.stroke(C.success);
      doc.setLineWidth(0.4);
      doc.roundedRect(x + 4, yy + 4, 8, 8, 2, 2, 'FD');
      f.text(C.success);
      doc.setFontSize(11);
      doc.setFont('helvetica', 'bold');
      doc.text('✓', x + 8, yy + 10, { align: 'center' });

      // Texto
      f.text(C.white);
      doc.setFontSize(10);
      doc.setFont('helvetica', 'bold');
      doc.text(b.t, x + 16, yy + 8);
      f.text(C.textMuted);
      doc.setFontSize(8);
      doc.setFont('helvetica', 'normal');
      const lines = doc.splitTextToSize(b.d, colW - 18);
      doc.text(lines, x + 16, yy + 13);
    });

    footer(doc, 6, 10);
  }

  /* ============================================================
     PÁGINA 7 — PROCESSO
     ============================================================ */
  function pageProcesso(doc) {
    drawBackground(doc);
    header(doc);
    const f = F(doc);

    let y = 24;
    y = sectionTitle(doc, '05', 'PROCESSO',
      'Como funciona, do primeiro\ncontato à entrega.',
      'Um caminho simples, transparente e sem mistério. Você sabe sempre o próximo passo.',
      y);

    const steps = [
      { t: 'Atendimento inicial',  d: 'Você fala com a gente pelo WhatsApp, e-mail ou pelo formulário. Resposta rápida e humana.' },
      { t: 'Levantamento da necessidade', d: 'Entendemos seu cenário, suas dores e o que você quer resolver. Sem empurrar produto.' },
      { t: 'Visita técnica',        d: 'Vamos no local avaliar a estrutura, ângulos, distâncias e pontos críticos do projeto.' },
      { t: 'Proposta personalizada', d: 'Você recebe um orçamento detalhado, com escopo, prazo e cada item bem explicado.' },
      { t: 'Instalação profissional', d: 'Equipe qualificada faz a instalação com cuidado, organização e respeito ao seu espaço.' },
      { t: 'Suporte contínuo',       d: 'Treinamento de uso, acompanhamento e canal direto de suporte sempre que precisar.' }
    ];

    const colW = (CW - 5) / 2;
    const cardH = 30;
    steps.forEach((s, i) => {
      const col = i % 2;
      const row = Math.floor(i / 2);
      const x = M + col * (colW + 5);
      const yy = y + row * (cardH + 5);
      card(doc, x, yy, colW, cardH);

      // Numero (badge)
      f.fill(C.primary);
      doc.roundedRect(x + 4, yy - 3, 12, 8, 2, 2, 'F');
      f.text([0, 30, 50]);
      doc.setFontSize(10);
      doc.setFont('helvetica', 'bold');
      doc.text(String(i+1).padStart(2,'0'), x + 10, yy + 2.4, { align: 'center' });

      f.text(C.white);
      doc.setFontSize(11);
      doc.setFont('helvetica', 'bold');
      doc.text(s.t, x + 4, yy + 11);
      f.text(C.textMuted);
      doc.setFontSize(8.5);
      doc.setFont('helvetica', 'normal');
      const lines = doc.splitTextToSize(s.d, colW - 8);
      doc.text(lines, x + 4, yy + 16);
    });

    footer(doc, 7, 10);
  }

  /* ============================================================
     PÁGINA 8 — PLANOS
     ============================================================ */
  function pagePlanos(doc) {
    drawBackground(doc);
    header(doc);
    const f = F(doc);

    let y = 24;
    y = sectionTitle(doc, '06', 'MODELOS DE CONTRATAÇÃO',
      'Planos que cabem no\nseu jeito de contratar.',
      'Projeto pontual, manutenção mensal ou plano de assinatura premium.',
      y);

    const plans = [
      { tag: 'MODELO 01', title: 'Projeto Personalizado',
        desc: 'Instalação sob medida com escopo definido e entrega completa.',
        items: ['Visita técnica e orçamento detalhado','Equipamentos de qualidade','Mão de obra certificada','Garantia na execução','Treinamento pós-instalação'],
        accent: C.primary, featured: false },
      { tag: 'MODELO 02', title: 'Manutenção Mensal',
        desc: 'Mensalidade que cuida do seu sistema todo mês.',
        items: ['Visitas preventivas periódicas','Limpeza e checagem','Atendimento prioritário','Atualização de firmware','Pequenos reparos sem custo'],
        accent: C.primary, featured: false },
      { tag: '★ PREMIUM', title: 'Prolans Signature+',
        desc: 'Plano completo com benefícios exclusivos.',
        items: ['Tudo da Manutenção Mensal','Desconto em mão de obra','Vantagens em novos projetos','SLA prioritário','Relatório periódico','Atendimento dedicado'],
        accent: C.accent, featured: true }
    ];

    const colW = (CW - 8) / 3;
    const cardH = 110;
    plans.forEach((p, i) => {
      const x = M + i * (colW + 4);
      card(doc, x, y, colW, cardH, {
        fill: p.featured ? [16, 22, 44] : C.surface,
        stroke: p.featured ? C.borderStrong : C.border,
        lineWidth: p.featured ? 0.6 : 0.3
      });

      // Tag
      f.text(p.accent);
      doc.setFontSize(7);
      doc.setFont('courier', 'bold');
      doc.text(p.tag, x + 4, y + 6);

      // Title
      f.text(C.white);
      doc.setFontSize(12);
      doc.setFont('helvetica', 'bold');
      const tLines = doc.splitTextToSize(p.title, colW - 6);
      doc.text(tLines, x + 4, y + 13);
      let cy = y + 13 + tLines.length * 5;

      // Desc
      f.text(C.textMuted);
      doc.setFontSize(8);
      doc.setFont('helvetica', 'italic');
      const dLines = doc.splitTextToSize(p.desc, colW - 6);
      doc.text(dLines, x + 4, cy + 2);
      cy += dLines.length * 3.2 + 6;

      // Items
      f.text(C.text);
      doc.setFontSize(8);
      doc.setFont('helvetica', 'normal');
      p.items.forEach(item => {
        f.text(p.accent);
        doc.setFont('courier', 'bold');
        doc.text('+', x + 4, cy);
        f.text(C.text);
        doc.setFont('helvetica', 'normal');
        const lines = doc.splitTextToSize(item, colW - 10);
        doc.text(lines, x + 8, cy);
        cy += lines.length * 3.4 + 1.2;
      });
    });

    // Recorrente
    y += cardH + 8;
    f.fill([10, 24, 40]);
    f.stroke(C.borderStrong);
    doc.setLineWidth(0.4);
    doc.roundedRect(M, y, CW, 16, 3, 3, 'FD');
    f.text(C.white);
    doc.setFontSize(9.5);
    doc.setFont('helvetica', 'bold');
    doc.text('Cliente recorrente sai ganhando:', M + 4, y + 6.5);
    f.text(C.textMuted);
    doc.setFontSize(8.5);
    doc.setFont('helvetica', 'normal');
    doc.text('desconto em mão de obra, prioridade no atendimento e vantagens em novos projetos.',
      M + 4, y + 12);

    footer(doc, 8, 10);
  }

  /* ============================================================
     PÁGINA 9 — PAGAMENTO + GARANTIAS
     ============================================================ */
  function pagePagamentoGarantia(doc) {
    drawBackground(doc);
    header(doc);
    const f = F(doc);

    let y = 24;
    y = sectionTitle(doc, '07', 'PAGAMENTO',
      'Formas de pagamento flexíveis',
      'Escolha a forma que funciona melhor para você.',
      y);

    const pays = [
      { glyph: '$', t: 'À vista', d: 'PIX ou dinheiro com vantagens e desconto especial.' },
      { glyph: '▣', t: 'Cartão de crédito', d: 'Parcelamento facilitado em todas as bandeiras.' },
      { glyph: '▤', t: 'Boleto bancário', d: 'Para empresas, com prazos compatíveis.' },
      { glyph: '↻', t: 'Mensalidade', d: 'Para planos de manutenção e Signature+.' }
    ];
    const pW = (CW - 9) / 4;
    pays.forEach((p, i) => {
      const x = M + i * (pW + 3);
      card(doc, x, y, pW, 32);
      iconBox(doc, x + (pW - 9)/2, y + 4, 9, C.primary, p.glyph);
      f.text(C.white);
      doc.setFontSize(10);
      doc.setFont('helvetica', 'bold');
      doc.text(p.t, x + pW/2, y + 19, { align: 'center' });
      f.text(C.textMuted);
      doc.setFontSize(7.5);
      doc.setFont('helvetica', 'normal');
      const lines = doc.splitTextToSize(p.d, pW - 4);
      doc.text(lines, x + pW/2, y + 24, { align: 'center' });
    });

    y += 42;
    y = sectionTitle(doc, '08', 'GARANTIAS',
      'Nossos compromissos com você',
      'Estamos com você antes, durante e depois.',
      y);

    const seals = [
      { glyph: '✓', t: 'Qualidade na execução', d: 'Cada projeto entregue com cuidado, organização e padrão técnico.' },
      { glyph: '◉', t: 'Transparência total', d: 'Orçamento aberto, escopo claro, prazos realistas, sem cobrança surpresa.' },
      { glyph: '☎', t: 'Suporte pós-venda', d: 'Canal direto pelo WhatsApp. Atendimento de quem entende do produto.' },
      { glyph: '★', t: 'Compromisso com resultado', d: 'Trabalhamos até o sistema funcionar exatamente como você espera.' }
    ];
    const sCol = (CW - 5) / 2;
    seals.forEach((s, i) => {
      const col = i % 2;
      const row = Math.floor(i / 2);
      const x = M + col * (sCol + 5);
      const yy = y + row * 26;
      card(doc, x, yy, sCol, 22);
      iconBox(doc, x + 4, yy + 4, 9, C.warning, s.glyph);
      f.text(C.white);
      doc.setFontSize(10);
      doc.setFont('helvetica', 'bold');
      doc.text(s.t, x + 16, yy + 8);
      f.text(C.textMuted);
      doc.setFontSize(8);
      doc.setFont('helvetica', 'normal');
      const lines = doc.splitTextToSize(s.d, sCol - 18);
      doc.text(lines, x + 16, yy + 13);
    });

    footer(doc, 9, 10);
  }

  /* ============================================================
     PÁGINA 10 — FECHAMENTO + CONTATO
     ============================================================ */
  function pageFechamento(doc) {
    drawBackground(doc);
    header(doc);
    const f = F(doc);

    let y = 24;

    // Banner CTA
    f.fill([12, 22, 46]);
    f.stroke(C.borderStrong);
    doc.setLineWidth(0.5);
    doc.roundedRect(M, y, CW, 60, 5, 5, 'FD');

    eyebrow(doc, M + 6, y + 9, 'VAMOS COMEÇAR');

    f.text(C.white);
    doc.setFontSize(18);
    doc.setFont('helvetica', 'bold');
    const lines = doc.splitTextToSize('Pronto para elevar a segurança e a tecnologia do seu espaço?', CW - 12);
    doc.text(lines, M + 6, y + 22);

    f.text(C.textMuted);
    doc.setFontSize(9.5);
    doc.setFont('helvetica', 'normal');
    const sub = doc.splitTextToSize('O melhor momento para proteger e modernizar é antes de precisar. Cada dia sem o sistema certo é um dia de risco que dá pra evitar. E a gente faz isso por você.', CW - 12);
    doc.text(sub, M + 6, y + 22 + lines.length * 6 + 3);

    // Selos finais
    f.text(C.primary);
    doc.setFontSize(7.5);
    doc.setFont('courier', 'bold');
    doc.text('✓ RESPOSTA RÁPIDA   ✓ VISITA SEM COMPROMISSO   ✓ ATENDIMENTO HUMANO',
      M + 6, y + 54);

    y += 70;

    // CONTATO
    y = sectionTitle(doc, '10', 'CONTATO',
      'Fale com a Prolans',
      'Estamos prontos pra te atender. Escolha o canal que preferir, respondemos rapidinho.',
      y);

    const contacts = [
      { glyph: '☎', label: 'WHATSAPP / TELEFONE', value: '(21) 99711-2008' },
      { glyph: '✉', label: 'E-MAIL',              value: 'contato@prolans.com.br' },
      { glyph: '◎', label: 'INSTAGRAM',           value: '@contato.prolans' },
      { glyph: '⊕', label: 'SITE',                value: 'www.prolans.com.br' }
    ];
    const cW = (CW - 9) / 4;
    contacts.forEach((c, i) => {
      const x = M + i * (cW + 3);
      card(doc, x, y, cW, 22);
      iconBox(doc, x + 3, y + 3, 7, C.primary, c.glyph);
      f.text(C.textMuted);
      doc.setFontSize(6.5);
      doc.setFont('courier', 'bold');
      doc.text(c.label, x + 12, y + 7);
      f.text(C.white);
      doc.setFontSize(8.8);
      doc.setFont('helvetica', 'bold');
      doc.text(c.value, x + 12, y + 13);
    });

    // Endereço (linha cheia)
    y += 26;
    card(doc, M, y, CW, 18);
    iconBox(doc, M + 3, y + 4, 9, C.primary, '◉');
    f.text(C.textMuted);
    doc.setFontSize(7);
    doc.setFont('courier', 'bold');
    doc.text('ENDEREÇO', M + 16, y + 8);
    f.text(C.white);
    doc.setFontSize(10);
    doc.setFont('helvetica', 'bold');
    doc.text('Praça Baltazar da Silveira, 90 · Várzea, Teresópolis/RJ', M + 16, y + 14);

    // Assinatura final
    y = A4_H - 32;
    f.stroke(C.border);
    doc.setLineWidth(0.2);
    doc.line(M, y, A4_W - M, y);
    y += 5;
    f.text(C.primary);
    doc.setFontSize(7.5);
    doc.setFont('courier', 'bold');
    doc.text('PROLANS · CNPJ 38.408.286/0001-11', A4_W/2, y, { align: 'center' });
    y += 5;
    f.text(C.textMuted);
    doc.setFontSize(8);
    doc.setFont('helvetica', 'italic');
    doc.text('© ' + new Date().getFullYear() + ' Prolans · Protegendo o presente, garantindo o futuro.',
      A4_W/2, y, { align: 'center' });

    footer(doc, 10, 10);
  }

  /* ============================================================
     ENTRADA PRINCIPAL — gera o PDF completo
     ============================================================ */
  async function generatePortfolioPDF() {
    if (!window.jspdf || !window.jspdf.jsPDF) {
      throw new Error('jsPDF não está carregado');
    }
    const { jsPDF } = window.jspdf;
    const doc = new jsPDF({ unit: 'mm', format: 'a4', orientation: 'portrait', compress: true });

    // Carrega o logo (com timeout para nunca travar)
    const logoPromise = loadImage('assets/img/logo-prolans.png');
    const logo = await Promise.race([
      logoPromise,
      new Promise(r => setTimeout(() => r(null), 4000))
    ]);

    await pageCover(doc, logo);
    doc.addPage(); pageApresentacao(doc);
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

  // Exposição global
  window.ProlansPDF = { generate: generatePortfolioPDF };
})();
