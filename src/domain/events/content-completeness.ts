import {
  assembleBlockContent,
  blockContentIssues,
  isContentBlockKey,
  type EventBlockRecord,
  type EventContentSource,
} from '@/domain/invitation/event-content';

/**
 * Si el contenido de un evento está completo, y qué le falta.
 *
 * Es la regla que decide si un evento se puede publicar, y vive en el dominio porque la contestan
 * dos pantallas distintas —el panel del cliente, que enseña lo que falta antes de mandar a
 * revisión, y el del admin, que no deja publicar sin ella— y una acción de servidor, que es la
 * que de verdad la aplica.
 *
 * ## Qué se considera «completo»
 *
 * **Que cada bloque de la invitación se pueda pintar.** No es una lista de campos escrita aparte
 * que habría que mantener en paralelo: es exactamente lo que `assembleBlockContent` ya decide en
 * cada carga de una invitación, porque un bloque cuyo contenido no valida **no se renderiza**.
 *
 * O sea que un evento está completo cuando la invitación no tiene huecos. Y la definición de qué
 * es imprescindible en cada sección ya estaba escrita, campo por campo, en los esquemas de
 * `domain/invitation/blocks/`: lo obligatorio es lo que no admite `null`. El nombre del festejado
 * y la fecha de la portada lo son; el pie de una foto o la cita de la historia, no —si faltan,
 * la sección se compone sin ellos y se ve bien—.
 *
 * Esa asimetría es deliberada y es la que pedía el producto: los datos principales de cada
 * sección son obligatorios, y los adornos no.
 *
 * ## Las galerías piden fotos según la variante
 *
 * El contrato del bloque pide dos como mínimo, que es lo que hace falta para que una galería sea
 * una galería. Pero una rejilla de cuatro columnas con dos fotos se ve rota, y el mosaico
 * necesita una destacada **y** el resto. Así que cada variante declara cuántas necesita para
 * verse como se diseñó, y esa es la cifra que se le pide al cliente. Ver {@link PHOTOS_REQUIRED}.
 *
 * ## Lo que esto NO comprueba
 *
 * Que el contenido sea bueno. Un evento con la sede llamada «aaa» está completo para este
 * criterio y es justo lo que la revisión del admin existe para atrapar. La máquina comprueba
 * huecos; las personas, sentido.
 */

/** Un bloque al que le falta algo, con la lista de lo que falta en palabras. */
export interface IncompleteBlock {
  readonly blockKey: string;
  /** Cómo se llama la sección para quien está llenando el formulario. */
  readonly label: string;
  /** Qué falta, ya traducido: «El nombre de quien celebra», «La dirección de la sede». */
  readonly missing: readonly string[];
}

export interface ContentCompleteness {
  readonly complete: boolean;
  readonly blocks: readonly IncompleteBlock[];
}

/**
 * Revisa el contenido de un evento bloque a bloque.
 *
 * Recibe lo mismo que `assembleInvitation` —la proyección del evento y sus bloques— porque tiene
 * que juzgar exactamente lo que se va a pintar, ni más ni menos. Un bloque que el evento no
 * lleva no se comprueba: si la plantilla no trae galería, no hay fotos que pedir.
 */
export function checkContentCompleteness(
  source: EventContentSource,
  blocks: readonly EventBlockRecord[],
): ContentCompleteness {
  const incomplete: IncompleteBlock[] = [];

  for (const block of blocks) {
    /* Un bloque que el código no sabe pintar no se puede juzgar, y sobre todo no debe impedir
       publicar: es un problema del catálogo, no del contenido de este cliente. */
    if (!isContentBlockKey(block.blockKey)) continue;

    const missing = missingOf(source, block);

    if (missing.length > 0) {
      incomplete.push({
        blockKey: block.blockKey,
        label: BLOCK_LABELS[block.blockKey] ?? block.blockKey,
        missing,
      });
    }
  }

  return { complete: incomplete.length === 0, blocks: incomplete };
}

/** Lo que le falta a un bloque, en palabras. Vacío si está completo. */
function missingOf(source: EventContentSource, block: EventBlockRecord): readonly string[] {
  const assembled = assembleBlockContent(source, block);

  if (assembled === null) {
    /*
     * El bloque no valida. `assembleBlockContent` devuelve `null` sin decir por qué —es lo
     * correcto para pintar, donde el motivo no ayuda— así que aquí se vuelve a intentar campo a
     * campo para poder nombrarlo. Es una comprobación que corre al guardar y al publicar, no en
     * cada visita de un invitado, así que el coste no importa.
     */
    return namedGaps(source, block);
  }

  /* La galería valida —trae al menos dos fotos— pero puede seguir estando corta para su variante. */
  if (assembled.blockKey === 'gallery') {
    const required = photosRequiredFor(block.registryId);

    if (assembled.content.items.length < required) {
      return [
        `Faltan fotos: esta galería necesita ${required} y hay ${assembled.content.items.length}`,
      ];
    }
  }

  return [];
}

