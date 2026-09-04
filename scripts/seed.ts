/**
 * Seed idempotente. Se puede correr tantas veces como haga falta.
 *
 * Carga, en este orden:
 *   1. Catálogos de plataforma (funcionalidades, planes, tipos de evento)
 *   2. Component Registry (bloques, variantes, plantillas, temas)
 *   3. La cuenta de plataforma (superadministrador)
 *
 * Corre con el rol DUEÑO, que no está sujeto a RLS. Es el único camino legítimo para escribir el
 * catálogo y la cuenta de plataforma desde un proceso.
 *
 * ## Cero clientes, y no es una carencia
 *
 * `clients`, `events` y todo lo que cuelga de ellos quedan **vacías**, y `users` con una sola fila:
 * la cuenta de plataforma, que no pertenece a ningún cliente. Es el estado correcto de una base
 * recién levantada, y es el estado en el que se queda: aquí no hay un indicador que meta clientes
 * de prueba.
 *
 * La razón es que **no hacen falta para nada de lo que se enseña**. Lo que un visitante ve en
 * `/plantillas` es contenido local —`components/invitation/demo/`, seis composiciones armadas con
 * los mismos `*-samples.ts` que alimentan la previsualización del panel— y se prerenderiza en el
 * build sin abrir una conexión a Postgres. Un cliente sembrado no aparece en ninguna de esas
 * páginas.
 *
 * Lo que sí hacía era ensuciar: dos clientes ficticios en `/admin`, un dueño inventado con correo
 * `.test` que puede pedir un código de acceso, y dos eventos publicados con su URL viva. Nada de
 * eso se distingue de un cliente real mirando la pantalla, y lo primero que hay que hacer antes de
 * dar de alta a alguien de verdad es acordarse de borrarlo.
 *
 * ## Qué se pierde y de dónde sale ahora
 *
 * Dos cosas se ejercitaban con esos datos, y las dos tienen otro sitio:
 *
 *   · **El motor de render sobre datos reales.** Sale de `/plantillas`, que recorre las mismas
 *     variantes por el mismo `TemplateBlock`. Lo que no cubre es la proyección desde el evento
 *     (`domain/invitation/event-content.ts`), y para eso ya no hacen falta datos sembrados: se da
 *     de alta un evento desde `/admin` en dos minutos y se mira el de verdad.
 *   · **El aislamiento entre inquilinos**, que pedía dos clientes para poder comprobarse. Eso ya
 *     no depende de que haya datos: `npm run db:check` lo verifica contra el catálogo de Postgres
 *     —qué tablas tienen RLS, qué políticas, con qué rol se conecta la aplicación— y con la base
 *     vacía da exactamente el mismo veredicto.
 */
import { config as loadDotenv } from 'dotenv';
import { eq, inArray, sql } from 'drizzle-orm';
import { drizzle } from 'drizzle-orm/node-postgres';
import { Pool } from 'pg';
import * as s from '../src/infrastructure/db/schema/index.js';
import { PLATFORM_ADMIN } from './platform.js';

loadDotenv({ path: ['.env.local', '.env'], quiet: true });

const url = process.env.DATABASE_MIGRATION_URL ?? process.env.DATABASE_URL;

if (!url) {
  console.error('Falta DATABASE_MIGRATION_URL (o DATABASE_URL).');
  process.exit(1);
}

const pool = new Pool({ connectionString: url, max: 1 });
const db = drizzle(pool, { schema: s, casing: 'snake_case' });

// ════════════════════════════════════════════════════════════════════════════
// 1. Catálogos de plataforma
// ════════════════════════════════════════════════════════════════════════════

const FEATURES = [
  { key: 'plantilla', name: 'Diseño basado en plantilla', category: 'invitacion' },
  { key: 'pantalla_bienvenida', name: 'Pantalla de bienvenida', category: 'invitacion' },
  { key: 'historia', name: 'Historia del festejado', category: 'invitacion' },
  { key: 'musica', name: 'Música de fondo', category: 'invitacion' },
  { key: 'cuenta_regresiva', name: 'Cuenta regresiva', category: 'invitacion' },
  { key: 'cronograma', name: 'Cronograma', category: 'invitacion' },
  { key: 'codigo_vestimenta', name: 'Código de vestimenta', category: 'invitacion' },
  { key: 'mesa_regalos', name: 'Mesa de regalos', category: 'invitacion' },
  { key: 'galeria', name: 'Galería de fotos', category: 'invitacion' },
  { key: 'ubicacion', name: 'Ubicación con Google Maps', category: 'invitacion' },
  { key: 'compartir_whatsapp', name: 'Compartir por WhatsApp', category: 'invitacion' },
  { key: 'rsvp', name: 'Confirmación de asistencia', category: 'gestion' },
  { key: 'panel_confirmaciones', name: 'Panel básico de confirmaciones', category: 'gestion' },
  { key: 'gestion_invitados', name: 'Gestión de invitados por familia', category: 'gestion' },
  { key: 'gestion_mesas', name: 'Gestión de mesas', category: 'gestion' },
  { key: 'panel_administrativo', name: 'Panel administrativo completo', category: 'gestion' },
  { key: 'recordatorios', name: 'Recordatorios automáticos', category: 'automatizacion' },
  /*
   * Las dos que vende Plus. Sin ellas, la tarjeta de Plus en la página de precios no diría
   * lo que de verdad separa a Plus de Esencial: en Esencial el cliente elige plantilla y
   * tema y ahí acaba, mientras que en Plus la plantilla es un punto de partida.
   *
   * El mecanismo no es nuevo —lo hace `minPlanRank` en las variantes—, pero el catálogo de
   * funcionalidades es lo que la página de precios enumera, así que tiene que constar aquí.
   */
  { key: 'variantes_intercambiables', name: 'Intercambiar variantes de cada bloque', category: 'invitacion' },
  { key: 'reordenar_secciones', name: 'Reordenar las secciones', category: 'invitacion' },
  { key: 'libro_firmas', name: 'Libro de firmas', category: 'extras' },
  { key: 'album_colaborativo', name: 'Álbum colaborativo', category: 'extras' },
  { key: 'ia_contenido', name: 'Generación de contenido con IA', category: 'extras' },
] as const;

/**
 * Los tres planes.
 *
 * El `rank` no es decorativo: es lo que compara `minPlanRank` de cada variante, así que
 * insertar un plan intermedio **recorre** a Premium del 2 al 3. Es justo lo que se quería —
 * las variantes marcadas con `minPlanRank: 2` pasan a ser de Plus en adelante en lugar de
 * exclusivas de Premium— pero conviene tenerlo presente antes de tocar estos números.
 */
const PLANS = [
  { key: 'esencial', name: 'Plan Esencial', rank: 1, priceCents: 0 },
  { key: 'plus', name: 'Plan Plus', rank: 2, priceCents: 0 },
  { key: 'premium', name: 'Plan Premium', rank: 3, priceCents: 0 },
] as const;

/**
 * Configuración base de cada plan. `limitValue` null = sin tope.
 *
 * ## La frontera no está donde parece
 *
 * Lo que separa los planes **no** es cuántas secciones bonitas trae la invitación: Esencial ya
 * trae casi todas. La frontera es la **gestión**, y cae entre Plus y Premium.
 *
 * Esencial y Plus reparten **una sola URL**, igual para todos los invitados, y su botón de
 * confirmar no hace más que abrir WhatsApp con el mensaje escrito. No hay lista de invitados,
 * así que no hay nada que gestionar: por eso ninguno de los dos tiene `rsvp`,
 * `panel_confirmaciones` ni `recordatorios`. Un panel vacío sería peor que no tenerlo.
 *
 * Premium es el único que da acceso al panel, carga invitados por familia y le entrega a cada
 * familia **su propio enlace** `/<slug>/<código>`.
 */
const PLAN_FEATURES: { planKey: string; featureKey: string; limitValue: number | null }[] = [
  /*
   * Esencial: el cliente elige plantilla y tema, y ahí acaba su intervención.
   *
   * Sin `pantalla_bienvenida`, sin `codigo_vestimenta`, sin `mesa_regalos` y sin `musica`: esas
   * cuatro son exactamente el argumento del salto a Plus.
   *
   * La música tuvo aquí un catálogo de cinco pistas y se retiró: una invitación que suena es de las
   * cosas que más se notan al abrirla, así que sirve mejor de argumento para subir de plan que de
   * cortesía en el más barato. Ahora Esencial es silencio, y eso es una diferencia que se **oye**
   * al comparar dos demos — que es exactamente lo que tiene que hacer un escaparate.
   */
  ...[
    'plantilla',
    'historia',
    'cuenta_regresiva',
    'cronograma',
    'galeria',
    'ubicacion',
    'compartir_whatsapp',
  ].map((featureKey) => ({ planKey: 'esencial', featureKey, limitValue: null })),

  /*
   * Plus: todo lo de Esencial, más las tres secciones reservadas, la música —que en Esencial ya no
   * existe— y, lo que de verdad lo vende, poder intercambiar variantes y reordenar las secciones.
   *
   * Sigue sin panel: misma URL única que Esencial.
   */
  ...[
    'plantilla',
    /* La puerta de bienvenida bajó a Plus el 2026-08-19. Nació como el gancho de Premium, pero
       Premium ya no se vende por una sección bonita sino por la gestión, así que la puerta hace
       de argumento para el salto de Esencial a Plus, que es donde faltaba uno. */
    'pantalla_bienvenida',
    'historia',
    'musica',
    'cuenta_regresiva',
    'cronograma',
    'codigo_vestimenta',
    'mesa_regalos',
    'galeria',
    'ubicacion',
    'compartir_whatsapp',
    'variantes_intercambiables',
    'reordenar_secciones',
  ].map((featureKey) => ({ planKey: 'plus', featureKey, limitValue: null })),

  // Premium: todo lo de Plus sin tope, más la gestión completa, las mesas y los extras.
  ...[
    'plantilla',
    'pantalla_bienvenida',
    'historia',
    'musica',
    'cuenta_regresiva',
    'cronograma',
    'codigo_vestimenta',
    'mesa_regalos',
    'galeria',
    'ubicacion',
    'compartir_whatsapp',
    'variantes_intercambiables',
    'reordenar_secciones',
    'rsvp',
    'panel_confirmaciones',
    'gestion_invitados',
    'gestion_mesas',
    'panel_administrativo',
    'libro_firmas',
    'album_colaborativo',
    'ia_contenido',
  ].map((featureKey) => ({ planKey: 'premium', featureKey, limitValue: null })),
  // Los 3 recordatorios del modelo acordado, contados por familia y no por evento.
  { planKey: 'premium', featureKey: 'recordatorios', limitValue: 3 },
];

/**
 * Los tipos de evento, con clave en inglés.
 *
 * La clave es un identificador del sistema —viaja en `events.event_type_key` y en
 * `templates.event_type_key`— y el inglés la mantiene legible junto al resto del vocabulario
 * técnico, que ya lo es: `hero`, `gallery`, `rsvp`. El nombre que se lee en pantalla va aparte y
 * en español, que es el idioma del producto.
 *
 * «Bautizo» se separa de «Presentación»: son dos celebraciones distintas —una es un sacramento y
 * la otra una presentación en el templo— y fundirlas obligaba a que la plantilla de una sirviera
 * para la otra.
 */
/**
 * Los tipos de evento, y cuáles se pueden dar de alta **hoy**.
 *
 * Los nueve existen en el catálogo y solo dos están activos. No es una lista a medio hacer: es lo
 * que la portada ya venía diciendo —«el catálogo tiene nueve tipos y hoy solo se venden bodas y
 * XV», en `app/page.tsx`— y que hasta ahora no se cumplía en el único sitio donde importa. El
 * formulario de alta ofrecía los nueve, así que se podía crear un bautizo y llegar a la pantalla
 * siguiente para descubrir qué plantillas hay para un bautizo.
 *
 * ## Por qué desactivar y no borrar
 *
 * Porque un tipo no es una opción de un desplegable: es una clave a la que apuntan los eventos ya
 * creados (`events.event_type_key`) y las plantillas (`template_event_types`). Borrar «bautizo»
 * obligaría a decidir qué pasa con las plantillas que lo declaran —`classic`, `storytelling`,
 * `botanical` y `sketch` lo hacen— y a perder ese trabajo. Desactivado, la asociación se queda
 * escrita y volver a venderlo es cambiar un `false` por un `true`.
 *
 * ## Dónde se nota
 *
 * En los dos sitios donde el catálogo se ofrece: el alta de un evento
 * (`LoadNewEventOptions.execute`) y el formulario público de cotización
 * (`browse-showcase`). Los dos filtran ya por `isActive`, así que aquí no hace falta ni una línea
 * de código nueva — solo dejar de mentir en los datos.
 *
 * Lo que **no** cambia es lo que ya existe: un evento dado de alta con un tipo que después se
 * desactiva sigue funcionando. La clave sigue ahí y su invitación también.
 */
const EVENT_TYPES = [
  { key: 'wedding', name: 'Boda', isActive: true },
  { key: 'quince', name: 'XV Años', isActive: true },
  { key: 'baptism', name: 'Bautizo', isActive: false },
  { key: 'presentation', name: 'Presentación', isActive: false },
  { key: 'graduation', name: 'Graduación', isActive: false },
  { key: 'baby_shower', name: 'Baby Shower', isActive: false },
  { key: 'birthday', name: 'Cumpleaños', isActive: false },
  { key: 'gender_reveal', name: 'Revelación de género', isActive: false },
  { key: 'corporate', name: 'Evento empresarial', isActive: false },
] as const;

/**
 * Claves que cambiaron de nombre, y por qué esto no es un `DELETE` seguido de un `INSERT`.
 *
 * `events.event_type_key` y `templates.event_type_key` apuntan a estas claves con
 * `ON UPDATE CASCADE`, así que **renombrar propaga solo**: los eventos ya creados siguen
 * apuntando a su tipo sin tocarlos. Insertar las nuevas y borrar las viejas, en cambio, fallaría
 * —hay eventos referenciándolas— o dejaría dos juegos de tipos conviviendo.
 *
 * Es idempotente: en la segunda ejecución las claves viejas ya no existen y no pasa nada.
 */
