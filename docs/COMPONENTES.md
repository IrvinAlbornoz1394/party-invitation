# Biblioteca de componentes de invitación

Cómo se construyen los bloques con los que se arma una invitación, cómo se registran y cómo
se ven antes de ponérselos a un cliente.

La regla de fondo la fija `PROJECT.md` y no se negocia: **el sistema nunca conoce los
componentes, solo sus identificadores**. Un evento guarda `hero.split` en la base de datos; el
Component Registry es el único archivo que sabe qué componente es esa cadena.

## Dónde vive cada cosa

```
src/domain/invitation/
  blocks/
    shared.ts           Piezas comunes del contenido: imagen, acción, icono, línea de texto.
    hero.ts             Contrato del bloque portada (Zod). Es a la vez la forma de
                        event_blocks.config y lo que recibe toda variante.
    story.ts            Contrato del bloque historia.
    calendar.ts         Contrato del calendario: el instante, y de él sale el mes entero.
    details.ts          Contrato del bloque detalles: lista de detalles con icono.
    dresscode.ts        Contrato del código de vestimenta: la instrucción y su paleta.
    schedule.ts         Contrato del bloque cronograma: hitos con hora e icono, sin fotos.
    gallery.ts          Contrato del bloque galería: fotos con medidas y pie opcional.
    location.ts         Contrato del bloque ubicación: lista de sedes con mapa y foto.
    rsvp.ts             Contrato de la confirmación: el botón y a dónde va.
    closing.ts          Contrato del mensaje final: la frase, la firma y el remate.
    footer.ts           Contrato del pie: monograma, nombres, contactos y créditos.
    welcome.ts          Contrato de la pantalla de bienvenida: la puerta previa a la portada.
    block-order.ts      Orden de lectura de una invitación, de la portada al pie.
  theme.ts              Tokens de un tema, con papeles semánticos y valores por defecto.
  countdown.ts          Aritmética de la cuenta regresiva, sin React.
  event-date.ts         La fecha partida en piezas, leída de la cadena ISO sin zonas horarias.
  month-grid.ts         El mes en la retícula de siete columnas de un calendario. Sin React.
  day-strip.ts          Los tres días de antes, el del evento y los tres de después. Sin React.

src/components/invitation/
  theme/
    ThemeScope.tsx        Contenedor que pone un tema en pie (variables --inv-*).
    theme-variables.ts    Tokens → propiedades personalizadas CSS.
  blocks/welcome/
    welcome-gate.ts       Los dos contextos: dónde se pinta y en qué estado está la puerta.
    welcome-parts.tsx     WelcomeShell (todo el comportamiento) y WelcomeOpenButton.
    WelcomeStageScope.tsx Marca la previsualización del panel para que no secuestre la pantalla.
    welcome-name.ts       Iniciales y parejas: de dónde salen los monogramas.
    welcome-ornaments.tsx Filigrana, rama y alianzas, en SVG con currentColor. El canto
                          rasgado se fue a shared/paper-ornaments.tsx al compartirlo.
    WelcomeVeil.tsx       welcome.veil      — papelería: filete doble, sin depender de la foto.
    WelcomeEnvelope.tsx   welcome.envelope  — tarjeta con sello de lacre; el sello es el botón.
    WelcomeSpotlight.tsx  welcome.spotlight — foto a sangre, manuscrita y flecha hacia arriba.
    WelcomeFiligree.tsx   welcome.filigree  — cuatro esquinas grabadas y la fecha en retícula.
    WelcomeMonogram.tsx   welcome.monogram  — las iniciales a cuerpo enorme sobre la foto.
    WelcomeLuminous.tsx   welcome.luminous  — manuscrita con halo, alianzas y foto en penumbra.
    WelcomeBotanical.tsx  welcome.botanical — papel claro con dos guirnaldas opuestas.
    WelcomeTorn.tsx       welcome.torn      — papel rasgado que descubre la fotografía.
    WelcomeBand.tsx       welcome.band      — retrato arriba y banda de color abajo (la más móvil).
    WelcomeCountdown.tsx  welcome.countdown — nombres apilados y la cuenta atrás antes de entrar.
    WelcomeCrown.tsx      welcome.crown     — la hermana de `luminous` para XV: corona en vez de
                          alianzas y el nombre como titular.
    WelcomeGilded.tsx     welcome.gilded    — la participación grabada: doble filete inscrito,
                          guirnaldas en dos esquinas y la tiara sobre la foto en penumbra. La otra
                          de XV, y la que compone con ornamento donde `crown` compone con aire.
  blocks/hero/
    hero-variant.ts       HeroVariantProps: lo único que recibe una variante.
    HeroClassic.tsx       hero.classic  — foto a sangre, contenido abajo.
    HeroCentered.tsx      hero.centered — todo al centro, dentro de un marco.
    HeroSplit.tsx         hero.split    — foto a un lado, texto sobre el papel del tema.
    HeroPortrait.tsx      hero.portrait — el retrato se deshace en el papel con una máscara.
    HeroFramed.tsx        hero.framed   — rótulo, retrato enmarcado y nombres a mano debajo.
    HeroQuince.tsx        hero.quince   — las cifras romanas a cuerpo de cartel sobre el retrato.
    HeroCard.tsx          hero.card     — la foto a sangre y una tarjeta de papel apoyada encima.
    HeroScript.tsx        hero.script   — la foto, los nombres en caligrafía y el año. Nada más.
    HeroFrame.tsx         hero.frame    — rótulo vaciado y el retrato en un marco dibujado.
    HeroCrown.tsx         hero.crown    — corona, rótulo en versalitas y el nombre en manuscrita.
                          La segunda de XV: aquí el titular es el nombre, no la cifra.
  blocks/story/
    story-variant.ts      StoryVariantProps.
    story-parts.tsx       Encabezado, cuerpo, cita y firma: lo que las cuatro comparten.
    StorySplit.tsx        story.image-left y story.image-right (un componente, dos entradas).
    StoryCentered.tsx     story.centered — columna centrada, foto apaisada.
    StoryOverlay.tsx      story.overlay  — tarjeta de texto sobre la fotografía.
    StoryPressed.tsx      story.pressed  — pliego con doble filete, crónica numerada y lámina.
    StoryMounted.tsx      story.mounted  — la copia torcida, encabalgada sobre la hoja del relato.
    StoryGreeting.tsx     story.greeting — la alocución centrada. La única que ignora la foto.
    StoryBow.tsx          story.bow      — banda de canto ondulado, lazo atado y texto centrado.
  blocks/calendar/
    calendar-variant.ts   CalendarVariantProps.
    calendar-parts.tsx    DayMarkShape: la marca del día señalado, igual en las dos.
    CalendarMonth.tsx     calendar.month — el mes en una lámina de color con cantos rasgados.
    CalendarSheet.tsx     calendar.sheet — la fecha en una tira de siete días, con el del evento
                          marcado en el centro. La cuenta la hace `domain/invitation/day-strip.ts`.
    CalendarWeek.tsx      calendar.week  — la semana real del evento, con las iniciales de los
                          días. La cuenta la hace `eventWeek`, en `month-grid.ts`.
    CalendarBand.tsx      calendar.band  — la fecha sin retícula: la cifra del día a cuerpo de
                          cartel entre dos filetes.
  blocks/dresscode/
    dresscode-variant.ts  DresscodeVariantProps.
    DresscodePalette.tsx  dresscode.palette  — la instrucción escrita y la paleta en muestras.
    DresscodeSwatches.tsx dresscode.swatches — el muestrario de telas: un retal por renglón.
    DresscodeDiscs.tsx    dresscode.discs    — discos grandes y los nombres en un pie aparte.
    DresscodeDrops.tsx    dresscode.drops    — manchas de contorno irregular y el candelabro.
    DresscodeLabel.tsx    dresscode.label    — manda la palabra y la paleta baja a una fila de
                          puntos. Para el evento cuyo código es «FORMAL» y nada más.
  blocks/details/
    details-variant.ts    DetailsVariantProps.
    DetailsCards.tsx      details.cards — una tarjeta por detalle, en rejilla.
    DetailsList.tsx       details.list  — una columna con filetes.
    DetailsSplit.tsx      details.split — encabezado anclado a un lado, detalles al otro.
    DetailsPanel.tsx      details.panel   — franja del color principal del tema.
    DetailsProgram.tsx    details.program — dos columnas contra un filete central.
    DetailsStack.tsx      details.stack   — una ficha por dato, con la placa cuadrada al margen.
    DetailsNotes.tsx      details.notes   — icono suelto y rótulo en acento. Sin ninguna caja.
    DetailsStickers.tsx   details.stickers — el icono dentro de una mancha, como una pegatina.
    DetailsColumn.tsx     details.column  — columna centrada: dibujo arriba y filete entre avisos.
  blocks/schedule/
    schedule-variant.ts   ScheduleVariantProps.
    schedule-parts.tsx    La hora y la marca del hito (icono o punto).
    ScheduleTimeline.tsx  schedule.vertical   — línea de tiempo alternada.
    ScheduleRail.tsx      schedule.horizontal — cinta que se arrastra en móvil.
    ScheduleAgenda.tsx    schedule.agenda     — programa impreso, hora y filete.
    ScheduleShowcase.tsx  schedule.showcase   — una franja por momento, hora en cuerpo grande.
    ScheduleRibbon.tsx    schedule.ribbon     — cinta vertical atada con lazos, con ilustraciones.
    ScheduleZigzag.tsx    schedule.zigzag     — hilo central y momentos alternos desfasados.
    ScheduleItinerary.tsx schedule.itinerary  — iconos al margen, fuera del hilo; la más corta.
    ScheduleCards.tsx     schedule.cards      — una ficha por momento, la hora en un medallón y
                          ningún hilo.
    ScheduleHours.tsx     schedule.hours      — la cifra al margen y el filete solo bajo el texto.
    ScheduleLeaders.tsx   schedule.leaders    — hora en un margen, rótulo en el otro y una guía
                          punteada uniéndolos por encima del hilo.
  blocks/gallery/
    gallery-parts.tsx     PhotoButton: la foto pulsable, igual en las cinco.
    GalleryParallax.tsx   gallery.parallax — la de Kamilah: fotos flotando y final desplegable.
    GalleryGrid.tsx       gallery.grid     — rejilla cuadrada, sin trucos.
    GalleryCarousel.tsx   gallery.carousel — pasarela infinita a todo el ancho.
    GalleryMasonry.tsx    gallery.masonry  — mampostería que respeta cada proporción.
    GalleryMosaic.tsx     gallery.mosaic   — una destacada y el resto alrededor.
    GalleryOffset.tsx     gallery.offset   — dos columnas desfasadas y un remate a todo el ancho.
    GalleryPolaroid.tsx   gallery.polaroid — instantáneas torcidas, con su franja blanca.
  blocks/location/
    location-parts.tsx    VenueFacts y VenueMedia: una sede, compuesta igual en las seis.
    venue-icon.ts         Tipo de sede → icono. Lo único que `kind` decide.
    LocationSingle.tsx        location.single       — la sede a sangre, datos encima.
    LocationSingleSplit.tsx   location.single-split — foto a un lado, datos al otro.
    LocationSingleCard.tsx    location.single-card  — tarjeta sobria centrada.
    LocationSinglePlate.tsx   location.single-plate — foto a sangre como lámina, ficha debajo.
    LocationDualVenue.tsx     location.dual-venue   — dos columnas simétricas.
    LocationDualJourney.tsx   location.dual-journey — recorrido con conector.
    LocationDualStacked.tsx   location.dual-stacked — franjas alternas a ancho completo.
    LocationSingleOpen.tsx    location.single-open  — la sede sin tarjeta, sobre el papel.
    LocationSingleScene.tsx   location.single-scene — la mesa puesta dibujada, y la foto debajo.
    LocationSinglePlaque.tsx  location.single-plaque — la hora abre y el nombre va entre filetes.
  blocks/rsvp/
    rsvp-parts.tsx        RsvpAction: el botón, sus dos caminos y sus cuatro estados.
    rsvp-gateway.ts       La costura con la plataforma (contexto y tipos).
    RsvpGatewayProvider.tsx / useRsvpGateway.ts   Conectar y consumir la pasarela.
    RsvpCard.tsx          rsvp.card       — tarjeta centrada, la sobria.
    RsvpPanel.tsx         rsvp.panel      — franja de color a ancho completo, la insistente.
    RsvpTicket.tsx        rsvp.ticket     — pase troquelado con talón, la lúdica.
    RsvpReplyCard.tsx     rsvp.reply-card — la tarjeta de respuesta del sobre, con doble filete.
    RsvpPostcard.tsx      rsvp.postcard   — el reverso de una postal, con sello y matasellos.
    RsvpTorn.tsx          rsvp.torn       — franja de papel rasgado con un velo del color del tema.
    RsvpRaised.tsx        rsvp.raised     — la tarjeta encimada entre el papel y la banda final.
    RsvpHairline.tsx      rsvp.hairline   — un filete, el rótulo y el botón. Sin pieza alrededor.
    RsvpEngraved.tsx      rsvp.engraved   — doble filete alrededor y ningún fondo propio.
  blocks/closing/
    closing-parts.tsx     ClosingMessage: la despedida, compuesta igual en todos.
    ClosingSplit.tsx      closing.split   — foto a un lado, frase al otro.
    ClosingLetter.tsx     closing.letter  — una carta que se despliega, con su sello.
    ClosingHorizon.tsx    closing.horizon — la frase sola, a pantalla completa.
    ClosingEnvelope.tsx   closing.envelope — un sobre con la tarjeta de contacto asomando.
    ClosingAlbum.tsx      closing.album   — la foto montada con esquineras, y la frase al pie.
    ClosingNote.tsx       closing.note    — la nota, con el medallón encabalgado en la fotografía.
    ClosingScript.tsx     closing.script  — la despedida entera en caligrafía, sin nada alrededor.
    ClosingBouquet.tsx    closing.bouquet — dos ramilletes espejados a los lados de la firma.
    ClosingWreath.tsx     closing.wreath  — dos ramas cerrando una guirnalda **alrededor** del
                          texto. El único que envuelve.
  blocks/footer/
    footer-parts.tsx      Monograma, contactos, volver arriba y créditos.
    FooterCentered.tsx    footer.centered — clásico, todo en un eje.
    FooterRibbon.tsx      footer.ribbon   — cinta del color principal, en una línea.
    FooterMarquee.tsx     footer.marquee  — el nombre cruzando la pantalla, en grande.
    FooterColophon.tsx    footer.colophon — doble filete, mancheta y corondeles.
    FooterSprig.tsx       footer.sprig    — otra hoja, rasgada, con el monograma entre ramitas.
    FooterSeal.tsx        footer.seal     — lámina oscura y el monograma dentro de un doble cerco.
    FooterRule.tsx        footer.rule     — un filete y el nombre en versalitas. Sin monograma.
    FooterWave.tsx        footer.wave     — franja de color bajo una onda, con el nombre vaciado.
    FooterFrame.tsx       footer.frame    — cartucho de doble filete con la corona encabalgada.
  shared/                 Lo que comparten todos los bloques: BlockSection, BlockHeading,
                          BlockImage, BlockNote, BlockOrnament, BlockCurve, ActionLink,
                          TextLink, IconBadge, Countdown, Lightbox + useLightbox,
                          paper-ornaments.tsx (canto rasgado, ramita, corona, tiara y
                          guirnalda),
                          doodle-ornaments.tsx (lazo, alianzas, candelabro, ramillete, mesa
                          puesta y marco dibujado), block-icons.ts, href.ts.
  registry/
    component-registry.ts EL registro. Único sitio que importa los componentes.
  demo/
    hero-samples.ts       Contenido de ejemplo, tres eventos imaginarios.
    story-samples.ts      Los mismos tres eventos, para poder comparar bloque a bloque.
    details-samples.ts    Los mismos tres, con tres, cinco y seis detalles.
    calendar-samples.ts   Los mismos tres: un mes que empieza en jueves, otro en lunes con la
                          semana abriendo en lunes, y la marca en la última columna.
    dresscode-samples.ts  Los mismos tres: con nombres, con seis muestras y dos metálicas, y
                          sin nombres con un marfil del color del papel.
    schedule-samples.ts   Los mismos tres: con iconos, en «solo puntos», y uno largo.
    gallery-samples.ts    Los mismos tres: proporciones mezcladas, todas iguales, con pies.
    location-samples.ts   Los mismos tres: dos sedes con foto, una sin foto, y mezclado.
    rsvp-samples.ts       Dos por WhatsApp y uno contra la plataforma.
    RsvpDemoGateway.tsx   Pasarela simulada, SOLO para la previsualización del panel.
    closing-samples.ts    Los mismos tres: con foto, sin foto, y sin llamada a la acción.
    footer-samples.ts     Los mismos tres: nombre largo, nombre corto, y sin monograma.
    samples.ts            Índice de ejemplos por bloque.
    BlockDemo.tsx         Pinta cualquier bloque registrado con un ejemplo.
```

