import { mkdir, readFile, writeFile } from 'node:fs/promises';
import { dirname, resolve, sep } from 'node:path';
import type { ImageStorage, StoredImage } from '@/domain/media/image-storage';
import { contentTypeOfKey } from '@/domain/media/uploaded-image';

/**
 * Las fotos en una carpeta del disco. Para desarrollo.
 *
 * **No sirve en Vercel**: el disco de una función es efímero y lo que se escribe ahí desaparece
 * con la instancia. Para producción hace falta otra implementación de `ImageStorage` —S3 o
 * similar— y conectarla en el contenedor; las fotos guardadas no cambian de dirección (ver
 * `domain/media/uploaded-image.ts`).
 */
export class LocalImageStorage implements ImageStorage {
  private readonly root: string;

  constructor(directory: string) {
    this.root = resolve(directory);
  }

  async save(key: string, image: StoredImage): Promise<void> {
    const path = this.pathOf(key);

    await mkdir(dirname(path), { recursive: true });
    // `wx`: falla si ya existe. Las claves llevan un uuid nuevo, así que nunca debería pasar.
    await writeFile(path, image.bytes, { flag: 'wx' });
  }

  async read(key: string): Promise<StoredImage | null> {
    const contentType = contentTypeOfKey(key);

    if (contentType === null) return null;

    try {
      return { bytes: new Uint8Array(await readFile(this.pathOf(key))), contentType };
    } catch (error) {
      if ((error as NodeJS.ErrnoException).code === 'ENOENT') return null;
      throw error;
    }
  }

  /**
   * La ruta del archivo, sin salirse de la carpeta.
   *
   * Quien llama ya validó la forma de la clave, y esto es la segunda red: una clave que resolviera
   * fuera de la carpeta —por un cambio futuro en esa validación— se rechaza aquí en vez de leer
   * cualquier archivo del servidor.
   */
  private pathOf(key: string): string {
    const path = resolve(this.root, key);

    if (!path.startsWith(this.root + sep)) throw new Error('Clave de imagen fuera del almacenamiento.');

    return path;
  }
}
