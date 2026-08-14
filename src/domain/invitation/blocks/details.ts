import { z } from 'zod';
import { blockActionSchema, blockIconSchema, blockImageSchema, line } from './shared';

/**
 * El contenido del bloque **detalles del evento**, y con él el contrato de sus cuatro variantes.
 *
 * Es el bloque de los datos prácticos: la hora, el código de vestimenta, la mesa de regalos, el
 * estacionamiento, el «no niños». Lo que un invitado viene a consultar dos días antes, y por
 * eso es el bloque que más se relee de toda la invitación.
 *
 * ## Por qué es una lista y no unos cuantos campos con nombre
 *
 * La tentación es tener `dressCode`, `giftRegistry`, `parking`… y se descarta: cada tipo de
 * evento trae los suyos —una boda tiene código de vestimenta y una presentación no; un
 * empresarial tiene registro y confirmación de asistencia—, así que la lista de campos crecería
 * con cada tipo de evento y todas las variantes tendrían que aprender a pintar cada uno. Con
 * una lista de detalles, dar de alta un tipo de evento nuevo no toca ni un componente.
 *
 * El precio es que el orden y el icono son responsabilidad de quien configura, no del sistema.
 * Es un precio bueno: es exactamente la decisión que el admin quiere tomar.
 *
 * ## El icono es una CLAVE, no un componente
 *
 * `icon: 'gift'` es contenido; qué dibujo le corresponde es presentación. El vocabulario está
 * en `blocks/shared.ts` porque lo comparte con el cronograma —«brindis» es la misma idea en
 * los dos bloques—, y el mapa a dibujos, en `shared/IconBadge.tsx (el mapa, en shared/block-icons.ts)`.
 *
 * ## La imagen es opcional y las cuatro variantes se adaptan
 *
 * No hay una variante «con foto» y otra «sin foto»: cada una sabe componerse de las dos
 * maneras. Es la diferencia entre un catálogo que crece por multiplicación —ocho variantes
 * para cuatro diseños— y uno que crece por diseños de verdad. Y responde a cómo se arma una
 * invitación: el admin elige la variante primero y la foto aparece días después, cuando el
 * cliente la manda.
 */

/**
 * Un detalle: un icono, un rótulo y su valor.
 *
 * `description` es opcional porque hay detalles que se agotan en el título —«Etiqueta
 * rigurosa»— y forzar una segunda línea llevaría a rellenarla con paja. `action` también:
 * solo algunos llevan a algún sitio, como la mesa de regalos o el mapa del estacionamiento.
 */
export const detailItemSchema = z.object({
  icon: blockIconSchema,
  title: line(60),
  description: line(240).nullable().default(null),
  action: blockActionSchema.nullable().default(null),
});

export type DetailItem = z.output<typeof detailItemSchema>;

export const detailsContentSchema = z.object({
  /** El rótulo pequeño de arriba: «Lo que necesitas saber». */
  eyebrow: line(60).nullable().default(null),
  title: line(120),
  subtitle: line(200).nullable().default(null),
  /**
   * Los detalles, en el orden en que se enseñan.
   *
   * El tope de ocho no es una limitación técnica: es un bloque de consulta rápida en un móvil,
   * y pasado ese número deja de poder recorrerse de un vistazo. Si un evento necesita más, lo
   * que necesita es otro bloque.
   */
  items: z.array(detailItemSchema).min(1).max(8),
  /**
   * Una fotografía que acompaña al bloque. Opcional, y las cuatro variantes se adaptan.
   *
   * No es decorativa por capricho: los detalles son datos, y una imagen del salón o de la mesa
   * puesta es lo que evita que la sección se lea como un formulario. Cuando no la hay, cada
   * variante se recompone —no deja un hueco— porque la mayoría de los eventos se arman antes
   * de tener las fotos.
   */
  image: blockImageSchema.nullable().default(null),
  /** La nota al pie: «Por favor confirma antes del 1 de junio». */
  note: line(240).nullable().default(null),
});

/** El contenido de los detalles, ya validado y con los valores por defecto puestos. */
export type DetailsContent = z.output<typeof detailsContentSchema>;

/** Lo que se guarda en `event_blocks.config`, antes de aplicar los valores por defecto. */
export type DetailsContentInput = z.input<typeof detailsContentSchema>;
