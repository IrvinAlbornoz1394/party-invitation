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

-- ── La segunda dimensión: el evento ───────────────────────────────────────────
--
-- El contexto tiene dos niveles porque las membresías tienen dos alcances. Una membresía
-- de alcance cliente abre contexto solo de cliente y esta función devuelve NULL: se ve todo
-- el tenant, que es el comportamiento de siempre. Una de alcance evento —un visor, o un
-- `staff` asignado a una sola boda— abre además este, y a partir de ahí las políticas
-- estrechan al evento.
--
-- Sin esta dimensión un visor abriría el contexto de su cliente y vería TODOS los eventos de
-- ese cliente, que en el caso que motivó el modelo son las bodas de terceros: el organizador
-- tiene clientes distintos en cada evento. Ver `docs/ACCESO.md`.
--
-- NULL significa "sin estrechar", no "sin permiso", y esa es la única asimetría con
-- `current_client_id()`: aquí el valor ausente ABRE en lugar de cerrar. Es seguro porque
-- nunca es la única condición — toda política que la consulta compara además el cliente,
-- que sí falla cerrado. Quien fija el contexto es `withMembership()`, y solo pone esta
-- variable cuando la membresía trae evento.
create or replace function app.current_event_id()
returns uuid
language sql
stable
parallel safe
set search_path = pg_catalog, public
as $$
  select nullif(current_setting('app.current_event_id', true), '')::uuid;
$$;

-- ============================================================================
-- 3. Row-Level Security sobre las tablas de tenant
-- ============================================================================
-- La lista está escrita explícitamente. Es una decisión de seguridad y tiene que
-- poder auditarse de un vistazo. `scripts/check-rls.ts` verifica que no falte
-- ninguna tabla con client_id.
--
-- Cada política compara DOS cosas desde que existen las membresías de alcance evento:
-- el cliente, que falla cerrado sin contexto, y el evento, que solo estrecha cuando
-- hay uno fijado. La forma es siempre la misma:
--
--   client_id = app.current_client_id()
--   and (app.current_event_id() is null or <el evento de esta fila> = app.current_event_id())
--
-- Lo que cambia entre tablas es únicamente de dónde sale «el evento de esta fila», y hay
-- tres casos. Se escriben por separado en lugar de intentar un solo bucle con excepciones:
-- una política de seguridad que hay que leer dos veces para saber qué compara es una
-- política que nadie va a auditar.

