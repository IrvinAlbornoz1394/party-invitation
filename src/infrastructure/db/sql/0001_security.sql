-- ============================================================================
-- Seguridad: Row-Level Security, permisos y plano de autenticación
-- ============================================================================
--
-- Lo aplica `npm run db:migrate` con el rol DUEÑO, después de las migraciones de
-- Drizzle. Es idempotente: se puede volver a correr sin efectos secundarios.
--
-- El modelo de amenaza que cubre este archivo:
--
--   1. Fuga entre clientes. El riesgo real de un SaaS multi-tenant no es la inyección
--      SQL, es un WHERE client_id olvidado. RLS hace que Postgres rechace las
--      filas ajenas aunque la consulta esté mal escrita.
--
--   2. Robo de credenciales de acceso. El rol de la aplicación no tiene NINGÚN
--      permiso sobre otp_challenges, sessions ni auth_attempts. Aunque alguien logre
--      ejecutar SQL arbitrario con el rol de la app, no puede leer un hash de sesión,
--      no puede robar un código de acceso a medio usar y no puede borrar los intentos
--      para reiniciar los límites.
--
--   3. Lectura pública sin contexto. La invitación es pública y quien la abre no
--      tiene cliente. En lugar de darle a la app una vía para leer sin contexto,
--      la única puerta es una función que solo resuelve eventos publicados y vigentes.
-- ============================================================================

create schema if not exists app authorization mievento_owner;

-- ============================================================================
-- 1. updated_at gestionado por la base de datos
-- ============================================================================
-- Se hace con trigger y no desde la aplicación para que el valor sea correcto
-- aunque la fila se modifique desde un script, desde psql o desde otro servicio.

create or replace function app.set_updated_at()
returns trigger
language plpgsql
set search_path = pg_catalog, public
as $$
begin
  new.updated_at := now();
  return new;
end;
$$;

do $$
declare
  r record;
begin
  for r in
    select c.table_name
    from information_schema.columns c
    join information_schema.tables t
      on t.table_schema = c.table_schema and t.table_name = c.table_name
    where c.table_schema = 'public'
      and c.column_name = 'updated_at'
      and t.table_type = 'BASE TABLE'
  loop
    execute format('drop trigger if exists set_updated_at on public.%I', r.table_name);
    execute format(
      'create trigger set_updated_at before update on public.%I
         for each row execute function app.set_updated_at()',
      r.table_name
    );
  end loop;
end
$$;

-- ============================================================================
-- 2. Contexto de tenant
-- ============================================================================
-- Lee la variable que `withTenant()` fija con set_config(..., true), es decir con
-- alcance de transacción. El segundo argumento `true` de current_setting hace que
-- devuelva NULL en vez de fallar cuando la variable no está definida.
--
-- Consecuencia importante y deliberada: sin contexto, esto devuelve NULL, y
-- `client_id = NULL` no es TRUE, así que las políticas no dejan ver ninguna
-- fila. El sistema falla cerrado: un olvido se manifiesta como "no hay datos",
-- nunca como datos de otro cliente.

create or replace function app.current_client_id()
returns uuid
language sql
stable
parallel safe
set search_path = pg_catalog, public
as $$
  select nullif(current_setting('app.current_client_id', true), '')::uuid;
$$;

-- ============================================================================
-- 3. Row-Level Security sobre las tablas de tenant
-- ============================================================================
-- La lista está escrita explícitamente. Es una decisión de seguridad y tiene que
-- poder auditarse de un vistazo. `scripts/check-rls.ts` verifica que no falte
-- ninguna tabla con client_id.

do $$
declare
  tenant_tables text[] := array[
    'events',
    'event_blocks',
    'event_venues',
    'event_schedule_items',
    'event_gallery_items',
    'event_messages',
    'event_gift_registries',
    'guest_groups',
    'guests',
    'rsvp_responses',
    'event_tables',
    'table_assignments',
    'reminder_schedules',
    'reminder_deliveries',
    'guestbook_entries'
  ];
  t text;
begin
  foreach t in array tenant_tables loop
    execute format('alter table public.%I enable row level security', t);

    execute format('drop policy if exists tenant_isolation on public.%I', t);
    -- USING filtra lo que se puede leer; WITH CHECK impide escribir una fila
    -- con el client_id de otro cliente. Hacen falta las dos.
    execute format(
      'create policy tenant_isolation on public.%I
         using (client_id = app.current_client_id())
         with check (client_id = app.current_client_id())',
      t
    );
  end loop;
end
$$;

-- ── clients: la propia fila del tenant, identificada por `id` ─────────────
alter table public.clients enable row level security;
drop policy if exists tenant_isolation on public.clients;
create policy tenant_isolation on public.clients
  using (id = app.current_client_id())
  with check (id = app.current_client_id());

-- ── users: visibles solo dentro de su cliente ──────────────────────────────
-- El login NO pasa por aquí: cuando alguien pide un código todavía no hay contexto de
-- cliente, así que esta política no dejaría ver ni su propia cuenta. Ese camino va
-- por app.begin_otp_issue() y app.verify_otp(), más abajo.
--
-- RLS deja que un administrador edite a los usuarios de su propio cliente, que es
-- lo correcto. Lo que NO puede hacer es concederse `platform_role`: esa columna está
-- revocada para el rol de la aplicación en la sección 4, porque si no, editar a un
-- compañero sería el camino para salirse del aislamiento entre clientes.
--
-- Consecuencia de que `client_id` sea nullable: las cuentas de plataforma tienen NULL,
-- y `NULL = <cualquier cosa>` nunca es TRUE, así que **ninguna política las alcanza
-- jamás**. No es un efecto colateral que haya que vigilar, es la propiedad que se busca:
-- un cliente no puede leer, listar ni modificar las cuentas de la plataforma desde su
-- panel ni por error de una consulta. Esas cuentas se administran con `db:platform-admin`,
-- que corre con el rol dueño.
alter table public.users enable row level security;
drop policy if exists tenant_isolation on public.users;
create policy tenant_isolation on public.users
  using (client_id = app.current_client_id())
  with check (client_id = app.current_client_id());

-- ── audit_log: append-only para la aplicación ──────────────────────────────────
-- Sin políticas de UPDATE ni DELETE: la aplicación puede escribir en la bitácora y
-- leer la suya, pero no puede reescribir su propio historial.
alter table public.audit_log enable row level security;
drop policy if exists tenant_read on public.audit_log;
create policy tenant_read on public.audit_log
  for select using (client_id = app.current_client_id());
drop policy if exists tenant_append on public.audit_log;
create policy tenant_append on public.audit_log
  for insert with check (client_id = app.current_client_id());

-- ============================================================================
-- 4. Permisos del rol de la aplicación
-- ============================================================================

grant usage on schema app to mievento_app;

