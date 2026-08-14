import type { ComponentType } from 'react';
import type { HeroContent } from '@/domain/invitation/blocks/hero';

/**
 * Lo que recibe **toda** variante de portada. Ni más, ni distinto.
 *
 * Una sola propiedad, y es intencional: en cuanto una variante pudiera pedir algo que otra no
 * —un `align`, un `overlayOpacity`— el evento tendría que saber qué variante lleva puesta para
 * saber qué configurar, y cambiarla dejaría de ser gratis. Todo lo que distingue a una variante
 * de otra vive dentro de ella; todo lo que las iguala llega por `content`.
 *
 * El aspecto tampoco viaja aquí: lo pone el tema, a través de las variables `--inv-*` del
 * `ThemeScope` que las envuelve.
 */
export interface HeroVariantProps {
  readonly content: HeroContent;
}

/** El tipo con el que el registro guarda una portada, sea cual sea su variante. */
export type HeroVariant = ComponentType<HeroVariantProps>;
