import type { ContentBlockKey } from '@/domain/invitation/blocks/block-content';
import { isContentBlockKey, type EventBlockRecord } from '@/domain/invitation/event-content';
import { BLOCK_LABELS } from './content-completeness';
import type { EventContentDraft } from './event-content-draft';

/**
 * En qué pasos se llena el contenido de una invitación, y qué se pregunta en cada uno.
 *
 * ## Los pasos no son una lista escrita a mano
 *
 * Son **los bloques del evento**, en su orden. Esa es la decisión de fondo y la que hace que el
 * editor no tenga que saber nada del plan: la composición de un evento ya viene filtrada —al
 * crearlo se apagan los bloques que su plan no incluye, y la lectura de la invitación solo trae
 * los encendidos—, así que una plantilla sin historia no tiene paso de historia y un plan Esencial
 * no enseña el de bienvenida. Sin una sola condición sobre `planKey` en ninguna pantalla.
 *
 * El último paso no es una sección: es la vista previa completa, de donde se publica o se manda a
 * revisión.
 *
 * ## Cada dato del evento se pide en la sección que lo usa
 *
 * Es el cambio de fondo respecto del formulario largo, que agrupaba por **tipo de dato**: «Fotos»
 * juntaba la portada, la historia y la galería, y «Cuándo y dónde» la fecha con la ciudad. Quien
 * llena una invitación no piensa así: piensa en la sección que su invitado va a ver. Con el render
 * de esa sección al lado, el paso se explica solo.
 *
 * ## Un dato se pide una sola vez
 *
 * El nombre de quien celebra lo usan la portada, la confirmación y el pie. Se captura en la
 * portada —la primera que lo usa— y las demás no lo vuelven a preguntar: la proyección se encarga
 * de repartirlo (`domain/invitation/event-content.ts`).
 *
 * ## Y un dato cuya sección no está, no se pide
 *
 * Si el evento no lleva historia, no se pregunta por el texto de la historia. No es un descuido:
 * ese texto solo se pinta en esa sección, así que pedirlo sería pedir algo que no se va a ver.
 * La única excepción son los tres campos obligatorios del evento —nombre, fecha y hora—, que van
 * en la portada; y la portada la lleva **toda** plantilla, porque `template_blocks` la marca como
 * obligatoria.
 */

/** Un campo del evento, nombrado como lo nombra el borrador que se guarda. */
export type EventFieldKey = keyof EventContentDraft;

/**
 * Una pregunta de un paso, venga de donde venga.
 *
 * Los dos orígenes existen —el evento y el `config` del bloque— y a quien llena el formulario no
 * le importa: ve una lista de campos. Antes se pintaban en dos grupos, primero los del evento y
 * después los del bloque, y eso obligaba a un orden que no siempre es el bueno: en la portada, la
 * primera frase es del bloque y la segunda del evento, así que agrupadas salían al revés de como
 * se leen en la invitación.
 *
 * Con una lista mixta, el orden del formulario es el orden de la sección. Los textos del bloque
 * que el paso no nombre se añaden al final, que es lo que hace que esta tabla no tenga que
 * enumerar los rótulos de las doce secciones.
 */
export type StepField =
  | { readonly from: 'event'; readonly key: EventFieldKey }
  /** La clave del texto dentro de `event_blocks.config`. Ver `event-block-texts.ts`. */
  | { readonly from: 'block'; readonly key: string };

/** Cuál de las tres listas ordenadas del evento se edita en un paso, si es que alguna. */
export type StepCollection = 'venues' | 'schedule' | 'gallery';

export interface ContentStep {
  /** La sección que se llena en este paso. `null` en el último, que es la vista previa. */
  readonly blockKey: ContentBlockKey | null;
  /** Cómo se llama el paso. Los mismos nombres que usa la lista de pendientes. */
  readonly label: string;
  /**
   * Lo que se pregunta aquí, en orden. Puede mezclar campos del evento y textos del bloque; los
   * textos que no aparezcan se pintan detrás, en el orden en que los declara su bloque.
   */
  readonly fields: readonly StepField[];
  /** La lista ordenada que se edita aquí, si el paso tiene una. */
  readonly collection: StepCollection | null;
}