-- El trigger de updated_at se ejecuta con los privilegios de quien hace el UPDATE,
-- así que el rol de la aplicación necesita EXECUTE. Postgres lo concede a PUBLIC por
-- defecto en cada función nueva, pero se pone explícito para no depender de eso.
grant execute on function app.set_updated_at() to mievento_app;

-- ── Catálogos de plataforma: solo lectura ──────────────────────────────────────
-- Un evento no puede inventar planes, variantes, plantillas ni temas. Eso lo
-- administra la plataforma con el rol dueño.
grant select on
  public.features,
  public.plans,
  public.plan_features,
  public.event_types,
  public.blocks,
  public.component_variants,
  public.templates,
  public.themes,
  public.template_blocks,
  public.template_plans,
  public.template_event_types
to mievento_app;

-- ── Datos de tenant: DML completo, acotado por RLS ─────────────────────────────
grant select, insert, update, delete on
  public.events,
  public.event_blocks,
  public.event_venues,
  public.event_schedule_items,
  public.event_gallery_items,
  public.event_messages,
  public.event_gift_registries,
  public.guest_groups,
  public.guests,
  public.rsvp_responses,
  public.event_tables,
  public.table_assignments,
  public.reminder_schedules,
  public.reminder_deliveries,
  public.guestbook_entries
to mievento_app;

-- El cliente se lee y se ajusta, pero no se crea ni se borra desde la app.
grant select, update on public.clients to mievento_app;

-- ── users: permisos por COLUMNA, no por tabla ─────────────────────────────────
--
-- `platform_role` queda fuera de lo que la aplicación puede escribir. Sin esto, la
-- pantalla de "administrar usuarios" del panel sería una vía de escalada: un `owner`
-- editando a un compañero de SU PROPIA cliente —cosa que RLS permite y debe
-- permitir— podría poner `platform_role = 'superadmin'` y salir a ver a todos los demás
-- clientes. El aislamiento entre tenants se rompería desde dentro de un tenant, sin
-- tocar RLS ni el plano de auth.
--
-- Los permisos por columna son la defensa correcta aquí porque no dependen de que la
-- aplicación escriba bien la consulta: un UPDATE que incluya la columna es rechazado por
-- Postgres, aunque el código lo intente por error o por descuido de un `set` genérico.
--
-- `last_login_at` tampoco está en la lista: lo escribe app.verify_otp() con el rol
-- dueño. Si la aplicación pudiera tocarlo, podría falsear el rastro de accesos.
--
-- Los revoke previos hacen esto idempotente y son necesarios: el archivo se reaplica en
-- cada migración, y sin ellos un `grant update` de tabla completa concedido antes
-- seguiría vigente y volvería inútil el grant por columnas.
revoke insert, update on public.users from mievento_app;
grant select on public.users to mievento_app;
grant insert (client_id, email, phone, name, role, status, preferred_otp_channel)
  on public.users to mievento_app;
grant update (email, phone, name, role, status, preferred_otp_channel)
  on public.users to mievento_app;

-- El historial se escribe y se consulta; nunca se modifica ni se borra.
grant select, insert on public.audit_log to mievento_app;

-- ── Plano de autenticación: sin ningún permiso ─────────────────────────────────
-- Esto es lo que hace que un robo de hashes de sesión sea imposible con el rol de
-- la aplicación. El acceso va exclusivamente por las funciones SECURITY DEFINER.
revoke all on public.otp_challenges from mievento_app;
revoke all on public.sessions from mievento_app;
-- Los intentos se escriben y se cuentan únicamente desde las funciones del plano de
-- auth. Si la app pudiera borrar filas aquí, podría limpiarse su propio historial de
-- intentos y anular TODOS los límites de una sola sentencia: el de códigos de acceso a
-- invitaciones y el de códigos de inicio de sesión.
revoke all on public.auth_attempts from mievento_app;
revoke all on public.invitation_access_attempts from mievento_app;

-- ── Nada de privilegios por defecto ───────────────────────────────────────────
-- No se configura ALTER DEFAULT PRIVILEGES a propósito. Una tabla nueva nace sin
-- permisos para la app, así que se descubre al primer uso en desarrollo en lugar de
-- quedar accesible sin que nadie lo haya decidido.
revoke all on all tables in schema public from public;

-- ============================================================================
-- 5. Plano de autenticación (funciones SECURITY DEFINER)
-- ============================================================================
--
-- Todas llevan `set search_path = pg_catalog, public`. Sin eso, un rol capaz de
-- crear objetos podría plantar una función que sombree a una del sistema y lograr
-- ejecución con los privilegios del dueño. Ya se revocó CREATE sobre `public`, pero
-- las dos defensas juntan bien.
--
-- Ninguna recibe ni devuelve credenciales en claro: la aplicación genera el código o
-- el token, lo entrega por su canal y aquí solo entra su HMAC-SHA256. El secreto de
-- la clave HMAC vive en AUTH_SECRET, fuera de la base de datos, y eso es lo que hace
-- que un dump no permita iniciar sesión con nada: con seis dígitos, un SHA-256 a
-- secas se invertiría por fuerza bruta en menos de un segundo.

-- ── Firmas que cambiaron: hay que tirarlas antes de recrearlas ────────────────
--
-- `create or replace function` NO puede cambiar el tipo de retorno de una función que ya
-- existe: Postgres responde "cannot change return type of existing function" y la
-- migración se detiene a medias. Como este archivo se reaplica en cada `db:migrate`, las
-- funciones que cambiaron de forma tienen que tirarse explícitamente antes.
--
-- · resolve_session y verify_otp perdieron la columna del cliente activo: sin
--   impersonación, una sesión de cliente trabaja siempre en `users.client_id` y una de
--   plataforma no trabaja en ninguno.
-- · purge_expired_auth pasó de 3 a 4 (los intentos de auth se cuentan aparte de los de
--   invitación).
--
-- Va con `if exists` para que funcione igual en una base nueva. Y va DENTRO de esta
-- sección, junto a los `create` correspondientes, para que quien cambie una firma vea el
-- drop que le toca actualizar a dos líneas de distancia.
drop function if exists app.resolve_session(text);
drop function if exists app.verify_otp(text, text, text, text, interval, inet, text);
drop function if exists app.purge_expired_auth(interval);

-- list_events_for_platform ganó la columna `access_code`, para que `/admin/eventos` pueda
-- componer la URL de cada invitación (`/<slug>/<código>`) en vez de enseñar solo el slug,
-- que por sí solo no lleva a ninguna parte.
--
-- Necesita drop y no basta `create or replace`: Postgres rechaza reemplazar una función
-- cuando cambian las columnas de su RETURNS TABLE, con «cannot change return type of
-- existing function». Sin este drop, `db:migrate` falla al reaplicarse sobre una base que
-- ya tenía la versión anterior.
drop function if exists app.list_events_for_platform(text);

