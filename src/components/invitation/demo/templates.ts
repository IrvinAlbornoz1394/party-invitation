import type { BlockContent } from '@/domain/invitation/blocks/block-content';
import type { BlockImage } from '@/domain/invitation/blocks/shared';
import type { RegisteredBlockKey } from '../registry/component-registry';
import { CALENDAR_SAMPLES } from './calendar-samples';
import { CLOSING_SAMPLES } from './closing-samples';
import { DETAILS_SAMPLES } from './details-samples';
import { DRESSCODE_SAMPLES } from './dresscode-samples';
import { FOOTER_SAMPLES } from './footer-samples';
import { GALLERY_SAMPLES } from './gallery-samples';
import { HERO_SAMPLES } from './hero-samples';
import { LOCATION_SAMPLES } from './location-samples';
import { RSVP_SAMPLES } from './rsvp-samples';
import { demoImage, QUINCE_PHOTOS, WEDDING_PHOTOS } from './photos';
import { pickSample } from './samples';
import { SCHEDULE_SAMPLES } from './schedule-samples';
import { STORY_SAMPLES } from './story-samples';
import { WELCOME_SAMPLES } from './welcome-samples';

/**
 * Las plantillas de demostración: invitaciones completas, armadas y **sin base de datos**.
 *
 * Son las que se enseñan en la página pública para que alguien pueda ver cómo queda una
 * invitación antes de comprar nada. Todo lo que hay aquí es local: el contenido, las fotos y la
 * elección de diseños. Un visitante que abre una demo no toca Postgres ni una sola vez, y eso
 * importa por dos motivos — la página de venta tiene que responder al instante y tiene que
 * seguir en pie aunque la base de datos esté caída.
 *
 * ## El contenido no se escribe aquí
 *
 * Sale de los ejemplos que ya alimentan la previsualización del panel (`*-samples.ts`), donde
 * cada bloque tiene tres eventos imaginarios con las mismas claves. Una plantilla es, entonces,
 * **una combinación**: un evento imaginario + un tema + una variante elegida por bloque.
 *
 * Eso evita el problema de todo catálogo de demos: que el texto de la demo y el que se usa para
 * probar los componentes se separen y acaben enseñando cosas distintas. Aquí solo hay un juego
 * de contenido, y arreglarlo lo arregla en los dos sitios.
 *
 * ## Por qué cada plantilla elige variantes distintas
 *
 * Porque si todas usaran `hero.classic` y `gallery.grid`, la página de plantillas enseñaría el
 * mismo diseño una vez tras otra con otras fotos. Lo que distingue a una plantilla de otra es
 * exactamente esto: qué variante lleva cada bloque y con qué tema se compone.
 */

/**
 * El contenido de un bloque, emparejado con su tipo.
 *
 * Es el tipo del dominio, no uno propio de la demo. Lo fue durante un tiempo, y esa era la
 * dependencia al revés: la invitación real necesita exactamente la misma unión —contenido que
 * sabe de qué bloque es— y no puede depender de que un archivo de ejemplos la declare.
 */
export type TemplateBlockContent = BlockContent;

/** Un bloque de una plantilla: su contenido, con qué variante se enseña y si se puede quitar. */
export type DemoTemplateBlock = TemplateBlockContent & {
  readonly defaultRegistryId: string;
  /**
   * Si el estudio deja **apagarlo** además de cambiarle la variante.
   *
   * No es el `is_required` del catálogo, aunque se parezca. Aquel dice qué bloques necesita una
   * plantilla para tener sentido; esto dice qué se puede comparar en el escaparate. Casi todos
   * los bloques son opcionales en el catálogo y aun así no tiene ningún interés enseñar una demo
   * sin galería: el visitante no está decidiendo eso.
   *
   * La bienvenida sí, y es la única por ahora — «con puerta» contra «sin puerta» es exactamente
   * la diferencia que separa a Premium de Esencial, y verla es el argumento de venta.
   */
  readonly removable?: boolean;
};

/**
 * La pista de fondo de una demo.
 *
 * Va en la plantilla y no como una constante suelta del escaparate porque la música es parte del
 * registro: un cartel a pantalla completa y una papelería de algodón no piden la misma canción. Hoy
 * todas comparten pista —hay un solo archivo en `public/music`— y el día que haya más, cambiarlo
 * es una línea por demo y no una refactorización.
 *
 * En una invitación de verdad esto sale de `events.music_url`, que ya existe. Aquí es contenido
 * local, como las fotos: el escaparate no consulta la base de datos.
 */
export interface DemoMusic {
  readonly url: string;
  /** Qué suena, para el `title` del mando. Es lo único que el visitante puede leer de la pista. */
  readonly title: string;
}

