-- ============================================================
-- PROLANS — Adendo: status "pending_confirm" para boletos
-- Quando o cliente clica "Marcar pago", boleto fica neste status
-- até o admin confirmar e dar baixa.
-- Execute APÓS supabase-schema.sql.
-- ============================================================

alter table public.boletos drop constraint if exists boletos_status_check;
alter table public.boletos
  add constraint boletos_status_check
  check (status in ('pending','pending_confirm','done'));
