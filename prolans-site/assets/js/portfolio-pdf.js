/* ============================================================
   PROLANS · Portfólio em PDF
   Ícones vetoriais · capa balanceada · contato alinhado.
   ============================================================ */
(function () {
  /* Geometria / grid */
  const A4_W = 210;
  const A4_H = 297;
  const M = 18;
  const CW = A4_W - 2*M;
  const TOP = 26;
  const BOTTOM = A4_H - 22;
  const PAD = 6;
  const LH = 4.5;
  const ICON = 10;

  const C = {
    bg:           [10, 21, 48],
    surface:      [18, 32, 64],
    surfaceAlt:   [26, 44, 84],
    surfaceSoft:  [14, 26, 56],
    border:       [40, 56, 96],
    borderStrong: [0, 130, 184],
    primary:      [88, 222, 255],
    accent:       [156, 132, 255],
    success:      [76, 235, 180],
    warning:      [255, 196, 100],
    text:         [240, 244, 255],
    textMuted:    [156, 168, 200],
    textDim:      [98, 110, 140],
    white:        [255, 255, 255]
  };

  const F = doc => ({
    fill:   c => doc.setFillColor(c[0], c[1], c[2]),
    stroke: c => doc.setDrawColor(c[0], c[1], c[2]),
    text:   c => doc.setTextColor(c[0], c[1], c[2])
  });

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

  /* ============================================================
     ÍCONES VETORIAIS — desenhados com primitivas (sem Unicode)
     drawIcon(doc, x, y, size, type, color)
       (x, y) = canto superior esquerdo do ícone
       size   = lado (ícone é quadrado)
     ============================================================ */
  function drawIcon(doc, x, y, size, type, color) {
    const cx = x + size/2, cy = y + size/2;
    const r = size * 0.42;
    const f = F(doc);
    f.stroke(color || C.primary);
    f.fill(color || C.primary);
    doc.setLineWidth(0.55);
    try { doc.setLineCap(1); doc.setLineJoin(1); } catch(e){}

    function arc(cxp, cyp, radius, startDeg, endDeg, segments) {
      segments = segments || 18;
      const sa = startDeg * Math.PI/180;
      const ea = endDeg * Math.PI/180;
      let prev = null;
      for (let i = 0; i <= segments; i++) {
        const a = sa + (ea - sa) * (i / segments);
        const px = cxp + Math.cos(a) * radius;
        const py = cyp + Math.sin(a) * radius;
        if (prev) doc.line(prev.x, prev.y, px, py);
        prev = { x: px, y: py };
      }
    }

    switch (type) {
      case 'shield': {
        // escudo simples: pentagon arredondado
        const w = r * 1.6, h = r * 2;
        doc.line(cx - w/2, cy - h*0.45, cx + w/2, cy - h*0.45);
        doc.line(cx - w/2, cy - h*0.45, cx - w/2, cy);
        doc.line(cx + w/2, cy - h*0.45, cx + w/2, cy);
        doc.line(cx - w/2, cy, cx, cy + h*0.55);
        doc.line(cx + w/2, cy, cx, cy + h*0.55);
        // check interno
        doc.setLineWidth(0.7);
        doc.line(cx - w*0.25, cy - h*0.05, cx - w*0.05, cy + h*0.15);
        doc.line(cx - w*0.05, cy + h*0.15, cx + w*0.3, cy - h*0.2);
        break;
      }
      case 'lock': {
        const w = r * 1.5, h = r * 1.2;
        // corpo
        doc.roundedRect(cx - w/2, cy - h*0.15, w, h, 0.6, 0.6, 'S');
        // shackle (arco)
        arc(cx, cy - h*0.15, w * 0.36, 180, 360, 14);
        // miolo
        doc.circle(cx, cy + h*0.3, 0.7, 'F');
        break;
      }
      case 'wifi': {
        // 3 arcos + ponto base
        const baseY = cy + r * 0.7;
        doc.circle(cx, baseY, 0.9, 'F');
        arc(cx, baseY, r * 0.55, 200, 340, 18);
        arc(cx, baseY, r * 0.95, 200, 340, 22);
        arc(cx, baseY, r * 1.35, 200, 340, 26);
        break;
      }
      case 'home': {
        // telhado triangular + base quadrada
        const w = r * 1.6;
        doc.line(cx - w/2, cy - r*0.1, cx, cy - r*0.95);
        doc.line(cx, cy - r*0.95, cx + w/2, cy - r*0.1);
        // base
        doc.line(cx - w*0.42, cy - r*0.1, cx - w*0.42, cy + r*0.85);
        doc.line(cx + w*0.42, cy - r*0.1, cx + w*0.42, cy + r*0.85);
        doc.line(cx - w*0.42, cy + r*0.85, cx + w*0.42, cy + r*0.85);
        // porta
        doc.line(cx - w*0.12, cy + r*0.85, cx - w*0.12, cy + r*0.35);
        doc.line(cx + w*0.12, cy + r*0.85, cx + w*0.12, cy + r*0.35);
        doc.line(cx - w*0.12, cy + r*0.35, cx + w*0.12, cy + r*0.35);
        break;
      }
      case 'bolt': {
        // raio (zigzag)
        const points = [
          [cx + r*0.15, cy - r*0.95],
          [cx - r*0.45, cy + r*0.05],
          [cx - r*0.05, cy + r*0.05],
          [cx - r*0.25, cy + r*0.95],
          [cx + r*0.55, cy - r*0.15],
          [cx + r*0.10, cy - r*0.15],
          [cx + r*0.15, cy - r*0.95]
        ];
        for (let i = 0; i < points.length - 1; i++) {
          doc.line(points[i][0], points[i][1], points[i+1][0], points[i+1][1]);
        }
        break;
      }
      case 'gear': {
        // engrenagem: círculo + 8 ticks externos
        doc.circle(cx, cy, r * 0.55, 'S');
        doc.circle(cx, cy, r * 0.18, 'S');
        for (let i = 0; i < 8; i++) {
          const a = (i * 45) * Math.PI/180;
          const x1 = cx + Math.cos(a) * r * 0.6;
          const y1 = cy + Math.sin(a) * r * 0.6;
          const x2 = cx + Math.cos(a) * r * 0.95;
          const y2 = cy + Math.sin(a) * r * 0.95;
          doc.setLineWidth(1);
          doc.line(x1, y1, x2, y2);
        }
        break;
      }
      case 'target': {
        // mira: 3 círculos concêntricos
        doc.circle(cx, cy, r * 0.95, 'S');
        doc.circle(cx, cy, r * 0.6, 'S');
        doc.circle(cx, cy, r * 0.22, 'F');
        break;
      }
      case 'eye': {
        // elipse + circulo central
        doc.ellipse(cx, cy, r * 0.95, r * 0.55, 'S');
        doc.circle(cx, cy, r * 0.3, 'S');
        doc.circle(cx, cy, r * 0.12, 'F');
        break;
      }
      case 'heart': {
        // coração: dois arcos + triângulo
        const lx = cx - r * 0.35, rx = cx + r * 0.35;
        const ly = cy - r * 0.15;
        arc(lx, ly, r * 0.4, 180, 360, 14);
        arc(rx, ly, r * 0.4, 180, 360, 14);
        doc.line(cx - r * 0.75, ly, cx, cy + r * 0.7);
        doc.line(cx + r * 0.75, ly, cx, cy + r * 0.7);
        break;
      }
      case 'check': {
        // ✓ duas linhas
        doc.setLineWidth(1);
        doc.line(cx - r*0.65, cy + r*0.05, cx - r*0.1, cy + r*0.6);
        doc.line(cx - r*0.1, cy + r*0.6, cx + r*0.7, cy - r*0.5);
        break;
      }
      case 'dollar': {
        // S vertical + barra
        f.text(color || C.primary);
        doc.setFontSize(size * 0.95);
        doc.setFont('helvetica', 'bold');
        doc.text('$', cx, cy + size * 0.32, { align: 'center' });
        break;
      }
      case 'card': {
        // cartão: rect + barra
        const w = r * 1.7, h = r * 1.1;
        doc.roundedRect(cx - w/2, cy - h/2, w, h, 0.5, 0.5, 'S');
        doc.setLineWidth(0.7);
        doc.line(cx - w/2, cy - h*0.1, cx + w/2, cy - h*0.1);
        doc.setLineWidth(0.5);
        doc.line(cx - w*0.35, cy + h*0.18, cx - w*0.05, cy + h*0.18);
        break;
      }
      case 'doc': {
        // documento: rect com canto cortado
        const w = r * 1.3, h = r * 1.7;
        const fold = r * 0.45;
        // desenha o contorno
        doc.line(cx - w/2, cy - h/2, cx + w/2 - fold, cy - h/2);
        doc.line(cx + w/2 - fold, cy - h/2, cx + w/2, cy - h/2 + fold);
        doc.line(cx + w/2, cy - h/2 + fold, cx + w/2, cy + h/2);
        doc.line(cx + w/2, cy + h/2, cx - w/2, cy + h/2);
        doc.line(cx - w/2, cy + h/2, cx - w/2, cy - h/2);
        // dobra
        doc.line(cx + w/2 - fold, cy - h/2, cx + w/2 - fold, cy - h/2 + fold);
        doc.line(cx + w/2 - fold, cy - h/2 + fold, cx + w/2, cy - h/2 + fold);
        // linhas internas
        doc.line(cx - w*0.3, cy - h*0.1, cx + w*0.3, cy - h*0.1);
        doc.line(cx - w*0.3, cy + h*0.05, cx + w*0.3, cy + h*0.05);
        doc.line(cx - w*0.3, cy + h*0.2, cx + w*0.3, cy + h*0.2);
        break;
      }
      case 'refresh': {
        // arco circular + cabeça de seta
        arc(cx, cy, r * 0.85, 30, 320, 22);
        // ponta da seta
        const a = 30 * Math.PI/180;
        const tx = cx + Math.cos(a) * r * 0.85;
        const ty = cy + Math.sin(a) * r * 0.85;
        doc.line(tx, ty, tx - r*0.4, ty - r*0.05);
        doc.line(tx, ty, tx - r*0.1, ty + r*0.4);
        break;
      }
      case 'phone': {
        // handset estilizado: dois círculos + arco
        const a = -30 * Math.PI/180;
        const dx = Math.cos(a), dy = Math.sin(a);
        // corpo do fone (linha grossa)
        doc.setLineWidth(1.4);
        doc.line(cx - r*0.7*dx + r*0.5*dy, cy - r*0.7*dy - r*0.5*dx,
                 cx + r*0.7*dx + r*0.5*dy, cy + r*0.7*dy - r*0.5*dx);
        // capsulas
        doc.setLineWidth(0.5);
        doc.circle(cx - r*0.7*dx, cy - r*0.7*dy, r * 0.22, 'S');
        doc.circle(cx + r*0.7*dx, cy + r*0.7*dy, r * 0.22, 'S');
        break;
      }
      case 'envelope': {
        // envelope: rect + V interno
        const w = r * 1.6, h = r * 1.05;
        doc.roundedRect(cx - w/2, cy - h/2, w, h, 0.4, 0.4, 'S');
        doc.line(cx - w/2, cy - h/2, cx, cy);
        doc.line(cx + w/2, cy - h/2, cx, cy);
        break;
      }
      case 'at': {
        // arroba: círculo externo + círculo interno + cauda
        doc.circle(cx, cy, r * 0.85, 'S');
        doc.circle(cx, cy, r * 0.35, 'S');
        // cauda (semicirculo direito)
        arc(cx, cy, r * 0.55, -45, 90, 12);
        break;
      }
      case 'globe': {
        // globo: círculo + meridianos
        doc.circle(cx, cy, r * 0.9, 'S');
        // equador
        doc.line(cx - r*0.9, cy, cx + r*0.9, cy);
        // meridiano vertical
        doc.line(cx, cy - r*0.9, cx, cy + r*0.9);
        // meridianos curvos (elipses)
        doc.ellipse(cx, cy, r * 0.45, r * 0.9, 'S');
        break;
      }
      case 'pin': {
        // alfinete de mapa: drop + ponto
        // drop = circulo + triangulo apontando para baixo
        doc.circle(cx, cy - r*0.15, r * 0.55, 'S');
        doc.circle(cx, cy - r*0.15, r * 0.18, 'F');
        doc.line(cx - r*0.42, cy + r*0.15, cx, cy + r*0.95);
        doc.line(cx + r*0.42, cy + r*0.15, cx, cy + r*0.95);
        break;
      }
      case 'star': {
        // estrela 5 pontas (10 vértices)
        const points = [];
        for (let i = 0; i < 10; i++) {
          const a = (-90 + i * 36) * Math.PI/180;
          const rr = (i % 2 === 0) ? r * 0.95 : r * 0.4;
          points.push([cx + Math.cos(a) * rr, cy + Math.sin(a) * rr]);
        }
        for (let i = 0; i < points.length; i++) {
          const next = (i + 1) % points.length;
          doc.line(points[i][0], points[i][1], points[next][0], points[next][1]);
        }
        break;
      }
      case 'instagram': {
        // ícone IG: rect arredondado + circulo interno + ponto canto
        doc.roundedRect(cx - r*0.85, cy - r*0.85, r * 1.7, r * 1.7, r * 0.35, r * 0.35, 'S');
        doc.circle(cx, cy, r * 0.45, 'S');
        doc.circle(cx + r*0.45, cy - r*0.45, 0.7, 'F');
        break;
      }
      default: {
        // fallback: círculo
        doc.circle(cx, cy, r * 0.55, 'S');
      }
    }
    try { doc.setLineCap(0); doc.setLineJoin(0); } catch(e){}
  }

  /* ============================================================
     BACKGROUND + HEADER + FOOTER
     ============================================================ */
  function background(doc) {
    const f = F(doc);
    f.fill(C.bg);
    doc.rect(0, 0, A4_W, A4_H, 'F');
    f.fill(C.primary);
    doc.rect(0, 0, A4_W, 1.2, 'F');
  }

  function header(doc) {
    const f = F(doc);
    f.text(C.primary);
    doc.setFontSize(7.5);
    doc.setFont('helvetica', 'bold');
    doc.setCharSpace(1.6);
    doc.text('PROLANS', M, 16);
    doc.setCharSpace(0);
    f.text(C.textMuted);
    doc.setFont('helvetica', 'normal');
    doc.text('Portfólio Oficial · 2026', A4_W - M, 16, { align: 'right' });
    f.stroke(C.border);
    doc.setLineWidth(0.12);
    doc.line(M, 20, A4_W - M, 20);
  }

  function footer(doc, n, total) {
    const f = F(doc);
    f.stroke(C.border);
    doc.setLineWidth(0.12);
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

  /* ============================================================
     COMPONENTES
     ============================================================ */
  function eyebrow(doc, x, y, label, color) {
    const f = F(doc);
    f.text(color || C.primary);
    doc.setFontSize(7.5);
    doc.setFont('helvetica', 'bold');
    doc.setCharSpace(1.6);
    doc.text(label, x, y);
    doc.setCharSpace(0);
  }

  function sectionTitle(doc, num, label, title, subtitle, y) {
    const f = F(doc);
    eyebrow(doc, M, y, num + '  ·  ' + label);
    y += 9;

    f.text(C.white);
    doc.setFontSize(22);
    doc.setFont('helvetica', 'bold');
    const tLines = doc.splitTextToSize(title, CW * 0.92);
    tLines.forEach((l, i) => doc.text(l, M, y + i * 8));
    y += tLines.length * 8;

    if (subtitle) {
      y += 2;
      f.text(C.textMuted);
      doc.setFontSize(10);
      doc.setFont('helvetica', 'normal');
      const sLines = doc.splitTextToSize(subtitle, CW * 0.88);
      sLines.forEach((l, i) => doc.text(l, M, y + i * 5));
      y += sLines.length * 5;
    }

    y += 6;
    f.stroke(C.borderStrong);
    doc.setLineWidth(0.6);
    doc.line(M, y, M + 22, y);
    return y + 10;
  }

  function card(doc, x, y, w, h, opts) {
    opts = opts || {};
    const f = F(doc);
    f.fill(opts.fill || C.surface);
    f.stroke(opts.stroke || C.border);
    doc.setLineWidth(opts.lineWidth || 0.25);
    doc.roundedRect(x, y, w, h, 2.5, 2.5, 'FD');
  }

  // Caixa do ícone (badge) com ícone vetorial dentro
  function iconBadge(doc, x, y, size, type, color) {
    const f = F(doc);
    f.fill(C.surfaceAlt);
    f.stroke(color || C.borderStrong);
    doc.setLineWidth(0.3);
    doc.roundedRect(x, y, size, size, 1.6, 1.6, 'FD');
    drawIcon(doc, x, y, size, type, color || C.primary);
  }

  function bullet(doc, x, y, color) {
    F(doc).fill(color || C.primary);
    doc.circle(x, y, 0.7, 'F');
  }

  function hairline(doc, y) {
    F(doc).stroke(C.border);
    doc.setLineWidth(0.12);
    doc.line(M, y, A4_W - M, y);
  }

  /* ============================================================
     PÁGINA 1 · CAPA — vertical balanceada
     ============================================================ */
  async function pageCover(doc, logo) {
    background(doc);
    const f = F(doc);

    // Marca topo (centralizada)
    f.text(C.primary);
    doc.setFontSize(8);
    doc.setFont('helvetica', 'bold');
    doc.setCharSpace(2.4);
    doc.text('PROLANS', A4_W/2, 18, { align: 'center' });
    doc.setCharSpace(0);

    /* Layout em terços visuais:
       - Topo livre (0-75) com a marca
       - Bloco principal centrado (75-200)
       - Bloco inferior info (200-285) */

    // Logo no terço superior do bloco principal
    const logoSize = 40;
    const logoY = 80;
    if (logo) {
      try { doc.addImage(logo, 'PNG', (A4_W - logoSize)/2, logoY, logoSize, logoSize); } catch(e) {}
    }

    let y = logoY + logoSize + 22;

    f.text(C.primary);
    doc.setFontSize(8);
    doc.setFont('helvetica', 'bold');
    doc.setCharSpace(2.4);
    doc.text('PORTFÓLIO OFICIAL · 2026', A4_W/2, y, { align: 'center' });
    doc.setCharSpace(0);
    y += 16;

    f.text(C.white);
    doc.setFontSize(44);
    doc.setFont('helvetica', 'bold');
    doc.text('Prolans', A4_W/2, y, { align: 'center' });
    y += 11;

    f.text(C.text);
    doc.setFontSize(13);
    doc.setFont('helvetica', 'normal');
    doc.text('Soluções em Tecnologia e Serviços', A4_W/2, y, { align: 'center' });
    y += 13;

    f.stroke(C.primary);
    doc.setLineWidth(0.7);
    doc.line(A4_W/2 - 12, y, A4_W/2 + 12, y);
    y += 10;

    f.text(C.textMuted);
    doc.setFontSize(11);
    doc.setFont('helvetica', 'italic');
    doc.text('Protegendo o presente, garantindo o futuro.', A4_W/2, y, { align: 'center' });

    // Bloco inferior — meta info perfeitamente alinhada
    let infoY = A4_H - 78;

    // Linha sutil acima
    f.stroke(C.border);
    doc.setLineWidth(0.12);
    doc.line(A4_W/2 - 80, infoY - 10, A4_W/2 + 80, infoY - 10);

    // Tags categoria
    f.text(C.primary);
    doc.setFontSize(7.5);
    doc.setFont('helvetica', 'bold');
    doc.setCharSpace(2.2);
    doc.text('SEGURANÇA   ·   AUTOMAÇÃO   ·   REDES   ·   MANUTENÇÃO',
      A4_W/2, infoY, { align: 'center' });
    doc.setCharSpace(0);

    // Meta info em 3 colunas
    infoY += 18;
    f.text(C.textDim);
    doc.setFontSize(7.5);
    doc.setFont('helvetica', 'bold');
    doc.setCharSpace(1.8);
    const cols = [A4_W/2 - 48, A4_W/2, A4_W/2 + 48];
    doc.text('FUNDADA', cols[0], infoY, { align: 'center' });
    doc.text('SEDE',    cols[1], infoY, { align: 'center' });
    doc.text('CNPJ',    cols[2], infoY, { align: 'center' });
    doc.setCharSpace(0);

    f.text(C.white);
    doc.setFontSize(10);
    doc.setFont('helvetica', 'bold');
    doc.text('Ago/2020',           cols[0], infoY + 7, { align: 'center' });
    doc.text('Teresópolis · RJ',   cols[1], infoY + 7, { align: 'center' });
    doc.text('38.408.286/0001-11', cols[2], infoY + 7, { align: 'center' });

    // Hairline + data
    let bottomY = A4_H - 32;
    f.stroke(C.border);
    doc.setLineWidth(0.12);
    doc.line(A4_W/2 - 50, bottomY, A4_W/2 + 50, bottomY);

    bottomY += 7;
    f.text(C.textDim);
    doc.setFontSize(7);
    doc.setFont('helvetica', 'normal');
    doc.text('Documento gerado em ' + new Date().toLocaleDateString('pt-BR'),
      A4_W/2, bottomY, { align: 'center' });
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
      lines.forEach((l, i) => doc.text(l, M, y + i * 5));
      y += lines.length * 5 + 4;
    });

    y += 3;
    hairline(doc, y);
    y += 10;

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
      const h = 18;
      card(doc, M, y, CW, h, {
        fill: C.surface,
        stroke: isToday ? C.borderStrong : C.border,
        lineWidth: isToday ? 0.5 : 0.25
      });
      f.text(isToday ? C.success : C.primary);
      doc.setFontSize(7.5);
      doc.setFont('helvetica', 'bold');
      doc.setCharSpace(1);
      doc.text(ev.d, M + PAD, y + 7);
      doc.setCharSpace(0);
      f.text(C.white);
      doc.setFontSize(10);
      doc.setFont('helvetica', 'bold');
      doc.text(ev.t, M + 44, y + 7);
      f.text(C.textMuted);
      doc.setFontSize(8.5);
      doc.setFont('helvetica', 'normal');
      doc.text(ev.s, M + 44, y + 13);
      y += h + 3;
    });

    footer(doc, 2, 10);
  }

  /* ============================================================
     PÁGINA 3 · IDENTIDADE
     ============================================================ */
  function pageIdentidade(doc) {
    background(doc); header(doc);
    const f = F(doc);

    let y = TOP + 4;
    y = sectionTitle(doc, '02', 'IDENTIDADE',
      'Missão, Visão e Valores',
      'Os pilares que sustentam tudo o que fazemos.', y);

    const mvv = [
      { icon: 'target', t: 'Missão',
        s: 'Garantir que nossos clientes se sintam seguros, conectados e tranquilos em todos os momentos, com soluções confiáveis e suporte de excelência.' },
      { icon: 'eye', t: 'Visão',
        s: 'Ser referência em segurança e tecnologia na Região Serrana, reconhecida pela confiança, pela entrega e pelo compromisso real com cada cliente.' },
      { icon: 'heart', t: 'Valores',
        s: 'Fé, gratidão, compromisso, transparência, qualidade e inovação. Fazer mais do que o esperado e entregar tranquilidade, sempre.' }
    ];
    mvv.forEach(it => {
      f.text(C.textMuted);
      doc.setFontSize(9);
      doc.setFont('helvetica', 'normal');
      const sLines = doc.splitTextToSize(it.s, CW - PAD - ICON - 6 - PAD);
      const h = PAD + ICON + 4 + sLines.length * LH + PAD - 2;
      card(doc, M, y, CW, h);

      iconBadge(doc, M + PAD, y + PAD, ICON, it.icon, C.primary);

      f.text(C.white);
      doc.setFontSize(13);
      doc.setFont('helvetica', 'bold');
      doc.text(it.t, M + PAD + ICON + 6, y + PAD + ICON/2 + 1.4);

      f.text(C.textMuted);
      doc.setFontSize(9);
      doc.setFont('helvetica', 'normal');
      const txtY = y + PAD + ICON + 4;
      sLines.forEach((l, i) => doc.text(l, M + PAD + ICON + 6, txtY + i * LH));

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
    y += 9;

    const diffs = [
      { num: '6+',   l: 'anos de mercado e clientes referência' },
      { num: '13+',  l: 'anos de experiência técnica do fundador' },
      { num: '40+',  l: 'cursos e capacitações na área' },
      { num: '100%', l: 'atendimento humano via WhatsApp' }
    ];
    const dW = (CW - 12) / 4;
    const dH = 28;
    diffs.forEach((d, i) => {
      const x = M + i * (dW + 4);
      card(doc, x, y, dW, dH);
      f.text(C.primary);
      doc.setFontSize(20);
      doc.setFont('helvetica', 'bold');
      doc.text(d.num, x + dW/2, y + 12, { align: 'center' });
      f.text(C.textMuted);
      doc.setFontSize(7.5);
      doc.setFont('helvetica', 'normal');
      const ll = doc.splitTextToSize(d.l, dW - 6);
      ll.forEach((l, idx) => doc.text(l, x + dW/2, y + 18 + idx * 3.5, { align: 'center' }));
    });

    footer(doc, 3, 10);
  }

  /* ============================================================
     PÁGINAS 4 e 5 · SOLUÇÕES
     ============================================================ */
  const SOLUTIONS = [
    { t: 'Segurança Eletrônica', icon: 'shield',
      lead: 'Olhos atentos 24h em cada canto do seu espaço. Veja tudo de qualquer lugar, em tempo real.',
      items: ['Câmeras CFTV (Full HD, 4K, Wi-Fi)','Sistemas de alarme com sensores e sirenes','Monitoramento remoto pelo celular','Visão noturna e detecção de movimento'] },
    { t: 'Controle de Acesso', icon: 'lock',
      lead: 'Quem entra, quando entra e por onde passa. Você no comando, sem chaves perdidas.',
      items: ['Fechaduras digitais (senha, biometria, tag)','Interfones e vídeoporteiros inteligentes','Reconhecimento facial corporativo','Gestão de visitantes e horários'] },
    { t: 'Redes e Conectividade', icon: 'wifi',
      lead: 'Internet rápida, estável e com cobertura em cada cantinho. Pronta para trabalho e lazer.',
      items: ['Wi-Fi profissional (Mesh e Wi-Fi 6)','Cabeamento estruturado','Redes corporativas com segurança','Diagnóstico de pontos cegos'] },
    { t: 'Automação Inteligente', icon: 'home',
      lead: 'Sua casa respondendo à sua voz, ao seu toque ou sozinha. Do jeito que você quiser.',
      items: ['Integração com Alexa e Google Assistente','Iluminação inteligente e cenas programadas','Tomadas, cortinas e portões via app','Cenários automáticos (chegar, dormir)'] },
    { t: 'Infraestrutura e Elétrica', icon: 'bolt',
      lead: 'A base bem feita evita dor de cabeça lá na frente. Cada cabo no lugar certo.',
      items: ['Instalações elétricas residenciais e comerciais','Quadros e proteção contra surtos','Organização e melhoria de redes','Adequações para automação'] },
    { t: 'Manutenção', icon: 'gear',
      lead: 'Seu sistema sempre funcionando. Sem surpresas, sem stress, sem falha quando precisar.',
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
      f.text(C.textMuted);
      doc.setFontSize(9);
      doc.setFont('helvetica', 'italic');
      const leadLines = doc.splitTextToSize(s.lead, CW - PAD * 2);

      const colW = (CW - PAD * 2 - 8) / 2;
      const itemMeasured = s.items.map(it => {
        f.text(C.text);
        doc.setFontSize(8.5);
        doc.setFont('helvetica', 'normal');
        return doc.splitTextToSize(it, colW - 4);
      });
      const colItemCount = Math.ceil(s.items.length / 2);
      let colHeights = [0, 0];
      itemMeasured.forEach((lines, idx) => {
        const col = Math.floor(idx / colItemCount);
        colHeights[col] += lines.length * 4 + 1.5;
      });
      const itemsBlock = Math.max(colHeights[0], colHeights[1]);
      const headerBlock = ICON + 2;
      const leadBlock = leadLines.length * 4 + 4;
      const h = PAD + headerBlock + 4 + leadBlock + itemsBlock + PAD;

      card(doc, M, y, CW, h);

      iconBadge(doc, M + PAD, y + PAD, ICON, s.icon, C.primary);
      f.text(C.white);
      doc.setFontSize(13);
      doc.setFont('helvetica', 'bold');
      doc.text(s.t, M + PAD + ICON + 6, y + PAD + ICON/2 + 1.6);

      let cy = y + PAD + ICON + 6;
      f.text(C.textMuted);
      doc.setFontSize(9);
      doc.setFont('helvetica', 'italic');
      leadLines.forEach((l, i) => doc.text(l, M + PAD, cy + i * 4));
      cy += leadLines.length * 4 + 4;

      f.text(C.text);
      doc.setFontSize(8.5);
      doc.setFont('helvetica', 'normal');
      let curY = [cy, cy];
      itemMeasured.forEach((lines, idx) => {
        const col = Math.floor(idx / colItemCount);
        const cx = M + PAD + col * (colW + 8);
        bullet(doc, cx + 1.2, curY[col] - 1.4, C.primary);
        lines.forEach((l, i) => doc.text(l, cx + 4, curY[col] + i * 4));
        curY[col] += lines.length * 4 + 1.5;
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
      { t: 'Segurança real',          d: 'Equipamentos de qualidade e cobertura sem pontos cegos.' },
      { t: 'Atendimento humano',      d: 'Você fala direto com quem entende. Sem robôs, sem fila.' },
      { t: '100% personalizado',      d: 'Cada projeto sob medida. Nada de pacote pronto.' },
      { t: 'Equipamentos confiáveis', d: 'Marcas reconhecidas e com garantia de fábrica.' },
      { t: 'Suporte especializado',   d: '+13 anos de experiência prática e 40+ capacitações.' },
      { t: 'Economia a longo prazo',  d: 'Instalação correta na primeira vez evita retrabalho.' },
      { t: 'Empresa de referência',   d: 'Confiada por Rio Sul, Zimbrão, Burrata, Unifeso e outros.' },
      { t: 'Transparência total',     d: 'Orçamento detalhado, prazos claros, sem surpresas.' }
    ];
    const colW = (CW - 6) / 2;
    const h = 26;
    const checkSize = 8;
    items.forEach((b, i) => {
      const col = i % 2, row = Math.floor(i / 2);
      const x = M + col * (colW + 6);
      const yy = y + row * (h + 5);
      card(doc, x, yy, colW, h);

      // Check verde com ícone vetorial
      const f2 = F(doc);
      f2.fill([18, 50, 38]);
      f2.stroke(C.success);
      doc.setLineWidth(0.35);
      doc.roundedRect(x + PAD, yy + PAD, checkSize, checkSize, 1.6, 1.6, 'FD');
      drawIcon(doc, x + PAD, yy + PAD, checkSize, 'check', C.success);

      f.text(C.white);
      doc.setFontSize(10);
      doc.setFont('helvetica', 'bold');
      doc.text(b.t, x + PAD + checkSize + 4, yy + PAD + checkSize/2 + 1.4);

      f.text(C.textMuted);
      doc.setFontSize(8);
      doc.setFont('helvetica', 'normal');
      const lines = doc.splitTextToSize(b.d, colW - PAD * 2 - checkSize - 4);
      lines.forEach((l, idx) => doc.text(l, x + PAD + checkSize + 4, yy + PAD + checkSize + 4 + idx * 4));
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
      { t: 'Atendimento inicial',         d: 'Você fala com a gente pelo WhatsApp, e-mail ou formulário. Resposta rápida e humana.' },
      { t: 'Levantamento de necessidade', d: 'Entendemos seu cenário, suas dores e o que você quer resolver.' },
      { t: 'Visita técnica',              d: 'Avaliação no local da estrutura, ângulos, distâncias e pontos críticos.' },
      { t: 'Proposta personalizada',      d: 'Orçamento detalhado, com escopo, prazo e cada item bem explicado.' },
      { t: 'Instalação profissional',     d: 'Equipe qualificada com cuidado, organização e respeito ao seu espaço.' },
      { t: 'Suporte contínuo',            d: 'Treinamento, acompanhamento e canal direto sempre que precisar.' }
    ];
    const colW = (CW - 6) / 2;
    const h = 32;
    steps.forEach((s, i) => {
      const col = i % 2, row = Math.floor(i / 2);
      const x = M + col * (colW + 6);
      const yy = y + row * (h + 6);
      card(doc, x, yy, colW, h);

      f.fill(C.primary);
      doc.roundedRect(x + PAD, yy - 4, 14, 9, 1.8, 1.8, 'F');
      f.text([5, 16, 35]);
      doc.setFontSize(10);
      doc.setFont('helvetica', 'bold');
      doc.text(String(i+1).padStart(2,'0'), x + PAD + 7, yy + 2.4, { align: 'center' });

      f.text(C.white);
      doc.setFontSize(11);
      doc.setFont('helvetica', 'bold');
      doc.text(s.t, x + PAD, yy + 13);

      f.text(C.textMuted);
      doc.setFontSize(8.5);
      doc.setFont('helvetica', 'normal');
      const lines = doc.splitTextToSize(s.d, colW - PAD * 2);
      lines.forEach((l, idx) => doc.text(l, x + PAD, yy + 19 + idx * 4));
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
        items: ['Visitas preventivas periódicas','Limpeza e checagem','Atendimento prioritário','Atualização de firmware','Reparos pequenos sem custo'] },
      { tag: 'PREMIUM', t: 'Signature+',
        d: 'Plano completo com benefícios exclusivos.',
        items: ['Tudo da Manutenção Mensal','Desconto em mão de obra','Vantagens em novos projetos','SLA prioritário','Atendimento dedicado'],
        featured: true }
    ];
    const colW = (CW - 12) / 3;
    const cardH = 110;

    plans.forEach((p, i) => {
      const x = M + i * (colW + 6);
      card(doc, x, y, colW, cardH, {
        fill: p.featured ? C.surfaceAlt : C.surface,
        stroke: p.featured ? C.borderStrong : C.border,
        lineWidth: p.featured ? 0.6 : 0.25
      });

      f.text(p.featured ? C.accent : C.primary);
      doc.setFontSize(7.5);
      doc.setFont('helvetica', 'bold');
      doc.setCharSpace(1.4);
      doc.text(p.tag, x + PAD, y + PAD + 3);
      doc.setCharSpace(0);

      f.text(C.white);
      doc.setFontSize(13);
      doc.setFont('helvetica', 'bold');
      const tLines = doc.splitTextToSize(p.t, colW - PAD * 2);
      tLines.forEach((l, idx) => doc.text(l, x + PAD, y + PAD + 12 + idx * 5));
      let cy = y + PAD + 12 + tLines.length * 5;

      f.text(C.textMuted);
      doc.setFontSize(8.5);
      doc.setFont('helvetica', 'italic');
      const dLines = doc.splitTextToSize(p.d, colW - PAD * 2);
      dLines.forEach((l, idx) => doc.text(l, x + PAD, cy + 2 + idx * 4));
      cy += dLines.length * 4 + 6;

      f.stroke(p.featured ? C.borderStrong : C.border);
      doc.setLineWidth(0.15);
      doc.line(x + PAD, cy, x + colW - PAD, cy);
      cy += 4;

      f.text(C.text);
      doc.setFontSize(8.5);
      doc.setFont('helvetica', 'normal');
      p.items.forEach(it => {
        bullet(doc, x + PAD + 1, cy - 1.2, p.featured ? C.accent : C.primary);
        const lines = doc.splitTextToSize(it, colW - PAD * 2 - 4);
        lines.forEach((l, idx) => doc.text(l, x + PAD + 4, cy + idx * 4));
        cy += lines.length * 4 + 1.5;
      });
    });

    y += cardH + 8;
    const bH = 18;
    f.fill(C.surface);
    f.stroke(C.borderStrong);
    doc.setLineWidth(0.4);
    doc.roundedRect(M, y, CW, bH, 2.5, 2.5, 'FD');
    f.text(C.white);
    doc.setFontSize(9.5);
    doc.setFont('helvetica', 'bold');
    doc.text('Cliente recorrente sai ganhando.', M + PAD, y + 7.5);
    f.text(C.textMuted);
    doc.setFontSize(8.5);
    doc.setFont('helvetica', 'normal');
    doc.text('Desconto em mão de obra, prioridade no atendimento e vantagens em novos projetos.', M + PAD, y + 13);

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
      { icon: 'dollar',  t: 'À vista', d: 'PIX ou dinheiro com desconto.' },
      { icon: 'card',    t: 'Cartão',  d: 'Parcelamento facilitado.' },
      { icon: 'doc',     t: 'Boleto',  d: 'Para empresas, com prazos.' },
      { icon: 'refresh', t: 'Mensal',  d: 'Para planos de manutenção.' }
    ];
    const pW = (CW - 12) / 4;
    const pH = 38;
    pays.forEach((p, i) => {
      const x = M + i * (pW + 4);
      card(doc, x, y, pW, pH);
      // Ícone centralizado horizontalmente
      const iconSize = 11;
      iconBadge(doc, x + (pW - iconSize)/2, y + 5, iconSize, p.icon, C.primary);
      f.text(C.white);
      doc.setFontSize(10);
      doc.setFont('helvetica', 'bold');
      doc.text(p.t, x + pW/2, y + 24, { align: 'center' });
      f.text(C.textMuted);
      doc.setFontSize(7.5);
      doc.setFont('helvetica', 'normal');
      const lines = doc.splitTextToSize(p.d, pW - 4);
      lines.forEach((l, idx) => doc.text(l, x + pW/2, y + 30 + idx * 3.5, { align: 'center' }));
    });

    y += pH + 14;
    hairline(doc, y - 6);

    y = sectionTitle(doc, '08', 'GARANTIAS',
      'Nossos compromissos com você',
      'Estamos com você antes, durante e depois.', y);

    const seals = [
      { icon: 'check', t: 'Qualidade na execução',     d: 'Cada projeto entregue com cuidado, organização e padrão técnico.' },
      { icon: 'eye',   t: 'Transparência total',       d: 'Orçamento aberto, escopo claro, prazos realistas, sem cobrança surpresa.' },
      { icon: 'phone', t: 'Suporte pós-venda',         d: 'Canal direto pelo WhatsApp. Atendimento de quem entende do produto.' },
      { icon: 'star',  t: 'Compromisso com resultado', d: 'Trabalhamos até o sistema funcionar como você espera.' }
    ];
    const sCol = (CW - 6) / 2;
    const sH = 26;
    seals.forEach((s, i) => {
      const col = i % 2, row = Math.floor(i / 2);
      const x = M + col * (sCol + 6);
      const yy = y + row * (sH + 4);
      card(doc, x, yy, sCol, sH);
      iconBadge(doc, x + PAD, yy + PAD, ICON, s.icon, C.warning);
      f.text(C.white);
      doc.setFontSize(10);
      doc.setFont('helvetica', 'bold');
      doc.text(s.t, x + PAD + ICON + 6, yy + PAD + ICON/2 + 1.4);
      f.text(C.textMuted);
      doc.setFontSize(8);
      doc.setFont('helvetica', 'normal');
      const lines = doc.splitTextToSize(s.d, sCol - PAD * 2 - ICON - 6);
      lines.forEach((l, idx) => doc.text(l, x + PAD + ICON + 6, yy + PAD + ICON + 4 + idx * 4));
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

    eyebrow(doc, M + PAD, y + 11, 'VAMOS COMEÇAR');

    f.text(C.white);
    doc.setFontSize(17);
    doc.setFont('helvetica', 'bold');
    const ttl = doc.splitTextToSize('Pronto para elevar a segurança e a tecnologia do seu espaço?', CW - PAD * 2);
    ttl.forEach((l, idx) => doc.text(l, M + PAD, y + 21 + idx * 7));

    let cy = y + 21 + ttl.length * 7 + 2;

    f.text(C.textMuted);
    doc.setFontSize(9.5);
    doc.setFont('helvetica', 'normal');
    const sub = doc.splitTextToSize('O melhor momento para proteger e modernizar é antes de precisar. A gente faz isso por você, do jeito que precisa ser feito.', CW - PAD * 2);
    sub.forEach((l, idx) => doc.text(l, M + PAD, cy + idx * 4.5));

    f.text(C.primary);
    doc.setFontSize(7.5);
    doc.setFont('helvetica', 'bold');
    doc.setCharSpace(1.4);
    doc.text('RESPOSTA RÁPIDA      VISITA SEM COMPROMISSO      ATENDIMENTO HUMANO',
      M + PAD, y + bannerH - 6);
    doc.setCharSpace(0);

    y += bannerH + 14;

    y = sectionTitle(doc, '09', 'CONTATO',
      'Fale com a Prolans',
      'Escolha o canal que preferir, respondemos rapidinho.', y);

    /* Cards de contato em padrão UNIFICADO:
       icon a esquerda (PAD, PAD), title alinhado vertical */
    const contacts = [
      { icon: 'phone',     l: 'WHATSAPP / TEL', v: '(21) 99711-2008' },
      { icon: 'envelope',  l: 'E-MAIL',         v: 'contato@prolans.com.br' },
      { icon: 'instagram', l: 'INSTAGRAM',      v: '@contato.prolans' },
      { icon: 'globe',     l: 'SITE',           v: 'www.prolans.com.br' }
    ];
    const cW = (CW - 12) / 4;
    const cH = 30;
    const cIcon = 9;
    contacts.forEach((c, i) => {
      const x = M + i * (cW + 4);
      card(doc, x, y, cW, cH);

      // Ícone (canto esquerdo)
      iconBadge(doc, x + PAD, y + PAD, cIcon, c.icon, C.primary);

      // Label (uppercase pequeno) + value (bold)
      const tx = x + PAD + cIcon + 5;
      f.text(C.textMuted);
      doc.setFontSize(6.5);
      doc.setFont('helvetica', 'bold');
      doc.setCharSpace(1.2);
      doc.text(c.l, tx, y + PAD + 3.5);
      doc.setCharSpace(0);

      f.text(C.white);
      doc.setFontSize(8.6);
      doc.setFont('helvetica', 'bold');
      // Quebra automática se o valor for longo
      const vLines = doc.splitTextToSize(c.v, cW - PAD - cIcon - 5 - PAD);
      vLines.forEach((l, idx) => doc.text(l, tx, y + PAD + 9 + idx * 4));
    });

    y += cH + 6;

    // Endereço (linha cheia)
    const addrH = 22;
    card(doc, M, y, CW, addrH);
    iconBadge(doc, M + PAD, y + PAD, ICON, 'pin', C.primary);
    f.text(C.textMuted);
    doc.setFontSize(7);
    doc.setFont('helvetica', 'bold');
    doc.setCharSpace(1.4);
    doc.text('ENDEREÇO', M + PAD + ICON + 6, y + PAD + 3);
    doc.setCharSpace(0);
    f.text(C.white);
    doc.setFontSize(10);
    doc.setFont('helvetica', 'bold');
    doc.text('Praça Baltazar da Silveira, 90 · Várzea, Teresópolis/RJ',
      M + PAD + ICON + 6, y + PAD + 9);

    // Assinatura final
    let aY = A4_H - 38;
    hairline(doc, aY);
    aY += 8;
    f.text(C.primary);
    doc.setFontSize(8);
    doc.setFont('helvetica', 'bold');
    doc.setCharSpace(1.4);
    doc.text('PROLANS · CNPJ 38.408.286/0001-11', A4_W/2, aY, { align: 'center' });
    doc.setCharSpace(0);
    aY += 5;
    f.text(C.textMuted);
    doc.setFontSize(8.5);
    doc.setFont('helvetica', 'italic');
    doc.text('© ' + new Date().getFullYear() + ' Prolans · Protegendo o presente, garantindo o futuro.',
      A4_W/2, aY, { align: 'center' });

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