En el panel, `src/components/dashboard/admin/BlockPreview.tsx` es la ventana que cruza
variante × tema × contenido × pantalla, y se abre desde **Componentes** y desde **Temas**.

## El escaparate público

`/plantillas/<clave>` enseña una invitación completa que se puede desarmar en vivo: cambiar de
**tipo de evento**, de plantilla, de tema y de variante en cada bloque, como en las demos de un
mercado de plantillas. La portada la anuncia con una tarjeta por demo.

Son **diez demos para nueve estructuras**: la de `botanical` está contada dos veces, una para boda
y otra para XV (`botanical` y `botanical-xv`). Cada una es una entrada propia y no un parámetro, por
dos motivos:
la URL se prerenderiza y se comparte con su propia vista previa, y —lo importante— boda y XV no se
distinguen solo por el texto, sino por **qué variantes componen la plantilla**, que es una
composición distinta y no un ajuste.

El gestor **se cierra al cambiar cualquier cosa**. Ocupa un tercio de la pantalla en un escritorio
y casi toda en un teléfono, así que quien cambiaba el tema no veía lo que acababa de cambiar. Se
cierra desde un único sitio (`applyAndClose`) para que ningún mando se quede sin hacerlo el día
que se añada el siguiente.

```
src/components/invitation/
  demo/templates.ts       Las plantillas: evento imaginario + tema + una variante por bloque.
  TemplateBlock.tsx       Envoltorio fino sobre `InvitationBlock`: solo decide de dónde sale el
                          identificador cuando el visitante no ha elegido variante.
src/components/showcase/
  TemplateStudio.tsx      La barra de mandos y la invitación debajo.
src/app/plantillas/[template]/page.tsx
src/application/catalog/browse-showcase.ts   El catálogo público: sin credenciales, solo activo.
```