-- ── Funciones retiradas al eliminar la impersonación ──────────────────────────
--
-- El superadministrador ya no elige un cliente activo y trabaja "como si fuera él": tiene
-- su propio panel en `/admin` y el contexto de tenant se fija por operación. Estas dos
-- sostenían el modelo anterior y hay que tirarlas explícitamente, porque
-- `create or replace` no borra lo que dejó de escribirse.
--
-- Una función SECURITY DEFINER olvidada es una puerta que sigue abierta aunque nadie la
-- llame desde el código: `switch_active_client` concedía acceso a datos de otro cliente, y
-- el rol de la aplicación conservaría el EXECUTE que se le concedió en su día.
drop function if exists app.list_clients_for_actor(uuid);
drop function if exists app.switch_active_client(text, uuid, inet);
drop function if exists app.create_client_client(uuid, text, text, text, text, text);

-- ── Serialización por identificador ───────────────────────────────────────────
-- Las funciones de emisión y de canje toman un cerrojo de aviso sobre el hash del
-- correo. Sin él quedan dos carreras reales:
--
--   · Dos peticiones de código a la vez leen el mismo contador de emisiones y las dos
--     pasan el límite.
--   · Dos peticiones a la vez invalidan el código anterior e insertan el suyo; con el
--     índice único parcial una de las dos revienta con error de restricción en lugar de
--     esperar su turno.
--
-- El cerrojo es de alcance de transacción (`_xact_`), así que se libera al terminar
-- pase lo que pase, incluido un error. No hace falta liberarlo a mano y no puede
-- quedarse pegado a una conexión del pool.
--
-- `hashtext` reduce el hash a un bigint, que es lo que acepta la API de cerrojos de
-- aviso. Dos correos distintos pueden colisionar en el mismo cerrojo; el efecto sería
-- que sus logins se serializan entre sí, que es una pérdida de concurrencia
-- irrelevante y nunca un problema de corrección.
create or replace function app.lock_identifier(p_identifier_hash text)
returns void
language sql
security definer
set search_path = pg_catalog, public
as $$
  select pg_advisory_xact_lock(hashtext(p_identifier_hash)::bigint);
$$;

-- ── Paso 1 de la emisión: límites y búsqueda de la cuenta ─────────────────────
--
-- La emisión está partida en dos funciones porque en medio hay una decisión que
-- pertenece al dominio: por qué canal se entrega el código. Esa regla —"si pidió
-- WhatsApp y no tiene teléfono, va por correo"— vive en
-- `src/domain/auth/otp-channel.ts` y no se duplica aquí. Duplicarla sería peor que
-- partir la función: dos copias de una regla que decide a dónde se manda una
-- credencial acabarían divergiendo.
--
-- Las dos llamadas van dentro de UNA transacción de la aplicación, y el cerrojo de
-- aviso tomado aquí dura hasta el final de esa transacción, así que la atomicidad
-- entre "comprobar el límite" y "guardar el código" se mantiene igual que si fuera
-- una sola función.
--
-- Devuelve datos de contacto de la cuenta a la aplicación sin contexto de tenant, que
-- es algo que el rol de la app no puede hacer por su cuenta. Es deliberado y es lo
-- mínimo que necesita el login: sin saber el teléfono no se puede entregar por
-- WhatsApp. No devuelve nada más que identidad y destinos de entrega.
create or replace function app.begin_otp_issue(
  p_identifier      text,
  p_identifier_hash text,
  p_ip              inet default null
)
returns table (
  status            text,
  user_id           uuid,
  email             text,
  name              text,
  phone             text,
  preferred_channel text
)
language plpgsql
security definer
set search_path = pg_catalog, public
as $$
declare
  -- 3 códigos por correo cada 15 minutos. El abuso que frena esto no es adivinar el
  -- código, es usar el formulario de login como ametralladora de correos contra la
  -- bandeja de un cliente. Tres es suficiente para alguien que no recibió el primero.
  v_identifier_window   constant interval := interval '15 minutes';
  v_identifier_max      constant integer  := 3;
  -- 15 por IP cada hora. Más alto porque una oficina entera puede compartir salida a
  -- internet, y bloquear a un cliente legítimo también es un fallo.
  v_ip_window           constant interval := interval '1 hour';
  v_ip_max              constant integer  := 15;
  v_count               integer;
  -- Escalares y no un `record`: leer un campo de un record al que un `select into` no le
  -- asignó ninguna fila es un error en tiempo de ejecución, y aquí el caso normal —correo
  -- que no existe— es precisamente el que no devuelve filas. Con escalares, "sin fila"
  -- deja NULL, que es lo que se comprueba.
  v_user_id             uuid;
  v_user_email          text;
  v_user_name           text;
  v_user_phone          text;
  v_user_channel        text;
begin
  perform app.lock_identifier(p_identifier_hash);

  -- Se cuentan TODAS las emisiones, no solo las fallidas: lo que hay que limitar es el
  -- envío de mensajes, y los envíos que molestan a alguien son precisamente los que
  -- salieron bien.
  select count(*) into v_count
  from public.auth_attempts a
  where a.identifier_hash = p_identifier_hash
    and a.kind = 'issue'
    and a.created_at > now() - v_identifier_window;

  if v_count >= v_identifier_max then
    -- El intento bloqueado también se registra. Si no, el contador dejaría de crecer al
    -- llegar al tope y la ventana se liberaría antes de lo debido.
    insert into public.auth_attempts (kind, identifier_hash, client_ip, succeeded)
    values ('issue', p_identifier_hash, p_ip, false);

    return query select 'rate_limited'::text, null::uuid, null::text, null::text, null::text, null::text;
    return;
  end if;

  if p_ip is not null then
    select count(*) into v_count
    from public.auth_attempts a
    where a.client_ip = p_ip
      and a.kind = 'issue'
      and a.created_at > now() - v_ip_window;

    if v_count >= v_ip_max then
      insert into public.auth_attempts (kind, identifier_hash, client_ip, succeeded)
      values ('issue', p_identifier_hash, p_ip, false);

      return query select 'rate_limited'::text, null::uuid, null::text, null::text, null::text, null::text;
      return;
    end if;
  end if;

  -- `invited` cuenta como una cuenta que puede entrar. Con OTP no hace falta un token de
  -- invitación: quien fue dado de alta por su administrador entra pidiendo su código, y el
  -- correo ES la verificación de que la dirección es suya. El estado sirve para que el panel
  -- pueda decir "todavía no ha entrado", y se promueve a `active` en el primer acceso.
  select u.id, u.email, u.name, u.phone, u.preferred_otp_channel::text
    into v_user_id, v_user_email, v_user_name, v_user_phone, v_user_channel
  from public.users u
  where u.email = lower(trim(p_identifier))
    and u.status in ('active', 'invited')
  limit 1;

  -- Se registra exista o no la cuenta. Es lo que hace que los topes se alcancen igual
  -- con un correo real y con uno inventado: sin esto, "me bloquearon" sería una señal
  -- de que el correo está registrado.
  insert into public.auth_attempts (kind, identifier_hash, client_ip, succeeded)
  values ('issue', p_identifier_hash, p_ip, v_user_id is not null);

  if v_user_id is null then
    return query select 'no_account'::text, null::uuid, null::text, null::text, null::text, null::text;
    return;
  end if;

  return query select 'ok'::text, v_user_id, v_user_email, v_user_name, v_user_phone, v_user_channel;
