-- ============================================================================
-- El enlace para que el cliente llene su información (2026-11-18)
-- ============================================================================
--
-- Primer incremento del esquema. Hasta aquí el esquema entero vivía en una sola migración de
-- Drizzle (`0000_initial_schema.sql`) que se regeneraba y se aplicaba sobre una base vacía con
-- `db:fresh`. Eso dejó de valer en cuanto hay datos que conservar: este archivo AÑADE sin borrar.
--
-- Las reglas de un incremento:
--
--   · **Idempotente.** `scripts/migrate.ts` aplica todos los de esta carpeta, en orden de
--     nombre, en cada `db:migrate`. Todo va con `if not exists`.
--   · **Antes de `0001_security.sql`.** Las políticas y funciones de ese archivo nombran lo que
--     se crea aquí.
--   · **Reflejado en el esquema de Drizzle** (`src/infrastructure/db/schema`), para los tipos.
--     Si algún día se vuelve a correr `db:generate`, la migración 0000 lo traerá dentro y este
--     archivo no hará nada sobre esa base nueva.

-- ── El seguimiento del cliente, en el evento ─────────────────────────────────
--
-- Cuatro momentos y una nota. Son lo que el admin ve en la lista —«Sin abrir», «Llenando»,
-- «Enviado»— y lo que dice si hay una petición de cambios pendiente.
alter table public.events add column if not exists client_opened_at      timestamptz;
alter table public.events add column if not exists client_saved_at       timestamptz;
alter table public.events add column if not exists content_submitted_at  timestamptz;
alter table public.events add column if not exists change_requested_at   timestamptz;
alter table public.events add column if not exists change_request_note   text;

-- ── Los enlaces ──────────────────────────────────────────────────────────────
--
-- Un enlace es una credencial: quien lo abre entra al formulario de ese evento sin pedir código.
-- Por eso se guarda solo su HMAC, como las sesiones, y vence a los cinco días.
--
-- El token no se guarda en ninguna forma recuperable. Se DERIVA del `id` con AUTH_SECRET
-- (`contentLinkToken`), y así el admin puede volver a copiar el mismo enlace mientras esté
-- vigente sin que un volcado de la base sirva para entrar: con el `id` y sin el secreto no hay
-- token.
create table if not exists public.content_links (
  id          uuid primary key default gen_random_uuid(),
  client_id   uuid not null references public.clients(id) on delete cascade,
  event_id    uuid not null,
  token_hash  text not null unique,
  expires_at  timestamptz not null,
  created_by  uuid references public.users(id) on delete set null,
  created_at  timestamptz not null default now(),
  opened_at   timestamptz,
  revoked_at  timestamptz,
  constraint content_links_event_client_fkey
    foreign key (event_id, client_id) references public.events(id, client_id) on delete cascade
);

create index if not exists content_links_event_id_idx on public.content_links (event_id);

-- ── Sesiones de un solo evento ───────────────────────────────────────────────
--
-- La sesión que abre un enlace alcanza ESE evento y nada más, aunque la cuenta sea la dueña de
-- un cliente con más eventos. `app.resolve_session` la reduce a una membresía de alcance evento,
-- y RLS hace el resto. NULL = una sesión normal, con todas las membresías de la cuenta.
alter table public.sessions
  add column if not exists scope_event_id uuid references public.events(id) on delete cascade;