export interface DemoTemplate {
  readonly key: string;
  readonly name: string;
  /**
   * La estructura de la que sale, compartida con su hermana del otro tipo de evento.
   *
   * `botanical` y `botanical-xv` tienen la misma `structureKey`, y es lo que permite que el
   * selector de tipo del gestor salte de una a otra conservando la composición: cambiar de boda a
   * XV no debe cambiarte también la plantilla que estabas mirando.
   */
  readonly structureKey: string;
  /** Coincide con `event_types.key` en la base de datos. */
  readonly eventTypeKey: string;
  readonly eventTypeName: string;
  readonly tagline: string;
  /** El tema con el que se abre. El visitante puede cambiarlo en la demo. */
  readonly themeKey: string;
  /** La imagen de la tarjeta en la página pública. */
  readonly cover: BlockImage;
  /** La pista que suena al entrar. Ver {@link DemoMusic}. */
  readonly music: DemoMusic;
  readonly blocks: readonly DemoTemplateBlock[];
}

/**
 * Un bloque de la plantilla: cuál es y con qué variante se enseña.
 *
 * Es una **lista ordenada** y no un objeto por clave, y esa es la corrección que hace que las
 * cuatro plantillas se distingan de verdad: el orden de los bloques es la mitad de lo que define
 * una estructura. `cinematic` abre con la galería justo después de la portada y `classic` la pone
 * después de los datos — con un objeto por clave, las dos se habrían renderizado en el mismo
 * orden y solo se habrían diferenciado en las variantes.
 */
interface TemplateBlockChoice {
  readonly blockKey: RegisteredBlockKey;
  readonly registryId: string;
  /** Ver `DemoTemplateBlock.removable`. */
  readonly removable?: boolean;
}

interface TemplateDefinition {
  readonly key: string;
  readonly name: string;
  readonly structureKey: string;
  readonly eventTypeKey: string;
  readonly eventTypeName: string;
  readonly tagline: string;
  readonly themeKey: string;
  readonly cover: BlockImage;
  readonly music: DemoMusic;
  /** Qué evento imaginario de `*-samples.ts` la alimenta. */
  readonly sampleKey: string;
  readonly blocks: readonly TemplateBlockChoice[];
}

/**
 * Las diez demos: nueve estructuras, y una de ellas —`botanical`— contada dos veces, una para
 * boda y otra para XV.
 *
 * Cada una corresponde a una estructura del catálogo y repite su composición de bloques y sus
 * variantes. Las de boda usan todas el **mismo contenido** y las de XV también, y eso es
 * deliberado: comparar dos estructuras con el mismo texto y las mismas fotos es la única forma de
 * ver qué hace una plantilla, sin que la diferencia la ponga el contenido.
 *
 * ## Por qué cada tipo de evento tiene su propia entrada
 *
 * Podría ser un parámetro —la misma demo con otro contenido— y sería peor de dos maneras: la URL
 * dejaría de prerenderizarse y, sobre todo, boda y XV no se distinguen solo por el texto. Se
 * distinguen por qué variantes componen la plantilla, y eso es una composición distinta, no un
 * ajuste. Con entradas propias, `/plantillas/botanical-xv` se comparte por WhatsApp con su propia
 * vista previa y se puede enseñar en el catálogo como lo que es: otro producto.
 *
 * ## Deuda conocida
 *
 * Estas composiciones están escritas aquí **y** en `scripts/seed.ts`. Es duplicación, y se quita
 * cuando el escaparate lea las plantillas de la base de datos —que es a lo que apunta la tabla
 * `template_blocks`—. Mientras tanto, si se cambia una estructura hay que cambiarla en los dos
 * sitios.
 */
/**
 * La única pista que hay hoy en `public/music`, compartida por todas las demos.
 *
 * Es una limitación de material, no de diseño: el campo es por plantilla justamente para que cada
 * una pueda tener la suya. Mientras haya un solo archivo, escribirlo una vez y referenciarlo es
 * mejor que repetir la ruta seis veces y que se desincronice al renombrarlo.
 */
const DEMO_MUSIC: DemoMusic = {
  url: '/music/musica-fondo.mp3',
  /* El título sale de las etiquetas ID3 del propio archivo, no de una descripción escrita a mano:
     lo que el mando enseña al pasar el ratón es lo que de verdad está sonando. */
  title: 'Canon en Re mayor · Johann Pachelbel',
};

