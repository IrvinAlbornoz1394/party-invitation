import type { BlockImage } from '@/domain/invitation/blocks/shared';
import type { RegisteredBlockKey } from '../registry/component-registry';
import { CLOSING_SAMPLES } from './closing-samples';
import { DETAILS_SAMPLES } from './details-samples';
import { FOOTER_SAMPLES } from './footer-samples';
import { GALLERY_SAMPLES } from './gallery-samples';
import { HERO_SAMPLES } from './hero-samples';
import { LOCATION_SAMPLES } from './location-samples';
import { RSVP_SAMPLES } from './rsvp-samples';
import { pickSample } from './samples';
import { SCHEDULE_SAMPLES } from './schedule-samples';
import { STORY_SAMPLES } from './story-samples';
import { WELCOME_SAMPLES } from './welcome-samples';
import type { ClosingContent } from '@/domain/invitation/blocks/closing';
import type { DetailsContent } from '@/domain/invitation/blocks/details';
import type { FooterContent } from '@/domain/invitation/blocks/footer';
import type { GalleryContent } from '@/domain/invitation/blocks/gallery';
import type { HeroContent } from '@/domain/invitation/blocks/hero';
import type { LocationContent } from '@/domain/invitation/blocks/location';
import type { RsvpContent } from '@/domain/invitation/blocks/rsvp';
import type { ScheduleContent } from '@/domain/invitation/blocks/schedule';
import type { StoryContent } from '@/domain/invitation/blocks/story';
import type { WelcomeContent } from '@/domain/invitation/blocks/welcome';

/**
 * Las plantillas de demostración: invitaciones completas, armadas y **sin base de datos**.
 *
 * Son las que se enseñan en la página pública para que alguien pueda ver cómo queda una
 * invitación antes de comprar nada. Todo lo que hay aquí es local: el contenido, las fotos y la
 * elección de diseños. Un visitante que abre una demo no toca Postgres ni una sola vez, y eso
 * importa por dos motivos — la página de venta tiene que responder al instante y tiene que
 * seguir en pie aunque la base de datos esté caída.
 *
 * ## El contenido no se escribe aquí
 *
 * Sale de los ejemplos que ya alimentan la previsualización del panel (`*-samples.ts`), donde
 * cada bloque tiene tres eventos imaginarios con las mismas claves. Una plantilla es, entonces,
 * **una combinación**: un evento imaginario + un tema + una variante elegida por bloque.
 *
 * Eso evita el problema de todo catálogo de demos: que el texto de la demo y el que se usa para
 * probar los componentes se separen y acaben enseñando cosas distintas. Aquí solo hay un juego
 * de contenido, y arreglarlo lo arregla en los dos sitios.
 *
 * ## Por qué cada plantilla elige variantes distintas
 *
 * Porque si las tres usaran `hero.classic` y `gallery.grid`, la página de plantillas enseñaría
 * el mismo diseño tres veces con otras fotos. Lo que distingue a una plantilla de otra es
 * exactamente esto: qué variante lleva cada bloque y con qué tema se compone.
 */

/** El contenido de un bloque, emparejado con su tipo. Igual de estricto que el registro. */
export type TemplateBlockContent =
  | { readonly blockKey: 'welcome'; readonly content: WelcomeContent }
  | { readonly blockKey: 'hero'; readonly content: HeroContent }
  | { readonly blockKey: 'story'; readonly content: StoryContent }
  | { readonly blockKey: 'details'; readonly content: DetailsContent }
  | { readonly blockKey: 'schedule'; readonly content: ScheduleContent }
  | { readonly blockKey: 'gallery'; readonly content: GalleryContent }
  | { readonly blockKey: 'location'; readonly content: LocationContent }
  | { readonly blockKey: 'rsvp'; readonly content: RsvpContent }
  | { readonly blockKey: 'closing'; readonly content: ClosingContent }
  | { readonly blockKey: 'footer'; readonly content: FooterContent };