do $$
declare
  -- Todas las tablas de tenant llevan `event_id`. La única que no es `events`, que trae
  -- el suyo en `id` y va aparte justo debajo.
  event_scoped_tables text[] := array[
    'memberships',
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
  foreach t in array event_scoped_tables loop
    execute format('alter table public.%I enable row level security', t);

    execute format('drop policy if exists tenant_isolation on public.%I', t);
    -- USING filtra lo que se puede leer; WITH CHECK impide escribir una fila
    -- con el client_id de otro cliente. Hacen falta las dos.
    --
    -- Que WITH CHECK repita la condición del evento tiene una consecuencia buscada: dentro
    -- de un contexto de evento no se puede escribir una fila que pertenezca a otro. Un
    -- `staff` asignado a una boda no puede mover invitados a la boda de al lado.
    execute format(
      'create policy tenant_isolation on public.%I
         using (client_id = app.current_client_id()
                and (app.current_event_id() is null or event_id = app.current_event_id()))
         with check (client_id = app.current_client_id()
                and (app.current_event_id() is null or event_id = app.current_event_id()))',
      t
    );
  end loop;
end
$$;

-- ── events: su evento es su propio `id` ───────────────────────────────────────
--
-- La consecuencia de que aquí la comparación sea contra `id`: en contexto de evento la
-- tabla devuelve exactamente UNA fila, la del evento fijado. El listado de eventos del
-- cliente sencillamente no existe para una membresía de alcance evento, y no porque la
-- pantalla lo esconda.
alter table public.events enable row level security;
drop policy if exists tenant_isolation on public.events;
create policy tenant_isolation on public.events
  using (client_id = app.current_client_id()
         and (app.current_event_id() is null or id = app.current_event_id()))
  with check (client_id = app.current_client_id()
         and (app.current_event_id() is null or id = app.current_event_id()));

-- ── clients: la propia fila del tenant, identificada por `id` ─────────────
--
-- Y cerrada en contexto de evento. Los datos del cliente —su nombre comercial, sus
-- contactos— no son cosa de quien solo alcanza un evento: los novios no tienen por qué
-- saber quién produce su boda ni con qué datos está dado de alta.
alter table public.clients enable row level security;
drop policy if exists tenant_isolation on public.clients;
create policy tenant_isolation on public.clients
  using (id = app.current_client_id() and app.current_event_id() is null)
  with check (id = app.current_client_id() and app.current_event_id() is null);

-- ── users: alcanzables solo a través de una membresía compartida ───────────────
--
-- Esta política es la que MÁS cambió al separar identidad de pertenencia, y conviene
-- entender qué se perdió.
--
-- Antes decía `client_id = app.current_client_id()`, y con eso venía gratis una propiedad
-- valiosa: las cuentas de plataforma tienen `client_id` NULL, `NULL = <cualquier cosa>`
-- nunca es TRUE, así que **ninguna política las alcanzaba jamás**. Al salir `client_id` de
-- `users` esa garantía desaparece, porque ya no hay ninguna columna en la fila que la
-- excluya. Hay que reconstruirla a mano, y es justo lo que hace el EXISTS:
--
--   una identidad es visible si comparte membresía con el cliente del contexto.
--
-- Una cuenta de plataforma no tiene ninguna membresía —lo verifica `db:check`—, así que el
-- EXISTS no encuentra nada y sigue siendo invisible desde el panel de cualquier cliente.
-- La diferencia es que ahora eso depende de un invariante que hay que vigilar, y antes era
-- una imposibilidad estructural. De ahí que sea el primer invariante de la lista.
--
-- `app.current_event_id() is null` cierra la tabla entera en contexto de evento: quien
-- alcanza un solo evento no tiene por qué ver quién más tiene acceso al cliente. La
-- consecuencia es que un visor no puede leer ni su propia fila de `users` estando dentro de
-- su evento; su nombre para esa pantalla sale de `memberships.label`, que sí alcanza.
--
-- El login NO pasa por aquí: cuando alguien pide un código todavía no hay contexto de
-- cliente, y lo que necesita averiguar es precisamente a qué clientes alcanza. Ese camino
-- va por app.begin_otp_issue(), app.verify_otp() y app.resolve_session().
--
-- Y no hay política de INSERT ni de UPDATE porque la aplicación ya no tiene esos permisos
-- sobre `users`: una identidad no es un dato de tenant —el mismo correo puede alcanzar dos
-- clientes— así que no hay ningún `client_id` con el que RLS pudiera acotar su creación.
-- Se crean por app.grant_membership(), que es SECURITY DEFINER. Ver la sección 4.
alter table public.users enable row level security;
drop policy if exists tenant_isolation on public.users;
create policy tenant_isolation on public.users
  for select
  using (
    app.current_event_id() is null
    and exists (
      select 1
        from public.memberships m
       where m.user_id = users.id
         and m.client_id = app.current_client_id()
    )
  );

-- ── audit_log: append-only para la aplicación ──────────────────────────────────
-- Sin políticas de UPDATE ni DELETE: la aplicación puede escribir en la bitácora y
-- leer la suya, pero no puede reescribir su propio historial.
--
-- Cerrado en contexto de evento por lo mismo que `clients`: la bitácora es del cliente
-- entera y contiene acciones sobre otros eventos.
alter table public.audit_log enable row level security;
drop policy if exists tenant_read on public.audit_log;
create policy tenant_read on public.audit_log
  for select using (client_id = app.current_client_id() and app.current_event_id() is null);
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
--
-- `memberships` está aquí y no entre las tablas selladas: conceder y retirar accesos es
-- trabajo normal del panel de un cliente, y RLS lo acota a su propio tenant. Lo que la
-- aplicación NO puede hacer es crear la identidad a la que se concede —para eso está
-- app.grant_membership()—, así que un cliente puede repartir accesos dentro de lo suyo y no
-- puede fabricar cuentas.
grant select, insert, update, delete on
  public.memberships,
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

-- ── users: SOLO LECTURA para la aplicación ────────────────────────────────────
--
-- Antes tenía permisos por COLUMNA: podía insertar y actualizar todo menos `platform_role`
-- y `last_login_at`. Eso protegía contra la escalada evidente —un `owner` editando a un
-- compañero y concediéndose acceso a todos los clientes— y era lo mejor disponible
-- mientras la identidad llevaba `client_id` encima.
--
-- Con las membresías la respuesta es más simple y más fuerte: la aplicación no escribe
-- `users` en absoluto. El motivo no es la escalada, es que una identidad **no es un dato de
-- tenant**. El mismo correo puede alcanzar dos clientes, así que no existe ningún
-- `client_id` con el que RLS pudiera acotar quién tiene derecho a crearla o a editarla: una
-- política permisiva dejaría a un cliente fabricar identidades ajenas, y una restrictiva
-- impediría invitar a nadie. Cuando RLS no puede expresar la regla, el camino correcto es
-- una función que la aplique — app.grant_membership() para conceder, y el perfil propio
-- cuando exista.
--
-- Lo que la aplicación sí escribe es la MEMBRESÍA: rol, estado y etiqueta. Ahí RLS sí
-- acota, porque una membresía siempre pertenece a un cliente concreto.
--
-- Efecto colateral bienvenido: `platform_role` y `last_login_at` dejan de necesitar
-- protección especial, porque no hay ningún UPDATE que pueda alcanzarlas. `db:check` sigue
-- verificando que no estén concedidas — la comprobación se vuelve trivial de pasar, y eso
-- es exactamente lo que se quería.
--
-- Los revoke previos hacen esto idempotente y son necesarios: el archivo se reaplica en
-- cada migración, y sin ellos un grant concedido por una versión anterior seguiría vigente.
revoke insert, update, delete on public.users from mievento_app;
grant select on public.users to mievento_app;

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
-- Las solicitudes del formulario público. Es la ÚNICA tabla del sistema con escritura anónima, y
-- sus filas son datos de contacto de terceros. Sin permisos ni de lectura, el panel de un cliente
-- no puede sacar los teléfonos de los prospectos ni por una consulta mal escrita. Se escriben por
-- app.submit_prospect() y se leen por app.list_prospects_for_platform().
revoke all on public.prospects from mievento_app;
revoke all on public.prospect_touches from mievento_app;

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
--   impersonación, el alcance de una petición sale de la membresía que corresponda a la
--   pantalla que se pide, y no de nada guardado en la sesión.
-- · purge_expired_auth pasó de 3 a 4 (los intentos de auth se cuentan aparte de los de
--   invitación).
--
-- Va con `if exists` para que funcione igual en una base nueva. Y va DENTRO de esta
-- sección, junto a los `create` correspondientes, para que quien cambie una firma vea el
-- drop que le toca actualizar a dos líneas de distancia.
drop function if exists app.resolve_session(text);
-- Fueron dos funciones que resolve_session absorbió: la pregunta «¿qué alcanza esta sesión?»
-- tiene una sola respuesta, y tenerla en dos sitios era una fuente de verdad de más.
drop function if exists app.pick_client_membership(uuid);
drop function if exists app.list_memberships(text);
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
-- La firma anterior llevaba `p_owner_email` donde ahora va `p_contact_phone`. Los tipos son los
-- mismos, así que Postgres la reconoce como la misma función… y por eso `create or replace`
-- falla: «cannot change name of input parameter». Renombrar un parámetro exige soltarla antes.
drop function if exists app.create_client(text, text, text, text, text, text, inet);

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

    return query select 'too_many_attempts'::text, null::uuid,
                        null::text, null::text, null::text, null::timestamptz;
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

    return query select v_status, null::uuid,
                        null::text, null::text, null::text, null::timestamptz;
    return;
  end if;

  -- La cuenta pudo desactivarse entre la emisión y el canje. Se comprueba ANTES de
  -- crear la sesión: al revés quedaría una sesión válida de una cuenta deshabilitada.
  select u.platform_role::text, u.email, u.name, u.status::text
    into v_actor_platform_role, v_actor_email, v_actor_name, v_actor_status
  from public.users u
  where u.id = v_user_id;

  if v_actor_status not in ('active', 'invited') then
    insert into public.auth_attempts (kind, identifier_hash, client_ip, succeeded)
    values ('verify', p_identifier_hash, p_ip, false);

    return query select 'account_disabled'::text, null::uuid,
                        null::text, null::text, null::text, null::timestamptz;
    return;
  end if;

  v_session_expires_at := now() + p_session_ttl;

  -- La sesión no guarda ningún cliente, y con las membresías ya no podría: una identidad
  -- puede alcanzar varios. El alcance se resuelve por petición a partir de la URL que se
  -- pide. El campo mutable que había antes era también la única vía por la que una sesión
  -- podía acabar apuntando a datos que no le correspondían.
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

  -- La membresía se promueve con la identidad, y hasta hoy no se promovía nunca: nace
  -- `invited` en `app.create_client()` y en `app.grant_membership()`, y ningún camino la movía
  -- de ahí. El comentario de `create_client` decía que «se promueve igual» — era una promesa
  -- que el código no cumplía.
  --
  -- La consecuencia era concreta y silenciosa: el primer candado de `app.grant_membership()`
  -- exige `m.status = 'active'` en quien concede, así que el dueño recién dado de alta recibía
  -- `forbidden` al invitar a cualquiera y la pantalla decía «No se pudo conceder ese acceso.»
  -- sin nada más. Se descubrió al abrir el alta de accesos por evento.
  --
  -- Se promueven TODAS las suyas y no una elegida. `invited` en una membresía significa
  -- «acceso concedido y todavía sin usar», igual que en la identidad: quien acaba de entrar ya
  -- lo usó, y no hay ningún dato guardado con el que decir lo contrario de una de ellas sin
  -- inventárselo. Va en esta misma transacción por lo mismo que el `update` de arriba: que no
  -- exista un instante con la sesión ya creada y el acceso figurando pendiente.
  update public.memberships m
     set status = 'active'
   where m.user_id = v_user_id
     and m.status = 'invited';

  insert into public.auth_attempts (kind, identifier_hash, client_ip, succeeded)
  values ('verify', p_identifier_hash, p_ip, true);

  -- La bitácora se escribe aquí y no en la aplicación para que no se pueda olvidar: un
  -- inicio de sesión sin registrar es justo el que interesa a quien entra sin permiso.
  --
  -- `client_id` va NULL siempre, y eso cambió con las membresías. Antes el inicio de sesión se
  -- atribuía al cliente de la cuenta; ahora una identidad puede alcanzar varios, así que
  -- abrir sesión no ocurre «dentro» de ninguno — elegir uno sería inventarse un dato. Lo que
  -- pertenece al historial de un cliente son las acciones que se hagan luego en su contexto,
  -- y esas se auditan con su propio `client_id`.
  --
  -- Quién entró y cuándo no se pierde: está en esta misma fila y en `users.last_login_at`.
  insert into public.audit_log (client_id, user_id, action, entity_type, entity_id, metadata, ip, user_agent)
  values (
    null, v_user_id, 'auth.session.opened', 'user', v_user_id,
    jsonb_build_object('email', v_actor_email, 'challenge_id', v_challenge_id),
    p_ip, p_user_agent
  );

  return query select 'ok'::text, v_user_id,
                      v_actor_platform_role, v_actor_email, v_actor_name,
                      v_session_expires_at;
end;
$$;

-- ── Resolver la sesión de una petición ────────────────────────────────────────
--
-- Devuelve la identidad y **todas sus membresías** en una sola fila, con las membresías como
-- jsonb. Hubo un momento en que fueron dos funciones —una para elegir «el» cliente de la
-- sesión y otra para listarlas— y eso era una fuente de verdad de más: la pregunta «¿qué
-- alcanza quien está pidiendo esta página?» tiene una sola respuesta y no dos.
--
-- Un jsonb y no filas repetidas porque esta función se llama en CADA petición y quien la llama
-- necesita el actor entero de una vez. Con filas, la aplicación tendría que agrupar la
-- identidad repetida N veces; con una fila, `resolveSession` construye el actor sin más.
--
-- Trae el nombre del cliente y el título del evento porque el selector de entrada los necesita
-- para ser legible —«Boda de Ana y Luis · Bodas Mérida»— y porque leerlos por RLS después
-- sería imposible: para abrir el contexto de un cliente hay que saber primero que se le
-- alcanza, que es justo lo que esta función responde.
--
-- Ya no hay ninguna columna `client_id` de la sesión. Lo que separa los dos paneles es
-- `platform_role`: una cuenta de plataforma no tiene membresías, y una de cliente no tiene
-- rol de plataforma.
create or replace function app.resolve_session(p_session_hash text)
returns table (
  user_id       uuid,
  platform_role text,
  email         text,
  name          text,
  memberships   jsonb
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
  /*
   * `coalesce(..., '[]')` y no NULL cuando no hay ninguna: quien construye el actor recorre la
   * lista sin comprobar si existe, y una cuenta sin membresías —la de plataforma, o una de
   * cliente a la que se le retiraron todas— es un caso normal, no un fallo.
   *
   * Se filtran aquí las membresías desactivadas y los clientes que no están activos. Es el
   * sitio correcto: si se filtraran en la aplicación, un cliente suspendido seguiría
   * apareciendo en el selector hasta que alguien se acordara de excluirlo en cada pantalla.
   */
  return query
    select u.id, u.platform_role::text, u.email, u.name,
           coalesce(
             (select jsonb_agg(jsonb_build_object(
                       'membership_id', m.id,
                       'client_id',     m.client_id,
                       'client_name',   c.name,
                       'event_id',      m.event_id,
                       'event_title',   e.title,
                       'event_slug',    e.slug,
                       'event_status',  e.status,
                       'plan_key',      e.plan_key,
                       'role',          m.role,
                       'label',         m.label
                     ) order by m.event_id nulls first, c.name, e.starts_at)
                from public.memberships m
                join public.clients c on c.id = m.client_id
                left join public.events e on e.id = m.event_id
               where m.user_id = u.id
                 and m.status <> 'disabled'
                 and c.status = 'active'),
             '[]'::jsonb
           )
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
  v_user_id uuid;
begin
  update public.sessions s
     set revoked_at = now()
   where s.token_hash = p_session_hash
     and s.revoked_at is null
  returning s.user_id into v_user_id;

  if v_user_id is null then
    return;
  end if;

  -- `client_id` va NULL, igual que en la línea de apertura que escribe `app.verify_otp()`:
  -- las dos entradas del par abrir/cerrar tienen que caer en la misma bitácora, y cerrar
  -- sesión no ocurre dentro de ningún cliente.
  --
  -- Aquí había un `select u.client_id ... from public.users u`, y era la pertenencia del
  -- modelo viejo: cuando pasó a ser filas de `memberships`, esa columna desapareció de
  -- `users` y esta consulta se quedó apuntando a la nada. No falló al reaplicar el archivo
  -- —plpgsql resuelve los nombres de columna en la PRIMERA ejecución, no al crear la
  -- función— así que el error solo aparecía al cerrar sesión de verdad. Es la misma trampa
  -- que el parámetro de salida ambiguo de `app.verify_otp()`, y el mismo motivo por el que
  -- una función de plpgsql no está probada hasta que se ha ejecutado una vez.
  --
  -- Y no se sustituye por una consulta a `memberships`: una identidad puede alcanzar varios
  -- clientes, así que ya no existe «el cliente de esta sesión» que anotar.
  insert into public.audit_log (client_id, user_id, action, entity_type, entity_id)
  values (null, v_user_id, 'auth.session.closed', 'user', v_user_id);
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
  access_code  text,
  -- A quién le toca llenar el contenido. La lista lo necesita para dos cosas: ofrecer
  -- «enviar enlace al cliente» solo donde tiene sentido, y distinguir un borrador que
  -- espera al cliente de uno que espera a la plataforma.
  client_fills_content boolean
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
           e.plan_key, e.access_code, e.client_fills_content
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
-- El tipo de retorno cambió al añadir `guest_group_id`, y `create or replace` no puede
-- cambiarlo: hay que soltar la función antes. El `if exists` lo hace idempotente.
drop function if exists app.resolve_invitation_access(text, text, inet);

create or replace function app.resolve_invitation_access(
  p_slug      text,
  p_code      text,
  p_client_ip inet default null
)
-- `guest_group_id` es la familia dueña del código, cuando el que se usó es de una. Hoy siempre
-- responde NULL: solo se resuelve el código del evento, que es el mismo para todos los invitados
-- y el único que existe en los planes sin panel. El plan Premium reparte un enlace por familia
-- con EL MISMO formato de URL —/<slug>/<código>—, así que cuando entre, lo único que cambia es
-- el WHERE de aquí abajo: ni la firma, ni el repositorio, ni la ruta.
returns table (
  event_id       uuid,
  client_id      uuid,
  guest_group_id uuid,
  rate_limited   boolean,
  -- El estado del evento cuando el código es correcto pero la invitación todavía no se
  -- puede ver. Es NULL cuando no hay ninguna fila que case: ahí no hay nada que contar.
  event_status   text,
  -- Cierto cuando la invitación existe, está publicada y su vigencia ya pasó.
  expired        boolean
)
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
  v_status       text;
  v_expired      boolean;
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

      return query select null::uuid, null::uuid, null::uuid, true, null::text, false;
      return;
    end if;
  end if;

  -- Sin filas, `select into` deja las variables en NULL, que es lo que se comprueba
  -- después. No hace falta manejar la excepción NO_DATA_FOUND.
  --
  -- El estado y la vigencia NO se filtran aquí, y esa es la diferencia con la versión
  -- anterior. Antes, un evento en borrador con su código correcto era indistinguible de un
  -- código inventado: los dos devolvían nada y el visitante acababa en la portada sin saber
  -- por qué. Ahora se busca por slug y código —que es la credencial— y el estado se
  -- devuelve para que la aplicación pueda explicarlo.
  --
  -- Eso no abre ningún oráculo: para llegar hasta aquí hay que acertar el código de seis
  -- caracteres del espacio de 32^6, y quien lo tiene es porque se lo dieron. Lo que se
  -- protege con el silencio es el slug, que sí se puede adivinar, y ese sigue sin decir
  -- nada por su cuenta.
  select e.id, e.client_id, e.status::text,
         e.expires_at is not null and e.expires_at <= now()
    into v_event_id, v_org_id, v_status, v_expired
  from public.events e
  where e.slug = p_slug
    and e.access_code = p_code
  limit 1;

  -- El intento cuenta como acertado cuando el código era el bueno, publicado o no: el
  -- límite por IP existe para frenar a quien prueba códigos, y quien tiene el correcto no
  -- está probando nada. Contarlo como fallo le gastaría el presupuesto a un invitado que
  -- entra antes de tiempo y le dejaría sin acceso el día del evento.
  insert into public.invitation_access_attempts (slug, client_ip, succeeded)
  values (p_slug, p_client_ip, v_event_id is not null);

  if v_event_id is null then
    return query select null::uuid, null::uuid, null::uuid, false, null::text, false;
    return;
  end if;

  if v_status <> 'published' or v_expired then
    -- Sin `event_id`: la aplicación no debe poder cargar el contenido de una invitación que
    -- todavía no se puede ver. Lo único que sale de aquí es en qué estado está.
    return query select null::uuid, null::uuid, null::uuid, false, v_status, v_expired;
    return;
  end if;

  return query select v_event_id, v_org_id, null::uuid, false, v_status, false;
end;
$$;

-- ── A quién avisar de lo que pasa en la plataforma ────────────────────────────
--
-- Devuelve el correo de cada cuenta de plataforma activa. Hoy la usa un solo aviso: el que
-- sale cuando un cliente termina de llenar su evento y lo manda a revisar.
--
-- Es SECURITY DEFINER porque `users` está sellada para el rol de la aplicación, y **no**
-- recibe sesión a propósito: quien dispara ese aviso es el cliente que guarda su contenido,
-- que no es de plataforma y no debe poder leer esa tabla. Lo único que sale de aquí son los
-- correos del equipo, que es el destinatario del mensaje — no llegan al navegador de nadie:
-- los consume el servidor para componer el envío.
--
-- Filtra por cuenta activa: a quien ya no trabaja aquí no se le siguen mandando avisos, y
-- ese es justo el caso en el que una lista escrita a mano se queda vieja.
create or replace function app.list_platform_notice_emails()
returns table (email text)
language sql
security definer
set search_path = pg_catalog, public
as $$
  select u.email
  from public.users u
  where u.platform_role is not null
    and u.status = 'active'
  order by u.email;
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
  -- La pertenencia ya no es una columna de la identidad: se comprueba que exista una
  -- membresía suya en este cliente, del alcance que sea. Retirarle el acceso a un visor
  -- corta sus sesiones igual que a un `owner`.
  select true into v_belongs
  from public.memberships m
  where m.user_id = p_user_id
    and m.client_id = p_client_id;

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
-- ── Un solo correo, y el teléfono al lado ─────────────────────────────────────
--
-- Antes recibía dos direcciones: la de contacto del cliente (opcional) y la del dueño
-- (obligatoria, la de inicio de sesión). En la práctica quien daba de alta escribía la misma
-- en las dos, o dejaba la primera vacía y luego no había a dónde mandar los avisos del
-- evento. Ahora es **una**: obligatoria, sirve para entrar y para notificar.
--
-- El teléfono se guarda y todavía no se usa para nada. Entra ya porque pedirlo cuesta un
-- campo y conseguirlo después cuesta una llamada: cuando WhatsApp esté integrado, los avisos
-- podrán salir por los dos lados sin volver a preguntarle nada a nadie.
create or replace function app.create_client(
  p_session_hash    text,
  p_name            text,
  p_slug            text,
  p_contact_email   text,
  p_contact_phone   text,
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
  -- El mismo correo hace de contacto del cliente y de identidad de su dueño. Se normaliza una
  -- vez: `users.email` tiene un único global y una mayúscula de más crearía una cuenta gemela.
  v_email       text := lower(trim(coalesce(p_contact_email, '')));
  v_phone       text := nullif(trim(coalesce(p_contact_phone, '')), '');
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

  -- El correo es obligatorio y se comprueba aquí y no solo en la aplicación: es la identidad
  -- con la que el dueño va a entrar, y un cliente sin ella nace inaccesible.
  if v_email = '' then
    return query select 'invalid_email'::text, null::uuid, null::uuid;
    return;
  end if;

  -- El único de `users.email` es global, así que este caso existe igualmente; lo que se
  -- elige aquí es contarlo. Callarlo dejaría a quien da de alta ante un fallo sin
  -- explicación y sin nada que hacer.
  if exists (select 1 from public.users u where u.email = v_email) then
    return query select 'email_taken'::text, null::uuid, null::uuid;
    return;
  end if;

  insert into public.clients (name, slug, contact_email, contact_phone)
  values (trim(p_name), v_slug, v_email, v_phone)
  returning id into v_client_id;

  -- La identidad y su membresía, en la misma transacción y en ese orden. Un cliente sin
  -- ninguna membresía no lo arregla nadie desde la aplicación, porque para entrar a un
  -- cliente hace falta alcanzarlo.
  --
  -- Nace como `invited` en los dos sitios: todavía no ha entrado nadie. La de la identidad se
  -- promueve sola en el primer acceso; la de la membresía es la que dice «tiene acceso
  -- concedido y no lo ha usado», y se promueve igual.
  insert into public.users (email, name, status)
  values (v_email, trim(p_owner_name), 'invited')
  returning id into v_user_id;

  -- El rol es `owner` con alcance cliente, y no es configurable: quien recibe un cliente
  -- nuevo tiene que poder administrarlo entero, incluido conceder acceso al resto.
  insert into public.memberships (user_id, client_id, event_id, role, status)
  values (v_user_id, v_client_id, null, 'owner', 'invited');

  -- Se registra EN EL CLIENTE recién creado y no como acción sin tenant: quien audite
  -- después el historial de ese cliente tiene que ver su propia alta como primera línea.
  insert into public.audit_log (client_id, user_id, action, entity_type, entity_id, metadata, ip)
  values (
    v_client_id, v_actor_id, 'client.created', 'client', v_client_id,
    jsonb_build_object('slug', v_slug, 'owner_email', v_email), p_ip
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
-- ── Conceder acceso: la identidad y su membresía, juntas ──────────────────────
--
-- Sustituye al INSERT sobre `users` que hacía la aplicación al invitar. Tiene que ser una
-- función porque una identidad no es un dato de tenant: el mismo correo puede alcanzar dos
-- clientes, así que no hay ningún `client_id` con el que RLS pudiera decidir quién tiene
-- derecho a crearla. Ver el comentario de los permisos de `users` en la sección 4.
--
-- Hace las dos cosas en una transacción: si el correo no existe crea la identidad, y le
-- añade la membresía. A medias dejaría una identidad que no alcanza nada —una cuenta capaz
-- de pedir código y entrar a ninguna parte—.
--
-- ## Lo que ya no hace falta contar
--
-- Antes, invitar un correo que ya existía en otro cliente respondía "ese correo ya tiene una
-- cuenta en la plataforma", y eso revelaba que la dirección existe. Era una fuga aceptada a
-- conciencia porque el único de `users.email` es global y el caso no se podía evitar.
--
-- Ahora ese caso no es un conflicto: se reutiliza la identidad y se le añade una membresía.
-- La respuesta es `granted` igual que si fuera nueva, así que quien concede no averigua nada
-- sobre en qué otros clientes está ese correo. La única respuesta que distingue algo es
-- `already_member`, y eso es información del propio cliente.
--
-- ## Quién puede conceder
--
-- Se exige membresía de alcance cliente con rol `owner` o `admin` en ESE cliente. Un `staff`
-- no concede accesos: quien puede repartir permisos puede darse a sí mismo cualquier otro, así
-- que es la frontera real dentro de un cliente.
--
-- Y no se puede conceder un rol por encima del propio —un `admin` no crea `owner`—, porque si
-- no bastaría con invitar a un `owner` de paja a un correo propio y entrar con él. Es el mismo
-- candado que aplica `domain/auth/user-management.ts`; está en los dos sitios a propósito: el
-- de la base de datos protege los datos de un camino mal escrito, el del dominio explica el
-- motivo en la interfaz. Ninguno cubre lo del otro.
create or replace function app.grant_membership(
  p_client_id      uuid,
  p_actor_user_id  uuid,
  p_event_id       uuid,
  p_email          text,
  p_role           text,
  p_label          text default null,
  p_name           text default null,
  p_phone          text default null
)
returns table (status text, user_id uuid, membership_id uuid)
language plpgsql
security definer
set search_path = pg_catalog, public
as $$
declare
  v_actor_role     text;
  v_email          text := lower(trim(p_email));
  v_user_id        uuid;
  v_membership_id  uuid;
  v_existing_status text;
  -- El orden de la jerarquía, escrito una vez. `viewer` es 0 y no -1: no es un `staff`
  -- degradado, es el suelo.
  v_rank           constant text[] := array['viewer', 'staff', 'admin', 'owner'];
begin
  -- Recibe el id de quien concede y no el hash de su sesión, al contrario que las funciones
  -- de plataforma. Es deliberado y sigue el precedente de `app.revoke_user_sessions()`: en el
  -- camino de un cliente el actor ya viene resuelto por `resolve_session` y `withTenant()` ya
  -- confía en su `clientId` para TODA consulta del panel, así que exigir aquí el token
  -- protegería un solo camino de los muchos que comparten esa confianza.
  --
  -- Lo que sí revalida es el rol, y contra la base de datos: que el actor tenga membresía
  -- ACTIVA de alcance cliente en este cliente y que llegue al rango que hace falta. Un actor
  -- construido a mano con un rol inflado no pasa de aquí.
  select m.role::text
    into v_actor_role
  from public.memberships m
  join public.users u on u.id = m.user_id
  where m.user_id = p_actor_user_id
    and m.client_id = p_client_id
    and m.event_id is null
    and m.status = 'active'
    and u.status <> 'disabled';

  -- Quién puede conceder: `owner` y `admin` siempre, y `staff` **solo** para dar un `viewer`
  -- sobre un evento.
  --
  -- La frontera de `admin` existe porque quien reparte permisos puede darse a sí mismo
  -- cualquier otro. Ese argumento no aplica a esta única combinación: un `viewer` es
  -- estrictamente más débil que un `staff`, y va sobre un evento que ese `staff` ya alcanza
  -- entero por su membresía de cliente. El techo de lo que puede repartir queda por debajo de
  -- lo que ya tiene, así que no hay escalada que impedir — y sí hay una persona real al
  -- teléfono con los novios que hasta ahora tenía que pedirle el favor al dueño.
  --
  -- La excepción se escribe nombrando las tres condiciones a la vez para que no se pueda
  -- ensanchar por descuido: un `staff` no da `staff`, no da nada de alcance cliente, y sigue
  -- sin poder dar `admin` —eso lo para `role_too_high`, justo debajo—. Y el actor sigue
  -- teniendo que ser de alcance CLIENTE por el `m.event_id is null` de la consulta de arriba:
  -- un `staff` asignado a una sola boda todavía no concede nada.
  if v_actor_role is null
     or (v_actor_role not in ('owner', 'admin')
         and not (v_actor_role = 'staff' and p_event_id is not null and p_role = 'viewer')) then
    return query select 'forbidden'::text, null::uuid, null::uuid;
    return;
  end if;

  if array_position(v_rank, p_role) is null
     or array_position(v_rank, p_role) > array_position(v_rank, v_actor_role) then
    return query select 'role_too_high'::text, null::uuid, null::uuid;
    return;
  end if;

  -- El rol y el alcance tienen que ser coherentes. El CHECK `memberships_role_scope` ya lo
  -- impide, pero lo haría abortando la transacción con un error de integridad en crudo: quien
  -- llama recibiría una excepción de Postgres en lugar de un estado que pueda traducir a un
  -- mensaje. Lo mismo que ocurre con el evento, justo debajo.
  --
  -- Ese CHECK sigue siendo la garantía; esto es solo la forma de contarlo. Por eso se
  -- comprueba aquí y no se sustituye por esto.
  if (p_role in ('owner', 'admin') and p_event_id is not null)
     or (p_role = 'viewer' and p_event_id is null) then
    return query select 'role_scope_mismatch'::text, null::uuid, null::uuid;
    return;
  end if;

  -- El evento tiene que ser de este cliente. La clave ajena compuesta de `memberships` ya lo
  -- impediría, pero fallaría como error de integridad en crudo en lugar de como respuesta.
  if p_event_id is not null
     and not exists (
       select 1 from public.events e
        where e.id = p_event_id and e.client_id = p_client_id
     ) then
    return query select 'event_not_found'::text, null::uuid, null::uuid;
    return;
  end if;

  select u.id into v_user_id from public.users u where u.email = v_email;

  if v_user_id is null then
    -- `name` y `phone` pueden venir NULL: un visor no tiene por qué dar ningún dato
    -- personal. Cómo se llama para este cliente es `label`, en la membresía.
    insert into public.users (email, name, phone, status)
    values (v_email, nullif(trim(coalesce(p_name, '')), ''), nullif(trim(coalesce(p_phone, '')), ''), 'invited')
    returning id into v_user_id;
  end if;

  begin
    insert into public.memberships (user_id, client_id, event_id, role, label, status)
    values (v_user_id, p_client_id, p_event_id, p_role::membership_role, nullif(trim(coalesce(p_label, '')), ''), 'invited')
    returning id into v_membership_id;
  exception
    -- Los dos únicos parciales de `memberships`. Que llegue aquí significa que ya tenía este
    -- mismo acceso, que es información del propio cliente y se puede contar.
    --
    -- Se mira en qué estado, porque «ya lo tiene» y «se lo quitaron» no son el mismo hecho. Una
    -- membresía `disabled` es un acceso RETIRADO: responder lo primero dejaría a quien concede
    -- sin entender por qué esa persona no entra y sin nada que hacer, porque el único parcial
    -- impide volver a insertar la fila y reintentar no arregla nada. Contarlo aparte es lo que
    -- permite a quien llama ofrecer la operación que de verdad corresponde, que es reactivar.
    --
    -- `is not distinct from` y no `=`: en el alcance cliente los dos lados son NULL, y con `=`
    -- esta consulta no encontraría nunca la fila con la que se acaba de chocar.
    when unique_violation then
      select m.id, m.status::text
        into v_membership_id, v_existing_status
      from public.memberships m
      where m.user_id = v_user_id
        and m.client_id = p_client_id
        and m.event_id is not distinct from p_event_id;

      return query select
        case when v_existing_status = 'disabled'
             then 'already_member_disabled'::text
             else 'already_member'::text
        end,
        v_user_id,
        v_membership_id;
      return;
  end;

  insert into public.audit_log (client_id, user_id, action, entity_type, entity_id, metadata)
  values (
    p_client_id, p_actor_user_id, 'membership.granted', 'user', v_user_id,
    jsonb_build_object('role', p_role, 'event_id', p_event_id, 'email', v_email)
  );

  return query select 'granted'::text, v_user_id, v_membership_id;
end;
$$;

-- ── El formulario público: la única escritura anónima del sistema ─────────────
--
-- Tiene que ser una función por la misma razón que `app.grant_membership()`: quien escribe aquí no
-- tiene sesión, ni cliente, ni nada con lo que RLS pudiera acotar la operación. Cuando RLS no
-- puede expresar la regla, la aplica una función — y así el rol de la aplicación se queda sin
-- ningún permiso sobre la tabla.
--
-- ## El límite se cuenta sobre las propias solicitudes
--
-- No hace falta una tabla de intentos como la de las invitaciones: aquí cada envío ES una fila, así
-- que contar las de esa IP en la última hora responde exactamente lo mismo con una tabla menos.
--
-- La consecuencia buscada es que un envío bloqueado NO se registra, así que no alarga su propio
-- castigo. Es lo correcto para un formulario de contacto: el tope existe para que nadie llene la
-- bandeja, no para castigar a quien pulsó dos veces.
--
-- ## Lo que no valida
--
-- No comprueba que el correo exista ni que el teléfono sea real. Es un formulario de contacto de
-- una web pública: exigirlo pediría una verificación que ahuyenta a quien de verdad quiere
-- escribir, y quien quiera meter basura la mete igual. Lo que sí acota es el volumen.
create or replace function app.submit_prospect(
  p_contact_name   text,
  p_contact_phone  text,
  p_contact_email  text default null,
  p_event_type_key text default null,
  p_event_date     date default null,
  p_guest_range    text default null,
  p_template_key   text default null,
  p_plan_key       text default null,
  p_message        text default null,
  p_ip             inet default null
)
returns table (status text, prospect_id uuid)
language plpgsql
security definer
set search_path = pg_catalog, public
as $$
declare
  -- Cinco por hora y por IP. Con una oficina detrás de una sola IP saliente eso son cinco
  -- solicitudes reales por hora, que es más de lo que este negocio recibe en un día.
  v_window constant interval := interval '1 hour';
  v_max    constant integer  := 5;
  v_count  integer;
  v_id     uuid;
begin
  if coalesce(trim(p_contact_name), '') = '' or coalesce(trim(p_contact_phone), '') = '' then
    return query select 'invalid'::text, null::uuid;
    return;
  end if;

  if p_ip is not null then
    select count(*) into v_count
      from public.prospects p
     where p.submitted_ip = p_ip
       and p.created_at > now() - v_window;

    if v_count >= v_max then
      return query select 'rate_limited'::text, null::uuid;
      return;
    end if;
  end if;

  insert into public.prospects
    (contact_name, contact_phone, contact_email, event_type_key, event_date,
     guest_range, template_key, plan_key, message, submitted_ip)
  values
    (trim(p_contact_name),
     trim(p_contact_phone),
     nullif(trim(coalesce(p_contact_email, '')), ''),
     nullif(trim(coalesce(p_event_type_key, '')), ''),
     p_event_date,
     nullif(trim(coalesce(p_guest_range, '')), ''),
     nullif(trim(coalesce(p_template_key, '')), ''),
     nullif(trim(coalesce(p_plan_key, '')), ''),
     nullif(trim(coalesce(p_message, '')), ''),
     p_ip)
  returning id into v_id;

  return query select 'received'::text, v_id;
end;
$$;

-- ── La bandeja, para el panel de plataforma ───────────────────────────────────
--
-- Recibe el hash del token como todos los listados globales: con un id de usuario bastaría con que
-- un camino nuevo construyera un actor a mano para leer la lista entera de contactos.
--
-- Trae calculado lo que la bandeja necesita ordenar y que no se guarda en ninguna columna: cuándo
-- fue el último contacto —el `MAX` de la bitácora— y cuántas anotaciones hay. Guardarlos
-- denormalizados sería una segunda verdad que algún día contradiría a la bitácora.
create or replace function app.list_prospects_for_platform(p_session_hash text)
returns table (
  id              uuid,
  contact_name    text,
  contact_email   text,
  contact_phone   text,
  event_type_key  text,
  event_date      date,
  guest_range     text,
  template_key    text,
  plan_key        text,
  message         text,
  status          text,
  next_follow_up_at timestamptz,
  lost_reason     text,
  client_id       uuid,
  client_name     text,
  created_at      timestamptz,
  last_touch_at   timestamptz,
  touch_count     integer
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
    select p.id, p.contact_name, p.contact_email, p.contact_phone, p.event_type_key,
           p.event_date, p.guest_range, p.template_key, p.plan_key, p.message,
           p.status::text, p.next_follow_up_at, p.lost_reason, p.client_id, c.name,
           p.created_at,
           (select max(t.created_at) from public.prospect_touches t where t.prospect_id = p.id),
           (select count(*)::integer from public.prospect_touches t where t.prospect_id = p.id)
      from public.prospects p
      left join public.clients c on c.id = p.client_id
     order by p.created_at desc;
end;
$$;

-- ── Anotar un contacto en la bitácora ─────────────────────────────────────────
--
-- Escribe la anotación y, si se indica, mueve el estado y la próxima fecha de seguimiento en la
-- MISMA transacción. Van juntos porque son un solo acto —«le escribí y quedamos en el viernes»— y
-- separarlos dejaría bitácoras sin estado o estados sin explicación.
create or replace function app.record_prospect_touch(
  p_session_hash text,
  p_prospect_id  uuid,
  p_channel      text,
  p_note         text,
  p_status       text default null,
  p_next_follow_up_at timestamptz default null,
  p_lost_reason  text default null
)
returns text
language plpgsql
security definer
set search_path = pg_catalog, public
as $$
declare
  v_actor_id uuid := app.platform_actor(p_session_hash);
begin
  if v_actor_id is null then
    return 'forbidden';
  end if;

  if not exists (select 1 from public.prospects where id = p_prospect_id) then
    return 'not_found';
  end if;

  insert into public.prospect_touches (prospect_id, channel, note, created_by)
  values (p_prospect_id, p_channel::touch_channel, trim(p_note), v_actor_id);

  update public.prospects
     set status = coalesce(p_status::prospect_status, status),
         next_follow_up_at = p_next_follow_up_at,
         lost_reason = case
                         when coalesce(p_status, '') = 'lost'
                         then nullif(trim(coalesce(p_lost_reason, '')), '')
                         else null
                       end
   where id = p_prospect_id;

  return 'recorded';
end;
$$;

-- ── Cuántas solicitudes piden atención ────────────────────────────────────────
--
-- Alimenta el contador del menú, así que se ejecuta en CADA carga de cualquier pantalla de
-- `/admin`. Por eso es una función aparte y no un `length` sobre el listado: aquel trae todas las
-- filas con su bitácora agregada, y pagar eso para pintar un número sería el tipo de coste que se
-- acumula sin que nadie lo note.
--
-- Cuenta lo mismo que la bandeja destaca: las nuevas y las que ya vencieron. Una en conversación y
-- al día no pide nada hoy, así que sumarla haría que el contador nunca bajara a cero — y un
-- contador que nunca llega a cero deja de mirarse.
create or replace function app.count_pending_prospects(p_session_hash text)
returns integer
language sql
stable
security definer
set search_path = pg_catalog, public
as $$
  select case
           when app.platform_actor(p_session_hash) is null then 0
           else (
             select count(*)::integer
               from public.prospects p
              where p.status not in ('won', 'lost')
                and (p.status = 'new' or (p.next_follow_up_at is not null
                                          and p.next_follow_up_at <= now()))
           )
         end;
$$;

-- ── La bitácora de un prospecto ──────────────────────────────────────────────
--
-- Va aparte del listado y no incrustada en él porque la bandeja lista decenas de solicitudes y solo
-- se abren una a una: traer todas las anotaciones de todas en cada carga sería pagar por lo que no
-- se mira. El listado se conforma con el conteo y la fecha del último contacto.
create or replace function app.list_prospect_touches(p_session_hash text, p_prospect_id uuid)
returns table (
  id           uuid,
  channel      text,
  note         text,
  created_at   timestamptz,
  author_email text
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
    select t.id, t.channel::text, t.note, t.created_at, u.email
      from public.prospect_touches t
      left join public.users u on u.id = t.created_by
     where t.prospect_id = p_prospect_id
     order by t.created_at desc;
end;
$$;

-- ── Vincular un prospecto con el cliente en que se convirtió ──────────────────
--
-- No crea el cliente: eso lo hace `app.create_client()`, que ya existía y ya funciona. Esto es la
-- otra mitad de la conversión, y va aparte para que sirva también al caso real de que el cliente
-- se diera de alta ANTES de que alguien se acordara del prospecto.
--
-- Mueve el estado a `won` en la misma sentencia. Un prospecto vinculado a un cliente y todavía en
-- `contacted` sería una contradicción que la bandeja tendría que saber interpretar.
create or replace function app.link_prospect_to_client(
  p_session_hash text,
  p_prospect_id  uuid,
  p_client_id    uuid
)
returns text
language plpgsql
security definer
set search_path = pg_catalog, public
as $$
declare
  v_actor_id uuid := app.platform_actor(p_session_hash);
begin
  if v_actor_id is null then
    return 'forbidden';
  end if;

  if not exists (select 1 from public.clients where id = p_client_id) then
    return 'client_not_found';
  end if;

  update public.prospects
     set client_id = p_client_id,
         status = 'won',
         lost_reason = null
   where id = p_prospect_id;

  if not found then
    return 'not_found';
  end if;

  insert into public.audit_log (client_id, user_id, action, entity_type, entity_id, metadata)
  values (
    p_client_id, v_actor_id, 'prospect.converted', 'client', p_client_id,
    jsonb_build_object('prospect_id', p_prospect_id)
  );

  return 'linked';
end;
$$;

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
-- El revoke va en UNA sentencia sobre el esquema entero, y no enumerado función por
-- función como estuvo. El motivo es un fallo que ya ocurrió: la lista enumerada se
-- quedó vieja en cuanto alguien añadió funciones nuevas, y esas nacieron ejecutables por
-- PUBLIC mientras el comentario de aquí arriba afirmaba lo contrario. Una lista que hay
-- que acordarse de ampliar para que la seguridad siga siendo cierta es una lista que
-- algún día no se amplía.
--
-- Con `all functions in schema app` no hay nada que mantener: cualquier función nueva
-- nace sin EXECUTE para PUBLIC, y si además nadie se acuerda de concederle permiso a la
-- aplicación, el fallo es «permission denied» al primer uso en desarrollo. Ruidoso y en
-- el momento correcto, que es lo contrario de lo que pasaba antes.
--
-- Los GRANT de abajo sí siguen enumerados, y eso no es incoherencia: son la lista de
-- permitidos y tienen que poder auditarse de un vistazo. Lo que se quita es la lista de
-- prohibidos, que es la que tiene que ser exhaustiva para servir de algo.
revoke all on all functions in schema app from public;

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
grant execute on function app.current_event_id() to mievento_app;
grant execute on function app.submit_prospect(text, text, text, text, date, text, text, text, text, inet) to mievento_app;
grant execute on function app.list_prospects_for_platform(text) to mievento_app;
grant execute on function app.record_prospect_touch(text, uuid, text, text, text, timestamptz, text) to mievento_app;
grant execute on function app.link_prospect_to_client(text, uuid, uuid) to mievento_app;
grant execute on function app.list_prospect_touches(text, uuid) to mievento_app;
grant execute on function app.count_pending_prospects(text) to mievento_app;
grant execute on function app.grant_membership(uuid, uuid, uuid, text, text, text, text, text) to mievento_app;
grant execute on function app.list_platform_notice_emails() to mievento_app;


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