const DEFINITIONS: readonly TemplateDefinition[] = [
  /* ── Boda ─────────────────────────────────────────────────────────────── */
  {
    key: 'botanical',
    name: 'Botanical',
    structureKey: 'botanical',
    eventTypeKey: 'wedding',
    eventTypeName: 'Boda',
    tagline:
      'Papelería de algodón: retrato enmarcado, el mes en una lámina rasgada y la paleta de vestimenta a la vista.',
    themeKey: 'olive',
    cover: demoImage(WEDDING_PHOTOS.couple, 1200, 900),
    music: DEMO_MUSIC,
    sampleKey: 'boda',
    /*
     * La papelería completa: lámina, relato y láminas de la sesión. Fue la única sin historia y
     * sin galería —su argumento era leerse entera de una pasada— y los dos bloques se añadieron a
     * propósito, con dos variantes escritas para ella: `story.pressed`, donde el texto envuelve
     * una lámina montada, y `gallery.plates`, con las fotos a escuadra y rotuladas en versalitas.
     * De las que había libres ninguna era papelería.
     *
     * El orden es lo que la sigue separando de `storytelling`: el calendario va justo después de
     * la portada —la fecha es lo primero que se busca—, el relato y las fotos vienen detrás, y el
     * código de vestimenta después de la ubicación. Es el orden en que uno se pregunta las cosas:
     * cuándo, qué se celebra, dónde, cómo voy.
     */
    blocks: [
      /*
       * La bienvenida está en todas las demos aunque en el catálogo (`scripts/seed.ts`) solo la
       * lleven algunas, y la diferencia es deliberada: una plantilla del catálogo es lo que un
       * cliente se encuentra montado, y el escaparate es donde se prueba lo que se puede añadir.
       * Es la pieza que distingue al plan de en medio, así que hay que poder ponerla, cambiarla y
       * quitarla sobre cualquier estructura — de ahí `removable`.
       *
       * Cada demo abre con una variante distinta para que se vean sin ir a buscarlas.
       */
      /* La misma puerta que su hermana de XV, que es lo que una plantilla promete: que entre un
         tipo de evento y otro solo cambie el tema. La guirnalda vale para las dos; el papel
         rasgado que había aquí y la corona que había allí no — ver `WelcomeVeil` y el seed. */
      { blockKey: 'welcome', registryId: 'welcome.botanical', removable: true },
      { blockKey: 'hero', registryId: 'hero.framed' },
      { blockKey: 'calendar', registryId: 'calendar.month' },
      /* El relato y la sesión, después de la fecha. La demo de boda es además la que trae pies de
         foto —la de XV no, ver `gallery-samples.ts`—, así que entre las dos se ve `gallery.plates`
         rotulada y sin rotular, que es la diferencia que hay que poder comprobar. */
      { blockKey: 'story', registryId: 'story.pressed' },
      { blockKey: 'gallery', registryId: 'gallery.plates' },
      { blockKey: 'schedule', registryId: 'schedule.itinerary' },
      { blockKey: 'location', registryId: 'location.single-plate' },
      /* «Dónde → qué hay que saber → cómo voy». El programa de mano: dos columnas contra un
         filete central, que es la retícula que no hacía ninguna de las otras cuatro. */
      { blockKey: 'details', registryId: 'details.program' },
      { blockKey: 'dresscode', registryId: 'dresscode.palette' },
      { blockKey: 'rsvp', registryId: 'rsvp.torn' },
      { blockKey: 'closing', registryId: 'closing.envelope' },
      /* La última hoja de la papelería: rasgada por arriba, con el monograma entre dos ramitas.
         El mismo material que la bienvenida, el calendario y la confirmación de esta plantilla. */
      { blockKey: 'footer', registryId: 'footer.sprig' },
    ],
  },
  {
    key: 'editorial',
    name: 'Editorial',
    structureKey: 'editorial',
    eventTypeKey: 'wedding',
    eventTypeName: 'Boda',
    tagline: 'Lenguaje de revista: maqueta de pliego, folios y pies de foto a la vista.',
    themeKey: 'elegance',
    cover: demoImage(WEDDING_PHOTOS.arch, 1200, 900),
    music: DEMO_MUSIC,
    sampleKey: 'boda',
    blocks: [
      { blockKey: 'welcome', registryId: 'welcome.envelope', removable: true },
      /* El retrato deshecho en el papel, con la fecha partida entre filetes: composición de
         estudio, que es de donde sale el lenguaje de esta estructura. */
      { blockKey: 'hero', registryId: 'hero.portrait' },
      { blockKey: 'story', registryId: 'story.image-right' },
      { blockKey: 'gallery', registryId: 'gallery.editorial' },
      { blockKey: 'details', registryId: 'details.list' },
      /* La carta de imprenta: los tonos pegados, sin calle entre ellos, y numerados al pie.
         La demo de boda no trae nombres de color —ver `dresscode-samples.ts`—, así que aquí se
         ve el caso en que el folio es lo único que identifica a cada tono. */
      { blockKey: 'dresscode', registryId: 'dresscode.chart' },
      { blockKey: 'schedule', registryId: 'schedule.agenda' },
      { blockKey: 'location', registryId: 'location.single-split' },
      { blockKey: 'rsvp', registryId: 'rsvp.reply-card' },
      { blockKey: 'closing', registryId: 'closing.letter' },
      /* El colofón: doble filete, mancheta y corondeles. La cinta de color es interfaz, no papel
         impreso, y es el pie que le toca a `cinematic`. */
      { blockKey: 'footer', registryId: 'footer.colophon' },
    ],
  },
  {
    key: 'cinematic',
    name: 'Cinematic',
    structureKey: 'cinematic',
    eventTypeKey: 'wedding',
    eventTypeName: 'Boda',
    tagline: 'Todo a pantalla completa: planos panorámicos y muy poco texto por vista.',
    themeKey: 'royal',
    cover: demoImage(WEDDING_PHOTOS.exit, 1200, 900),
    music: DEMO_MUSIC,
    sampleKey: 'boda',
    blocks: [
      { blockKey: 'welcome', registryId: 'welcome.spotlight', removable: true },
      { blockKey: 'hero', registryId: 'hero.classic' },
      { blockKey: 'gallery', registryId: 'gallery.cinematic' },
      { blockKey: 'story', registryId: 'story.overlay' },
      { blockKey: 'schedule', registryId: 'schedule.showcase' },
      { blockKey: 'details', registryId: 'details.panel' },
      { blockKey: 'dresscode', registryId: 'dresscode.bands' },
      { blockKey: 'location', registryId: 'location.single' },
      { blockKey: 'rsvp', registryId: 'rsvp.panel' },
      { blockKey: 'closing', registryId: 'closing.horizon' },
      { blockKey: 'footer', registryId: 'footer.ribbon' },
    ],
  },
  {
    key: 'silk',
    name: 'Silk',
    structureKey: 'silk',
    eventTypeKey: 'wedding',
    eventTypeName: 'Boda',
    tagline:
      'Piezas de papel sobre fondo crema: la portada en una tarjeta encima de la foto, las telas en fichas y el cierre en una lámina oscura.',
    themeKey: 'silk',
    cover: demoImage(WEDDING_PHOTOS.ceremony, 1200, 900),
    music: DEMO_MUSIC,
    sampleKey: 'boda',
    /*
     * La estructura que se arma por planos: casi cada sección es una pieza de papel apoyada sobre
     * otra cosa. Estrena ocho variantes —ver `scripts/seed.ts`— porque la regla de exclusividad ya
     * no dejaba ninguna libre en esos bloques ni para boda ni para XV.
     *
     * Es además la demo donde se ve el caso difícil del muestrario: la paleta de la boda llega
     * **sin nombres** (ver `dresscode-samples.ts`), así que aquí `dresscode.swatches` se compone
     * con el retal a todo el ancho de la ficha, que es su otra maqueta.
     */
    blocks: [
      /* La puerta con la cuenta atrás: es la sección que la referencia remata a pantalla completa,
         y aquí abre en vez de cerrar, que es donde una cuenta regresiva se mira de verdad. */
      { blockKey: 'welcome', registryId: 'welcome.countdown', removable: true },
      { blockKey: 'hero', registryId: 'hero.card' },
      { blockKey: 'story', registryId: 'story.mounted' },
      { blockKey: 'schedule', registryId: 'schedule.cards' },
      { blockKey: 'location', registryId: 'location.single-card' },
      { blockKey: 'details', registryId: 'details.stack' },
      { blockKey: 'dresscode', registryId: 'dresscode.swatches' },
      /* El collage desfasado: dos columnas a distinta altura y una foto cruzando el ancho al
         final, cada una con la sombra del tema. Es la misma idea que el resto de la plantilla
         —piezas sueltas apoyadas sobre el fondo—, que es lo que el mosaico no hacía. */
      { blockKey: 'gallery', registryId: 'gallery.offset' },
      /* La confirmación va antes del cierre, como en las otras seis: la nota del final es el
         remate de la carta y no puede quedar debajo de una petición. */
      { blockKey: 'rsvp', registryId: 'rsvp.raised' },
      { blockKey: 'closing', registryId: 'closing.note' },
      { blockKey: 'footer', registryId: 'footer.seal' },
    ],
  },
  {
    key: 'monochrome',
    name: 'Monochrome',
    structureKey: 'monochrome',
    eventTypeKey: 'wedding',
    eventTypeName: 'Boda',
    tagline:
      'Papel blanco, fotografía en blanco y negro y la caligrafía como único ornamento. Sin una sola caja en toda la invitación.',
    themeKey: 'ink',
    cover: demoImage(WEDDING_PHOTOS.rings, 1200, 900),
    music: DEMO_MUSIC,
    sampleKey: 'boda',
    /*
     * La estructura que se define por lo que quita. Es además la demo que mejor enseña lo que un
     * **tema** puede hacer solo: las fotografías salen en blanco y negro sin que ningún componente
     * lo sepa —lo hace `photo.filter` de «ink»— así que cambiando el tema en el gestor, la misma
     * invitación vuelve a color de golpe. En las otras seis el tema cambia el color de la tinta;
     * aquí cambia el material.
     */
    blocks: [
      /* Las iniciales a cuerpo enorme sobre la fotografía: la puerta rima con la portada, que hace
         el mismo gesto con los nombres. */
      { blockKey: 'welcome', registryId: 'welcome.monogram', removable: true },
      { blockKey: 'hero', registryId: 'hero.script' },
      { blockKey: 'story', registryId: 'story.greeting' },
      { blockKey: 'calendar', registryId: 'calendar.sheet' },
      /* La pasarela continua: una tira de fotografías cruzando la pantalla es lo más cercano a la
         banda a sangre que la referencia pone entre el saludo y el programa, y no necesitaba
         componente nuevo. */
      { blockKey: 'gallery', registryId: 'gallery.carousel' },
      { blockKey: 'schedule', registryId: 'schedule.hours' },
      { blockKey: 'location', registryId: 'location.single-open' },
      { blockKey: 'dresscode', registryId: 'dresscode.discs' },
      { blockKey: 'details', registryId: 'details.notes' },
      { blockKey: 'rsvp', registryId: 'rsvp.hairline' },
      { blockKey: 'closing', registryId: 'closing.script' },
      { blockKey: 'footer', registryId: 'footer.rule' },
    ],
  },
  {
    key: 'sketch',
    name: 'Sketch',
    structureKey: 'sketch',
    eventTypeKey: 'wedding',
    eventTypeName: 'Boda',
    tagline:
      'Ilustrada a mano: rótulos de letra vaciada, dibujos de línea en cada sección y manchas de color en vez de muestras.',
    themeKey: 'cocoa',
    cover: demoImage(WEDDING_PHOTOS.guests, 1200, 900),
    music: DEMO_MUSIC,
    sampleKey: 'boda',
    /*
     * La primera estructura ilustrada, y la única del escaparate donde el dibujo hace de
     * ilustración y no de ornamento: el marco de la portada, el lazo del saludo, el candelabro de
     * la vestimenta, la mesa puesta de la sede y los dos ramilletes del cierre. Todos son SVG del
     * proyecto y todos toman el color del tema, así que cambiándolo en el gestor los dibujos
     * cambian de tinta con el resto de la invitación.
     */
    blocks: [
      { blockKey: 'welcome', registryId: 'welcome.band', removable: true },
      { blockKey: 'hero', registryId: 'hero.frame' },
      { blockKey: 'story', registryId: 'story.bow' },
      { blockKey: 'calendar', registryId: 'calendar.week' },
      /* El cronograma que ya era dibujado, con sus lazos y una ilustración por momento. Estaba
         libre y es exactamente el registro de esta plantilla: no hizo falta escribir otro. */
      { blockKey: 'schedule', registryId: 'schedule.ribbon' },
      { blockKey: 'gallery', registryId: 'gallery.mosaic' },
      { blockKey: 'location', registryId: 'location.single-scene' },
      { blockKey: 'dresscode', registryId: 'dresscode.drops' },
      { blockKey: 'details', registryId: 'details.stickers' },
      { blockKey: 'rsvp', registryId: 'rsvp.ticket' },
      { blockKey: 'closing', registryId: 'closing.bouquet' },
      { blockKey: 'footer', registryId: 'footer.wave' },
    ],
  },

  /* ── XV años ──────────────────────────────────────────────────────────── */
  {
    key: 'botanical-xv',
    name: 'Botanical',
    structureKey: 'botanical',
    eventTypeKey: 'quince',
    eventTypeName: 'XV Años',
    tagline:
      'La misma papelería, contada para unos XV: el mes en lámina, el itinerario y la paleta de la noche.',
    /*
     * Otro tema que su hermana de boda, y esa es media diferencia: el olivo es campo y algodón, y
     * unos XV de noche piden el marfil y el oro de «elegance». La estructura no cambia — lo hace
     * el color, la tipografía y la densidad, que es exactamente lo que un tema decide.
     */
    themeKey: 'elegance',
    cover: demoImage(QUINCE_PHOTOS.portrait, 1200, 900),
    music: DEMO_MUSIC,
    sampleKey: 'quince',
    blocks: [
      /* La misma puerta que su hermana de boda. Llevó corona, y la corona es de unos XV igual
         que las alianzas de `welcome.luminous` son de una boda: puesta en la de boda prometería
         otra celebración, así que no se podía compartir. La guirnalda sí. */
      { blockKey: 'welcome', registryId: 'welcome.botanical', removable: true },
      { blockKey: 'hero', registryId: 'hero.framed' },
      { blockKey: 'calendar', registryId: 'calendar.month' },
      /* La misma composición que su hermana de boda: lo que cambia entre las dos es el tema y la
         bienvenida, no la estructura. Aquí las fotos llegan **sin pie**, que es el otro caso que
         `gallery.plates` tiene que sostener. */
      { blockKey: 'story', registryId: 'story.pressed' },
      { blockKey: 'gallery', registryId: 'gallery.plates' },
      { blockKey: 'schedule', registryId: 'schedule.itinerary' },
      { blockKey: 'location', registryId: 'location.single-plate' },
      /* «Dónde → qué hay que saber → cómo voy». El programa de mano: dos columnas contra un
         filete central, que es la retícula que no hacía ninguna de las otras cuatro. */
      { blockKey: 'details', registryId: 'details.program' },
      { blockKey: 'dresscode', registryId: 'dresscode.palette' },
      { blockKey: 'rsvp', registryId: 'rsvp.torn' },
      { blockKey: 'closing', registryId: 'closing.envelope' },
      { blockKey: 'footer', registryId: 'footer.sprig' },
    ],
  },
  {
    key: 'classic-xv',
    name: 'Classic',
    structureKey: 'classic',
    eventTypeKey: 'quince',
    eventTypeName: 'XV Años',
    tagline: 'La estructura completa y en el orden esperado: presenta, cuenta, informa y despide.',
    themeKey: 'floral',
    cover: demoImage(QUINCE_PHOTOS.cake, 1200, 900),
    music: DEMO_MUSIC,
    sampleKey: 'quince',
    blocks: [
      { blockKey: 'welcome', registryId: 'welcome.veil', removable: true },
      /* La participación centrada dentro de su marco. `hero.classic` —la foto a sangre— se lee
         como un cartel y es la de `cinematic`; la coincidencia de nombre con esta estructura es
         de vocabulario y no un vínculo. */
      { blockKey: 'hero', registryId: 'hero.centered' },
      { blockKey: 'story', registryId: 'story.image-left' },
      { blockKey: 'details', registryId: 'details.cards' },
      { blockKey: 'dresscode', registryId: 'dresscode.cards' },
      { blockKey: 'schedule', registryId: 'schedule.vertical' },
      { blockKey: 'gallery', registryId: 'gallery.grid' },
      { blockKey: 'location', registryId: 'location.dual-venue' },
      { blockKey: 'rsvp', registryId: 'rsvp.card' },
      { blockKey: 'closing', registryId: 'closing.split' },
      { blockKey: 'footer', registryId: 'footer.centered' },
    ],
  },
  {
    key: 'storytelling-xv',
    name: 'Storytelling',
    structureKey: 'storytelling',
    eventTypeKey: 'quince',
    eventTypeName: 'XV Años',
    tagline: 'El orden narra: la historia y las fotos van antes que los datos.',
    themeKey: 'dreamy',
    cover: demoImage(QUINCE_PHOTOS.night, 1200, 900),
    music: DEMO_MUSIC,
    sampleKey: 'quince',
    blocks: [
      /* La puerta dorada: doble filete inscrito, guirnaldas en dos esquinas y la tiara sobre la
         fotografía en penumbra. Sustituye a `welcome.band` —el retrato con la franja de color—,
         que se fue a `sketch`, donde la mancha plena es el material de la plantilla. Aquí la
         estructura narra, y una participación grabada es una entrada mejor que una franja. */
      { blockKey: 'welcome', registryId: 'welcome.gilded', removable: true },
      /* La portada con las cifras: en la estructura que narra, el número a cuerpo de cartel es la
         entrada, y el resto de la invitación lo desarrolla. */
      { blockKey: 'hero', registryId: 'hero.quince' },
      /* La prosa en una columna, no en una tarjeta sobre la foto: en la estructura que narra el
         texto manda, y el superpuesto acota lo que se puede contar a un párrafo. */
      { blockKey: 'story', registryId: 'story.centered' },
      { blockKey: 'gallery', registryId: 'gallery.polaroid' },
      { blockKey: 'schedule', registryId: 'schedule.zigzag' },
      { blockKey: 'details', registryId: 'details.split' },
      /* Las dos demos de XV sí traen nombres de color, así que entre `cards` y `thread` se ve
         la paleta rotulada — el otro caso que las cinco variantes tienen que sostener. */
      { blockKey: 'dresscode', registryId: 'dresscode.thread' },
      /* «Primero aquí, después allá»: un orden que narra, que es lo que hace esta estructura. */
      { blockKey: 'location', registryId: 'location.dual-journey' },
      { blockKey: 'rsvp', registryId: 'rsvp.postcard' },
      /* La página final del álbum, que es donde termina un relato contado con instantáneas. */
      { blockKey: 'closing', registryId: 'closing.album' },
      { blockKey: 'footer', registryId: 'footer.marquee' },
    ],
  },
  {
    key: 'gala',
    name: 'Gala',
    structureKey: 'gala',
    eventTypeKey: 'quince',
    eventTypeName: 'XV Años',
    tagline:
      'Verde bosque y oro: la corona, el retrato enmarcado y la fecha grabada, todo en un eje y con guirnaldas de línea en los cantos.',
    themeKey: 'emerald',
    cover: demoImage(QUINCE_PHOTOS.church, 1200, 900),
    music: DEMO_MUSIC,
    sampleKey: 'quince',
    /*
     * La única demo que **solo existe para un tipo de evento**, y la única sin hermana posible:
     * su portada lleva la corona escrita dentro, así que no se puede contar para una boda. El
     * selector de tipo del gestor lo resuelve solo —sin hermana, se queda donde está— y es el
     * caso que `findSiblingTemplate` cubre devolviendo la propia plantilla.
     *
     * Es además la primera oscura del escaparate que no es un cartel: aquí el fondo verde no
     * enmarca fotografías a pantalla completa como en `cinematic`, sostiene una participación
     * grabada. Todo lo que separa y destaca es el filete dorado.
     */
    blocks: [
      /* La puerta de unos XV: la corona en vez de las alianzas. La misma que lleva la portada, y
         por eso las dos primeras pantallas riman. */
      { blockKey: 'welcome', registryId: 'welcome.crown', removable: true },
      { blockKey: 'hero', registryId: 'hero.crown' },
      { blockKey: 'calendar', registryId: 'calendar.band' },
      { blockKey: 'location', registryId: 'location.single-plaque' },
      { blockKey: 'schedule', registryId: 'schedule.leaders' },
      { blockKey: 'gallery', registryId: 'gallery.parallax' },
      { blockKey: 'details', registryId: 'details.column' },
      { blockKey: 'dresscode', registryId: 'dresscode.label' },
      { blockKey: 'rsvp', registryId: 'rsvp.engraved' },
      { blockKey: 'closing', registryId: 'closing.wreath' },
      { blockKey: 'footer', registryId: 'footer.frame' },
    ],
  },
];

