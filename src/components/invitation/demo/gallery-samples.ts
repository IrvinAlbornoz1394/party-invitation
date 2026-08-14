import { galleryContentSchema, type GalleryContent } from '@/domain/invitation/blocks/gallery';
import type { DemoSample } from './sample';

/**
 * Contenido de ejemplo para ver una galería sin tener que crear un evento.
 *
 * Mismas claves que el resto de bloques —los mismos tres eventos imaginarios— para poder saltar
 * de la portada a la galería sin que cambie el evento debajo.
 *
 * ## Por qué las fotos traen medidas
 *
 * Cada ejemplo pide a Unsplash un recorte concreto y declara **esas mismas medidas** en
 * `width`/`height`. No es adorno del ejemplo: es lo que hace que la mampostería se pueda juzgar
 * de verdad en el panel. Con todas las fotos cuadradas, `gallery.masonry` se ve igual que
 * `gallery.grid` y no hay nada que decidir.
 *
 * Los tres cubren lo que hay que probar:
 *
 *   · **Presentación**: seis fotos de proporciones mezcladas — verticales, cuadradas, apaisadas.
 *   · **XV Años**: seis verticales, todas iguales. El caso en el que la mampostería no aporta y
 *     la rejilla sí.
 *   · **Boda**: seis apaisadas con pie de foto, para ver los pies en el visor ampliado.
 */

/**
 * La URL de Unsplash con un recorte exacto.
 *
 * El recorte se pide con `w` y `h` para que la proporción servida sea la declarada. Si solo se
 * pidiera el ancho, Unsplash devolvería la foto en su proporción original y la mampostería
 * reservaría un hueco que no coincide con la imagen — el salto de maqueta que este bloque
 * existe para evitar.
 */
const unsplash = (id: string, width: number, height: number): string =>
  `https://images.unsplash.com/${id}?auto=format&fit=crop&w=${width}&h=${height}&q=80`;

const photo = (id: string, width: number, height: number, alt: string, caption: string | null = null) => ({
  url: unsplash(id, width, height),
  alt,
  caption,
  width,
  height,
});

/** Las seis fotografías del proyecto, ya verificadas. Se recortan distinto en cada ejemplo. */
const IDS = [
  'photo-1602631985686-1bb0e6a8696e',
  'photo-1607344645866-009c320b63e0',
  'photo-1558636508-e0db3814bd1d',
  'photo-1530103862676-de8c9debad1d',
  'photo-1560421683-6856ea585c78',
  'photo-1513151233558-d860c5398176',
] as const;

export const GALLERY_SAMPLES: readonly DemoSample<GalleryContent>[] = [
  {
    key: 'presentacion',
    name: 'Presentación',
    content: galleryContentSchema.parse({
      eyebrow: 'Tres años de recuerdos',
      title: 'Galería',
      subtitle: 'Un repaso a los momentos que nos trajeron hasta aquí.',
      /*
       * Con pies de foto porque es el ejemplo por defecto, y es el único sitio donde se ven sin
       * ampliar: en la galería polaroid van escritos en la franja blanca.
       */
      items: [
        photo(IDS[0], 900, 1200, 'La festejada entre globos de colores', 'Su primer añito'),
        photo(IDS[1], 1200, 900, 'La mesa de dulces preparada para la fiesta', 'La mesa de dulces'),
        photo(IDS[2], 1000, 1000, 'Flores y velas sobre la mesa principal', 'Mérida, 2025'),
        photo(IDS[3], 900, 1300, 'El salón iluminado antes de que lleguen los invitados', 'Todo listo'),
        photo(IDS[4], 1400, 900, 'La mesa larga montada en el jardín', 'La comida en el jardín'),
        photo(IDS[5], 1200, 1500, 'Confeti de colores lanzado al aire', '¡Que empiece la fiesta!'),
      ],
      note: 'Habrá un álbum compartido para que subas tus fotos después del evento.',
    }),
  },
  {
    key: 'xv-anios',
    name: 'XV Años',
    content: galleryContentSchema.parse({
      eyebrow: 'Quince años en imágenes',
      title: 'Galería',
      subtitle: null,
      // Todas verticales y de la misma proporción: el caso en el que la mampostería no aporta.
      items: IDS.map((id, index) =>
        photo(id, 900, 1200, `Fotografía ${index + 1} de la sesión de quince años`),
      ),
      note: null,
    }),
  },
  {
    key: 'boda',
    name: 'Boda',
    content: galleryContentSchema.parse({
      eyebrow: 'Nueve años juntos',
      title: 'Nuestras fotos',
      subtitle: 'Algunas de las que nos gustaría enseñarte antes del día.',
      items: [
        photo(IDS[4], 1600, 1000, 'La mesa larga montada al aire libre', 'Izamal, 2025'),
        photo(IDS[1], 1600, 1000, 'La decoración de la mesa principal', 'Los preparativos'),
        photo(IDS[3], 1600, 1000, 'El salón al caer la tarde', 'La terraza donde será el cóctel'),
        photo(IDS[2], 1600, 1000, 'Flores y velas sobre la mesa', 'Las flores las hace su mamá'),
        photo(IDS[5], 1600, 1000, 'Confeti lanzado al aire', 'La despedida de la última boda'),
        photo(IDS[0], 1600, 1000, 'Globos de colores en la celebración', 'El cumpleaños en el que nos conocimos'),
      ],
      note: null,
    }),
  },
];
