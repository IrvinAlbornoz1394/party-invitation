import { randomUUID } from 'node:crypto';
import type { ImageStorage, StoredImage } from '@/domain/media/image-storage';
import {
  IMAGE_CONTENT_TYPES,
  MAX_IMAGE_BYTES,
  contentTypeOfKey,
  isMediaKey,
  mediaUrlFor,
  sniffImageType,
  type ImageUploadResult,
} from '@/domain/media/uploaded-image';

/**
 * Subir una foto de una invitación.
 *
 * **No autoriza**: quien la llama ya resolvió que la sesión puede editar ese evento, igual que
 * antes de guardar el contenido (`requireEventAccess` en el panel, `findEventForPlatform` en el
 * admin). Aquí no hay nada de la base de datos que consultar: la foto no se apunta en ninguna
 * tabla hasta que el contenido que la usa se guarda, y lo que se guarda pasa por la misma
 * validación de siempre.
 *
 * Una foto que se sube y nunca se guarda —se cambió por otra, se cerró la pestaña— se queda en el
 * almacenamiento sin que nadie la use. Limpiarlas es trabajo para cuando haya un bucket: allí se
 * resuelve con una regla de ciclo de vida y no con código.
 */
export class UploadEventImage {
  constructor(private readonly storage: ImageStorage) {}

  async execute(eventId: string, file: File): Promise<ImageUploadResult> {
    if (file.size === 0) return { status: 'error', message: 'El archivo está vacío.' };

    if (file.size > MAX_IMAGE_BYTES) {
      return { status: 'error', message: 'La foto pesa más de 10 MB. Prueba con una más ligera.' };
    }

    const bytes = new Uint8Array(await file.arrayBuffer());
    const extension = sniffImageType(bytes);

    if (extension === null) {
      return { status: 'error', message: 'Ese archivo no es una foto JPG, PNG o WebP.' };
    }

    const key = `events/${eventId}/${randomUUID()}.${extension}`;

    // El id del evento llega del formulario: si no tiene forma de uuid, la clave no la tendrá.
    if (!isMediaKey(key)) return { status: 'error', message: 'No se pudo subir la foto.' };

    await this.storage.save(key, { bytes, contentType: IMAGE_CONTENT_TYPES[extension] });

    return { status: 'success', url: mediaUrlFor(key) };
  }
}

/**
 * Leer una foto subida para servirla.
 *
 * Es público: la foto de una invitación la ve cualquiera que tenga el enlace de la invitación, y
 * la clave lleva dos uuid que no se adivinan. La clave se comprueba antes de tocar el almacenamiento
 * porque llega en la URL y, en disco, acaba siendo una ruta.
 */
export class ReadEventImage {
  constructor(private readonly storage: ImageStorage) {}

  async execute(key: string): Promise<StoredImage | null> {
    if (!isMediaKey(key) || contentTypeOfKey(key) === null) return null;

    return this.storage.read(key);
  }
}