/**
 * En desarrollo: avisa si dos demos **del mismo tipo de evento** enseñan la misma variante.
 *
 * Es la misma regla que `assertTemplateVariantsAreExclusive()` en `scripts/seed.ts`, y está aquí
 * también porque estas seis composiciones no son las de allí: llevan la bienvenida en las seis
 * —que en el catálogo solo tienen dos— y la de XV cambia la portada por `hero.quince`. O sea que
 * el escaparate puede repetir una variante sin que el catálogo lo haga, y es en el escaparate
 * donde se nota: es la página donde alguien compara antes de comprar.
 *
 * ## Por qué avisa y no rompe
 *
 * Porque romper significaría aquí una página de venta en blanco, y una demo que repite un pie es
 * un defecto de catálogo, no un fallo de render. En el seed sí se lanza —allí no hay nadie
 * mirando y lo que se está escribiendo es el catálogo de verdad—; aquí basta con que aparezca en
 * la consola de quien lo está tocando.
 *
 * El bloque entero desaparece del paquete de producción: `process.env.NODE_ENV` lo sustituye el
 * empaquetador por una constante, así que la condición se resuelve al compilar y esto no llega
 * al navegador de ningún invitado.
 */
if (process.env.NODE_ENV !== 'production') {
  const claimedByEventType = new Map<string, Map<string, string>>();

  for (const definition of DEFINITIONS) {
    let claimed = claimedByEventType.get(definition.eventTypeKey);

    if (!claimed) {
      claimed = new Map<string, string>();
      claimedByEventType.set(definition.eventTypeKey, claimed);
    }

    for (const block of definition.blocks) {
      const owner = claimed.get(block.registryId);

      if (owner) {
        console.warn(
          `[demo] ${definition.eventTypeKey}: «${owner}» y «${definition.key}» comparten ${block.registryId}`,
        );
        continue;
      }

      claimed.set(block.registryId, definition.key);
    }
  }
}

