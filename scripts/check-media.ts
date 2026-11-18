/**
 * Comprueba que las fotos se pueden guardar en Supabase Storage, con **el mismo cliente que usa
 * la aplicación** (`SupabaseImageStorage`).
 *
 *   npm run check:media
 *
 * Sube una imagen de 1×1 px a `checks/<uuid>.png`, la vuelve a leer, compara los bytes y la borra.
 * Dice cuál de las piezas falla: la URL, la clave o el bucket.
 *
 * Lee `SUPABASE_URL` y `SUPABASE_SERVICE_ROLE_KEY` de `.env.local` y `.env`. Si en local no las
 * tienes —lo normal: en local las fotos van al disco—, ponlas un momento en `.env.local`, corre
 * esto y quítalas.
 */
import { randomUUID } from 'node:crypto';
import { config as loadDotenv } from 'dotenv';

loadDotenv({ path: ['.env.local', '.env'], quiet: true });

/* Un PNG transparente de 1×1. */
const PIXEL = Uint8Array.from(
  Buffer.from(
    'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNkYPhfDwAChwGA60e6kgAAAABJRU5ErkJggg==',
    'base64',
  ),
);

async function main(): Promise<void> {
  const url = process.env.SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  const bucket = process.env.MEDIA_BUCKET || 'media';

  console.log('\n▸ Configuración de fotos\n');
  console.log(`  SUPABASE_URL               ${url || '(vacía)'}`);
  console.log(`  SUPABASE_SERVICE_ROLE_KEY  ${key ? '(puesta)' : '(vacía)'}`);
  console.log(`  MEDIA_BUCKET               ${bucket}\n`);

  if (!url || !key) {
    console.error(
      '✗ Faltan SUPABASE_URL o SUPABASE_SERVICE_ROLE_KEY.\n\n' +
        '  Sin las dos, la aplicación guarda las fotos en el disco (storage/media), que en local\n' +
        '  está bien y en Vercel no funciona. Para probar Supabase, ponlas un momento en\n' +
        '  .env.local y vuelve a correr esto.\n',
    );
    process.exit(1);
  }

  const { SupabaseImageStorage } = await import('../src/infrastructure/media/supabase-image-storage.js');
  const storage = new SupabaseImageStorage(url, key, bucket);
  const objectKey = `checks/${randomUUID()}.png`;

  console.log(`▸ Subiendo una imagen de prueba a ${bucket}/${objectKey}…`);
  try {
    await storage.save(objectKey, { bytes: PIXEL, contentType: 'image/png' });
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    console.error(`\n✗ No se pudo subir: ${message}\n`);
    console.error('  Las causas habituales:');
    console.error('  · 404 / «Bucket not found»: el bucket no existe o se llama distinto (MEDIA_BUCKET).');
    console.error('  · 400/403 «Invalid Compact JWS» o «signature»: la clave no es la service_role / secret.');
    console.error('    La anon o la publishable no sirven para un bucket privado.');
    console.error('  · 415 / «mime type»: el bucket no permite image/png en Allowed MIME types.');
    console.error('  · ENOTFOUND / fetch failed: la URL del proyecto está mal escrita.\n');
    process.exit(1);
  }

  console.log('▸ Leyéndola de vuelta…');
  const read = await storage.read(objectKey);

  if (!read || Buffer.compare(Buffer.from(read.bytes), Buffer.from(PIXEL)) !== 0) {
    console.error('\n✗ Se subió pero no se pudo leer igual. Revisa los permisos del bucket.\n');
    process.exit(1);
  }

  /* El borrado no es parte de la aplicación (las fotos no se borran), así que va aquí a mano. */
  await fetch(`${url.replace(/\/+$/, '')}/storage/v1/object/${bucket}/${objectKey}`, {
    method: 'DELETE',
    headers: { apikey: key, Authorization: `Bearer ${key}` },
  }).catch(() => undefined);

  console.log('\n✓ Funciona: se subió, se leyó idéntica y se borró la prueba.\n');
  console.log('  En producción, sube una foto desde el admin para confirmar el camino completo.\n');
}

main().catch((error: unknown) => {
  console.error('\n✗ Falló la comprobación:', error instanceof Error ? error.message : error);
  process.exit(1);
});