end;
$$;

-- ── Paso 2 de la emisión: guardar el código ───────────────────────────────────
-- Invalida cualquier código anterior del mismo correo y guarda el nuevo. Devuelve
-- cuándo vence, para que el mensaje se lo pueda decir al usuario.
--
-- La invalidación NO filtra por `expires_at > now()`: hay que sellar también los
-- vencidos, porque el índice único parcial se define sobre `consumed_at is null` y un
-- código vencido sin sellar seguiría ocupando el sitio del nuevo. (Ese detalle es la
-- clase de cosa que en producción aparece como "no me llega el segundo código".)
create or replace function app.store_otp_challenge(
  p_user_id     uuid,
  p_identifier  text,
  p_code_hash   text,
  p_channel     text,
  p_destination text,
  p_ttl         interval,
  p_ip          inet default null,
  p_user_agent  text default null
)
returns timestamptz
language plpgsql
security definer
set search_path = pg_catalog, public
as $$
declare
  v_expires_at timestamptz := now() + p_ttl;
begin
  update public.otp_challenges
     set consumed_at = now()
   where identifier = p_identifier
     and consumed_at is null;

  insert into public.otp_challenges
    (user_id, identifier, code_hash, channel, destination, expires_at, request_ip, request_user_agent)
  values
    (p_user_id, p_identifier, p_code_hash, p_channel::otp_channel, p_destination, v_expires_at, p_ip, p_user_agent);

  return v_expires_at;
end;
$$;

-- ── Canjear el código y abrir sesión ──────────────────────────────────────────
--
-- Todo en una sola llamada, porque sellar el código y crear la sesión tienen que ser
-- atómicos: si fueran dos pasos, dos peticiones con el mismo código podrían abrir dos
-- sesiones.
--
-- Los cuatro resultados de fallo están pensados para no ser un oráculo:
--
--   'invalid'            no existe ningún código con ese HMAC para ese correo
--   'expired'            el código es correcto pero ya no vale (vencido, usado o
--                        reemplazado). Solo lo puede ver quien recibió el código.
--   'too_many_attempts'  se agotaron los intentos de ESTE correo. El contador se lleva
--                        en auth_attempts, que registra también correos inexistentes,
--                        así que este resultado no revela si la cuenta existe.
--   'rate_limited'       la IP se pasó del tope global de fallos.
create or replace function app.verify_otp(
  p_identifier      text,
  p_identifier_hash text,
  p_code_hash       text,
  p_session_hash    text,
  p_session_ttl     interval,
  p_ip              inet default null,
  p_user_agent      text default null
)
returns table (
  status              text,
  user_id             uuid,
  /** NULL para una cuenta de plataforma: no pertenece a ningún tenant. */
  client_id           uuid,
  role                text,
  platform_role       text,
  email               text,
  name                text,
  session_expires_at  timestamptz
)
language plpgsql
security definer
set search_path = pg_catalog, public
as $$
declare
  -- 5 intentos por correo cada 15 minutos. Con un espacio de 1e6 y esta ventana, la
  -- probabilidad de acertar a ciegas es 5 en un millón, y no se puede repetir la tirada
  -- porque pedir códigos nuevos tiene su propio tope.
  v_identifier_window   constant interval := interval '15 minutes';
  v_identifier_max      constant integer  := 5;
  -- 30 fallos por IP cada hora: el tope que impide que una sola máquina barra muchos
  -- correos a la vez, cinco intentos en cada uno.
  v_ip_window           constant interval := interval '1 hour';
  v_ip_max              constant integer  := 30;
  -- Tope del propio reto. Redundante con el de arriba a propósito: si algún día se
  -- purgan los intentos antes de tiempo, el código sigue quemándose al sexto fallo.
  v_challenge_max       constant integer  := 5;
  v_count               integer;
  v_challenge_id        uuid;
  v_user_id             uuid;
  v_expired             boolean;
  v_status              text;
  v_session_expires_at  timestamptz;
  v_actor_client        uuid;
  v_actor_role          text;
  v_actor_platform_role text;
  v_actor_email         text;
  v_actor_name          text;
  v_actor_status        text;
