import type { ComponentType } from 'react';
import {
  BookOpen,
  CalendarClock,
  CalendarHeart,
  CircleCheck,
  Component,
  DoorOpen,
  Heart,
  Images,
  Info,
  MapPin,
  MessageSquareQuote,
  PanelBottom,
  PanelTop,
  PartyPopper,
  Shirt,
} from 'lucide-react';

/**
 * El icono de cada bloque de la invitación.
 *
 * Con once pestañas, el texto solo obliga a leerlas todas para encontrar una; el icono deja
 * que la vuelvas a encontrar de un vistazo a partir de la segunda vez. Van **icono y texto**,
 * nunca icono solo: «portada» y «pie de página» son dos rectángulos con una banda —arriba y
 * abajo— y sin la palabra al lado nadie los distingue.
 *
 * Es un mapa de presentación, no del dominio: qué dibujito representa un bloque no cambia nada
 * del sistema, y por eso vive junto a la pantalla que lo usa. Un bloque sin icono asignado cae
 * en el genérico en lugar de dejar el hueco descuadrado — dar de alta un bloque no puede
 * romper la pestaña.
 */

/** Lo que lucide-react exporta: un componente que acepta `size` y `strokeWidth`. */
type IconComponent = ComponentType<{ size?: number; strokeWidth?: number }>;

const ICONS: Readonly<Record<string, IconComponent>> = {
  /* Una puerta, no un rectángulo con banda: es lo que la distingue de la portada a un vistazo,
     que es justo la confusión que este bloque puede provocar en el catálogo. */
  welcome: DoorOpen,
  hero: PanelTop,
  story: BookOpen,
  /* Un calendario con corazón, no el mismo reloj del cronograma: los dos bloques hablan de tiempo
     y son lo más fácil de confundir en la lista de pestañas. */
  calendar: CalendarHeart,
  details: Info,
  dresscode: Shirt,
  party: PartyPopper,
  schedule: CalendarClock,
  gallery: Images,
  messages: MessageSquareQuote,
  location: MapPin,
  rsvp: CircleCheck,
  closing: Heart,
  footer: PanelBottom,
};

export function blockIcon(blockKey: string): IconComponent {
  return ICONS[blockKey] ?? Component;
}
