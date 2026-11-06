import type { ComponentType } from 'react';
import type { GiftsContent } from '@/domain/invitation/blocks/gifts';

/** Lo único que recibe una variante del bloque de mesa de regalos. */
export interface GiftsVariantProps {
  readonly content: GiftsContent;
}

export type GiftsVariant = ComponentType<GiftsVariantProps>;
