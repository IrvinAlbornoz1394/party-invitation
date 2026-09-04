# Acceso: identidad y membresías

Estado: acordado el 2026-08-27. **La base de datos ya está en este modelo**; la interfaz todavía
no. Concretamente:

| Parte | Estado |
| ----- | ------ |
| `memberships`, enum, CHECK de alcance, únicos parciales | hecho |
| RLS con la dimensión del evento, `app.current_event_id()` | hecho |
| `app.grant_membership`, `app.resolve_session` con membresías | hecho |
| Invariantes en `npm run db:check` | hecho |
| Selector de `/panel` y panel por evento en `/panel/eventos/<id>` | hecho |
| Menú del evento por plan × rol | hecho |
| Pantalla de contenido, en todos los planes | hecho |
| Alta de visores desde el panel del cliente | hecho |

El modelo está cerrado: un visor se da de alta desde **Accesos**, dentro del panel de su evento
(`/panel/eventos/<id>/accesos`), capturando solo su correo y, si se quiere, una etiqueta. Entra
pidiendo su código como todo el mundo, aterriza directo en ese evento cuando es el único que
alcanza, y ve el selector cuando son dos o más.

Con ese cambio, el 2026-09-04, los roles del cliente se redujeron a dos: **dueño** —el único que
gestiona el equipo— y **colaborador** (`staff`), que ve el resumen y todos los eventos y puede dar
acceso a un evento suyo. `admin` sigue existiendo en el enum y en las filas antiguas, pero no se
puede asignar: la frontera de la gestión de personas subió a `owner` y con ella el rol intermedio
se quedó sin nada que significar.

Dos limitaciones conocidas, ninguna descuidada:

- **Una identidad con dos membresías de alcance cliente recibe 404** en `/panel/equipo`,
  `/panel/ajustes` y `/panel/inicio`. Esas rutas no llevan el cliente en la URL, así que elegir
  uno «por defecto» significaría enseñarle el equipo de un cliente a quien pidió el del otro. El
  arreglo es llevar el cliente en la URL, como ya lo llevan las de evento. No ocurre con los datos
  de hoy: cada identidad se da de alta en un cliente.
- **El menú del evento enseña dos secciones**: Resumen y Contenido. Las de gestión —invitados,
  confirmaciones, mesas, recordatorios— y la de diseño están declaradas en `SECTIONS` con
  `pending: true` y no se pintan, porque sus pantallas no existen. Activarlas es quitar esa
  palabra. Un menú con enlaces a 404 se lee como un panel roto, no como el límite de un plan.
- **Las fotos se pegan como URL**, no se suben: no hay almacenamiento propio todavía. Por eso el
  guardado de la galería actualiza por `id` en vez de borrar y reinsertar — así `storage_key`,
  `width` y `height` sobrevivirán al día que la subida exista.


## El diagnóstico

`users` mezclaba dos cosas que no son la misma: **quién eres** (correo, teléfono, canal de OTP)
y **qué puedes ver** (`client_id`, `role`). Tres restricciones del esquema lo dejaban por
escrito:

- `users.client_id` era **una columna**, así que una cuenta pertenecía a un cliente y a uno solo.
- `users.email` es `UNIQUE` global.
- El CHECK `users_client_xor_platform` obligaba a elegir: o de un cliente, o de plataforma.

Mientras el cliente fue una familia con su boda, la mezcla no molestó. Deja de servir en cuanto
el cliente es un organizador de eventos, y todos los casos que aparecen entonces fallan por el
mismo motivo:

| Lo que hace falta                                              | Por qué no se podía                            |
| -------------------------------------------------------------- | ---------------------------------------------- |
| Que los novios vean su boda, sin ver las otras del organizador | no había dónde poner el alcance «un evento»    |
| El mismo correo en dos clientes distintos                      | la pertenencia era columna de la identidad     |
| Que el sistema sepa a qué evento entra alguien                  | no había lista de pertenencias que consultar   |

No falta una columna. Falta separar las dos cosas.


## Identidad: `users`

`users` se queda como **identidad pura**: `email`, `phone`, `name`, `preferred_otp_channel`,
`status`, `platform_role`. Sin `client_id` y sin `role`.

