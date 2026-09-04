# Prospectos: del formulario público al cliente

Estado: **implementado el 2026-08-28**, con las dos salidas cerradas el **2026-08-31**. El embudo
funciona de punta a punta: llega una solicitud, se atiende desde la bandeja y sale por uno de los
dos lados —se convierte en cliente o se descarta con su motivo.

Los avisos por correo entraron el mismo día: llega una solicitud, se avisa a la plataforma, se
acusa recibo a quien escribió, y el menú lleva el contador de lo que pide atención.

La landing no tenía punto de contacto. Los botones de venta apuntaban a `/panel`, el acceso del
cliente: quien pulsaba acababa en una pantalla que le pedía un correo que todavía no existe. Y en
`/plantillas/<template>` el único enlace volvía a la portada, así que en el momento de máximo
interés —le gustó una plantilla— no había forma de decir «quiero esta».

Hoy los tres llevan a `/cotizar`, y el del escaparate manda la plantilla en la URL. «Entrar» de la
cabecera se queda apuntando al panel: ese sí es para quien ya es cliente.


## Formulario, no cotizador

Tres razones, y las tres pueden caducar:

1. **No hay precios.** La sección de planes dice «A medida» porque `plans.price_cents` está en 0.
   Un cotizador exige tarifas públicas y fijas; con una inventada, la primera conversación con el
   cliente empieza corrigiendo el número.
2. **El producto se arma a mano.** La plataforma crea el cliente y el evento. El cuello de botella
   no es calificar prospectos, es el tiempo de quien atiende.
3. **El cotizador llega después**, cuando los planes tengan tarifa y exista pago en línea. Y aun
   entonces sería un estimado por número de invitados, no un configurador.

Pero el formulario tiene que hacer el trabajo de un pre-cotizador: captura **lo que determina el
precio**, y nada más. Seis campos, no quince.

| Campo                  | Por qué está                                                   |
| ---------------------- | -------------------------------------------------------------- |
| Nombres / quién contrata | con qué dirigirse a la persona                                |
| WhatsApp y correo      | el canal real de la conversación; WhatsApp obligatorio          |
| Tipo de evento         | sale de `showcase.eventTypes`, que ya se lee y hoy no se pinta  |
| Fecha (o «sin fecha»)  | decide si hay tiempo de producirlo                              |
| Invitados, por rangos  | es la pregunta que empuja a Premium                             |
| Mensaje libre, breve   | lo que no cabe en un formulario                                 |

### El prellenado es lo que hace que sirva

Un formulario de contacto genérico no ahorra ni una conversación. El valor está en el contexto que
arrastra: `/cotizar?plan=plus` desde la lámina de Plus, `/cotizar?plantilla=botanical&plan=plus`
desde el escaparate. Así la solicitud llega diciendo «quiere `botanical` en Plus, 120 invitados,
marzo» y la primera respuesta es una propuesta en vez de un cuestionario.

Se planteó poner junto al formulario un enlace `wa.me` para quien no quiere llenar nada. **No se
puso**, y conviene saber por qué: el `wa.me` está en la ficha del admin —para escribirle al
prospecto— y en la landing sería el camino contrario, el que evita la solicitud estructurada. Con
un formulario de dos campos obligatorios la fricción ya es baja; si se ve que la gente no lo llena,
el enlace entra entonces y con datos que lo justifiquen.


## Dos entidades, no una

Un prospecto y un cliente no son la misma cosa. El prospecto es un **hecho**: alguien llenó un
formulario un día y pidió información. El cliente es un **tenant**: tiene identidad, membresías,
eventos, RLS y facturación.

Meterlos en la misma tabla significaría crear tenants para gente que nunca compró, y esas filas
contaminarían `users`, las políticas de RLS y todas las cifras del resumen. Al contratar, las dos
entidades se **vinculan**; no se convierte una en la otra.

### La solicitud es inmutable; el seguimiento es otra capa