const RENAMED_EVENT_TYPES: Readonly<Record<string, string>> = {
  xv_anios: 'quince',
  presentacion: 'presentation',
  boda: 'wedding',
  cumpleanos: 'birthday',
  graduacion: 'graduation',
  revelacion_genero: 'gender_reveal',
  empresarial: 'corporate',
};

/** Lo mismo para los temas: se renombran, no se duplican. */
const RENAMED_THEMES: Readonly<Record<string, string>> = {
  'marfil-oro': 'elegance',
  'jardin-salvia': 'floral',
  medianoche: 'royal',
};

// ════════════════════════════════════════════════════════════════════════════
// 2. Component Registry
// ════════════════════════════════════════════════════════════════════════════

const BLOCKS = [
  { key: 'welcome', name: 'Pantalla de bienvenida', featureKey: 'pantalla_bienvenida' },
  { key: 'hero', name: 'Portada', featureKey: 'plantilla' },
  { key: 'story', name: 'Historia', featureKey: 'historia' },
  /*
   * El calendario cuelga de `plantilla` —o sea, lo tienen los tres planes— y no de
   * `cuenta_regresiva`, que es lo que parecía a mano. Son dos cosas distintas: la cuenta regresiva
   * es un reloj que corre y este bloque es una fecha señalada en un mes. Colgarlo de aquella
   * habría atado dos funcionalidades que un cliente puede querer por separado.
   */
  { key: 'calendar', name: 'Calendario', featureKey: 'plantilla' },
  { key: 'details', name: 'Detalles del evento', featureKey: 'plantilla' },
  /* Este sí tiene su funcionalidad propia desde el principio (`codigo_vestimenta`), y desde los
     tres planes es de Plus en adelante: Esencial no lo trae. */
  { key: 'dresscode', name: 'Código de vestimenta', featureKey: 'codigo_vestimenta' },
  { key: 'schedule', name: 'Cronograma', featureKey: 'cronograma' },
  { key: 'gallery', name: 'Galería', featureKey: 'galeria' },
  { key: 'location', name: 'Ubicación', featureKey: 'ubicacion' },
  { key: 'rsvp', name: 'Confirmación de asistencia', featureKey: 'rsvp' },
  { key: 'closing', name: 'Mensaje final', featureKey: 'plantilla' },
  { key: 'footer', name: 'Pie de página', featureKey: 'plantilla' },
] as const;

/*
 * `party` y `messages` estuvieron aquí y se dieron de baja.
 *
 * Eran bloques del catálogo **sin componente**: la base los ofrecía, el registro no sabía
 * pintarlos y asignárselos a un evento dejaba un hueco en blanco. `party` además era la fiesta
 * temática de un cliente concreto, que es lo que `docs/PROJECT.md` llama personalización y
 * excluye del núcleo.
 *
 * La tabla `event_messages` se queda en el esquema: las dedicatorias son una idea del producto
 * que volverá con su bloque y sus variantes, y entonces se da de alta otra vez aquí.
 */

/**
 * Variantes registradas. `registry_id` ('hero.classic') lo genera Postgres a partir
 * de block_key y variant_key, así que no se inserta aquí.
 *
 * `minPlanRank` 2 = de Plus en adelante. Es el mecanismo para vender variantes sin tocar código.
 *
 * Ese 2 significaba «solo Premium» cuando había dos planes. Al entrar Plus en el rank 2 y
 * desplazar a Premium al 3, estas variantes pasaron a ser de Plus y Premium sin tocar una línea
 * — que es exactamente lo que se quería, porque intercambiar variantes es lo que Plus vende.
 */
const VARIANTS: {
  blockKey: string;
  variantKey: string;
  name: string;
  minPlanRank?: number;
  isActive?: boolean;
}[] = [
  /*
   * Todas llevan `minPlanRank: 2`. El bloque ya cuelga de una funcionalidad que Esencial no
   * tiene, y aun así se marcan una por una: son dos cierres distintos —qué bloques ofrece el
   * plan y qué variantes ofrece el catálogo— y dejar el segundo abierto haría que la pantalla de
   * componentes las enseñara como disponibles para Esencial.
   */
  { blockKey: 'welcome', variantKey: 'veil', name: 'Bienvenida de papelería', minPlanRank: 2 },
  { blockKey: 'welcome', variantKey: 'envelope', name: 'Bienvenida en sobre lacrado', minPlanRank: 2 },
  { blockKey: 'welcome', variantKey: 'spotlight', name: 'Bienvenida a pantalla completa', minPlanRank: 2 },
  { blockKey: 'welcome', variantKey: 'filigree', name: 'Bienvenida con filigrana grabada', minPlanRank: 2 },
  { blockKey: 'welcome', variantKey: 'monogram', name: 'Bienvenida con monograma', minPlanRank: 2 },
  { blockKey: 'welcome', variantKey: 'luminous', name: 'Bienvenida con rótulo luminoso', minPlanRank: 2 },
  { blockKey: 'welcome', variantKey: 'botanical', name: 'Bienvenida con guirnalda botánica', minPlanRank: 2 },
  { blockKey: 'welcome', variantKey: 'torn', name: 'Bienvenida con papel rasgado', minPlanRank: 2 },
  { blockKey: 'welcome', variantKey: 'band', name: 'Bienvenida con banda de color', minPlanRank: 2 },
  { blockKey: 'welcome', variantKey: 'countdown', name: 'Bienvenida con cuenta regresiva', minPlanRank: 2 },
  { blockKey: 'welcome', variantKey: 'crown', name: 'Bienvenida con corona (XV)', minPlanRank: 2 },
  /* La duodécima, y la más cargada: doble filete inscrito, guirnaldas en dos esquinas y la tiara
     ilustrada sobre la fotografía en penumbra. Es la participación grabada a dos tintas, que es
     la pieza más vendida en unos XV y no la hacía ninguna. Lleva la corona escrita dentro, así
     que es de ese tipo de evento — como `hero.crown`. */
  { blockKey: 'welcome', variantKey: 'gilded', name: 'Bienvenida dorada con marco (XV)', minPlanRank: 2 },
  { blockKey: 'hero', variantKey: 'classic', name: 'Portada clásica' },
  { blockKey: 'hero', variantKey: 'centered', name: 'Portada centrada' },
  { blockKey: 'hero', variantKey: 'split', name: 'Portada a dos columnas' },
  { blockKey: 'hero', variantKey: 'portrait', name: 'Portada con retrato difuminado' },
  { blockKey: 'hero', variantKey: 'framed', name: 'Portada con retrato enmarcado' },
  /* Las dos primeras variantes pensadas para un tipo de evento concreto. No preguntan por él —
     ningún componente lo hace— pero su composición solo tiene sentido en unos XV, y quien arma la
     plantilla las elige a sabiendas. Es como el catálogo crece para cubrir un tipo nuevo: con
     entradas propias y no con condiciones dentro de los componentes que ya existen. */
  { blockKey: 'hero', variantKey: 'quince', name: 'Portada con cifras de XV' },
  /* La séptima, y la que estrena `silk`: la única de dos planos —la fotografía a sangre y una
     tarjeta de papel apoyada encima—. Las seis anteriores estaban repartidas una por plantilla. */
  { blockKey: 'hero', variantKey: 'card', name: 'Portada con tarjeta sobre la foto' },
  /* La octava, para `monochrome`: la foto a pantalla completa, los nombres en caligrafía y el año
     en una esquina. Es la única que no dice a qué te invitan: lo deja para la sección siguiente. */
  { blockKey: 'hero', variantKey: 'script', name: 'Portada con nombres en caligrafía' },
  /* La novena, para `sketch`, y la única ilustrada: el rótulo vaciado, el retrato dentro de un
     marco dibujado a mano y las alianzas cuando el nombre trae una pareja. */
  { blockKey: 'hero', variantKey: 'frame', name: 'Portada con marco dibujado' },
  /* La décima, para `gala`, y la segunda pensada para unos XV. La corona va escrita en el
     componente —como el «XV» de `hero.quince`—, así que es de ese tipo de evento: donde aquella
     hace del número el titular, esta lo hace del nombre. */
  { blockKey: 'hero', variantKey: 'crown', name: 'Portada con corona (XV)' },
  { blockKey: 'story', variantKey: 'image-left', name: 'Historia con imagen a la izquierda' },
  { blockKey: 'story', variantKey: 'image-right', name: 'Historia con imagen a la derecha' },
  { blockKey: 'story', variantKey: 'centered', name: 'Historia centrada' },
  { blockKey: 'story', variantKey: 'overlay', name: 'Historia sobre la imagen' },
  /* La quinta, y la que hizo falta para darle historia a `botanical`: las otras cuatro estaban
     repartidas una por plantilla, y la regla de exclusividad no deja reusar ninguna. Es la única
     en que el texto envuelve la fotografía en lugar de ponerse al lado o encima. */
  { blockKey: 'story', variantKey: 'pressed', name: 'Historia con lámina montada al margen' },
  /* La sexta, para `silk`: la copia torcida y con sombra, encabalgada sobre la hoja del relato.
     Es la única en que la fotografía es un objeto encima del papel y no una columna, un fondo o
     una lámina dentro del pliego. */
  { blockKey: 'story', variantKey: 'mounted', name: 'Historia con instantánea montada' },
  /* La séptima, para `monochrome`: la alocución centrada, con la entradilla en negrita y sin
     fotografía. Es la única que ignora la imagen a propósito — ver su archivo. */
  { blockKey: 'story', variantKey: 'greeting', name: 'Historia como saludo centrado' },
  /* La octava, para `sketch`: el saludo con lazo, la foto de banda con el canto ondulado del tema
     y el texto centrado. */
  { blockKey: 'story', variantKey: 'bow', name: 'Historia con banda ondulada y lazo' },
  { blockKey: 'calendar', variantKey: 'month', name: 'Calendario del mes en lámina' },
  /* El segundo calendario, y el primero desde que existe el bloque. Se escribió al saber qué
     cambia de verdad entre dos —la lámina impresa contra la hoja de agenda— y no antes, que es la
     regla que evita que un bloque engorde con variaciones de lo mismo. */
  { blockKey: 'calendar', variantKey: 'sheet', name: 'Fecha en tira de siete días' },
  /* La tercera, para `sketch`: la semana real del evento, con las iniciales de los días. Es la
     única que no centra el día del evento, y por eso puede decir en qué día de la semana cae. */
  { blockKey: 'calendar', variantKey: 'week', name: 'Semana del evento, con iniciales' },
  /* La cuarta, para `gala`, y la única sin retícula: la fecha compuesta como dato tipográfico,
     con la cifra del día a cuerpo de cartel entre dos filetes. Un calendario sin calendario no es
     una contradicción — el bloque guarda un instante y cada variante decide cómo se enseña. */
  { blockKey: 'calendar', variantKey: 'band', name: 'Fecha en banda grabada' },
  { blockKey: 'details', variantKey: 'cards', name: 'Detalles en tarjetas' },
  { blockKey: 'details', variantKey: 'list', name: 'Detalles en lista' },
  { blockKey: 'details', variantKey: 'split', name: 'Detalles a dos columnas' },
  { blockKey: 'details', variantKey: 'panel', name: 'Detalles en panel de color' },
  /* La quinta, y la que hizo falta para darle detalles a `botanical`: las otras cuatro estaban
     repartidas una por plantilla y la regla de exclusividad no deja reusar ninguna. */
  { blockKey: 'details', variantKey: 'program', name: 'Detalles en programa de mano' },
  /* La sexta, para `silk`. La referencia de esa plantilla no tiene sección de detalles, así que
     se compone con su propio material: una ficha por dato, a ancho completo y con la placa
     cuadrada al margen. Se lee de arriba abajo, mientras que la rejilla de `cards` se abarca de
     un vistazo. */
  { blockKey: 'details', variantKey: 'stack', name: 'Detalles en fichas apiladas' },
  /* La séptima, para `monochrome`, y la única sin ninguna pieza gráfica: icono suelto, rótulo en
     acento y texto sobre el papel. */
  { blockKey: 'details', variantKey: 'notes', name: 'Detalles como notas al margen' },
  /* La octava, para `sketch`: cada dato en una pegatina con el icono dentro de una mancha
     irregular, la misma forma que las muestras de su código de vestimenta. */
  { blockKey: 'details', variantKey: 'stickers', name: 'Detalles en pegatinas' },
  /* La novena, para `gala`, y la única centrada en un eje: el dibujo arriba, el rótulo en
     versalitas y un filete corto entre un aviso y el siguiente. */
  { blockKey: 'details', variantKey: 'column', name: 'Detalles en columna centrada' },
  /*
   * Seis formas de enseñar una paleta, una por plantilla.
   *
   * El bloque tenía una sola —`palette`— y por eso solo `botanical` lo llevaba: darlo a las otras
   * obligaba a que compartieran variante, que es justo lo que la regla de exclusividad impide.
   * Las cinco nuevas no son variaciones de la fila de círculos: cambia qué es una muestra, y con
   * ello qué invita a hacer la sección.
   *
   * Ninguna lleva `minPlanRank`. El bloque ya cuelga de `codigo_vestimenta`, que es de Plus en
   * adelante, y además son la composición de partida de seis plantillas del catálogo: una
   * variante de pago ahí las volvería imposibles de montar.
   */
  { blockKey: 'dresscode', variantKey: 'palette', name: 'Vestimenta con paleta de color' },
  { blockKey: 'dresscode', variantKey: 'cards', name: 'Vestimenta en fichas de muestrario' },
  { blockKey: 'dresscode', variantKey: 'chart', name: 'Vestimenta en carta de imprenta' },
  { blockKey: 'dresscode', variantKey: 'thread', name: 'Vestimenta en hilo de cuentas' },
  { blockKey: 'dresscode', variantKey: 'bands', name: 'Vestimenta en franjas a sangre' },
  /* La sexta, para `silk`: el muestrario de telas, un retal apaisado por renglón. Sin nombres el
     retal se lleva la ficha entera, que es lo que la salva con una paleta sin rotular. */
  { blockKey: 'dresscode', variantKey: 'swatches', name: 'Vestimenta en muestrario de telas' },
  /* La séptima, para `monochrome`: los discos grandes como una sola pieza y los nombres corridos
     en un pie. Separa el color de su nombre a propósito — ver su archivo. */
  { blockKey: 'dresscode', variantKey: 'discs', name: 'Vestimenta en discos de color' },
  /* La octava, para `sketch`, y la única cuya muestra no es una figura geométrica: manchas de
     contorno irregular, con el candelabro dibujado junto a la instrucción. */
  { blockKey: 'dresscode', variantKey: 'drops', name: 'Vestimenta en manchas de color' },
  /* La novena, para `gala`, y la única donde la paleta no manda: la instrucción a cuerpo de
     rótulo —«FORMAL»— y los tonos en una fila de puntos. Es el caso que faltaba: el evento cuyo
     código de vestimenta es una sola palabra y no una gama. */
  { blockKey: 'dresscode', variantKey: 'label', name: 'Vestimenta en etiqueta' },
  { blockKey: 'schedule', variantKey: 'vertical', name: 'Línea de tiempo alternada' },
  { blockKey: 'schedule', variantKey: 'horizontal', name: 'Cinta horizontal', minPlanRank: 2 },
  { blockKey: 'schedule', variantKey: 'agenda', name: 'Programa impreso' },
  { blockKey: 'schedule', variantKey: 'showcase', name: 'Momentos destacados' },
  { blockKey: 'schedule', variantKey: 'ribbon', name: 'Cinta con lazos' },
  { blockKey: 'schedule', variantKey: 'zigzag', name: 'Momentos en zigzag' },
  { blockKey: 'schedule', variantKey: 'itinerary', name: 'Itinerario con iconos al margen' },
  /* El octavo, para `silk`, y el único sin hilo: una ficha por momento con la hora en un
     medallón. La columna de medallones es lo que hace de secuencia cuando no hay línea que
     seguir. Sin `minPlanRank`: es el cronograma de partida de una plantilla del catálogo. */
  { blockKey: 'schedule', variantKey: 'cards', name: 'Programa en fichas' },
  /* El noveno, para `monochrome`: la cifra al margen y el filete solo bajo el texto. Sin
     `minPlanRank`: es el cronograma de partida de una plantilla del catálogo. */
  { blockKey: 'schedule', variantKey: 'hours', name: 'Programa por horas, sin retícula' },
  /* El décimo, para `gala`: la hora en un margen, el rótulo en el otro y una guía punteada
     cruzando el hilo. Sin `minPlanRank`: es el cronograma de partida de una plantilla. */
  { blockKey: 'schedule', variantKey: 'leaders', name: 'Itinerario con guías punteadas' },
  { blockKey: 'gallery', variantKey: 'parallax', name: 'Galería con parallax' },
  { blockKey: 'gallery', variantKey: 'grid', name: 'Galería en cuadrícula' },
  { blockKey: 'gallery', variantKey: 'carousel', name: 'Pasarela infinita' },
  { blockKey: 'gallery', variantKey: 'masonry', name: 'Galería en mampostería', minPlanRank: 2 },
  { blockKey: 'gallery', variantKey: 'mosaic', name: 'Galería en mosaico' },
  { blockKey: 'gallery', variantKey: 'polaroid', name: 'Galería polaroid' },
  { blockKey: 'gallery', variantKey: 'editorial', name: 'Galería de pliego editorial' },
  { blockKey: 'gallery', variantKey: 'cinematic', name: 'Galería cinematográfica' },
  /* La novena, por lo mismo que `story.pressed`: de las cuatro que quedaban libres, ninguna era
     papelería —todas son retículas de interfaz— y junto a `hero.framed` se leían como la sección
     de otra invitación. Sin `minPlanRank`: es la galería de partida de una plantilla del catálogo,
     y una variante de Plus ahí la volvería imposible de montar para un cliente de Esencial. */
  { blockKey: 'gallery', variantKey: 'plates', name: 'Galería de láminas montadas' },
  /* La décima, para `silk`: el collage de dos columnas desfasadas con remate a todo el ancho. El
     mosaico que llevaba antes reparte por tamaño —una destacada y el resto—; este reparte por
     altura, y es lo que hace que un puñado de fotos se lea como un montaje y no como una
     cuadrícula. Sin `minPlanRank`: es la galería de partida de una plantilla del catálogo. */
  { blockKey: 'gallery', variantKey: 'offset', name: 'Galería en columnas desfasadas' },
  { blockKey: 'location', variantKey: 'single', name: 'Sede a pantalla completa' },
  { blockKey: 'location', variantKey: 'single-split', name: 'Sede con foto al lado' },
  { blockKey: 'location', variantKey: 'single-card', name: 'Sede en tarjeta' },
  { blockKey: 'location', variantKey: 'single-plate', name: 'Sede con lámina fotográfica' },
  { blockKey: 'location', variantKey: 'dual-venue', name: 'Dos sedes en columnas' },
  { blockKey: 'location', variantKey: 'dual-journey', name: 'Dos sedes como recorrido' },
  { blockKey: 'location', variantKey: 'dual-stacked', name: 'Dos sedes en franjas' },
  /* El octavo, para `monochrome`: la sede sin tarjeta, con la foto flotando y los datos sobre el
     papel. Es a `single-card` lo que `calendar.sheet` es a `calendar.month`. */
  { blockKey: 'location', variantKey: 'single-open', name: 'Sede al aire, sin tarjeta' },
  /* La novena, para `sketch`: la mesa puesta dibujada ilustra la sección y la fotografía entra
     debajo si la hay. Es la única donde la foto es opcional de verdad y no deja hueco. */
  { blockKey: 'location', variantKey: 'single-scene', name: 'Sede con escena dibujada' },
  /* La décima, para `gala`: la hora abre la ficha y el nombre va entre dos filetes, como una
     placa. */
  { blockKey: 'location', variantKey: 'single-plaque', name: 'Sede en placa grabada' },
  /*
   * Las cinco son FORMAS, no mecanismos. A dónde va el botón —al WhatsApp del organizador o a la
   * plataforma— es contenido del evento y lo limita el plan al guardarlo, no el catálogo: por
   * eso no hay una variante «por WhatsApp» y otra «con formulario». Las que existían con esos
   * nombres se retiran en `RETIRED_VARIANTS`.
   */
  { blockKey: 'rsvp', variantKey: 'card', name: 'Confirmación en tarjeta' },
  { blockKey: 'rsvp', variantKey: 'panel', name: 'Confirmación en panel de color' },
  { blockKey: 'rsvp', variantKey: 'ticket', name: 'Confirmación con forma de pase' },
  { blockKey: 'rsvp', variantKey: 'reply-card', name: 'Tarjeta de respuesta R.S.V.P.' },
  { blockKey: 'rsvp', variantKey: 'postcard', name: 'Confirmación en postal' },
  { blockKey: 'rsvp', variantKey: 'torn', name: 'Confirmación en papel rasgado' },
  /* La séptima, para `silk`, y la única de dos planos: la tarjeta encimada en la costura entre el
     papel y la banda del final —la fotografía cuando la hay, el color principal cuando no—. */
  { blockKey: 'rsvp', variantKey: 'raised', name: 'Confirmación en tarjeta encimada' },
  /* La octava, para `monochrome`, y la única que no encierra la petición en ninguna pieza: un
     filete, el rótulo y el botón. */
  { blockKey: 'rsvp', variantKey: 'hairline', name: 'Confirmación al aire, con filete' },
  /* La novena, para `gala`: doble filete alrededor y ningún fondo propio. Sobre un papel oscuro,
     una tarjeta clara abre un agujero de luz; un cartucho grabado, no. */
  { blockKey: 'rsvp', variantKey: 'engraved', name: 'Confirmación en cartucho grabado' },
  { blockKey: 'closing', variantKey: 'split', name: 'Cierre a dos columnas' },
  { blockKey: 'closing', variantKey: 'letter', name: 'Cierre como carta que se abre' },
  { blockKey: 'closing', variantKey: 'horizon', name: 'Cierre a pantalla completa' },
  { blockKey: 'closing', variantKey: 'envelope', name: 'Cierre en sobre con tarjeta' },
  { blockKey: 'closing', variantKey: 'album', name: 'Cierre en página de álbum' },
  /* El sexto, para `silk`: la nota apoyada en el papel, con el medallón del icono encabalgado
     sobre la fotografía. No dibuja ningún objeto, al revés que la carta y el sobre. */
  { blockKey: 'closing', variantKey: 'note', name: 'Cierre en nota sobre tarjeta' },
  /* El séptimo, para `monochrome`: la despedida entera en caligrafía y la firma en versalitas. Es
     el único que invierte la jerarquía tipográfica del bloque. */
  { blockKey: 'closing', variantKey: 'script', name: 'Cierre en caligrafía' },
  /* El octavo, para `sketch`, y el único simétrico: dos ramilletes espejados a los lados de la
     firma. */
  { blockKey: 'closing', variantKey: 'bouquet', name: 'Cierre entre ramilletes' },
  /* El noveno, para `gala`, y el único que envuelve el texto: dos ramas enfrentadas cerrando una
     guirnalda alrededor de la despedida. */
  { blockKey: 'closing', variantKey: 'wreath', name: 'Cierre en guirnalda' },
  { blockKey: 'footer', variantKey: 'centered', name: 'Pie centrado' },
  { blockKey: 'footer', variantKey: 'ribbon', name: 'Pie en cinta de color' },
  { blockKey: 'footer', variantKey: 'marquee', name: 'Pie con rótulo en movimiento' },
  /*
   * Sin `minPlanRank`, igual que las otras dos del bloque y a diferencia de las galerías o
   * los cronogramas de pago. No es un descuido: son el pie **por defecto** de dos plantillas
   * del catálogo, y una variante de Plus en la composición de una plantilla base la volvería
   * imposible de montar para un cliente de Esencial.
   */
  { blockKey: 'footer', variantKey: 'colophon', name: 'Pie en colofón editorial' },
  { blockKey: 'footer', variantKey: 'sprig', name: 'Pie en hoja rasgada con ramitas' },
  /* El sexto, para `silk`, y por lo mismo que los dos de arriba: sin él la plantilla nueva tenía
     que repetir un pie. Es el único que cierra en oscuro y centrado —la lámina del color
     principal con el monograma dentro de un doble cerco—; la cinta de `ribbon` también se tiñe,
     pero es de un solo renglón y reparte el contenido a los dos lados. */
  { blockKey: 'footer', variantKey: 'seal', name: 'Pie en lámina con sello' },
  /* El séptimo, para `monochrome`: un filete, el nombre en versalitas y nada más. Sin monograma,
     que es lo que lo separa de `centered`. */
  { blockKey: 'footer', variantKey: 'rule', name: 'Pie de un filete' },
  /* El octavo, para `sketch`: la franja del color principal bajo una onda, con el nombre vaciado
     dejando ver el color a través. */
  { blockKey: 'footer', variantKey: 'wave', name: 'Pie en franja ondulada' },
  /* El noveno, para `gala`, y el único enmarcado por los cuatro lados: el cartucho de doble
     filete con la corona encabalgada arriba. */
  { blockKey: 'footer', variantKey: 'frame', name: 'Pie en cartucho grabado' },
];

