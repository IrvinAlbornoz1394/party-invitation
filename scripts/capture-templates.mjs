/**
 * Las capturas de las plantillas para la página de inicio (`public/plantillas/capturas`).
 *
 * Abre cada demo sin mandos (`/plantillas/<clave>/telefono`) en un teléfono de 390×844, pasa la
 * bienvenida como lo haría un invitado (si tiene sobre o puerta), y guarda la portada en WebP.
 * La página de inicio las usa en el mazo, en el muro 3D y en el teléfono del celular.
 *
 * Hay que volver a correrlo al crear una plantilla o al cambiar la portada de una:
 *
 *   npm run dev                                   # en otra terminal
 *   npm i --no-save playwright-core && npx playwright install chromium
 *   node scripts/capture-templates.mjs            # todas
 *   node scripts/capture-templates.mjs gala arbor # solo esas
 *
 * `playwright-core` no es dependencia del proyecto a propósito: solo hace falta para esto.
 */
import { readFileSync, mkdirSync } from 'node:fs';
import { join } from 'node:path';
import { chromium } from 'playwright-core';
import sharp from 'sharp';

const BASE = process.env.BASE_URL ?? 'http://localhost:3001';
const OUT = join(process.cwd(), 'public', 'plantillas', 'capturas');

/* Las claves salen de las demos, para no mantener una segunda lista. */
const source = readFileSync(join(process.cwd(), 'src/components/invitation/demo/templates.ts'), 'utf8');
const allKeys = [...source.matchAll(/^ {4}key: '([a-z0-9-]+)',$/gm)].map((match) => match[1]);
const keys = process.argv.length > 2 ? process.argv.slice(2) : allKeys;

mkdirSync(OUT, { recursive: true });
const browser = await chromium.launch();
const page = await browser.newPage({ viewport: { width: 390, height: 844 }, deviceScaleFactor: 2 });

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

  const png = await page.screenshot();
  await sharp(png).resize(600).webp({ quality: 78 }).toFile(join(OUT, `${key}.webp`));
  console.log('✓', key);
}

await browser.close();
