import { CalendarMonth } from '../blocks/calendar/CalendarMonth';
import type { CalendarVariant } from '../blocks/calendar/calendar-variant';
import { ClosingEnvelope } from '../blocks/closing/ClosingEnvelope';
import { ClosingHorizon } from '../blocks/closing/ClosingHorizon';
import { ClosingLetter } from '../blocks/closing/ClosingLetter';
import { ClosingSplit } from '../blocks/closing/ClosingSplit';
import type { ClosingVariant } from '../blocks/closing/closing-parts';
import { DetailsCards } from '../blocks/details/DetailsCards';
import { DetailsList } from '../blocks/details/DetailsList';
import { DetailsPanel } from '../blocks/details/DetailsPanel';
import { DetailsSplit } from '../blocks/details/DetailsSplit';
import type { DetailsVariant } from '../blocks/details/details-variant';
import { DresscodePalette } from '../blocks/dresscode/DresscodePalette';
import type { DresscodeVariant } from '../blocks/dresscode/dresscode-variant';
import { FooterCentered } from '../blocks/footer/FooterCentered';
import { FooterMarquee } from '../blocks/footer/FooterMarquee';
import { FooterRibbon } from '../blocks/footer/FooterRibbon';
import type { FooterVariant } from '../blocks/footer/footer-parts';
import { GalleryCarousel } from '../blocks/gallery/GalleryCarousel';
import { GalleryCinematic } from '../blocks/gallery/GalleryCinematic';
import { GalleryEditorial } from '../blocks/gallery/GalleryEditorial';
import { GalleryGrid } from '../blocks/gallery/GalleryGrid';
import { GalleryMasonry } from '../blocks/gallery/GalleryMasonry';
import { GalleryMosaic } from '../blocks/gallery/GalleryMosaic';
import { GalleryParallax } from '../blocks/gallery/GalleryParallax';
import { GalleryPolaroid } from '../blocks/gallery/GalleryPolaroid';
import type { GalleryVariant } from '../blocks/gallery/gallery-parts';
import { HeroCentered } from '../blocks/hero/HeroCentered';
import { HeroClassic } from '../blocks/hero/HeroClassic';
import { HeroFramed } from '../blocks/hero/HeroFramed';
import { HeroPortrait } from '../blocks/hero/HeroPortrait';
import { HeroSplit } from '../blocks/hero/HeroSplit';
import type { HeroVariant } from '../blocks/hero/hero-variant';
import { LocationDualJourney } from '../blocks/location/LocationDualJourney';
import { LocationDualStacked } from '../blocks/location/LocationDualStacked';
import { LocationDualVenue } from '../blocks/location/LocationDualVenue';
import { LocationSingle } from '../blocks/location/LocationSingle';
import { LocationSingleCard } from '../blocks/location/LocationSingleCard';
import { LocationSinglePlate } from '../blocks/location/LocationSinglePlate';
import { LocationSingleSplit } from '../blocks/location/LocationSingleSplit';
import type { LocationVariant } from '../blocks/location/location-parts';
import { RsvpCard } from '../blocks/rsvp/RsvpCard';
import { RsvpPanel } from '../blocks/rsvp/RsvpPanel';
import { RsvpPostcard } from '../blocks/rsvp/RsvpPostcard';
import { RsvpReplyCard } from '../blocks/rsvp/RsvpReplyCard';
import { RsvpTicket } from '../blocks/rsvp/RsvpTicket';
import { RsvpTorn } from '../blocks/rsvp/RsvpTorn';
import type { RsvpVariant } from '../blocks/rsvp/rsvp-parts';
import { ScheduleAgenda } from '../blocks/schedule/ScheduleAgenda';
import { ScheduleItinerary } from '../blocks/schedule/ScheduleItinerary';
import { ScheduleRail } from '../blocks/schedule/ScheduleRail';
import { ScheduleRibbon } from '../blocks/schedule/ScheduleRibbon';
import { ScheduleShowcase } from '../blocks/schedule/ScheduleShowcase';
import { ScheduleTimeline } from '../blocks/schedule/ScheduleTimeline';
import { ScheduleZigzag } from '../blocks/schedule/ScheduleZigzag';
import type { ScheduleVariant } from '../blocks/schedule/schedule-variant';
import { StoryCentered } from '../blocks/story/StoryCentered';
import { StoryOverlay } from '../blocks/story/StoryOverlay';
import { StoryImageLeft, StoryImageRight } from '../blocks/story/StorySplit';
import type { StoryVariant } from '../blocks/story/story-variant';
import { WelcomeBand } from '../blocks/welcome/WelcomeBand';
import { WelcomeBotanical } from '../blocks/welcome/WelcomeBotanical';
import { WelcomeCountdown } from '../blocks/welcome/WelcomeCountdown';
import { WelcomeEnvelope } from '../blocks/welcome/WelcomeEnvelope';
import { WelcomeFiligree } from '../blocks/welcome/WelcomeFiligree';
import { WelcomeLuminous } from '../blocks/welcome/WelcomeLuminous';
import { WelcomeMonogram } from '../blocks/welcome/WelcomeMonogram';
import { WelcomeTorn } from '../blocks/welcome/WelcomeTorn';
import { WelcomeSpotlight } from '../blocks/welcome/WelcomeSpotlight';
import { WelcomeVeil } from '../blocks/welcome/WelcomeVeil';
import type { WelcomeVariant } from '../blocks/welcome/welcome-parts';

