import type { ComponentType } from 'react';
import {
  Cake,
  CalendarDays,
  Camera,
  Car,
  Church,
  CircleParking,
  Clock,
  Flower2,
  Gift,
  Heart,
  Info,
  MapPin,
  Music,
  PartyPopper,
  Phone,
  Shirt,
  Sparkles,
  Users,
  Utensils,
  Wine,
} from 'lucide-react';
import type { BlockIcon as BlockIconKey } from '@/domain/invitation/blocks/shared';

/**
 * De la clave de icono que guarda el evento al dibujo que se pinta.
 *
 * Es la única frontera entre el contenido y la librería de iconos, y por eso está sola en su
 * archivo: cambiar de librería —o darle a un tema su propio juego, como contempla
 * `docs/PROJECT.md`— es reescribir este mapa y nada más.
 *
 * El `Record` sobre el enum del dominio obliga a que estén todas las claves: añadir una sin
 * darle dibujo no compila, así que no puede llegar a la invitación de nadie un detalle con un
 * hueco donde debería ir su icono.
 */
/*
 * El tipo se declara por estructura y no como `LucideProps`. Es lo que mantiene el resto del
 * código independiente de la librería: quien pinta un icono solo puede contar con tamaño,
 * grosor de trazo, clase y `aria-hidden`, que es lo que cualquier juego de iconos ofrece.
 */
type IconComponent = ComponentType<{
  size?: number;
  strokeWidth?: number;
  className?: string;
  'aria-hidden'?: boolean | 'true' | 'false';
}>;

const ICONS: Readonly<Record<BlockIconKey, IconComponent>> = {
  calendar: CalendarDays,
  clock: Clock,
  location: MapPin,
  church: Church,
  dress: Shirt,
  gift: Gift,
  music: Music,
  camera: Camera,
  cake: Cake,
  phone: Phone,
  parking: CircleParking,
  info: Info,
  toast: Wine,
  food: Utensils,
  party: PartyPopper,
  heart: Heart,
  sparkles: Sparkles,
  car: Car,
  flowers: Flower2,
  guests: Users,
};

export function blockIconComponent(icon: BlockIconKey): IconComponent {
  return ICONS[icon];
}