### Las fotografías de las demos

Viven en `demo/photos.ts`, agrupadas por tipo de evento, y **la imagen y su descripción viajan
juntas**: quien la usa no escribe el `alt`, lo recibe. Existe porque antes cada archivo escribía
sus propias URL y el resultado fue el que era de esperar — una fiesta infantil con un cartel de
«HAPPY BIRTHDAY» ilustrando la portada de unos XV, y un niño pintando con témperas descrito como
«mesa larga montada al aire libre para una boda». Nadie mintió a propósito: **un identificador de
Unsplash no dice qué se ve en la foto**, así que copiarlo de un sitio a otro es copiar a ciegas.

Al añadir una, hay que descargarla y **mirarla**, y describir en `alt` lo que se ve.

### Boda y XV: dos entradas del catálogo, nunca una condición

Lo que cambia entre una boda y unos XV se resuelve **con variantes distintas**, no preguntándole al
componente de qué evento se trata. `docs/PROJECT.md` lo prohíbe y la razón es práctica: el día que
llegue «bautizo», una condición obligaría a abrir los sesenta componentes.

En la práctica, casi todo se resuelve por **contenido**: el `dayMark` del calendario —corazón para
la papelería nupcial, aro para la sobria—, los iconos del cronograma, la forma del nombre. Solo hay
que escribir un componente nuevo cuando la **composición** cambia:

- `welcome.crown` frente a `welcome.luminous`: aquella lleva las alianzas (`RingsGlyph`), que son
  un símbolo nupcial incrustado; sobre unos XV prometen una boda.
- `hero.quince` frente a `hero.framed`: aquí el titular es una cifra y el nombre va debajo; allí el
  titular es el nombre. Son dos composiciones, no una con un parámetro.

El «XV» va escrito en el componente y no en el contenido, igual que la rasgadura de `rsvp.torn`: no
es un dato del evento —no cambia, no se configura— sino la firma de la variante.

Tres decisiones que sostienen esto:

- **Una plantilla es una combinación, no contenido nuevo.** Sale de los mismos `*-samples.ts`
  que alimentan la previsualización del panel, y lo que la define es qué variante lleva cada
  bloque y con qué tema se compone. Así el texto de la demo y el de las pruebas no se separan.
- **Sin base de datos para el contenido.** Un visitante no dispara ni una consulta de datos de
  nadie; del servidor solo llega el catálogo —qué variantes y qué temas existen—, y todas las
  demos se generan estáticas en el build.
- **El catálogo se cruza con el registro del código.** La base de datos tiene variantes sin
  componente todavía; ofrecerlas en el selector daría un bloque en blanco. El nombre bonito lo
  pone la base de datos, lo que se puede enseñar lo dice `registeredIds()`.

## Ninguna plantilla repite la variante de otra del mismo tipo de evento

Es la regla que sostiene el plan **Esencial**. Ahí el cliente no intercambia nada: se lleva la
plantilla como está, así que lo único que separa una de otra es su composición. Dos plantillas de
boda que comparten el cronograma y el pie son, para quien las compara en el escaparate, la misma
invitación con otras fotos — y el catálogo aparenta un tamaño que no tiene.

**El alcance es el tipo de evento, no el catálogo entero.** Nadie compara una plantilla de boda con
una de XV: quien entra a elegir ya sabe qué celebra. Que `botanical` y su hermana de XV compartan el
calendario en lámina no le quita nada a ninguna de las dos, y prohibirlo obligaría a duplicar la
biblioteca entera por tipo de evento — justo lo que `docs/PROJECT.md` no quiere.

La consecuencia práctica es más dura de lo que parece: una estructura ofrecida para varios tipos
entra en varias comparaciones a la vez, y **ocho de las nueve se ofrecen para boda y para XV**. O
sea que en la práctica tienen que ser disjuntas entre sí, las ocho.

La novena, `gala`, es la excepción que enseña cómo funciona la regla: se ofrece **solo para XV**
—su portada lleva la corona escrita dentro— así que solo tiene que ser disjunta en «quince», y en
«boda» no compite con nadie. Es también lo que pasará cuando llegue una solo para «corporate»:
podrá reutilizar lo que quiera siempre que ningún otro candidato de «corporate» lo use.

**No limita a Plus ni a Premium.** Ahí intercambiar variantes es precisamente lo que se vende, y
cualquier plantilla puede acabar con cualquier variante de su bloque. Lo que se protege es la
composición **de partida**.

### Se comprueba, no se confía

`assertTemplateVariantsAreExclusive()` corre al principio de `seedRegistry()` y lanza antes de
escribir nada, con el nombre de las dos plantillas y la variante que comparten. Existe porque la
duplicación **no se ve leyendo el archivo**: hay que cruzar nueve listas de once líneas
mentalmente, y estas composiciones llegaron a repetir seis variantes —`cinematic` compartía cinco
con sus vecinas— sin que nadie lo notara en varias revisiones.

`demo/templates.ts` lleva la misma comprobación, pero **avisa por consola en vez de lanzar**, y solo
en desarrollo: romper ahí significaría una página de venta en blanco, y una demo que repite un pie
es un defecto de catálogo, no un fallo de render. Hace falta aparte porque las diez demos no son
las nueve del catálogo — llevan la bienvenida en todas y la de XV cambia la portada por `hero.quince`,
así que el escaparate puede repetir sin que el catálogo lo haga.

### Cuando no queda variante libre, se escribe una

Es lo que pasó al aplicar la regla: cinco estructuras necesitaban cinco cierres y cinco pies, y el
catálogo tenía cuatro y tres. La salida **no** es que dos plantillas compartan la que sobra ni
repartir la misma con otro tema: es que faltaban piezas. De ahí salieron `closing.album`,
`footer.colophon` y `footer.sprig`, cada una escrita para el lenguaje de la estructura que la pedía
—álbum, revista y papelería— y disponibles desde entonces para cualquier otra.

Las tres van **sin `minPlanRank`**, a diferencia de las galerías o los cronogramas de pago. No es un
descuido: son el pie o el cierre por defecto de una plantilla del catálogo, y una variante de Plus
en la composición base la volvería imposible de montar para un cliente de Esencial.