/**
 * El contenido de un bloque para un evento imaginario, o `null` si ese bloque no tiene ejemplo.
 *
 * El `switch` por bloque es el mismo patrón que en `BlockDemo` y `TemplateBlock`, y por la misma
 * razón: cada bloque tiene un contrato de contenido distinto, y es esta rama la que le garantiza
 * a TypeScript que a una galería no se le pasa el contenido de una portada.
 */
function contentFor(blockKey: RegisteredBlockKey, sampleKey: string): TemplateBlockContent | null {
  switch (blockKey) {
    case 'welcome': {
      const sample = pickSample(WELCOME_SAMPLES, sampleKey);

      return sample ? { blockKey, content: sample.content } : null;
    }
    case 'hero': {
      const sample = pickSample(HERO_SAMPLES, sampleKey);

      return sample ? { blockKey, content: sample.content } : null;
    }
    case 'story': {
      const sample = pickSample(STORY_SAMPLES, sampleKey);

      return sample ? { blockKey, content: sample.content } : null;
    }
    case 'calendar': {
      const sample = pickSample(CALENDAR_SAMPLES, sampleKey);

      return sample ? { blockKey, content: sample.content } : null;
    }
    case 'details': {
      const sample = pickSample(DETAILS_SAMPLES, sampleKey);

      return sample ? { blockKey, content: sample.content } : null;
    }
    case 'dresscode': {
      const sample = pickSample(DRESSCODE_SAMPLES, sampleKey);

      return sample ? { blockKey, content: sample.content } : null;
    }
    case 'schedule': {
      const sample = pickSample(SCHEDULE_SAMPLES, sampleKey);

      return sample ? { blockKey, content: sample.content } : null;
    }
    case 'gallery': {
      const sample = pickSample(GALLERY_SAMPLES, sampleKey);

      return sample ? { blockKey, content: sample.content } : null;
    }
    case 'location': {
      const sample = pickSample(LOCATION_SAMPLES, sampleKey);

      return sample ? { blockKey, content: sample.content } : null;
    }
    case 'rsvp': {
      const sample = pickSample(RSVP_SAMPLES, sampleKey);

      return sample ? { blockKey, content: sample.content } : null;
    }
    case 'closing': {
      const sample = pickSample(CLOSING_SAMPLES, sampleKey);

      return sample ? { blockKey, content: sample.content } : null;
    }
    case 'footer': {
      const sample = pickSample(FOOTER_SAMPLES, sampleKey);

      return sample ? { blockKey, content: sample.content } : null;
    }
    default: {
      const unhandled: never = blockKey;

      return unhandled;
    }
  }
}