El `UNIQUE` del correo pasa a ser correcto en vez de un estorbo: una persona, una identidad, un
sitio donde pedir el código. Lo que antes obligaba a elegir un cliente ahora no dice nada sobre
permisos, y por eso el mismo correo puede ser dueño de un cliente y visor del evento de otro sin
que nada se rompa — que es el caso de quien contrató sus XV hace años y hoy aparece en la boda
que organiza un cliente nuevo.

`name` es **nullable**. Era `NOT NULL`, y un visor no tiene por qué dar su nombre: con el correo
basta para pedir el código, y pedir datos personales que nadie va a leer es fricción a cambio de
nada. Donde la interfaz muestre un nombre y no haya, muestra el correo.

`platform_role` se queda donde está. Podría modelarse como una membresía más, pero mantenerlo
como columna deja intacta la propiedad que protege `/admin`: el privilegio de plataforma no
vive en el mismo espacio de valores que el de tenant, así que ninguna comprobación de rol dentro
de un cliente puede concederlo por una comparación mal escrita (ver «Los dos paneles» en
`docs/BACKEND.md`). El CHECK `users_client_xor_platform` desaparece con `client_id`; lo sustituye
el invariante **una cuenta de plataforma no tiene membresías**.


## Pertenencia: `memberships`

```
memberships
  id
  user_id      → users(id)                    ON DELETE cascade
  client_id    → clients(id)                  NOT NULL
  event_id                                     NULL = alcance cliente
  role         membership_role
  label        text NULL                       "Los novios", "Mamá de la quinceañera"
  status       user_status                      invited | active | disabled
  created_at / updated_at

  FOREIGN KEY (event_id, client_id) → events(id, client_id)
```

La clave ajena compuesta no es adorno: es el mismo recurso que ya usan todas las tablas hijas
para que el tenant duplicado no pueda contradecir al del evento. Una membresía de alcance evento
no puede apuntar a un evento de otro cliente.

**Un evento puede tener N usuarios** porque la pertenencia es una fila y no una columna. Eso
responde la pregunta que originó todo esto.

### Los dos alcances y los cuatro roles

| Rol      | Alcance permitido | Qué alcanza                                            |
| -------- | ----------------- | ------------------------------------------------------ |
| `owner`  | solo cliente      | todo el cliente, incluido dar de alta y bajar cuentas  |
| `admin`  | solo cliente      | todo el cliente, sin tocar al `owner`                  |
| `staff`  | cualquiera        | todo el cliente, **o** un solo evento                  |
| `viewer` | solo evento       | un solo evento, **sin escribir nada**                  |

Que `staff` admita los dos alcances es lo que da gratis el caso de la asistente del organizador
que solo debe tocar una boda. «Visor» y «asistente de un solo evento» son la misma forma con
distinto rol, y por eso no hacen falta dos conceptos.

Ese cuadro es el CHECK `memberships_role_scope`, no una convención:
`role IN ('owner','admin') → event_id IS NULL` y `role = 'viewer' → event_id IS NOT NULL`. Una
regla de negocio que la base de datos no impone acaba incumplida por el primer camino que se
escriba sin leer este documento.

`app.grant_membership()` comprueba lo mismo **antes** de insertar, y no para sustituir al CHECK
sino para poder contarlo: si dejara saltar al CHECK, quien llama recibiría un error de integridad
en crudo en vez de un estado que pueda traducir a un mensaje.

### El `label` va en la membresía, no en la identidad

La misma persona es «los novios» en un evento y otra cosa en otro. El nombre de la relación
pertenece a la relación. Es también lo que permite que el visor no tenga nombre propio: el
cliente escribe cómo se llama para él, y eso es lo que ve en su pantalla de accesos.

### Únicos, con el detalle que muerde

`UNIQUE (user_id, client_id, event_id)` **no sirve**: en Postgres los NULL son distintos entre
sí, así que dos membresías de alcance cliente para la misma persona pasarían el único sin
protestar. Van dos índices parciales:

```sql
CREATE UNIQUE INDEX ON memberships (user_id, client_id) WHERE event_id IS NULL;
CREATE UNIQUE INDEX ON memberships (user_id, event_id) WHERE event_id IS NOT NULL;
```


## La entrada: se deriva de las membresías

Al verificar el código, el sistema resuelve la identidad y **lista sus membresías activas**. Lo
que pasa después sale de contarlas:

