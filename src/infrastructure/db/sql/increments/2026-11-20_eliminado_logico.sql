-- ============================================================================
-- Eliminar clientes y eventos, sin borrar nada (2026-11-20)
-- ============================================================================
--
-- Eliminar es **lógico**: la fila se queda y se marca con `deleted_at`. A partir de ese momento
-- no aparece en ningún listado, no abre sesiones, no sirve su invitación y su contexto no se puede
-- abrir. Lo que se conserva es el historial: la bitácora, los invitados que confirmaron y las
-- fotos siguen ahí por si hace falta reconstruir algo o restaurarlo a mano.
--
-- Las reglas de un incremento están en `2026-11-18_enlace_del_cliente.sql`: idempotente, antes de
-- `0001_security.sql` y reflejado en el esquema de Drizzle.

alter table public.clients add column if not exists deleted_at timestamptz;
alter table public.events  add column if not exists deleted_at timestamptz;

-- ── Los identificadores se liberan al eliminar ───────────────────────────────
--
-- El único de `slug` pasa a contar solo lo vivo. El slug del cliente se deriva de su nombre, así
-- que volver a dar de alta a «Familia Pérez» después de eliminarla chocaría con su propio
-- fantasma; y el del evento es la URL pública, que debe poder reutilizarse cuando la invitación
-- que la ocupaba ya no existe.
alter table public.clients drop constraint if exists clients_slug_unique;
create unique index if not exists clients_slug_active_key
  on public.clients (slug) where deleted_at is null;

alter table public.events drop constraint if exists events_slug_unique;
create unique index if not exists events_slug_active_key
  on public.events (slug) where deleted_at is null;

-- El correo NO se libera aquí: `users.email` sigue siendo único global, porque una identidad no es
-- del cliente. Lo que cambia es que `app.create_client()` y `app.update_client()` reutilizan la
-- identidad de un correo que solo pertenece a clientes eliminados. Ver `0001_security.sql`.
