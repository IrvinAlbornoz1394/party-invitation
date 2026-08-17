import type { ComponentType } from 'react';
import type { CalendarContent } from '@/domain/invitation/blocks/calendar';

/**
 * Lo que recibe **todo** componente de calendario. Ni más, ni distinto.
 *
 * Una sola propiedad, igual que en el resto de bloques: en cuanto un componente pudiera pedir
 * algo que otro no —un `compact`, un `showWeekdays`— el evento tendría que saber qué componente
 * lleva puesto para saber qué configurar, y cambiarlo dejaría de ser gratis.
 *
 * Y lo que ninguno recibe es la retícula ya calculada: la piden a
 * `domain/invitation/month-grid.ts` a partir de `startsAt`. Pasarla desde fuera dejaría que dos
 * componentes contaran los días de formas distintas, que es exactamente el fallo que un
 * calendario no se puede permitir.
 */
export interface CalendarVariantProps {
  readonly content: CalendarContent;
}

/** El tipo con el que el registro guarda un calendario, sea cual sea su forma. */
export type CalendarVariant = ComponentType<CalendarVariantProps>;
