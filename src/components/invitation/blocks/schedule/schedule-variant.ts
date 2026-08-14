import type { ComponentType } from 'react';
import type { ScheduleContent } from '@/domain/invitation/blocks/schedule';

/**
 * Lo que recibe **todo** componente de cronograma. Ni más, ni distinto.
 *
 * Los cuatro pintan todos los hitos, con foto o sin ella, y ninguno se guarda el último porque
 * no le cabe. Es la regla que hace que cambiar de componente sea seguro: si uno escondiera un
 * hito, el organizador descubriría que la hora de la piñata desapareció el día de la fiesta.
 */
export interface ScheduleVariantProps {
  readonly content: ScheduleContent;
}

/** El tipo con el que el registro guarda un cronograma, sea cual sea su forma. */
export type ScheduleVariant = ComponentType<ScheduleVariantProps>;