/**
 * Qué se pregunta en cada sección, y en qué orden.
 *
 * Se escribe a mano y no se deriva de la proyección, aunque la proyección diga qué campos usa
 * cada bloque: hay datos que **usan varios** —el nombre, la fecha— y aquí hace falta decidir en
 * cuál se preguntan, que es una decisión de formulario y no una consecuencia del render.
 *
 * Lo que no está en esta tabla no se pregunta en ningún paso. Hoy están los dieciséis del
 * borrador; si mañana el evento gana una columna editable y nadie la añade aquí, el editor no la
 * enseñará — y es preferible a que aparezca en un paso al azar.
 */
const event = (key: EventFieldKey): StepField => ({ from: 'event', key });
const text = (key: string): StepField => ({ from: 'block', key });

const STEP_FIELDS: Readonly<Partial<Record<ContentBlockKey, readonly StepField[]>>> = {
  /*
   * La portada se lleva la identidad y el cuándo. Es además el primer paso siempre —es el primer
   * bloque de toda plantilla—, y eso importa para el guardado: los tres obligatorios del evento
   * (`celebrantName`, `date`, `time`) se capturan aquí, así que ningún paso posterior puede
   * quedarse sin ellos al guardar.
   */
  hero: [
    event('celebrantName'),
    event('celebrantLastName'),
    event('celebrantFullName'),
    event('eventTypeLabel'),
    /* Las dos frases, en el orden en que se leen en la portada: la de arriba —que es del
       bloque— y debajo la del evento. Es el motivo por el que un paso puede mezclar orígenes. */
    text('intro'),
    event('tagline'),
    event('date'),
    event('time'),
    event('city'),
    event('heroImageUrl'),
  ],
  /*
   * Los rótulos, la fotografía y **al final el texto**. El orden lo pide el propio campo: es el
   * único del formulario que se escribe en varias frases, y puesto arriba empuja todo lo demás
   * fuera de la pantalla mientras se redacta.
   */
  story: [
    text('eyebrow'),
    text('title'),
    text('subtitle'),
    event('storyImageUrl'),
    event('story'),
  ],
  /* A dónde llegan las confirmaciones y hasta cuándo. El teléfono y el Instagram se piden aquí
     aunque quien los pinte sea el pie: son «cómo te contactan», y el pie es donde acaban. */
  rsvp: [
    event('contactWhatsapp'),
    event('contactPhone'),
    event('contactInstagram'),
    event('rsvpDeadline'),
  ],
  closing: [event('closingImageUrl')],
};

/** Qué lista ordenada se edita en cada sección. Las tres tienen su propio bloque. */
const COLLECTIONS: Readonly<Partial<Record<ContentBlockKey, StepCollection>>> = {
  location: 'venues',
  schedule: 'schedule',
  gallery: 'gallery',
};

/** El nombre del último paso. No es una sección: es la invitación entera. */
export const PREVIEW_STEP_LABEL = 'Vista previa';

/**
 * Los pasos de este evento, en orden, con la vista previa al final.
 *
 * Un bloque cuya clave el código no sabe pintar se omite —no hay nada que preguntar de una sección
 * que no existe en el registro— y el orden es el de `position`, que es el que el cliente puede
 * cambiar si su plan se lo permite. O sea que reordenar las secciones reordena también los pasos,
 * y eso es lo correcto: se llena en el orden en que se lee.
 */
export function contentSteps(blocks: readonly EventBlockRecord[]): readonly ContentStep[] {
  const sections = [...blocks]
    .filter((block) => isContentBlockKey(block.blockKey))
    .sort((first, second) => first.position - second.position)
    .map((block) => {
      const blockKey = block.blockKey as ContentBlockKey;

      return {
        blockKey,
        label: BLOCK_LABELS[blockKey] ?? blockKey,
        fields: STEP_FIELDS[blockKey] ?? [],
        collection: COLLECTIONS[blockKey] ?? null,
      };
    });

  return [
    ...sections,
    { blockKey: null, label: PREVIEW_STEP_LABEL, fields: [], collection: null },
  ];
}