begin
  perform app.lock_identifier(p_identifier_hash);

  select count(*) into v_count
  from public.auth_attempts a
  where a.identifier_hash = p_identifier_hash
    and a.kind = 'verify'
    and a.succeeded = false
    and a.created_at > now() - v_identifier_window;

  if v_count >= v_identifier_max then
    insert into public.auth_attempts (kind, identifier_hash, client_ip, succeeded)
    values ('verify', p_identifier_hash, p_ip, false);

    return query select 'too_many_attempts'::text, null::uuid, null::uuid,
                        null::text, null::text, null::text, null::text, null::timestamptz;
    return;
  end if;

  if p_ip is not null then
    select count(*) into v_count
    from public.auth_attempts a
    where a.client_ip = p_ip
      and a.kind = 'verify'
      and a.succeeded = false
      and a.created_at > now() - v_ip_window;

    if v_count >= v_ip_max then
      insert into public.auth_attempts (kind, identifier_hash, client_ip, succeeded)
      values ('verify', p_identifier_hash, p_ip, false);

      return query select 'rate_limited'::text, null::uuid, null::uuid,
                          null::text, null::text, null::text, null::text, null::timestamptz;
      return;
    end if;
  end if;

  -- Un único UPDATE condicional hace el código de un solo uso. Si dos peticiones
  -- llegaran con el mismo código, Postgres serializa el UPDATE y solo una obtiene la
  -- fila: no hay ventana entre "comprobar" y "marcar" porque son la misma sentencia.
  -- (El cerrojo de aviso ya las serializó antes, pero esto se sostiene solo.)
  update public.otp_challenges c
     set consumed_at = now()
   where c.identifier = p_identifier
     and c.code_hash = p_code_hash
     and c.consumed_at is null
     and c.expires_at > now()
  returning c.id, c.user_id into v_challenge_id, v_user_id;

  if v_challenge_id is null then
    -- Distinguir "código equivocado" de "código que ya no vale" mejora mucho la
    -- experiencia y no filtra nada: para llegar aquí con `expired` hay que haber
    -- acertado el HMAC, cosa que solo puede hacer quien recibió el código.
    select true into v_expired
    from public.otp_challenges c
    where c.identifier = p_identifier
      and c.code_hash = p_code_hash
    limit 1;

    v_status := case when v_expired then 'expired' else 'invalid' end;

    -- El reto activo acumula el fallo y se quema al agotarse, aunque el código tecleado
    -- fuera de otro intento.
    update public.otp_challenges c
       set attempts = c.attempts + 1,
           consumed_at = case when c.attempts + 1 >= v_challenge_max then now() else null end
     where c.identifier = p_identifier
       and c.consumed_at is null
       and c.expires_at > now();

    insert into public.auth_attempts (kind, identifier_hash, client_ip, succeeded)
    values ('verify', p_identifier_hash, p_ip, false);

    return query select v_status, null::uuid, null::uuid,
                        null::text, null::text, null::text, null::text, null::timestamptz;
    return;
  end if;

  -- La cuenta pudo desactivarse entre la emisión y el canje. Se comprueba ANTES de
  -- crear la sesión: al revés quedaría una sesión válida de una cuenta deshabilitada.
  select u.client_id, u.role::text, u.platform_role::text, u.email, u.name, u.status::text
    into v_actor_client, v_actor_role, v_actor_platform_role, v_actor_email, v_actor_name, v_actor_status
  from public.users u
  where u.id = v_user_id;

  if v_actor_status not in ('active', 'invited') then
    insert into public.auth_attempts (kind, identifier_hash, client_ip, succeeded)
    values ('verify', p_identifier_hash, p_ip, false);

    return query select 'account_disabled'::text, null::uuid, null::uuid,
                        null::text, null::text, null::text, null::text, null::timestamptz;
    return;
  end if;

  v_session_expires_at := now() + p_session_ttl;

  -- La sesión no guarda ningún cliente. El tenant de una cuenta de cliente es
  -- `users.client_id` y no cambia mientras la sesión viva; una cuenta de plataforma no
  -- tiene tenant. El campo mutable que había antes era también la única vía por la que una
  -- sesión podía acabar apuntando a datos que no le correspondían.
  insert into public.sessions
    (user_id, token_hash, expires_at, created_ip, created_user_agent)
  values
    (v_user_id, p_session_hash, v_session_expires_at, p_ip, p_user_agent);

  -- El primer acceso confirma la invitación. Se hace en la misma sentencia que
  -- `last_login_at` para que no exista un instante en el que la sesión ya está creada y la
  -- cuenta sigue figurando como pendiente.
  -- El alias `u` NO es opcional: esta función declara un parámetro de salida llamado
  -- `status`, y una referencia sin calificar a la columna `status` es ambigua para plpgsql
  -- ("column reference status is ambiguous"). Falla en tiempo de ejecución, no al crear la
  -- función, así que solo se ve intentando iniciar sesión de verdad.
  update public.users u
     set last_login_at = now(),
         status = case when u.status = 'invited' then 'active'::user_status else u.status end
   where u.id = v_user_id;

  insert into public.auth_attempts (kind, identifier_hash, client_ip, succeeded)
  values ('verify', p_identifier_hash, p_ip, true);

  -- La bitácora se escribe aquí y no en la aplicación para que no se pueda olvidar: un
  -- inicio de sesión sin registrar es justo el que interesa a quien entra sin permiso.
  -- `client_id` queda NULL cuando entra una cuenta de plataforma, y eso es exactamente lo
  -- que significa: ese acceso no pertenece al historial de ningún cliente.
  insert into public.audit_log (client_id, user_id, action, entity_type, entity_id, metadata, ip, user_agent)
  values (
    v_actor_client, v_user_id, 'auth.session.opened', 'user', v_user_id,
    jsonb_build_object('email', v_actor_email, 'challenge_id', v_challenge_id),
    p_ip, p_user_agent
  );

  return query select 'ok'::text, v_user_id, v_actor_client,
                      v_actor_role, v_actor_platform_role, v_actor_email, v_actor_name,
                      v_session_expires_at;
end;
$$;

-- ── Resolver la sesión de una petición ────────────────────────────────────────
--
-- `client_id` es el tenant de la petición y se lee de la cuenta, no de la sesión. Viene
-- NULL cuando es una cuenta de plataforma, y ese NULL es lo que separa los dos paneles:
-- `requireClientActor()` lo exige y `requirePlatformAdmin()` exige lo contrario.
create or replace function app.resolve_session(p_session_hash text)
returns table (
  user_id       uuid,
  client_id     uuid,
  role          text,
  platform_role text,
  email         text,
  name          text
)
language plpgsql
security definer
set search_path = pg_catalog, public
as $$
declare
  v_user_id uuid;
begin
  update public.sessions s
     set last_used_at = now()
   where s.token_hash = p_session_hash
     and s.revoked_at is null
     and s.expires_at > now()
  returning s.user_id into v_user_id;

  if v_user_id is null then
    return;
  end if;

  -- Se comprueba contra `disabled` y no a favor de `active` por una razón práctica: el día
  -- que se añada un estado nuevo al enum —"suspendido por impago", por ejemplo— una lista
  -- blanca dejaría fuera a todo el mundo sin que nadie lo hubiera decidido, mientras que
  -- esta forma mantiene el acceso hasta que alguien decida bloquearlo explícitamente. Para
  -- una sesión YA abierta ese es el fallo menos dañino; en el login (arriba) la lista blanca
  -- sí es lo correcto, porque ahí se está concediendo acceso nuevo.
  return query
    select u.id, u.client_id, u.role::text, u.platform_role::text, u.email, u.name
    from public.users u
    where u.id = v_user_id
      and u.status <> 'disabled';
end;
$$;

-- ── Cerrar sesión ─────────────────────────────────────────────────────────────
-- Se marca revocada en lugar de borrarla, para conservar el rastro de auditoría.
-- Idempotente: cerrar una sesión ya cerrada no es un error ni escribe dos veces.
create or replace function app.revoke_session(p_session_hash text)
returns void
language plpgsql
security definer
set search_path = pg_catalog, public
as $$
declare
  v_user_id   uuid;
  v_client_id uuid;
begin
  update public.sessions s
     set revoked_at = now()
   where s.token_hash = p_session_hash
     and s.revoked_at is null
  returning s.user_id into v_user_id;

  if v_user_id is null then
    return;
  end if;

  -- El cliente sale de la cuenta, no de la sesión. Es NULL para una cuenta de plataforma,
  -- igual que en la línea de apertura, de modo que las dos entradas del par abrir/cerrar
  -- caen siempre en la misma bitácora.
  select u.client_id into v_client_id from public.users u where u.id = v_user_id;

  insert into public.audit_log (client_id, user_id, action, entity_type, entity_id)
  values (v_client_id, v_user_id, 'auth.session.closed', 'user', v_user_id);
end;
$$;