/**
 * Arma los bloques de una plantilla **en el orden que declara**.
 *
 * Un bloque sin ejemplo para ese evento imaginario se omite en lugar de romper la plantilla
 * entera. Es la misma decisión que en el registro: perder un bloque es un daño acotado, y en una
 * página de venta es preferible a un error.
 */
function assemble(definition: TemplateDefinition): readonly DemoTemplateBlock[] {
  const blocks: DemoTemplateBlock[] = [];

  for (const choice of definition.blocks) {
    const content = contentFor(choice.blockKey, definition.sampleKey);

    if (content) {
      blocks.push({
        ...content,
        defaultRegistryId: choice.registryId,
        removable: choice.removable,
      });
    }
  }

  return blocks;
}

export const DEMO_TEMPLATES: readonly DemoTemplate[] = DEFINITIONS.map((definition) => ({
  key: definition.key,
  name: definition.name,
  structureKey: definition.structureKey,
  eventTypeKey: definition.eventTypeKey,
  eventTypeName: definition.eventTypeName,
  tagline: definition.tagline,
  themeKey: definition.themeKey,
  cover: definition.cover,
  music: definition.music,
  blocks: assemble(definition),
}));

export function findDemoTemplate(key: string): DemoTemplate | undefined {
  return DEMO_TEMPLATES.find((template) => template.key === key);
}

