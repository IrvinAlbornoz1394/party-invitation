# El editor de contenido, por pasos

Estado: **acordado el 2026-09-10, sin implementar.**

Sustituye al formulario largo de `EventContentScreen`. Aquí «asistente» significa eso y nada más:
**el formulario por pasos**, con el mismo sentido que en `docs/ALTA_DE_EVENTOS.md`.

Qué se pide en cada sección está en `docs/CONFIGURADOR_DE_CONTENIDO.md`; esto es **cómo se pide**.


## Por qué

El formulario de hoy agrupa por **tipo de dato**: «Fotos» junta la portada, la historia y la
galería; «Cuándo y dónde» junta la fecha con la ciudad. Quien lo llena no piensa así — piensa por
**sección de la invitación**, que es lo que va a ver su invitado. Y con una sola vista previa al
lado de un formulario de dieciséis campos, nunca está claro qué parte de la derecha corresponde a
lo que se está escribiendo a la izquierda.

Un paso por sección resuelve las dos cosas a la vez: el paso se explica solo porque a su lado está
**esa** sección, y no hay que desplazarse para encontrarla.


## Los pasos son los bloques del evento

No una lista escrita a mano. Los pasos salen de `event_blocks` —en su orden y sin los que el plan
no incluye—, así que el asistente se adapta solo: una plantilla sin historia no tiene paso de
historia, y un plan Esencial no enseña el de bienvenida. El último paso siempre es la vista previa.

Cada dato del evento cae en el paso de la sección que lo usa:

| Paso | Del evento | Del bloque |
| --- | --- | --- |
| Portada | nombres, fecha, hora, ciudad, foto de portada, frase | línea de arriba |
| Bienvenida | — | frase de la puerta, texto del botón |
| Historia | historia, foto | pre-título, título, bajada, frase destacada |
| Fecha | *(automática, sale de la fecha del evento)* | pre-título, título, nota |
| Galería | las fotos y sus pies | pre-título, título, bajada, nota |
| Programa | los momentos | pre-título, título, bajada, nota |
| Ubicación | las sedes | pre-título, título, bajada, nota |
| Detalles | la lista de detalles | pre-título, título, bajada, nota |
| Vestimenta | la paleta | pre-título, título, instrucción, nota |
| Confirmación | contactos, fecha límite | pre-título, título, bajada, botón, nota |
| Despedida | foto de cierre | pre-título, despedida, bajada |
| Pie | — | monograma, última línea, crédito |

**Un dato se pide una sola vez.** El nombre de quien celebra lo usan la portada, la confirmación y
el pie; se captura en la portada —la primera que lo usa— y las demás no lo vuelven a preguntar.

**El nombre de la celebración y el apellido siguen sus reglas.** El apellido solo aparece cuando la
celebración tiene un festejado y no una pareja (`domain/events/content-hints.ts`).


## Se guarda al pasar de paso — y también al dejar de escribir

Cada «Siguiente» escribe en el servidor. Nadie pierde siete pasos por cerrar una pestaña, y el
render del paso siguiente ya sale con lo guardado.

**Y hay un guardado automático**, añadido el 2026-09-10 por algo que solo se vio al usarlo: si la
vista previa únicamente se ponía al día al pulsar «Siguiente», y «Siguiente» además cambia de
paso, **nunca se llegaba a ver lo que se acababa de escribir** — había que volver atrás. Ahora, al
dejar de teclear poco menos de un segundo, el formulario se envía en silencio y el marco recarga.

La alternativa era ensamblar la invitación en el navegador para pintarla sin guardar, y se
descartó por lo de siempre: serían dos implementaciones del ensamblado y el día que divergieran la
vista previa mentiría. Guardando el borrador, lo que se ve es lo que hay.

El automático es **mudo**: no pinta avisos ni marca campos en rojo, porque mientras alguien
teclea su nombre el campo pasa por «vacío» y un formulario que grita a media palabra es peor que
uno que espera. Quien informa sigue siendo el guardado explícito.

**Se manda el formulario entero en cada paso, no solo el paso.** El asistente tiene todo el estado
en el cliente, así que reusa `saveEventContentAction` tal cual: una sola validación, un solo
camino de escritura, y ningún esquema troceado que haya que mantener en paralelo. Lo que cambia es
**dónde se enseña** el error: junto a su campo, y si es de otro paso, con un aviso que lleve hasta
él.

De ahí sale una consecuencia de orden: **la portada tiene que ser el primer paso**, porque trae los
tres campos obligatorios del evento —nombre, fecha y hora— y sin ellos el guardado del paso dos
fallaría.


## El render, paso a paso

La ruta de vista previa (`/panel/eventos/[id]/vista` y su gemela de admin) acepta `?bloque=<clave>`
y pinta **solo esa sección**, con el mismo ensamblado y el mismo renderizador que la invitación
completa. No hay una segunda forma de pintar una sección: es la misma pieza, recortada.

En escritorio el marco va al lado, como hoy. Al guardar se recarga solo (ya lo hace: su `key`
cambia con el resultado del guardado).


## Móvil: el render es un cajón

Sin marco lateral —no cabe—. «Siguiente» abre un *drawer* con el render de esa sección ya con lo
escrito y la pregunta de si se guarda. Al confirmar, guarda y avanza. Es el mismo guardado por
paso, con la confirmación puesta donde el render se puede ver entero.


## La vista previa final

Render completo a la derecha y, a la izquierda, la lista de secciones. Cuatro cosas se pueden
hacer con ella, y **cada una depende del plan**:

