import type { ComponentType } from 'react';
import type { DresscodeContent } from '@/domain/invitation/blocks/dresscode';

/**
 * Lo que recibe **todo** componente de código de vestimenta. Ni más, ni distinto.
 *
 * Igual que en el resto de bloques: una sola propiedad, y todo lo que distingue a un componente
 * de otro vive dentro de él. En este bloque la regla tiene una consecuencia concreta que conviene
 * escribir: ningún componente puede pedir «solo los tres primeros colores porque en mi diseño no
 * caben más». La paleta se pinta entera —el tope de seis está en el contrato, no en el diseño—,
 * porque una muestra que desaparece al cambiar de componente es un invitado vestido del color
 * equivocado.
 */
export interface DresscodeVariantProps {
  readonly content: DresscodeContent;
}

/** El tipo con el que el registro guarda un código de vestimenta, sea cual sea su forma. */
export type DresscodeVariant = ComponentType<DresscodeVariantProps>;
