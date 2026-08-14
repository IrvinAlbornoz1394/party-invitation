import type { RegisteredBlockKey } from '../registry/component-registry';
import { CLOSING_SAMPLES } from './closing-samples';
import { DETAILS_SAMPLES } from './details-samples';
import { FOOTER_SAMPLES } from './footer-samples';
import { GALLERY_SAMPLES } from './gallery-samples';
import { HERO_SAMPLES } from './hero-samples';
import { LOCATION_SAMPLES } from './location-samples';
import { RSVP_SAMPLES } from './rsvp-samples';
import type { DemoSample, DemoSampleOption } from './sample';
import { SCHEDULE_SAMPLES } from './schedule-samples';
import { STORY_SAMPLES } from './story-samples';
import { WELCOME_SAMPLES } from './welcome-samples';

/**
 * El índice de ejemplos por bloque.
 *
 * Está separado de `BlockDemo` para que aquel archivo exporte solo un componente: mezclando
 * componentes y funciones en un mismo módulo, la recarga en caliente de Next deja de aplicar
 * los cambios en el sitio y recarga la página entera.
 *
 * El `Record` sobre `RegisteredBlockKey` es la red de seguridad: registrar un bloque nuevo sin
 * darle ejemplos no compila, así que no puede aparecer en el panel una previsualización vacía
 * sin que nadie se haya enterado.
 */
const SAMPLES: Readonly<Record<RegisteredBlockKey, readonly DemoSample<unknown>[]>> = {
  welcome: WELCOME_SAMPLES,
  hero: HERO_SAMPLES,
  story: STORY_SAMPLES,
  details: DETAILS_SAMPLES,
  schedule: SCHEDULE_SAMPLES,
  gallery: GALLERY_SAMPLES,
  location: LOCATION_SAMPLES,
  rsvp: RSVP_SAMPLES,
  closing: CLOSING_SAMPLES,
  footer: FOOTER_SAMPLES,
};

/** Los ejemplos disponibles para un bloque, sin su contenido: lo que necesita el selector. */
export function sampleOptions(blockKey: RegisteredBlockKey): readonly DemoSampleOption[] {
  return SAMPLES[blockKey].map(({ key, name }) => ({ key, name }));
}

/**
 * Busca un ejemplo por clave y cae en el primero si no está.
 *
 * El respaldo importa: al saltar de un bloque a otro en la previsualización, la clave elegida
 * puede no existir en el bloque nuevo. Sin él, la ventana se quedaría en blanco justo al
 * cambiar de variante, que es lo que se va a hacer todo el rato.
 */
export function pickSample<TContent>(
  samples: readonly DemoSample<TContent>[],
  key: string,
): DemoSample<TContent> | undefined {
  return samples.find((sample) => sample.key === key) ?? samples[0];
}
