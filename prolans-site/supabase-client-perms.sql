-- ============================================================
-- PROLANS — Permissões pontuais para o cliente
-- Permite que o cliente:
--   1) Marque boleto como "pago" (pending → pending_confirm)
--   2) Aprove uma proposta (pending → approved)
-- Em ambos os casos só pode mexer nas SUAS próprias linhas.
-- Execute APÓS supabase-pending-confirm.sql.
-- ============================================================

-- BOLETOS: cliente marca pago (vai para pending_confirm; admin confirma depois)
drop policy if exists "boletos_client_mark_paid" on public.boletos;
create policy "boletos_client_mark_paid"
  on public.boletos for update
  using  (user_id = auth.uid() and status = 'pending')
  with check (user_id = auth.uid() and status = 'pending_confirm');

-- PROPOSTAS: cliente aprova (pending → approved)
drop policy if exists "propostas_client_approve" on public.propostas;
create policy "propostas_client_approve"
  on public.propostas for update
  using  (user_id = auth.uid() and status = 'pending')
  with check (user_id = auth.uid() and status = 'approved');

-- ============================================================
-- VERIFICAR
--   select polname, polcmd, polqual::text, polwithcheck::text
--   from pg_policies where schemaname='public' and tablename in ('boletos','propostas');
-- ============================================================