Con la sexta estructura —`silk`— la cuenta se disparó: llegó pidiendo once bloques y solo tres
tenían una variante libre para boda y para XV (`welcome.countdown`, `location.single-card` y
`gallery.mosaic`). Los otros ocho se escribieron —`hero.card`, `story.mounted`, `schedule.cards`,
`details.stack`, `dresscode.swatches`, `rsvp.raised`, `closing.note` y `footer.seal`—, y no como
variaciones de las que ya había: esta estructura se arma **por planos** —casi cada sección es una
pieza de papel apoyada sobre otra cosa, con su canto y su sombra— y ninguna de las existentes
componía así. En el único bloque donde sí quedaba algo libre (`rsvp.ticket`, un pase troquelado) la
pieza era de otra familia visual, y forzarla habría metido un recurso de feria en una papelería de
tarde-noche.

Es el aviso de que la regla tiene un coste creciente, y es el que se quiere: **la séptima
estructura tendrá que traer casi una biblioteca entera**, así que más vale que exista por una razón
de composición y no porque apetezca otra paleta. Para eso está el tema, que no es exclusivo de
nadie.

Y así fue. `monochrome` —papel blanco, fotografía en blanco y negro y la caligrafía como único
ornamento— trajo nueve: `hero.script`, `story.greeting`, `calendar.sheet`, `schedule.hours`,
`location.single-open`, `dresscode.discs`, `details.notes`, `rsvp.hairline`, `closing.script` y
`footer.rule`. De los doce bloques que lleva, solo dos se pudieron reutilizar
(`welcome.monogram` y `gallery.carousel`).

Lo importante es que la regla **no fue el motivo**, solo la ocasión. Ocho de las nueve nacen de
quitarle a su bloque la pieza gráfica que daba por supuesta —el medallón de los detalles, la
cápsula del plazo, la tarjeta de la sede, el filete completo del cronograma, la franja del
calendario, el monograma del pie—, y ninguna de las que había podía hacer eso sin dejar de ser lo
que era. La novena, `calendar.sheet`, es la excepción y la más valiosa: el calendario llevaba **un
solo diseño desde que existe el bloque**, y aquí se supo por fin qué distingue a dos —la lámina
impresa contra la hoja de agenda—, que era exactamente la condición que el registro se había
puesto para escribir el segundo.

La lección para la octava estructura es esa: si las variantes nuevas salen de una idea que se
puede escribir en una frase —«esta no tiene ni una caja»—, el lote entero se sostiene y cada pieza
sirve además a quien venga después. Si salen de «hacía falta una libre», son relleno.

Y la octava, `sketch`, es la que enseña la otra mitad: trajo ocho variantes pero **reutilizó cuatro
bloques enteros** —`welcome.band`, `schedule.ribbon`, `gallery.mosaic` y `rsvp.ticket`—, y no por
suerte. La cinta con lazos era ya el cronograma dibujado del catálogo y el pase troquelado su única
confirmación recortada: piezas de la misma familia visual, escritas años antes, que estaban libres
porque ninguna estructura las había reclamado. La cuenta no crece sola, entonces: crece cuando la
plantilla nueva no se parece a nada de lo que hay.

La novena, `gala`, añade el tercer camino: **acotar el tipo de evento**. Al ofrecerse solo para XV
solo compite con las otras ocho en «quince», y eso le permitió llevarse `welcome.crown` —la puerta
con corona, libre desde que se escribió— y `gallery.parallax`. Nueve variantes nuevas siguen siendo
nueve, pero ninguna nació de un hueco: todas salen de la misma restricción, que es la que impone un
papel oscuro —ni tarjetas claras, ni franjas de color, ni sombras—, y de la única respuesta que
queda entonces: **el filete dorado**.

## Rehacer una variante o escribir otra

La pregunta llega en cuanto una plantilla ya montada tiene que cambiar de aspecto en un bloque, y
se responde mirando **quién más la usa**, no quién la pidió:

- **Solo la usa la plantilla que quiere el cambio** → se rehace en su sitio, conservando el
  `registry_id`. Es lo que se hizo con `calendar.sheet`: nació como una hoja con el mes entero y
  hoy es una tira de siete días. Nadie más la tenía asignada, así que rehacerla no cambió ninguna
  otra invitación.
- **La usa otra plantilla, o es una pieza del catálogo con identidad propia** → se escribe una
  nueva y la plantilla cambia de asignación. Es lo que se hizo al sustituir `gallery.mosaic` por
  `gallery.offset` en `silk`: el mosaico es una galería del catálogo desde hace tiempo, cualquier
  cliente de Plus puede tenerla elegida en su evento, y rehacerla les habría cambiado la sección
  sin que nadie se lo pidiera.

El criterio de fondo es el mismo del `registry_id`: la cadena guardada en `event_blocks` es un
contrato con las invitaciones ya repartidas. Rehacer una variante **es** cambiarle el diseño a
todo el que la tenga puesta, y eso solo es aceptable cuando ese conjunto es exactamente la
plantilla que lo está pidiendo.

Renombrar el identificador de una variante rehecha no compensa: obliga a reapuntar los bloques que
la usan y a borrar la fila vieja (ver `RETIRED_VARIANTS`), y lo que se lee en el panel es el
**nombre**, que sí se actualiza. Por eso `calendar.sheet` se sigue llamando así aunque ya no sea
una hoja.

## Añadir una variante

1. **Escribir el componente** en `blocks/<bloque>/`. Recibe las props de ese bloque —solo
   `content`— y se pinta con utilidades `*-inv-*` de Tailwind: `bg-inv-bg`, `text-inv-ink`,
   `font-inv-display`, `rounded-inv-md`. Nunca colores literales: eso ataría la variante a un
   tema.
2. **Registrarla** en `registry/component-registry.ts`, una línea:
   `'hero.poster': { blockKey: 'hero', component: HeroPoster }`.
3. **Darla de alta** en `scripts/seed.ts`, en `VARIANTS`, y correr `npm run db:seed`.
   `registry_id` lo genera Postgres a partir de `block_key` y `variant_key`; no se escribe.
4. **Verla** en `/admin/componentes`, en la pestaña de su bloque. Las variantes con componente
   registrado llevan botón «Ver ejemplo»; las que solo están en la base de datos, no — y esa
   diferencia es el aviso de que asignarla a un evento dejaría el bloque sin pintar.

Y si además va a entrar en la composición de una plantilla, **comprobar que no la use ya otra del
mismo tipo de evento**: ver la sección anterior. El seed lo verifica solo.

Nada más se toca. No hay ningún `if` de variante en ninguna parte, y añadir la cuarta portada
no cambia una línea del motor de render.

## Un símbolo y una ilustración no son la misma pieza

En `shared/paper-ornaments.tsx` hay dos coronas, y en el catálogo dos anillos. No es duplicación:
es que un dibujo pensado para treinta píxeles y otro pensado para cinco centímetros **no pueden
ser el mismo trazo**.

  `CrownGlyph` / `RingsGlyph`     símbolos: pocas líneas, trazo grueso, ningún detalle. Se ven
                                  junto a un rótulo, y ahí un adorno de más es una mancha.
  `TiaraGlyph` / `WeddingRings`   ilustraciones: curvas, filigrana, perlas, trazo fino. Ocupan una
                                  parte de la pantalla, y ahí la falta de detalle se ve pobre.

La prueba es directa: agrandar el símbolo deja un zigzag, y encoger la ilustración deja un borrón.
Cada uno declara en su cabecera para qué tamaño está dibujado, y esa es la pregunta que hay que
hacerse antes de añadir el tercero.

## Los iconos

Todos vienen de **lucide-react**, no de `@ant-design/icons`, y no es inercia: los de antd son
sólidos y de trazo grueso —hechos para una interfaz densa— y junto a una tipografía fina de
invitación se ven pesados; lucide es de trazo, hereda el grosor y el color del texto y ya está
en el proyecto, así que no añade un segundo paquete de iconos al que se descarga un invitado.

El vocabulario es **uno solo para toda la invitación** (`blockIconSchema`, en el dominio):
«brindis» es la misma idea en detalles y en cronograma, y con dos catálogos acabarían con dos
dibujos distintos en la misma página. El contenido guarda una **clave** (`icon: 'gift'`) y el
mapa a dibujos vive en un único archivo, `shared/block-icons.ts`: cambiar de librería de iconos
—o darle a un tema su propio juego, como contempla `PROJECT.md`— es reescribir ese mapa, sin
tocar ni un evento guardado.

## Las fotografías son opcionales, y el componente se adapta

No existe una variante «con foto» y otra «sin foto». Cada componente sabe componerse de las
dos maneras, y esa es una regla del catálogo, no una casualidad:

- Multiplicar variantes por la presencia de una foto daría ocho entradas para cuatro diseños,
  y el admin tendría que reasignar la variante el día que llegan las fotos.
