-- ============================================================
-- PROLANS — Schema do banco Supabase
-- Rode este arquivo INTEIRO no SQL Editor do Supabase:
-- (Painel Supabase > SQL Editor > New Query > cole tudo > Run)
-- ============================================================

-- 1) PROFILES — extende auth.users com nome, email e papel
create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  nome text not null default '',
  email text,
  role text not null default 'client' check (role in ('client','admin')),
  telefone text,
  created_at timestamptz not null default now()
);

-- 2) PROPOSTAS
create table if not exists public.propostas (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  servico text not null,
  valor numeric(12,2) not null default 0,
  status text not null default 'pending' check (status in ('pending','approved','rejected')),
  data date not null default current_date,
  origem_lead uuid,
  created_at timestamptz not null default now()
);

-- 3) ORDENS DE SERVIÇO
create table if not exists public.servicos (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  titulo text not null,
  tecnico text default '',
  status text not null default 'pending' check (status in ('pending','in-progress','done')),
  inicio date not null default current_date,
  created_at timestamptz not null default now()
);

-- 4) CONTRATOS
create table if not exists public.contratos (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  titulo text not null,
  valor numeric(12,2) not null default 0,
  status text not null default 'approved' check (status in ('approved','pending','done')),
  inicio date not null default current_date,
  created_at timestamptz not null default now()
);

-- 5) BOLETOS
create table if not exists public.boletos (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  descricao text not null,
  valor numeric(12,2) not null default 0,
  vencimento date not null,
  status text not null default 'pending' check (status in ('pending','done')),
  created_at timestamptz not null default now()
);

-- 6) NOTAS FISCAIS
create table if not exists public.notas_fiscais (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  numero text not null,
  descricao text not null,
  valor numeric(12,2) not null default 0,
  emissao date not null default current_date,
  status text not null default 'emitida' check (status in ('emitida','cancelada')),
  link_pdf text,
  created_at timestamptz not null default now(),
  unique(user_id, numero)
);

-- 7) NOTIFICAÇÕES
create table if not exists public.notificacoes (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  tipo text not null default 'info',
  txt text not null,
  created_at timestamptz not null default now()
);

-- 8) LEADS de orçamento (público pode inserir, só admin lê)
create table if not exists public.leads (
  id uuid primary key default gen_random_uuid(),
  protocolo text unique not null,
  nome text not null,
  telefone text,
  email text,
  servico text,
  detalhes text,
  valor_estimado numeric(12,2),
  observacoes text,
  imovel text,
  status text not null default 'novo',
  vinculado_a uuid references auth.users(id) on delete set null,
  created_at timestamptz not null default now()
);

-- ============================================================
-- HELPER: função para checar se usuário atual é admin
-- ============================================================
create or replace function public.is_admin()
returns boolean
language sql
security definer
stable
as $$
  select exists (select 1 from public.profiles where id = auth.uid() and role = 'admin')
$$;

-- ============================================================
-- TRIGGER: auto-criar profile quando alguém cria conta via auth.signUp
-- ============================================================
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
as $$
begin
  insert into public.profiles (id, nome, email, role)
  values (
    new.id,
    coalesce(new.raw_user_meta_data->>'nome', split_part(new.email, '@', 1)),
    new.email,
    'client'
  )
  on conflict (id) do nothing;
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- ============================================================
-- ROW LEVEL SECURITY
-- ============================================================
alter table public.profiles      enable row level security;
alter table public.propostas     enable row level security;
alter table public.servicos      enable row level security;
alter table public.contratos     enable row level security;
alter table public.boletos       enable row level security;
alter table public.notas_fiscais enable row level security;
alter table public.notificacoes  enable row level security;
alter table public.leads         enable row level security;

-- PROFILES: usuário lê e atualiza o próprio; admin lê e atualiza todos
drop policy if exists "profiles_select_own" on public.profiles;
create policy "profiles_select_own" on public.profiles
  for select using (id = auth.uid() or public.is_admin());

drop policy if exists "profiles_update_own_or_admin" on public.profiles;
create policy "profiles_update_own_or_admin" on public.profiles
  for update using (id = auth.uid() or public.is_admin());

drop policy if exists "profiles_insert_admin" on public.profiles;
create policy "profiles_insert_admin" on public.profiles
  for insert with check (public.is_admin());

drop policy if exists "profiles_delete_admin" on public.profiles;
create policy "profiles_delete_admin" on public.profiles
  for delete using (public.is_admin());

-- DADOS DO CLIENTE (propostas, servicos, contratos, boletos, notas_fiscais, notificacoes):
-- cliente lê o que é dele. Admin faz tudo.
do $$
declare t text;
begin
  for t in select unnest(array['propostas','servicos','contratos','boletos','notas_fiscais','notificacoes']) loop
    execute format('drop policy if exists "%I_select" on public.%I', t, t);
    execute format('create policy "%I_select" on public.%I for select using (user_id = auth.uid() or public.is_admin())', t, t);
    execute format('drop policy if exists "%I_admin_all" on public.%I', t, t);
    execute format('create policy "%I_admin_all" on public.%I for all using (public.is_admin()) with check (public.is_admin())', t, t);
  end loop;
end $$;

-- LEADS: qualquer um pode inserir (form de orçamento público); só admin lê/edita
drop policy if exists "leads_insert_anyone" on public.leads;
create policy "leads_insert_anyone" on public.leads
  for insert with check (true);

drop policy if exists "leads_select_admin" on public.leads;
create policy "leads_select_admin" on public.leads
  for select using (public.is_admin());

drop policy if exists "leads_update_admin" on public.leads;
create policy "leads_update_admin" on public.leads
  for update using (public.is_admin());

drop policy if exists "leads_delete_admin" on public.leads;
create policy "leads_delete_admin" on public.leads
  for delete using (public.is_admin());

-- ============================================================
-- ÍNDICES
-- ============================================================
create index if not exists idx_propostas_user      on public.propostas(user_id);
create index if not exists idx_servicos_user       on public.servicos(user_id);
create index if not exists idx_contratos_user      on public.contratos(user_id);
create index if not exists idx_boletos_user        on public.boletos(user_id);
create index if not exists idx_notas_user          on public.notas_fiscais(user_id);
create index if not exists idx_notificacoes_user   on public.notificacoes(user_id);
create index if not exists idx_leads_status        on public.leads(status);

-- ============================================================
-- PROMOVER ADMIN: depois de criar a conta adm@prolans.com.br
-- pelo dashboard Authentication, rode esta linha no SQL editor:
--
-- update public.profiles set role = 'admin'
-- where id = (select id from auth.users where email = 'adm@prolans.com.br');
-- ============================================================
