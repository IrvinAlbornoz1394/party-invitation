-- ============================================================================
-- La vigencia se cuenta desde la fecha del evento (2026-11-20)
-- ============================================================================
--
-- Antes: `expires_at` = primera publicación + meses del plan. Una invitación publicada con mucha
-- anticipación podía vencer antes de la celebración. Ahora: fecha del evento + meses del plan (lo
-- fijan `publish` y `updateDetails` en `drizzle-event-repository.ts`).
--
-- Esto recalcula las que ya tienen vigencia. Es idempotente: con la regla nueva aplicada, volver a
-- correrlo deja los mismos valores.
update public.events e
   set expires_at = e.starts_at + make_interval(months => p.duration_months)
  from public.plans p
 where p.key = e.plan_key
   and e.expires_at is not null
   and e.expires_at is distinct from e.starts_at + make_interval(months => p.duration_months);