/**
 * Variantes que se dan de baja del catálogo, y por qué cuesta más que borrarlas.
 *
 * `rsvp.whatsapp` y `rsvp.form` no eran dos diseños: eran dos **mecanismos** —a dónde va el
 * botón— disfrazados de entradas del registro. Eso hoy es contenido del evento
 * (`destination`, en `domain/invitation/blocks/rsvp.ts`), así que el catálogo se quedaba con dos
 * opciones que prometían algo que la variante no decide.
 *
 * No se pueden borrar sin más: `event_blocks.variant_id` las referencia con `ON DELETE RESTRICT`
 * —a propósito, para que nadie deje una invitación publicada apuntando a una variante que ya no
 * existe—. Por eso el seed primero **reapunta** los bloques que las usaran a la variante de
 * reemplazo y solo después borra. En ese orden, la baja es segura aunque haya eventos vivos.
 */
const RETIRED_VARIANTS = {
  registryIds: ['rsvp.whatsapp', 'rsvp.form'],
  replacedBy: 'rsvp.card',
} as const;

/** Composición de la plantilla de presentación, en el orden en que se renderiza hoy. */
/**
 * Las plantillas estructurales del catálogo.
 *
 * Una plantilla **no** es una paleta ni un tipo de evento: es una forma de componer la
 * invitación. Dos cosas la definen, y las dos son estructura:
 *
 *   1. **Qué bloques lleva y en qué orden.** `storytelling` pone la galería antes que los datos
 *      porque narra; `classic` los pone después porque informa.
 *   2. **Qué variante lleva cada bloque.** Es lo que hace que la galería de `cinematic` y la de
 *      `editorial` no se parezcan en nada: una encuadra planos a pantalla completa y la otra
 *      maqueta un pliego con folios y pies de foto.
 *
 * El tema va aparte y encima: cualquiera de las nueve se puede vestir con cualquiera de los once
 * temas. Esa separación es la que evita que el catálogo crezca por multiplicación —nueve
 * estructuras por once temas son noventa y nueve invitaciones distintas, y ni una pieza de código
 * de más—.
 *
 * Cada una declara además el **tema con el que se diseñó** (`defaultThemeKey`). No lo impone: la
 * tipografía, el color y la densidad son del tema, y cualquiera de las nueve se puede vestir con
 * cualquiera de los once. Lo que hace es que al crear un evento el tema llegue ya elegido, y que
 * quien no quiera pensarlo se lleve la combinación que el catálogo enseña.
 */
/**
 * Con qué texto nace cada bloque al crear un evento.
 *
 * Es lo que separa una plantilla **preconstruida** de una lista de huecos. Un rótulo de sección
 * —«Nuestra historia», «Confirma tu asistencia»— no se puede derivar del evento porque no es un
 * dato del evento: es cómo la plantilla lo cuenta. Y sin él el bloque no valida, así que un
 * evento recién creado se quedaría sin esa sección hasta que alguien la escribiera a mano.
 *
 * Aquí están los comunes; cada plantilla sobreescribe los que le dan carácter. El contenido de
 * verdad —nombres, fecha, sedes, fotos— no está ni puede estar aquí: vive en el evento y lo
 * proyecta `domain/invitation/event-content.ts`.
 */