- Los eventos se arman **antes** de tener el material. Un componente que solo se ve bien con
  fotografía se ve mal durante las tres semanas en que se está configurando.

La foto es del **bloque**: la historia tiene una imagen y los detalles tienen una imagen. Las
ocho variantes de esos dos bloques se recomponen cuando falta, cada una a su manera —la lista
de detalles pasa de dos columnas a una, la historia partida se convierte en una columna de
texto—, y ninguna deja un hueco.

**El cronograma no lleva fotografías.** Es el único bloque sin ellas, y es una decisión: una
miniatura por hito compite con la hora —que es el dato— y en ocho momentos la sección se vuelve
una galería desordenada con horas encima. Para las fotos está el bloque de galería.

Lo que el cronograma sí tiene es un interruptor de **marca**: `marker: 'icon' | 'dot'`. Con
iconos, cada momento se distingue de un vistazo, y eso vale cuando son de tipos distintos —misa,
comida, baile—. Con puntos, la sección se vuelve una secuencia sobria donde lo único que destaca
es la hora, que es lo que pide una invitación formal y lo que salva a un cronograma de doce
momentos parecidos. El icono de cada hito **se guarda igual en los dos modos**, así que cambiar
de modo es un interruptor y no volver a elegir doce iconos.

## La galería es el único bloque de cliente

Portada, historia, detalles y cronograma se renderizan en el servidor: llegan pintados en el
HTML y no dependen de que se ejecute JavaScript. Las cinco galerías, no, y la razón es el
visor: ampliar una foto necesita estado y teclado. El coste está justificado —en un móvil las
fotos se ven a 160px y poder ampliarlas es la mitad del bloque— pero conviene tenerlo presente
al añadir bloques: `'use client'` es una decisión, no el punto de partida.

`gallery.parallax` depende además de la posición de desplazamiento de la **página**. Dentro de
la previsualización del panel —un contenedor que se desplaza por su cuenta— las fotos se quedan
quietas; en la invitación real el efecto se ve entero. El resto de galerías no tienen esa
limitación: el carrusel gira solo y las otras tres entran escalonadas al aparecer.

### La pasarela, por dentro

Es una **fila continua a todo el ancho**, no un carrusel de pasos: las fotos cruzan la pantalla
de derecha a izquierda sin parar, y detrás de la última viene otra vez la primera.

El bucle no tiene truco de recolocación. La fila se pinta **dos veces** y lo que se desplaza es
la tira entera; cuando el recorrido llega al ancho de una copia, la posición vuelve a cero — y
como la segunda copia está exactamente donde estaba la primera, el salto cae en un fotograma en
el que la pantalla enseña lo mismo. El ancho de la copia se **mide** con un `ResizeObserver`,
porque las fotos tienen proporciones distintas y la tira cambia de largo al cargar las imágenes
o al girar el teléfono.

El movimiento va por `requestAnimationFrame` sobre un valor de movimiento, no con una animación
de duración fija. Es lo que permite que el avance automático y el arrastre sean **lo mismo**:
los dos suman al mismo desplazamiento. Con una animación declarada habría que pausarla, calcular
dónde se quedó y relanzarla — que es de donde salen los tirones. Al soltar, la tira sigue con la
inercia del gesto y se frena sola.

Se detiene al pasar el ratón, al enfocar con el teclado, mientras se arrastra y con una foto
ampliada abierta. Con `prefers-reduced-motion` no avanza sola: quedan el arrastre y las flechas,
que **empujan** la tira en lugar de saltar de foto en foto. Por eso tampoco hay contador: en una
pasarela continua no existe una foto «actual».

El alto es fijo y el ancho lo pone la proporción de cada fotografía, así que las verticales
pasan estrechas y las apaisadas ocupan más, como si estuvieran colgadas. La separación va como
margen de cada foto y no como `gap` del contenedor: con `gap` faltaría justo un hueco entre la
última foto de una copia y la primera de la siguiente, y sería un tirón por vuelta.

### El desorden de la polaroid

Los ángulos y las alturas se derivan de la **posición** de cada foto, nunca de un número al
azar. Con azar de verdad la composición cambiaría en cada recarga y daría distinto en el
servidor y en el cliente — un error de hidratación de manual. Los ángulos van escritos como
clases completas (`rotate-[-2.5deg]`) y no compuestos al vuelo: Tailwind genera el CSS leyendo
el código fuente, y una clase construida con una plantilla no aparece en ningún sitio que pueda
leer, así que saldrían todas rectas.

## Una sede o dos: diez componentes, un contrato

El bloque de ubicación tiene **siete componentes pensados para una sede y tres para dos**. Es
una intención de diseño, no una restricción: los diez pintan todas las sedes que traiga el
evento. Asignar `location.single` a una boda con templo y salón las enseña las dos, apiladas —
nunca esconde una. Es la regla de la biblioteca: cambiar de componente jamás pierde contenido.

El nombre es un consejo, y merece la pena comprobar el consejo al revés en el panel: abrir
`location.single` con el ejemplo de dos sedes y `location.dual-venue` con el de una. Cómo se
degradan es lo que dice si el nombre ayuda o engaña. `single-plate` es el caso más claro: con dos
sedes repite lámina y ficha, se lee perfectamente, y aun así lo que casi siempre se quiere con dos
sitios es compararlos de un vistazo.

**No se incrusta ningún mapa.** Un iframe de Google Maps pesa cientos de kilobytes, tarda en
pintar, mete rastreadores de un tercero en una invitación privada y exige clave de API con
facturación. Un enlace abre la aplicación de mapas que el invitado ya tiene, con su cuenta y su
navegación por voz. La dirección va además **escrita**: se lee en voz alta al taxista, se copia,
y sigue ahí cuando el móvil se queda sin datos a mitad de camino.

## La confirmación: dos caminos que no son dos variantes

El botón de confirmar puede ir a dos sitios:

- **`whatsapp`** — abre el chat del organizador con el mensaje ya escrito. No se guarda nada; la
  respuesta llega a un teléfono y alguien la marca después en el panel. Es el plan básico.
- **`managed`** — la plataforma registra la confirmación y el panel se entera solo. Es el plan
  superior.

Eso **no** son dos componentes. `PROJECT.md` prohíbe que un componente ramifique por plan, y si
el camino fuera una entrada del registro sería eso mismo disfrazado: el catálogo tendría el doble
de entradas y elegir diseño y elegir mecanismo serían la misma decisión, cuando son dos. Aquí el
destino es **contenido** (`destination`, una unión discriminada), los tres componentes lo
obedecen, y **quién puede elegir `managed` lo decide el plan donde se guarda —en el panel—, no
donde se pinta**.

Por eso `rsvp.whatsapp` y `rsvp.form` se **retiraron** del catálogo: eran mecanismos disfrazados
de diseños. Borrarlas no es un `DELETE`: `event_blocks.variant_id` las referencia con `ON DELETE
RESTRICT` —a propósito, para que ninguna invitación publicada apunte a una variante inexistente—,
así que el seed **reapunta** primero los bloques que las usaran a `rsvp.card` y solo después
borra. Ese orden está en `RETIRED_VARIANTS`, y es el camino para dar de baja cualquier variante
en el futuro.

### Los nueve formatos

`card` (sobria), `panel` (franja de color, la insistente), `ticket` (pase troquelado),
`reply-card` (la tarjeta de respuesta que venía dentro del sobre, con doble filete y renglones),
`postcard` (el reverso de una postal, con sello torcido y matasellos), `torn` (franja de papel
rasgado con un velo del color del tema), `raised` (la tarjeta encimada entre el papel y la banda
del final: la fotografía si la hay, el color principal si no) `hairline` (un filete, el rótulo y
el botón, sin ninguna pieza alrededor) y `engraved` (un cartucho de doble filete, sin fondo
propio: el que funciona sobre un papel oscuro).

`torn`, `postcard`, `reply-card` y `ticket` son papelería reproducida. Ninguno pide el nombre ni
cuántos van, y eso es una decisión, no una carencia: ver abajo.

`torn` y `panel` son la misma insistencia con dos volúmenes: aquella cambia el fondo al color pleno
del tema, esta lo tiñe al 15 % y se rompe por los cantos. La segunda es la que conviene cuando la
invitación ya lleva una franja de color —dos franjas plenas del mismo color se anulan y ninguna
destaca—. El velo va como **capa** encima del `bg-inv-bg` de la sección y no como fondo de la
sección: un color translúcido en el fondo se compondría contra el fondo del documento, no contra el
papel del tema, y en un tema oscuro dejaría una franja clara entre secciones oscuras.

