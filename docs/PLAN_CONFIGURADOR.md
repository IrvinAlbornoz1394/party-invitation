# Plan de trabajo del configurador de contenido

Estado: **propuesto el 2026-09-09, sin empezar.**

Qué hay que construir está en `docs/CONFIGURADOR_DE_CONTENIDO.md` —el inventario de campos,
valores por defecto y reglas, sección por sección—. Este documento es el **orden** en que se
construye, la decisión de fondo sobre los dos editores y lo que hay que responder antes de
empezar cada tramo.


## El punto de partida, medido

Antes de planear, lo que hoy existe de verdad:

- **El editor de cliente captura el evento, no los bloques.** `EventContentScreen.tsx` tiene
  nombres, fecha, hora, ciudad, frase de portada, historia, sedes, cronograma, fotos y contactos.
  Todo eso vive en columnas de `events` y en sus colecciones.
- **`event_blocks.config` es hoy de solo lectura desde el panel.** Existe la columna y la escribe
  el seed al crear la plantilla; el único código que la lee es
  `drizzle-invitation-repository.ts`, para pintar. **No hay ningún camino de escritura desde el
  panel del cliente**, y ahí es donde viven los rótulos de cada sección, la lista de detalles, la
  paleta del dress code y los pies de foto.
- **Los contratos de bloque ya son ricos.** `eyebrow`, `title`, `subtitle`, `highlight`, `note`,
  `action`, el banco de veintidós iconos, los tres tipos de sede. Casi nada de lo pedido necesita
  ampliar el esquema; lo que falta es **quién lo edita**.
- **El formulario es `FormData` a una Server Action**, sin estado controlado, y la vista previa es
  un `<iframe>` que se recarga al guardar.

De ahí sale la forma del plan: **el hueco no es de campos, es de un editor por bloque.** Casi todo
lo demás cuelga de eso.


## La decisión de fondo: dos editores, no uno responsivo

La propuesta —renderizar un componente distinto según el dispositivo en lugar de estirar el
mismo— es la correcta aquí, y por una razón concreta: **no son dos anchos del mismo formulario,
son dos formas de trabajar**. En escritorio se edita con la invitación al lado y se salta de
sección en sección; en un teléfono no cabe la vista previa al lado, así que lo que sirve es un
paso a la vez, con la previsualización a pantalla completa cuando se pide. Eso no se consigue con
medias queries: es otra navegación.

Con una condición, que es la que decide si esto sale bien o se convierte en dos productos:

> **Un contrato, un estado, dos maquetas.** Lo que se duplica es la disposición y la navegación.
> Nunca la validación, ni las Server Actions, ni los campos.

En concreto, **no** se duplica:

- Los esquemas del dominio y sus mensajes de error.
- Las Server Actions y los nombres de los campos de `FormData`. Que el formulario de hoy sea
  `FormData` no controlado es una ventaja que hay que conservar: las dos maquetas pueden mandar
  exactamente lo mismo a la misma acción sin compartir una línea de estado.
- Las piezas: `Field`, `CollectionEditor`, `SectionCard`, el selector de iconos, el de color.

Lo que sí se duplica: el armazón de cada uno —dos tercios y un tercio contra un paso a la vez—, y
la navegación entre secciones.

### Cómo se elige cuál se renderiza

1. **En el servidor, por `User-Agent`.** El componente de servidor lee la cabecera
   (`userAgent({ headers: await headers() })`) y elige el armazón. La página es autenticada y
   dinámica, así que no hay caché de CDN que se pueda envenenar con la elección — que es lo que
   haría peligroso este truco en la invitación pública.
2. **Corrección en el cliente, una sola vez.** Un `matchMedia` al montar corrige el caso del
   escritorio en una ventana estrecha o del móvil en escritorio.
3. **No se cambia de armazón al redimensionar.** Es deliberado: con campos no controlados,
   remontar el árbol **borra lo que la persona llevaba escrito**. La elección se toma una vez por
   carga y no se toca hasta la siguiente.

### Dos armazones, no tres

Escritorio y compacto. La tablet no estrena uno propio: en horizontal cabe la maqueta de
escritorio y en vertical la compacta. Un tercer armazón se escribe el día que se sepa qué hace
distinto una tablet, no antes — es la misma regla con la que crece el catálogo de variantes.


## El orden de trabajo

Cada tramo dice qué desbloquea. El orden no es de importancia, es de dependencia.

### 1. Responder lo que bloquea — hecho el 2026-09-09

Las cuatro decisiones que cambiaban el esquema ya están tomadas (ver «Decidido» en el inventario):

- El catálogo de tipos de detalle es un **enum del dominio**, con «otro» dentro desde el principio.
- La paleta del dress code **guarda los cinco colores**; el primario solo alimenta la propuesta.
- El texto breve del dress code es la **`note` que ya existe**.
- El «sub-párrafo» de la historia es la **frase destacada** (`highlight`).

Lo que queda abierto —con qué armonía se propone la paleta, las tres opciones de regalo, el tope
de sedes en otros tipos de evento, el título de la bienvenida y qué otros textos cambian por
tipo— se decide dentro del tramo que lo necesite, porque ninguna cambia la forma de los datos.

### 2. El editor por bloque — hecho el 2026-09-09

`event_blocks.config` ya se escribe desde el panel, en los dos caminos —el del cliente y el del
admin, que comparten pantalla—. Lo que quedó montado:

- `domain/events/event-block-texts.ts`: qué textos ofrece cada bloque, con el nombre que se lee en
  el formulario. La tabla se escribe a mano —para poder decir «pre-título» donde el contrato dice
  `eyebrow`— y el tipo obliga a que cada nombre exista en el esquema de **ese** bloque.
