# Alta de un evento: el asistente por pasos

Estado: **acordado el 2026-08-28, sin implementar.**

Hoy los eventos solo entran por `db:seed`. No hay ningún caso de uso ni pantalla que cree uno, así
que la cadena del negocio se corta justo después de dar de alta al cliente: se puede vender y no
se puede entregar. Este documento describe cómo se cierra ese hueco.


## Por qué un asistente y no un formulario

Un evento necesita catorce datos obligatorios, y no los sabe la misma persona ni al mismo tiempo:

- El **admin** sabe qué se vendió: el plan, la plantilla, el tema.
- El **cliente** sabe qué se celebra: los nombres, la historia, las sedes, las fotos.
- Y algunos los sabe el admin **preguntando** al cliente por teléfono: la fecha, la ciudad.

Un formulario único obligaría a tener las tres cosas a la vez para poder guardar, es decir a
esperar a que el cliente conteste antes de registrar nada. El asistente reparte la captura en el
orden en que la información existe de verdad, y deja el evento visible y retomable en cada corte.


## Los pasos

| | Quién | Qué se decide |
| --- | --- | --- |
| Modal | admin | Cliente y nombre del evento. Aquí nace la fila |
| 1 | admin | Tipo de evento, festejados, fecha y hora, ciudad |
| 2 | admin | **Plan y plantilla**, en este orden. Y el tema |
| 3 | cliente | Completa el contenido y **confirma** |
| 4 | admin | Publicar |

### Por qué el plan va antes que la plantilla

Es la única dependencia dura del orden, y sale del catálogo:

- `template_plans` dice qué plantillas admite cada plan. Elegir plantilla primero permitiría
  quedarse con una que el plan contratado no incluye, y el error aparecería al llegar al plan —
  cuando ya se le enseñó al cliente una plantilla que no puede tener.
- `component_variants.min_plan_rank` dice qué variantes alcanza cada plan. Sin el plan fijado, el
  selector de plantilla no puede ni enseñar bien cómo va a quedar.

Van en el mismo paso porque son una sola decisión con dos partes: **qué compró y con qué se ve**.
Separarlas en dos pasos añadiría un clic sin añadir ninguna decisión.

Y el orden importa además para el paso 3: el plan decide qué secciones tiene la invitación, o sea
**qué se le va a pedir al cliente**. Con el plan sin elegir, el formulario del cliente no sabe si
pedirle mesa de regalos o no.


## El modelo

### Un evento tiene que poder existir a medias

Hoy no puede. Estas columnas de `events` son `NOT NULL` y ninguna se conoce en el modal:
`event_type_key`, `plan_key`, `template_id`, `theme_id`, `celebrant_name`, `starts_at`, `slug`,
`access_code`.

Se vuelven **nullable**, y la completitud se exige donde de verdad importa: al publicar. Va como
CHECK y no como validación de la aplicación, porque es el invariante que sostiene todo lo demás —
una invitación publicada a la que le falte la plantilla no se puede renderizar, y ese fallo lo
verían los invitados:

```sql
constraint events_published_is_complete check (
  status <> 'published' or (
    event_type_key is not null and plan_key is not null and template_id is not null
    and theme_id is not null and celebrant_name is not null and starts_at is not null
    and slug is not null and access_code is not null
  )
)
```

La alternativa —crear la fila con valores de relleno: una fecha inventada, el plan más barato, la
plantilla por defecto— se descarta porque son datos que **mienten**. Un evento con fecha
`2000-01-01` es indistinguible de uno mal capturado, y el día que alguien liste eventos por fecha
saldrán todos los incompletos mezclados.

`slug` y `access_code` se generan al pasar del paso 1, cuando ya hay nombre del que derivar el
slug. El código es una credencial: CSPRNG, ni secuencial ni derivable del nombre.

### El avance del montaje no cabe en `status`

`events.status` es `draft | published | archived` y responde **«¿está viva la invitación?»**. El
avance del asistente responde otra cosa: **«¿por dónde va el montaje?»**. Meterlas en una sola
columna obligaría a inventar valores como «borrador-pero-esperando-al-cliente» y a que cada
consulta supiera distinguir las dos preguntas.

Va en columna aparte:

```
setup_stage: 'basics' | 'plan' | 'awaiting_client' | 'ready'
```

`status` se queda como está y publicar sigue siendo una sola cosa: el paso 4 lo mueve a
`published`. Un evento puede estar `ready` y sin publicar —listo y esperando el pago— y eso es un
estado real que con una sola columna no se podría expresar.

La lista de `/admin/eventos` sale de cruzar las dos: **incompleto** (`basics`/`plan`), **esperando
al cliente** (`awaiting_client`), **listo para publicar** (`ready` + `draft`), **publicado**
(`published`).

### Los bloques se siembran al terminar el paso 2