### La personalización por familia: dónde NO va

Más adelante, en el plan superior, cada familia recibirá su enlace y el bloque podrá saludarla
por su nombre —«Familia Robles Cámara · 4 lugares»— con el cupo que el organizador cargue en la
lista de invitados de su panel (`guest_groups` y `guests` ya están modelados).

Ese dato **no es contenido del bloque**. `event_blocks.config` guarda lo que es igual para todos
los invitados de un evento; el nombre de quien mira cambia con cada enlace. Meterlo ahí obligaría
a una configuración por familia, que es justo lo que la tabla de invitados evita. Cuando llegue
entrará como **contexto de quien visita** —igual que la pasarela de confirmación—, resuelto en el
servidor desde el código del enlace: los componentes lo leerán con un hook y el contrato de
contenido no cambia.

Mientras tanto, `reply-card` y `postcard` dejan ese hueco **vacío y no dibujado**. Unos renglones
de relleno en una pantalla no se leen como «aquí se escribe», se leen como algo que no cargó. El
aire está reservado —en la postal el botón se empuja al pie con `mt-auto`— así que añadirlo será
escribir una línea, no recomponer nada.

### El estado de `managed`

El registro todavía no existe. Los componentes ya están terminados: piden la confirmación a la
pasarela de `rsvp-gateway.ts`, un único punto de conexión. Sin pasarela conectada responde **«no
disponible»** y el bloque lo dice, en lugar de fingir que guardó algo — que es el peor fallo
posible en el único sitio donde alguien confía en que su respuesta llegó. La previsualización del
panel conecta una simulada para poder juzgar los estados; ese archivo vive en `demo/` y no puede
colarse en la invitación.

## El cierre y el pie: dónde está el movimiento

Los dos bloques finales son los únicos que se permiten un gesto, y cada uno el suyo:

- **`closing.letter`** entra plegada y se despliega sobre su borde superior cuando la sección
  aparece, con el sello cayendo después y con un punto de rebote. Es perspectiva más un giro en
  X con el origen arriba: literalmente una hoja abatiéndose. Una invitación digital pierde el
  gesto de abrir la de papel, y este es el sitio donde devolverlo — al final, cuando ya se leyó
  todo lo demás.
- **`closing.envelope`** no se mueve, y es el otro extremo del mismo problema: recupera el sobre.
  La solapa abierta se dibuja detrás, la tarjeta encima y el cuerpo del sobre encima de la tarjeta,
  y ese orden es lo que la mete *dentro* en lugar de *delante*. En la tarjeta va lo último que hace
  falta de una invitación —a quién preguntar—, y por eso su acción no es el botón sólido de
  `ActionLink`: dentro de una tarjeta de papel se vería como un elemento de interfaz pegado en una
  ilustración, y lo que se quiere de un teléfono es que se lea grande y se pueda copiar.
- **`footer.marquee`** repite el nombre en cuerpo de cartel dentro de una cinta que se desplaza.
  Dos copias y un desplazamiento de la mitad, **en CSS**: sin JavaScript, sin hidratación, y el
  pie sigue siendo un componente de servidor. La cinta va marcada como decorativa y el nombre se
  expone una sola vez para lectura asistida — repetir por diseño no es repetir por descuido.

Los dos respetan `prefers-reduced-motion`: la carta aparece ya abierta y la cinta se queda
quieta, sin perder ni una pieza de la composición.

Los otros tres no se mueven, y su gesto es de **material**:

- **`closing.album`** trata la fotografía como un objeto pegado y no como fondo ni como columna:
  montada sobre la hoja con cuatro esquineras y torcida grado y medio. La inclinación va en el
  montaje y nunca en la fotografía —girar solo la foto dentro de un marco recto deja cuñas de papel
  en las esquinas—, y pasados los tres grados deja de leerse como un descuido y empieza a leerse
  como un efecto.
- **`footer.colophon`** cierra como una revista: filete grueso con uno fino debajo —la marca
  tipográfica de «aquí acabó lo que se estaba leyendo», que con un solo trazo se leería como una
  separación entre secciones— y tres columnas separadas por corondeles. Los corondeles hacen el
  trabajo de las etiquetas, y eso no es estilo: **ninguna variante escribe copia**, así que rotular
  los campos «Fecha» o «Ciudad» ataría el pie a un idioma.
- **`footer.sprig`** no es «el centrado con hojitas»: lo que cambia es el soporte. Es *otra hoja*,
  con un velo de `primary` al 10 % y rasgada por el canto de arriba, que es el mismo material con
  el que la plantilla Botanical abre. Sin monograma no deja dos ramas enfrentadas alrededor de un
  hueco —eso se lee como una pieza que no cargó—: pone una sola, centrada.

## La bienvenida: el único bloque que no es una sección

`welcome` tapa la invitación entera hasta que el invitado pulsa. No se desplaza, no ocupa sitio
en el flujo de la página y desaparece para no volver. Es de **plan Premium**: cuelga de la
funcionalidad `pantalla_bienvenida`, que solo tiene Premium, y sus tres variantes van además con
`minPlanRank: 2`.

Que sea un bloque y no una variante de portada es deliberado. Una portada es la primera sección
de un documento que se lee de arriba abajo; esto es una puerta. Como variante de `hero`
prometería una cosa y haría otra, y el catálogo no podría venderla por separado.

### Dónde está el comportamiento

Todo en `WelcomeShell`, y las tres variantes son Componentes de Servidor sin una línea de
estado. Es lo que hace este cascarón:

- **Bloquea el desplazamiento** de la página mientras la puerta está puesta (clase
  `inv-gate-locked` en `<html>`), y lo mantiene mientras el telón sube.
- **Retiene el foco**: `role="dialog"`, `aria-modal`, el foco entra en el contenedor —no en el
  botón, que le pintaría el anillo a todo el mundo— y el tabulador no sale.
- **Escape también abre.** Es la salida que espera quien navega con teclado.
- **Se quita al terminar la animación** (`animationend`), con un temporizador de respaldo por si
  ese aviso no llega nunca: el peor fallo de este bloque sería una invitación que no se abre.
- **Sin JavaScript no hay puerta.** Un `<noscript>` la esconde: el botón no puede funcionar, y
  dejarla puesta convertiría la invitación en una pantalla muerta.

Si hiciera falta un disparador nuevo —un gesto de deslizar, por ejemplo— se añade aquí y las
diez variantes lo heredan.

### Diez variantes, y por qué son diez

Ocho salen de referencias reales que trajo el cliente. No son variaciones de una misma idea: cada
una es un **lenguaje de papelería** distinto —grabado, monograma, rótulo luminoso, botánica, papel
rasgado, banda de color, cuenta atrás— y por eso justifican una entrada del catálogo en lugar de
un parámetro. Todas cumplen el mismo contrato y ninguna pregunta por el tipo de evento: lo que
hace que `welcome.monogram` pinte «A & D» en una boda y una sola inicial en unos XV es la **forma
del nombre** (`welcome-name.ts`), no una condición sobre el evento.

Los dibujos —filigrana, ramas, alianzas, el canto roto— son SVG en línea con `currentColor`, no
archivos: un PNG dorado se vería mal en cuanto alguien eligiera el tema verde, y habría que
mantener una copia por tema.

### La trampa del `<button>` sin preflight

`globals.css` importa Tailwind **sin preflight** —está explicado allí— y eso tiene una
consecuencia que no se ve venir: un `<button>` conserva el fondo `buttonface` y el borde en
relieve del sistema operativo. Una variante que solo le pusiera un borde salía como una caja gris
clara pegada sobre la fotografía, y en un tema oscuro —donde `ink` es claro— con el texto encima
invisible.

Por eso `WelcomeOpenButton` empieza por apagar eso (`appearance-none border-0 bg-transparent`) y
se viste con `actionClasses`, el mismo aspecto que el botón de confirmar asistencia. Lo mismo vale
para cualquier `<button>` nuevo de la invitación: **si no le pones fondo, el sistema le pone el
suyo**.

### La fotografía es un hermano, no un fondo tapado