/** Un bloque de una plantilla: su contenido, con qué variante se enseña y si se puede quitar. */
export type DemoTemplateBlock = TemplateBlockContent & {
  readonly defaultRegistryId: string;
  /**
   * Si el estudio deja **apagarlo** además de cambiarle la variante.
   *
   * No es el `is_required` del catálogo, aunque se parezca. Aquel dice qué bloques necesita una
   * plantilla para tener sentido; esto dice qué se puede comparar en el escaparate. Casi todos
   * los bloques son opcionales en el catálogo y aun así no tiene ningún interés enseñar una demo
   * sin galería: el visitante no está decidiendo eso.
   *
   * La bienvenida sí, y es la única por ahora — «con puerta» contra «sin puerta» es exactamente
   * la diferencia que separa a Premium de Esencial, y verla es el argumento de venta.
   */
  readonly removable?: boolean;
};

export interface DemoTemplate {
  readonly key: string;
  readonly name: string;
  /** Coincide con `event_types.key` en la base de datos. */
  readonly eventTypeKey: string;
  readonly eventTypeName: string;
  readonly tagline: string;
  /** El tema con el que se abre. El visitante puede cambiarlo en la demo. */
  readonly themeKey: string;
  /** La imagen de la tarjeta en la página pública. */
  readonly cover: BlockImage;
  readonly blocks: readonly DemoTemplateBlock[];
}

const unsplash = (id: string, width: number, height: number): string =>
  `https://images.unsplash.com/${id}?auto=format&fit=crop&w=${width}&h=${height}&q=80`;

/**
 * Un bloque de la plantilla: cuál es y con qué variante se enseña.
 *
 * Es una **lista ordenada** y no un objeto por clave, y esa es la corrección que hace que las
 * cuatro plantillas se distingan de verdad: el orden de los bloques es la mitad de lo que define
 * una estructura. `cinematic` abre con la galería justo después de la portada y `classic` la pone
 * después de los datos — con un objeto por clave, las dos se habrían renderizado en el mismo
 * orden y solo se habrían diferenciado en las variantes.
 */
interface TemplateBlockChoice {
  readonly blockKey: RegisteredBlockKey;
  readonly registryId: string;
  /** Ver `DemoTemplateBlock.removable`. */
  readonly removable?: boolean;
}

interface TemplateDefinition {
  readonly key: string;
  readonly name: string;
  readonly eventTypeKey: string;
  readonly eventTypeName: string;
  readonly tagline: string;
  readonly themeKey: string;
  readonly cover: BlockImage;
  /** Qué evento imaginario de `*-samples.ts` la alimenta. */
  readonly sampleKey: string;
  readonly blocks: readonly TemplateBlockChoice[];
}

/**
 * Las cuatro demos: una por estructura del catálogo.
 *
 * Cada una corresponde a una plantilla real —`classic`, `editorial`, `storytelling`,
 * `cinematic`— y repite su composición de bloques y sus variantes. Dos de ellas usan el **mismo
 * contenido** (la boda), y eso es deliberado: comparar `editorial` y `cinematic` con el mismo
 * texto y las mismas fotos es la única forma de ver qué hace una plantilla, sin que la diferencia
 * la ponga el contenido.
 *
 * ## Deuda conocida
 *
 * Estas composiciones están escritas aquí **y** en `scripts/seed.ts`. Es duplicación, y se quita
 * cuando el escaparate lea las plantillas de la base de datos —que es a lo que apunta la tabla
 * `template_blocks`—. Mientras tanto, si se cambia una estructura hay que cambiarla en los dos
 * sitios.
 */
