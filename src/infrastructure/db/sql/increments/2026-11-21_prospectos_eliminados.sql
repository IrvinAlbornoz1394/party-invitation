-- ============================================================================
-- Eliminar solicitudes descartadas (2026-11-21)
-- ============================================================================
--
-- Lógico, como clientes y eventos: `deleted_at` y la fila se queda. Solo se elimina una solicitud
-- DESCARTADA (`status = 'lost'`); lo decide `app.delete_prospect()`. Una eliminada no sale en la
-- bandeja, ni en el contador del menú, ni en las cifras del embudo.
alter table public.prospects add column if not exists deleted_at timestamptz;