En `welcome.torn` y `welcome.band` la imagen empezó como fondo de la puerta entera, con el papel o
la banda encima. Se veía mal por una razón concreta: `object-cover` encuadra contra **su
contenedor**, así que la foto se recortaba pensando en la pantalla completa y luego se tapaba la
mitad — el resultado era una pareja sin cabeza. Cuando una variante reparte la pantalla en zonas,
la imagen va **dentro de su zona**, y el recorte va centrado: anclarlo arriba evita cortar cabezas
pero llena la franja del aire que toda foto de estudio tiene encima del sujeto. En un retrato el
sujeto está en el centro, que es donde lo pone quien encuadra.

### Móvil primero, y qué significa aquí

Estas pantallas se ven casi siempre en un teléfono en vertical, así que los cuerpos de letra
parten de `clamp()` con `vw`, los ornamentos encogen antes de recortarse y las composiciones son
pilas, no columnas. Y como la puerta mide exactamente lo que mide la pantalla, el contenido lleva
`overflow-y-auto`: en un teléfono pequeño —o con el cuerpo de letra del sistema subido— lo que
sobra se puede alcanzar en lugar de quedar cortado, que es como se pierde el botón de abrir.

### La transición

El telón **sube**, no se desvanece: algo que se desvanece desaparece y deja la sensación de que
había una capa de más; algo que sube se aparta. El contenido se va antes y más corto que el
telón (`inv-gate-content-out`), y ese desfase es lo que hace que el papel parezca pesar en vez
de deslizarse como una diapositiva.

La duración y la curva son un token del tema (`motion.gate`), así que un tema puede tener una
apertura más lenta sin tocar un componente. Con `prefers-reduced-motion` se cambia por un
fundido de 220 ms — reducido, **no** anulado: sin animación no llegaría el `animationend` y la
puerta se quedaría puesta.

## La plantilla Botanical: el calendario, la vestimenta y el papel rasgado

`botanical` es la quinta estructura del catálogo y la que trajo dos bloques nuevos. Es la
invitación de **papelería**: informa —cuándo, a qué hora, dónde, de qué vestirse— y no cuenta
nada. Es la única de las cinco sin historia y sin galería, y eso la define tanto como sus
variantes: se lee entera de una pasada. Quien quiere narrar tiene `storytelling`; quien quiere
enseñar fotos, `cinematic`.

Su composición, en orden: puerta rasgada → portada enmarcada → **calendario** → itinerario →
sede con lámina → **código de vestimenta** → confirmación en papel rasgado → sobre → pie.

### Los dos bloques nuevos, y por qué son bloques

Ninguno de los dos cabía en un bloque existente, y la frontera entre bloques es siempre la misma:
**el contrato de contenido**, no el tamaño de la sección ni el sitio de la página.

- **`calendar`** guarda un instante y una frase, y de ese instante sale el mes entero. En el
  bloque de detalles habría obligado a que `DetailsContent` llevara una fecha que las otras cuatro
  variantes no usan, y a que quien configura entendiera que un «detalle» a veces pinta un mes. El
  mes **no se escribe**: `domain/invitation/month-grid.ts` lo calcula, porque un `monthLabel` a
  mano se desincroniza el primer día que el evento cambia de fecha, y entonces el cronograma dice
  junio y el calendario sigue marcando mayo.
- **`dresscode`** guarda una lista de colores, y los colores no caben en `DetailItem`. Con el
  bloque de detalles quedaban dos salidas y las dos malas: escribir los tonos en la descripción
  —o sea, otra vez palabras, que es justo lo que la sección viene a resolver— o meter una paleta en
  un contrato que comparten cuatro variantes que no la pintarían. El código de vestimenta que **sí**
  es un detalle —«Etiqueta rigurosa» con su icono de camisa— sigue siendo un detalle.

Los dos comparten una decisión sobre accesibilidad que conviene no deshacer:

- La retícula del mes va marcada como **decorativa** y la fecha se anuncia como la frase que el
  organizador escribió (`dateLabel`). Leídos en voz alta, treinta y un números seguidos no son
  información: son ruido del que hay que salir para llegar a la sección siguiente. Es el mismo
  criterio que la retícula de fecha de `hero.portrait`.
- La fila de muestras es información **solo si los colores tienen nombre**, y entonces cada
  muestra anuncia el suyo. Sin nombres se marca decorativa: un lector de pantalla no puede decir
  «#7d8b6a» de forma útil. Por eso `label` está en el contrato aunque casi ninguna papelería nombre
  sus colores — es la diferencia entre una sección que informa a todo el mundo y una que informa a
  quien puede verla.

### El canto rasgado es del componente, no del tema

Las franjas de esta plantilla —el calendario y `rsvp.torn`— no se despiden del papel con la onda
de `BlockCurve`: se rompen. El dibujo está en `shared/paper-ornaments.tsx` y lo coloca el
componente, **no** el tema, y esa es la excepción a la regla de que el canto de una franja es un
token:

- La onda de `BlockCurve` es una preferencia del tema —«este tema redondea»— y se aplica a los
  cuatro bloques que cambian el fondo de la sección.
- La rasgadura es la **firma de estas variantes**. Un `rsvp.torn` con el canto recto no es un
  `rsvp.torn`: es un `rsvp.panel` con otro color. Igual que el lazo de `schedule.ribbon`, que
  tampoco depende del tema.

De ahí que el tema `olive` lleve `edge.height: 0px`. No es el corte a escuadra de «elegance»: es
que si la onda del tema y la rasgadura del componente se pintaran en el mismo borde, saldrían dos
cantos peleándose. Cada franja tiene un canto, y lo elige quien lo dibuja.

Es además el mismo dibujo arriba y abajo, girado media vuelta —al contrario que `BlockCurve`, que
tiene dos trazos distintos a propósito—. Al girar, la rasgadura se refleja en los dos ejes y los
picos no coinciden: un troquel simétrico se notaría, una rasgadura reflejada no.

### Versalitas espaciadas: `titleCase`

El registro tipográfico de esta plantilla son los rótulos grabados —«DRESS CODE», «CONTACTS»— y
eso vive en `BlockHeading` (`titleCase: 'caps'`) y en `VenueFacts` (`nameCase: 'caps'`), no en cada
variante. Son tres decisiones inseparables: mayúsculas, cuerpo más bajo y tracking abierto. Una
línea de mayúsculas del mismo cuerpo que un título en caja mixta pesa el doble, y sin espaciar se
lee como señalética. Escritas como clases sueltas en seis variantes, la sexta habría acabado con
otro tracking.

## Añadir un bloque

Un bloque nuevo —galería, ubicación— cuesta más que una variante, y a propósito: es un
contrato de contenido nuevo. Además de lo anterior hay que escribir su esquema en
`domain/invitation/blocks/`, añadir su miembro a la unión `RegisteredComponent`, sus ejemplos
en `demo/` y su caso en `BlockDemo`. Los tres últimos los **exige el compilador**: la unión es
discriminada y el `switch` termina en una comprobación de exhaustividad, así que un bloque a
medio conectar no llega a ejecutarse. Conviene además darle su sitio en `block-order.ts` y su
icono en `dashboard/admin/block-icons.tsx`; sin ellos aparece el último y con un icono
genérico, pero nada se rompe.

## Añadir un tema

Un tema **solo cambia apariencia**. Se da de alta en `THEMES`, en `scripts/seed.ts`, con los
tokens de `domain/invitation/theme.ts`, y se corre `npm run db:seed`.

Los colores se nombran por su **papel**, no por lo que son: `primary` es «el color con el que
este tema afirma», sea morado o dorado. Por eso una variante escrita hoy funciona con un tema
que no existe todavía. Todo token es opcional: un tema que solo cambia dos colores hereda el
resto de la base.

Las tipografías apuntan a las variables de `next/font` que publica `app/layout.tsx`
(`--font-cormorant`, `--font-jost`, `--font-sacramento`, `--font-bebas`). Una familia escrita a
pelo no está instalada en el teléfono de nadie y acaba cayendo en la fuente del sistema.

## Cómo se aplica un tema

`ThemeScope` cuelga los tokens como variables `--inv-*` en un contenedor. `globals.css` las
puentea a Tailwind con `@theme inline`, así que `bg-inv-primary` emite
`background-color: var(--inv-color-primary)` y el color lo resuelve el navegador contra el
ámbito más cercano.

### El canto de las franjas

Los cuatro bloques que cambian el fondo de la sección entera —`details.panel`, `rsvp.panel`,
`closing.horizon` y `footer.ribbon`— no cortan la página con una recta: el papel les muerde el
canto con una onda ancha, como un troquel. La altura de esa onda es un token (`edge.height`) y el
dibujo está en `shared/BlockCurve.tsx`, con el mismo reparto que el ornamento: **el tema decide
cuánto y el código decide qué**.

