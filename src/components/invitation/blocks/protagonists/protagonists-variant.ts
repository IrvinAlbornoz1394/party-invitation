import type { ComponentType } from 'react';
import type { ProtagonistsContent } from '@/domain/invitation/blocks/protagonists';

/** Lo único que recibe una variante del bloque de protagonistas. */
export interface ProtagonistsVariantProps {
  readonly content: ProtagonistsContent;
}

export type ProtagonistsVariant = ComponentType<ProtagonistsVariantProps>;