/**
 * El Component Registry: el único sitio del código que sabe qué componente es cada
 * `registry_id`.
 *
 * `docs/PROJECT.md` lo pide así —«el sistema nunca conocerá directamente los componentes,
 * únicamente sus identificadores»— y la consecuencia práctica es que ningún otro archivo
 * importa `HeroClassic`. La base de datos guarda la cadena `hero.classic` en
 * `event_blocks.variant_id → component_variants.registry_id`; el motor de render pide esa
 * cadena aquí y pinta lo que le devuelvan. Añadir una variante es una fila en la base de datos
 * y una línea en esta tabla: el motor no se toca, y por eso no hay ningún
 * `if (variant === 'carousel')` en ninguna parte.
 *
 * ## Por qué las entradas llevan `blockKey`
 *
 * Porque una portada y una historia no reciben lo mismo, y un mapa de `registry_id` a
 * `ComponentType<unknown>` obligaría a un molde en cada uso —el punto exacto donde se cuela el
 * fallo que este diseño existe para evitar: pasarle a una historia el contenido de una portada
 * y descubrirlo en producción—. Con `blockKey` en cada entrada la unión es discriminada: quien
 * resuelve estrecha por bloque y TypeScript le garantiza el tipo del contenido, y quien olvide
 * cubrir un bloque nuevo se entera al compilar y no en la invitación de un cliente.
 *
 * ## Por qué esta tabla se escribe a mano
 *
 * Podría generarse recorriendo el directorio de bloques. No se hace: un `import` explícito es
 * lo que permite que el empaquetador sepa qué entra en el paquete, y un registro mágico
 * arrastraría al cliente todas las variantes existan o no en la invitación que se está
 * sirviendo. La lista corta y aburrida es la que se mantiene sola.
 */

/** Una entrada del registro: el bloque al que sirve y el componente que lo pinta. */
export type RegisteredComponent =
  | { readonly blockKey: 'welcome'; readonly component: WelcomeVariant }
  | { readonly blockKey: 'hero'; readonly component: HeroVariant }
  | { readonly blockKey: 'story'; readonly component: StoryVariant }
  | { readonly blockKey: 'calendar'; readonly component: CalendarVariant }
  | { readonly blockKey: 'details'; readonly component: DetailsVariant }
  | { readonly blockKey: 'dresscode'; readonly component: DresscodeVariant }
  | { readonly blockKey: 'schedule'; readonly component: ScheduleVariant }
  | { readonly blockKey: 'gallery'; readonly component: GalleryVariant }
  | { readonly blockKey: 'location'; readonly component: LocationVariant }
  | { readonly blockKey: 'rsvp'; readonly component: RsvpVariant }
  | { readonly blockKey: 'closing'; readonly component: ClosingVariant }
  | { readonly blockKey: 'footer'; readonly component: FooterVariant };

