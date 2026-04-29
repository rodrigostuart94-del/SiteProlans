# Prolans Segurança e Tecnologia — Site Institucional

Site oficial da **Prolans Segurança e Tecnologia** (Teresópolis/RJ).
Solução completa em segurança eletrônica, automação, redes e tecnologia.

CNPJ: 38.408.286/0001-11

---

## Stack

- **HTML5 + CSS3 + JavaScript Vanilla** — zero dependências de build
- Fontes **Inter** + **JetBrains Mono** (Google Fonts)
- Design system próprio (variáveis CSS, glassmorphism, animações em CSS)
- Persistência em `localStorage` (mock — substituir por backend em produção)

## Estrutura

```
prolans-site/
├─ index.html              # Home (Centro de Controle, galaxy orbit)
├─ sobre.html              # História + parceiros
├─ servicos.html           # Tabela de serviços e preços
├─ produtos.html           # Catálogo Intelbras (22 produtos)
├─ orcamento.html          # Formulário com envio para WhatsApp
├─ planos.html             # Signature / Signature+ / Enterprise
├─ blog.html               # 10 artigos
├─ faq.html                # Perguntas frequentes
├─ contato.html            # Mapa, redes, formulário
├─ area-cliente.html       # Login / Cadastro
├─ dashboard.html          # Área do Cliente (propostas, OS, boletos, NFs)
├─ admin.html              # Painel administrativo
└─ assets/
   ├─ css/      styles.css, tech.css
   ├─ js/       main.js, tech-fx.js, orcamento.js, area-cliente.js, admin.js
   └─ img/      logo, fotos
```

## Áreas autenticadas

### Cliente
- Acessa em `area-cliente.html` (cadastro livre).
- Vê propostas, ordens de serviço, contratos, boletos, notas fiscais e abre chamados.

### Administrativo
- Painel exclusivo em `admin.html` (acesso apenas com `role: admin`).
- Gerencia clientes, leads de orçamento, OS, boletos, NFs, propostas e contratos.
- Backup/restore de todos os dados em JSON.

> **Importante:** ao subir para produção, alterar a senha admin no primeiro login.

## Segurança aplicada (client-side)

- CSP, Referrer-Policy, X-Content-Type-Options, Permissions-Policy via meta tags
- Senhas com **SHA-256 + sal por usuário** (`crypto.subtle`)
- Comparação **constant-time** (mitiga timing attacks)
- **Rate-limiting** de tentativas de login (5 falhas → 60s de bloqueio)
- **Sanitização XSS** em todas as renderizações de dados de usuário
- Limites de payload em chat e tickets

> Para uso em produção real é necessário **backend** (Node/PHP/Python), com bcrypt/argon2, JWT, RBAC server-side e HTTPS. O modelo cliente-side aqui é demonstração.

## Como rodar

Abra qualquer página HTML em um navegador moderno. Sem build, sem servidor obrigatório.
Para servir via HTTP local (recomendado para evitar limitações do `file://`):

```bash
# Python 3
python -m http.server 8080 --directory prolans-site

# Node (npx)
npx serve prolans-site
```

Acesse: <http://localhost:8080>

## Integrações

- **WhatsApp**: deep links via `wa.me` em todas as CTAs
- **ViaCEP**: auto-fill de endereço por CEP
- **Google Maps**: iframe na página de Contato
- **Google Ads/Analytics**: hooks `prolansTrack()` prontos (gtag)

## Licença

Conteúdo proprietário Prolans Segurança e Tecnologia.
