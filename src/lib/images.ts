/**
 * Qué fotografías puede optimizar Next, y qué se hace con las demás.
 *
 * ## El problema
 *
 * `next/image` exige una **allowlist de hosts** (`images.remotePatterns`) y se niega a pintar una
 * imagen de cualquier otro sitio: no la degrada, lanza. Y el contenido de este producto lleva
 * fotografías que **pega el cliente**, con un enlace de donde él las tenga —Pixabay, Google Fotos,
 * el sitio de su fotógrafo—. Una lista de hosts no puede adivinar eso, así que la primera
 * invitación con una foto de un dominio nuevo reventaba la vista previa entera.
 *
 * ## Lo que NO se hizo
 *
 * Abrir la lista a `**`. La allowlist está puesta a conciencia —sin ella, `/_next/image` se
 * convierte en un proxy abierto: cualquiera puede pedirle que descargue y reescale imágenes de
 * internet a costa de nuestro servidor—. Quitarla para que entre una foto de Pixabay es cambiar
 * un fallo visible por uno que no se ve.
 *
 * ## Lo que se hace
 *
 * Optimizar lo que viene de un host **nuestro** y servir tal cual lo demás. Las fotos de las
 * demos y las que algún día estén en nuestro almacenamiento pasan por el optimizador —que es
 * donde de verdad importa, porque son las que se repiten en cada visita—; la de un cliente se
 * sirve con su URL original, sin pasar por nuestro servidor.
 *
 * El coste es real y conviene decirlo: esa foto viaja al móvil del invitado con el peso que
 * tenga. Es temporal — cuando exista la subida de archivos, las fotos de los clientes vivirán en
 * nuestro bucket, ese host entrará en esta lista y se optimizarán todas. Mientras tanto, una
 * invitación que pesa de más se ve; una que no carga, no.
 *
 * ## Por qué esta lista vive aquí y no en `next.config.ts`
 *
 * Porque la usan los dos: la configuración, para declarar los `remotePatterns`, y `BlockImage`,
 * para decidir si esa URL puede optimizarse. Escrita dos veces, el día que se añada un host la
 * imagen seguiría rompiendo en un sitio y funcionando en el otro, que es el peor de los fallos:
 * el que solo aparece en producción.
 */

/** Los hosts que el optimizador puede tocar. Se importa desde `next.config.ts`. */
export const OPTIMIZED_IMAGE_HOSTS = [
  /* Las fotografías de las demos del escaparate. Son nuestras en el sentido que importa: las
     elegimos nosotros y se sirven en cada visita a `/plantillas/*`. */
  'images.unsplash.com',
] as const;

/**
 * Si esta URL puede pasar por el optimizador de Next.
 *
 * Una ruta del propio sitio (`/fotos/portada.jpg`) siempre puede: no hay host que autorizar. Una
 * URL que no se deja leer se trata como ajena — es el lado seguro: se sirve tal cual en lugar de
 * hacer lanzar al renderizador en medio de una invitación.
 */
export function isOptimizableImage(url: string): boolean {
  if (url.startsWith('/')) return true;

  try {
    const { hostname } = new URL(url);

    return (OPTIMIZED_IMAGE_HOSTS as readonly string[]).includes(hostname);
  } catch {
    return false;
  }
}
