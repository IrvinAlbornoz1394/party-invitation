/**
 * Las fotografías de la portada del producto, en un solo sitio.
 *
 * Son cuatro y no catorce: una página de venta con una foto por sección se lee como un banco de
 * imágenes, y lo que se vende aquí no son fotos sino invitaciones. Cada una tiene un trabajo
 * concreto —abrir, acompañar el argumento, dar textura a los servicios y cerrar— y ninguna
 * ilustra lo que el texto de al lado ya dice.
 *
 * ## Por qué remotas y no en `public/`
 *
 * Porque ya es la convención del proyecto: las plantillas de demostración se sirven igual, y
 * `next.config.ts` tiene la lista blanca de `images.unsplash.com` justo para esto —sin ella,
 * `/_next/image` sería un proxy abierto—. Next las optimiza y las sirve en AVIF o WebP desde
 * este dominio, así que remoto no significa lento.
 *
 * Los parámetros de la URL piden el recorte ya hecho en el origen (`fit=crop` con medidas): sin
 * eso llegaría el original de seis mil píxeles para que Next lo redimensione en cada despliegue.
 *
 * ## La licencia
 *
 * Unsplash, que permite uso comercial sin atribución. Se listan aquí los identificadores para
 * que cualquiera pueda ir a buscar el original — y para que sustituirlas por fotografía propia
 * el día que la haya sea cambiar cuatro cadenas en este archivo y nada más.
 */

const unsplash = (id: string, width: number, height: number): string =>
  `https://images.unsplash.com/${id}?auto=format&fit=crop&w=${width}&h=${height}&q=80`;

export interface MarketingPhoto {
  readonly url: string;
  readonly alt: string;
}

export const MARKETING_PHOTOS = {
  /**
   * La portada. Un pasillo de ceremonia montado, no una pareja.
   *
   * Es deliberado: éclat no es solo bodas —hay presentaciones, XV, bautizos y cumpleaños—, y una
   * pareja de novios a toda pantalla le dice a quien organiza los quince de su hija que esto no
   * es para ella. Un montaje elegante sirve para las nueve celebraciones del catálogo.
   *
   * Además es horizontal y con el centro despejado, que es lo que un titular centrado necesita.
   */
  hero: {
    url: unsplash('photo-1469371670807-013ccf25f16a', 2000, 1200),
    alt: 'Pasillo de una ceremonia montado con arreglos de flores a los dos lados',
  },
  /** El detalle de las manos: acompaña al argumento sin robarle la palabra. */
  story: {
    url: unsplash('photo-1465495976277-4387d4b0b4c6', 1200, 1000),
    alt: 'Manos de una pareja con los anillos puestos, apoyadas sobre un ramo',
  },
  /** Vertical y con textura: es la que sostiene la columna de servicios. */
  services: {
    url: unsplash('photo-1519225421980-715cb0215aed', 1000, 1300),
    alt: 'Mesa larga montada con flores, vajilla y servilletas para un banquete',
  },
  /** El cierre, a contraluz. La última imagen de la página es la que se recuerda. */
  closing: {
    url: unsplash('photo-1519741497674-611481863552', 1800, 1100),
    alt: 'Pareja a contraluz sosteniendo un ramo de flores al atardecer',
  },
} as const satisfies Readonly<Record<string, MarketingPhoto>>;
