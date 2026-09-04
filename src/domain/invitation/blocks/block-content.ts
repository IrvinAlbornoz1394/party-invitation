import type { CalendarContent } from './calendar';
import type { ClosingContent } from './closing';
import type { DetailsContent } from './details';
import type { DresscodeContent } from './dresscode';
import type { FooterContent } from './footer';
import type { GalleryContent } from './gallery';
import type { HeroContent } from './hero';
import type { LocationContent } from './location';
import type { RsvpContent } from './rsvp';
import type { ScheduleContent } from './schedule';
import type { StoryContent } from './story';
import type { WelcomeContent } from './welcome';

/**
 * El contenido de un bloque, emparejado con la clave del bloque al que pertenece.
 *
 * Vivía dentro de la demo del escaparate, y ahí se quedaba corto: el motor de render de la
 * invitación real necesita exactamente lo mismo —un contenido que sabe de qué bloque es— y una
 * demo no puede ser la que defina el tipo del que depende la invitación de un cliente.
 *
 * Es una unión **discriminada** y no un `Record<string, unknown>` por el mismo motivo que lo es
 * el Component Registry: es lo que garantiza que a una galería no le llegue el contenido de una
 * portada. Quien la recorre estrecha por `blockKey` y TypeScript le da el tipo del contenido;
 * quien añada un bloque nuevo y olvide su caso, no compila.
 */
export type BlockContent =
  | { readonly blockKey: 'welcome'; readonly content: WelcomeContent }
  | { readonly blockKey: 'hero'; readonly content: HeroContent }
  | { readonly blockKey: 'story'; readonly content: StoryContent }
  | { readonly blockKey: 'calendar'; readonly content: CalendarContent }
  | { readonly blockKey: 'details'; readonly content: DetailsContent }
  | { readonly blockKey: 'dresscode'; readonly content: DresscodeContent }
  | { readonly blockKey: 'schedule'; readonly content: ScheduleContent }
  | { readonly blockKey: 'gallery'; readonly content: GalleryContent }
  | { readonly blockKey: 'location'; readonly content: LocationContent }
  | { readonly blockKey: 'rsvp'; readonly content: RsvpContent }
  | { readonly blockKey: 'closing'; readonly content: ClosingContent }
  | { readonly blockKey: 'footer'; readonly content: FooterContent };

/** Las claves de bloque que tienen contrato de contenido. */
export type ContentBlockKey = BlockContent['blockKey'];