Cuando se conocen plantilla y plan, se recorre `template_blocks` y se escribe `event_blocks`
eligiendo para cada bloque la variante que el plan alcanza (`min_plan_rank` contra `plans.rank`).
Es lo que hace que el evento nazca con una invitación completa en vez de una página en blanco, y
es también lo que el cliente va a ver en su vista previa en el paso 3.


## El enlace del paso 3

El evento pasa a `awaiting_client` y el cliente recibe un correo con un enlace para completar su
información. El admin ve en esa misma pantalla que el correo salió, y **un botón para copiar la
URL** y pasarla a mano por WhatsApp si hace falta.

### El token es la llave del formulario, no la del acceso

Esta es la distinción que sostiene el diseño, y encaja con lo decidido en `docs/ACCESO.md`: un
enlace nunca es una credencial. Quien abre el formulario entra **con su sesión**, y el token solo
dice hasta cuándo está abierto.

Se comprueban tres cosas en cada apertura, y las tres hacen falta:

1. Que el token exista, no esté vencido y no esté consumido.
2. Que quien lo abre tenga sesión y **alcance ese evento** por una membresía. Sin esto, un enlace
   reenviado por WhatsApp lo abriría cualquiera.
3. Que el evento siga en `awaiting_client`. Un enlace de un evento ya confirmado no reabre nada.

El token se guarda **hasheado**, con HMAC y el mismo `AUTH_SECRET` que los códigos OTP, para que
un volcado de la base no permita reabrir ningún formulario. Vive en su propia tabla con
`event_id`, `token_hash`, `expires_at`, `consumed_at` — la misma forma que `otp_challenges`, y por
los mismos motivos.

### Vigencia y reenvío

**Tres días.** Al vencer, el paso 3 lo dice y ofrece **reenviar**, que emite un token nuevo e
invalida el anterior. Los tres días son del enlace, no del evento: que caduque no cancela nada,
solo obliga a pedir uno nuevo.

### Confirmar cierra el formulario

El cliente guarda cuantas veces quiera, y al final **confirma que la información es correcta**.
Esa confirmación consume el token, mueve el evento a `ready` y cierra el formulario. Es el punto
del que sale la producción: sin un corte explícito, el contenido podría cambiar mientras alguien
lo está montando.

**Reabrir es una operación del admin.** Un botón en el paso 4 devuelve el evento a
`awaiting_client` y emite un enlace nuevo. Sin esa salida, una errata en el nombre obligaría a
corregirla a mano en la base de datos.

### Esto cambia la pantalla de contenido que ya existe

`/panel/eventos/<id>/contenido` es hoy editable siempre para cualquier rol de escritura. Pasa a
estar abierta **solo mientras el evento está en `awaiting_client`**, y en cualquier otro estado se
ve en lectura con un aviso de que hay que pedirle al estudio que la reabra.

No es un añadido: es un cambio de comportamiento de algo que ya funciona, y conviene tenerlo
presente al implementarlo.


## Publicar

El paso 4 comprueba que el evento esté `ready`, mueve `status` a `published` y sella
`published_at`. El CHECK de completitud lo respalda: si faltara algo, la base de datos rechaza el
cambio en vez de dejar publicada una invitación que no se puede renderizar.


## Decisiones abiertas

- **Cambiar el plan después del paso 2: no, por ahora.** Queda anotado para más adelante porque el
  caso existe —alguien sube de Esencial a Plus a mitad del montaje— y hoy la salida es archivar el
  evento y crear otro. Lo que hay que resolver antes de permitirlo: bajar de plan deja huérfano el
  contenido de las secciones que el plan nuevo no incluye, así que el cambio tiene que enseñar qué
  se va a perder y pedir confirmación. Con el plan bloqueado, ese problema no existe todavía.
- **Qué pasa si el cliente confirma y el admin no publica.** El evento se queda en `ready`
  indefinidamente. Es correcto —esperar el pago es un estado legítimo— pero conviene que la lista
  lo destaque, o se acumularán eventos listos que nadie recuerda cerrar.
- **Quién recibe el correo del paso 3** cuando el cliente tiene varias cuentas con acceso.
  Propuesta: el `owner`, y el resto lo ve igual al entrar porque el formulario sale de la sesión y
  no del enlace.


## Orden de implementación

1. Migración: las columnas nullable, el CHECK de completitud, `setup_stage` y la tabla de tokens.
   Entra reescribiendo `0000_initial_schema.sql` y corriendo `npm run db:fresh`, como el resto.
2. Alta desde `/admin/eventos`: el modal y los pasos 1 y 2, con la siembra de `event_blocks`.
3. El paso 3: emitir el enlace, el correo, la apertura validada y la confirmación. Aquí es donde
   la pantalla de contenido pasa a depender del estado.
4. El paso 4: publicar, y reabrir.
5. La lista de `/admin/eventos` con los cuatro estados.