const BASE_BLOCK_CONFIG: Readonly<Record<string, Record<string, unknown>>> = {
  hero: { intro: 'Con mucha alegría te invitamos a celebrar' },
  story: { eyebrow: 'Nuestra historia', title: 'Cómo llegamos hasta aquí' },
  calendar: { eyebrow: 'Reserva la fecha', title: 'El gran día' },
  details: { eyebrow: 'Detalles', title: 'Lo que necesitas saber' },
  dresscode: { eyebrow: 'Código de vestimenta', title: 'Cómo vestir' },
  schedule: { eyebrow: 'Programa', title: 'Cómo será el día', marker: 'icon' },
  gallery: { eyebrow: 'Recuerdos', title: 'Momentos' },
  location: { eyebrow: 'Ubicación', title: 'Dónde nos vemos' },
  rsvp: {
    eyebrow: 'R.S.V.P.',
    title: 'Confirma tu asistencia',
    confirmLabel: 'Confirmar por WhatsApp',
  },
  closing: { eyebrow: 'Con cariño', title: 'Tu presencia hará este día aún más especial.' },
};

const TEMPLATES: {
  key: string;
  name: string;
  description: string;
  /** Para qué tipos de evento se sugiere. Vacío sería «para ninguno». */
  eventTypes: readonly string[];
  /** El tema con el que se diseñó. Preselecciona; no impide ninguna combinación. */
  defaultThemeKey: string;
  isActive: boolean;
  /** Bloques en orden. La posición se deduce del índice: el orden ES la estructura. */
  blocks: readonly {
    blockKey: string;
    variantKey: string;
    isRequired?: boolean;
    /** Lo que esta plantilla dice distinto del resto. Se mezcla sobre `BASE_BLOCK_CONFIG`. */
    config?: Record<string, unknown>;
  }[];
}[] = [
  {
    key: 'classic',
    name: 'Classic',
    description:
      'La estructura completa y en el orden esperado: se presenta, cuenta, informa y despide.',
    eventTypes: [
      'wedding',
      'quince',
      'baptism',
      'presentation',
      'graduation',
      'birthday',
      'baby_shower',
      'gender_reveal',
      'corporate',
    ],
    defaultThemeKey: 'floral',
    isActive: true,
    blocks: [
      /*
       * La portada centrada y no `hero.classic`, aunque los dos nombres inviten a lo contrario.
       * Que la variante se llame «classic» y la plantilla también es una coincidencia de
       * vocabulario, no un vínculo: `hero.classic` es la foto a sangre con el texto apoyado
       * abajo —el registro de un cartel, y por eso es la portada de `cinematic`—, mientras que
       * `hero.centered` es el eje central dentro de un marco de filete, que es la retórica de una
       * participación impresa. Esta estructura es la que se elige cuando no se quiere pensar, y
       * lo que se espera entonces es la participación.
       */
      { blockKey: 'hero', variantKey: 'centered', isRequired: true },
      { blockKey: 'story', variantKey: 'image-left' },
      { blockKey: 'details', variantKey: 'cards' },
      { blockKey: 'dresscode', variantKey: 'cards' },
      { blockKey: 'schedule', variantKey: 'vertical' },
      { blockKey: 'gallery', variantKey: 'grid' },
      /* Iglesia y salón, una al lado de la otra: la composición esperada de una boda, y la que
         hace que esta sea la estructura por defecto. */
      { blockKey: 'location', variantKey: 'dual-venue' },
      { blockKey: 'rsvp', variantKey: 'card', isRequired: true },
      { blockKey: 'closing', variantKey: 'split' },
      { blockKey: 'footer', variantKey: 'centered', isRequired: true },
    ],
  },
  {
    key: 'editorial',
    name: 'Editorial',
    description:
      'Lenguaje de revista: maqueta de pliego, folios, pies de foto a la vista y papelería impresa.',
    eventTypes: ['wedding', 'quince', 'graduation', 'corporate'],
    defaultThemeKey: 'elegance',
    isActive: true,
    blocks: [
      /* El retrato deshecho en el papel, con la fecha partida entre filetes. Es composición de
         estudio —tipografía y filetes haciendo la retícula—, que es de donde sale el lenguaje de
         esta estructura. La centrada, que estaba aquí, es más participación que revista. */
      { blockKey: 'hero', variantKey: 'portrait', isRequired: true },
      { blockKey: 'story', variantKey: 'image-right' },
      { blockKey: 'gallery', variantKey: 'editorial' },
      { blockKey: 'details', variantKey: 'list' },
      { blockKey: 'dresscode', variantKey: 'chart' },
      { blockKey: 'schedule', variantKey: 'agenda' },
      { blockKey: 'location', variantKey: 'single-split' },
      { blockKey: 'rsvp', variantKey: 'reply-card', isRequired: true },
      { blockKey: 'closing', variantKey: 'letter' },
      /* El colofón: doble filete, mancheta y corondeles. `footer.ribbon` —la franja de color— es
         interfaz y no papel impreso, y es el pie que le corresponde a `cinematic`. */
      { blockKey: 'footer', variantKey: 'colophon', isRequired: true },
    ],
  },
  {
    key: 'storytelling',
    name: 'Storytelling',
    description:
      'El orden narra: la historia y las fotos van antes que los datos, y el cierre remata.',
    eventTypes: ['wedding', 'quince', 'baptism', 'presentation', 'baby_shower'],
    defaultThemeKey: 'dreamy',
    isActive: true,
    blocks: [
      { blockKey: 'hero', variantKey: 'split', isRequired: true },
      /* La historia en una columna con la foto de banda, y no sobre la fotografía: en la
         estructura que narra manda la prosa, y `story.overlay` mete el texto en una tarjeta encima
         de la imagen, que acota lo que se puede contar a un párrafo. Aquella es la de `cinematic`,
         donde el límite de texto por vista es la regla. */
      { blockKey: 'story', variantKey: 'centered' },
      { blockKey: 'gallery', variantKey: 'polaroid' },
      /* El zigzag pide etiquetas cortas —ver su archivo— y esta es la estructura que se las puede
         dar: el cronograma llega después del relato y no tiene que explicar nada. */
      { blockKey: 'schedule', variantKey: 'zigzag' },
      { blockKey: 'details', variantKey: 'split' },
      { blockKey: 'dresscode', variantKey: 'thread' },
      /* «Primero aquí, después allá» es literalmente un orden que narra. Las franjas alternas de
         `dual-stacked` dicen lo mismo sin secuencia, y son las que encajan en una estructura que
         reparte por franjas y no por relato. */
      { blockKey: 'location', variantKey: 'dual-journey' },
      { blockKey: 'rsvp', variantKey: 'postcard', isRequired: true },
      /* La página final del álbum: la foto montada con esquineras y la despedida escrita al pie.
         Es donde termina un relato contado con instantáneas y cerrado con una postal; el cierre a
         pantalla completa cambiaría de registro en la última pantalla. */
      { blockKey: 'closing', variantKey: 'album' },
      { blockKey: 'footer', variantKey: 'marquee', isRequired: true },
    ],
  },
  {
    key: 'cinematic',
    name: 'Cinematic',
    description:
      'Todo a pantalla completa: planos panorámicos, franjas de color y muy poco texto por vista.',
    eventTypes: ['wedding', 'quince', 'gender_reveal'],
    defaultThemeKey: 'royal',
    isActive: true,
    blocks: [
      /* Sin `isRequired`: Esencial no tiene la bienvenida, y un bloque obligatorio que el plan
         del cliente no incluye sería una plantilla que no se puede montar. */
      { blockKey: 'welcome', variantKey: 'spotlight' },
      { blockKey: 'hero', variantKey: 'classic', isRequired: true },
      { blockKey: 'gallery', variantKey: 'cinematic' },
      { blockKey: 'story', variantKey: 'overlay' },
      /* Muy poco texto por vista es la regla de esta estructura: los momentos se distinguen por
         la hora en cuerpo grande, así que los iconos sobran y estorban. */
      { blockKey: 'schedule', variantKey: 'showcase', config: { marker: 'dot' } },
      { blockKey: 'details', variantKey: 'panel' },
      { blockKey: 'dresscode', variantKey: 'bands' },
      { blockKey: 'location', variantKey: 'single' },
      { blockKey: 'rsvp', variantKey: 'panel', isRequired: true },
      { blockKey: 'closing', variantKey: 'horizon' },
      { blockKey: 'footer', variantKey: 'ribbon', isRequired: true },
    ],
  },
  {
    key: 'botanical',
    name: 'Botanical',
    description:
      'Papelería de algodón: retrato enmarcado, el mes en una lámina rasgada y la paleta de vestimenta a la vista.',
    /*
     * Los cuatro tipos de evento donde la papelería impresa es la referencia. Se queda fuera lo
     * empresarial —un calendario con un corazón y una paleta de vestimenta no es el registro de
     * una convención— y las fiestas infantiles, que piden color y no papel de algodón.
     */
    eventTypes: ['wedding', 'quince', 'baptism', 'presentation'],
    defaultThemeKey: 'olive',
    isActive: true,
    /*
     * Fue la única estructura **sin historia y sin galería**, y era su argumento: informaba
     * —cuándo, a qué hora, dónde, de qué vestirse— y no contaba nada, así que se leía entera de
     * una pasada.
     *
     * Ya no. Los dos bloques se añadieron a propósito, y con ellos la plantilla deja de ser la
     * corta: es la papelería **completa**, que es lo que de verdad se parece a una invitación
     * impresa de boda —lámina, relato y láminas de la sesión—. Lo que la sigue separando de
     * `storytelling` no es que cuente menos, es el orden: aquí la fecha va antes del relato,
     * porque esta plantilla informa primero y narra después.
     *
     * Las dos variantes que estrenan —`story.pressed` y `gallery.plates`— se escribieron para
     * esto: de las que había libres, ninguna era papelería. Ver sus archivos.
     */
    blocks: [
      /* Sin `isRequired`: la bienvenida es de Plus en adelante, y un bloque obligatorio que el
         plan del cliente no incluye sería una plantilla que no se puede montar.

         `botanical` y no `torn`: la guirnalda es el ornamento de esta plantilla —la misma familia
         que la ramita de `hero.framed` y del pie— y, a diferencia del papel rasgado, **no está
         atada a un tipo de evento**, así que la boda y los XV pueden compartir puerta. Que la
         misma plantilla abriera de dos maneras distintas según se celebrara una cosa u otra era
         justo lo contrario de lo que una plantilla promete: que solo cambie el tema. */
      { blockKey: 'welcome', variantKey: 'botanical' },
      { blockKey: 'hero', variantKey: 'framed', isRequired: true },
      /* El registro de esta plantilla son los rótulos grabados de la papelería impresa —cortos,
         en un solo sustantivo—, no las frases de las otras cuatro. */
      { blockKey: 'calendar', variantKey: 'month', config: { eyebrow: 'Save the date', title: null } },
      /* El relato y la sesión van **después del calendario** y no tras la portada. La fecha es lo
         primero que se busca en una invitación, y esta plantilla se organiza por eso: informa y
         luego cuenta. Puestos antes, esto sería `storytelling` con otro papel. */
      { blockKey: 'story', variantKey: 'pressed', config: { eyebrow: 'Nosotros', title: 'La historia' } },
      { blockKey: 'gallery', variantKey: 'plates', config: { eyebrow: 'Recuerdos', title: 'Las fotos' } },
      { blockKey: 'schedule', variantKey: 'itinerary', config: { eyebrow: 'Itinerario', title: 'El día' } },
      { blockKey: 'location', variantKey: 'single-plate', config: { eyebrow: 'Dónde', title: 'La sede' } },
      /* «Dónde → qué hay que saber → cómo voy»: los detalles entran entre la sede y la vestimenta
         porque es el orden en que se preguntan, y porque el estacionamiento o la mesa de regalos
         se consultan junto al lugar y no junto a la fecha. */
      { blockKey: 'details', variantKey: 'program', config: { eyebrow: 'Detalles', title: 'Lo que hay que saber' } },
      { blockKey: 'dresscode', variantKey: 'palette', config: { eyebrow: 'Dress code', title: 'Etiqueta' } },
      { blockKey: 'rsvp', variantKey: 'torn', isRequired: true },
      { blockKey: 'closing', variantKey: 'envelope' },
      /* La última hoja de la papelería: otra hoja, de un tono distinto y rasgada por el canto de
         arriba, con el monograma grabado entre dos ramitas. Es el mismo material que la
         bienvenida, la franja del calendario y la confirmación de esta plantilla, y por eso
         cierra. El pie centrado, que estaba aquí, es el de `classic`. */
      { blockKey: 'footer', variantKey: 'sprig', isRequired: true },
    ],
  },
  {
    key: 'silk',
    name: 'Silk',
    description:
      'Piezas de papel sobre fondo crema: la portada en una tarjeta encima de la foto, las telas del dress code en fichas y el cierre en una lámina oscura.',
    /*
     * Los cuatro tipos donde una papelería de tarde-noche es la referencia. Fuera lo empresarial
     * —el registro es íntimo— y las fiestas infantiles, que piden color y no marfil y chocolate.
     */
    eventTypes: ['wedding', 'quince', 'graduation', 'presentation'],
    defaultThemeKey: 'silk',
    isActive: true,
    /*
     * La sexta estructura, y la primera que se arma **por planos** en vez de por retícula.
     *
     * Las cinco anteriores se distinguen por cómo reparten el ancho —dos columnas, franjas a
     * sangre, pliego enmarcado, retícula de revista—. Esta se distingue por lo que hay debajo:
     * casi cada sección es una pieza de papel apoyada sobre otra cosa, con su canto y su sombra.
     * La portada es una tarjeta encima de la fotografía, la confirmación es otra encimada sobre la
     * banda del final, la historia es una copia montada sobre la hoja del relato, y el dress code
     * y los detalles son pilas de fichas. Es una decisión de composición y no de color: con
     * cualquiera de los ocho temas se sigue leyendo así.
     *
     * Por eso estrena ocho variantes de golpe —portada, historia, cronograma, detalles,
     * vestimenta, confirmación, cierre y pie—. No es que las que había no valieran: es que la
     * regla de exclusividad ya no dejaba ninguna libre en esos bloques para boda ni para XV, y en
     * los pocos casos en que quedaba alguna (`rsvp.ticket`) era de otra familia visual. Ver
     * `docs/COMPONENTES.md`, «Cuando no queda variante libre, se escribe una».
     *
     * El orden es el de la referencia: presenta, cuenta, dice cuándo y dónde, luego lo práctico y
     * cómo vestir, después las fotos, y remata pidiendo la confirmación. El calendario no entra —
     * `calendar.month` es el único que existe y lo lleva `botanical`—, y aquí la fecha ya la dan
     * la portada y la cuenta regresiva de la bienvenida.
     */
    blocks: [
      /* Sin `isRequired`, como en las otras dos que la llevan: la bienvenida es de Plus en
         adelante, y un bloque obligatorio que el plan del cliente no incluye sería una plantilla
         imposible de montar.

         `countdown` es la única puerta que enseña el tiempo que falta, y es la sección que la
         referencia remata a pantalla completa: aquí abre en vez de cerrar, que es donde una
         cuenta atrás de verdad se mira. */
      { blockKey: 'welcome', variantKey: 'countdown' },
      { blockKey: 'hero', variantKey: 'card', isRequired: true },
      { blockKey: 'story', variantKey: 'mounted' },
      { blockKey: 'schedule', variantKey: 'cards' },
      /* Una sola sede en una tarjeta centrada: el mismo objeto —papel apoyado sobre el fondo— que
         el resto de la plantilla. Las dos columnas de `dual-venue` son de `classic`. */
      { blockKey: 'location', variantKey: 'single-card' },
      { blockKey: 'details', variantKey: 'stack' },
      { blockKey: 'dresscode', variantKey: 'swatches', config: { eyebrow: 'Dress code', title: 'Paleta de la noche' } },
      /* El collage desfasado: dos columnas a distinta altura y una fotografía cruzando el ancho
         al final. Es el mismo principio que el resto de la plantilla —piezas sueltas apoyadas
         sobre el fondo, cada una con su sombra— y por eso sustituyó al mosaico, que repartía en
         una cuadrícula con una foto destacada. */
      { blockKey: 'gallery', variantKey: 'offset' },
      { blockKey: 'rsvp', variantKey: 'raised', isRequired: true },
      { blockKey: 'closing', variantKey: 'note' },
      { blockKey: 'footer', variantKey: 'seal', isRequired: true },
    ],
  },
  {
    key: 'monochrome',
    name: 'Monochrome',
    description:
      'Papel blanco, fotografía en blanco y negro y la caligrafía como único ornamento. Sin una sola caja en toda la invitación.',
    /*
     * Solo boda y XV, y es la primera que se ofrece para tan pocos tipos. No es un descuido: la
     * fotografía en blanco y negro y la copperplate son el registro de una celebración formal, y
     * un bautizo o un baby shower con ese tratamiento se leen como un obituario. Ofrecer una
     * plantilla donde no encaja no amplía el catálogo, lo emborrona.
     */
    eventTypes: ['wedding', 'quince'],
    defaultThemeKey: 'ink',
    isActive: true,
    /*
     * La séptima estructura, y la que se define **por lo que quita**.
     *
     * Las seis anteriores se distinguen por lo que ponen —franjas de color, tarjetas, pliegos,
     * fichas, láminas—. Esta no tiene ni una caja, ni un medallón, ni un fondo teñido en toda la
     * invitación: el papel es blanco, la tinta es negra, las fotografías van en blanco y negro
     * (lo hace el tema con `photo.filter`, no los componentes) y lo único que adorna son los
     * rótulos en caligrafía y algún filete de un píxel.
     *
     * Eso obliga a nueve variantes nuevas, y no por la regla de exclusividad —que también—: es
     * que casi ninguna de las que había podía usarse aquí sin traicionar la idea. Cada una de las
     * nueve se escribió quitando la pieza gráfica que su bloque daba por supuesta: el medallón de
     * los detalles, la cápsula del plazo en la confirmación, la tarjeta de la sede, el filete
     * completo del cronograma, la franja de color del calendario, el monograma del pie.
     *
     * La única de las nueve que no nace de una supresión es `calendar.sheet`, y es la más
     * importante del lote: el bloque llevaba un solo diseño desde que existe, y aquí se supo por
     * fin qué distingue a dos —el mes entero contra siete días en un renglón—, que era la
     * condición que el registro se había puesto para escribir el segundo.
     *
     * El orden es el de la referencia: la fotografía y los nombres, el saludo, la fecha, las
     * fotos, el programa, dónde, cómo vestir, qué hay que saber y la confirmación.
     */
    blocks: [
      /* Sin `isRequired`, como en las otras tres que la llevan: la bienvenida es de Plus en
         adelante. `monogram` es la puerta que compone las iniciales a cuerpo enorme sobre la
         fotografía, que es el mismo gesto que la portada de esta estructura hace con los nombres:
         la puerta y la primera pantalla riman en vez de contarse dos cosas distintas. */
      { blockKey: 'welcome', variantKey: 'monogram' },
      { blockKey: 'hero', variantKey: 'script', isRequired: true },
      /* El saludo, con el rótulo de la referencia. El bloque se llama «historia» y aquí no cuenta
         una: se dirige a quien lee. Es el mismo contenido —rótulo, entradilla y párrafos— con
         otro papel, y por eso no hace falta un bloque nuevo. */
      { blockKey: 'story', variantKey: 'greeting', config: { eyebrow: null, title: 'Invitación' } },
      /* Sin rótulo propio: el calendario es la segunda mitad del saludo, no una sección aparte, y
         un titular en medio partiría en dos lo que en la referencia se lee de corrido. */
      { blockKey: 'calendar', variantKey: 'sheet', config: { eyebrow: null, title: null } },
      { blockKey: 'gallery', variantKey: 'carousel', config: { eyebrow: null, title: 'Nosotros' } },
      { blockKey: 'schedule', variantKey: 'hours', config: { eyebrow: null, title: 'Programa' } },
      { blockKey: 'location', variantKey: 'single-open', config: { eyebrow: null, title: 'La sede' } },
      { blockKey: 'dresscode', variantKey: 'discs', config: { eyebrow: null, title: 'Dress code' } },
      { blockKey: 'details', variantKey: 'notes', config: { eyebrow: null, title: 'Detalles' } },
      /*
       * Todos los rótulos van sin `eyebrow`, y es la única estructura que lo hace en bloque.
       *
       * El rótulo pequeño en versalitas se compone con un ornamento a cada lado (ver
       * `BlockHeading`), y esas dos piezas son justo lo que esta invitación no tiene. Sin ellos, el
       * título en caligrafía **es** el encabezado, que es como está en la referencia: una palabra
       * escrita a mano y debajo el contenido.
       */
      { blockKey: 'rsvp', variantKey: 'hairline', isRequired: true },
      { blockKey: 'closing', variantKey: 'script' },
      { blockKey: 'footer', variantKey: 'rule', isRequired: true },
    ],
  },
  {
    key: 'sketch',
    name: 'Sketch',
    description:
      'Ilustrada a mano: rótulos de letra vaciada, dibujos de línea en cada sección y manchas de color en vez de muestras.',
    /*
     * Los tipos donde una invitación dibujada no desentona. Se queda fuera lo empresarial —un
     * candelabro dibujado no es el registro de una convención— y, al revés que las demás, **sí**
     * entran las fiestas: un cumpleaños o un baby shower ilustrados son exactamente esto, y hasta
     * ahora el catálogo no tenía nada que ofrecerles que no fuera papelería formal.
     */
    eventTypes: ['wedding', 'quince', 'baby_shower', 'birthday', 'baptism'],
    defaultThemeKey: 'cocoa',
    isActive: true,
    /*
     * La octava estructura, y la primera **ilustrada**.
     *
     * Las siete anteriores se componen con tipografía, filetes, fotografías y color. Esta añade
     * una cosa que ninguna tenía: **dibujos**. Un lazo, unas alianzas, un candelabro, dos
     * ramilletes y una mesa puesta, todos de línea y todos del color del tema
     * (`shared/doodle-ornaments.tsx`). Y un segundo recurso que la recorre entera: el rótulo
     * **vaciado**, la letra dibujada con su contorno y el interior en papel —`.inv-outline-text`,
     * en `globals.css`—, que aparece en la portada, en el saludo, en el mes del calendario, en la
     * vestimenta, en los detalles y en el pie.
     *
     * Estrena ocho variantes, y esta vez tres de los doce bloques se reutilizaron enteros:
     * `welcome.band`, `schedule.ribbon` —que ya era el cronograma dibujado del catálogo, con sus
     * lazos y sus ilustraciones— y `gallery.mosaic`, más `rsvp.ticket`, que es papelería
     * troquelada y encaja con el tono. Es la primera estructura desde `silk` que no tiene que
     * escribirlo casi todo, y es porque el catálogo ya tenía piezas de esta familia.
     *
     * El orden es el de la referencia: la portada, el saludo, la fecha, el programa, la sede, la
     * vestimenta, los detalles y la confirmación.
     */
    blocks: [
      /* La bienvenida con banda de color, sin `isRequired` como las otras cuatro que la llevan.
         Es la más móvil del bloque —retrato arriba, franja abajo— y la única que ya usaba una
         mancha de color plena, que es el material de esta plantilla. */
      { blockKey: 'welcome', variantKey: 'band' },
      { blockKey: 'hero', variantKey: 'frame', isRequired: true },
      { blockKey: 'story', variantKey: 'bow', config: { eyebrow: null, title: 'Queridos invitados' } },
      { blockKey: 'calendar', variantKey: 'week', config: { eyebrow: null, title: null } },
      /* El cronograma que ya era dibujado: cinta con lazos y una ilustración por momento. No hizo
         falta escribir otro —es exactamente el registro de esta plantilla— y estaba libre porque
         ninguna otra estructura lo había reclamado. */
      { blockKey: 'schedule', variantKey: 'ribbon', config: { eyebrow: null, title: 'Programa' } },
      { blockKey: 'gallery', variantKey: 'mosaic', config: { eyebrow: null, title: 'Recuerdos' } },
      { blockKey: 'location', variantKey: 'single-scene', config: { eyebrow: null, title: 'El lugar' } },
      { blockKey: 'dresscode', variantKey: 'drops', config: { eyebrow: null, title: 'Dress code' } },
      { blockKey: 'details', variantKey: 'stickers', config: { eyebrow: null, title: 'Detalles' } },
      /* El pase troquelado: es la única confirmación del catálogo con una forma recortada, y en
         una invitación dibujada se lee como el ticket que acompaña a la tarjeta. */
      { blockKey: 'rsvp', variantKey: 'ticket', isRequired: true },
      { blockKey: 'closing', variantKey: 'bouquet' },
      { blockKey: 'footer', variantKey: 'wave', isRequired: true },
    ],
  },
  {
    key: 'gala',
    name: 'Gala',
    description:
      'Verde bosque y oro: la corona, el retrato enmarcado y la fecha grabada, todo en un eje y con guirnaldas de línea en los cantos.',
    /*
     * **Solo XV**, y es la primera plantilla del catálogo con un único tipo de evento.
     *
     * No es una limitación que se pueda quitar cambiando esta lista: `hero.crown` lleva la corona
     * escrita dentro —como el «XV» de `hero.quince`— y ofrecerla para una boda prometería otra
     * celebración, que es justo lo que el catálogo evita separando `welcome.crown` de
     * `welcome.luminous`. La consecuencia buena es que aquí la regla de exclusividad solo se
     * cruza con las otras siete en «quince».
     */
    eventTypes: ['quince'],
    defaultThemeKey: 'emerald',
    isActive: true,
    /*
     * La novena estructura, y la primera **oscura de catálogo**.
     *
     * «cinematic» ya se vestía de oscuro con el tema «royal», pero su composición es de cartel:
     * fotografías a sangre y muy poco texto por vista. Esta es lo contrario —una participación
     * grabada— y eso, sobre un fondo oscuro, cambia todas las reglas: no puede haber tarjetas
     * claras (abren agujeros de luz), ni franjas de color (el papel ya es la franja), ni sombras
     * (no se ven). Lo que queda para separar y destacar es **el filete dorado**, y de ahí salen
     * las nueve variantes: el retrato con su filete al canto, la fecha entre dos filetes, el
     * nombre de la sede entre otros dos, la confirmación en un cartucho de doble filete y el pie
     * dentro de otro.
     *
     * El segundo recurso es la **guirnalda**: la misma rama botánica que ya tenía la biblioteca,
     * recortada por los cantos de la portada y del cierre para que se lea impresa y no pegada.
     *
     * Se reutilizan tres bloques enteros: `welcome.crown` —la puerta de XV, que estaba libre y
     * lleva la misma corona que la portada—, `gallery.parallax` y el tipo de contenido de siempre.
     * Y se **omite la historia**: la referencia no la tiene, porque en una participación de XV lo
     * que iría ahí —los padres, los padrinos, la frase de invitación— va en la portada.
     */
    blocks: [
      /* La puerta de unos XV: corona en vez de alianzas. Es la hermana de `welcome.luminous` y
         estaba libre porque ninguna estructura la había reclamado — es exactamente para esto. */
      { blockKey: 'welcome', variantKey: 'crown' },
      { blockKey: 'hero', variantKey: 'crown', isRequired: true },
      { blockKey: 'calendar', variantKey: 'band', config: { eyebrow: null, title: null } },
      { blockKey: 'location', variantKey: 'single-plaque', config: { eyebrow: null, title: 'Recepción' } },
      { blockKey: 'schedule', variantKey: 'leaders', config: { eyebrow: null, title: 'Itinerario de actividades' } },
      { blockKey: 'gallery', variantKey: 'parallax', config: { eyebrow: null, title: 'Recuerdos' } },
      /* «Qué hay que saber» antes que «cómo voy»: en la referencia, la sugerencia de regalo y la
         barra de bebidas van juntas y antes de la vestimenta. */
      { blockKey: 'details', variantKey: 'column', config: { eyebrow: null, title: 'Detalles' } },
      { blockKey: 'dresscode', variantKey: 'label', config: { eyebrow: null, title: 'Vestimenta' } },
      { blockKey: 'rsvp', variantKey: 'engraved', isRequired: true },
      { blockKey: 'closing', variantKey: 'wreath' },
      { blockKey: 'footer', variantKey: 'frame', isRequired: true },
    ],
  },
];