| Membresías | Qué ve                                                                    |
| ---------- | ------------------------------------------------------------------------- |
| 0          | pantalla de cortesía: la cuenta existe pero no alcanza nada. No debería pasar |
| 1          | entra directo a su destino, sin preguntar nada                            |
| N          | selector: tarjetas pequeñas, centradas, **sin menú**                      |

El selector es una sola pantalla que resuelve dos casos que parecían distintos: el cliente con
dos eventos y la identidad que es dueña en un sitio y visora en otro. Cuando las membresías
cruzan clientes, la tarjeta lleva también el nombre del cliente —«Boda de Ana y Luis · Bodas
Mérida»— porque sin eso dos bodas de nombres parecidos son indistinguibles.

### La URL de login con parámetros se descarta

La tentación es entregarle al visor un enlace tipo `/acceso?evento=<id>` para que el sistema sepa
a dónde llevarlo. No hace falta: si hay lista de membresías, el sistema ya sabe a dónde puede ir
esa persona, y lo que corresponde es preguntárselo. Y además tiene tres costes:

- un enlace se reenvía por WhatsApp y acaba en manos de quien no toca;
- expone identificadores de eventos en algo que la gente comparte;
- se rompe en cuanto alguien lo pierde o lo guarda en favoritos, y entonces no hay puerta.

El enlace **sí sirve como invitación**: «te agregaron al evento X, entra aquí», con el correo
prellenado y el destino recordado para después del OTP. Azúcar de onboarding, no credencial. La
regla es que el sistema funcione igual si el enlace se pierde.

Tampoco se avisa en la pantalla de acceso que un correo es de visor y necesita otra URL. Eso
convertiría `/acceso` en un oráculo para averiguar qué correos existen y de qué clase son, que es
justo lo que ya se evita con los códigos de invitación y con los límites de OTP. Después de
verificar el código la persona ya demostró que el correo es suyo, y ahí el selector se lo dice
todo sin filtrar nada a quien no entró.

### El contexto activo va en la URL

`/panel` es el selector. Todo lo demás vive bajo `/panel/eventos/<id>/…`, y cada página autoriza
la membresía para ese id.

La alternativa —guardar «el evento actual» en la sesión— se descarta por el mismo motivo por el
que se eliminó `sessions.active_client_id` al quitar la impersonación: un contexto mutable que
vive en la sesión se queda pegado. Con dos eventos abiertos en dos pestañas, uno de los dos
trabaja sobre el contexto del otro. En la URL el contexto es explícito, se puede compartir, se
puede guardar en favoritos y no existe fuera de la petición que lo nombra.


## El panel se arma de plan × rol

El menú no se decide por plan ni por rol: por los dos. La misma función que hoy construye la
navegación del cliente (`client-navigation.ts`) recibe el plan del evento y el rol de la
membresía, y no hay una sola rama `if (plan === 'esencial')` repartida por la aplicación.

| Sección           | Esencial | Plus | Premium | `viewer`        |
| ----------------- | :------: | :--: | :-----: | --------------- |
| Contenido         |    ✓     |  ✓   |    ✓    | —               |
| Diseño (variantes, orden) |  —  |  ✓   |    ✓    | —               |
| Invitados         |    —     |  —   |    ✓    | solo lectura    |
| Confirmaciones    |    —     |  —   |    ✓    | solo lectura    |
| Mesas             |    —     |  —   |    ✓    | solo lectura    |
| Recordatorios     |    —     |  —   |    ✓    | —               |
| Equipo y accesos  |    ✓     |  ✓   |    ✓    | —               |
| Ajustes del evento|    ✓     |  ✓   |    ✓    | —               |

Un visor no ve facturación, ni el plan, ni los otros eventos del cliente, ni quién más tiene
acceso. Y **su lectura se impone en la base de datos**, no en el menú: un rol que solo mira es
uno que no puede escribir aunque alguien mande el POST a mano.

### Todo plan tiene panel

Cambio de decisión del 2026-08-27. Antes Premium era el único con panel, con el argumento de que
un panel sin lista de invitados está vacío. Sigue siendo verdad para la *gestión*, y es falso
para el **contenido**: en cualquier plan hay fotos, textos, cronograma y padrinos que capturar, y
hoy los captura la plataforma a mano desde una conversación de WhatsApp.