-- ── El panel de plataforma: quién es y qué puede ver ──────────────────────────
--
-- Row-Level Security impide por diseño leer más de un cliente a la vez: sin contexto de
-- tenant `clients` no devuelve ninguna fila, y con contexto devuelve exactamente una.
-- Eso es lo correcto para el panel de un cliente, y es justo lo que el panel de
-- plataforma necesita saltarse para poder listar a todos.
--
-- La vía es SECURITY DEFINER y NO una excepción dentro de las políticas. Una política que
-- dejara pasar a quien tuviera `platform_role` habría que repetirla en cada tabla, y la
-- primera que alguien escribiera sin ella sería un agujero silencioso. Con este reparto,
-- el aislamiento sigue siendo idéntico para todo el mundo y lo que hay es una puerta:
-- estrecha, contada y auditable.
--
-- Todas reciben el HASH DEL TOKEN, no un id de usuario. Es la misma disciplina que tenía
-- el cambio de organización: donde se cruza la frontera entre clientes, quien decide es
-- la base de datos. Una sesión caducada o revocada no puede listar nada aunque el proceso
-- que llama conserve el actor en memoria.

-- Resuelve "¿esta sesión es de una cuenta de plataforma en activo?" y devuelve su id.
-- Está aparte porque las cuatro funciones de abajo empiezan igual, y una comprobación de
-- privilegio duplicada cuatro veces acaba divergiendo en la quinta.
create or replace function app.platform_actor(p_session_hash text)
returns uuid
language sql
stable
security definer
set search_path = pg_catalog, public
as $$
  select u.id
  from public.sessions s
  join public.users u on u.id = s.user_id
  where s.token_hash = p_session_hash
    and s.revoked_at is null
    and s.expires_at > now()
    and u.status <> 'disabled'
    and u.platform_role = 'superadmin';
$$;

-- ── Listado global de clientes ────────────────────────────────────────────────
-- Devuelve el conteo de eventos junto con cada cliente. Ir a buscarlo después, cliente a
-- cliente, obligaría a fijar el contexto de tenant una vez por fila.
create or replace function app.list_clients_for_platform(p_session_hash text)
returns table (
  id            uuid,
  name          text,
  slug          text,
  status        text,
  contact_email text,
  contact_phone text,
  event_count   bigint,
  created_at    timestamptz
)
language plpgsql
security definer
set search_path = pg_catalog, public
as $$
begin
  if app.platform_actor(p_session_hash) is null then
    return;
  end if;

  return query
    select c.id, c.name, c.slug, c.status::text, c.contact_email, c.contact_phone,
           count(e.id), c.created_at
    from public.clients c
    left join public.events e on e.client_id = c.id
    where c.status <> 'closed'
    group by c.id
    order by c.name;
end;
$$;

-- ── Listado global de eventos ─────────────────────────────────────────────────
-- La pantalla `/admin/eventos`: todos los eventos de todos los clientes, con lo justo
-- para listarlos y entrar. El detalle de un evento NO sale de aquí: para eso se fija el
-- contexto del cliente con authorize_client_context() y se consulta con RLS puesta, que
-- es lo que evita que esta función se convierta con el tiempo en una segunda API paralela
-- sin aislamiento.
create or replace function app.list_events_for_platform(p_session_hash text)
returns table (
  id           uuid,
  client_id    uuid,
  client_name  text,
  title        text,
  slug         text,
  status       text,
  starts_at    timestamptz,
  plan_key     text,
  -- En claro, igual que en la tabla. Es lo que permite al panel componer la URL que se
  -- reparte; la protección de la invitación son el espacio de 32^6 y el límite por IP de
  -- app.resolve_invitation_access(), no que este valor sea secreto para quien ya entró.
  access_code  text
)
language plpgsql
security definer
set search_path = pg_catalog, public
as $$
begin
  if app.platform_actor(p_session_hash) is null then
    return;
  end if;

  return query
    select e.id, e.client_id, c.name, e.title, e.slug, e.status::text, e.starts_at,
           e.plan_key, e.access_code
    from public.events e
    join public.clients c on c.id = e.client_id
    order by e.starts_at desc;
end;
$$;

-- ── Autorizar el contexto de un cliente ───────────────────────────────────────
--
-- La pieza que sustituye a la impersonación. Cuando el panel de plataforma abre un evento
-- concreto, la aplicación llama a esto y solo si responde `true` fija
-- `app.current_client_id` para esa transacción. A partir de ahí trabaja con Row-Level
-- Security puesta exactamente igual que el propio cliente: el privilegio consiste en poder
-- abrir el contexto, nunca en poder saltarse el aislamiento.
--
-- La diferencia con el modelo anterior es el ALCANCE. El cliente activo vivía en la sesión
-- y duraba hasta que alguien lo cambiaba, así que existía el estado "estoy dentro de otro
-- cliente sin acordarme" —el riesgo humano que obligaba a poner un aviso permanente en la
-- interfaz—. Aquí el contexto dura una transacción y se descarta solo.
--
-- Solo se auditan las DENEGACIONES. Registrar cada autorización concedida escribiría una
-- fila por cada carga de pantalla y ahogaría la bitácora justo donde se busca la señal;
-- las escrituras que sí importan las audita quien las hace, con su acción concreta. Un
-- intento denegado, en cambio, es raro por definición y es la señal que interesa.
create or replace function app.authorize_client_context(
  p_session_hash text,
  p_client_id    uuid,
  p_ip           inet default null
)
returns boolean
language plpgsql
security definer
set search_path = pg_catalog, public
as $$
declare
  v_actor_id  uuid := app.platform_actor(p_session_hash);
  v_target_ok boolean;
begin
  if v_actor_id is null then
    -- Sin actor de plataforma no hay a quién atribuir el intento, así que no se registra:
    -- lo único que se sabría es que alguien mandó un token que no vale, y de eso ya deja
    -- constancia el propio fallo de sesión.
    return false;
  end if;

  -- No se entra a un cliente suspendido ni cerrado. Si se le cortó el servicio, tocar sus
  -- datos exige reactivarlo primero: una decisión explícita, no el efecto colateral de
  -- abrir una pantalla.
  select true into v_target_ok
  from public.clients c
  where c.id = p_client_id
    and c.status = 'active';

  if not coalesce(v_target_ok, false) then
    insert into public.audit_log (client_id, user_id, action, entity_type, entity_id, metadata, ip)
    values (
      null, v_actor_id, 'platform.client_context.denied', 'client', p_client_id,
      jsonb_build_object('reason', 'client_not_active'), p_ip
    );

    return false;
  end if;

  return true;
end;
$$;


