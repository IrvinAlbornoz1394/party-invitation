/**
 * Las fotografías de las demos, agrupadas por tipo de evento.
 *
 * ## Por qué existe este archivo
 *
 * Antes cada archivo de ejemplos escribía sus propias URL de Unsplash y su propio texto
 * alternativo, y el resultado fue el que era de esperar: una fiesta infantil con un cartel de
 * «HAPPY BIRTHDAY» ilustrando la portada de unos XV, un niño pintando con témperas descrito como
 * «mesa larga montada al aire libre para una boda», y globos de colores como imagen de una boda.
 * Nadie mintió a propósito — es que **un identificador de Unsplash no dice qué se ve en la foto**,
 * así que copiarlo de un sitio a otro es copiar a ciegas.
 *
 * Aquí la imagen y su descripción viajan **juntas y una sola vez**. Quien la use no escribe el
 * `alt`: lo recibe. Y si mañana se cambia una foto, su descripción cambia con ella en los doce
 * bloques a la vez.
 *
 * ## Todas están vistas
 *
 * Cada entrada de este archivo se abrió y se miró antes de escribirla. Es la única forma de
 * garantizar lo que el catálogo promete: que la demo de XV enseñe unos XV. Al añadir una nueva,
 * hay que hacer lo mismo — descargarla y verla — y describir en `alt` **lo que se ve**, no lo que
 * a uno le gustaría que se viera.
 *
 * ## El recorte
 *
 * `demoImage` y `demoGalleryItem` piden ancho y alto para que Unsplash sirva exactamente esa
 * proporción. Pidiendo solo el ancho, la foto llega en la suya y la galería reserva un hueco que
 * no coincide: el salto de maqueta que las medidas existen para evitar. Por eso cada foto declara
 * además su **orientación** — recortar un retrato en apaisado corta cabezas.
 */

import type { BlockImage } from '@/domain/invitation/blocks/shared';

export interface DemoPhoto {
  /** El identificador de Unsplash. Nunca se escribe suelto fuera de este archivo. */
  readonly id: string;
  /** Lo que se ve en la foto. Es el texto alternativo y la única descripción que existe. */
  readonly alt: string;
  readonly orientation: 'portrait' | 'landscape';
}

const unsplash = (id: string, width: number, height: number): string =>
  `https://images.unsplash.com/${id}?auto=format&fit=crop&w=${width}&h=${height}&q=80`;

/** Una imagen de bloque a partir de una foto del catálogo. */
export function demoImage(photo: DemoPhoto, width: number, height: number): BlockImage {
  return { url: unsplash(photo.id, width, height), alt: photo.alt };
}

/** Una foto de galería: lo mismo más las medidas y el pie, que sí es texto de la demo. */
export function demoGalleryItem(
  photo: DemoPhoto,
  width: number,
  height: number,
  caption: string | null = null,
) {
  return { ...demoImage(photo, width, height), caption, width, height };
}

/* ── Boda ─────────────────────────────────────────────────────────────────── */

export const WEDDING_PHOTOS = {
  /** Vertical y con los dos de cuerpo entero: la única que aguanta una portada a sangre. */
  couple: {
    id: 'photo-1606216794074-735e91aa2c92',
    alt: 'Los novios caminan tomados de la mano al atardecer, ella con ramo y velo',
    orientation: 'portrait',
  },
  exit: {
    id: 'photo-1595407753234-0882f1e77954',
    alt: 'Los novios salen de la ceremonia entre los invitados, que les lanzan arroz',
    orientation: 'landscape',
  },
  ceremony: {
    id: 'photo-1507915977619-6ccfe8003ae6',
    alt: 'Ceremonia al aire libre bajo un arco, con los invitados sentados entre árboles dorados',
    orientation: 'portrait',
  },
  arch: {
    id: 'photo-1529636798458-92182e662485',
    alt: 'Arreglo de flores y velo de tela colgando del arco de la ceremonia',
    orientation: 'landscape',
  },
  rings: {
    id: 'photo-1606800052052-a08af7148866',
    alt: 'Dos alianzas de oro sobre un mantel claro',
    orientation: 'landscape',
  },
  guests: {
    id: 'photo-1583939411023-14783179e581',
    alt: 'Los novios avanzan entre los invitados vestidos de azul, en el jardín',
    orientation: 'landscape',
  },
  /** La sede de la recepción. Sin gente a propósito: lo que se enseña es el sitio. */
  venue: {
    id: 'photo-1635341108990-9201f2f48625',
    alt: 'Mesa larga montada al aire libre, con mantelería blanca y velas',
    orientation: 'landscape',
  },
} as const satisfies Record<string, DemoPhoto>;

/* ── XV años ──────────────────────────────────────────────────────────────── */

export const QUINCE_PHOTOS = {
  /** Con la corona bien visible: es lo que hace que la portada se lea como unos XV. */
  portrait: {
    id: 'photo-1763959949927-b86ed20b3290',
    alt: 'La quinceañera con corona y vestido azul de gala, apoyada en una balaustrada',
    orientation: 'portrait',
  },
  church: {
    id: 'photo-1763959944953-d8f723c34bff',
    alt: 'La quinceañera de espaldas frente a la iglesia iluminada de noche',
    orientation: 'portrait',
  },
  night: {
    id: 'photo-1763959946841-33e3973b69ea',
    alt: 'La quinceañera levanta su ramo con las luces de la ciudad detrás',
    orientation: 'portrait',
  },
  dress: {
    id: 'photo-1640827013600-1f5411ec366b',
    alt: 'Detalle del vestido bordado y el ramo, con el misal en las manos',
    orientation: 'landscape',
  },
  cake: {
    id: 'photo-1705626308236-490402f6c1cd',
    alt: 'Pastel de tres pisos con flores moradas y el número quince arriba',
    orientation: 'portrait',
  },
  shoes: {
    id: 'photo-1705626314108-271620cf1e16',
    alt: 'Las zapatillas doradas del cambio de zapatilla, sobre el vuelo del vestido',
    orientation: 'landscape',
  },
  venue: {
    id: 'photo-1785672951683-dba4e3867b8a',
    alt: 'Salón montado con mesas redondas, sillas doradas y centros de rosas',
    orientation: 'landscape',
  },
} as const satisfies Record<string, DemoPhoto>;