const DEFINITIONS: readonly TemplateDefinition[] = [
  {
    key: 'classic',
    name: 'Classic',
    eventTypeKey: 'presentation',
    eventTypeName: 'Presentación',
    tagline: 'La estructura completa y en el orden esperado: presenta, cuenta, informa y despide.',
    themeKey: 'floral',
    cover: {
      url: unsplash('photo-1607344645866-009c320b63e0', 1200, 900),
      alt: 'Mesa de dulces decorada con globos y flores',
    },
    sampleKey: 'presentacion',
    blocks: [
      /*
       * La bienvenida está en las CUATRO demos aunque en el catálogo (`scripts/seed.ts`) solo la
       * lleve `cinematic`, y la diferencia es deliberada: una plantilla del catálogo es lo que un
       * cliente se encuentra montado, y el escaparate es donde se prueba lo que se puede añadir.
       * Es la pieza que distingue a Premium, así que hay que poder ponerla, cambiarla y quitarla
       * sobre cualquier estructura — de ahí `removable`.
       *
       * Cada demo abre con una variante distinta para que las tres se vean sin ir a buscarlas.
       */
      { blockKey: 'welcome', registryId: 'welcome.veil', removable: true },
      { blockKey: 'hero', registryId: 'hero.classic' },
      { blockKey: 'story', registryId: 'story.image-left' },
      { blockKey: 'details', registryId: 'details.cards' },
      { blockKey: 'schedule', registryId: 'schedule.vertical' },
      { blockKey: 'gallery', registryId: 'gallery.grid' },
      { blockKey: 'location', registryId: 'location.dual-venue' },
      { blockKey: 'rsvp', registryId: 'rsvp.card' },
      { blockKey: 'closing', registryId: 'closing.split' },
      { blockKey: 'footer', registryId: 'footer.centered' },
    ],
  },
  {
    key: 'editorial',
    name: 'Editorial',
    eventTypeKey: 'wedding',
    eventTypeName: 'Boda',
    tagline: 'Lenguaje de revista: maqueta de pliego, folios y pies de foto a la vista.',
    themeKey: 'elegance',
    cover: {
      url: unsplash('photo-1560421683-6856ea585c78', 1200, 900),
      alt: 'Mesa larga montada al aire libre para una boda',
    },
    sampleKey: 'boda',
    blocks: [
      { blockKey: 'welcome', registryId: 'welcome.envelope', removable: true },
      { blockKey: 'hero', registryId: 'hero.centered' },
      { blockKey: 'story', registryId: 'story.image-right' },
      { blockKey: 'gallery', registryId: 'gallery.editorial' },
      { blockKey: 'details', registryId: 'details.list' },
      { blockKey: 'schedule', registryId: 'schedule.agenda' },
      { blockKey: 'location', registryId: 'location.single-split' },
      { blockKey: 'rsvp', registryId: 'rsvp.reply-card' },
      { blockKey: 'closing', registryId: 'closing.letter' },
      { blockKey: 'footer', registryId: 'footer.ribbon' },
    ],
  },
  {
    key: 'storytelling',
    name: 'Storytelling',
    eventTypeKey: 'quince',
    eventTypeName: 'XV Años',
    tagline: 'El orden narra: la historia y las fotos van antes que los datos.',
    themeKey: 'dreamy',
    cover: {
      url: unsplash('photo-1530103862676-de8c9debad1d', 1200, 900),
      alt: 'Salón iluminado con luces cálidas durante una celebración',
    },
    sampleKey: 'xv-anios',
    blocks: [
      { blockKey: 'welcome', registryId: 'welcome.band', removable: true },
      { blockKey: 'hero', registryId: 'hero.split' },
      { blockKey: 'story', registryId: 'story.overlay' },
      { blockKey: 'gallery', registryId: 'gallery.polaroid' },
      { blockKey: 'schedule', registryId: 'schedule.showcase' },
      { blockKey: 'details', registryId: 'details.split' },
      { blockKey: 'location', registryId: 'location.dual-stacked' },
      { blockKey: 'rsvp', registryId: 'rsvp.postcard' },
      { blockKey: 'closing', registryId: 'closing.horizon' },
      { blockKey: 'footer', registryId: 'footer.marquee' },
    ],
  },
  {
    key: 'cinematic',
    name: 'Cinematic',
    eventTypeKey: 'wedding',
    eventTypeName: 'Boda',
    tagline: 'Todo a pantalla completa: planos panorámicos y muy poco texto por vista.',
    themeKey: 'royal',
    cover: {
      url: unsplash('photo-1513151233558-d860c5398176', 1200, 900),
      alt: 'Confeti de colores lanzado al aire durante una celebración',
    },
    sampleKey: 'boda',
    blocks: [
      { blockKey: 'welcome', registryId: 'welcome.spotlight', removable: true },
      { blockKey: 'hero', registryId: 'hero.classic' },
      { blockKey: 'gallery', registryId: 'gallery.cinematic' },
      { blockKey: 'story', registryId: 'story.overlay' },
      { blockKey: 'schedule', registryId: 'schedule.showcase' },
      { blockKey: 'details', registryId: 'details.panel' },
      { blockKey: 'location', registryId: 'location.single' },
      { blockKey: 'rsvp', registryId: 'rsvp.panel' },
      { blockKey: 'closing', registryId: 'closing.horizon' },
      { blockKey: 'footer', registryId: 'footer.ribbon' },
    ],
  },
];