-- ── Resolver invitación pública ───────────────────────────────────────────────
--
-- La única forma de obtener contexto de tenant sin autenticarse, y por lo tanto la
-- frontera de seguridad del lado público del producto.
--
-- Hace tres cosas que TIENEN que ser atómicas entre sí:
--   1. Comprueba el límite de intentos de la IP.
--   2. Verifica slug + código + publicado + vigente, todo en un solo WHERE.
--   3. Registra el intento.
--
-- Si el límite se comprobara en la aplicación, dos peticiones paralelas podrían leer
-- el mismo contador y saltarse el tope. Aquí van en la misma llamada.
--
-- El slug se compara junto con el código, nunca antes: no existe forma de averiguar
-- si un slug existe sin acertar también su código, así que la ruta no sirve para
-- enumerar eventos.
--
-- Devuelve siempre exactamente una fila. `rate_limited` distingue "código incorrecto"
-- de "demasiados intentos", que es información que sí necesita la aplicación para
-- responder distinto, pero que no revela nada sobre si el evento existe.
drop function if exists app.resolve_published_event(text);

create or replace function app.resolve_invitation_access(
  p_slug      text,
  p_code      text,
  p_client_ip inet default null
)
returns table (event_id uuid, client_id uuid, rate_limited boolean)
language plpgsql
security definer
set search_path = pg_catalog, public
as $$
declare
  -- 20 fallos por IP cada 15 minutos. Generoso para una persona real, que llega con
  -- un enlace que funciona, y letal para un script: con 32^6 combinaciones, barrer
  -- el espacio a este ritmo llevaría más de un millón de años por IP.
  v_window       constant interval := interval '15 minutes';
  v_max_failures constant integer  := 20;
  v_failures     integer;
  v_event_id     uuid;
  v_org_id       uuid;
begin
  if p_client_ip is not null then
    select count(*) into v_failures
    from public.invitation_access_attempts a
    where a.client_ip = p_client_ip
      and a.succeeded = false
      and a.created_at > now() - v_window;

    if v_failures >= v_max_failures then
      -- Se registra también el intento bloqueado: si no, el contador dejaría de
      -- crecer al llegar al tope y la ventana se liberaría antes de lo debido.
      insert into public.invitation_access_attempts (slug, client_ip, succeeded)
      values (p_slug, p_client_ip, false);

      return query select null::uuid, null::uuid, true;
      return;
    end if;
  end if;

  -- Sin filas, `select into` deja las variables en NULL, que es lo que se comprueba
  -- después. No hace falta manejar la excepción NO_DATA_FOUND.
  select e.id, e.client_id
    into v_event_id, v_org_id
  from public.events e
  where e.slug = p_slug
    and e.access_code = p_code
    and e.status = 'published'
    and (e.expires_at is null or e.expires_at > now())
  limit 1;

  insert into public.invitation_access_attempts (slug, client_ip, succeeded)
  values (p_slug, p_client_ip, v_event_id is not null);

  return query select v_event_id, v_org_id, false;
end;
$$;

-- ── Cortar las sesiones de una cuenta ─────────────────────────────────────────
--
-- La llama la aplicación al desactivar a alguien. Sin esto, quitarle el acceso a una
-- persona no tendría efecto hasta que su sesión venciera —hasta 30 días—, y quien pulsa
-- "desactivar" normalmente lo hace porque alguien acaba de dejar la empresa.
--
-- Tiene que ser SECURITY DEFINER porque `sessions` está sellada para el rol de la
-- aplicación. Y precisamente por eso comprueba ella misma que la cuenta pertenece a la
-- cliente que dice: al correr como dueño no hay Row-Level Security que la proteja, así
-- que si se fiara del `p_client_id` recibido, la aplicación podría cerrar la sesión
-- de cualquier usuario de cualquier cliente pasando el par que quisiera.
--
-- Es idempotente: revocar sesiones de quien no tiene ninguna devuelve 0 y no es un error.
create or replace function app.revoke_user_sessions(
  p_client_id uuid,
  p_user_id         uuid,
  p_actor_user_id   uuid
)
returns integer
language plpgsql
security definer
set search_path = pg_catalog, public
as $$
declare
  v_belongs boolean;
  v_count   integer;
begin
  select true into v_belongs
  from public.users u
  where u.id = p_user_id
    and u.client_id = p_client_id;

  if not coalesce(v_belongs, false) then
    return 0;
  end if;

  update public.sessions s
     set revoked_at = now()
   where s.user_id = p_user_id
     and s.revoked_at is null;

  get diagnostics v_count = row_count;

  if v_count > 0 then
    insert into public.audit_log (client_id, user_id, action, entity_type, entity_id, metadata)
    values (
      p_client_id, p_actor_user_id, 'auth.sessions.revoked', 'user', p_user_id,
      jsonb_build_object('sessions_revoked', v_count)
    );
  end if;

  return v_count;
end;
$$;

-- ── Dar de alta un cliente ────────────────────────────────────────────────────
--
-- Crea el cliente y su primer dueño en una sola operación atómica. Que vayan juntos no
-- es comodidad: un cliente sin ninguna cuenta no lo puede arreglar nadie desde la
-- aplicación, porque para entrar a un cliente hace falta tener cuenta en él. Si el
-- segundo insert fallara por separado, quedaría un cliente inaccesible.
--
-- Es SECURITY DEFINER por dos motivos que se suman: el rol de la aplicación no tiene
-- INSERT sobre `clients` —crear tenants es una operación de plataforma, no de tenant— y
-- además esto ocurre sin contexto de cliente, así que Row-Level Security bloquearía
-- las dos escrituras.
--
-- Recibe el hash del token y no un id de usuario, igual que el resto de las funciones de
-- plataforma: quien decide si esta cuenta puede crear clientes es la base de datos, y una
-- sesión caducada no puede hacerlo aunque quien llame siga teniendo el actor en memoria.
create or replace function app.create_client(
  p_session_hash    text,
  p_name            text,
  p_slug            text,
  p_contact_email   text,
  p_owner_email     text,
  p_owner_name      text,
  p_ip              inet default null
)
returns table (status text, client_id uuid, user_id uuid)
language plpgsql
security definer
set search_path = pg_catalog, public
as $$
declare
  v_actor_id    uuid := app.platform_actor(p_session_hash);
  v_client_id   uuid;
  v_user_id     uuid;
  v_owner_email text := lower(trim(p_owner_email));
  v_slug        text := lower(trim(p_slug));
begin
  if v_actor_id is null then
    return query select 'forbidden'::text, null::uuid, null::uuid;
    return;
  end if;

  if exists (select 1 from public.clients c where c.slug = v_slug) then
    return query select 'slug_taken'::text, null::uuid, null::uuid;
    return;
  end if;

  -- El único de `users.email` es global, así que este caso existe igualmente; lo que se
  -- elige aquí es contarlo. Callarlo dejaría a quien da de alta ante un fallo sin
  -- explicación y sin nada que hacer.
  if exists (select 1 from public.users u where u.email = v_owner_email) then
    return query select 'email_taken'::text, null::uuid, null::uuid;
    return;
  end if;

  insert into public.clients (name, slug, contact_email)
  values (trim(p_name), v_slug, nullif(trim(coalesce(p_contact_email, '')), ''))
  returning id into v_client_id;

  -- Nace como `invited`: todavía no ha entrado nadie. Se promueve solo en el primer acceso.
  -- El rol es `owner` y no es configurable: quien recibe un cliente nuevo tiene que poder
  -- administrarlo entero, incluido invitar al resto de su equipo.
  insert into public.users (client_id, email, name, role, status)
  values (v_client_id, v_owner_email, trim(p_owner_name), 'owner', 'invited')
  returning id into v_user_id;

  -- Se registra EN EL CLIENTE recién creado y no como acción sin tenant: quien audite
  -- después el historial de ese cliente tiene que ver su propia alta como primera línea.
  insert into public.audit_log (client_id, user_id, action, entity_type, entity_id, metadata, ip)
  values (
    v_client_id, v_actor_id, 'client.created', 'client', v_client_id,
    jsonb_build_object('slug', v_slug, 'owner_email', v_owner_email), p_ip
  );

  return query select 'created'::text, v_client_id, v_user_id;
