import { readEventImage } from '@/infrastructure/container';

/**
 * Sirve las fotos subidas: `/media/events/<evento>/<foto>.jpg`.
 *
 * Es la dirección que se guarda en el contenido, y por eso no apunta al almacenamiento sino aquí:
 * cambiar el disco por un bucket no cambia ninguna URL guardada. Ver
 * `domain/media/uploaded-image.ts`.
 *
 * Se cachea para siempre porque una clave nunca cambia de contenido: lleva un uuid nuevo por
 * archivo, y reemplazar una foto es subir otra con otra clave.
 */
export async function GET(
  _request: Request,
  { params }: { params: Promise<{ key: string[] }> },
): Promise<Response> {
  const { key } = await params;
  const image = await readEventImage.execute(key.join('/'));

  if (image === null) return new Response('No encontrado', { status: 404 });

  return new Response(Buffer.from(image.bytes), {
    headers: {
      'Content-Type': image.contentType,
      'Cache-Control': 'public, max-age=31536000, immutable',
    },
  });
}
