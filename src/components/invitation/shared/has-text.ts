/**
 * Si un texto opcional del contenido tiene algo que enseñar.
 *
 * Los campos opcionales de los bloques llegan como `null` cuando están vacíos —el guardado
 * convierte el vacío en `null`, ver `event-block-texts.ts`—, pero no todos: `hero.tagline`
 * admite la cadena vacía, y un texto de solo espacios no tiene nada que pintar. Con esta
 * comprobación, una sección pinta el contenedor de un dato opcional solo cuando hay dato: sin
 * él no quedan párrafos vacíos, filetes que separan nada ni márgenes huérfanos.
 */
export function hasText(value: string | null | undefined): value is string {
  return typeof value === 'string' && value.trim().length > 0;
}
