# Prolans Segurança e Tecnologia — Site Oficial

Site institucional + portal do cliente para a **Prolans Segurança e Tecnologia** (Teresópolis/RJ).
*"Protegendo o presente, garantindo o futuro."*

> **CNPJ:** 38.408.286/0001-11
> **Fundada:** 2020 por Rodrigo Machado
> **Contato:** (21) 99711-2008 · contato@prolans.com.br

Stack: **HTML5 + CSS3 + JavaScript vanilla**, zero dependências de build.
Pronto para rodar em qualquer hospedagem estática (Vercel, Netlify, Hostinger, registro.br).

---

## ⚠️ AÇÃO NECESSÁRIA — Salvar 2 imagens

O site espera duas imagens em `assets/img/`. Você precisa **salvá-las manualmente** antes de publicar:

1. **`assets/img/logo-prolans.png`** — o logo oficial da águia/escudo (a imagem que você me enviou).
2. **`assets/img/rodrigo.png`** — sua foto de perfil (a foto sentado no escritório).

> Salve as imagens enviadas pelo chat com exatamente esses nomes na pasta `prolans-site/assets/img/`. Pronto.

Se a `rodrigo.png` não existir, a página `sobre.html` mostra um avatar circular com as iniciais "RM" como fallback automático.

---

## Como rodar

```powershell
# Opção 1 — Python
python -m http.server 8000

# Opção 2 — Node
npx serve .

# Opção 3 — VS Code: extensão "Live Server"
```

Acesse `http://localhost:8000`.

---

## Estrutura

```
prolans-site/
├── index.html              # Home (hero tecnológico + terminal animado)
├── sobre.html              # História + timeline + Rodrigo Machado
├── servicos.html           # Tabela de preços oficial (mão de obra)
├── produtos.html           # Catálogo de produtos
├── orcamento.html          # Calculadora real + captura de lead
├── planos.html             # Plano Signature+ (manutenção contínua)
├── faq.html                # Perguntas frequentes
├── contato.html            # Endereço, mapa, formulário
├── blog.html               # Conteúdo SEO
├── area-cliente.html       # Login/cadastro
├── dashboard.html          # Painel do cliente (mock)
└── assets/
    ├── css/
    │   ├── styles.css      # Sistema de design
    │   └── tech.css        # Efeitos tecnológicos
    ├── js/
    │   ├── main.js         # Header, máscaras, ViaCEP, toast
    │   ├── tech-fx.js      # Partículas, cursor, parallax, terminal
    │   ├── orcamento.js    # Calculadora oficial Prolans
    │   └── area-cliente.js # Auth + dashboard
    └── img/
        ├── logo-prolans.png  ← VOCÊ DEVE SALVAR
        └── rodrigo.png       ← VOCÊ DEVE SALVAR
```

---

## Camada tecnológica (interatividade)

### `tech-fx.js` adiciona ao site:
- **Canvas de partículas conectadas** no fundo (linhas que se ligam quando próximas).
- **Grid de circuito sutil** animado em todo o background (CSS).
- **Cursor customizado** com glow e ring que reage a botões/cards (desktop only).
- **Parallax 3D** nos cards flutuantes do hero (seguem o mouse).
- **Tilt 3D** em cards com classe `.tilt` (rotação perspectiva ao passar mouse).
- **Botões magnéticos** com classe `.magnetic` (são "atraídos" pelo cursor).
- **Terminal animado** simulando o sistema operacional da Prolans rodando.
- **Scroll progress bar** no topo.
- **Texto glitch** no h1 do hero.
- **HUD tags** com bolinha pulsante (estilo "live").
- **Live chip** verde "SISTEMAS ATIVOS" no hero.

### Acessibilidade
Todos os efeitos respeitam `prefers-reduced-motion: reduce` e desabilitam em mobile/touch quando faria mais mal que bem.

---

## Calculadora de Orçamento — REAL

A calculadora em `orcamento.html` usa a **tabela oficial Prolans** (mão de obra):

- **CFTV**: 3 sistemas (Wi-Fi, Analógico, IP) × 4 tamanhos de kit cada
- **Alarmes**: a partir de R$ 500
- **Controle de acesso**: simples / biometria / facial
- **Fechaduras**: sobrepor / embutir
- **Portão eletrônico**: a partir de R$ 550
- **Rede**: ponto, rack, roteador, mesh
- **Automação**: por ponto + Alexa
- **Interfone**: simples ou com fechadura
- **Manutenção**: corretiva ou Signature+

**Fluxo:** Usuário preenche → calculadora mostra estimativa em tempo real → Submit:
1. Salva o lead em `localStorage` (`prolans:leads`)
2. Dispara evento `generate_lead` para Google Ads (se configurado)
3. Abre WhatsApp com mensagem pré-preenchida (protocolo + dados + estimativa)

---

## Google Ads / Analytics

No `<head>` de `index.html` há um bloco comentado pronto. Para ativar:

```html
<!-- Substitua G-XXXXXXX (Analytics) e AW-XXXXXXXX (Ads) pelos IDs reais -->
<script async src="https://www.googletagmanager.com/gtag/js?id=G-XXXXXXX"></script>
<script>
  window.dataLayer = window.dataLayer || [];
  function gtag(){dataLayer.push(arguments);}
  gtag('js', new Date());
  gtag('config', 'G-XXXXXXX');
  gtag('config', 'AW-XXXXXXXX');
</script>
```

Replique o mesmo bloco em todas as páginas (ou use Google Tag Manager).

A função `window.prolansTrack(event, params)` é chamada automaticamente em:
- **`generate_lead`** → quando alguém envia o formulário de orçamento (com valor estimado).

Configure no Google Ads como evento de conversão.

---

## SEO já configurado

- **Meta description e keywords** em todas as páginas com termos locais (Teresópolis, Região Serrana).
- **Open Graph** para compartilhamento em redes sociais.
- **JSON-LD Schema.org `LocalBusiness`** com endereço, fundador, fundação, slogan, social.
- **Favicon** com o logo da Prolans.
- **Hierarquia de h1/h2** correta em cada página.

### O que falta
- Criar `sitemap.xml` (gere após colocar no domínio final)
- Criar `robots.txt`
- Adicionar `<link rel="canonical">` em cada página

---

## Migrar para domínio prolans.com.br

1. Salvar as 2 imagens em `assets/img/`.
2. Subir todo o conteúdo de `prolans-site/` para a hospedagem (FTP, painel ou Git).
3. Apontar o domínio `prolans.com.br` para a hospedagem.
4. Cadastrar no Google Search Console e enviar sitemap.
5. Vincular Google Ads e ativar tracking de conversão (`generate_lead`).

---

## Backend futuro (opcional)

Hoje os leads são salvos em `localStorage`. Para coletá-los de verdade, basta um endpoint simples que receba POST. A área do cliente é um mock funcional pronto para integrar com qualquer API REST + JWT.

Schema sugerido (PostgreSQL):

```sql
CREATE TABLE leads (
  id TEXT PRIMARY KEY,
  nome TEXT, telefone TEXT, email TEXT,
  endereco JSONB,
  imovel TEXT,
  servico TEXT, detalhes TEXT,
  valor_estimado NUMERIC(10,2),
  observacoes TEXT,
  agendamento TIMESTAMPTZ,
  status TEXT DEFAULT 'novo',
  criado_em TIMESTAMPTZ DEFAULT now()
);
```

---

© Prolans Segurança e Tecnologia · CNPJ 38.408.286/0001-11