/**
 * Qué campos del bloque están vacíos, con el nombre que se lee en el formulario.
 *
 * Se prueba **quitando** cada campo conocido de uno en uno no: se lee el error de Zod, que ya
 * dice exactamente qué ruta falló. Lo único que se hace aquí es traducir esa ruta.
 */
function namedGaps(source: EventContentSource, block: EventBlockRecord): readonly string[] {
  const seen = new Set<string>();

  for (const issue of blockContentIssues(source, block)) {
    const field = issue.path.find((step) => typeof step === 'string');
    const label = field ? FIELD_LABELS[field] : undefined;

    seen.add(label ?? 'Falta contenido de esta sección');
  }

  /* Un bloque que no valida siempre tiene algún motivo; el respaldo es por si Zod devolviera una
     ruta que no sabemos nombrar y el conjunto quedara vacío. Mejor un aviso genérico que decir
     que está completo. */
  return seen.size > 0 ? [...seen] : ['Falta contenido de esta sección'];
}

/**
 * Cómo se llama cada sección para quien la está llenando.
 *
 * No son los nombres del catálogo (`blocks.name`, en la base de datos), y la diferencia importa:
 * aquellos los lee un admin que conoce el sistema —«Pantalla de bienvenida»— y estos los lee
 * quien está completando su propia invitación. Cuando coinciden es casualidad.
 */
const BLOCK_LABELS: Readonly<Record<string, string>> = {
  welcome: 'Pantalla de bienvenida',
  hero: 'Portada',
  story: 'Historia',
  calendar: 'Fecha',
  details: 'Detalles',
  dresscode: 'Vestimenta',
  schedule: 'Programa',
  gallery: 'Galería',
  location: 'Ubicación',
  rsvp: 'Confirmación',
  closing: 'Despedida',
  footer: 'Pie',
};

/**
 * Cómo se llama cada campo que puede faltar.
 *
 * Solo están los **obligatorios** de los esquemas de bloque: los opcionales nunca aparecen en un
 * error de validación, así que ponerlos aquí sería adivinar. Si algún día un esquema hace
 * obligatorio un campo nuevo y nadie añade su rótulo, se ve igualmente —con el texto genérico— en
 * vez de desaparecer.
 */
const FIELD_LABELS: Readonly<Record<string, string>> = {
  celebrantName: 'El nombre de quien celebra',
  dateLabel: 'La fecha',
  startsAt: 'La fecha y la hora',
  title: 'El título de la sección',
  body: 'El texto de la historia',
  items: 'Los datos de la sección',
  venues: 'La sede',
  name: 'El nombre de la sede',
  address: 'La dirección de la sede',
  palette: 'Los colores de la vestimenta',
  timeLabel: 'La hora',
  destination: 'A dónde llega la confirmación',
  confirmLabel: 'El texto del botón de confirmar',
  names: 'Los nombres del pie',
  url: 'La imagen',
  alt: 'La descripción de la imagen',
};

/**
 * Cuántas fotos necesita cada galería para verse como se diseñó.
 *
 * El contrato del bloque pide dos —lo mínimo para que una galería sea una galería— y esto es
 * otra cosa: cuántas hacen falta para que **esa** composición no se vea rota. Una rejilla de
 * cuatro columnas con dos fotos deja media fila vacía; el mosaico necesita la destacada y las de
 * alrededor; la pasarela infinita, suficientes para que la tira no se note repetirse.
 *
 * Va por `registry_id` y no por bloque porque es una propiedad de la variante, como su
 * `min_plan_rank`. Y vive en el dominio y no en el componente porque quien la necesita es el
 * formulario —para pedir las fotos— y la regla de publicación, no el render.
 *
 * Las que no están aquí se quedan con el mínimo del contrato: son las que se ven bien con dos.
 */
const PHOTOS_REQUIRED: Readonly<Record<string, number>> = {
  'gallery.grid': 4,
  'gallery.mosaic': 5,
  'gallery.masonry': 5,
  'gallery.polaroid': 4,
  'gallery.plates': 4,
  'gallery.editorial': 4,
  'gallery.cinematic': 3,
  'gallery.carousel': 5,
  'gallery.parallax': 5,
  'gallery.offset': 5,
};

/** Cuántas fotos pide una galería. Dos es el suelo del contrato del bloque. */
export function photosRequiredFor(registryId: string): number {
  return PHOTOS_REQUIRED[registryId] ?? 2;
}
