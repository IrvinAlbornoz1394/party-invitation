# Qué pide el configurador, sección por sección

Estado: **capturado el 2026-09-09, sin implementar.**

Esto es la lista de lo que el cliente tiene que poder capturar en cada sección de la invitación,
dictada tal cual y ordenada por bloque. No es todavía un diseño de pantallas: es el inventario de
campos, valores por defecto y reglas que el editor de contenido
(`components/dashboard/client/EventContentScreen.tsx`) tiene que cubrir, para no volver a
descubrirlos de uno en uno.

**Cómo leerlo.** En el dictado, un campo marcado con `*` es **lo que se captura aquí**; los que no
lo llevan vienen del evento y no se preguntan otra vez. Los ejemplos se conservan como valor de
muestra y, cuando hay dos separados por `/`, el primero es de **boda** y el segundo de **XV**.


## Dos reglas de fondo

### Qué es del evento y qué es del bloque

Hay datos que **no se configuran por sección** porque son del evento: los nombres de los novios o
de la festejada, la fecha, la hora, la ciudad y las sedes. Se capturan una vez y cada bloque los
recibe ya proyectados.

Eso ya funciona así en el código —`domain/invitation/event-content.ts` es quien reparte—, y es la
razón por la que cambiar de plantilla no obliga a recapturar nada. Lo que guarda cada bloque es
**cómo lo cuenta**: sus rótulos, sus textos y sus listas.

### Hay textos que cambian según el tipo de evento

En unos XV la sede dice «Misa de acción de gracias» donde en una boda dice «Ceremonia». El título
de la historia es «Nuestra historia» en boda y en XV tiene que ser otro. Son ejemplos: **habrá
más elementos así**, y el configurador tiene que arrancar con el texto que le toca al tipo de
evento en lugar de con uno genérico que el cliente tenga que corregir.


## Bienvenida

| | |
| --- | --- |
| Se captura | **Título** — «Nuestra boda» / «Mis XV años» |
| Se captura | **Frase** *(no todas las plantillas la tienen)* — «Junto a nuestros familiares, tenemos el honor de invitarte a nuestra unión.» / «Acompáñame a celebrar el inicio de una nueva etapa.» |
| Del evento | Nombre de los novios o de la festejada — «Nuestra boda» / «Renata» |
| Del evento | Fecha, hora y lugar |


## Portada (hero)

| | |
| --- | --- |
| Se captura | **Foto** |
| Se captura | **Texto 1** *(no todas lo tienen)* — «Con la bendición de nuestros padres» / «Mis papás y yo te invitamos a celebrar» |
| Se captura | **Texto 2** — «Queremos que estés con nosotros el día en que empezamos a contar de a dos.» / «Una noche para bailar, reír y quedarnos con el recuerdo.» |
| Del evento | Nombres de los novios o de la festejada |
| Del evento | Fecha, hora y lugar |

**Nombre y apellidos van separados en XV.** El campo de apellidos solo se usa en unos XV.
**Hecho**: el formulario solo lo enseña cuando la celebración tiene **un** festejado. En una boda
lo que se anuncia es «Ana y Diego» —dos personas en un renglón— y el campo no aparece. La regla
está en `domain/events/content-hints.ts`, con la lista de los que no lo llevan: boda, revelación
de género y evento empresarial; cualquier otro tipo sí, incluido uno que se añada mañana.

En el contrato ya estaba: `heroContentSchema` tiene `celebrantName` y `celebrantLastName` por
separado, igual que la tabla `events`, y el apellido es anulable.


## Historia

| | |
| --- | --- |
| Se captura | **Foto** |
| Se captura | **Subtítulo** — «Nueve años, dos ciudades y un perro de por medio.» / «Quince años que se pasaron volando y que quiero celebrar contigo» |
| Se captura | **Párrafos** |
| Se captura | **Sub-párrafo** — «No fue un flechazo. Fue una decisión que llevamos nueve años tomando todos los días» / «Quince años no se cumplen dos veces, y no quiero celebrarlos sin ti» |
| Del evento | El nombre de los novios |

El **título es «Nuestra historia» en boda y en XV hay que cambiarlo** — es el caso claro de la
segunda regla de fondo.


## Fecha / Calendario

**No se configura.** La sección es automática a partir de la fecha y la hora que se pusieron en el
evento.

Hoy ya es así: el bloque recibe `startsAt`, la frase de la fecha y la hora, y cada variante decide
cómo las dibuja.


## Galería

| | |
| --- | --- |
| Se captura | **Pre-título** — «Nueve años en 6 fotos» |
| Se captura | **Título** — «Nosotros» / «Mi galería» |
| Se captura | **Subtítulo** — «Un repaso a los momentos que nos trajeron hasta aquí» |
| Se captura | **Fotos** |
| Se captura | **Texto breve por foto** |

