/**
 * Las capturas de las plantillas para la página de inicio (`public/plantillas/capturas`).
 *
 * Abre cada demo sin mandos (`/plantillas/<clave>/telefono`) en un teléfono de 390×844, pasa la
 * bienvenida como lo haría un invitado (si tiene sobre o puerta) y guarda dos imágenes en WebP:
 *
 * - `capturas/<clave>.webp`: la portada. La usan el muro 3D, el teléfono de la portada y las
 *   miniaturas del selector de la demo.
 * - `capturas/recorrido/<clave>.webp`: la portada y las pantallas que siguen, una debajo de otra.
 *   Es lo que recorre sola la tarjeta del mazo del teléfono (`TemplateSwipe`), para que se vea algo
 *   más que la portada. Son pantallas sueltas pegadas y no una captura de página completa porque
 *   así cada una sale con sus animaciones de entrada terminadas y sus fondos en parallax en su
 *   sitio, como los ve un invitado al bajar.
 *
 * Hay que volver a correrlo al crear una plantilla o al cambiar la portada de una:
 *
 *   npm run dev                                   # en otra terminal
 *   npm i --no-save playwright-core && npx playwright install chromium
 *   node scripts/capture-templates.mjs            # todas
 *   node scripts/capture-templates.mjs gala arbor # solo esas
 *
 * `CHROMIUM_PATH` apunta a otro Chromium si el de Playwright no es el que hay instalado.
 *
 * `playwright-core` no es dependencia del proyecto a propósito: solo hace falta para esto.
 */
import { readFileSync, mkdirSync } from 'node:fs';
import { join } from 'node:path';
import { chromium } from 'playwright-core';
import sharp from 'sharp';

const BASE = process.env.BASE_URL ?? 'http://localhost:3001';
const OUT = join(process.cwd(), 'public', 'plantillas', 'capturas');
const STRIP_OUT = join(OUT, 'recorrido');

const VIEWPORT = { width: 390, height: 844 };
/** Pantallas del recorrido: la portada y dos más. Más no se alcanzan a ver en un paseo corto. */
const STRIP_SCREENS = 3;
const WIDTH = 600;

/* Las claves salen de las demos, para no mantener una segunda lista. */
const source = readFileSync(join(process.cwd(), 'src/components/invitation/demo/templates.ts'), 'utf8');
const allKeys = [...source.matchAll(/^ {4}key: '([a-z0-9-]+)',$/gm)].map((match) => match[1]);
const keys = process.argv.length > 2 ? process.argv.slice(2) : allKeys;

mkdirSync(STRIP_OUT, { recursive: true });
const browser = await chromium.launch(process.env.CHROMIUM_PATH ? { executablePath: process.env.CHROMIUM_PATH } : {});
const page = await browser.newPage({ viewport: VIEWPORT, deviceScaleFactor: 2 });

for (const key of keys) {
  await page.goto(`${BASE}/plantillas/${key}/telefono`, { waitUntil: 'networkidle', timeout: 300_000 });
  /* El indicador de Next en desarrollo no va en la captura. */
  await page.addStyleTag({ content: 'nextjs-portal{display:none!important}' });
  await page.waitForTimeout(3500);

  const gate = page.getByRole('button', { name: /abrir|sello|entrar/i }).first();
  if (await gate.count()) {
    await gate.click({ timeout: 5000 }).catch(() => {});
    await page.waitForTimeout(4000);
  }
  await page.evaluate(() => window.scrollTo(0, 0));
  /* Las portadas entran con animación: se espera a que termine. */
  await page.waitForTimeout(6000);

  const cover = await page.screenshot();
  await sharp(cover).resize(WIDTH).webp({ quality: 78 }).toFile(join(OUT, `${key}.webp`));

  /*
   * El recorrido: se baja pantalla a pantalla como un invitado, esperando en cada una a que entren
   * sus secciones, y se pegan. La primera es la portada que ya se tiene.
   */
  const screens = [cover];
  for (let screen = 1; screen < STRIP_SCREENS; screen += 1) {
    await page.evaluate((top) => window.scrollTo(0, top), screen * VIEWPORT.height);
    await page.waitForTimeout(4000);
    screens.push(await page.screenshot());
  }

  const height = VIEWPORT.height * 2;
  const strip = await sharp({
    create: { width: VIEWPORT.width * 2, height: height * screens.length, channels: 3, background: '#ffffff' },
  })
    .composite(screens.map((input, at) => ({ input, top: at * height, left: 0 })))
    .png()
    .toBuffer();
  await sharp(strip).resize(WIDTH).webp({ quality: 72 }).toFile(join(STRIP_OUT, `${key}.webp`));

  console.log('✓', key);
}

await browser.close();
