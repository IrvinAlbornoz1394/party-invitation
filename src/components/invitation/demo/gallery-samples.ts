import { galleryContentSchema, type GalleryContent } from '@/domain/invitation/blocks/gallery';
import { demoGalleryItem, QUINCE_PHOTOS, WEDDING_PHOTOS } from './photos';
import type { DemoSample } from './sample';

/**
 * Contenido de ejemplo para ver una galería sin tener que crear un evento.
 *
 * Mismas claves que el resto de bloques. Los dos llevan seis fotografías con **proporciones
 * mezcladas** —verticales y apaisadas—, que es lo que de verdad prueba estas ocho variantes: la
 * mampostería respeta cada proporción, la rejilla las recorta a cuadro y la pasarela las deja
 * pasar con anchos distintos. Con seis fotos iguales, las ocho se verían parecidas.
 *
 * Las medidas van declaradas porque el navegador reserva el hueco con ellas: sin eso, la página
 * salta al cargar cada imagen, y eso en un móvil se nota justo mientras alguien está leyendo.
 *
 * La boda lleva **pies de foto** y los XV no. Es deliberado: en la galería polaroid los pies van
 * escritos en la franja blanca y hay que poder ver las dos cosas, con texto y sin él.
 */

export const GALLERY_SAMPLES: readonly DemoSample<GalleryContent>[] = [
  {
    key: 'boda',
    name: 'Boda',
    content: galleryContentSchema.parse({
      eyebrow: 'Nueve años en seis fotos',
      title: 'Nosotros',
      subtitle: 'Un repaso a los momentos que nos trajeron hasta aquí.',
      items: [
        demoGalleryItem(WEDDING_PHOTOS.couple, 900, 1200, 'El día que lo decidimos'),
        demoGalleryItem(WEDDING_PHOTOS.exit, 1400, 900, 'Saliendo de la ceremonia'),
        demoGalleryItem(WEDDING_PHOTOS.rings, 1200, 900, 'Las alianzas'),
        demoGalleryItem(WEDDING_PHOTOS.ceremony, 900, 1300, 'El arco, terminado'),
        demoGalleryItem(WEDDING_PHOTOS.arch, 1400, 900, 'Las flores de la entrada'),
        demoGalleryItem(WEDDING_PHOTOS.guests, 1200, 800, 'Con toda la gente que queremos'),
      ],
      note: 'Habrá un álbum compartido para que subas tus fotos después de la boda.',
    }),
  },
  {
    key: 'quince',
    name: 'XV Años',
    content: galleryContentSchema.parse({
      eyebrow: 'La sesión',
      title: 'Galería',
      subtitle: null,
      items: [
        demoGalleryItem(QUINCE_PHOTOS.portrait, 900, 1300),
        demoGalleryItem(QUINCE_PHOTOS.night, 900, 1200),
        demoGalleryItem(QUINCE_PHOTOS.dress, 1400, 900),
        demoGalleryItem(QUINCE_PHOTOS.cake, 900, 1200),
        demoGalleryItem(QUINCE_PHOTOS.shoes, 1400, 900),
        demoGalleryItem(QUINCE_PHOTOS.church, 900, 1300),
      ],
      note: null,
    }),
  },
];