```
prospects
  id
  -- lo que llenaron: se inserta una vez y no se toca
  contact_name, contact_email, contact_phone
  event_type_key, event_date NULL, guest_range
  template_key NULL, plan_key NULL        -- de dónde venía
  message
  submitted_ip
  created_at
  -- seguimiento: mutable
  status          prospect_status
  next_follow_up_at NULL
  lost_reason     NULL
  client_id       NULL → clients(id)      -- se llena al contratar

prospect_touches
  prospect_id, channel, note, created_at, created_by
```

La separación no es estética. Lo que la persona escribió es la evidencia de lo que pidió y no debe
poder editarse; lo que la plataforma anota encima cambia todos los días. Y la bitácora responde
las preguntas que un campo `notes` largo no responde a los dos meses: ¿ya le insistí?, ¿cuándo?,
¿qué contestó?

### Estados guardados, condiciones derivadas

`new` → `contacted` → `quoted` → `won` | `lost`.

«Dejó de responder» **no es un estado**: se calcula de `next_follow_up_at` vencido o del último
`prospect_touches`. Todo estado que dependa de que alguien se acuerde de marcarlo acaba mintiendo,
y un panel que miente es peor que uno vacío. Por el mismo motivo `last_touch_at` no se guarda
denormalizado: es el `MAX` de la bitácora.

`lost_reason` sí se guarda, porque es la mitad interesante de la estadística. Y por eso a `lost`
solo se llega **descartando**, que lo pide: el desplegable de «cómo queda» del formulario de
anotación no lo ofrece, y la acción de anotar lo rechaza si llega por otro camino. Un estado que se
puede marcar sin explicarlo deja la columna vacía justo en las filas que había que estudiar.

Los dos estados cerrados —`won` y `lost`— son lo que `isClosed()` responde en el dominio, en un
solo sitio, porque la lista, el contador del menú y el cálculo de vencimiento tienen que estar de
acuerdo en qué significa «cerrada».


## La conversión: dos caminos, no dos pantallas

Desde la ficha del prospecto se puede **crear su cliente** o **vincularlo con uno que ya existe**.
Son dos pestañas del mismo bloque, y «es nuevo» va primero porque es lo que pasa casi siempre.

`app.link_prospect_to_client()` hace la parte que sí tiene que ser atómica: pone el `client_id`,
mueve el estado a `won` y deja la conversión en `audit_log`, en una sentencia. Crear el cliente lo
sigue haciendo `app.create_client()`, sin tocar. **No hay una función «convertir»**: el caso de uso
`ConvertProspectToClient` encadena las dos que ya existían, y por eso la validación del nombre, el
slug derivado y el correo de bienvenida están escritos una sola vez.

### Por qué se rehízo la decisión anterior

La primera versión dejó a propósito la conversión en dos pasos —dar de alta en `/admin/clientes` y
volver a vincular—, con dos motivos que seguían siendo ciertos y que resultaron no ser suficientes:

- **«El cliente ya suele existir.»** A veces. Pero el caso normal es el contrario: quien acaba de
  decir que sí todavía no es cliente de nada. El arreglo no era elegir un caso, era cubrir los dos:
  el camino de vincular no se quitó.
- **«Prellenar invita a aceptar sin revisar.»** Cierto, y se responde en el formulario en lugar de
  en su ausencia: los campos llegan escritos pero abiertos, y el nombre del cliente lleva debajo
  «como lo vas a facturar, no como firmó la web». Salir a otra pantalla a teclearlo de memoria no
  producía mejores datos, producía menos conversiones registradas.

Lo que costaba la separación no era un clic: era que quien atendía cerrara la venta, se saltara el
alta y dejara la solicitud abierta en la bandeja para siempre.

### Lo que no es atómico

El alta y el vínculo son **dos transacciones**. Si la primera sale bien y la segunda falla, el
cliente existe y la solicitud se queda sin vincular. Ese caso devuelve `created-not-linked` y la
pantalla lo dice con esas palabras, porque el arreglo es un clic en «ya existe» — mientras que un
error genérico llevaría a intentar crear el cliente otra vez y chocar con el correo repetido.