/** Las claves de bloque que el código sabe pintar. */
export type RegisteredBlockKey = RegisteredComponent['blockKey'];

const REGISTRY: Readonly<Record<string, RegisteredComponent>> = {
  /*
   * La bienvenida va primera porque es lo primero que se ve, aunque no sea una sección: tapa la
   * invitación entera hasta que el invitado la abre. Es el único bloque que se pinta fuera del
   * flujo de la página — ver `blocks/welcome/welcome-parts.tsx`.
   */
  'welcome.veil': { blockKey: 'welcome', component: WelcomeVeil },
  'welcome.envelope': { blockKey: 'welcome', component: WelcomeEnvelope },
  'welcome.spotlight': { blockKey: 'welcome', component: WelcomeSpotlight },
  /* Las siete siguientes salen de referencias reales del mercado. No son variaciones de las tres
     de arriba: cada una es un lenguaje distinto —grabado, monograma, neón, botánica, papel
     rasgado, banda de color y cuenta atrás— y todas cumplen el mismo contrato. */
  'welcome.filigree': { blockKey: 'welcome', component: WelcomeFiligree },
  'welcome.monogram': { blockKey: 'welcome', component: WelcomeMonogram },
  'welcome.luminous': { blockKey: 'welcome', component: WelcomeLuminous },
  'welcome.botanical': { blockKey: 'welcome', component: WelcomeBotanical },
  'welcome.torn': { blockKey: 'welcome', component: WelcomeTorn },
  'welcome.band': { blockKey: 'welcome', component: WelcomeBand },
  'welcome.countdown': { blockKey: 'welcome', component: WelcomeCountdown },

  'hero.classic': { blockKey: 'hero', component: HeroClassic },
  'hero.centered': { blockKey: 'hero', component: HeroCentered },
  'hero.split': { blockKey: 'hero', component: HeroSplit },
  /* La única que no vela la foto: la deshace en el papel y empieza el texto ahí. */
  'hero.portrait': { blockKey: 'hero', component: HeroPortrait },
  /* Y la única que no parte de la foto: la enmarca sobre el papel, como una lámina pegada. */
  'hero.framed': { blockKey: 'hero', component: HeroFramed },

  /*
   * Las dos partidas apuntan a componentes distintos que envuelven al mismo: el lado de la
   * foto es una elección que se guarda en el evento, y una variante solo recibe `content`.
   */
  'story.image-left': { blockKey: 'story', component: StoryImageLeft },
  'story.image-right': { blockKey: 'story', component: StoryImageRight },
  'story.centered': { blockKey: 'story', component: StoryCentered },
  'story.overlay': { blockKey: 'story', component: StoryOverlay },

  /*
   * El calendario y el código de vestimenta traen **un** componente cada uno, y no es una lista a
   * medio hacer: son bloques nuevos, y el segundo diseño de un bloque se escribe cuando se sabe
   * qué es lo que de verdad cambia entre dos —si no, salen dos variaciones de lo mismo, que es
   * como el catálogo engorda sin crecer—.
   */
  'calendar.month': { blockKey: 'calendar', component: CalendarMonth },

  'details.cards': { blockKey: 'details', component: DetailsCards },
  'details.list': { blockKey: 'details', component: DetailsList },
  'details.split': { blockKey: 'details', component: DetailsSplit },
  'details.panel': { blockKey: 'details', component: DetailsPanel },

  'dresscode.palette': { blockKey: 'dresscode', component: DresscodePalette },

  'schedule.vertical': { blockKey: 'schedule', component: ScheduleTimeline },
  'schedule.horizontal': { blockKey: 'schedule', component: ScheduleRail },
  'schedule.agenda': { blockKey: 'schedule', component: ScheduleAgenda },
  'schedule.showcase': { blockKey: 'schedule', component: ScheduleShowcase },
  'schedule.ribbon': { blockKey: 'schedule', component: ScheduleRibbon },
  /* La única que alterna también en el móvil: hitos desfasados medio paso a los dos lados de un
     hilo que no se parte. Pide etiquetas cortas — ver su archivo. */
  'schedule.zigzag': { blockKey: 'schedule', component: ScheduleZigzag },
  /* La única que saca los iconos del hilo y los pone al margen, sin medallón: el itinerario
     impreso. Ver su archivo para por qué eso la hace la más corta en un móvil. */
  'schedule.itinerary': { blockKey: 'schedule', component: ScheduleItinerary },

  'gallery.parallax': { blockKey: 'gallery', component: GalleryParallax },
  'gallery.grid': { blockKey: 'gallery', component: GalleryGrid },
  'gallery.carousel': { blockKey: 'gallery', component: GalleryCarousel },
  'gallery.masonry': { blockKey: 'gallery', component: GalleryMasonry },
  'gallery.mosaic': { blockKey: 'gallery', component: GalleryMosaic },
  'gallery.polaroid': { blockKey: 'gallery', component: GalleryPolaroid },
  /* Las dos con lenguaje de plantilla: una maqueta como una revista, la otra encuadra como una
     película. Ver sus archivos para en qué se diferencian de las seis anteriores. */
  'gallery.editorial': { blockKey: 'gallery', component: GalleryEditorial },
  'gallery.cinematic': { blockKey: 'gallery', component: GalleryCinematic },

  /*
   * Tres pensadas para una sede y tres para dos. La intención está en el nombre, no en una
   * restricción: las seis pintan todas las sedes que traiga el evento.
   */
  'location.single': { blockKey: 'location', component: LocationSingle },
  'location.single-split': { blockKey: 'location', component: LocationSingleSplit },
  'location.single-card': { blockKey: 'location', component: LocationSingleCard },
  'location.single-plate': { blockKey: 'location', component: LocationSinglePlate },
  'location.dual-venue': { blockKey: 'location', component: LocationDualVenue },
  'location.dual-journey': { blockKey: 'location', component: LocationDualJourney },
  'location.dual-stacked': { blockKey: 'location', component: LocationDualStacked },

  /*
   * Tres formas, no dos caminos. A dónde va el botón —WhatsApp o la plataforma— es contenido
   * del evento, no una entrada del registro: ver `domain/invitation/blocks/rsvp.ts`.
   */
  'rsvp.card': { blockKey: 'rsvp', component: RsvpCard },
  'rsvp.panel': { blockKey: 'rsvp', component: RsvpPanel },
  'rsvp.ticket': { blockKey: 'rsvp', component: RsvpTicket },
  'rsvp.reply-card': { blockKey: 'rsvp', component: RsvpReplyCard },
  'rsvp.postcard': { blockKey: 'rsvp', component: RsvpPostcard },
  /* La franja de papel rasgado: la misma insistencia que `panel` sin cambiar el registro de la
     página. Ver su archivo para por qué el tono es un velo y no un color propio. */
  'rsvp.torn': { blockKey: 'rsvp', component: RsvpTorn },

  'closing.split': { blockKey: 'closing', component: ClosingSplit },
  'closing.letter': { blockKey: 'closing', component: ClosingLetter },
  'closing.horizon': { blockKey: 'closing', component: ClosingHorizon },
  'closing.envelope': { blockKey: 'closing', component: ClosingEnvelope },

  'footer.centered': { blockKey: 'footer', component: FooterCentered },
  'footer.ribbon': { blockKey: 'footer', component: FooterRibbon },
  'footer.marquee': { blockKey: 'footer', component: FooterMarquee },
};