El pie de cada foto **se pide siempre** y es la plantilla la que sabe si lo pinta o no. El editor
no tiene que preguntar por la variante para saber qué campos enseñar.


## El orden del día (cronograma)

| | |
| --- | --- |
| Se captura | **Pre-título** — «La noche, paso a paso» / «Cómo será el día» |
| Se captura | **Título** — «Programa» / «Orden del día» |

Por cada elemento: **título, descripción y hora**.

El **icono es un selector** de un banco de iconos, no un texto escrito.

Se arranca con esta lista puesta, cada una con su icono correspondiente:

1. Ceremonia religiosa
2. Recepción
3. Primer baile
4. Fiesta
5. Última canción

De todas ellas se puede **cambiar cualquier dato**, **reordenar** la lista y **añadir más**.


## Ubicaciones

Al crear el evento, la configuración arranca con **las dos**: una para la ceremonia y otra para la
recepción, las dos presentes.

Reglas:

- Se puede **quitar una**, pero **siempre tiene que quedar al menos una**.
- Si se borra por error, se puede **volver a añadir la que falte**: si solo queda la ceremonia,
  lo único que se puede agregar es la recepción.
- Como máximo **una de ceremonia y una de recepción**.

Por cada ubicación:

| | |
| --- | --- |
| Se captura | **Tipo** |
| Se captura | **Nombre del lugar** |
| Se captura | **Hora** |
| Se captura | **Dirección** |
| Se captura | **Ubicación** (el enlace al mapa) |
| Opcional | **Foto** |

El **icono sale del tipo** —ceremonia o recepción—, no se elige aparte.


## Detalles del día

Se arranca con esta lista puesta: **ceremonia, etiqueta, solo adultos, mesa de regalos,
estacionamiento**. El cliente llena lo que quiera y **elimina lo que no**; si borra algo, puede
volver a agregarlo.

Se puede **cambiar el orden** de la lista.

El **tipo de elemento sale de un catálogo** y cada tipo trae su icono. El catálogo incluye una
opción **«otro»**, también con icono, que **no aparece por defecto**: solo sale cuando la persona
quiere agregar más elementos.

### La mesa de regalos, en tres opciones

En lugar de una sola «mesa de regalos», tres, todas puestas por defecto para que el cliente llene
la que use y borre las demás:

| | |
| --- | --- |
| Opción 1 | **Mesa de regalos** → botón «Ver mesa» |
| Opción 2 | **Lluvia de sobres** → botón «Ver datos» |
| Opción 3 | **Regalo directo** → botón «Ver lista» |


## El dress code

Se elige **un color primario** y de ahí se genera una **paleta de cinco colores** que vayan a
juego. Los cinco son los que se enseñan en la invitación, y el cliente puede **cambiar cualquiera
de ellos** después de generados.

Además:

- **El texto breve** —«Tacón cómodo: la pista es de madera y no pensamos parar.»— es la **`note`
  que ya existe** en el contrato: no hace falta campo nuevo. Las nueve variantes la pintan; lo que
  pasaba es que solo el ejemplo de XV la traía, así que en las demos de boda no se veía.
  **Hecho** en el escaparate: el ejemplo de boda ya lleva la suya.
- **Quitar el botón «Ver ideas de atuendo».** **Hecho**: era la `action` del ejemplo de XV, y el
  campo sigue en el contrato para un evento que quiera darla.

Queda para el configurador: pedir esa nota corta en todas las secciones —hoy no se captura desde
ninguna pantalla, porque el contenido por bloque no es editable— y el generador de paleta.


## Despedida — «nos vemos ese día»

| | |
| --- | --- |
| Se captura | **Título** — «Gracias por caminar con nosotros» |
| Se captura | **Subtítulo** — «No queremos una boda perfecta; queremos una boda con la gente…» |


## Pie de página

**Quitar** la parte de «Escríbenos por WhatsApp» y la de «Cómo llegar». **Hecho**: eran los dos
enlaces del ejemplo de boda del escaparate (`components/invitation/demo/footer-samples.ts`), que
ahora se queda sin ninguno.

En una invitación real el pie no los tenía nunca: `event-content.ts` proyecta ahí el teléfono y el
Instagram del evento, y ni uno ni otro es un WhatsApp ni un ancla a la ubicación. Si el pie tiene
que ofrecer WhatsApp, eso es un cambio en la proyección y no en la demo.

Pendiente de decidir: el ejemplo de XV conserva tres enlaces —teléfono, WhatsApp e Instagram— y el
del medio es de la misma familia que los que se acaban de quitar. Y el mensaje del pie de boda
sigue diciendo «Cualquier duda, escríbenos. De verdad.», que ahora no tiene a dónde llevar.


## Lo que esto toca en el código

Notas de dónde cae cada cosa, para no buscarlas dos veces:

- **Los rótulos ya existen en casi todos los bloques.** Historia, galería, cronograma y vestimenta
  tienen `eyebrow`, `title` y `subtitle` en su contrato, así que «pre-título / título / subtítulo»
  del dictado se mapea directo y no hace falta ampliar el esquema.