Deshacer el alta sería peor: borraría un tenant recién creado cuya cuenta dueña ya recibió su aviso
por correo.


## La salida de las que no compran

Una bandeja en la que solo se entra deja de abrirse. La mayoría de las solicitudes no acaban en
venta, y sin una forma explícita de cerrarlas se acumulan como ruido hasta que la lista deja de
significar «lo que tengo que hacer hoy».

**Descartar** está a la vista en la ficha, con su propio botón, y pide el motivo: sin él no se
puede. `lost_reason` es la mitad interesante de la estadística —por qué no se cerraron las que no
se cerraron— y solo se sabe en ese momento. El motivo se guarda dos veces a propósito: en la
columna, para poder contar; y en la bitácora, para que la conversación se lea entera sin saltar a
otro sitio.

Descartar limpia `next_follow_up_at`. Una solicitud cerrada no espera nada, y dejarla con una fecha
vencida la devolvería al contador del menú.

**Reabrir** existe para que descartar no dé miedo. Un cierre sin vuelta atrás se piensa dos veces y
se pospone; con vuelta atrás se toma a tiempo. Reabrir devuelve a `contacted` y no a `new`: con esa
persona ya se habló, y `new` es el único estado del que depende el contador.

Ninguna de las dos es una operación nueva en la base de datos: las dos son
`app.record_prospect_touch()` con su anotación, que es exactamente lo que son —un hecho más de la
conversación, con fecha y autor.

### Ni descartar es borrar, ni ganar es desaparecer

Las cerradas salen de la lista abierta y **no** de la pantalla: la bandeja tiene tres pastillas
—`Abiertas`, `Clientes`, `Descartadas`— sobre la misma tabla. Es lo que responde «¿qué pasó con
aquella?» seis meses después.

En «Descartadas» la última columna enseña el **motivo** en lugar del estado: que estén ahí ya dice
que se cerraron, y lo que no se sabe de memoria es si fue el precio o la fecha.

Y sigue sin haber borrado. Si la fila desapareciera de verdad se perderían justo las cifras que se
buscan: tasa de conversión, prospectos por plantilla y por plan, tiempo de primer contacto a venta.


## Seguridad del formulario público

`prospects` es la única tabla con **INSERT anónimo**. No se abre con grants por columna: el
`insert` de Drizzle nombra todas las columnas de la tabla y choca con un grant parcial (ver
«Permisos por columna y ORM» en `docs/BACKEND.md`). Se hace como todo el plano de auth, con una
función `SECURITY DEFINER`:

- `app.submit_prospect(...)` valida y es el **único** camino de escritura.
- El rol de la aplicación no tiene ningún permiso sobre la tabla — ni de lectura. Nadie debe poder
  leer los teléfonos de los prospectos desde una consulta del panel de un cliente.
- La lectura va por `app.list_prospects_for_platform(hash)`, con el hash del token, como los demás
  listados globales.
- Límite de **cinco solicitudes por hora y por IP**. Se cuenta sobre las propias filas de
  `prospects` y no sobre una tabla de intentos como la de las invitaciones: aquí cada envío ya es
  una fila, así que contar las de esa IP en la última hora responde lo mismo con una tabla menos.
  La consecuencia buscada es que un envío bloqueado **no** se registra, así que no alarga su propio
  castigo — el tope existe para que nadie llene la bandeja, no para castigar a quien pulsó dos
  veces.
- Un **campo trampa** oculto con posición absoluta, no con `display:none` ni `type="hidden"`: los
  robots que valen algo ignoran esos dos. Si llega con algo, la solicitud se descarta respondiendo
  que todo salió bien — decirle a un robot que lo detectaste es enseñarle a esquivarlo.
- Sin CAPTCHA por ahora.