/**
 * Los tipos de evento que el escaparate enseña, en el orden en que se ofrecen.
 *
 * Sale de las propias demos y no de una lista escrita aparte: así, el día que se añada un tipo,
 * aparece solo en cuanto tenga una demo, y nunca se ofrece uno que no tenga nada que enseñar —que
 * es la única forma de fallar aquí.
 */
export function demoEventTypes(): readonly { key: string; name: string }[] {
  const seen = new Map<string, string>();

  for (const template of DEMO_TEMPLATES) {
    if (!seen.has(template.eventTypeKey)) seen.set(template.eventTypeKey, template.eventTypeName);
  }

  return [...seen].map(([key, name]) => ({ key, name }));
}

/**
 * La demo hermana: la misma estructura contada para otro tipo de evento.
 *
 * Es lo que usa el selector de tipo del gestor. Si esa estructura no existe para el tipo pedido
 * —porque no todas encajan en todos—, se cae a la primera demo de ese tipo: cambiar de boda a XV
 * siempre lleva a unos XV, aunque a veces no sea la misma plantilla.
 */
export function findSiblingTemplate(
  template: DemoTemplate,
  eventTypeKey: string,
): DemoTemplate | undefined {
  return (
    DEMO_TEMPLATES.find(
      (candidate) =>
        candidate.eventTypeKey === eventTypeKey && candidate.structureKey === template.structureKey,
    ) ?? DEMO_TEMPLATES.find((candidate) => candidate.eventTypeKey === eventTypeKey)
  );
}