Así que todo cliente entra a su panel, y en Esencial ese panel es **una sola opción**:
«Contenido». No es una excepción en el código —es la matriz de arriba con una sola casilla— y
tiene dos efectos que valen por sí solos: le quita a la plataforma el trabajo de capturar
contenido ajeno, y convierte `/panel` en un destino válido para todos los CTA de la landing, que
hoy llevan ahí a gente que no tiene dónde entrar.

La captura de contenido está pensada para escritorio: formulario a la izquierda en dos tercios,
vista previa del teléfono a la derecha en uno. En móvil no se bloquea —en este mercado mucha
gente solo tiene teléfono— sino que se degrada a consulta, con el aviso de que para editar
cómodo conviene una computadora.


## Lo que cuesta

Es la parte que hay que mirar antes de empezar, porque toca lo único del sistema que hoy está
verificado y funcionando.

**RLS pasa de comparar una columna a resolver una pertenencia.** Hoy toda política compara
`client_id` contra `app.current_client_id()`. El contexto tiene que ganar una segunda dimensión,
porque si un visor abriera el contexto de su cliente vería todos los eventos de ese cliente:

```sql
-- tablas hijas de evento
client_id = app.current_client_id()
AND (app.current_event_id() IS NULL OR event_id = app.current_event_id())
```

Sigue **fallando cerrado**: sin contexto las dos funciones devuelven NULL y ninguna política se
cumple. Y sigue siendo de alcance de transacción, por la misma razón de siempre — una variable de
sesión se queda pegada a la conexión del pool y la siguiente petición hereda el contexto ajeno.
`withTenant(clientId, fn)` pasa a recibir la membresía completa.

**Se pierde una propiedad que hoy es gratis.** Que `users.client_id` sea NULL en las cuentas de
plataforma es lo que hace que **ninguna política las alcance jamás** (`NULL = cualquier cosa`
nunca es TRUE). Al salir `client_id` de `users`, esa garantía desaparece y hay que reconstruirla a
mano: la política de `users` debe exigir que la identidad comparta membresía con el contexto
activo, y negar la lectura cuando hay un evento activo. Es el punto más delicado de la migración
y el primero que debería verificar `npm run db:check`.

**`resolve_session` ya no basta.** Devuelve la identidad; las membresías salen de una función
nueva, `app.list_memberships(hash)`, que recibe el **hash del token** y no un id de usuario, como
todas las demás funciones del plano de auth. Con un id, bastaría con que un camino nuevo
construyera un actor a mano para saltarse la comprobación.

**Los tipos siguen siendo la frontera.** `requireClientActor()` deja de devolver `clientId` y
devuelve la identidad con sus membresías; aparece `requireEventActor(eventId)`, que devuelve el
alcance, el rol y el plan de esa membresía o corta la petición. Es la misma propiedad de hoy —usar
el actor equivocado no compila— extendida un nivel.

**Una fuga aceptada deja de existir.** Hoy invitar un correo que ya existe en otro cliente
responde «ese correo ya tiene una cuenta en la plataforma», y eso revela que la dirección existe.
Con membresías ese caso ya no es un conflicto: se crea una membresía y no hace falta contar nada.

### Invariantes para `db:check`

1. Una cuenta con `platform_role` no tiene ninguna membresía.
2. Ninguna membresía `viewer` tiene `event_id` NULL, y ninguna `owner`/`admin` lo tiene puesto.
3. `memberships` no tiene ninguna fila cuyo `event_id` pertenezca a otro `client_id`.
4. Con contexto de evento activo, `clients` y `users` no devuelven filas.
5. Un `viewer` no tiene ningún `INSERT`, `UPDATE` ni `DELETE` que pase.


## Cómo quedó repartido en el código

| Pieza | Dónde |
| ----- | ----- |
| Identidad y membresías como tipos | `domain/auth/actor.ts` |
| `TenantScope` — qué filas, frente al rol — qué se puede hacer | `domain/auth/actor.ts` |
| Fronteras por pantalla | `lib/auth/current-session.ts` |
| Contexto de las dos dimensiones | `infrastructure/db/tenant.ts` |
| El selector | `app/panel/(select)/page.tsx` |
| El panel de un evento | `app/panel/(event)/eventos/[id]/` |
| La matriz de plan × rol | `components/dashboard/navigation/event-navigation.ts` |
| Qué incluye un plan, leído del catálogo | `application/catalog/load-plan-features.ts` |
| El contenido editable y sus tres listas | `domain/events/event-content-draft.ts`, `event-collections.ts` |
| La vista previa, con el renderizador real | `app/panel/(preview)/eventos/[id]/vista/` |