`prospects` **no** es una tabla de tenant: no cuelga de un `client_id` al nacer, así que no entra
en el juego de RLS ni en `withTenant`. Su `client_id` es el resultado de la conversión, no su
alcance.

Eso obligó a declarar una excepción en `scripts/check-rls.ts`, que hasta ahora daba por hecho que
toda tabla con `client_id` lleva RLS. Está escrita con su motivo y no silenciada: una política de
tenant aquí no protegería nada —no hay contexto de cliente cuando alguien llena el formulario
público— y daría la falsa impresión de que sí.


## Dónde vive en la interfaz

| Ruta                        | Qué es                                             |
| --------------------------- | -------------------------------------------------- |
| `/cotizar`                  | El formulario público. Acepta `?plan=` y `?plantilla=` |
| `/admin/prospectos`         | La bandeja                                          |
| `/admin/prospectos/<id>`    | La solicitud, su bitácora y sus tres salidas         |

`Prospectos` va **arriba** de `Clientes` en el grupo de Operación de `admin-navigation.ts`: ese
grupo se ordena de lo más usado a lo menos, la bandeja se revisa a diario, y además es el orden
del embudo.

El contador cuenta **las nuevas y las vencidas**, no todas las abiertas: una en conversación y al
día no pide nada hoy, y un contador que nunca llega a cero deja de mirarse. Cuando no hay ninguna
no se pinta nada — un «0» ocupa el mismo sitio y no dice nada.

Sale de `app.count_pending_prospects()`, que cuenta en la base y no trae ninguna fila. Es una
consulta más en cada carga de cualquier pantalla de `/admin` y se paga a conciencia: sin contador,
la bandeja solo se abre si uno se acuerda, que es el fallo que mata un embudo.

La bandeja se ordena por urgencia y no por fecha: primero los nuevos sin contactar, luego los que
toca insistir hoy, luego el resto. Eso la convierte en una bandeja de trabajo en vez de un
archivo.

## Los dos avisos

Se guarda **y** se avisa, porque el correo se entierra o se va a spam y la cifra que importa no se
puede contar en una bandeja de entrada. Son dos correos con destinos opuestos:

**A la plataforma.** Lleva el nombre, el teléfono, qué pide y el enlace `wa.me` — no solo «tienes
una solicitud». Un aviso que obliga a abrir el panel para saber si corría prisa es un aviso que se
ignora; con los datos delante se decide desde el móvil, y en el mejor caso se contesta sin abrir
nada. El asunto lleva el nombre y el teléfono para que la bandeja de entrada se lea como una
bandeja de prospectos.

**A quien escribió.** El acuse repite lo que la pantalla de gracias ya dijo —«te escribimos en
menos de 24 horas»— y esa repetición es su función: la pantalla ya se cerró, y a las seis horas esa
persona no tiene otra forma de saber que su solicitud llegó. Es opcional porque el correo del
formulario lo es.

### Ninguno puede tumbar el envío

Se mandan después de guardar, con `allSettled`, y su fallo no deshace nada. La solicitud ya está en
la bandeja, así que un proveedor de correo con un mal minuto no puede convertirse en un prospecto
perdido. Y solo se avisa de lo que se guardó: un envío bloqueado por el límite no genera correo, o
el propio límite sería una vía para llenar una bandeja de entrada.

Por lo mismo, `ConsoleProspectNotifier` **no revienta en producción**, al contrario que su hermano
de las invitaciones. La diferencia viene de qué se pierde: una invitación sin enviar deja a alguien
sin poder entrar; una solicitud sin aviso sigue estando en la bandeja. Tumbar el formulario público
porque falta configurar el correo convertiría un aviso perdido en un prospecto perdido.

### Dónde va el aviso

`PROSPECT_NOTICE_EMAIL`, aparte de `AUTH_EMAIL_FROM` a propósito: el remitente suele ser un buzón
que nadie lee («no-reply@…») y mandar ahí los prospectos sería perderlos. Sin ella —o sin Resend—
los dos avisos se escriben en la consola y el formulario sigue funcionando.
