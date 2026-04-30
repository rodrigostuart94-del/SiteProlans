-- ============================================================
-- PROLANS — Adendo: Storage para upload de arquivos
-- Execute APÓS o supabase-schema.sql.
-- ============================================================

-- 1) ADICIONA colunas arquivo_path em todas as tabelas relevantes
alter table public.propostas      add column if not exists arquivo_path text;
alter table public.servicos       add column if not exists arquivo_path text;
alter table public.contratos      add column if not exists arquivo_path text;
alter table public.boletos        add column if not exists arquivo_path text;
alter table public.notas_fiscais  add column if not exists arquivo_path text;
alter table public.leads          add column if not exists arquivo_path text;

-- 2) Cria bucket "documentos" (privado por padrão).
insert into storage.buckets (id, name, public)
values ('documentos', 'documentos', false)
on conflict (id) do nothing;

-- 3) RLS POLICIES para storage.objects no bucket "documentos"
-- Estrutura de path: {tipo}/{user_id}/{filename}
-- Ex: "boletos/abc-123-uuid/2026-04-30-fatura.pdf"

-- Admin pode tudo
drop policy if exists "documentos_admin_all" on storage.objects;
create policy "documentos_admin_all"
  on storage.objects for all
  using (bucket_id = 'documentos' and public.is_admin())
  with check (bucket_id = 'documentos' and public.is_admin());

-- Cliente lê apenas arquivos cujo path tem o seu user_id como segundo segmento
drop policy if exists "documentos_client_select_own" on storage.objects;
create policy "documentos_client_select_own"
  on storage.objects for select
  using (
    bucket_id = 'documentos'
    and (storage.foldername(name))[2] = auth.uid()::text
  );

-- ============================================================
-- VERIFICAÇÃO
--   select * from storage.buckets where id = 'documentos';
--   select polname, polcmd from pg_policies where schemaname = 'storage';
-- ============================================================
