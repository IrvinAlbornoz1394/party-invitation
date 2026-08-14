import type { ComponentType } from 'react';
import type { DetailsContent } from '@/domain/invitation/blocks/details';

/**
 * Lo que recibe **toda** variante de detalles. Ni más, ni distinto.
 *
 * Las cuatro pintan la lista entera: ninguna se guarda un detalle porque no le cabe. Es la
 * regla que hace que cambiar de variante sea seguro — si una escondiera el último elemento, el
 * admin descubriría que su código de vestimenta desapareció el día de la boda.
 */
export interface DetailsVariantProps {
  readonly content: DetailsContent;
}

/** El tipo con el que el registro guarda unos detalles, sea cual sea su variante. */
export type DetailsVariant = ComponentType<DetailsVariantProps>;