/**
 * Una estructura del escaparate, con todos los tipos de evento para los que existe.
 *
 * ## Qué corrige
 *
 * `DEMO_TEMPLATES` tiene una entrada por estructura **y** tipo de evento, y eso es correcto para
 * las URLs: `/plantillas/botanical` y `/plantillas/botanical-xv` son composiciones distintas, cada
 * una se prerenderiza y cada una se comparte por WhatsApp con su propia vista previa.
 *
 * Lo que no es correcto es listar esas entradas como si fueran productos distintos. En la portada
 * salían dos tarjetas llamadas «Botanical» sin nada que las separase salvo un rótulo pequeño, y
 * eso contaba una mentira sobre el modelo: `templates` perdió su columna `event_type_key`
 * justamente porque una estructura **no es de un tipo de evento** —`editorial` o `cinematic` son
 * formas de componer, y la misma sirve para varias celebraciones—.
 *
 * Esta función agrupa por `structureKey` y devuelve, para cada estructura, la demo con la que se
 * abre y la lista de tipos para los que existe. Así la tarjeta puede decir «Boda · XV Años» en
 * lugar de fingir que son dos plantillas, y el visitante llega a la demo donde el selector de tipo
 * ya le deja saltar de una a otra sin perder la estructura que estaba mirando.
 *
 * El orden se conserva: manda la primera aparición de cada estructura en `DEMO_TEMPLATES`.
 */
export interface DemoStructure {
  readonly structureKey: string;
  readonly name: string;
  readonly tagline: string;
  readonly cover: BlockImage;
  /** La demo que abre la tarjeta. Es la primera de esa estructura. */
  readonly entryKey: string;
  /** Todos los tipos de evento para los que esta estructura tiene demo. */
  readonly eventTypeNames: readonly string[];
}

export function demoStructures(): readonly DemoStructure[] {
  const porEstructura = new Map<string, DemoStructure>();

  for (const template of DEMO_TEMPLATES) {
    const existente = porEstructura.get(template.structureKey);

    if (!existente) {
      porEstructura.set(template.structureKey, {
        structureKey: template.structureKey,
        name: template.name,
        tagline: template.tagline,
        cover: template.cover,
        entryKey: template.key,
        eventTypeNames: [template.eventTypeName],
      });
      continue;
    }

    /* Solo se acumula el tipo. El nombre, el gancho y la portada son los de la primera: son la
       misma estructura, y enseñar dos ganchos distintos para una sola tarjeta sería volver al
       problema que esto arregla. */
    if (!existente.eventTypeNames.includes(template.eventTypeName)) {
      porEstructura.set(template.structureKey, {
        ...existente,
        eventTypeNames: [...existente.eventTypeNames, template.eventTypeName],
      });
    }
  }

  return [...porEstructura.values()];
}
