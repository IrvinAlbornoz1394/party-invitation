import 'server-only';

import type { ImageStorage, StoredImage } from '@/domain/media/image-storage';
import { contentTypeOfKey } from '@/domain/media/uploaded-image';

/**
 * Las fotos en Supabase Storage, por su API HTTP.
 *
 * ## Por qué hizo falta
 *
 * `LocalImageStorage` escribe en el disco del servidor, y en Vercel ese disco es de solo lectura
 * y se tira en cada despliegue: en producción no se podía subir ni una foto. Supabase ya es la base
 * de datos del proyecto, así que su almacenamiento no añade un proveedor nuevo.
 *
 * ## Por qué HTTP y no el SDK
 *
 * Por lo mismo que `ResendClient`: son dos peticiones —subir y bajar un objeto— y el paquete
 * `@supabase/supabase-js` traería un árbol de dependencias entero para ahorrarlas.
 *
 * ## El bucket es privado y las URL no cambian
 *
 * Las fotos se siguen sirviendo por `/media/<clave>` (`app/media/[...key]/route.ts`), que es lo
 * que ya está guardado en la base. El bucket no se abre al público: así no hay dos direcciones por
 * foto y el día que se cambie de proveedor tampoco cambia ninguna URL guardada.
 *
 * La clave de servicio salta las políticas de Storage, y por eso vive solo en el servidor
 * (`import 'server-only'`) y nunca en una variable `NEXT_PUBLIC_`.
 */
const TIMEOUT_MS = 15_000;

export class SupabaseImageStorage implements ImageStorage {
  private readonly base: string;

  constructor(
    projectUrl: string,
    private readonly serviceKey: string,
    bucket: string,
  ) {
    this.base = `${projectUrl.replace(/\/+$/, '')}/storage/v1/object/${encodeURIComponent(bucket)}`;
  }

  async save(key: string, image: StoredImage): Promise<void> {
    const response = await fetch(`${this.base}/${encodePath(key)}`, {
      method: 'POST',
      headers: {
        ...this.auth(),
        'Content-Type': image.contentType,
        /* Las claves llevan un uuid nuevo: si ya existe, algo va mal y no se pisa. */
        'x-upsert': 'false',
        'Cache-Control': 'max-age=31536000',
      },
      body: Buffer.from(image.bytes),
      signal: AbortSignal.timeout(TIMEOUT_MS),
    });

    if (!response.ok) {
      const detail = await response.text().catch(() => '');
      throw new Error(`Supabase Storage ${response.status} al guardar: ${detail.slice(0, 200)}`);
    }
  }

  async read(key: string): Promise<StoredImage | null> {
    const contentType = contentTypeOfKey(key);

    if (contentType === null) return null;

    const response = await fetch(`${this.base}/${encodePath(key)}`, {
      headers: this.auth(),
      signal: AbortSignal.timeout(TIMEOUT_MS),
      /* La foto no cambia nunca (la clave lleva uuid), pero quien cachea es la respuesta de
         `/media`, no esta petición interna. */
      cache: 'no-store',
    });

    /* Storage contesta 400 «Object not found» además de 404, según la versión. */
    if (response.status === 404 || response.status === 400) return null;

    if (!response.ok) {
      throw new Error(`Supabase Storage ${response.status} al leer ${key}`);
    }

    return { bytes: new Uint8Array(await response.arrayBuffer()), contentType };
  }

  /* Las dos cabeceras: la clave `service_role` heredada las acepta y la nueva `sb_secret_…` va en
     `apikey`. Así sirve cualquiera de las dos. */
  private auth(): Record<string, string> {
    return { apikey: this.serviceKey, Authorization: `Bearer ${this.serviceKey}` };
  }
}

/** Cada tramo de la clave codificado, sin tocar las barras que separan carpetas. */
function encodePath(key: string): string {
  return key.split('/').map(encodeURIComponent).join('/');
}