/**
 * Ninguna plantilla del catálogo repite una variante de otra plantilla **del mismo tipo de
 * evento**.
 *
 * Es la regla que sostiene el plan Esencial. Ahí el cliente no intercambia nada: se lleva la
 * plantilla como está, así que lo único que separa una de otra es su composición. Dos plantillas
 * de boda que comparten el cronograma y el pie son, para quien las compara en el escaparate, la
 * misma invitación con otra foto — y el catálogo aparenta un tamaño que no tiene.
 *
 * ## Por qué el alcance es el tipo de evento y no el catálogo entero
 *
 * Porque nadie compara una plantilla de boda con una de XV: quien entra a elegir ya sabe qué
 * celebra, y solo ve las suyas. Que `botanical` y su hermana de XV compartan el calendario en
 * lámina no le quita nada a ninguna de las dos, y prohibirlo obligaría a duplicar la biblioteca
 * entera por tipo de evento — que es exactamente lo que `docs/PROJECT.md` no quiere.
 *
 * La consecuencia práctica es que una plantilla ofrecida para varios tipos entra en varias
 * comparaciones a la vez: las cinco de aquí se ofrecen todas para boda y para XV, así que en la
 * práctica tienen que ser disjuntas entre sí. Cuando llegue una solo para «corporate», podrá
 * reutilizar lo que quiera de las demás siempre que ningún otro candidato de «corporate» lo use.
 *
 * ## Por qué es una comprobación y no una convención
 *
 * Porque la duplicación no se ve leyendo el archivo. Estas composiciones ya llegaron a repetir
 * seis variantes —`cinematic` compartía cinco con sus vecinas— y nadie lo notó en varias
 * revisiones: hay que cruzar cinco listas de nueve líneas mentalmente. Aquí falla al sembrar, con
 * el nombre de las dos plantillas y la variante, y antes de escribir nada en la base.
 *
 * Esto **no** limita a Plus ni a Premium. Ahí intercambiar variantes es precisamente lo que se
 * vende, y cualquier plantilla puede acabar con cualquier variante del bloque: lo que se protege
 * es la composición **de partida** del catálogo.
 */