- **Nunca se ofrece un campo que ponga el evento.** `projectedFieldsOf()` los descarta con el
  evento delante, así que un descuido de la tabla cuesta un campo que no se enseña y jamás una
  fecha congelada dentro de un `config`.
- **Las reglas son las del bloque.** Cada campo se valida con su propio validador —el tope de
  longitud y si admite vacío salen del contrato—, y el vacío se guarda como `null` donde el
  contrato lo admite, que es como se borra un rótulo.
- La escritura funde (`config || parche`) para no pisar lo que este formulario no toca. Ver
  `docs/BACKEND.md`, «`event_blocks.config` se funde».
- Los textos viajan serializados en un campo oculto —`blocks`—, igual que las tres colecciones, y
  se guardan con el mismo botón. No hay un guardado por sección.

**Dónde se ven, decidido el 2026-09-09**: repartidos por tema, dentro de la tarjeta que ya
existe —los rótulos de la galería en «Fotos», los del cronograma en «Cronograma», los del
calendario en «Cuándo y dónde»—. Las secciones que no tienen ningún dato del evento —bienvenida,
portada, detalles, vestimenta, despedida y pie— estrenan tarjeta propia, y esa tarjeta **no se
pinta** si el evento no lleva ese bloque: una tarjeta vacía le diría a un cliente de Esencial que
se dejó una sección en blanco cuando lo cierto es que su plan no la incluye.

Falta comprobarlo con un evento de verdad en el navegador: el dominio está probado con casos
—borrar un rótulo, un título obligatorio vacío, un texto demasiado largo, un intento de escribir
un campo del evento— y la pantalla todavía no se ha visto funcionando.

### 3. El asistente por pasos — ver `docs/EDITOR_POR_PASOS.md`

Aquí y no al final. Si el armazón llega después de escribir las diez secciones, cada sección se
escribe dos veces; si llega antes, cada una se escribe una vez y el armazón solo decide dónde cae.

**Acordado el 2026-09-10, y cambia lo que este plan decía**: en vez de dos armazones —escritorio y
compacto— repartiéndose el mismo formulario largo, el editor se convierte en un **asistente por
pasos**, con un paso por sección de la invitación y el render de esa sección al lado. En móvil no
hay marco lateral: el render aparece en un cajón al pulsar «Siguiente», con la confirmación de
guardado. El paso final es una vista previa completa donde se reordenan, encienden y cambian las
secciones —según lo que el plan incluya— y desde donde se publica o se manda a revisión.

Sigue siendo cierto lo de fondo —un contrato, un estado, y la maqueta cambiando con el
dispositivo—, pero la diferencia entre escritorio y móvil deja de ser «dos formularios» y pasa a
ser «dónde se enseña el render».

### 4. Las piezas transversales

Las que usan varias secciones, escritas una vez:

- **Selector de iconos** sobre `blockIconSchema` (el banco ya existe).
- **Catálogo de tipos de detalle**, con su icono por tipo y la opción «otro» que no sale por
  defecto.
- **Generador de paleta**: color primario → cinco tonos, con los cinco editables después.
- **Listas ordenables** con «quitar» y «volver a agregar», que piden el cronograma, los detalles y
  las ubicaciones.

### 5. Sección por sección

Ya sin arquitectura de por medio, en este orden —de lo que más se usa a lo que menos—:
rótulos de todas las secciones → cronograma con su lista por defecto → ubicaciones con la regla de
una ceremonia y una recepción → detalles con las tres opciones de regalo → galería con pies de
foto → dress code → historia → bienvenida y portada → despedida.

### 6. El contenido inicial por tipo de evento

`BASE_BLOCK_CONFIG` es hoy uno solo para todos los eventos. Aquí pasa a depender del tipo, para
que unos XV arranquen con «Misa de acción de gracias» y «Mis XV años» donde una boda arranca con
«Ceremonia» y «Nuestra boda». Va al final a propósito: hasta que las secciones no estén, la lista
completa de textos que cambian no se conoce —hoy hay dos ejemplos y seguro que son más—.

### 7. Las limpiezas — hechas el 2026-09-09

Se adelantaron porque no dependían de nada: fuera los dos enlaces del pie —«Escríbenos por
WhatsApp» y «Cómo llegar»— y fuera el botón «Ver ideas de atuendo». De paso, el ejemplo de boda
del dress code estrenó la nota corta que solo tenía el de XV, que es la que el inventario pedía
llevar a las secciones que no la enseñaban.

Queda una punta suelta, anotada en el inventario: el ejemplo de XV del pie conserva un enlace de
WhatsApp de la misma familia que los que se quitaron, y el mensaje del pie de boda sigue diciendo
«Cualquier duda, escríbenos» sin ningún sitio a donde ir.


### Y entonces, por dónde se sigue

Por el **tramo 3**, el asistente por pasos: su plan y sus preguntas abiertas están en
`docs/EDITOR_POR_PASOS.md`. Ahora que hay un sitio donde guardar lo de cada sección, lo siguiente
que se escriba serán formularios — y escribirlos antes de tener el armazón significa escribirlos
dos veces.


## Lo que no haría

- **Un tercer armazón para tablet** antes de saber qué hace distinto una tablet.
- **Duplicar la validación** en el armazón compacto «porque el paso a paso valida por pasos». Si
  hace falta validar por tramos, se valida el mismo esquema por partes, no otro esquema.
- **Cambiar de armazón al redimensionar.** Ver arriba: borra lo escrito.
- **Vista previa en vivo mientras se teclea.** Ya está razonado en `EventContentScreen.tsx`:
  exigiría ensamblar el contenido también en el navegador, y el día que las dos implementaciones
  divergieran la vista previa mentiría.
- **Empezar por las secciones.** Sin el editor por bloque son formularios que no tienen dónde
  guardar.