- **Historia**: el «sub-párrafo» encaja con `highlight` —la frase destacada, con autor opcional—,
  que no es lo mismo que `signature`. Conviene fijar cuál de los dos es antes de construir el
  formulario.
- **Banco de iconos**: ya existe, `blockIconSchema` en `domain/invitation/blocks/shared.ts`, con
  veintidós iconos (`calendar`, `clock`, `location`, `church`, `dress`, `gift`, `music`, `camera`,
  `cake`, `phone`, `parking`, `info`, `toast`, `food`, `party`, `heart`, `sparkles`, `car`,
  `flowers`, `guests`…). El selector del cronograma y el catálogo de detalles salen de ahí.
- **Tipo de sede**: `venueKindSchema` ya distingue `church`, `reception` y `other`. La regla de
  «máximo uno de cada» es nueva y no está en el esquema.
- **Nombre y apellido separados**: ya está, en `events` y en el contrato de la portada.
- **Detalles y vestimenta no heredan nada del evento** —está escrito así en `event-content.ts`—,
  así que la lista por defecto y la paleta generada son contenido del bloque y hay que sembrarlas
  al crear el evento, como se hace con los rótulos en `BASE_BLOCK_CONFIG` (`scripts/seed.ts`).
- **Los textos por tipo de evento** también son contenido inicial: hoy `BASE_BLOCK_CONFIG` es uno
  solo para todos los eventos, así que arrancar con «Misa de acción de gracias» en XV y
  «Ceremonia» en boda pide que ese contenido por defecto dependa del tipo.
- **El editor de hoy** captura por evento —nombres, fecha, ciudad, frase, historia, sedes,
  cronograma, fotos y contactos—; lo de esta lista que no está es sobre todo lo que se configura
  **por bloque**: los rótulos de cada sección, la lista de detalles, la paleta y los pies de foto.


## Los ejemplos dentro de los campos

**Hecho el 2026-09-09.** Cada campo vacío enseña como pista el texto que esa sección tiene en la
demo del escaparate: la que el cliente vio antes de comprar. Los de la portada y la historia
cambian con el tipo de evento —«Ana & Diego» en una boda, «Renata» en unos XV— y los demás son
comunes.

Van como `placeholder` y **no** como texto ya escrito, que era la otra mitad de la petición. La
razón es concreta: un valor precargado que nadie toca acaba publicado, y una invitación de verdad
que se despide con «Gracias por caminar con nosotros» —la frase de otra pareja— es peor que un
hueco. Lo que sí nace escrito son los rótulos de cada sección, que los pone la plantilla al crear
el evento (`BASE_BLOCK_CONFIG`): esos son decisiones del catálogo, no contenido de nadie.

Dónde están: los del evento en `domain/events/content-hints.ts`, los de cada sección en la tabla
de `domain/events/event-block-texts.ts`.


## Decidido el 2026-09-09

- **El catálogo de tipos de detalle es un enum del dominio**, no una tabla. Añadir un tipo es un
  despliegue, como añadir un icono al vocabulario común — y por eso el enum tiene que incluir
  «otro» desde el principio, que es la válvula para lo que no estaba previsto.
- **La paleta del dress code guarda los cinco colores.** No se guarda el primario y se recalcula:
  el cliente puede cambiar cualquiera de los cinco, así que lo generado es un punto de partida y
  lo que vale es el resultado. El primario solo alimenta la primera propuesta.
- **El texto breve del dress code es la `note` que ya existe.** Sin campo nuevo.
- **El «sub-párrafo» de la historia es la frase destacada** (`highlight`), no la firma.


## Preguntas abiertas

1. **Con qué armonía se propone la paleta** a partir del primario. Lo que hacen hoy las dos
   paletas del escaparate es un buen punto de partida: tres tonos análogos —el primario, uno más
   oscuro y uno más claro—, un neutro claro y un metálico. Falta confirmarlo.
2. **Las tres opciones de regalo**: ¿pueden convivir las tres en una invitación o son excluyentes?
   El ejemplo las enseña juntas.
3. **El máximo de una ceremonia y una recepción**: ¿aplica a cualquier tipo de evento, y qué pasa
   con las sedes de tipo `other`, que hoy el esquema permite?
4. **El título de la bienvenida** («Nuestra boda» / «Mis XV años»): ¿es un campo propio o el mismo
   que ya se captura como nombre de la celebración en el evento?
5. **Qué otros textos cambian con el tipo de evento**, además del título de la historia y del
   rótulo de la ceremonia. Hace falta la lista para sembrar el contenido inicial correcto.
6. **Los enlaces del pie**: si el WhatsApp del ejemplo de XV se va también, y si el pie de una
   invitación real debería poder ofrecer WhatsApp —hoy la proyección solo da teléfono e
   Instagram—.