| Qué | Llave del catálogo | Hoy |
| --- | --- | --- |
| Reordenar (arrastrando) | `reordenar_secciones` | existe, en Plus y Premium |
| Encender y apagar | `reordenar_secciones` | `is_enabled` existe; hoy solo lo mueve el plan |
| Cambiar la variante de una sección | `variantes_intercambiables` | existe, en Plus y Premium |
| Cambiar el tema de colores | `tema_intercambiable` | **creada el 2026-09-10**, en los tres planes |

Con un plan que no incluya ninguna, la pantalla es solo el render y el botón. En móvil, la lista
vive en un cajón que abre un botón flotante, **y ese botón solo aparece si el plan da alguna de
las cuatro**.

El botón final depende de quién esté mirando: **el admin publica**; **el cliente manda a revisión**.
Las dos acciones ya existen (`publishEventAction`, `submitContentAction`) y las dos exigen que el
contenido esté completo, que es lo que `checkContentCompleteness` ya sabe decir.

**El admin que entra a revisar se salta el asistente**: si el evento está en revisión, la pantalla
abre directamente en la vista previa. Los pasos siguen ahí para corregir algo, pero no son el
camino.


## Lo que hay que escribir

Ya está hecho y se reutiliza tal cual: el guardado del borrador y de las tres colecciones, los
textos por bloque (`event-block-texts.ts`), la ruta de vista previa, las dos acciones finales y la
comprobación de huecos.

Lo que falta:

1. **El diseño del evento no tiene camino de escritura.** `position`, `is_enabled`, `variant_id` y
   `theme_id` solo se escriben al crear el evento. Hace falta un caso de uso nuevo —«cambiar el
   diseño de un evento»— con su puerto y su implementación.
   **Comprobado: no hace falta ninguna migración.** El rol `mievento_app` ya tiene `UPDATE` sobre
   esas columnas (en `events` por columna, en `event_blocks` a nivel de tabla) y la política RLS de
   `event_blocks` es una sola para todos los comandos.
2. **Saber qué incluye el plan del evento.** Hoy el panel del cliente no lo pregunta nunca: el plan
   solo se consulta al crear. Hace falta una lectura de `plan_features` para el evento que se está
   editando.
3. ~~**La llave del tema.**~~ **Hecha el 2026-09-10**: `tema_intercambiable`, y va **en los tres
   planes**, Esencial incluido. No es una concesión — el plan más barato ya se vendía como «elige
   plantilla y tema»; lo que faltaba era la llave para poder comprobarlo.
4. El armazón de pasos, el cajón de móvil y la pantalla de vista previa final.


## Orden de trabajo

1. ~~**El armazón, en escritorio.**~~ **Hecho el 2026-09-10.** `ContentWizard` sustituye a
   `EventContentScreen`, que ya no existe. Los pasos salen de `contentSteps()`, cada «Siguiente»
   guarda y solo avanza si el servidor dijo que sí, y el marco enseña la sección del paso
   (`/vista?bloque=<clave>`, en las dos rutas de vista previa). El último paso trae el render
   completo y las acciones de publicar o mandar a revisión.

   Dos decisiones que conviene recordar al seguir: **todos los pasos están montados** y solo se
   esconde el que no toca —así el envío lleva el formulario entero y volver atrás no pierde
   nada—, y por eso el atributo `required` del HTML **no se escribe**: un campo obligatorio
   escondido bloquearía el envío sin poder enfocarlo. La validación sigue siendo la del servidor.

   De paso entró el subtramo 5: el admin que abre un evento en revisión aterriza en la vista
   previa (`openAtPreview`).
2. **El cajón de móvil**, con la confirmación por paso.
3. **La vista previa final**, con la lista de secciones: reordenar y encender/apagar. Aquí entra el
   caso de uso de diseño y la lectura del plan.
4. **Variante y tema**, que son el mismo caso de uso con dos campos más y una llave nueva en el
   catálogo.
5. ~~**El salto del admin** a la vista previa cuando el evento llega a revisión.~~ **Hecho** con
   el subtramo 1: la pantalla de plataforma abre en la vista previa cuando el evento está en
   revisión.

Los subtramos 1 y 2 se pueden probar sin tocar la base de datos. El 3 en adelante escribe diseño,
así que conviene tener antes decidido lo de abajo.


## Decidido el 2026-09-10

- **Apagar va dentro de `reordenar_secciones`**, no en una llave propia. Es el mismo gesto sobre la
  misma lista y se guarda en la misma escritura; separarlo habría dado un plan imposible de
  explicar —«puedes mover las secciones pero no quitarlas»— y dos comprobaciones donde basta una.
- **El tema se cambia desde Esencial**, con la llave nueva `tema_intercambiable`. Ya está en el
  catálogo y en los tres planes.
- **Apagar una sección no borra su contenido.** `is_enabled` en falso deja lo escrito intacto y la
  sección deja de pintarse, así que encenderla otra vez no cuesta volver a escribir nada.


## Preguntas abiertas

1. **¿El formulario por pasos sustituye al largo o conviven?** Propuesta: sustituye. Dos editores
   del mismo contenido acaban diciendo cosas distintas, que es justo lo que hoy evita compartir la
   pantalla entre el panel del cliente y el de la plataforma.
2. **Las secciones obligatorias de la plantilla** (`template_blocks.is_required`: la portada, la
   confirmación y el pie): ¿se pueden apagar? Propuesta: no, y el conmutador ni aparece — una
   invitación sin portada no es una invitación con una sección menos, es una página en blanco.
