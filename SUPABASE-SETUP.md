# Setup Supabase — Prolans

## Passo a passo (5 minutos)

### 1) Rodar o schema no Supabase

1. Acesse https://supabase.com/dashboard/project/onsdzldigpqsbvlbgvqb
2. Menu lateral → **SQL Editor** → **New query**
3. Abra o arquivo [`prolans-site/supabase-schema.sql`](prolans-site/supabase-schema.sql) deste repositório
4. Copie **TODO o conteúdo** e cole no SQL Editor
5. Clique em **Run** (ou Ctrl+Enter)
6. Deve aparecer "Success. No rows returned"

Isso cria todas as tabelas (`profiles`, `propostas`, `servicos`, `contratos`, `boletos`, `notas_fiscais`, `notificacoes`, `leads`) com Row Level Security configurado: cliente vê só seus dados, admin vê tudo.

### 2) Criar a conta do admin

1. Vá no painel Supabase → menu **Authentication** → **Users**
2. Clique em **Add user** → **Create new user**
3. Preencha:
   - Email: `adm@prolans.com.br`
   - Password: `Audi*0123` (ou outra senha forte)
   - **Marque** "Auto Confirm User" (importante — senão a conta fica bloqueada esperando confirmação por email)
4. Clique em **Create user**

### 3) Promover o usuário a admin

Volte no **SQL Editor** e rode:

```sql
update public.profiles set role = 'admin'
where id = (select id from auth.users where email = 'adm@prolans.com.br');
```

Você deve ver "1 row updated".

### 4-pré-A) Status "pending_confirm" para boletos — obrigatório

Para o fluxo de pagamento (cliente marca pago → admin confirma):

1. SQL Editor → New query
2. Cole o conteúdo de [`prolans-site/supabase-pending-confirm.sql`](prolans-site/supabase-pending-confirm.sql)
3. **Run**

### 4-pré-B) Permissões pontuais do cliente — obrigatório

Para o cliente conseguir clicar em "Marcar pago" e "Aprovar proposta":

1. SQL Editor → New query
2. Cole o conteúdo de [`prolans-site/supabase-client-perms.sql`](prolans-site/supabase-client-perms.sql)
3. **Run**

### 4) Habilitar upload de arquivos (PDF/XML) — obrigatório

Para que o admin consiga anexar boletos, NFs, contratos, propostas e OS em PDF/XML, e o cliente consiga baixar:

1. No SQL Editor → **New query**
2. Abra [`prolans-site/supabase-storage.sql`](prolans-site/supabase-storage.sql) → copie tudo → cole → **Run**
3. **Resultado esperado:** "Success. No rows returned"

Isso cria:
- Coluna `arquivo_path` em todas as tabelas (propostas, OS, contratos, boletos, NFs, leads)
- Bucket `documentos` no Storage (privado)
- RLS: admin sobe/lê/apaga; cliente lê só os arquivos com seu user_id no path

> **Verificação rápida**: vá em **Storage** no menu lateral. Deve aparecer o bucket `documentos`. Se não aparecer, recarregue a página.

### 5) Desativar confirmação de email para clientes (opcional, recomendado)

Em **Authentication → Providers → Email**:
- Desligue a opção **"Confirm email"**
- Assim quando um cliente se cadastra, já consegue logar imediatamente.

Se quiser manter a confirmação, configure também o template em **Authentication → Email Templates**.

---

## Como usar agora

### Você (admin):
1. Acesse https://www.prolans.com.br/area-cliente.html (ou `prolans.com.br`)
2. Login com `adm@prolans.com.br` e a senha que definiu
3. Será redirecionado automaticamente para o painel `/admin.html`
4. Cadastre clientes, propostas, OS, boletos, NFs, contratos
5. Cada item fica vinculado a um cliente — quando ele logar, vê só os dele

### Cliente:
1. Acessa https://www.prolans.com.br/area-cliente.html
2. Clica em **Criar conta** e se cadastra (nome + email + senha)
3. Imediatamente vê a área do cliente — vazia, com mensagens "aguardando cadastro pela Prolans"
4. Conforme você (admin) for cadastrando coisas para o user_id dele, aparecem no painel dele

---

## Segurança garantida pelo Supabase

- **RLS (Row Level Security)** no banco impede que um cliente acesse dados de outro, mesmo manipulando a chamada via DevTools.
- A chave `sb_publishable_...` é PÚBLICA por design — segura para incluir no JS do site.
- Admin determinado pela coluna `role` no banco — não dá para forjar pelo cliente.
- Senhas armazenadas com bcrypt pelo Supabase Auth.
- HTTPS obrigatório.

---

## Resolução de problemas

**"Invalid login credentials" ao tentar logar como admin**
- Confirme que o usuário foi criado com "Auto Confirm User" marcado
- Confirme que rodou o `update profiles set role = 'admin'`

**"Email not confirmed"**
- Vá em Authentication → Users → clique no usuário → "Send magic link" ou marque manualmente como confirmado
- Ou desative confirmação em Authentication → Providers → Email

**Cliente vê dados de outro cliente**
- Não deveria ser possível. Verifique se rodou TODO o SQL (em especial as policies de RLS)
- Confirme com: `select * from pg_policies where schemaname='public';` — deve listar policies para cada tabela

**Erro "row violates row-level security policy" ao admin tentar inserir**
- Rode novamente: `update profiles set role='admin' where id = (select id from auth.users where email='adm@prolans.com.br');`
- Faça logout e login de novo no painel admin
