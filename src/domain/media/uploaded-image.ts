/**
 * Las fotos que sube quien llena una invitación.
 *
 * Hasta ahora las fotos se pegaban como enlace, y eso no funcionaba con lo que de verdad tiene un
 * cliente: sus fotos están en el teléfono, no en una dirección `https://`. Y los enlaces que sí
 * tiene —Google Fotos, Drive, WhatsApp— no son imágenes directas, así que la invitación salía con
 * el hueco.
 *
 * ## La dirección de una foto es nuestra, no del almacenamiento
 *
 * Una foto subida se guarda en el contenido como `/media/<clave>`: una ruta de este sitio, no la
 * URL del disco o del bucket donde vive el archivo. La ruta la sirve `app/media/[...key]`, que le
 * pide el archivo al almacenamiento que esté configurado.
 *
 * Es lo que permite pasar del disco local a S3 sin migrar ni una fila: las invitaciones guardadas
 * siguen apuntando a `/media/...` y lo único que cambia es quién contesta detrás. Y de paso la
 * foto pasa por el optimizador de Next, que ya acepta cualquier ruta del propio sitio (ver
 * `lib/images.ts`).
 *
 * ## Este archivo lo importa el navegador
 *
 * El botón de subir necesita los mismos límites para avisar antes de mandar diez megas que el
 * servidor va a rechazar. Por eso aquí no hay `zod` ni nada de servidor: el esquema de la URL
 * vive en `image-url.ts`.
 */

/**
 * El tamaño máximo de una foto: 10 MB.
 *
 * Una foto de un teléfono actual pesa entre 2 y 6 MB; diez deja margen sin aceptar un RAW de
 * cámara. Lo que se le sirve al invitado no es este archivo sino la versión que recorta el
 * optimizador, así que el peso del original no viaja a ningún teléfono.
 *
 * `next.config.ts` sube el límite de las acciones de servidor un poco por encima de esto: el
 * formulario lleva, además del archivo, sus propios campos.
 */
export const MAX_IMAGE_BYTES = 10 * 1024 * 1024;

/**
 * Los formatos que se aceptan, por la extensión con la que se guardan.
 *
 * Sin SVG, y a propósito: un SVG es un documento que puede llevar scripts, y servirlo desde
 * nuestro dominio sería alojar el XSS de cualquiera. Sin HEIC: el navegador del iPhone lo
 * convierte a JPEG al subirlo cuando el `accept` del campo no lo incluye, y casi ningún navegador
 * de escritorio sabría pintarlo.
 */
export const IMAGE_CONTENT_TYPES = {
  jpg: 'image/jpeg',
  png: 'image/png',
  webp: 'image/webp',
} as const;

export type ImageExtension = keyof typeof IMAGE_CONTENT_TYPES;

/** El `accept` del campo de archivo: lo mismo que se acepta, dicho para el navegador. */
export const IMAGE_ACCEPT = Object.values(IMAGE_CONTENT_TYPES).join(',');

/** La ruta del sitio desde la que se sirven las fotos subidas. */
export const MEDIA_ROUTE = '/media';

/**
 * Cómo es una clave válida: `events/<id del evento>/<id de la foto>.<extensión>`.
 *
 * Tan estricta como se puede, porque la clave llega en la URL y acaba siendo una ruta del disco:
 * con esta forma no cabe un `..`, una barra de más ni un nombre que no hayamos generado nosotros.
 */
const MEDIA_KEY_PATTERN =
  /^events\/[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}\/[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}\.(jpg|png|webp)$/;

export function isMediaKey(key: string): boolean {
  return MEDIA_KEY_PATTERN.test(key);
}

export function mediaUrlFor(key: string): string {
  return `${MEDIA_ROUTE}/${key}`;
}

/** Si una URL guardada es la de una foto subida. */
export function isMediaUrl(url: string): boolean {
  return url.startsWith(`${MEDIA_ROUTE}/`) && isMediaKey(url.slice(MEDIA_ROUTE.length + 1));
}

export function contentTypeOfKey(key: string): string | null {
  const extension = key.split('.').at(-1);

  return extension && extension in IMAGE_CONTENT_TYPES
    ? IMAGE_CONTENT_TYPES[extension as ImageExtension]
    : null;
}

/**
 * Qué formato es un archivo, mirando sus primeros bytes.
 *
 * No se confía en el tipo que declara el navegador ni en la extensión del nombre: los dos los
 * escribe quien sube el archivo. Los bytes del principio son la firma del formato y no se pueden
 * cambiar sin que el archivo deje de abrirse como imagen.
 */
export function sniffImageType(bytes: Uint8Array): ImageExtension | null {
  const startsWith = (signature: readonly number[], offset = 0) =>
    signature.every((byte, index) => bytes[offset + index] === byte);

  if (startsWith([0xff, 0xd8, 0xff])) return 'jpg';
  if (startsWith([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a])) return 'png';
  // «RIFF», cuatro bytes de tamaño, «WEBP».
  if (startsWith([0x52, 0x49, 0x46, 0x46]) && startsWith([0x57, 0x45, 0x42, 0x50], 8)) {
    return 'webp';
  }

  return null;
}

/** Lo que contesta la acción de subir una foto. */
export type ImageUploadResult =
  | { readonly status: 'success'; readonly url: string }
  | { readonly status: 'error'; readonly message: string };