/**
 * El contenido de un bloque para un evento imaginario, o `null` si ese bloque no tiene ejemplo.
 *
 * El `switch` por bloque es el mismo patrón que en `BlockDemo` y `TemplateBlock`, y por la misma
 * razón: cada bloque tiene un contrato de contenido distinto, y es esta rama la que le garantiza
 * a TypeScript que a una galería no se le pasa el contenido de una portada.
 */
function contentFor(blockKey: RegisteredBlockKey, sampleKey: string): TemplateBlockContent | null {
  switch (blockKey) {
    case 'welcome': {
      const sample = pickSample(WELCOME_SAMPLES, sampleKey);

      return sample ? { blockKey, content: sample.content } : null;
    }
    case 'hero': {
      const sample = pickSample(HERO_SAMPLES, sampleKey);

      return sample ? { blockKey, content: sample.content } : null;
    }
    case 'story': {
      const sample = pickSample(STORY_SAMPLES, sampleKey);

      return sample ? { blockKey, content: sample.content } : null;
    }
    case 'details': {
      const sample = pickSample(DETAILS_SAMPLES, sampleKey);

      return sample ? { blockKey, content: sample.content } : null;
    }
    case 'schedule': {
      const sample = pickSample(SCHEDULE_SAMPLES, sampleKey);

      return sample ? { blockKey, content: sample.content } : null;
    }
    case 'gallery': {
      const sample = pickSample(GALLERY_SAMPLES, sampleKey);

      return sample ? { blockKey, content: sample.content } : null;
    }
    case 'location': {
      const sample = pickSample(LOCATION_SAMPLES, sampleKey);

      return sample ? { blockKey, content: sample.content } : null;
    }
    case 'rsvp': {
      const sample = pickSample(RSVP_SAMPLES, sampleKey);

      return sample ? { blockKey, content: sample.content } : null;
    }
    case 'closing': {
      const sample = pickSample(CLOSING_SAMPLES, sampleKey);

      return sample ? { blockKey, content: sample.content } : null;
    }
    case 'footer': {
      const sample = pickSample(FOOTER_SAMPLES, sampleKey);

      return sample ? { blockKey, content: sample.content } : null;
    }
    default: {
      const unhandled: never = blockKey;

      return unhandled;
    }
  }
}

/**
 * Arma los bloques de una plantilla **en el orden que declara**.
 *
 * Un bloque sin ejemplo para ese evento imaginario se omite en lugar de romper la plantilla
 * entera. Es la misma decisión que en el registro: perder un bloque es un daño acotado, y en una
 * página de venta es preferible a un error.
 */
function assemble(definition: TemplateDefinition): readonly DemoTemplateBlock[] {
  const blocks: DemoTemplateBlock[] = [];

  for (const choice of definition.blocks) {
    const content = contentFor(choice.blockKey, definition.sampleKey);

    if (content) {
      blocks.push({
        ...content,
        defaultRegistryId: choice.registryId,
        removable: choice.removable,
      });
    }
  }

  return blocks;
}

export const DEMO_TEMPLATES: readonly DemoTemplate[] = DEFINITIONS.map((definition) => ({
  key: definition.key,
  name: definition.name,
  eventTypeKey: definition.eventTypeKey,
  eventTypeName: definition.eventTypeName,
  tagline: definition.tagline,
  themeKey: definition.themeKey,
  cover: definition.cover,
  blocks: assemble(definition),
}));

export function findDemoTemplate(key: string): DemoTemplate | undefined {
  return DEMO_TEMPLATES.find((template) => template.key === key);
}