function assertTemplateVariantsAreExclusive(): void {
  /* Por tipo de evento, qué plantilla reclamó cada `registry_id`. */
  const claimedByEventType = new Map<string, Map<string, string>>();
  const collisions: string[] = [];

  for (const template of TEMPLATES) {
    for (const eventTypeKey of template.eventTypes) {
      let claimed = claimedByEventType.get(eventTypeKey);

      if (!claimed) {
        claimed = new Map<string, string>();
        claimedByEventType.set(eventTypeKey, claimed);
      }

      for (const block of template.blocks) {
        const registryId = `${block.blockKey}.${block.variantKey}`;
        const owner = claimed.get(registryId);

        if (owner) {
          collisions.push(
            `${eventTypeKey}: «${owner}» y «${template.key}» comparten ${registryId}`,
          );
          continue;
        }

        claimed.set(registryId, template.key);
      }
    }
  }

  if (collisions.length > 0) {
    throw new Error(
      `Plantillas que repiten variante dentro de un mismo tipo de evento:\n  ${collisions.join('\n  ')}`,
    );
  }
}

/**
 * Los temas de la biblioteca.
 *
 * La forma de los tokens la define `src/domain/invitation/theme.ts`, y es la misma para todos:
 * los colores se nombran por el **papel que cumplen** —`primary`, `ink`, `surface`— y no por
 * lo que son. El tema anterior los nombraba `plum`, `pink`, `blush`, y eso ataba los
 * componentes a un tema concreto: una portada que pinta con `plum` no significa nada en un
 * tema verde. Con papeles, una variante se escribe una vez y sirve para los cuatro de aquí
 * abajo y para los que vengan.
 *
 * Las tipografías apuntan a las variables que publica `app/layout.tsx` con `next/font`, no a
 * nombres de familia sueltos: así el tema usa la fuente ya descargada y servida desde este
 * dominio, en lugar de pedirle al navegador una 'Playfair Display' que no está instalada en
 * ningún teléfono y acaba cayendo en Times New Roman.
 *
 * Los cuatro no son variaciones de lo mismo a propósito. Cubren los cuatro registros que pide
 * el catálogo de eventos —fiesta infantil, formal claro, natural, nocturno— y entre ellos hay
 * un tema oscuro, que es el que destapa los componentes que dan por hecho que el papel es
 * claro.
 */
/**
 * Los temas de la biblioteca: siete direcciones de arte, no siete paletas.
 *
 * La forma de los tokens la define `src/domain/invitation/theme.ts`. Los colores se nombran por
 * el **papel que cumplen** —`primary`, `ink`, `surface`— y no por lo que son, que es lo que
 * permite que una variante escrita una vez sirva para los siete y para los que vengan.
 *
 * ## Qué hace que dos temas se vean distintos de verdad
 *
 * La paleta es lo que menos. Un tema aquí decide además:
 *
 *   · **La tipografía** (`fonts`). Es el cambio que más carácter mueve: la misma portada con un
 *     garalde fino o con una didona de alto contraste son dos productos.
 *   · **La densidad** (`space.block`). Lo que separa a «minimal» de «royal» no es el color, es
 *     cuánto aire hay entre secciones.
 *   · **El tratamiento de las fotografías** (`photo.filter`). La misma foto que sube el cliente
 *     sale cálida y lavada en «elegance» y con contraste de cine en «royal».
 *   · **El ornamento** (`ornament`). Filete a secas, rombo, punto o nada.
 *
 * Los cuatro se aplican en piezas compartidas —`BlockSection`, `BlockImage`, `BlockOrnament`—,
 * así que un tema nuevo no toca ni un componente de bloque.
 *
 * ## Los once son del catálogo, y ninguno de un cliente
 *
 * Hubo otro, `saja-boys`, que era la paleta de la fiesta de un cliente concreto. Se retiró:
 * `docs/PROJECT.md` es explícito en que lo que solo beneficia a un cliente es una personalización
 * y no parte del núcleo, y un catálogo con la paleta de una fiesta dentro deja de ser un catálogo.
 */
