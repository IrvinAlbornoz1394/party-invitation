-- ============================================================================
-- Bootstrap de roles — SE EJECUTA UNA SOLA VEZ, A MANO, COMO SUPERUSUARIO
-- ============================================================================
--
-- Conectado a la base `mievento`, como el usuario `postgres`:
--
--   psql -U postgres -d mievento -f 0000_bootstrap_roles.sql
--
-- o pegándolo en pgAdmin con la base `mievento` seleccionada.
--
-- ANTES DE EJECUTAR: reemplazar las dos contraseñas. Generarlas con
--   openssl rand -base64 32
--
-- ----------------------------------------------------------------------------
-- Por qué dos roles y no uno
-- ----------------------------------------------------------------------------
-- mievento_owner  Dueño de las tablas. Ejecuta migraciones y seed. Puede hacer DDL.
--                 Al ser dueño, Row-Level Security NO le aplica.
--
-- mievento_app    El que usa la aplicación en runtime. No puede hacer DDL, no puede
--                 crear objetos, no tiene ningún permiso sobre las tablas de tokens
--                 y sesiones, y SÍ está sujeto a Row-Level Security.
--
-- Esta separación es lo que hace que RLS sirva de algo. Si la app se conectara con
-- el dueño (o peor, con postgres), las políticas se saltarían y el aislamiento entre
-- clientes quedaría dependiendo únicamente de que ninguna consulta olvide su WHERE.
-- ============================================================================

-- Este archivo es SQL puro, sin meta-comandos de psql, para que se pueda pegar tal cual en
-- pgAdmin. Antes empezaba con `\set ON_ERROR_STOP on` y pgAdmin fallaba con "error de
-- sintaxis en o cerca de «on»", porque la barra invertida solo la entiende psql.
--
-- Para detenerse al primer error desde psql, va en la línea de comandos:
--   psql -v ON_ERROR_STOP=1 -U postgres -d mievento -f 0000_bootstrap_roles.sql

-- ── Roles ───────────────────────────────────────────────────────────────────────
do $$
begin
  if not exists (select 1 from pg_roles where rolname = 'mievento_owner') then
    create role mievento_owner login password 'REEMPLAZAR_OWNER';
    raise notice 'rol mievento_owner creado';
  else
    raise notice 'rol mievento_owner ya existía, no se toca';
  end if;

  if not exists (select 1 from pg_roles where rolname = 'mievento_app') then
    create role mievento_app login password 'REEMPLAZAR_APP';
    raise notice 'rol mievento_app creado';
  else
    raise notice 'rol mievento_app ya existía, no se toca';
  end if;
end
$$;

-- ── Propiedad del esquema ───────────────────────────────────────────────────────
-- El dueño necesita poseer `public` para poder crear las tablas ahí.
alter schema public owner to mievento_owner;

grant connect on database mievento to mievento_owner, mievento_app;

-- El dueño necesita CREATE sobre la base para poder crear el esquema `app`, donde
-- viven las funciones de seguridad. La app no lo necesita y no lo recibe.
grant create on database mievento to mievento_owner;

-- ── Cerrar el acceso por defecto ────────────────────────────────────────────────
-- En Postgres, el pseudo-rol PUBLIC (es decir, cualquier rol que pueda conectarse)
-- tiene USAGE sobre `public` por herencia. Se le quita CREATE para que ningún rol
-- pueda plantar tablas o funciones propias en el esquema de la aplicación.
revoke create on schema public from public;

-- La app necesita ver el esquema, pero no crear en él.
grant usage on schema public to mievento_app;
revoke create on schema public from mievento_app;

-- ============================================================================
-- Después de esto:
--   1. Poner las contraseñas reales en .env.local (DATABASE_URL con mievento_app,
--      DATABASE_MIGRATION_URL con mievento_owner).
--   2. npm run db:migrate   → crea las tablas y aplica RLS y permisos
--   3. npm run db:seed      → carga catálogos y el evento de ejemplo
-- ============================================================================
