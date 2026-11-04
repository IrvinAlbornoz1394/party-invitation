import { z } from 'zod';
import { isMediaUrl } from './uploaded-image';

/**
 * La URL de una foto del contenido: un enlace `http(s)` o una foto subida (`/media/...`).
 *
 * Una ruta del sitio cualquiera no vale, solo la de una foto subida con la forma exacta que
 * generamos nosotros: una ruta relativa mal escrita se vería como una imagen rota en la invitación
 * de un cliente, y el sitio donde eso se descubre no debería ser el teléfono de un invitado.
 */
export function imageUrlSchema(message: string) {
  return z
    .string()
    .trim()
    .refine(
      (value) => isMediaUrl(value) || z.url({ protocol: /^https?$/ }).safeParse(value).success,
      message,
    );
}

export const IMAGE_URL_MESSAGE = 'Sube la foto o pega el enlace directo a la imagen (https://…).';
