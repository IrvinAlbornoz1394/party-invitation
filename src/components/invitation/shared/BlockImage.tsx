import Image from 'next/image';
import clsx from 'clsx';
import type { BlockImage as BlockImageContent } from '@/domain/invitation/blocks/shared';
import { isOptimizableImage } from '@/lib/images';

/**
 * La fotografía de un bloque, a sangre dentro de su contenedor.
 *
 * Usa `next/image` y no un `<img>` por una razón muy concreta de este producto: la invitación
 * se abre casi siempre desde WhatsApp, en un móvil y con datos. `next/image` sirve la foto
 * redimensionada al ancho real del dispositivo y en el formato que ese navegador entienda, que
 * en una portada a pantalla completa es la diferencia entre 200 KB y 2 MB.
 *
 * `fill` exige que el contenedor tenga posicionamiento propio. No se envuelve aquí en un `div`
 * relativo a propósito: cada variante coloca la foto en una caja distinta —toda la portada, la
 * mitad izquierda, un recuadro— y añadir un contenedor extra le quitaría ese control.
 *
 * ## La foto de un cliente se sirve sin optimizar
 *
 * Y no es una renuncia a lo de arriba: es lo que permite que exista. `next/image` **lanza** ante
 * un host que no esté en la allowlist, así que la primera invitación con una foto de un dominio
 * nuevo —y el cliente pega el enlace de donde tenga sus fotos— dejaba la sección entera sin
 * pintar. Con `unoptimized` esa imagen se sirve con su URL original y la invitación se ve.
 *
 * Lo que viene de un host nuestro sigue pasando por el optimizador, que es donde de verdad
 * importa. Quién es quién lo decide `lib/images.ts`, en la misma lista que lee `next.config.ts`.
 */
export function BlockImage({
  image,
  priority = false,
  sizes = '100vw',
  className,
}: {
  readonly image: BlockImageContent;
  /**
   * Si la imagen se descarga con prioridad. Cierto **solo** en la portada.
   *
   * Es la primera imagen que ve el invitado y la que decide la sensación de rapidez. Marcar
   * además las de más abajo anularía el efecto: si todo es prioritario, nada lo es.
   */
  readonly priority?: boolean;
  readonly sizes?: string;
  readonly className?: string;
}) {
  return (
    <Image
      src={image.url}
      alt={image.alt}
      fill
      sizes={sizes}
      priority={priority}
      /* Ver la cabecera: sin esto, una foto de un host no declarado no se degrada, revienta. */
      unoptimized={!isOptimizableImage(image.url)}
      /* `inv-photo` lleva el tratamiento de color del tema. Va aquí y no en cada variante
         para que ninguna se lo pueda saltar: la dirección de arte de las fotografías es del
         tema, no de quien coloca la imagen. */
      className={clsx('inv-photo object-cover', className)}
    />
  );
}
