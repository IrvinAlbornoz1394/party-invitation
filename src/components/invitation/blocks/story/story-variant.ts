import type { ComponentType } from 'react';
import type { StoryContent } from '@/domain/invitation/blocks/story';

/**
 * Lo que recibe **toda** variante de historia. Ni más, ni distinto.
 *
 * Es el mismo trato que en la portada, y por el mismo motivo: en cuanto una variante pudiera
 * pedir algo propio, el evento tendría que saber cuál lleva puesta para saber qué configurar, y
 * cambiarla dejaría de ser gratis. Lo que distingue a `story.image-left` de `story.overlay` es
 * dónde coloca cada cosa, no qué cosas tiene.
 */
export interface StoryVariantProps {
  readonly content: StoryContent;
}

/** El tipo con el que el registro guarda una historia, sea cual sea su variante. */
export type StoryVariant = ComponentType<StoryVariantProps>;
