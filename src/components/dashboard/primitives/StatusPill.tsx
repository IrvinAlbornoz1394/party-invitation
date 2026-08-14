import type { StatusAppearance } from './status-display';

/**
 * La pastilla de un estado.
 *
 * Lleva SIEMPRE su texto, nunca solo el color. No es una preferencia estética: alrededor de
 * un 8% de los hombres no distingue el rojo del verde, y un panel donde «publicado» y
 * «archivado» se diferencian únicamente por el tono es un panel que esas personas no pueden
 * leer. El color acompaña; el que informa es el texto.
 *
 * Las etiquetas y los tonos salen de `status-display.ts`, no de aquí: este componente solo
 * sabe dibujar una pastilla, no qué significa cada estado del negocio.
 */
export function StatusPill({ appearance }: { readonly appearance: StatusAppearance }) {
  return <span className={`dash-pill dash-pill--${appearance.tone}`}>{appearance.label}</span>;
}
