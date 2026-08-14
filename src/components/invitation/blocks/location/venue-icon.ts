import type { VenueKind } from '@/domain/invitation/blocks/location';
import type { BlockIcon } from '@/domain/invitation/blocks/shared';

/**
 * El icono de una sede, deducido de su tipo.
 *
 * Es lo único que `kind` decide en toda la presentación. Deliberadamente no toca la
 * maquetación: si un componente se compusiera distinto para una iglesia que para un salón, un
 * evento civil se vería diferente por accidente y nadie sabría por qué.
 *
 * Vive aparte de los componentes para que aquel archivo exporte solo componentes — mezclarlos
 * rompe la recarga en caliente de Next, que recarga la página entera en vez de aplicar el
 * cambio en el sitio.
 */
const KIND_ICONS: Readonly<Record<VenueKind, BlockIcon>> = {
  church: 'church',
  reception: 'toast',
  other: 'location',
};

export const venueIcon = (kind: VenueKind): BlockIcon => KIND_ICONS[kind];