const THEMES = [
  {
    key: 'elegance',
    name: 'Elegance',
    description: 'Marfil, champán y oro. Editorial y refinada, para bodas y XV formales.',
    isActive: true,
    tokens: {
      colors: {
        background: '#faf7f2',
        surface: '#fffdf9',
        ink: '#3a332b',
        inkSoft: '#7c7266',
        primary: '#8a7351',
        onPrimary: '#fdfbf6',
        accent: '#b99a63',
        line: '#e8e0d3',
        overlay: 'rgba(40, 33, 24, 0.42)',
      },
      fonts: {
        display: "var(--font-cormorant, 'Cormorant Garamond'), Georgia, serif",
        body: "var(--font-jost, 'Jost'), 'Helvetica Neue', Arial, sans-serif",
        script: "var(--font-sacramento, 'Sacramento'), cursive",
      },
      /* Cantos vivos: en una participación impresa no hay esquinas redondeadas, y el radio es
         justo el detalle que delata que algo se diseñó para una app. */
      radii: { sm: '0px', md: '2px', lg: '2px' },
      shadows: { soft: '0 20px 50px -34px rgba(60, 48, 30, 0.45)' },
      motion: { reveal: '0.9s cubic-bezier(0.22, 1, 0.36, 1)' },
      /* Mucho aire: es la mitad de lo que hace que algo se lea como caro. */
      space: { block: 'clamp(5rem, 11vw, 9rem)' },
      /* Cálida y ligeramente lavada, como una fotografía impresa en papel de algodón. */
      photo: { filter: 'saturate(0.9) contrast(0.97) sepia(0.06)' },
      /* Rombo: el ornamento clásico de la papelería de boda. */
      ornament: { line: '2rem', node: '5px', nodeRadius: '1px', nodeRotate: '45deg', opacity: '0.6' },
      /* Canto recto, por lo mismo que los radios: una participación impresa se corta a guillotina. */
      edge: { height: '0px' },
    },
  },
  {
    key: 'minimal',
    name: 'Minimal',
    description: 'Blanco, negro y beige. Arquitectónica, sin decoración y con mucho aire.',
    isActive: true,
    tokens: {
      colors: {
        background: '#ffffff',
        surface: '#f6f6f4',
        ink: '#111111',
        inkSoft: '#6a6a68',
        primary: '#111111',
        onPrimary: '#ffffff',
        accent: '#8a8a84',
        line: '#e3e3df',
        overlay: 'rgba(0, 0, 0, 0.45)',
      },
      fonts: {
        display: "var(--font-manrope, 'Manrope'), 'Helvetica Neue', Arial, sans-serif",
        body: "var(--font-manrope, 'Manrope'), 'Helvetica Neue', Arial, sans-serif",
        script: "var(--font-manrope, 'Manrope'), 'Helvetica Neue', Arial, sans-serif",
      },
      radii: { sm: '0px', md: '0px', lg: '0px' },
      shadows: { soft: '0 1px 0 0 rgba(17, 17, 17, 0.08)' },
      motion: { reveal: '0.6s cubic-bezier(0.16, 1, 0.3, 1)' },
      space: { block: 'clamp(5.5rem, 12vw, 10rem)' },
      /* Neutra y con un punto de contraste: la foto se defiende sola o no entra. */
      photo: { filter: 'saturate(0.85) contrast(1.06)' },
      /* Sin nodo: el ornamento de este tema es no tener ornamento. */
      ornament: { line: '2.5rem', node: '0px', nodeRadius: '0px', nodeRotate: '0deg', opacity: '0.35' },
      /* Ni radios ni ondas: en este tema una curva decorativa sería el único gesto de la página. */
      edge: { height: '0px' },
    },
  },
  {
    key: 'royal',
    name: 'Royal',
    description: 'Vino, negro y oro sobre fondo oscuro. Dramática y cinematográfica.',
    isActive: true,
    tokens: {
      colors: {
        background: '#140a0d',
        surface: '#1e1116',
        ink: '#f4e9df',
        inkSoft: '#bda69e',
        primary: '#7c1f35',
        onPrimary: '#fbeee2',
        accent: '#c8a45a',
        line: '#3a2129',
        overlay: 'rgba(10, 4, 6, 0.55)',
      },
      fonts: {
        /* Didona de alto contraste, solo para titulares grandes: es donde Playfair brilla y
           donde ninguna otra de las cargadas hace lo mismo. */
        display: "var(--font-playfair, 'Playfair Display'), Georgia, serif",
        body: "var(--font-jost, 'Jost'), 'Helvetica Neue', Arial, sans-serif",
        script: "var(--font-sacramento, 'Sacramento'), cursive",
      },
      radii: { sm: '0px', md: '2px', lg: '4px' },
      shadows: { soft: '0 30px 70px -40px rgba(0, 0, 0, 0.9)' },
      motion: { reveal: '1s cubic-bezier(0.22, 1, 0.36, 1)' },
      space: { block: 'clamp(4.5rem, 10vw, 8rem)' },
      /* Contraste de cine y una pizca de frío: es lo que separa una foto de fiesta de una
         fotografía de boda editorial. */
      photo: { filter: 'saturate(1.05) contrast(1.14) brightness(0.94)' },
      ornament: { line: '2.25rem', node: '6px', nodeRadius: '1px', nodeRotate: '45deg', opacity: '0.75' },
      /* El corte a escuadra es parte del drama: una onda lo volvería amable. */
      edge: { height: '0px' },
    },
  },
  {
    key: 'floral',
    name: 'Floral',
    description: 'Salvia, blush y crema. Romántica y natural, para eventos de día.',
    isActive: true,
    tokens: {
      colors: {
        background: '#f5f3ec',
        surface: '#ffffff',
        ink: '#33402f',
        inkSoft: '#6f7c6b',
        primary: '#5b7355',
        onPrimary: '#f8fbf4',
        accent: '#c98b86',
        line: '#dfe3d6',
        overlay: 'rgba(30, 40, 28, 0.4)',
      },
      fonts: {
        display: "var(--font-cormorant, 'Cormorant Garamond'), Georgia, serif",
        body: "var(--font-jost, 'Jost'), 'Helvetica Neue', Arial, sans-serif",
        script: "var(--font-sacramento, 'Sacramento'), cursive",
      },
      radii: { sm: '6px', md: '14px', lg: '28px' },
      shadows: { soft: '0 22px 50px -32px rgba(45, 60, 42, 0.4)' },
      motion: { reveal: '0.8s cubic-bezier(0.22, 1, 0.36, 1)' },
      space: { block: 'clamp(4.5rem, 10vw, 8rem)' },
      /* Luz de día: un punto más de saturación y menos contraste, como una foto al aire libre. */
      photo: { filter: 'saturate(1.06) contrast(0.98) brightness(1.02)' },
      /* Punto redondo: forma orgánica, sin aristas. */
      ornament: { line: '1.75rem', node: '5px', nodeRadius: '50%', nodeRotate: '0deg', opacity: '0.55' },
      /* Cantos ondulados: el mismo criterio que los radios generosos, ahora en las franjas. */
      edge: { height: 'clamp(1.75rem, 5vw, 3.25rem)' },
    },
  },
  {
    key: 'dreamy',
    name: 'Dreamy',
    description: 'Lavanda, azul suave y rosa. Etérea y ligera, para baby shower y revelaciones.',
    isActive: true,
    tokens: {
      colors: {
        background: '#f7f5fc',
        surface: '#ffffff',
        ink: '#3b3550',
        inkSoft: '#7b7492',
        primary: '#8272c0',
        onPrimary: '#fbfaff',
        accent: '#dc9cc2',
        line: '#e6e1f2',
        overlay: 'rgba(50, 44, 80, 0.38)',
      },
      fonts: {
        display: "var(--font-cormorant, 'Cormorant Garamond'), Georgia, serif",
        body: "var(--font-jost, 'Jost'), 'Helvetica Neue', Arial, sans-serif",
        script: "var(--font-sacramento, 'Sacramento'), cursive",
      },
      /* Todo muy redondeado: es lo que hace que un diseño se lea como suave antes de leer nada. */
      radii: { sm: '10px', md: '20px', lg: '34px' },
      shadows: { soft: '0 26px 60px -34px rgba(90, 78, 140, 0.4)' },
      /* La entrada más lenta de las seis: aquí el movimiento es parte del carácter. */
      motion: { reveal: '1.05s cubic-bezier(0.22, 1, 0.36, 1)' },
      space: { block: 'clamp(4.5rem, 10vw, 8.5rem)' },
      /* Aclarada y con poco contraste: el aire lechoso de una fotografía a contraluz. */
      photo: { filter: 'saturate(0.95) contrast(0.93) brightness(1.06)' },
      ornament: { line: '1.5rem', node: '6px', nodeRadius: '50%', nodeRotate: '0deg', opacity: '0.45' },
      /* La onda más alta de los siete: aquí nada tiene una arista, ni las franjas. */
      edge: { height: 'clamp(2rem, 6vw, 4rem)' },
    },
  },
  {
    key: 'corporate',
    name: 'Corporate',
    description: 'Azul marino, blanco y gris. Profesional, estructurada y de alta legibilidad.',
    isActive: true,
    tokens: {
      colors: {
        background: '#f7f8fa',
        surface: '#ffffff',
        ink: '#16202e',
        inkSoft: '#5b6675',
        primary: '#16324f',
        onPrimary: '#f6f9fc',
        accent: '#2f7bbf',
        line: '#dde3ea',
        overlay: 'rgba(12, 20, 32, 0.45)',
      },
      fonts: {
        display: "var(--font-manrope, 'Manrope'), 'Helvetica Neue', Arial, sans-serif",
        body: "var(--font-manrope, 'Manrope'), 'Helvetica Neue', Arial, sans-serif",
        script: "var(--font-manrope, 'Manrope'), 'Helvetica Neue', Arial, sans-serif",
      },
      radii: { sm: '4px', md: '8px', lg: '12px' },
      shadows: { soft: '0 18px 40px -30px rgba(16, 32, 52, 0.5)' },
      /* Rápida y sin florituras: en un evento de empresa, la animación no debe hacerse notar. */
      motion: { reveal: '0.5s cubic-bezier(0.16, 1, 0.3, 1)' },
      space: { block: 'clamp(4rem, 8vw, 6.5rem)' },
      photo: { filter: 'saturate(0.95) contrast(1.05)' },
      /* Marca cuadrada: geometría, no adorno. */
      ornament: { line: '2rem', node: '4px', nodeRadius: '0px', nodeRotate: '0deg', opacity: '0.5' },
      /* Geometría, no adorno: las franjas se cortan rectas. */
      edge: { height: '0px' },
    },
  },
  {
    key: 'olive',
    name: 'Olive',
    description: 'Oliva, marfil y oro viejo. Botánica y de papel de algodón, para bodas de jardín.',
    isActive: true,
    tokens: {
      colors: {
        /* Marfil cálido, no blanco: es el papel de algodón, y es lo que hace que el oro de al lado
           se lea como oro viejo y no como amarillo. */
        background: '#f6f1e8',
        surface: '#fffdf8',
        ink: '#3b3a30',
        inkSoft: '#7a7768',
        primary: '#5a6350',
        onPrimary: '#f7f4ec',
        accent: '#b79a63',
        line: '#e2dbcb',
        overlay: 'rgba(34, 38, 28, 0.44)',
      },
      fonts: {
        display: "var(--font-cormorant, 'Cormorant Garamond'), Georgia, serif",
        body: "var(--font-jost, 'Jost'), 'Helvetica Neue', Arial, sans-serif",
        script: "var(--font-sacramento, 'Sacramento'), cursive",
      },
      /* Cantos casi vivos: este tema imita papel troquelado, y el redondeo es justo el detalle que
         delata que algo se diseñó para una app. El 3px del radio medio es para las tarjetas —la del
         sobre del cierre—, donde a cero se ven como recortadas con tijera. */
      radii: { sm: '2px', md: '3px', lg: '4px' },
      shadows: { soft: '0 18px 44px -30px rgba(50, 54, 38, 0.5)' },
      motion: { reveal: '0.85s cubic-bezier(0.22, 1, 0.36, 1)' },
      space: { block: 'clamp(4.5rem, 10vw, 8rem)' },
      /* Verde de jardín a media tarde: un punto más de calidez y algo lavada, como una fotografía
         impresa en papel de algodón. */
      photo: { filter: 'saturate(0.94) contrast(0.98) sepia(0.05)' },
      /* Punto redondo y muy tenue: la botánica de este tema la ponen las ramitas dibujadas de los
         bloques, y un rombo dorado al lado de cada rótulo sería un ornamento de más. */
      ornament: { line: '2rem', node: '4px', nodeRadius: '50%', nodeRotate: '0deg', opacity: '0.5' },
      /*
       * Canto recto, y aquí la razón no es la de «elegance».
       *
       * Las franjas de esta plantilla —el calendario y la confirmación— se rompen con un canto
       * **rasgado** que dibuja el propio componente (`shared/paper-ornaments.tsx`), porque el papel
       * roto es la firma de la plantilla y no una opción del tema. Con la onda de `BlockCurve`
       * encima saldrían dos cantos distintos peleándose en el mismo borde, así que la onda se deja
       * a cero: cada franja tiene un solo canto, y es el que su componente eligió.
       */
      edge: { height: '0px' },
    },
  },
  {
    key: 'silk',
    name: 'Silk',
    description: 'Chocolate, marfil y oro. Nocturna y de papel grueso, para bodas de tarde-noche.',
    isActive: true,
    tokens: {
      colors: {
        /*
         * El chocolate va en `primary` y no en el fondo, y esa es la decisión del tema.
         *
         * La referencia de la que sale reparte así: casi toda la invitación sobre un crema cálido,
         * y el marrón muy oscuro reservado a las piezas que rematan —el botón, la lámina del
         * final—. Puesto en el fondo, el tema se convertiría en otro «royal»: dramático y de
         * pantalla completa, que es un producto que el catálogo ya tiene. Guardado para las
         * láminas, el contraste aparece dos o tres veces en toda la lectura, y por eso pesa.
         */
        background: '#f3ede2',
        surface: '#fffcf6',
        ink: '#2f2620',
        inkSoft: '#7c7065',
        primary: '#2c2119',
        onPrimary: '#f6efe3',
        accent: '#a98a55',
        line: '#e3d9c8',
        overlay: 'rgba(30, 22, 16, 0.5)',
      },
      fonts: {
        display: "var(--font-cormorant, 'Cormorant Garamond'), Georgia, serif",
        body: "var(--font-jost, 'Jost'), 'Helvetica Neue', Arial, sans-serif",
        script: "var(--font-sacramento, 'Sacramento'), cursive",
      },
      /* Un pelo de radio, no cero: aquí las piezas son tarjetas apoyadas sobre el fondo —la
         portada, las fichas, la confirmación— y a canto vivo se ven recortadas con guillotina en
         vez de troqueladas. Es lo contrario que en «elegance», donde no hay tarjetas flotando. */
      radii: { sm: '3px', md: '6px', lg: '10px' },
      /* La sombra es el tema. Toda la composición se sostiene sobre piezas que levantan del
         fondo, así que va más larga y más abierta que la de los otros siete: sin ella, las mismas
         tarjetas se leen como recuadros con borde. */
      shadows: { soft: '0 26px 60px -32px rgba(44, 33, 25, 0.55)' },
      motion: { reveal: '0.9s cubic-bezier(0.22, 1, 0.36, 1)' },
      space: { block: 'clamp(4.75rem, 10vw, 8.5rem)' },
      /* Cálida y con un punto de contraste: la luz de tarde de la referencia, no el lavado de
         «elegance» ni el frío de cine de «royal». */
      photo: { filter: 'saturate(0.92) contrast(1.04) sepia(0.08)' },
      /* Punto redondo pequeño: el filete con su nudo es el separador que esta plantilla usa entre
         piezas, y tiene que leerse a tamaño pequeño dentro de una tarjeta. */
      ornament: { line: '2rem', node: '4px', nodeRadius: '50%', nodeRotate: '0deg', opacity: '0.6' },
      /* Recto: las láminas de esta plantilla se cortan a escuadra y lo que las separa del fondo es
         la sombra, no el troquel. Una onda encima sería un segundo canto contando otra cosa. */
      edge: { height: '0px' },
    },
  },
  {
    key: 'ink',
    name: 'Ink',
    description:
      'Blanco, tinta y caligrafía inglesa. Las fotografías salen en blanco y negro: es el tema el que las revela.',
    isActive: true,
    tokens: {
      colors: {
        /* Blanco puro, y es el único de los nueve que lo usa. Los demás calientan el papel —marfil,
           crema, hueso— porque imitan un material impreso; aquí el papel no imita nada: es la
           pantalla en blanco contra la que se recorta una fotografía en blanco y negro. */
        background: '#ffffff',
        /* Y por eso `surface` tiene que ser gris y no otro blanco: en un tema donde el fondo ya es
           #fff, una tarjeta blanca sobre fondo blanco desaparece. Esta estructura no usa tarjetas,
           pero el tema se puede poner sobre cualquiera de las otras seis. */
        surface: '#f6f5f3',
        ink: '#14110f',
        inkSoft: '#7c7873',
        primary: '#14110f',
        onPrimary: '#ffffff',
        /* Un pardo cálido y **oscuro**. El acento aquí no adorna filetes: rotula los detalles, y
           tiene que leerse a trece píxeles sobre blanco. Los dorados claros de «elegance» o «silk»
           en ese papel se quedan en una insinuación. */
        accent: '#7a6e5d',
        line: '#e6e3de',
        overlay: 'rgba(10, 9, 8, 0.5)',
      },
      fonts: {
        display: "var(--font-cormorant, 'Cormorant Garamond'), Georgia, serif",
        body: "var(--font-jost, 'Jost'), 'Helvetica Neue', Arial, sans-serif",
        /* La copperplate, y no la manuscrita de los otros temas. Es la mitad del carácter de este:
           aquí la caligrafía no firma al pie, **es** el titular de cada sección. Ver la nota de
           `Pinyon_Script` en `app/layout.tsx`. */
        script: "var(--font-pinyon, 'Pinyon Script'), cursive",
      },
      /* El radio grande es para las fotografías —en la referencia todas van con la esquina
         redondeada—, y el medio para el botón, que es la única pieza de interfaz de la
         invitación. El pequeño casi a cero: no hay nada más que redondear. */
      radii: { sm: '2px', md: '10px', lg: '18px' },
      /* Prácticamente no hay sombra, y es coherente: en esta invitación nada levanta del papel.
         Se deja un pelo para las piezas de otras estructuras que la den por supuesta. */
      shadows: { soft: '0 12px 32px -28px rgba(20, 17, 15, 0.5)' },
      motion: { reveal: '0.85s cubic-bezier(0.22, 1, 0.36, 1)' },
      /* Mucho aire, como «elegance»: sin cajas ni filetes, el blanco entre secciones es lo único
         que separa una de otra. */
      space: { block: 'clamp(5rem, 11vw, 9rem)' },
      /*
       * Blanco y negro de verdad, y aquí está el tema entero.
       *
       * Es la primera vez que `photo.filter` hace algo más que matizar: revela **todas** las
       * fotografías de la invitación en gris, y esa decisión no la toma ningún componente ni
       * obliga al cliente a subir las fotos ya convertidas. Cambiar a otro tema devuelve el color
       * al instante, que es exactamente lo que este token existe para poder hacer.
       *
       * El punto de contraste extra compensa lo que el gris se lleva: sin color, una fotografía
       * plana se queda sin ningún plano que la ordene.
       */
      photo: { filter: 'grayscale(1) contrast(1.08)' },
      /* Sin nudo: el ornamento de este tema es un filete y nada más, como en «minimal». Un rombo
         dorado al lado de un rótulo en copperplate son dos adornos discutiendo. */
      ornament: { line: '2.5rem', node: '0px', nodeRadius: '0px', nodeRotate: '0deg', opacity: '0.4' },
      edge: { height: '0px' },
    },
  },
  {
    key: 'cocoa',
    name: 'Cocoa',
    description: 'Crema, tinta cacao y pasteles apagados. Redonda y dibujada a mano, para bodas y fiestas ilustradas.',
    isActive: true,
    tokens: {
      colors: {
        background: '#fdf5e9',
        surface: '#fffaf1',
        /* Cacao y no negro. Toda la invitación está dibujada con un solo trazo de color, y ese
           trazo es el que hace de tinta: un negro puro al lado de un crema cálido corta el papel,
           y lo que se quiere es que el dibujo parezca hecho con el mismo rotulador que el texto. */
        ink: '#6f3a37',
        inkSoft: '#a4736e',
        primary: '#8c4a44',
        onPrimary: '#fff8f0',
        accent: '#c9847c',
        line: '#ecd9c8',
        overlay: 'rgba(70, 35, 33, 0.42)',
      },
      fonts: {
        /* Fredoka: el único palo seco redondo del catálogo, y aquí no es un gusto. Los rótulos de
           esta plantilla van **vaciados** —el contorno hace de letra— y eso solo funciona con una
           letra gorda y de formas cerradas: con un garalde fino, el contorno de una «e» se cruza
           consigo mismo y el hueco desaparece. Ver `.inv-outline-text` en `globals.css`. */
        display: "var(--font-fredoka, 'Fredoka'), 'Trebuchet MS', sans-serif",
        body: "var(--font-jost, 'Jost'), 'Helvetica Neue', Arial, sans-serif",
        /* Sacramento y no la copperplate de «ink»: aquí la manuscrita es la de una nota escrita a
           mano con rotulador, no la de una pluma de punta flexible. Es la que rima con el trazo
           de los dibujos. */
        script: "var(--font-sacramento, 'Sacramento'), cursive",
      },
      /* Todo redondeado, como las formas de la plantilla. El radio grande es el de las
         fotografías; el medio, el del botón, que en esta invitación se lee como una pastilla. */
      radii: { sm: '8px', md: '16px', lg: '26px' },
      shadows: { soft: '0 20px 44px -30px rgba(110, 58, 55, 0.4)' },
      motion: { reveal: '0.75s cubic-bezier(0.34, 1.3, 0.64, 1)' },
      space: { block: 'clamp(4.25rem, 9vw, 7.5rem)' },
      /* Cálida y algo lavada: una fotografía impresa y pegada en un cuaderno, no un archivo
         recién salido de la cámara. */
      photo: { filter: 'saturate(0.92) sepia(0.12) contrast(0.97)' },
      /* Punto redondo y bien visible: es el único ornamento de tema que se ve al lado de los
         dibujos, y un rombo o un cuadrado serían la única arista de la página. */
      ornament: { line: '1.75rem', node: '5px', nodeRadius: '50%', nodeRotate: '0deg', opacity: '0.6' },
      /* Y el canto ondulado, que aquí sí se usa: la banda de la historia y la franja del pie lo
         piden, y es la misma mano que dibuja los ramilletes. */
      edge: { height: 'clamp(1.75rem, 5vw, 3.25rem)' },
    },
  },
  {
    key: 'emerald',
    name: 'Emerald',
    description: 'Verde bosque y oro viejo sobre fondo oscuro. Grabada y formal, para XV y bodas de noche.',
    isActive: true,
    tokens: {
      colors: {
        /*
         * El segundo tema oscuro del catálogo, y hay que decir en qué se diferencia de «royal»
         * para que no sean dos versiones de lo mismo: aquel es vino y negro, de contraste alto y
         * fotografía de cine; este es verde botella y oro, de contraste bajo y todo dorado. Uno es
         * dramático, el otro es formal — y se nota sobre todo en el acento, que allí destaca y
         * aquí **acompaña**: en una participación grabada, el oro es el color del filete.
         */
        background: '#0f2a22',
        surface: '#16382e',
        ink: '#f0e7d4',
        inkSoft: '#b9ac8e',
        primary: '#1c453a',
        onPrimary: '#f6efdd',
        accent: '#c9a961',
        line: '#2c5a4b',
        overlay: 'rgba(6, 22, 17, 0.55)',
      },
      fonts: {
        display: "var(--font-cormorant, 'Cormorant Garamond'), Georgia, serif",
        body: "var(--font-jost, 'Jost'), 'Helvetica Neue', Arial, sans-serif",
        script: "var(--font-pinyon, 'Pinyon Script'), cursive",
      },
      /* Cantos vivos: una participación grabada se corta a guillotina, y el radio es el detalle
         que delata que algo se diseñó para una app. El medio a 2px por el botón, que a cero se ve
         recortado con tijera. */
      radii: { sm: '0px', md: '2px', lg: '2px' },
      /* Casi sin sombra: sobre un fondo oscuro no se ve una sombra, se ve una mancha más oscura.
         Lo que separa las piezas aquí es el filete dorado. */
      shadows: { soft: '0 24px 60px -40px rgba(0, 0, 0, 0.85)' },
      motion: { reveal: '0.95s cubic-bezier(0.22, 1, 0.36, 1)' },
      space: { block: 'clamp(4.75rem, 10vw, 8.5rem)' },
      /* Cálida y un punto más contrastada: una fotografía clara sobre verde oscuro se ve lavada
         si no se le sube el contraste, y el punto de sepia la reconcilia con el oro. */
      photo: { filter: 'saturate(0.95) contrast(1.08) sepia(0.06)' },
      /* Rombo, el ornamento clásico de la papelería formal, y bien visible: en este tema los
         filetes son la mitad del diseño. */
      ornament: { line: '2.25rem', node: '5px', nodeRadius: '1px', nodeRotate: '45deg', opacity: '0.8' },
      edge: { height: '0px' },
    },
  },
] as const;