A cero no hay onda, y es como «elegance», «minimal», «royal» y «corporate» conservan su corte a
escuadra sin una sola condición en el código. La curvan «floral», «dreamy» y el tema base — el
mismo criterio que sus radios: quien redondea las esquinas quiere el canto blando. «olive» también
la deja a cero, pero por otro motivo: sus franjas se rompen con el canto rasgado que dibuja el
propio componente, y dos cantos en el mismo borde se pelearían. Ver «La plantilla Botanical».

Dos consecuencias prácticas:

- La onda se pinta **por dentro** de la franja y del color del papel, no del color de la franja
  asomando por fuera. Hacia fuera dependería de que la sección siguiente no la tapara, y las
  franjas llevan `isolate` por el velo de la fotografía: el fondo de la siguiente ganaría. Por
  dentro muerde también la fotografía de fondo, que es lo que hace falta.
- Como ocupa sitio, cada franja suma `var(--inv-edge-height,0px)` a su relleno vertical. El pie
  en cinta lo suma en su `BlockContainer` y no en la sección, porque ahí el `py-…` que ya trae
  `BlockSection` no lo retira `twMerge` —un `pt-…` solo lo cubre a medias— y quedarían dos
  declaraciones de relleno peleándose por el orden de la hoja.

### El contraste lo garantiza el tema, no el componente

Al leer un tema se comprueban dos parejas y **se reparan si no se leen**: `onPrimary` sobre
`primary` —el panel de detalles, el pie en cinta y el botón de confirmar— e `ink` sobre
`background`. Si el contraste no llega a 4.5:1 (WCAG AA para texto normal), se sustituye por el
color de la propia paleta que mejor contraste dé, y solo se recurre al blanco o al casi negro
cuando ninguno de la paleta sirve.

Y se **deriva** una tercera tinta que ningún tema escribe: `onPhoto`, la que se lee encima de una
fotografía.

#### Por qué hizo falta separarla de `onPrimary`

Porque son dos fondos distintos y durante mucho tiempo se pintaron con el mismo token. `onPrimary`
es «lo que se lee sobre el color principal», y cuando ese color es un tono medio la reparación
hace lo correcto: en «dreamy», con su morado, ningún claro del tema llega a 4,5:1 y el token acaba
resuelto a **#111111**. Negro sobre morado se lee perfectamente.

El texto de una portada, en cambio, no está sobre el color principal: está sobre una **fotografía
velada**, y ese fondo es siempre oscuro porque el velo lo garantiza. Ahí el mismo #111111 es
invisible. El fallo salió en la puerta de `storytelling-xv` —la demo vestida con «dreamy»— pero
afectaba a todo lo que se apoya en una foto: las bienvenidas, cuatro portadas, el cierre a
pantalla completa y la sede a sangre. Con los otros diez temas no se veía, porque en ellos la
reparación acaba dando un claro.

`onPhoto` se elige entre los claros del propio tema —superficie, papel, tinta— midiendo contra el
velo: en un tema claro sale la superficie, y en uno oscuro, donde superficie y papel son oscuros,
sale la tinta, que ahí es la clara (el marfil de «royal», el crema de «emerald»). No es un blanco
fijo: lo sigue poniendo el tema.

#### Y se aplica sin tocar los componentes

La clase `.inv-on-photo` —que ya marcaba «esto va sobre una foto» para ponerle sombra— redefine
dentro de su subárbol la variable `--inv-color-on-primary`. Como las utilidades apuntan a la
variable y no a un valor congelado, todo lo que ya estaba escrito se reapunta solo: los
`text-inv-on-primary` de cada variante, el `tone="inverse"` de `BlockHeading` y el `tone="onImage"`
del botón y de la cuenta regresiva. La única variante que la condiciona es `rsvp.panel`, porque es
la única cuyo fondo es el color principal **o** una fotografía según el contenido.

Un tema bien escrito pasa por ahí sin que se le cambie nada. Uno mal escrito —un verde bonito
para el panel y la tinta que venía— sale legible igualmente, en lugar de con un botón que no se
ve. `inkSoft` y `accent` **no** se tocan: su contraste más bajo es deliberado y repararlos
borraría la jerarquía que el tema quiso.

La medida está en `domain/invitation/theme.ts` y `contrastRatio` se exporta para que el panel
pueda avisar al dar de alta un tema, que es donde conviene enterarse.

Dos consecuencias que conviene tener presentes:

- **Un bloque fuera de un `ThemeScope` se ve roto.** Es deliberado: no hay valores por defecto
  en `:root` que lo disimulen.
- **Cambiar de tema no re-renderiza nada.** Por eso el panel puede enseñar cuatro
  previsualizaciones con cuatro temas en la misma página, sin iframes.

## El motor de render

`/<slug>/<código>` monta la invitación desde la base de datos. Tres piezas, y ninguna sabe nada
de planes, temas ni variantes:

```
src/domain/invitation/
  blocks/block-content.ts   La unión «contenido + de qué bloque es». La comparten el motor y la demo.
  event-content.ts          El ensamblador: evento + config → el contenido de cada bloque.
src/components/invitation/
  InvitationBlock.tsx       Resuelve un registry_id contra el registro y lo pinta. El motor.
  InvitationRenderer.tsx    La invitación entera: tema, puerta, secciones y mandos flotantes.
  InvitationChrome.tsx      Música y volver arriba. Lo único que no es bloque ni tema.
src/infrastructure/repositories/drizzle-invitation-repository.ts
                            Carga evento, bloques, sedes, cronograma y fotos en la MISMA
                            transacción que abre el acceso — el contexto de tenant dura eso.
```

### El contenido vive una sola vez

**El evento guarda lo que es verdad del evento; el bloque guarda solo cómo lo cuenta.** El
nombre, la fecha, las sedes, el cronograma y las fotos están en `events` y en sus tres tablas
ordenadas; `event_blocks.config` guarda el rótulo de la sección, la introducción, la paleta de la
vestimenta o si el cronograma va con iconos o con puntos.

La composición es una sola regla, sin excepciones por bloque:

```ts
schema.safeParse({ ...projectFromEvent(source, blockKey), ...block.config })
```

El `config` **gana** sobre lo proyectado, así que escribir «Octubre 2026» donde la proyección
diría «Sábado 17 de octubre, 2026» no necesita ninguna condición: lo derivado es un punto de
partida, no una imposición.

Lo que se gana es lo que vende el producto: **cambiar de plantilla o añadir una sección no obliga
a recapturar nada**. Un evento que pasa de `classic` a `botanical` estrena un calendario que ya
sabe qué día es, porque el día nunca fue del bloque. Con el contenido completo dentro de cada
`config`, el nombre y la fecha estarían copiados en cinco sitios y corregir una errata sería
corregirla cinco veces — hasta que alguien se dejara uno.

Un bloque cuyo contenido no valida **se omite**, y no se lanza: pasa mientras alguien está
montando la invitación —falta el rótulo, la lista está vacía— y perder una sección es un daño
acotado. Una excepción dejaría la invitación en blanco para todos sus invitados. Es el criterio
de `parseInvitationTheme` y de `resolveComponent`.

### Dónde se aplica el plan

Al **guardar**, nunca al pintar. Lo hace el alta de eventos de `/admin`
(`DrizzleEventRepository.create`): al copiar la composición de la plantilla a `event_blocks`, un
bloque nace **apagado** si su funcionalidad no entra en el plan vendido o si la variante que trae
la plantilla exige un `min_plan_rank` mayor que el rango del plan. Se apaga en lugar de omitirse,
para que subir de plan sea encenderlo. Para cuando el motor recibe los bloques, la decisión está
tomada — y por eso no tiene ni un `if`.

### La hora del evento

`events.starts_at` es un instante absoluto y `time_zone` dice en qué huso vive. El repositorio los
junta con `zonedIsoInstant` y entrega la hora **local del evento** con su desfase pegado detrás.
Formatearla en UTC anunciaría el domingo una boda que es el sábado: las siete de la tarde en
Mérida es la una de la madrugada del día siguiente en UTC.

## Lo que falta

- **Alta y edición de eventos en `/admin`.** Hoy los eventos entran por `db:seed`. Es lo que
  cierra el flujo: crear, capturar contenido, ajustar bloques y publicar.
- **El bloque `gifts`** (mesa de regalos) y la música por catálogo: lo exclusivo del plan Plus.
- **La personalización por familia.** El motor ya reserva el hueco; ver «La confirmación».
