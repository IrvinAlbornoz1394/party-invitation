/**
 * Dónde viven los archivos de las fotos subidas.
 *
 * Es un puerto y no una clase porque la respuesta cambia con el despliegue: en desarrollo, una
 * carpeta del disco; en producción, un bucket. El resto del sistema solo conoce la clave
 * (`events/<evento>/<foto>.jpg`) y la ruta pública que la sirve (ver `uploaded-image.ts`), así que
 * cambiar de uno a otro es escribir una implementación nueva y conectarla en el contenedor.
 */
export interface StoredImage {
  readonly bytes: Uint8Array;
  readonly contentType: string;
}

export interface ImageStorage {
  /** Guarda el archivo. Las claves son únicas: nunca se sobrescribe una foto. */
  save(key: string, image: StoredImage): Promise<void>;
  /** El archivo de una clave, o `null` si no existe. */
  read(key: string): Promise<StoredImage | null>;
}
