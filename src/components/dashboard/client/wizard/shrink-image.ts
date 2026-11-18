/**
 * Achica una foto en el navegador antes de subirla.
 *
 * ## Por qué
 *
 * Vercel rechaza toda petición de más de 4.5 MB antes de que llegue a la aplicación, y una foto de
 * teléfono pesa de 3 a 8 MB: subirla tal cual fallaba en producción con un error que la pantalla no
 * podía ni explicar. Además, una invitación no necesita 4000 px: se ve en un teléfono.
 *
 * Se reescala a 2560 px por el lado largo —sobra para una portada a pantalla completa en un
 * teléfono con densidad 3— y se vuelve a comprimir en WebP (o JPEG si el navegador no sabe
 * escribir WebP). Una foto de 6 MB queda por debajo de 1 MB sin diferencia visible.
 *
 * ## Cuándo no la toca
 *
 * Si ya es pequeña y no hay que reescalarla, o si al recomprimirla saldría más pesada, se sube la
 * original. Y si el navegador no puede decodificarla (un formato raro), también: que decida el
 * servidor, que contesta con un motivo.
 */
const MAX_SIDE = 2560;
const SMALL_ENOUGH = 1.5 * 1024 * 1024;
const QUALITY = 0.86;

export async function shrinkImage(file: File): Promise<File> {
  if (!/^image\/(jpeg|png|webp)$/.test(file.type) || typeof createImageBitmap !== 'function') return file;

  let bitmap: ImageBitmap;

  try {
    /* `from-image` respeta la orientación EXIF: sin eso, las fotos verticales del teléfono salen
       acostadas. */
    bitmap = await createImageBitmap(file, { imageOrientation: 'from-image' });
  } catch {
    return file;
  }

  const scale = Math.min(1, MAX_SIDE / Math.max(bitmap.width, bitmap.height));

  if (scale === 1 && file.size <= SMALL_ENOUGH) {
    bitmap.close();
    return file;
  }

  const width = Math.round(bitmap.width * scale);
  const height = Math.round(bitmap.height * scale);
  const canvas = document.createElement('canvas');
  canvas.width = width;
  canvas.height = height;
  const context = canvas.getContext('2d');

  if (!context) {
    bitmap.close();
    return file;
  }

  context.drawImage(bitmap, 0, 0, width, height);
  bitmap.close();

  const blob =
    (await toBlob(canvas, 'image/webp')) ??
    /* Sin WebP, JPEG; pierde la transparencia de un PNG, que en una foto no importa. */
    (await toBlob(canvas, 'image/jpeg'));

  if (!blob || blob.size >= file.size) return file;

  const extension = blob.type === 'image/webp' ? 'webp' : 'jpg';
  const name = file.name.replace(/\.[^.]+$/, '') || 'foto';

  return new File([blob], `${name}.${extension}`, { type: blob.type });
}

function toBlob(canvas: HTMLCanvasElement, type: string): Promise<Blob | null> {
  return new Promise((resolve) =>
    canvas.toBlob((blob) => resolve(blob && blob.type === type ? blob : null), type, QUALITY),
  );
}