/**
 * Resuelve un identificador del registro.
 *
 * Devuelve `null` y no lanza cuando no lo encuentra. Es deliberado: el caso real es una
 * variante que existe en la base de datos y todavía no en el código —o al revés, tras un
 * despliegue a medias—, y en ese momento hay una invitación repartida abriéndose en el móvil
 * de alguien. Perder un bloque es un daño acotado; una excepción sin capturar deja la
 * invitación en blanco entera.
 */
export function resolveComponent(registryId: string): RegisteredComponent | null {
  return REGISTRY[registryId] ?? null;
}

/** El componente de una bienvenida, o `null` si el identificador no es una bienvenida. */
export function resolveWelcomeVariant(registryId: string): WelcomeVariant | null {
  const entry = resolveComponent(registryId);

  return entry?.blockKey === 'welcome' ? entry.component : null;
}

/** El componente de una portada, o `null` si el identificador no es una portada registrada. */
export function resolveHeroVariant(registryId: string): HeroVariant | null {
  const entry = resolveComponent(registryId);

  return entry?.blockKey === 'hero' ? entry.component : null;
}

/** El componente de una historia, o `null` si el identificador no es una historia registrada. */
export function resolveStoryVariant(registryId: string): StoryVariant | null {
  const entry = resolveComponent(registryId);

  return entry?.blockKey === 'story' ? entry.component : null;
}