exception
  -- Red de seguridad ante una carrera: dos altas simultáneas con el mismo slug o correo
  -- pasan las comprobaciones de arriba y chocan en el índice único. Sin este bloque, el
  -- usuario vería un error de base de datos en crudo en lugar de un mensaje entendible.
  when unique_violation then
    return query select 'slug_taken'::text, null::uuid, null::uuid;
end;
$$;

-- ── Limpieza de credenciales vencidas ─────────────────────────────────────────
-- Para ejecutar periódicamente. Un código o una sesión vencida ya no sirve para
-- entrar, pero seguir guardando su hash es superficie de ataque sin beneficio.
create or replace function app.purge_expired_auth(p_retain interval default interval '30 days')
returns table (
  challenges_deleted bigint,
  sessions_deleted   bigint,
  auth_attempts_deleted bigint,
  invitation_attempts_deleted bigint
)
language plpgsql
security definer
set search_path = pg_catalog, public
as $$
declare
  v_challenges  bigint;
  v_sessions    bigint;
  v_auth        bigint;
  v_invitations bigint;
begin
  delete from public.otp_challenges where expires_at < now() - p_retain;
  get diagnostics v_challenges = row_count;

  delete from public.sessions
   where expires_at < now() - p_retain
      or (revoked_at is not null and revoked_at < now() - p_retain);
  get diagnostics v_sessions = row_count;

  -- Los intentos solo importan dentro de su ventana (15 minutos o 1 hora); más allá del
  -- periodo de retención son un log que crece sin aportar nada.
  --
  -- OJO: el periodo de retención no puede bajar por debajo de la ventana más larga de
  -- los límites, o purgar se convertiría en la forma de reiniciar los contadores.
  delete from public.auth_attempts where created_at < now() - p_retain;
  get diagnostics v_auth = row_count;

  delete from public.invitation_access_attempts where created_at < now() - p_retain;
  get diagnostics v_invitations = row_count;

  return query select v_challenges, v_sessions, v_auth, v_invitations;
end;
$$;

-- ── Permisos de ejecución ─────────────────────────────────────────────────────
-- Por defecto Postgres concede EXECUTE a PUBLIC en cada función nueva, lo cual con
-- SECURITY DEFINER es peligroso. Se revoca y se concede solo a quien debe usarla.
--
-- Las firmas van completas porque `revoke` y `grant` sobre funciones se resuelven por
-- firma: si una función cambia de parámetros y aquí queda la firma vieja, el revoke
-- apunta a una función que ya no existe y falla, o peor, deja la nueva con EXECUTE para
-- PUBLIC. Cambiar un parámetro obliga a actualizar estas dos listas.
revoke all on function app.lock_identifier(text) from public;
revoke all on function app.begin_otp_issue(text, text, inet) from public;
revoke all on function app.store_otp_challenge(uuid, text, text, text, text, interval, inet, text) from public;
revoke all on function app.verify_otp(text, text, text, text, interval, inet, text) from public;
revoke all on function app.resolve_session(text) from public;
revoke all on function app.revoke_session(text) from public;
revoke all on function app.platform_actor(text) from public;
revoke all on function app.list_clients_for_platform(text) from public;
revoke all on function app.list_events_for_platform(text) from public;
revoke all on function app.authorize_client_context(text, uuid, inet) from public;
revoke all on function app.create_client(text, text, text, text, text, text, inet) from public;
revoke all on function app.revoke_user_sessions(uuid, uuid, uuid) from public;
revoke all on function app.resolve_invitation_access(text, text, inet) from public;
revoke all on function app.purge_expired_auth(interval) from public;
revoke all on function app.current_client_id() from public;

grant execute on function app.begin_otp_issue(text, text, inet) to mievento_app;
grant execute on function app.store_otp_challenge(uuid, text, text, text, text, interval, inet, text) to mievento_app;
grant execute on function app.verify_otp(text, text, text, text, interval, inet, text) to mievento_app;
grant execute on function app.resolve_session(text) to mievento_app;
grant execute on function app.revoke_session(text) to mievento_app;
grant execute on function app.list_clients_for_platform(text) to mievento_app;
grant execute on function app.list_events_for_platform(text) to mievento_app;
grant execute on function app.authorize_client_context(text, uuid, inet) to mievento_app;
grant execute on function app.create_client(text, text, text, text, text, text, inet) to mievento_app;
grant execute on function app.revoke_user_sessions(uuid, uuid, uuid) to mievento_app;
grant execute on function app.resolve_invitation_access(text, text, inet) to mievento_app;
grant execute on function app.current_client_id() to mievento_app;

-- app.platform_actor NO se concede a la aplicación. Es el detalle interno con el que las
-- cuatro funciones de plataforma resuelven el privilegio, y todas corren como dueño.
-- Dársela no rompería nada por sí sola —solo responde "¿esta sesión es de plataforma?"—
-- pero un permiso que nadie necesita es superficie que no hace falta ofrecer.

-- app.lock_identifier NO se concede a la aplicación: es un detalle interno de las dos
-- funciones que la usan y ambas ya corren como dueño. Dársela permitiría a la app tomar
-- cerrojos arbitrarios y bloquear los logins de cualquiera.

-- purge_expired_auth la ejecuta un job de mantenimiento con el rol dueño, no la app.

-- ============================================================================
-- 6. Restos del esquema anterior
-- ============================================================================
-- El acceso al panel se hacía con magic link antes de pasar a códigos OTP. La tabla la
-- retira la migración de Drizzle; las funciones hay que tirarlas explícitamente, porque
-- `create or replace` no borra lo que ya no se escribe. Una función SECURITY DEFINER
-- olvidada es una puerta que sigue abierta aunque nadie la use: esta emitía credenciales
-- válidas contra una tabla que ya no existe, así que hoy solo serviría para reventar,
-- pero el hábito de limpiarlas es lo que importa.
drop function if exists app.issue_magic_link(text, text, interval, inet, text);
drop function if exists app.consume_magic_link(text, text, interval, inet, text);