Tres decisiones del reparto que conviene no deshacer sin leer el motivo:

**`ClientAccount` frente a `ClientActor`.** La cuenta es quién eres y qué alcanzas; el actor es
con qué cliente se está trabajando en esta petición. Sin la separación habría que elegir un
cliente al construir la sesión, que es exactamente el estado mutable que se eliminó al quitar la
impersonación.

**`TenantScope` frente al rol.** El alcance responde *qué filas*; el rol responde *qué se puede
hacer con ellas*. Un visor tiene lo primero y no lo segundo, y por eso `scopeFromMembership()`
devuelve `null` para él: `ClientActor.role` es `UserRole`, que no incluye `viewer`, así que no
existe forma de construir un actor de escritura para un visor ni por descuido.

**Cuatro grupos de rutas bajo `/panel`.** `(select)` es el selector, sin menú porque el menú
necesitaría el contexto que aún no se ha elegido; `(authenticated)` son las pantallas del cliente
entero; `(event)` son las del evento; `(preview)` es la invitación dentro de un marco, sin
armazón, para que el editor pueda enseñarla al lado del formulario. El grupo aparte para el evento no es orden estético: el
layout de `(authenticated)` exige alcance de cliente, y un visor no lo tiene — si las pantallas de
evento vivieran ahí, los novios verían su boda en el selector y al pulsarla saldrían rebotados.


## Orden de implementación

Nada de esto se migra de forma incremental. Sigue en pie la condición de
«Una sola migración, mientras no haya producción» (`docs/BACKEND.md`): **no hay base desplegada
que conservar**, la de desarrollo es de pruebas, y el cambio entra reescribiendo
`0000_initial_schema.sql` y corriendo `npm run db:fresh`. Por eso no hay paso de conversión de
datos, ni migración de vuelta, ni `0001`: `memberships` nace ya con su forma final y el seed la
puebla desde cero. La base local se puede borrar cuando haga falta.

1. `memberships`, el enum `membership_role`, los CHECK y los índices parciales, dentro de la
   migración única. Salen de `users` la columna `client_id`, la columna `role` y el CHECK
   `users_client_xor_platform`.
2. RLS con la segunda dimensión, `app.list_memberships`, y `db:check` con los cinco invariantes.
3. El selector de `/panel` y el traslado de las pantallas a `/panel/eventos/<id>/…`.
4. El menú por plan × rol, y la pantalla de contenido para Esencial.
5. Los visores: alta desde el panel del cliente, con su `label` y su aviso por correo. A esas
   alturas era dar de alta filas en una tabla que ya funcionaba — y al hacerlo salió a la luz que
   `memberships.status` nacía `invited` y **no la promovía nadie**, así que el primer candado de
   `app.grant_membership()` (que exige al actor `status = 'active'`) rechazaba a cualquier dueño
   recién dado de alta. Lo arregla `app.verify_otp`, que ahora promueve la membresía junto con la
   identidad.


## Decisiones abiertas

- **Quién puede crear visores.** Resuelto a medias el 2026-09-04. Un `staff` de **alcance
  cliente** sí: es la persona que está al teléfono con los novios, y lo que reparte —un visor— es
  estrictamente más débil que lo que ya tiene sobre un evento que ya alcanza entero, así que no
  hay escalada posible. Un `staff` de **alcance evento** sigue sin poder, y no por prudencia: la
  política RLS de `users` cierra la tabla en contexto de evento, así que ni siquiera podría leer
  la lista de accesos con los correos dentro. Abrirlo exigiría una función `SECURITY DEFINER` que
  los devuelva, o renunciar a enseñar el correo — que es la única columna que la pantalla tiene.
- **Tope de visores por evento.** Sin límite hoy. Es un vector de abuso barato (invitar cien
  correos para molestar) y probablemente merezca un tope por plan.
- **Si el visor recibe recordatorios o resúmenes.** Un correo semanal con el avance de
  confirmaciones es justo lo que los novios querrían, y es también correo que la plataforma manda
  a alguien que nunca contrató nada.
- **Qué pasa con las membresías al archivar un evento.** Lo natural es que dejen de alcanzarlo sin
  borrarse, igual que las cuentas se desactivan en vez de eliminarse.