/** El componente de un calendario, o `null` si el identificador no es un calendario. */
export function resolveCalendarVariant(registryId: string): CalendarVariant | null {
  const entry = resolveComponent(registryId);

  return entry?.blockKey === 'calendar' ? entry.component : null;
}

/** El componente de un código de vestimenta, o `null` si el identificador no lo es. */
export function resolveDresscodeVariant(registryId: string): DresscodeVariant | null {
  const entry = resolveComponent(registryId);

  return entry?.blockKey === 'dresscode' ? entry.component : null;
}

/** El componente de unos detalles, o `null` si el identificador no es unos detalles. */
export function resolveDetailsVariant(registryId: string): DetailsVariant | null {
  const entry = resolveComponent(registryId);

  return entry?.blockKey === 'details' ? entry.component : null;
}

/** El componente de un cronograma, o `null` si el identificador no es un cronograma. */
export function resolveScheduleVariant(registryId: string): ScheduleVariant | null {
  const entry = resolveComponent(registryId);

  return entry?.blockKey === 'schedule' ? entry.component : null;
}

/** El componente de una confirmación, o `null` si el identificador no es una confirmación. */
export function resolveRsvpVariant(registryId: string): RsvpVariant | null {
  const entry = resolveComponent(registryId);

  return entry?.blockKey === 'rsvp' ? entry.component : null;
}

/** El componente de un mensaje final, o `null` si el identificador no es un cierre. */
export function resolveClosingVariant(registryId: string): ClosingVariant | null {
  const entry = resolveComponent(registryId);

  return entry?.blockKey === 'closing' ? entry.component : null;
}

/** El componente de un pie, o `null` si el identificador no es un pie. */
export function resolveFooterVariant(registryId: string): FooterVariant | null {
  const entry = resolveComponent(registryId);

  return entry?.blockKey === 'footer' ? entry.component : null;
}

/** El componente de una ubicación, o `null` si el identificador no es una ubicación. */
export function resolveLocationVariant(registryId: string): LocationVariant | null {
  const entry = resolveComponent(registryId);

  return entry?.blockKey === 'location' ? entry.component : null;
}

/** El componente de una galería, o `null` si el identificador no es una galería. */
export function resolveGalleryVariant(registryId: string): GalleryVariant | null {
  const entry = resolveComponent(registryId);

  return entry?.blockKey === 'gallery' ? entry.component : null;
}

/**
 * Los identificadores que el código sabe pintar hoy.
 *
 * Lo usa el panel para distinguir, en el catálogo, las variantes que ya se pueden previsualizar
 * de las que solo están dadas de alta en la base de datos. Sin esto, el admin tendría que
 * probarlas creando un evento para descubrir cuáles existen de verdad.
 */
export function registeredIds(): readonly string[] {
  return Object.keys(REGISTRY);
}