// ════════════════════════════════════════════════════════════════════════════

/**
 * Aplica los renombres de clave antes de insertar.
 *
 * Tiene que correr ANTES del upsert: si primero se insertan las claves nuevas, el renombre
 * posterior choca con la única de `key` y el catálogo se queda con los dos juegos.
 */
async function applyRenames(): Promise<void> {
  for (const [from, to] of Object.entries(RENAMED_EVENT_TYPES)) {
    await db.update(s.eventTypes).set({ key: to }).where(eq(s.eventTypes.key, from));
  }

  for (const [from, to] of Object.entries(RENAMED_THEMES)) {
    await db.update(s.themes).set({ key: to }).where(eq(s.themes.key, from));
  }
}

async function seedCatalogs(): Promise<void> {
  await applyRenames();

  await db
    .insert(s.features)
    .values(FEATURES.map((f) => ({ ...f })))
    .onConflictDoUpdate({
      target: s.features.key,
      set: { name: sql`excluded.name`, category: sql`excluded.category` },
    });

  await db
    .insert(s.plans)
    .values(PLANS.map((p) => ({ ...p })))
    .onConflictDoUpdate({
      target: s.plans.key,
      set: { name: sql`excluded.name`, rank: sql`excluded.rank` },
    });

  /*
   * Reemplazo completo, no upsert.
   *
   * Un upsert solo sabe añadir y corregir: al **quitarle** una funcionalidad a un plan, la fila
   * vieja se quedaba en la base y el plan seguía anunciándola. Es el fallo más caro que puede
   * tener este script, porque la página de precios lee de aquí — prometería algo que el producto
   * ya no da, que es exactamente lo que esa página existe para evitar.
   *
   * Se notó al pasar de dos planes a tres: Esencial perdió la mesa de regalos, el código de
   * vestimenta y todo el plano de gestión, y sin este borrado los habría conservado.
   *
   * Borrar es seguro: `plan_features` es configuración del catálogo y nada apunta a estas filas
   * con clave ajena. Quien las consulta —`resolvePlanBlocks` y la portada— lee por `plan_key`.
   */
  await db.delete(s.planFeatures);
  await db.insert(s.planFeatures).values(PLAN_FEATURES);

  /* `is_active` también en el `SET`: sin él, un tipo que ya existía se quedaría con el valor que
     tuviera en la base y desactivarlo aquí no serviría de nada en ninguna instalación que ya
     hubiera sembrado. */
  await db
    .insert(s.eventTypes)
    .values(EVENT_TYPES.map((t) => ({ ...t })))
    .onConflictDoUpdate({
      target: s.eventTypes.key,
      set: { name: sql`excluded.name`, isActive: sql`excluded.is_active` },
    });

  const sellable = EVENT_TYPES.filter((type) => type.isActive).length;

  console.log(
    `  ${FEATURES.length} funcionalidades, ${PLANS.length} planes, ${EVENT_TYPES.length} tipos de evento (${sellable} activos)`,
  );
}

async function seedRegistry(): Promise<void> {
  /* Antes de tocar la base: si dos plantillas del mismo tipo de evento comparten una variante, el
     catálogo que se va a sembrar está mal y es mejor no sembrarlo a medias. */
  assertTemplateVariantsAreExclusive();

  await db
    .insert(s.blocks)
    .values(BLOCKS.map((b) => ({ ...b })))
    .onConflictDoUpdate({
      target: s.blocks.key,
      set: { name: sql`excluded.name`, featureKey: sql`excluded.feature_key` },
    });

  await db
    .insert(s.componentVariants)
    .values(VARIANTS.map((v) => ({ ...v, minPlanRank: v.minPlanRank ?? 0 })))
    .onConflictDoUpdate({
      target: [s.componentVariants.blockKey, s.componentVariants.variantKey],
      set: {
        name: sql`excluded.name`,
        minPlanRank: sql`excluded.min_plan_rank`,
        isActive: sql`excluded.is_active`,
      },
    });

  await db
    .insert(s.themes)
    .values(THEMES.map((t) => ({ ...t, tokens: t.tokens as Record<string, unknown> })))
    .onConflictDoUpdate({
      target: s.themes.key,
      set: {
        name: sql`excluded.name`,
        description: sql`excluded.description`,
        tokens: sql`excluded.tokens`,
        isActive: sql`excluded.is_active`,
      },
    });

  /*
   * Las plantillas: una fila por estructura, más sus tipos de evento y su composición.
   *
   * Se hace en bucle y no en un solo `insert` porque cada plantilla necesita su id para colgar
   * de él los bloques y los tipos, y `RETURNING` no garantiza el orden de un insert múltiple.
   */
  const variantRows = await db
    .select({ id: s.componentVariants.id, registryId: s.componentVariants.registryId })
    .from(s.componentVariants);
  const variantByRegistryId = new Map(variantRows.map((v) => [v.registryId, v.id]));

  for (const definition of TEMPLATES) {
    const [row] = await db
      .insert(s.templates)
      .values({
        key: definition.key,
        name: definition.name,
        description: definition.description,
        defaultThemeKey: definition.defaultThemeKey,
        isActive: definition.isActive,
      })
      .onConflictDoUpdate({
        target: s.templates.key,
        set: {
          name: sql`excluded.name`,
          description: sql`excluded.description`,
          defaultThemeKey: sql`excluded.default_theme_key`,
          isActive: sql`excluded.is_active`,
        },
      })
      .returning({ id: s.templates.id });

    if (!row) throw new Error(`No se pudo crear la plantilla ${definition.key}`);

    /*
     * Reemplazo completo, igual que la composición: los tipos de una plantilla se corrigen
     * quitando y poniendo, y un upsert dejaría para siempre el tipo que alguien retiró de la
     * lista.
     */
    await db.delete(s.templateEventTypes).where(eq(s.templateEventTypes.templateId, row.id));
    await db
      .insert(s.templateEventTypes)
      .values(definition.eventTypes.map((eventTypeKey) => ({ templateId: row.id, eventTypeKey })));

    await db
      .insert(s.templatePlans)
      .values([
        { templateId: row.id, planKey: 'esencial' },
        { templateId: row.id, planKey: 'plus' },
        { templateId: row.id, planKey: 'premium' },
      ])
      .onConflictDoNothing();

    /*
     * Reemplazo completo en lugar de upsert: template_blocks tiene única en
     * (template_id, position), así que un upsert por block_key fallaría en cuanto se
     * reordenen los bloques. Nada apunta a estas filas con FK —event_blocks copia los valores
     * al crear el evento—, así que borrarlas es seguro.
     */
    await db.delete(s.templateBlocks).where(eq(s.templateBlocks.templateId, row.id));
    await db.insert(s.templateBlocks).values(
      definition.blocks.map((block, index) => {
        const registryId = `${block.blockKey}.${block.variantKey}`;
        const variantId = variantByRegistryId.get(registryId);

        if (!variantId) throw new Error(`Variante no registrada: ${registryId}`);

        return {
          templateId: row.id,
          blockKey: block.blockKey,
          defaultVariantId: variantId,
          // La posición se deduce del orden de la lista: el orden ES la estructura.
          position: index + 1,
          isRequired: block.isRequired ?? false,
          /* Lo común primero y lo de la plantilla encima: así cambiar un rótulo para todas es
             una línea, y una plantilla que quiere el suyo no tiene que repetir los otros once. */
          defaultConfig: { ...BASE_BLOCK_CONFIG[block.blockKey], ...block.config },
        };
      }),
    );
  }

  await retireVariants(variantByRegistryId);

  console.log(
    `  ${BLOCKS.length} bloques, ${VARIANTS.length} variantes, ${TEMPLATES.length} plantillas, ${THEMES.length} temas`,
  );
}

/**
 * Retira del catálogo las variantes de `RETIRED_VARIANTS`.
 *
 * Reapunta antes de borrar, que es el único orden que funciona con la clave ajena `RESTRICT`.
 * Es idempotente: en la segunda ejecución no encuentra nada que retirar y no hace nada.
 */
async function retireVariants(variantByRegistryId: Map<string, string>): Promise<void> {
  const retiredIds = RETIRED_VARIANTS.registryIds
    .map((registryId) => variantByRegistryId.get(registryId))
    .filter((id): id is string => Boolean(id));

  if (retiredIds.length === 0) return;

  const replacementId = variantByRegistryId.get(RETIRED_VARIANTS.replacedBy);

  if (!replacementId) {
    throw new Error(`La variante de reemplazo ${RETIRED_VARIANTS.replacedBy} no está registrada`);
  }

  const repointed = await db
    .update(s.eventBlocks)
    .set({ variantId: replacementId })
    .where(inArray(s.eventBlocks.variantId, retiredIds))
    .returning({ id: s.eventBlocks.id });

  await db.delete(s.componentVariants).where(inArray(s.componentVariants.id, retiredIds));

  console.log(
    `  ${retiredIds.length} variantes retiradas` +
      (repointed.length > 0 ? `, ${repointed.length} bloques reapuntados` : ''),
  );
}

/**
 * La cuenta de plataforma: la **única** fila de `users` que deja este seed.
 *
 * Va **sin ninguna membresía** y es con la que se entra a `/admin`. No se siembra ninguna
 * cuenta de cliente, y por tanto tampoco ningún cliente: ver la nota de cabecera del archivo.
 *
 * Que no tenga membresías no es un detalle: es el invariante que sustituye al CHECK
 * `users_client_xor_platform` y lo que mantiene esta cuenta invisible para el panel de
 * cualquier cliente, porque la política de `users` alcanza solo a quien comparte membresía.
 * `npm run db:check` lo verifica.
 *
 * `platform_role` se escribe aquí, con el rol DUEÑO. La aplicación no puede tocar esa columna
 * —está revocada en `sql/0001_security.sql`— justamente para que conceder ese rol sea una
 * operación deliberada de la plataforma y no algo que salga de una pantalla del panel.
 *
 * Para dar de alta o revocar más cuentas de plataforma sin volver a sembrar está
 * `npm run db:platform-admin`.
 */
async function seedPlatformAccount(): Promise<void> {
  const [platformAdmin] = await db
    .insert(s.users)
    .values({
      email: PLATFORM_ADMIN.email,
      name: PLATFORM_ADMIN.name,
      platformRole: 'superadmin',
    })
    /*
     * El `set` incluye platform_role para que reejecutar el seed restaure el privilegio si
     * alguien lo quitó a mano. No incluye `status`: si una cuenta se desactivó a propósito,
     * el seed no es quien debe volver a activarla.
     */
    .onConflictDoUpdate({
      target: s.users.email,
      set: { name: sql`excluded.name`, platformRole: sql`excluded.platform_role` },
    })
    .returning({ id: s.users.id });

  if (!platformAdmin) throw new Error('No se pudo crear la cuenta de plataforma');

  console.log(`  cuenta de plataforma: ${PLATFORM_ADMIN.email}`);
}

async function main(): Promise<void> {
  console.log('▸ Catálogos de plataforma…');
  await seedCatalogs();

  console.log('▸ Component Registry…');
  await seedRegistry();

  console.log('▸ Cuenta de plataforma…');
  await seedPlatformAccount();

  console.log('\n✓ Seed completo. Catálogo y cuenta de plataforma; cero clientes.');
}

main()
  .catch((error: unknown) => {
    console.error('\n✗ Seed fallido\n');
    console.error(error instanceof Error ? error.message : error);
    process.exitCode = 1;
  })
  .finally(() => pool.end());
