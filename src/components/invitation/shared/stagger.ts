/**
 * El retraso de una pieza según su posición, con tope.
 *
 * Sin tope, la foto número veinte de una galería entraría un segundo entero después que la
 * primera y se vería llegar tarde. El tope corta la cascada a medio segundo: a partir de ahí
 * todas entran a la vez y el efecto sigue leyéndose como una cascada.
 */
export function staggerDelay(index: number, step = 0.05, max = 0.5): number {
  return Math.min(index * step, max);
}
